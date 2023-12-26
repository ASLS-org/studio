<template>
  <uk-widget :defaultDocked="defaultDocked" :header="headerData" class="color_picker_widget" dockable>
    <uk-flex class="body">
      <div class="graphical">
        <div class="picker">
          <div class="color_wheel">
            <canvas class="hsl_conical_gradient" ref="wheel" @mousedown="startDrag($event)" @mouseup="stopDrag()" height="150" width="150" />
            <div class="tick" ref="tick" />
            <div
              ref="preview"
              class="preview"
              :style="{
                background: `hsl(${hue},${sat}%,${lig}%)`,
              }"
            >
              <div class="preview_arrow" />
            </div>
          </div>
        </div>
        <uk-gauge class="lightness_picker" :background="currentLigBg" v-model="lig" :min="0" :max="100" ref="ligGauge" @input="updateTick()" />
      </div>
      <div class="textual">
        <uk-select-input style="margin-bottom: 8px" v-model="mode" label="Mode" :options="modeOptions" />
        <template v-if="mode == 0">
          <div class="field">
            <h3 style="flex: 1; margin-right: 8px">H:</h3>
            <uk-num-input :min="0" :max="360" :default="0" v-model="hue" ref="hueInput" @input="updateTick()" />
          </div>
          <div class="field">
            <h3 style="flex: 1; margin-right: 8px">S:</h3>
            <uk-num-input :min="0" :max="100" :default="0" v-model="sat" ref="satInput" @input="updateTick()" />
          </div>
          <div class="field">
            <h3 style="flex: 1; margin-right: 8px">L:</h3>
            <uk-num-input :min="0" :max="100" :default="0" v-model="lig" ref="ligInput" @input="updateTick()" />
          </div>
        </template>
        <template v-else-if="mode == 1">
          <div class="field">
            <h3 style="flex: 1; margin-right: 8px">R:</h3>
            <uk-num-input
              :min="0"
              :max="255"
              :default="0"
              v-model="r"
              ref="hueInput"
              @input="
                setFromRgb(r, g, b);
                updateTick();
              "
            />
          </div>
          <div class="field">
            <h3 style="flex: 1; margin-right: 8px">G:</h3>
            <uk-num-input
              :min="0"
              :max="255"
              :default="0"
              v-model="g"
              ref="satInput"
              @input="
                setFromRgb(r, g, b);
                updateTick();
              "
            />
          </div>
          <div class="field">
            <h3 style="flex: 1; margin-right: 8px">B:</h3>
            <uk-num-input
              :min="0"
              :max="255"
              :default="0"
              v-model="b"
              ref="ligInput"
              @input="
                setFromRgb(r, g, b);
                updateTick();
              "
            />
          </div>
        </template>
        <template v-else>
          <div class="field">
            <h3 style="flex: 1; margin-right: 8px">C:</h3>
            <uk-num-input
              :min="0"
              :max="255"
              :default="0"
              v-model="c"
              ref="hueInput"
              @input="
                setFromCMY(c, m, y);
                updateTick();
              "
            />
          </div>
          <div class="field">
            <h3 style="flex: 1; margin-right: 8px">M:</h3>
            <uk-num-input
              :min="0"
              :max="255"
              :default="0"
              v-model="m"
              ref="satInput"
              @input="
                setFromCMY(c, m, y);
                updateTick();
              "
            />
          </div>
          <div class="field">
            <h3 style="flex: 1; margin-right: 8px">Y:</h3>
            <uk-num-input
              :min="0"
              :max="255"
              :default="0"
              v-model="y"
              ref="ligInput"
              @input="
                setFromCMY(c, m, y);
                updateTick();
              "
            />
          </div>
        </template>
      </div>
    </uk-flex>
  </uk-widget>
</template>

<script>
import colorMixin from "@/views/mixins/color.mixin";
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
  name: "ukWidgetColorPicker",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [colorMixin],
  emits:['update:modelValue','input'],
  props: {
    rgbData: {
      type: Array,
      default: () => [0, 0, 0],
    },
    defaultDocked: Boolean,
  },
  data() {
    return {
      headerData: {
        title: "Color Picker",
        icon: "pipette",
      },
      modeOptions: ["HSL", "RGB", "CMY"],
      modeData: null,
      mode: 0,
      dragging: false,
      hue: 0,
      sat: 0,
      lig: 0,
      c: 0,
      m: 0,
      y: 0,
      k: 0,
      external: false,
      hueBg:
        "linear-gradient(90deg, #FF0000 0%, #FF5C00 12.5%, #DBFF00 25%, #24FF00 37.5%, #00FF75 50%, #00F0FF 61.98%, #1400FF 73.44%, #9E00FF 83.33%, #FF00C7 89.58%, #FF0000 100%)",
    };
  },
  methods: {
    isModificationInternal() {
      let focused = document.activeElement;
      let hueInputFocused = this.$refs.hueInput.$el.children[0].children[0] == focused;
      let satInputFocused = this.$refs.satInput.$el.children[0].children[0] == focused;
      let ligInputFocused = this.$refs.ligInput.$el.children[0].children[0] == focused;
      let ligGuageFocused = this.$refs.ligGauge.$el.children[0].children[0] == focused;
      return hueInputFocused || satInputFocused || ligInputFocused || ligGuageFocused || this.dragging;
    },
    update() {
      if (this.isModificationInternal()) {
        this.$emit("input", this.rgbValue());
      }
    },
    rgbValue() {
      var h = this.hue / 360;
      var s = this.sat / 100;
      var l = this.lig / 100;
      var r, g, b;

      if (s == 0) {
        r = g = b = l; // achromatic
      } else {
        var hue2rgb = function hue2rgb(p, q, t) {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },
    //props to Garry Tan => https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
    setFromRgb(r, g, b) {

      (r /= 255), (g /= 255), (b /= 255);
      var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      var h,
        s,
        l = (max + min) / 2;

      if (max == min) {
        h = s = 0; // achromatic
      } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }

      this.hue = Math.round(h * 360);
      this.sat = Math.round(s * 100);
      this.lig = Math.round(l * 100);
    },
    setFromCMY(c, m, y) {
      this.setFromRgb(255 - c, 255 - m, 255 - y);
    },
    startDrag(e) {
      this.$utils.setCapture(e.currentTarget, "move");
      this.dragging = true;
      var self = this;
      var preview = this.$refs.preview;
      window.addEventListener("mousemove", self.drag);
      window.addEventListener("mouseup", self.stopDrag);
      preview.style.visibility = "visible";
      this.drag(e);
    },
    displayPopOver() {
      var preview = this.$refs.preview;
      preview.style.visibility = "visible";
    },
    hidePopOver() {
      var preview = this.$refs.preview;
      preview.style.visibility = "hidden";
    },
    drag(e) {
      if (this.dragging == true) {
        var tick = this.$refs.tick;
        var preview = this.$refs.preview;
        var wheel = this.$refs.wheel;
        var wheelRect = wheel.getBoundingClientRect();

        var centerX = wheel.clientWidth / 2;
        var centerY = wheel.clientHeight / 2;

        var posX = e.clientX - wheelRect.left - tick.clientWidth / 2;
        var posY = e.clientY - wheelRect.top - tick.clientHeight / 2;

        var centeredPosX = posX - centerX;
        var centeredPosY = posY - centerY;

        var radius = Math.sqrt(Math.pow(centeredPosX, 2) + Math.pow(centeredPosY, 2));
        var alpha = Math.atan2(centeredPosY, centeredPosX);

        if (radius > wheel.clientWidth / 2) {
          radius = wheel.clientWidth / 2;
          posX = radius * Math.cos(alpha) + centerX - tick.clientWidth / 2;
          posY = radius * Math.sin(alpha) + centerY - tick.clientWidth / 2;
        }

        preview.style.left = `${posX - 4}px`;
        preview.style.top = `${posY - 30}px`;

        tick.style.left = `${posX}px`;
        tick.style.top = `${posY}px`;

        this.hue = Math.round(((alpha * 180) / Math.PI + 450) % 360);
        this.sat = Math.round((radius / (wheel.clientWidth / 2)) * 100);
        this.update();
      }
    },
    updateTick(doUpdate = true) {
      if (this.dragging == false) {
        var tick = this.$refs.tick;
        var wheel = this.$refs.wheel;

        var alpha = (this.hue - 90) * (Math.PI / 180);
        var radius = (this.sat / 100) * (wheel.clientWidth / 2);

        var centerX = wheel.clientWidth / 2;
        var centerY = wheel.clientHeight / 2;

        var posX = radius * Math.cos(alpha) + centerX - tick.clientWidth / 2;
        var posY = radius * Math.sin(alpha) + centerY - tick.clientHeight / 2;

        tick.style.left = `${posX}px`;
        tick.style.top = `${posY}px`;
      }
      if (doUpdate) {
        this.update();
      }
    },
    stopDrag() {
      var preview = this.$refs.preview;
      if (preview) {
        preview.style.visibility = "hidden";
      }
      window.removeEventListener("mousemove", null);
      window.removeEventListener("mouseup", null);
      this.dragging = false;
    },
  },
  mounted() {
    
    const canvas = this.$refs.wheel;
    const ctx = canvas.getContext("2d");
    const radius = 150 / 2;
    const toRad = (2 * Math.PI) / 360;
    const step = 1 / radius;
    const cx = radius;
    const cy = radius;

    ctx.clearRect(0, 0, 150, 150);
    for (let i = 0; i < 360; i += step) {
      let rad = i * toRad + Math.PI;
      let x = radius * Math.cos(rad);
      let y = radius * Math.sin(rad);
      ctx.strokeStyle = `hsl(${i},100%,50%`;
      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.lineTo(cx + x, cy + y);
      ctx.stroke();
      ctx.webkitImageSmoothing = true;
    }

    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    [this.r, this.g, this.b] = this.rgbData;
    this.setFromRgb(this.r, this.g, this.b);
    this.updateTick(false);
  },
  computed: {
    currentSatBg() {
      return `linear-gradient(-90deg,hsla(${this.hue},100%,50%,.7) 0,hsla(${this.hue},0%,50%,.2) 100%)`;
    },
    currentLigBg() {
      return `linear-gradient(-90deg,hsla(${this.hue},50%,100%,.8) 0,hsla(${this.hue},${this.sat}%,50%,1) 50%,hsla(${this.hue},50%,0%,.5) 100%)`;
    },
  },
  watch: {
    rgbData() {
      [this.r, this.g, this.b] = this.rgbData;
      this.setFromRgb(this.r, this.g, this.b);
      this.updateTick(false);
    },
  },
};
</script>

<style scoped>
.color_picker_widget {
  min-width: 320px;
  max-width: 320px;
}
.color_preset {
  height: 20px;
  width: 20px;
  background: red;
  border-radius: 2px;
  border: 2px solid var(--secondary-light);
}
.body {
  padding: 10px;
}
.color_wheel {
  position: relative;
  border-radius: 0%;
  height: fit-content;
  width: fit-content;
  cursor: pointer;
}
.hsl_conical_gradient {
  opacity: 0.7;
  border-radius: 50%;
  transform: rotate(90deg);
  height: 150px;
  width: 150px;
}
.tick {
  position: absolute;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #ffffff;
  z-index: 200;
  top: calc(50% - 6px);
  left: calc(50% - 6px);
  cursor: pointer;
  pointer-events: none;
}
.textual {
  display: flex;
  flex-direction: column;
  width: fit-content;
  align-items: center;
  flex: 1;
}
.input {
  margin-bottom: 5px;
  width: 47px;
}
.picker {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0px 0px;
}
.preview {
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
}
.preview_arrow {
  position: absolute;
  bottom: -6px;
  left: calc(50% - 6px);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid white;
}
.graphical {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.textual {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.field {
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  flex: 1;
}
.lightness_picker {
  margin: 0 16px;
  height: 150px;
}
</style>
