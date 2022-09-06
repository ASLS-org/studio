<template>
  <uk-widget
    :disabled="!scene.listableFixtures || !scene.listableFixtures.length"
    class="scene_fixtures"
    :header="{ title: 'Scene Fixtures', icon: 'mixer' }"
    dockable
  >
    <uk-list
      auto-select-first
      :key="scene.id"
      :preventUnfocus="preventUnfocus"
      class="scene_fixtures_list"
      @highlight="selectMultipleFixtures"
      @select="selectFixture"
      :items="scene.listableFixtures ? scene.listableFixtures : []"
      filterable
    />
  </uk-widget>
</template>

<script>
export default {
  name: "groupSceneModifierFixtures",
  props: {
    /**
     * Handle to scene instance
     */
    scene: {
      type: Object,
      default: () => ({
        name: "",
      }),
    },
    /**
     * List of elements for which unfocus will be prevented
     */
    preventUnfocus: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    /**
     * Selects a fixture from the scene fixture list
     * 
       * @public
     * @param {Object} fixtureData fixture data object 
     */
    selectFixture(fixtureData) {
      this.selectedFixtureValue = [];
      if (fixtureData) {
        let fixtureValue = this.scene.getFixtureValueFromId(fixtureData.id);
        if (fixtureValue) {
          fixtureValue.fixture.highlightSingle(true);
          this.$emit("select", [fixtureValue]);
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
      if (fixtureList.length>1) {
        this.$emit(
          "select",
          fixtureList.map((fixtureData, index) => {
            let fixtureValue = this.scene.getFixtureValueFromId(fixtureData.id);
            index == 0 ? fixtureValue.fixture.highlightSingle(true) : fixtureValue.fixture.highlight(true);
            return fixtureValue;
          })
        );
      }
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
