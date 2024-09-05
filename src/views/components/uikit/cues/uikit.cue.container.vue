<template>
  <div
    class="uikit_cue_container"
    :class="{ selected, master }"
  >
    <div
      class="uikit_cue_container_header"
      :style="{
        borderTopColor: master
          ? 'var(--secondary-light)'
          : group.color + (selected ? '' : 'C0')
      }"
    >
      <div
        v-if="!master"
        class="uikit_cue_container_header_dot"
        :style="{
          borderColor: group.color,
          background: selected ? group.color : 'transparent'
        }"
      />
      <h4
        style="text-overflow: ellipsis;width: 100%"
        :style="{
          textAlign: master ? 'right':'left'
        }"
      >
        {{ master ? "Master" : group.name }}
      </h4>
    </div>
    <div class="uikit_cue_container_body">
      <div
        ref="cue_list"
        class="uikit_cue_container_body_cue_list invisible_scrollbar"
        @scroll="propagateScroll"
      >
        <template v-for="(chase, chaseIndex) in poolsize">
          <div
            v-if="master"
            :key="'A' + chaseIndex"
            class="uikit_chase master"
            :style="{ top: `${chaseIndex * 26}px` }"
            :class="{ playing: masterPlayingRow == chaseIndex }"
          >
            <p class="uikit_chase_title">
              C - {{ chaseIndex }}
            </p>
            <div
              class="uikit_chase_btn"
              @click.stop="toggleRow(chaseIndex)"
            >
              <uk-icon
                v-if="masterPlayingRow === chaseIndex"
                class="uikit_chase_icon"
                :name="'stop'"
              />
              <uk-icon
                v-else
                class="uikit_chase_icon"
                :name="'play'"
              />
            </div>
            <div class="uikit_chase_btn">
              <h4>{{ chaseIndex }}</h4>
            </div>
          </div>
          <div
            v-else
            :key="chase"
            class="uikit_cue_container_empty_cue"
            @dblclick="addChase(chaseIndex)"
          >
            <div
              class="uikit_cue_container_empty_cue_btn"
              @click.stop="stopAll"
              @dblclick.stop
            >
              <uk-icon
                v-if="master"
                style="fill: var(--secondary-light) !important"
                class="uikit_chase_icon"
                name="play"
              />
              <uk-icon
                v-else
                class="uikit_cue_container_empty_cue_btn_icon"
                name="stop"
              />
            </div>
          </div>
        </template>
        <template v-if="!master">
          <div
            v-for="(chase, chaseIndex) in chases"
            :key="'B' + chaseIndex"
            class="uikit_chase"
            :style="{ background: chase.color, top: `${chase.id * 26}px` }"
            :class="{ playing: chase.state, selected: selectedChaseId === chase.id }"
            @mousedown="(e) => startDragChase(e, chase)"
            @mouseup="(e) => stopDragChase(e, chase)"
            @click.stop="selectChase(chase)"
          >
            <div
              class="uikit_chase_btn"
              @mousedown.stop
              @mouseup.stop
              @click.stop="toggle(chase)"
            >
              <uk-icon
                v-if="chase.state"
                class="uikit_chase_icon"
                :name="'stop'"
              />
              <uk-icon
                v-else
                class="uikit_chase_icon"
                :name="'play'"
              />
            </div>
            <div
              class="uikit_chase_loader"
              :style="{ width: chase.elapsedPerc * 100 + '%' }"
            />
            <h4 class="uikit_chase_title">
              {{ chase.name }}
            </h4>
          </div>
        </template>
      </div>
      <uk-flex
        col
        :gap="8"
        class="uikit_cue_container_body_modifiers"
      >
        <uk-flex
          reverse
          col
          center-both
          class="uikit_vuemeter"
          :gap="4"
        >
          <div
            v-for="i in 5"
            :key="i"
            class="uikit_vuemeter_dot"
            :style="{
              backgroundColor: parseInt(binDisplay[i])
                ? group.color || 'var(--secondary-lighter)'
                : 'var(--secondary-dark)'
            }"
            style="
              height: 10px;
              width: 10px;
              border-radius: 50%;
              box-shadow: inset 1px 1px 2px var(--primary-dark);
              transition: all .2s;
            "
          />
        </uk-flex>
        <uk-knob
          v-model="group.master"
          label=""
          :color="group.color || 'var(--secondary-lighter)'"
          :disabled="false"
          :min="0"
          :max="255"
        />
        <uk-button
          v-model="group.solo"
          style="width: 85px"
          color="var(--accent-blue)"
          label="solo"
          toggleable
        />
        <uk-button
          v-model="group.disabled"
          style="width: 85px"
          color="var(--accent-maroon)"
          label="disabled"
          toggleable
        />
      </uk-flex>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UkCueContainer',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
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
    /**
     * Value in px to which the container must be automatically scrolled to
     */
    scrollTo: {
      type: Number,
      default: 0,
    },
    /**
     * Whether the container is a mastster container or not
     */
    master: Boolean,
    /**
     * Whether the container is currently selected or not
     */
    selected: Boolean,
    /**
     * Currently selected chase id
     */
    selectedChaseId: {
      type: Number,
      default: null,
    },
  },
  emits: ['scrolled', 'poolsize', 'select-chase'],
  data() {
    return {
      poolsize: 100,
      /**
       * Whether this container is currently selected or not
       */
      // selected: this.master ? false : this.$route.params.groupId === this.group.id,
      /**
       * Id of the currently selected chase
       */
      // selectedChaseId: null,
      /**
       * List of chases contained within the group
       */
      chases: this.master ? [] : this.group.chasePool.chases,
      binDisplay: [0, 0, 0, 0],
      masterPlayingRow: this.$show.master.test,
    };
  },
  watch: {
    scrollTo() {
      this.$refs.cue_list.scrollTo(0, this.scrollTo);
    },
    'group.DMXActivity': function groupeDMXActivityWatcher(val) {
      let n = Math.round(val * 100).toString(2);
      n = ('00000'.substring(n.length) + n).slice(0, 5);
      this.binDisplay = n.split('').sort((a, b) => b - a);
    },
  },
  methods: {
    /**
     * Propagtes scroll value to parent element
     *
     * @param {Object} e Scroll event
     */
    propagateScroll(e) {
      const scrollValue = e.target.scrollTop;
      /**
       * Chase container scrolled event
       *
       * @property {Number} scrollValue the group's chase container scroll  Top value in px
       */
      this.$emit('scrolled', scrollValue);
    },
    /**
     * Handles chase selection by re-routing user to selected chase
     *
     * @param {Object} chase Handle to the chase to be displayed
     */
    selectChase(chase) {
      if (chase) {
        this.$emit('select-chase', this.group, chase);
      } // this.selectedChaseId = chase.id;
      // this.$router.push(`/group/${this.group.id}/chase/${chase.id}`).catch(() => {});
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
        this.$emit('poolsize');
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
      this.$emit('poolsize');
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
      this.selectChase(chase);
      const chaseEl = e.currentTarget;
      this.$utils.setCapture(chaseEl, 'grab');
      const viewportOffset = chaseEl.getBoundingClientRect();
      const ctx = {
        chase,
        chaseEl,
        startY: viewportOffset.top - chaseEl.offsetTop + chaseEl.clientHeight / 2,
      };
      const dragChase = (dragEvent) => {
        this.dragChase(dragEvent, ctx);
      };
      window.addEventListener('mousemove', dragChase);
      window.addEventListener('mouseup', () => {
        window.removeEventListener('mousemove', dragChase);
      });
    },
    /**
     * Re-compute chase's Y position accordingly to mouse move
     *
     * @param {Object} e mousemove event
     */
    dragChase(e, ctx) {
      let tick = Math.min(
        Math.max(
          Math.floor((e.clientY - ctx.startY + 13) / 26),
          0,
        ),
        this.poolsize - 1,
      );
      tick = this.chases.find((chase) => chase.id === tick) ? ctx.chase.id : tick;
      ctx.chaseEl.style.top = `${tick * 26}px`;
      ctx.chase.id = tick;
      this.selectChase(ctx.chase);
    },
    /**
     * Ends chase element dragging procedure.
     *
     */
    stopDragChase() {
      window.removeEventListener('mousemove', this.dragChase);
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
.uikit_cue_container.selected, .uikit_cue_container.selected .uikit_cue_container_body_modifiers {
  background: var(--primary-lighter-alt);
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
.uikit_cue_container_header_dot{
  min-height: 8px;
  min-width: 8px;
  border: 1px solid transparent;
  border-radius: 50%;
  margin-right: 8px;
}
.uikit_cue_container_body {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.uikit_cue_container_body_cue_list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overflow-x: hidden;
  position: relative;
  height: calc(100% - 30px);
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
}
.uikit_cue_container_body_modifiers {
  padding: 16px 0px;
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: 0px;
  width: 100%;
  background: var(--primary-light);
  border-top: 1px solid var(--primary-dark)
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
  cursor: pointer;
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

.uikit_cue_container.selected .uikit_chase{
  opacity: .9!important;
}

.uikit_chase:hover{
  opacity: .9;
}
.uikit_cue_container.selected .uikit_chase:hover{
  opacity: 1!important;
}

.uikit_chase:active {
  cursor: grab !important;
}
.uikit_chase_btn {
  display: flex;
  height: 100%;
  width: 30px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #ffffff33; /* Since cues are colored, we're enforcing dark theme font color */
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #ffffffb3 !important; /* Since cues are colored, we're enforcing dark theme font color */
  font-family: roboto-medium;
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
