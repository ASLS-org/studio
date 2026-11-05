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
      @select="selectFixtures"
    />
    <modifier-widget-cells
      v-if="fixtureValue && sceneCells.length"
      :key="selectionKey"
      :cells="sceneCells"
      @change="selectedCells = $event"
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
  data() {
    return {
      /**
       * List of handles to the currently selected fixture scene values
       */
      selectedFixtureValues: [],
      /**
       * Handle to currently selected fixture scene value
       */
      fixtureValue: null,
      /**
       * Scene color picker display state
       */
      colorPickerState: false,
      /**
       * Scene pan & tilt picker display state
       */
      panTiltPickerState: false,
      /**
       * Cells the controls apply to, null for all (view state only)
       */
      selectedCells: null,
    };
  },
  computed: {
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
  watch: {
    selectionKey() {
      this.selectedCells = null;
    },
    scene() {
      this.initSceneValues();
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initSceneValues();
    });
  },
  methods: {
    /**
     * Initialize component's data
     * @todo that's not readable
     *
     * @public
     */
    initSceneValues() {
      this.selectedFixtureValues = [];
      if (this.scene && this.scene.fixtureValues && this.scene.fixtureValues.length) {
        this.selectedFixtureValues.push(this.scene.fixtureValues[0]);
        this.fixtureValue = this.selectedFixtureValues[this.selectedFixtureValues.length - 1];
        this.colorPickerState = this.selectedFixtureValues.some(
          (f) => f.fixture.hasColor,
        );
        this.panTiltPickerState = this.selectedFixtureValues.some(
          (f) => f.fixture.hasPan || f.fixture.hasTilt,
        );
      }
    },
    /**
     * Selects one or multiple fixtures
     * @todo that's not readable
     *
     * @public
     * @param {Array} fixtureValues list of scene fixtures ro be selected
     */
    selectFixtures(fixtureValues) {
      if (fixtureValues && fixtureValues.length) {
        this.selectedFixtureValues = fixtureValues;
        this.fixtureValue = this.selectedFixtureValues[this.selectedFixtureValues.length - 1];
        this.colorPickerState = this.selectedFixtureValues.some(
          (f) => f.fixture.hasColor,
        );
        this.panTiltPickerState = this.selectedFixtureValues.some(
          (f) => f.fixture.hasPan || f.fixture.hasTilt,
        );
      } else {
        this.selectedFixtureValues = [];
        this.fixtureValue = null;
        this.colorPickerState = false;
        this.panTiltPickerState = false;
      }
    },
    /**
     * Updates every selected fixture's channel with a new value
     *
     * @public
     * @param {Object} channel channel object
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
