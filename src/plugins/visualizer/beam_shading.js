import * as THREE from 'three';

/**
 * RGBA8 light buffers store light × ACCUM, so values up to 4 fit
 *
 * @constant {Number} ACCUM
 */
export const ACCUM = 0.25;

// Solid-angle normalisation of beam intensity (see beamPower)
const TAN_REFERENCE = Math.tan((12.5 * Math.PI) / 180);
const SPREAD_EXPONENT = 1.5;
const MIN_SPREAD = 0.25;
const MAX_SPREAD = 4;

// Highlight rolloff shared by the air beams and the lens glows: the brightest channel is
// compressed (hue kept) and what goes past the knee bleeds toward white, so a saturating beam pales
// where it is brightest, as on camera, instead of clipping in its colour
export const ROLLOFF_GLSL = /* glsl */`
vec3 rolloff(vec3 c) {
  float peak = max(max(c.r, c.g), c.b);
  if (peak <= 0.0) return vec3(0.0);
  float mapped = 1.0 - exp(-peak);
  float bleed = 1.0 - exp(-max(peak - 1.0, 0.0) * 0.6);
  return mix(c * (mapped / peak), vec3(mapped), bleed);
}
`;

// Shared by every pass: reads one beam's row of the state texture (see beam_state.js)
export const BEAM_GLSL = /* glsl */`
uniform highp sampler2D uBeams;
uniform highp sampler2DArray uGobos;
uniform float uGain;

vec4 beamTexel(int id, int k) { return texelFetch(uBeams, ivec2(k, id), 0); }

mat4 beamMatrix(int id, int base) {
  return mat4(beamTexel(id, base), beamTexel(id, base + 1), beamTexel(id, base + 2),
    beamTexel(id, base + 3));
}

// uv: position in the beam's unit disk; g: gobo layer, rotation, blur (mip level). The rim fades
// over the outer 22% of the radius, more with focus or frost blur.
float goboAt(vec2 uv, vec4 g) {
  float r = length(uv);
  if (r >= 1.0) return 0.0;
  float c = cos(g.y);
  float s = sin(g.y);
  vec2 q = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
  float v = textureLod(uGobos, vec3(q * 0.5 + 0.5, g.x), g.z).r;
  float rim = min(0.22 + 0.1 * g.z, 0.8);
  return v * (1.0 - smoothstep(1.0 - rim, 1.0, r));
}

// Intensity per solid angle: a fixture spreads its light over its cone, so a wider beam is
// dimmer and a narrower one brighter (relative to a 25 degree beam). The exponent is 1.5 instead
// of the physical 2, since eyes adapt and wide fixtures usually have more output.
float beamPower(int id) {
  float tanHalf = max(beamTexel(id, 9).w, 1e-3);
  float spread = pow(${TAN_REFERENCE.toFixed(4)} / tanHalf, ${SPREAD_EXPONENT.toFixed(2)});
  return beamTexel(id, 8).a * beamTexel(id, 12).y
    * clamp(spread, ${MIN_SPREAD.toFixed(2)}, ${MAX_SPREAD.toFixed(2)});
}

// Light a beam casts on world point P, before the surface's angle term; L: direction to the lens
vec3 beamLight(int id, vec3 P, out vec3 L) {
  vec4 o = beamTexel(id, 11);
  L = normalize(o.xyz - P);
  vec4 loc = beamMatrix(id, 4) * vec4(P, 1.0);
  if (loc.z <= 0.0 || loc.z > 1.0) return vec3(0.0);
  vec2 uv = loc.xy / loc.z;
  float g;
  if (beamTexel(id, 12).z > 0.5) {
    // Spill light of glowing cells: soft over its whole width, fading out before its end
    float r2 = min(dot(uv, uv), 1.0);
    g = (1.0 - r2) * (1.0 - r2) * (1.0 - smoothstep(0.5, 1.0, loc.z));
  } else {
    // Field falloff: brightest on the axis, about 80% towards the rim, like a real beam
    g = goboAt(uv, beamTexel(id, 9)) * (1.0 - 0.2 * dot(uv, uv));
  }
  float d = loc.z * o.w;
  return beamTexel(id, 8).rgb * (beamPower(id) * g * uGain / (4.0 + d * d));
}
`;

/**
 * Unit cone, apex at the origin, base radius 1 at z = 1, closed, faces outward. The ring is pushed
 * out so the polygon contains the circle. Truncated, the apex becomes a ring at z = 0 too, with
 * its ring directions in x, y: the vertex shader scales each ring to its radius (the air beams
 * start at the lens's width).
 *
 * @param {Number} [segments=24] Ring segments
 * @param {Boolean} [truncated=false] Whether the apex is a ring
 * @returns {THREE.InstancedBufferGeometry} Cone geometry
 */
export function createConeGeometry(segments = 24, truncated = false) {
  const k = 1 / Math.cos(Math.PI / segments);
  const position = [];
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    const x1 = Math.cos(a1) * k;
    const y1 = Math.sin(a1) * k;
    const x2 = Math.cos(a2) * k;
    const y2 = Math.sin(a2) * k;
    if (truncated) {
      position.push(x1, y1, 0, x2, y2, 1, x1, y1, 1);
      position.push(x1, y1, 0, x2, y2, 0, x2, y2, 1);
      position.push(0, 0, 0, x2, y2, 0, x1, y1, 0);
    } else {
      position.push(0, 0, 0, x2, y2, 1, x1, y1, 1);
    }
    position.push(0, 0, 1, x1, y1, 1, x2, y2, 1);
  }
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.instanceCount = 0;
  return geometry;
}

/**
 * Wraps a mesh in its own scene, drawn whatever its bounds
 *
 * @param {THREE.Object3D} object Mesh or line
 * @returns {THREE.Scene} Scene holding the object
 */
export function sceneOf(object) {
  const scene = new THREE.Scene();
  object.frustumCulled = false;
  scene.add(object);
  return scene;
}
