<template>
  <uk-widget class="fixture_settings" dockable :header="header">
    <uk-flex v-if="fixture" :gap="8" col class="fixture_settings_body">
      <uk-flex :gap="8">
        <uk-txt-input style="flex: 1" label="Name" v-model.lazy="fixture.name" />
        <uk-num-input style="width: 70px" class="field" label="Address" v-model.lazy="fixture.chStart" />
      </uk-flex>
      <uk-txt-input readonly label="Model" v-model="fixture.model" />
      <uk-select-input v-if="fixture.modeIndex != null" label="Mode" :value="0" v-model="fixture.modeIndex" :options="fixture.modeNames" />
    </uk-flex>
  </uk-widget>
</template>

<script>
export default {
  name: "universeModifierWidgetFixtureSettings",
  props: {
    /**
     * Handle to fixture instance
     */
    fixture: Object,
  },
  data() {
    return {
      /**
       * Widget header data
       */
      header: {
        title: "Fixture Settings",
        icon: "wrench",
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
