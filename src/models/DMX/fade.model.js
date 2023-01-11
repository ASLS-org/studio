import {
  Proxify
} from '@/models/utils/proxyfy.utils.model.js'
import Live from './live.model'

/**
 * Fade bezier curve preset control point values
 * 
 * @constant {Object} FADE_PRESETS
 */
const FADE_PRESETS = {
  CUSTOM: [{
    x: 0.250,
    y: 0.250
  }, {
    x: 0.750,
    y: 0.750
  }],
  LINEAR: [{
    x: 0.250,
    y: 0.250
  }, {
    x: 0.750,
    y: 0.750
  }],
  EASE: [{
    x: 0.250,
    y: 0.100
  }, {
    x: 0.250,
    y: 1.0
  }],
  EASE_IN: [{
    x: 0.420,
    y: 0.0
  }, {
    x: 1.0,
    y: 1.0
  }],
  EASE_OUT: [{
    x: 0,
    y: 0
  }, {
    x: 0.580,
    y: 1.0
  }],
  EASE_IN_OUT: [{
    x: 0.420,
    y: 0
  }, {
    x: 0.580,
    y: 1.0
  }],
}

/**
 * Indexed fade preset values
 * 
 * @constant {Array} FADE_PRESETS_INDICES
 */
const FADE_PRESETS_INDICES = [
  FADE_PRESETS.CUSTOM,
  FADE_PRESETS.LINEAR,
  FADE_PRESETS.EASE,
  FADE_PRESETS.EASE_IN,
  FADE_PRESETS.EASE_OUT,
  FADE_PRESETS.EASE_IN_OUT
]
/**
 * Fade directions enumeration
 * 
 * @constant {Object} FADE_DIRECTIONS
 * @enum
 */
const FADE_DIRECTIONS = {
  IN: 0,
  OUT: 1
}

/**
 * @class Fade
 * @extends {Proxify}
 * @classdesc Fades are used in order to fade in or out cues. the fading algorithm is determined using bézier curves.
 */
class Fade extends Proxify {

  /**
   * Creates an instance of Fade.
   * 
   * @param {Object} [data={}]
   * @param {Number} data.duration fade suration in milliseconds
   * @param {Array} data.controlPoints fade bézier controlpoints
   * @param {Number} data.type fade preset type
   */
  constructor(data = {}) {
    super();
    this.duration = data.duration || 1000;
    this.controlPoints = data.controlPoints;
    this.type = data.type;
    this.direction = data.direction
    this.relative = false;
    this.t = 0;
    this.x = 0;
    this.y = 0;
    return this.proxify(['t', 'x', 'y', 'value'])
  }


  /**
   * Fade preset type
   *
   * @type {Number}
   * @see FADE_PRESETS
   */
  set type(type) {
    if (FADE_PRESETS_INDICES[type] && type != 0) {
      this.controlPoints = JSON.parse(JSON.stringify(FADE_PRESETS_INDICES[type]));
      this._type = type;
    } else {
      this._type = 0
    }
  }

  /**
   * Fade bezier curve control points configuration
   *
   * @type {Array<Object>}
   */
  set controlPoints(controlPoints) {
    this._type = 0 //FADE_PRESETS.DEFAULT;
    this._controlPoints = JSON.parse(JSON.stringify(controlPoints || FADE_PRESETS.CUSTOM))
  }

  /**
   * Fade direction (IN or OUT)
   *
   * @type {Number}
   * @see FADE_DIRECTIONS
   */
  set direction(direction){
    this._direction = direction || FADE_DIRECTIONS.IN
  }

  /**
   * Ellapsed fade percentage
   *
   * @readonly
   * @type {Number}
   */
  get timePercent() {
    return this.time / this.durationMS
  }

  /**
   * List of available fade presets/easing functions
   *
   * @readonly
   * @type {Array<String>}
   */
  get availabelEasingFunctions() {
    return Object.keys(FADE_PRESETS);
  }

  /**
   * Fade's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return {
      type: this.type,
      controlPoints: this.controlPoints
    }
  }

  /**
   * Fade value in percent
   *
   * @readonly
   * @type {Number}
   */
  get valuePercent() {
    return this.value
  }

  get type() {
    return this._type;
  }

  get controlPoints() {
    return this._controlPoints;
  }

  get direction(){
    return this._direction;
  }

  get durationMS(){
    return this.duration * Live.barDuration;
  }

  /**
   * Returns fade's percented value at any given time
   *
   * @param {Number} time time value in milliseconds
   * @return {Number} Percented value over time
   */
  getValue(time) {
    this.t = time / this.durationMS;
    this.getX();
    let val = (
      Math.pow(1 - this.t, 3) * 0 +
      3 * Math.pow(1 - this.t, 2) * this.t * this.controlPoints[0].y +
      3 * (1 - this.t) * Math.pow(this.t, 2) * this.controlPoints[1].y +
      Math.pow(this.t, 3)
    )
    this.value = val;
    return val;
  }

  /**
   * Returns fade's X value at any given time
   *
   * @return {Number} X value over time
   * @todo pass time as argument, it is a bit confusing to use local time object
   */
  getX() {
    let xVal = (
      Math.pow(1 - this.t, 3) * 0 +
      3 * Math.pow(1 - this.t, 2) * this.t * this.controlPoints[0].x +
      3 * (1 - this.t) * Math.pow(this.t, 2) * this.controlPoints[1].x +
      Math.pow(this.t, 3) * 1
    )
    this.x = xVal;
    return xVal;
  }

}

export default Fade