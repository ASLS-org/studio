import * as THREE from 'three';

/**
 * Texels per beam row: cone matrix (4), its inverse (4), colour, gobo, floor footprint, origin,
 * lens (radius, light output, spill flag)
 *
 * @constant {Number} BEAM_TEXELS
 */
export const BEAM_TEXELS = 13;

/**
 * Rows added when the state outgrows its texture
 *
 * @constant {Number} CAPACITY_STEP
 */
const CAPACITY_STEP = 64;

/**
 * Beams aimed flatter than this (|direction z|) get no floor footprint
 *
 * @constant {Number} MIN_FLOOR_SLOPE
 */
const MIN_FLOOR_SLOPE = 0.08;

/**
 * Largest footprint half size on the floor, in meters
 *
 * @constant {Number} MAX_FOOTPRINT
 */
const MAX_FOOTPRINT = 60;

/**
 * @class BeamState
 * @classdesc Per-beam state read by every lighting pass: one float texture row per beam, rewritten
 * each rendered frame. The world is Z-up and the floor is the plane z = 0. Each row holds the
 * beam's cone matrix (apex at the lens, unit cone of radius 1 at z = 1 scaled to the beam's
 * length and field angle) and its inverse, colour and intensity, gobo, floor footprint and origin.
 */
class BeamState {
  /**
   * @param {Number} [capacity=CAPACITY_STEP] Initial number of rows
   */
  constructor(capacity = CAPACITY_STEP) {
    /**
     * Shared uniform holding the state texture (its value changes when the state grows)
     *
     * @type {Object}
     */
    this.uniform = { value: null };
    this._count = 0;
    this._listeners = [];
    this._matrix = new THREE.Matrix4();
    this._inverse = new THREE.Matrix4();
    this._a = new THREE.Vector3();
    this._b = new THREE.Vector3();
    this._c = new THREE.Vector3();
    this.allocate(capacity);
  }

  /**
   * Number of beams written this frame
   *
   * @type {Number}
   */
  get count() {
    return this._count;
  }

  /**
   * Number of rows the texture holds
   *
   * @type {Number}
   */
  get capacity() {
    return this._capacity;
  }

  /**
   * Calls a function with the new beam count whenever it changes
   *
   * @public
   * @param {Function} listener Called with the beam count
   */
  onCountChange(listener) {
    this._listeners.push(listener);
  }

  /**
   * (Re)creates the texture, keeping the rows already written
   *
   * @private
   * @param {Number} capacity Number of rows
   */
  allocate(capacity) {
    const data = new Float32Array(capacity * BEAM_TEXELS * 4);
    if (this._data) {
      data.set(this._data);
      this.uniform.value.dispose();
    }
    this._data = data;
    this._capacity = capacity;
    const texture = new THREE.DataTexture(data, BEAM_TEXELS, capacity);
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.FloatType;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    this.uniform.value = texture;
  }

  /**
   * Starts writing a frame's beams
   *
   * @public
   */
  begin() {
    this._previousCount = this._count;
    this._count = 0;
  }

  /**
   * Appends one beam. The descriptor is read immediately, so callers can reuse one object.
   *
   * @public
   * @param {Object} beam Beam descriptor
   * @param {THREE.Vector3} beam.origin Lens position (meter)
   * @param {THREE.Vector3} beam.direction Unit beam direction
   * @param {THREE.Vector3} beam.right Unit vector across the beam
   * @param {THREE.Vector3} beam.up Unit vector across the beam, perpendicular to right
   * @param {Number} beam.tanHalf Tangent of the half field angle
   * @param {Number} beam.length Beam length (meter)
   * @param {THREE.Color} beam.color Beam colour (linear)
   * @param {Number} beam.intensity Beam intensity, 0 to 1
   * @param {Number} beam.goboLayer Gobo texture layer (0 is open)
   * @param {Number} beam.goboRotation Gobo rotation (radian)
   * @param {Number} beam.blur Gobo blur, in mip levels
   * @param {Number} [beam.radius=0.05] Lens radius (meter), cells of a cluster together
   * @param {Number} [beam.power=1] Light output (see GeometryFixture)
   * @param {Boolean} [beam.spill=false] Whether the row lights surfaces only (no haze, glow, guide)
   */
  push(beam) {
    const {
      origin, direction, right, up, tanHalf, length, color,
    } = beam;
    if (this._count === this._capacity) {
      this.allocate(this._capacity + CAPACITY_STEP);
    }
    const data = this._data;
    const base = this._count * BEAM_TEXELS * 4;
    const s = tanHalf * length;
    this._matrix.makeBasis(
      this._a.copy(right).multiplyScalar(s),
      this._b.copy(up).multiplyScalar(s),
      this._c.copy(direction).multiplyScalar(length),
    ).setPosition(origin);
    this._inverse.copy(this._matrix).invert();
    data.set(this._matrix.elements, base);
    data.set(this._inverse.elements, base + 16);
    data[base + 32] = color.r;
    data[base + 33] = color.g;
    data[base + 34] = color.b;
    data[base + 35] = beam.intensity;
    data[base + 36] = beam.goboLayer;
    data[base + 37] = beam.goboRotation;
    data[base + 38] = beam.blur;
    data[base + 39] = tanHalf;
    BeamState.writeFootprint(data, base + 40, origin, direction, tanHalf, length);
    data[base + 44] = origin.x;
    data[base + 45] = origin.y;
    data[base + 46] = origin.z;
    data[base + 47] = length;
    data[base + 48] = beam.radius || 0.05;
    data[base + 49] = beam.power === undefined ? 1 : beam.power;
    data[base + 50] = beam.spill ? 1 : 0;
    data[base + 51] = 0;
    this._count++;
  }

  /**
   * Finishes the frame: uploads the rows and reports a count change
   *
   * @public
   */
  end() {
    this.uniform.value.needsUpdate = true;
    if (this._count !== this._previousCount) {
      for (let i = 0; i < this._listeners.length; i++) this._listeners[i](this._count);
    }
  }

  /**
   * Writes the floor footprint of a beam: centre where its axis meets the floor, half size covering
   * the far edge of the ellipse, and whether the beam reaches the floor
   *
   * @private
   * @param {Float32Array} data State data
   * @param {Number} offset First float of the footprint texel
   * @param {THREE.Vector3} origin Lens position
   * @param {THREE.Vector3} direction Unit beam direction
   * @param {Number} tanHalf Tangent of the half field angle
   * @param {Number} length Beam length (meter)
   */
  static writeFootprint(data, offset, origin, direction, tanHalf, length) {
    data[offset] = 0;
    data[offset + 1] = 0;
    data[offset + 2] = 0;
    data[offset + 3] = 0;
    if (direction.z > -MIN_FLOOR_SLOPE || origin.z <= 0) return;
    const distance = origin.z / -direction.z;
    if (distance > length) return;
    const height = origin.z;
    const tau = Math.acos(-direction.z);
    const alpha = Math.atan(tanHalf);
    // Far edge: where the beam's far rim meets the floor, or the end of the beam when that rim
    // runs (nearly) parallel to the floor
    const rimAngle = tau + alpha;
    const reach = length * Math.sin(Math.min(rimAngle, Math.PI / 2));
    const rimHit = rimAngle < Math.PI / 2 - 1e-3 ? height * Math.tan(rimAngle) : reach;
    const far = Math.min(rimHit, reach) - height * Math.tan(tau);
    const near = height * (Math.tan(tau) - Math.tan(tau - alpha));
    const across = (height * tanHalf) / Math.cos(tau);
    data[offset] = origin.x + direction.x * distance;
    data[offset + 1] = origin.y + direction.y * distance;
    data[offset + 2] = Math.min(Math.max(far, near, across) * 1.05, MAX_FOOTPRINT);
    data[offset + 3] = 1;
  }
}

export default BeamState;
