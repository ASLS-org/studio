/**
 * Fixture body shapes from facts: gives every node of a geometry tree a body role (base, yoke,
 * head, can, bar, panel, box or lens) and builds a tree for fixtures that don't have one (OFL),
 * from their category, dimensions, pan/tilt channels, lens and pixel layout.
 *
 * Trees follow the GDTF convention: meters, Z up, the fixture hanging with its beams along -Z.
 * Pure data, no Three.js, so it can run anywhere.
 */

const DEFAULT_SIZE = 0.3; // meters, when a fixture gives no dimensions
const DEFAULT_FIELD_ANGLE = 25; // degrees
const BAR_ASPECT = 2.5; // length / width above which a body is a bar
const PIXEL_FIELD_ANGLE = 40; // degrees, OFL pixels have no lens data of their own

/**
 * Body roles
 *
 * @constant {Object} SHAPE_ROLES
 * @enum {String}
 */
export const SHAPE_ROLES = {
  BASE: 'base',
  YOKE: 'yoke',
  HEAD: 'head',
  CAN: 'can',
  BAR: 'bar',
  PANEL: 'panel',
  BOX: 'box',
  LENS: 'lens',
  NONE: 'none',
};

const translate = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];

/**
 * Builds a geometry node
 *
 * @param {String} name Node name
 * @param {String} kind `body`, `axis` or `beam`
 * @param {Array<Number>} position Position in the parent, meters
 * @param {Array<Number>} size Length, width, height in meters
 * @param {Object} [extra] Shape hint, beam data, children
 * @returns {Object} Geometry node
 */
function node(name, kind, position, size, extra = {}) {
  return {
    name,
    kind,
    matrix: translate(...position),
    size,
    shape: extra.shape || null,
    beam: extra.beam || null,
    children: extra.children || [],
  };
}

/**
 * Beam data of an OFL fixture
 *
 * @param {Object} physical OFL physical data
 * @param {String} type GDTF beam type
 * @param {Number} radius Lens radius, meters
 * @returns {Object} Beam data
 */
function oflBeam(physical, type, radius) {
  const lens = physical.lens && physical.lens.degreesMinMax;
  const field = lens ? Math.max(lens[0], lens[1]) : DEFAULT_FIELD_ANGLE;
  return {
    beamAngle: field * 0.7,
    fieldAngle: field,
    radius,
    type,
    flux: (physical.bulb && physical.bulb.lumens) || 10000,
    colorTemperature: (physical.bulb && physical.bulb.colorTemperature) || 6500,
  };
}

/**
 * Pixel beams laid out on a body face (the face at -Z)
 *
 * @param {Object} matrix Profile matrix (`pixels` with grid positions)
 * @param {Object} physical OFL physical data
 * @param {Array<Number>} face Face length (x) and width (y), meters
 * @param {Number} z Face height in the body, meters
 * @param {String} type Beam type of the pixels
 * @returns {Array<Object>} Beam nodes, named by pixel key
 */
function pixelBeams(matrix, physical, face, z, type) {
  const { pixels } = matrix;
  const nx = Math.max(...pixels.map((p) => p.x)) + 1;
  const ny = Math.max(...pixels.map((p) => p.y)) + 1;
  const spacing = physical.matrixPixels && physical.matrixPixels.spacing;
  const sx = spacing && spacing[0] ? spacing[0] / 1000 : face[0] / nx;
  const sy = spacing && spacing[1] ? spacing[1] / 1000 : face[1] / ny;
  const radius = Math.max(Math.min(sx, sy) * 0.4, 0.005);
  const lens = physical.lens && physical.lens.degreesMinMax;
  return pixels.map((p) => node(
    p.key,
    'beam',
    [(p.x - (nx - 1) / 2) * sx, ((ny - 1) / 2 - p.y) * sy, z],
    [radius * 2, radius * 2, 0.005],
    {
      beam: {
        ...oflBeam(physical, type, radius),
        fieldAngle: lens ? Math.max(lens[0], lens[1]) : PIXEL_FIELD_ANGLE,
      },
    },
  ));
}

/**
 * Builds a geometry tree for a fixture without one (OFL), from its facts
 *
 * @public
 * @param {Object} profile Fixture profile
 * @param {Array<Object>} channels Channels of the patched mode
 * @returns {Object} Geometry tree (GDTF convention)
 */
export function synthesizeGeometry(profile, channels) {
  const physical = profile.physical || {};
  const dims = physical.dimensions || [];
  const width = (dims[0] || DEFAULT_SIZE * 1000) / 1000;
  const height = (dims[1] || DEFAULT_SIZE * 1000) / 1000;
  const depth = (dims[2] || DEFAULT_SIZE * 1000) / 1000;
  const category = profile.category || '';
  const hasPanTilt = channels.some((c) => c.type === 'Pan' || c.type === 'Tilt');
  const matrix = profile.matrix && profile.matrix.pixels.length ? profile.matrix : null;

  if (category === 'Moving Head' || category === 'Scanner' || hasPanTilt) {
    const baseH = height * 0.2;
    const yokeH = height * 0.55;
    const headSize = [width * 0.6, depth * 0.75, height * 0.5];
    const lensZ = -headSize[2] / 2;
    const beams = matrix
      ? pixelBeams(matrix, physical, [headSize[0] * 0.8, headSize[1] * 0.8], lensZ, 'Wash')
      : [node('Beam', 'beam', [0, 0, lensZ], [headSize[0] * 0.7, headSize[0] * 0.7, 0.01], {
        beam: oflBeam(physical, 'Spot', headSize[0] * 0.35),
      })];
    return node('Base', 'body', [0, 0, 0], [width * 0.8, depth * 0.8, baseH], {
      shape: 'Base',
      children: [node('Yoke', 'axis', [0, 0, -baseH / 2], [width, depth * 0.35, yokeH], {
        shape: 'Yoke',
        children: [node('Head', 'axis', [0, 0, -yokeH * 0.6], headSize, {
          shape: 'Head',
          children: beams,
        })],
      })],
    });
  }

  const longSide = Math.max(width, depth);
  const shortSide = Math.min(width, depth);
  const isBar = longSide / Math.max(shortSide, 0.001) > BAR_ASPECT;
  const isPanel = Boolean(matrix) && !isBar && shortSide > height;
  let shape = 'Conventional';
  if (isBar || category === 'Pixel Bar') shape = 'Bar';
  else if (isPanel || category === 'Matrix') shape = 'Panel';
  const pixelType = category === 'Matrix' ? 'Glow' : 'Wash';
  const beams = matrix
    ? pixelBeams(matrix, physical, [width, depth], -height / 2, pixelType)
    : [node('Beam', 'beam', [0, 0, -height / 2], [shortSide * 0.8, shortSide * 0.8, 0.01], {
      beam: oflBeam(physical, 'Wash', shortSide * 0.4),
    })];
  return node('Body', 'body', [0, 0, 0], [width, depth, height], { shape, children: beams });
}

/**
 * Picks a node's body role from its kind, its place in the tree, its shape hint and its aspect
 *
 * @param {Object} geometryNode Geometry node
 * @param {Boolean} containsAxis Whether an axis sits below the node
 * @returns {String} Body role (SHAPE_ROLES)
 */
function roleOf(geometryNode, containsAxis) {
  const { kind, shape } = geometryNode;
  const [length, width, height] = geometryNode.size;
  if (kind === 'beam') return SHAPE_ROLES.LENS;
  if (!(length > 0 && width > 0 && height > 0)) return SHAPE_ROLES.NONE;
  const hint = shape || '';
  if (/^Base/.test(hint)) return SHAPE_ROLES.BASE;
  if (/^Yoke/.test(hint)) return SHAPE_ROLES.YOKE;
  if (/^Head/.test(hint) || /^Scanner/.test(hint)) return SHAPE_ROLES.HEAD;
  if (kind === 'axis') return containsAxis ? SHAPE_ROLES.YOKE : SHAPE_ROLES.HEAD;
  if (containsAxis) return SHAPE_ROLES.BASE;
  if (/^Bar/.test(hint)) return SHAPE_ROLES.BAR;
  if (/^Panel/.test(hint)) return SHAPE_ROLES.PANEL;
  if (/^(Cylinder|Conventional)/.test(hint)) return SHAPE_ROLES.CAN;
  const long = Math.max(length, width);
  const short = Math.min(length, width);
  if (long / short > BAR_ASPECT) return SHAPE_ROLES.BAR;
  if (height < short * 0.4) return SHAPE_ROLES.PANEL;
  return SHAPE_ROLES.BOX;
}

/**
 * Gives every node of a tree its body role
 *
 * @public
 * @param {Object} geometry Geometry tree
 * @returns {Map<Object, String>} Body role by node
 */
export function assignRoles(geometry) {
  const roles = new Map();
  const visit = (n) => {
    let containsAxis = false;
    n.children.forEach((c) => {
      if (visit(c) || c.kind === 'axis') containsAxis = true;
    });
    roles.set(n, roleOf(n, containsAxis));
    return containsAxis;
  };
  visit(geometry);
  return roles;
}
