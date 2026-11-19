<template>
  <uk-widget
    class="pantilt_scope"
    dockable
    :header="{ title: 'Pan/Tilt Scope', icon: 'pan' }"
  >
    <div class="pantilt_scope_body">
      <!-- The graph, on the left: square, flush, as tall as the panel -->
      <div
        ref="field"
        class="pantilt_scope_field"
        :class="{ dragging: !!drag }"
        :data-units="degrees ? 'deg' : 'dmx'"
        tabindex="0"
        title="Drag the box to move the shape, its handles to resize it. Arrows: by 1 (Shift: 10)"
        @pointermove="hoverField"
        @pointerleave="pointer = null"
      >
        <svg
          ref="svg"
          class="pantilt_scope_svg"
          :data-step="step"
          :viewBox="`0 0 ${view.size} ${view.size}`"
          preserveAspectRatio="none"
        >
          <line
            v-for="line in grid.lines"
            :key="line.key"
            :class="['pantilt_scope_grid', { zero: line.zero }]"
            :x1="line.x1"
            :y1="line.y1"
            :x2="line.x2"
            :y2="line.y2"
          />
          <!-- One line when every fixture shares the path, else one each, the first one's lit -->
          <polyline
            v-for="path in paths"
            :key="path.key"
            :class="['pantilt_scope_path', {
              shared: paths.length === 1,
              lead: path.ids.includes(leadId),
              lit: hovered != null && path.ids.includes(hovered),
            }]"
            :points="path.points"
          />
          <!-- The queue: along the shared path, from the first fixture to the last -->
          <polyline
            v-if="queue"
            class="pantilt_scope_queue"
            :points="queue"
          />
          <!-- The path's box: drag inside to move it -->
          <rect
            class="pantilt_scope_box"
            :x="boxView.x"
            :y="boxView.y"
            :width="boxView.width"
            :height="boxView.height"
            @pointerdown="(e) => press(e, 'move')"
          />
        </svg>
        <!-- Handles just outside the box: the edges move one end, the corners one end of each -->
        <div
          v-for="handle in handles"
          :key="handle.edge"
          :class="['pantilt_scope_handle', `pantilt_scope_handle_${handle.edge}`]"
          :style="handle.style"
          :title="handle.title"
          @pointerdown="(e) => press(e, handle.edge)"
        />
        <!-- The first fixture lit and numbered, the others faint; hover one to light it. A press
          on a dot moves the shape, like the box -->
        <div
          v-for="dot in dots"
          :key="dot.id"
          :class="['pantilt_scope_dot', { lead: dot.index === 0, lit: hovered === dot.id }]"
          :data-index="dot.index"
          :style="dot.style"
          @pointerenter="hovered = dot.id"
          @pointerleave="hovered = null"
          @pointerdown="(e) => press(e, 'move')"
        >
          {{ dot.index === 0 || hovered === dot.id ? dot.index + 1 : '' }}
        </div>
        <span
          v-if="readout"
          class="pantilt_scope_readout"
        >{{ readout }}</span>
      </div>
      <!-- Shape, spread and the exact values, at a fixed width -->
      <div class="pantilt_scope_controls">
        <uk-select-input
          class="pantilt_scope_shape"
          label="Shape"
          placeholder="Pick a shape"
          :options="SHAPE_OPTIONS"
          :model-value="shapeIndex"
          reselect
          @update:model-value="pickShape"
        />
        <uk-select-input
          class="pantilt_scope_spread"
          label="Spread"
          placeholder="Pick a spread"
          :options="SPREAD_OPTIONS"
          :model-value="spreadIndex"
          reselect
          @update:model-value="pickSpread"
        />
        <uk-num-input
          v-for="field in fields"
          :key="field.key"
          :class="['pantilt_scope_value', `pantilt_scope_${field.key}`]"
          :label="field.label"
          :title="field.title"
          :model-value="values[field.key]"
          :min="field.min"
          :max="field.max"
          :precision="0"
          placeholder="--"
          relative
          @update:model-value="(value) => setField(field.key, value)"
          @step="(delta) => setField(field.key, values[field.key] + delta)"
        />
        <!-- View switches, stacked next to the graph, lit while on (keyed by state: a click keeps
          the look in step) -->
        <div class="pantilt_scope_toggles">
          <uk-button
            :key="`degrees-${degrees}`"
            class="pantilt_scope_units"
            label="deg"
            title="Degrees: angles from the fixture profile (off: DMX 0-255)"
            square
            toggleable
            color="var(--accent-blue)"
            :model-value="degrees"
            @click="degrees = !degrees"
          />
          <uk-button
            :key="`zoom-${!full}`"
            class="pantilt_scope_full"
            label="fit"
            title="Fit: zoomed on the path (off: the whole range)"
            square
            toggleable
            color="var(--accent-blue)"
            :model-value="!full"
            @click="full = !full"
          />
        </div>
      </div>
    </div>
  </uk-widget>
</template>

<script>
import { toRaw } from 'vue';
import LiveMixin from '@/views/mixins/live.mixin';
import KeysMixin from '@/views/mixins/keys.mixin';
import {
  PANTILT_SHAPES, SCOPE_SAMPLES, SPREADS, applyShape, applySpread, clamp, fitView, gridStep,
  matchFixtures, matchShape, matchSpread, panTiltPath, rangesOf, samePath, setSpan, setSpeed,
  shapeKey, speedOf, valueAt, viewAxis, waveOf, waveSpan,
} from '@/views/utils/effect.scope';

/**
 * Box handles: the ends of the spans each one moves (`[axis, end]`), the edges one, the corners
 * one of each
 *
 * @constant {Array<Object>}
 */
const EDGES = [
  { edge: 'left', parts: [['pan', 'low']], title: 'Pan low end' },
  { edge: 'right', parts: [['pan', 'high']], title: 'Pan high end' },
  { edge: 'bottom', parts: [['tilt', 'low']], title: 'Tilt low end' },
  { edge: 'top', parts: [['tilt', 'high']], title: 'Tilt high end' },
  {
    edge: 'topleft', parts: [['pan', 'low'], ['tilt', 'high']], title: 'Pan low and tilt high ends',
  },
  {
    edge: 'topright', parts: [['pan', 'high'], ['tilt', 'high']], title: 'Pan and tilt high ends',
  },
  {
    edge: 'bottomleft', parts: [['pan', 'low'], ['tilt', 'low']], title: 'Pan and tilt low ends',
  },
  {
    edge: 'bottomright', parts: [['pan', 'high'], ['tilt', 'low']], title: 'Pan high and tilt low ends',
  },
];

/**
 * Gap between a handle and the box (px): clear of the dots on the box's edge
 *
 * @constant {Number}
 */
const HANDLE_GAP = 16;

/**
 * @component PanTiltScope The shape an effect's Pan and Tilt waves draw, in degrees from the
 * fixture profile (or DMX): a grid zoomed on the path, a numbered dot per fixture. Drag the path
 * to move it, its handles to resize it, a dot along it to spread the fixtures; fields, shapes and
 * spreads
 */
export default {
  name: 'GroupEffectModifierWidgetScopePanTilt',
  compatConfig: {
    MODE: 3,
  },
  mixins: [LiveMixin, KeysMixin],
  props: {
    /**
     * Effect cue (with a Pan and a Tilt wave)
     */
    effect: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      /**
       * Running drag, or null
       */
      drag: null,
      /**
       * Hovered fixture id, or null
       */
      hovered: null,
      /**
       * Whether the field shows the whole range rather than the path
       */
      full: false,
      /**
       * Whether the field is in degrees (else DMX)
       */
      degrees: true,
      /**
       * Last shape and spread picked: shown while the waves still match them (several can)
       */
      shape: null,
      spread: null,
      /**
       * Last non-zero size per axis (DMX): a line flattens one, the next shape gets it back
       */
      sizes: { pan: 64, tilt: 64 },
      /**
       * Pointer over the graph (view units), or null
       */
      pointer: null,
    };
  },
  computed: {
    /**
     * Pan wave
     *
     * @type {?Object}
     */
    pan() {
      return waveOf(this.effect, 'Pan');
    },
    /**
     * Tilt wave
     *
     * @type {?Object}
     */
    tilt() {
      return waveOf(this.effect, 'Tilt');
    },
    /**
     * Changes when the drawn paths change
     *
     * @type {String}
     */
    shapeKey() {
      return `${shapeKey(this.pan)}#${shapeKey(this.tilt)}`;
    },
    /**
     * Active fixtures of both waves, in effect order, with their path over one loop (DMX)
     *
     * @type {Array<Object>}
     */
    rows() {
      if (!this.pan || !this.tilt || !this.shapeKey) return [];
      const pan = toRaw(this.pan);
      const tilt = toRaw(this.tilt);
      return matchFixtures([pan, tilt])
        .filter((row) => row.active)
        .map((row, index) => ({ ...row, index, points: panTiltPath(pan, tilt, row.entries) }));
    },
    /**
     * Pan and tilt ranges in degrees, from the fixtures' profiles
     *
     * @type {Object} `{ pan, tilt, known }`
     */
    ranges() {
      const fixtures = this.pan ? toRaw(this.pan).fixtures.map((f) => f.handle) : [];
      return rangesOf(fixtures);
    },
    /**
     * DMX to view units, per axis
     *
     * @type {Object} `{ pan, tilt }`
     */
    axes() {
      return {
        pan: viewAxis(this.degrees ? this.ranges.pan : null),
        tilt: viewAxis(this.degrees ? this.ranges.tilt : null),
      };
    },
    /**
     * The path's box (view units)
     *
     * @type {Object} `{ left, right, bottom, top }`
     */
    box() {
      if (!this.pan || !this.tilt) {
        return {
          left: 0, right: 0, bottom: 0, top: 0,
        };
      }
      const pan = waveSpan(this.pan);
      const tilt = waveSpan(this.tilt);
      return {
        left: this.axes.pan.toView(pan.low),
        right: this.axes.pan.toView(pan.high),
        bottom: this.axes.tilt.toView(tilt.low),
        top: this.axes.tilt.toView(tilt.high),
      };
    },
    /**
     * Shown part of the field (frozen while dragging, so it doesn't rescale under the pointer)
     *
     * @type {Object} `{ x, y, size }` (view units)
     */
    view() {
      if (this.drag) return this.drag.view;
      const { pan, tilt } = this.axes;
      return fitView(this.box, { x: [pan.min, pan.max], y: [tilt.min, tilt.max] }, this.full);
    },
    /**
     * Grid step (view units)
     *
     * @type {Number}
     */
    step() {
      return gridStep(this.view.size, this.degrees);
    },
    /**
     * Grid lines (SVG units: view relative, Y down); their values show in the readout on hover
     *
     * @type {Object} `{ lines }`
     */
    grid() {
      const { x, y, size } = this.view;
      const { step } = this;
      const lines = [];
      for (let v = Math.ceil(x / step) * step; v <= x + size + 1e-9; v += step) {
        const at = v - x;
        lines.push({
          key: `x${v}`, zero: Math.abs(v) < 1e-9 && this.degrees, x1: at, x2: at, y1: 0, y2: size,
        });
      }
      for (let v = Math.ceil(y / step) * step; v <= y + size + 1e-9; v += step) {
        const at = size - (v - y);
        lines.push({
          key: `y${v}`, zero: Math.abs(v) < 1e-9 && this.degrees, x1: 0, x2: size, y1: at, y2: at,
        });
      }
      return { lines };
    },
    /**
     * Paths to draw (SVG units): fixtures whose paths coincide share one
     *
     * @type {Array<Object>}
     */
    paths() {
      const shapes = [];
      this.rows.forEach((row) => {
        const same = shapes.find((shape) => samePath(shape.samples, row.points));
        if (same) {
          same.ids.push(row.id);
          return;
        }
        shapes.push({
          key: row.id,
          ids: [row.id],
          samples: row.points,
          points: row.points.map(([p, t]) => {
            const [sx, sy] = this.toSvg(p, t);
            return `${sx.toFixed(2)},${sy.toFixed(2)}`;
          }).join(' '),
        });
      });
      return shapes;
    },
    /**
     * The box in SVG units
     *
     * @type {Object} `{ x, y, width, height }`
     */
    boxView() {
      const { x, y, size } = this.view;
      const { box } = this;
      const min = size / 100;
      return {
        x: box.left - x,
        y: size - (box.top - y),
        width: Math.max(box.right - box.left, min),
        height: Math.max(box.top - box.bottom, min),
      };
    },
    /**
     * Edge handles (HTML, % of the field, offset outside the box)
     *
     * @type {Array<Object>}
     */
    handles() {
      const { x, y, size } = this.view;
      const { box } = this;
      const pct = (v, from) => `${((v - from) / size) * 100}%`;
      const midX = pct((box.left + box.right) / 2, x);
      const midY = `${100 - ((((box.bottom + box.top) / 2) - y) / size) * 100}%`;
      // Kept inside the field, so a box on its edge still has handles to grab
      const inside = (value) => `clamp(8px, ${value}, calc(100% - 8px))`;
      const left = inside(`calc(${pct(box.left, x)} - ${HANDLE_GAP}px)`);
      const right = inside(`calc(${pct(box.right, x)} + ${HANDLE_GAP}px)`);
      const bottom = inside(`calc(${100 - ((box.bottom - y) / size) * 100}% + ${HANDLE_GAP}px)`);
      const top = inside(`calc(${100 - ((box.top - y) / size) * 100}% - ${HANDLE_GAP}px)`);
      const at = {
        left: { left, top: midY },
        right: { left: right, top: midY },
        bottom: { left: midX, top: bottom },
        top: { left: midX, top },
        topleft: { left, top },
        topright: { left: right, top },
        bottomleft: { left, top: bottom },
        bottomright: { left: right, top: bottom },
      };
      return EDGES.map((edge) => ({ ...edge, style: at[edge.edge] }));
    },
    /**
     * Id of the first fixture (lit)
     *
     * @type {?Number}
     */
    leadId() {
      return this.rows.length ? this.rows[0].id : null;
    },
    /**
     * When every fixture shares one path: the stretch of it the fixtures cover, from the first
     * to the last (SVG points), moving with the effect; else null
     *
     * @type {?String}
     */
    queue() {
      this.live();
      if (this.paths.length !== 1 || this.rows.length < 2) return null;
      const pan = toRaw(this.pan);
      const tilt = toRaw(this.tilt);
      const lead = this.rows[0];
      const frequency = Number(pan.frequency) || 1;
      const leadPhase = lead.entries[0] ? lead.entries[0].phase : 0;
      // Each fixture is the first one shifted in time: its lag over the loop, in 0-1
      const lags = this.rows.map((row) => {
        const lag = ((row.entries[0] ? row.entries[0].phase : 0) - leadPhase)
          / (2 * Math.PI * frequency);
        return lag - Math.floor(lag);
      }).sort((a, b) => a - b);
      // The stretch covering them all: everything but the widest gap between two of them
      let gap = 1 - lags[lags.length - 1] + lags[0];
      let from = lags[0];
      for (let i = 1; i < lags.length; i++) {
        if (lags[i] - lags[i - 1] > gap) {
          gap = lags[i] - lags[i - 1];
          from = lags[i];
        }
      }
      const length = (1 - gap) / frequency;
      if (length <= 0) return null;
      const time = pan.time || 0;
      const steps = Math.max(2, Math.ceil(length * SCOPE_SAMPLES));
      let points = '';
      for (let i = 0; i <= steps; i++) {
        const t = time + from / frequency + (length * i) / steps;
        const [sx, sy] = this.toSvg(
          valueAt(pan, lead.entries[0], t),
          valueAt(tilt, lead.entries[1], t),
        );
        points += `${sx.toFixed(2)},${sy.toFixed(2)} `;
      }
      return points;
    },
    /**
     * Where each fixture is now (moves while the effect plays), as HTML positions
     *
     * @type {Array<Object>}
     */
    dots() {
      this.live();
      const pan = toRaw(this.pan);
      const tilt = toRaw(this.tilt);
      const { size } = this.view;
      return this.rows.map((row) => {
        const [sx, sy] = this.toSvg(
          valueAt(pan, row.entries[0], pan.time || 0),
          valueAt(tilt, row.entries[1], tilt.time || 0),
        );
        return {
          id: row.id,
          index: row.index,
          name: row.name,
          style: { left: `${(sx / size) * 100}%`, top: `${(sy / size) * 100}%` },
        };
      });
    },
    /**
     * Shape the waves draw (the last picked while it still matches), Custom's index for none
     *
     * @type {Number}
     */
    shapeIndex() {
      if (!this.pan || !this.tilt) return PANTILT_SHAPES.length;
      // eslint-disable-next-line no-unused-expressions
      this.shapeKey;
      const index = matchShape(toRaw(this.pan), toRaw(this.tilt), this.ranges, this.shape);
      return index < 0 ? PANTILT_SHAPES.length : index;
    },
    /**
     * Spread of the waves, Custom's index for none
     *
     * @type {Number}
     */
    spreadIndex() {
      if (!this.pan || !this.tilt) return SPREADS.length;
      // eslint-disable-next-line no-unused-expressions
      this.shapeKey;
      const index = matchSpread([toRaw(this.pan), toRaw(this.tilt)], this.spread);
      return index < 0 ? SPREADS.length : index;
    },
    /**
     * Value fields, in the view's unit
     *
     * @type {Array<Object>}
     */
    fields() {
      const unit = this.degrees ? ' °' : '';
      const { pan, tilt } = this.axes;
      return [
        {
          key: 'centrePan', label: `Centre pan${unit}`, title: 'Middle of the pan range', min: pan.min, max: pan.max,
        },
        {
          key: 'centreTilt', label: `Centre tilt${unit}`, title: 'Middle of the tilt range', min: tilt.min, max: tilt.max,
        },
        {
          key: 'speed', label: 'Speed', title: 'Times the shape runs per effect loop', min: 1, max: 100,
        },
        {
          key: 'start', label: 'Phase start', title: 'Offset of the first fixture (°)', min: -360, max: 360,
        },
        {
          key: 'sizePan', label: `Size pan${unit}`, title: 'Width of the pan range', min: 0, max: pan.max - pan.min,
        },
        {
          key: 'sizeTilt', label: `Size tilt${unit}`, title: 'Height of the tilt range', min: 0, max: tilt.max - tilt.min,
        },
        {
          key: 'stop', label: 'Phase stop', title: 'Offset of the last fixture (°)', min: -360, max: 360,
        },
      ];
    },
    /**
     * The fields' values (view units)
     *
     * @type {Object}
     */
    values() {
      const { box } = this;
      return {
        centrePan: Math.round((box.left + box.right) / 2),
        centreTilt: Math.round((box.bottom + box.top) / 2),
        sizePan: Math.round(box.right - box.left),
        sizeTilt: Math.round(box.top - box.bottom),
        speed: this.pan && this.tilt ? speedOf([this.pan, this.tilt]) : 1,
        start: this.pan ? this.pan.fixturePhaseStart : 0,
        stop: this.pan ? this.pan.fixturePhaseStop : 0,
      };
    },
    /**
     * What the field's corner says: what a drag changes, the hovered fixture, or the pan and
     * tilt under the pointer with the grid step
     *
     * @type {String}
     */
    readout() {
      const unit = this.degrees ? '°' : '';
      const r = Math.round;
      if (this.drag && this.drag.moved) {
        const b = this.box;
        return `Pan ${r(b.left)}${unit} to ${r(b.right)}${unit} · Tilt ${r(b.bottom)}${unit} to ${r(b.top)}${unit}`;
      }
      const dot = this.dots.find((d) => d.id === this.hovered);
      if (dot) return `${dot.index + 1} · ${dot.name}`;
      if (this.pointer) {
        return `Pan ${r(this.pointer.x)}${unit} · Tilt ${r(this.pointer.y)}${unit} · grid ${this.step}${unit}`;
      }
      return '';
    },
  },
  watch: {
    /**
     * Remembers each axis' last non-zero size
     */
    shapeKey: {
      immediate: true,
      handler() {
        ['pan', 'tilt'].forEach((axis) => {
          if (!this[axis]) return;
          const span = waveSpan(this[axis]);
          if (span.high - span.low > 0) this.sizes[axis] = span.high - span.low;
        });
      },
    },
  },
  created() {
    // The last option, Custom, stands for waves no item matches
    this.SHAPE_OPTIONS = [...PANTILT_SHAPES.map((shape) => shape.name), 'Custom'];
    this.SPREAD_OPTIONS = [...SPREADS.map((spread) => spread.name), 'Custom'];
  },
  beforeUnmount() {
    this.stopListening();
  },
  methods: {
    /**
     * A DMX point in SVG units (view relative, Y down)
     *
     * @public
     * @param {Number} pan DMX
     * @param {Number} tilt DMX
     * @returns {Array<Number>} `[x, y]`
     */
    toSvg(pan, tilt) {
      const { x, y, size } = this.view;
      return [this.axes.pan.toView(pan) - x, size - (this.axes.tilt.toView(tilt) - y)];
    },
    /**
     * Element that takes the arrow keys (keys mixin)
     *
     * @public
     * @returns {HTMLElement}
     */
    keysElement() {
      return this.$refs.field;
    },
    /**
     * Arrow keys move the path by 1 DMX step (Shift: 10)
     *
     * @public
     * @param {KeyboardEvent} e
     * @returns {Boolean} whether the key was used
     */
    handleKeys(e) {
      const moves = {
        ArrowLeft: ['pan', -1],
        ArrowRight: ['pan', 1],
        ArrowDown: ['tilt', -1],
        ArrowUp: ['tilt', 1],
      };
      const move = moves[e.key];
      if (!move || !this.pan || !this.tilt) return false;
      const [axis, sign] = move;
      const span = waveSpan(this[axis]);
      const centre = (span.low + span.high) / 2 + sign * (e.shiftKey ? 10 : 1);
      setSpan(this[axis], centre, span.high - span.low);
      return true;
    },
    /**
     * Field point (view units, tilt up) under the pointer
     *
     * @public
     * @param {PointerEvent} e
     * @returns {Object} `{ x, y }`
     */
    pointAt(e) {
      const rect = this.$refs.field.getBoundingClientRect();
      const { x, y, size } = this.view;
      return {
        x: x + ((e.clientX - rect.left) / rect.width) * size,
        y: y + (1 - (e.clientY - rect.top) / rect.height) * size,
      };
    },
    /**
     * A wave's fields a drag starts from
     *
     * @public
     * @param {Object} wave FXChannel
     * @returns {Object}
     */
    snapshot(wave) {
      return {
        min: wave.min,
        max: wave.max,
        phase: wave.phase,
        start: wave.fixturePhaseStart,
        stop: wave.fixturePhaseStop,
      };
    },
    /**
     * Starts moving or resizing the path
     *
     * @public
     * @param {PointerEvent} e
     * @param {String} mode 'move', or a handle's edge (`EDGES`)
     */
    press(e, mode) {
      if (e.button !== 0 || !this.pan || !this.tilt) return;
      e.preventDefault();
      e.stopPropagation();
      this.$refs.field.focus({ preventScroll: true });
      this.drag = {
        mode,
        view: this.view,
        // A move or a resize follows the pointer from the first pixel (fine Shift steps)
        moved: true,
        start: this.pointAt(e),
        pan: this.snapshot(toRaw(this.pan)),
        tilt: this.snapshot(toRaw(this.tilt)),
      };
      window.addEventListener('pointermove', this.dragTo);
      window.addEventListener('pointerup', this.drop);
    },
    /**
     * Applies the running drag
     *
     * @public
     * @param {PointerEvent} e pointermove event
     */
    dragTo(e) {
      const { drag } = this;
      if (!drag) return;
      const point = this.pointAt(e);
      // Grid steps (view units) turned into DMX; Shift: single DMX steps
      const toDmx = (delta, axis) => {
        const { perDmx } = this.axes[axis];
        if (e.shiftKey) return Math.round(delta / perDmx);
        return Math.round((Math.round(delta / this.step) * this.step) / perDmx);
      };
      const delta = {
        pan: toDmx(point.x - drag.start.x, 'pan'),
        tilt: toDmx(point.y - drag.start.y, 'tilt'),
      };
      if (drag.mode === 'move') {
        ['pan', 'tilt'].forEach((axis) => this.shift(axis, delta[axis]));
        return;
      }
      const edge = EDGES.find((item) => item.edge === drag.mode);
      edge.parts.forEach(([axis, end]) => this.resize(axis, end, delta[axis]));
    },
    /**
     * Shifts a wave's span from the drag start, within 0-255
     *
     * @public
     * @param {String} axis 'pan' or 'tilt'
     * @param {Number} delta DMX steps
     */
    shift(axis, delta) {
      const start = this.drag[axis];
      const low = Math.min(start.min, start.max);
      const high = Math.max(start.min, start.max);
      const step = clamp(delta, -low, 255 - high);
      const wave = this[axis];
      if (wave.min !== start.min + step) wave.min = start.min + step;
      if (wave.max !== start.max + step) wave.max = start.max + step;
    },
    /**
     * Moves one end of a wave's span from the drag start, never past the other end
     *
     * @public
     * @param {String} axis 'pan' or 'tilt'
     * @param {String} end 'low' or 'high'
     * @param {Number} delta DMX steps
     */
    resize(axis, end, delta) {
      const span = waveSpan(this.drag[axis]);
      const value = end === 'high'
        ? clamp(span.high + delta, span.low, 255)
        : clamp(span.low + delta, 0, span.high);
      const key = end === 'high' ? span.highKey : span.lowKey;
      if (this[axis][key] !== value) this[axis][key] = value;
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
     * Follows the pointer over the graph, for the readout
     *
     * @public
     * @param {PointerEvent} e
     */
    hoverField(e) {
      if (!this.drag) this.pointer = this.pointAt(e);
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
     * Writes a field (view units for centres and sizes)
     *
     * @public
     * @param {String} key a field key
     * @param {Number} value
     */
    setField(key, value) {
      if (value == null || Number.isNaN(value) || !this.pan || !this.tilt) return;
      const { pan, tilt } = this.axes;
      const span = (wave) => waveSpan(wave).high - waveSpan(wave).low;
      switch (key) {
        case 'centrePan': setSpan(this.pan, pan.toDmx(value), span(this.pan)); break;
        case 'centreTilt': setSpan(this.tilt, tilt.toDmx(value), span(this.tilt)); break;
        case 'sizePan': {
          const s = waveSpan(this.pan);
          setSpan(this.pan, (s.low + s.high) / 2, value / pan.perDmx);
          break;
        }
        case 'sizeTilt': {
          const s = waveSpan(this.tilt);
          setSpan(this.tilt, (s.low + s.high) / 2, value / tilt.perDmx);
          break;
        }
        case 'speed': setSpeed([this.pan, this.tilt], value); break;
        default: {
          // Both waves; the tilt's offsets scaled so the fixtures keep their place on the shape
          const ratio = (Number(this.tilt.frequency) || 1) / (Number(this.pan.frequency) || 1);
          const field = key === 'start' ? 'fixturePhaseStart' : 'fixturePhaseStop';
          const degrees = clamp(Math.round(value), -360, 360);
          this.pan[field] = degrees;
          this.tilt[field] = clamp(Math.round(degrees * ratio), -360, 360);
        }
      }
    },
    /**
     * Gives the path a shape, fully (see `applyShape`)
     *
     * @public
     * @param {Number} index a shape's index
     */
    pickShape(index) {
      // Custom: nothing to apply
      if (index >= PANTILT_SHAPES.length) return;
      this.shape = index;
      if (!this.pan || !this.tilt) return;
      applyShape(this.pan, this.tilt, PANTILT_SHAPES[index], {
        speed: speedOf([this.pan, this.tilt]),
        sizes: { ...this.sizes },
        ranges: this.ranges,
      });
    },
    /**
     * Spreads the fixtures over the path
     *
     * @public
     * @param {Number} index a spread's index
     */
    pickSpread(index) {
      if (index >= SPREADS.length) return;
      this.spread = index;
      if (this.pan && this.tilt) applySpread([this.pan, this.tilt], SPREADS[index]);
    },
  },
};
</script>

<style scoped>
.pantilt_scope {
  width: fit-content;
  flex: none;
}
.pantilt_scope_body {
  display: flex;
  align-items: flex-start;
  height: 100%;
  width: 100%;
}
/* Square and flush with the widget's top and left, as tall as the panel */
.pantilt_scope_field {
  position: relative;
  top: -1px;
  left: -1px;
  height: 100%;
  max-height: 100%;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  background-color: var(--primary-dark-alt);
  user-select: none;
  overflow: hidden;
  outline: none;
}
.pantilt_scope_field:focus-visible {
  box-shadow: inset 0 0 0 1px var(--accent-blue);
}
.pantilt_scope_svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.pantilt_scope_grid {
  stroke: var(--primary-dark);
  stroke-width: 1px;
  vector-effect: non-scaling-stroke;
}
.pantilt_scope_grid.zero {
  stroke: var(--secondary-light);
  opacity: 0.5;
}
/* Paths: faint by default; one shared path in the accent; the first fixture's lit */
.pantilt_scope_path {
  fill: none;
  stroke: var(--secondary-lighter);
  stroke-width: 1.5px;
  vector-effect: non-scaling-stroke;
  stroke-linejoin: round;
  opacity: 0.2;
  pointer-events: none;
}
.pantilt_scope_path.shared {
  stroke: var(--accent-blue);
  opacity: 0.5;
}
.pantilt_scope_path.lead:not(.shared) {
  stroke: var(--accent-blue);
  stroke-width: 2px;
  opacity: 1;
}
.pantilt_scope_path.lit:not(.shared) {
  stroke: var(--secondary-lighter);
  stroke-width: 2px;
  opacity: 1;
}
/* The queue: the stretch of the shared path the fixtures cover */
.pantilt_scope_queue {
  fill: none;
  stroke: var(--accent-blue);
  stroke-width: 4px;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}
.pantilt_scope_box {
  fill: transparent;
  stroke: var(--secondary-light-alt);
  stroke-width: 1px;
  stroke-dasharray: 4 4;
  vector-effect: non-scaling-stroke;
  cursor: move;
}
/* Handles and dots: fixed sizes, a wider invisible area to take the pointer */
.pantilt_scope_handle {
  position: absolute;
  z-index: 3;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  background: var(--secondary-light);
  border-radius: var(--radius-sm);
  cursor: ew-resize;
}
.pantilt_scope_handle::after,
.pantilt_scope_dot::after {
  content: '';
  position: absolute;
  inset: -6px;
}
.pantilt_scope_handle_bottom,
.pantilt_scope_handle_top {
  cursor: ns-resize;
}
.pantilt_scope_handle_topleft,
.pantilt_scope_handle_bottomright {
  cursor: nwse-resize;
}
.pantilt_scope_handle_topright,
.pantilt_scope_handle_bottomleft {
  cursor: nesw-resize;
}
/* A fixture: a small faint dot; the first one and the hovered one large and numbered */
.pantilt_scope_dot {
  position: absolute;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-round);
  background: var(--secondary-lighter);
  opacity: 0.45;
  font-family: Roboto-Medium;
  font-size: var(--font-xs);
  color: var(--primary-dark);
  cursor: move;
  z-index: 1;
}
.pantilt_scope_dot.lead,
.pantilt_scope_dot.lit {
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  opacity: 1;
  border: 1px solid var(--primary-dark);
  z-index: 2;
}
.pantilt_scope_dot.lead {
  background: var(--accent-blue);
  color: var(--secondary-lighter);
}
.dragging,
.dragging .pantilt_scope_box,
.dragging .pantilt_scope_dot {
  cursor: grabbing;
}
.pantilt_scope_readout {
  position: absolute;
  left: var(--space-2);
  top: var(--space-2);
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--primary-dark);
  font-family: Roboto-Regular;
  font-size: var(--font-sm);
  color: var(--secondary-lighter);
  pointer-events: none;
  white-space: nowrap;
  z-index: 3;
}
/* Shape and spread, then the values four by four, at a fixed width */
.pantilt_scope_controls {
  flex: none;
  width: 340px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-content: start;
  gap: var(--space-3) var(--space-4);
  padding: var(--space-5);
}
.pantilt_scope_shape { grid-area: 1 / 1 / 2 / 3; }
.pantilt_scope_spread { grid-area: 1 / 3 / 2 / 5; }
.pantilt_scope_centrePan { grid-area: 2 / 1; }
.pantilt_scope_centreTilt { grid-area: 2 / 2; }
.pantilt_scope_speed { grid-area: 2 / 3; }
.pantilt_scope_start { grid-area: 2 / 4; }
/* Deg and Fit, stacked next to the graph */
.pantilt_scope_toggles {
  grid-area: 3 / 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: var(--space-1);
}
.pantilt_scope_toggles .uikit_button {
  min-width: 0;
  height: calc(var(--control-height) - var(--space-2));
  padding: 0;
}
.pantilt_scope_sizePan { grid-area: 3 / 2; }
.pantilt_scope_sizeTilt { grid-area: 3 / 3; }
.pantilt_scope_stop { grid-area: 3 / 4; }
.pantilt_scope_controls .uikit_num_input {
  width: 100%;
}
</style>
