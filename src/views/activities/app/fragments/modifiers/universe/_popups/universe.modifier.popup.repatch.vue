<template>
  <uk-popup
    v-model="state"
    :valid="!conflicting && changes.length > 0"
    :header="headerData"
    @submit="apply"
    @input="update()"
  >
    <uk-flex
      col
      :gap="10"
      class="repatch_popup"
    >
      <uk-flex
        :gap="12"
        class="repatch_body"
      >
        <uk-flex
          col
          :gap="8"
          class="repatch_map_column"
        >
          <universe-map
            :fixtures="shownFixtures"
            :color="shownUniverse ? shownUniverse.color : undefined"
            :selection="selection"
            @select="select"
            @clear="selection = []"
            @move="move"
          />
          <!-- under the grid, from its left edge (past the row addresses) -->
          <div class="repatch_hint">
            Drag a block to move it, Ctrl/⌘ or Shift-click to select several. Pick another universe
            to move the selection there. Nothing changes until OK.
          </div>
        </uk-flex>
        <uk-flex
          col
          :gap="8"
          class="repatch_side"
        >
          <uk-select-input
            :model-value="shownIndex"
            label="Universe"
            :options="universeNames"
            @update:model-value="showUniverse"
          />
          <uk-select-input
            :model-value="selectedIndex"
            label="Selection"
            :placeholder="selectionPlaceholder"
            :options="fixtureOptions"
            @update:model-value="selectIndex"
          />
          <div class="repatch_changes_block">
            <div class="label">
              Changes{{ changes.length ? ` (${changes.length})` : '' }}
            </div>
            <div class="repatch_changes">
              <uk-list
                :items="changeItems"
                :selection="selection"
                empty-text="Nothing moved yet"
                no-highlight
                @selection="selectFromList"
              />
            </div>
          </div>
          <uk-flex
            col
            :gap="4"
          >
            <uk-button
              square
              class="repatch_action"
              label="Move to free range"
              :disabled="!freePlan"
              :title="freeTitle"
              @click="applyPlan(freePlan)"
            />
            <uk-button
              square
              class="repatch_action"
              label="Remove gaps"
              :disabled="!packPlan"
              title="Closes the gaps between this universe's fixtures, keeping their order"
              @click="applyPlan(packPlan)"
            />
            <uk-button
              square
              class="repatch_action"
              label="Reset"
              :disabled="!changes.length"
              title="Puts every fixture back where it is patched now"
              @click="reset"
            />
          </uk-flex>
          <universe-message
            v-for="(message, index) in messages"
            :key="index"
            :level="message.level"
          >
            {{ message.text }}
          </universe-message>
        </uk-flex>
      </uk-flex>
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';
import EventBus from '@/plugins/eventbus';
import { dmxAddress } from '@/views/utils/dmx';
import UniverseMap from '../_widgets/universe.modifier.map.vue';
import UniverseMessage from '../_widgets/universe.modifier.message.vue';

/**
 * Addresses in a universe
 *
 * @constant {Number} UNIVERSE_LENGTH
 */
const UNIVERSE_LENGTH = 512;

/**
 * Text of an address range, 1-based
 *
 * @param {Number} start first address (0-based)
 * @param {Number} count address count
 * @returns {String} `first–last`
 */
function rangeText(start, count) {
  return count > 1 ? `${dmxAddress(start)}–${dmxAddress(start + count - 1)}` : `${dmxAddress(start)}`;
}

/**
 * @component RepatchPopup Moves fixtures on a universe map (in their universe or another) as a
 * draft, applied all at once on OK through UniversePool.repatch
 */
export default {
  name: 'UniverseModifierPopupRepatch',
  compatConfig: {
    MODE: 3,
  },
  components: {
    UniverseMap,
    UniverseMessage,
  },
  mixins: [PopupMixin],
  props: {
    /**
     * Fixture the popup was opened from (selected first)
     */
    fixture: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      headerData: { title: 'Repatch' },
      /**
       * Draft position of every fixture: `{ [id]: { universe, chStart } }`
       */
      draft: {},
      /**
       * Id of the universe shown
       */
      shownId: 0,
      /**
       * Ids of the selected fixtures
       */
      selection: [],
    };
  },
  computed: {
    /**
     * Every patched fixture of the show
     */
    allFixtures() {
      return this.$show.universePool.universes.flatMap((universe) => universe.fixturePool.fixtures);
    },
    universeNames() {
      return this.$show.universePool.universes.map((universe) => universe.name);
    },
    shownIndex() {
      return this.$show.universePool.universes.findIndex((u) => Number(u.id) === this.shownId);
    },
    shownUniverse() {
      return this.$show.universePool.universes[this.shownIndex] || null;
    },
    /**
     * Fixtures drawn on the map: those the draft puts in the shown universe
     */
    shownFixtures() {
      return this.allFixtures
        .filter((fixture) => this.draft[fixture.id]?.universe === this.shownId)
        .map((fixture) => ({
          id: fixture.id,
          name: fixture.name,
          chStart: this.draft[fixture.id].chStart,
          count: fixture.chCount,
        }));
    },
    /**
     * Problems of the draft, every universe: overlapping pairs and fixtures past 512
     */
    problems() {
      const overlaps = [];
      const outside = [];
      const byUniverse = new Map();
      this.allFixtures.forEach((fixture) => {
        const place = this.draft[fixture.id];
        if (!place) return;
        if (!byUniverse.has(place.universe)) byUniverse.set(place.universe, []);
        byUniverse.get(place.universe).push({
          fixture, start: place.chStart, stop: place.chStart + fixture.chCount,
        });
      });
      byUniverse.forEach((list, universe) => {
        list.forEach((a, i) => {
          if (a.start < 0 || a.stop > UNIVERSE_LENGTH) outside.push({ ...a, universe });
          list.slice(i + 1).forEach((b) => {
            if (a.start < b.stop && b.start < a.stop) {
              const start = Math.max(a.start, b.start);
              const stop = Math.min(a.stop, b.stop);
              overlaps.push({
                a: a.fixture, b: b.fixture, universe, start, count: stop - start,
              });
            }
          });
        });
      });
      return { overlaps, outside };
    },
    conflicting() {
      return this.problems.overlaps.length > 0 || this.problems.outside.length > 0;
    },
    /**
     * Fixtures the draft moves: `{ fixture, universe, chStart }`
     */
    changes() {
      return this.allFixtures
        .filter((fixture) => {
          const place = this.draft[fixture.id];
          return place && (place.universe !== Number(fixture.universe)
            || place.chStart !== fixture.chStart);
        })
        .map((fixture) => ({ fixture, ...this.draft[fixture.id] }));
    },
    /**
     * Rows of the changes list: before → after
     */
    changeItems() {
      return this.changes.map(({ fixture, universe, chStart }) => {
        const before = rangeText(fixture.chStart, fixture.chCount);
        const after = rangeText(chStart, fixture.chCount);
        const across = universe !== Number(fixture.universe);
        return {
          id: fixture.id,
          name: fixture.name,
          more: across
            ? `${this.universeName(fixture.universe)} ${before} → ${this.universeName(universe)} ${after}`
            : `${before} → ${after}`,
        };
      });
    },
    /**
     * Errors (OK stays disabled) and warnings about the draft
     */
    messages() {
      const errors = [
        ...this.problems.overlaps.map(({
          a, b, universe, start, count,
        }) => ({
          level: 'error',
          text: `${a.name} (${this.draftRange(a)}) and ${b.name} (${this.draftRange(b)}) overlap on `
            + `${this.universeName(universe)}, addresses ${rangeText(start, count)}.`,
        })),
        ...this.problems.outside.map(({ fixture, universe }) => ({
          level: 'error',
          text: `${fixture.name} goes past address ${UNIVERSE_LENGTH} of ${this.universeName(universe)}.`,
        })),
      ];
      const warnings = this.changes
        .filter(({ fixture, universe }) => universe !== Number(fixture.universe))
        .map(({ fixture, universe }) => ({
          level: 'warning',
          text: `${fixture.name} moves to ${this.universeName(universe)}: it will output through that universe's connections.`,
        }));
      return [...errors, ...warnings];
    },
    /**
     * Options of the selection select: the shown universe's fixtures, by address
     */
    fixtureOptions() {
      const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;');
      return this.sortedShown.map((fixture) => `${escape(fixture.name)} · ${rangeText(fixture.chStart, fixture.count)}`);
    },
    /**
     * Shown fixtures in address order
     */
    sortedShown() {
      return [...this.shownFixtures].sort((a, b) => a.chStart - b.chStart);
    },
    /**
     * Option of the selected fixture, null when none or several are selected
     */
    selectedIndex() {
      if (this.selection.length !== 1) return null;
      const index = this.sortedShown.findIndex((fixture) => fixture.id === this.selection[0]);
      return index < 0 ? null : index;
    },
    /**
     * What the selection select shows when it has no single fixture
     */
    selectionPlaceholder() {
      if (this.selection.length > 1) {
        const channels = this.selectedFixtures().reduce((sum, fixture) => sum + fixture.chCount, 0);
        return `${this.selection.length} fixtures, ${channels} channels`;
      }
      if (this.selection.length === 1) return 'In another universe';
      return 'None';
    },
    /**
     * Where Move to free range would put the selection: `{ [id]: chStart }`, null if nowhere or
     * if it is already there
     */
    freePlan() {
      const moving = this.selectedFixtures();
      if (!moving.length) return null;
      const total = moving.reduce((sum, fixture) => sum + fixture.chCount, 0);
      const taken = new Array(UNIVERSE_LENGTH).fill(false);
      this.allFixtures.forEach((fixture) => {
        const place = this.draft[fixture.id];
        if (!place || place.universe !== this.shownId) return;
        if (this.selection.includes(fixture.id)) return;
        for (let i = Math.max(0, place.chStart); i < place.chStart + fixture.chCount; i++) {
          if (i < UNIVERSE_LENGTH) taken[i] = true;
        }
      });
      let start = -1;
      for (let i = 0; i + total <= UNIVERSE_LENGTH && start < 0; i++) {
        let free = true;
        for (let j = i; j < i + total && free; j++) free = !taken[j];
        if (free) start = i;
      }
      if (start < 0) return null;
      const plan = {};
      moving.forEach((fixture) => {
        plan[fixture.id] = start;
        start += fixture.chCount;
      });
      return this.planChanges(plan) ? plan : null;
    },
    freeTitle() {
      if (!this.selection.length) return 'Select fixtures first';
      if (!this.freePlan && !this.selectionFits) {
        return `No free range in ${this.shownUniverse?.name} fits the selection`;
      }
      return 'Puts the selection, back to back, at the first free addresses of '
        + `${this.shownUniverse?.name}`;
    },
    /**
     * Whether the selection fits somewhere in the shown universe (for the button's tooltip)
     */
    selectionFits() {
      const total = this.selectedFixtures().reduce((sum, fixture) => sum + fixture.chCount, 0);
      return total <= UNIVERSE_LENGTH;
    },
    /**
     * Where Remove gaps would put the shown universe's fixtures, null if already packed
     */
    packPlan() {
      let start = 0;
      const plan = {};
      this.allFixtures
        .filter((fixture) => this.draft[fixture.id]?.universe === this.shownId)
        .sort((a, b) => this.draft[a.id].chStart - this.draft[b.id].chStart)
        .forEach((fixture) => {
          plan[fixture.id] = start;
          start += fixture.chCount;
        });
      return this.planChanges(plan) ? plan : null;
    },
  },
  watch: {
    state(state) {
      if (state) this.init();
      else this.$view.previewFixtures(null);
    },
    selection(ids) {
      // The 3D view shows the fixtures being moved while the popup is open
      if (this.state) this.$view.previewFixtures(ids);
    },
  },
  beforeUnmount() {
    if (this.state) this.$view.previewFixtures(null);
  },
  methods: {
    /**
     * Starts a draft from the current patch, showing the fixture's universe with it selected
     *
     * @public
     */
    init() {
      this.reset();
      this.shownId = this.fixture ? Number(this.fixture.universe)
        : Number(this.$show.universePool.universes[0]?.id ?? 0);
      this.selection = this.fixture ? [this.fixture.id] : [];
      this.$view.previewFixtures(this.selection);
    },
    /**
     * Puts every fixture back where it is patched
     *
     * @public
     */
    reset() {
      const draft = {};
      this.allFixtures.forEach((fixture) => {
        draft[fixture.id] = { universe: Number(fixture.universe), chStart: fixture.chStart };
      });
      this.draft = draft;
    },
    /**
     * Name of a universe
     *
     * @public
     * @param {Number} id universe id
     * @returns {String} its name, else `U<id>`
     */
    universeName(id) {
      const universe = this.$show.universePool.universes.find((u) => Number(u.id) === Number(id));
      return universe ? universe.name : `U${id}`;
    },
    /**
     * Draft address range of a fixture
     *
     * @public
     * @param {Object} fixture fixture
     * @returns {String} `first–last`, 1-based
     */
    draftRange(fixture) {
      return rangeText(this.draft[fixture.id].chStart, fixture.chCount);
    },
    /**
     * Shows another universe (the selection stays: Move to free range brings it here)
     *
     * @public
     * @param {Number} index universe index
     */
    showUniverse(index) {
      const universe = this.$show.universePool.universes[index];
      if (universe) this.shownId = Number(universe.id);
    },
    /**
     * Selects a fixture, or adds / removes it from the selection
     *
     * @public
     * @param {Number} id fixture id
     * @param {Boolean} additive Ctrl/⌘ or Shift
     */
    select(id, additive) {
      if (!additive) {
        this.selection = [id];
      } else if (this.selection.includes(id)) {
        this.selection = this.selection.filter((other) => other !== id);
      } else {
        this.selection = [...this.selection, id];
      }
    },
    /**
     * Selects a fixture from the selection select
     *
     * @public
     * @param {Number} index option index
     */
    selectIndex(index) {
      const fixture = this.sortedShown[index];
      if (fixture) this.selection = [fixture.id];
    },
    /**
     * Selection from the changes list: shows the universe of its first fixture
     *
     * @public
     * @param {Array<Object>} items selected rows
     */
    selectFromList(items) {
      this.selection = items.map((item) => item.id);
      const place = this.draft[this.selection[0]];
      if (place) this.shownId = place.universe;
    },
    /**
     * Moves the selected fixtures of the shown universe by some addresses
     *
     * @public
     * @param {Number} delta addresses (a row is 32)
     */
    move(delta) {
      this.selection.forEach((id) => {
        const place = this.draft[id];
        if (place && place.universe === this.shownId) {
          this.draft[id] = { ...place, chStart: place.chStart + delta };
        }
      });
    },
    /**
     * Fixtures of the selection, in their draft order
     *
     * @public
     * @returns {Array<Object>} fixtures
     */
    selectedFixtures() {
      return this.allFixtures
        .filter((fixture) => this.selection.includes(fixture.id) && this.draft[fixture.id])
        .sort((a, b) => (this.draft[a.id].universe - this.draft[b.id].universe)
          || (this.draft[a.id].chStart - this.draft[b.id].chStart));
    },
    /**
     * Whether a plan moves anything in the draft
     *
     * @public
     * @param {Object} plan `{ [id]: chStart }` in the shown universe
     * @returns {Boolean} true if a fixture would move
     */
    planChanges(plan) {
      return Object.entries(plan).some(([id, chStart]) => {
        const place = this.draft[id];
        return !place || place.universe !== this.shownId || place.chStart !== chStart;
      });
    },
    /**
     * Puts fixtures where a plan says, in the shown universe
     *
     * @public
     * @param {?Object} plan `{ [id]: chStart }`
     */
    applyPlan(plan) {
      if (!plan) return;
      Object.entries(plan).forEach(([id, chStart]) => {
        this.draft[id] = { universe: this.shownId, chStart };
      });
    },
    /**
     * Applies the draft (UniversePool.repatch checks it again and changes nothing if invalid)
     *
     * @public
     */
    apply() {
      try {
        this.$show.universePool.repatch(this.changes);
        this.close();
      } catch (err) {
        EventBus.emit('app_error', err);
      }
    },
  },
};
</script>

<style scoped>
.repatch_popup {
  font-family: Roboto-Regular;
  width: 960px;
  max-width: calc(100vw - 2 * var(--space-10));
  padding: var(--space-6);
  box-sizing: border-box;
}
.repatch_body {
  align-items: flex-start;
}
.repatch_map_column {
  flex: 1;
  min-width: 0;
}
.repatch_side {
  width: 270px;
  flex-shrink: 0;
  /* as tall as the map (16 rows of 28px and its border), the changes list taking what's left */
  height: calc(16 * 28px + 2px);
}
.repatch_changes_block {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.repatch_action {
  width: 100%;
  height: var(--control-height);
}
.repatch_changes {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: var(--border-width) solid var(--primary-dark);
  overflow: hidden;
}
.repatch_hint {
  /* the map's row addresses are 34px wide */
  padding-left: 34px;
  color: var(--secondary-light-alt);
  font-size: var(--font-xs);
  white-space: normal;
}
</style>
