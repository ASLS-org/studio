<template>
  <uk-widget
    :disabled="!pool || !pool.cues.length"
    class="widget_pool_timeline"
    :header="header"
  >
    <uk-flex
      col
      class="widget_pool_timeline_grid_wrapper"
    >
      <div class="widget_pool_timeline_fold_btn">
        <uk-button
          v-model="folded"
          style="width: 100%; height: 100%"
          square
          color="var(--accent-blue)"
          toggleable
          label="fold cues"
          icon="hide"
        />
      </div>
      <uk-flex
        ref="scrollable"
        class="widget_pool_timeline_grid_wrapper"
      >
        <uk-flex
          col
          class="widget_pool_timeline_items"
        >
          <!-- The lanes under their family's head, as in the cue pool -->
          <template
            v-for="section in sections"
            :key="section.key"
          >
            <!-- A click folds or unfolds the family's lanes -->
            <div
              v-show="sectionShown(section)"
              class="widget_pool_timeline_family"
              :class="`timeline_family_${section.key}`"
              :style="{ '--family': section.color }"
              :title="familyFolded[section.key] ? `Show ${section.label}` : `Fold ${section.label}`"
              @click="toggleFamily(section)"
            >
              <span
                class="widget_pool_timeline_family_arrow"
                :class="[masks.arrow, { open: !familyFolded[section.key] }]"
              />
              <span
                class="widget_pool_timeline_family_icon"
                :class="section.mask"
              />
              <h4 class="widget_pool_timeline_family_label">
                {{ section.label }}
              </h4>
              <p
                v-if="holderNames[section.key]"
                class="widget_pool_timeline_family_now"
                :title="`Now: ${holderNames[section.key]}`"
              >
                {{ holderNames[section.key] }}
              </p>
            </div>
            <!-- The lane's cue, as the cue pool's row shows it -->
            <div
              v-for="lane in section.lanes"
              v-show="laneShown(section, lane)"
              :key="lane.index"
              :ref="`cue-${lane.index}`"
              class="widget_pool_timeline_item"
              :style="{ '--family': section.color }"
            >
              <uk-cue-picture :picture="contentOf(lane.pool.cue).picture" />
              <span class="widget_pool_timeline_item_label">
                <span class="widget_pool_timeline_item_title">
                  <span
                    class="widget_pool_timeline_item_type"
                    :class="masks[lane.pool.cue.type ? 'waveform' : 'mixer']"
                  />
                  <h4 class="widget_pool_timeline_item_text">
                    {{ lane.pool.name }}
                  </h4>
                </span>
                <p class="widget_pool_timeline_item_value">
                  {{ contentOf(lane.pool.cue).summary }}
                </p>
              </span>
            </div>
          </template>
        </uk-flex>
        <div class="widget_pool_timeline_duration_floater">
          <div
            class="widget_pool_timeline_duration_overflow_overlay"
            :style="computeDurationOverflowOverlayStyle()"
          />
          <div
            ref="cursor"
            class="widget_pool_timeline_cursor"
            :style="computeCursorStyle()"
            @mousedown="startDragCursor"
          />
        </div>
        <uk-flex
          style="height: fit-content; min-height: 100%"
          col
        >
          <uk-flex
            class="widget_pool_timeline_grid_label_wrapper"
            :style="computeRowStyle()"
            @dblclick="resetZoom"
            @mousedown="startZoom"
          >
            <div
              class="widget_pool_timeline_grid_label"
              :style="computeRowStyle()"
              @dblclick="resetZoom"
              @mousedown="startZoom"
            />
            <div
              v-for="bar in pool.actualDuration * 4"
              :key="bar"
              :style="{ left: `${cellWidth * 16 * (bar - 1)}px` }"
              class="widget_pool_timeline_grid_label_bar"
            >
              {{ Math.ceil((bar) / 4) }}.{{ (bar - 1) % 4 }}
            </div>
          </uk-flex>
          <uk-flex
            ref="grid"
            col
            style="flex: 1"
          >
            <template
              v-for="section in sections"
              :key="section.key"
            >
              <!-- Who holds the family over time, by the playback rules -->
              <div
                v-show="sectionShown(section)"
                class="widget_pool_timeline_family_row"
                :style="[computeRowStyle(), { '--family': section.color }]"
              >
                <div
                  v-for="(stretch, i) in holdersOf(section)"
                  :key="i"
                  class="widget_pool_timeline_holder"
                  :style="computeStretchStyle(stretch)"
                  :title="`${section.label}: ${stretch.cue.name}`"
                >
                  <uk-cue-picture
                    small
                    :picture="contentOf(stretch.cue).picture"
                  />
                  <p class="widget_pool_timeline_holder_name">
                    {{ stretch.cue.name }}
                  </p>
                </div>
              </div>
              <uk-flex
                v-for="lane in section.lanes"
                v-show="laneShown(section, lane)"
                :key="lane.index"
                :style="[computeRowStyle(), { '--family': section.color }]"
                class="widget_pool_timeline_grid_row"
                @dblclick="(e) => addCueItem(e, lane.pool)"
              >
                <div
                  :key="renderKey"
                  class="widget_pool_timeline_grid_row_sub"
                  style="width: 100%; position: relative; min-height: 1%"
                  :style="{
                    backgroundSize: `${cellWidth*16}px`
                  }"
                >
                  <div
                    v-for="(cueItem, itemIndex) in lane.pool.items"
                    :key="itemIndex"
                    :ref="`cue-${lane.index}-${itemIndex}`"
                    class="widget_pool_timeline_item_cue"
                    :style="computeCueStyle(cueItem)"
                    :title="itemTitle(cueItem)"
                    @dblclick.stop
                  >
                    <div
                      class="widget_pool_timeline_item_cue_body"
                      @contextmenu.prevent="deleteCueItem(lane.pool, cueItem)"
                      @mousedown="(e) => startDragCue(
                        e,
                        `cue-${lane.index}-${itemIndex}`,
                        cueItem, lane.pool.items
                      )"
                    >
                      <svg
                        class="widget_pool_timeline_item_cue_body_curve"
                        width="100%"
                        height="100%"
                        :viewBox="curveViewBox(cueItem)"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path :d="computeCueItemCurve(cueItem)" />
                      </svg>

                      <uk-cue-picture
                        class="widget_pool_timeline_item_cue_picture"
                        :picture="contentOf(lane.pool.cue).picture"
                      />
                      <h4 class="widget_pool_timeline_item_cue_text">
                        {{ cueItem.name }}
                      </h4>
                    </div>
                    <!-- Stretches off stage: covered (striped), turned off (dimmed) -->
                    <span
                      v-for="(stretch, i) in coveredOf(cueItem)"
                      :key="`c${i}`"
                      class="widget_pool_timeline_item_covered"
                      :style="computeStretchStyle(stretch, cueItem)"
                    />
                    <span
                      v-if="offOf(cueItem) !== null"
                      class="widget_pool_timeline_item_off"
                      :style="computeStretchStyle({
                        from: offOf(cueItem), to: cueItem.tick + cueItem.length,
                      }, cueItem)"
                    />
                    <div
                      class="widget_pool_timeline_item_cue_resize"
                      @mousedown="(e) => startResizeCue(
                        e,
                        `cue-${lane.index}-${itemIndex}`,
                        cueItem,
                        lane.pool.items
                      )"
                    />
                  </div>
                </div>
              </uk-flex>
            </template>
          </uk-flex>
        </uk-flex>
      </uk-flex>
    </uk-flex>
  </uk-widget>
</template>

<script>
import { nextTick } from 'vue';
import LiveMixin from '@/views/mixins/live.mixin';
import {
  FAMILY_KEYS, familyIndex,
} from '@/models/DMX/families';
import { FAMILY_LOOKS } from '@/views/utils/cue.families';
import { holderName } from '@/views/utils/cue.now';
import chaseOutcome from '@/views/utils/chase.outcome';
import { sharedContent } from '@/views/utils/cue.previews';
import { maskClass } from '@/views/components/uikit/icons/icon.mask';

/**
 * The lanes' family sections, in the cue pool's order, each with its accent: its items, holders
 * and lane edges are tinted with it, so families read apart
 *
 * @constant {Array<Object>} SECTIONS
 */
const SECTIONS = FAMILY_KEYS.map((key) => ({
  key,
  family: familyIndex(key),
  label: FAMILY_LOOKS[key].label,
  mask: maskClass(FAMILY_LOOKS[key].icon),
  color: `var(${FAMILY_LOOKS[key].token})`,
}));

/**
 * Icons drawn as masks, as classes (a component per lane and item slows the panel down, a style
 * object is set again on every render)
 *
 * @constant {Object} MASKS
 */
/** The height of an item's fade curve in svg units, stretched to the lane */
const CURVE_HEIGHT = 100;
const MASKS = {
  arrow: maskClass('arrow_down'), mixer: maskClass('mixer'), waveform: maskClass('waveform'),
};

/**
 * @component ChaseModifierWidgetpoolTimeline A chase's items over time, one lane per cue grouped
 * under the cue pool's family heads. Each family head draws who holds the family when, by the
 * playback rules; an item's covered stretches are striped and its stretch after a Replace item
 * turns it off is dimmed. Items are added with a double-click, dragged, resized, deleted with a
 * right-click
 */
export default {
  name: 'ChaseModifierWidgetpoolTimeline',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [LiveMixin],
  props: {
    /**
     * Handle to chase pool. Required: almost every render path (grid width,
     * bar labels, cursor position...) dereferences `pool` directly, so a
     * null pool would throw well before `uk-widget`'s disabled state could
     * protect anything.
     */
    pool: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      /**
       * Bumped to force a full remount of the grid rows (see forceReRender).
       */
      renderKey: 0,
      /**
       * Widget header data
       */
      header: {
        title: 'Timeline',
      },
      /**
       * Zooming amount
       */
      zoom: 0,
      /**
       * Fold cues flag (only display rows containing cue items)
       */
      folded: false,
      /**
       * Holds reference to cue item movement / zoom drag start position
       */
      moveStart: 0,
      /**
       * Holds reference to zoom start position
       */
      zoomStart: 0,
      /**
       * Width of a cell. Will be recomputed depending on chase duration and zoom amount
       */
      cellWidth: 10,
      /**
       * Reference to timeline container width.
       * Will be recomputed depending on chase duration and zoom amount
       */
      containerWidth: 0,
      /**
       * Scroll offset captured when the playhead cursor drag starts.
       */
      deltaCursor: 0,
      /**
       * Cleanup callbacks for any in-progress window-level drag session
       * (cue drag/resize, cursor drag, zoom). Drained on unmount so we
       * never leak listeners if the component is destroyed mid-drag.
       */
      activeSessions: [],
      /**
       * Families whose lanes are folded, by section key (this widget, this session)
       */
      familyFolded: {},
      /**
       * Icons drawn as masks, as classes
       */
      masks: MASKS,
    };
  },
  computed: {
    /**
     * The family sections and their lanes (each with its index in the chase's cue list, which
     * the item refs use), lanes in cue id order
     *
     * @type {Array<Object>}
     */
    sections() {
      const lanes = this.pool.cues.map((cueItemPool, index) => ({ pool: cueItemPool, index }));
      return SECTIONS.map((section) => ({
        ...section,
        lanes: lanes
          .filter((lane) => lane.pool.cue.family === section.key)
          .sort((a, b) => a.pool.cue.id - b.pool.cue.id),
      }));
    },
    /**
     * What the items do to the stage: holders per family, covered and turned-off stretches per
     * item (recomputed on edits)
     *
     * @type {Object}
     */
    outcome() {
      return chaseOutcome(this.pool, this.pool.duration * this.pool.barSubDiv);
    },
    /**
     * Each cue's picture and value line, by cue id, as the cue pool shows them (recomputed on
     * edits)
     *
     * @type {Object}
     */
    contentById() {
      const byId = {};
      this.pool.cues.forEach(({ cue }) => {
        const { previews, summary } = sharedContent(cue);
        const family = familyIndex(cue.family);
        byId[cue.id] = {
          picture: previews.find((p) => p.family === family) || previews[0] || null,
          summary,
        };
      });
      return byId;
    },
    /**
     * Who holds each family in the group now, by section key (read with the live ticker)
     *
     * @type {Object}
     */
    holderNames() {
      this.live(null);
      const lane = this.pool.cues.find((cueItemPool) => cueItemPool.cue.stage);
      const stage = lane ? lane.cue.stage : null;
      const names = {};
      SECTIONS.forEach((section) => {
        const holder = stage ? stage[section.family][0] : null;
        names[section.key] = holder ? holderName(holder) : '';
      });
      return names;
    },
  },
  watch: {
    'pool.duration': function poolDurationWatcher() {
      this.resetZoom();
      this.computeRowStyle();
    },
    'pool.actualDuration': function poolActualDurationWatcher() {
      this.resetZoom();
      this.computeRowStyle();
    },
    pool() {
      this.forceReRender();
      this.$refs.scrollable.$el.scroll(0, 0);
    },
    folded() {
      this.forceReRender();
      this.$refs.scrollable.$el.scroll(0, 0);
    },
  },
  mounted() {
    this.zoom = 0;
    this.computeRowStyle();
    window.addEventListener('resize', this.handleWindowResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
    // Drain any drag/zoom session still in flight so its window listeners
    // don't outlive this component.
    this.activeSessions.slice().forEach((cleanup) => cleanup());
  },
  methods: {
    /**
     * Whether a family section shows: it has lanes, with items when folded
     *
     * @public
     * @param {Object} section
     * @returns {Boolean}
     */
    sectionShown(section) {
      if (!section.lanes.length) return false;
      return !this.folded || section.lanes.some((lane) => lane.pool.items.length);
    },
    /**
     * Whether a lane shows: its family unfolded, and with items when Fold Cues is on
     *
     * @public
     * @param {Object} section
     * @param {Object} lane
     * @returns {Boolean}
     */
    laneShown(section, lane) {
      return !this.familyFolded[section.key] && (!this.folded || lane.pool.items.length > 0);
    },
    /**
     * Folds or unfolds a family's lanes
     *
     * @public
     * @param {Object} section
     */
    toggleFamily(section) {
      this.familyFolded = { ...this.familyFolded, [section.key]: !this.familyFolded[section.key] };
    },
    /**
     * A cue's picture and value line
     *
     * @public
     * @param {Object} cue
     * @returns {Object}
     */
    contentOf(cue) {
      return this.contentById[cue.id] || { picture: null, summary: '' };
    },
    /**
     * Holders' stretches of a section's family
     *
     * @public
     * @param {Object} section
     * @returns {Array<Object>}
     */
    holdersOf(section) {
      return this.outcome.families[section.family];
    },
    /**
     * An item's covered stretches
     *
     * @public
     * @param {Object} cueItem
     * @returns {Array<Object>}
     */
    coveredOf(cueItem) {
      const result = this.outcome.items.get(cueItem);
      return result ? result.covered : [];
    },
    /**
     * Where a Replace item turns an item off (in ticks), null when it plays to its end
     *
     * @public
     * @param {Object} cueItem
     * @returns {?Number}
     */
    offOf(cueItem) {
      const result = this.outcome.items.get(cueItem);
      return result ? result.offAt : null;
    },
    /**
     * Position and width of a stretch (ticks): on the timeline, or inside an item; a holder's in
     * its cue's colour
     *
     * @public
     * @param {Object} stretch `{ from, to, cue? }`
     * @param {?Object} [cueItem] the item it is drawn in
     * @returns {Object} css
     */
    computeStretchStyle(stretch, cueItem = null) {
      const origin = cueItem ? cueItem.tick : 0;
      const style = {
        left: `${(stretch.from - origin) * this.cellWidth}px`,
        width: `${(stretch.to - stretch.from) * this.cellWidth}px`,
      };
      return style;
    },
    /**
     * A time in ticks as the timeline's labels write it (bar.quarter)
     *
     * @public
     * @param {Number} tick
     * @returns {String}
     */
    barLabel(tick) {
      const sub = this.pool.barSubDiv;
      return `${Math.floor(tick / sub) + 1}.${Math.floor((tick % sub) / (sub / 4))}`;
    },
    /**
     * An item's tooltip: its cue's Mode, what covers it or turns it off, from when
     *
     * @public
     * @param {Object} cueItem
     * @returns {String}
     */
    itemTitle(cueItem) {
      const cue = cueItem.handle;
      const lines = [`${cue.name} · ${cue.relative ? 'Layer' : 'Replace'}`];
      const result = this.outcome.items.get(cueItem);
      if (result) {
        result.covered.forEach((stretch) => {
          lines.push(`Covered by ${stretch.by} from ${this.barLabel(stretch.from)} to ${this.barLabel(stretch.to)}`);
        });
        if (result.offAt !== null) {
          lines.push(`Turned off by ${result.offBy} at ${this.barLabel(result.offAt)}`);
        }
      }
      lines.push('(in this chase)');
      return lines.join('\n');
    },
    /**
     * Window resize handler (kept as a bound method so it can be removed
     * again in beforeUnmount - an inline arrow function couldn't be).
     *
     * @public
     */
    handleWindowResize() {
      this.resetZoom();
      this.computeRowStyle();
    },
    /**
     * Starts a window-level mousemove/mouseup pointer session and takes care
     * of removing both listeners on mouseup (or on component teardown).
     * Centralises the add/remove-listener bookkeeping that used to be
     * duplicated - and partly broken - across every drag/resize/zoom handler.
     *
     * @public
     * @param {Function} onMove called with the mousemove event
     * @param {Function} [onEnd] optional, called with the mouseup event
     * @returns {Function} cleanup function, in case the caller needs to
     *  cancel the session early
     */
    beginPointerSession(onMove, onEnd) {
      const move = (e) => onMove(e);
      // `up` and `cleanup` refer to each other: declare both before either runs
      const listeners = {};
      const cleanup = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', listeners.up);
        const idx = this.activeSessions.indexOf(cleanup);
        if (idx !== -1) this.activeSessions.splice(idx, 1);
      };
      listeners.up = (e) => {
        cleanup();
        if (onEnd) onEnd(e);
      };
      const { up } = listeners;
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      this.activeSessions.push(cleanup);
      return cleanup;
    },
    /**
     * Computes a cue item's position, width and color
     *
     * @public
     * @param {Object} cue handle to cue item
     * @returns {Object} css left position, width and background color
     */
    computeCueStyle(cue) {
      return {
        left: `${cue.tick * this.cellWidth}px`,
        width: `${cue.length * this.cellWidth - 1}px`,
      };
    },
    /**
     * Computes row width and cell grid size based on duration and zoom amount
     *
     * @public
     * @returns {Object} css background size and width
     */
    computeRowStyle() {
      let minCellWidth = 10;
      const cellWidth = minCellWidth + this.zoom * minCellWidth;
      let containerWidth = cellWidth * this.pool.barSubDiv * this.pool.actualDuration;
      if (this.$el && containerWidth < this.$el.offsetWidth) {
        minCellWidth = this.$el.offsetWidth / (this.pool.barSubDiv * this.pool.actualDuration);
      }
      this.cellWidth = Math.round(Math.max(cellWidth, minCellWidth));
      containerWidth = this.cellWidth * this.pool.barSubDiv * this.pool.actualDuration;
      this.containerWidth = containerWidth;
      return {
        backgroundSize: `${this.cellWidth}px`,
        width: `${this.containerWidth}px`,
      };
    },
    /**
     * An item's curve area: its width in pixels, CURVE_HEIGHT units high
     *
     * @public
     * @param {Object} cueItem
     * @returns {String}
     */
    curveViewBox(cueItem) {
      return `0 0 ${this.cellWidth * cueItem.length || 1} ${CURVE_HEIGHT}`;
    },
    /**
     * Computes cue item curve as svg path data: x in item pixels, y over CURVE_HEIGHT units that
     * the svg stretches to the lane (no measuring, so it draws on the first render)
     *
     * @public
     * @param {Object} cueItem
     * @returns {String|null}
     */
    computeCueItemCurve(cueItem) {
      const cue = cueItem.handle;
      const width = this.cellWidth * cueItem.length;
      const h = CURVE_HEIGHT;
      const { lengthMS } = cueItem;
      if (!cue || !cue.fadeIn || !(lengthMS > 0) || !(width > 0)) return null;

      // The fades as playback plays them (shrunk to fit a short item), in item pixels: the Fade
      // In curve from the bottom, a flat hold at the top, the Fade Out curve down to the end
      const { fadeIn, fadeOut } = cue.itemFades(lengthMS);
      const inW = (fadeIn / lengthMS) * width;
      const outW = (fadeOut / lengthMS) * width;
      const outX = width - outW;
      const [i1, i2] = cue.fadeIn.controlPoints;
      const [o1, o2] = cue.fadeOut.controlPoints;
      const n = (v) => Number(v.toFixed(2));
      let d = inW > 0
        ? `M 0,${h} C ${n(i1.x * inW)} ${n((1 - i1.y) * h)}, ${n(i2.x * inW)} ${n((1 - i2.y) * h)}, ${n(inW)} 0`
        : `M 0,${h} L 0,0`;
      d += ` L ${n(outX)},0`;
      d += outW > 0
        ? ` C ${n(outX + o1.x * outW)} ${n(o1.y * h)}, ${n(outX + o2.x * outW)} ${n(o2.y * h)}, ${n(width)} ${h}`
        : ` L ${n(width)},0 L ${n(width)},${h}`;
      return `${d} Z`;
    },

    /**
     * Computes timeline's cursor position
     *
     * @public
     * @returns {Object} css left position styling
     */
    computeCursorStyle() {
      return {
        left: `${this.live(this.pool.elapsedPerc) * (this.pool.duration * this.cellWidth * this.pool.barSubDiv)}px`,
      };
    },
    /**
     * Computes duration overflow overlay width and position
     *
     * @public
     */
    computeDurationOverflowOverlayStyle() {
      return {
        left: `${this.cellWidth * 16 * (this.pool.duration * 4)}px`,
        width: `${this.cellWidth * 16 * (this.pool.actualDuration - this.pool.duration) * 4}px`,
      };
    },
    /**
     * Resets timeline zoom value to zero
     *
     * @public
     */
    resetZoom() {
      this.zoom = 0;
      this.forceReRender();
    },
    /**
     * Initiates zooming procedure
     *
     * @public
     * @param {Object} e mousedown event
     */
    startZoom(e) {
      this.$utils.setCapture(e.currentTarget, 'row-resize');
      this.moveStart = e.clientY;
      this.zoomStart = this.zoom;
      this.beginPointerSession((moveEvent) => this.handleZoom(moveEvent));
    },
    /**
     * Handles zooming procedure
     *
     * @public
     * @param {Object} e mousemove event
     */
    handleZoom(e) {
      this.zoom = Math.max(
        this.zoomStart + (this.moveStart - e.clientY) / this.$el.clientHeight,
        0,
      );
    },
    /**
     * Deletes a cue item from the selected chase's cue item pool
     *
     * @public
     * @param {Object} cueItemPool handle to cue item pool
     * @param {Object} cueItem handle to cue item to be deleted
     */
    deleteCueItem(cueItemPool, cueItem) {
      cueItemPool.delete(cueItem);
    },
    /**
     * Adds a cue item to the selected chase's cue item pool
     *
     * @public
     * @param {Object} e click event
     * @param {Object} cueItemPool handle to cue item pool
     */
    addCueItem(e, cueItemPool) {
      const gridEl = this.$refs.grid.$el;
      const gridElBox = gridEl.getBoundingClientRect();
      const leftOffset = gridEl.scrollLeft - gridElBox.left;
      const tick = Math.floor((e.clientX + leftOffset) / this.cellWidth);
      // An effect's item lasts its Duration; a scene's fits its fades (a bar at least)
      const { cue } = cueItemPool;
      const bars = cue.type === 0
        ? Math.max(1, Math.ceil(cue.fadeIn.duration + cue.fadeOut.duration))
        : cue.duration;
      const requestedDuration = bars * this.pool.barSubDiv;
      const tickDuration = this.computeAvailableLength(tick, requestedDuration, cueItemPool.items);
      cueItemPool.addRaw({
        tickStart: tick,
        tickDuration,
        subDiv: this.pool.barSubDiv,
      });
    },
    /**
     * Cue resizing procedure initialisation
     *
     * @public
     * @param {Object} e mousedown event
     * @param {String} ref cue reference string
     * @param {Object} handle handle to cue instance to be resized
     * @param {Array} neighbours list of cue items adjacent to the cue item being resized
     */
    startResizeCue(e, ref, handle, neighbours) {
      const cueEl = this.$refs[ref] && this.$refs[ref][0];
      if (!cueEl) return;
      this.$utils.setCapture(e.currentTarget, 'col-resize');
      const ctx = {
        moveStart: e.clientX - cueEl.getBoundingClientRect().width,
        snapWidth: this.cellWidth,
        cue: handle,
        neighbours,
      };
      this.beginPointerSession((moveEvent) => this.resizeCue(moveEvent, ctx));
    },
    /**
     * Cue resizing procedure
     *
     * @public
     * @param {Object} e mousemove event
     * @param {Object} ctx context object holding references necessary for resize operation
     */
    resizeCue(e, ctx) {
      const moveOffset = e.clientX - ctx.moveStart;
      const requestedLength = Math.floor(moveOffset / ctx.snapWidth);
      // NB: computeCueResizeCollision can legitimately return 0 (no room at
      // all) - don't `|| requestedLength` that away, it would let the cue
      // overlap its neighbour.
      ctx.cue.length = Math.max(
        this.computeCueResizeCollision(requestedLength, ctx.cue, ctx.neighbours),
        0,
      );
    },
    /**
     * Cue dragging procedure initialisation
     *
     * @public
     * @param {Object} e mousedown event
     * @param {String} ref cue reference string
     * @param {Object} handle handle to cue instance to be resized
     * @param {Array} neighbours list of cue items adjacent to the cue item being dragged
     */
    startDragCue(e, ref, handle, neighbours) {
      // TODO: find a way to successfully use setCapture with right click enabled
      // this.$utils.setCapture(e.currentTarget, "grab");
      const cueEl = this.$refs[ref] && this.$refs[ref][0];
      if (!cueEl) return;
      const ctx = {
        startX: e.clientX - cueEl.offsetLeft,
        snapWidth: this.cellWidth,
        cue: handle,
        neighbours,
      };
      this.beginPointerSession((moveEvent) => this.dragCue(moveEvent, ctx));
    },
    /**
     * Cue dragging procedure
     *
     * @public
     * @param {Object} e mousemove event
     * @param {Object} ctx context object holding references necessary for drag operation
     */
    dragCue(e, ctx) {
      const moveOffset = e.clientX - ctx.startX;
      const requestedTick = Math.floor(moveOffset / ctx.snapWidth);
      // Collision resolution only needs to run once per move event - the
      // previous version ran it twice and, since 0 is a valid resolved
      // tick, `|| tick` could silently discard a correct collision result.
      const resolvedTick = this.computeCuePositionCollision(
        requestedTick,
        ctx.cue.length,
        ctx.cue,
        ctx.neighbours,
      );
      ctx.cue.tick = Math.max(resolvedTick, 0);
    },
    /**
     * Cursor dragging procedure initialisation
     *
     * @public
     */
    startDragCursor() {
      const { scrollLeft } = this.$refs.scrollable.$el;
      this.deltaCursor = scrollLeft;
      this.$utils.setCapture(this.$refs.cursor, 'col-resize');
      this.beginPointerSession((moveEvent) => this.dragCursor(moveEvent));
    },
    /**
     * Cursor dragging procedure
     *
     * @public
     * @param {Object} e mousemove event
     */
    dragCursor(e) {
      const time = (e.clientX + this.deltaCursor) * (this.pool.tickDuration / this.cellWidth) - 50;
      this.pool.update(time);
    },
    /**
     * Computes a cue item's position after resolving collisions with its
     * neighbours: if the requested tick overlaps a neighbour, the cue snaps
     * to whichever free side of that neighbour is closer, then falls back to
     * "after the furthest neighbour" if that slot is itself occupied
     * (chain-collision case).
     *
     * @public
     * @param {Number} tick tick number to which the cue item should be moved
     * @param {Number} length width of the cue item being moved
     * @param {Object} cue handle to cue item instance being moved
     * @param {Array} neighbours list of cue items adjacent to the cue item being dragged
     * @returns {Number} new cue item tick value
     */
    computeCuePositionCollision(tick, length, cue, neighbours) {
      const requestedTick = Math.max(tick, 0);
      const requestedEnd = requestedTick + length;
      const others = neighbours.filter((n) => n !== cue);

      const collision = others.find(
        (n) => requestedTick < n.tick + n.length && requestedEnd > n.tick,
      );
      if (!collision) return requestedTick;

      const positionBefore = Math.max(0, collision.tick - length);
      const positionAfter = collision.tick + collision.length;
      let newPosition = Math.abs(positionBefore - requestedTick)
        <= Math.abs(positionAfter - requestedTick)
        ? positionBefore
        : positionAfter;

      const stillColliding = others.some(
        (n) => newPosition < n.tick + n.length && newPosition + length > n.tick,
      );
      if (stillColliding) {
        // Chain collision - simplest correct fallback is to place the cue
        // right after the furthest-reaching neighbour.
        newPosition = others.reduce((furthest, n) => Math.max(furthest, n.tick + n.length), 0);
      }

      return newPosition;
    },
    /**
     * Computes the maximum allowable length for a cue item during resizing
     * to avoid collisions with neighbouring items.
     *
     * @public
     * @param {Number} desiredLength width that the cue item is being resized to
     * @param {Object} cue handle to cue item instance being resized
     * @param {Array} neighbours list of cue items adjacent to the cue item being resized
     * @returns {Number} maximum allowable length for the cue item
     */
    computeCueResizeCollision(desiredLength, cue, neighbours) {
      return neighbours
        .filter((n) => n !== cue && n.tick > cue.tick)
        .reduce((maxLength, n) => Math.min(maxLength, n.tick - cue.tick), desiredLength);
    },
    /**
     * Determines the maximum allowable length for a new cue item at a
     * specific tick position without colliding with any existing cue items.
     *
     * @public
     * @param {Number} tick cue item's starting tick position
     * @param {Number} requestedLength desired cue item's length in ticks
     * @param {Array} neighbours list of existing cue items
     * @returns {Number} maximum allowable length for the new cue item
     */
    computeAvailableLength(tick, requestedLength, neighbours) {
      return neighbours
        .filter((n) => n.tick <= tick + requestedLength && tick < n.tick + n.length)
        .reduce((available, n) => {
          const availableSpace = n.tick - tick;
          return availableSpace >= 0 && availableSpace < available ? availableSpace : available;
        }, requestedLength);
    },
    /**
     * Force full component re-render (bumps renderKey to remount the grid
     * rows - used after structural changes like switching pool/folding
     * where cached $refs would otherwise go stale).
     *
     * @public
     */
    async forceReRender() {
      await nextTick();
      this.renderKey += 1;
    },
  },
};
</script>

<style scoped>
/* The grid's borders are part of the row and bar pitch the code lays out: they stay 1px,
   whatever --border-width is */
.widget_pool_timeline {
  width: 100%;
  position: relative;
}
.widget_pool_timeline_grid_wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: auto;
  background: var(--primary-light);
}
.widget_pool_timeline_grid_wrapper:nth-child(1) {
  overflow: hidden;
}
.widget_pool_timeline_items {
  display: flex;
  z-index: 10;
  background: var(--primary-light);
  min-width: 180px;
  max-width: 180px;
  flex-direction: column;
  border-right: 1px solid var(--primary-dark);
  position: sticky;
  left: 0px;
  padding-top: 25px;
  height: fit-content;
  min-height: 100%;
}
/* A lane's head: its cue as the cue pool's row shows it */
.widget_pool_timeline_item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  background: var(--primary-light);
  box-sizing: border-box;
  padding: 0 var(--space-4);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  min-width: 180px;
  max-width: 180px;
  min-height: var(--row-height-tall);
  /* Its family's accent along its left edge */
  box-shadow: inset 3px 0 0 var(--family);
  position: sticky;
  left: 0px;
  z-index: 10;
  border-right: 1px solid var(--primary-dark) !important;
  border-bottom: 1px solid var(--primary-dark) !important;
}
.widget_pool_timeline_item_label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
}
.widget_pool_timeline_item_title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}
.widget_pool_timeline_item_type {
  flex-shrink: 0;
  width: var(--icon-xs);
  height: var(--icon-xs);
  background-color: var(--secondary-lighter);
}
.widget_pool_timeline_item_text {
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: roboto-medium;
}
.widget_pool_timeline_item_value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-xs);
  color: var(--secondary-lighter);
}
.disabled h4 {
  color: var(--secondary-light);
}
.widget_pool_timeline_grid {
  position: relative;
  background: var(--primary-light);
  width: 100%;
  height: 100%;
}
.widget_pool_timeline_cursor {
  width: 2px;
  background: var(--accent-maroon);
  position: absolute;
  height: 100%;
  margin-top: 12px; /* lines the cursor up with the grid (fixed) */
  z-index: 30;
  opacity: .8;
}
.widget_pool_timeline_cursor:hover, .widget_pool_timeline_cursor:active {
  opacity: 1;
}
.widget_pool_timeline_cursor:before {
  position: absolute;
  content: "";
  box-sizing: content-box;
  width: 10px;
  height: 10px;
  background:
    linear-gradient(
      45deg,
      transparent 0%,
      transparent 50%,
      var(--accent-maroon) 50%,
      var(--accent-maroon) 100%
    );
  z-index: 10;
  transform: rotate(45deg);
  left: -5px;
  cursor: pointer;
}
.widget_pool_timeline_cursor:active:before {
  cursor: move !important;
}
.widget_pool_timeline_grid_row {
  border-bottom: 1px solid var(--primary-dark);
  background: var(--secondary-darker);
  background-image:
    linear-gradient(
      to right,
      var(--primary-dark) 0,
      var(--primary-dark) 1px,
      transparent 1px,
      transparent 100%
    ) !important;
  background-size: 10px 100%;
  background-position: 0px !important;
  min-width: 100%;
  min-height: var(--row-height-tall);
  flex: 1;
}
.widget_pool_timeline_grid_label {
  position: absolute;
  min-height: 12px !important;
  height: 12px;
  top: 12px;
  background-position: 0px !important;
  background-image:
    linear-gradient(
      to right,
      var(--secondary-dark) 0,
      var(--secondary-dark) 1px,
      transparent 1px,
      transparent 100%
    ) !important;
  z-index: 0;
}
.widget_pool_timeline_grid_row:nth-child(odd) {
  background: var(--primary-light-alt);
}
/* An item: tinted with its family's accent, its cue's picture and name over its fade curve */
.widget_pool_timeline_item_cue {
  position: absolute;
  height: 100%;
  display: flex;
  min-width: 10px;
  align-items: center;
  background: color-mix(in srgb, var(--family) 16%, var(--primary-light));
  border: 1px solid color-mix(in srgb, var(--family) 60%, var(--primary-light));
  font-family: Roboto;
  color: var(--secondary-lighter);
  cursor: pointer;
  box-sizing: border-box;
  padding-left: var(--space-3);
}
.widget_pool_timeline_item_cue:hover {
  border-color: var(--family);
}
.widget_pool_timeline_item_cue:active {
  cursor: move;
}
.widget_pool_timeline_item_cue_picture {
  position: relative;
  margin-right: var(--space-3);
}
.widget_pool_timeline_item_cue_resize {
  cursor: col-resize;
  height: 100%;
  min-height: 25px;
  width: 8px;
}
.widget_pool_timeline_item_cue_body {
  align-items: center;
  height: 100%;
  word-break: keep-all;
  overflow: hidden;
  display: flex;
  flex: 1;
}
.widget_pool_timeline_item_cue_text {
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: roboto-medium;
}
.widget_pool_timeline_grid_label_bar {
  font-family: Roboto-medium;
  color: var(--secondary-lighter);
  font-size: var(--font-sm);
  position: absolute;
  padding: var(--space-1) var(--space-4);
  height: 100%;
  border-left: 1px solid var(--secondary-light);
  z-index: -1;
  pointer-events: none;
  line-height: 5px;
  top: 5px;
  box-sizing: content-box;
}
.widget_pool_timeline_fold_btn {
  min-width: 180px;
  max-width: 180px;
  height: 25px;
  position: absolute;
  opacity: 1 !important;
  top: 0px;
  left: 0px;
  z-index: 10;
  background: var(--primary-light);
  border-bottom: 1px solid var(--primary-dark);
  border-right: 1px solid var(--primary-dark);
}
.widget_pool_timeline_grid_label_wrapper {
  position: sticky;
  top: 0px;
  z-index: 20;
  min-height: 25px;
  background-color: var(--primary-lighter-alt) !important;
  border-bottom: 1px solid var(--primary-dark);
  cursor: zoom-in;
  overflow: hidden;
}
.widget_pool_timeline_grid_label_wrapper:active {
  cursor: row-resize;
}
.widget_pool_timeline_duration_overflow_overlay:before {
  position: absolute;
  content: "";
  width: 10px;
  height: 10px;
  z-index: 10;
  transform: rotate(45deg);
  background: rgba(231, 231, 231, 0.281);
  margin-left: -6px;
  top: 2px;
  cursor: pointer;
}
.widget_pool_timeline_duration_overflow_overlay {
  height: 100%;
  background: #0c0e0a7c;
  mix-blend-mode: hard-light;
  position: absolute;
  top: 0px;
  z-index: 30;
  cursor: unset !important;
  pointer-events: none;
  border-left: 1px dashed rgba(231, 231, 231, 0.281);
}
.widget_pool_timeline_duration_floater {
  position: sticky;
  top: 0px;
  height: 100%;
  width: 100%;
  z-index: 5;
}
.widget_pool_timeline_item_cue_body_curve {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 100%;
  width: 100%;
  stroke: var(--family);
  fill: color-mix(in srgb, var(--family) 30%, transparent);
  stroke-width: 1.5px;
  stroke-opacity: .8;
}
/* Stretched to the lane: the line keeps its width */
.widget_pool_timeline_item_cue_body_curve path {
  vector-effect: non-scaling-stroke;
}
.widget_pool_timeline_grid_row_sub {
  background-image: linear-gradient(
    to right,
    var(--secondary-light) 1px,
    var(--secondary-light) 1px,
  #fff0 1px,
  #fff0 100%
  ) !important;
  background-size: 160px;
}
/* A family's head, on both sides at the same fixed height (it is part of the rows' pitch) */
.widget_pool_timeline_family {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: none;
  min-width: 180px;
  max-width: 180px;
  height: 24px;
  padding: 0 var(--space-4);
  cursor: pointer;
  box-sizing: border-box;
  background: var(--primary-dark-alt);
  border-right: 1px solid var(--primary-dark);
  border-bottom: 1px solid var(--primary-dark);
  /* Its family's accent along its left edge */
  box-shadow: inset 3px 0 0 var(--family);
  overflow: hidden;
}
.widget_pool_timeline_family:hover {
  background:
    linear-gradient(var(--secondary-darker), var(--secondary-darker)), var(--primary-dark-alt);
}
/* Points down when the family's lanes show, as an unfolded list row's arrow */
.widget_pool_timeline_family_arrow {
  flex-shrink: 0;
  width: var(--icon-xs);
  height: var(--icon-xs);
  background-color: var(--secondary-lighter);
  transform: rotate(-90deg);
  transition: transform 0.15s ease;
}
.widget_pool_timeline_family_arrow.open {
  transform: none;
}
.widget_pool_timeline_family_icon {
  flex-shrink: 0;
  width: var(--icon-xs);
  height: var(--icon-xs);
  background-color: var(--family);
}
.widget_pool_timeline_family_label {
  flex-shrink: 0;
  font-size: var(--font-xs);
  text-transform: uppercase;
  color: var(--secondary-lighter);
}
.widget_pool_timeline_family_now {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
  font-size: var(--font-xs);
  color: var(--secondary-light);
}
.widget_pool_timeline_family_row {
  position: relative;
  flex: none;
  height: 24px;
  min-width: 100%;
  box-sizing: border-box;
  background: var(--primary-dark-alt);
  border-bottom: 1px solid var(--primary-dark);
}
/* Who holds the family: a bar tinted with its accent, its cue's picture and name, inset 3px in
   the 24px head */
.widget_pool_timeline_holder {
  position: absolute;
  top: 3px;
  bottom: 3px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  box-sizing: border-box;
  padding: 0 var(--space-1);
  border: 1px solid color-mix(in srgb, var(--family) 60%, var(--primary-light));
  background: color-mix(in srgb, var(--family) 22%, var(--primary-light));
  overflow: hidden;
}
.widget_pool_timeline_holder_name {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: roboto-medium;
  font-size: var(--font-xs);
  color: var(--secondary-lighter);
}
/* An item's stretch whose families other items hold: on, but not on stage */
.widget_pool_timeline_item_covered {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--idle-stripes);
  pointer-events: none;
}
/* An item's stretch after a Replace item turned it off */
.widget_pool_timeline_item_off {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--primary-light);
  opacity: calc(1 - var(--opacity-dimmed));
  pointer-events: none;
}
</style>
