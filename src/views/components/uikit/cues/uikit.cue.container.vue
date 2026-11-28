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
            :style="{ top: `${chaseIndex * rowHeight}px` }"
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
            :style="{ background: chase.color, top: `${chase.id * rowHeight}px` }"
            :class="{ playing: live(chase.state), selected: selectedChaseId === chase.id }"
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
                v-if="live(chase.state)"
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
              :style="{ width: live(chase.elapsedPerc) * 100 + '%' }"
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
          <!-- Lit from the bottom: bright up to what the group's playback sends after the masters,
            faint up to what its cues ask for (the master column: the rig) -->
          <div
            v-for="i in 5"
            :key="i"
            class="uikit_vuemeter_dot"
            :class="{ sent: i <= dots.sent, asked: i > dots.sent && i <= dots.asked }"
            :title="`Output ${Math.round(liveLevels.sent * 100)}%`"
            :style="{ '--dot-color': accent }"
          />
        </uk-flex>
        <!-- A group: its dimmer knob, Isolate, Blackout. The master column: the grand master and
          DBO (models/DMX/master.model.js) -->
        <!-- Grey while something else holds the column back (Blackout, Isolate elsewhere, DBO);
          a double-click puts it back to full -->
        <uk-knob
          v-model="masters.master"
          label=""
          :color="held ? 'var(--secondary-light)' : accent"
          :title="heldReason"
          :disabled="false"
          :min="0"
          :max="255"
          :reset="255"
        />
        <!-- The master column has no Isolate: its place is kept so the knobs stay in line -->
        <uk-button
          v-if="!master"
          v-model="group.solo"
          style="width: 90px"
          color="var(--accent-blue)"
          label="isolate"
          toggleable
        />
        <div
          v-else
          class="uikit_cue_container_isolate_space"
        />
        <uk-button
          v-model="masters.blackout"
          style="width: 90px"
          color="var(--accent-maroon)"
          label="blackout"
          toggleable
        />
      </uk-flex>
    </div>
  </div>
</template>

<script>
import LiveMixin from '@/views/mixins/live.mixin';
import { toRaw } from '@/models/utils/reactivity';
import { CHASE_ROW_HEIGHT } from '@/views/utils/geometry';

export default {
  name: 'UkCueContainer',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [LiveMixin],
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
      /**
       * A chase row's height (fixed geometry, px)
       */
      rowHeight: CHASE_ROW_HEIGHT,
      poolsize: 100,
      /**
       * List of chases contained within the group
       */
      chases: this.master ? [] : this.group?.chasePool.chases,
      masterPlayingRow: this.$show.master.test,
    };
  },
  computed: {
    /**
     * What the knob and Blackout drive: a group's dimmer knob and Blackout, or on the master
     * column the grand master and DBO (models/DMX/master.model.js). Never saved
     *
     * @type {{master: Number, blackout: Boolean}}
     */
    masters() {
      const target = this.master ? this.$show.master : this.group;
      const isMaster = this.master;
      return {
        get master() { return isMaster ? target.level : target.master; },
        set master(value) {
          if (isMaster) target.level = value;
          else target.master = value;
        },
        get blackout() { return isMaster ? target.blackout : target.disabled; },
        set blackout(value) {
          if (isMaster) target.blackout = value;
          else target.disabled = value;
        },
      };
    },
    /**
     * Every master setting (knobs, Isolate, Blackout, DBO), so the dots follow them at once, also
     * while the show is paused
     *
     * @type {String}
     */
    masterSettings() {
      const { master } = this.$show;
      const groups = this.$show.groupPool.groups
        .map((group) => `${group.master}/${group.solo}/${group.disabled}`);
      return `${master.level}/${master.blackout}/${groups.join()}`;
    },
    /**
     * What the group's playback asks for and sends after the masters (the master column: the
     * rig), 0-1 each, refreshed by the live ticker and by any master setting
     *
     * @type {{asked: Number, sent: Number}}
     */
    liveLevels() {
      const master = toRaw(this.$show.master);
      // Touched so a master setting refreshes it (it is always set)
      if (!this.masterSettings) return { asked: 0, sent: 0 };
      // The factors as the settings stand now (the next packed frame computes the same)
      master.prepare();
      return this.live(this.master ? master.rigLevels() : master.groupLevels(this.group));
    },
    /**
     * How many dots light bright (sent) and faint (asked for): any level lights the first
     *
     * @type {{asked: Number, sent: Number}}
     */
    dots() {
      const count = (level) => (level > 0 ? Math.ceil(level * 5) : 0);
      return { asked: count(this.liveLevels.asked), sent: count(this.liveLevels.sent) };
    },
    /**
     * The column's colour: its group's, the master column's light grey
     *
     * @type {String}
     */
    accent() {
      return (!this.master && this.group.color) || 'var(--secondary-lighter)';
    },
    /**
     * Why the column's output is held back by something other than its knob: its Blackout,
     * another group isolated, DBO; empty when nothing holds it
     *
     * @type {String}
     */
    heldReason() {
      const { master } = this.$show;
      if (master.blackout) return 'Held back by DBO';
      if (this.master) return '';
      if (this.group.disabled) return 'Held back by its Blackout';
      const isolating = this.$show.groupPool.groups.some((group) => group.solo);
      if (isolating && !this.group.solo) return 'Held back: another group is isolated';
      return '';
    },
    /**
     * Whether the column's output is held back (see heldReason)
     *
     * @type {Boolean}
     */
    held() {
      return !!this.heldReason;
    },
  },
  watch: {
    scrollTo() {
      this.$refs.cue_list.scrollTo(0, this.scrollTo);
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
      }
    },
    /**
     * Handles chase creation
     *
     * @param {Object} gridIndex the grid cell index on which the chase should be created.
     */
    addChase(gridIndex) {
      if (!this.master) {
        const chase = this.group.addChase({
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
        this.selectChase(chase);
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
          Math.floor((e.clientY - ctx.startY + CHASE_ROW_HEIGHT / 2) / CHASE_ROW_HEIGHT),
          0,
        ),
        this.poolsize - 1,
      );
      tick = this.chases.find((chase) => chase.id === tick) ? ctx.chase.id : tick;
      ctx.chaseEl.style.top = `${tick * CHASE_ROW_HEIGHT}px`;
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
.uikit_vuemeter_dot {
  height: 10px;
  width: 10px;
  border-radius: var(--radius-round);
  box-shadow: inset 1px 1px 2px var(--primary-dark);
  background: var(--secondary-dark);
  transition: all .2s;
}
/* Sent after the masters: the column's colour; asked for but held back: a faint tint of it */
.uikit_vuemeter_dot.sent {
  background: var(--dot-color);
}
.uikit_vuemeter_dot.asked {
  background: color-mix(in srgb, var(--dot-color) 30%, var(--secondary-dark));
}
.uikit_cue_container_isolate_space {
  height: var(--button-height);
}
.uikit_cue_container {
  display: flex;
  height: 100%;
  min-width: 120px;
  max-width: 120px;
  width: 100%;
  border-right: var(--border-width) solid var(--primary-dark);
  background: var(--primary-light);
  flex-direction: column;
}
.uikit_cue_container.selected, .uikit_cue_container.selected .uikit_cue_container_body_modifiers {
  background: var(--primary-lighter-alt);
}
.uikit_cue_container.master {
  border-right: none !important;
  border-left: var(--border-width) solid var(--primary-dark) !important;
}
.uikit_cue_container_header {
  display: flex;
  width: 100%;
  height: 30px;
  min-height: 30px;
  max-height: 30px;
  align-items: center;
  padding: 0 var(--space-4);
  border-bottom: var(--border-width) solid var(--primary-dark);
  border-top: 3px solid rebeccapurple;
}
.uikit_cue_container_header_dot{
  min-height: 8px;
  min-width: 8px;
  border: var(--border-width) solid transparent;
  border-radius: var(--radius-round);
  margin-right: var(--space-4);
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
  /* the row pitch minus its bottom border (fixed geometry) */
  height: calc(var(--chase-row-height) - 1px);
  min-height: calc(var(--chase-row-height) - 1px);
  background: var(--primary-lighter-alt);
  /* part of the row pitch: stays 1px whatever --border-width is */
  border-bottom: 1px solid var(--primary-dark);
  box-sizing: content-box;
}
.uikit_cue_container_empty_cue:nth-child(even) {
  background: var(--primary-light-alt);
}
.selected .uikit_cue_container_empty_cue {
  background: var(--primary-lighter-alt);
}
.selected .uikit_cue_container_empty_cue:nth-child(even) {
  background: var(--primary-lighter-alt);
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
  border: var(--border-width) solid var(--primary-light);
}
.uikit_cue_container_body_modifiers {
  padding: var(--space-7) 0px;
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
  height: calc(var(--chase-row-height) - 1px);
  width: 100%;
  /* part of the row pitch: stays 1px whatever --border-width is */
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
  background: var(--on-color-surface);
}
.selected > .uikit_chase_btn {
  background: rgba(255, 255, 255, 0.4);
}
.uikit_chase_icon {
  height: var(--icon-sm) !important;
  width: var(--icon-sm) !important;
  fill: var(--on-color-text);
}
.playing .uikit_chase_icon {
  height: var(--icon-xs) !important;
  width: var(--icon-xs) !important;
  animation: load linear 0.8s infinite alternate !important;
}
.uikit_chase_title {
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  width: 100%;
  height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--on-color-text) !important;
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
