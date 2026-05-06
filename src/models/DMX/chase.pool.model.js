import {
  Proxify,
} from '../utils/proxify.utils';
import Chase from './chase.model';

/**
 * @class ChasePool
 * @extends {Proxify}
 * @classdesc Pool of chase instances
 */
class ChasePool extends Proxify {
  constructor() {
    super();
    this.chases = [];
    return this.proxify();
  }

  /**
   * Pool's listable data
   *
   * @todo remove this ? Am I even using it ?
   * @readonly
   * @type {Array}
   */
  get listable() {
    return this.chases.map((chase) => chase.listable);
  }

  /**
   * Returns chase instance from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Object} Chase instance
   */
  getFromId(id) {
    const chase = this.chases.find((item) => item.id === Number(id));
    if (chase) {
      return chase;
    }
    throw new Error('Cannot find chase in pool');
  }

  /**
   * Pushes existing chase into the pool
   *
   * @public
   * @param {Object} chase chase instance
   */
  addExisting(chase) {
    this.chases.push(chase); // TODO: replace with pushAndStackUndo once patched
  }

  /**
   * Creates a new chase instance from provided configuraion data and pushes it to the pool
   *
   * @public
   * @param {Object} chaseData chase configuration object
   * @return {Object} Chase instance
   * @see Chase
   */
  addRaw(chaseData) {
    const chase = new Chase(chaseData);
    chase.id = chaseData.id !== undefined ? chaseData.id : this.genChaseId();
    this.chases.push(chase); // TODO: replace with ..AndStackUndo once patched
    return chase;
  }

  /**
   * Removes chase from pool
   *
   * @public
   * @param {Object} chase chase instance handle
   */
  delete(chase) {
    const chaseIndex = this.chases.findIndex((item) => item.id === chase.id);
    if (chaseIndex > -1) {
      this.chases.splice(chaseIndex, 1); // TODO: replace with ..AndStackUndo once patched
      Chase.deleteInstance(chase);
    } else {
      throw new Error('Could not find chase in chase pool');
    }
  }

  /**
   * Clears all chase instances from pool
   *
   * @public
   */
  clearAll() {
    for (let i = this.chases.length - 1; i >= 0; i--) {
      this.delete(this.chases[i]);
    }
  }

  /**
   * Generates chase unique ID
   *
   * @public
   * @returns {Number} The chase's unique ID
   */
  genChaseId() {
    return this.chases.reduce(
      (prev, current) => (
        (prev && prev.id > current.id)
          ? prev.id
          : current.id
      ),
      -1,
    ) + 1;
  }

  /**
   * Manually remove chase chasePool reference from memory
   *
   * @private
   * @param {Object} instance handle to chasePool instance to be freed
   */
  static deleteInstance(instance) {
    Object.keys(instance).forEach((prop) => {
      delete instance[prop];
    });
    instance = null;
  }
}

export default ChasePool;
