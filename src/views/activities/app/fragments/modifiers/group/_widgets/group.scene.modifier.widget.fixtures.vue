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
      @focused="setFocus"
      :items="scene.listableFixtures ? scene.listableFixtures : []"
      filterable
    />
  </uk-widget>
</template>

<script>
export default {
  name: "groupSceneModifierFixtures",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  emits:['select', 'focused'],
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
      this.selectedFixtureValues = [];
      if (fixtureData) {
        this.selectedFixtureValues.push(this.scene.getFixtureValueFromId(fixtureData.id));
        if (this.selectedFixtureValues.length) {
          this.selectedFixtureValues[0].fixture.highlightSingle(true, true);
          this.$emit("select", this.selectedFixtureValues);
        }
      }
    },
    /**
     * Forwards list focus event
     *
     * @public
     * @param {Boolean} state List focusing state
     */
    setFocus(state) {
      if (!state) {
        if (this.selectedFixtureValues && this.selectedFixtureValues.length) {
          this.selectedFixtureValues[0].fixture.highlightSingle(false, true);
        }
      }
      this.$emit("focused", state);
    },
    /**
     * Selects multiple fixtures from the scene fixture list
     *
     * @public
     * @param {Array} fixtureList list of fixture data object
     */
    selectMultipleFixtures(fixtureList) {
      if (fixtureList.length > 1) {
        this.scene.getFixtureValueFromId(fixtureList[0].id).fixture.highlightSingle(false, true);
        this.selectedFixtureValues = fixtureList.map((fixtureData, index) => {
          let fixtureValue = this.scene.getFixtureValueFromId(fixtureData.id);
          index == 0 ? fixtureValue.fixture.highlightSingle(true, true) : fixtureValue.fixture.highlight(true, true);
          return fixtureValue;
        });
        this.$emit("select", this.selectedFixtureValues);
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
