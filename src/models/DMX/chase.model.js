import ukColors from '@/views/components/uikit/colors/uikit.colors';
import {
  Proxify,
} from '../utils/proxify.utils';
import Live from './live.model';
import CueItemPool from './cue.item.pool.model';
import Cue from './cue.model';

/**
 * Default chase duration in bars
 *
 * @constant {Number} CHASE_DEFAULT_DURATION
 */
const CHASE_DEFAULT_DURATION = 1;
/**
 * Chase trigger styles enumeration
 *
 * @constant {Object} CHASE_TRIGGER_STYLES
 * @enum {Number}
 */
const CHASE_TRIGGER_STYLES = {
  LOOP: 0,
  ONE_SHOT: 1,
};
/**
 * Chase states enumeration
 *
 * @constant {Object} CHASE_STATES
 * @enum {Number}
 */
const CHASE_STATES = {
  STOPPED: 0,
  RUNNING: 1,
};
/**
 * Default chase data
 *
 * @constant {Object} DEFAULT_CHASE_DATA
 */
const DEFAULT_CHASE_DATA = {
  DURATION: 1,
  TRIGGER: CHASE_TRIGGER_STYLES.LOOP,
};

/**
 * @class Chase
 * @extends {Proxify}
 * @classdesc Chases are collections of cues to be triggered over time
 */
class Chase extends Proxify {
  /**
   * Creates an instance of Chase.
   * @param {Object} [data={}] chase configuration object
   * @param {Number} data.id the chase's unique ID
   * @param {String} data.name the chase's name
   * @param {Number} data.gridIndex the chase's grid index TODO: Am I still using this ?
   * @param {String} data.color the chase's color string
   * @param {Number} data.duration the chase's duration in bars
   * @param {CHASE_TRIGGER_STYLES} data.trigger the chase's trigger style
   * @param {Object} data.cues the chase's cue list
   */
  constructor(data = {}) {
    super();
    this.id = data.id;
    this.quantize = 4;
    this.onEnd = () => {};
    this.name = data.name || `Chase ${this.id}`;
    this.gridIndex = data.gridIndex;
    this.color = data.color;
    this.duration = data.duration || CHASE_DEFAULT_DURATION;
    this.trigger = data.trigger || CHASE_TRIGGER_STYLES.LOOP;
    this.elapsed = 0;
    this._cues = [];
    this.state = CHASE_STATES.STOPPED;
    // this.actualDuration = 0;
    this.proxify(['elapsed', 'animationId', 'deltaStart']);
    this.cues = data.cues;
    this.deltaStart = null;
    return this.proxify(['elapsed', 'animationId', 'deltaStart']);
  }

  /**
   * Chase color
   *
   * @type {String}
   */
  set color(color) {
    this._color = color;
  }

  get color() {
    return this._color || ukColors[Object.keys(ukColors)[this.id % Object.keys(ukColors).length]];
  }

  /**
   * Chase duration in bars
   *
   * @type {Number}
   */
  set duration(duration) {
    this._duration = duration != null ? duration : DEFAULT_CHASE_DATA.DURATION;
  }

  get duration() {
    return this._duration || DEFAULT_CHASE_DATA.DURATION;
  }

  /**
   * Chase trigger type
   *
   * @type {Number}
   */
  set trigger(trigger) {
    this._trigger = trigger != null ? trigger : DEFAULT_CHASE_DATA.TRIGGER;
  }

  get trigger() {
    return this._trigger || DEFAULT_CHASE_DATA.TRIGGER;
  }

  /**
   * Chase cue list
   *
   * @type {Object}
   */
  set cues(cues) {
    if (cues != null) {
      cues.forEach((cue) => this.addCue(cue));
    } else {
      this._cues = [];
    }
  }

  get cues() {
    return this._cues || [];
  }

  get actualDuration() {
    return Math.ceil(
      Math.max(
        ...this.cues.map((cue) => cue.duration),
        (this.duration + 2) * this.barSubDiv,
      ) / this.barSubDiv,
    );
  }

  /**
   * Chase tick duration in milliseconds
   *
   * @readonly
   * @type {Number}
   */
  get tickDuration() {
    return this.barLength / this.barSubDiv;
  }

  /**
   * Chase bar length in milliseconds
   *
   * @readonly
   * @type {Number}
   */
  // eslint-disable-next-line class-methods-use-this
  get barLength() {
    return (60000 / Live.bpm) * 4;
  }

  /**
   * Chase duration in milliseconds
   *
   * @readonly
   * @type {Number}
   */
  get durationMSec() {
    return this.barLength * this.duration;
  }

  /**
   * Chase ellapsed percentage
   *
   * @readonly
   * @type {Number}
   */
  get elapsedPerc() {
    return parseFloat(this.elapsed / this.durationMSec);
  }

  /**
   * Chase bar subdivision
   *
   * @todo set this as a constant ?
   * @readonly
   * @type {Number}
   */
  // eslint-disable-next-line class-methods-use-this
  get barSubDiv() {
    return 64; // Math.ceil(128 / this.duration)
  }

  /**
   * Chase's exportable show data chunk
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
      trigger: this.trigger,
      cues: this.cues.map((c) => c.showData),
    };
  }

  /**
   * Cues chase on/off
   *
   * @public
   * @param {Boolean} state chase's cueing state
   */
  cue(state, onReadyCallback = () => {}) {
    this.state = state;
    if (state) {
      this.elapsed = 0;
      this.deltaStart = null;
      this.animationId = Live.add(this.update.bind(this), this.quantize, 60, onReadyCallback);
    } else if (this.animationId != null) {
      this.elapsed = 0;
      this.cues.forEach((cueItemPool) => {
        cueItemPool.cue.state = 0;
        cueItemPool.cue.cue(false);
      });
      Live.remove(this.animationId);
      this.onEnd();
      this.animationId = null;
      this.deltaStart = null;
    }
  }

  /**
   * Updates chase's cues individually using provided time in milliseconds
   *
   * @public
   * @param {Number} time Live animation time in milliseconds
   */
  update(time) {
    if (this.deltaStart == null) {
      this.deltaStart = time;
    }
    const t = time - this.deltaStart;
    this.elapsed = Math.min(Math.max(t, 0), this.durationMSec);

    if (t >= this.durationMSec) {
      switch (this.trigger) {
        case CHASE_TRIGGER_STYLES.LOOP:
          this.deltaStart = time;
          break;
        case CHASE_TRIGGER_STYLES.ONE_SHOT:
          this.cue(false);
          return;
        default: break;
      }
    }
    /**
     * TODO: Check this whole routine, it does not seem efficient.
     * Also, setting cue state to 1 for scenes when cue item is running seems to
     * break a lot of things. Have a look into it.
     */
    this.cues.forEach((cueItemPool) => {
      cueItemPool.items.forEach((item) => {
        if (
          t >= item.tick * this.tickDuration
          && t <= (item.tick + item.length) * this.tickDuration
        ) {
          if (cueItemPool.cue.type === 1) cueItemPool.cue.state = 1;
          item.update(t - (item.tick * this.tickDuration));
        } else {
          cueItemPool.cue.state = 0;
        }
      });
    });
  }

  /**
   * Add a fixture to the chase
   *
   * @public
   * @param {Object} fixture
   */
  addFixture(fixture) {
    this.fixtures.push(fixture);
  }

  /**
   * Add a cue to the chase's cuepool
   *
   * @public
   * @param {Object} cue
   */
  addCue(data) {
    if (data instanceof Cue) {
      data = {
        cue: data,
      };
    }
    let cueItemPool = this.cues.find((pool) => pool.cue.id === data.cue.id);
    if (!cueItemPool) {
      cueItemPool = new CueItemPool(data);
      this.cues.push(cueItemPool); // TODO: replace with pushAndStackUndo once patched
    }
  }

  /**
   * Remove a cue from the chase's cuepool
   *
   * @public
   * @param {Object} cueItemData handle to cue to be removed
   */
  deleteCue(cueItemData) {
    const cueItemPoolIndex = this.cues.findIndex(
      (cueItemPool) => cueItemPool.cue.id === cueItemData.id,
    );
    this.cues[cueItemPoolIndex].clearAll();
    this.cues.splice(cueItemPoolIndex, 1); // TODO: replace with ..AndStackUndo once patched
  }

  /**
   * Manually remove chase instance reference from memory
   *
   * @private
   * @param {Object} instance handle to chase instance to be freed
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

export default Chase;
