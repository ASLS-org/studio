import * as THREE from 'three';

/**
 * Gobo texture size, in texels
 *
 * @constant {Number} GOBO_SIZE
 */
const GOBO_SIZE = 128;

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function polygonEdge(angle, sides) {
  const sector = (2 * Math.PI) / sides;
  const local = ((angle % sector) + sector) % sector;
  return Math.cos(Math.PI / sides) / Math.cos(local - Math.PI / sides);
}

/**
 * Built-in gobo patterns: (x, y, radius, angle) on the unit disk to coverage 0 or 1.
 * Layer 0 is the open beam.
 *
 * @constant {Array<Function>} GOBO_PATTERNS
 */
const GOBO_PATTERNS = [
  () => 1, // open
  (x, y) => { // dots
    if (Math.hypot(x, y) < 0.18) return 1;
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      if (Math.hypot(x - 0.58 * Math.cos(a), y - 0.58 * Math.sin(a)) < 0.2) return 1;
    }
    return 0;
  },
  (x, y) => ( // breakup
    valueNoise(x * 5 + 3, y * 5 + 7) * 0.65 + valueNoise(x * 11, y * 11) * 0.35 > 0.55 ? 1 : 0),
  (x, y, r, a) => (Math.abs(Math.sin(a * 4)) < 0.35 ? 1 : 0), // star
  (x, y, r) => (Math.sin(r * 28) > 0 ? 1 : 0), // rings
  (x, y, r, a) => (Math.sin(a * 3 + r * 14) > 0.1 ? 1 : 0), // spiral
  (x, y) => (Math.abs(((x * 3.5 + 10) % 1) - 0.5) < 0.38
    && Math.abs(((y * 3.5 + 10) % 1) - 0.5) < 0.38 ? 1 : 0), // window
  (x, y, r, a) => { // triangle outline
    const k = polygonEdge(a, 3);
    return r < 0.78 * k && r > 0.42 * k ? 1 : 0;
  },
  (x, y) => (Math.sin(y * 26) > 0.2 ? 1 : 0), // slats
  (x, y) => ( // leaves
    valueNoise(x * 3 + 11, y * 3 + 1) > 0.5 && valueNoise(x * 9 + 2, y * 9 + 5) > 0.35 ? 1 : 0),
];

/**
 * Number of gobo layers, open included
 *
 * @constant {Number} GOBO_LAYERS
 */
export const GOBO_LAYERS = GOBO_PATTERNS.length;

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
  const sub = [0.25, 0.75];
  for (let l = 0; l < GOBO_LAYERS; l++) {
    const pattern = GOBO_PATTERNS[l];
    for (let j = 0; j < GOBO_SIZE; j++) {
      for (let i = 0; i < GOBO_SIZE; i++) {
        let sum = 0;
        for (let sy = 0; sy < 2; sy++) {
          for (let sx = 0; sx < 2; sx++) {
            const x = ((i + sub[sx]) / GOBO_SIZE) * 2 - 1;
            const y = ((j + sub[sy]) / GOBO_SIZE) * 2 - 1;
            const r = Math.hypot(x, y);
            if (r < 0.97) sum += pattern(x, y, r, Math.atan2(y, x));
          }
        }
        data[(l * GOBO_SIZE + j) * GOBO_SIZE + i] = Math.round((sum / 4) * 255);
      }
    }
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
