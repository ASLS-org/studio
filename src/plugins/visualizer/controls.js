import * as THREE from 'three';
import {
  TransformControls,
} from 'three/examples/jsm/controls/TransformControls.js';
import SceneManager from './scene_manager';

/**
 * Global position vector handle
 *
 * @constant {Object} position
 */
const position = new THREE.Vector3();
/**
 * Global position vector handle
 *
 * @constant {Object} position2
 */
const position2 = new THREE.Vector3();
/**
 * Global quaternion handle
 *
 * @constant {Object} quaternion
 */
const quaternion = new THREE.Quaternion();
/**
 * Global euler handle
 *
 * @constant {Object} euler
 */
const euler = new THREE.Euler();
/**
 * Controls display mode enumeration
 *
 * @constant {Object} CONTROL_MODES
 * @enum {number}
 */
const CONTROL_MODES = {
  NORMAL: 0, // Normal mode, helpers shown
  DISCRETE: 1, // Discrete mode, helpers disabled
};

/**
 * Bounding box material
 *
 * @constant {Object} boundingBoxMaterial
 */
const boundingBoxMaterial = new THREE.MeshBasicMaterial({
  color: 'rgb(162, 45, 88)',
  transparent: true,
  opacity: 0.15,
  side: THREE.DoubleSide,
});
/**
 * Bounding box edges material
 *
 * @constant {Object} boundingBoxEdgesMaterial
 */
const boundingBoxEdgesMaterial = new THREE.LineBasicMaterial({
  color: 'rgb(162, 45, 88)',
  linewidth: 1,
  transparent: true,
  side: THREE.DoubleSide,
});
/**
 * Bounding box geometry
 *
 * @constant {Object} boundingBoxGeometry
 */
const boundingBoxGeometry = new THREE.BoxGeometry();
/**
 * Bounding box edges geometry
 *
 * @constant {Object} boundingBoxEdgesGeometry
 */
const boundingBoxEdgesGeometry = new THREE.EdgesGeometry(boundingBoxGeometry);
/**
 * Bounding box edges 3D instance
 *
 * @constant {Object} boundingBoxEdges
 */
const boundingBoxEdges = new THREE.LineSegments(boundingBoxEdgesGeometry, boundingBoxEdgesMaterial);
/**
 * Default focus out camera position
 *
 * @constant {Object} DEFAULT_ZOOM_OUT_ENDPOS
 */
const DEFAULT_ZOOM_OUT_ENDPOS = new THREE.Vector3(0, 30, 5);

/**
 * @class Controls
 * @classdesc Singleton for handling 3D instances control (translation, rotation)
 */
class Controls {
  constructor() {
    /* eslint-disable no-use-before-define */
    // Ensuring singlelessness
    if (!controlsInstance) {
      // Initialising THREE.TransformControls handle
      this.handle = null;
      // Setiting up control mode
      this.mode = CONTROL_MODES.DISCRETE;
      // Initilising instance pool
      this.pooledInstances = [];
      // Preparing bounding box object
      this.boundingBox = {
        min: new THREE.Vector3(),
        max: new THREE.Vector3(),
      };
      // Instanciating bounding box mesh
      this.boundingBoxMesh = new THREE.Mesh(boundingBoxGeometry, boundingBoxMaterial);
      // Adding bounding box edges to bounding box mesh
      this.boundingBoxMesh.add(boundingBoxEdges);
      this.animationId = null;
      this.focusTransitionDuration = 1000;
      controlsInstance = this;
    }
    // eslint-disable-next-line no-constructor-return
    return controlsInstance;
    /* eslint-enable no-use-before-define */
  }

  /**
   * Initialises controls
   *
   * @param {Object} camera Handle to camera instance
   * @param {Object} el Handle to renderer dom element
   * @param {Object} orbitcontrolsControlsHandle Handle to camera controls
   */
  init(camera, el, orbitcontrolsControlsHandle) {
    this.groupedInstances = new THREE.Group(); // Creating new group instance
    this.handle = new TransformControls(camera, el); // Loding transformcontrol instance into handle
    this.handle.size = 1; // Setting default handle size
    this.handle.translationSnap = 0.5; // Setting default handle translation snap
    // this.handle.rotationSnap = 0.0872665 //Setting default handle rotation snap
    this.handle.mode = 'translate'; // Setting default handle mode
    this.controlHandle = orbitcontrolsControlsHandle;
    this.cameraHandle = camera;
    SceneManager.add(this.groupedInstances, this.handle); // Adding instances to scene
    this.handle.addEventListener('mouseDown', () => { // Listening for mousedown events on control helpers
      this.controlHandle.enabled = false; // Disabling camera controls to enable user interaction
    });
    this.handle.addEventListener('mouseUp', () => { // Listening for mouseup events on control helpers
      this.controlHandle.enabled = true; // Enabling camera control
      this.showHelpers(); // Update modifications
    });
    this.controlHandle.domElement.addEventListener('mousedown', () => {
      cancelAnimationFrame(this.rafID);
    });
    this.controlHandle.domElement.addEventListener('wheel', () => {
      cancelAnimationFrame(this.rafID);
    });
    window.addEventListener('keydown', this.handleKeydown.bind(this)); // Listen for keydown events
  }

  /**
   * Handles keydown events in order to switch between different modes
   *
   * @pmublic
   * @param {Object} e keydown event
   */
  handleKeydown(e) {
    if (e.repeat) return;
    if (e.key === 'Escape') {
      this.mode = CONTROL_MODES.DISCRETE;
      this.showHelpers();
      this.handle.setMode('translate');
      this.detachAll();
      this.setFocus(false);
    } else if (e.key.toLowerCase() === 't') {
      this.mode = CONTROL_MODES.NORMAL;
      this.handle.setMode('translate');
      this.showHelpers();
    } else if (e.key.toLowerCase() === 'r') {
      this.mode = CONTROL_MODES.NORMAL;
      this.handle.setMode('rotate');
      this.showHelpers();
    } else if (e.key.toLowerCase() === 'z' && e.ctrlKey) {
      this.applyTransformation();
    } else if (e.key.toLowerCase() === 'h') {
      this.mode = CONTROL_MODES.DISCRETE;
      this.showHelpers();
      this.handle.setMode('translate');
    }
  }

  setFocus(state) {
    this.cameraHandle.updateMatrixWorld();
    const startPos = new THREE.Vector3();
    startPos.setFromMatrixPosition(this.cameraHandle.matrixWorld);
    const startTPos = this.controlHandle.target.clone();
    const endPos = state ? this.groupedInstances.position.clone() : DEFAULT_ZOOM_OUT_ENDPOS;
    const startTime = performance.now();

    const dX = (endPos.x - startPos.x);
    const dY = state ? 0 : (endPos.y - startPos.y);
    const dZ = state ? ((endPos.z - startPos.z) - 0) : (endPos.z - startPos.z);

    const dTX = state ? (endPos.x - startTPos.x) : -startTPos.x;
    const dTY = state ? (endPos.y - startTPos.y) : -startTPos.y;
    const dTZ = state ? (endPos.z - startTPos.z) : -startTPos.z;

    const animationFunction = () => {
      const time = performance.now() - startTime;
      const animationPercentage = Math.sin(((time / this.focusTransitionDuration) * Math.PI) / 2);
      if (time < this.focusTransitionDuration && animationPercentage <= 1.0) {
        this.cameraHandle.position.setX(startPos.x + dX * animationPercentage);
        this.cameraHandle.position.setY(startPos.y + dY * animationPercentage);
        this.cameraHandle.position.setZ(startPos.z + dZ * animationPercentage);
        this.controlHandle.target.setX(startTPos.x + dTX * animationPercentage);
        this.controlHandle.target.setY(startTPos.y + dTY * animationPercentage);
        this.controlHandle.target.setZ(startTPos.z + dTZ * animationPercentage);
        this.rafID = requestAnimationFrame(animationFunction.bind(this));
      }
    };
    this.rafID = requestAnimationFrame(animationFunction.bind(this));
  }

  /**
   * Applies transformation to pooled instances
   *
   * @public
   */
  applyTransformation() {
    for (let i = this.groupedInstances.children.length - 1; i >= 0; i--) {
      const child = this.groupedInstances.children[i];
      child.updateMatrixWorld();
      child.getWorldPosition(position);
      child.getWorldQuaternion(quaternion);
      this.groupedInstances.remove(child);
      SceneManager.add(child);
      const instanceHandle = this.pooledInstances.find((h) => h._3DModel._dummy === child);
      if (instanceHandle) {
        instanceHandle.position = position.round(2);
        euler.setFromQuaternion(quaternion);
        instanceHandle.rotation = {
          x: Math.round(THREE.MathUtils.radToDeg(euler.x)),
          y: Math.round(THREE.MathUtils.radToDeg(euler.y)),
          z: Math.round(THREE.MathUtils.radToDeg(euler.z)),
        };
      }
    }
    this.hideHelpers();
  }

  /**
   * Disables controls helpers
   *
   * @public
   */
  hideHelpers() {
    this.handle.detach();
    SceneManager.remove(this.groupedInstances, this.boundingBoxMesh);
  }

  /**
   * Enables controls helpers and computes bounding box.
   * Applies 3D instances translation following origin shift
   * to bounding boxe's origin.
   *
   * @public
   */
  showHelpers() {
    if (this.pooledInstances.length) {
      this.applyTransformation();

      this.groupedInstances = new THREE.Group();
      this.boundingBoxMesh = new THREE.Mesh(boundingBoxGeometry, boundingBoxMaterial);
      this.boundingBoxMesh.add(boundingBoxEdges); // Adding bounding box edges to bounding box mesh

      SceneManager.add(this.groupedInstances, this.boundingBoxMesh);

      this.pooledInstances.forEach((i) => {
        this.groupedInstances.add(i._3DModel._dummy);
      });

      this.boundingBox.min.x = Math.min(...this.pooledInstances.map((i) => i.position.x - 0.51));
      this.boundingBox.min.y = Math.min(...this.pooledInstances.map((i) => i.position.y - 0.51));
      this.boundingBox.min.z = Math.min(...this.pooledInstances.map((i) => i.position.z - 0.51));
      this.boundingBox.max.x = Math.max(...this.pooledInstances.map((i) => i.position.x + 0.51));
      this.boundingBox.max.y = Math.max(...this.pooledInstances.map((i) => i.position.y + 0.51));
      this.boundingBox.max.z = Math.max(...this.pooledInstances.map((i) => i.position.z + 0.51));

      const bbW = (this.boundingBox.max.x - this.boundingBox.min.x);
      const bbH = (this.boundingBox.max.y - this.boundingBox.min.y);
      const bbD = (this.boundingBox.max.z - this.boundingBox.min.z);

      this.boundingBoxMesh.scale.x = bbW;
      this.boundingBoxMesh.scale.y = bbH;
      this.boundingBoxMesh.scale.z = bbD;
      this.boundingBoxMesh.position.set(
        this.boundingBox.min.x + bbW / 2,
        this.boundingBox.min.y + bbH / 2,
        Math.max(this.boundingBox.min.z + bbD / 2, 0.51),
      );

      this.boundingBoxMesh.updateMatrixWorld();
      this.boundingBoxMesh.getWorldPosition(position2);
      this.groupedInstances.updateMatrixWorld();
      this.groupedInstances.children.forEach((child) => {
        child.updateMatrixWorld(true);
        child.getWorldPosition(position);
        child.position.setX(position.x - position2.x);
        child.position.setY(position.y - position2.y);
        child.position.setZ(position.z - Math.max(position2.z, 0));
      });

      this.groupedInstances.updateMatrixWorld();
      this.boundingBoxMesh.getWorldPosition(position2);
      this.groupedInstances.position.copy(position2);
      if (this.mode !== CONTROL_MODES.DISCRETE) {
        this.handle.attach(this.groupedInstances);
      }
      this.groupedInstances.attach(this.boundingBoxMesh);

      this.setFocus(true);
    }
  }

  /**
   * Clears all pooled instances from pool
   *
   * @public
   */
  clearAllPooledInstances() {
    for (let i = this.pooledInstances.length - 1; i >= 0; i--) {
      this.clearPooledInstance(this.pooledInstances[i]);
    }
  }

  /**
   * Clears a single Fixture instance from pool
   *
   * @param {Object} instance handle to Fixture instance to be cleared
   * @public
   */
  clearPooledInstance(instance) {
    const index = this.pooledInstances.findIndex((i) => i === instance);
    if (index > -1) {
      this.pooledInstances.splice(index, 1);
    }
  }

  /**
   * Attaches controls to a Fixture instance
   *
   * @param {Object} instance handle to Fixture instance to be attached
   * @public
   */
  attach(instance) {
    this.applyTransformation();
    this.pooledInstances.push(instance);
    this.showHelpers();
  }

  /**
   * Detaches controls from a Fixture instance
   *
   * @param {Object} instance handle to Fixture instance to be attached
   * @public
   */
  detach() {
    this.applyTransformation();
    this.clearAllPooledInstances();
  }

  /**
   * Detaches controls from every Fixture instance in pool
   *
   * @public
   */
  detachAll() {
    this.applyTransformation();
    this.clearAllPooledInstances();
  }
}

// eslint-disable-next-line vars-on-top, no-var, import/no-mutable-exports
var controlsInstance = new Controls(); // Instanciating Controls
export default controlsInstance; // Exporting handle to Controls instance
