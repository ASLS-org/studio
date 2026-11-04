import { reactive } from 'vue';
import Live, { LIVE_STATES } from '@/models/DMX/live.model';

/**
 * Refresh interval of live-value widgets in milliseconds (25 Hz)
 *
 * @constant {Number} REFRESH_INTERVAL
 */
const REFRESH_INTERVAL = 40;

const state = reactive({ frame: 0 });
let subscribers = 0;
let timer = null;

/**
 * UI ticker for widgets that display live values (channel values, cue progress, playheads).
 *
 * Playback writes bypass Vue, so these widgets read live values inside a computed (or render)
 * that touches `$liveTicker.frame`. The counter advances every REFRESH_INTERVAL while the show
 * plays and at least one widget is subscribed; `bump()` refreshes right after an operator edit.
 * Widgets call `subscribe()` when mounted and `unsubscribe()` when unmounted.
 */
const LiveTicker = {
  /**
   * Reactive refresh counter
   *
   * @readonly
   * @type {Number}
   */
  get frame() {
    return state.frame;
  },

  /**
   * Starts refreshing for one more widget
   *
   * @public
   */
  subscribe() {
    subscribers++;
    if (!timer) {
      timer = setInterval(() => {
        if (Live.state === LIVE_STATES.PLAYING) {
          state.frame++;
        }
      }, REFRESH_INTERVAL);
    }
  },

  /**
   * Stops refreshing for one widget; the timer stops with the last one
   *
   * @public
   */
  unsubscribe() {
    subscribers = Math.max(subscribers - 1, 0);
    if (!subscribers && timer) {
      clearInterval(timer);
      timer = null;
    }
  },

  /**
   * Refreshes live widgets now (after an operator edit, or a play state change)
   *
   * @public
   */
  bump() {
    state.frame++;
  },
};

export default LiveTicker;
