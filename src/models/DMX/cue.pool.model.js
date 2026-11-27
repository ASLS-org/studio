import Effect from './effect.model';
import Scene from './scene.model';
import { toRaw } from '../utils/reactivity';

/**
 * Cue types enumeration
 *
 * @constant {Object} CUE_TYPES
 * @enum {Number}
 */
const CUE_TYPES = {
  SCENE: 0,
  EFFECT: 1,
};

/**
 * @class CuePool
 * @classdesc Pool of cue instances
 */
class CuePool {
  /**
   * @param {Array<Array>} [stage] the family stacks of the pool's group (claims.js)
   */
  constructor(stage = null) {
    this.cues = [];
    this.stage = stage;
  }

  /**
   * Pool's listable data
   *
   * @todo remove this ? Am I even using it ?
   * @readonly
   * @type {Array}
   */
  get listable() {
    return this.cues.map((cue) => cue.listable);
  }

  /**
   * Returns cue instance from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Object} Cue instance
   */
  getFromId(id) {
    const cue = this.cues.find((item) => item.id === id);
    if (cue) {
      return cue;
    }
    throw new Error('Cannot find cue in pool');
  }

  /**
   * Pushes existing cue into the pool
   *
   * @public
   * @param {Object} cue cue instance
   */
  addExisting(cue) {
    toRaw(cue).stage = this.stage;
    this.cues.push(cue);
  }

  /**
   * Creates a cue instance from configuration data, without adding it to the pool (Group.loadCues
   * reads an older cue's families before adding it)
   *
   * @public
   * @param {Object} cueData cue configuration object
   * @return {Object} Cue instance
   * @see Cue
   */
  build(cueData) {
    let cue;
    switch (cueData.type) {
      case CUE_TYPES.SCENE:
        cue = new Scene(cueData);
        break;
      case CUE_TYPES.EFFECT:
        cue = new Effect(cueData);
        break;
      default:
        throw new Error('Unsupported cue type provided.');
    }
    cue.id = cueData.id !== undefined ? cueData.id : this.genCueId();
    cue.stage = this.stage;
    return cue;
  }

  /**
   * Creates a new cue instance from provided configuraion data and pushes it to the pool
   *
   * @public
   * @param {Object} cueData cue configuration object
   * @return {Object} Cue instance
   * @see Cue
   */
  addRaw(cueData) {
    const cue = this.build(cueData);
    this.cues.push(cue);
    return cue;
  }

  /**
   * Removes cue from pool, stopping it first if it plays
   *
   * @public
   * @param {Object} cue cue instance handle
   */
  delete(cue) {
    const cueIndex = this.cues.findIndex((item) => item.id === cue.id);
    if (cueIndex > -1) {
      // Stopped at once (no fade-out), its claims released: playing, and from a chase item
      cue.stopNow();
      cue.releaseItem();
      this.cues.splice(cueIndex, 1);
    } else {
      throw new Error('Could not find cue in cue pool');
    }
  }

  /**
   * Clears all cue instances from pool
   *
   * @public
   */
  clearAll() {
    for (let i = this.cues.length - 1; i >= 0; i--) {
      this.delete(this.cues[i]);
    }
  }

  /**
   * Generates cue unique ID
   *
   * @public
   * @returns {Number} The cue's unique ID
   */
  genCueId() {
    return this.cues.reduce((max, cue) => Math.max(max, Number(cue.id)), -1) + 1;
  }

  /**
   * Manually remove cuePool reference from memory
   *
   * @private
   * @param {Object} instance handle to cuePool instance to be freed
   */
  static deleteInstance(instance) {
    Object.keys(instance).forEach((prop) => {
      delete instance[prop];
    });
    instance = null;
  }
}

export default CuePool;
