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
            @input="update"
          />
          <uk-flex :gap="8">
            <uk-num-input
              v-model="channel.min"
              :disabled="!channel.type"
              :max="255"
              label="Min"
              @input="update"
            />
            <uk-num-input
              v-model="channel.max"
              :disabled="!channel.type"
              :max="255"
              label="Max"
              @input="update"
            />
          </uk-flex>
          <uk-flex :gap="8">
            <uk-num-input
              v-model="channel.frequency"
              :disabled="!channel.type"
              :min="1"
              :max="10"
              label="Freq"
              @input="update"
            />
            <uk-num-input
              v-model="channel.phase"
              :disabled="!channel.type"
              :max="360"
              label="Phase"
              @input="update"
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
            @input="update"
          />
          <uk-num-input
            v-model="channel.fixturePhaseStart"
            :disabled="!channel.type"
            :min="-360"
            :max="360"
            label="Phase start"
            @input="update"
          />
          <uk-num-input
            v-model="channel.fixturePhaseStop"
            :disabled="!channel.type"
            :min="-360"
            :max="360"
            label="Phase stop"
            @input="update"
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
        <template v-for="(fixture, index) in channel.fixtures">
          <template v-if="channel && channel.fixtures.length">
            <div
              v-if="fixture.active"
              :key="index"
              class="dot"
              :style="getTickPosition(fixture)"
            >
              <div class="fixture-label">
                F{{ index }}
              </div>
            </div>
          </template>
        </template>
      </div>
    </uk-flex>
  </uk-widget>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';

export default {
  name: 'GroupEffectModifierWidgetWave',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [colorMixin],
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
       * Canvas sizing object
       */
      canvas: {
        width: 0,
        height: 0,
      },
      /**
       * Handle to canvas context
       */
      context: null,
    };
  },
  watch: {
    channel() {
      this.update();
    },
  },
  mounted() {
    this.prepareCanvas();
  },
  methods: {
    /**
     * Get the XY position of a fixture's current channel value over time
     * @public
     * @param {Object} fixture hande to channel fixture instance
     */
    getTickPosition(fixture) {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const t = this.channel.time;
      // eslint-disable-next-line max-len
      const xOffset = (w * (t + ((fixture.phase / this.channel.frequency) * (180 / Math.PI)) / 360)) % w;
      const yOffset = (1 - fixture.value / 255) * h;
      return {
        left: `${xOffset - 8}px`,
        top: `${yOffset - 8}px`,
        background: this.channel.color,
      };
    },
    /**
     * Prepare HTML canvas instance
     * @public
     */
    prepareCanvas() {
      this.canvas = this.$refs.waveModifier;
      this.context = this.canvas.getContext('2d');
      this.update();
    },
    /**
     * Draw the channel's waveform
     * @public
     */
    update() {
      if (this.channel) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.lineWidth = 2;
        const { width } = this.canvas;
        let t = 0;
        let yVal = (this.channel.getValue(t) / 255) * (this.canvas.height - 2);
        this.context.beginPath();
        this.context.strokeStyle = this.channel.color;
        this.context.moveTo(t, this.canvas.height - yVal);
        for (let i = 0; i < width; i++) {
          t = i / width;
          yVal = (this.channel.getValue(t) / 255) * (this.canvas.height - 2);
          this.context.lineTo(t * width, this.canvas.height - yVal);
        }
        this.context.stroke();
      }
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
  position: relative;
  width: 380px !important;
  max-width: 380px;
  height: 100% !important;
}
.dot {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #1e45b9;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgba(255,255,255,.2)
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
.widget_wave_modifier_canvas {
  position: absolute;
}
</style>
