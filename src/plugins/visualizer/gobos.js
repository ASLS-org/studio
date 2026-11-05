import * as THREE from 'three';
import { GOBO_SIZE, GOBO_LAYERS, rasterizeGobo } from './gobo_patterns';

export { GOBO_LAYERS };

/**
 * Picks the gobo layer of a wheel slot: open slots give the open layer, gobo slots cycle through
 * the built-in patterns by slot number
 *
 * @public
 * @param {Array<Object>} slots Wheel slots (OFL `type`: `Open`, `Gobo`, ...)
 * @param {Number} slotIndex Zero-based slot index
 * @returns {Number} Gobo layer
 */
export function goboLayer(slots, slotIndex) {
  const slot = slots[slotIndex];
  if (!slot || slot.type !== 'Gobo') return 0;
  return 1 + (slotIndex % (GOBO_LAYERS - 1));
}

/**
 * Most gobo layers the texture array holds: built-in patterns, then fixture wheel images
 *
 * @constant {Number} MAX_GOBO_LAYERS
 */
export const MAX_GOBO_LAYERS = 64;

/**
 * Shared gobo texture uniform: its value is replaced when wheel images add layers
 *
 * @constant {Object} goboUniform
 */
export const goboUniform = { value: null };

// Wheel image layers: one per decoded image, after the built-in patterns
const imageLayers = new Map();
const imageData = [];

/**
 * Builds the mipmapped single-channel texture array from the built-in patterns and the wheel
 * images added so far. Mip levels give focus and frost blur.
 *
 * @returns {THREE.DataArrayTexture} Gobo texture array
 */
function buildTexture() {
  const layerSize = GOBO_SIZE * GOBO_SIZE;
  const depth = GOBO_LAYERS + imageData.length;
  const data = new Uint8Array(layerSize * depth);
  for (let l = 0; l < GOBO_LAYERS; l++) {
    rasterizeGobo(l, GOBO_SIZE, data, l * layerSize);
  }
  imageData.forEach((layer, i) => data.set(layer, (GOBO_LAYERS + i) * layerSize));
  const texture = new THREE.DataArrayTexture(data, GOBO_SIZE, GOBO_SIZE, depth);
  texture.format = THREE.RedFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Returns the shared gobo texture uniform, building the texture the first time
 *
 * @public
 * @returns {Object} Uniform holding the gobo texture array
 */
export function createGoboTexture() {
  if (!goboUniform.value) goboUniform.value = buildTexture();
  return goboUniform;
}

/**
 * Draws a wheel image into a gobo layer: luminance on black (transparent parts block the light),
 * inverted when the image is drawn dark-on-light (bright border)
 *
 * @param {ImageBitmap} image Wheel slot image
 * @returns {?Uint8Array} Layer pixels, or null when the image can't be drawn
 */
function rasterizeImage(image) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = GOBO_SIZE;
  canvas.height = GOBO_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.fillStyle = '#000';
  context.fillRect(0, 0, GOBO_SIZE, GOBO_SIZE);
  context.drawImage(image, 0, 0, GOBO_SIZE, GOBO_SIZE);
  const { data } = context.getImageData(0, 0, GOBO_SIZE, GOBO_SIZE);
  const layer = new Uint8Array(GOBO_SIZE * GOBO_SIZE);
  let border = 0;
  let borderCount = 0;
  for (let j = 0; j < GOBO_SIZE; j++) {
    for (let i = 0; i < GOBO_SIZE; i++) {
      const p = (j * GOBO_SIZE + i) * 4;
      const v = Math.round(0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]);
      layer[j * GOBO_SIZE + i] = v;
      if (i === 0 || j === 0 || i === GOBO_SIZE - 1 || j === GOBO_SIZE - 1) {
        border += v;
        borderCount += 1;
      }
    }
  }
  if (border / borderCount > 128) {
    for (let k = 0; k < layer.length; k++) layer[k] = 255 - layer[k];
  }
  return layer;
}

/**
 * Returns the gobo layer of a wheel image, adding it to the texture array the first time
 *
 * @public
 * @param {ImageBitmap} image Wheel slot image
 * @returns {Number} Layer, or -1 when the array is full or the image can't be drawn
 */
export function goboImageLayer(image) {
  if (imageLayers.has(image)) return imageLayers.get(image);
  if (GOBO_LAYERS + imageData.length >= MAX_GOBO_LAYERS) return -1;
  const layer = rasterizeImage(image);
  if (!layer) return -1;
  imageData.push(layer);
  const index = GOBO_LAYERS + imageData.length - 1;
  imageLayers.set(image, index);
  if (goboUniform.value) {
    goboUniform.value.dispose();
    goboUniform.value = buildTexture();
  }
  return index;
}
