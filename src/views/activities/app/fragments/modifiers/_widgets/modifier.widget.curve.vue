<template>
  <uk-widget
    dockable
    class="widget_curve"
    :header="{ title }"
  >
    <uk-flex
      col
      :gap="8"
      class="widget_curve_body"
    >
      <uk-select-input
        v-model="fade.type"
        class="widget_curve_type"
        label="Type"
        :options="presetOptions"
      />
      <uk-flex :gap="8">
        <uk-num-input
          v-model="fade.controlPoints[0].x"
          :precision="2"
          :max="1"
          label="CP1 X"
        />
        <uk-num-input
          v-model="fade.controlPoints[0].y"
          :precision="2"
          :min="CP_Y_MIN"
          :max="CP_Y_MAX"
          label="CP1 Y"
        />
      </uk-flex>
      <uk-flex :gap="8">
        <uk-num-input
          v-model="fade.controlPoints[1].x"
          :precision="2"
          :max="1"
          label="CP2 X"
        />
        <uk-num-input
          v-model="fade.controlPoints[1].y"
          :precision="2"
          :min="CP_Y_MIN"
          :max="CP_Y_MAX"
          label="CP2 Y"
        />
      </uk-flex>
    </uk-flex>
    <div class="widget_curve_modifier">
      <canvas
        ref="curveModifier"
        width="190"
        height="189"
        class="widget_curve_modifier_canvas"
      />
      <div
        id="cp1"
        ref="cp1"
        :style="cp1Style"
        class="widget_curve_cp"
        @mousedown="(e)=>{startDragCp(e, 0)}"
        @mouseup="stopDragCp"
      />
      <div
        id="cp2"
        ref="cp2"
        :style="cp2Style"
        class="widget_curve_cp"
        @mousedown="(e)=>{startDragCp(e, 1)}"
        @mouseup="stopDragCp"
      />
      <div
        :style="cp3Style"
        class="widget_curve_picker"
      />
    </div>
  </uk-widget>
</template>

<script>
import LiveMixin from '@/views/mixins/live.mixin';
import Fade, { FADE_PRESETS, FADE_PRESET_NAMES } from '@/models/DMX/fade.model';

/**
 * Values the canvas shows, bottom to top: room above 1 and below 0 for overshooting curves
 *
 * @constant {Number} VIEW_MIN
 * @constant {Number} VIEW_MAX
 */
const VIEW_MIN = -0.25;
const VIEW_MAX = 1.25;

/**
 * Range of a control point's Y (X stays within 0 to 1)
 *
 * @constant {Number} CP_Y_MIN
 * @constant {Number} CP_Y_MAX
 */
const CP_Y_MIN = -1;
const CP_Y_MAX = 2;

/**
 * A small picture of a curve, for the type select's options (inline SVG, drawn in the text colour,
 * with the canvas' headroom so overshooting curves fit)
 *
 * @param {Array<Object>} points the two control points
 * @returns {String} SVG markup
 */
function curveIcon([cp1, cp2]) {
  const x = (value) => (1 + value * 14).toFixed(2);
  const y = (value) => (1 + ((VIEW_MAX - value) / (VIEW_MAX - VIEW_MIN)) * 14).toFixed(2);
  const path = `M${x(0)} ${y(0)}C${x(cp1.x)} ${y(cp1.y)} ${x(cp2.x)} ${y(cp2.y)} ${x(1)} ${y(1)}`;
  return '<svg class="curve_icon" viewBox="0 0 16 16" width="14" height="14" '
    + 'style="flex-shrink:0;margin-right:6px;overflow:visible" aria-hidden="true">'
    + `<path d="${path}" fill="none" stroke="currentColor" stroke-width="1.6" `
    + 'stroke-linecap="round"/></svg>';
}

/**
 * Preset options with their curve (all but Custom, whose curve is the fade's own)
 *
 * @constant {Array<String>} PRESET_OPTIONS
 */
const PRESET_OPTIONS = Object.values(FADE_PRESETS)
  .map((points, index) => `${curveIcon(points)}${FADE_PRESET_NAMES[index]}`);

/**
 * Half the size of a handle (12 px, border included), to centre it on its point
 *
 * @constant {Number} HANDLE_HALF
 */
const HANDLE_HALF = 6;

export default {
  name: 'ModifierWidgetCurve',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [LiveMixin],
  props: {
    /**
     * Handle to Fade instance (an idle linear fade when no scene is selected)
     */
    fade: {
      type: Object,
      default: () => new Fade({ type: 0 }),
    },
  },
  emits: ['input'],
  data() {
    return {
      /**
       * Canvas handle
       */
      canvas: {
        width: 0,
        height: 0,
      },
      /**
       * Canvas instance handle
       */
      context: null,
      /**
       * Handle to CP dragging method
       */
      dragListener: null,
    };
  },
  computed: {
    /**
     * Widget title: which fade it edits
     */
    title() {
      return `Fade ${this.fade.direction ? 'out' : 'in'}`;
    },
    /**
     * Type select options: each preset's curve and name; Custom shows the fade's own curve
     */
    presetOptions() {
      const [cp1, cp2] = this.fade.controlPoints;
      const custom = `${curveIcon([{ ...cp1 }, { ...cp2 }])}${FADE_PRESET_NAMES[0]}`;
      return [custom, ...PRESET_OPTIONS.slice(1)];
    },
    /**
     * Control Point 1 css positioning
     */
    cp1Style() {
      return this.handleStyle(this.fade.controlPoints[0]);
    },
    /**
     * Control Point 2 css positioning
     */
    cp2Style() {
      return this.handleStyle(this.fade.controlPoints[1]);
    },
    /**
     * Control Point 3 (play state) css positioning
     */
    cp3Style() {
      // fade.t (progress) is written by playback outside Vue: refresh with the ticker. The point
      // comes from the current control points, so the dot stays on the drawn curve after an edit.
      // The canvas fills the box, so fractions of the box are points of the curve.
      const point = this.fade.pointAt(this.live(this.fade.t));
      return {
        top: `calc(${this.topOf(point.y) * 100}% - 6px)`,
        left: `calc(${point.x * 100}% - 6px)`,
      };
    },
  },
  watch: {
    fade: {
      deep: true,
      handler() {
        this.update();
      },
    },
  },
  created() {
    this.CP_Y_MIN = CP_Y_MIN;
    this.CP_Y_MAX = CP_Y_MAX;
  },
  mounted() {
    this.prepareCanvas();
  },
  methods: {
    /**
     * Initiate control point dragging procedure
     *
       * @public
     * @param {Number} controlPointId control point ID
     */
    startDragCp(e, controlPointId) {
      this.$utils.setCapture(e.currentTarget, 'move');
      this.dragListener = (dragEvent) => {
        this.dragCp(dragEvent, controlPointId);
      };
      window.addEventListener('mousemove', this.dragListener);
      window.addEventListener('mouseup', this.stopDragCp);
    },
    /**
     * Control point drag handler
     *
     * @public
     * @param {Object} e mousemove event
     * @param {Number} controlPointId control point ID
     */
    dragCp(e, controlPointId) {
      this.fade.type = 0;
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
      const value = this.valueAt((e.clientY - rect.top) / rect.height);
      const y = Math.min(Math.max(value, CP_Y_MIN), CP_Y_MAX);
      this.fade.controlPoints[controlPointId].x = parseFloat(x.toFixed(2));
      this.fade.controlPoints[controlPointId].y = parseFloat(y.toFixed(2));
      this.$emit('input', this.fade);
    },
    /**
     * Where a curve value sits on the canvas, as a fraction of its height from the top (a fade
     * out is drawn upside down)
     *
     * @public
     * @param {Number} value curve value (0 = start, 1 = end)
     * @returns {Number} fraction from the top
     */
    topOf(value) {
      const shown = this.fade.direction ? 1 - value : value;
      return (VIEW_MAX - shown) / (VIEW_MAX - VIEW_MIN);
    },
    /**
     * The curve value at a fraction of the canvas height from the top (inverse of topOf)
     *
     * @public
     * @param {Number} top fraction from the top
     * @returns {Number} curve value
     */
    valueAt(top) {
      const shown = VIEW_MAX - top * (VIEW_MAX - VIEW_MIN);
      return this.fade.direction ? 1 - shown : shown;
    },
    /**
     * A control point handle's position, kept inside the canvas when the point is beyond it
     *
     * @public
     * @param {Object} point control point { x, y }
     * @returns {Object} css position
     */
    handleStyle(point) {
      const size = HANDLE_HALF * 2;
      const at = (fraction) => `clamp(0px, calc(${fraction * 100}% - ${HANDLE_HALF}px), calc(100% - ${size}px))`;
      return { left: at(point.x), top: at(this.topOf(point.y)) };
    },
    /**
     * Terminate control point dragging procedure.
     *
       * @public
     */
    stopDragCp() {
      window.removeEventListener('mousemove', this.dragListener);
    },
    /**
     * Setup HTML canvas
     *
       * @public
     */
    prepareCanvas() {
      this.canvas = this.$refs.curveModifier;
      this.context = this.canvas.getContext('2d');
      this.update();
    },
    /**
     * Update canvas curve
     *
     * @public
     */
    update() {
      const ctx = this.context;
      const { width, height } = this.canvas;
      const [cp1, cp2] = this.fade.controlPoints;
      const px = (x) => x * width;
      const py = (value) => this.topOf(value) * height;
      ctx.clearRect(0, 0, width, height);

      // Start (0) and end (1) levels
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff40';
      [0, 1].forEach((value) => {
        ctx.beginPath();
        ctx.moveTo(0, py(value));
        ctx.lineTo(width, py(value));
        ctx.stroke();
      });

      // The curve
      ctx.setLineDash([]);
      ctx.strokeStyle = '#b6b7b5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, py(0));
      ctx.bezierCurveTo(px(cp1.x), py(cp1.y), px(cp2.x), py(cp2.y), width, py(1));
      ctx.stroke();

      // Each control point's arm, from its end of the curve
      ctx.setLineDash([5, 3]);
      ctx.lineWidth = 2;
      [[0, 0, cp1, '#bb2d9880'], [1, 1, cp2, '#1e45b980']].forEach(([x, value, cp, color]) => {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(px(x), py(value));
        ctx.lineTo(px(cp.x), Math.min(Math.max(py(cp.y), 0), height));
        ctx.stroke();
      });
    },
  },
};
</script>

<style scoped>
.widget_curve_body {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: var(--space-5);
  width: 150px;
}
.widget_curve_modifier {
  overflow: hidden;
  position: relative;
  top: -1px;
  width: 190px;
  height: 100%;
  background-color: var(--primary-dark-alt);
  background-image: linear-gradient(
      to right,
      var(--primary-dark) 0,
      var(--primary-dark) 1px,
      transparent 1px,
      transparent 100%
    ),
    linear-gradient(
      to bottom,
      var(--primary-dark) 0,
      var(--primary-dark) 1px,
      transparent 1px,
      transparent 100%
    );
  background-size: 19px 19px;
}
.widget_curve_modifier_canvas {
  width: 190px !important;
  height: 100% !important;
}
.widget_curve_cp,
.widget_curve_picker {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--accent-blue);
  border-radius: var(--radius-round);
  border: 2px solid var(--secondary-light);
  opacity: 0.8;
  cursor: pointer;
  content: "CP2";
}
.widget_curve_cp:after {
  content: inherit;
  font-family: Roboto-medium;
  font-size: var(--font-sm);
  color: var(--secondary-lighter);
  text-align: center;
  position: absolute;
  top: -30px;
  left: -12px;
  background: inherit;
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  opacity: inherit;
  content: "CP2";
}
.widget_curve_cp:nth-child(2):after {
  background: var(--accent-pink);
  content: "CP1";
}
.widget_curve_cp:nth-child(2) {
  background: var(--accent-pink);;
  content: "CP1";
}
.widget_curve_picker {
  border: none !important;
  background: var(--curve-handle);
}
.widget_curve_cp:active {
  cursor: move;
  opacity: 1;
}
.widget_curve_modifier_canvas {
  position: absolute;
}
</style>
