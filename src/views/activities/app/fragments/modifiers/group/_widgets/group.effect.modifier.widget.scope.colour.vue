<template>
  <uk-widget
    class="colour_scope"
    dockable
    :header="{ title: 'Colour Scope', icon: 'colorwheel' }"
  >
    <div class="colour_scope_body">
      <!-- On the left, a row per fixture, time across one loop (rows scroll when there are
        many) -->
      <div class="colour_scope_well">
        <div
          ref="field"
          class="colour_scope_field"
          :class="{ dragging: !!drag }"
        >
          <div
            class="colour_scope_rows"
            :data-rows="rows.length"
            :data-block="layout.block"
            :data-band="layout.band"
            :style="{ height: `${layout.height}px` }"
          >
            <canvas
              ref="canvas"
              class="colour_scope_canvas"
              title="Drag: shift the timing. Last row: spread"
              @pointerdown="press"
              @pointermove="hover"
              @pointerleave="pointer = null"
            />
            <div
              v-show="playing"
              class="colour_scope_playhead"
              :style="{ left: `${playhead * 100}%` }"
            />
          </div>
        </div>
        <!-- What is under the pointer -->
        <div
          v-if="readout"
          class="colour_scope_readout"
        >
          <span
            class="colour_scope_swatch"
            :style="{ background: `rgb(${readout.rgb.join(',')})` }"
          />
          <span>{{ readout.text }}</span>
        </div>
      </div>
      <!-- At a fixed width: preset and spread; the two colours and the speed; the phases; the
        flash width (PWM only) -->
      <div class="colour_scope_controls">
        <!-- First row: preset and spread, half the width each -->
        <div class="colour_scope_head">
          <uk-select-input
            class="colour_scope_preset"
            label="Preset"
            placeholder="Pick a preset"
            :title="about"
            :options="PRESET_OPTIONS"
            :model-value="presetIndex"
            reselect
            @update:model-value="pickPreset"
          />
          <uk-select-input
            class="colour_scope_spread"
            label="Spread"
            placeholder="Pick a spread"
            :options="SPREAD_OPTIONS"
            :model-value="spreadIndex"
            reselect
            @update:model-value="pickSpread"
          />
        </div>
        <!-- The colours at the low and high ends of the colour channels, read from them: any
          effect shows its own, and any colour can be picked or typed -->
        <uk-color-input
          v-for="end in ['a', 'b']"
          :key="end"
          :class="['colour_scope_colour', `colour_scope_colour_${end}`]"
          :label="`Colour ${end.toUpperCase()}`"
          :title="end === 'a'
            ? 'Colour at the low end of every colour channel (their Min)'
            : 'Colour at the high end of every colour channel (their Max)'"
          :model-value="hex[end]"
          @update:model-value="(value) => setColour(end, value)"
        />
        <uk-num-input
          v-for="field in FIELDS"
          :key="field.key"
          :class="['colour_scope_value', `colour_scope_${field.key}`]"
          :label="field.label"
          :title="field.title"
          :model-value="values[field.key]"
          :min="field.min"
          :max="field.max"
          :precision="0"
          placeholder="--"
          relative
          @update:model-value="(value) => setField(field.key, value)"
          @step="(delta) => stepField(field.key, delta)"
        />
        <!-- With PWM colour channels: how long each flash stays lit -->
        <uk-num-input
          v-if="values.width !== undefined"
          class="colour_scope_value colour_scope_width"
          label="Width %"
          title="Share of each cycle the colour stays on"
          :model-value="values.width"
          :min="1"
          :max="99"
          :precision="0"
          placeholder="--"
          relative
          @update:model-value="(value) => setWidth(value)"
          @step="(delta) => setWidth((values.width || 50) + delta)"
        />
      </div>
    </div>
  </uk-widget>
</template>

<script>
import { toRaw } from 'vue';
import { CUE_STATES } from '@/models/DMX/cue.model';
import LiveMixin from '@/views/mixins/live.mixin';
import palette from '@/views/utils/palette';
import {
  COLOUR_PRESETS, COLOUR_TYPES, SCOPE_SAMPLES, SPREADS, applyColourPreset, applySpread, clamp,
  matchColourPreset, matchFixtures, matchSpread, mixColour, presetUnit, setSpeed, shapeKey,
  sharedValue, speedOf, valueAt, wrap,
} from '@/views/utils/effect.scope';

/**
 * Smallest band height (px); with more fixtures the rows scroll
 *
 * @constant {Number}
 */
const MIN_BAND = 12;

/**
 * Gap between rows (px)
 *
 * @constant {Number}
 */
const ROW_GAP = 2;

/**
 * Snap of a drag, in degrees (Shift: single degrees)
 *
 * @constant {Number}
 */
const SNAP = 15;

/**
 * Fields for every colour wave at once
 *
 * @constant {Array<Object>}
 */
const FIELDS = [
  {
    key: 'phase', label: 'Phase', title: 'Shifts the timing of every colour channel (°)', min: 0, max: 359,
  },
  {
    key: 'speed', label: 'Speed', title: 'Times the colours cycle per effect loop', min: 1, max: 100,
  },
  {
    key: 'fixturePhaseStart', label: 'Phase start', title: 'Offset of the first fixture (°)', min: -360, max: 360,
  },
  {
    key: 'fixturePhaseStop', label: 'Phase stop', title: 'Offset of the last fixture (°)', min: -360, max: 360,
  },
];

/**
 * Colours the presets start from, by name: white, black, then the palette
 *
 * @constant {Array<Object>}
 */
const COLOURS = [
  {
    name: 'White', r: 255, g: 255, b: 255,
  },
  {
    name: 'Black', r: 0, g: 0, b: 0,
  },
  ...palette.filter((colour) => colour.name !== 'Custom'),
];

/**
 * A preset's default colour by name (white when missing)
 *
 * @param {String} name
 * @returns {Object} `{ r, g, b }`
 */
function colourNamed(name) {
  return COLOURS.find((colour) => colour.name === name) || COLOURS[0];
}

/**
 * `#rrggbb` of a colour
 *
 * @param {Array<Number>} rgb
 * @returns {String}
 */
function toHex(rgb) {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Colour of a `#rrggbb` string
 *
 * @param {String} hex
 * @returns {Object} `{ r, g, b }`
 */
function fromHex(hex) {
  const digits = String(hex).replace('#', '').padStart(6, '0');
  const part = (i) => parseInt(digits.slice(i, i + 2), 16) || 0;
  return { r: part(0), g: part(2), b: part(4) };
}

/**
 * @component ColourScope How the colour travels across an effect's fixtures: a numbered row per
 * fixture, time across one loop. Drag to shift the timing, the last row to spread it; fields,
 * spreads and presets built from Colour A and
 * B (read from the waves)
 */
export default {
  name: 'GroupEffectModifierWidgetScopeColour',
  compatConfig: {
    MODE: 3,
  },
  mixins: [LiveMixin],
  props: {
    /**
     * Effect cue (with at least one colour wave)
     */
    effect: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      /**
       * Field size (px), null until measured
       */
      size: null,
      /**
       * Running drag, or null
       */
      drag: null,
      /**
       * Pointer over the strip `{ x, y }` (px in the canvas), or null
       */
      pointer: null,
      /**
       * Last preset and spread picked (the selects' values)
       */
      preset: null,
      spread: null,
    };
  },
  computed: {
    /**
     * Colour waves of the effect
     *
     * @type {Array<Object>}
     */
    waves() {
      return (this.effect?.channels || []).filter((wave) => COLOUR_TYPES.includes(wave.type));
    },
    /**
     * Colour waves running a PWM waveform
     *
     * @type {Array<Object>}
     */
    pwm() {
      return this.waves.filter((wave) => wave.waveOptions?.[wave.waveform] === 'PWM');
    },
    /**
     * Changes when the strip's colours change
     *
     * @type {String}
     */
    shape() {
      return this.waves.map((wave) => `${wave.type}=${shapeKey(wave)}`).join('#');
    },
    /**
     * Fixtures of the colour waves, in effect order
     *
     * @type {Array<Object>}
     */
    rows() {
      if (!this.shape) return [];
      return matchFixtures(this.waves.map((wave) => toRaw(wave)));
    },
    /**
     * Row geometry (px): a band per fixture
     *
     * @type {Object} `{ band, block, height }`
     */
    layout() {
      const count = Math.max(1, this.rows.length);
      const available = this.size ? this.size.height : 0;
      const band = Math.max(MIN_BAND, Math.floor((available - count * ROW_GAP) / count));
      const block = band + ROW_GAP;
      return {
        band, block, height: count * block - ROW_GAP,
      };
    },
    /**
     * Whether the effect plays (the playhead shows)
     *
     * @type {Boolean}
     */
    playing() {
      this.live();
      // Playback writes the state outside Vue: read it raw, on the live ticker
      return toRaw(this.effect)?.state === CUE_STATES.RUNNING;
    },
    /**
     * Loop progress shown by the playhead, 0-1
     *
     * @type {Number}
     */
    playhead() {
      this.live();
      const wave = this.waves[0] ? toRaw(this.waves[0]) : null;
      const t = wave ? wave.time || 0 : 0;
      return t - Math.floor(t);
    },
    /**
     * Everything the canvas draws from
     *
     * @type {String}
     */
    drawKey() {
      return `${this.shape}/${this.size?.width}/${this.layout.block}`;
    },
    /**
     * Colour A and B as the colour channels have them: every channel's Min (A) or Max (B), mixed
     *
     * @type {Object} `{ a, b }` as `[r, g, b]`
     */
    ends() {
      const at = (key) => mixColour(Object.fromEntries(this.waves.map((w) => [w.type, w[key]])));
      return { a: at('min'), b: at('max') };
    },
    /**
     * Colour A and B as `#rrggbb`
     *
     * @type {Object} `{ a, b }`
     */
    hex() {
      return { a: toHex(this.ends.a), b: toHex(this.ends.b) };
    },
    /**
     * Preset the colour waves follow (the last picked while it still matches), Custom's index
     * for none
     *
     * @type {Number}
     */
    presetIndex() {
      // eslint-disable-next-line no-unused-expressions
      this.shape;
      const index = matchColourPreset(this.waves.map((wave) => toRaw(wave)), this.preset);
      return index < 0 ? COLOUR_PRESETS.length : index;
    },
    /**
     * Spread of the colour waves, Custom's index for none
     *
     * @type {Number}
     */
    spreadIndex() {
      // eslint-disable-next-line no-unused-expressions
      this.shape;
      const index = matchSpread(this.waves.map((wave) => toRaw(wave)), this.spread);
      return index < 0 ? SPREADS.length : index;
    },
    /**
     * What the current preset does, or what to do
     *
     * @type {String}
     */
    about() {
      const preset = COLOUR_PRESETS[this.presetIndex];
      return preset ? preset.about : 'Custom: no preset matches these colour channels';
    },
    /**
     * Freq multiplier of the current preset (Strobe runs ×8 its speed)
     *
     * @type {Number}
     */
    unit() {
      // The matching preset's, else the last picked one's (edited since, its speed still holds)
      return presetUnit(COLOUR_PRESETS[this.presetIndex] || COLOUR_PRESETS[this.preset] || null);
    },
    /**
     * Speed: how many times the colour pattern runs per loop, the preset's multiplier aside
     *
     * @type {Number}
     */
    speed() {
      if (!this.waves.length) return 1;
      return Math.max(1, Math.round(speedOf(this.waves) / this.unit));
    },
    /**
     * Field values shared by every colour wave (null when they differ)
     *
     * @type {Object}
     */
    values() {
      const shared = (key) => sharedValue(this.waves.map((wave) => Number(wave[key]) || 0));
      return {
        phase: shared('phase'),
        speed: this.speed,
        fixturePhaseStart: shared('fixturePhaseStart'),
        fixturePhaseStop: shared('fixturePhaseStop'),
        // Only when some colour channel is PWM
        width: this.pwm.length
          ? sharedValue(this.pwm.map((wave) => Number(wave.width) || 50)) : undefined,
      };
    },
    /**
     * What is under the pointer: fixture, moment and colour
     *
     * @type {?Object} `{ text, rgb }`
     */
    readout() {
      if (!this.pointer || !this.size) return null;
      const at = this.at(this.pointer.x, this.pointer.y);
      if (!at || !at.row.active) return null;
      const values = {};
      const waves = this.waves.map((wave) => toRaw(wave));
      waves.forEach((wave, w) => { values[wave.type] = valueAt(wave, at.row.entries[w], at.t); });
      const rgb = mixColour(values);
      return {
        rgb,
        text: `${at.index + 1} · ${at.row.name} · ${Math.round(at.t * 100)} % · RGB ${rgb.join(' ')}`,
      };
    },
  },
  watch: {
    drawKey() {
      this.scheduleDraw();
    },
  },
  created() {
    this.FIELDS = FIELDS;
    // The last option, Custom, stands for waves no item matches
    this.PRESET_OPTIONS = [...COLOUR_PRESETS.map((preset) => preset.name), 'Custom'];
    this.SPREAD_OPTIONS = [...SPREADS.map((spread) => spread.name), 'Custom'];
  },
  mounted() {
    this.observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      const same = this.size && this.size.width === width && this.size.height === height;
      if (width && height && !same) this.size = { width, height };
    });
    this.observer.observe(this.$refs.field);
  },
  beforeUnmount() {
    this.observer.disconnect();
    if (this.frameRequest) cancelAnimationFrame(this.frameRequest);
    this.stopListening();
  },
  methods: {
    /**
     * Row and loop moment at a canvas point
     *
     * @public
     * @param {Number} x px from the canvas' left
     * @param {Number} y px from the canvas' top
     * @returns {?Object} `{ index, row, t }`
     */
    at(x, y) {
      const index = Math.floor(y / this.layout.block);
      const row = this.rows[index];
      if (!row || !this.size) return null;
      const t = clamp(x / Math.max(1, this.size.width), 0, 0.999);
      return { index, row, t };
    },
    /**
     * Draws on the next animation frame (several changes, one draw)
     *
     * @public
     */
    scheduleDraw() {
      if (this.frameRequest) return;
      this.frameRequest = requestAnimationFrame(() => {
        this.frameRequest = null;
        this.draw();
      });
    },
    /**
     * Paints each fixture's row (the colour its waves give it across one loop) and its number
     *
     * @public
     */
    draw() {
      const { canvas } = this.$refs;
      if (!canvas || !this.size) return;
      const { width } = this.size;
      const { band, block, height } = this.layout;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const waves = this.waves.map((wave) => toRaw(wave));
      const column = width / SCOPE_SAMPLES;
      const values = {};
      const styles = getComputedStyle(this.$el);
      const token = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
      const font = parseFloat(token('--font-xs', '11px')) || 11;
      this.rows.forEach((row, r) => {
        const y = r * block;
        if (row.active) {
          for (let i = 0; i < SCOPE_SAMPLES; i++) {
            const t = (i + 0.5) / SCOPE_SAMPLES;
            const x = Math.floor(i * column);
            waves.forEach((wave, w) => { values[wave.type] = valueAt(wave, row.entries[w], t); });
            const [red, green, blue] = mixColour(values);
            ctx.fillStyle = `rgb(${red},${green},${blue})`;
            // Overlap by a pixel: no seams between columns
            ctx.fillRect(x, y, Math.ceil(column) + 1, band);
          }
        }
        // The row's number on a dark chip, at its start
        const label = String(r + 1);
        const size = Math.min(font, band - 2);
        ctx.font = `${size}px Roboto-Medium, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        const chip = Math.max(ctx.measureText(label).width + 8, band - 2);
        ctx.fillStyle = token('--primary-dark', '#111');
        ctx.globalAlpha = 0.75;
        ctx.fillRect(2, y + 1, chip, band - 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = token('--secondary-lighter', '#eee');
        ctx.fillText(label, 2 + chip / 2, y + band / 2 + 0.5);
      });
    },
    /**
     * Follows the pointer for the readout
     *
     * @public
     * @param {PointerEvent} e
     */
    hover(e) {
      const rect = this.$refs.canvas.getBoundingClientRect();
      this.pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    /**
     * Starts a drag: the last row spreads the colour, any other row shifts the timing
     *
     * @public
     * @param {PointerEvent} e
     */
    press(e) {
      if (e.button !== 0 || !this.waves.length) return;
      e.preventDefault();
      const rect = this.$refs.canvas.getBoundingClientRect();
      const at = this.at(e.clientX - rect.left, e.clientY - rect.top);
      if (!at) return;
      const last = at.index === this.rows.length - 1 && this.rows.length > 1;
      this.drag = {
        mode: last ? 'spread' : 'phase',
        x: e.clientX,
        width: rect.width,
        start: this.waves.map((wave) => ({ phase: wave.phase, stop: wave.fixturePhaseStop })),
      };
      window.addEventListener('pointermove', this.dragTo);
      window.addEventListener('pointerup', this.drop);
    },
    /**
     * Shifts the timing or the spread from the drag start: the colours follow the pointer, in
     * steps of 15° (Shift: 1°)
     *
     * @public
     * @param {PointerEvent} e pointermove event
     */
    dragTo(e) {
      const { drag } = this;
      if (!drag) return;
      const fraction = (e.clientX - drag.x) / drag.width;
      const snap = (v) => (e.shiftKey ? Math.round(v) : Math.round(v / SNAP) * SNAP);
      this.waves.forEach((wave, i) => {
        const start = drag.start[i];
        // Moving the colours later by a fraction of the loop takes that much phase off, per cycle
        const degrees = snap(-fraction * 360 * (Number(wave.frequency) || 1));
        if (drag.mode !== 'spread') {
          const phase = wrap(start.phase + degrees);
          if (wave.phase !== phase) wave.phase = phase;
          return;
        }
        // The last fixture's phase per degree of span, from the wave's direction
        const raw = toRaw(wave);
        const count = raw.fixtures.filter((f) => f.active).length;
        const perSpan = count > 1 ? raw.slotPhase(count - 1, count, 0, 1) : 0;
        if (Math.abs(perSpan) < 1e-6) return;
        const stop = Math.round(clamp(start.stop + snap(degrees / perSpan), -360, 360));
        if (wave.fixturePhaseStop !== stop) wave.fixturePhaseStop = stop;
      });
    },
    /**
     * Ends a drag
     *
     * @public
     */
    drop() {
      this.drag = null;
      this.stopListening();
    },
    /**
     * Removes the drag listeners
     *
     * @public
     */
    stopListening() {
      window.removeEventListener('pointermove', this.dragTo);
      window.removeEventListener('pointerup', this.drop);
    },
    /**
     * Writes a field on every colour wave
     *
     * @public
     * @param {String} key a `FIELDS` key
     * @param {Number} value
     */
    setField(key, value) {
      if (value == null || Number.isNaN(value)) return;
      if (key === 'speed') {
        setSpeed(this.waves, value * this.unit);
        return;
      }
      const degrees = key === 'phase' ? wrap(value) : clamp(Math.round(value), -360, 360);
      this.waves.forEach((wave) => {
        if (wave[key] !== degrees) wave[key] = degrees;
      });
    },
    /**
     * Steps a field on every colour wave, from each one's own value
     *
     * @public
     * @param {String} key a `FIELDS` key
     * @param {Number} delta
     */
    stepField(key, delta) {
      if (key === 'speed') {
        setSpeed(this.waves, (this.speed + delta) * this.unit);
        return;
      }
      this.waves.forEach((wave) => {
        const value = (Number(wave[key]) || 0) + delta;
        wave[key] = key === 'phase' ? wrap(value) : clamp(Math.round(value), -360, 360);
      });
    },
    /**
     * Sets the PWM width of every PWM colour channel
     *
     * @public
     * @param {Number} value percent
     */
    setWidth(value) {
      if (value == null || Number.isNaN(value)) return;
      const width = clamp(Math.round(value), 1, 99);
      this.pwm.forEach((wave) => {
        if (wave.width !== width) wave.width = width;
      });
    },
    /**
     * Sets the colour waves from a preset, fully (see `applyColourPreset`)
     *
     * @public
     * @param {Number} index a `COLOUR_PRESETS` index
     */
    pickPreset(index) {
      // Custom: nothing to apply
      if (index >= COLOUR_PRESETS.length) return;
      // The speed as it stands, before the new preset's multiplier
      const { speed } = this;
      const preset = COLOUR_PRESETS[index];
      this.preset = index;
      // A preset starts from its own colours; Colour A and B then read them back
      applyColourPreset(this.effect, preset, {
        a: colourNamed(preset.defaults.a || 'White'),
        b: colourNamed(preset.defaults.b || 'Black'),
        speed,
      });
      this.$liveTicker.bump();
    },
    /**
     * Spreads the colour over the fixtures
     *
     * @public
     * @param {Number} index a `SPREADS` index
     */
    pickSpread(index) {
      if (index >= SPREADS.length) return;
      this.spread = index;
      applySpread(this.waves, SPREADS[index]);
    },
    /**
     * Sets Colour A (every colour channel's Min) or B (Max): red, green and blue take the colour
     * (added when missing), the other colour channels go to 0 at that end
     *
     * @public
     * @param {String} end 'a' or 'b'
     * @param {String} hex `#rrggbb`
     */
    setColour(end, hex) {
      const colour = fromHex(hex);
      ['Red', 'Green', 'Blue'].forEach((type) => {
        if (!this.waves.some((wave) => wave.type === type)) this.effect.addChannel({ type });
      });
      const key = end === 'a' ? 'min' : 'max';
      const value = { Red: colour.r, Green: colour.g, Blue: colour.b };
      this.waves.forEach((wave) => {
        const v = value[wave.type] ?? 0;
        if (wave[key] !== v) wave[key] = v;
      });
      this.$liveTicker.bump();
    },
  },
};
</script>

<style scoped>
.colour_scope {
  width: fit-content;
  flex: none;
}
.colour_scope_body {
  display: flex;
  height: 100%;
  width: 100%;
}
/* Flush, the Effect Tool's dark well; rows scroll when there are many fixtures */
.colour_scope_well {
  position: relative;
  top: -1px;
  left: -1px;
  width: 270px;
  flex-shrink: 0;
  height: 100%;
}
.colour_scope_field {
  position: absolute;
  inset: 0;
  background-color: var(--primary-dark-alt);
  overflow-y: auto;
  overflow-x: hidden;
  user-select: none;
}
.colour_scope_rows {
  position: relative;
  width: 100%;
}
.colour_scope_canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: ew-resize;
}
.colour_scope_playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: var(--secondary-lighter);
  box-shadow: 0 0 0 1px var(--primary-dark);
  pointer-events: none;
}
.dragging .colour_scope_canvas {
  cursor: grabbing;
}
/* Over the field's bottom while hovering a row */
.colour_scope_readout {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  background: var(--primary-dark);
  font-family: Roboto-Regular;
  font-size: var(--font-sm);
  color: var(--secondary-lighter);
  white-space: nowrap;
  overflow: hidden;
  pointer-events: none;
}
.colour_scope_swatch {
  flex-shrink: 0;
  width: var(--icon-sm);
  height: var(--icon-sm);
  border-radius: var(--radius-sm);
}
/* Fixed places, so a missing Width leaves its slot empty */
.colour_scope_controls {
  flex: none;
  width: 330px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(4, auto);
  align-content: start;
  gap: var(--space-3) var(--space-5);
  padding: var(--space-5);
  min-width: 0;
}
.colour_scope_head {
  grid-area: 1 / 1 / 2 / 4;
  display: flex;
  gap: var(--space-5);
}
.colour_scope_head .uikit_select {
  flex: 1 1 0;
  min-width: 0;
}
.colour_scope_colour_a { grid-area: 2 / 1; }
.colour_scope_colour_b { grid-area: 2 / 2; }
.colour_scope_speed { grid-area: 2 / 3; }
.colour_scope_phase { grid-area: 3 / 1; }
.colour_scope_fixturePhaseStart { grid-area: 3 / 2; }
.colour_scope_fixturePhaseStop { grid-area: 3 / 3; }
.colour_scope_width { grid-area: 4 / 1; }
.colour_scope_controls .uikit_num_input {
  width: 100%;
}
</style>
