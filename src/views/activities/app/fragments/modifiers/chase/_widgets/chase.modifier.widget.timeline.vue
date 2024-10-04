<template>
  <uk-widget
    :disabled="!pool.cues.length"
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
            @mouseup="stopDragCursor"
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
            @mouseup="stopZoom"
          >
            <div
              class="widget_pool_timeline_grid_label"
              :style="computeRowStyle()"
              @dblclick="resetZoom"
              @mousedown="startZoom"
              @mouseup="stopZoom"
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
                :key="key"
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
                    @mouseup="(e) => stopDragCue(
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
                    @mouseup="(e) => stopResizeCue(
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

/**
 * @todo Document this
 */
export default {
  name: 'ChaseModifierWidgetpoolTimeline',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Handle to chase pool
     */
    pool: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      key: 0,
      /**
       * Widget header data
       */
      header: {
        title: 'Timeline',
      },
      /**
       * Zomming amount
       */
      zoom: 0,
      /**
       * Fold cues flag (only display rows containing cue items)
       */
      folded: false,
      /**
       * Holds reference to cue item movement horizontal start position
       */
      moveStart: 0,
      /**
       * Holds reference to zoom start position
       */
      zoomStart: 0,
      /**
       * Reference to the chase's ellapsed time
       */
      elapsed: this.pool.elapsedPerc,
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
       *
       */
      cueEls: [],
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
    window.addEventListener('resize', () => {
      this.resetZoom();
      this.computeRowStyle();
    });
  },
  methods: {
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
     * Computes row width and cell grid size based on duratio and zoom amount
     *
     * @public
     * @returns {Object} css background size and width
     */
    computeRowStyle() {
      let minCellWidth = 10;
      const cellWidth = minCellWidth + this.zoom * minCellWidth;
      let containerWidth = cellWidth * this.pool.barSubDiv * this.pool.actualDuration + 0;
      if (this.$el && containerWidth < this.$el.offsetWidth) {
        // eslint-disable-next-line max-len
        minCellWidth = (this.$el.offsetWidth - 0) / (this.pool.barSubDiv * this.pool.actualDuration);
      }
      this.cellWidth = Math.round(Math.max(cellWidth, minCellWidth));
      containerWidth = this.cellWidth * this.pool.barSubDiv * this.pool.actualDuration + 0;
      this.containerWidth = containerWidth;
      return {
        backgroundSize: `${this.cellWidth}px`,
        width: `${this.containerWidth}px`,
      };
    },
    /**
     * Computes timeline's row cell width styling
     *
     * @public
     */
    computeBarStyle() {
      return {
        backgroundSize: `${this.cellWidth * 16}px`,
      };
    },
    /**
     * Computes cue item curve as svg path data
     */
    computeCueItemCurve(cueItem, ref) {
      if (this.$refs[ref] && this.$refs[ref][0]) {
        let { height: cueHeight } = this.$refs[ref][0].getBoundingClientRect();
        cueHeight -= 2;
        const cue = cueItem.handle;
        if (cue.fadeIn) {
          return `M0,0 C ${cue.fadeIn.controlPoints[0].x * this.cellWidth * cueItem.length}  ${cue.fadeIn.controlPoints[0].y * cueHeight}, ${cue.fadeIn.controlPoints[1].x * this.cellWidth * cueItem.length}  ${cue.fadeIn.controlPoints[1].y * cueHeight}, ${this.cellWidth * cueItem.length} ${cueHeight} l -${this.cellWidth * cueItem.length}, 0`;
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
        left: `${this.pool.elapsedPerc * (this.pool.duration * this.cellWidth * this.pool.barSubDiv) + 0}px`,
      };
    },
    /**
     * Computes duration overflow overlay width and position
     *
     * @public
     */
    computeDurationOverflowOverlayStyle() {
      return {
        left: `${this.cellWidth * 16 * (this.pool.duration * 4) + 0}px`,
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
      if (e.detail === 2) {
        this.resetZoom();
      }
      this.$utils.setCapture(e.currentTarget, 'row-resize');
      this.moveStart = e.clientY;
      this.zoomStart = this.zoom;
      window.addEventListener('mousemove', this.handleZoom);
      window.addEventListener('mouseup', this.stopZoom);
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
     * Terminates zooming procedure
     *
     * @public
     */
    stopZoom() {
      window.removeEventListener('mousemove', this.handleZoom);
      window.removeEventListener('mouseup', this.stopZoom);
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
      let tickDuration = cueItemPool.cue.duration * this.pool.barSubDiv;
      tickDuration = this.doesCollide(tick, tickDuration, cueItemPool.items);
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
      this.$utils.setCapture(e.currentTarget, 'col-resize');
      const cueEl = this.$refs[ref][0];
      if (cueEl) {
        const ctx = {
          el: cueEl,
          moveStart: e.clientX - cueEl.getBoundingClientRect().width,
          snapWidth: this.cellWidth,
          cue: handle,
          neighbours,
        };
        const resize = (mouseMoveEvent) => {
          this.resizeCue(mouseMoveEvent, ctx);
        };
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', () => window.removeEventListener('mousemove', resize));
      }
    },
    /**
     * Cue resizing procedure
     * @todo: cellwidth is accessible from vm, it could be removed ?
     *
     * @public
     * @param {Object} e mousemove event
     * @param {Object} ctx context object holding references necessary for resize operation
     * @param {Object} ctx.el handle to corresponding cue HTML element
     * @param {Object} ctx.moveStart horizontal move offset
     * @param {Object} ctx.snapWidth current cell width in order to snap resizing to grid
     * @param {Object} ctx.cue  handle to cue item to be resized
     * @param {Object} ctx.neighbours list of cue items adjacent to the cue item being resized
     */
    resizeCue(e, ctx) {
      const moveOffset = e.clientX - ctx.moveStart;
      const length = Math.floor(moveOffset / ctx.snapWidth);
      ctx.cue.length = Math.max(
        this.computeCueResizeCollision(
          length,
          ctx.cue,
          ctx.neighbours,
        ) || length,
        0,
      );
    },
    /**
     * Terminates resizing procedure
     *
     * @public
     */
    stopResizeCue() {
      window.removeEventListener('mousemove', this.resizeCue);
    },
    /**
     * Cue dragging procedure initialisation
     *
     * @public
     * @param {Object} e mousedown event
     * @param {String} ref cue reference string
     * @param {Object} handle handle to cue instance to be resized
     * @param {Array} neighbours list of cue items adjacent to the cue item being resized
     */
    startDragCue(e, ref, handle, neighbours) {
      // TODO: find a way to successfully use setCapture with right click enabled
      // this.$utils.setCapture(e.currentTarget, "grab");
      const cueEl = this.$refs[ref][0];
      const ctx = {
        el: cueEl,
        startX: e.clientX - cueEl.offsetLeft,
        snapWidth: this.cellWidth,
        cue: handle,
        neighbours,
      };
      const drag = (mouseMoveEvent) => {
        this.dragCue(mouseMoveEvent, ctx);
      };
      window.addEventListener('mousemove', drag);
      window.addEventListener('mouseup', () => window.removeEventListener('mousemove', drag));
    },
    /**
     * Cue dragging procedure
     * @todo: cellwidth is accessible from vm, it could be removed ?
     *
     * @public
     * @todo It seems to work fine, however, a recursion problem seems
     * to be occuring when dealing with many neighbours
     * @param {Object} e mousemove event
     * @param {Object} ctx context object holding references necessary for drag operation
     * @param {Object} ctx.el handle to corresponding cue HTML element
     * @param {Object} ctx.startX horizontal move offset
     * @param {Object} ctx.snapWidth current cell width in order to snap resizing to grid
     * @param {Object} ctx.cue  handle to cue item to be dragged
     * @param {Object} ctx.neighbours list of cue items adjacent to the cue item being dragged
     */
    dragCue(e, ctx) {
      const moveOffset = e.clientX - ctx.startX;
      let tick = Math.floor(moveOffset / ctx.snapWidth);
      tick = Math.max(this.computeCuePositionCollision(
        tick,
        ctx.cue.length,
        ctx.cue,
        ctx.neighbours,
      ), 0);
      ctx.cue.tick = Math.max(
        this.computeCuePositionCollision(
          tick,
          ctx.cue.length,
          ctx.cue,
          ctx.neighbours,
        ) || tick,
        0,
      );
    },
    /**
     * Terminates dragging procedure
     *
     * @public
     */
    stopDragCue() {
      window.removeEventListener('mousemove', this.drag);
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
      window.addEventListener('mousemove', this.dragCursor);
      window.addEventListener(
        'mouseup',
        () => window.removeEventListener(
          'mousemove',
          this.dragCursor,
        ),
      );
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
     * Computes cue items position collisions recursively and returns
     * currently available tick position. Tick value will be locked to current value
     * in case of collision.
     *
     * @public
     * @param {Number} tick tick number to which the cue item should be moved
     * @param {Number} length width of the cue item being moved
     * @param {Number} cue handle to cue item instance being moved
     * @param {Object} neighbours list of cue items adjacent to the cue item being dragged
     * @returns {Number} new cue item tick value
     */
    computeCuePositionCollision(tick, length, cue, neighbours) {
      const collision = { tick, length };
      for (let i = 0; i < neighbours.length; i++) {
        const neighbourCue = neighbours[i];
        if (neighbourCue !== cue) {
          if (
            neighbourCue.tick < tick + cue.length
            && tick < neighbourCue.tick + neighbourCue.length
          ) {
            collision.tick = collision.tick > neighbourCue.tick
              ? neighbourCue.length + neighbourCue.tick
              : neighbourCue.tick - length;
            collision.tick = collision.tick <= 0
              ? neighbourCue.length
              : collision.tick;
          }
        }
      }
      if (tick === collision.tick) {
        return tick;
      }
      return this.computeCuePositionCollision(collision.tick, collision.length, cue, neighbours);
    },
    /**
     * Computes cue items position collisions recursively and returns
     * currently available tick position. Tick value will be locked to current value
     * in case of collision.
     *
     * @public
     * @param {Number} length width of the cue item being resized
     * @param {Number} cue handle to cue item instance being resized
     * @param {Object} neighbours list of cue items adjacent to the cue item being resized
     * @returns {Number} new cue item width value
     */
    computeCueResizeCollision(length, cue, neighbours) {
      const max = Math.min(...neighbours.filter(
        (nCue) => nCue.tick >= cue.tick + cue.length,
      ).map((c) => c.tick - cue.tick));
      return Math.min(length, max);
    },
    /**
     * Determines whether or not a cue item at position "tick" of a length "length"
     * collides with any neightbouring cue item.
     *
     * @public
     * @param {Number} tick cue item's starting tick position
     * @param {Number} length cue item's length in ticks
     * @param {Object} neighbours list of cue items adjacent to the cue item being resized
     * @returns {Boolean} Whether the cue item is colliding or not
     */
    doesCollide(tick, length, neighbours) {
      for (let i = 0; i < neighbours.length; i++) {
        const neighbour = neighbours[i];
        if (neighbour.tick < tick + length && tick <= neighbour.tick + neighbour.length) {
          return neighbour.tick - tick;
        }
      }
      return length;
    },
    /**
     * Force full component re-render
     */
    async forceReRender() {
      await nextTick();
      this.key++;
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
  z-index: 0;
  position: absolute;
  height: 100%;
  margin-top: 12px;
  z-index: 30;
  opacity: .8;
}
.widget_pool_timeline_cursor:hover, .widget_pool_timeline_cursor:active {
  /* border: 1px solid var(--secondary-light); */
  opacity: 1;
}
.widget_pool_timeline_cursor:before {
  position: absolute;
  content: "";
  box-sizing: content-box;
  width: 10px;
  height: 10px;
  /* border: 1px solid transparent; */
  background:
    linear-gradient(
      45deg,
      transparent 0%,
      transparent 50%,
      var(--accent-maroon) 50%,
      var(--accent-maroon) 100%
    );
  /* background: var(--accent-maroon); */

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
.widget_pool_timeline_grid_row:nth-child(odd) > .widget_pool_timeline_grid_column {
  background: var(--primary-light-alt);
}
.widget_pool_timeline_grid_tick {
  flex: 1;
  min-width: 10px;
  border-left: 1px solid #ffffff1a;
}
.large_tick {
  height: 100% !important;
  margin-top: 0 !important;
}
.small_tick {
  height: 25%;
  margin-top: 18px;
  box-sizing: border-box;
  border-color: #2e302b;
}
.medium_tick {
  height: 50%;
  margin-top: 11.5px;
  box-sizing: border-box;
}
.tick {
  color: var(--secondary-lighter) !important;
}
.widget_pool_timeline_grid_column {
  min-width: 10px;
  flex: 1;
  background: var(--primary-lighter-alt);
  border-left: 1px solid var(--primary-dark);
}
.widget_pool_timeline_grid_row:nth-child(odd) .widget_pool_timeline_grid_column {
  border-left: 1px solid var(--primary-light);
}
.bar {
  border-left: 1.5px solid var(--secondary-dark) !important;
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
.widget_pool_timeline_grid_bar {
  position: absolute;
  display: none;
  height: 100%;
  background-image:
    linear-gradient(
      to right,
      var(--secondary-light) 0,
      var(--secondary-light) 1px,
      transparent 1px,
      transparent 100%
    ) !important;
  z-index: 100;
  width: 100%;
  pointer-events: none;
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
  cursor: -moz-zoom-in;
  cursor: -webkit-zoom-in;
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

.widget_pool_timeline_item_cue_body_curve{
  position: absolute;
  left: 0;
  bottom: 0;
  height: 100%;
  width: 100%;
  stroke: var(--secondary-lighter);
  fill: var(--secondary-light);
  stroke-width: 1px;
  /* stroke-dasharray: 2px; */
  stroke-opacity: .8;
  transform: rotateX(180deg);
  transform: rotateY(180deg);
}
.widget_pool_timeline_grid_row_sub{
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
