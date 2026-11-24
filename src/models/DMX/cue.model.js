import ukColors from '@/views/components/uikit/colors/uikit.colors';
import Live from './live.model';
import Fade from './fade.model';
import { toRaw } from '../utils/reactivity';
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
 * @classdesc Cues are collections of DMX channels manipulation function bound to specific sets of
 * fixtures. They come in varying types, Currently implemented types include Scene and Effect
 * @see Scene
 * @see Effect
 */
class Cue {
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
      // Fades: curve and time in bars (0: none)
      this.fadeIn = Cue.buildFade(data.fadeIn, 0);
      this.fadeOut = Cue.buildFade(data.fadeOut, 1);
      // Playback state, never saved: time since cued, fade factor (0: the values the cue started
      // from, 1: the cue's own), the current fade's start and starting factor, the release
      this.elapsed = 0;
      this.fadeFactor = 1;
      this.fadeStart = 0;
      this.fadeFrom = 0;
      this.releasing = false;
      this.releaseFrom = 1;
      // Chase item playback (runtime): whether an item of a chase plays the cue, its time, length
      this.itemActive = false;
      this.itemTime = 0;
      this.itemLength = 0;
      /**
       * Whether a running chase is playing one of this cue's items (runtime only, not saved)
       */
      this.chaseActive = false;
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
    this._state = state !== null ? state : DEFAULT_CUE_DATA.STATE;
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
   * A fade from its show data, its time (`duration`, in bars, 0 to 64) `fallback` when missing
   *
   * @public
   * @param {Object} [data] fade show data
   * @param {Number} direction FADE_DIRECTIONS value
   * @param {Number} [fallback=0] time in bars when the data has none
   * @returns {Fade}
   */
  static buildFade(data, direction, fallback = 0) {
    const fade = new Fade({ ...(data || {}), direction });
    const bars = data && data.duration != null ? data.duration : fallback;
    fade.duration = Math.min(Math.max(Number(bars) || 0, 0), 64);
    return fade;
  }

  /**
   * Whether the cue fades in and out (scenes always, effects in Relative)
   *
   * @readonly
   * @type {Boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  get fades() {
    return true;
  }

  /**
   * Whether the cue ends by itself after its duration (One Shot)
   *
   * @readonly
   * @type {Boolean}
   */
  get endsAfterDuration() {
    return this.loopStyle !== CUE_LOOP_STYLES.LOOP;
  }

  /**
   * When a cue that ends by itself ends, in ms since cued (its Duration)
   *
   * @readonly
   * @type {Number}
   */
  get endMS() {
    return this.durationMS;
  }

  /**
   * Whether the cue fades out when it ends by itself (a scene ends once faded in, its look stays)
   *
   * @readonly
   * @type {Boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  get fadesOutAtEnd() {
    return true;
  }

  /**
   * Fade-in time in ms
   *
   * @readonly
   * @type {Number}
   */
  get fadeInMS() {
    return this.fadeIn.duration * Live.barDuration;
  }

  /**
   * Fade-out time in ms
   *
   * @readonly
   * @type {Number}
   */
  get fadeOutMS() {
    return this.fadeOut.duration * Live.barDuration;
  }

  /**
   * Fade-in and fade-out times within a chase item, shrunk in proportion when they don't fit it
   *
   * @public
   * @param {Number} lengthMS item length in ms
   * @returns {{fadeIn: Number, fadeOut: Number}} times in ms (0 when the cue doesn't fade)
   */
  itemFades(lengthMS) {
    if (!this.fades) return { fadeIn: 0, fadeOut: 0 };
    const fadeIn = this.fadeInMS;
    const fadeOut = this.fadeOutMS;
    const total = fadeIn + fadeOut;
    const k = total > lengthMS && total > 0 ? lengthMS / total : 1;
    return { fadeIn: fadeIn * k, fadeOut: fadeOut * k };
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
      fadeIn: { ...this.fadeIn.showData, duration: this.fadeIn.duration },
      fadeOut: { ...this.fadeOut.showData, duration: this.fadeOut.duration },
    };
  }

  /**
   * Cues cue on/off
   *
   * @public
   * @param {Boolean} state cue's cueing state
   */
  cue(state) {
    if (state && this.releasing) {
      // Cued again while fading out: fade in from where the fade-out got to
      this.releasing = false;
      this.fadeFrom = this.fadeFactor;
      this.fadeStart = this.elapsed;
      this.state = CUE_STATES.RUNNING;
      return;
    }
    if (state && this.animationId === null) {
      if (this.relative) this.prepareStartValues();
      // Playback runs on the raw cue: per-tick writes trigger no Vue work (UI reads them through
      // the live ticker). The play dots and fade state are playback state too: written raw
      const raw = toRaw(this);
      raw.elapsed = 0;
      raw.fadeStart = 0;
      raw.fadeFrom = 0;
      toRaw(raw.fadeIn).t = 0;
      toRaw(raw.fadeOut).t = 0;
      this.animationId = Live.add(raw._update.bind(raw));
      this.state = CUE_STATES.RUNNING;
      return;
    }
    // A running cue stops whatever the argument (the cue pool toggles with cue(true)); a cue
    // fading out and stopped again stops at once
    if (this.animationId != null && this.fades && !this.releasing && this.fadeOut.duration > 0) {
      // Shown stopped at once; keeps running while it fades out
      this.releasing = true;
      this.releaseFrom = this.fadeFactor;
      this.fadeStart = this.elapsed;
      this.state = CUE_STATES.IDLE;
      return;
    }
    this.stopNow();
  }

  /**
   * Stops the cue at once: off Live, back to full strength for edits made while stopped
   *
   * @public
   */
  stopNow() {
    this.releasing = false;
    if (this.animationId != null) {
      Live.remove(this.animationId);
      this.animationId = null;
    }
    this.state = CUE_STATES.IDLE;
    this.deltaStart = null;
    this.fadeFactor = 1;
  }

  /**
   * Fade factor at a time since the cue: 1 outside fades; along the Fade In curve from where it
   * started while fading in; from where it was down to 0 along the Fade Out curve while releasing
   *
   * @private
   * @param {Number} t time since cued, in ms
   * @returns {Number} 0 to 1
   */
  computeFadeFactor(t) {
    let factor = 1;
    if (this.releasing) {
      const duration = this.fadeOutMS;
      const time = t - this.fadeStart;
      if (time >= duration) {
        factor = 0;
        // The fade widget's play dot rests at the curve's end
        this.fadeOut.t = 1;
      } else factor = this.releaseFrom * (1 - this.fadeOut.getValue(time, duration));
    } else if (this.fades) {
      const duration = this.fadeInMS;
      const time = t - this.fadeStart;
      if (time < duration) {
        const from = this.fadeFrom;
        factor = from + (1 - from) * this.fadeIn.getValue(time, duration);
      } else this.fadeIn.t = 1;
    }
    this.fadeFactor = Cue.clampFactor(factor);
    return this.fadeFactor;
  }

  /**
   * A fade factor within 0..1 (an overshooting curve may leave it): values stay between the ones
   * the cue started from and its own
   *
   * @private
   * @param {Number} factor
   * @returns {Number}
   */
  static clampFactor(factor) {
    // eslint-disable-next-line no-nested-ternary
    return factor < 0 ? 0 : (factor > 1 ? 1 : factor);
  }

  /**
   * Plays the cue at a time within a chase item: entering the item records the start values
   * (Relative); the Fade In runs from the item's start and the Fade Out ends at its end (both
   * shrunk to fit a short item); the item's length is the hold
   *
   * @public
   * @param {Number} t time within the item, in ms
   * @param {Number} lengthMS item length in ms
   */
  playItem(t, lengthMS) {
    if (!this.itemActive || t < this.itemTime) {
      if (this.relative) this.prepareStartValues();
    }
    this.itemActive = true;
    this.itemTime = t;
    this.itemLength = lengthMS;
    let factor = 1;
    if (this.fades) {
      const { fadeIn, fadeOut } = this.itemFades(lengthMS);
      const outStart = lengthMS - fadeOut;
      if (t < fadeIn) factor = this.fadeIn.getValue(t, fadeIn);
      else if (fadeOut > 0 && t >= outStart) {
        factor = t >= lengthMS ? 0 : 1 - this.fadeOut.getValue(t - outStart, fadeOut);
      }
    }
    this.fadeFactor = Cue.clampFactor(factor);
    this.elapsed = t;
    this.update(t);
  }

  /**
   * Ends the chase item playing the cue: plays its end once (the Fade Out's end), then lets go
   *
   * @public
   */
  endItem() {
    if (!this.itemActive) return;
    this.playItem(this.itemLength, this.itemLength);
    this.itemActive = false;
    this.fadeFactor = 1;
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
    const { time } = this;
    if (time > this.endMS && this.endsAfterDuration && !this.releasing) {
      // A cue at its end: fades out when it has a Fade Out (One Shot effects), else stops at once
      if (this.fades && this.fadesOutAtEnd && this.fadeOut.duration > 0) {
        this.releasing = true;
        this.releaseFrom = this.fadeFactor;
        this.fadeStart = time;
        this.state = CUE_STATES.IDLE;
      } else {
        // Its last write at its end (a scene fully faded in), then off Live
        this.elapsed = time;
        this.computeFadeFactor(time);
        this.update(time);
        this.stopNow();
        return;
      }
    }
    this.elapsed = time;
    const factor = this.computeFadeFactor(time);
    this.update(time);
    if (this.releasing && factor <= 0) this.stopNow();
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
