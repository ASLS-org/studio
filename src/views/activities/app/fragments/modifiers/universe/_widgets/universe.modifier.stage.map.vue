<template>
  <div
    ref="root"
    class="stage_map"
    :class="{ dragging: !!(drag && drag.moved) }"
  >
    <!-- Drawn once its size is known: one render on mount, not two -->
    <svg
      v-if="size"
      ref="svg"
      class="stage_map_svg"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Y up: the back of the stage at the top -->
      <g
        ref="plane"
        transform="scale(1,-1)"
      >
        <line
          v-for="line in gridLines"
          :key="line.key"
          :class="['stage_map_line', { axis: line.axis }]"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
        />
        <!-- Fixtures of other universes: drawn, not editable -->
        <circle
          v-for="dot in otherDots"
          :key="dot.id"
          class="stage_map_dot other"
          :cx="dot.x"
          :cy="dot.y"
          :r="dotRadius * 0.7"
        />
        <g
          v-for="dot in dots"
          :key="dot.id"
          :class="['stage_map_fixture', { selected: dot.selected }]"
          :data-fixture="dot.id"
          @pointerdown="(e) => press(e, dot.id)"
        >
          <title>{{ dot.name }}</title>
          <line
            v-if="dot.beam"
            class="stage_map_beam"
            :x1="dot.x"
            :y1="dot.y"
            :x2="dot.x + dot.beam.x * dotRadius * 3"
            :y2="dot.y + dot.beam.y * dotRadius * 3"
            :stroke-width="dotRadius * 0.6"
          />
          <circle
            class="stage_map_dot"
            :cx="dot.x"
            :cy="dot.y"
            :r="dotRadius"
          />
        </g>
      </g>
    </svg>
    <span class="stage_map_side back">Back</span>
    <span class="stage_map_side audience">Audience</span>
  </div>
</template>

<script>
import { beamOnFloor } from '@/views/utils/placement';

/**
 * Pointer travel before a press becomes a drag (px)
 *
 * @constant {Number}
 */
const DRAG_THRESHOLD = 3;

/**
 * Smallest span shown (metres), and the margin around the fixtures
 *
 * @constant {Number}
 */
const MIN_SPAN = 8;
const MARGIN = 2;

/**
 * Grid step a dragged fixture snaps to (metres); Alt drags freely
 *
 * @constant {Number}
 */
const SNAP = 0.25;

/**
 * Radius of a fixture dot (px)
 *
 * @constant {Number}
 */
const DOT_PX = 5;

/**
 * @component StageMap The stage seen from above: a dot per fixture, with its beam's direction.
 * Click to select, drag to move the selection on a 0.25 m grid (Alt: freely).
 */
export default {
  name: 'UniverseModifierStageMap',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * Fixtures that can be selected and moved (the universe's)
     */
    fixtures: {
      type: Array,
      default: () => [],
    },
    /**
     * Other fixtures, drawn faint
     */
    others: {
      type: Array,
      default: () => [],
    },
    /**
     * Selected fixture ids
     */
    selection: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['selection', 'drag-start', 'drag', 'drag-end'],
  data() {
    return {
      /**
       * Element size (px), null until measured
       */
      size: null,
      /**
       * Running drag, or null
       */
      drag: null,
      /**
       * Area frozen while dragging, so the map doesn't rescale under the pointer
       */
      frozen: null,
    };
  },
  computed: {
    /**
     * Shown area in metres, fitted to the fixtures and to the element's shape
     *
     * @type {Object} `{ minX, minY, width, height }`
     */
    area() {
      if (this.frozen) return this.frozen;
      const all = [...this.fixtures, ...this.others].map((f) => f.position);
      const xs = all.map((p) => p.x).concat([0]);
      const ys = all.map((p) => p.y).concat([0]);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      let width = Math.max(MIN_SPAN, Math.max(...xs) - Math.min(...xs) + 2 * MARGIN);
      let height = Math.max(MIN_SPAN, Math.max(...ys) - Math.min(...ys) + 2 * MARGIN);
      const { width: w = 1, height: h = 1 } = this.size || {};
      const aspect = w / Math.max(1, h);
      if (width / height < aspect) width = height * aspect;
      else height = width / aspect;
      return {
        minX: cx - width / 2, minY: cy - height / 2, width, height,
      };
    },
    /**
     * SVG view box (the plane is flipped, so Y runs from -maxY)
     *
     * @type {String}
     */
    viewBox() {
      const a = this.area;
      return `${a.minX} ${-(a.minY + a.height)} ${a.width} ${a.height}`;
    },
    /**
     * Metres per pixel
     *
     * @type {Number}
     */
    metresPerPixel() {
      return this.area.width / Math.max(1, this.size ? this.size.width : 1);
    },
    /**
     * Dot radius (metres)
     *
     * @type {Number}
     */
    dotRadius() {
      return DOT_PX * this.metresPerPixel;
    },
    /**
     * Grid lines every metre (every 5 m on a large stage); the centre lines stand out
     *
     * @type {Array<Object>}
     */
    gridLines() {
      const a = this.area;
      const step = a.width > 40 ? 5 : 1;
      const lines = [];
      const maxX = a.minX + a.width;
      const maxY = a.minY + a.height;
      for (let x = Math.ceil(a.minX / step) * step; x <= maxX; x += step) {
        lines.push({
          key: `x${x}`, axis: x === 0, x1: x, x2: x, y1: a.minY, y2: maxY,
        });
      }
      for (let y = Math.ceil(a.minY / step) * step; y <= maxY; y += step) {
        lines.push({
          key: `y${y}`, axis: y === 0, x1: a.minX, x2: maxX, y1: y, y2: y,
        });
      }
      return lines;
    },
    /**
     * The universe's fixtures as dots, the selected ones last (on top)
     *
     * @type {Array<Object>}
     */
    dots() {
      return this.fixtures.map((fixture) => {
        const beam = beamOnFloor(fixture.rotation);
        return {
          id: fixture.id,
          name: fixture.name,
          x: fixture.position.x,
          y: fixture.position.y,
          beam: Math.hypot(beam.x, beam.y) > 0.05 ? beam : null,
          selected: this.selection.includes(fixture.id),
        };
      }).sort((a, b) => Number(a.selected) - Number(b.selected));
    },
    /**
     * Other universes' fixtures as dots
     *
     * @type {Array<Object>}
     */
    otherDots() {
      return this.others.map((fixture) => ({
        id: fixture.id, x: fixture.position.x, y: fixture.position.y,
      }));
    },
  },
  mounted() {
    this.observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      const same = this.size && this.size.width === width && this.size.height === height;
      if (width && height && !same) this.size = { width, height };
    });
    this.observer.observe(this.$refs.root);
  },
  beforeUnmount() {
    this.observer.disconnect();
    this.stopListening();
  },
  methods: {
    /**
     * Stage point (metres) under the pointer
     *
     * @public
     * @param {PointerEvent} e
     * @returns {Object} `{ x, y }`
     */
    pointAt(e) {
      const point = this.$refs.svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const { x, y } = point.matrixTransform(this.$refs.plane.getScreenCTM().inverse());
      return { x, y };
    },
    /**
     * Press on a fixture: selects it (Ctrl/⌘ or Shift adds or removes), then drags the selection
     *
     * @public
     * @param {PointerEvent} e
     * @param {String} id
     */
    press(e, id) {
      if (e.button !== 0) return;
      e.preventDefault();
      const toggle = e.ctrlKey || e.metaKey || e.shiftKey;
      let ids = this.selection;
      if (toggle) {
        ids = ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id];
      } else if (!ids.includes(id)) {
        ids = [id];
      }
      if (ids !== this.selection) this.$emit('selection', ids);
      if (!ids.includes(id)) return;
      const fixture = this.fixtures.find((f) => f.id === id);
      this.drag = {
        x: e.clientX,
        y: e.clientY,
        start: this.pointAt(e),
        origin: { x: fixture.position.x, y: fixture.position.y },
        moved: false,
      };
      window.addEventListener('pointermove', this.dragTo);
      window.addEventListener('pointerup', this.drop);
    },
    /**
     * Moves the selection with the pointer: the pressed fixture lands on the grid
     *
     * @public
     * @param {PointerEvent} e pointermove event
     */
    dragTo(e) {
      if (!this.drag) return;
      if (!this.drag.moved) {
        if (Math.hypot(e.clientX - this.drag.x, e.clientY - this.drag.y) < DRAG_THRESHOLD) return;
        this.frozen = this.area;
        this.drag.moved = true;
        this.$emit('drag-start');
      }
      const point = this.pointAt(e);
      const snap = (v) => (e.altKey ? Math.round(v * 100) / 100 : Math.round(v / SNAP) * SNAP);
      const { origin, start } = this.drag;
      this.$emit('drag', {
        x: snap(origin.x + point.x - start.x) - origin.x,
        y: snap(origin.y + point.y - start.y) - origin.y,
      });
    },
    /**
     * Ends a drag
     *
     * @public
     */
    drop() {
      if (this.drag && this.drag.moved) this.$emit('drag-end');
      this.drag = null;
      this.frozen = null;
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
  },
};
</script>

<style scoped>
/* The pan/tilt grid's look: a dark well with light centre lines */
.stage_map {
  min-width: 0;
  min-height: 0;
  background-color: var(--primary-dark-alt);
  user-select: none;
  overflow: hidden;
}
.stage_map_svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.stage_map_line {
  stroke: var(--primary-dark);
  stroke-width: 1px;
  vector-effect: non-scaling-stroke;
}
.stage_map_line.axis {
  stroke: var(--secondary-light);
}
.stage_map_dot {
  fill: var(--secondary-light-alt);
}
.stage_map_dot.other {
  fill: var(--primary-lighter);
}
.stage_map_beam {
  stroke: var(--secondary-light-alt);
  stroke-linecap: round;
  opacity: 0.6;
}
.stage_map_fixture {
  cursor: pointer;
}
.stage_map_fixture.selected .stage_map_dot {
  fill: var(--accent-blue);
}
.stage_map_fixture.selected .stage_map_beam {
  stroke: var(--accent-blue);
}
.dragging,
.dragging .stage_map_fixture {
  cursor: grabbing;
}
.stage_map_side {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: Roboto-Regular;
  font-size: var(--font-xs);
  color: var(--secondary-light-alt);
  pointer-events: none;
}
.stage_map_side.back {
  top: var(--space-1);
}
.stage_map_side.audience {
  bottom: var(--space-1);
}
</style>
