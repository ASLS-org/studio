/* eslint-disable */
// TODO: find a way for the linter to accept node_module nested libs
import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import ModelInstancer from './model_instancer';
import SceneManager from './scene_manager';
import AnimationManager from './animation_manager';
import Controls from './controls';
import MovingHead from './moving_head';
import InfiniteGridHelper from './grid';

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
  FOGGING_STATE: true,
  FOGGING_DENSITY: 0,
  GLOBAL_FOGGING_TURBULENCES: 0,
  GLOBAL_BRIGHTNESS: 80,
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
   */
  constructor(domElement) {
    this.domElement = domElement;
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.animation = null;
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
    await ModelInstancer.init('/visualizer/models/model_list.json');
    this.prepareRenderer();
    this.prepareCamera();
    this.prepareControls();
    this.resize();
    Controls.init(this.camera, this.domElement, this.controls);
    this.startRender();
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
      this.globalFoggingDensity = preferences.globalFoggingDensity;
      this.globalFoggingState = preferences.globalFoggingState;
      this.globalFoggingTurbulences = preferences.globalFoggingTurbulences;
    }
  }

  /**
   * Global scene fogging state
   * @type {Boolean}
   * @param {boolean} value
   */
  // eslint-disable-next-line class-methods-use-this
  set globalFoggingState(value) {
    MovingHead.fogState = value || DEFAULT_PREFERENCES.GLOBAL_FOGGING_STATE;
  }

  // eslint-disable-next-line class-methods-use-this
  get globalFoggingState() {
    return MovingHead.fogState ? 1 : 0;
  }

  /**
   * Global scene fogging density
   *
   * @type {Number}
   */
  // eslint-disable-next-line class-methods-use-this
  set globalFoggingDensity(value) {
    MovingHead.fogDensity = value ? value / 100 : DEFAULT_PREFERENCES.GLOBAL_FOGGING_DENSITY;
  }

  // eslint-disable-next-line class-methods-use-this
  get globalFoggingDensity() {
    return MovingHead.fogDensity * 100;
  }

  /**
   * Global scene fogging turbulence
   *
   * @type {Number}
   */
  // eslint-disable-next-line class-methods-use-this
  set globalFoggingTurbulences(value) {
    MovingHead.fogTurbulence = value ? value / 50 : DEFAULT_PREFERENCES.GLOBAL_FOGGING_TURBULENCES;
  }

  // eslint-disable-next-line class-methods-use-this
  get globalFoggingTurbulences() {
    return MovingHead.fogTurbulence * 50;
  }

  /**
   * Global scene brightness
   *
   * @type {Number}
   */
  set globalBrightness(value) {
    this._globalBrightness = value ? value / 100 : DEFAULT_PREFERENCES.GLOBAL_BRIGHTNESS;
    if (this.globalLightHandle) {
      this.globalLightHandle.intensity = this._globalBrightness * 0.25;
    }
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

  get showData() {
    return {
      globalFoggingState: this.globalFoggingState,
      globalFoggingDensity: this.globalFoggingDensity,
      globalFoggingTurbulences: this.globalFoggingTurbulences,
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
    this.globalLightHandle = new THREE.DirectionalLight('white', this._globalBrightness * 100);
    this.globalLightHandle.castShadow = false;
    this.globalLightHandle.position.set(-10, -10, 10);

    MovingHead.prepareInstanciation(this.camera, SceneManager);

    AnimationManager.add((t) => {
      MovingHead.update(t);
    });

    // Floor
    const loader = new THREE.TextureLoader();
    const texture = await loader.loadAsync('/visualizer/textures/environment/checkerboard_default.jpg');

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);

    const gridHelper = new InfiniteGridHelper(5, 100, new THREE.Color('white'), 100);
    gridHelper.rotateX(Math.PI / 2.0);
    gridHelper.position.setZ(-0.3);
    SceneManager.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(2);

    const checkerMaterial = new THREE.MeshStandardMaterial({ map: texture });

    const sideMaterial = new THREE.MeshStandardMaterial();

    const floorMaterial = [];

    floorMaterial.push(sideMaterial);
    floorMaterial.push(sideMaterial);
    floorMaterial.push(sideMaterial);
    floorMaterial.push(sideMaterial);
    floorMaterial.push(checkerMaterial);

    const floor_geometry = new THREE.BoxGeometry(50, 50, 0.5, 1, 1, 1);
    const floor = new THREE.Mesh(floor_geometry, checkerMaterial);
    floor.position.setZ(-0.25);

    this.globalLightHandle.target = floor;

    SceneManager.add(this.globalLightHandle, floor, axesHelper);
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
    this.renderer.setPixelRatio(0.8); // Forcing pixel ratio to 1 to avoid unnecessary computations
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 1000);
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
    this.controls.maxPolarAngle = Math.PI / 2.1;
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
    }
  }

  /**
   * Render function
   *
   * @public
   */
  render() {
    this.renderer.render(SceneManager, this.camera);
  }
}

export default Visualizer;
