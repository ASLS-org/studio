/* eslint-disable */
// TODO: find a way for the linter to accept node_module nested libs
import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import ModelInstancer from './model_instancer';
import SceneManager from './scene_manager';
import AnimationManager from './animation_manager';
import Controls from './controls';
import GeometryFixture from './geometry_fixture';
import FixtureRenderer from './fixture_renderer';
import InfiniteGridHelper from './grid';
import BeamState from './beam_state';
import StageLighting, { QUALITY_LEVELS } from './stage_lighting';
import { AIR_SAMPLES } from './air_beams';
import {
  QUALITY_SETTINGS,
  GUIDE_SETTINGS,
  RESOLUTION_SCALES,
  RENDER_SCALES,
  QualityGovernor,
  loadQualitySettings,
  saveQualitySettings,
  startingLevel,
} from './quality';

/**
 * THREE.Vector3 round prototype override.
 * Allows for precision-specified rounding
 *
 * @param {Number} digits Decimal place of rounding
 * @returns {Object} THREE.Vector3 instance
 * @todo put every overrides in an override.js module
 */
THREE.Vector3.prototype.round = function vector3RoundPolyfill(digits) {
  const e = 10 ** (digits || 0);
  this.x = Math.round(this.x * e) / e;
  this.y = Math.round(this.y * e) / e;
  this.z = Math.round(this.z * e) / e;
  return this;
};

/**
 * Default visualizer preferences values
 *
 * @constant
 * @type {String}
 * @default
 */
const DEFAULT_PREFERENCES = {
  HAZE_DENSITY: 50,
  EXPOSURE: 100,
  GLOBAL_BRIGHTNESS: 80,
};

/**
 * Floor size in meters (square, centred on the origin)
 *
 * @constant {Number}
 */
const FLOOR_SIZE = 50;

/**
 * Floor brightness without beam light, at a global brightness of 100
 *
 * @constant {Number}
 */
const FLOOR_AMBIENT = 0.16;

/**
 * Tint of the checkerboard floor (albedo): darker and slightly cool, like a stage floor
 *
 * @constant {THREE.Color}
 */
const FLOOR_TINT = new THREE.Color(0.58, 0.6, 0.64);

/**
 * Light on fixture bodies at a global brightness of 100: a key light and a sky/ground ambient
 *
 * @constant {Object}
 */
const BODY_LIGHT = {
  KEY: 1.5,
  SKY: 2.5,
  SKY_COLOR: 0xb8c4d6,
  GROUND_COLOR: 0x3a3430,
};

/**
 * @class
 * @classdesc WebGL Visualizer instance
 */
class Visualizer {
  /**
   * Constructs Visualizer instance
   *
   * @param {Object} domElement handle to domElement to be used by the WEBGL renderer
   * @param {Object} [options]
   * @param {Boolean} [options.showcase=false] Presentation mode (the user manual's hero): no
   * editor helpers (grid, axes, orbit and transform controls, stats), a plain matte floor, no
   * render loop of its own (the caller calls render(t)), and quality settings that are neither
   * read from nor written to this device's storage
   * @param {Object} [options.quality] Quality settings to use instead of the stored ones
   */
  constructor(domElement, options = {}) {
    this.domElement = domElement;
    this.showcase = Boolean(options.showcase);
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.animation = null;
    /**
     * Draws patched fixtures from the universes' DMX frames (see fixture_renderer.js)
     */
    this.fixtureRenderer = null;
    /**
     * Per-beam state read by the lighting passes
     */
    this.beamState = new BeamState();
    /**
     * Beam light on the stage (quality levels, guides)
     */
    this.lighting = null;
    /**
     * Quality settings stored on this device (never in the showfile)
     */
    this.qualitySettings = options.quality ? { ...options.quality } : loadQualitySettings();
    this.governor = null;
    this.floorMaterial = null;
    this._hazeDensity = DEFAULT_PREFERENCES.HAZE_DENSITY;
    this._exposure = DEFAULT_PREFERENCES.EXPOSURE;
    /**
     * Whether something changed since the last drawn frame (render on demand)
     */
    this.needsRender = true;
    this.lastFrameAt = null;
    this.lastView = new THREE.Matrix4();
    this.lastProjection = new THREE.Matrix4();
    this.finalComposer = null;
    this.globalBrightness = 100;
    this.globalLightHandle = null;
    this.autoRotate = false;
    this.autoFocus = true;
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.style.position = 'absolute';
  }

  /**
   * Initialises WebGL Visualizer instance
   *
   * @public
   * @async
   */
  async init() {
    await ModelInstancer.init(`${import.meta.env.VITE_STATIC_URL}/visualizer/models/model_list.json`);
    this.prepareRenderer();
    this.prepareCamera();
    if (!this.showcase) this.prepareControls();
    this.prepareLighting();
    this.resize();
    if (!this.showcase) {
      Controls.init(this.camera, this.domElement, this.controls);
      Controls.handle.addEventListener('change', this.invalidate);
      this.startRender();
    }
    this.main();
    this.resize();
  }

  /**
   * Visualizer preferences
   *
   * @type {Object}
   */
  set preferences(preferences) {
    if (preferences) {
      this.globalBrightness = preferences.globalBrightness;
      this.exposure = preferences.exposure;
      // Showfiles from before Haze (fog settings only) open with the default density: their beams
      // always showed, fogging only added moving noise
      this.hazeDensity = preferences.hazeDensity;
    }
  }

  /**
   * Haze density, 0 to 100 (0 hides beams in the air)
   *
   * @type {Number}
   */
  set hazeDensity(value) {
    const density = Number.isFinite(value) ? value : DEFAULT_PREFERENCES.HAZE_DENSITY;
    this._hazeDensity = Math.min(Math.max(density, 0), 100);
    this.applyHaze();
  }

  get hazeDensity() {
    return this._hazeDensity;
  }

  /**
   * Exposure, 25 to 400 (%): brightness of everything the beams light and the whole picture's tone
   * curve, for a physically accurate (100) or a more readable view
   *
   * @type {Number}
   */
  set exposure(value) {
    const exposure = Number.isFinite(value) ? value : DEFAULT_PREFERENCES.EXPOSURE;
    this._exposure = Math.min(Math.max(exposure, 25), 400);
    if (this.lighting) this.lighting.setExposure(this._exposure / 100);
    this.invalidate();
  }

  get exposure() {
    return this._exposure;
  }

  /**
   * Passes the haze settings to the lighting
   *
   * @private
   */
  applyHaze() {
    if (this.lighting) this.lighting.setHaze(this._hazeDensity);
    this.invalidate();
  }

  /**
   * Global scene brightness
   *
   * @type {Number}
   */
  set globalBrightness(value) {
    this._globalBrightness = value ? value / 100 : DEFAULT_PREFERENCES.GLOBAL_BRIGHTNESS;
    if (this.globalLightHandle) {
      this.globalLightHandle.intensity = this._globalBrightness * BODY_LIGHT.KEY;
    }
    if (this.skyLightHandle) {
      this.skyLightHandle.intensity = this._globalBrightness * BODY_LIGHT.SKY;
    }
    if (this.floorMaterial) {
      this.floorMaterial.color.copy(FLOOR_TINT)
        .multiplyScalar(this._globalBrightness * FLOOR_AMBIENT);
    }
    if (this.lighting) this.lighting.setAmbient(this._globalBrightness * FLOOR_AMBIENT);
    this.invalidate();
  }

  get globalBrightness() {
    return this._globalBrightness * 100;
  }

  /**
   * Global scene brightness
   *
   * @type {Number}
   */
    set autoFocus(value) {
      Controls.autoFocus = value;
    }
  
    get autoFocus() {
      return Controls.autoFocus;
    }

  /**
   * Controls auto-rotation state
   * 
   * @type {Boolean}
   */
  set autoRotate(value) {
    if(this.controls){
      this.controls.autoRotate = value;
    }
  }

  get autoRotate(){
    if(this.controls){ 
      return this.controls.autoRotate
    }
    return false;
  }

  /**
   * Quality setting index (see QUALITY_OPTIONS): Auto, Guides, Low, Medium, High
   *
   * @type {Number}
   */
  set quality(index) {
    const quality = Visualizer.QUALITY_OPTIONS[index];
    if (!quality) return;
    if (quality === QUALITY_SETTINGS.AUTO && this.qualitySettings.quality !== quality) {
      this.governor = null;
    }
    this.qualitySettings.quality = quality;
    this.saveQuality();
  }

  get quality() {
    return Visualizer.QUALITY_OPTIONS.indexOf(this.qualitySettings.quality);
  }

  /**
   * Resolution scale index of the lighting (see RESOLUTION_SCALES), used when quality isn't Auto
   *
   * @type {Number}
   */
  set resolutionScale(index) {
    if (RESOLUTION_SCALES[index] === undefined) return;
    this.qualitySettings.scale = RESOLUTION_SCALES[index];
    this.saveQuality();
  }

  get resolutionScale() {
    return RESOLUTION_SCALES.indexOf(this.qualitySettings.scale);
  }

  /**
   * Beam guides setting index (see GUIDE_OPTIONS): Auto, On, Off
   *
   * @type {Number}
   */
  set beamGuides(index) {
    const guides = Visualizer.GUIDE_OPTIONS[index];
    if (!guides) return;
    this.qualitySettings.guides = guides;
    this.saveQuality();
  }

  get beamGuides() {
    return Visualizer.GUIDE_OPTIONS.indexOf(this.qualitySettings.guides);
  }

  /**
   * Render resolution index (see RENDER_SCALES): pixel ratio of the whole view
   *
   * @type {Number}
   */
  set renderScale(index) {
    if (RENDER_SCALES[index] === undefined) return;
    this.qualitySettings.renderScale = RENDER_SCALES[index];
    this.saveQuality();
  }

  get renderScale() {
    return RENDER_SCALES.indexOf(this.qualitySettings.renderScale);
  }

  /**
   * Quality level and lighting resolution in use (with Auto, the governor's choice)
   *
   * @type {Object}
   */
  get effectiveQuality() {
    return {
      level: this.lighting ? this.lighting.level : null,
      scale: this.lighting ? this.lighting.scale : null,
      guides: this.lighting ? this.lighting.guides : null,
    };
  }

  /**
   * Stores the quality settings on this device and applies them
   *
   * @private
   */
  saveQuality() {
    if (!this.showcase) saveQualitySettings(this.qualitySettings);
    this.applyQuality();
  }

  /**
   * Applies the quality settings (or the governor's choice with Auto) to the lighting
   *
   * @private
   */
  applyQuality() {
    if (!this.lighting) return;
    const {
      quality, scale, guides, renderScale,
    } = this.qualitySettings;
    if (this.renderer.getPixelRatio() !== renderScale) {
      this.renderer.setPixelRatio(renderScale);
      this.lighting.resize();
    }
    const auto = quality === QUALITY_SETTINGS.AUTO;
    if (auto && !this.governor) {
      this.governor = new QualityGovernor(startingLevel(this.renderer.getContext()));
    }
    const level = auto ? this.governor.level : quality;
    this.lighting.level = level;
    if (this.fixtureRenderer) this.fixtureRenderer.setModelLevel(level);
    this.lighting.scale = auto ? this.governor.scale : scale;
    this.lighting.airSamples = auto ? this.governor.airSamples : AIR_SAMPLES[0];
    this.lighting.guides = guides === GUIDE_SETTINGS.ON
      || (guides === GUIDE_SETTINGS.AUTO && level === QUALITY_LEVELS.GUIDES);
    this.invalidate();
  }

  /**
   * Asks for a new frame (nothing is drawn while nothing changes)
   *
   * @public
   */
  invalidate = () => {
    this.needsRender = true;
  };

  get showData() {
    return {
      hazeDensity: this.hazeDensity,
      exposure: this.exposure,
      globalBrightness: this.globalBrightness,
      autoRotate: this.autoRotate,
    };
  }

  /**
   * Recenters the camera to point at (0,0,0)
   */
  recenter(){
    Controls.setFocus(false);
  }

  /**
   * Starts rendering loop.
   * Pools the rendering function into the animation manager's pool
   *
   * @public
   */
  startRender() {
    if (!this.animation) {
      this.stats.dom.style.display = 'initial';
      this.animation = AnimationManager.add(this.render.bind(this));
    }
  }

  /**
   * Stops rendering loop.
   * Removes of the rendering function from the animation manager's pool
   *
   * @public
   */
  stopRender() {
    if (this.animation) {
      AnimationManager.dispose(this.animation);
      this.animation = null;
    }
  }

  /**
   * Sets up visualizer environment
   *
   * @public
   * @async
   */
  async main() {
    // Body light: a key light and a sky/ground ambient, so fixture bodies read in the dark
    this.globalLightHandle = new THREE.DirectionalLight('white', this._globalBrightness * BODY_LIGHT.KEY);
    this.globalLightHandle.castShadow = false;
    this.globalLightHandle.position.set(-10, -10, 10);
    this.skyLightHandle = new THREE.HemisphereLight(BODY_LIGHT.SKY_COLOR, BODY_LIGHT.GROUND_COLOR,
      this._globalBrightness * BODY_LIGHT.SKY);
    this.skyLightHandle.position.set(0, 0, 1);

    GeometryFixture.prepareInstanciation(SceneManager);
    this.fixtureRenderer = new FixtureRenderer(this.invalidate);
    if (this.lighting) this.fixtureRenderer.setModelLevel(this.lighting.level);

    // Floor: the checkerboard, or a plain matte surface in showcase mode
    const texture = this.showcase ? Visualizer.plainTexture() : await new THREE.TextureLoader()
      .setPath(import.meta.env.VITE_STATIC_URL)
      .loadAsync('./visualizer/textures/environment/checkerboard_default.jpg');

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    if (!this.showcase) texture.repeat.set(8, 8);

    if (this.showcase) {
      this.addFloor(texture);
      return;
    }

    const gridHelper = new InfiniteGridHelper(5, 100, new THREE.Color('white'), 100);
    gridHelper.rotateX(Math.PI / 2.0);
    gridHelper.position.setZ(-0.3);
    SceneManager.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(2);

    axesHelper.material.depthTest = false;
    axesHelper.renderOrder = 999;

    axesHelper.material.transparent = true;
    axesHelper.material.opacity = 0.8;

    axesHelper.setColors(
      new THREE.Color('#ff4d4d'), // X
      new THREE.Color('#4dff88'), // Y
      new THREE.Color('#4da6ff')  // Z
    );

    this.addFloor(texture);
    SceneManager.add(axesHelper);
  }

  /**
   * Adds the floor, a beam light receiver, and the body lights aimed at it
   *
   * @private
   * @param {THREE.Texture} texture Floor albedo map
   */
  addFloor(texture) {
    // The floor is unlit: beam light is added by the lighting passes (see stage_lighting.js)
    this.floorMaterial = new THREE.MeshBasicMaterial({ map: texture });
    this.floorMaterial.color.copy(FLOOR_TINT).multiplyScalar(this._globalBrightness * FLOOR_AMBIENT);

    const floor_geometry = new THREE.BoxGeometry(FLOOR_SIZE, FLOOR_SIZE, 0.5, 1, 1, 1);
    const floor = new THREE.Mesh(floor_geometry, this.floorMaterial);
    floor.position.setZ(-0.25);
    this.lighting.addReceiver(floor, new THREE.MeshBasicMaterial({ map: texture, color: FLOOR_TINT }));
    this.lighting.setFloor(texture, FLOOR_SIZE, FLOOR_TINT);

    this.globalLightHandle.target = floor;

    SceneManager.add(this.globalLightHandle, this.skyLightHandle, floor);
    this.invalidate();
  }

  /**
   * Prepares the beam lighting and applies the stored quality settings
   *
   * @public
   */
  prepareLighting() {
    this.lighting = new StageLighting(this.renderer, SceneManager, this.camera, this.beamState);
    this.applyQuality();
    this.applyHaze();
    this.lighting.setAmbient(this._globalBrightness * FLOOR_AMBIENT);
    this.lighting.setExposure(this._exposure / 100);
    this.domElement.addEventListener('pointermove', this.invalidate);
    this.domElement.addEventListener('pointerdown', this.invalidate);
    this.domElement.addEventListener('pointerup', this.invalidate);
    this.domElement.addEventListener('wheel', this.invalidate);
    window.addEventListener('keydown', this.invalidate);
  }

  /**
   * Prepares WebGL renderer
   *
   * @public
   */
  prepareRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.domElement,
      antialias: true,
    });

    this.renderer.autoClear = true;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.physicallyCorrectLights = true;
    // Pixel ratio of the view: the Render resolution setting (applyQuality), 80% by default
    this.renderer.setPixelRatio(this.qualitySettings.renderScale);
    // Neutral keeps hues (ACES turned saturated blues purple and greyed colours)
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  /**
   * Prepares Visualizer's camera
   *
   * @public
   */
  prepareCamera() {
    const width = this.domElement.offsetWidth;
    const height = this.domElement.clientHeight;
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.01, 1000);
    this.camera.up.set(0, 0, 1);
    this.camera.position.y = 40;
    this.camera.position.z = 10;
    this.camera.position.x = 40;
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Prepares Visualizer's camera controls
   *
   * @public
   */
  prepareControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.screenSpacePannning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 5
    AnimationManager.add(() => {
      this.controls.update();
    });
  }

  /**
   * Resize handler.
   * Handles renderer's resizing and ensures preservation of screen aspect ratio.
   *
   * @public
   */
  resize() {
    const width = this.domElement.offsetWidth;
    const height = this.domElement.clientHeight;
    const aspect = width / height;
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.renderer.setSize(width, height);
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
      if (this.lighting) this.lighting.resize();
      this.invalidate();
    }
  }

  /**
   * Compiles the programs that are otherwise first needed when something gets selected (the
   * move/rotate gizmo and the selection box): one frame is drawn with the first fixture
   * selected, then the selection is put back. Run once, at boot, behind the splash, so the
   * first selection during a show doesn't stall the main thread (and DMX output with it).
   *
   * @public
   * @returns {Boolean} Whether it ran (false while no fixture is patched)
   */
  warmUp() {
    const renderer = this.fixtureRenderer;
    const [firstId] = renderer ? renderer.instances.keys() : [];
    if (firstId === undefined) return false;
    const previous = renderer.selection || { ids: [], gizmo: false };
    renderer.setSelection([firstId], true);
    this.camera.updateMatrixWorld();
    this.lighting.render();
    renderer.setSelection(previous.ids, previous.gizmo);
    this.invalidate();
    return true;
  }

  /**
   * Render function: decodes changed fixtures, then draws a frame only when something changed
   * (DMX, camera, gizmo, settings, a running beam animation)
   *
   * @public
   * @param {Number} t Time in seconds
   */
  render(t) {
    if (this.fixtureRenderer && this.fixtureRenderer.update()) this.needsRender = true;
    this.beamState.begin();
    if (GeometryFixture.update(t, this.beamState)) this.needsRender = true;
    this.beamState.end();
    this.camera.updateMatrixWorld();
    if (Visualizer.matrixMoved(this.lastView, this.camera.matrixWorld)
      || Visualizer.matrixMoved(this.lastProjection, this.camera.projectionMatrix)) {
      this.lastView.copy(this.camera.matrixWorld);
      this.lastProjection.copy(this.camera.projectionMatrix);
      this.needsRender = true;
    }
    if (!this.needsRender) {
      this.lastFrameAt = null;
      return;
    }
    this.needsRender = false;
    const now = performance.now();
    this.lighting.render();
    const work = performance.now() - now;
    if (this.governor && this.lastFrameAt !== null
      && this.qualitySettings.quality === QUALITY_SETTINGS.AUTO
      && this.governor.sample(now - this.lastFrameAt, work, now)) {
      this.applyQuality();
    }
    this.lastFrameAt = now;
  }
}

/**
 * Whether a matrix moved since its last copy. Orbit controls recompute the camera every frame,
 * which changes the last bits of its matrix even when it stands still.
 *
 * @param {THREE.Matrix4} last Last copy
 * @param {THREE.Matrix4} current Current matrix
 * @returns {Boolean} Whether an element changed by more than 1e-6
 */
Visualizer.matrixMoved = (last, current) => {
  for (let i = 0; i < 16; i++) {
    if (Math.abs(last.elements[i] - current.elements[i]) > 1e-6) return true;
  }
  return false;
};

/**
 * A 1×1 white texture: a plain floor whose colour comes from the floor tint
 *
 * @returns {THREE.DataTexture} Texture
 */
Visualizer.plainTexture = () => {
  const texture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  texture.needsUpdate = true;
  return texture;
};

/**
 * Quality setting options, in the order the settings popup lists them
 *
 * @type {Array<String>}
 */
Visualizer.QUALITY_OPTIONS = [
  QUALITY_SETTINGS.AUTO,
  QUALITY_SETTINGS.GUIDES,
  QUALITY_SETTINGS.LOW,
  QUALITY_SETTINGS.MEDIUM,
  QUALITY_SETTINGS.HIGH,
];

/**
 * Beam guides setting options, in the order the settings popup lists them
 *
 * @type {Array<String>}
 */
Visualizer.GUIDE_OPTIONS = [GUIDE_SETTINGS.AUTO, GUIDE_SETTINGS.ON, GUIDE_SETTINGS.OFF];

export default Visualizer;
