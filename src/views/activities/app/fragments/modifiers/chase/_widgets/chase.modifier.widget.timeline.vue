<template>
  <uk-widget :disabled="!pool.cues.length" class="widget_pool_timeline" :header="header">
    <uk-flex col class="widget_pool_timeline_grid_wrapper">
      <div class="widget_pool_timeline_fold_btn">
        <uk-button style="width: 100%; height: 100%" square v-model="folded" toggleable label="fold cues" icon="hide" />
      </div>
      <uk-flex class="widget_pool_timeline_grid_wrapper" ref="scrollable">
        <uk-flex col class="widget_pool_timeline_items">
          <div
            v-for="(cueItemPool, cueIndex) in pool.cues"
            v-show="!folded || (folded && cueItemPool.items.length)"
            :key="cueIndex"
            :style="{ borderColor: cueItemPool.cue.color }"
            class="widget_pool_timeline_item"
            :class="{ even: !(cueIndex % 2) }"
          >
            <uk-icon :name="cueItemPool.cue.type ? 'waveform' : 'mixer'" class="widget_pool_timeline_item_icon" />
            <h4 class="widget_pool_timeline_item_text">{{ cueItemPool.name }}</h4>
          </div>
        </uk-flex>
        <div class="widget_pool_timeline_duration_floater">
          <div class="widget_pool_timeline_duration_overflow_overlay" :style="computeDurationOverflowOverlayStyle()" />
          <div class="widget_pool_timeline_cursor" :style="computeCursorStyle()" />
        </div>
        <uk-flex style="height: fit-content; min-height: 100%" col>
          <uk-flex
            class="widget_pool_timeline_grid_label_wrapper"
            :style="computeRowStyle()"
            @dblclick.native="resetZoom"
            @mousedown.native="startZoom"
            @mouseup.native="stopZoom"
          >
            <div
              class="widget_pool_timeline_grid_label"
              @dblclick="resetZoom"
              @mousedown="startZoom"
              @mouseup="stopZoom"
              :style="computeRowStyle()"
            />
            <div
              :style="{ left: `${cellWidth * 16 * (bar - 1)}px` }"
              class="widget_pool_timeline_grid_label_bar"
              v-for="bar in pool.actualDuration * 4"
              :key="bar"
            >
              {{ Math.ceil((bar - 1 + 1) / 4) }}.{{ (bar - 1) % 4 }}
            </div>
          </uk-flex>
          <uk-flex col ref="grid" style="flex: 1">
            <!-- <div class="widget_pool_timeline_duration_overflow_overlay" :style="computeDurationOverflowOverlayStyle()" />
            <div class="widget_pool_timeline_cursor" :style="computeCursorStyle()" /> -->
            <uk-flex
              @dblclick.native="(e) => addCueItem(e, cueItemPool)"
              :style="computeRowStyle()"
              class="widget_pool_timeline_grid_row"
              v-for="(cueItemPool, cueIndex) in pool.cues"
              v-show="!folded || (folded && cueItemPool.items.length)"
              :key="cueIndex"
            >
              <div style="width: 100%; position: relative; min-height: 1%">
                <div
                  @dblclick.stop
                  :ref="`cue-${cueIndex}-${itemIndex}`"
                  v-for="(cueItem, itemIndex) in cueItemPool.items"
                  :key="itemIndex"
                  class="widget_pool_timeline_item_cue"
                  :style="computeCueStyle(cueItem)"
                >
                  <div
                    @contextmenu.prevent="deleteCueItem(cueItemPool, cueItem)"
                    class="widget_pool_timeline_item_cue_body"
                    @mousedown="(e) => startDragCue(e, `cue-${cueIndex}-${itemIndex}`, cueItem, cueItemPool.items)"
                    @mouseup="(e) => stopDragCue(e, `cue-${cueIndex}-${itemIndex}`, cueItem, cueItemPool.items)"
                  >
                    <uk-icon :name="cueItemPool.cue.type ? 'waveform' : 'mixer'" class="widget_pool_timeline_item_icon" />
                    <h4 class="widget_pool_timeline_item_cue_text">{{ cueItem.name }}</h4>
                  </div>
                  <div
                    class="widget_pool_timeline_item_cue_resize"
                    @mousedown="(e) => startResizeCue(e, `cue-${cueIndex}-${itemIndex}`, cueItem, cueItemPool.items)"
                    @mouseup="(e) => stopResizeCue(e, `cue-${cueIndex}-${itemIndex}`, cueItem, cueItemPool.items)"
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
/**
 * @todo Document this
 */
export default {
  name: "chaseModifierWidgetpoolTimeline",
  props: {
    /**
     * Handle to chase pool
     */
    pool: Object,
  },
  data() {
    return {
      /**
       * Widget header data
       */
      header: {
        title: "Timeline",
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
       * Reference to timeline container width. Will be recomputed depending on chase duration and zoom amount
       */
      containerWidth: 0,
    };
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
      let cellWidth = minCellWidth + this.zoom * minCellWidth;
      let containerWidth = cellWidth * this.pool.barSubDiv * this.pool.actualDuration + 0;
      if (this.$el && containerWidth < this.$el.offsetWidth) {
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
     * Computes timeline's cursor position
     *
     * @public
     * @returns {Object} css left position styling
     */
    computeCursorStyle() {
      return {
        left: this.pool.elapsedPerc * (this.pool.duration * this.cellWidth * this.pool.barSubDiv) + 0 + "px",
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
    },
    /**
     * Initiates zooming procedure
     *
     * @public
     * @param {Object} e mousedown event
     */
    startZoom(e) {
      if (e.detail == 2) {
        this.resetZoom();
      }
      this.$utils.setCapture(e.currentTarget, "row-resize");
      this.moveStart = e.clientY;
      this.zoomStart = this.zoom;
      window.addEventListener("mousemove", this.handleZoom);
      window.addEventListener("mouseup", this.stopZoom);
    },
    /**
     * Handles zooming procedure
     *
     * @public
     * @param {Object} e mousemove event
     */
    handleZoom(e) {
      this.zoom = Math.max(this.zoomStart + (this.moveStart - e.clientY) / this.$el.clientHeight, 0);
    },
    /**
     * Terminates zooming procedure
     *
     * @public
     */
    stopZoom() {
      window.removeEventListener("mousemove", this.handleZoom);
      window.removeEventListener("mouseup", this.stopZoom);
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
      let gridEl = this.$refs.grid.$el;
      let gridElBox = gridEl.getBoundingClientRect();
      let leftOffset = gridEl.scrollLeft - gridElBox.left;
      let tick = Math.floor((e.clientX + leftOffset) / this.cellWidth);
      let tickDuration = cueItemPool.cue.duration * this.pool.barSubDiv;
      tickDuration = this.doesCollide(tick, tickDuration, cueItemPool.items);
      cueItemPool.addRaw({
        tickStart: tick,
        tickDuration: tickDuration,
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
     * @param {Array} neighbours list of cue items adjacent to the cue item being resized (also contains reference to resized cue item)
     */
    startResizeCue(e, ref, handle, neighbours) {
      this.$utils.setCapture(e.currentTarget, "col-resize");
      let cueEl = this.$refs[ref][0];
      if (cueEl) {
        var ctx = {
          el: cueEl,
          moveStart: e.clientX - cueEl.getBoundingClientRect().width,
          snapWidth: this.cellWidth,
          cue: handle,
          neighbours: neighbours,
        };
        const resize = (e) => {
          this.resizeCue(e, ctx);
        };
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", () => window.removeEventListener("mousemove", resize));
      }
    },
    /**
     * Cue resizing procedure
     *
     * @public
     * @param {Object} e mousemove event
     * @param {Object} ctx context object holding references necessary for resize operation
     * @param {Object} ctx.el handle to corresponding cue HTML element
     * @param {Object} ctx.moveStart horizontal move offset
     * @param {Object} ctx.snapWidth current cell width in order to snap resizing to grid todo: cellwidth is accessible from vm, it could be removed ?
     * @param {Object} ctx.cue  handle to cue item to be resized
     * @param {Object} ctx.neighbours list of cue items adjacent to the cue item being resized (also contains reference to resized cue item)
     */
    resizeCue(e, ctx) {
      let moveOffset = e.clientX - ctx.moveStart;
      let length = Math.floor(moveOffset / ctx.snapWidth);
      ctx.cue.length = Math.max(this.computeCueResizeCollision(length, ctx.cue, ctx.neighbours) || length, 0);
    },
    /**
     * Terminates resizing procedure
     *
     * @public
     */
    stopResizeCue() {
      window.removeEventListener("mousemove", this.resizeCue);
    },
    /**
     * Cue dragging procedure initialisation
     *
     * @public
     * @param {Object} e mousedown event
     * @param {String} ref cue reference string
     * @param {Object} handle handle to cue instance to be resized
     * @param {Array} neighbours list of cue items adjacent to the cue item being resized (also contains reference to resized cue item)
     */
    startDragCue(e, ref, handle, neighbours) {
      // this.$utils.setCapture(e.currentTarget, "grab");
      let cueEl = this.$refs[ref][0];
      var ctx = {
        el: cueEl,
        startX: e.clientX - cueEl.offsetLeft,
        snapWidth: this.cellWidth,
        cue: handle,
        neighbours: neighbours,
      };
      const drag = (e) => {
        this.dragCue(e, ctx);
      };
      window.addEventListener("mousemove", drag);
      window.addEventListener("mouseup", () => window.removeEventListener("mousemove", drag));
    },
    /**
     * Cue dragging procedure
     *
     * @public
     * @todo It seems to work fine, however, a recursion problem seems to be occuring when dealing with many neighbours
     * @param {Object} e mousemove event
     * @param {Object} ctx context object holding references necessary for drag operation
     * @param {Object} ctx.el handle to corresponding cue HTML element
     * @param {Object} ctx.startX horizontal move offset
     * @param {Object} ctx.snapWidth current cell width in order to snap resizing to grid todo: cellwidth is accessible from vm, it could be removed ?
     * @param {Object} ctx.cue  handle to cue item to be dragged
     * @param {Object} ctx.neighbours list of cue items adjacent to the cue item being dragged (also contains reference to dragged cue item)
     */
    dragCue(e, ctx) {
      let moveOffset = e.clientX - ctx.startX;
      let tick = Math.floor(moveOffset / ctx.snapWidth);
      tick = Math.max(this.computeCuePositionCollision(tick, ctx.cue.length, ctx.cue, ctx.neighbours), 0);
      ctx.cue.tick = Math.max(this.computeCuePositionCollision(tick, ctx.cue.length, ctx.cue, ctx.neighbours) || tick, 0);
    },
    /**
     * Terminates dragging procedure
     *
     * @public
     */
    stopDragCue() {
      window.removeEventListener("mousemove", this.drag);
    },
    /**
     * Computes cue items position collisions recursively and returns currently available tick position.
     * Tick value will be locked to current value in case of collision.
     *
     * @public
     * @param {Number} tick tick number to which the cue item should be moved
     * @param {Number} length width of the cue item being moved
     * @param {Number} cue handle to cue item instance being moved
     * @param {Object} neighbours list of cue items adjacent to the cue item being dragged (also contains reference to dragged cue item)
     * @returns {Number} new cue item tick value
     */
    computeCuePositionCollision(tick, length, cue, neighbours) {
      var collision = { tick: tick, length: length };
      for (let i = 0; i < neighbours.length; i++) {
        let neighbourCue = neighbours[i];
        if (neighbourCue != cue) {
          if (neighbourCue.tick < tick + cue.length && tick < neighbourCue.tick + neighbourCue.length) {
            collision.tick = collision.tick > neighbourCue.tick ? neighbourCue.length + neighbourCue.tick : neighbourCue.tick - length;
            collision.tick = collision.tick <= 0 ? neighbourCue.length : collision.tick;
          }
        }
      }
      if (tick == collision.tick) {
        return tick;
      } else {
        return this.computeCuePositionCollision(collision.tick, collision.length, cue, neighbours);
      }
    },
    /**
     * Computes cue items position collisions recursively and returns currently available tick position.
     * Tick value will be locked to current value in case of collision.
     *
     * @public
     * @param {Number} length width of the cue item being resized
     * @param {Number} cue handle to cue item instance being resized
     * @param {Object} neighbours list of cue items adjacent to the cue item being resized (also contains reference to resized cue item)
     * @returns {Number} new cue item width value
     */
    computeCueResizeCollision(length, cue, neighbours) {
      let max = Math.min(...neighbours.filter((nCue) => nCue.tick >= cue.tick + cue.length).map((c) => c.tick - cue.tick));
      return Math.min(length, max);
    },
    /**
     * Determines whether or not a cue item at position "tick" of a length "length" collides with any neightbouring cue item.
     *
     * @public
     * @param {Number} tick cue item's starting tick position
     * @param {Number} length cue item's length in ticks
     * @param {Object} neighbours list of cue items adjacent to the cue item being resized (also contains reference to resized cue item)
     * @returns {Boolean} Whether the cue item is colliding or not
     */
    doesCollide(tick, length, neighbours) {
      for (let i = 0; i < neighbours.length; i++) {
        let neighbour = neighbours[i];
        if (neighbour.tick < tick + length && tick <= neighbour.tick + neighbour.length) {
          return neighbour.tick - tick;
        }
      }
      return length;
    },
  },
  mounted() {
    this.resetZoom();
    this.computeRowStyle();
    window.addEventListener("resize", () => {
      this.resetZoom();
      this.computeRowStyle();
    });
  },
  watch: {
    "pool.duration"() {
      this.resetZoom();
      this.computeRowStyle();
    },
    "pool.actualDuration"() {
      this.resetZoom();
      this.computeRowStyle();
    },
    pool() {
      this.$refs.scrollable.$el.scroll(0, 0);
    },
    folded() {
      this.$refs.scrollable.$el.scroll(0, 0);
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
  background: rgba(227, 26, 26, 0.7);
  z-index: 0;
  position: absolute;
  height: 176px;
  margin-top: 12px;
  z-index: 30;
}
.widget_pool_timeline_cursor:before {
  position: absolute;
  content: "";
  width: 10px;
  height: 10px;
  background: linear-gradient(45deg, transparent 0%, transparent 50%, rgba(227, 26, 26, 0.7) 50%, rgba(227, 26, 26, 0.7) 100%);
  z-index: 10;
  transform: rotate(45deg);
  margin-left: -4px;
  cursor: pointer;
}
.widget_pool_timeline_cursor:active:before {
  cursor: move !important;
}
.widget_pool_timeline_grid_row {
  border-bottom: 1px solid var(--primary-dark);
  background: var(--secondary-darker);
  background-image: linear-gradient(to right, var(--primary-dark) 0, var(--primary-dark) 1px, transparent 1px, transparent 100%) !important;
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
  background-image: linear-gradient(to right, var(--secondary-dark) 0, var(--secondary-dark) 1px, transparent 1px, transparent 100%) !important;
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
  opacity: 0.8;
}
.widget_pool_timeline_item_cue:active {
  cursor: move;
  opacity: 1;
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
}
.widget_pool_timeline_grid_bar {
  position: absolute;
  display: none;
  height: 100%;
  background-image: linear-gradient(to right, var(--secondary-light) 0, var(--secondary-light) 1px, transparent 1px, transparent 100%) !important;
  z-index: 100;
  width: 100%;
  pointer-events: none;
}
.widget_pool_timeline_grid_label_bar {
  font-family: Roboto-medium;
  color: var(--secondary-lighter);
  font-size: 12px;
  position: absolute;
  height: 189px;
  padding: 2px 8px;
  border-left: 1px solid var(--secondary-light);
  z-index: -1;
  pointer-events: none;
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
  background: var(--primary-lighter-alt);
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
</style>
