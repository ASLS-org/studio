<template>
  <uk-widget
    dockable
    class="widget_curve"
    :header="{ title: 'Fade Editor' }"
  >
    <uk-flex
      col
      :gap="8"
      class="widget_curve_body"
    >
      <uk-select-input
        v-model="fade.type"
        label="Type"
        :options="fade.availabelEasingFunctions"
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
          :max="1"
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
          :max="1"
          label="CP2 Y"
        />
      </uk-flex>
    </uk-flex>
    <div class="widget_curve_modifier">
      <canvas
        id="curveModifier"
        width="190"
        height="189"
        class="widget_curve_modifier_canvas"
      />
      <div
        id="cp1"
        ref="cp1"
        :style="cp1Style"
        class="widget_curve_cp"
        @mousedown="startDragCp(0)"
        @mouseup="stopDragCp()"
      />
      <div
        id="cp2"
        ref="cp2"
        :style="cp2Style"
        class="widget_curve_cp"
        @mousedown="startDragCp(1)"
        @mouseup="stopDragCp()"
      />
      <div
        :style="cp3Style"
        class="widget_curve_picker"
      />
    </div>
  </uk-widget>
</template>

<script>
export default {
  name: 'GroupSceneModifierWidgetCurve',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Handle to Fade instance
     */
    fade: {
      type: Object,
      default: () => ({
        type: 0,
        controlPoints: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 0,
            y: 0,
          },
        ],
        availabelEasingFunctions: [],
      }),
    },
  },
  emits: ['input'],
  data() {
    return {
      /**
       * Canvas dimensions
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
     * Control Point 1 css positioning
     */
    cp1Style() {
      return {
        left: `${Math.max(this.fade.controlPoints[0].x * this.canvas.width - 14, 0)}px`,
        bottom: `${Math.max(this.fade.controlPoints[0].y * this.canvas.height - 18, 0)}px`,
      };
    },
    /**
     * Control Point 2 css positioning
     */
    cp2Style() {
      return {
        left: `${Math.max(this.fade.controlPoints[1].x * this.canvas.width - 14, 0)}px`,
        bottom: `${Math.max(this.fade.controlPoints[1].y * this.canvas.height - 18, 0)}px`,
      };
    },
    /**
     * Control Point 3 (play state) css positioning
     */
    cp3Style() {
      return {
        bottom: `${(Math.min(this.fade.value, 1) % 1) * this.canvas.height - 8}px`,
        left: `${(Math.min(this.fade.x, 1) % 1) * this.canvas.width - 8}px`,
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
    startDragCp(controlPointId) {
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
      const posX = e.clientX - rect.left;
      const posY = e.clientY - rect.top;
      this.fade.controlPoints[controlPointId].x = parseFloat(
        Math.min(
          Math.max(
            posX / this.canvas.width,
            0,
          ),
          1.0,
        ).toFixed(2),
      );
      this.fade.controlPoints[controlPointId].y = parseFloat(
        Math.min(
          Math.max(
            1.0 - posY / this.canvas.height,
            0,
          ),
          1.0,
        ).toFixed(2),
      );
      this.$emit('input', this.fade);
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
      this.canvas = document.getElementById('curveModifier');
      this.context = this.canvas.getContext('2d');
      this.update();
    },
    /**
     * Update canvas curve
     *
       * @public
     */
    update() {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.strokeStyle = 'red';
      this.context.lineWidth = 2;

      this.context.setLineDash([0, 0]);

      this.context.beginPath();
      this.context.moveTo(0, this.canvas.height);
      this.context.bezierCurveTo(
        this.fade.controlPoints[0].x * this.canvas.width,
        (1.0 - this.fade.controlPoints[0].y) * this.canvas.height,
        this.fade.controlPoints[1].x * this.canvas.width,
        (1.0 - this.fade.controlPoints[1].y) * this.canvas.height,
        this.canvas.width,
        0,
      );
      this.context.stroke();

      this.context.beginPath();
      this.context.setLineDash([5, 3]);

      this.context.strokeStyle = '#bb2d9880';
      this.context.lineWidth = 2;
      this.context.moveTo(0, this.canvas.height);
      this.context.lineTo(
        Math.max(
          this.fade.controlPoints[0].x * this.canvas.width - 7,
          6,
        ),
        Math.min(
          (1.0 - this.fade.controlPoints[0].y) * (this.canvas.height + 18),
          this.canvas.height - 6,
        ),
      );
      this.context.stroke();

      this.context.beginPath();
      this.context.strokeStyle = '#1e45b980';
      this.context.lineWidth = 2;
      this.context.moveTo(this.canvas.width, 0);
      this.context.lineTo(
        Math.max(this.fade.controlPoints[1].x * this.canvas.width - 7, 6),
        Math.max((1.0 - this.fade.controlPoints[1].y) * (this.canvas.height + 18), 6),
      );
      this.context.stroke();
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
  padding: 10px;
  width: 150px;
}
.widget_curve_modifier {
  overflow: hidden;
  position: relative;
  top: -1px;
  width: 190px;
  height: 100%;
  background-color: var(--primary-dark-alt);
  background-image:
    linear-gradient(
      to right, var(--primary-dark) 0,
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
  background-size: 19px 18.5px;
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
  border-radius: 50%;
  border: 2px solid var(--secondary-light);
  opacity: 0.8;
  cursor: pointer;
  content: "CP2";
}
.widget_curve_cp:after {
  content: inherit;
  font-family: roboto;
  font-size: 12px;
  color: var(--secondary-lighter);
  text-align: center;
  position: absolute;
  top: -30px;
  left: -12px;
  background: inherit;
  padding: 1px 5px;
  border-radius: 2px;
  opacity: inherit;
}
.widget_curve_cp:nth-child(2) {
  background: var(--accent-pink);
  content: "CP1";
}
.widget_curve_picker {
  border: none !important;
  background: #b6b7b5;
}
.widget_curve_cp:active {
  cursor: move;
  opacity: 1;
}
.widget_curve_modifier_canvas {
  position: absolute;
}
</style>
