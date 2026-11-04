import * as THREE from 'three';

/**
 * Haze noise texture size, in texels per side
 *
 * @constant {Number} HAZE_SIZE
 */
const HAZE_SIZE = 64;

/**
 * Lattice periods of the noise octaves (texels per side divide evenly, so the texture tiles)
 *
 * @constant {Array<Number>} OCTAVES
 */
const OCTAVES = [8, 16, 32];

function lattice(period) {
  const values = new Float32Array(period * period * period);
  for (let i = 0; i < values.length; i++) {
    const s = Math.sin(i * 12.9898 + period * 78.233) * 43758.5453;
    values[i] = s - Math.floor(s);
  }
  return values;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Bakes tileable 3D value noise (three octaves) for drifting haze: one lookup per raymarch sample
 * instead of procedural noise
 *
 * @public
 * @returns {THREE.Data3DTexture} Haze noise, single channel, repeat wrapping
 */
export function createHazeTexture() {
  const data = new Uint8Array(HAZE_SIZE * HAZE_SIZE * HAZE_SIZE);
  const sum = new Float32Array(data.length);
  let weight = 0;
  OCTAVES.forEach((period, octave) => {
    const values = lattice(period);
    const amplitude = 0.5 ** octave;
    const scale = period / HAZE_SIZE;
    const at = (x, y, z) => values[((z % period) * period + (y % period)) * period + (x % period)];
    for (let z = 0; z < HAZE_SIZE; z++) {
      const fz = z * scale;
      const z0 = Math.floor(fz);
      const tz = smooth(fz - z0);
      for (let y = 0; y < HAZE_SIZE; y++) {
        const fy = y * scale;
        const y0 = Math.floor(fy);
        const ty = smooth(fy - y0);
        for (let x = 0; x < HAZE_SIZE; x++) {
          const fx = x * scale;
          const x0 = Math.floor(fx);
          const tx = smooth(fx - x0);
          const a = lerp(at(x0, y0, z0), at(x0 + 1, y0, z0), tx);
          const b = lerp(at(x0, y0 + 1, z0), at(x0 + 1, y0 + 1, z0), tx);
          const c = lerp(at(x0, y0, z0 + 1), at(x0 + 1, y0, z0 + 1), tx);
          const d = lerp(at(x0, y0 + 1, z0 + 1), at(x0 + 1, y0 + 1, z0 + 1), tx);
          const v = lerp(lerp(a, b, ty), lerp(c, d, ty), tz);
          sum[(z * HAZE_SIZE + y) * HAZE_SIZE + x] += v * amplitude;
        }
      }
    }
    weight += amplitude;
  });
  for (let i = 0; i < data.length; i++) data[i] = Math.round((sum[i] / weight) * 255);
  const texture = new THREE.Data3DTexture(data, HAZE_SIZE, HAZE_SIZE, HAZE_SIZE);
  texture.format = THREE.RedFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.wrapR = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

export default createHazeTexture;
