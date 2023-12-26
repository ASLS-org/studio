<template>
  <div
    @click="(e)=>$emit('click',e)"
    class="uikit_list_item"
    :class="{
      highlighted: highlighted && !noHighlight,
      selected: selected,
      unfold: value.unfold,
      unfolded: unfolded && value.unfold.length,
      deletable: deletable,
      focused: focused,
      disabled: value.disabled || disabled,
      empty: empty,
      tall: tall,
      noSelect: noSelect,
    }"
  >
    <uk-checkbox v-model="toggled" :disabled="value.disabled" style="margin-right: 16px" v-if="toggleable" />
    <span class="uikit_list_item_colored_dot" :style="{ backgroundColor: value.color }" v-if="!value.icon && colored && value.color" />
    <uk-icon class="uikit_list_item_icon" v-if="value.icon" :name="value.icon" />
    <h4>{{ value.name }}</h4>
    <div style="flex: 1" />
    <h4 class="uikit_list_item_more" v-if="value.more">{{ value.more }}</h4>
    <uk-icon v-if="value.unfold" class="uikit_list_item_icon_small" :name="unfolded ? 'arrow_up' : 'arrow_down'" />
    <uk-icon v-if="deletable" class="uikit_list_item_icon_small" name="cross" />
  </div>
</template>

<script>
export default {
  name: "ukListItem",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  emits: ['click'],
  props: {
    /**
     * Handle to the list item
     */
    item: Object,
    /**
     * Whether the list item is toggleable or not (appends checkbox to item)
     */
    toggleable: Boolean,
    /**
     * Whether item highlighting should be disabled orr not
     */
    noHighlight: Boolean,
    /**
     * Whether alternative colored styling should be applied
     */
    colored: Boolean,
    /**
     * Whether the item is deletable
     */
    deletable: Boolean,
    /**
     * Item's foxus state
     */
    focused: Boolean,
    /**
     * Whether the item is disabled
     */
    disabled: Boolean,
    /**
     * Whether alternative "tall" styling t=should be applied (40px height)
     */
    tall: Boolean,
    /**
     * Whether item selected styling should be disabled whatsoever
     */
    noSelect: Boolean,
    /**
     * Whether the item is an empty placehoder
     */
    empty: Boolean,
  },
  data() {
    return {
      /**
       * The item's value
       */
      value: this.item.value,
      /**
       * Whether the item is currently selected or not
       */
      selected: this.item.selected,
      /**
       * Whether the item is currently highlighted or not
       */
      highlighted: this.item.highlighted,
      /**
       * Whether the item is currently toggled or not
       */
      toggled: this.item.toggled,
      /**
       * Whether the item is currently unfolded or not
       */
      unfolded: this.item.unfolded,
    };
  },
  watch: {
    item: {
      deep: true,
      handler() {
        this.value = this.item.value;
        this.selected = this.item.selected;
        this.highlighted = this.item.highlighted;
        this.unfolded = this.item.unfolded;
        this.toggled = this.item.toggled;
      },
    },
  },
};
</script>

<style scoped>
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
}
.tall {
  height: 40px !important;
}
.uikit_list_item h4 {
  font-family: Roboto-medium !important;
}
.unfold h4 {
  font-family: Roboto-bold !important;
}
.uikit_list_item_unfoldable {
  display: flex;
  flex-direction: column;
  width: 100%;
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
.selected:not(.noSelect) {
  background: var(--secondary-dark) !important ;
  opacity: 1;
}
.selected.focused:not(.noSelect) {
  background: #2d6ba2 !important;
  border-color: var(--secondary-darker);
  opacity: 1;
}
.highlighted {
  border-color: #2d6ba2;
  background: #2d6ba2 !important;
}
.unfold:active {
  background: var(--secondary-dark) !important;
}
.uikit_list_item_icon {
  margin-right: 10px;
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
  height: unset !important;
  font-weight: bold;
}
.unfold > .uikit_list_item {
  margin-left: 16px !important;
}
.uikit_list_item_colored_dot {
  height: 10px;
  width: 10px;
  border-radius: 50%;
  background: #533aaa;
  margin-right: 8px;
}
.uikit_list_item_more {
  width: 75px;
}
.disabled h4 {
  color: var(--secondary-light) !important;
}
.disabled .uikit_list_item_icon {
  fill: var(--secondary-light) !important;
}
.disabled:hover {
  background: unset;
  cursor: unset;
}
.empty {
  background: var(--primary-light) repeating-linear-gradient(45deg, #1619130a, #1619130a 10px, #0c0e0a38 10px, #0c0e0a38 20px);
  text-transform: uppercase!important;
}
</style>
