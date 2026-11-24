<template>
  <div
    class="uikit_list_item"
    :class="{
      highlighted: item.highlighted && !noHighlight,
      selected: item.selected,
      unfold: item.value.unfold,
      unfolded: item.unfolded && item.value.unfold?.length,
      deletable: deletable,
      focused: focused,
      disabled: item.value.disabled || disabled,
      empty: empty,
      tall: tall,
      large: large,
      noSelect: noSelect,
    }"
    @click="(e)=>$emit('click',e)"
  >
    <!-- The checkbox only shows the state: one toggle path, so a click flips it once -->
    <span
      v-if="toggleable"
      class="uikit_list_item_check"
      @click.stop="toggle"
    >
      <uk-checkbox
        :model-value="!!item.toggled"
        :disabled="item.value.disabled || disabled"
      />
    </span>
    <span
      v-if="!item.value.icon && colored && item.value.color"
      class="uikit_list_item_colored_dot"
      :style="{
        backgroundColor: item.unfolded ? item.value.color : 'transparent',
        borderColor: item.value.color
      }"
    />
    <uk-icon
      v-if="item.value.icon"
      class="uikit_list_item_icon"
      :name="item.value.icon"
    />
    <h4>{{ item.value.name }}</h4>
    <div style="flex: 1" />
    <h4
      v-if="item.value.more"
      class="uikit_list_item_more"
    >
      {{ item.value.more }}
    </h4>
    <span
      v-if="item.value.action"
      @click.stop
      @pointerdown.stop
    >
      <uk-button
        :icon="item.value.action.icon"
        :label="item.value.action.label"
        @click="item.value.action.callback"
      />
    </span>
    <uk-icon
      v-if="item.value.unfold"
      class="uikit_list_item_icon_small uikit_list_item_arrow"
      :class="{ open: item.unfolded }"
      name="arrow_down"
    />
    <!-- Deletes the row (deletable lists) -->
    <span
      v-if="deletable"
      class="uikit_list_item_tool uikit_list_item_delete"
      title="Delete"
      @pointerdown.stop
      @click.stop="remove"
    >
      <uk-icon name="trash" />
    </span>
    <!-- Grip to drag the row (reorderable lists) -->
    <span
      v-if="handle"
      class="uikit_list_item_tool uikit_list_item_handle"
      title="Drag to reorder"
      @pointerdown.stop="$emit('handle', $event)"
      @click.stop
    >
      <uk-icon name="drag" />
    </span>
  </div>
</template>

<script>
export default {
  name: 'UkListItem',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * The row to display: `{ value, selected, highlighted, toggled, unfolded }`, where `value` is
     * the caller's item (`name`, `icon`, `color`, `more`, `action`, `unfold`, `disabled`).
     * Read only: the row reports clicks, checks and handle presses through its events.
     */
    item: {
      type: Object,
      default: null,
    },
    toggleable: Boolean,
    noHighlight: Boolean,
    colored: Boolean,
    /** Shows a trash icon at the right of the row; clicking it emits `delete` */
    deletable: Boolean,
    focused: Boolean,
    disabled: Boolean,
    tall: Boolean,
    /**
     * Roomier reading mode (opt-in): 40px rows, wider padding, 14px labels and 16px icons, for
     * lists people read rather than scan (e.g. the user manual's navigation)
     */
    large: Boolean,
    noSelect: Boolean,
    empty: Boolean,
    /** Shows a grip at the right of the row; pressing it emits `handle` (drag to reorder) */
    handle: Boolean,
  },
  emits: ['click', 'toggle', 'handle', 'delete'],
  methods: {
    /**
     * Reports a click on the checkbox, unless the row is disabled
     *
     * @public
     */
    toggle() {
      if (this.item.value.disabled || this.disabled) return;
      /**
       * The row's checkbox was clicked
       */
      this.$emit('toggle');
    },
    /**
     * Reports a click on the trash icon, unless the row is disabled
     *
     * @public
     */
    remove() {
      if (this.item.value.disabled || this.disabled) return;
      /**
       * The row's trash icon was clicked
       */
      this.$emit('delete');
    },
  },
};
</script>

<style scoped>
.uikit_list_item {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: var(--row-height);
  border-top: var(--border-width) solid transparent;
  border-bottom: var(--border-width) solid var(--primary-dark);
  padding: 0 var(--space-4);
  width: 100%;
  --row-bg: var(--primary-light);
  /* Row colours are tints (hover, selected): laid over a solid base, so an idle (striped)
     background behind the list never shows through */
  background: linear-gradient(var(--row-bg), var(--row-bg)), var(--primary-light);
  transition: background-color 0.1s;
  gap: var(--space-5);
}
.tall {
  min-height: var(--row-height-tall) !important;
}
.uikit_list_item h4 {
  font-family: Roboto-medium;
}
.large {
  min-height: var(--row-height-tall);
  height: auto;
  padding: 0 var(--space-7);
  gap: var(--space-6);
}
.large h4 {
  font-size: var(--font-md);
}
.large .uikit_list_item_icon {
  flex-shrink: 0;
  width: var(--icon-md) !important;
  min-width: var(--icon-md) !important;
  max-width: var(--icon-md) !important;
  height: var(--icon-md) !important;
  min-height: var(--icon-md) !important;
  max-height: var(--icon-md) !important;
}
.unfold h4 {
  font-family: Roboto-bold !important;
}
.uikit_list_item_unfoldable {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.uikit_list_item:hover {
  --row-bg: var(--secondary-darker);
  background: linear-gradient(var(--row-bg), var(--row-bg)), var(--primary-light);
  cursor: pointer;
}
.uikit_list_item_check {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.uikit_list_item_check :deep(.uikit_checkbox) {
  pointer-events: none;
}
.disabled .uikit_list_item_check {
  cursor: not-allowed;
}
.uikit_list_item_arrow {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.uikit_list_item_arrow.open {
  transform: rotate(180deg);
  opacity: 0.5;
}
.uikit_list_item_tool {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--icon-md);
  min-width: var(--icon-md);
  height: 100%;
  cursor: pointer;
}
.uikit_list_item_tool + .uikit_list_item_tool {
  margin-left: -4px;
}
.uikit_list_item_handle {
  cursor: grab;
  touch-action: none;
}
.uikit_list_item_tool :deep(svg) {
  flex-shrink: 0;
  width: var(--icon-sm);
  min-width: var(--icon-sm);
  max-width: var(--icon-sm);
  height: var(--icon-sm);
  min-height: var(--icon-sm);
  max-height: var(--icon-sm);
  fill: var(--secondary-light);
  transition: fill 0.1s;
}
/* Same colour as the row's label when the row is selected or hovered */
.uikit_list_item:hover .uikit_list_item_tool :deep(svg),
.selected:not(.noSelect) .uikit_list_item_tool :deep(svg),
.highlighted:not(.noSelect) .uikit_list_item_tool :deep(svg),
.uikit_list_item_tool:active :deep(svg) {
  fill: var(--secondary-lighter);
}
.disabled .uikit_list_item_tool {
  cursor: not-allowed;
}
.disabled .uikit_list_item_tool :deep(svg) {
  fill: var(--secondary-light) !important;
}
@media (prefers-reduced-motion: reduce) {
  .uikit_list_item_arrow {
    transition: none;
  }
}
.selected:not(.noSelect){
  --row-bg: var(--secondary-dark) !important;
  background: linear-gradient(var(--row-bg), var(--row-bg)), var(--primary-light) !important;
  opacity: 1;
}
.selected.highlighted:not(.noSelect) {
  --row-bg: var(--secondary-dark) !important;
  background: linear-gradient(var(--row-bg), var(--row-bg)), var(--primary-light) !important;
  opacity: 1;
}
.selected.focused:not(.noSelect) {
  --row-bg: var(--accent-blue) !important;
  background: linear-gradient(var(--row-bg), var(--row-bg)), var(--primary-light) !important;
  border-color: var(--accent-blue)!important;
  opacity: 1;
}
.highlighted:not(.noSelect){
  --row-bg: var(--secondary-darker) !important;
  background: linear-gradient(var(--row-bg), var(--row-bg)), var(--primary-light) !important;
}
.highlighted.focused:not(.noSelect)  {
  border-color: var(--accent-blue)!important;
  --row-bg: var(--accent-blue) !important;
  background: linear-gradient(var(--row-bg), var(--row-bg)), var(--primary-light) !important;
}
.unfold:active {
  background:
    linear-gradient(var(--secondary-dark), var(--secondary-dark)),
    var(--primary-light) !important;
}
.uikit_list_item_icon {
  flex-shrink: 0;
  width: var(--icon-sm) !important;
  min-width: var(--icon-sm) !important;
  max-width: var(--icon-sm) !important;
  height: var(--icon-sm) !important;
  min-height: var(--icon-sm) !important;
  max-height: var(--icon-sm) !important;
  fill: var(--secondary-lighter) !important;
}
.uikit_list_item_icon_small {
  flex-shrink: 0;
  width: var(--icon-xs) !important;
  min-width: var(--icon-xs) !important;
  max-width: var(--icon-xs) !important;
  height: var(--icon-xs) !important;
  min-height: var(--icon-xs) !important;
  max-height: var(--icon-xs) !important;
  fill: var(--secondary-lighter) !important;
}
.uikit_list_item.unfold {
  min-height: var(--row-height);
  max-height: var(--row-height);
  height: unset !important;
  font-weight: bold;
}
.unfold > .uikit_list_item {
  margin-left: var(--space-7) !important;
}
.uikit_list_item_colored_dot {
  flex-shrink: 0;
  height: 8px;
  min-height: 8px;
  width: 8px;
  min-width: 8px;
  border-radius: var(--radius-round);
  background: var(--accent-dark-purple);
  border: var(--border-width) solid;
}
/* The detail (address, count...) stays whole: the label is cut first */
.uikit_list_item_more {
  flex-shrink: 0;
  color: var(--secondary-light-alt);
  font-family: roboto-regular!important;
}
.selected.focused .uikit_list_item_more{
  color: var(--secondary-lighter)!important
}
.disabled h4 {
  color: var(--secondary-light) !important;
}
.disabled .uikit_list_item_icon {
  fill: var(--secondary-light) !important;
}
.disabled:hover {
  background: unset;
  cursor: not-allowed;
}
.empty {
  background: var(--primary-light) var(--idle-stripes);
  text-transform: uppercase!important;
}
.unfold{
  flex: 1
}
</style>
