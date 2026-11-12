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
    <!-- Grip to drag the row (reorderable lists) -->
    <span
      v-if="handle"
      class="uikit_list_item_handle"
      title="Drag to reorder"
      @pointerdown.stop="$emit('handle', $event)"
      @click.stop
    >
      <uk-icon name="drag" />
    </span>
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
    /** Shows a grip at the left of the row; pressing it emits `handle` (drag to reorder) */
    handle: Boolean,
  },
  emits: ['click', 'toggle', 'handle'],
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
  },
};
</script>

<style scoped>
.uikit_list_item {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 30px;
  border-top: 1px solid transparent;
  border-bottom: 1px solid var(--primary-dark);
  padding: 0 8px;
  width: 100%;
  --row-bg: var(--primary-light);
  background: var(--row-bg);
  opacity: 0.9;
  transition: background-color 0.1s;
  gap: 10px;
}
.tall {
  min-height: 40px !important;
}
.uikit_list_item h4 {
  font-family: Roboto-medium;
}
.large {
  min-height: 40px;
  height: auto;
  padding: 0 16px;
  gap: 12px;
}
.large h4 {
  font-size: 14px;
}
.large .uikit_list_item_icon {
  width: 16px !important;
  height: 16px !important;
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
  background: var(--row-bg);
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
.uikit_list_item_handle {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 100%;
  margin: 0 -6px 0 -4px;
  cursor: grab;
  touch-action: none;
}
.uikit_list_item_handle :deep(svg) {
  width: 14px;
  height: 14px;
  fill: var(--secondary-light);
  transition: fill 0.1s;
}
.uikit_list_item:hover .uikit_list_item_handle :deep(svg),
.uikit_list_item_handle:active :deep(svg) {
  fill: var(--secondary-lighter);
}
@media (prefers-reduced-motion: reduce) {
  .uikit_list_item_arrow {
    transition: none;
  }
}
.selected:not(.noSelect){
  --row-bg: var(--secondary-dark) !important;
  background: var(--row-bg) !important;
  opacity: 1;
}
.selected.highlighted:not(.noSelect) {
  --row-bg: var(--secondary-dark) !important;
  background: var(--row-bg) !important;
  opacity: 1;
}
.selected.focused:not(.noSelect) {
  --row-bg: var(--accent-blue) !important;
  background: var(--row-bg) !important;
  border-color: var(--accent-blue)!important;
  opacity: 1;
}
.highlighted:not(.noSelect){
  --row-bg: var(--secondary-darker) !important;
  background: var(--row-bg) !important;
}
.highlighted.focused:not(.noSelect)  {
  border-color: var(--accent-blue)!important;
  --row-bg: var(--accent-blue) !important;
  background: var(--row-bg) !important;
}
.unfold:active {
  background: var(--secondary-dark) !important;
}
.uikit_list_item_icon {
  width: 14px !important;
  height: 14px !important;
  fill: var(--secondary-lighter) !important;
}
.uikit_list_item_icon_small {
  width: 10px !important;
  height: 10px !important;
  fill: var(--secondary-lighter) !important;
}
.uikit_list_item.unfold {
  min-height: 30px;
  max-height: 30px;
  height: unset !important;
  font-weight: bold;
}
.unfold > .uikit_list_item {
  margin-left: 16px !important;
}
.uikit_list_item_colored_dot {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background: #533aaa;
  border: 1px solid;
}
.uikit_list_item_more {
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
