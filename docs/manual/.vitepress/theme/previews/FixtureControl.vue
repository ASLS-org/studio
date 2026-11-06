<template>
  <modifier-widget-cells
    v-if="widget === 'cells'"
    :cells="fixture.cells.map((cell) => cell.name)"
    @change="selectedCells = $event"
  />
  <fixture-channels-widget
    v-else-if="widget === 'channels'"
    :channels="liveChannels"
    @input="setChannel"
  />
  <widget-color-picker
    v-else-if="widget === 'color'"
    :model-value="liveColor"
    @update:model-value="setColor"
  />
  <pan-tilt-widget
    v-else-if="widget === 'pantilt'"
    :pan-tilt="livePanTilt"
    @input="setPanTilt"
  />
</template>

<script>
import LiveMixin from '@/views/mixins/live.mixin';
import FixtureChannelsWidget from '@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.fixture.channels.vue';
import WidgetColorPicker from '@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.colorpicker.vue';
import PanTiltWidget from '@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.pantilt.vue';
import ModifierWidgetCells from '@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.cells.vue';

/**
 * One of the universe view's fixture controls (channels, colour, pan/tilt, cells) bound to one
 * fixture, wired as universe.modifier.fragment.vue wires them: live values in, writes through the
 * fixture's own setters. Keep it in step with that fragment.
 * @displayName FixtureControl
 */
export default {
  name: 'FixtureControl',
  compatConfig: { MODE: 3 },
  components: {
    FixtureChannelsWidget,
    WidgetColorPicker,
    PanTiltWidget,
    ModifierWidgetCells,
  },
  mixins: [LiveMixin],
  props: {
    /**
     * Fixture the control drives
     */
    fixture: {
      type: Object,
      required: true,
    },
    /**
     * Which control: 'channels', 'color', 'pantilt' or 'cells'
     */
    widget: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      selectedCells: null,
    };
  },
  computed: {
    /**
     * The fixture's channels with their live values (the selected cells' only, when picked)
     * @type {Array<Object>}
     */
    liveChannels() {
      const cells = this.selectedCells;
      return this.live(this.fixture.simplifiedChannels
        .filter((channel) => !cells || !channel.cell || cells.includes(channel.cell)));
    },
    /**
     * The fixture's live colour
     * @type {Array<Number>}
     */
    liveColor() {
      return this.live(this.fixture.getColor(this.selectedCells));
    },
    /**
     * The fixture's live pan/tilt
     * @type {Object}
     */
    livePanTilt() {
      return this.live(this.fixture.getPanTilt(this.selectedCells));
    },
  },
  methods: {
    /**
     * A fader moved
     * @param {Object} channel channel and its new value
     */
    setChannel(channel) {
      this.fixture.setQuickAccessor(channel, channel.value);
      this.$liveTicker.bump();
    },
    /**
     * A colour was picked
     * @param {Array<Number>} color RGB 0-255
     */
    setColor(color) {
      this.fixture.setColor(color, this.selectedCells);
      this.$liveTicker.bump();
    },
    /**
     * The pan/tilt pad moved
     * @param {Object} panTilt pan, panFine, tilt, tiltFine (0-255)
     */
    setPanTilt(panTilt) {
      this.fixture.setPanTilt(panTilt, this.selectedCells);
      this.$liveTicker.bump();
    },
  },
};
</script>
