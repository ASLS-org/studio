<template>
  <uk-widget :disabled="!channel.type" class="widget_wave" :header="{ title: 'Effect Tool', icon: 'waveform' }">
    <uk-flex :gap="8" class="widget_wave_body">
      <uk-flex :gap="16" class="textual">
        <uk-flex col :gap="8" style="width: 120px">
          <uk-select-input :disabled="!channel.type" @input="update" label="Waveform" v-model="channel.waveform" :options="channel.waveOptions" />
          <uk-flex :gap="8">
            <uk-num-input :disabled="!channel.type" @input="update" :max="255" label="Min" v-model="channel.min" />
            <uk-num-input :disabled="!channel.type" @input="update" :max="255" label="Max" v-model="channel.max" />
          </uk-flex>
          <uk-flex :gap="8">
            <uk-num-input :disabled="!channel.type" @input="update" :min="1" :max="10" label="Freq" v-model="channel.frequency" />
            <uk-num-input :disabled="!channel.type" @input="update" :max="360" label="Phase" v-model="channel.phase" />
          </uk-flex>
        </uk-flex>
        <uk-flex style="width: 80px" col :gap="8">
          <uk-select-input
            :disabled="!channel.type"
            @input="update"
            label="Direction"
            v-model="channel.direction"
            :options="channel.directionOptions"
          />
          <uk-num-input :disabled="!channel.type" @input="update" :min="-360" :max="360" label="Phase start" v-model="channel.fixturePhaseStart" />
          <uk-num-input :disabled="!channel.type" @input="update" :min="-360" :max="360" label="Phase stop" v-model="channel.fixturePhaseStop" />
        </uk-flex>
      </uk-flex>
      <div class="widget_wave_modifier">
        <canvas width="380" height="189" class="widget_wave_modifier_canvas" id="waveModifier" />
        <template v-for="(fixture, index) in channel.fixtures">
          <template v-if="channel && channel.fixtures.length">
            <div v-if="fixture.active" class="dot" :style="getTickPosition(fixture)" :key="index" />
          </template>
        </template>
      </div>
    </uk-flex>
  </uk-widget>
</template>

<script>
import colorMixin from "@/views/mixins/color.mixin";

export default {
  name: "groupEffectModifierWidgetWave",
  mixins: [colorMixin],
  props: {
    value: Object,
  },
  data() {
    return {
      /**
       * Handle to channel instance
       * @todo implement a non v-model dependent component
       */
      channel: this.value || {
        min: 0,
        max: 0,
        frequency: 0,
        phase: 0,
        waveform: 0,
        waveOptions: ["No Channel Selected"],
        direction: 0,
        directionOptions: ["No Channel"],
        fixturePhaseStart: 0,
        fixturePhaseStop: 0,
        fixtures: [],
        getValue: () => {},
      },
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
  methods: {
    /**
     * Get the XY position of a fixture's current channel value over time
     * 
       * @public
     * @param {Object} fixture hande to channel fixture instance
     */
    getTickPosition(fixture) {
      let w = this.canvas.width;
      let h = this.canvas.height;
      let t = this.channel.time;
      // let d = this.channel.duration;
      // let phase = this.channel.direction === 0 ? fixture.phase : -fixture.phase;
      let xOffset = (w * (t + ((fixture.phase / this.channel.frequency) * (180 / Math.PI)) / 360)) % w;
      // let phase = fixture.phase * (180 / Math.PI);
      let yOffset = (1 - fixture.value / 255) * h;
      return {
        left: xOffset - 6 + "px",
        top: yOffset - 6 + "px",
        background: this.channel.color,
      };
    },
    /**
     * Prepare HTML canvas instance
     * 
       * @public
     */
    prepareCanvas() {
      this.canvas = document.getElementById("waveModifier");
      this.context = this.canvas.getContext("2d");
      this.update();
    },
    /**
     * Draw the channel's waveform
     * 
       * @public
     */
    update() {
      if (this.channel) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.lineWidth = 2;
        let width = this.canvas.width;
        let t = 0;
        var yVal = (this.channel.getValue(t) / 255) * (this.canvas.height - 2);
        this.context.beginPath();
        this.context.strokeStyle = this.channel.color;
        this.context.moveTo(t, this.canvas.height - yVal);
        for (let i = 0; i < width; i++) {
          t = i / width;
          yVal = (this.channel.getValue(t) / 255) * (this.canvas.height - 2);
          this.context.lineTo(t * width, this.canvas.height - yVal);
        }
        this.context.stroke();
        // }else{
        //   this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    },
  },
  mounted() {
    this.prepareCanvas();
  },
  watch: {
    value(value) {
      this.channel = value || {
        min: 0,
        max: 0,
        frequency: 0,
        phase: 0,
        waveform: 0,
        waveOptions: ["No Channel Selected"],
        direction: 0,
        directionOptions: ["No Channel"],
        fixturePhaseStart: 0,
        fixturePhaseStop: 0,
        fixtures: [],
        getValue: () => {},
      };
      this.update();
    },
  },
};
</script>

<style scoped>
.widget_wave {
  width: 631px;
  min-width: 631px !important;
  max-width: 631px !important;
}
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
  min-width: 628px;
  max-width: 628px;
  height: 100%;
  background-color: var(--primary-dark-alt);
  background-image: linear-gradient(to right, var(--primary-dark) 0, var(--primary-dark) 1px, transparent 1px, transparent 100%),
    linear-gradient(to bottom, var(--primary-dark) 0, var(--primary-dark) 1px, transparent 1px, transparent 100%);
  background-size: 19px 19px;
  overflow: hidden;
}
.widget_wave_modifier_canvas {
  position: relative;
  width: 380px !important;
  height: 100% !important;
}
.dot {
  position: absolute;
  width: 12px;
  height: 12px;
  left: 100px;
  bottom: 100px;
  background: #1e45b9;
  border-radius: 50%;
  opacity: 1;
  cursor: pointer;
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
