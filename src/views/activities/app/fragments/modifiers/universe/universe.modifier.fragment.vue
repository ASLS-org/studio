<template>
  <uk-flex class="universe_modifier">
    <universe-settings-widget v-model="universe" />
    <fixture-pool-widget
      :prevent-unfocus="unfocusPreventable"
      :pool="universe.fixturePool"
      :action="{
        icon: 'new',
        text: 'add',
        callback: displayPatchPopup,
      }"
      :auto-select="selectedFixtureIndex"
      @select="selectFixture"
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
    <fixture-channels-widget
      v-show="selectedFixture"
      ref="channels"
      class="fixture_channels"
      :channels="selectedFixture ? selectedFixture.simplifiedChannels : []"
      @input="setChannel"
    />
    <widget-color-picker
      v-if="selectedFixture && selectedFixture.hasColor"
      ref="colorPicker"
      v-model="selectedFixture.color"
      tabindex="0"
    />
    <!-- :rgb-data="selectedFixture ? selectedFixture.color : undefined"
      @input="setFixtureColor" -->
    <pan-tilt-widget
      v-show="selectedFixture && selectedFixture.hasPan && selectedFixture.hasTilt"
      ref="panTiltPicker"
      :pan-tilt="selectedFixture ? selectedFixture.panTilt : undefined"
      @input="setFixturePanTilt"
    />
    <patch-popup
      v-model="patchPopupDisplayState"
      :universe="universe"
    />
  </uk-flex>
</template>

<script>
import FixturePoolWidget from '../_widgets/modifier.widget.fixture.pool.vue';
import FixtureChannelsWidget from '../_widgets/modifier.widget.fixture.channels.vue';
import WidgetColorPicker from '../_widgets/modifier.widget.colorpicker.vue';
import PanTiltWidget from '../_widgets/modifier.widget.pantilt.vue';

import UniverseSettingsWidget from './_widgets/universe.modifier.widget.settings.vue';
import FixtureSettingsWidget from './_widgets/universe.modifier.widget.fixture.settings.vue';
import PositionToolWidget from './_widgets/universe.modifier.widget.fixture.position.tool.vue';
import PatchPopup from './_popups/universe.modifier.popup.patch.vue';

export default {
  name: 'UniverseModifierFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    UniverseSettingsWidget,
    FixturePoolWidget,
    FixtureSettingsWidget,
    PositionToolWidget,
    FixtureChannelsWidget,
    WidgetColorPicker,
    PanTiltWidget,
    PatchPopup,
  },
  data() {
    return {
      /**
       * Handle to universe instance
       */
      universe: {},
      /**
       * Currently selected fixture
       */
      selectedFixture: null,
      /**
       * Patch popup display state
       */
      patchPopupDisplayState: false,
      /**
       * List of unfocus preventable HTML elements to be
       * forwarded to the universe's fixture list component.
       */
      unfocusPreventable: [],
      /**
       * Index of the currently selected fixture in the universe's fixture pool.
       */
      selectedFixtureIndex: 0,
    };
  },
  watch: {
    '$route.query.fixtureId': function routeQueryFixtureIdWatcher(fixtureId) {
      this.selectFixture(fixtureId);
    },
    // TODO: feed method straight into watcher
    '$route.params.universeId': function routeParamsUniverseIdWatcher(universeId) {
      this.fetchUniverseData(universeId);
      this.selectedFixtureIndex = 0;
    },
  },
  mounted() {
    this.fetchUniverseData(0);
  },
  beforeUnmount() {
    if (this.selectedFixture && this.selectedFixture.id) {
      this.selectedFixture.highlightSingle(false);
    }
  },
  methods: {
    /**
     * Fetches universe data
     *
     * @public
     */
    fetchUniverseData(id) {
      if (id !== undefined) {
        try {
          this.universe = this.$show.universePool.getFromId(id);
          this.selectFixture(0);
        } catch (err) {
          this.universe = {};
          this.selectedFixture = null;
        }
      }
    },
    /**
     * Fetches selected fixture data
     *
     * @public
     */
    selectFixture(id) {
      if (id !== undefined) {
        try {
          this.selectedFixture = this.universe.fixturePool.getFromId(id || 0);
        } catch (err) {
          this.selectedFixture = null;
        }
      }
    },
    /**
     * Display the patch popup
     *
     * @public
     */
    displayPatchPopup() {
      this.patchPopupDisplayState = true;
    },
    handleFocus(state) {
      if (!state) {
        if (this.selectedFixture) {
          this.selectedFixture.highlightSingle(false, true);
        }
      }
    },
    /**
     * Sets the selected fixture channel value
     *
     * @public
     * @param {Object} channel the channel to be update
     */
    setChannel(channel) {
      this.selectedFixture.setQuickAccessor(channel, channel.value);
    },
    /**
     * Sets the selected fixture color intensity value
     *
     * @public
     * @param {Array} color an array containing [R,G,B] values.
     */
    setFixtureColor(color) {
      if (this.selectedFixture) {
        this.selectedFixture.color = color;
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
        this.selectedFixture.panTilt = panTilt;
      }
    },
    /**
     * Deletes one or many fixtures from the universe's fixture list.
     *
     * @public
     * @param {Array} selectedFixtures Array of universe fixture objetcs to be deleted.
     */
    deleteFixtures(selectedFixtures) {
      selectedFixtures.forEach((fixture) => {
        this.$show.deleteFixture(fixture);
      });
      if (this.universe.fixturePool.fixtures.length) {
        // eslint-disable-next-line prefer-destructuring
        this.selectedFixture = this.universe.fixturePool.fixtures[0];
      } else {
        this.selectedFixture = null;
      }
      this.selectedFixtureIndex = 0;
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
