<template>
  <div class="uikit_list">
    <uk-txt-input
      :disabled="disabled"
      :outlined="false"
      v-if="filterable"
      class="uikit_list_searchbox"
      :placeholder="'Search items'"
      v-model="searchString"
    />
    <div tabindex="0" @focus="handleFocusIn" @focusout="handleFocusOut" v-if="filteredItems.length != 0" class="uikit_list_body">
      <div class="uikit_list_item parent" v-for="(treeItem, index) in filteredItems" :key="index">
        <div class="uikit_list_item_unfoldable" v-if="treeItem.value.unfold">
          <uk-list-item :colored="colored" :index="index" :item="treeItem" @click.native="unfold(treeItem)" />
          <Transition name="fade">
            <span v-if="treeItem.unfolded">
              <template v-if="treeItem.value.unfold && treeItem.value.unfold.length">
                <uk-list-item
                  class="uikit_sublist_body"
                  :item="subTreeItem"
                  :toggleable="toggleable"
                  :noHighlight="noHighlight"
                  :focused="hasFocus"
                  :tall="tall"
                  :no-select="noSelect"
                  v-for="(subTreeItem, index) in treeItem.value.unfold"
                  :key="index"
                  @click.native="(e) => selectItem(e, subTreeItem, treeItem.value.unfold)"
                  @toggle.native="toggleItem(subTreeItem)"
                />
              </template>
              <uk-list-item
                v-else
                disabled
                class="uikit_sublist_body"
                :item="{ value: { name: 'Nothing To Display', icon: 'close' } }"
                :noHighlight="true"
                :tall="tall"
                :no-select="noSelect"
                :key="index"
              />
            </span>
          </Transition>
        </div>
        <uk-list-item
          v-else
          :item="treeItem"
          :colored="colored"
          :toggleable="toggleable"
          :focused="hasFocus"
          :tall="tall"
          :no-select="noSelect"
          @dragstart.native="
            (e) => {
              startDrag(e, index);
            }
          "
          @dragend.native.prevent="
            (e) => {
              stopDrag(e, index);
            }
          "
          @dragover.native.prevent
          @dragenter.native.prevent="
            (e) => {
              dragEnter(e, index);
            }
          "
          @dragleave.native.prevent="
            (e) => {
              dragOut(e, index);
            }
          "
          @drop.native.prevent="
            (e) => {
              drop(e, index);
            }
          "
          @click.native="(e) => selectItem(e, treeItem, filteredItems)"
          @toggle="toggleItem(treeItem)"
          :draggable="draggable"
        />
      </div>
    </div>
    <h3 v-else class="uikit_list_body_empty">Nothing To Display</h3>
    <uk-popup @submit="handleDeletion" ref="popup" :header="{ title: 'Delete items ?' }" v-model="deletePopupState">
      <uk-flex col style="max-width: 350px">
        <p style="padding: 16px">These items will be permanently removed from your project. Do you wish to continue ?</p>
      </uk-flex>
    </uk-popup>
  </div>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s;
  max-height: 800px;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
  max-height: 0px;
}
</style>
<script>
export default {
  name: "ukList",
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
    autoSelect: Number,
    /**
     * DOM element list which wont be affected by focusout event
     * useful when seleting multiple items in order to set their value commonly from
     * another component
     */
    preventUnfocus: {
      type: Array,
      default: () => {
        return [];
      },
    },
  },
  data() {
    return {
      /**
       * List's filter string
       */
      searchString: "",
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
  methods: {
    /**
     * Update the component two level tree list
     *
     * @param {Array} items items to be displayed within the list
     */
    updateTree(items) {
      this._tree = [];
      // this.toggledItems = [];
      // this.highlightedItems = [];
      items.forEach((item, index) => {
        if (this._tree[index]) {
          this._tree[index].value = item;
        } else {
          this._tree.push({
            value: item,
            unfolded: this.tree[index] ? this.tree[index].value.unfold : false,
            highlighted: this.tree[index] ? this.tree[index].highlighted : false,
            toggled: item.active,
            selected: this.tree[index] ? this.tree[index].selected : false,
          });
          // if (item.active) {
          //   this.toggledItems.push(this._tree[index]);
          // }
        }
        if (item.unfold) {
          this._tree[index].value.unfold = this._tree[index].value.unfold.map((subItem) => {
            return {
              value: subItem,
              highlighted: false,
              selected: false,
              toggled: subItem.active,
            };
          });
        }
      });
      this.tree = this._tree;
    },
    /**
     * Reveal sublist from unfoldable item
     *
     * @param {Object} item the tree item to be unfolded
     */
    unfold(item) {
      item.unfolded = !item.unfolded;
      /**
       * Item unfold event
       *
       * @property {Object} item.value Unfolded/folded item value
       */
      this.$emit("unfold", item.value);
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
      this.$emit("focused", this.hasFocus);
      window.addEventListener("keydown", this.keydownListener);
    },
    /**
     * Handler for list focus-out
     *
     * @param {Object} e focusout event
     */
    handleFocusOut(e) {
      let keepFocus = false;
      window.removeEventListener("click", this.handleFocusOut);
      if (e) {
        keepFocus =
          this.unfocusElBlacklist.filter((el) => {
            return el.contains(e.target) || el.contains(e.relatedTarget) || el.contains(e.explicitOriginalTarget) || this.$el.contains(e.target);
          }).length >= 1;
      }
      if (!keepFocus || this.unfocusElBlacklist.length === 0) {
        this.hasFocus = false;
        this.clearHighlighted();
        window.removeEventListener("keydown", this.keydownListener);
        /**
         * List focus state event
         *
         * @property {Boolean} -List focus state
         */
        this.$emit("focused", this.hasFocus);
      } else {
        this.$nextTick(() => {
          window.addEventListener("click", this.handleFocusOut);
        });
      }
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
        this.$emit("highlight", []);
        if (focusOut) {
          this.$emit("focused", false);
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
      this.$emit("delete", this.highlightedItems.length ? this.highlightedItems.map((i) => i.value) : [this.selectedItem.value]);
      this.deletePopupState = false;
      this.clearHighlighted();
    },
    /**
     * Displays deletion popup
     *
     */
    displayDeletionPopup() {
      if ((this.selectedItem || this.highlightedItems.length) && this.deletable) {
        this.deletePopupState = true;
      }
      this.$nextTick(() => {
        if (this.unfocusElBlacklist.length === this.preventUnfocus.length) {
          this.unfocusElBlacklist.push(this.$refs.popup.$el);
        }
      });
    },
    /**
     * Keydown event listener.
     *
     * @param {Event} e keydown event
     */
    keydownListener(e) {
      const key = e.key;
      if (key === "Backspace" || key === "Delete") {
        this.displayDeletionPopup();
      } else if (key === "Escape") {
        this.clearHighlighted(true);
        this.hasFocus = false;
      }
    },
    toggleItem(item) {
      if (!item.value.disabled && !this.dragging) {
        item.toggled = !item.toggled;
        this.toggledItems = this.tree.flatMap((item) => {
          if (item.toggled) {
            return item;
          } else if (item.value.unfold) {
            return item.value.unfold.flatMap((subItem) => (subItem.toggled ? subItem : []));
          } else {
            return [];
          }
        });
        // if (item.toggled) {
        //   this.toggledItems.push(item);
        // } else {
        //   let index = this.toggledItems.findIndex((toggledItem) => toggledItem.value == item.value);
        //   this.toggledItems.splice(index, 1);
        // }
        /**
         * Item selection event
         *
         * @property {Object} this.selectedItem.value reference to selected tree item object's value
         */
        this.$emit(
          "toggle",
          this.toggledItems.map((i) => i.value)
        );
      }
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
      item.selected = true;
      if (!this.noHighlight && clearHighlighted) {
        this.clearHighlighted();
      }
      /**
       * Item selection event
       *
       * @property {Object} this.selectedItem.value reference to selected tree item object's value
       */
      this.$emit("select", this.selectedItem.value);
      //}
    },
    handleMultiSelection(item) {
      item.highlighted = !item.highlighted;
      if (item.highlighted) {
        this.highlightedItems.push(item);
      } else {
        let index = this.highlightedItems.findIndex((highlightedItem) => highlightedItem.value == item.value);
        this.highlightedItems.splice(index, 1);
      }
      if (!this.selectedItem && this.highlightedItems.length) {
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
      this.$emit("select", this.selectedItem.value);
      this.$emit(
        "highlight",
        this.highlightedItems.map((i) => i.value)
      );
    },
    handleGroupedSelection(item, childs) {
      if (!this.selectedItem) {
        this.handleSingleSelection(item, true);
      } else if (childs.find((c) => c == item) && childs.find((c) => c == this.selectedItem) && item != this.selectedItem) {
        let index1 = childs.findIndex((c) => c == item);
        let index2 = childs.findIndex((c) => c == this.selectedItem);
        let start = Math.min(index1, index2);
        let stop = Math.max(index1, index2);
        for (let i = start; i <= stop; i++) {
          let item = childs[i];
          item.highlighted = true;
          this.highlightedItems.push(item);
        }
        this.$emit(
          "highlight",
          this.highlightedItems.map((i) => i.value)
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
    selectItem(e = {}, item, childs) {
      if (!item.value.disabled && !this.dragging) {
        this.hasFocus = true;
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
      this.selectedIndex = this.tree.indexOf(this.selectedItem);
      if (this.selectedItem && this.tree[this.selectedIndex]) {
        this.tree[this.selectedIndex].selected = false;
        this.selectedItem = null;
      }
      this.originalDragItemIndex = index;
      this.dragItemIndex = this.originalDragItemIndex;
      this.imtsCpy = JSON.parse(JSON.stringify(this.items));
      e.dataTransfer.effectAllowed = "move";
      e.target.style.setProperty("background-color", "transparent", "important");
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
        let childs = e.target.children;
        e.target.classList.add("dragged_over");
        e.target.style.setProperty("background-color", "var(--secondary-darker)", "important");
        e.dataTransfer.dropEffect = "move";
        for (let i = 0; i < childs.length; i++) {
          childs[i].style.visibility = "hidden";
        }
        // this.updateTree(this.items);
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
        e.target.classList.remove("dragged_over");
        e.target.style.setProperty("background-color", "", "important");
        let childs = e.target.children;
        for (let i = 0; i < childs.length; i++) {
          childs[i].style.visibility = "visible";
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
      let draggedOverEls = this.$el.getElementsByClassName("dragged_over");
      if (draggedOverEls.length) {
        for (let el of draggedOverEls) {
          el.classList.remove("dragged_over");
          el.style.setProperty("background-color", "", "important");
          let childs = el.children;
          for (let i = 0; i < childs.length; i++) {
            childs[i].style.visibility = "visible";
          }
        }
      }
      e.target.style.setProperty("background-color", "", "important");
      this.selectItem(undefined, this.tree[this.dragItemIndex]);
      /**
       * Item dragging event
       *
       * @property {Number} original Original dragged item index
       * @property {Number} final FInal item index
       */
      this.$emit("reorder", {
        original: this.originalDragItemIndex,
        final: this.dragItemIndex,
      });
    },
    /**
     * Clotures dradding event following cancellation or drop event
     *
     * @param {Event} e drop event
     */
    stopDrag(e) {
      e.preventDefault();
      if (e.dataTransfer.dropEffect != "move") {
        this.updateTree(this.itms_cpy);
      }
      this.dragging = false;
      e.target.style.setProperty("background-color", "", "important");
    },
  },

  computed: {
    /**
     * Filters tree items/subitems on their name using provided search string
     *
     * @returns {Array} array of filtered tree items and subitems
     */
    filteredItems() {
      let items = this.tree;
      let treeCpy = JSON.parse(JSON.stringify(this.tree));
      let normalizedSearchString = this.searchString.toLowerCase();
      if (normalizedSearchString) {
        items = [];
        items = treeCpy.filter((treeItem, index) => {
          if (treeItem.value.unfold) {
            let subItems = treeItem.value.unfold.filter((unfoldItem) => {
              let normalizedName = unfoldItem.value.name.toLowerCase().replace("-", " ");
              return normalizedName.indexOf(normalizedSearchString) > -1;
            });
            if (subItems.length > 0) {
              treeItem.value.unfold = subItems;
              treeItem.unfolded = true;
              return true;
            } else {
              treeItem.value.unfold = treeCpy[index].value.unfold;
              treeItem.unfolded = false;
            }
          }
          let normalizedName = treeItem.value.name.toLowerCase().replace("-", " ");
          return normalizedName.indexOf(normalizedSearchString) > -1;
        });
      } else {
        treeCpy.forEach((treeItem) => (treeItem.unfolded = false));
      }
      return items;
    },
  },
  destroyed() {
    window.removeEventListener("keydown", this.keydownListener);
    this.$emit("focused", false);
  },
  mounted() {
    this.selectedItem = [];
    this.updateTree(this.items);
    console.log(this.tree);
    if (this.autoSelectFirst && this.tree[0]) {
      this.selectItem(undefined, this.tree[0]);
      this.clearHighlighted(true);
    }
    this.tree.forEach((i) => {
      if (i.value.unfold) i.unfolded = true;
    });
  },
  watch: {
    items(items, oldItems) {
      //Listening to every entry changes, which are by design reactive, seems like a
      //waste of eventloop instructions. There should be a better approach.
      //Passing in getters does not allow to check for same-reference value though.
      this.updateTree(items);
      if (items && items.length && (!oldItems || !oldItems.length)) {
        if (this.autoSelectFirst && this.tree[0]) {
          this.selectItem(undefined, this.tree[0]);
        }
      }
      this.tree.forEach((i) => {
        if (i.value.unfold) i.unfolded = true;
      });
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
      let item = this.tree[parseInt(index)];
      if (item) {
        this.selectItem(undefined, item);
        this.clearHighlighted(true);
      }
    },
  },
};
</script>

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
  height: 100%;
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  color: var(--secondary-light);
}
.uikit_list_header_button {
  cursor: pointer;
}
.uikit_list_item_unfoldable {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.uikit_sublist_body {
  padding-left: 16px !important;
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
