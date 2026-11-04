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
 * Draws the built-in gobos into a mipmapped single-channel texture array (2 × 2 supersampled,
 * soft edge at the rim). Mip levels give focus and frost blur.
 *
 * @public
 * @returns {THREE.DataArrayTexture} Gobo texture array, one layer per pattern
 */
export function createGoboTexture() {
  const data = new Uint8Array(GOBO_SIZE * GOBO_SIZE * GOBO_LAYERS);
  for (let l = 0; l < GOBO_LAYERS; l++) {
    rasterizeGobo(l, GOBO_SIZE, data, l * GOBO_SIZE * GOBO_SIZE);
  }
  const texture = new THREE.DataArrayTexture(data, GOBO_SIZE, GOBO_SIZE, GOBO_LAYERS);
  texture.format = THREE.RedFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
