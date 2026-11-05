import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import ModelInstancer from './model_instancer';

/**
 * Unit meshes of fixture body shapes, one per GDTF primitive family: each fills the unit box
 * centred on the origin, in GDTF axes (Z up, beam along -Z), and is scaled to a model's length,
 * width and height. Base, yoke and head come from the bundled moving head model; the others are
 * built here. Every mesh is built once, on first use.
 */

/**
 * Body shapes
 *
 * @constant {Object} BODY_SHAPES
 * @enum {String}
 */
export const BODY_SHAPES = {
  BOX: 'box',
  CYLINDER: 'cylinder',
  SPHERE: 'sphere',
  CONVENTIONAL: 'conventional',
  SCANNER: 'scanner',
  BASE: 'base',
  YOKE: 'yoke',
  HEAD: 'head',
};

// The bundled model is upright, Y up, its beam along +Y; GDTF hangs, Z up, beam along -Z:
// (x, y, z) -> (x, z, -y)
const GLTF_TO_GDTF = new THREE.Matrix4().makeBasis(
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(0, 1, 0),
);

// Parts of the bundled moving head model, by name prefix
const MODEL_PARTS = {
  [BODY_SHAPES.BASE]: /^base/i,
  [BODY_SHAPES.YOKE]: /^yoke/i,
  [BODY_SHAPES.HEAD]: /^head/i,
};

const ARM = 0.18; // yoke arm thickness and conventional bracket, share of the box

const cache = new Map();

/**
 * Scales and centres a geometry into the unit box
 *
 * @public
 * @param {THREE.BufferGeometry} geometry Geometry
 * @returns {THREE.BufferGeometry} The same geometry
 */
export function toUnitBox(geometry) {
  geometry.computeBoundingBox();
  const center = geometry.boundingBox.getCenter(new THREE.Vector3());
  const size = geometry.boundingBox.getSize(new THREE.Vector3());
  geometry.translate(-center.x, -center.y, -center.z);
  const inverse = (v) => 1 / Math.max(v, 1e-6);
  geometry.scale(inverse(size.x), inverse(size.y), inverse(size.z));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * A box piece of a composite shape
 *
 * @param {Array<Number>} size Size
 * @param {Array<Number>} position Centre
 * @param {Number} [tilt=0] Rotation about X, radians
 * @returns {THREE.BufferGeometry} Box
 */
function box(size, position, tilt = 0) {
  const geometry = new THREE.BoxGeometry(...size);
  if (tilt) geometry.rotateX(tilt);
  return geometry.translate(...position);
}

/**
 * A lathed can along Z, its front (lens) at -Z
 *
 * @param {Array<Array<Number>>} profile Radius and height pairs, rear to front
 * @returns {THREE.BufferGeometry} Can
 */
function can(profile) {
  const points = profile.map(([r, h]) => new THREE.Vector2(r, h));
  // Lathes turn around Y: stand them along Z, rear up
  return new THREE.LatheGeometry(points, 24).rotateX(Math.PI / 2);
}

/**
 * The part of the bundled moving head model for a shape, in GDTF axes
 *
 * @param {String} shape Body shape
 * @returns {?THREE.BufferGeometry} Part, or null when the model isn't loaded
 */
function modelPart(shape) {
  const { models } = ModelInstancer;
  const gltf = models && models.visualizer && models.visualizer.models.scenography
    && models.visualizer.models.scenography.beam;
  if (!gltf || !gltf.scene) return null;
  let found = null;
  gltf.scene.traverse((object) => {
    if (!found && object.isMesh && MODEL_PARTS[shape].test(object.name)) found = object;
  });
  if (!found) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', found.geometry.attributes.position.clone());
  if (found.geometry.attributes.normal) {
    geometry.setAttribute('normal', found.geometry.attributes.normal.clone());
  }
  if (found.geometry.index) geometry.setIndex(found.geometry.index.clone());
  return geometry.applyMatrix4(GLTF_TO_GDTF);
}

/**
 * Builds a shape's geometry (not centred yet)
 *
 * @param {String} shape Body shape
 * @returns {THREE.BufferGeometry} Geometry
 */
function build(shape) {
  switch (shape) {
    case BODY_SHAPES.CYLINDER:
      return new THREE.CylinderGeometry(0.5, 0.5, 1, 24).rotateX(Math.PI / 2);
    case BODY_SHAPES.SPHERE:
      return new THREE.SphereGeometry(0.5, 20, 14);
    case BODY_SHAPES.CONVENTIONAL:
      // Rounded rear, body, a wider front bezel
      return can([[0, 0.5], [0.3, 0.5], [0.4, 0.42], [0.42, -0.36], [0.5, -0.4], [0.5, -0.5],
        [0.44, -0.5], [0.44, -0.47], [0, -0.47]]);
    case BODY_SHAPES.SCANNER:
      // Body above a mirror tilted 45°
      return mergeGeometries([
        box([1, 1, 0.7], [0, 0, 0.15]),
        box([0.9, 0.05, 0.42], [0, 0, -0.32], Math.PI / 4),
      ]);
    case BODY_SHAPES.BASE:
      return modelPart(shape) || box([1, 1, 1], [0, 0, 0]);
    case BODY_SHAPES.YOKE:
      // Crossbar on top, arms down
      return modelPart(shape) || mergeGeometries([
        box([1, 1, ARM], [0, 0, 0.5 - ARM / 2]),
        box([ARM, 1, 1], [-0.5 + ARM / 2, 0, 0]),
        box([ARM, 1, 1], [0.5 - ARM / 2, 0, 0]),
      ]);
    case BODY_SHAPES.HEAD:
      return modelPart(shape) || can([[0, 0.5], [0.4, 0.5], [0.5, 0.3], [0.5, -0.5], [0, -0.5]]);
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

/**
 * Unit mesh of a body shape, built on first use
 *
 * @public
 * @param {String} shape Body shape (BODY_SHAPES)
 * @returns {THREE.BufferGeometry} Geometry filling the unit box centred on the origin
 */
export default function unitShape(shape) {
  if (!cache.has(shape)) cache.set(shape, toUnitBox(build(shape)));
  return cache.get(shape);
}
