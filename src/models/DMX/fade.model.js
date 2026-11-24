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
  // Appended after the original six: showfiles store the index (see FADE_PRESETS_INDICES).
  // Values from easings.net (cubic-bezier).
  SINE_IN: [{ x: 0.12, y: 0 }, { x: 0.39, y: 0 }],
  SINE_OUT: [{ x: 0.61, y: 1 }, { x: 0.88, y: 1 }],
  SINE_IN_OUT: [{ x: 0.37, y: 0 }, { x: 0.63, y: 1 }],
  QUAD_IN: [{ x: 0.11, y: 0 }, { x: 0.5, y: 0 }],
  QUAD_OUT: [{ x: 0.5, y: 1 }, { x: 0.89, y: 1 }],
  QUAD_IN_OUT: [{ x: 0.45, y: 0 }, { x: 0.55, y: 1 }],
  CUBIC_IN: [{ x: 0.32, y: 0 }, { x: 0.67, y: 0 }],
  CUBIC_OUT: [{ x: 0.33, y: 1 }, { x: 0.68, y: 1 }],
  CUBIC_IN_OUT: [{ x: 0.65, y: 0 }, { x: 0.35, y: 1 }],
  QUART_IN: [{ x: 0.5, y: 0 }, { x: 0.75, y: 0 }],
  QUART_OUT: [{ x: 0.25, y: 1 }, { x: 0.5, y: 1 }],
  QUART_IN_OUT: [{ x: 0.76, y: 0 }, { x: 0.24, y: 1 }],
  QUINT_IN: [{ x: 0.64, y: 0 }, { x: 0.78, y: 0 }],
  QUINT_OUT: [{ x: 0.22, y: 1 }, { x: 0.36, y: 1 }],
  QUINT_IN_OUT: [{ x: 0.83, y: 0 }, { x: 0.17, y: 1 }],
  EXPO_IN: [{ x: 0.7, y: 0 }, { x: 0.84, y: 0 }],
  EXPO_OUT: [{ x: 0.16, y: 1 }, { x: 0.3, y: 1 }],
  EXPO_IN_OUT: [{ x: 0.87, y: 0 }, { x: 0.13, y: 1 }],
  CIRC_IN: [{ x: 0.55, y: 0 }, { x: 1, y: 0.45 }],
  CIRC_OUT: [{ x: 0, y: 0.55 }, { x: 0.45, y: 1 }],
  CIRC_IN_OUT: [{ x: 0.85, y: 0 }, { x: 0.15, y: 1 }],
  BACK_IN: [{ x: 0.36, y: 0 }, { x: 0.66, y: -0.56 }],
  BACK_OUT: [{ x: 0.34, y: 1.56 }, { x: 0.64, y: 1 }],
  BACK_IN_OUT: [{ x: 0.68, y: -0.6 }, { x: 0.32, y: 1.6 }],
};

/**
 * Indexed fade preset values
 *
 * @constant {Array} FADE_PRESETS_INDICES
 */
const FADE_PRESETS_INDICES = Object.values(FADE_PRESETS);

/**
 * Display name of each preset, by index (`CUBIC_IN_OUT` → `Cubic in-out`)
 *
 * @constant {Array<String>} FADE_PRESET_NAMES
 */
const FADE_PRESET_NAMES = Object.keys(FADE_PRESETS).map((key) => {
  const words = key.toLowerCase().replace(/_in_out$/, ' in-out').replace(/_(in|out)$/, ' $1')
    .replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
});

/**
 * Newton steps tried before bisecting, when solving a curve for time
 *
 * @constant {Number} SOLVE_NEWTON_STEPS
 */
const SOLVE_NEWTON_STEPS = 8;

/**
 * Precision of the time solve (curve x)
 *
 * @constant {Number} SOLVE_EPSILON
 */
const SOLVE_EPSILON = 1e-5;
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
   * Display names of the fade presets, by type index (`Custom`, `Linear`, `Ease in`...)
   *
   * @readonly
   * @type {Array<String>}
   */
  // eslint-disable-next-line class-methods-use-this
  get presetNames() {
    return FADE_PRESET_NAMES;
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
   * Returns the fade's progress (0 to 1, beyond for an overshooting curve) at a time.
   *
   * The curve is drawn with time on X: at a time fraction x, it finds the curve parameter t with
   * x(t) = x (Newton steps, bisection when they don't converge), then plays y(t), as CSS easing
   * does. Keeps `t`, `x` and `value` for the play dot. Hot path: plain numbers, no allocation.
   *
   * @param {Number} time time value in milliseconds
   * @param {Number} duration
   * @return {Number} Fade progress at that time
   */
  getValue(time, duration) {
    const fraction = duration > 0 ? time / duration : 1;
    const x = fraction < 0 ? 0 : Math.min(fraction, 1);
    const cp = this._controlPoints;
    const x1 = cp[0].x;
    const x2 = cp[1].x;

    // Newton on x(t) - x, from t = x
    let t = x;
    let solved = false;
    for (let i = 0; i < SOLVE_NEWTON_STEPS; i++) {
      const mt = 1 - t;
      const error = 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t - x;
      if (Math.abs(error) < SOLVE_EPSILON) {
        solved = true;
        break;
      }
      const slope = 3 * mt * mt * x1 + 6 * mt * t * (x2 - x1) + 3 * t * t * (1 - x2);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
      if (t < 0 || t > 1) break;
    }
    if (!solved) {
      // x(t) grows on 0..1 (control point X stays within 0..1): bisect
      let low = 0;
      let high = 1;
      t = x;
      while (high - low > SOLVE_EPSILON) {
        const mt = 1 - t;
        const at = 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t;
        if (at < x) low = t;
        else high = t;
        t = (low + high) / 2;
      }
    }

    const mt = 1 - t;
    const a = 3 * mt * mt * t;
    const b = 3 * mt * t * t;
    const c = t * t * t;
    this.t = t;
    this.x = a * x1 + b * x2 + c;
    const val = a * cp[0].y + b * cp[1].y + c;
    this.value = val;
    return val || 0;
  }

  /**
   * Point of the curve, as drawn from the current control points, at a fade progress. For
   * display only (it allocates): playback uses getValue().
   *
   * @public
   * @param {Number} t fade progress, 0 to 1 (clamped)
   * @return {{x: Number, y: Number}} time and value fractions, 0 to 1
   */
  pointAt(t) {
    const p = Math.min(Math.max(Number(t) || 0, 0), 1);
    const mt = 1 - p;
    const a = 3 * mt * mt * p;
    const b = 3 * mt * p * p;
    const c = p * p * p;
    const cp = this._controlPoints;
    return {
      x: a * cp[0].x + b * cp[1].x + c,
      y: a * cp[0].y + b * cp[1].y + c,
    };
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

export { FADE_PRESETS, FADE_PRESET_NAMES };
export default Fade;
