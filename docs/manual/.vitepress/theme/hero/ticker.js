import { reactive } from 'vue';

/*
 * The manual's stand-in for the app's live ticker (src/plugins/live.ticker.js): same interface
 * (`frame`, `subscribe`, `unsubscribe`, `bump`), so Studio widgets that read live values through
 * views/mixins/live.mixin.js work in the manual. The home page story bumps it while its show runs;
 * it never imports the engine.
 */
const state = reactive({ frame: 0 });

const ManualTicker = {
  /**
   * Increments while live values change
   * @type {Number}
   */
  get frame() {
    return state.frame;
  },
  /**
   * A widget started reading live values (nothing to start: the story drives the ticks)
   */
  subscribe() {},
  /**
   * A widget stopped reading live values
   */
  unsubscribe() {},
  /**
   * Live values changed: widgets re-read them
   */
  bump() {
    state.frame += 1;
  },
};

export default ManualTicker;
