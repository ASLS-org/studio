import * as THREE from 'three';

/**
 * @class
 * @classdesc Singleton extension of THREE.Scene class
 * @extends THREE.Scene
 */
class SceneManager extends THREE.Scene {
  constructor() {
    // eslint-disable-next-line no-use-before-define
    if (!instance) {
      super();
      this.background = new THREE.Color('#0C0D0A');
      // this.background.convertLinearToSRGB();
      // eslint-disable-next-line no-use-before-define
      instance = this;
    }
    // eslint-disable-next-line no-use-before-define
    return instance;
  }
}

// eslint-disable-next-line vars-on-top, no-var, import/no-mutable-exports
var instance = new SceneManager();
export default instance;
