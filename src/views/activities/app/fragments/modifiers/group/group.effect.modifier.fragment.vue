<template>
  <uk-flex>
    <widget-FX-channels
      :effect="effect ? effect : undefined"
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
    <widget-wave
      v-show="selectedFxChannel && effect && effect.channels && effect.channels.length"
      :key="effect && effect.id"
      :channel="selectedFxChannel"
    />
  </uk-flex>
</template>

<script>
import WidgetWave from './_widgets/group.effect.modifier.widget.wave.vue';
import WidgetFXChannels from './_widgets/group.effect.modifier.widget.channels.vue';

export default {
  name: 'GroupEffectModifierFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    WidgetWave,
    WidgetFXChannels,
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
  watch: {
    'selectedFxChannel.listableFixtures': function () {
      this.fixtures = this.selectedFxChannel.listableFixtures;
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
      this.fixtures = this.selectedFxChannel.listableFixtures;
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
  min-width: 250px;
}
.effect_fixtures_list {
  height: 100%;
  width: 100%;
}
</style>
