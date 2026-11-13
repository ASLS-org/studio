<template>
  <uk-flex>
    <widget-curve :fade="scene ? scene.fadeIn : undefined" />
    <!--
      TODO: Check if fadeout is necessary in this mode.
      It seem like t could only be confusing ? Would
      having a custom blackout or reset position scene with fade
      make more sense ?
    -->
    <!-- <widget-curve :fade="scene ? scene.fadeOut : undefined" /> -->
    <widget-scene-fixtures
      v-show="fixtureValue"
      :scene="scene ? scene : undefined"
      :selection="selectedIds"
      @selection="selectFixtures"
    />
    <modifier-widget-cells
      v-if="fixtureValue && sceneCells.length"
      :key="selectionKey"
      :cells="sceneCells"
      :model-value="selectedCells"
      @change="selectCells"
    />
    <widget-fixture-channels
      v-show="fixtureValue"
      ref="channels"
      tabindex="0"
      :channels="channelValues"
      toggleable
      class="modifier_widget"
      @input="updateFixtureChannels"
    />
    <widget-color-picker
      v-show="colorPickerState && fixtureValue"
      ref="colorPicker"
      tabindex="0"
      :rgb-data="fixtureValue ? fixtureValue.getColor(selectedCells) : undefined"
      @input="updateFixtureColor"
    />
    <widget-pan-tilt
      v-show="panTiltPickerState && fixtureValue"
      ref="panTiltPicker"
      tabindex="0"
      :pan-tilt="fixtureValue ? fixtureValue.getPanTilt(selectedCells) : undefined"
      @input="updateFixturePanTilt"
    />
  </uk-flex>
</template>

<script>
import WidgetCurve from '../_widgets/modifier.widget.curve.vue';
import WidgetColorPicker from '../_widgets/modifier.widget.colorpicker.vue';
import WidgetPanTilt from '../_widgets/modifier.widget.pantilt.vue';
import WidgetFixtureChannels from '../_widgets/modifier.widget.fixture.channels.vue';
import ModifierWidgetCells from '../_widgets/modifier.widget.cells.vue';

import WidgetSceneFixtures from './_widgets/group.scene.modifier.widget.fixtures.vue';

export default {
  name: 'GroupSceneModifierFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    WidgetCurve,
    WidgetFixtureChannels,
    WidgetSceneFixtures,
    WidgetColorPicker,
    WidgetPanTilt,
    ModifierWidgetCells,
  },
  props: {
    /**
     * Handle to group scene instance
     */
    scene: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    /**
     * Fixture ids selected in the group (shared with its fixture pool)
     *
     * @type {Array<Number>}
     */
    selectedIds() {
      return this.$view.groupFixtures.map((fixture) => fixture.id);
    },
    /**
     * The scene's values of the selected fixtures, else of its first fixture
     *
     * @type {Array<Object>}
     */
    selectedFixtureValues() {
      const values = this.scene?.fixtureValues || [];
      const found = this.selectedIds
        .map((id) => values.find((fixtureValue) => fixtureValue.fixture.id === id))
        .filter(Boolean);
      if (found.length) return found;
      return values.length ? [values[0]] : [];
    },
    /**
     * Value whose fixture the colour and pan/tilt pickers show (the last selected)
     *
     * @type {?Object}
     */
    fixtureValue() {
      return this.selectedFixtureValues[this.selectedFixtureValues.length - 1] || null;
    },
    /**
     * Whether a selected fixture has colour
     *
     * @type {Boolean}
     */
    colorPickerState() {
      return this.selectedFixtureValues.some((f) => f.fixture.hasColor);
    },
    /**
     * Whether a selected fixture has pan or tilt
     *
     * @type {Boolean}
     */
    panTiltPickerState() {
      return this.selectedFixtureValues.some((f) => f.fixture.hasPan || f.fixture.hasTilt);
    },
    /**
     * Cells the controls apply to, null for all (remembered with the group)
     *
     * @type {?Array<String>}
     */
    selectedCells() {
      return this.$view.groupCells;
    },
    /**
     * Fader rows: each whole-fixture channel, then one row per channel kind and colour for the
     * selected cells. A row writes every matching channel of the selected fixtures (its targets)
     */
    channelValues() {
      const rows = [];
      const byKey = new Map();
      const cells = this.selectedCells;
      this.selectedFixtureValues.forEach((fixtureValue) => {
        const ranks = new Map();
        fixtureValue.fixture.channels.forEach((channel, index) => {
          const entry = fixtureValue.entryOf(index);
          if (!entry) return;
          let key;
          if (!channel.cell) {
            key = `fixture|${channel.type}|${channel.color}|${channel.qaIndex}`;
          } else if (!cells || cells.includes(channel.cell)) {
            // The n-th channel of a kind and colour in its cell
            const rankKey = `${channel.cell}|${channel.kind}|${channel.color}`;
            const rank = ranks.get(rankKey) || 0;
            ranks.set(rankKey, rank + 1);
            key = `cell|${channel.kind}|${channel.color}|${rank}`;
          } else {
            return;
          }
          if (!byKey.has(key)) {
            const row = {
              type: channel.cell ? channel.kind : channel.type,
              color: channel.color,
              value: entry.value,
              active: entry.active,
              targets: [],
            };
            byKey.set(key, row);
            rows.push(row);
          }
          byKey.get(key).targets.push({ fixtureValue, type: entry.type, qaIndex: entry.qaIndex });
        });
      });
      return rows;
    },
    /**
     * Cell names of the selected fixtures, in fixture order
     */
    sceneCells() {
      const names = [];
      this.selectedFixtureValues.forEach((fixtureValue) => {
        fixtureValue.fixture.cells.forEach((cell) => {
          if (!names.includes(cell.name)) names.push(cell.name);
        });
      });
      return names;
    },
    /**
     * Resets the cell selector when the fixture selection changes
     */
    selectionKey() {
      return this.selectedFixtureValues.map((fixtureValue) => fixtureValue.fixture.id).join(',');
    },
  },
  methods: {
    /**
     * Selects fixtures of the group (a new main fixture shows all its cells again)
     *
     * @public
     * @param {Array<Number>} ids fixture ids, main one first
     */
    selectFixtures(ids) {
      const main = this.$view.groupFixtures[0]?.id;
      this.$view.selectFixtures(ids);
      if (this.$view.groupFixtures[0]?.id !== main) this.$view.selectCells(null);
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
     * Sets the selected fixtures' channel values
     *
     * @public
     * @param {Object} channel the channel row that changed
     */
    updateFixtureChannels(channel) {
      channel.targets.forEach((target) => {
        target.fixtureValue.setQuickAccessor({
          type: target.type,
          qaIndex: target.qaIndex,
          value: channel.value,
          active: channel.active,
        });
      });
    },
    /**
     * Updates every selected fixture's color intensity channels
     *
     * @public
     * @param {Array} rgbValue an array containing [R,G,B] values
     */
    updateFixtureColor(rgbValue) {
      this.selectedFixtureValues.forEach((fixtureValue) => {
        fixtureValue.setColor(rgbValue, this.selectedCells);
      });
    },
    /**
     * Updates every selected fixture's pan(fine)/tilt(fine) channels
     *
     * @public
     * @param {Object} panTilt a panTilt object containing pan(fine)/tilt(fine) values
     * @param {Number} panTilt.pan the fixtures' new pan value
     * @param {Number} panTilt.panFine the fixtures' new pan fine value
     * @param {Number} panTilt.tilt the fixtures' new tilt value
     * @param {Number} panTilt.tiltFine the fixtures' new tilt fine value
     */
    updateFixturePanTilt(panTilt) {
      this.selectedFixtureValues.forEach((fixtureValue) => {
        fixtureValue.setPanTilt(panTilt, this.selectedCells);
      });
    },
  },
};
</script>
