<template>
  <uk-flex class="universe_modifier">
    <universe-settings-widget :model-value="universe" />
    <universe-output-widget :universe="universe" />
    <fixture-pool-widget
      :pool="universe.fixturePool"
      :action="{
        icon: 'new',
        text: 'add',
        callback: displayPatchPopup,
      }"
      :selection="selectedIds"
      @selection="selectFixtures"
      @delete="deleteFixtures"
    />
    <fixture-settings-widget
      v-show="selectedFixture"
      ref="settings"
      :fixture="selectedFixture"
      @repatch="repatchPopupDisplayState = true"
    />
    <position-tool-widget
      v-show="selectedFixture"
      ref="positionTool"
      :fixtures="selectedFixtures"
      :universe-fixtures="universe.fixturePool?.fixtures || []"
      :others="otherFixtures"
      @arrange="arrangePopupDisplayState = true"
      @selection="selectFixtures"
    />
    <modifier-widget-cells
      v-if="selectedFixture && selectedFixture.cells.length"
      :key="selectedFixture.id"
      :cells="selectedFixture.cells.map((cell) => cell.name)"
      :model-value="selectedCells"
      @change="selectCells"
    />
    <fixture-channels-widget
      v-show="selectedFixture"
      ref="channels"
      class="fixture_channels"
      :channels="liveChannels"
      :sources="liveSources"
      :held="selectionHeld"
      @input="setChannel"
      @park="toggleParked"
      @clear-channel="clearChannel"
      @clear="clearSelection"
      @unpark="unparkSelection"
    />
    <widget-color-picker
      v-if="selectedFixture && selectedFixture.hasColor"
      ref="colorPicker"
      :model-value="liveColor"
      tabindex="0"
      @update:model-value="setFixtureColor"
    />
    <!-- :rgb-data="selectedFixture ? selectedFixture.color : undefined"
      @input="setFixtureColor" -->
    <pan-tilt-widget
      v-show="selectedFixture && selectedFixture.hasPan && selectedFixture.hasTilt"
      ref="panTiltPicker"
      :pan-tilt="livePanTilt"
      @input="setFixturePanTilt"
    />
    <patch-popup
      v-model="patchPopupDisplayState"
      :universe="universe"
    />
    <repatch-popup
      v-model="repatchPopupDisplayState"
      :fixture="selectedFixture"
    />
    <arrange-popup
      v-model="arrangePopupDisplayState"
      :fixtures="selectedFixtures"
    />
  </uk-flex>
</template>

<script>
import modal from '@/views/mixins/modal.mixin';
import LiveMixin from '@/views/mixins/live.mixin';
import Programmer from '@/models/DMX/programmer';
import { channelSource } from '@/views/utils/channel.source';
import { angleRange } from '@/views/utils/effect.scope';
import FixturePoolWidget from '../_widgets/modifier.widget.fixture.pool.vue';
import FixtureChannelsWidget from '../_widgets/modifier.widget.fixture.channels.vue';
import WidgetColorPicker from '../_widgets/modifier.widget.colorpicker.vue';
import PanTiltWidget from '../_widgets/modifier.widget.pantilt.vue';
import ModifierWidgetCells from '../_widgets/modifier.widget.cells.vue';

import UniverseSettingsWidget from './_widgets/universe.modifier.widget.settings.vue';
import FixtureSettingsWidget from './_widgets/universe.modifier.widget.fixture.settings.vue';
import PositionToolWidget from './_widgets/universe.modifier.widget.fixture.position.tool.vue';
import PatchPopup from './_popups/universe.modifier.popup.patch.vue';
import RepatchPopup from './_popups/universe.modifier.popup.repatch.vue';
import ArrangePopup from './_popups/universe.modifier.popup.arrange.vue';
import UniverseOutputWidget from './_widgets/universe.modifier.widget.output.vue';

export default {
  name: 'UniverseModifierFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    UniverseSettingsWidget,
    UniverseOutputWidget,
    FixturePoolWidget,
    FixtureSettingsWidget,
    PositionToolWidget,
    FixtureChannelsWidget,
    WidgetColorPicker,
    PanTiltWidget,
    ModifierWidgetCells,
    PatchPopup,
    RepatchPopup,
    ArrangePopup,
  },
  mixins: [LiveMixin],
  computed: {
    /**
     * Patch popup display state
     */
    patchPopupDisplayState: modal('universe.patch', 'universe'),
    /**
     * Repatch popup display state
     */
    repatchPopupDisplayState: modal('universe.repatch', 'universe'),
    /**
     * Arrange popup display state
     */
    arrangePopupDisplayState: modal('universe.arrange', 'universe'),
    /**
     * Universe in view (the last one, while another panel is in view)
     *
     * @type {Object}
     */
    universe() {
      return this.$view.universe || {};
    },
    /**
     * Selected fixture ids of the universe. They stay as they are while another panel is in
     * view, so a hidden panel has nothing to update
     *
     * @type {Array<Number>}
     */
    selectedIds() {
      return this.$view.universeFixtures.map((fixture) => fixture.id);
    },
    /**
     * Fixture whose controls are shown: the main selected one
     *
     * @type {?Object}
     */
    selectedFixture() {
      return this.$view.universeFixtures[0] || null;
    },
    /**
     * Selected fixtures in fixture pool order (the order placement follows)
     *
     * @type {Array<Object>}
     */
    selectedFixtures() {
      const ids = new Set(this.selectedIds);
      return (this.universe.fixturePool?.fixtures || []).filter((fixture) => ids.has(fixture.id));
    },
    /**
     * Fixtures of the other universes (faint on the Position Tool's map)
     *
     * @type {Array<Fixture>}
     */
    otherFixtures() {
      const own = new Set((this.universe.fixturePool?.fixtures || []).map((fixture) => fixture.id));
      return this.$show.fixturePool.fixtures.filter((fixture) => !own.has(fixture.id));
    },
    /**
     * Cells of the selected fixture the controls apply to, null for all
     *
     * @type {?Array<String>}
     */
    selectedCells() {
      return this.$view.universeCells;
    },
    /**
     * Selected fixture's channels, refreshed by the live ticker (playback writes bypass Vue)
     */
    liveChannels() {
      if (!this.selectedFixture) return this.live([]);
      // The whole fixture's channels, then those of the selected cells
      const cells = this.selectedCells;
      return this.live(this.selectedFixture.simplifiedChannels
        .filter((channel) => !cells || !channel.cell || cells.includes(channel.cell)));
    },
    /**
     * What drives each shown channel (parked, programmer, a cue, kept, rest), refreshed by the
     * live ticker: the channels widget colours and titles its faders from it
     */
    liveSources() {
      const fixture = this.selectedFixture;
      return this.live(this.liveChannels.map((row) => channelSource(fixture
        ? fixture.channels[row.id - fixture.chStart - 1] : null)));
    },
    /**
     * What the selected fixtures hold by hand: programmer values, parked channels
     *
     * @type {{programmer: Boolean, parked: Boolean}}
     */
    selectionHeld() {
      const { held, parked } = Programmer.state;
      return {
        programmer: this.selectedFixtures.some((fixture) => held.includes(fixture.id)),
        parked: this.selectedFixtures.some((fixture) => parked.includes(fixture.id)),
      };
    },
    /**
     * Selected fixture's colour (selected cells), refreshed by the live ticker
     */
    liveColor() {
      return this.live(this.selectedFixture
        ? this.selectedFixture.getColor(this.selectedCells) : undefined);
    },
    /**
     * Selected fixture's pan/tilt (selected cells), refreshed by the live ticker
     */
    livePanTilt() {
      return this.live(this.selectedFixture
        ? this.selectedFixture.getPanTilt(this.selectedCells) : undefined);
    },
  },
  mounted() {
    // A opens Arrange while the universe panel is in view with fixtures selected
    this.removeArrangeShortcut = this.$keyboard?.addShortcut(
      (e) => e.key.toLowerCase() === 'a' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey
        && this.$view.panel === 'universe' && this.selectedFixtures.length > 0,
      () => { this.arrangePopupDisplayState = true; },
    );
  },
  beforeUnmount() {
    if (this.removeArrangeShortcut) this.removeArrangeShortcut();
  },
  methods: {
    /**
     * Selects fixtures of the universe (a new main fixture shows all its cells again)
     *
     * @public
     * @param {Array<Number>} ids fixture ids, main one first
     */
    selectFixtures(ids) {
      const main = this.$view.fixture?.id;
      this.$view.selectFixtures(ids);
      if (this.$view.fixture?.id !== main) this.$view.selectCells(null);
    },
    /**
     * Selects the cells the controls apply to
     *
     * @public
     * @param {?Array<String>} cells cell names, null for all
     */
    selectCells(cells) {
      this.$view.selectCells(cells);
    },
    /**
     * Display the patch popup
     *
     * @public
     */
    displayPatchPopup() {
      this.patchPopupDisplayState = true;
    },
    /**
     * The cells an edit reaches on a fixture: the selected cells it has, else all of it
     *
     * @public
     * @param {Object} fixture
     * @returns {?Array<String>} cell names, null for all
     */
    cellsFor(fixture) {
      const cells = this.selectedCells;
      return cells && fixture.cells.some((cell) => cells.includes(cell.name)) ? cells : null;
    },
    /**
     * Sets a channel on every selected fixture that has it, in the programmer
     *
     * @public
     * @param {Object} channel the channel row the widget edited (type, qaIndex, value)
     */
    setChannel(channel) {
      Programmer.run(this.selectedFixtures, (fixture) => {
        fixture.setQuickAccessor(channel, channel.value);
      });
      this.$liveTicker.bump();
    },
    /**
     * Sets a colour on every selected fixture, each mixing it on its own channels, in the
     * programmer
     *
     * @public
     * @param {Array} color [R, G, B] 0-255
     */
    setFixtureColor(color) {
      Programmer.run(this.selectedFixtures, (fixture) => {
        fixture.setColor(color, this.cellsFor(fixture));
      });
      this.$liveTicker.bump();
    },
    /**
     * Sets pan and tilt on every selected fixture, in the programmer: the same angle as the main
     * fixture's where both ranges are known, else the same values
     *
     * @public
     * @param {Object} panTilt pan, panFine, tilt, tiltFine (0-255) of the main fixture
     */
    setFixturePanTilt(panTilt) {
      const main = this.selectedFixture;
      if (!main) return;
      Programmer.run(this.selectedFixtures, (fixture) => {
        const value = fixture === main ? panTilt : this.sameAngle(main, fixture, panTilt);
        fixture.setPanTilt(value, this.cellsFor(fixture));
      });
      this.$liveTicker.bump();
    },
    /**
     * Pan and tilt values giving another fixture the same angles as a reference fixture
     *
     * @public
     * @param {Object} from the reference fixture
     * @param {Object} to the other fixture
     * @param {Object} panTilt pan, panFine, tilt, tiltFine (0-255) on the reference
     * @returns {Object} pan, panFine, tilt, tiltFine (0-255) for the other fixture
     */
    sameAngle(from, to, panTilt) {
      const result = { ...panTilt };
      [['Pan', 'pan'], ['Tilt', 'tilt']].forEach(([kind, key]) => {
        const rangeFrom = angleRange(from, kind);
        const rangeTo = angleRange(to, kind);
        if (!rangeFrom || !rangeTo) return;
        const value = (panTilt[key] || 0) + (panTilt[`${key}Fine`] || 0) / 255;
        const degrees = (value / 255 - 0.5) * rangeFrom;
        const next = Math.min(255, Math.max(0, (degrees / rangeTo + 0.5) * 255));
        result[key] = Math.floor(next);
        result[`${key}Fine`] = Math.round((next % 1) * 255);
      });
      return result;
    },
    /**
     * Parks a channel on every selected fixture at the value its menu item reads (the main
     * fixture's), or unparks it when the main fixture's is parked
     *
     * @public
     * @param {Object} channel the channel row (type, qaIndex)
     * @param {Number} value DMX 0-255
     */
    toggleParked(channel, value) {
      const main = this.selectedFixture;
      const mainChannel = main && main.getQuickAccessor(channel);
      if (!mainChannel) return;
      const unpark = mainChannel.parked !== null;
      this.selectedFixtures.forEach((fixture) => {
        const target = fixture.getQuickAccessor(channel);
        if (!target) return;
        if (unpark) fixture.unpark(target);
        else fixture.park(target, value);
      });
      this.$show.refreshSaveState();
      this.$liveTicker.bump();
    },
    /**
     * Clears the selected fixtures from the programmer: they follow playback again
     *
     * @public
     */
    clearSelection() {
      Programmer.clear(this.selectedFixtures);
      this.$liveTicker.bump();
    },
    /**
     * Frees every parked channel of the selected fixtures
     *
     * @public
     */
    unparkSelection() {
      this.selectedFixtures.forEach((fixture) => {
        fixture.channels.forEach((channel) => {
          if (!channel.isFine && channel.parked !== null) fixture.unpark(channel);
        });
      });
      this.$show.refreshSaveState();
      this.$liveTicker.bump();
    },
    /**
     * Clears a channel from the programmer on every selected fixture
     *
     * @public
     * @param {Object} channel the channel row (type, qaIndex)
     */
    clearChannel(channel) {
      this.selectedFixtures.forEach((fixture) => {
        const target = fixture.getQuickAccessor(channel);
        if (target) Programmer.clearChannel(fixture, target);
      });
      this.$liveTicker.bump();
    },
    /**
     * Deletes one or many fixtures from the universe's fixture list.
     *
     * @public
     * @param {Array} selectedFixtures Array of universe fixture objetcs to be deleted.
     */
    deleteFixtures(selectedFixtures) {
      // The view falls back to the universe's first remaining fixture
      selectedFixtures.forEach((fixture) => {
        this.$show.deleteFixture(fixture);
      });
    },
  },
};
</script>

<style scoped>
.universe_modifier {
  width: 100%;
  height: 100%;
}
</style>
