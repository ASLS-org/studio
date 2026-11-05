import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toUnitBox } from './fixture_meshes';
import { dracoLoader } from './model_instancer';

/**
 * Meshes of GDTF fixtures, from the operator's imported files: each mesh file is parsed once per
 * fixture type and detail folder into one geometry in GDTF axes (Z up), filling the unit box like
 * the generated shapes, with where it sat around its origin. Only positions and normals are kept:
 * every body is drawn with the same material.
 */

// glTF is Y up, GDTF Z up: (x, y, z) -> (x, -z, y)
const Y_UP_TO_Z_UP = new THREE.Matrix4().makeBasis(
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, -1, 0),
);

/**
 * @class MeshTDSLoader
 * @classdesc 3DS loader that skips texture maps: they are not drawn, and loading them would
 * request files the archive doesn't serve
 */
class MeshTDSLoader extends TDSLoader {
  /**
   * Skips a texture map
   *
   * @returns {null} No texture
   */
  // eslint-disable-next-line class-methods-use-this
  readMap() {
    return null;
  }
}

const gltfLoader = new GLTFLoader().setDRACOLoader(dracoLoader);
const tdsLoader = new MeshTDSLoader();
const cache = new Map();

/**
 * A plain float copy of an attribute (de-interleaved, de-quantized)
 *
 * @param {THREE.BufferAttribute|THREE.InterleavedBufferAttribute} attribute Attribute
 * @returns {THREE.BufferAttribute} Copy
 */
function plain(attribute) {
  const { count, itemSize } = attribute;
  const array = new Float32Array(count * itemSize);
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < itemSize; k++) array[i * itemSize + k] = attribute.getComponent(i, k);
  }
  return new THREE.BufferAttribute(array, itemSize);
}

/**
 * Merges every mesh of a parsed scene into one geometry in world space
 *
 * @param {THREE.Object3D} root Parsed scene
 * @returns {?THREE.BufferGeometry} Geometry, or null when the scene has no triangles
 */
function bake(root) {
  root.updateMatrixWorld(true);
  const parts = [];
  root.traverse((object) => {
    const source = object.isMesh ? object.geometry : null;
    if (!source || !source.attributes.position || !source.attributes.position.count) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', plain(source.attributes.position));
    if (source.attributes.normal) geometry.setAttribute('normal', plain(source.attributes.normal));
    const index = source.index ? Array.from(source.index.array)
      : Array.from({ length: source.attributes.position.count }, (v, i) => i);
    geometry.setIndex(index);
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    parts.push(geometry.applyMatrix4(object.matrixWorld));
  });
  if (!parts.length) return null;
  const merged = parts.length > 1 ? mergeGeometries(parts) : parts[0];
  parts.forEach((part) => { if (part !== merged) part.dispose(); });
  return merged;
}

/**
 * Parses a mesh file
 *
 * @param {String} folder Detail folder (`gltf`, `3ds_high`, ...)
 * @param {Uint8Array} bytes Mesh file
 * @returns {Promise<?THREE.BufferGeometry>} Geometry in GDTF axes
 */
async function parse(folder, bytes) {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  if (folder.startsWith('3ds')) return bake(tdsLoader.parse(buffer, ''));
  const gltf = await gltfLoader.parseAsync(buffer, '');
  const geometry = bake(gltf.scene);
  return geometry && geometry.applyMatrix4(Y_UP_TO_Z_UP);
}

/**
 * A fixture mesh, parsed on first use
 *
 * @public
 * @param {String} key Fixture type, model file and detail folder, e.g. `ID|Head|gltf`
 * @param {String} folder Detail folder
 * @param {Uint8Array} bytes Mesh file
 * @returns {Promise<?{geometry: THREE.BufferGeometry, center: Array<Number>}>} The mesh in the
 * unit box and its normalised centre around its origin, or null when it can't be read
 */
export default function modelGeometry(key, folder, bytes) {
  if (!cache.has(key)) {
    cache.set(key, parse(folder, bytes).then((geometry) => {
      if (!geometry) return null;
      geometry.computeBoundingBox();
      const { min, max } = geometry.boundingBox;
      const center = [0, 1, 2].map((k) => {
        const size = max.getComponent(k) - min.getComponent(k);
        return size > 0 ? (max.getComponent(k) + min.getComponent(k)) / 2 / size : 0;
      });
      return { geometry: toUnitBox(geometry), center };
    }).catch((error) => {
      // A damaged mesh keeps the generated part; the operator can't fix it in the show
      // eslint-disable-next-line no-console
      console.warn(`Fixture mesh ${key} could not be read: ${error.message}`);
      return null;
    }));
  }
  return cache.get(key);
}
