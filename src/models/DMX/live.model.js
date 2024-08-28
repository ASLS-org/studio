import Worker from '@/worker?worker';

/**
 * Live states enumeration
 *
 * @constant {Object} LIVE_STATES
 * @enum {Number}
 */
const LIVE_STATES = {
  IDLE: 0,
  PLAYING: 1,
  PAUSED: 2,
};
/**
 * Live animation methods enumeration
 *
 * @constant {Object} LIVE_STATES
 * @enum {Number}
 */
const ANIMATION_METHODS = {
  RAF: 0,
  WW: 1,
};

/**
 * Quantization shift tolerance
 *
 * @constant {Number} QUANTIZATION_TOLERANCE
 */
const QUANTIZATION_TOLERANCE = 0.1;
/**
 * TAP BPM precision
 *
 * @constant {Number} TAP_PRECISION
 */
const TAP_PRECISION = 5;
/**
 * Default BPM value
 *
 * @constant {Number} DEFAULT_LIVE_BPM
 */
const DEFAULT_LIVE_BPM = 120;

const taps = [];

/**
 * @class Animation
 * @classdesc Animations are pooled into Live instance and fed time data over each cycle
 */
class Animation {
  /**
   * Creates an instance of Animation.
   *
   * @param {Function} updateFunction handle to the update function
   * @param {Number} id Animation unique ID
   */
  constructor(updateFunction, id, fps = 60) {
    this.id = id;
    this.quantizedEventPool = [];
    this._updateFunction = updateFunction;
    this.fps = fps;
    this._fpsInterval = 1000 / this.fps;
    this.then = Date.now();
    this.startTime = this.then;
  }

  /**
   * Forward call and time to update function
   *
   * @public
   * @param {Number} t time value in milliseconds
   */
  update(t) {
    const now = Date.now();
    this.elapsed = now - this.then;
    // if enough time has elapsed, draw the next frame

    if (this.elapsed > this._fpsInterval) {
      this.then = now - (this.elapsed % this._fpsInterval);
      this._updateFunction(t);
    }
  }
}

/**
 * @class Live
 * @classdesc Live singletons is in charge of managing the app's time-based animations.
 */
class Live {
  constructor() {
    // eslint-disable-next-line no-use-before-define
    if (!liveInstance) {
      this.time = 0;
      this.tick = 0;
      this.pauseTimeOffset = 0;
      this.bpm = DEFAULT_LIVE_BPM;
      this.animations = [];
      this.rafID = null;
      this.state = LIVE_STATES.PLAYING;
      this.w = new Worker();
      this.animationMethod = ANIMATION_METHODS.RAF;
      document.addEventListener('visibilitychange', () => {
        this.animationMethod = document.visibilityState === 'visible' ? ANIMATION_METHODS.RAF : ANIMATION_METHODS.WW;
      });
      // eslint-disable-next-line no-use-before-define
      liveInstance = this;
    }
    // eslint-disable-next-line no-use-before-define
    return liveInstance;
  }

  /**
   * Animation loop state
   *
   * @type {number}
   */
  set state(state) {
    switch (state) {
      case LIVE_STATES.IDLE:
        this.time = 0;
        this.tick = 0;
        this.pauseStartTime = this.realTime - this.pauseTimeOffset;
        this._state = LIVE_STATES.IDLE;
        break;
      case LIVE_STATES.PLAYING:
        this._state = LIVE_STATES.PLAYING;
        break;
      case LIVE_STATES.PAUSED:
        this.pauseStartTime = this.realTime - this.pauseTimeOffset;
        this._state = LIVE_STATES.PAUSED;
        break;
      default: break;
    }
  }

  get state() {
    return this._state;
  }

  /**
   * Preffered animation method.
   *
   * Choices include RAF (Request Animation Frame) or
   * WW (Web Workers). While RAF stops working on visibility loss, it seems
   * to be performing better than the WW method. This could however be a matter
   * of me not implementing a debouncing method.
   *
   * @type {number}
   */
  set animationMethod(method) {
    this._animationMethod = method;
    switch (this.animationMethod) {
      case ANIMATION_METHODS.WW:
        this.w.onmessage = () => {
          this.update();
        };
        break;
      case ANIMATION_METHODS.RAF:
        this.w.onmessage = () => {};
        this.update();
        break;
      default: break;
    }
  }

  get animationMethod() {
    return this._animationMethod;
  }

  /**
   * Beat duration in milliseconds
   *
   * @readonly
   * @type {number}
   */
  get beatDuration() {
    return 60000 / this.bpm;
  }

  /**
   * Bar duration in milliseconds
   *
   * @readonly
   * @type {number}
   */
  get barDuration() {
    return this.beatDuration * 4;
  }

  /**
   * Implementation of tap tempo. Sets Beats Per Minute
   * by averaging time difference between two or more calls.
   *
   * @public
   * @return {Number} bpm value following latest tap
   * @todo Implement a more precise algorithm
   */
  tapTempo() {
    const ticks = [];
    taps.push(Date.now());
    if (taps.length >= 4) {
      for (let i = 1; i < taps.length; i++) {
        const tickValue = ((60 / (taps[i] / 1000 - taps[i - 1] / 1000)) * 100) / 100;
        ticks.push(Math.round(tickValue));
      }
    }
    if (taps.length >= 8) {
      taps.shift();
    }
    if (ticks.length >= 2) {
      let n = 0;
      for (let i = ticks.length - 1; i >= 0; i--) {
        n += ticks[i];
        if (ticks.length - i >= TAP_PRECISION) break;
      }
      this.bpm = n / TAP_PRECISION;
    }
    return this.bpm;
  }

  /**
   * Updates pooled animations over time
   *
   * @public
   */
  update() {
    const time = parseInt(performance.now(), 10);
    this.realTime = time;
    if (this.state === LIVE_STATES.PLAYING) {
      this.time = time - this.pauseTimeOffset;
      this.animations.forEach((animation) => {
        animation.update(this.time);
      });
      this.tick = ((parseInt(this.time, 10) / parseInt(this.beatDuration, 10)) % 4);
    } else {
      this.pauseTimeOffset = time - this.pauseStartTime;
    }
    this.processing = false;
    if (this.animationMethod === ANIMATION_METHODS.RAF) {
      this.rafID = requestAnimationFrame(this.update.bind(this));
    }
  }

  /**
   * Adds an animation into the animation pool.
   *
   * @public
   * @param {Function} updateFunction handle to update function
   * @param {number} [quantize=0] Animation quantization
   * @return {Number} Animation ID
   */
  add(updateFunction, quantize = 0, fps = 60, quantizeReadyCallback = () => {}) {
    if (quantize) {
      const animationId = this.genAnimationId();
      const animation = new Animation(((t) => {
        const tick = ((parseInt(t, 10) / parseInt(this.beatDuration, 10)) % quantize);
        if (tick >= quantize - 1 && tick <= quantize - 1 + QUANTIZATION_TOLERANCE) {
          const animationIndex = this.animations.findIndex((item) => item.id === animationId);
          if (animationIndex > -1) {
            this.animations[animationIndex]._updateFunction = updateFunction;
            quantizeReadyCallback();
          }
        }
      }), animationId);
      this.animations.push(animation);
      return animationId;
    }
    quantizeReadyCallback();
    const animation = new Animation(updateFunction, this.genAnimationId(), fps);
    this.animations.push(animation);
    return animation.id;
  }

  /**
   * Removes an animation from the animation pool.
   *
   * @public
   * @param {Number} animationId Animation ID
   */
  remove(animationId) {
    const animationIndex = this.animations.findIndex((item) => item.id === Number(animationId));
    if (animationIndex > -1) {
      this.animations.splice(animationIndex, 1);
    } else {
      throw new Error('Could not find animation in animation pool');
    }
  }

  /**
   * Stop and reset animation loop
   *
   * @public
   * @todo Maybe clear animation pool ?
   */
  stop() {
    this.state = LIVE_STATES.IDLE;
    this.time = 0;
    this.tick = 0;
  }

  /**
   * Sets animation loop state to playing
   *
   * @public
   */
  play() {
    this.state = LIVE_STATES.PLAYING;
  }

  /**
   * Sets animation loop state to paused
   *
   * @public
   */
  pause() {
    this.state = LIVE_STATES.PAUSED;
  }

  /**
   * Generates animation unique ID
   *
   * @public
   * @returns {Number} The animation's unique ID
   */
  genAnimationId() {
    return this.animations.reduce(
      (prev, current) => (
        (prev && prev.id > current.id)
          ? prev.id
          : current.id
      ),
      -1,
    ) + 1;
  }
}

// eslint-disable-next-line vars-on-top, no-var, import/no-mutable-exports
var liveInstance = new Live();
export default liveInstance;
