<template>
  <div @dblclick="value = max" class="uikit_knob_wrapper" :class="{ disabled: disabled }">
    <h4 v-if="label" class="uikit_knob_label">{{ label }}</h4>
    <div class="uikit_knob" @mousedown="startDrag" @mouseup="stopDrag">
      <svg style="position: absolute; height: 100%; width: 100%">
        <path ref="outline" fill="none" stroke="var(--primary-dark)" stroke-width="4" />
        <path ref="fill" fill="none" :stroke="color" stroke-width="4" />
      </svg>
      <!-- <svg class="perc" :style="outlineStyling">
        <circle cx="23" cy="23" r="21" />
      </svg> -->
      <div ref="knob" class="uikit_knob_inside" :style="insideStyling">
        <span style="flex: 1" />
        <span class="uikit_knob_inside_tick" />
      </div>
    </div>
  </div>
</template>

<script>
/**
 * @component Knob  A virtual machine-style knob component which can be used in order to select values within a given range.
 * @namespace uikit/inputs/range
 * @story Default {"min": 0, "max": 100, "default": 0, "value": 50}
 * @story Disabled {"disabled":true}
 */
export default {
  name: "ukKnob",
  props: {
    /**
     * Actual knob value
     */
    value: Number,
    /**
     * The knob's minimum value
     */
    min: {
      type: Number,
      default: 0,
    },
    /**
     * The knob's maximum value
     */
    max: {
      type: Number,
      default: 100,
    },
    /**
     * knob's track color
     */
    color: {
      type: String,
      default: "#533aaa",
    },
    /**
     * The knob's text label value
     */
    label: {
      type: String,
      default: "Strobe",
    },
    /**
     * Whether the knob is disabled or not
     */
    disabled: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    /**
     * Computes knob's outline styling
     *
     * @property outlineStyling
     * @returns {Object} CSS-Formated Styling object
     */
    outlineStyling() {
      return !this.disabled
        ? {
            stroke: this.color,
            strokeDasharray: `${(this.value / this.max) * 132} 999`,
          }
        : {
            strokeDasharray: `${(this.value / this.max) * 132} 999`,
          };
    },
    /**
     * Computes knob's inside styling
     *
     * @property insideStyling
     * @returns {Object} CSS-Formated Styling object
     */
    insideStyling() {
      return {
        transform: `rotate(${Math.min(Math.max(Math.floor((this.value / this.max) * 360), 30), 330)}deg)`,
      };
    },
  },
  methods: {
    polarToCartesian(centerX, centerY, radius, angleInDegrees) {
      var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
      };
    },

    describeArc(x, y, radius, startAngle, endAngle) {
      var start = this.polarToCartesian(x, y, radius, endAngle);
      var end = this.polarToCartesian(x, y, radius, startAngle);

      var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

      var d = ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");

      return d;
    },
    /**
     * Prepare knob's dragging.
     *
     */
    startDrag() {
      this.prev = this.value;
      window.addEventListener("mousemove", this.drag);
      window.addEventListener("mouseup", this.stopDrag);
    },
    /**
     * Re-compute knob's rotation styling and value accordingly to mouse move
     *
     * @param {Object} e mousemove event
     */
    drag(e) {
      if (!this.disabled) {
        let box = this.$refs.knob.getBoundingClientRect();
        let offsetY = (box.top + box.bottom) / 2;
        let posY = e.clientY;
        let d = offsetY - posY;
        let value = Math.round(Math.max(Math.min(d + this.prev, this.max), this.min));
        this.value = value;
        this.$refs.fill.setAttribute("d", this.describeArc(25, 25, 23, -150, (value / this.max) * 300 - 150));
        /**
         * Knob's value changed
         *
         * @property {Number} val the Knob's actul value
         */
        this.$emit("input", this.value);
      }
    },
    /**
     * Ends knob dragging procedure.
     *
     */
    stopDrag() {
      window.removeEventListener("mousemove", this.drag);
    },
  },
  mounted() {
    this.$refs.outline.setAttribute("d", this.describeArc(25, 25, 23, -150, 150));
    this.$refs.fill.setAttribute("d", this.describeArc(25, 25, 23, -150, (this.value / this.max) * 300 - 150));

    // this.$refs.fill.setAttribute("d", this.describeArc(23, 23, 21, -150, 15));
  },
  watch: {
    value(val) {
      this.value = val;
      this.$refs.fill.setAttribute("d", this.describeArc(25, 25, 23, -150, (val / this.max) * 300 - 150));
    },
  },
};
</script>

<style scoped>
.uikit_knob_wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  align-items: center;
  justify-content: center;
}
.uikit_knob {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  /* background: var(--primary-dark); */
  cursor: pointer;
}
.uikit_knob_inside {
  display: flex;
  flex-direction: column;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  /* background: linear-gradient(180deg, #161913 0%, #343434 100%); */
  background: linear-gradient(180deg, var(--primary-light), var(--secondary-dark) 100%);
  border: 3px solid var(--primary-lighter-alt);
  align-items: center;
}
.uikit_knob_inside_tick {
  display: flex;
  height: 8px;
  width: 2px;
  background: var(--secondary-lighter);
}
.perc {
  position: absolute;
  transform: rotate(90deg);
  width: 46px;
  height: 46px;
  stroke: var(--accent-blue);
  stroke-width: 4;
  fill: transparent;
  stroke-dasharray: 100 999;
}
.uikit_knob_label {
  text-align: center;
  width: 100%;
}
.uikit_knob_value {
  text-align: center;
  width: 100%;
  background: var(--secondary-light);
  color: var(--secondary-light);
  border-radius: 5px;
}
.uikit_knob_value h4 {
  color: #ffffff80;
}
.disabled {
  opacity: 0.5;
}
</style>
