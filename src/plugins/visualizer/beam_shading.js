import * as THREE from 'three';

/**
 * RGBA8 light buffers store light × ACCUM, so values up to 4 fit
 *
 * @constant {Number} ACCUM
 */
export const ACCUM = 0.25;

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

// uv: position in the beam's unit disk; g: gobo layer, rotation, blur (mip level)
float goboAt(vec2 uv, vec4 g) {
  float r = length(uv);
  if (r >= 1.0) return 0.0;
  float c = cos(g.y);
  float s = sin(g.y);
  vec2 q = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
  float v = textureLod(uGobos, vec3(q * 0.5 + 0.5, g.x), g.z).r;
  return v * (1.0 - smoothstep(0.92, 1.0, r));
}

// Light a beam casts on world point P, before the surface's angle term; L: direction to the lens
vec3 beamLight(int id, vec3 P, out vec3 L) {
  vec4 o = beamTexel(id, 11);
  L = normalize(o.xyz - P);
  vec4 loc = beamMatrix(id, 4) * vec4(P, 1.0);
  if (loc.z <= 0.0 || loc.z > 1.0) return vec3(0.0);
  float g = goboAt(loc.xy / loc.z, beamTexel(id, 9));
  float d = loc.z * o.w;
  vec4 c = beamTexel(id, 8);
  return c.rgb * (c.a * g * uGain / (4.0 + d * d));
}
`;

/**
 * Unit cone, apex at the origin, base radius 1 at z = 1, closed, faces outward. The ring is pushed
 * out so the polygon contains the circle.
 *
 * @param {Number} [segments=24] Ring segments
 * @returns {THREE.InstancedBufferGeometry} Cone geometry
 */
export function createConeGeometry(segments = 24) {
  const k = 1 / Math.cos(Math.PI / segments);
  const position = [];
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    const x1 = Math.cos(a1) * k;
    const y1 = Math.sin(a1) * k;
    const x2 = Math.cos(a2) * k;
    const y2 = Math.sin(a2) * k;
    position.push(0, 0, 0, x2, y2, 1, x1, y1, 1);
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
