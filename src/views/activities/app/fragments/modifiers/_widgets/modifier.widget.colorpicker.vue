<template>
  <uk-widget
    :default-docked="defaultDocked"
    :header="headerData"
    class="color_picker_widget"
    dockable
  >
    <uk-flex class="body">
      <div class="picker">
        <div
          ref="hue_picker"
          class="hue_picker"
          tabindex="0"
          role="slider"
          aria-label="Hue"
          aria-valuemin="0"
          aria-valuemax="360"
          :aria-valuenow="Math.round(modes[0].channels[0].val)"
          @pointerdown.stop="startDragHueTick($event)"
          @pointerup.stop="stopDragHueTick()"
          @keydown="onHueKeydown"
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
          tabindex="0"
          role="slider"
          aria-label="Saturation and brightness"
          :style="{backgroundImage: inGradient}"
          @pointerdown.stop="startDragLightnessTick($event)"
          @pointerup.stop="stopDragLightnessTick()"
          @keydown="onLightnessKeydown"
        >
          <div
            ref="lightness_tick"
            class="lightness_tick"
          />
          <div
            ref="lightness_preview"
            class="lightness_preview"
            :style="{
              background: `rgb(${modes[1].channels.map((c) => c.val).slice(0, 3).join(',')})`,
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
            style="max-width: 100px; min-width: 100px"
            :options="paletteOptions"
            @input="onSwatchSelect"
          />
          <uk-button
            square
            label="save"
            style="min-width:64px; height:25px; margin-top:22px"
            @click="$emit('save', currentRgb)"
          />
        </uk-flex>
        <uk-select-input
          v-model="mode"
          label="Mode"
          class="field"
          :options="modes.map(m => m.name)"
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
            @click="copyHex"
          />
        </uk-flex>
      </uk-flex>
      <template v-if="modes[mode].channels">
        <div
          v-for="channel in modes[mode].channels"
          :key="channel.name"
          class="channels_channel"
        >
          <uk-num-input
            v-model="channel.val"
            class="channel_value"
            :min="0"
            :max="channel.max"
            :default="0"
            @input="onChannelInput"
          />
          <uk-gauge
            v-model="channel.val"
            :min="0"
            :max="channel.max"
            :label="channel.name"
            :background="channel.bg"
            @input="onChannelInput"
          />
        </div>
      </template>
    </uk-flex>
  </uk-widget>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';
import palette from '@/views/utils/palette';

// ---------------------------------------------------------------------------
// Pure color-math helpers. Kept outside the component so they're trivially
// unit-testable and have no hidden dependency on component state.
// ---------------------------------------------------------------------------

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function toHexByte(n) {
  return clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
}

// props to Garry Tan => https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
function hsvToRgb(h, s, v) {
  const hh = (((h % 360) + 360) % 360) / 60;
  const ss = clamp(s, 0, 100) / 100;
  const vv = clamp(v, 0, 100) / 100;
  const i = Math.floor(hh);
  const f = hh - i;
  const p = vv * (1 - ss);
  const q = vv * (1 - f * ss);
  const t = vv * (1 - (1 - f) * ss);
  let r;
  let g;
  let b;
  switch (i % 6) {
    case 0: r = vv; g = t; b = p; break;
    case 1: r = q; g = vv; b = p; break;
    case 2: r = p; g = vv; b = t; break;
    case 3: r = p; g = q; b = vv; break;
    case 4: r = t; g = p; b = vv; break;
    default: r = vv; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function rgbToHsv(r, g, b) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const cmax = Math.max(rr, gg, bb);
  const cmin = Math.min(rr, gg, bb);
  const diff = cmax - cmin;

  let h = 0;
  if (diff !== 0) {
    if (cmax === rr) h = (60 * ((gg - bb) / diff) + 360) % 360;
    else if (cmax === gg) h = (60 * ((bb - rr) / diff) + 120) % 360;
    else h = (60 * ((rr - gg) / diff) + 240) % 360;
  }
  const s = cmax === 0 ? 0 : (diff / cmax) * 100;
  const v = cmax * 100;

  return { h, s, v };
}

function rgbToCmy(r, g, b) {
  return { c: 255 - r, m: 255 - g, y: 255 - b };
}

function cmyToRgb(c, m, y) {
  return { r: 255 - c, g: 255 - m, b: 255 - y };
}

/**
 * ColorPicker — HSV / RGB / CMY color picker widget.
 *
 * Refactor notes:
 * - Single canonical pipeline (`applyColor`) replaces the old
 *   setFromRgb/setFromCMY/rgbValue/update tangle. Every input path
 *   (typed value, drag, swatch pick, external v-model change) now
 *   funnels through one function, so there's exactly one place that
 *   updates RGB/HSV/CMY/hex/palette and schedules the emit.
 * - The "HSL" tab was mislabeled: the math underneath has always been
 *   HSV (value = max(r,g,b)), so the label now matches the math.
 * - `palette` used to be the *imported module object itself*, mutated
 *   in place on every color change — every instance of this component
 *   shared (and clobbered) the same swatch list. Now cloned per-instance.
 * - `$emit('save', {r,g,b})` referenced undefined bare identifiers
 *   (there was no local r/g/b) — replaced with a `currentRgb` computed.
 * - The "copy" button used to just re-fire `save` — it now actually
 *   copies the hex code to the clipboard.
 * - Hex output is now zero-padded (`#050505`, not a truncated `#555`
 *   for channel values under 16).
 * - CMY channels used to only update when you edited them directly —
 *   switching to the CMY tab after using HSV/RGB showed stale zeros.
 *   `applyColor` now keeps all three representations in sync.
 * - `v-for` used the channel *object* as `:key`, producing duplicate
 *   keys on every render — fixed to `channel.name`.
 * - Drag handling moved from mouse events to Pointer Events, so touch
 *   and pen input work, and drag listeners are guaranteed removed on
 *   unmount even if the component is torn down mid-drag.
 * - `update:modelValue`/`input` emits during drags are batched with
 *   requestAnimationFrame instead of firing on every native pointer
 *   move (which can fire far more often than 60/s on modern mice).
 * - Removed dead code: an unused HSV wheel canvas renderer that called
 *   `getContext('2d')` on a plain `<div>` (would throw if ever invoked).
 * - Added basic keyboard control (arrow keys) and `touch-action: none`
 *   on the pickers for accessibility and mobile usability.
 *
 * `rgbData` sets the *initial* color on mount; `v-model` (`modelValue`)
 * drives all *subsequent* controlled updates. This mirrors an
 * uncontrolled-initial / controlled-after pattern — it's intentional,
 * not a leftover, but it's an unusual enough contract that it's worth
 * calling out here.
 *
 * @component ColorPicker A versatile color picker component
 * @namespace activities/app/fragments/modifiers/widgets
 * @story Default {"rgbData":[0,0,0]}
 */
export default {
  name: 'UkWidgetColorPicker',
  compatConfig: {
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
  emits: ['update:modelValue', 'input', 'save', 'copy'],
  data() {
    return {
      headerData: {
        title: 'Color Picker',
        icon: 'pipette',
      },
      swatch: 0,
      modes: [
        {
          name: 'HSV',
          channels: [
            {
              val: 0,
              name: 'hue',
              icon: 'hue',
              max: 360,
              bg: 'linear-gradient(0deg, #ff0000A1 0%, #ffff00A1 17%, #00ff00A1 33%, #00ffffA1 50%, #0000fff1 67%, #ff00ffA1 83%, #ff0000A1 100%)',
            },
            {
              val: 0,
              name: 'sat',
              icon: 'green',
              max: 100,
              bg: 'linear-gradient(0deg, var(--secondary-lighter), #282980)',
            },
            {
              val: 0,
              name: 'val',
              icon: 'blue',
              max: 100,
              bg: 'linear-gradient(0deg, var(--primary-dark), #282980)',
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
              bg: 'linear-gradient(0deg, var(--primary-dark),var(--accent-maroon))',
              max: 255,
            },
            {
              val: 0,
              color: 'var(--accent-sea-green)',
              name: 'green',
              icon: 'green',
              bg: 'linear-gradient(0deg, var(--primary-dark),var(--accent-sea-green))',
              max: 255,
            },
            {
              val: 0,
              color: 'var(--accent-blue)',
              name: 'blue',
              icon: 'blue',
              bg: 'linear-gradient(0deg, var(--primary-dark),var(--accent-blue))',
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
              bg: 'linear-gradient(0deg, var(--primary-dark),var(--accent-light-blue))',
              max: 255,
            },
            {
              val: 0,
              color: 'var(--accent-pink)',
              name: 'mag',
              icon: 'mag',
              bg: 'linear-gradient(0deg, var(--primary-dark),var(--accent-pink))',
              max: 255,
            },
            {
              val: 0,
              color: 'var(--accent-gold)',
              name: 'yel',
              icon: 'yel',
              bg: 'linear-gradient(0deg, var(--primary-dark),var(--accent-gold))',
              max: 255,
            },
          ],
        },
      ],
      mode: 0,
      draggingHue: false,
      draggingLightness: false,
      isCustom: true,
      // Clone on init — `palette` is a shared module import. Mutating it
      // directly (as the previous version did) corrupted the swatch list
      // for every other instance of this component on the page.
      palette: palette.map((p) => ({ ...p })),
      _rafId: null,
      _pendingRgb: null,
    };
  },
  computed: {
    dragging() {
      return this.draggingHue || this.draggingLightness;
    },
    inGradient() {
      return `linear-gradient(0deg,var(--primary-dark) 0%,rgba(${this.modes[1].channels[0].val},${this.modes[1].channels[1].val},${this.modes[1].channels[2].val},0) 100%),linear-gradient(90deg, white 0%,hsl(${this.modes[0].channels[0].val}deg,100%,50%) 100%)`;
    },
    valBg() {
      return `linear-gradient(0deg,hsla(${this.modes[0].channels[0].val}deg,${this.modes[0].channels[1].val}%,50%,0%) 0%,hsl(${this.modes[0].channels[0].val}deg,${this.modes[0].channels[1].val}%,50%,100%) 100%)`;
    },
    satBg() {
      return `linear-gradient(-180deg,hsla(${this.modes[0].channels[0].val}deg,100%,50%,80%) 0%,hsla(${this.modes[0].channels[0].val}deg,0%,50%, 80%) 100%)`;
    },
    currentRgb() {
      const [r, g, b] = this.modes[1].channels.map((c) => c.val);
      return { r, g, b };
    },
    hexVal() {
      const [r, g, b] = this.modes[1].channels.map((c) => c.val);
      return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`.toUpperCase();
    },
    paletteOptions() {
      // TODO: this raw HTML-string option format is a legacy quirk of
      // uk-select-input — worth replacing with a slot-based API so this
      // component doesn't need to hand-build markup strings.
      return this.palette.map((item) => `
        <span style="border: 1px solid #FFFFFF40;height:12px;min-width:12px;background:rgb(${item.r},${item.g},${item.b});margin-right:8px"></span>
        <h4 style="max-width:60%">${item.name}</h4>
      `);
    },
  },
  watch: {
    modelValue(rgbData) {
      if (this.dragging) return;
      const [r, g, b] = rgbData;
      this.isCustom = true;
      this.applyColor(r, g, b, { fromMode: null, markCustom: false, emit: false });
    },
  },
  mounted() {
    const [r, g, b] = this.rgbData;
    this.applyColor(r, g, b, { fromMode: null, markCustom: false, emit: false });
  },
  beforeUnmount() {
    window.removeEventListener('pointermove', this.dragHueTick);
    window.removeEventListener('pointerup', this.stopDragHueTick);
    window.removeEventListener('pointermove', this.dragLightnessTick);
    window.removeEventListener('pointerup', this.stopDragLightnessTick);
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  },
  methods: {
    // -----------------------------------------------------------------
    // Canonical color pipeline
    // -----------------------------------------------------------------

    /**
     * Applies an RGB color to every mode's channels, keeping HSV/RGB/CMY
     * in sync, then (optionally) repositions the pickers and schedules
     * the parent-facing emit.
     *
     * `fromMode` tells us which representation is authoritative for this
     * call so we don't round-trip it through RGB and back — e.g. when the
     * user is dragging the hue wheel, the HSV values are already exact;
     * re-deriving them from the rounded RGB result would make the tick
     * jitter under the pointer.
     */
    applyColor(r, g, b, {
      fromMode = null, markCustom = true, reposition = true, emit = true,
    } = {}) {
      const rr = clamp(Math.round(r), 0, 255);
      const gg = clamp(Math.round(g), 0, 255);
      const bb = clamp(Math.round(b), 0, 255);

      this.modes[1].channels[0].val = rr;
      this.modes[1].channels[1].val = gg;
      this.modes[1].channels[2].val = bb;

      if (fromMode !== 0) {
        const { h, s, v } = rgbToHsv(rr, gg, bb);
        this.modes[0].channels[0].val = h;
        this.modes[0].channels[1].val = s;
        this.modes[0].channels[2].val = v;
      }
      this.modes[0].channels[1].bg = this.satBg;
      this.modes[0].channels[2].bg = this.valBg;

      if (fromMode !== 2) {
        const { c, m, y } = rgbToCmy(rr, gg, bb);
        this.modes[2].channels[0].val = c;
        this.modes[2].channels[1].val = m;
        this.modes[2].channels[2].val = y;
      }

      this.palette[0].r = rr;
      this.palette[0].g = gg;
      this.palette[0].b = bb;

      if (markCustom && this.isCustom) this.swatch = 0;

      if (reposition) {
        this.positionHueTick();
        this.positionLightnessTick();
      }

      if (emit) this.scheduleEmit(rr, gg, bb);
    },

    scheduleEmit(r, g, b) {
      this._pendingRgb = [r, g, b];
      if (this._rafId !== null) return;
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        const [pr, pg, pb] = this._pendingRgb;
        this.$emit('update:modelValue', [pr, pg, pb]);
        this.$emit('input', [pr, pg, pb]);
      });
    },

    // -----------------------------------------------------------------
    // Channel number/gauge inputs
    // -----------------------------------------------------------------

    onChannelInput() {
      if (this.mode === 0) this.onHsvChannelInput();
      else if (this.mode === 1) this.onRgbChannelInput();
      else this.onCmyChannelInput();
    },
    onHsvChannelInput() {
      const [h, s, v] = this.modes[0].channels.map((c) => c.val);
      const { r, g, b } = hsvToRgb(h, s, v);
      this.applyColor(r, g, b, { fromMode: 0 });
    },
    onRgbChannelInput() {
      const [r, g, b] = this.modes[1].channels.map((c) => c.val);
      this.applyColor(r, g, b, { fromMode: 1 });
    },
    onCmyChannelInput() {
      const [c, m, y] = this.modes[2].channels.map((c2) => c2.val);
      const { r, g, b } = cmyToRgb(c, m, y);
      this.applyColor(r, g, b, { fromMode: 2 });
    },

    // -----------------------------------------------------------------
    // Swatches / hex
    // -----------------------------------------------------------------

    onSwatchSelect(index) {
      if (index !== 0) {
        const { r, g, b } = this.palette[index];
        this.isCustom = false;
        this.applyColor(r, g, b, { fromMode: null, markCustom: false });
      }
      this.swatch = index;
    },
    copyHex() {
      const value = this.hexVal;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).catch(() => {});
      }
      this.$emit('copy', value);
    },

    // -----------------------------------------------------------------
    // Hue wheel — pointer + keyboard
    // -----------------------------------------------------------------

    startDragHueTick(e) {
      this.$utils?.setCapture?.(e.currentTarget, 'move');
      this.draggingHue = true;
      const { lightness_preview } = this.$refs;
      window.addEventListener('pointermove', this.dragHueTick);
      window.addEventListener('pointerup', this.stopDragHueTick);
      if (lightness_preview) lightness_preview.style.visibility = 'visible';
      this.dragHueTick(e);
    },
    dragHueTick(e) {
      if (!this.draggingHue) return;
      const { hue_tick, hue_picker } = this.$refs;
      if (!hue_tick || !hue_picker) return;

      const huePickerWidth = hue_picker.offsetWidth - hue_tick.clientWidth / 2;
      const huePickerRadius = (huePickerWidth / 2) - hue_tick.clientWidth / 2 + 2;
      const huePickerRect = hue_picker.getBoundingClientRect();

      const centerX = hue_picker.offsetWidth / 2 + hue_picker.offsetLeft;
      const centerY = hue_picker.offsetHeight / 2 + hue_picker.offsetTop;

      const posXRaw = e.clientX - huePickerRect.left;
      const posYRaw = e.clientY - huePickerRect.top;
      const alpha = Math.atan2(posYRaw - centerY, posXRaw - centerX);

      const posX = huePickerRadius * Math.cos(alpha) + centerX - (hue_tick.offsetWidth / 2);
      const posY = huePickerRadius * Math.sin(alpha) + centerY - (hue_tick.offsetHeight / 2);

      hue_tick.style.left = `${posX}px`;
      hue_tick.style.top = `${posY}px`;

      const hue = Math.round(((alpha * 180) / Math.PI + 450) % 360);
      this.modes[0].channels[0].val = hue;
      const { r, g, b } = hsvToRgb(
        hue,
        this.modes[0].channels[1].val,
        this.modes[0].channels[2].val,
      );
      // Already positioned the tick manually above — skip the redundant
      // reposition-from-value pass on every pointermove.
      this.applyColor(r, g, b, { fromMode: 0, reposition: false });
    },
    positionHueTick() {
      if (this.draggingHue) return;
      const { hue_tick, hue_picker } = this.$refs;
      if (!hue_tick || !hue_picker) return;

      const huePickerWidth = hue_picker.offsetWidth - hue_tick.clientWidth / 2;
      const huePickerRadius = (huePickerWidth / 2) - (hue_tick.clientWidth / 2) + 2;
      const alpha = (this.modes[0].channels[0].val - 90) * (Math.PI / 180);
      const centerX = hue_picker.offsetWidth / 2 + hue_picker.offsetLeft;
      const centerY = hue_picker.offsetHeight / 2 + hue_picker.offsetTop;
      const posX = huePickerRadius * Math.cos(alpha) + centerX - (hue_tick.offsetWidth / 2);
      const posY = huePickerRadius * Math.sin(alpha) + centerY - (hue_tick.offsetHeight / 2);

      hue_tick.style.left = `${posX}px`;
      hue_tick.style.top = `${posY}px`;
    },
    stopDragHueTick() {
      const { lightness_preview } = this.$refs;
      if (lightness_preview) lightness_preview.style.visibility = 'hidden';
      window.removeEventListener('pointermove', this.dragHueTick);
      window.removeEventListener('pointerup', this.stopDragHueTick);
      this.draggingHue = false;
    },
    onHueKeydown(e) {
      const dirs = {
        ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1,
      };
      if (!(e.key in dirs)) return;
      e.preventDefault();
      const step = (e.shiftKey ? 10 : 1) * dirs[e.key];
      const hue = ((((this.modes[0].channels[0].val + step) % 360) + 360) % 360);
      const { r, g, b } = hsvToRgb(
        hue,
        this.modes[0].channels[1].val,
        this.modes[0].channels[2].val,
      );
      this.modes[0].channels[0].val = hue;
      this.applyColor(r, g, b, { fromMode: 0 });
    },

    // -----------------------------------------------------------------
    // Saturation/value square — pointer + keyboard
    // -----------------------------------------------------------------

    startDragLightnessTick(e) {
      this.$utils?.setCapture?.(e.currentTarget, 'move');
      this.draggingLightness = true;
      const { lightness_preview } = this.$refs;
      window.addEventListener('pointermove', this.dragLightnessTick);
      window.addEventListener('pointerup', this.stopDragLightnessTick);
      if (lightness_preview) lightness_preview.style.visibility = 'visible';
      this.dragLightnessTick(e);
    },
    dragLightnessTick(e) {
      if (!this.draggingLightness) return;
      const { lightness_tick, lightness_preview, lightness_picker } = this.$refs;
      if (!lightness_tick || !lightness_picker) return;

      const rect = lightness_picker.getBoundingClientRect();

      const posX = clamp(
        e.clientX - rect.left - lightness_tick.clientWidth / 2,
        0,
        lightness_picker.clientWidth - lightness_tick.offsetWidth,
      );
      const posY = clamp(
        e.clientY - rect.top - lightness_tick.clientHeight / 2,
        0,
        lightness_picker.clientHeight - lightness_tick.offsetHeight,
      );

      if (lightness_preview) {
        lightness_preview.style.left = `${posX - 6}px`;
        lightness_preview.style.top = `${posY - 30}px`;
      }
      lightness_tick.style.left = `${posX}px`;
      lightness_tick.style.top = `${posY}px`;

      const s = (posX / (lightness_picker.clientWidth - lightness_tick.offsetWidth)) * 100;
      const v = (1 - posY / (lightness_picker.clientHeight - lightness_tick.offsetHeight)) * 100;

      this.modes[0].channels[1].val = s;
      this.modes[0].channels[2].val = v;
      const { r, g, b } = hsvToRgb(this.modes[0].channels[0].val, s, v);
      this.applyColor(r, g, b, { fromMode: 0, reposition: false });
    },
    positionLightnessTick() {
      if (this.draggingLightness) return;
      const { lightness_tick, lightness_picker } = this.$refs;
      if (!lightness_tick || !lightness_picker) return;

      const posX = (lightness_picker.clientWidth - lightness_tick.offsetWidth)
        * (this.modes[0].channels[1].val / 100);
      const posY = (lightness_picker.clientHeight - lightness_tick.offsetHeight)
        * (1 - this.modes[0].channels[2].val / 100);

      lightness_tick.style.left = `${posX}px`;
      lightness_tick.style.top = `${posY}px`;
    },
    stopDragLightnessTick() {
      const { lightness_preview } = this.$refs;
      if (lightness_preview) lightness_preview.style.visibility = 'hidden';
      window.removeEventListener('pointermove', this.dragLightnessTick);
      window.removeEventListener('pointerup', this.stopDragLightnessTick);
      this.draggingLightness = false;
    },
    onLightnessKeydown(e) {
      const step = e.shiftKey ? 10 : 1;
      let ds = 0;
      let dv = 0;
      if (e.key === 'ArrowLeft') ds = -step;
      else if (e.key === 'ArrowRight') ds = step;
      else if (e.key === 'ArrowUp') dv = step;
      else if (e.key === 'ArrowDown') dv = -step;
      else return;
      e.preventDefault();

      const s = clamp(this.modes[0].channels[1].val + ds, 0, 100);
      const v = clamp(this.modes[0].channels[2].val + dv, 0, 100);
      this.modes[0].channels[1].val = s;
      this.modes[0].channels[2].val = v;
      const { r, g, b } = hsvToRgb(this.modes[0].channels[0].val, s, v);
      this.applyColor(r, g, b, { fromMode: 0 });
    },
  },
};
</script>

<style scoped>
.color_picker_widget {
  min-width: 560px;
  max-width: 560px;
}
.body {
  height: 100%;
  width: 100%;
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
  align-items: center;
  width: fit-content;
  flex: 1;
  height: 100%;
  padding: 10px;
  background: var(--primary-light);
  border-left: 1px solid var(--primary-dark);
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
}
.hue_preview_arrow, .lightness_preview_arrow {
  position: absolute;
  bottom: -6px;
  left: calc(50% - 6px);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid white;
}
.field {
  width: 100%;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 95%;
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
  mask-image: radial-gradient(circle farthest-side at center, transparent 80%, white 81%);
  touch-action: none;
  cursor: pointer;
}
.lightness_picker{
  z-index: 20;
  width: 54%;
  aspect-ratio : 1 / 1;
  position: absolute;
  top: 50%;
  left: 50%;
  opacity: .8;
  transform: translate(-50%,-50%);
  background-image: linear-gradient(0deg,#000 0%,rgba(204,154,129,0) 80%),
   linear-gradient(90deg, white 20%,rgba(204,154,129,0) 80%);
  touch-action: none;
  cursor: pointer;
}
</style>
