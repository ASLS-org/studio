<template>
  <uk-widget :disabled="!pool.cues.length" class="widget_pool_timeline" :header="header">
    <uk-flex class="widget_pool_timeline_grid_wrapper">
      <uk-flex col class="widget_pool_timeline_grid" ref="grid">
        <uk-flex
          class="widget_pool_timeline_grid_label_wrapper"
          :style="computeRowStyle()"
          @dblclick.native="resetZoom"
          @mousedown.native="startZoom"
          @mouseup.native="stopZoom"
        >
          <div v-show="pool.cues.length" class="widget_pool_timeline_picker" :style="computeTickStyle()" ref="picker" />
          <uk-flex center-both class="widget_pool_timeline_fold_btn">
            <uk-button square v-model="folded" toggleable label="fold cues" icon="hide" style="width: 100%; height: 100%" />
          </uk-flex>
          <div class="widget_pool_timeline_grid_label" :style="computeRowStyle()" />
          <div
            :style="{ left: `${cellWidth * 16 * (bar - 1)}px` }"
            class="widget_pool_timeline_grid_label_bar"
            v-for="bar in pool.duration * 4"
            :key="bar"
          >
            {{ Math.ceil((bar - 1 + 1) / 4) }}.{{ (bar - 1) % 4 }}
          </div>
        </uk-flex>
        <template v-if="pool.cues.length">
          <uk-flex
            @dblclick.native="(e) => addCueItem(e, cueItemPool)"
            :style="computeRowStyle()"
            class="widget_pool_timeline_grid_row"
            v-for="(cueItemPool, cueIndex) in pool.cues"
            v-show="!folded || (folded && cueItemPool.items.length)"
            :key="cueIndex"
          >
            <div :style="{ borderColor: cueItemPool.cue.color }" class="widget_pool_timeline_item" :class="{ even: !(cueIndex % 2) }">
              <uk-icon :name="cueItemPool.cue.type ? 'waveform' : 'mixer'" class="widget_pool_timeline_item_icon" />
              <h4 class="widget_pool_timeline_item_text">{{ cueItemPool.name }}</h4>
            </div>
            <div style="width: calc(100% + 130px); height: 100%; position: relative">
              <div class="widget_pool_timeline_grid_bar" :style="computeBarStyle()" />
              <div
                @dblclick.stop
                :ref="`cue-${cueIndex}-${itemIndex}`"
                v-for="(cueItem, itemIndex) in cueItemPool.items"
                :key="itemIndex"
                class="widget_pool_timeline_item_cue"
                :style="computeCueStyling(cueItem)"
              >
                <div
                  @contextmenu.prevent="deleteCue(cueItemPool, cueItem)"
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
        </template>
      </uk-flex>
    </uk-flex>
  </uk-widget>
</template>

<script>
/**
 * @todo Document this
 */
export default {
  name: "chsaeModifierWidgetpoolTimeline",
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
       * String used for filtering cues
       * @todo implement cue search
       */
      searchString: "",
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
    computeCueStyling(cue) {
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
      let containerWidth = cellWidth * this.pool.barSubDiv * this.pool.duration + 130;
      if (this.$el && containerWidth < this.$el.offsetWidth) {
        minCellWidth = this.$el.offsetWidth / (this.pool.barSubDiv * this.pool.duration);
      }
      this.cellWidth = Math.round(Math.max(cellWidth, minCellWidth));
      containerWidth = this.cellWidth * this.pool.barSubDiv * this.pool.duration + 130;
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
     * Computes timeline's picker position
     *
       * @todo rename this so it's clearer ?
     * @public
     * @returns {Object} css left position styling
     */
    computeTickStyle() {
      return {
        left: this.pool.elapsedPerc * (this.pool.duration * this.cellWidth * this.pool.barSubDiv) + 130 + "px",
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
      this.moveStart = e.clientY;
      this.zoomStart = this.zoom;
      window.addEventListener("mousemove", this.handleZoom);
      window.addEventListener("mouseup", this.stopZoom);
      document.body.style.cursor = "none";
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
      document.body.style.cursor = "default";
    },
    /**
     * Deletes a cue item from the selected chase's cue item pool
     *
       * @public
     * @param {Object} cueItemPool handle to cue item pool
     * @param {Object} cueItem handle to cue item to be deleted
     */
    deleteCue(cueItemPool, cueItem) {
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
      let tick = Math.floor((e.clientX + leftOffset - 130) / this.cellWidth);
      cueItemPool.addRaw({
        tickStart: tick,
        tickDuration: 4,
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
      let maxLength = this.pool.duration * this.pool.barSubDiv - ctx.cue.tick;
      let length = Math.min(Math.floor(moveOffset / ctx.snapWidth), maxLength);
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
      let maxTick = this.pool.duration * this.pool.barSubDiv;
      let tick = Math.min(Math.floor(moveOffset / ctx.snapWidth), maxTick - ctx.cue.length);
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
  },
};
</script>

<style scoped>
.widget_pool_timeline {
  width: 100%;
}
.widget_pool_timeline_grid_wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
.widget_pool_timeline_items {
  display: flex;
  background: var(--secondary-darker);
  min-width: 130px;
  max-width: 130px;
  overflow: hidden;
  height: 100%;
  flex-direction: column;
}
.widget_pool_timeline_item {
  display: flex;
  align-items: center;
  height: 100%;
  background: var(--primary-light);
  box-sizing: border-box;
  padding: 0 8px;
  text-overflow: ellipsis;
  border-left: 3px solid blueviolet;
  white-space: nowrap;
  overflow: hidden;
  min-width: 130px;
  max-width: 130px;
  position: sticky;
  left: 0px;
  z-index: 10;
  border-right: 1px solid var(--primary-dark) !important;
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
  overflow: auto;
}
.widget_pool_timeline_picker {
  width: 2px;
  background: rgba(227, 26, 26, 0.7);
  z-index: 20;
  position: absolute;
  height: 168px;
  margin-top: 15px;
}
.widget_pool_timeline_picker:before {
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
.widget_pool_timeline_picker:active:before {
  cursor: move !important;
}
.widget_pool_timeline_grid_row {
  position: sticky;
  top: 0px;
  min-height: 30px;
  border-bottom: 1px solid var(--primary-dark);
  background: var(--secondary-darker);
  background-image: linear-gradient(to right, var(--primary-dark) 0, var(--primary-dark) 1px, transparent 1px, transparent 100%) !important;
  background-size: 10px 100%;
  background-position: 130px !important;
  min-width: 100%;
}
.widget_pool_timeline_grid_label {
  position: absolute;
  min-height: 12px !important;
  height: 12px;
  top: 12px;
  background-position: 130px !important;
  background-image: linear-gradient(to right, var(--secondary-dark) 0, var(--secondary-dark) 1px, transparent 1px, transparent 100%) !important;
  z-index: 0;
}
.widget_pool_timeline_grid_row {
  height: 100%;
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
.widget_pool_timeline_grid_column_simple {
  width: 100%;
  min-width: 100px;
  height: 100%;
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
  height: 100%;
  background-image: linear-gradient(to right, var(--secondary-light) 0, var(--secondary-light) 1px, transparent 1px, transparent 100%) !important;
  z-index: 0;
  width: 100%;
  pointer-events: none;
}
.widget_pool_timeline_grid_label_bar {
  font-family: Roboto-medium;
  color: var(--secondary-lighter);
  font-size: 12px;
  position: absolute;
  height: 100%;
  padding: 2px 8px;
  border-left: 1px solid var(--secondary-light);
  margin-left: 130px;
}
.widget_pool_timeline_fold_btn {
  min-width: 130px;
  max-width: 130px;
  position: sticky;
  left: 0px;
  z-index: 10;
  background: var(--primary-lighter-alt);
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
</style>
