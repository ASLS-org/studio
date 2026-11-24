<template>
  <uk-widget
    class="fixture_settings"
    dockable
    :header="header"
    :action="fixture ? action : null"
  >
    <uk-flex
      v-if="fixture"
      :gap="8"
      class="fixture_settings_body"
    >
      <uk-flex
        :gap="8"
        col
        class="fixture_settings_main"
      >
        <uk-txt-input
          v-model.lazy="fixture.name"
          label="Name"
        />
        <uk-select-input
          v-if="fixture.modeIndex != null"
          :key="modeSelectKey"
          :model-value="fixture.modeIndex"
          label="Mode"
          :options="fixture.modeNames"
          @update:model-value="changeMode"
        />
        <uk-txt-input
          v-model="fixture.model"
          readonly
          label="Model"
        />
      </uk-flex>
      <!-- Where it is patched, 1-512; moves go through Edit (header): the repatch popup -->
      <uk-flex
        :gap="8"
        col
        class="fixture_settings_patch"
      >
        <uk-num-input
          :model-value="start"
          readonly
          label="Ch Start"
        />
        <uk-num-input
          :model-value="stop"
          readonly
          label="Ch Stop"
        />
        <uk-num-input
          :model-value="fixture.chCount"
          readonly
          label="Ch Count"
        />
      </uk-flex>
    </uk-flex>
  </uk-widget>
</template>

<script>
import EventBus from '@/plugins/eventbus';
import { dmxAddress } from '@/views/utils/dmx';

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
  emits: ['repatch'],
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
      /**
       * Header button: opens the repatch popup
       */
      action: {
        text: 'Edit',
        icon: 'patch',
        callback: () => this.$emit('repatch', this.fixture),
      },
    };
  },
  computed: {
    /**
     * First address, 1-based
     */
    start() {
      return dmxAddress(this.fixture.chStart);
    },
    /**
     * Last address, 1-based
     */
    stop() {
      return dmxAddress(this.fixture.chStart + this.fixture.chCount - 1);
    },
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
  flex-shrink: 0;
  width: var(--widget-width-md);
}
.fixture_settings_body {
  /* top-aligned, like the other widgets (the widget body centres by default) */
  align-self: stretch;
  height: 100%;
  width: 100%;
  padding: var(--space-5);
  box-sizing: border-box;
}
.fixture_settings_main {
  flex: 1;
  min-width: 0;
}
.fixture_settings_patch {
  width: 64px;
  flex-shrink: 0;
}
</style>
