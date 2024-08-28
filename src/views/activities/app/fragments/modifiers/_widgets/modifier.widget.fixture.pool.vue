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
      auto-select-first
      :auto-select="selected"
      :items="pool.listable"
      :prevent-unfocus="preventUnfocus"
      @select="selectFixture"
      @delete="deleteFixtures"
      @highlight="highlightFixtures"
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
     * Which index of the list should be selected on mount
     */
    autoSelect: {
      type: Number,
      default: 0,
    },
    /**
     * List of elements that will not propagate unfocus event to component
     */
    preventUnfocus: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['select', 'delete', 'highlight', 'focused'],
  data() {
    return {
      /**
       * Widget header data
       */
      header: {
        title: 'Fixture Pool',
        icon: 'patch',
      },
      /**
       * Currently selected fixture
       */
      selected: 0,
    };
  },
  watch: {
    '$route.query.fixtureId': function watchFixtureId(fixtureId) {
      if (fixtureId !== this.selected) {
        const fixture = this.pool.fixtures.find((f) => f.id === Number(fixtureId));
        if (fixture) {
          this.selectFixture(fixture);
        }
      }
    },
  },
  mounted() {
    const visualizerEl = document.getElementById('visualizer');
    this.preventUnfocus.push(...[visualizerEl]);
  },
  methods: {
    /**
     * Highlights and forwards fixture selection event to parent
     *
     * @public
     * @param {Object} fixture reference to fixture defintion object
     */
    selectFixture(fixture) {
      this.selected = this.pool.fixtures.findIndex((f) => f.id === fixture.id);
      fixture = this.pool.getFromId(fixture.id);
      fixture.highlightSingle(true, true);
      this.$emit('select', fixture.id);
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
     * Highlights and forwards fixture highlighting event
     *
       * @public
     * @param {Array} fixtures Array of references to fixture defintion object
     */
    highlightFixtures(fixtures) {
      fixtures.forEach((fixtureData, index) => {
        const fixture = this.pool.getFromId(fixtureData.id);
        if (index === 0) {
          fixture.highlightSingle(false, false);
        }
        fixture.highlight(true, true);
      });
      this.$emit('highlight', fixtures);
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
     s* @public
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
