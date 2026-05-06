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
        v-model="fixture.modeIndex"
        label="Mode"
        :options="fixture.modeNames"
      />
    </uk-flex>
  </uk-widget>
</template>

<script>
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
    };
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
