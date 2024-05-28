<template>
  <uk-widget
    :default-docked="defaultDocked"
    :header="headerData"
    class="color_picker_widget"
    dockable
  >
    <uk-flex class="body">
      <div class="picker">
        <!-- <canvas
              ref="wheel"
              class="hsl_conical_gradient"
              height="189"
              width="189"
              @mousedown="startDrag($event)"
              @mouseup="stopDrag()"
            /> -->
        <div
          ref="hue_picker"
          class="hue_picker"
          @mousedown="startDragHueTick($event)"
          @mouseup="stopDragHueTick()"
        >
          <div
            ref="hue_tick"
            class="hue_tick"
          />
          <div
            ref="hue_preview"
            class="hue_preview"
            :style="{
              background: `hsl(${modes[0].channels[0].val}deg, 100%, 50%)`,
            }"
          >
            <div class="hue_preview_arrow" />
          </div>
        </div>
        <div
          ref="lightness_picker"
          class="lightness_picker"
          :style="{backgroundImage: inGradient}"
          @mousedown.stop="startDragLightnessTick($event)"
          @mouseup="stopDragLightnessTick()"
        >
          <div
            ref="lightness_tick"
            class="lightness_tick"
          />
          <div
            ref="lightness_preview"
            class="lightness_preview"
            :style="{
              background: `rgb(${modes[1].channels[0].val},${modes[1].channels[1].val},${modes[1].channels[2].val})`,
            }"
          >
            <div class="lightness_preview_arrow" />
          </div>
        </div>
      </div>
      <uk-flex
        gap="8"
        class="textual"
      >
        <uk-flex
          gap="8"
          center-both
          style="width:100%;"
        >
          <uk-select-input
            v-model="swatch"
            label="Color Presets"
            class="field"
            :options="paletteOptions"
            @input="(index)=>{
              if(index !== 0){
                const {r,g,b} = palette[index];
                setFromRgb(r,g,b);
                updateHueTick(true, false);
                isCustom = false;
              }
              swatch = index;
            }"
          />
          <uk-button
            square
            label="save"
            style="min-width:64px; height:25px; margin-top:22px"
            @click="$emit('save', {r,g,b})"
          />
        </uk-flex>
        <uk-select-input
          v-model="mode"
          label="Mode"
          class="field"
          :options="modes.map(mode=>mode.name)"
        />
        <uk-flex
          gap="8"
          center-both
          style="width:100%;"
        >
          <uk-txt-input
            label="Hex code"
            class="field"
            readonly
            :model-value="hexVal"
          />
          <uk-button
            square
            label="copy"
            style="height:25px; margin-top:22px"
            @click="$emit('save', {r,g,b})"
          />
        </uk-flex>
      </uk-flex>
      <template v-if="modes[mode] && modes[mode].channels">
        <div
          v-for="channel in modes[mode].channels"
          :key="channel"
          class="channels_channel"
        >
          <uk-num-input
            v-model="channel.val"
            class="channel_value"
            :min="0"
            :max="channel.max"
            :default="0"
            @input="
              switch(mode){
              case 1:
                setFromRgb(
                  modes[1].channels[0].val,
                  modes[1].channels[1].val,
                  modes[1].channels[2].val
                );
                break;
              case 2:
                setFromCMY(
                  modes[2].channels[0].val,
                  modes[2].channels[1].val,
                  modes[2].channels[2].val
                )
              default: break;
              }
              updateHueTick();
              updateLightnessTick();
            "
          />
          <uk-gauge
            v-model="channel.val"
            :min="0"
            :max="channel.max"
            :label="channel.name"
            :background="channel.bg"
            @input="
              switch(mode){
              case 1:
                setFromRgb(
                  modes[1].channels[0].val,
                  modes[1].channels[1].val,
                  modes[1].channels[2].val
                );
                break;
              case 2:
                setFromCMY(
                  modes[2].channels[0].val,
                  modes[2].channels[1].val,
                  modes[2].channels[2].val
                )
              default: break;
              }
              updateHueTick();
              updateLightnessTick();
            "
          />
        </div>
      </template>
    </uk-flex>
  </uk-widget>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';
import palette from '@/views/utils/palette';

/**
 * Beware of the weird loopback issues if you are modifying this.
 * I believe it would be simpler to just restart mostly from zero ?
 * It is stable enough for the alpha.
 * @todo Document and refactor this. it is MESSY.
 * @component ColorPicker A versatile color picker component
 * @namespace activities/app/fragments/modifiers/widgets
 * @story Default {"rgbData":[0,0,0]}
 */
export default {
  name: 'UkWidgetColorPicker',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [colorMixin],
  props: {
    rgbData: {
      type: Array,
      default: () => [0, 0, 0],
    },
    defaultDocked: Boolean,
    modelValue: {
      type: Array,
      default: () => [0, 0, 0],
    },
  },
  emits: ['update:modelValue', 'input', 'save'],
  data() {
    return {
      headerData: {
        title: 'Color Picker',
        icon: 'pipette',
      },
      swatch: 0,
      modes: [
        {
          name: 'HSL',
          channels: [
            {
              val: 0,
              name: 'hue',
              icon: 'hue',
              max: 360,
              bg: 'linear-gradient(90deg, #ff0000A1 0%, #ffff00A1 17%, #00ff00A1 33%, #00ffffA1 50%, #0000fff1 67%, #ff00ffA1 83%, #ff0000A1 100%)',

            },
            {
              val: 0,
              name: 'sat',
              icon: 'green',
              max: 100,
              bg: 'linear-gradient(90deg, var(--secondary-lighter), #282980)',
            },
            {
              val: 0,
              name: 'val',
              icon: 'blue',
              max: 100,
              bg: 'linear-gradient(90deg, var(--primary-dark), #282980)',
            },
          ],
        }, {
          name: 'RGB',
          channels: [
            {
              val: 0,
              color: 'var(--accent-maroon)',
              name: 'red',
              icon: 'red',
              bg: 'linear-gradient(90deg, var(--primary-dark),var(--accent-maroon))',
              max: 255,
            },
            {
              val: 0,
              color: 'var(--accent-sea-green)',
              name: 'green',
              icon: 'green',
              bg: 'linear-gradient(90deg, var(--primary-dark),var(--accent-sea-green))',
              max: 255,
            },
            {
              val: 0,
              color: 'var(--accent-blue)',
              name: 'blue',
              icon: 'blue',
              bg: 'linear-gradient(90deg, var(--primary-dark),var(--accent-blue))',
              max: 255,
            },
          ],
        }, {
          name: 'CMY',
          channels: [
            {
              val: 0,
              color: 'var(--accent-light-blue)',
              name: 'cya',
              icon: 'cyan',
              bg: 'linear-gradient(90deg, var(--primary-dark),var(--accent-light-blue))',
              max: 255,
            },

            {
              val: 0,
              color: 'var(--accent-pink)',
              name: 'mag',
              icon: 'mag',
              bg: 'linear-gradient(90deg, var(--primary-dark),var(--accent-pink))',
              max: 255,
            },
            {
              val: 0,
              color: 'var(--accent-gold)',
              name: 'yel',
              icon: 'yel',
              bg: 'linear-gradient(90deg, var(--primary-dark),var(--accent-gold))',
              max: 255,
            },
          ],
        },
      ],
      mode: 0,
      dragging: false,
      isCustom: true,
      palette,
    };
  },
  computed: {
    inGradient() {
      return `linear-gradient(0deg,var(--primary-dark) 0%,rgba(${this.modes[1].channels[0].val},${this.modes[1].channels[1].val},${this.modes[1].channels[2].val},0) 100%),linear-gradient(90deg, white 0%,hsl(${this.modes[0].channels[0].val}deg,100%,50%) 100%)`;
    },
    valBg() {
      if (this.modes[0]) {
        return `linear-gradient(90deg,hsla(${this.modes[0].channels[0].val}deg,${this.modes[0].channels[1].val}%,50%,0%) 0%,hsl(${this.modes[0].channels[0].val}deg,${this.modes[0].channels[1].val}%,50%,100%) 100%)`;
      }
      return null;
    },
    satBg() {
      if (this.modes[0]) {
        return `linear-gradient(-90deg,hsla(${this.modes[0].channels[0].val}deg,100%,50%,80%) 0%,hsla(${this.modes[0].channels[0].val}deg,0%,50%, 80%) 100%)`;
      }
      return null;
    },
    hexVal() {
      if (this.modes[1]) {
        return `#${this.modes[1].channels[0].val.toString(16)}${this.modes[1].channels[1].val.toString(16)}${this.modes[1].channels[2].val.toString(16)}`.toUpperCase();
      }
      return null;
    },
    paletteOptions() {
      return this.palette.map((item) => `
        <span style="height:12px;min-width:12px;background:rgb(${item.r},${item.g},${item.b});margin-right:8px"></span>
        <h4 style="width:70%">${item.name}</h4>
      `);
    },
  },
  watch: {
    modelValue(rgbData) {
      if (this.dragging === false) {
        this.palette[0].r = this.modes[1].channels[0].val;
        this.palette[0].g = this.modes[1].channels[1].val;
        this.palette[0].b = this.modes[1].channels[2].val;
        [
          this.modes[1].channels[0].val,
          this.modes[1].channels[1].val,
          this.modes[1].channels[2].val,
        ] = rgbData;
        this.setFromRgb(
          this.modes[1].channels[0].val,
          this.modes[1].channels[1].val,
          this.modes[1].channels[2].val,
        );
        this.updateHueTick(false, true);
        this.updateLightnessTick(false, true);
        this.isCustom = true;
      }
    },
  },
  mounted() {
    this.drawPicker();
    [
      this.modes[1].channels[0].val,
      this.modes[1].channels[1].val,
      this.modes[1].channels[2].val,
    ] = this.rgbData;
    this.setFromRgb(
      this.modes[1].channels[0].val,
      this.modes[1].channels[1].val,
      this.modes[1].channels[2].val,
    );
    this.updateHueTick(false);
  },
  methods: {
    drawPicker() {
      switch (this.mode) {
        case 0:
          // this.drawHSVPicker();
          break;
        default:
          // this.drawHSVPicker();
          break;
      }
    },
    drawHSVPicker() {
      const canvas = this.$refs.hue_picker;
      const ctx = canvas.getContext('2d');
      const padding = 12;
      const radius = (189 / 2) - padding;
      const toRad = (2 * Math.PI) / 360;
      const step = 1 / radius;
      const cx = radius + padding;
      const cy = radius + padding;

      ctx.clearRect(0, 0, 189, 189);

      for (let i = 0; i < 360; i += step) {
        const rad = i * toRad + Math.PI;
        const x = (radius) * Math.cos(rad);
        const y = (radius) * Math.sin(rad);
        ctx.strokeStyle = `hsla(${i},100%,50%,0.05)`;
        ctx.beginPath();
        ctx.moveTo((radius + padding), (radius + padding));
        ctx.lineTo(cx + x, cy + y);
        ctx.stroke();
        ctx.webkitImageSmoothing = true;
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      [
        this.modes[1].channels[0].val,
        this.modes[1].channels[1].val,
        this.modes[1].channels[2].val,
      ] = this.rgbValue();
      this.palette[0].r = this.modes[1].channels[0].val;
      this.palette[0].g = this.modes[1].channels[1].val;
      this.palette[0].b = this.modes[1].channels[2].val;
      this.modes[0].channels[1].bg = this.satBg;
      this.modes[0].channels[2].bg = this.valBg;
      this.$emit('update:modelValue', this.rgbValue());
      this.$emit('input', this.rgbValue());
    },
    rgbValue() {
      let r; let g; let b; let i; let f; let p; let q; let
        t;
      const h = this.modes[0].channels[0].val / 360;
      const s = this.modes[0].channels[1].val / 100;
      const v = this.modes[0].channels[2].val / 100;
      i = Math.floor(h * 6);
      f = h * 6 - i;
      p = v * (1 - s);
      q = v * (1 - f * s);
      t = v * (1 - (1 - f) * s);
      switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
        default: break;
      }
      return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
      ];
    },
    // props to Garry Tan => https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
    setFromRgb(r, g, b) {
      // R, G, B values are divided by 255
      // to change the range from 0..255 to 0..1
      r /= 255.0;
      g /= 255.0;
      b /= 255.0;

      // h, s, v = hue, saturation, value
      const cmax = Math.max(r, Math.max(g, b)); // maximum of r, g, b
      const cmin = Math.min(r, Math.min(g, b)); // minimum of r, g, b
      const diff = cmax - cmin; // diff of cmax and cmin.
      let h = -1; let
        s = -1;

      // if cmax and cmax are equal then h = 0
      if (cmax === cmin) h = 0;

      // if cmax equal r then compute h
      else if (cmax === r) h = (60 * ((g - b) / diff) + 360) % 360;

      // if cmax equal g then compute h
      else if (cmax === g) h = (60 * ((b - r) / diff) + 120) % 360;

      // if cmax equal b then compute h
      else if (cmax === b) h = (60 * ((r - g) / diff) + 240) % 360;

      // if cmax equal zero
      if (cmax === 0) { s = 0; } else { s = (diff / cmax) * 100; }

      // compute v
      const v = cmax * 100;

      this.modes[0].channels[0].val = h;
      this.modes[0].channels[1].val = s;
      this.modes[0].channels[2].val = v;

      this.modes[0].channels[1].bg = this.satBg;
      this.modes[0].channels[2].bg = this.valBg;
    },
    setFromCMY(c, m, y) {
      this.setFromRgb(255 - c, 255 - m, 255 - y);
    },
    startDragHueTick(e) {
      this.$utils.setCapture(e.currentTarget, 'move');
      this.dragging = true;
      const { hue_preview } = this.$refs;
      window.addEventListener('mousemove', this.dragHueTick);
      window.addEventListener('mouseup', this.stopDragHueTick);
      hue_preview.style.visibility = 'visible';
      this.dragHueTick(e);
    },
    dragHueTick(e) {
      if (this.dragging === true) {
        const { hue_tick } = this.$refs;
        const { hue_preview } = this.$refs;
        const { hue_picker } = this.$refs;

        const huePickerWidth = hue_picker.offsetWidth - hue_tick.clientWidth / 2;
        const huePickerRadius = (huePickerWidth / 2) - hue_tick.clientWidth / 2 + 2;
        const huePickerRect = hue_picker.getBoundingClientRect();

        const centerX = hue_picker.offsetWidth / 2 + hue_picker.offsetLeft;
        const centerY = hue_picker.offsetHeight / 2 + hue_picker.offsetTop;

        let posX = e.clientX - huePickerRect.left;
        let posY = e.clientY - huePickerRect.top;

        const alpha = Math.atan2(posY - centerY, posX - centerX);

        posX = huePickerRadius * Math.cos(alpha) + centerX - (hue_tick.offsetWidth / 2);
        posY = huePickerRadius * Math.sin(alpha) + centerY - (hue_tick.offsetHeight / 2);

        hue_preview.style.left = `${posX - 4}px`;
        hue_preview.style.top = `${posY - 30}px`;

        hue_tick.style.left = `${posX}px`;
        hue_tick.style.top = `${posY}px`;

        this.modes[0].channels[0].val = Math.round(((alpha * 180) / Math.PI + 450) % 360);
        this.update(false);
      }
    },
    updateHueTick(doUpdate = true, setCustom = true) {
      if (setCustom && this.isCustom) this.swatch = 0;
      if (this.dragging === false) {
        const { hue_tick } = this.$refs;
        const { hue_picker } = this.$refs;
        const huePickerWidth = hue_picker.offsetWidth - hue_tick.clientWidth / 2;
        const huePickerRadius = (huePickerWidth / 2) - (hue_tick.clientWidth / 2) + 2;

        const alpha = (this.modes[0].channels[0].val - 90) * (Math.PI / 180);

        const centerX = hue_picker.offsetWidth / 2 + hue_picker.offsetLeft;
        const centerY = hue_picker.offsetHeight / 2 + hue_picker.offsetTop;

        const radius = huePickerRadius;
        const posX = radius * Math.cos(alpha) + centerX - (hue_tick.offsetWidth / 2);
        const posY = radius * Math.sin(alpha) + centerY - (hue_tick.offsetHeight / 2);

        hue_tick.style.left = `${posX}px`;
        hue_tick.style.top = `${posY}px`;
      }
      if (doUpdate) {
        this.update();
      }
    },
    stopDragHueTick() {
      const { hue_preview } = this.$refs;
      if (hue_preview) {
        hue_preview.style.visibility = 'hidden';
      }
      window.removeEventListener('mousemove', this.dragHueTick);
      window.removeEventListener('mouseup', this.stopDragHueTick);
      this.dragging = false;
    },
    startDragLightnessTick(e) {
      this.$utils.setCapture(e.currentTarget, 'move');
      this.dragging = true;
      const { lightness_preview } = this.$refs;
      window.addEventListener('mousemove', this.dragLightnessTick);
      window.addEventListener('mouseup', this.stopDragLightnessTick);
      lightness_preview.style.visibility = 'visible';
      this.dragLightnessTick(e);
    },
    dragLightnessTick(e) {
      if (this.dragging === true) {
        const { lightness_tick } = this.$refs;
        const { lightness_preview } = this.$refs;
        const { lightness_picker } = this.$refs;

        const lightnessPickerWidth = lightness_picker.clientWidth;
        const lightnessPickerRadius = lightnessPickerWidth / 2 - ((lightness_tick.clientWidth) / 2);
        const lightnessPickerRect = lightness_picker.getBoundingClientRect();

        const posX = Math.max(
          0,
          Math.min(
            e.clientX - lightnessPickerRect.left - (lightness_tick.clientWidth) / 2,
            lightness_picker.clientWidth - lightness_tick.offsetWidth,
          ),
        );
        const posY = Math.max(
          0,
          Math.min(
            e.clientY - lightnessPickerRect.top - (lightness_tick.clientHeight) / 2,
            lightness_picker.clientHeight - lightness_tick.offsetHeight,
          ),
        );

        lightness_preview.style.left = `${posX - 4}px`;
        lightness_preview.style.top = `${posY - 30}px`;

        lightness_tick.style.left = `${posX}px`;
        lightness_tick.style.top = `${posY}px`;

        this.modes[0].channels[1].val = (
          (posX) / (lightness_picker.clientWidth - lightness_tick.offsetWidth)
        ) * 100;
        this.modes[0].channels[2].val = (
          1.0 - (posY) / (lightness_picker.clientHeight - lightness_tick.offsetHeight)
        ) * 100;

        this.update();
      }
    },
    updateLightnessTick(doUpdate = true, setCustom = true) {
      if (setCustom && this.isCustom) this.swatch = 0;
      if (this.dragging === false) {
        const { lightness_tick } = this.$refs;
        const { lightness_picker } = this.$refs;

        const posX = (lightness_picker.clientWidth - lightness_tick.offsetWidth)
          * (this.modes[0].channels[1].val / 100);
        const posY = (lightness_picker.clientHeight - lightness_tick.offsetHeight)
          * (1 - this.modes[0].channels[2].val / 100);

        lightness_tick.style.left = `${posX}px`;
        lightness_tick.style.top = `${posY}px`;
      }
      if (doUpdate) {
        this.update();
      }
    },
    stopDragLightnessTick() {
      const { lightness_preview } = this.$refs;
      if (lightness_preview) {
        lightness_preview.style.visibility = 'hidden';
      }
      window.removeEventListener('mousemove', this.dragLightnessTick);
      window.removeEventListener('mouseup', this.stopDragLightnessTick);
      this.dragging = false;
    },
  },
};
</script>

<style scoped>
.color_picker_widget {
  min-width: 540px;
  max-width: 540px;
}
.color_preset {
  height: 20px;
  width: 20px;
  background: red;
  border-radius: 2px;
  border: 2px solid var(--secondary-light);
}
.body {
  height: 100%;
  width: 100%;
}
.hsl_conical_gradient {
  opacity: 0.7;
  /* border-radius: 50%; */
  transform: rotate(90deg);
  height: 189px;
  width: 189px;
}
.hue_tick, .lightness_tick {
  position: absolute;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: rgba(0,0,0,.5);
  border: 1px solid white;
  z-index: 200;
  top: calc(50% - 6px);
  left: calc(50% - 6px);
  cursor: pointer;
  pointer-events: none;
  mix-blend-mode:hard-light;
  box-shadow: 0px 0px 2px 2px rgba(0,0,0,.2);
}

.lightness_tick{
  height: 10px;
  width: 10px;
  background: white;
  box-shadow: 0px 0px 2px 2px rgba(0,0,0,.2);
}
.textual {
  display: flex;
  flex-direction: column;
  width: fit-content;
  align-items: center;
  flex: 1;
  padding: 10px;
}
.input {
  margin-bottom: 5px;
  width: 47px;
}
.picker {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin: 0px 0px;
  height: 100%;
  aspect-ratio: 1 / 1;
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
  background-size: 18px 18px;
  background-position: -1px -1px;
  overflow: hidden;
  position: relative;
}

.picker:after,.picker:before{
  z-index: -1;
  position: absolute;
  content: "";
  height: 100%;
  width: 0px;
  border-top: 1px solid var(--secondary-light);
  border-right: 1px solid var(--secondary-light);
  left: 50%;
}
.picker::after{
  top: 50%;
  height: 0px;
  width: 100%!important;
  left: 0px!important;
}
.hue_preview{
  display: none;
}
.hue_preview, .lightness_preview {
  visibility: hidden;
  position: absolute;
  height: 20px;
  width: 20px;
  z-index: 200;
  top: calc(50% - 5px);
  left: calc(50% - 5px);
  cursor: pointer;
  pointer-events: none;
  border: 1px solid white;
  box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.5);
  box-sizing: content-box;
  z-index: 100;
}
.hue_preview_arrow, .lightness_preview_arrow {
  position: absolute;
  bottom: -6px;
  left: calc(50% - 6px);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid white;
}
.textual {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  background: var(--primary-light);
  border-left: 1px solid var(--primary-dark);
}
.field {
  width: 100%
}
.value_picker_cursor:hover{
  opacity: .9;
}
.value_picker_cursor_negative{
  position: absolute;
  top: 0px;
  width: 100%;
  background: var(--primary-dark);
  opacity: .8;
}

.channels_channel {
  display: flex;
  max-width: 52px;
  min-width: 52px;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  border-left: 1px solid var(--primary-dark);
  overflow: hidden;
  box-sizing: content-box;
  background: var(--primary-light);
}

.channels_channel:last-child {
  border-right: 1px solid var(--primary-dark);
}
.channel_value {
  width: 100%;
}
.hue_picker{
  z-index: 10;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 95%;
  aspect-ratio: 1/1;
  aspect-ratio : 1 / 1;
  background: conic-gradient(
    #ff0000B3,
    #ff8000B3,
    #FFFF00B3,
    #80ff00B3,
    #00FF00B3,
    #00ff80B3,
    #00FFFFB3,
    #0080ffB3,
    #0000FFB3,
    #8000ffB3,
    #FF00FFB3,
    #ff0080B3,
    #ff0000B3
  );
  border-radius: 50%;
  /* mix-blend-mode: multiply; */
  mask-image: radial-gradient(circle farthest-side at center, transparent 80%, white 81%);
}
.lightness_picker{
  z-index: 20;
  width: 54%;
  height: 54%;
  aspect-ratio : 1 / 1;
  position: absolute;
  top: 50%;
  left: 50%;
  opacity: .8;
  transform: translate(-50%,-50%);
  background-image: linear-gradient(0deg,#000 0%,rgba(204,154,129,0) 80%),
   linear-gradient(90deg, white 20%,rgba(204,154,129,0) 80%);
}
</style>
