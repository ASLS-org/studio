<template>
  <uk-widget class="cuepool_widget" dockable :header="header">
    <uk-flex col class="body">
      <uk-txt-input placeholder="Search Cues" class="searchbox" :outlined="false" v-model="searchString" />
      <uk-flex style="height: calc(100% - 25px)" class="body">
        <uk-flex tabindex="0" @focus.native="handleFocus(true)" @focusout.native="handleFocus(false)" col class="body">
          <div ref="grid" class="grid" @scroll="updateScrollPreview">
            <div
              @dragenter="
                (e) => {
                  dragEnter(e, index);
                }
              "
              @dblclick="displayCuepoolPopup(index)"
              class="grid_item empty"
              v-for="(item, index) in 120"
              :key="index"
            >
              <div class="grid_item_body">
                <h4>C-{{ index }}</h4>
              </div>
              <div class="grid_item_footer">
                <h4>-</h4>
              </div>
            </div>
            <div
              :class="{ selected: selectedCue === cue.id || hoveredCueSelector === cue.id || hoveredCuePlayer === cue.id }"
              @click="playCue(cue)"
              @dragstart="
                (e) => {
                  startDrag(e, cue);
                }
              "
              @dragover.prevent
              :style="computeCueStyle(cue)"
              class="grid_item"
              v-for="cue in cues"
              :key="cue.name + cue.id"
              :ref="`cue-${cue.id}`"
              draggable
            >
              <div class="grid_item_overlay" :style="{ background: cue.color + '!important' }">
                <div
                  @mouseenter="hoveredCuePlayer = cue.id"
                  @mouseleave="hoveredCuePlayer = -1"
                  class="grid_item_body"
                  :style="computeCueLoader(cue)"
                >
                  <Transition name="fade">
                    <uk-flex center-both v-if="hoveredCuePlayer === cue.id" class="grid_item_body_overlay" style="">
                      <uk-icon :class="{ playing: cue.state }" :name="cue.state ? 'stop' : 'play'" class="grid_item_body_icon" />
                    </uk-flex>
                    <uk-icon v-else :name="cue.type ? 'waveform' : 'mixer'" class="grid_item_body_icon" />
                  </Transition>
                </div>
                <div
                  @mouseenter="hoveredCueSelector = cue.id"
                  @mouseleave="hoveredCueSelector = -1"
                  @click.stop="selectCue(cue)"
                  class="grid_item_footer"
                >
                  <p>{{ cue.name || "Cue" + cue.id }}</p>
                </div>
              </div>
            </div>
          </div>
        </uk-flex>
        <div class="scroll_preview">
          <div class="scroll_preview_scroller" ref="scroller" />
          <div
            class="cue_preview"
            :class="{ playing: cue.state, selected: cue.id === selectedCue }"
            v-for="(cue, index) in cues"
            :key="index"
            :style="computeCuePreviewStyle(cue)"
          />
        </div>
      </uk-flex>
    </uk-flex>
    <popup-cue-pool @add="addCue" :cueId="selectedCue" :group="group" v-model="cuePopupDisplayState" />
  </uk-widget>
</template>

<script>
import popupCuePool from "../_popups/group.modifier.popup.cuepool.vue";

export default {
  name: "groupModifierWidgetCuepool",
  components: {
    popupCuePool,
  },
  props: {
    /**
     * Handle to group instance
     */
    group: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      /**
       * Widget header data
       */
      header: {
        title: "Cue Pool",
        icon: "grid",
      },
      /**
       * Search string
       * @todo implement cue search
       */
      searchString: "",
      /**
       * Cue creation popup display state
       */
      cuePopupDisplayState: false,
      /**
       * Handle to group's cue list
       */
      cues: this.group.cuePool.cues,
      /**
       * Selected cue index
       */
      selectedCue: null,
      /**
       * Whether cue's body (player) is seleted
       */
      hoveredCuePlayer: -1,
      /**
       * Whether cue's footer (selector) is seleted
       */
      hoveredCueSelector: -1,
      /**
       * Cue deletion popup state
       */
      deletePopupState: false,
    };
  },
  methods: {
    /**
     * Computes cue loading gradient baed on cue playtime
     *
       * @public
     * @param {Object} cue handle to cue instance
     * @returns {Object} css background linear-gradient value
     */
    computeCueLoader(cue) {
      let perc = (cue.time / cue.durationMS) * 100 * cue.state;
      return {
        background: `linear-gradient(90deg ,var(--secondary-light) 0% ,var(--secondary-light) ${perc}% ,transparent ${perc}%,transparent 100% )`,
      };
    },
    /**
     * Computes cue position styling within cuepool grid
     *
       * @public
     * @param {Object} cue handle to cue instance
     * @returns {Object} css left and top cue position
     */
    computeCueStyle(cue) {
      let style = {
        left: parseInt(cue.id % 4) * 101 + "px",
        top: Math.floor(parseInt(cue.id) / 4) * 81 + "px",
      };
      return style;
    },
    /**
     * Computes cue previews position and background styling
     *
       * @public
     * @param {Object} cue handle to cue instance
     * @returns {Object} css left and top cue position and background color
     */
    computeCuePreviewStyle(cue) {
      let style = {
        left: parseInt(cue.id % 4) * 6.9 + "px",
        top: Math.floor(parseInt(cue.id) / 4) * 6.11 + "px",
        background: cue.color,
      };
      return style;
    },
    /**
     * Selects a cue from the pool
     *
       * @public
     * @param {Object} cue handle to cue instance
     */
    selectCue(cue) {
      if (cue) {
        this.selectedCue = cue.id;
        this.$emit("select", cue);
      } else {
        this.selectedCue = null;
        this.$emit("select", null);
      }
    },
    /**
     * Plays a cue from the pool
     *
       * @public
     * @param {Object} cue handle to cue instance
     */
    playCue(cue) {
      this.selectCue(cue);
      cue.cue(true);
    },
    /**
     * Displays cue creation popup
     *
       * @public
     * @param {Number} cueId index of the cue to be created
     */
    displayCuepoolPopup(cueId) {
      this.selectedCue = cueId;
      this.cuePopupDisplayState = true;
    },
    /**
     * Cue creation callback. selects newly created cue and propagates event.
     *
       * @public
     * @param {Object} cue handle to cue instance
     */
    addCue(cue) {
      this.selectCue(cue);
      this.$emit("add", cue);
    },
    /**
     * Deletes a cue from the group
     *
       * @public
     */
    deleteCue() {
      this.deletePopupState = false;
      let cue = this.group.cuePool.getFromId(this.selectedCue);
      this.group.deleteCue(cue);
      this.selectCue(this.cues[0] || null);
    },
    /**
     * Initiates cue dragging procedure
     *
       * @public
     * @param {Object} e mousedown event
     * @param {Object} cue handle to cue instance
     */
    startDrag(e, cue) {
      this.draggedCue = cue;
      e.dataTransfer.effectAllowed = "move";
    },
    /**
     * Callback for drag enter in cuepool slots
     *
       * @public
     * @param {Object} e mousedown event
     * @param {Number} index cuepool slot index
     */
    dragEnter(e, index) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (e.target.classList && index != this.draggedCue.id) {
        this.draggedCue.id = index;
      }
    },
    /**
     * Updates scroll preview's scroller position to match cuepool's scrollTop.
     *
       * @public
     * @param {Object} e scroll event
     */
    updateScrollPreview(e) {
      let scrollingPerc = e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight);
      this.$refs.scroller.style.marginTop = (e.target.clientHeight - 25) * scrollingPerc + "px";
    },
    /**
     * Handle component focus event
     *
       * @public
     * @param {Bool} state focus state
     */
    handleFocus(state) {
      window.removeEventListener("keydown", this.keydownHandler);
      if (state) {
        window.addEventListener("keydown", this.keydownHandler);
      }
    },
    /**
     * Keydown handler
     *
       * @public
     * @param {Object} e keydown event
     */
    keydownHandler(e) {
      const key = e.key;
      if (key === "Backspace" || key === "Delete") {
        this.deleteCue();
      }
    },
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.keydownHandler);
  },
  watch: {
    /**
     * @todo maybe avoid watching whole groups, evern though watching routine isn't deep ?
     */
    group() {
      this.cues = this.group ? this.group.cuePool.cues : [];
      this.selectCue(this.cues[0] || null);
    },
  },
};
</script>
<style scoped>
.cuepool_widget {
  width: 440px;
  max-width: 440px !important;
  min-width: 440px !important;
}
.body {
  height: 100%;
  width: 100%;
}
.searchbox {
  width: 100%;
}
.grid {
  height: 100%;
  width: 100%;
  position: relative;
  display: grid;
  background: var(--primary-dark);
  gap: 1px;
  grid-template-columns: repeat(auto-fill, 100px);
  overflow: hidden;
  overflow-y: auto;
  width: 100%;
}
.grid_item {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 80px;
  cursor: pointer;
  background: #161913;
  opacity: 1;
  z-index: 1;
}
.grid_item_overlay {
  border: 1px solid var(--secondary-dark);
  width: 100%;
  height: 100%;
  display: flex;
  border-radius: 2px;
  flex-direction: column;
  opacity: 0.8;
  transition: opacity 0.15s;
}
.selected .grid_item_overlay {
  opacity: 1;
  border: 1px solid var(--secondary-light);
}
.grid_item:not(.empty):active {
  cursor: move;
}
.grid_item.empty {
  position: relative;
  border: none;
  opacity: 0.7;
}
.grid_item_body {
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 8px;
  white-space: initial;
  border-color: transparent;
}
.grid_item_body_overlay {
  position: absolute;
  height: 100%;
  width: 100%;
  background: var(--secondary-dark);
}
.grid_item_body_icon {
  height: 28px !important;
  width: 18px !important;
  fill: #ffffffb3; /* Since cues are colored, we're enforcing dark theme font color policies */
}
.grid_item_body_icon.playing {
  height: 12px !important;
  width: 12px !important;
  animation: load linear 0.5s infinite alternate !important;
}
.grid_item_footer {
  background: var(--secondary-darker);
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  padding: 0 8px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.grid_item_footer:hover:not(.empty) {
  background: var(--secondary-light) !important;
}
.grid_item_footer:hover .grid_item_body {
  border-color: red !important;
}
.selected .grid_item_footer {
  background: var(--secondary-light) !important;
}
.grid h4,
.grid p {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 4px;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
}
.selected .grid_item {
  background: var(--secondary-light);
}
.scroll_preview {
  position: relative;
  height: 100%;
  width: 30px;
  background-color: var(--primary-dark-alt);
  background-image: linear-gradient(to right, var(--primary-dark) 0, var(--primary-dark) 1px, transparent 1px, transparent 100%),
    linear-gradient(to bottom, var(--primary-dark) 0, var(--primary-dark) 1px, transparent 1px, transparent 100%);
  background-size: 6.9px 6.11px;
  top: -1px;
}
.scroll_preview_scroller {
  position: absolute;
  height: 24px;
  width: 100%;
  background: var(--secondary-light);
  opacity: 0.5;
  border: 1px solid var(--secondary-light);
}
.cue_preview {
  position: absolute;
  width: 6px;
  height: 6px;
  opacity: 0.8;
}
.cue_preview.selected {
  opacity: 1;
  border: 1px solid var(--secondary-light);
}
.cue_preview.playing {
  animation: playing_animation 0.5s infinite alternate;
}

/** TRANSITIONS */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

/** ANIMATIONS */
@keyframes playing_animation {
  from {
    border: 2px solid var(--secondary-lighter);
  }
  to {
    border: none;
  }
}

@keyframes load {
  from {
    fill: var(--secondary-light);
  }
  to {
    fill: var(--secondary-lighter);
  }
}
</style>
