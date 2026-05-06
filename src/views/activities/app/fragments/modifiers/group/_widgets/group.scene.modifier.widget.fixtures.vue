<template>
  <uk-widget
    :disabled="!scene.listableFixtures || !scene.listableFixtures.length"
    class="scene_fixtures"
    :header="{ title: 'Scene Fixtures', icon: 'mixer' }"
    dockable
  >
    <uk-list
      :key="scene.id"
      auto-select-first
      class="scene_fixtures_list"
      :items="scene.listableFixtures ? scene.listableFixtures : []"
      filterable
      @highlight="selectMultipleFixtures"
      @select="selectFixture"
    />
  </uk-widget>
</template>

<script>
export default {
  name: 'GroupSceneModifierFixtures',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Handle to scene instance
     */
    scene: {
      type: Object,
      default: () => ({
        name: '',
      }),
    },
  },
  emits: ['select', 'focused'],
  methods: {
    /**
     * Selects a fixture from the scene fixture list
     *
     * @public
     * @param {Object} fixtureData fixture data object
     */
    selectFixture(fixtureData) {
      this.selectedFixtureValues = [];
      if (fixtureData) {
        this.selectedFixtureValues.push(this.scene.getFixtureValueFromId(fixtureData.id));
        if (this.selectedFixtureValues.length) {
          this.selectedFixtureValues[0].fixture.highlightSingle(true, true);
          this.$emit('select', this.selectedFixtureValues);
        }
      }
    },
    /**
     * Selects multiple fixtures from the scene fixture list
     *
     * @public
     * @param {Array} fixtureList list of fixture data object
     */
    selectMultipleFixtures(fixtureList) {
      this.selectedFixtureValues = [this.scene.getFixtureValueFromId(0)];
      if (fixtureList.length > 1) {
        this.scene.getFixtureValueFromId(fixtureList[0].id).fixture.highlightSingle(false, true);
        this.selectedFixtureValues = fixtureList.map((fixtureData, index) => {
          const fixtureValue = this.scene.getFixtureValueFromId(fixtureData.id);
          if (index) {
            fixtureValue.fixture.highlight(true, true);
          } else {
            fixtureValue.fixture.highlightSingle(true, true);
          }
          return fixtureValue;
        });
      }
      this.$emit('select', this.selectedFixtureValues);
    },
  },
};
</script>

<style scoped>
.scene_fixtures {
  min-width: 250px;
}
.scene_fixtures_list {
  height: 100%;
  width: 100%;
}
</style>
