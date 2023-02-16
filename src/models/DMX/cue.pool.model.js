'use strict'

import {Proxify} from '../utils/proxify.utils.js'
import Effect from './effect.model'
import Scene from './scene.model'

/**
 * Cue types enumeration
 * 
 * @constant {Object} CUE_TYPES
 * @enum {Number}
 */
const CUE_TYPES = {
  SCENE: 0,
  EFFECT: 1
}


/**
 * @class CuePool
 * @extends {Proxify}
 * @classdesc Pool of cue instances
 */
class CuePool extends Proxify  {

  constructor() {
    super();
    this.cues = [];
    return this.proxify();
  }

  /**
   * Pool's listable data
   *
   * @todo remove this ? Am I even using it ?
   * @readonly
   * @type {Array}
   */
  get listable(){
    return this.cues.map(cue=>cue.listable)
  }

  /**
   * Returns cue instance from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Object} Cue instance 
   */
  getFromId(id){
    let cue = this.cues.find(cue=>cue.id == id);
    if(cue){
      return cue;
    }else{
      throw {
        errcode: -10,
        msg: "Cannot find cue in pool"
      }
    }
  }

  /**
   * Pushes existing cue into the pool
   *
   * @public
   * @param {Object} cue cue instance
   */
  addExisting(cue){
    this.cues.pushAndStackUndo(cue);
  }

  /**
   * Creates a new cue instance from provided configuraion data and pushes it to the pool
   *
   * @public
   * @param {Object} cueData cue configuration object
   * @return {Object} Cue instance 
   * @see Cue
   */
  addRaw(cueData){
    let cue;
    switch(cueData.type){
      case CUE_TYPES.SCENE:
        cue = new Scene(cueData);
        break;
      case CUE_TYPES.EFFECT:
        cue = new Effect(cueData);
        break;
      default:
        throw{
          errcode: -20,
          msg: "Unsupported cue type provided."
        }
    }
    cue.id = cueData.id != undefined ? cueData.id : this.genCueId();
    this.cues.pushAndStackUndo(cue);
    return cue;
  }

  /**
   * Removes cue from pool
   *
   * @public
   * @param {Object} cue cue instance handle
   */
  delete(cue){
    let cueIndex = this.cues.findIndex(item=>item.id === cue.id);
    if(cueIndex > -1){
      this.cues.spliceAndStackUndo(cueIndex, 1);
    }else{
      throw {
        errcode: -12,
        msg: "Could not find cue in cue pool"
      }
    }
  }

  /**
   * Clears all cue instances from pool
   *
   * @public
   */
  clearAll(){
    for(let i=this.cues.length-1; i>=0;i--){
      this.delete(this.cues[i])
    }
  }

  /**
   * Generates cue unique ID
   *
   * @public
   * @returns {Number} The cue's unique ID
   */
  genCueId() {
    let id = this.cues.length ? this.cues[this.cues.length-1].id + 1 : 0; 
    while(this.cues.find(cue=>cue.id === id)){
      id++;
    }
    return id;
  }

  /**
   * Manually remove cuePool reference from memory
   *
   * @private
   * @param {Object} instance handle to cuePool instance to be freed
   */
  static deleteInstance(instance) {
    Object.keys(instance).forEach(prop => {
      delete instance[prop]
    })
    instance = null;
  }

}

export default CuePool;