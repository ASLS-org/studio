export default {
  props: {
    /**
     * Popup display state
     */
    value: Boolean,
  },
  data() {
    return {
      state: this.value,
    };
  },
  methods: {
    /**
     * Update popup display state
     */
    update() {
      this.$emit("input", this.state);
    },
    /**
     * Close popup
     */
    close() {
      this.state = false;
      this.update();
    },
  },
  watch: {
    value(state) {
      this.state = state;
    },
  },
}