<template>
  <div class="uikit_num_input" :class="{ disabled: disabled }">
    <div :class="{ disabled }" class="label" v-if="label">
      {{ label }}
    </div>
    <div class="uikit_num_input_textbox_wrapper" :style="{ borderColor: !disabled ? color : '' }">
      <input
        class="uikit_num_input_textbox"
        @keydown.up="incrementValue"
        @keydown.down="decrementValue"
        @keydown.stop
        @blur="updateValue"
        @keydown.enter="updateValue"
        :disabled="disabled"
        :placeholder="placeholder"
        @input="
          (v) => {
            if (autoUpdate) updateValue(v);
          }
        "
        v-model="content"
      />
      <span class="uikit_num_input_button" :style="{ backgroundColor: !disabled ? color : '' }">
        <span class="uikit_num_input_button_section" @click="incrementValue()">
          <uk-icon class="uikit_num_input_button_icon" name="arrow_up" />
        </span>
        <span class="uikit_num_input_button_section" @click="decrementValue()">
          <uk-icon class="uikit_num_input_button_icon" name="arrow_down" />
        </span>
      </span>
    </div>
  </div>
</template>

<script>
/**
 * @component NumeralInput A text input restricted to number-only values. Values may be incremented/decremented by clicking on
 * the helper arrows and/or by hitting the UP/DOWN arrow keys.
 * @namespace uikit/inputs/textboxes
 * @story Default {"value": 10, "label":"default", "min": 0, "max":100}
 */
export default {
  name: "ukNumInput",
  props: {
    /**
     * The numeral input's text label value
     */
    label: String,
    /**
     * The numeral input's placeholder text
     */
    placeholder: String,
    /**
     * The numeral input's minimum value
     */
    min: {
      type: Number,
      default: 0,
    },
    /**
     * The numeral input's maximum value
     */
    max: {
      type: Number,
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
    value: {
      type: Number,
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
      default: "var(--secondary-dark)",
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
  data() {
    return {
      /**
       * Numeral input's value (reactive)
       */
      content: this.value.toFixed(this.precision),
    };
  },
  methods: {
    /**
     * Increments actual value by one precision unit.
     *
     */
    incrementValue() {
      let increment = parseFloat(this.content) + parseFloat(Math.pow(10, -this.precision));
      if (increment <= this.max && !this.disabled) {
        this.content = increment.toFixed(this.precision);
        this.$emit("input", parseFloat(this.content));
      }
    },
    /**
     * Decrements value actual value by one precision unit.
     *
     */
    decrementValue() {
      let decrement = parseFloat(this.content) - parseFloat(Math.pow(10, -this.precision));
      if (decrement >= this.min && !this.disabled) {
        this.content = decrement.toFixed(this.precision);
        this.$emit("input", parseFloat(this.content));
      }
    },
    /**
     * Updates input value
     *
     * @param {Boolean} doEmit whether or not to emit changes back to parent element.
     */
    updateValue(doEmit = true) {
      var val = parseFloat(this.content).toFixed(this.precision);
      if (val < this.min || isNaN(val)) {
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
        this.$emit("input", parseFloat(Number(this.content).toFixed(this.precision)));
      }
    },
  },
  beforeMount() {
    if (this.default != null) {
      this.value = this.default;
    }
    if (this.label == null) {
      this.hasLabel = false;
    } else {
      this.hasLabel = true;
    }
  },
  watch: {
    value: function (value) {
      this.content = parseFloat(value);
      this.updateValue(false);
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
.uikit_num_input_textbox_wrapper:focus-within {
  outline: 1px solid var(--accent-blue);
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
