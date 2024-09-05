import ukColors from '@/views/components/uikit/colors/uikit.colors';
import Live from './live.model';
import { Proxify } from '../utils/proxify.utils';

/**
 * Cue types enumeration
 *
 * @constant {Object} CUE_TYPES
 * @enum {Number}
 */
export const CUE_TYPES = {
  SCENE: 0,
  EFFECT: 1,
};
/**
 * Cue states enumeration
 *
 * @constant {Object} CUE_STATES
 * @enum {Number}
 */
export const CUE_STATES = {
  IDLE: 0,
  RUNNING: 1,
};
/**
 * Cue trigger styles enumeration
 *
 * @constant {Object} CUE_TRIGGER_STYLES
 * @enum {Number}
 */
export const CUE_TRIGGER_STYLES = {
  TOGGLE: 0,
  TEMPORARY: 1,
};
/**
 * Cue loop styles enumeration
 *
 * @constant {Object} CUE_LOOP_STYLES
 * @enum {Number}
 */
export const CUE_LOOP_STYLES = {
  ONE_SHOT: 0,
  LOOP: 1,
};

/**
 * Default cue data
 *
 * @constant {Object} DEFAULT_CUE_DATA
 */
const DEFAULT_CUE_DATA = {
  DURATION: 1,
  STATE: CUE_STATES.IDLE,
  TRIGGER_STYLE: CUE_TRIGGER_STYLES.TOGGLE,
  LOOP_STYLE: CUE_LOOP_STYLES.ONE_SHOT,
  RELATIVE: 0,
};

/**
 * @class Cue
 * @extends {Proxify}
 * @classdesc Cues are collections of DMX channels manipulation function bound to specific sets of
 * fixtures. They come in varying types, Currently implemented types include Scene and Effect
 * @see Scene
 * @see Effect
 */
class Cue extends Proxify {
  /**
   * Creates an instance of Cue.
   *
   * @param {Object} data Cue configuration object
   * @param {Number} data.id Cue ID
   * @param {Number} data.type Cue ID
   * @param {Number} data.name Cue name
   * @param {Number} data.color Cue color string
   * @param {Number} data.triggerStyle Cue trigger style
   * @param {Number} data.loopStyle Cue loop style
   * @param {Number} data.duration Cue duration
   * @param {Number} data.relative Cue startup configuration
   */
  constructor(data) {
    super();
    if (!data.isStub) {
      this.id = data.id;
      this.type = data.type;
      this.name = data.name || `Cue ${this.id}`;
      this.color = data.color;
      this.state = CUE_STATES.IDLE;
      this.triggerStyle = data.triggerStyle;
      this.loopStyle = data.loopStyle;
      this.duration = data.duration;
      this.relative = data.relative;
      this.animationId = null;
      this.deltaStart = null;
      this.time = 0;
      this.DMXActivity = 0;
    }
  }

  /**
   * Cue color
   *
   * @type {String}
   */
  set color(color) {
    this._color = color;
  }

  get color() {
    return this._color || ukColors[Object.keys(ukColors)[this.id % Object.keys(ukColors).length]];
  }

  set state(state) {
    this._state = state != null ? state : DEFAULT_CUE_DATA.STATE;
  }

  get state() {
    return this._state || DEFAULT_CUE_DATA.STATE;
  }

  /**
   * Cue trigger style
   *
   * @type {Number}
   */
  set triggerStyle(triggerStyle) {
    this._triggerStyle = triggerStyle != null ? triggerStyle : DEFAULT_CUE_DATA.TRIGGER_STYLE;
  }

  get triggerStyle() {
    return this._triggerStyle || DEFAULT_CUE_DATA.TRIGGER_STYLE;
  }

  /**
   * Cue loop style
   *
   * @type {Number}
   */
  set loopStyle(loopStyle) {
    this._loopStyle = loopStyle != null ? loopStyle : DEFAULT_CUE_DATA.LOOP_STYLE;
  }

  get loopStyle() {
    return this._loopStyle || DEFAULT_CUE_DATA.LOOP_STYLE;
  }

  /**
   * Cue duration in bars
   *
   * @type {Number}
   */
  set duration(duration) {
    this._duration = duration != null ? duration : DEFAULT_CUE_DATA.DURATION;
  }

  get duration() {
    return this._duration || DEFAULT_CUE_DATA.DURATION;
  }

  /**
   * Cue start configuration
   *
   * @type {Boolean}
   */
  set relative(relative) {
    this._relative = relative != null ? relative : DEFAULT_CUE_DATA.RELATIVE;
  }

  get relative() {
    return this._relative || DEFAULT_CUE_DATA.RELATIVE;
  }

  get durationMS() {
    return this.duration * Live.barDuration;
  }

  /**
   * Cue listable data
   *
   * @type {Object}
   * @readonly
   */
  get listable() {
    return {
      name: this.name,
      color: this.color,
      icon: this.type === CUE_TYPES.SCENE ? 'mixer' : 'mixer',
    };
  }

  /**
   * Cue's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      duration: this.duration,
      triggerStyle: this.triggerStyle,
      loopStyle: this.loopStyle,
      relative: this.relative,
    };
  }

  /**
   * Cues cue on/off
   *
   * @public
   * @param {Boolean} state cue's cueing state
   */
  cue(state) {
    if (state && this.animationId === null) {
      // if (this.relative) {
      //   this.prepareStartValues();
      // }
      this.animationId = Live.add(this._update.bind(this));
      this.state = CUE_STATES.RUNNING;
    } else if (this.animationId != null) {
      Live.remove(this.animationId);
      this.animationId = null;
      this.state = CUE_STATES.IDLE;
      this.deltaStart = null;
    }
  }

  /**
   * Updates cue over time
   *
   * @private
   * @param {Number} t update time
   */
  _update(t) {
    if (this.deltaStart == null) {
      this.deltaStart = t;
    }
    this.time = t - this.deltaStart;
    if (this.time > this.durationMS && this.loopStyle !== CUE_LOOP_STYLES.LOOP) {
      if (this.animationId != null) {
        Live.remove(this.animationId);
        this.animationId = null;
        this.state = CUE_STATES.IDLE;
        this.deltaStart = null;
      }
    }
    this.update(this.time);
  }

  /* eslint-disable class-methods-use-this */
  // Abstract methods to be inherited
  update() {}

  prepareStartValues() {}

  deleteFixture() {}
  /* eslint-enable class-methods-use-this */

  /**
   * Manually remove cue instance reference from memory
   *
   * @private
   * @param {Object} instance handle to cue instance to be freed
   */
  static deleteInstance(instance) {
    if (instance.animationId != null) {
      Live.remove(instance.animationId);
    }
    Object.keys(instance).forEach((prop) => {
      delete instance[prop];
    });
    instance = null;
  }
}

export default Cue;
