<template>
  <uk-widget
    class="cells_widget"
    :header="{ title: 'Cells', icon: 'grid' }"
    dockable
  >
    <uk-list
      class="cells_widget_list"
      filterable
      :items="items"
      :selection="selection"
      @selection="emitSelection"
    />
  </uk-widget>
</template>

<script>
/**
 * Name of the item standing for every cell
 *
 * @constant {String} ALL_CELLS
 */
const ALL_CELLS = 'All cells';

/**
 * @component Cell selector of multi-cell fixtures: All cells, or one or several cells
 * (Ctrl/Shift). Shared by the universe and scene modifiers.
 */
export default {
  name: 'ModifierWidgetCells',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * Cell names, in fixture order
     */
    cells: {
      type: Array,
      default: () => [],
    },
    /**
     * Selected cells (names), null for all of them
     */
    modelValue: {
      type: Array,
      default: null,
    },
  },
  emits: ['change'],
  computed: {
    /**
     * List items: All cells, then each cell
     */
    items() {
      return [ALL_CELLS, ...this.cells].map((name, id) => ({
        name,
        id,
        icon: id ? 'grid' : 'fixture',
      }));
    },
    /**
     * Rows to show selected: the selected cells, else All cells
     *
     * @type {Array<Number>}
     */
    selection() {
      const ids = (this.modelValue || [])
        .map((name) => this.cells.indexOf(name) + 1)
        .filter((id) => id > 0);
      return ids.length ? ids : [0];
    },
  },
  methods: {
    /**
     * Emits the selected cells: their names, or null for all cells
     *
     * @public
     * @param {Array<Object>} items Selected list items
     */
    emitSelection(items) {
      const cells = items.filter((item) => item.id > 0).map((item) => item.name);
      this.$emit('change', !cells.length || items.some((item) => item.id === 0) ? null : cells);
    },
  },
};
</script>

<style scoped>
.cells_widget {
  min-width: 160px;
}
.cells_widget_list {
  height: 100%;
}
</style>
