<template>
  <div class="uikit_list">
    <uk-list-item
      v-if="toggleable && !tree.some(i=>i.value.unfold)"
      toggleable
      :item="{
        value: {
          name: toggledItems.length ? 'Uncheck All' : 'Check All',
          more: `${toggledItems.length}/${items.length}`,
        },
        toggled: toggledItems.length,
      }"
      style="padding: 6px 8px;"
      @click="checkAll(!toggledItems.length)"
    />
    <uk-txt-input
      v-if="filterable"
      v-model="searchString"
      :disabled="disabled"
      :outlined="false"
      auto-update
      class="uikit_list_searchbox"
      :placeholder="'Search items'"
    />
    <div
      v-if="filteredItems.length != 0"
      tabindex="0"
      class="uikit_list_body"
      @focus="handleFocusIn"
      @focusout="handleFocusOut"
    >
      <div
        v-for="(treeItem, index) in filteredItems"
        :key="index"
        class="uikit_list_item parent"
        :style="{
          flex: treeItem.unfolded ? 1 : 'unset',
          overflowY: treeItem.unfolded && treeItem.value.unfold && accordion ? 'hidden' : 'visible',
        }"
      >
        <div
          v-if="treeItem.value.unfold"
          class="uikit_list_item_unfoldable"
        >
          <uk-list-item
            :colored="colored"
            :index="index"
            :item="treeItem"
            :tall="tall"
            @click="unfold(treeItem)"
          />
          <Transition
            name="fadeHeight"
          >
            <span
              v-if="treeItem.unfolded"
              :style="{
                overflowY: 'auto'
              }"
            >
              <template v-if="treeItem.value.unfold && treeItem.value.unfold.length">
                <uk-list-item
                  v-show="toggleable"
                  toggleable
                  :item="{
                    value: {
                      name: treeItem.value.unfold.filter(i=>i.toggled).length
                        ? 'Uncheck All'
                        : 'Check All',
                      more: `${treeItem.value.unfold.filter(i=>i.toggled).length}
                      /${treeItem.value.unfold.length}`,
                    },
                    toggled: treeItem.value.unfold.filter(i=>i.toggled).length,
                  }"
                  style="padding: 6px 6px 6px 16px;"
                  @click="checkAll(!treeItem.value.unfold.filter(i=>i.toggled).length, treeItem)"
                />
                <uk-list-item
                  v-for="(subTreeItem, subIndex) in treeItem.value.unfold"
                  :key="subIndex"
                  class="uikit_sublist_body"
                  :item="subTreeItem"
                  :toggleable="toggleable"
                  :no-highlight="noHighlight"
                  :focused="hasFocus"
                  :tall="tall"
                  :no-select="noSelect"
                  @click="(e) => selectItem(e, subTreeItem, treeItem.value.unfold)"
                  @toggle="toggleItem(subTreeItem)"
                />
              </template>
            </span>
          </Transition>
          <div
            v-if="treeItem.unfolded && !treeItem.value.unfold.length"
            class="uikit_list_body_empty"
          >
            <h3 v-if="!treeItem.value.unfold.length">
              Nothing to display
            </h3>
            <!-- <uk-button
              label="patch fixture"
            /> -->
          </div>
        </div>
        <uk-list-item
          v-else
          :item="treeItem"
          :colored="colored"
          :toggleable="toggleable"
          :focused="hasFocus"
          :tall="tall"
          :no-select="noSelect"
          :draggable="draggable"
          @dragstart="
            (e) => {
              startDrag(e, index);
            }
          "
          @dragend.prevent="
            (e) => {
              stopDrag(e, index);
            }
          "
          @dragover.prevent
          @dragenter.prevent="
            (e) => {
              dragEnter(e, index);
            }
          "
          @dragleave.prevent="
            (e) => {
              dragOut(e, index);
            }
          "
          @drop.prevent="
            (e) => {
              drop(e, index);
            }
          "
          @click="(e) => selectItem(e, treeItem, filteredItems)"
          @toggle="toggleItem(treeItem)"
        />
        <div
          class="uikit_sublist_body_empty"
        />
      </div>
    </div>
    <div
      v-else
      class="uikit_list_body_empty"
    >
      <h3>
        Nothing to display
      </h3>
      <!-- <uk-button
        label="patch fixture"
      /> -->
    </div>
    <uk-popup
      ref="popup"
      v-model="deletePopupState"
      :header="{ title: 'Delete items ?' }"
      backdrop
      @submit="handleDeletion"
    >
      <uk-flex
        col
        style="max-width: 350px;min-width:350px"
      >
        <p style="padding: 16px; flex-direction: column; align-items: start;gap:10px">
          <b>
            Are you sure you want to delete the following
            {{ highlightedItems.length || '' }}
            item(s)?
          </b>
          <uk-flex col>
            <p
              v-for="(item, key) in
                highlightedItems.length
                  ? highlightedItems.slice(0,5)
                  : [selectedItem]
              "
              :key="key"
            >
              {{ item.value.name }} {{ item.value.more ? `(${item.value.more})` : '' }}
            </p>
            <p v-show="highlightedItems.length > 5">
              ...{{ highlightedItems.length - 5 }} additional items are not shown
            </p>
          </uk-flex>
        </p>
      </uk-flex>
    </uk-popup>
  </div>
</template>
<script>
/**
 * This is a MESS. Sure, it does the work, but this should be refactored
 */
export default {
  name: 'UkList',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Whether the list is disabled or not
     */
    disabled: Boolean,
    /**
     * Whether the list elements may be deleted or not
     */
    deletable: Boolean,
    /**
     * Whether or not the list is filterable
     */
    filterable: Boolean,
    /**
     * Whether or not the list is toggleable
     */
    toggleable: Boolean,
    /**
     * Whether list items may be dragged or not (non-deep lists only)
     */
    draggable: Boolean,
    /**
     * Whether or not item highlighting is disabled
     */
    noHighlight: Boolean,
    /**
     * Wether or not selected item styling is applied
     */
    noSelect: Boolean,
    /**
     * Items to be displayed onto the list
     */
    items: {
      type: Array,
      default: () => [],
    },
    /**
     * @todo remove this ?
     */
    colored: Boolean,
    /**
     * Alternative tall (40px) list item styling
     */
    tall: Boolean,
    /**
     * Automaticaloly select first item on component mount
     */
    autoSelectFirst: Boolean,
    /**
     * Automatically select item at given index
     */
    autoSelect: {
      type: Number,
      default: null,
    },
    /**
     * DOM element list which wont be affected by focusout event
     * useful when seleting multiple items in order to set their value commonly from
     * another component
     */
    preventUnfocus: {
      type: Array,
      default: () => [],
    },
    /**
     * Whether unfoldable items should squish over the container's height and behave in an
     * Accordion fashion (only one item unfolded at once).
     */
    accordion: Boolean,
  },
  emits: ['unfold', 'focused', 'highlight', 'toggle', 'select', 'reorder', 'delete'],
  data() {
    return {
      /**
       * List's filter string
       */
      searchString: '',
      /**
       * List's tree elements. provided on component mount
       * though updateTree method.
       *
       * @see updateTree
       */
      tree: [],
      /**
       * List of highlighted list elements
       */
      highlightedItems: [],
      /**
       * List of toggled list elements
       */
      toggledItems: [],
      /**
       * Reference to the currently selected list item
       */
      selectedItem: null,
      /**
       * Delete popup display state flag
       */
      deletePopupState: false,
      /**
       * DOM element list which wont be affected by focusout event
       * useful when seleting multiple items in order to set their value commonly from
       * another component
       */
      unfocusElBlacklist: [...this.preventUnfocus],
      /**
       * List element focus state
       */
      hasFocus: false,
      /**
       * Dragging event state
       */
      dragging: false,
    };
  },

  computed: {
    /**
     * Filters tree items/subitems on their name using provided search string
     *
     * @returns {Array} array of filtered tree items and subitems
     */
    filteredItems() {
      let items = this.tree;
      const treeCpy = JSON.parse(JSON.stringify(this.tree));
      const normalizedSearchString = this.searchString.toLowerCase();
      if (normalizedSearchString) {
        items = [];
        items = treeCpy.filter((treeItem, index) => {
          if (treeItem.value.unfold) {
            const subItems = treeItem.value.unfold.filter((unfoldItem) => {
              const normalizedName = unfoldItem.value.name.toLowerCase().replace('-', ' ');
              return normalizedName.indexOf(normalizedSearchString) > -1;
            });
            if (subItems.length > 0) {
              treeItem.value.unfold = subItems;
              treeItem.unfolded = true;
              return true;
            }
            treeItem.value.unfold = treeCpy[index].value.unfold;
            treeItem.unfolded = false;
          }
          const normalizedName = treeItem.value.name.toLowerCase().replace('-', ' ');
          return normalizedName.indexOf(normalizedSearchString) > -1;
        });
      } else {
        // eslint-disable-next-line no-return-assign
        treeCpy.forEach((treeItem) => (treeItem.unfolded = false));
      }
      return items;
    },
  },
  watch: {
    items(items, oldItems) {
      // Listening to every entry changes, which are by design reactive, seems like a
      // waste of eventloop instructions. There should be a better approach.
      // Passing in getters does not allow to check for same-reference value though.
      // This is a quick and dirty hack to guarantee refresh only if actual data has changed
      if (this.updateTree(items)) {
        if (items && items.length && (!oldItems || !oldItems.length)) {
          if (this.autoSelectFirst && this.tree[0]) {
            if (this.tree[0].value.unfold) {
              this.tree[0].unfolded = true;
            } else {
              this.selectItem(undefined, this.tree[0]);
            }
          }
        }
      }
    },
    preventUnfocus() {
      this.unfocusElBlacklist.push(...this.preventUnfocus);
    },
    deletePopupState(value) {
      if (!value) {
        this.unfocusElBlacklist.pop();
        this.handleFocusOut();
      }
    },
    autoSelect(index) {
      const item = this.tree[parseInt(index, 10)];
      if (item) {
        this.selectItem(undefined, item);
      }
    },
  },
  unmounted() {
    window.removeEventListener('keydown', this.keydownListener);
    this.$emit('focused', false);
  },
  mounted() {
    this.selectedItem = [];
    if (this.updateTree(this.items)) {
      if (this.autoSelectFirst && this.tree[0]) {
        if (this.tree[0].value.unfold) {
          this.tree[0].unfolded = true;
        } else {
          this.selectItem(undefined, this.tree[0]);
        }
      }
    }
    this.preventUnfocus.push(this.$refs.popup);
  },
  methods: {
    /**
     * Update the component two level tree list
     *
     * @param {Array} items items to be displayed within the list
     * @returns {Boolean} information regarding whether or not an update was made
     */
    updateTree(items) {
      const jsonData = JSON.stringify(items);
      if (this.jsonData !== jsonData) {
        this.jsonData = jsonData;
        this._tree = [];
        items.forEach((item, index) => {
          if (this._tree[index]) {
            this._tree[index].value = item;
          } else {
            this._tree.push({
              value: item,
              unfolded: false, // this.tree[index] ? this.tree[index].value.unfold : false,
              highlighted: this.tree[index] ? this.tree[index].highlighted : false,
              toggled: item.active,
              selected: this.tree[index] ? this.tree[index].selected : false,
            });
          }
          if (item.unfold) {
            this._tree[index].value.unfold = this._tree[index].value.unfold.map((subItem) => ({
              value: subItem,
              highlighted: false,
              selected: false,
              toggled: subItem.active,
            }));
          }
        });
        this.tree = this._tree;
        return true;
      }
      return false;
    },
    /**
     * Reveal sublist from unfoldable item
     *
     * @param {Object} item the tree item to be unfolded
     */
    unfold(item) {
      if (this.accordion) {
        // eslint-disable-next-line no-return-assign
        this.tree.forEach((i) => i.unfolded = false);
      }
      item.unfolded = !item.unfolded;

      /**
       * Item unfold event
       *
       * @property {Object} item.value Unfolded/folded item value
       */
      this.$emit('unfold', item.value);
    },
    /**
     * Handler for list focus-in
     *
     */
    handleFocusIn() {
      this.hasFocus = true;
      /**
       * List focus state event
       *
       * @property {Boolean} -List focus state
       */
      this.$emit('focused', this.hasFocus);
      window.addEventListener('keydown', this.keydownListener);
    },
    /**
     * Handler for list focus-out
     *
     * @param {Object} e focusout event
     */
    handleFocusOut(e) {
      this.hasFocus = false;
      this.$emit('focused', false);
      // let keepFocus = false;
      // window.removeEventListener('click', this.handleFocusOut);
      // if (e) {
      //   keepFocus = this.unfocusElBlacklist.filter(
      //     (el) => (
      //       el.contains(e.target)
      //       || el.contains(e.relatedTarget)
      //       || el.contains(e.explicitOriginalTarget)
      //       || this.$el.contains(e.target)
      //     ),
      //   ).length >= 1;
      // }
      // if (!keepFocus || this.unfocusElBlacklist.length === 0) {
      //   this.hasFocus = false;
      //   this.clearHighlighted();
      //   window.removeEventListener('keydown', this.keydownListener);
      //   /**
      //    * List focus state event
      //    *
      //    * @property {Boolean} -List focus state
      //    */
      //   this.$emit('focused', this.hasFocus);
      // } else {
      //   this.$nextTick(() => {
      //     window.addEventListener('click', this.handleFocusOut);
      //   });
      // }
    },
    /**
     * Clear all highlighted items from the highlightedItems list
     * and reset item styling to their parent one
     *
     */
    clearHighlighted(focusOut = false) {
      if (!this.noHighlight) {
        this.highlightedItems.forEach((item) => {
          item.highlighted = false;
        });
        this.highlightedItems = [];
        /**
         * Item(s) highlighting event
         *
         * @property {Array} -List of references to highlighted items values
         */
        this.$emit('highlight', []);
        if (focusOut) {
          this.$emit('focused', false);
          this.hasFocus = false;
        }
      }
    },
    /**
     * Deletion popup validation handler
     */
    async handleDeletion() {
      /**
       * Item(s) deletion event
       *
       * @property {Array} -List of references to highlighted items values
       */
      this.$emit('delete', this.highlightedItems.length ? this.highlightedItems.map((i) => i.value) : [this.selectedItem.value]);
      this.deletePopupState = false;
      this.clearHighlighted();
    },
    /**
     * Displays deletion popup
     *
     */
    displayDeletionPopup() {
      if (this.hasFocus && (this.selectedItem || this.highlightedItems.length) && this.deletable) {
        this.deletePopupState = true;
      }
    },
    /**
     *
     * Keydown event listener.
     *
     * @param {Event} e keydown event
     */
    keydownListener(e) {
      const { key } = e;
      if (key === 'Backspace' || key === 'Delete') {
        this.displayDeletionPopup();
      } else if (key === 'Escape') {
        this.clearHighlighted(true);
        this.hasFocus = false;
      }
    },
    toggleItem(item) {
      if (!item.value.disabled && !this.dragging) {
        item.toggled = !item.toggled;
        this.toggledItems = this.tree.flatMap((i) => {
          if (i.toggled) {
            return i;
          } if (i.value.unfold) {
            return i.value.unfold.flatMap((subItem) => (subItem.toggled ? subItem : []));
          }
          return [];
        });
        /**
         * Item selection event
         *
         * @property {Object} this.selectedItem.value reference to selected tree item object's value
         */
        this.$emit(
          'toggle',
          this.toggledItems.map((i) => i.value),
        );
      }
    },
    checkAll(state, item) {
      if (item) {
        item.value.unfold?.forEach((i) => {
          i.toggled = state;
        });
      } else {
        this.tree.forEach((i) => {
          i.toggled = state;
        });
      }
      this.toggledItems = this.tree.flatMap((i) => {
        if (i.toggled) {
          return i;
        } if (i.value.unfold) {
          return i.value.unfold.flatMap((subItem) => (subItem.toggled ? subItem : []));
        }
        return [];
      });
      /**
         * Item selection event
         *
         * @property {Object} this.selectedItem.value reference to selected tree item object's value
         */
      this.$emit(
        'toggle',
        this.toggledItems.map((i) => i.value),
      );
    },
    handleSingleSelection(item, clearHighlighted = false) {
      this.tree.forEach((treeItem) => {
        treeItem.selected = false;
        if (clearHighlighted) {
          treeItem.highlighted = false;
        }
        if (treeItem.value.unfold) {
          treeItem.value.unfold.forEach((subTreeItem) => {
            if (clearHighlighted) {
              subTreeItem.highlighted = false;
            }
            subTreeItem.selected = false;
          });
        }
      });
      this.selectedItem = item;
      this.selectedIndex = this.tree.indexOf(item);
      item.selected = true;
      if (!this.noHighlight && clearHighlighted) {
        this.clearHighlighted();
      }
      /**
       * Item selection event
       *
       * @property {Object} this.selectedItem.value reference to selected tree item object's value
       */
      this.$emit('select', this.selectedItem.value);
    },
    handleMultiSelection(item) {
      item.highlighted = !item.highlighted;
      if (item.highlighted) {
        this.highlightedItems.push(item);
      } else {
        const index = this.highlightedItems.findIndex(
          (highlightedItem) => highlightedItem.value === item.value,
        );
        this.highlightedItems.splice(index, 1);
      }
      if (!this.selectedItem && this.highlightedItems.length) {
        // eslint-disable-next-line prefer-destructuring
        this.selectedItem = this.highlightedItems[0];
      }
      if (this.selectedItem && this.highlightedItems.length === 1) {
        this.selectedItem.highlighted = true;
        this.highlightedItems.push(this.selectedItem);
      }
      /**
       * Item selection event
       *
       * @property {Array} -List of references to highlighted items values
       */
      this.$emit('select', this.selectedItem.value);
      this.$emit(
        'highlight',
        this.highlightedItems.map((i) => i.value),
      );
    },
    handleGroupedSelection(item, childs) {
      if (!this.selectedItem) {
        this.handleSingleSelection(item, true);
      } else if (childs.some((c) => c === item) && item !== this.selectedItem) {
        const index = childs.findIndex((c) => c === item);
        const start = Math.min(index, this.selectedIndex);
        const stop = Math.max(index, this.selectedIndex);
        this.clearHighlighted();
        for (let i = start; i <= stop; i++) {
          const _item = childs[i];
          _item.highlighted = true;
          this.highlightedItems.push(_item);
        }
        this.$emit(
          'highlight',
          this.highlightedItems.map((i) => i.value),
        );
      }
    },
    /**
     * Selects active item whenever simple click is involved.
     * Adds item to highlighted list when ctrl key is pressed.
     *
     * @param {Event} e click event
     * @param {Object} item tree (sub)item involved in the selection
     */
    // eslint-disable-next-line default-param-last
    selectItem(e = {}, item, childs) {
      if (!item.value.disabled && !this.dragging) {
        // this.hasFocus = true;
        if (e.shiftKey && !this.noHighlight && !this.toggleable) {
          this.handleGroupedSelection(item, childs);
        } else if (e.ctrlKey && !this.noHighlight && !this.toggleable) {
          this.handleMultiSelection(item);
        } else if (!this.toggleable) {
          this.handleSingleSelection(item, true);
        } else {
          this.toggleItem(item);
        }
      }
    },
    /**
     * Handles dragging routine start
     *
     * @todo This whole dragging routine was made on the rush. It should be tested and improved.
     * @param {Event} e startdrag event
     * @param {Number} index index of the dragged list item
     */
    startDrag(e, index) {
      this.clearHighlighted();
      this.itms_cpy = JSON.parse(JSON.stringify(this.items));
      this.dragging = true;
      // this.selectedIndex = this.tree.indexOf(this.selectedItem);
      if (this.selectedIndex && this.tree[this.selectedIndex]) {
        this.tree[this.selectedIndex].selected = false;
        this.selectedItem = null;
      }
      this.originalDragItemIndex = index;
      this.dragItemIndex = this.originalDragItemIndex;
      this.imtsCpy = JSON.parse(JSON.stringify(this.items));
      e.dataTransfer.effectAllowed = 'move';
      e.target.style.setProperty('background-color', 'transparent', 'important');
    },
    /**
     * Handles drag enter on droppable element.
     * regenerates item list according to new dragged item index offset
     *
     * @param {Event} e dragenter event
     * @param {Number} index index of the hovered element
     */
    dragEnter(e, index) {
      e.preventDefault();
      if (e.target.classList && this.dragging) {
        this.items.splice(index, 0, this.items.splice(this.dragItemIndex, 1)[0]);
        this.dragItemIndex = index;
        const childs = e.target.children;
        e.target.classList.add('dragged_over');
        e.target.style.setProperty('background-color', 'var(--secondary-darker)', 'important');
        e.dataTransfer.dropEffect = 'move';
        for (let i = 0; i < childs.length; i++) {
          childs[i].style.visibility = 'hidden';
        }
      }
    },
    /**
     * Handles drag leave on droppable element.
     * resets droppable hovered item styling
     *
     * @param {Event} e dragenter event
     */
    dragOut(e) {
      if (e.target.classList) {
        e.target.classList.remove('dragged_over');
        e.target.style.setProperty('background-color', '', 'important');
        const childs = e.target.children;
        for (let i = 0; i < childs.length; i++) {
          childs[i].style.visibility = 'visible';
        }
      }
    },
    /**
     * Handles drop
     *
     * @param {Event} e drop event
     * @param {Number} index index of the dropped list item
     */
    drop(e) {
      e.preventDefault();
      const draggedOverEls = this.$el.getElementsByClassName('dragged_over');
      if (draggedOverEls.length) {
        // eslint-disable-next-line no-restricted-syntax
        for (const el of draggedOverEls) {
          el.classList.remove('dragged_over');
          el.style.setProperty('background-color', '', 'important');
          const childs = el.children;
          for (let i = 0; i < childs.length; i++) {
            childs[i].style.visibility = 'visible';
          }
        }
      }
      e.target.style.setProperty('background-color', '', 'important');
      this.selectItem(undefined, this.tree[this.dragItemIndex]);
      /**
       * Item dragging event
       *
       * @property {Number} original Original dragged item index
       * @property {Number} final FInal item index
       */
      this.$emit('reorder', {
        original: this.originalDragItemIndex,
        final: this.dragItemIndex,
      });
    },
    /**
     * Clotures dragging event following cancellation or drop event
     *
     * @param {Event} e drop event
     */
    stopDrag(e) {
      e.preventDefault();
      if (e.dataTransfer.dropEffect !== 'move') {
        this.updateTree(this.itms_cpy);
      }
      this.dragging = false;
      e.target.style.setProperty('background-color', '', 'important');
    },
  },
};
</script>
<style scoped>
</style>

<style scoped>
.uikit_list {
  display: flex;
  flex-direction: column;
  width: fit-content;
  background: var(--primary-light);
  height: 100%;
  width: 100%;
  user-select: none;
}
.uikit_list_body {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  align-items: center;
  overflow: hidden;
  overflow-y: auto;
  outline: none !important;
}
.uikit_list_item {
  width: 100%;
}
.uikit_list_body_empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  color: var(--secondary-light);
  text-transform: uppercase;
  font-family: roboto-regular;
  background:
    var(--primary-light)
    repeating-linear-gradient(
      45deg,
      #1619130a,
      #1619130a 10px,
      #0c0e0a38 10px,
      #0c0e0a38 20px
    );
  border-bottom: 1px solid var(--primary-dark);
}
.uikit_list_body_empty > h3 {
  color: var(--secondary-light);
  text-transform: uppercase;
  font-family: roboto-regular;
}
.uikit_list_header_button {
  cursor: pointer;
}
.uikit_list_item_unfoldable {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.uikit_sublist_body {
  padding-left: 16px !important;
}
.uikit_sublist_body_empty {
  flex:1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.delete_popup_buttons {
  display: flex;
  gap: 8x;
  padding: 8px 0px;
  padding-right: 8px;
  border-top: 1px solid var(--primary-dark);
  align-items: center;
  justify-content: center;
}
.dragged {
  border: 1px dashed var(--secondary-light) !important;
}
.dragged_over {
  background: transparent !important;
  border: 1px dashed var(--secondary-light) !important;
}
</style>
