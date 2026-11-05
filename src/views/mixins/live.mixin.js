/**
 * Mixin for components that display live values (channel values, cue state and progress,
 * chase playheads, activity meters).
 *
 * Playback writes bypass Vue, so read those values in a computed or method that touches
 * `liveFrame`: the component then refreshes with the live ticker (see plugins/live.ticker.js).
 * Call `this.$liveTicker.bump()` after an operator edit to refresh immediately.
 */
export default {
  computed: {
    /**
     * Live ticker counter; touch it wherever live values are read
     */
    liveFrame() {
      return this.$liveTicker.frame;
    },
  },
  mounted() {
    this.$liveTicker.subscribe();
  },
  methods: {
    /**
     * Returns a live value and makes the calling render refresh with the live ticker,
     * e.g. `live(cue.state)` in a template
     *
     * @param {*} value live value read by the caller
     * @returns {*} the same value
     */
    live(value) {
      // eslint-disable-next-line no-unused-expressions
      this.liveFrame;
      return value;
    },
  },
  beforeUnmount() {
    this.$liveTicker.unsubscribe();
  },
};
