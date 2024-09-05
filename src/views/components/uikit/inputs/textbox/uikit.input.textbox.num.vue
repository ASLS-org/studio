<template>
  <div
    class="uikit_num_input"
    :class="{ disabled: disabled }"
  >
    <div
      v-if="label"
      :class="{ disabled }"
      class="label"
    >
      {{ label }}
    </div>
    <div
      class="uikit_num_input_textbox_wrapper"
      :class="{color: color !== null}"
      :style="{ borderColor: !disabled && color ? `color-mix(in srgb,${color} 70%,#0000)` : '' }"
    >
      <input
        v-model="content"
        class="uikit_num_input_textbox"
        :disabled="disabled"
        :placeholder="placeholder"
        @keydown.up="incrementValue"
        @keydown.down="decrementValue"
        @keydown.stop
        @blur="updateValue"
        @keydown.enter="updateValue"
        @input="
          (v) => {
            if (autoUpdate) updateValue(v);
          }
        "
      >
      <span
        class="uikit_num_input_button"
        :style="{
          backgroundColor: !disabled && color
            ? `color-mix(in srgb,${color} 70%,#0000)`
            : ''
        }"
      >
        <span
          class="uikit_num_input_button_section"
          @click="incrementValue()"
        >
          <uk-icon
            class="uikit_num_input_button_icon"
            name="arrow_up"
          />
        </span>
        <span
          class="uikit_num_input_button_section"
          @click="decrementValue()"
        >
          <uk-icon
            class="uikit_num_input_button_icon"
            name="arrow_down"
          />
        </span>
      </span>
    </div>
  </div>
</template>

<script>
/**
 * @component NumeralInput text input restricted to number-only values.
 * Values may be incremented/decremented by clicking on  the helper arrows
 * and/or by hitting the UP/DOWN arrow keys.
 * @namespace uikit/inputs/textboxes
 * @story Default {"value": 10, "label":"default", "min": 0, "max":100}
 */
export default {
  name: 'UkNumInput',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * The numeral input's text label value
     */
    label: {
      type: String,
      default: null,
    },
    /**
     * The numeral input's placeholder text
     */
    placeholder: {
      type: String,
      default: null,
    },
    /**
     * The numeral input's minimum value
     */
    min: {
      type: [Number, String],
      default: 0,
    },
    /**
     * The numeral input's maximum value
     */
    max: {
      type: [Number, String],
      default: 100000,
    },
    /**
     * The numeral input's decimal precision
     */
    precision: {
      type: Number,
      default: 0,
    },
    /**
     * The actual numeral input value
     */
    modelValue: {
      type: [Number, String],
      default: 0,
    },
    /**
     * Whether or not the input should be disabeld
     */
    disabled: Boolean,
    /**
     * Apply aleternative color styling
     */
    color: {
      type: String,
      default: null,
      // default: 'var(--secondary-dark)',
    },
    /**
     * Whether value should be automatically updated on each keystroke or not
     * value is updated on input blur or keydown "enter" otherwise
     */
    autoUpdate: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'input'],
  data() {
    return {
      /**
       * Numeral input's value (reactive)
       */
      content: this.modelValue,
    };
  },
  watch: {
    modelValue(value) {
      this.content = parseFloat(value);
      this.updateValue(false);
    },
  },
  beforeMount() {
    if (this.default != null) {
      this.updateValue();
    }
    if (this.label == null) {
      this.hasLabel = false;
    } else {
      this.hasLabel = true;
    }
  },
  mounted() {
    if (this.default != null) {
      this.content = this.modelValue;
    }
    if (this.label == null) {
      this.hasLabel = false;
    } else {
      this.hasLabel = true;
    }
    this.updateValue(false);
  },
  methods: {
    /**
     * Increments actual value by one precision unit.
     *
     */
    incrementValue() {
      const increment = parseFloat(this.content) + parseFloat(10 ** -this.precision);
      if (increment <= this.max && !this.disabled) {
        this.content = increment.toFixed(this.precision);
        this.updateValue(true);
      }
    },
    /**
     * Decrements value actual value by one precision unit.
     *
     */
    decrementValue() {
      const decrement = parseFloat(this.content) - parseFloat(10 ** -this.precision);
      if (decrement >= this.min && !this.disabled) {
        this.content = decrement.toFixed(this.precision);
        this.updateValue(true);
      }
    },
    /**
     * Updates input value
     *
     * @param {Boolean} doEmit whether or not to emit changes back to parent element.
     */
    updateValue(doEmit = true) {
      const val = parseFloat(this.content).toFixed(this.precision);
      this.content = val;
      if (val < this.min || Number.isNaN(val)) {
        this.content = parseFloat(this.min >= 0 ? this.min : 0).toFixed(this.precision);
      } else if (val > this.max) {
        this.content = parseFloat(this.max).toFixed(this.precision);
      }
      if (doEmit) {
        /**
         * Input value changed
         *
         * @property {Number} content Parsed and precision limited input value
         */
        this.$emit('update:modelValue', parseFloat(Number(this.content).toFixed(this.precision)));
        this.$emit('input', parseFloat(Number(this.content).toFixed(this.precision)));
      }
    },
  },
};
</script>

<style scoped>
.uikit_num_input {
  display: flex;
  flex-direction: column;
  user-select: none;
  width: fit-content;
}

.uikit_num_input_textbox_wrapper {
  display: flex;
  user-select: none;
  width: 100%;
}
.uikit_num_input_textbox_wrapper:not(.color):focus-within {
  outline: 1px solid var(--accent-blue);
  outline-offset: -1px;
}

.uikit_num_input_textbox_wrapper.color:focus-within {
  outline: 1px solid var(--secondary-light);
  outline-offset: -1px;
}
.uikit_num_input_textbox {
  font-family: Roboto-Regular;
  border: none;
  background: var(--primary-dark);
  color: var(--secondary-lighter);
  font-size: 12px;
  display: flex;
  width: calc(100% - 14px);
  padding: 0;
  -moz-appearance: textfield;
  text-align: center;
}
.uikit_num_input_textbox_wrapper {
  display: flex;
  height: 25px;
  border: 1px solid var(--secondary-dark);
}
.uikit_num_input_button {
  display: flex;
  background: var(--secondary-dark);
  width: 14px;
  align-items: center;
  flex-direction: column;
  cursor: pointer;
  padding: 1px 0;
}
.disabled .uikit_num_input_button {
  background: var(--secondary-dark);
}
.disabled .uikit_num_input_button_icon {
  fill: var(--secondary-light);
}
.uikit_num_input_button_section {
  height: 50%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color .2s;
}
.uikit_num_input_button_section:hover{
  background-color: var(--secondary-dark);
}
.uikit_num_input_button_icon {
  height: 8px !important;
  width: 8px !important;
  fill: var(--secondary-lighter);
  fill-opacity: 0.7;
}
.uikit_num_input_textbox::-webkit-inner-spin-button,
.uikit_num_input_textbox::-webkit-outer-spin-button {
  -webkit-appearance: none;
  -moz-appearance: none;
}
.uikit_num_input_textbox:focus {
  outline: none;
}
.uikit_num_input_textbox::placeholder {
  font-size: 12px;
  color: var(--secondary-light);
}
.disabled .uikit_num_input_textbox {
  background: var(--secondary-darker);
  color: var(--secondary-light);
}
.disabled:focus-within {
  outline: none !important;
}
</style>
