import Live from './live.model';

/**
 * Fade bezier curve preset control point values
 *
 * @constant {Object} FADE_PRESETS
 */
const FADE_PRESETS = {
  CUSTOM: [{
    x: 0.250,
    y: 0.250,
  }, {
    x: 0.750,
    y: 0.750,
  }],
  LINEAR: [{
    x: 0.250,
    y: 0.250,
  }, {
    x: 0.750,
    y: 0.750,
  }],
  EASE: [{
    x: 0.250,
    y: 0.100,
  }, {
    x: 0.250,
    y: 1.0,
  }],
  EASE_IN: [{
    x: 0.420,
    y: 0.0,
  }, {
    x: 1.0,
    y: 1.0,
  }],
  EASE_OUT: [{
    x: 0,
    y: 0,
  }, {
    x: 0.580,
    y: 1.0,
  }],
  EASE_IN_OUT: [{
    x: 0.420,
    y: 0,
  }, {
    x: 0.580,
    y: 1.0,
  }],
};

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
  FADE_PRESETS.EASE_IN_OUT,
];
/**
 * Fade directions enumeration
 *
 * @constant {Object} FADE_DIRECTIONS
 * @enum
 */
const FADE_DIRECTIONS = {
  IN: 0,
  OUT: 1,
};

/**
 * Cheap 2-point control-point clone. Control points are always a fixed-shape
 * pair of {x, y} objects, so a manual copy is far cheaper than round-tripping
 * through JSON.stringify/JSON.parse (which was the only reason this needed
 * to allocate a string just to allocate an object again).
 *
 * @param {Array<Object>} points
 * @return {Array<Object>}
 */
function cloneControlPoints(points) {
  return [
    { x: points[0].x, y: points[0].y },
    { x: points[1].x, y: points[1].y },
  ];
}

/**
 * @class Fade
 * @classdesc Fades are used in order to fade in or out cues.
 */
class Fade {
  /**
   * Creates an instance of Fade.
   *
   * @param {Object} [data={}]
   * @param {Number} data.duration fade suration in milliseconds
   * @param {Array} data.controlPoints fade bézier controlpoints
   * @param {Number} data.type fade preset type
   */
  constructor(data = {}) {
    this.duration = data.duration || 1000;
    this.controlPoints = data.controlPoints;
    this.type = data.type;
    this.direction = data.direction;
    this.relative = false;
    this.value = 0;
    this.t = 0;
    this.x = 0;
    this.y = 0;
  }

  /**
   * Fade preset type
   *
   * @type {Number}
   * @see FADE_PRESETS
   */
  set type(type) {
    if (FADE_PRESETS_INDICES[type] && type !== 0) {
      this.controlPoints = FADE_PRESETS_INDICES[type];
      this._type = type;
    } else {
      this._type = 0;
    }
  }

  get type() {
    return this._type;
  }

  /**
   * Fade bezier curve control points configuration
   *
   * @type {Array<Object>}
   */
  set controlPoints(controlPoints) {
    this._type = 0; // FADE_PRESETS.DEFAULT;
    this._controlPoints = cloneControlPoints(controlPoints || FADE_PRESETS.CUSTOM);
  }

  get controlPoints() {
    return this._controlPoints;
  }

  /**
   * Fade direction (IN or OUT)
   *
   * @type {Number}
   * @see FADE_DIRECTIONS
   */
  set direction(direction) {
    this._direction = direction || FADE_DIRECTIONS.IN;
  }

  get direction() {
    return this._direction;
  }

  /**
   * Ellapsed fade percentage
   *
   * @readonly
   * @type {Number}
   */
  get timePercent() {
    return this.time / this.durationMS;
  }

  /**
   * List of available fade presets/easing functions
   *
   * @readonly
   * @type {Array<String>}
   */
  // eslint-disable-next-line class-methods-use-this
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
      controlPoints: this.controlPoints,
    };
  }

  /**
   * Fade value in percent
   *
   * @readonly
   * @type {Number}
   */
  get valuePercent() {
    return this.value;
  }

  get durationMS() {
    return this.duration * Live.barDuration;
  }

  /**
   * Returns fade's percented value at any given time.
   *
   * Computes X and Y from a single set of cached bezier powers instead of the
   * previous two-pass getValue()+getX() (which each re-derived (1-t)^2/(1-t)^3
   * independently). Also returns a plain number instead of a toFixed(3)
   * string - the string conversion allocated on every single frame for no
   * benefit, since this.value already holds the precise numeric value and any
   * display rounding belongs in the UI layer, not the per-frame update loop.
   *
   * @param {Number} time time value in milliseconds
   * @param {Number} duration
   * @return {Number} Percented value over time
   */
  getValue(time, duration) {
    const t = time / duration;
    this.t = t;

    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    const a = 3 * mt2 * t;
    const b = 3 * mt * t2;
    const c = t2 * t;

    const cp = this._controlPoints;

    this.x = a * cp[0].x + b * cp[1].x + c;

    const val = a * cp[0].y + b * cp[1].y + c;
    this.value = val;
    return val || 0;
  }

  /**
   * Returns fade's X value from the last getValue() call.
   *
   * @return {Number} X value over time
   * @todo pass time as argument, it is a bit confusing to use local time object
   */
  getX() {
    return this.x;
  }
}

export default Fade;
