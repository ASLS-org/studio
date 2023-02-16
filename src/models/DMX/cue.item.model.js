'use strict'

/**
 * Default cue fade-in time
 * 
 * @constant {Number} DEFAULT_CUE_FADEIN
 */
const DEFAULT_CUE_FADEIN = 0;
/**
 * Default cue fade-out time
 * 
 * @constant {Number} DEFAULT_CUE_FADEOUT
 */
const DEFAULT_CUE_FADEOUT = 0;

import {Proxify} from '../utils/proxify.utils.js'


/**
 * @class CueItem
 * @extends {Proxify}
 * @classdesc CueItems are references to a chase's cue instance activity overtime 
 */
class CueItem extends Proxify {

  /**
   * Creates an instance of CueItem.
   * 
   * @param {Object} data CueItem configuration object
   * @param {Number} data.id CueItem's ID
   * @param {Object} data.cue CueItem's cue instance handle
   * @param {Number} data.fadeIn CueItem's Fadein duration
   * @param {Number} data.fadeOut CueItem's Fadeout duration
   * @param {Number} data.timeDuration CueItem's duration  TODO: remove this ?? => replaced with below
   * @param {Number} data.tickDuration CueItem's tick duration
   * @param {Number} data.timeStart CueItem's start tick
   * @param {Number} data.subDiv CueItem's bar subdivision data TODO: remove this ??
   */
  constructor(data) {
    super();
    this.id = data.id;
    this.handle = data.cue;
    this.fadeIn = data.fadeIn;
    this.fadeOut = data.fadeOut;
    this.timeDuration =  data.timeDuration;
    this.tickDuration =  data.tickDuration;
    this.timeStart = data.timeStart;
    this.tickStart = data.tickStart;
    this._subDiv = data.subDiv;
    return this.proxify(['handle']);
  }

  /**
   * Fadein time 
   *
   * @type {Number}
   */
  set fadeIn(fadeIn){
    this._fadeIn = fadeIn;
  }

  /**
   * Fadeout time
   *
   * @type {Number}
   */
  set fadeOut(fadeIn){
    this._fadeIn = fadeIn;
  }

  /**
   * Hold duration
   * 
   * @todo remove this ? replaced with tick ?
   * @type {Number}
   */
  set timeDuration(timeDuration){
    this._timeDuration= timeDuration;
  }

  /**
   * Hold duration
   *
   * @type {Number}
   */
  set tickDuration(tickDuration){
    this._tickDuration= tickDuration;
  }

  /**
   * starting time
   *
   * @todo remove this ? replaced with tick ?
   * @type {Number}
   */
  set timeStart(timeStart){
    this._timeStart = timeStart;
  }

  /**
   * Starting tick
   *
   * @type {Number}
   */
  set tickStart(tickStart){
    this._tickStart = tickStart;
  }

  /**
   * Hold duration
   * @todo remove this ? replaced with tick ?
   * @type {Number}
   */
  set length(duration){
    this._tickDuration = duration;
  }

  /**
   * Starting tick position
   *
   * @todo remove this ? replaced with tick ?
   * @type {Number}
   */
  set tick(tickStart){
    this._tickStart = tickStart;
  }

  get fadeIn(){
    return this._fadeIn || DEFAULT_CUE_FADEIN;
  }

  get fadeOut(){
    return this._fadeOut || DEFAULT_CUE_FADEOUT;
  }

  get length(){
    return this._tickDuration;
  }

  get tick(){
    return this._tickStart;
  }

  get tickDuration(){
    return this._tickDuration;
  }

  /**
   * Cue item's color
   *
   * @readonly
   * @type {String}
   */
  get color(){
    return this.handle.color;
  }

  /**
   * Cue item's name
   *
   * @readonly
   * @type {String}
   */
  get name(){
    return this.handle.name;
  }

  /**
   * CueItem's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData(){
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      tickStart: this.tick,
      tickDuration: this.length
    }
  }

  /**
   * Manually remove CueItem instance reference from memory
   *
   * @private
   * @param {Object} instance handle to CueItem instance to be freed
   */
  static deleteInstance(instance) {
    Object.keys(instance).forEach(prop => {
      delete instance[prop]
    })
    instance = null;
  }

}

export default CueItem;