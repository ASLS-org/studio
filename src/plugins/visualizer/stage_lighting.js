import * as THREE from 'three';
import { createGoboTexture } from './gobos';
import {
  BEAM_GLSL, ACCUM, createConeGeometry, sceneOf,
} from './beam_shading';
import AirBeams, { AIR_MODES, AIR_SAMPLES } from './air_beams';
import Bloom from './bloom';

/**
 * Object layers read by the lighting passes. Lit surfaces (floor, set) are receivers; fixture
 * bodies are occluders, drawn black so light isn't added over them.
 *
 * @constant {Object} LIGHT_LAYERS
 */
export const LIGHT_LAYERS = {
  RECEIVER: 1,
  OCCLUDER: 2,
};

/**
 * Quality levels, lowest first
 *
 * @constant {Object} QUALITY_LEVELS
 */
export const QUALITY_LEVELS = {
  GUIDES: 'guides',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

/**
 * Lighting resolution of the deferred levels, before the resolution scale
 *
 * @constant {Object} LEVEL_SCALE
 */
const LEVEL_SCALE = {
  [QUALITY_LEVELS.MEDIUM]: 0.6,
  [QUALITY_LEVELS.HIGH]: 1,
};

/**
 * Air beam technique and buffer size (fraction of the canvas, before the resolution scale) per
 * level; Guides draws no air beam
 *
 * @constant {Object} AIR_LEVELS
 */
const AIR_LEVELS = {
  [QUALITY_LEVELS.LOW]: { mode: AIR_MODES.PLAIN, fraction: 0.5 },
  [QUALITY_LEVELS.MEDIUM]: { mode: AIR_MODES.SOFT_GOBO, fraction: 0.5 },
  [QUALITY_LEVELS.HIGH]: { mode: AIR_MODES.RAYMARCH, fraction: 1 },
};

// Low level's floor light buffer, as a fraction of the canvas (before the resolution scale)
const LOW_LIGHT_SCALE = 0.5;
const GAIN = 110; // light reaching a surface 1 m away, before the 4 m² falloff offset
const GUIDE_EDGES = 8;
const GUIDE_RING = 32;
const GUIDE_FLOOR = 0.25; // guide brightness of a beam at intensity 0

// Adds beam light to a surface the main pass drew unlit (albedo × ambient, tone-mapped and
// encoded): computes the lit colour the same way in one go and outputs only the difference, so
// light from many beams sums in linear space and goes through the tone curve once
const LIT_GLSL = /* glsl */`
uniform float uAmbient;
vec3 finish(vec3 color) {
#ifdef TONE_MAPPING
  color = toneMapping(color);
#endif
  return linearToOutputTexel(vec4(color, 1.0)).rgb;
}
vec4 litDifference(vec3 albedo, vec3 light) {
  vec3 lit = finish(albedo * (uAmbient + light));
  vec3 unlit = finish(albedo * uAmbient);
  return vec4(max(lit - unlit, 0.0), 1.0);
}
`;

// Low: one floor quad per beam, covering its footprint
const DECAL_VERTEX = /* glsl */`
${BEAM_GLSL}
flat out int vId;
out vec3 vWorld;
void main() {
  vId = gl_InstanceID;
  vec4 f = beamTexel(gl_InstanceID, 10);
  vec3 w = vec3(f.x + position.x * f.z, f.y + position.y * f.z, 0.003);
  if (f.w < 0.5 || beamTexel(gl_InstanceID, 8).a <= 0.0) w = vec3(0.0);
  vWorld = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
`;

// Low: each footprint adds its linear light (already × the floor's angle term) to a light buffer
const DECAL_FRAGMENT = /* glsl */`
${BEAM_GLSL}
uniform float uAccum;
flat in int vId;
in vec3 vWorld;
out highp vec4 outColor;
void main() {
  vec3 L;
  vec3 li = beamLight(vId, vWorld, L);
  outColor = vec4(li * max(L.z, 0.0) * uAccum, 1.0);
}
`;

// Low: the floor drawn again just above itself, depth-tested so fixtures in front hide it, adding
// the light buffer's light to the floor's albedo
const FLOOR_VERTEX = /* glsl */`
out vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const FLOOR_FRAGMENT = /* glsl */`
${LIT_GLSL}
uniform sampler2D uLight;
uniform vec2 uCanvasSize;
uniform sampler2D uFloorMap;
uniform vec3 uFloorTint;
uniform vec2 uFloorRepeat;
uniform float uFloorSize;
uniform float uAccum;
in vec3 vWorld;
out highp vec4 outColor;
void main() {
  vec3 light = texture(uLight, gl_FragCoord.xy / uCanvasSize).rgb / uAccum;
  vec3 albedo = texture(uFloorMap, (vWorld.xy / uFloorSize + 0.5) * uFloorRepeat).rgb * uFloorTint;
  outColor = litDifference(albedo, light);
}
`;

// Medium and High: the cone hull's back faces cover every pixel the beam can light
const VOLUME_VERTEX = /* glsl */`
${BEAM_GLSL}
flat out int vId;
void main() {
  vId = gl_InstanceID;
  vec4 w = beamMatrix(gl_InstanceID, 0) * vec4(position, 1.0);
  if (beamTexel(gl_InstanceID, 8).a <= 0.0) w = vec4(0.0, 0.0, 0.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const VOLUME_FRAGMENT = /* glsl */`
${BEAM_GLSL}
uniform highp sampler2D uDepth;
uniform vec2 uTargetSize;
uniform mat4 uInvViewProj;
uniform float uAccum;
flat in int vId;
out highp vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uTargetSize;
  float d = texture(uDepth, uv).r;
  vec4 p = uInvViewProj * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  vec3 P = p.xyz / p.w;
  vec3 n = cross(dFdx(P), dFdy(P));
  vec3 N = dot(n, n) > 0.0 ? normalize(n) : vec3(0.0, 0.0, 1.0);
  if (dot(N, cameraPosition - P) < 0.0) N = -N;
  if (d >= 1.0) discard;
  vec3 L;
  vec3 li = beamLight(vId, P, L);
  outColor = vec4(li * max(dot(N, L), 0.0) * uAccum, 1.0);
}
`;

const COMPOSITE_VERTEX = /* glsl */`
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const COMPOSITE_FRAGMENT = /* glsl */`
${LIT_GLSL}
uniform sampler2D uAlbedo;
uniform sampler2D uLight;
uniform float uAccum;
in vec2 vUv;
out highp vec4 outColor;
void main() {
  outColor = litDifference(texture(uAlbedo, vUv).rgb, texture(uLight, vUv).rgb / uAccum);
}
`;

// Beam guides: position.xy is a point on the unit disk (0 for the axis), position.z is 0 at the
// lens and 1 where that ray meets the floor or the end of the beam
const GUIDE_VERTEX = /* glsl */`
${BEAM_GLSL}
uniform float uGuideFloor;
in float weight;
out vec3 vColor;
void main() {
  mat4 m = beamMatrix(gl_InstanceID, 0);
  vec3 origin = m[3].xyz;
  vec3 ray = mat3(m) * vec3(position.xy, 1.0);
  float reach = ray.z < 0.0 ? min(origin.z / -ray.z, 1.0) : 1.0;
  vec3 w = origin + ray * (reach * position.z);
  vec4 c = beamTexel(gl_InstanceID, 8);
  vColor = c.rgb * weight * (uGuideFloor + (1.0 - uGuideFloor) * c.a);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
`;

const GUIDE_FRAGMENT = /* glsl */`
in vec3 vColor;
out highp vec4 outColor;
void main() { outColor = linearToOutputTexel(vec4(vColor, 1.0)); }
`;

/**
 * Beam guide segments: axis, cone edges and footprint ring, with a brightness weight per vertex
 *
 * @returns {THREE.InstancedBufferGeometry} Guide geometry
 */
function createGuideGeometry() {
  const position = [];
  const weight = [];
  const point = (a, r, t, w) => {
    position.push(Math.cos(a) * r, Math.sin(a) * r, t);
    weight.push(w);
  };
  point(0, 0, 0, 0.9);
  point(0, 0, 1, 0.9);
  for (let i = 0; i < GUIDE_EDGES; i++) {
    const a = (i / GUIDE_EDGES) * Math.PI * 2;
    point(a, 1, 0, 0.5);
    point(a, 1, 1, 0.5);
  }
  for (let i = 0; i < GUIDE_RING; i++) {
    point((i / GUIDE_RING) * Math.PI * 2, 1, 1, 1);
    point(((i + 1) / GUIDE_RING) * Math.PI * 2, 1, 1, 1);
  }
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('weight', new THREE.Float32BufferAttribute(weight, 1));
  geometry.instanceCount = 0;
  return geometry;
}

/**
 * @class StageLighting
 * @classdesc Draws beam light on the stage from the beam state, at one of the quality levels:
 * Guides (no light), Low (floor footprints), Medium and High (deferred light volumes on every
 * receiver, at reduced or full resolution), plus optional beam guides at the canvas's resolution.
 */
class StageLighting {
  /**
   * @param {THREE.WebGLRenderer} renderer Renderer drawing to the canvas
   * @param {THREE.Scene} scene Scene holding receivers and occluders
   * @param {THREE.Camera} camera View camera
   * @param {BeamState} beamState Per-beam state
   */
  constructor(renderer, scene, camera, beamState) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.beamState = beamState;
    this._level = QUALITY_LEVELS.HIGH;
    this._scale = 1;
    this._guides = false;
    [this._samples] = AIR_SAMPLES;
    this._receivers = [];
    this._targets = null;
    this._size = new THREE.Vector2();
    this._targetSize = new THREE.Vector2(1, 1);

    this.shared = {
      uBeams: beamState.uniform,
      uGobos: createGoboTexture(),
      uGain: { value: GAIN },
    };
    const additive = {
      glslVersion: THREE.GLSL3,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    };

    this.decalGeometry = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(2, 2));
    this.decalGeometry.instanceCount = 0;
    this.floorUniforms = {
      uFloorMap: { value: null },
      uFloorTint: { value: new THREE.Color(1, 1, 1) },
      uFloorRepeat: { value: new THREE.Vector2(1, 1) },
      uFloorSize: { value: 1 },
    };
    this.ambient = { value: 0.3 };
    this.halfFloat = renderer.extensions.has('EXT_color_buffer_float');
    this.decalScene = sceneOf(new THREE.Mesh(this.decalGeometry, new THREE.ShaderMaterial({
      ...additive,
      depthTest: false,
      side: THREE.DoubleSide,
      uniforms: { ...this.shared, uAccum: { value: ACCUM } },
      vertexShader: DECAL_VERTEX,
      fragmentShader: DECAL_FRAGMENT,
    })));

    this.coneGeometry = createConeGeometry();
    this.volumeUniforms = {
      uDepth: { value: null },
      uTargetSize: { value: this._targetSize },
      uInvViewProj: { value: new THREE.Matrix4() },
      uAccum: { value: ACCUM },
    };
    this.volumeScene = sceneOf(new THREE.Mesh(this.coneGeometry, new THREE.ShaderMaterial({
      ...additive,
      depthTest: false,
      side: THREE.BackSide,
      uniforms: { ...this.shared, ...this.volumeUniforms },
      vertexShader: VOLUME_VERTEX,
      fragmentShader: VOLUME_FRAGMENT,
    })));

    this.compositeUniforms = {
      uAlbedo: { value: null },
      uLight: { value: null },
      uAccum: { value: ACCUM },
      uAmbient: this.ambient,
    };
    this.floorLightUniforms = {
      ...this.floorUniforms,
      uLight: { value: null },
      uCanvasSize: { value: new THREE.Vector2(1, 1) },
      uAccum: { value: ACCUM },
      uAmbient: this.ambient,
    };
    this.floorScene = null;
    this.compositeScene = sceneOf(new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        ...additive,
        depthTest: false,
        uniforms: this.compositeUniforms,
        vertexShader: COMPOSITE_VERTEX,
        fragmentShader: COMPOSITE_FRAGMENT,
      }),
    ));
    this.screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.guideGeometry = createGuideGeometry();
    this.guideScene = sceneOf(new THREE.LineSegments(this.guideGeometry, new THREE.ShaderMaterial({
      ...additive,
      depthTest: false,
      uniforms: { ...this.shared, uGuideFloor: { value: GUIDE_FLOOR } },
      vertexShader: GUIDE_VERTEX,
      fragmentShader: GUIDE_FRAGMENT,
    })));

    this.occluderMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.air = new AirBeams(renderer, this.shared, beamState);
    this.bloom = new Bloom(renderer, this.shared, beamState);

    beamState.onCountChange((count) => {
      this.decalGeometry.instanceCount = count;
      this.coneGeometry.instanceCount = count;
      this.guideGeometry.instanceCount = count;
    });
  }

  /**
   * Quality level (see QUALITY_LEVELS)
   *
   * @type {String}
   */
  set level(level) {
    if (level === this._level) return;
    this._level = level;
    this.updateTargets();
  }

  get level() {
    return this._level;
  }

  /**
   * Resolution scale of the lighting passes, 0 to 1
   *
   * @type {Number}
   */
  set scale(scale) {
    if (scale === this._scale) return;
    this._scale = scale;
    this.updateTargets();
  }

  get scale() {
    return this._scale;
  }

  /**
   * Whether beam guides are drawn
   *
   * @type {Boolean}
   */
  /**
   * Raymarch samples of the High level's air beams (see AIR_SAMPLES)
   *
   * @type {Number}
   */
  set airSamples(samples) {
    if (samples === this._samples) return;
    this._samples = samples;
    this.updateTargets();
  }

  get airSamples() {
    return this._samples;
  }

  /**
   * Sets the haze the air beams shine through
   *
   * @public
   * @param {Number} density Haze density, 0 to 100
   */
  setHaze(density) {
    this.air.setHaze(density);
  }

  set guides(state) {
    this._guides = state;
  }

  get guides() {
    return this._guides;
  }

  /**
   * Registers a surface lit by beams. Its main material shows it unlit; the albedo material shows
   * its unlit, unshaded colour and is drawn into the lighting prepass.
   *
   * @public
   * @param {THREE.Mesh} mesh Lit surface
   * @param {THREE.Material} albedoMaterial Albedo-only material
   */
  addReceiver(mesh, albedoMaterial) {
    mesh.layers.enable(LIGHT_LAYERS.RECEIVER);
    this._receivers.push({ mesh, albedoMaterial, material: mesh.material });
  }

  /**
   * Sets the floor albedo read by the Low level's footprints
   *
   * @public
   * @param {THREE.Texture} map Floor texture (repeat wrapping)
   * @param {Number} size Floor width (meter), centred on the origin
   * @param {THREE.Color} [tint] Floor albedo tint
   */
  setFloor(map, size, tint = new THREE.Color(1, 1, 1)) {
    this.floorUniforms.uFloorMap.value = map;
    this.floorUniforms.uFloorTint.value.copy(tint);
    this.floorUniforms.uFloorRepeat.value.copy(map.repeat);
    this.floorUniforms.uFloorSize.value = size;
    this.floorScene = sceneOf(new THREE.Mesh(
      new THREE.PlaneGeometry(size, size).translate(0, 0, 0.002),
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        uniforms: this.floorLightUniforms,
        vertexShader: FLOOR_VERTEX,
        fragmentShader: FLOOR_FRAGMENT,
      }),
    ));
  }

  /**
   * Exposure of the whole picture: the tone curve's exposure (scene and surface light) and the
   * air beams, lens glow and bloom
   *
   * @public
   * @param {Number} exposure Exposure factor (1 is neutral)
   */
  setExposure(exposure) {
    this.renderer.toneMappingExposure = exposure;
    this.air.setExposure(exposure);
    this.bloom.exposure.value = exposure;
  }

  /**
   * Floor brightness without beam light (the factor the floor's unlit material uses)
   *
   * @public
   * @param {Number} ambient Ambient factor
   */
  setAmbient(ambient) {
    this.ambient.value = ambient;
  }

  /**
   * Follows the canvas size
   *
   * @public
   */
  resize() {
    this.air.resize();
    this.updateTargets();
  }

  /**
   * Creates the deferred levels' targets at the lighting resolution, or drops them
   *
   * @private
   */
  updateTargets() {
    const air = AIR_LEVELS[this._level];
    if (air) this.air.configure(air.mode, this._samples, air.fraction * this._scale);
    this.bloom.resize();
    if (this._targets) {
      this._targets.scene.dispose();
      this._targets.light.dispose();
      this._targets = null;
    }
    if (this._floorLight) {
      this._floorLight.dispose();
      this._floorLight = null;
    }
    this.renderer.getDrawingBufferSize(this._size);
    const type = this.halfFloat ? THREE.HalfFloatType : THREE.UnsignedByteType;
    if (this._level === QUALITY_LEVELS.LOW) {
      this._floorLight = new THREE.WebGLRenderTarget(
        Math.max(1, Math.round(this._size.x * LOW_LIGHT_SCALE * this._scale)),
        Math.max(1, Math.round(this._size.y * LOW_LIGHT_SCALE * this._scale)),
        { depthBuffer: false, type },
      );
      this.floorLightUniforms.uLight.value = this._floorLight.texture;
      this.floorLightUniforms.uCanvasSize.value.copy(this._size);
    }
    const levelScale = LEVEL_SCALE[this._level];
    if (!levelScale) return;
    const w = Math.max(1, Math.round(this._size.x * levelScale * this._scale));
    const h = Math.max(1, Math.round(this._size.y * levelScale * this._scale));
    const depthTexture = new THREE.DepthTexture(w, h);
    const scene = new THREE.WebGLRenderTarget(w, h, { depthBuffer: true, depthTexture });
    const light = new THREE.WebGLRenderTarget(w, h, { depthBuffer: false, type });
    this._targets = { scene, light };
    this._targetSize.set(w, h);
    this.volumeUniforms.uDepth.value = depthTexture;
    this.compositeUniforms.uAlbedo.value = scene.texture;
    this.compositeUniforms.uLight.value = light.texture;
  }

  /**
   * Draws the frame: the scene, then the level's surface light, air beams, lens glow and bloom,
   * then the guides
   *
   * @public
   */
  render() {
    const { renderer, scene, camera } = this;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    renderer.autoClear = false;
    // Light buffers clear to black (the main pass leaves the scene background as clear colour)
    renderer.setClearColor(0x000000, 0);
    if (this.beamState.count) {
      if (this._level === QUALITY_LEVELS.LOW) {
        if (this._floorLight && this.floorScene) {
          renderer.setRenderTarget(this._floorLight);
          renderer.clear();
          renderer.render(this.decalScene, camera);
          renderer.setRenderTarget(null);
          renderer.render(this.floorScene, camera);
        }
      } else if (this._targets) {
        this.renderDeferred();
      }
      if (AIR_LEVELS[this._level]) {
        if (this.air.visible) {
          this.air.render(camera, this._targets ? this._targets.scene.depthTexture : null);
        }
        this.bloom.renderGlow(camera);
        if (this._targets) this.bloom.render(camera, this.air.visible ? this.air.texture : null);
      }
      if (this._guides) {
        renderer.render(this.guideScene, camera);
      }
    }
    renderer.autoClear = true;
  }

  /**
   * Deferred light: receivers' albedo and every lit or occluding surface's depth at the lighting
   * resolution, the beams' light volumes against that depth, then albedo × light added to the
   * canvas
   *
   * @private
   */
  renderDeferred() {
    const {
      renderer, scene, camera, _targets: targets,
    } = this;
    const { mask } = camera.layers;
    const { background } = scene;
    scene.background = null;

    renderer.setRenderTarget(targets.scene);
    renderer.clear();
    camera.layers.set(LIGHT_LAYERS.RECEIVER);
    for (let i = 0; i < this._receivers.length; i++) {
      this._receivers[i].mesh.material = this._receivers[i].albedoMaterial;
    }
    renderer.render(scene, camera);
    for (let i = 0; i < this._receivers.length; i++) {
      this._receivers[i].mesh.material = this._receivers[i].material;
    }
    camera.layers.set(LIGHT_LAYERS.OCCLUDER);
    scene.overrideMaterial = this.occluderMaterial;
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    camera.layers.mask = mask;
    scene.background = background;

    this.volumeUniforms.uInvViewProj.value
      .multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
    renderer.setRenderTarget(targets.light);
    renderer.clear();
    renderer.render(this.volumeScene, camera);

    renderer.setRenderTarget(null);
    renderer.render(this.compositeScene, this.screenCamera);
  }
}

export default StageLighting;
