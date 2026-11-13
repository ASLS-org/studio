<template>
  <uk-widget
    class="modifier_widget_fixture_pool"
    :header="header"
    dockable
    :action="action"
  >
    <uk-list
      v-if="pool"
      class="modifier_widget_fixture_pool_body"
      filterable
      deletable
      draggable
      :items="pool.listable"
      :selection="selection"
      @selection="emitSelection"
      @delete="deleteFixtures"
      @focused="setFocus"
      @reorder="reorderFixtures"
    />
  </uk-widget>
</template>

<script>
/**
 * NOTICE: It might seem like this component is useless as it mostly just forwards the exact same
 * events as a uikit list component. However it seemed like just setting a list component in the
 * modifier caused some weird reactivity issues. I had no time to find a way to patch it but this
 * should be looked into.
 * @todo find a way to either improve or remove this component
 */
export default {
  name: 'ModifierWidgetFixturePool',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Handle to fixture pool
     */
    pool: {
      type: Object,
      default: () => ({
        listable: [],
      }),
    },
    /**
     * Action description object
     */
    action: {
      type: Object,
      default: null,
    },
    /**
     * Selected fixture ids, main one first (the panel's selection, from the view state)
     */
    selection: {
      type: Array,
      default: null,
    },
  },
  emits: ['selection', 'delete', 'focused'],
  data() {
    return {
      /**
       * Widget header data
       */
      header: {
        title: 'Fixture Pool',
        icon: 'patch',
      },
    };
  },
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
    /**
     * Forwards fixture deletion event
     *
     * @public
     * @param {Array} fixtures Array of references to fixture defintion object
     */
    deleteFixtures(fixtures) {
      this.$emit('delete', fixtures);
    },
    /**
     * Forwards list focus event
     *
       * @public
     * @param {Boolean} state List focusing state
     */
    setFocus(state) {
      this.$emit('focused', state);
    },
    /**
     * Reorder list items
     *
     * @public
     * @param {Object} reorderData list reordering object
     * @param {Number} reorderData.original original item index
     * @param {Number} reorderData.final final item index
     */
    reorderFixtures(reorderData) {
      this.pool.moveItem(reorderData.original, reorderData.final);
    },
  },
};
</script>

<style scoped>
.modifier_widget_fixture_pool {
  min-width: 250px;
}
.modifier_widget_fixture_pool_body {
  width: 100%;
  height: 100%;
}
</style>
