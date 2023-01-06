<template>
  <div class="uikit_cue_container" :class="{ selected, master }">
    <div class="uikit_cue_container_header" :style="{ borderTopColor: master ? 'var(--secondary-light)' : group.color + (selected ? '' : 'C0') }">
      <h4 style="text-overflow: ellipsis">{{ master ? "Master" : group.name }}</h4>
    </div>
    <div class="uikit_cue_container_body">
      <div ref="cue_list" class="uikit_cue_container_body_cue_list invisible_scrollbar" @scroll="propagateScroll">
        <template v-for="(chase, chaseIndex) in poolsize">
          <div
            v-if="master"
            :key="'A' + chaseIndex"
            class="uikit_chase master"
            :style="{ top: `${chaseIndex * 26}px` }"
            :class="{ playing: masterPlayingRow == chaseIndex }"
          >
            <p class="uikit_chase_title">row - {{ chaseIndex }}</p>
            <div @click.stop="toggleRow(chaseIndex)" class="uikit_chase_btn">
              <uk-icon class="uikit_chase_icon" :name="masterPlayingRow == chaseIndex ? 'stop' : 'play'" />
            </div>
            <div class="uikit_chase_btn">
              <h4>{{ chaseIndex }}</h4>
            </div>
          </div>
          <div v-else class="uikit_cue_container_empty_cue" @dblclick="addChase(chaseIndex)" :key="'A' + chaseIndex">
            <div @click.stop="stopAll" class="uikit_cue_container_empty_cue_btn">
              <uk-icon style="fill: var(--secondary-light) !important" v-if="master" class="uikit_chase_icon" name="play" />
              <uk-icon v-else class="uikit_cue_container_empty_cue_btn_icon" name="stop" />
            </div>
          </div>
        </template>
        <template v-if="!master">
          <div
            v-for="(chase, chaseIndex) in chases"
            :key="'B' + chaseIndex"
            @mousedown.stop="(e) => startDragChase(e, chase)"
            @mouseup="(e) => stopDragChase(e, chase)"
            @click.stop="selectChase(chase)"
            class="uikit_chase"
            :style="{ background: chase.color, top: `${chase.id * 26}px` }"
            :class="{ playing: chase.state, selected: selectedChaseId == chase.id }"
          >
            <div @click.stop="toggle(chase)" class="uikit_chase_btn">
              <uk-icon class="uikit_chase_icon" :name="chase.state ? 'stop' : 'play'" />
            </div>
            <div class="uikit_chase_loader" :style="{ width: chase.elapsedPerc * 100 + '%' }" />
            <h4 class="uikit_chase_title">{{ chase.name }}</h4>
          </div>
        </template>
      </div>
      <!-- <div class="uikit_cue_container_empty_cue" style="margin-top: 50px; border-top: 1px solid var(--primary-dark)">
        <div @click="stopAll" class="uikit_cue_container_empty_cue_btn">
          <uk-icon class="uikit_cue_container_empty_cue_btn_icon" name="stop" />
        </div>
      </div> -->
      <uk-flex col :gap="8" class="uikit_cue_container_body_modifiers">
        <!-- <uk-spacer/> -->
        <uk-flex reverse col center-both class="uikit_vuemeter" :gap="4">
          <!-- TODO: Create VUemeter component ? -->
          <div
            class="uikit_vuemeter_dot"
            :style="{ backgroundColor: parseInt(binDisplay[i]) ? group.color || 'var(--secondary-lighter)' : 'var(--secondary-dark)' }"
            style="
              height: 10px;
              width: 10px;
              background: red;
              border-radius: 50%;
              box-shadow: inset 1px 1px 2px var(--primary-dark);
              transition: all 0.1s;
            "
            v-for="i in 5"
            :key="i"
          />
        </uk-flex>
        <uk-knob
          @click.native.stop
          label=""
          :color="group.color || 'var(--secondary-lighter)'"
          :disabled="false"
          v-model="group.master"
          :min="0"
          :max="255"
        />
        <uk-button style="width: 85px" color="#2D6BA2" v-model="group.solo" @click.native.stop="" label="solo" toggleable />
        <uk-button style="width: 85px" color="#A22D58" v-model="group.disabled" @click.native.stop="" label="disabled" toggleable />
      </uk-flex>
    </div>
  </div>
</template>

<script>
export default {
  name: "ukCueContainer",
  props: {
    /**
     * Handle to group instance
     */
    group: {
      type: Object,
      default: () => ({}),
    },
    /**
     * The group's total chase pool size (empty and used).
     * This is used to sync each container to be the same size
     * so they can be scrolled simultaneously.
     */
    poolsize: Number,
    /**
     * Value in px to which the container must be automatically scrolled to
     */
    scrollTo: Number,
    /**
     * Whether the container is a mastster container or not
     */
    master: Boolean,
  },
  data() {
    return {
      /**
       * Whether this container is currently selected or not
       */
      selected: this.master ? false : this.$route.params.groupId === this.group.id,
      /**
       * Id of the currently selected chase
       */
      selectedChaseId: null,
      /**
       * List of chases contained within the group
       */
      chases: this.master ? [] : this.group.chasePool.chases,
      binDisplay: [0, 0, 0, 0],
      masterPlayingRow: this.$show.master.test,
    };
  },
  methods: {
    /**
     * Propagtes scroll value to parent element
     *
     * @param {Object} e Scroll event
     */
    propagateScroll(e) {
      let scrollValue = e.target.scrollTop;
      /**
       * Chase container scrolled event
       *
       * @property {Number} scrollValue the group's chase container scroll  Top value in px
       */
      this.$emit("scrolled", scrollValue);
    },
    /**
     * Handles chase selection by re-routing user to selected chase
     *
     * @param {Object} chase Handle to the chase to be displayed
     */
    selectChase(chase) {
      this.selectedChaseId = chase.id;
      this.$router.push(`/group/${this.group.id}/chase/${chase.id}`).catch(() => {});
    },
    /**
     * Handles chase creation
     *
     * @param {Object} gridIndex the grid cell index on which the chase should be created.
     */
    addChase(gridIndex) {
      if (!this.master) {
        this.group.addChase({
          color: this.group.color,
          id: gridIndex,
        });
        this.emptyCues++;
        /**
         * Chase pool size changed event
         *
         * @property {Number} poolsize the group's new pool size
         */
        this.$emit("poolsize");
        this.$router.push(`/group/${this.group.id}/chase/${gridIndex}`);
      }
    },
    /**
     * Triggers chase.
     *
     * @param {Object} chase Handle to the chase to be triggered
     */
    cueChase(chase) {
      this.group.cueChase(chase);
    },
    /**
     * Handles chase deletion
     *
     * @param {Object} chase Handle to the chase to be deleted
     */
    deleteChase(chase) {
      this.group.deleteChase(chase);
      this.emptyCues--;
      this.$emit("poolsize");
    },
    /**
     * Toggles chase's state ON/OFF
     *
     * @param {Object} chase Handle to the chase to be triggered
     */
    toggle(chase) {
      if (chase) {
        this.group.cueChase(chase, !chase.state);
      }
    },
    /**
     * Toggles whole master row of chases state ON/OFF
     *
     * @param {Number} rowIndex Index of the row to be toggled
     */
    toggleRow(rowIndex) {
      if (this.master) {
        this.$show.master.onEnd = () => {
          this.masterPlayingRow = -1;
        };
        this.masterPlayingRow = this.$show.master.cueRow(rowIndex);
      }
    },
    /**
     * Stops all the group's chase simultaneously
     *
     * @public
     */
    stopAll() {
      this.group.stopAllChases();
    },
    /**
     * Prepare chase's element dragging.
     *
     */
    startDragChase(e, chase) {
      document.body.style.cursor = "move";
      let chaseEl = e.target.parentElement;
      var viewportOffset = chaseEl.getBoundingClientRect();
      let ctx = {
        chase: chase,
        chaseEl: chaseEl,
        startY: viewportOffset.top - chaseEl.offsetTop + chaseEl.clientHeight / 2,
      };
      const dragChase = (e) => {
        this.dragChase(e, ctx);
      };
      window.addEventListener("mousemove", dragChase);
      window.addEventListener("mouseup", () => {
        window.removeEventListener("mousemove", dragChase);
        document.body.style.cursor = "unset";
      });
    },
    /**
     * Re-compute chase's Y position accordingly to mouse move
     *
     * @param {Object} e mousemove event
     */
    dragChase(e, ctx) {
      let tick = Math.min(Math.max(Math.floor((e.clientY - ctx.startY) / 26), 0), this.poolsize - 1);
      tick = this.chases.find((chase) => chase.id === tick) ? ctx.chase.id : tick;
      ctx.chaseEl.style.top = tick * 26 + "px";
      ctx.chase.id = tick;
    },
    /**
     * Ends chase element dragging procedure.
     *
     */
    stopDragChase() {
      document.body.style.cursor = "unset";
      window.removeEventListener("mousemove", this.dragChase);
    },
  },
  watch: {
    "$route.params.groupId"() {
      if (!this.master) {
        this.selected = this.$route.params.groupId == this.group.id;
        this.selectedChaseId = this.selected ? this.$route.params.chaseId : null;
      }
    },
    "$route.params.chaseId"() {
      if (!this.master) {
        this.selectedChaseId = this.selected ? this.$route.params.chaseId : null;
      }
    },
    scrollTo() {
      this.$refs.cue_list.scrollTo(0, this.scrollTo);
    },
    "group.DMXActivity"(val) {
      var n = Math.round(val).toString(2);
      n = ("00000".substr(n.length) + n).slice(0, 5);
      this.binDisplay = n.split("").sort((a, b) => b - a);
    },
  },
};
</script>

<style scoped>
.uikit_cue_container {
  display: flex;
  height: 100%;
  min-width: 120px;
  max-width: 200px;
  width: 100%;
  border-right: 1px solid var(--primary-dark);
  background: var(--primary-light);
  flex-direction: column;
}
.uikit_cue_container.selected {
  background: var(--primary-light-alt);
}
.uikit_cue_container.master {
  border-right: none !important;
  border-left: 1px solid var(--primary-dark) !important;
}
.uikit_cue_container_header {
  display: flex;
  width: 100%;
  height: 30px;
  min-height: 30px;
  max-height: 30px;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid var(--primary-dark);
  border-top: 3px solid rebeccapurple;
}
.uikit_cue_container_body {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.uikit_cue_container_body_cue_list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overflow-x: hidden;
  position: relative;
  min-height: 260px;
  max-height: 260px;
  overflow: hidden;
  overflow-y: auto;
}
.uikit_cue_container_empty_cue {
  display: flex;
  height: 25px;
  min-height: 25px;
  background: var(--primary-lighter-alt);
  border-bottom: 1px solid var(--primary-dark);
  box-sizing: content-box;
}
.uikit_cue_container_empty_cue:nth-child(even) {
  background: var(--primary-light-alt); /*#1c1f18;*/
}
.selected .uikit_cue_container_empty_cue {
  background: #232620;
}
.selected .uikit_cue_container_empty_cue:nth-child(even) {
  background: #1f221a;
}
.uikit_cue_container_empty_cue_btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 100%;
  cursor: pointer;
}
.uikit_cue_container_empty_cue_btn:hover .uikit_cue_container_empty_cue_btn_icon {
  fill: var(--secondary-light);
}
.uikit_cue_container_empty_cue_btn_icon {
  display: flex;
  height: 12px;
  width: 12px;
  fill: var(--secondary-darker);
  border: 1px solid var(--primary-light);
  transition: fill 0.1s;
}
.uikit_cue_container_body_modifiers {
  padding: 8px 0px;
  display: flex;
  height: 100%;
  overflow: hidden;
  align-items: center;
  justify-content: center;
}
/* */
.uikit_chase {
  position: absolute;
  display: flex;
  height: 25px;
  width: 100%;
  border: 1px solid var(--secondary-light);
  background: var(--secondary-darker);
  opacity: 0.8;
}
.uikit_chase.master {
  border: none !important;
}
.uikit_chase.master .uikit_chase_title {
  cursor: auto;
}
.uikit_chase.master .uikit_chase_btn {
  background: var(--secondary-dark);
}
.uikit_chase.selected {
  opacity: 1 !important;
  border-color: rgba(255, 255, 255, 0.4);
}
.uikit_chase:active {
  cursor: move !important;
}
.uikit_chase_btn {
  display: flex;
  height: 100%;
  width: 30px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #ffffff33; /* Since cues are colored, we're enforcing dark theme font color policies */
}
.selected > .uikit_chase_btn {
  background: rgba(255, 255, 255, 0.4);
}
.uikit_chase_icon {
  height: 14px !important;
  width: 14px !important;
  fill: #ffffffb3; /* Since cues are colored, we're enforcing dark theme font color policies */
}
.playing .uikit_chase_icon {
  height: 10px !important;
  width: 10px !important;
  animation: load linear 0.8s infinite alternate !important;
}
.uikit_chase_title {
  display: flex;
  align-items: center;
  padding: 0 8px;
  width: 100%;
  height: 100%;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #ffffffb3 !important; /* Since cues are colored, we're enforcing dark theme font color policies */
}
.uikit_chase_loader {
  position: absolute;
  height: 100%;
  pointer-events: none;
}
.playing .uikit_chase_loader {
  width: 0%;
  background-color: var(--secondary-light);
}
/* The animation code */
@keyframes load {
  from {
    fill: var(--secondary-light);
  }
  to {
    fill: var(--secondary-lighter);
  }
}
</style>
