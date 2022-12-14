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
    <widget-scene-fixtures v-show="fixtureValue" :preventUnfocus="unfocusPreventable" @select="selectFixtures" :scene="scene ? scene : undefined" />
    <widget-fixture-channels
      v-show="fixtureValue"
      tabindex="0"
      :channels="channelValues"
      ref="channels"
      toggleable
      class="modifier_widget"
      @input="updateFixtureChannels"
    />
    <widget-color-picker
      tabindex="0"
      ref="colorPicker"
      v-show="colorPickerState && fixtureValue"
      @input="updateFixtureColor"
      :rgbData="fixtureValue ? fixtureValue.color : undefined"
    />
    <widget-pan-tilt
      tabindex="0"
      ref="panTiltPicker"
      v-show="panTiltPickerState && fixtureValue"
      @input="updateFixturePanTilt"
      :panTilt="fixtureValue ? fixtureValue.panTilt : undefined"
    />
  </uk-flex>
</template>

<script>
import WidgetCurve from "../_widgets/modifier.widget.curve.vue";
import WidgetColorPicker from "../_widgets/modifier.widget.colorpicker.vue";
import WidgetPanTilt from "../_widgets/modifier.widget.pantilt.vue";
import WidgetFixtureChannels from "../_widgets/modifier.widget.fixture.channels.vue"

import WidgetSceneFixtures from "./_widgets/group.scene.modifier.widget.fixtures.vue";

export default {
  name: "groupSceneModifierFragment",
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
       * List of unfocus preventable HTML elements to be forwarded to the scene fixture list components
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
        .map((fixtureValue) => {
          return fixtureValue.channelValues.map((channelValue) => {
            return channelValue;
          });
        })
        .flat()
        .filter((v, i, a) => a.findIndex((v2) => v2.type === v.type && v2.color === v.color) === i);
    },
  },
  methods: {
    /**
     * Initialize component's data
     * 
       * @public
     */
    initSceneValues() {
      this.selectedFixtureValues = [];
      if (this.scene && this.scene.fixtureValues && this.scene.fixtureValues.length) {
        this.selectedFixtureValues.push(this.scene.fixtureValues[0]);
        this.fixtureValue = this.selectedFixtureValues[this.selectedFixtureValues.length - 1];
        this.colorPickerState = this.selectedFixtureValues.some((f) => f.fixture.hasColor);
        this.panTiltPickerState = this.selectedFixtureValues.some((f) => f.fixture.hasPan || f.fixture.hasTilt);
        let visualizerEl = document.getElementById("visualizer");
        if(visualizerEl){
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
     * 
       * @public
     * @param {Array} fixtureValues list of scene fixtures ro be selected 
     */
    selectFixtures(fixtureValues) {
      if (fixtureValues && fixtureValues.length) {
        this.selectedFixtureValues = fixtureValues;
        this.fixtureValue = this.selectedFixtureValues[this.selectedFixtureValues.length - 1];
        this.colorPickerState = this.selectedFixtureValues.some((f) => f.fixture.hasColor);
        this.panTiltPickerState = this.selectedFixtureValues.some((f) => f.fixture.hasPan || f.fixture.hasTilt);
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
  mounted() {
    this.$nextTick(() => {
      this.initSceneValues();
    });
  },
  watch: {
    scene() {
      this.initSceneValues();
    },
  },
};
</script>
