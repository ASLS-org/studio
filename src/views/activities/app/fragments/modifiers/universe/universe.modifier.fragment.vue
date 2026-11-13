<template>
  <uk-flex class="universe_modifier">
    <universe-settings-widget :model-value="universe" />
    <universe-connection-widget
      v-show="universe.stream"
      :model-value="universe"
    />
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
    />
    <position-tool-widget
      v-show="selectedFixture"
      ref="positionTool"
      :fixture="selectedFixture"
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
      @input="setChannel"
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
  </uk-flex>
</template>

<script>
import modal from '@/views/mixins/modal.mixin';
import LiveMixin from '@/views/mixins/live.mixin';
import FixturePoolWidget from '../_widgets/modifier.widget.fixture.pool.vue';
import FixtureChannelsWidget from '../_widgets/modifier.widget.fixture.channels.vue';
import WidgetColorPicker from '../_widgets/modifier.widget.colorpicker.vue';
import PanTiltWidget from '../_widgets/modifier.widget.pantilt.vue';
import ModifierWidgetCells from '../_widgets/modifier.widget.cells.vue';

import UniverseSettingsWidget from './_widgets/universe.modifier.widget.settings.vue';
import FixtureSettingsWidget from './_widgets/universe.modifier.widget.fixture.settings.vue';
import PositionToolWidget from './_widgets/universe.modifier.widget.fixture.position.tool.vue';
import PatchPopup from './_popups/universe.modifier.popup.patch.vue';
import UniverseConnectionWidget from './_widgets/universe.modifier.widget.connection.vue';

export default {
  name: 'UniverseModifierFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    UniverseSettingsWidget,
    UniverseConnectionWidget,
    FixturePoolWidget,
    FixtureSettingsWidget,
    PositionToolWidget,
    FixtureChannelsWidget,
    WidgetColorPicker,
    PanTiltWidget,
    ModifierWidgetCells,
    PatchPopup,
  },
  mixins: [LiveMixin],
  computed: {
    /**
     * Patch popup display state
     */
    patchPopupDisplayState: modal('universe.patch', 'universe'),
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
     * Sets the selected fixture channel value
     *
     * @public
     * @param {Object} channel the channel to be update
     */
    setChannel(channel) {
      this.selectedFixture.setQuickAccessor(channel, channel.value);
      this.$liveTicker.bump();
    },
    /**
     * Sets the selected fixture color intensity value
     *
     * @public
     * @param {Array} color an array containing [R,G,B] values.
     */
    setFixtureColor(color) {
      if (this.selectedFixture) {
        this.selectedFixture.setColor(color, this.selectedCells);
        this.$liveTicker.bump();
      }
    },
    /**
     * Sets the selected fixture pan & tilt values
     *
     * @public
     * @param {Object} panTilt a panTilt object containing pan(fine)/tilt(fine) values
     * @param {Number} panTilt.pan the fixture's new pan value
     * @param {Number} panTilt.panFine the fixture's new pan fine value
     * @param {Number} panTilt.tilt the fixture's new tilt value
     * @param {Number} panTilt.tiltFine the fixture's new tilt fine value
     */
    setFixturePanTilt(panTilt) {
      if (this.selectedFixture) {
        this.selectedFixture.setPanTilt(panTilt, this.selectedCells);
        this.$liveTicker.bump();
      }
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
