'use strict'

import {
  Proxify
} from '../utils/proxify.utils.js'
import Chase from './chase.model'

/**
 * @class ChasePool
 * @extends {Proxify}
 * @classdesc Pool of chase instances
 */
class ChasePool extends Proxify {

  constructor() {
    super();
    this.chases = []
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
    return this.chases.map(chase => chase.listable)
  }

  /**
   * Returns chase instance from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Object} Chase instance 
   */
  getFromId(id) {
    let chase = this.chases.find(chase => chase.id == id);
    if (chase) {
      return chase;
    } else {
      throw {
        errcode: -10,
        msg: "Cannot find chase in pool"
      }
    }
  }

  /**
   * Pushes existing chase into the pool
   *
   * @public
   * @param {Object} chase chase instance
   */
  addExisting(chase) {
    this.chases.pushAndStackUndo(chase);
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
    let chase = new Chase(chaseData)
    chase.id = chaseData.id != undefined ? chaseData.id : this.genChaseId();
    this.chases.pushAndStackUndo(chase);
    return chase;
  }

  /**
   * Removes chase from pool
   *
   * @public
   * @param {Object} chase chase instance handle
   */
  delete(chase) {
    let chaseIndex = this.chases.findIndex(item => item.id === chase.id);
    if (chaseIndex > -1) {
      this.chases.spliceAndStackUndo(chaseIndex, 1);
      Chase.deleteInstance(chase);
    } else {
      throw {
        errcode: -12,
        msg: "Could not find chase in chase pool"
      }
    }
  }

  /**
   * Clears all chase instances from pool
   *
   * @public
   */
  clearAll() {
    for (let i = this.chases.length - 1; i >= 0; i--) {
      this.delete(this.chases[i])
    }
  }

  /**
   * Generates chase unique ID
   *
   * @public
   * @returns {Number} The chase's unique ID
   */
  genChaseId() {
    let id = this.chases.length ? this.chases[this.chases.length - 1].id + 1 : 0;
    while (this.chases.find(chase => chase.id === id)) {
      id++;
    }
    return id;
  }

  /**
   * Manually remove chase chasePool reference from memory
   *
   * @private
   * @param {Object} instance handle to chasePool instance to be freed
   */
  static deleteInstance(instance) {
    Object.keys(instance).forEach(prop => {
      delete instance[prop]
    })
    instance = null;
  }

}

export default ChasePool;