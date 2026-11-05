/**
 * Fixture body shapes from facts: gives every node of a geometry tree a body role (base, yoke,
 * head, can, bar, panel, box or lens) and the shape it is drawn with (its GDTF primitive, else
 * its role's), and builds a tree for fixtures that don't have one (OFL), from their category,
 * dimensions, pan/tilt channels, lens and pixel layout.
 *
 * Trees follow the GDTF convention: meters, Z up, the fixture hanging with its beams along -Z.
 * Pure data, no Three.js, so it can run anywhere.
 */

const DEFAULT_SIZE = 0.3; // meters, when a fixture gives no dimensions
// Proportions of the bundled moving head model, upright (meters): its overall size, its parts,
// the heights of the yoke's centre and of the head's pivot, the lens distance and radius
const MOVING_HEAD = {
  size: [0.428, 0.306, 0.743],
  base: [0.38, 0.306, 0.115],
  yoke: [0.428, 0.11, 0.388],
  head: [0.298, 0.236, 0.518],
  yokeCenter: 0.309,
  pivot: 0.49,
  lens: 0.258,
  lensRadius: 0.09,
};
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
        // The fixture's lumens are shared by its pixels
        flux: ((physical.bulb && physical.bulb.lumens) || 10000) / pixels.length,
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
    // The bundled model's layout, stretched to the fixture's dimensions (its own size without
    // them), the head's pivot at the fixture's origin
    const m = MOVING_HEAD;
    const k = [0, 1, 2].map((i) => {
      const facts = [dims[0], dims[2], dims[1]][i];
      return facts ? facts / 1000 / m.size[i] : 1;
    });
    const scaled = (size) => size.map((v, i) => v * k[i]);
    const head = scaled(m.head);
    const lensZ = -m.lens * k[2];
    const beams = matrix
      ? pixelBeams(matrix, physical, [head[0] * 0.8, head[1] * 0.8], lensZ, 'Wash')
      : [node('Beam', 'beam', [0, 0, lensZ], [head[0] * 0.6, head[0] * 0.6, 0.01], {
        beam: oflBeam(physical, 'Spot', m.lensRadius * Math.min(k[0], k[1])),
      })];
    const baseZ = (m.pivot - m.base[2] / 2) * k[2];
    return node('Base', 'body', [0, 0, baseZ], scaled(m.base), {
      shape: 'Base',
      children: [node('Yoke', 'axis', [0, 0, (m.base[2] / 2 - m.yokeCenter) * k[2]], scaled(m.yoke), {
        shape: 'Yoke',
        children: [node('Head', 'axis', [0, 0, (m.yokeCenter - m.pivot) * k[2]], head, {
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
 * @param {Boolean} isRoot Whether the node is the fixture's root
 * @returns {String} Body role (SHAPE_ROLES)
 */
function roleOf(geometryNode, containsAxis, isRoot) {
  const { kind, shape } = geometryNode;
  const [length, width, height] = geometryNode.size;
  if (kind === 'beam') return SHAPE_ROLES.LENS;
  if (!(length > 0 && width > 0 && height > 0)) return SHAPE_ROLES.NONE;
  const hint = shape || '';
  if (/^Pigtail/.test(hint)) return SHAPE_ROLES.NONE; // cable stub
  if (/^Base/.test(hint)) return SHAPE_ROLES.BASE;
  if (/^Yoke/.test(hint)) return SHAPE_ROLES.YOKE;
  if (/^Head/.test(hint) || /^Scanner/.test(hint)) return SHAPE_ROLES.HEAD;
  if (kind === 'axis') return containsAxis ? SHAPE_ROLES.YOKE : SHAPE_ROLES.HEAD;
  // A body holding an axis is the base at the root, a yoke below it (some files don't make the
  // yoke an axis)
  if (containsAxis) return isRoot ? SHAPE_ROLES.BASE : SHAPE_ROLES.YOKE;
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
 * Body shape of each GDTF primitive type (fixture_meshes.js); Cube and Undefined (or no
 * primitive) take the shape of the node's role
 *
 * @constant {Object} PRIMITIVE_SHAPES
 */
const PRIMITIVE_SHAPES = {
  Cylinder: 'cylinder',
  Sphere: 'sphere',
  Base: 'base',
  Base1_1: 'base',
  Yoke: 'yoke',
  Head: 'head',
  Scanner: 'scanner',
  Scanner1_1: 'scanner',
  Conventional: 'conventional',
  Conventional1_1: 'conventional',
};

/**
 * Body shape of each role, for nodes without a specific primitive
 *
 * @constant {Object} ROLE_SHAPES
 */
const ROLE_SHAPES = {
  [SHAPE_ROLES.BASE]: 'base',
  [SHAPE_ROLES.YOKE]: 'yoke',
  [SHAPE_ROLES.HEAD]: 'head',
  [SHAPE_ROLES.CAN]: 'cylinder',
  [SHAPE_ROLES.BAR]: 'box',
  [SHAPE_ROLES.PANEL]: 'box',
  [SHAPE_ROLES.BOX]: 'box',
};

/**
 * The body shape a node is drawn with: its GDTF primitive's, else its role's
 *
 * @public
 * @param {Object} geometryNode Geometry node
 * @param {String} role Body role (SHAPE_ROLES)
 * @returns {?String} Body shape (see fixture_meshes.js), or null when the node has no body
 */
export function shapeOf(geometryNode, role) {
  if (role === SHAPE_ROLES.NONE || role === SHAPE_ROLES.LENS) return null;
  return PRIMITIVE_SHAPES[geometryNode.shape] || ROLE_SHAPES[role] || null;
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
  const visit = (n, isRoot) => {
    let containsAxis = false;
    n.children.forEach((c) => {
      if (visit(c, false) || c.kind === 'axis') containsAxis = true;
    });
    roles.set(n, roleOf(n, containsAxis, isRoot));
    return containsAxis;
  };
  visit(geometry, true);
  // An axis whose child body holds the beams turns a head made of a plain geometry: the axis is
  // the yoke, the child the head
  const holdsBeam = (n) => n.kind === 'beam' || n.children.some(holdsBeam);
  const relabel = (n) => {
    if (n.kind === 'axis' && roles.get(n) === SHAPE_ROLES.HEAD) {
      const head = n.children.find((c) => c.kind === 'body' && holdsBeam(c)
        && roles.get(c) !== SHAPE_ROLES.NONE);
      if (head) {
        roles.set(n, SHAPE_ROLES.YOKE);
        roles.set(head, SHAPE_ROLES.HEAD);
      }
    }
    n.children.forEach(relabel);
  };
  relabel(geometry);
  return roles;
}

/**
 * Mesh detail levels and their folders in a GDTF file, glTF before 3DS
 *
 * @constant {Object} DETAIL_FOLDERS
 */
const DETAIL_FOLDERS = {
  low: ['gltf_low', '3ds_low'],
  standard: ['gltf', '3ds'],
  high: ['gltf_high', '3ds_high'],
};

/**
 * Per quality level: the mesh details tried, in order, and the triangle budget of one fixture
 *
 * @constant {Object} LEVEL_DETAILS
 */
const LEVEL_DETAILS = {
  guides: { order: ['low', 'standard', 'high'], budget: 5000 },
  low: { order: ['low', 'standard', 'high'], budget: 5000 },
  medium: { order: ['standard', 'low', 'high'], budget: 30000 },
  high: { order: ['high', 'standard', 'low'], budget: 150000 },
};

/**
 * Folder of the mesh a node draws at a detail: glTF, else 3DS
 *
 * @public
 * @param {Object} geometryNode Geometry node (with `meshes`, see gdtf.meshes.js modelMeshes)
 * @param {?String} detail Mesh detail (`low`, `standard`, `high`), null for none
 * @returns {?String} Detail folder, or null when the node has no mesh at that detail
 */
export function meshFolder(geometryNode, detail) {
  if (!detail || !geometryNode.meshes) return null;
  return DETAIL_FOLDERS[detail].find((folder) => geometryNode.meshes[folder]) || null;
}

/**
 * Mesh detail a fixture is drawn with at a quality level: the first detail of the level's order
 * that some body has a mesh at and whose meshes fit the level's triangle budget. Only nodes with a
 * body draw a mesh (a mesh replaces a generated part); one detail for the whole fixture.
 *
 * @public
 * @param {Object} geometry Geometry tree
 * @param {String} level Quality level (`guides`, `low`, `medium`, `high`)
 * @param {Map<Object, String>} [roles] Body role by node (see assignRoles)
 * @returns {?String} Mesh detail (`low`, `standard`, `high`), or null for the generated parts
 */
export function modelDetail(geometry, level, roles = assignRoles(geometry)) {
  const { order, budget } = LEVEL_DETAILS[level] || LEVEL_DETAILS.medium;
  const bodies = [];
  const visit = (n) => {
    if (n.meshes && shapeOf(n, roles.get(n))) bodies.push(n);
    n.children.forEach(visit);
  };
  visit(geometry);
  if (!bodies.length) return null;
  return order.find((detail) => {
    let triangles = 0;
    let drawn = 0;
    bodies.forEach((n) => {
      const folder = meshFolder(n, detail);
      if (!folder) return;
      triangles += n.meshes[folder].triangles;
      drawn += 1;
    });
    return drawn > 0 && triangles <= budget;
  }) || null;
}
