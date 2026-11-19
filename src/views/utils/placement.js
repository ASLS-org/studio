/**
 * Placement maths for the Arrange popup. Pure functions on poses:
 * `{ position: { x, y, z } (metres), rotation: { x, y, z } (degrees) }`, in the order given (the
 * fixture pool's). Z is up; rotation 0 points a fixture's beam up (+Z), rotation X 180° hangs it.
 * Rotations are XYZ Euler angles, as the visualizer applies them.
 *
 * @module views/utils/placement
 */
import {
  Euler, MathUtils, Quaternion, Vector3,
} from 'three';

const UP = new Vector3(0, 0, 1);

/**
 * Rounds to centimetres or tenths of a degree, so fields show tidy values
 *
 * @param {Number} value
 * @param {Number} [digits=2]
 * @returns {Number}
 */
function round(value, digits = 2) {
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Copies poses, so callers never change the ones they pass
 *
 * @param {Array<Object>} poses
 * @returns {Array<Object>}
 */
function copy(poses) {
  return poses.map(({ position, rotation }) => ({
    position: { ...position },
    rotation: { ...rotation },
  }));
}

/**
 * Smallest and largest value of the poses on an axis
 *
 * @public
 * @param {Array<Object>} poses
 * @param {String} axis 'x', 'y' or 'z'
 * @returns {Object} `{ min, max, centre }`
 */
export function extent(poses, axis) {
  const values = poses.map((pose) => pose.position[axis]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, centre: (min + max) / 2 };
}

/**
 * Rotation (degrees) that points the beam from a position towards a target
 *
 * @public
 * @param {Object} position `{ x, y, z }`
 * @param {Object} target `{ x, y, z }`
 * @returns {Object|null} `{ x, y, z }`, or null when the target is the position
 */
export function aimRotation(position, target) {
  const direction = new Vector3(
    target.x - position.x,
    target.y - position.y,
    target.z - position.z,
  );
  if (direction.lengthSq() < 1e-9) return null;
  direction.normalize();
  // Straight down: the same hang as rotation X 180° (the quaternion picks an arbitrary axis)
  if (direction.z < -0.999999) return { x: 180, y: 0, z: 0 };
  const euler = new Euler().setFromQuaternion(
    new Quaternion().setFromUnitVectors(UP, direction),
    'XYZ',
  );
  return {
    x: round(MathUtils.radToDeg(euler.x), 1),
    y: round(MathUtils.radToDeg(euler.y), 1),
    z: round(MathUtils.radToDeg(euler.z), 1),
  };
}

/**
 * Evenly along an axis, around a centre
 *
 * @public
 * @param {Array<Object>} poses
 * @param {Object} settings `{ axis, spacing, centre }`
 * @returns {Array<Object>}
 */
export function line(poses, { axis = 'x', spacing = 1, centre = 0 }) {
  const n = poses.length;
  return copy(poses).map((pose, i) => {
    pose.position[axis] = round(centre + (i - (n - 1) / 2) * spacing);
    return pose;
  });
}

/**
 * In rows of N columns on the floor plane, around a centre
 *
 * @public
 * @param {Array<Object>} poses
 * @param {Object} settings `{ columns, spacingX, spacingY, centreX, centreY }`
 * @returns {Array<Object>}
 */
export function grid(poses, {
  columns = 4, spacingX = 1, spacingY = 1, centreX = 0, centreY = 0,
}) {
  const n = poses.length;
  const cols = Math.max(1, Math.min(Math.round(columns), n));
  const rows = Math.ceil(n / cols);
  return copy(poses).map((pose, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    pose.position.x = round(centreX + (col - (cols - 1) / 2) * spacingX);
    // First row at the back (largest Y), like reading a plan from the top
    pose.position.y = round(centreY + ((rows - 1) / 2 - row) * spacingY);
    return pose;
  });
}

/**
 * Faces each pose towards (in) or away from (out) a point, or leaves it
 *
 * @param {Object} pose
 * @param {Object} centre `{ x, y, z }`
 * @param {String} facing 'in', 'out' or 'keep'
 */
function face(pose, centre, facing) {
  if (facing === 'keep') return;
  const { position } = pose;
  const target = facing === 'in' ? centre : {
    x: 2 * position.x - centre.x,
    y: 2 * position.y - centre.y,
    z: 2 * position.z - centre.z,
  };
  const rotation = aimRotation(position, target);
  if (rotation) pose.rotation = rotation;
}

/**
 * Evenly on an arc of a circle, on the floor (XY) or upright (XZ, facing the audience)
 *
 * @public
 * @param {Array<Object>} poses
 * @param {Object} settings `{ centre: {x,y,z}, radius, plane: 'floor'|'upright',
 * facing: 'in'|'out'|'keep', start, end }` angles in degrees, 0 on +X, counter-clockwise
 * @returns {Array<Object>}
 */
export function arc(poses, {
  centre = { x: 0, y: 0, z: 0 }, radius = 2, plane = 'floor', facing = 'keep', start = 0, end = 360,
}) {
  const n = poses.length;
  const span = end - start;
  // A whole turn doesn't put a fixture on the start and the end: they are the same point
  const closed = Math.abs(Math.abs(span) - 360) < 1e-9;
  const step = n > 1 ? span / (closed ? n : n - 1) : 0;
  return copy(poses).map((pose, i) => {
    const angle = MathUtils.degToRad(start + i * step);
    const u = radius * Math.cos(angle);
    const v = radius * Math.sin(angle);
    pose.position = plane === 'upright'
      ? { x: round(centre.x + u), y: round(centre.y), z: round(centre.z + v) }
      : { x: round(centre.x + u), y: round(centre.y + v), z: round(centre.z) };
    face(pose, centre, facing);
    return pose;
  });
}

/**
 * A whole circle: the arc from 0 to 360°
 *
 * @public
 * @param {Array<Object>} poses
 * @param {Object} settings as arc, without start and end
 * @returns {Array<Object>}
 */
export function circle(poses, settings) {
  return arc(poses, { ...settings, start: 0, end: 360 });
}

/**
 * Every pose at the smallest, centre or largest value of the selection on an axis
 *
 * @public
 * @param {Array<Object>} poses
 * @param {Object} settings `{ axis, to: 'min'|'centre'|'max' }`
 * @returns {Array<Object>}
 */
export function align(poses, { axis = 'x', to = 'centre' }) {
  const value = round(extent(poses, axis)[to]);
  return copy(poses).map((pose) => {
    pose.position[axis] = value;
    return pose;
  });
}

/**
 * Even gaps between the two outermost poses on an axis, keeping their order on it
 *
 * @public
 * @param {Array<Object>} poses
 * @param {Object} settings `{ axis }`
 * @returns {Array<Object>}
 */
export function distribute(poses, { axis = 'x' }) {
  const { min, max } = extent(poses, axis);
  const n = poses.length;
  const result = copy(poses);
  const order = result.map((pose, i) => i)
    .sort((a, b) => result[a].position[axis] - result[b].position[axis] || a - b);
  order.forEach((index, rank) => {
    result[index].position[axis] = round(n > 1 ? min + (rank * (max - min)) / (n - 1) : min);
  });
  return result;
}

/**
 * Rotations spread evenly from −angle to +angle about an axis, added to each pose's own
 *
 * @public
 * @param {Array<Object>} poses
 * @param {Object} settings `{ axis, angle }` degrees
 * @returns {Array<Object>}
 */
export function fan(poses, { axis = 'y', angle = 30 }) {
  const n = poses.length;
  return copy(poses).map((pose, i) => {
    const offset = n > 1 ? -angle + (2 * angle * i) / (n - 1) : 0;
    pose.rotation[axis] = round((pose.rotation[axis] || 0) + offset, 1);
    return pose;
  });
}

/**
 * Each pose rotated to point its beam at a point
 *
 * @public
 * @param {Array<Object>} poses
 * @param {Object} settings `{ target: {x,y,z} }`
 * @returns {Array<Object>}
 */
export function aim(poses, { target = { x: 0, y: 0, z: 0 } }) {
  return copy(poses).map((pose) => {
    const rotation = aimRotation(pose.position, target);
    if (rotation) pose.rotation = rotation;
    return pose;
  });
}

/**
 * Arrange modes, by name
 *
 * @constant {Object}
 */
export const ARRANGE = {
  line, grid, circle, arc, align, distribute, fan, aim,
};

/**
 * How a fixture can be mounted: the rotation of its base, and where its beam then points
 *
 * @constant {Array<Object>} `{ id, name, icon, euler }` (euler in degrees, XYZ)
 */
export const MOUNTS = [
  {
    id: 'floor', name: 'Floor', icon: 'mount_floor', euler: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'hung', name: 'Hung', icon: 'mount_hung', euler: { x: 180, y: 0, z: 0 },
  },
  {
    id: 'left', name: 'Left wall', icon: 'mount_left', euler: { x: 0, y: 90, z: 0 },
  },
  {
    id: 'right', name: 'Right wall', icon: 'mount_right', euler: { x: 0, y: -90, z: 0 },
  },
  {
    id: 'back', name: 'Back wall', icon: 'mount_back', euler: { x: 90, y: 0, z: 0 },
  },
  {
    id: 'front', name: 'Front', icon: 'mount_front', euler: { x: -90, y: 0, z: 0 },
  },
];

/**
 * Quaternion of an XYZ Euler rotation in degrees
 *
 * @param {Object} rotation `{ x, y, z }`
 * @returns {Quaternion}
 */
function quaternionOf(rotation) {
  return new Quaternion().setFromEuler(new Euler(
    MathUtils.degToRad(rotation.x),
    MathUtils.degToRad(rotation.y),
    MathUtils.degToRad(rotation.z),
    'XYZ',
  ));
}

/**
 * Rotation of a fixture mounted one way, turned on its base and tilted
 *
 * @public
 * @param {String} mount a `MOUNTS` id
 * @param {Number} turn degrees around the base
 * @param {Number} tilt degrees the beam leans
 * @returns {Object} `{ x, y, z }` in degrees
 */
export function mountRotation(mount, turn, tilt) {
  const base = MOUNTS.find((m) => m.id === mount) || MOUNTS[0];
  const q = quaternionOf(base.euler)
    .multiply(quaternionOf({ x: 0, y: 0, z: turn }))
    .multiply(quaternionOf({ x: tilt, y: 0, z: 0 }));
  const euler = new Euler().setFromQuaternion(q, 'XYZ');
  return {
    x: round(MathUtils.radToDeg(euler.x), 1),
    y: round(MathUtils.radToDeg(euler.y), 1),
    z: round(MathUtils.radToDeg(euler.z), 1),
  };
}

/**
 * Reads a rotation as a mount, a turn and a tilt: the mount needing the least tilt
 *
 * @public
 * @param {Object} rotation `{ x, y, z }` in degrees
 * @returns {Object} `{ mount, turn, tilt, exact }`; `exact` is false when no mount, turn and
 * tilt give this rotation (the nearest is returned)
 */
export function mountOf(rotation) {
  const q = quaternionOf(rotation);
  let best = null;
  MOUNTS.forEach((m) => {
    const local = quaternionOf(m.euler).invert().multiply(q);
    const euler = new Euler().setFromQuaternion(local, 'ZXY');
    const candidate = {
      mount: m.id,
      turn: round(MathUtils.radToDeg(euler.z), 1),
      tilt: round(MathUtils.radToDeg(euler.x), 1),
      rest: Math.abs(euler.y),
    };
    const score = candidate.rest * 1000 + Math.abs(candidate.tilt);
    if (!best || score < best.score - 1e-6) best = { ...candidate, score };
  });
  return {
    mount: best.mount,
    turn: best.turn,
    tilt: best.tilt,
    exact: best.rest < 0.01,
  };
}

/**
 * Where a rotation points the beam, seen from above
 *
 * @public
 * @param {Object} rotation `{ x, y, z }` in degrees
 * @returns {Object} `{ x, y }`, the beam direction projected on the floor (length 0 to 1)
 */
export function beamOnFloor(rotation) {
  const beam = UP.clone().applyQuaternion(quaternionOf(rotation));
  return { x: beam.x, y: beam.y };
}
