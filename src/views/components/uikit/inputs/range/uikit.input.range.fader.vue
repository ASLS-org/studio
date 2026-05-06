<template>
  <div class="uikit_fader">
    <div class="uikit_fader_wrapper">
      <input
        ref="track"
        v-model="content"
        class="uikit_fader_slider"
        type="range"
        :min="min"
        :max="max"
        :disabled="disabled"
        @input="updateValue"
      >
    </div>
    <h3
      v-if="label != null"
      class="uikit_fader_label"
      :class="{ disabled: disabled }"
    >
      {{ label }}
    </h3>
  </div>
</template>

<script>
/**
 * @component Fader fader which can be used in order to select values within a given range.
 * @namespace uikit/inputs/range
 * @story Default {"min": 0, "max": 100, "default": 0, "value": 50}
 * @story Disabled {"disabled":true}
 * @story Long {"min": 0, "max": 100, "default": 0, "value": 50, "long": true}
 * @story Short {"min": 0, "max": 100, "default": 0, "value": 50, "short": true}
 */
export default {
  name: 'UkFader',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * The fader's text label value
     */
    label: {
      type: String,
      default: null,
    },
    /**
     * The fader's minimum value
     */
    min: {
      type: [Number, String],
      default: 0,
    },
    /**
     * The fader's maximum value
     */
    max: {
      type: [Number, String],
      default: 100,
    },
    /**
     * The fader's default value
     */
    default: {
      type: [Number, String],
      default: 0,
    },
    /**
     * Whether the fader is disabled or not
     */
    disabled: Boolean,
    /**
     * Actual fader value
     */
    modelValue: {
      type: [Number, String],
      default: 0,
    },
    /**
     * Fader's active track color
     */
    color: {
      type: String,
      default: '#2D6BA2',
    },
  },
  emits: ['update:modelValue', 'input'],
  data() {
    return {
      /**
       * The fader's value (reactive)
       */
      content: this.modelValue,
    };
  },
  watch: {
    modelValue(val) {
      this.content = val;
      this.updateValue(false);
    },
    disabled() {
      this.updateValue(false);
    },
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
     * Updates the fader's value
     *
       * @param {Boolean} doEmit wheter or not we want to emit changes to parent element.
     */
    updateValue(doEmit = true) {
      if (!this.disabled) {
        const percentage = (this.content / (this.max - this.min)) * 100;
        if (this.$refs.track) {
          this.$refs.track.style.background = `linear-gradient(0deg,${this.color} 0%,${this.color} ${percentage}%,var(--primary-dark) ${percentage}%, var(--primary-dark) 100%)`;
        }
      } else if (this.$refs.track) {
        this.$refs.track.style.background = '#ffffff0d';
      }
      if (doEmit) {
        /**
         * Fader's value changed
         *
         * @property {Number} content the fader's actual value
         */
        this.$emit('update:modelValue', this.content);
        this.$emit('input', parseInt(this.content, 10));
      }
    },
  },
};
</script>

<style scoped>

.uikit_fader {
  display: flex;
  flex-direction: column;
  user-select: none;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
  overflow: hidden;
  padding-top: 8px;
  padding-bottom: 8px;
}
.uikit_fader_wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  padding: 8px 0;
}
.uikit_fader_slider {
  -webkit-appearance: none;
  height: 100%;
  width: 7px;
  padding: 0 0;
  margin: 0;
  border-radius: 5px;
  background: var(--primary-dark);
  box-shadow: inset 2px 2px 2px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  writing-mode: vertical-lr;
  direction: rtl;
  vertical-align: middle;
}
.uikit_fader_slider:disabled {
  -webkit-appearance: none;
  background: var(--secondary-darker);
  box-shadow: none;
}
.uikit_fader_label {
  display: flex;
  justify-content: center;
}
.uikit_fader_label.disabled {
  color: var(--secondary-light) !important;
}

/** Chrome Specific Range Styling */

.uikit_fader_slider::-webkit-slider-runnable-track {
  -webkit-appearance: none;
  background: transparent;
}

.uikit_fader_slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  border: none;
  border-radius: 0;
  height: 36px;
  width: 17px;
  background: linear-gradient(
    180deg,
    #1b1d18 0%,
    #373a33 12.22%,
    #161913 12.22%,
    #232521 46.42%,
    #252623 49.75%,
    rgb(17, 17, 17) 50%,
    rgb(17, 17, 17) 50%,
    rgb(27, 27, 27) 51%,
    rgb(27, 27, 27) 51%,
    rgb(17, 17, 17) 52%,
    rgb(17, 17, 17) 52%,
    #252623 53%,
    rgba(66, 66, 66, 1) 88.68%,
    #21231e 89.18%,
    #0c0e0a 100%
  );
}

/** Firefox Specific Range Styling */

.uikit_fader_slider::-moz-range-track {
  -webkit-appearance: none;
  background: transparent;
  width: 0px;
}
.uikit_fader_slider::-moz-range-thumb {
  border: none;
  border-radius: 0;
  height: 36px;
  width: 17px;
  background: linear-gradient(
    180deg,
    #1b1d18 0%,
    #373a33 12.22%,
    #161913 12.22%,
    #232521 46.42%,
    #252623 49.75%,
    rgb(17, 17, 17) 50%,
    rgb(17, 17, 17) 50%,
    rgb(27, 27, 27) 51%,
    rgb(27, 27, 27) 51%,
    rgb(17, 17, 17) 52%,
    rgb(17, 17, 17) 52%,
    #252623 53%,
    rgba(66, 66, 66, 1) 88.68%,
    #21231e 89.18%,
    #0c0e0a 100%
  );
}
</style>
