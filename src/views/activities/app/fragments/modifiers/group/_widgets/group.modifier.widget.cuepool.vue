<template>
  <uk-widget
    class="cuepool_widget"
    dockable
    :header="header"
  >
    <!-- One column per family: a group plays one cue per family at a time -->
    <div class="cue_columns">
      <div
        v-for="column in columns"
        :key="column.key"
        class="cue_column"
        :class="`cue_column_${column.key}`"
      >
        <!-- The family, its add button, and where it comes from now -->
        <div class="cue_column_head">
          <div class="cue_column_title">
            <span
              class="cue_column_icon"
              :class="maskIcons[column.icon]"
            />
            <h4 class="cue_column_label">
              {{ column.label }}
            </h4>
            <uk-button
              class="cue_column_add"
              icon="new"
              label="add"
              :title="`Add a cue to ${column.label}`"
              @click="displayAddPopup(column)"
            />
          </div>
          <div
            class="cue_column_now"
            :class="`now_${nowColumns[column.key].state}`"
            :title="nowTitle(column)"
          >
            <span
              v-if="nowColumns[column.key].value"
              class="cue_now_value"
              :class="`value_${nowColumns[column.key].value.kind}`"
            >
              <span
                class="value_fill"
                :style="nowColumns[column.key].value.style"
              />
            </span>
            <p class="cue_column_now_text">
              {{ nowColumns[column.key].text }}
            </p>
          </div>
        </div>
        <!-- Its cues as list rows: hover, selection, keys, the grip to reorder, the trash -->
        <uk-list
          class="cue_column_list"
          :items="column.items"
          :selection="selectionIds"
          draggable
          deletable
          no-highlight
          tall
          empty-text="No cues"
          @select="selectRow"
          @reorder="(e) => reorder(column, e)"
          @delete="deleteCues"
        >
          <template #row="{ item }">
            <!-- Playing: a fill grows across the row with its progress, as a playing chase's;
                 kept (the stage keeps its values): the fill stays where it stopped -->
            <span
              v-if="isPlaying(item.cue) || isKept(item.cue)"
              class="cue_chip_fill"
              :style="{ width: fillOf(item.cue) }"
            />
            <span
              class="cue_chip"
              :class="chipClass(item.cue)"
              :data-cue="item.cue.id"
              :title="item.cue.name"
            >
              <!-- Its picture, its play button over it while the pointer is on the row (its stop
                   button whenever it plays): plays or stops it with its fades, held down for a
                   Temporary cue -->
              <span class="cue_chip_picture">
                <uk-cue-picture :picture="pictureOf(item.cue)" />
                <span
                  class="cue_chip_play"
                  :title="isPlaying(item.cue) ? 'Stop' : 'Play'"
                  @click.stop="playCue(item.cue)"
                  @pointerdown.stop="pressCue(item.cue, $event)"
                >
                  <span
                    class="cue_chip_play_icon"
                    :class="maskIcons[isPlaying(item.cue) ? 'stop' : 'play']"
                  />
                </span>
              </span>
              <span class="cue_chip_text">
                <span class="cue_chip_title">
                  <span
                    class="cue_chip_type"
                    :class="maskIcons[item.cue.type ? 'waveform' : 'mixer']"
                  />
                  <h4 class="cue_chip_name">{{ item.cue.name }}</h4>
                </span>
                <!-- Its values in words -->
                <p class="cue_chip_value">
                  {{ summaryOf(item.cue) }}
                </p>
              </span>
            </span>
            <!-- On, but every family it sets is held by other cues -->
            <span
              v-if="chipClass(item.cue).covered"
              class="cue_chip_covered"
            />
          </template>
        </uk-list>
      </div>
    </div>
    <popup-cue-pool
      v-model="cuePopupDisplayState"
      :family="addFamily"
      :group="group"
      @add="addCue"
    />
  </uk-widget>
</template>

<script>
import { toRaw } from 'vue';
import modal from '@/views/mixins/modal.mixin';
import LiveMixin from '@/views/mixins/live.mixin';
import { CUE_TRIGGER_STYLES } from '@/models/DMX/cue.model';
import { FAMILY_KEYS, familyIndex } from '@/models/DMX/families';
import { sharedContent } from '@/views/utils/cue.previews';
import { familyNow } from '@/views/utils/cue.now';
import { FAMILY_LOOKS } from '@/views/utils/cue.families';
import { maskClass } from '@/views/components/uikit/icons/icon.mask';
import popupCuePool from '../_popups/group.modifier.popup.cuepool.vue';

/**
 * The columns: the families in their order
 *
 * @constant {Array<Object>} COLUMNS
 */
const COLUMNS = FAMILY_KEYS.map((key) => ({
  key,
  label: FAMILY_LOOKS[key].label,
  icon: FAMILY_LOOKS[key].icon,
}));

/**
 * Icons drawn as masks on the rows and heads, as classes (a component per row slows the panel
 * down, a style object is set again on every render)
 *
 * @constant {Object} MASK_ICONS
 */
const MASK_ICONS = Object.fromEntries(['mixer', 'waveform', 'play', 'stop',
  ...Object.values(FAMILY_LOOKS).map((look) => look.icon)].map((name) => [name, maskClass(name)]));

/**
 * @component GroupModifierWidgetCuepool The group's cues, one column per family, as list rows:
 * NOW says where each family comes from (read only); a row pictures what its cue sets and says it
 * in words; a click (or the keys) opens the cue, never plays it (programming is blind); its play
 * button plays and stops it with its fades, a fill across the row showing its progress (kept where
 * it stopped while the stage keeps its values); **add** adds a cue to a column; the grip reorders
 * a column, the trash deletes
 */
export default {
  name: 'GroupModifierWidgetCuepool',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    popupCuePool,
  },
  mixins: [LiveMixin],
  props: {
    /**
     * Handle to group instance
     */
    group: {
      type: Object,
      default: () => ({
        cuePool: {
          cues: [],
        },
      }),
    },
  },
  emits: ['add'],
  data() {
    return {
      /**
       * Temporary cue held down with the pointer (stops on release)
       */
      heldCue: null,
      /**
       * Widget header data
       */
      header: {
        title: 'Cue Pool',
        icon: 'grid',
      },
      /**
       * Icons of the rows and heads, as mask classes
       */
      maskIcons: MASK_ICONS,
      /**
       * Family of the column a cue is being added to
       */
      addFamily: FAMILY_KEYS[0],
    };
  },
  computed: {
    /**
     * Cue creation popup display state
     */
    cuePopupDisplayState: modal('cuepool.add', 'group'),
    /**
     * The group's cues
     *
     * @type {Array<Object>}
     */
    cues() {
      return this.group ? this.group.cuePool.cues : [];
    },
    /**
     * The columns and their cues, in id order
     *
     * @type {Array<Object>}
     */
    columns() {
      return COLUMNS.map((column) => {
        const cues = this.cues.filter((cue) => cue.family === column.key)
          .sort((a, b) => a.id - b.id);
        // The rows of its list: keyed by cue id
        return { ...column, cues, items: cues.map((cue) => ({ id: cue.id, name: cue.name, cue })) };
      });
    },
    /**
     * The selected cue's id, for the columns' lists (the one holding it shows it selected)
     *
     * @type {Array<Number>}
     */
    selectionIds() {
      return this.selectedCue == null ? [] : [this.selectedCue];
    },
    /**
     * Each cue's picture and value line, by id (recomputed when a cue is edited)
     *
     * @type {Object}
     */
    contentById() {
      const byId = {};
      this.cues.forEach((cue) => {
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
     * Id of the group's selected cue (from the view state)
     *
     * @type {?Number}
     */
    selectedCue() {
      // Outside the app (the manual's home story) there is no view state: no selection
      if (!this.$view || !this.group || this.$view.group?.id !== this.group.id) return null;
      return this.$view.cue?.id ?? null;
    },
    /**
     * What each column's NOW shows, refreshed with the live ticker
     *
     * @type {Object}
     */
    nowColumns() {
      // Holders and values change outside Vue (playback): read them with the live ticker
      this.live(null);
      const now = {};
      COLUMNS.forEach((column) => {
        now[column.key] = familyNow(this.group, familyIndex(column.key));
      });
      return now;
    },
  },
  beforeUnmount() {
    this.releaseHeldCue();
  },
  methods: {
    /**
     * Whether a cue is playing: started, played by a chase, or held by an ended chase item
     *
     * @public
     * @param {Object} cue handle to cue instance
     * @returns {Boolean} playing state
     */
    isPlaying(cue) {
      return !!this.live(cue.state || cue.chaseActive || cue.holdsItem);
    },
    /**
     * A cue's picture
     *
     * @public
     * @param {Object} cue
     * @returns {?Object}
     */
    pictureOf(cue) {
      return this.contentById[cue.id]?.picture || null;
    },
    /**
     * Classes of a cue's picture: its kind, or empty
     *
     * @public
     * @param {Object} cue
     * @returns {Object}
     */
    pictureClass(cue) {
      const picture = this.pictureOf(cue);
      return picture ? `picture_${picture.kind}` : 'empty';
    },
    /**
     * A cue's value line
     *
     * @public
     * @param {Object} cue
     * @returns {String}
     */
    summaryOf(cue) {
      return this.contentById[cue.id]?.summary || '';
    },
    /**
     * A chip's state classes: selected, playing, covered (playing, every family held by other
     * cues)
     *
     * @public
     * @param {Object} cue
     * @returns {Object}
     */
    chipClass(cue) {
      const playing = this.isPlaying(cue);
      const holds = this.live(cue.heldFamilies).some(Boolean);
      return {
        selected: this.selectedCue === cue.id,
        playing,
        kept: !playing && this.isKept(cue),
        covered: playing && !!this.pictureOf(cue) && !holds,
      };
    },
    /**
     * Whether the stage keeps a stopped cue's values: nobody holds its family since it stopped
     * (NOW reads "kept:" it)
     *
     * @public
     * @param {Object} cue
     * @returns {Boolean}
     */
    isKept(cue) {
      const now = this.nowColumns[cue.family];
      return !!now && now.state === 'kept' && now.kept === toRaw(cue);
    },
    /**
     * Width of a row's fill: a playing cue's progress (a scene's fade, an effect's pass), a kept
     * cue's where it stopped
     *
     * @public
     * @param {Object} cue
     * @returns {String} CSS width
     */
    fillOf(cue) {
      const progress = this.isPlaying(cue) ? cue.progress : cue.stopProgress;
      return `${Math.round(this.live(progress) * 100)}%`;
    },
    /**
     * Tooltip of a column's NOW: where the family comes from
     *
     * @public
     * @param {Object} column
     * @returns {String}
     */
    nowTitle(column) {
      const now = this.nowColumns[column.key];
      if (now.state === 'kept') {
        return `${column.label} keeps ${now.text.slice('kept: '.length)}'s last value: no cue `
          + 'holds it';
      }
      if (now.state === 'held') return `${column.label} comes from ${now.text}`;
      return `${column.label} rests: no cue holds it`;
    },
    /**
     * A row selected in a column's list (a click, the keys, or the row a drag moved): opens its
     * cue, never plays it
     *
     * @public
     * @param {Object} item the row's item
     */
    selectRow(item) {
      this.selectCue(item.cue);
    },
    /**
     * Selects a cue: its editor opens
     *
     * @public
     * @param {?Object} cue handle to cue instance
     */
    selectCue(cue) {
      if (!this.$view) return;
      if (this.group && this.$view.group?.id !== this.group.id) this.$view.openGroup(this.group.id);
      this.$view.selectCue(cue ? cue.id : null);
    },
    /**
     * Plays or stops a cue with its fades (its play button); a cue on stage through an ended
     * chase item is released
     *
     * @public
     * @param {Object} cue handle to cue instance
     */
    playCue(cue) {
      // A Temporary cue plays while held (see pressCue): the click after the release is ignored
      if (cue.triggerStyle === CUE_TRIGGER_STYLES.TEMPORARY) return;
      if (!cue.state && cue.holdsItem) cue.releaseItem();
      else cue.cue(true);
      this.$liveTicker.bump();
    },
    /**
     * Starts a Temporary cue while the pointer is held on its play button, until the button is
     * released (anywhere) or the press is cancelled
     *
     * @public
     * @param {Object} cue handle to cue instance
     * @param {PointerEvent} e pointerdown event
     */
    pressCue(cue, e) {
      if (cue.triggerStyle !== CUE_TRIGGER_STYLES.TEMPORARY || e.button !== 0) return;
      this.releaseHeldCue();
      // Not playing, or fading out: (re)start it
      if (cue.animationId == null || cue.releasing) cue.cue(true);
      this.heldCue = cue;
      window.addEventListener('pointerup', this.releaseHeldCue);
      window.addEventListener('pointercancel', this.releaseHeldCue);
    },
    /**
     * Stops the Temporary cue held down, if any
     *
     * @public
     */
    releaseHeldCue() {
      window.removeEventListener('pointerup', this.releaseHeldCue);
      window.removeEventListener('pointercancel', this.releaseHeldCue);
      const cue = this.heldCue;
      this.heldCue = null;
      if (cue && cue.animationId != null) cue.cue(false);
    },
    /**
     * Opens Add Cue for a column
     *
     * @public
     * @param {Object} column
     */
    displayAddPopup(column) {
      this.addFamily = column.key;
      this.cuePopupDisplayState = true;
    },
    /**
     * A cue was added: opens it as a click does, and propagates the event
     *
     * @public
     * @param {Object} cue handle to cue instance
     */
    addCue(cue) {
      this.selectCue(cue);
      this.$emit('add', cue);
    },
    /**
     * Deletes cues from the group (a column's trash or Delete, confirmed)
     *
     * @public
     * @param {Array<Object>} items the rows' items
     */
    deleteCues(items) {
      items.forEach((item) => this.group.deleteCue(item.cue));
    },
    /**
     * A column's list reordered: the column's ids are given out again in the new order (ids stay
     * unique, other columns keep theirs), the selection follows its cue
     *
     * @public
     * @param {Object} column
     * @param {Object} move `{ original, final }` row indexes
     */
    reorder(column, { original, final }) {
      const order = column.cues.slice();
      const ids = order.map((cue) => cue.id);
      const selected = this.cues.find((cue) => cue.id === this.selectedCue);
      const [moved] = order.splice(original, 1);
      order.splice(final, 0, moved);
      order.forEach((cue, i) => { cue.id = ids[i]; });
      if (selected && this.$view) this.$view.selectCue(selected.id);
    },
  },
};
</script>

<style scoped>
.cuepool_widget {
  /* Four columns of list rows */
  width: 772px;
  max-width: 772px !important;
  min-width: 772px !important;
}
.cue_columns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--border-width);
  height: 100%;
  width: 100%;
  background: var(--primary-dark);
}
/* One surface, heads and rows alike, as a list */
.cue_column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--primary-light);
}
.cue_column_head {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-bottom: var(--border-width) solid var(--primary-dark);
}
/* The title and NOW: two lines a list row high, as the rows under them */
.cue_column_title,
.cue_column_now {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  height: var(--row-height);
  padding: 0 var(--space-4);
}
.cue_column_title {
  gap: var(--space-2);
}
.cue_column_icon {
  flex-shrink: 0;
  width: var(--icon-xs);
  height: var(--icon-xs);
  background-color: var(--secondary-lighter);
}
.cue_column_label {
  flex: 1;
  min-width: 0;
  font-size: var(--font-xs);
  text-transform: uppercase;
  color: var(--secondary-lighter);
}
.cue_column_add {
  flex-shrink: 0;
}
/* Kept: nobody holds the family, the stage keeps a stopped cue's value */
.cue_column_now.now_kept {
  background: var(--idle-stripes);
}
.cue_column_now_text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-sm);
  color: var(--secondary-lighter);
}
.now_rest .cue_column_now_text {
  color: var(--secondary-light);
}
.cue_now_value {
  position: relative;
  flex-shrink: 0;
  width: var(--icon-md);
  height: var(--icon-md);
  border-radius: var(--radius-sm);
  background: var(--primary-dark);
  overflow: hidden;
}
.value_swatch .value_fill {
  position: absolute;
  inset: 0;
}
.value_level .value_fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--secondary-lighter);
}
.value_dot .value_fill {
  position: absolute;
  width: var(--space-2);
  height: var(--space-2);
  margin: 0 0 calc(var(--space-2) / -2) calc(var(--space-2) / -2);
  border-radius: var(--radius-round);
  background: var(--secondary-lighter);
}
.cue_column_list {
  flex: 1;
  min-height: 0;
}
/* A row's content (the list's row slot): picture, name and value line, play button */
.cue_chip {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
  height: 100%;
}
.cue_chip_text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
}
.cue_chip_title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}
.cue_chip_type {
  flex-shrink: 0;
  width: var(--icon-xs);
  height: var(--icon-xs);
  background-color: var(--secondary-lighter);
}
.cue_chip_name,
.cue_chip_value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cue_chip_name {
  font-family: Roboto-medium;
}
.cue_chip_value {
  font-size: var(--font-xs);
  color: var(--secondary-lighter);
}
/* The picture and the play button over it: shown while the pointer is on the row, the picture
   dimmed under it; the stop button whenever the cue plays */
.cue_chip_picture {
  position: relative;
  display: flex;
  flex-shrink: 0;
}
.cue_chip_picture .uikit_cue_picture {
  transition: opacity 0.15s, filter 0.15s;
}
.uikit_list_item:hover .cue_chip_picture .uikit_cue_picture,
.cue_chip.playing .cue_chip_picture .uikit_cue_picture {
  opacity: var(--opacity-dimmed);
  filter: blur(1px);
}
.cue_chip_play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}
.uikit_list_item:hover .cue_chip_play,
.cue_chip.playing .cue_chip_play {
  opacity: 1;
}
.cue_chip_play_icon {
  width: var(--icon-sm);
  height: var(--icon-sm);
  background-color: var(--secondary-lighter);
}
/* Playing: its stop button blinks, as a playing chase's in the group pool */
.cue_chip.playing .cue_chip_play_icon {
  animation: cue_blink linear 0.8s infinite alternate;
}
/* Playing: the row fills with its progress (a scene's fade in, an effect's pass); kept: the fill
   stays where it stopped */
.cue_chip_fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--secondary-light);
  pointer-events: none;
}
.cue_chip_covered {
  position: absolute;
  inset: 0;
  background: var(--idle-stripes);
  pointer-events: none;
}
@keyframes cue_blink {
  from {
    background-color: var(--secondary-lighter);
  }
  to {
    background-color: var(--secondary-light);
  }
}
@media (prefers-reduced-motion: reduce) {
  .cue_chip.playing .cue_chip_play_icon {
    animation: none;
  }
}
</style>
