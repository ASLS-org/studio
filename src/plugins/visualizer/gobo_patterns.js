/**
 * Built-in gobo patterns, free of Three.js so they also run in Node (the generic GDTF bundle
 * generator renders its wheel images from them).
 */

/**
 * Gobo texture size, in texels
 *
 * @constant {Number} GOBO_SIZE
 */
export const GOBO_SIZE = 128;

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
 * Rasterises a built-in pattern into a single-channel image (2 × 2 supersampled, soft edge at the
 * rim): 255 where light passes, 0 where it is blocked
 *
 * @public
 * @param {Number} layer Pattern index, 0 is the open beam
 * @param {Number} [size=GOBO_SIZE] Image width and height, in pixels
 * @param {Uint8Array} [out] Destination, `size * size` bytes from `offset`
 * @param {Number} [offset=0] First byte written in `out`
 * @returns {Uint8Array} The destination
 */
export function rasterizeGobo(
  layer,
  size = GOBO_SIZE,
  out = new Uint8Array(size * size),
  offset = 0,
) {
  const pattern = GOBO_PATTERNS[layer];
  const sub = [0.25, 0.75];
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let sum = 0;
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const x = ((i + sub[sx]) / size) * 2 - 1;
          const y = ((j + sub[sy]) / size) * 2 - 1;
          const r = Math.hypot(x, y);
          if (r < 0.97) sum += pattern(x, y, r, Math.atan2(y, x));
        }
      }
      out[offset + j * size + i] = Math.round((sum / 4) * 255);
    }
  }
  return out;
}
