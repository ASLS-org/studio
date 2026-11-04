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
          <div
            v-for="(cueItemPool, cueIndex) in pool.cues"
            v-show="!folded || (folded && cueItemPool.items.length)"
            :key="cueIndex"
            :ref="`cue-${cueIndex}`"
            :style="{ borderColor: cueItemPool.cue.color }"
            class="widget_pool_timeline_item"
            :class="{ even: !(cueIndex % 2) }"
          >
            <uk-icon
              :name="cueItemPool.cue.type ? 'waveform' : 'mixer'"
              class="widget_pool_timeline_item_icon"
            />
            <h4 class="widget_pool_timeline_item_text">
              {{ cueItemPool.name }}
            </h4>
          </div>
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
            <uk-flex
              v-for="(cueItemPool, cueIndex) in pool.cues"
              v-show="!folded || (folded && cueItemPool.items.length)"
              :key="cueIndex"
              :style="computeRowStyle()"
              class="widget_pool_timeline_grid_row"
              @dblclick="(e) => addCueItem(e, cueItemPool)"
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
                  v-for="(cueItem, itemIndex) in cueItemPool.items"
                  :key="itemIndex"
                  :ref="`cue-${cueIndex}-${itemIndex}`"
                  class="widget_pool_timeline_item_cue"
                  :style="computeCueStyle(cueItem)"

                  @dblclick.stop
                >
                  <div
                    class="widget_pool_timeline_item_cue_body"
                    @contextmenu.prevent="deleteCueItem(cueItemPool, cueItem)"
                    @mousedown="(e) => startDragCue(
                      e,
                      `cue-${cueIndex}-${itemIndex}`,
                      cueItem, cueItemPool.items
                    )"
                  >
                    <svg
                      class="widget_pool_timeline_item_cue_body_curve"
                      width="100%"
                      height="100%"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        :d="computeCueItemCurve(cueItem, `cue-${cueIndex}`)"
                      />
                    </svg>

                    <uk-icon
                      :name="cueItemPool.cue.type ? 'waveform' : 'mixer'"
                      class="widget_pool_timeline_item_icon"
                    />
                    <h4 class="widget_pool_timeline_item_cue_text">
                      {{ cueItem.name }}
                    </h4>
                  </div>
                  <div
                    class="widget_pool_timeline_item_cue_resize"
                    @mousedown="(e) => startResizeCue(
                      e,
                      `cue-${cueIndex}-${itemIndex}`,
                      cueItem,
                      cueItemPool.items
                    )"
                  />
                </div>
              </div>
            </uk-flex>
          </uk-flex>
        </uk-flex>
      </uk-flex>
    </uk-flex>
  </uk-widget>
</template>

<script>
import { nextTick } from 'vue';
import LiveMixin from '@/views/mixins/live.mixin';

/**
 * @todo Document this
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
    };
  },
  watch: {
    '$route.params.chaseId': function forceRerender() {
      this.forceReRender();
    },
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
    this.resetZoom();
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
      const cleanup = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        const idx = this.activeSessions.indexOf(cleanup);
        if (idx !== -1) this.activeSessions.splice(idx, 1);
      };
      const up = (e) => {
        cleanup();
        if (onEnd) onEnd(e);
      };
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
        backgroundColor: cue.color,
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
     * Computes cue item curve as svg path data
     *
     * @public
     */
    computeCueItemCurve(cueItem, ref) {
      // Check both components ($refs[ref]) and their native elements ($refs[ref][0])
      const targetRef = (this.$refs[ref] && this.$refs[ref][0])
        ? this.$refs[ref][0]
        : this.$refs[ref];

      if (targetRef) {
        let { height: cueHeight } = targetRef.getBoundingClientRect();
        cueHeight -= 2; // Accounting for top/bottom borders

        const cue = cueItem.handle;
        const totalWidth = this.cellWidth * cueItem.length;

        if (cue.fadeIn && cue.fadeIn.controlPoints) {
          // Invert Y control points: (1 - controlPoint.y) * cueHeight
          const cp0x = cue.fadeIn.controlPoints[0].x * totalWidth;
          const cp0y = (1 - cue.fadeIn.controlPoints[0].y) * cueHeight;

          const cp1x = cue.fadeIn.controlPoints[1].x * totalWidth;
          const cp1y = (1 - cue.fadeIn.controlPoints[1].y) * cueHeight;

          // Path Breakdown:
          // 1. M 0,${cueHeight} -> Move to bottom-left corner
          // 2. C ... ${totalWidth},0 -> Curve up to top-right corner
          // 3. L ${totalWidth},${cueHeight} -> Line straight down to bottom-right corner
          // 4. Z -> Close path back to bottom-left corner to form a filled shape
          return `M 0,${cueHeight} C ${cp0x} ${cp0y}, ${cp1x} ${cp1y}, ${totalWidth} 0 L ${totalWidth},${cueHeight} Z`;
        }
      }
      return null;
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
      const requestedDuration = cueItemPool.cue.duration * this.pool.barSubDiv;
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
  min-width: 130px;
  max-width: 130px;
  flex-direction: column;
  border-right: 1px solid var(--primary-dark);
  position: sticky;
  left: 0px;
  padding-top: 25px;
  height: fit-content;
  min-height: 100%;
}
.widget_pool_timeline_item {
  display: flex;
  align-items: center;
  flex: 1;
  background: var(--primary-light);
  box-sizing: border-box;
  padding: 0 8px;
  text-overflow: ellipsis;
  border-left: 3px solid blueviolet;
  white-space: nowrap;
  overflow: hidden;
  min-width: 130px;
  max-width: 130px;
  min-height: 32px;
  position: sticky;
  left: 0px;
  z-index: 10;
  border-right: 1px solid var(--primary-dark) !important;
  border-bottom: 1px solid var(--primary-dark) !important;
}
.disabled .widget_pool_timeline_item {
  border-left-color: var(--secondary-light);
}
.widget_pool_timeline_item_text {
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: roboto-medium;
}
.widget_pool_timeline_item_icon {
  fill: var(--secondary-lighter);
  margin-right: 8px;
  min-width: 16px;
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
  margin-top: 12px;
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
  min-height: 32px;
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
.widget_pool_timeline_item_cue {
  position: absolute;
  height: 100%;
  display: flex;
  min-width: 10px;
  align-items: center;
  background: blueviolet;
  border: 1px solid var(--secondary-light);
  font-family: Roboto;
  color: var(--primary-light);
  cursor: pointer;
  box-sizing: border-box;
  padding-left: 5px;
  opacity: 0.75;
}
.widget_pool_timeline_item_cue:active {
  cursor: move;
  opacity: .85;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: roboto-medium;
}
.widget_pool_timeline_grid_label_bar {
  font-family: Roboto-medium;
  color: var(--secondary-lighter);
  font-size: 12px;
  position: absolute;
  padding: 2px 8px;
  height: 100%;
  border-left: 1px solid var(--secondary-light);
  z-index: -1;
  pointer-events: none;
  line-height: 5px;
  top: 5px;
  box-sizing: content-box;
}
.widget_pool_timeline_fold_btn {
  min-width: 130px;
  max-width: 130px;
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
  stroke: var(--secondary-lighter);
  fill: var(--secondary-light);
  stroke-width: 1.5px;
  stroke-opacity: .8;
  /* transform: rotateY(180deg); */
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
</style>
