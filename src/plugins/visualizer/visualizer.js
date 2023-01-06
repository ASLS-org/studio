var THREE = window.THREE = require('three');

/**
 * THREE.Vector3 round prototype override.
 * Allows for precision-specified rounding
 * 
 * @param {Number} digits Decimal place of rounding
 * @returns {Object} THREE.Vector3 instance
 * @todo put every overrides in an override.js module
 */
THREE.Vector3.prototype.round = function (digits) {
  var e = Math.pow(10, digits || 0);
  this.x = Math.round(this.x * e) / e;
  this.y = Math.round(this.y * e) / e;
  this.z = Math.round(this.z * e) / e;
  return this;
}

import ModelInstancer from './model_instancer'
import SceneManager from './scene_manager'
import AnimationManager from './animation_manager';
import Controls from './controls'
import MovingHead from './moving_head'

require('three-orbitcontrols')
require('three/examples/js/shaders/CopyShader');
require('three/examples/js/postprocessing/EffectComposer');
require('three/examples/js/postprocessing/RenderPass');
require('three/examples/js/postprocessing/ShaderPass');
require('three/examples/js/shaders/FXAAShader');
require('three/examples/js/shaders/LuminosityHighPassShader');
require('three/examples/js/utils/BufferGeometryUtils.js');


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
  GLOBAL_BRIGHTNESS: 50
}


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
    this.globalBrightness = 80;
    this.globalLightHandle = null;
  }

  /**
   * Initialises WebGL Visualizer instance
   * 
   * @public
   * @async
   */
  async init() {
    await ModelInstancer.init("/visualizer/models/model_list.json");
    this.prepareRenderer();
    this.prepareCamera();
    this.prepareControls();
    this.resize();
    Controls.init(this.camera, this.domElement, this.controls);
    this.startRender();
    this.main();
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
   * 
   * @type {Boolean}
   */
  set globalFoggingState(value) {
    MovingHead.fogState = value ? value : DEFAULT_PREFERENCES.GLOBAL_FOGGING_STATE;
  }

  /**
   * Global scene fogging density
   * 
   * @type {Number}
   */
  set globalFoggingDensity(value) {
    MovingHead.fogDensity = value ? value / 100 : DEFAULT_PREFERENCES.GLOBAL_FOGGING_DENSITY;

  }

  /**
   * Global scene fogging turbulence
   * 
   * @type {Number}
   */
  set globalFoggingTurbulences(value) {
    MovingHead.fogTurbulence = value ? value / 50 : DEFAULT_PREFERENCES.GLOBAL_FOGGING_TURBULENCES;
  }

  /**
   * Global scene brightness
   * 
   * @type {Number}
   */
  set globalBrightness(value) {
    this._globalBrightness = value ? value / 100 : DEFAULT_PREFERENCES.GLOBAL_BRIGHTNESS;
    if (this.globalLightHandle) {
      this.globalLightHandle.intensity = this._globalBrightness;
    }
  }

  get globalFoggingState() {
    return MovingHead.fogState ? 1 : 0;
  }

  get globalFoggingDensity() {
    return MovingHead.fogDensity * 100;
  }

  get globalFoggingTurbulences() {
    return MovingHead.fogTurbulence * 50;
  }

  get globalBrightness() {
    return this._globalBrightness * 100;
  }

  get showData() {
    return {
      globalFoggingState: this.globalFoggingState,
      globalFoggingDensity: this.globalFoggingDensity,
      globalFoggingTurbulences: this.globalFoggingTurbulences,
      globalBrightness: this.globalBrightness
    }
  }

  /**
   * Starts rendering loop.
   * Pools the rendering function into the animation manager's pool
   * 
   * @public
   */
  startRender() {
    if (!this.animation) {
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

    let axesHelper = new THREE.AxesHelper(5);
    this.globalLightHandle = new THREE.DirectionalLight('white', this._globalBrightness);
    this.globalLightHandle.position.set(10, 2, 20);

    MovingHead.prepareInstanciation(this.camera, SceneManager);

    AnimationManager.add((t) => {
      MovingHead.update(t);
    })

    // Floor
    var loader = new THREE.TextureLoader()
    var texture = await loader.loadAsync('/visualizer/textures/environment/checkerboard_default.jpg')

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);

    var floor_geometry = new THREE.PlaneBufferGeometry(50, 50, 1, 1);
    var checkerMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      polygonOffset: true,
      polygonOffsetUnits: 2,
      polygonOffsetFactor: 1,
      depthWrite: true,
      depthTest: true,
      fog: true,
    })

    let floor = new THREE.Mesh(floor_geometry, checkerMaterial);

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
      antialias: true
    });
    this.renderer.autoClear = true;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.forwardRendering = false;
    this.renderer.toneMappingExposure = Math.pow(1.0, 2.0);
    var globalPlane = new THREE.Plane(new THREE.Vector3(0, 0, 0.1), 0.1);
    this.renderer.clippingPlanes = [globalPlane];
  }

  /**
   * Prepares Visualizer's camera
   * 
   * @public
   */
  prepareCamera() {
    var width = this.domElement.offsetWidth;
    var height = this.domElement.clientHeight;
    var aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
    this.camera.up.set(0, 0, 1)
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
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 5;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    AnimationManager.add(() => {
      this.controls.update();
    })
  }

  /**
   * Resize handler.
   * Handles renderer's resizing and ensures preservation of screen aspect ratio.
   * 
   * @public
   */
  resize() {
    var width = this.domElement.offsetWidth;
    var height = this.domElement.clientHeight;
    var aspect = width / height;
    if (this.width != width || this.height != height) {
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