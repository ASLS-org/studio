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
      noSelect: noSelect,
    }"
    @click="(e)=>$emit('click',e)"
  >
    <uk-checkbox
      v-if="toggleable"
      v-model="item.toggled"
      :disabled="item.value.disabled"
    />
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
    <uk-button
      v-if="item.value.action"
      :icon="item.value.action.icon"
      :label="item.value.action.label"
      @click="item.value.action.callback"
    />
    <uk-icon
      v-if="item.value.unfold && !item.unfolded"
      class="uikit_list_item_icon_small"
      name="arrow_down"
    />
    <uk-icon
      v-if="item.value.unfold && item.unfolded"
      class="uikit_list_item_icon_small"
      style="opacity: .5"
      name="arrow_up"
    />
    <uk-icon
      v-if="deletable"
      class="uikit_list_item_icon_small"
      name="cross"
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
     * Handle to the list item. This is a reactive object owned by the
     * parent UkList — we read and write its fields directly rather than
     * mirroring them into local state, so the parent's tree stays the
     * single source of truth (no sync watcher needed).
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
    noSelect: Boolean,
    empty: Boolean,
  },
  emits: ['click'],
};
</script>

<style scoped>
/* unchanged */
.uikit_list_item {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 30px;
  border-top: 1px solid transparent;
  border-bottom: 1px solid var(--primary-dark);
  padding: 0 8px;
  width: 100%;
  background: var(--primary-light);
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
  background: var(--secondary-darker);
  cursor: pointer;
}
.deletable .uikit_list_item_icon_small {
  display: none !important;
}
.deletable:hover .uikit_list_item_icon_small,
.deletable.selected .uikit_list_item_icon_small {
  display: initial !important;
}
.selected:not(.noSelect){
  background: var(--secondary-dark) !important ;
  opacity: 1;
}
.selected.highlighted:not(.noSelect) {
  background: var(--secondary-dark) !important ;
  opacity: 1;
}
.selected.focused:not(.noSelect) {
  background-color: var(--accent-blue)!important;
  border-color: var(--accent-blue)!important;
  opacity: 1;
}
.highlighted:not(.noSelect){
  background: var(--secondary-darker) !important ;
}
.highlighted.focused:not(.noSelect)  {
  border-color: var(--accent-blue)!important;
  background: var(--accent-blue)!important;
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
  background: var(--primary-light) repeating-linear-gradient(
    45deg,
   #1619130a,
    #1619130a 10px,
    #0c0e0a38 10px,
    #0c0e0a38 20px
  );
  text-transform: uppercase!important;
}
.unfold{
  flex: 1
}
</style>
