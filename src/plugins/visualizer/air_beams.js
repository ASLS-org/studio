import * as THREE from 'three';
import {
  BEAM_GLSL, ROLLOFF_GLSL, ACCUM, createConeGeometry, sceneOf,
} from './beam_shading';

/**
 * Air beam techniques: closed form without gobo, closed form with a soft gobo, raymarch
 *
 * @constant {Object} AIR_MODES
 */
export const AIR_MODES = {
  PLAIN: 0,
  SOFT_GOBO: 1,
  RAYMARCH: 2,
};

/**
 * Raymarch sample counts, highest first (the governor drops to the next one before anything else)
 *
 * @constant {Array<Number>} AIR_SAMPLES
 */
export const AIR_SAMPLES = [16, 8];

// Light falls off as 1 / (1 + FALLOFF × distance²): inverse square, softened within 0.5 m of the
// lens, so a shaft is brightest at its neck (about 6× its brightness 6 m out). The gain keeps a
// shaft seen 6 m from its lens as bright as with the earlier, flatter falloff (0.04):
// 0.35 × (1 + 4 × 36) / (1 + 0.04 × 36)
const AIR_GAIN = 20.8; // air light per unit of haze density, before falloff
const FALLOFF = 4;
const EXTINCTION = 0.008; // haze extinction toward the camera, per meter
const LENS_RADIUS = 0.1; // meters
const AIR_PIECES = 4; // closed-form pieces per ray
const PHASE = 0.3; // forward scattering (Henyey-Greenstein g): about 3× brighter head-on

const AIR_VERTEX = /* glsl */`
${BEAM_GLSL}
flat out int vId;
out vec3 vWorld;
void main() {
  vId = gl_InstanceID;
  vec4 w = beamMatrix(gl_InstanceID, 0) * vec4(position, 1.0);
  if (beamTexel(gl_InstanceID, 8).a <= 0.0) w = vec4(0.0, 0.0, 0.0, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

// Back faces of the cone hull: the view ray enters the cone analytically and leaves at the back
// face, the floor, or (with depth) the first surface. Every technique starts from the same smooth
// single-scattering estimate along that segment: point source with inverse-square falloff
// (closed form), soft radial beam profile, forward-scattering phase and extinction, all taken
// where the ray passes closest to the beam axis. MODE (AIR_MODES) then modulates it: nothing,
// the gobo at that point, or the gobo averaged over STEPS raymarch samples. The haze is uniform.
const AIR_FRAGMENT = /* glsl */`
${BEAM_GLSL}
uniform highp sampler2D uDepth;
uniform float uUseDepth;
uniform vec2 uTargetSize;
uniform mat4 uInvViewProj;
uniform float uHaze;
uniform float uAccum;
uniform float uFalloff;
uniform float uExtinction;
uniform float uPhase;
flat in int vId;
in vec3 vWorld;
out highp vec4 outColor;

// Beams fade out well before the end of their cone, so the far cap never shows
float endFade(float z) { return 1.0 - smoothstep(0.25, 0.9, z); }

// Soft beam edge: full in the core, fading to 0 at the cone's rim (r = 1)
float profile(float r) { return 1.0 - smoothstep(0.55, 1.0, r); }

bool insideCone(vec3 q) { return q.z > 0.0 && q.z <= 1.0 && dot(q.xy, q.xy) < q.z * q.z; }

// Henyey-Greenstein phase, relative to a side view (1 at 90 degrees)
float phase(float cosTheta) {
  float g = uPhase;
  float side = (1.0 - g * g) / pow(1.0 + g * g, 1.5);
  return (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * cosTheta, 1.5) / side;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uTargetSize;
  vec3 C = cameraPosition;
  vec3 dir = normalize(vWorld - C);
  float tExit = 1e9;
  if (dir.z < 0.0 && C.z > 0.0) tExit = min(tExit, C.z / -dir.z);
  if (uUseDepth > 0.5) {
    float d = texture(uDepth, uv).r;
    if (d < 1.0) {
      vec4 p = uInvViewProj * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
      tExit = min(tExit, length(p.xyz / p.w - C));
    }
  }
  mat4 inv = beamMatrix(vId, 4);
  vec3 c0 = (inv * vec4(C, 1.0)).xyz;
  vec3 v = (inv * vec4(dir, 0.0)).xyz;

  // Exact segment of the ray inside the cone (0 < z <= 1, x² + y² < z²). The hull is a polygon
  // slightly larger than the cone and only decides which pixels run; its faces never bound the
  // segment, or brightness would step along every facet.
  float qa = dot(v.xy, v.xy) - v.z * v.z;
  float qb = 2.0 * (dot(c0.xy, v.xy) - c0.z * v.z);
  float qc = dot(c0.xy, c0.xy) - c0.z * c0.z;
  float crossings[4] = float[4](-1.0, -1.0, -1.0, -1.0);
  float disc = qb * qb - 4.0 * qa * qc;
  if (abs(qa) > 1e-6 && disc >= 0.0) {
    float sq = sqrt(disc);
    crossings[0] = (-qb - sq) / (2.0 * qa);
    crossings[1] = (-qb + sq) / (2.0 * qa);
  } else if (abs(qb) > 1e-6) {
    crossings[0] = -qc / qb;
  }
  if (abs(v.z) > 1e-6) {
    crossings[2] = -c0.z / v.z;
    crossings[3] = (1.0 - c0.z) / v.z;
  }
  float tEnter = insideCone(c0) ? 0.0 : 1e9;
  for (int i = 0; i < 4; i++) {
    float t = crossings[i];
    if (t > 0.0 && t < tEnter && insideCone(c0 + v * (t + 1e-3 * max(t, 1.0)))) tEnter = t;
  }
  float tCone = 1e9;
  for (int i = 0; i < 4; i++) {
    float t = crossings[i];
    if (t > tEnter && t < tCone && !insideCone(c0 + v * (t + 1e-3 * max(t, 1.0)))) tCone = t;
  }
  tExit = min(tExit, tCone);
  if (tEnter >= tExit) discard;
  vec4 g = beamTexel(vId, 9);
  vec4 o = beamTexel(vId, 11);
  vec3 axis = normalize(beamTexel(vId, 2).xyz);

  // In-scattering of a point source with 1 / (1 + k d^2) falloff, integrated in closed form over
  // PIECES equal parts of the segment, each weighted by the beam profile, phase, extinction and
  // end fade at its middle
  vec3 ao = C - o.xyz;
  float b = dot(ao, dir);
  float h2 = max(dot(ao, ao) - b * b, 0.0);
  float sk = sqrt(uFalloff);
  float sa = sqrt(1.0 + uFalloff * h2);
  float light = 0.0;
  float prev = atan(sk * (tEnter + b) / sa);
  for (int k = 1; k <= PIECES; k++) {
    float t = mix(tEnter, tExit, float(k) / float(PIECES));
    float next = atan(sk * (t + b) / sa);
    float tm = t - 0.5 * (tExit - tEnter) / float(PIECES);
    vec3 lm = C + dir * tm - o.xyz;
    float along = max(dot(lm, axis), 1e-3);
    // Never thinner than the lens, so a ray passing by the lens doesn't count as outside the beam
    float r = length(lm - axis * along) / max(along * g.w, ${LENS_RADIUS.toFixed(2)});
    light += (next - prev) / (sk * sa) * profile(r) * phase(dot(normalize(lm), -dir))
      * exp(-uExtinction * tm) * endFade(along / o.w);
    prev = next;
  }

  // Where the ray passes closest to the beam axis, inside the segment (soft gobo at Medium)
  float dd = dot(dir, axis);
  float denom = 1.0 - dd * dd;
  float tc = denom > 1e-4 ? (dd * dot(axis, ao) - b) / denom : 0.5 * (tEnter + tExit);
  tc = clamp(tc, tEnter, tExit);

#if MODE == 1
  vec3 closest = c0 + v * tc;
  light *= 0.4 + 0.6 * goboAt(closest.xy / max(closest.z, 1e-4), g + vec4(0.0, 0.0, 2.5, 0.0));
#elif MODE == 2
  // Gobo variation, averaged with the same falloff weights as the base
  float dt = (tExit - tEnter) / float(STEPS);
  // Offset per beam, so overlapping beams don't stack the same sampling pattern
  float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))
    + float(vId) * 0.618034);
  float sum = 0.0;
  float weight = 0.0;
  for (int i = 0; i < STEPS; i++) {
    float t = tEnter + (float(i) + jitter) * dt;
    vec3 q = c0 + v * t;
    if (q.z <= 0.0 || q.z > 1.0) continue;
    float dist = q.z * o.w;
    vec2 disk = q.xy / q.z;
    float w = profile(length(disk)) / (1.0 + uFalloff * dist * dist);
    sum += w * goboAt(disk, g + vec4(0.0, 0.0, 1.0, 0.0));
    weight += w;
  }
  light *= weight > 0.0 ? sum / weight : 0.0;
#endif
  vec3 color = beamTexel(vId, 8).rgb * (beamPower(vId) * light * uHaze * uAccum);
#ifdef DITHER
  // 8-bit buffer: dither below one step, so faint beam ends fade instead of banding
  color += (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.0671, 0.0058)))) - 0.5) / 255.0;
#endif
  outColor = vec4(max(color, 0.0), 1.0);
}
`;

// Light separable blur of the air buffer (3 taps) when it's below the canvas resolution, before
// upsampling: removes raymarch grain and the steps of a low-resolution buffer
const BLUR_FRAGMENT = /* glsl */`
uniform sampler2D uSource;
uniform vec2 uStep;
in vec2 vUv;
out highp vec4 outColor;
void main() {
  vec3 c = texture(uSource, vUv).rgb * 0.5;
  c += texture(uSource, vUv + uStep).rgb * 0.25;
  c += texture(uSource, vUv - uStep).rgb * 0.25;
  outColor = vec4(c, 1.0);
}
`;

const COMPOSITE_VERTEX = /* glsl */`
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Adds the air buffer to the canvas. With depth, each of the 4 nearest air texels is weighted by
// how close its depth is to this pixel's, so beams don't bleed over fixture bodies.
const COMPOSITE_FRAGMENT = /* glsl */`
${ROLLOFF_GLSL}
uniform sampler2D uAir;
uniform highp sampler2D uDepth;
uniform float uUseDepth;
uniform vec2 uAirSize;
uniform float uAccum;
uniform float uNear;
uniform float uFar;
in vec2 vUv;
out highp vec4 outColor;

float linearDepth(float d) {
  return uNear * uFar / (uFar - d * (uFar - uNear));
}

void main() {
  vec3 air;
  if (uUseDepth > 0.5) {
    float here = linearDepth(texture(uDepth, vUv).r);
    vec2 base = vUv * uAirSize - 0.5;
    vec2 i0 = floor(base);
    vec2 f = base - i0;
    vec3 sum = vec3(0.0);
    float total = 0.0;
    for (int j = 0; j < 2; j++) {
      for (int i = 0; i < 2; i++) {
        vec2 tap = (i0 + vec2(float(i), float(j)) + 0.5) / uAirSize;
        float there = linearDepth(texture(uDepth, tap).r);
        float bilinear = (i == 0 ? 1.0 - f.x : f.x) * (j == 0 ? 1.0 - f.y : f.y);
        float w = bilinear / (0.02 + abs(here - there) / here);
        sum += texture(uAir, tap).rgb * w;
        total += w;
      }
    }
    air = sum / max(total, 1e-5);
  } else {
    air = texture(uAir, vUv).rgb;
  }
  // Overlapping, head-on or strong beams roll off toward white instead of clipping
  outColor = linearToOutputTexel(vec4(rolloff(air / uAccum), 1.0));
}
`;

/**
 * @class AirBeams
 * @classdesc Beams in the haze, drawn from the beam state into a reduced-resolution buffer and
 * added to the canvas: closed-form scattering (plain or with a soft gobo) or a raymarch with the
 * gobo at each sample, in uniform haze.
 */
class AirBeams {
  /**
   * @param {THREE.WebGLRenderer} renderer Renderer drawing to the canvas
   * @param {Object} shared Uniforms shared with the lighting passes (beam state, gobos)
   * @param {BeamState} beamState Per-beam state
   */
  constructor(renderer, shared, beamState) {
    this.renderer = renderer;
    /**
     * Whether the GPU renders to half-float buffers (no banding, no dithering needed)
     *
     * @type {Boolean}
     */
    this.halfFloat = renderer.extensions.has('EXT_color_buffer_float');
    this._mode = AIR_MODES.PLAIN;
    [this._samples] = AIR_SAMPLES;
    this._fraction = 0.25;
    this._target = null;
    this._size = new THREE.Vector2();
    this._density = 0;
    this._exposure = 1;
    this.uniforms = {
      ...shared,
      uDepth: { value: null },
      uUseDepth: { value: 0 },
      uTargetSize: { value: new THREE.Vector2(1, 1) },
      uInvViewProj: { value: new THREE.Matrix4() },
      uHaze: { value: 0 },
      uAccum: { value: ACCUM },
      uFalloff: { value: FALLOFF },
      uExtinction: { value: EXTINCTION },
      uPhase: { value: PHASE },
    };
    this.geometry = createConeGeometry();
    this.materials = new Map();
    this.mesh = new THREE.Mesh(this.geometry, this.material());
    this.scene = sceneOf(this.mesh);
    beamState.onCountChange((count) => { this.geometry.instanceCount = count; });

    this.compositeUniforms = {
      uAir: { value: null },
      uDepth: this.uniforms.uDepth,
      uUseDepth: this.uniforms.uUseDepth,
      uAirSize: { value: this.uniforms.uTargetSize.value },
      uAccum: { value: ACCUM },
      uNear: { value: 0.01 },
      uFar: { value: 1000 },
    };
    this.compositeScene = sceneOf(new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: this.compositeUniforms,
        vertexShader: COMPOSITE_VERTEX,
        fragmentShader: COMPOSITE_FRAGMENT,
      }),
    ));
    this.screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.blurUniforms = { uSource: { value: null }, uStep: { value: new THREE.Vector2() } };
    this.blurScene = sceneOf(new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        depthTest: false,
        depthWrite: false,
        uniforms: this.blurUniforms,
        vertexShader: COMPOSITE_VERTEX,
        fragmentShader: BLUR_FRAGMENT,
      }),
    ));
  }

  /**
   * Returns (building it once) the material of the current technique and sample count
   *
   * @private
   * @returns {THREE.ShaderMaterial} Air beam material
   */
  material() {
    const key = `${this._mode}:${this._samples}`;
    if (!this.materials.has(key)) {
      this.materials.set(key, new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.BackSide,
        defines: {
          MODE: this._mode,
          STEPS: this._samples,
          PIECES: AIR_PIECES,
          ...(this.halfFloat ? {} : { DITHER: 1 }),
        },
        uniforms: this.uniforms,
        vertexShader: AIR_VERTEX,
        fragmentShader: AIR_FRAGMENT,
      }));
    }
    return this.materials.get(key);
  }

  /**
   * Sets the technique, raymarch samples and buffer size
   *
   * @public
   * @param {Number} mode Technique (AIR_MODES)
   * @param {Number} samples Raymarch samples (AIR_SAMPLES)
   * @param {Number} fraction Buffer size as a fraction of the canvas
   */
  configure(mode, samples, fraction) {
    const resize = fraction !== this._fraction;
    this._mode = mode;
    this._samples = samples;
    this._fraction = fraction;
    this.mesh.material = this.material();
    if (resize) this.resize();
  }

  /**
   * Haze density, 0 to 100
   *
   * @public
   * @param {Number} density Haze density
   */
  setHaze(density) {
    this._density = density;
    this.uniforms.uHaze.value = (density / 100) * AIR_GAIN * this._exposure;
  }

  /**
   * Scales the air light (the visualizer's Exposure)
   *
   * @public
   * @param {Number} exposure Exposure factor (1 is neutral)
   */
  setExposure(exposure) {
    this._exposure = exposure;
    this.uniforms.uHaze.value = (this._density / 100) * AIR_GAIN * exposure;
  }

  /**
   * Whether air beams are drawn at all
   *
   * @type {Boolean}
   */
  get visible() {
    return this.uniforms.uHaze.value > 0;
  }

  /**
   * Follows the canvas size
   *
   * @public
   */
  resize() {
    if (this._target) {
      this._target.dispose();
      this._blurTarget.dispose();
    }
    this.renderer.getDrawingBufferSize(this._size);
    const w = Math.max(1, Math.round(this._size.x * this._fraction));
    const h = Math.max(1, Math.round(this._size.y * this._fraction));
    // Half float where the GPU can render to it (no banding); RGBA8 with dithering otherwise
    const type = this.halfFloat ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this._target = new THREE.WebGLRenderTarget(w, h, { depthBuffer: false, type });
    this._blurTarget = new THREE.WebGLRenderTarget(w, h, { depthBuffer: false, type });
    this.uniforms.uTargetSize.value.set(w, h);
    this.compositeUniforms.uAir.value = this._target.texture;
  }

  /**
   * Blurs the air buffer in place: horizontal into the second buffer, vertical back
   *
   * @private
   */
  blur() {
    const { renderer } = this;
    const { width, height } = this._target;
    this.blurUniforms.uSource.value = this._target.texture;
    this.blurUniforms.uStep.value.set(1 / width, 0);
    renderer.setRenderTarget(this._blurTarget);
    renderer.render(this.blurScene, this.screenCamera);
    this.blurUniforms.uSource.value = this._blurTarget.texture;
    this.blurUniforms.uStep.value.set(0, 1 / height);
    renderer.setRenderTarget(this._target);
    renderer.render(this.blurScene, this.screenCamera);
  }

  /**
   * Air buffer texture (also a bloom source)
   *
   * @type {THREE.Texture}
   */
  get texture() {
    return this._target ? this._target.texture : null;
  }

  /**
   * Draws the beams into the air buffer, then adds it to the canvas
   *
   * @public
   * @param {THREE.PerspectiveCamera} camera View camera
   * @param {?THREE.DepthTexture} depth Scene depth (receivers and occluders), or none
   */
  render(camera, depth) {
    const { renderer } = this;
    if (!this._target) this.resize();
    this.uniforms.uDepth.value = depth;
    this.uniforms.uUseDepth.value = depth ? 1 : 0;
    this.uniforms.uInvViewProj.value
      .multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
    this.compositeUniforms.uNear.value = camera.near;
    this.compositeUniforms.uFar.value = camera.far;
    renderer.setRenderTarget(this._target);
    renderer.clear();
    renderer.render(this.scene, camera);
    if (this._fraction < 1) this.blur();
    renderer.setRenderTarget(null);
    renderer.render(this.compositeScene, this.screenCamera);
  }
}

export default AirBeams;
