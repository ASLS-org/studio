<template>
  <uk-widget
    :disabled="!scene.listableFixtures || !scene.listableFixtures.length"
    class="scene_fixtures"
    :header="{ title: 'Scene Fixtures', icon: 'mixer' }"
    dockable
  >
    <uk-list
      :key="scene.id"
      class="scene_fixtures_list"
      :items="scene.listableFixtures ? scene.listableFixtures : []"
      :selection="selection"
      filterable
      @selection="emitSelection"
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
    /**
     * Selected fixture ids, main one first (the group's selection, from the view state)
     */
    selection: {
      type: Array,
      default: null,
    },
  },
  emits: ['selection'],
  methods: {
    /**
     * Forwards the selection the operator made: fixture ids, main one first
     *
     * @public
     * @param {Array<Object>} items listable data of the selected rows, selected one first
     */
    emitSelection(items) {
      this.$emit('selection', items.map((item) => item.id));
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
