<template>
  <uk-flex class="universe_modifier">
    <universe-settings-widget v-model="universe" />
    <fixture-pool-widget
      :preventUnfocus="unfocusPreventable"
      :pool="universe.fixturePool"
      :action="{
        icon: 'new',
        text: 'add',
        callback: displayPatchPopup,
      }"
      :autoSelect="selectedFixtureIndex"
      @select="selectFixture"
      @delete="deleteFixtures"
      @focused="handleFocus"
    />
    <fixture-settings-widget ref="settings" v-show="selectedFixture" :fixture="selectedFixture" />
    <position-tool-widget ref="positionTool" v-show="selectedFixture" :fixture="selectedFixture" />
    <fixture-channels-widget
      ref="channels"
      v-show="selectedFixture"
      class="fixture_channels"
      @input="setChannel"
      :channels="selectedFixture ? selectedFixture.simplifiedChannels : []"
    />
    <widget-color-picker
      ref="colorPicker"
      v-show="selectedFixture && selectedFixture.hasColor"
      tabindex="0"
      @input="setFixtureColor"
      :rgbData="selectedFixture ? selectedFixture.color : undefined"
    />
    <pan-tilt-widget
      ref="panTiltPicker"
      v-show="selectedFixture && selectedFixture.hasPan && selectedFixture.hasTilt"
      @input="setFixturePanTilt"
      :panTilt="selectedFixture ? selectedFixture.panTilt : undefined"
    />
    <patch-popup :universe="universe" v-model="patchPopupDisplayState" />
  </uk-flex>
</template>

<script>
import FixturePoolWidget from "../_widgets/modifier.widget.fixture.pool.vue";
import FixtureChannelsWidget from "../_widgets/modifier.widget.fixture.channels.vue";
import WidgetColorPicker from "../_widgets/modifier.widget.colorpicker.vue";
import PanTiltWidget from "../_widgets/modifier.widget.pantilt.vue";

import UniverseSettingsWidget from "./_widgets/universe.modifier.widget.settings.vue";
import FixtureSettingsWidget from "./_widgets/universe.modifier.widget.fixture.settings.vue";
import PositionToolWidget from "./_widgets/universe.modifier.widget.fixture.position.tool.vue";
import PatchPopup from "./_popups/universe.modifier.popup.patch.vue";

export default {
  name: "universeModifierFragment",
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
       * Handle to universe's fixture pool instance
       */
      fixtures: {},
      /**
       * Currently selected fixture
       */
      selectedFixture: {},
      /**
       * List of currently highlighted fixtures
       */
      highlightedFixtures: [],
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
  methods: {
    /**
     * Fetches universe data using route universe ID parameter
     *
     * @public
     */
    fetchUniverseData() {
      try {
        this.universe = this.$show.universePool.getFromId(this.$route.params.universeId);
      } catch (err) {
        this.universe = {};
      }
      try {
        this.selectedFixture = this.universe.fixturePool.getFromId(this.$route.query.fixtureId || 0);
      } catch (err) {
        this.selectedFixture = null; // {};
      }
    },
    /**
     * Display the patch popup
     *
     * @public
     */
    displayPatchPopup() {
      this.patchPopupDisplayState = true;
      console.log(this.patchPopupDisplayState)
    },
    /**
     * Selects a universe's fixture.
     *
     * @public
     * @param {Number} fixtureId unique ID of the fixture to be displayed
     */
    selectFixture(fixtureId) {
      if (fixtureId != null) {
        try {
          this.selectedFixture = this.universe.fixturePool.getFromId(fixtureId);
          if (this.selectedFixture) {
            this.unfocusPreventable = Object.keys(this.$refs).map((refKey) => {
              return this.$refs[refKey].$el;
            });
          }
        } catch (err) {
          this.selectedFixture = null; //{};
        }
      }
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
        this.selectedFixture = this.universe.fixturePool.fixtures[0];
      } else {
        this.selectedFixture = null; //{};
      }
      // this.selectedFixtureIndex = -1;
      this.selectedFixtureIndex = 0;
    },
  },
  mounted() {
    this.fetchUniverseData();
  },
  beforeUnmount() {
    if (this.selectedFixture && this.selectedFixture.id) {
      this.selectedFixture.highlightSingle(false);
    }
  },
  watch: {
    "$route.query.fixtureId"(fixtureId) {
      if (this.$route.params.universeId != this.universe.id) {
        this.fetchUniverseData();
      }
      if (fixtureId) {
        this.selectedFixtureIndex = this.universe.fixturePool.fixtures.findIndex((f) => f.id == fixtureId);
      }
    },
    "$route.params.universeId"() {
      this.fetchUniverseData();
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
