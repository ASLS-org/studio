<template>
  <uk-flex>
    <!-- Fades of a Relative effect: from the channels' values when cued, back to them when
      stopped (Absolute starts and stops at once) -->
    <template v-if="effect && effect.fadeIn && effect.relative">
      <widget-curve
        :key="`fade-in-${effect.id}`"
        class="effect_fade_in"
        :fade="effect.fadeIn"
        timed
      />
      <widget-curve
        :key="`fade-out-${effect.id}`"
        class="effect_fade_out"
        :fade="effect.fadeOut"
        timed
      />
    </template>
    <widget-FX-channels
      :effect="effect ? effect : undefined"
      :selected="selectedFxChannel ? selectedFxChannel.type : null"
      @select="selectFxChannel"
    />
    <uk-widget
      v-show="
        selectedFxChannel
          && selectedFxChannel.listableFixtures
          && effect
          && effect.channels
          && effect.channels.length
      "
      :disabled="!selectedFxChannel"
      class="effect_fixtures"
      :header="{ title: 'Channel Fixtures Activity', icon: 'check' }"
      dockable
    >
      <uk-list
        :key="effect && effect.id"
        :disabled="!selectedFxChannel"
        :items="fixtures"
        class="effect_fixtures_list"
        toggleable
        filterable
        draggable
        no-highlight
        @reorder="changeFixtureOrder"
        @toggle="setFixturesActivity"
      />
    </uk-widget>
    <!-- The selected channel's scope, before its wave: the colour one for a colour channel, the
      pan/tilt one for Pan or Tilt (when the effect has both) -->
    <colour-scope
      v-if="scope === 'colour'"
      :key="`colour-${effect.id}`"
      :effect="effect"
    />
    <pan-tilt-scope
      v-if="scope === 'pantilt'"
      :key="`pantilt-${effect.id}`"
      :effect="effect"
    />
    <widget-wave
      v-show="selectedFxChannel && effect && effect.channels && effect.channels.length"
      :key="effect && effect.id"
      :channel="selectedFxChannel"
    />
  </uk-flex>
</template>

<script>
import { COLOUR_TYPES, waveOf } from '@/views/utils/effect.scope';
import WidgetWave from './_widgets/group.effect.modifier.widget.wave.vue';
import WidgetCurve from '../_widgets/modifier.widget.curve.vue';
import WidgetFXChannels from './_widgets/group.effect.modifier.widget.channels.vue';
import PanTiltScope from './_widgets/group.effect.modifier.widget.scope.pantilt.vue';
import ColourScope from './_widgets/group.effect.modifier.widget.scope.colour.vue';

export default {
  name: 'GroupEffectModifierFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    WidgetWave,
    WidgetCurve,
    WidgetFXChannels,
    PanTiltScope,
    ColourScope,
  },
  props: {
    /**
     * Handle to group scene instance
     */
    effect: {
      type: Object,
      default: () => ({
        id: 0,
        listableChannels: [],
      }),
    },
  },
  data() {
    return {
      /**
       * Handle to group effect instance
       */
      // effect: this.value,
      /**
       * Handle to currently selected channel
       */
      selectedFxChannel: undefined,
      /**
       * Handle to selected effecct channel list of fixtures
       */
      fixtures: [],
    };
  },
  computed: {
    /**
     * The effect's channel types, in order (changes when channels come and go, or the effect)
     *
     * @type {Array<String>}
     */
    channelTypes() {
      return (this.effect?.channels || []).map((channel) => channel.type);
    },
    /**
     * Scope of the selected channel: 'colour', 'pantilt' or null
     *
     * @type {?String}
     */
    scope() {
      const type = this.selectedFxChannel?.type;
      if (!type || !this.effect) return null;
      if (COLOUR_TYPES.includes(type)) return 'colour';
      if ((type === 'Pan' || type === 'Tilt') && waveOf(this.effect, 'Pan') && waveOf(this.effect, 'Tilt')) {
        return 'pantilt';
      }
      return null;
    },
  },
  watch: {
    /**
     * Keeps a channel of this effect selected: the first one when the selected channel isn't
     * among its channels (another effect opened, the channel deleted)
     */
    channelTypes: {
      immediate: true,
      handler(types) {
        const current = this.selectedFxChannel;
        const kept = current && this.effect?.channels?.includes(current);
        if (!kept) this.selectFxChannel(types.length ? this.effect.channels[0] : undefined);
      },
    },
    'selectedFxChannel.listableFixtures': function () {
      this.fixtures = this.selectedFxChannel ? this.selectedFxChannel.listableFixtures : [];
    },
  },
  methods: {
    /**
     * Picks a channel from the effect's modulated channel list to be selected.
     *
       * @public
     * @param {Object} channel handle to the channel instance to be selected
     */
    selectFxChannel(channel) {
      this.selectedFxChannel = channel;
      this.fixtures = channel ? channel.listableFixtures : [];
    },
    /**
     * Update active fixture list of the currently selected effect channel
     *
       * @public
     * @param {Array} list list of channel fixture objects
     */
    setFixturesActivity(list) {
      this.selectedFxChannel.setFixturesActivity(list.map((item) => item.id));
    },
    /**
     * Update fixture order of the currently selected effect channel
     *
       * @public
     * @param {Object} reorderData reorder object
     * @param {Object} reorderData.original fixture original index
     * @param {Object} reorderData.final fixture new index
     */
    changeFixtureOrder(reorderData) {
      this.selectedFxChannel.changeFixtureOrder(reorderData.original, reorderData.final);
    },
  },
};
</script>

<style scoped>
.effect_fixtures {
  min-width: var(--widget-width-sm);
}
.effect_fixtures_list {
  height: 100%;
  width: 100%;
}
</style>
