<template>
  <modifier-widget-cells
    v-if="widget === 'cells'"
    :cells="fixture.cells.map((cell) => cell.name)"
    @change="selectedCells = $event"
  />
  <fixture-channels-widget
    v-else-if="widget === 'channels'"
    :channels="liveChannels"
    :sources="liveSources"
    :held="held"
    @input="setChannel"
    @park="toggleParked"
    @clear-channel="clearChannel"
    @clear="clear"
    @unpark="unparkAll"
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
import Programmer from '@/models/DMX/programmer';
import { channelSource } from '@/views/utils/channel.source';
import FixtureChannelsWidget from '@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.fixture.channels.vue';
import WidgetColorPicker from '@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.colorpicker.vue';
import PanTiltWidget from '@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.pantilt.vue';
import ModifierWidgetCells from '@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.cells.vue';

/**
 * One of the universe view's fixture controls (channels, colour, pan/tilt, cells) bound to one
 * fixture, wired as universe.modifier.fragment.vue wires them: live values in, writes into the
 * programmer through the fixture's own setters, Park and Clear. Keep it in step with that fragment.
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
     * What drives each shown channel, refreshed by the live ticker
     * @type {Array<Object>}
     */
    liveSources() {
      const { fixture } = this;
      return this.live(this.liveChannels.map((row) => channelSource(fixture
        .channels[row.id - fixture.chStart - 1])));
    },
    /**
     * Whether the fixture holds programmer values or parked channels
     * @type {{programmer: Boolean, parked: Boolean}}
     */
    held() {
      return {
        programmer: Programmer.state.held.includes(this.fixture.id),
        parked: Programmer.state.parked.includes(this.fixture.id),
      };
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
      Programmer.run([this.fixture], (fixture) => fixture.setQuickAccessor(channel, channel.value));
      this.$liveTicker.bump();
    },
    /**
     * A colour was picked
     * @param {Array<Number>} color RGB 0-255
     */
    setColor(color) {
      Programmer.run([this.fixture], (fixture) => fixture.setColor(color, this.selectedCells));
      this.$liveTicker.bump();
    },
    /**
     * The pan/tilt pad moved
     * @param {Object} panTilt pan, panFine, tilt, tiltFine (0-255)
     */
    setPanTilt(panTilt) {
      Programmer.run([this.fixture], (fixture) => fixture.setPanTilt(panTilt, this.selectedCells));
      this.$liveTicker.bump();
    },
    /**
     * Park at <value> / Unpark picked in a channel's menu
     * @param {Object} channel the channel row
     * @param {Number} value the value its menu item reads
     */
    toggleParked(channel, value) {
      const target = this.fixture.getQuickAccessor(channel);
      if (!target) return;
      if (target.parked !== null) this.fixture.unpark(target);
      else this.fixture.park(target, value);
      this.$liveTicker.bump();
    },
    /**
     * Clear picked in a channel's menu
     * @param {Object} channel the channel row
     */
    clearChannel(channel) {
      const target = this.fixture.getQuickAccessor(channel);
      if (target) Programmer.clearChannel(this.fixture, target);
      this.$liveTicker.bump();
    },
    /**
     * The header's Clear programmer
     */
    clear() {
      Programmer.clear([this.fixture]);
      this.$liveTicker.bump();
    },
    /**
     * The header's Unpark
     */
    unparkAll() {
      this.fixture.channels.forEach((channel) => {
        if (!channel.isFine && channel.parked !== null) this.fixture.unpark(channel);
      });
      this.$liveTicker.bump();
    },
  },
};
</script>
