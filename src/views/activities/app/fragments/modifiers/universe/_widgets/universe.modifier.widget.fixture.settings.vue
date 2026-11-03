<template>
  <uk-widget
    class="fixture_settings"
    dockable
    :header="header"
  >
    <uk-flex
      v-if="fixture"
      :gap="8"
      col
      class="fixture_settings_body"
    >
      <uk-flex :gap="8">
        <uk-txt-input
          v-model.lazy="fixture.name"
          style="flex: 1"
          label="Name"
        />
        <uk-num-input
          v-model.lazy="fixture.chStart"
          style="width: 70px"
          class="field"
          label="Address"
        />
      </uk-flex>
      <uk-txt-input
        v-model="fixture.model"
        readonly
        label="Model"
      />
      <uk-select-input
        v-if="fixture.modeIndex != null"
        :key="modeSelectKey"
        :model-value="fixture.modeIndex"
        label="Mode"
        :options="fixture.modeNames"
        @update:model-value="changeMode"
      />
    </uk-flex>
  </uk-widget>
</template>

<script>
import EventBus from '@/plugins/eventbus';

export default {
  name: 'UniverseModifierWidgetFixtureSettings',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Handle to fixture instance
     */
    fixture: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      /**
       * Widget header data
       */
      header: {
        title: 'Fixture Settings',
        icon: 'wrench',
      },
      /**
       * Re-renders the mode select so it shows the current mode after a refused change
       */
      modeSelectKey: 0,
    };
  },
  methods: {
    /**
     * Switches the fixture's mode through its universe so the patch stays consistent
     *
     * @public
     * @param {Number} modeIndex Index of the selected mode
     */
    changeMode(modeIndex) {
      try {
        this.$show.universePool.getFromId(this.fixture.universe)
          .changeFixtureMode(this.fixture, modeIndex);
      } catch (err) {
        this.modeSelectKey++;
        EventBus.emit('app_error', err);
      }
    },
  },
};
</script>

<style scoped>
.fixture_settings {
  max-width: 200px;
  min-width: 200px;
}
.fixture_settings_body {
  height: 100%;
  width: 100%;
  padding: 10px;
  max-width: 200px;
  min-width: 200px;
}
.empty_text {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  color: var(--secondary-light);
  justify-content: center;
}
</style>
