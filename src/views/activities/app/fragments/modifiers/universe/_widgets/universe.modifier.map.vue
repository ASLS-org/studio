<template>
  <div
    class="universe_map"
    :class="{ readonly, dragging: !!(drag && drag.moved) }"
  >
    <div
      v-if="labels"
      class="universe_map_rows"
    >
      <!-- DMX address of each row's first slot -->
      <div
        v-for="row in ROWS"
        :key="row"
        class="universe_map_row_label"
      >
        {{ (row - 1) * COLUMNS + 1 }}
      </div>
    </div>
    <div
      ref="grid"
      class="universe_map_grid"
      @pointerdown.self="clear"
    >
      <!-- Ghosts of the fixtures about to be patched (patch popup) -->
      <div
        v-for="segment in highlightSegments"
        :key="segment.key"
        class="universe_map_block universe_map_highlight"
        :class="{ error: highlight && highlight.error }"
        :style="segment.style"
      >
        <template v-if="segment.first">
          <span class="universe_map_block_name">{{ segment.name }}</span>
          <span class="universe_map_block_range">{{ segment.range }}</span>
        </template>
        <span
          v-else
          class="universe_map_block_name continued"
        >{{ segment.name }}</span>
      </div>
      <!-- Patched fixtures: one segment per row they cross -->
      <div
        v-for="segment in segments"
        :key="segment.key"
        class="universe_map_block"
        :class="{
          selected: segment.selected,
          conflict: segment.conflict,
          first: segment.first,
          last: segment.last,
        }"
        :style="segment.style"
        :title="segment.title"
        :data-fixture="segment.id"
        @pointerdown="(e) => press(e, segment.id)"
      >
        <template v-if="segment.first">
          <span class="universe_map_block_name">{{ segment.name }}</span>
          <span class="universe_map_block_range">{{ segment.range }}</span>
        </template>
        <span
          v-else
          class="universe_map_block_name continued"
        >{{ segment.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { dmxAddress } from '@/views/utils/dmx';

/**
 * Slots per row
 *
 * @constant {Number} COLUMNS
 */
const COLUMNS = 32;

/**
 * Rows of a universe (512 / 32)
 *
 * @constant {Number} ROWS
 */
const ROWS = 16;

/**
 * Addresses in a universe
 *
 * @constant {Number} LENGTH
 */
const LENGTH = COLUMNS * ROWS;

/**
 * Pointer travel before a press becomes a drag (px)
 *
 * @constant {Number} DRAG_THRESHOLD
 */
const DRAG_THRESHOLD = 3;

/**
 * Splits a range into the row segments it covers (clipped to the universe)
 *
 * @param {Number} start first slot (0-based)
 * @param {Number} count slot count
 * @returns {Array<Object>} `{ row, column, length }` per row, first to last
 */
function rowSegments(start, count) {
  const segments = [];
  let slot = Math.max(0, start);
  const end = Math.min(LENGTH, start + count);
  while (slot < end) {
    const row = Math.floor(slot / COLUMNS);
    const column = slot % COLUMNS;
    const length = Math.min(COLUMNS - column, end - slot);
    segments.push({ row, column, length });
    slot += length;
  }
  return segments;
}

/**
 * Text of an address range, 1-based
 *
 * @param {Number} start first slot (0-based)
 * @param {Number} count slot count
 * @returns {String} `first–last`, or `first` for one address
 */
function rangeText(start, count) {
  return count > 1 ? `${dmxAddress(start)}–${dmxAddress(start + count - 1)}` : `${dmxAddress(start)}`;
}

/**
 * @component UniverseMap A universe's 512 addresses with its fixtures as blocks: selectable and
 * draggable (repatch popup), or read-only with a range highlighted (patch popup)
 */
export default {
  name: 'UniverseModifierMap',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * Fixtures to draw: `{ id, name, chStart, count }` (chStart 0-based, draft positions)
     */
    fixtures: {
      type: Array,
      default: () => [],
    },
    /**
     * Colour of the blocks (the universe's)
     */
    color: {
      type: String,
      default: 'var(--accent-blue)',
    },
    /**
     * Ids of the selected fixtures
     */
    selection: {
      type: Array,
      default: () => [],
    },
    /**
     * Fixtures about to be patched, shown as ghosts: `{ chStart, count, error, name, size }`
     * (`size` channels per fixture, numbered when there are several), or null
     */
    highlight: {
      type: Object,
      default: null,
    },
    /**
     * No selection or dragging
     */
    readonly: Boolean,
    /**
     * Shows each row's first address on its left
     */
    labels: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['select', 'clear', 'move'],
  data() {
    return {
      /**
       * Drag in progress: `{ moving, still, x, y, anchor, min, max, delta, moved }`, null
       * otherwise (moving / still: `{ start, stop }` ranges of the dragged and other fixtures)
       */
      drag: null,
    };
  },
  computed: {
    /**
     * Fixtures where they are drawn: the selected ones shifted by the drag
     */
    placed() {
      const shift = this.drag ? this.drag.delta : 0;
      return this.fixtures.map((fixture) => {
        const selected = this.selection.includes(fixture.id);
        return { ...fixture, selected, start: fixture.chStart + (selected ? shift : 0) };
      });
    },
    /**
     * Ids of drawn fixtures that overlap another one or leave the universe
     */
    conflicts() {
      const ids = new Set();
      const sorted = [...this.placed].sort((a, b) => a.start - b.start);
      let reach = null;
      sorted.forEach((fixture) => {
        if (fixture.start < 0 || fixture.start + fixture.count > LENGTH) ids.add(fixture.id);
        if (reach && fixture.start < reach.end) {
          ids.add(fixture.id);
          ids.add(reach.id);
        }
        if (!reach || fixture.start + fixture.count > reach.end) {
          reach = { id: fixture.id, end: fixture.start + fixture.count };
        }
      });
      return ids;
    },
    /**
     * Row segments of every fixture
     */
    segments() {
      return this.placed.flatMap((fixture) => {
        const parts = rowSegments(fixture.start, fixture.count);
        const range = rangeText(fixture.start, fixture.count);
        const conflict = this.conflicts.has(fixture.id);
        return parts.map((part, index) => ({
          key: `${fixture.id}-${index}`,
          id: fixture.id,
          name: fixture.name,
          range,
          title: `${fixture.name}: ${range} (${fixture.count} ch)${conflict ? ', overlaps' : ''}`,
          selected: fixture.selected,
          conflict,
          first: index === 0,
          last: index === parts.length - 1,
          style: this.segmentStyle(part, this.color),
        }));
      });
    },
    /**
     * Row segments of the highlighted range
     */
    highlightSegments() {
      if (!this.highlight || this.highlight.count < 1) return [];
      const {
        chStart, count, name = '', size = count,
      } = this.highlight;
      const amount = Math.max(1, Math.ceil(count / (size || count)));
      const segments = [];
      for (let i = 0; i < amount; i += 1) {
        const start = chStart + i * size;
        const length = Math.min(size, chStart + count - start);
        const label = amount > 1 ? `${name} ${i + 1}` : name;
        rowSegments(start, length).forEach((part, index) => segments.push({
          key: `h${i}-${index}`,
          first: index === 0,
          name: label,
          range: rangeText(start, length),
          style: this.segmentStyle(part, this.color),
        }));
      }
      return segments;
    },
  },
  created() {
    this.COLUMNS = COLUMNS;
    this.ROWS = ROWS;
  },
  beforeUnmount() {
    this.stopListening();
  },
  methods: {
    /**
     * Position of a row segment in the grid
     *
     * @public
     * @param {Object} part `{ row, column, length }`
     * @param {String} [color] block colour
     * @returns {Object} css
     */
    segmentStyle(part, color) {
      return {
        // the same 1px inset on both ends of every segment: a 2px gap between any two blocks
        left: `calc(${(part.column / COLUMNS) * 100}% + 1px)`,
        width: `calc(${(part.length / COLUMNS) * 100}% - 2px)`,
        top: `calc(${part.row} * var(--universe-map-row))`,
        ...(color ? { '--block-color': color } : {}),
      };
    },
    /**
     * Slot under the pointer, kept inside the grid
     *
     * @public
     * @param {PointerEvent} e pointer event
     * @returns {Number} slot (0-based)
     */
    slotAt(e) {
      const box = this.$refs.grid.getBoundingClientRect();
      const clamp = (v, max) => Math.min(max, Math.max(0, v));
      const column = clamp(Math.floor(((e.clientX - box.left) / box.width) * COLUMNS), COLUMNS - 1);
      const row = clamp(Math.floor(((e.clientY - box.top) / box.height) * ROWS), ROWS - 1);
      return row * COLUMNS + column;
    },
    /**
     * Press on an empty slot: clears the selection
     *
     * @public
     * @param {PointerEvent} e pointerdown event
     */
    clear(e) {
      if (this.readonly || e.button !== 0) return;
      if (!(e.ctrlKey || e.metaKey || e.shiftKey)) this.$emit('clear');
    },
    /**
     * Press on a block: selects it (Ctrl/⌘ or Shift adds or removes), then drags the selection
     *
     * @public
     * @param {PointerEvent} e pointerdown event
     * @param {Number} id fixture id
     */
    press(e, id) {
      if (this.readonly || e.button !== 0) return;
      e.preventDefault();
      const additive = e.ctrlKey || e.metaKey || e.shiftKey;
      if (additive || !this.selection.includes(id)) this.$emit('select', id, additive);
      if (additive) return;
      // The selection (with this block) moves together, never leaves the universe and never
      // lands on another fixture
      const moving = this.fixtures
        .filter((fixture) => fixture.id === id || this.selection.includes(fixture.id));
      const still = this.fixtures.filter((fixture) => !moving.includes(fixture));
      this.drag = {
        moving: moving.map((f) => ({ start: f.chStart, stop: f.chStart + f.count })),
        still: still.map((f) => ({ start: f.chStart, stop: f.chStart + f.count })),
        x: e.clientX,
        y: e.clientY,
        anchor: this.slotAt(e),
        min: -Math.min(...moving.map((fixture) => fixture.chStart)),
        max: LENGTH - Math.max(...moving.map((fixture) => fixture.chStart + fixture.count)),
        delta: 0,
        moved: false,
      };
      window.addEventListener('pointermove', this.dragTo);
      window.addEventListener('pointerup', this.drop);
    },
    /**
     * Moves the selection to follow the slot under the pointer
     *
     * @public
     * @param {PointerEvent} e pointermove event
     */
    dragTo(e) {
      if (!this.drag) return;
      const travel = Math.hypot(e.clientX - this.drag.x, e.clientY - this.drag.y);
      if (!this.drag.moved && travel < DRAG_THRESHOLD) return;
      const wanted = this.slotAt(e) - this.drag.anchor;
      let delta = Math.min(this.drag.max, Math.max(this.drag.min, wanted));
      // over another fixture: the blocks stay where they last fitted
      if (!this.fits(delta)) delta = this.drag.delta;
      if (delta !== this.drag.delta || !this.drag.moved) {
        this.drag = { ...this.drag, moved: true, delta };
      }
    },
    /**
     * Whether the dragged blocks, shifted by some addresses, are clear of every other fixture
     *
     * @public
     * @param {Number} delta addresses
     * @returns {Boolean} true when nothing overlaps
     */
    fits(delta) {
      return this.drag.moving.every((m) => this.drag.still
        .every((o) => m.stop + delta <= o.start || o.stop <= m.start + delta));
    },
    /**
     * Ends a drag: reports the move
     *
     * @public
     */
    drop() {
      const { delta, moved } = this.drag || {};
      this.stopListening();
      this.drag = null;
      if (moved && delta) this.$emit('move', delta);
    },
    /**
     * Stops following the pointer
     *
     * @public
     */
    stopListening() {
      window.removeEventListener('pointermove', this.dragTo);
      window.removeEventListener('pointerup', this.drop);
    },
  },
};
</script>

<style scoped>
.universe_map {
  --universe-map-row: 28px;
  font-family: Roboto-Regular;
  display: flex;
  flex-direction: row;
  user-select: none;
}
.universe_map_rows {
  display: flex;
  flex-direction: column;
  width: 34px;
  flex-shrink: 0;
  padding-top: var(--border-width);
}
.universe_map_row_label {
  height: var(--universe-map-row);
  line-height: var(--universe-map-row);
  padding-right: var(--space-3);
  text-align: right;
  color: var(--secondary-light-alt);
  font-size: var(--font-xs);
}
/* A dark well with light cell lines, apart from the popup around it */
/* Same well as the pan/tilt grid */
.universe_map_grid {
  position: relative;
  flex: 1;
  min-width: 0;
  height: calc(16 * var(--universe-map-row));
  box-sizing: content-box;
  border: var(--border-width) solid var(--primary-dark);
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
  background-size: calc(100% / 32) 100%, 100% var(--universe-map-row);
  overflow: hidden;
}
.universe_map_block,
.universe_map_highlight {
  position: absolute;
  /* 1px inset on every side: the same 2px gap between rows as between blocks */
  height: calc(var(--universe-map-row) - 2px);
  margin-top: 1px;
  box-sizing: border-box;
}
/* Looks like a chase item: flat, square, a little transparent */
.universe_map_block {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  overflow: hidden;
  background: var(--block-color);
  border: 1px solid var(--secondary-light);
  opacity: 0.7;
  color: var(--on-color-text);
  font-size: var(--font-xs);
  white-space: nowrap;
  cursor: grab;
  transition: opacity 0.1s;
}
.universe_map_block:hover {
  opacity: 0.85;
}
.universe_map_block {
  padding: 0 var(--space-3);
}
.universe_map_block.selected {
  opacity: 1;
  border-color: var(--secondary-lighter);
  color: #FFFFFF;
  z-index: 2;
}
/* Overlapping or past 512: stripes and a red border, whatever the universe colour */
.universe_map_block.conflict {
  background:
    repeating-linear-gradient(45deg, #00000073 0 4px, transparent 4px 8px),
    var(--block-color);
  border-color: var(--accent-red);
  opacity: 1;
  z-index: 3;
}
.dragging .universe_map_block {
  cursor: grabbing;
}
.dragging .universe_map_block.selected {
  box-shadow: 0 2px 8px #000000A0;
}
.readonly .universe_map_block {
  cursor: default;
}
.universe_map_block_name {
  font-family: Roboto-Medium;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.universe_map_block_name.continued {
  font-family: Roboto-Regular;
  opacity: 0.6;
}
.universe_map_block_range {
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0.8;
}
/* A ghost: drawn like a patched block, much more transparent, and not interactive */
.universe_map_highlight {
  opacity: 0.45;
  border-style: dashed;
  pointer-events: none;
  z-index: 4;
}
.universe_map_highlight.error {
  background:
    repeating-linear-gradient(45deg, #00000073 0 4px, transparent 4px 8px),
    var(--accent-red);
  border-color: var(--accent-red);
  opacity: 0.6;
}
</style>
