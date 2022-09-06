<template>
  <div class="uikit_fader">
    <div class="uikit_fader_wrapper">
      <input
        class="uikit_fader_slider"
        :class="{ long, short }"
        ref="track"
        v-model="content"
        type="range"
        :min="min"
        :max="max"
        :disabled="disabled"
        v-on:input="updateValue"
      />
    </div>
    <h3 :style="{ marginBottom: !short ? '8px' : '' }" class="uikit_fader_label" :class="{ disabled: disabled }" v-if="label != null">
      {{ label }}
    </h3>
  </div>
</template>

<script>
/**
 * @component Fader A virtual machine-style fader component which can be used in order to select values within a given range.
 * @namespace uikit/inputs/range
 * @story Default {"min": 0, "max": 100, "default": 0, "value": 50}
 * @story Disabled {"disabled":true}
 * @story Long {"min": 0, "max": 100, "default": 0, "value": 50, "long": true}
 * @story Short {"min": 0, "max": 100, "default": 0, "value": 50, "short": true}
 */
export default {
  name: "ukFader",
  props: {
    /**
     * The fader's text label value
     */
    label: String,
    /**
     * The fader's minimum value
     */
    min: Number,
    /**
     * The fader's maximum value
     */
    max: Number,
    /**
     * The fader's default value
     */
    default: Number,
    /**
     * Whether the fader is disabled or not
     */
    disabled: Boolean,
    /**
     * Actual fader value
     */
    value: Number,
    /**
     * Whether alternative long styling should be applied
     */
    long: Boolean,
    /**
     * Whether alternative short styling should be applied
     */
    short: Boolean,
    /**
     * Fader's active track color
     */
    color: {
      type: String,
      default: "#2D6BA2",
    },
  },
  data() {
    return {
      /**
       * The fader's value (reactive)
       */
      content: this.value,
    };
  },
  methods: {
    /**
     * Updates the fader's value
     *
       * @param {Boolean} doEmit wheter or not we want to emit changes to parent element.
     */
    updateValue(doEmit = true) {
      if (!this.disabled) {
        var percentage = (this.content / (this.max - this.min)) * 100;
        this.$refs.track.style.background = `linear-gradient(90deg,${this.color} 0%,${this.color} ${percentage}%,var(--primary-dark) ${percentage}%, var(--primary-dark) 100%)`;
        // this.$refs.track.style.background = `linear-gradient(90deg,#4786B4 0%,#78FFDF ${percentage}%,#0C0E0A ${percentage}%, #0C0E0A 100%)`;
      } else {
        this.$refs.track.style.background = `#ffffff0d`;
      }
      if (doEmit) {
        /**
         * Fader's value changed
         *
         * @property {Number} content the fader's actual value
         */
        this.$emit("input", parseInt(this.content));
      }
    },
  },
  mounted() {
    if (this.default != null) {
      this.value = this.default;
    }
    if (this.label == null) {
      this.hasLabel = false;
    } else {
      this.hasLabel = true;
    }
    this.updateValue(false);
  },
  watch: {
    value: function (val) {
      this.content = val;
      this.updateValue(false);
    },
    disabled: function () {
      this.updateValue(false);
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
  width: 70px;
  height: 100%;
}
.uikit_fader_wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
}
.uikit_fader_slider {
  -webkit-appearance: none;
  height: 7px;
  width: 100px;
  padding: 0;
  margin: 0;
  transform: rotate(-90deg);
  border-radius: 5px;
  background: var(--primary-dark);
  box-shadow: inset 2px 2px 2px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}
.long {
  width: 200px !important;
  height: 9px !important;
}
.short {
  width: 80px !important;
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
  height: 17px;
  width: 36px;
  background: linear-gradient(
    -90deg,
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
  height: 17px;
  width: 36px;
  background: linear-gradient(
    -90deg,
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
