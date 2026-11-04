import * as THREE from 'three';
import { BEAM_GLSL, ACCUM, sceneOf } from './beam_shading';

const GLOW_SIZE = 0.35; // lens glow radius at full intensity, in meters
const GLOW_OFFSET = 0.05; // glow centre in front of the lens, in meters
const BLOOM_LEVELS = 4;
const BLOOM_THRESHOLD = 0.35; // light below this doesn't bloom
const BLOOM_STRENGTH = 0.5;

// One camera-facing quad per beam at its lens, brighter when looking into the beam
const GLOW_VERTEX = /* glsl */`
${BEAM_GLSL}
uniform float uSize;
uniform float uOffset;
out vec2 vDisk;
out vec3 vColor;
void main() {
  vec4 o = beamTexel(gl_InstanceID, 11);
  vec3 axis = normalize(beamTexel(gl_InstanceID, 2).xyz);
  vec4 c = beamTexel(gl_InstanceID, 8);
  vec3 centre = o.xyz + axis * uOffset;
  float facing = max(dot(axis, normalize(cameraPosition - centre)), 0.0);
  float size = uSize * (0.4 + 0.6 * c.a) * (0.5 + 0.5 * facing);
  vec4 view = viewMatrix * vec4(centre, 1.0);
  view.xy += position.xy * size;
  vDisk = position.xy;
  vColor = c.rgb * c.a * (0.3 + 0.7 * facing);
  gl_Position = projectionMatrix * view;
  if (c.a <= 0.0) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}
`;

const GLOW_FRAGMENT = /* glsl */`
uniform float uScale;
in vec2 vDisk;
in vec3 vColor;
out highp vec4 outColor;
void main() {
  float r2 = dot(vDisk, vDisk);
  if (r2 > 1.0) discard;
  vec3 light = vColor * exp(-r2 * 5.0) * 2.0;
#ifdef TO_SCREEN
  outColor = linearToOutputTexel(vec4(light, 1.0));
#else
  outColor = vec4(light * uScale, 1.0);
#endif
}
`;

const SCREEN_VERTEX = /* glsl */`
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Bright-pass of the air buffer into the first bloom level
const BRIGHT_FRAGMENT = /* glsl */`
uniform sampler2D uSource;
uniform float uThreshold;
in vec2 vUv;
out highp vec4 outColor;
void main() {
  vec3 c = texture(uSource, vUv).rgb;
  outColor = vec4(max(c - uThreshold, 0.0), 1.0);
}
`;

// Dual-filter blur: 5 taps going down, 8 taps going up
const DOWN_FRAGMENT = /* glsl */`
uniform sampler2D uSource;
uniform vec2 uTexel;
in vec2 vUv;
out highp vec4 outColor;
void main() {
  vec3 c = texture(uSource, vUv).rgb * 4.0;
  c += texture(uSource, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
  c += texture(uSource, vUv + uTexel * vec2(1.0, -1.0)).rgb;
  c += texture(uSource, vUv + uTexel * vec2(-1.0, 1.0)).rgb;
  c += texture(uSource, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  outColor = vec4(c / 8.0, 1.0);
}
`;

const UP_FRAGMENT = /* glsl */`
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uStrength;
in vec2 vUv;
out highp vec4 outColor;
void main() {
  vec3 c = texture(uSource, vUv + uTexel * vec2(-2.0, 0.0)).rgb;
  c += texture(uSource, vUv + uTexel * vec2(2.0, 0.0)).rgb;
  c += texture(uSource, vUv + uTexel * vec2(0.0, -2.0)).rgb;
  c += texture(uSource, vUv + uTexel * vec2(0.0, 2.0)).rgb;
  c += texture(uSource, vUv + uTexel * vec2(-1.0, -1.0)).rgb * 2.0;
  c += texture(uSource, vUv + uTexel * vec2(1.0, -1.0)).rgb * 2.0;
  c += texture(uSource, vUv + uTexel * vec2(-1.0, 1.0)).rgb * 2.0;
  c += texture(uSource, vUv + uTexel * vec2(1.0, 1.0)).rgb * 2.0;
  c = c / 12.0 * uStrength;
#ifdef TO_SCREEN
  outColor = linearToOutputTexel(vec4(c / ${ACCUM.toFixed(2)}, 1.0));
#else
  outColor = vec4(c, 1.0);
#endif
}
`;

/**
 * Quad from -1 to 1 for instanced sprites
 *
 * @returns {THREE.InstancedBufferGeometry} Sprite geometry
 */
function createSpriteGeometry() {
  const geometry = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(2, 2));
  geometry.instanceCount = 0;
  return geometry;
}

/**
 * @class Bloom
 * @classdesc Lens glow on every lit beam, and a soft bloom spread from the air beams and lens
 * glows: bright-pass, then a 4-level downsample and upsample blur added to the canvas.
 */
class Bloom {
  /**
   * @param {THREE.WebGLRenderer} renderer Renderer drawing to the canvas
   * @param {Object} shared Uniforms shared with the lighting passes (beam state)
   * @param {BeamState} beamState Per-beam state
   */
  constructor(renderer, shared, beamState) {
    this.renderer = renderer;
    this._levels = [];
    this._size = new THREE.Vector2();
    this.screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.spriteGeometry = createSpriteGeometry();
    beamState.onCountChange((count) => { this.spriteGeometry.instanceCount = count; });
    const glow = (toScreen) => new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: toScreen,
      depthWrite: false,
      defines: toScreen ? { TO_SCREEN: 1 } : {},
      uniforms: {
        ...shared,
        uSize: { value: GLOW_SIZE },
        uOffset: { value: GLOW_OFFSET },
        uScale: { value: ACCUM },
      },
      vertexShader: GLOW_VERTEX,
      fragmentShader: GLOW_FRAGMENT,
    });
    this.glowScene = sceneOf(new THREE.Mesh(this.spriteGeometry, glow(true)));
    this.glowSourceScene = sceneOf(new THREE.Mesh(this.spriteGeometry, glow(false)));

    const pass = (fragmentShader, uniforms, defines = {}, additive = false) => sceneOf(
      new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        depthTest: false,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NoBlending,
        transparent: additive,
        defines,
        uniforms,
        vertexShader: SCREEN_VERTEX,
        fragmentShader,
      })),
    );
    this.brightUniforms = {
      uSource: { value: null },
      uThreshold: { value: BLOOM_THRESHOLD * ACCUM },
    };
    this.brightScene = pass(BRIGHT_FRAGMENT, this.brightUniforms);
    this.downUniforms = { uSource: { value: null }, uTexel: { value: new THREE.Vector2() } };
    this.downScene = pass(DOWN_FRAGMENT, this.downUniforms);
    this.upUniforms = {
      uSource: { value: null }, uTexel: { value: new THREE.Vector2() }, uStrength: { value: 1 },
    };
    this.upScene = pass(UP_FRAGMENT, this.upUniforms, {}, true);
    this.upScreenUniforms = {
      uSource: { value: null },
      uTexel: { value: new THREE.Vector2() },
      uStrength: { value: BLOOM_STRENGTH },
    };
    this.upScreenScene = pass(UP_FRAGMENT, this.upScreenUniforms, { TO_SCREEN: 1 }, true);
  }

  /**
   * Draws the lens glows on the canvas (depth-tested against the scene)
   *
   * @public
   * @param {THREE.Camera} camera View camera
   */
  renderGlow(camera) {
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.glowScene, camera);
  }

  /**
   * Follows the canvas size: level 0 is half the canvas, each next level half the previous
   *
   * @public
   */
  resize() {
    this._levels.forEach((target) => target.dispose());
    this._levels = [];
    this.renderer.getDrawingBufferSize(this._size);
    let w = this._size.x;
    let h = this._size.y;
    for (let i = 0; i < BLOOM_LEVELS; i++) {
      w = Math.max(1, Math.round(w / 2));
      h = Math.max(1, Math.round(h / 2));
      this._levels.push(new THREE.WebGLRenderTarget(w, h, { depthBuffer: false }));
    }
  }

  /**
   * Blooms the air beams and lens glows onto the canvas
   *
   * @public
   * @param {THREE.Camera} camera View camera
   * @param {?THREE.Texture} air Air beam buffer, or none
   */
  render(camera, air) {
    const { renderer } = this;
    if (!this._levels.length) this.resize();
    const levels = this._levels;
    renderer.setRenderTarget(levels[0]);
    renderer.clear();
    if (air) {
      this.brightUniforms.uSource.value = air;
      renderer.render(this.brightScene, this.screenCamera);
    }
    renderer.render(this.glowSourceScene, camera);
    for (let i = 1; i < levels.length; i++) {
      this.downUniforms.uSource.value = levels[i - 1].texture;
      this.downUniforms.uTexel.value.set(1 / levels[i - 1].width, 1 / levels[i - 1].height);
      renderer.setRenderTarget(levels[i]);
      renderer.render(this.downScene, this.screenCamera);
    }
    for (let i = levels.length - 1; i > 0; i--) {
      this.upUniforms.uSource.value = levels[i].texture;
      this.upUniforms.uTexel.value.set(1 / levels[i].width, 1 / levels[i].height);
      renderer.setRenderTarget(levels[i - 1]);
      renderer.render(this.upScene, this.screenCamera);
    }
    this.upScreenUniforms.uSource.value = levels[0].texture;
    this.upScreenUniforms.uTexel.value.set(1 / levels[0].width, 1 / levels[0].height);
    renderer.setRenderTarget(null);
    renderer.render(this.upScreenScene, this.screenCamera);
  }
}

export default Bloom;
