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
      :prevent-unfocus="unfocusPreventable"
      :scene="scene ? scene : undefined"
      @select="selectFixtures"
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
      :rgb-data="fixtureValue ? fixtureValue.color : undefined"
      @input="updateFixtureColor"
    />
    <widget-pan-tilt
      v-show="panTiltPickerState && fixtureValue"
      ref="panTiltPicker"
      tabindex="0"
      :pan-tilt="fixtureValue ? fixtureValue.panTilt : undefined"
      @input="updateFixturePanTilt"
    />
  </uk-flex>
</template>

<script>
import WidgetCurve from '../_widgets/modifier.widget.curve.vue';
import WidgetColorPicker from '../_widgets/modifier.widget.colorpicker.vue';
import WidgetPanTilt from '../_widgets/modifier.widget.pantilt.vue';
import WidgetFixtureChannels from '../_widgets/modifier.widget.fixture.channels.vue';

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
       * List of unfocus preventable HTML elements to be forwarded
       * to the scene fixture list components
       */
      unfocusPreventable: [],
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
    };
  },
  computed: {
    /**
     * list of channelValues to be displayed. WHenever a list of
     * fixture is selected, a channelValues union of each individual fixtures channels is created.
     */
    channelValues() {
      return this.selectedFixtureValues
        .map((fixtureValue) => fixtureValue.channelValues.map((channelValue) => channelValue))
        .flat()
        .filter((v, i, a) => a.findIndex((v2) => v2.type === v.type && v2.color === v.color) === i);
    },
  },
  watch: {
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
        const visualizerEl = document.getElementById('visualizer');
        if (visualizerEl) {
          this.unfocusPreventable.push(visualizerEl);
        }
        if (this.$refs.channels) {
          this.unfocusPreventable.push(this.$refs.channels.$el);
        }
        if (this.$refs.colorPicker && this.colorPickerState) {
          this.unfocusPreventable.push(this.$refs.colorPicker.$el);
        }
        if (this.$refs.panTiltPicker && this.panTiltPickerState) {
          this.unfocusPreventable.push(this.$refs.panTiltPicker.$el);
        }
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
      this.selectedFixtureValues.forEach((fixtureValue) => {
        fixtureValue.setQuickAccessor(channel);
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
        fixtureValue.color = rgbValue;
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
        fixtureValue.panTilt = panTilt;
      });
    },
  },
};
</script>
