import { QUALITY_LEVELS } from './stage_lighting';

/**
 * Quality setting values: Auto, or one of the quality levels
 *
 * @constant {Object} QUALITY_SETTINGS
 */
export const QUALITY_SETTINGS = {
  AUTO: 'auto',
  ...QUALITY_LEVELS,
};

/**
 * Beam guides setting values (Auto shows guides at the Guides level only)
 *
 * @constant {Object} GUIDE_SETTINGS
 */
export const GUIDE_SETTINGS = {
  AUTO: 'auto',
  ON: 'on',
  OFF: 'off',
};

/**
 * Resolution scale steps, highest first
 *
 * @constant {Array<Number>} RESOLUTION_SCALES
 */
export const RESOLUTION_SCALES = [1, 0.75, 0.5, 0.35];

const STORAGE_KEY = 'asls.visualizer.quality';
const DEFAULT_SETTINGS = {
  quality: QUALITY_SETTINGS.AUTO,
  scale: 1,
  guides: GUIDE_SETTINGS.AUTO,
};

const LEVEL_ORDER = [
  QUALITY_LEVELS.GUIDES,
  QUALITY_LEVELS.LOW,
  QUALITY_LEVELS.MEDIUM,
  QUALITY_LEVELS.HIGH,
];

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;
const LOW_MEMORY_GB = 4;
const LOW_CORES = 4;

// Governor timing (ms) and thresholds (fractions of the refresh interval)
const WINDOW_MS = 3000;
const RAISE_AFTER_MS = 10000;
const EVALUATE_EVERY_MS = 500;
const FLICKER_MS = 15000;
const RAISE_BLOCK_MS = 60000;
const OVER_BUDGET = 1.25;
const AT_REFRESH = 1.1;
const UNDER_BUDGET = 0.6;
const MIN_SAMPLES = 20;
const SAMPLE_CAPACITY = 512;
const DEFAULT_REFRESH_MS = 1000 / 60;
const MIN_REFRESH_MS = 1000 / 144;
// Lighting resolution step taken when the level changes
const SCALE_AFTER_DROP = 2;
const SCALE_AFTER_RAISE = RESOLUTION_SCALES.length - 1;

/**
 * Reads the quality settings stored on this device, with defaults for anything missing or invalid
 *
 * @public
 * @returns {Object} Settings: quality, scale, guides
 */
export function loadQualitySettings() {
  let stored = null;
  try {
    stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    stored = null;
  }
  const settings = { ...DEFAULT_SETTINGS };
  if (stored && typeof stored === 'object') {
    if (Object.values(QUALITY_SETTINGS).includes(stored.quality)) settings.quality = stored.quality;
    if (RESOLUTION_SCALES.includes(stored.scale)) settings.scale = stored.scale;
    if (Object.values(GUIDE_SETTINGS).includes(stored.guides)) settings.guides = stored.guides;
  }
  return settings;
}

/**
 * Stores the quality settings on this device (ignored when storage is unavailable)
 *
 * @public
 * @param {Object} settings Settings: quality, scale, guides
 */
export function saveQualitySettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // Storage blocked: settings last until reload
  }
}

/**
 * Picks the starting quality level from the device: a software renderer starts at Guides, a
 * device with little memory or few cores at Low, anything else at High
 *
 * @public
 * @param {WebGL2RenderingContext} gl Renderer context
 * @returns {String} Quality level
 */
export function startingLevel(gl) {
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
  if (SOFTWARE_RENDERER.test(renderer)) return QUALITY_LEVELS.GUIDES;
  const { deviceMemory, hardwareConcurrency } = navigator;
  if ((deviceMemory && deviceMemory <= LOW_MEMORY_GB)
    || (hardwareConcurrency && hardwareConcurrency <= LOW_CORES)) {
    return QUALITY_LEVELS.LOW;
  }
  return QUALITY_LEVELS.HIGH;
}

/**
 * @class QualityGovernor
 * @classdesc Adjusts the quality level and lighting resolution from measured frame times (Auto
 * quality). It lowers the resolution, then the level, when frames come over 1.25 × the refresh
 * interval apart for 3 s. It raises them after 10 s of frames at the refresh rate whose drawing
 * took under 0.6 × the refresh interval (frame intervals can't show spare time), and stops raising
 * for a minute when a raise is undone within 15 s.
 */
export class QualityGovernor {
  /**
   * @param {String} level Starting quality level
   */
  constructor(level) {
    this._levelIndex = Math.max(LEVEL_ORDER.indexOf(level), 0);
    this._scaleIndex = 0;
    this._times = new Float64Array(SAMPLE_CAPACITY);
    this._intervals = new Float32Array(SAMPLE_CAPACITY);
    this._work = new Float32Array(SAMPLE_CAPACITY);
    this._sorted = new Float32Array(SAMPLE_CAPACITY);
    this._sortedWork = new Float32Array(SAMPLE_CAPACITY);
    this._head = 0;
    this._size = 0;
    this._lastChange = 0;
    this._lastRaise = -Infinity;
    this._raiseBlockedUntil = 0;
    this._underSince = null;
    this._nextEvaluation = 0;
    this._refreshMs = DEFAULT_REFRESH_MS;
  }

  /**
   * Current quality level
   *
   * @type {String}
   */
  get level() {
    return LEVEL_ORDER[this._levelIndex];
  }

  /**
   * Current lighting resolution scale
   *
   * @type {Number}
   */
  get scale() {
    return RESOLUTION_SCALES[this._scaleIndex];
  }

  /**
   * Records a frame drawn right after another one
   *
   * @public
   * @param {Number} interval Interval since the previous frame (ms)
   * @param {Number} work Time spent drawing the frame (ms)
   * @param {Number} now Current time (ms)
   * @returns {Boolean} Whether the level or scale changed
   */
  sample(interval, work, now) {
    this._times[this._head] = now;
    this._intervals[this._head] = interval;
    this._work[this._head] = work;
    this._head = (this._head + 1) % SAMPLE_CAPACITY;
    this._size = Math.min(this._size + 1, SAMPLE_CAPACITY);
    if (now < this._nextEvaluation) return false;
    this._nextEvaluation = now + EVALUATE_EVERY_MS;
    return this.evaluate(now);
  }

  /**
   * Compares the last 3 s of frames with the refresh interval and steps quality
   *
   * @private
   * @param {Number} now Current time (ms)
   * @returns {Boolean} Whether the level or scale changed
   */
  evaluate(now) {
    let n = 0;
    for (let i = 0; i < this._size; i++) {
      if (now - this._times[i] <= WINDOW_MS) {
        this._sortedWork[n] = this._work[i];
        this._sorted[n++] = this._intervals[i];
      }
    }
    if (n < MIN_SAMPLES || now - this._lastChange < WINDOW_MS) return false;
    const window = this._sorted.subarray(0, n).sort();
    const fast = window[Math.floor(n * 0.2)];
    const refresh = Math.min(Math.max(fast, MIN_REFRESH_MS), DEFAULT_REFRESH_MS);
    this._refreshMs = refresh;
    const median = window[Math.floor(n / 2)];
    const work = this._sortedWork.subarray(0, n).sort()[Math.floor(n / 2)];
    if (median > refresh * OVER_BUDGET) {
      this._underSince = null;
      if (now - this._lastRaise < FLICKER_MS) this._raiseBlockedUntil = now + RAISE_BLOCK_MS;
      return this.step(-1, now);
    }
    if (median <= refresh * AT_REFRESH && work < refresh * UNDER_BUDGET) {
      if (this._underSince === null) this._underSince = now;
      if (now - this._underSince >= RAISE_AFTER_MS && now >= this._raiseBlockedUntil) {
        this._underSince = null;
        this._lastRaise = now;
        return this.step(1, now);
      }
    } else {
      this._underSince = null;
    }
    return false;
  }

  /**
   * Lowers (-1) or raises (+1) quality one step: resolution first, then level
   *
   * @private
   * @param {Number} direction -1 or 1
   * @param {Number} now Current time (ms)
   * @returns {Boolean} Whether anything changed
   */
  step(direction, now) {
    const scaled = this.level === QUALITY_LEVELS.MEDIUM || this.level === QUALITY_LEVELS.HIGH;
    const levelBefore = this._levelIndex;
    const scaleBefore = this._scaleIndex;
    if (direction < 0) {
      if (scaled && this._scaleIndex < RESOLUTION_SCALES.length - 1) {
        this._scaleIndex++;
      } else if (this._levelIndex > 0) {
        this._levelIndex--;
        this._scaleIndex = SCALE_AFTER_DROP;
      }
    } else if (scaled && this._scaleIndex > 0) {
      this._scaleIndex--;
    } else if (this._levelIndex < LEVEL_ORDER.length - 1) {
      this._levelIndex++;
      this._scaleIndex = SCALE_AFTER_RAISE;
    }
    const changed = levelBefore !== this._levelIndex || scaleBefore !== this._scaleIndex;
    if (changed) this._lastChange = now;
    return changed;
  }
}
