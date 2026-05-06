export default {
  emits: ['update:modelValue', 'submit', 'close', 'input'],
  props: {
    /**
     * Popup display state
     */
    modelValue: Boolean,
  },
  data() {
    return {
      state: this.modelValue,
    };
  },
  methods: {
    /**
     * Update popup display state
     */
    update() {
      this.$emit('update:modelValue', this.state);
      this.$emit('input', this.state);
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
    modelValue(state) {
      this.state = state;
    },
  },
};
