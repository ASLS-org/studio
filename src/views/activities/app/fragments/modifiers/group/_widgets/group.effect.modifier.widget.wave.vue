<template>
  <uk-widget
    :disabled="!channel.type"
    class="widget_wave"
    :header="{ title: 'Effect Tool', icon: 'waveform' }"
  >
    <uk-flex
      :gap="8"
      class="widget_wave_body"
    >
      <uk-flex
        :gap="16"
        class="textual"
      >
        <uk-flex
          col
          :gap="8"
          style="width: 120px"
        >
          <uk-select-input
            v-model="channel.waveform"
            :disabled="!channel.type"
            label="Waveform"
            :options="channel.waveOptions"
          />
          <uk-flex :gap="8">
            <uk-num-input
              v-model="channel.min"
              :disabled="!channel.type"
              :max="255"
              label="Min"
            />
            <uk-num-input
              v-model="channel.max"
              :disabled="!channel.type"
              :max="255"
              label="Max"
            />
          </uk-flex>
          <uk-flex :gap="8">
            <uk-num-input
              v-model="channel.frequency"
              :disabled="!channel.type"
              :min="1"
              :max="100"
              label="Freq"
            />
            <uk-num-input
              v-model="channel.phase"
              :disabled="!channel.type"
              :max="3600"
              label="Phase"
            />
          </uk-flex>
        </uk-flex>
        <uk-flex
          style="width: 80px"
          col
          :gap="8"
        >
          <uk-select-input
            v-model="channel.direction"
            :disabled="!channel.type"
            label="Direction"
            :options="channel.directionOptions"
          />
          <uk-num-input
            v-model="channel.fixturePhaseStart"
            :disabled="!channel.type"
            :min="-360"
            :max="360"
            label="Phase start"
          />
          <uk-num-input
            v-model="channel.fixturePhaseStop"
            :disabled="!channel.type"
            :min="-360"
            :max="360"
            label="Phase stop"
          />
        </uk-flex>
      </uk-flex>
      <div class="widget_wave_modifier">
        <canvas
          ref="waveModifier"
          width="380"
          height="189"
          class="widget_wave_modifier_canvas"
        />
        <template v-if="channel && channel.fixtures.length">
          <div
            v-for="(fixture, index) in channel.fixtures"
            v-show="fixture.active"
            :key="index"
            class="dot"
            :style="getTickPosition(fixture, index)"
          >
            <div
              class="fixture-label"
              :style="{ top: index % 2 ? '-18px' : '10px' }"
            >
              F{{ index }}
            </div>
          </div>
        </template>
      </div>
    </uk-flex>
  </uk-widget>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';
import LiveMixin from '@/views/mixins/live.mixin';

export default {
  name: 'GroupEffectModifierWidgetWave',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [colorMixin, LiveMixin],
  props: {
    channel: {
      type: Object,
      default() {
        return {
          min: 0,
          max: 0,
          frequency: 0,
          phase: 0,
          waveform: 0,
          waveOptions: ['No Channel Selected'],
          direction: 0,
          directionOptions: ['No Channel'],
          fixturePhaseStart: 0,
          fixturePhaseStop: 0,
          fixtures: [],
          getValue: () => {},
        };
      },
    },
  },
  data() {
    return {
      /**
       * Handle to the canvas element
       */
      canvas: null,
      /**
       * Handle to canvas 2D context
       */
      context: null,
      /**
       * Cached CSS pixel size of the canvas, kept in sync via ResizeObserver.
       * Fixture dots read from this instead of calling getBoundingClientRect()
       * on every render, which would force a synchronous layout per dot.
       */
      canvasSize: {
        width: 0,
        height: 0,
      },
      /**
       * Pending animation-frame handle for coalesced redraws
       */
      rafId: null,
      /**
       * Active ResizeObserver instance
       */
      resizeObserver: null,
    };
  },
  computed: {
    /**
     * Changes only when something that affects the drawn curve's *shape*
     * changes. Used to redraw the canvas without a full deep watch on the
     * whole channel object (which also contains high-frequency fields like
     * `time` that shouldn't trigger a canvas repaint).
     */
    shapeSignature() {
      const {
        waveform, min, max, frequency, phase, color,
      } = this.channel;
      return [waveform, min, max, frequency, phase, color].join('|');
    },
  },
  watch: {
    shapeSignature() {
      this.scheduleUpdate();
    },
  },
  mounted() {
    this.prepareCanvas();
  },
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  },
  methods: {
    /**
     * Prepare HTML canvas instance and start observing its size so the
     * backing bitmap always matches its rendered CSS size (avoids the
     * browser stretching the canvas image, which was throwing the drawn
     * curve out of alignment with the fixture dots).
     * @public
     */
    prepareCanvas() {
      this.canvas = this.$refs.waveModifier;
      this.context = this.canvas.getContext('2d');
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.canvas);
      this.handleResize();
    },
    /**
     * Resize the canvas backing store to match its rendered size and the
     * device pixel ratio, then redraw.
     * @public
     */
    handleResize() {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
      this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.canvasSize = { width: rect.width, height: rect.height };
      this.update();
    },
    /**
     * Coalesce redraw requests into a single animation frame.
     * @public
     */
    scheduleUpdate() {
      if (this.rafId) return;
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.update();
      });
    },
    /**
     * Map a 0-255 DMX value to a Y pixel coordinate. Shared by the canvas
     * draw and the fixture dots so both use the exact same mapping and stay
     * pixel-aligned; a small padding keeps the line and dots from clipping
     * against the canvas edges at 0/255.
     * @public
     */
    valueToY(value, height) {
      const pad = 6;
      const usable = Math.max(height - pad * 2, 0);
      const safeValue = Number.isFinite(value) ? value : 127.5;
      const clamped = Math.min(255, Math.max(0, safeValue));
      return pad + (1 - clamped / 255) * usable;
    },
    /**
     * Get the XY position of a fixture's current channel value over time
     * @public
     * @param {Object} fixture handle to channel fixture instance
     * @param {Number} index index of the fixture within channel.fixtures
     */
    getTickPosition(fixture) {
      // channel.time and fixture.value are written by playback outside Vue: refresh with the ticker
      this.live();
      const { width: w, height: h } = this.canvasSize;
      if (!w || !h) {
        return { left: '0px', top: '0px' };
      }

      const freq = Math.max(Number(this.channel.frequency) || 0, 0.0001);
      // Same scaling as the original implementation — this is what produces
      // visible separation between fixtures across the canvas width.
      const phaseFraction = ((((Number(fixture.phase) || 0) / freq) * (180 / Math.PI)) / 360);
      let t = (this.channel.time || 0) + phaseFraction;
      t -= Math.floor(t); // wrap into [0, 1) safely for negative values

      const xOffset = t * w;
      const yOffset = this.valueToY(fixture.value, h);

      return {
        left: `${xOffset - 6}px`,
        top: `${yOffset - 6}px`,
        background: this.channel.color,
      };
    },
    /**
     * Draw the channel's waveform
     * @public
     */
    update() {
      const { context: ctx, canvas } = this;
      const { width: w, height: h } = this.canvasSize;
      if (!ctx || !canvas || !w || !h || !this.channel || !this.channel.getValue) {
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // Reference midline so values read as centered at a glance.
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const midY = this.valueToY(127.5, h);
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();
      ctx.restore();

      // Sample density scales with frequency so fast waveforms stay smooth
      // instead of aliasing when sampled at only one point per pixel.
      const frequency = Math.max(Number(this.channel.frequency) || 1, 1);
      const samples = Math.min(4000, Math.max(w, Math.ceil(w * Math.max(1, frequency / 8))));

      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = this.channel.color;
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const y = this.valueToY(this.channel.getValue(t), h);
        const x = t * w;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    },
  },
};
</script>

<style scoped>
.widget_wave_body {
  height: 100%;
  width: 100%;
}
.textual {
  padding: 10px;
}
.widget_wave_modifier {
  position: relative;
  top: -1px;
  width: 380px;
  max-width: 380px;
  height: 100%;
  background-color: var(--primary-dark-alt);
  background-image:
    linear-gradient(
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
  overflow: hidden;
}
.widget_wave_modifier_canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.dot {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #1e45b9;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, .2);
  will-change: left, top;
}
.dot .fixture-label {
  font-family: Roboto-medium;
  font-size: 12px;
  color: var(--secondary-lighter);
  text-align: center;
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translate(-50%,0%);
  background: inherit;
  padding: 1px 5px;
  border-radius: 2px;
  opacity: inherit;
  opacity: .8;
}
.dot:nth-child(even) {
  background: #bb2d98;
}
.widget_wave_picker {
  background: rgba(255, 255, 255, 0.7);
}
.widget_wave_cp:active {
  cursor: move;
  opacity: 1;
}
</style>
