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
      ref="body"
      tabindex="0"
      class="uikit_list_body"
      @focusin="handleFocusIn"
      @focusout="handleFocusOut"
      @keydown="handleKeydown"
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
          <span v-if="deleteNote">{{ deleteNote }}</span>
        </p>
      </uk-flex>
    </uk-popup>
  </div>
</template>
<script>
export default {
  name: 'UkList',
  compatConfig: {
    MODE: 3,
  },
  props: {
    disabled: Boolean,
    deletable: Boolean,
    /**
     * Extra line in the deletion confirmation (what else deleting removes)
     */
    deleteNote: {
      type: String,
      default: '',
    },
    filterable: Boolean,
    toggleable: Boolean,
    draggable: Boolean,
    noHighlight: Boolean,
    noSelect: Boolean,
    items: {
      type: Array,
      default: () => [],
    },
    colored: Boolean,
    tall: Boolean,
    autoSelectFirst: Boolean,
    autoSelect: {
      type: Number,
      default: null,
    },
    preventUnfocus: {
      type: Array,
      default: () => [],
    },
    accordion: Boolean,
  },
  emits: ['unfold', 'focused', 'highlight', 'toggle', 'select', 'reorder', 'delete'],
  data() {
    return {
      searchString: '',
      tree: [],
      highlightedItems: [],
      toggledItems: [],
      selectedItem: null,
      selectedIndex: null,
      deletePopupState: false,
      unfocusElBlacklist: [...this.preventUnfocus],
      hasFocus: false,
      dragging: false,
    };
  },

  computed: {
    /**
     * Filters tree items/subitems on their name using the search string.
     * Pure — never mutates `tree`, so it's safe even when items carry
     * functions (e.g. `value.action.callback`), unlike a JSON clone would be.
     */
    filteredItems() {
      const query = this.searchString.trim().toLowerCase();
      if (!query) return this.tree;

      const matches = (name) => name.toLowerCase().replace('-', ' ').includes(query);

      const result = [];
      this.tree.forEach((treeItem) => {
        if (treeItem.value.unfold) {
          const subItems = treeItem.value.unfold.filter((sub) => matches(sub.value.name));
          if (subItems.length > 0) {
            result.push({
              ...treeItem,
              unfolded: true,
              value: { ...treeItem.value, unfold: subItems },
            });
            return;
          }
        }
        if (matches(treeItem.value.name)) {
          result.push({ ...treeItem, unfolded: false });
        }
      });
      return result;
    },
  },
  watch: {
    items(items, oldItems) {
      if (this.updateTree(items) && items && items.length && (!oldItems || !oldItems.length)) {
        this.maybeAutoSelectFirst();
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
      const item = this.tree[index];
      if (item) {
        this.selectItem(undefined, item);
      }
    },
  },
  mounted() {
    if (this.updateTree(this.items)) {
      this.maybeAutoSelectFirst();
    }
    window.addEventListener('keydown', this.handleKeydown);
  },
  unmounted() {
    window.removeEventListener('keydown', this.handleKeydown);
    this.$emit('focused', false);
  },
  methods: {
    /**
     * Auto-selects (or unfolds) the first tree item, if requested.
     * Shared by mounted() and the items watcher.
     */
    maybeAutoSelectFirst() {
      if (!this.autoSelectFirst || !this.tree[0]) return;
      if (this.tree[0].value.unfold) {
        this.tree[0].unfolded = true;
      } else {
        this.selectItem(undefined, this.tree[0]);
      }
    },
    updateTree(items) {
      const jsonData = JSON.stringify(items);
      if (this.jsonData === jsonData) return false;

      this.jsonData = jsonData;
      this._tree = [];
      items.forEach((item, index) => {
        if (this._tree[index]) {
          this._tree[index].value = item;
        } else {
          this._tree.push({
            value: item,
            unfolded: false,
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
    },
    unfold(item) {
      if (this.accordion) {
        this.tree.forEach((i) => { i.unfolded = false; });
      }
      item.unfolded = !item.unfolded;
      this.$emit('unfold', item.value);
    },
    handleFocusIn() {
      if (this.hasFocus) return;
      this.hasFocus = true;
      this.$emit('focused', true);
    },
    handleFocusOut(e) {
      // focus moving between elements inside the list isn't a real focus loss
      if (e && this.$refs.body?.contains(e.relatedTarget)) return;
      this.hasFocus = false;
      this.$emit('focused', false);
    },
    handleKeydown(e) {
      // a popup (ours or someone else's) already consumed this key
      if (e.defaultPrevented || this.deletePopupState) return;

      if (e.key === 'Escape') {
        this.handleEscape();
      } else if ((e.key === 'Backspace' || e.key === 'Delete') && this.hasFocus) {
        this.displayDeletionPopup();
      }
    },
    handleEscape() {
      this.clearHighlighted();
      // release DOM focus only if the list owns it; hasFocus follows via focusout
      if (this.hasFocus) this.$refs.body?.blur();
    },
    clearHighlighted() {
      if (this.noHighlight) return;
      this.highlightedItems.forEach((item) => { item.highlighted = false; });
      this.highlightedItems = [];
      this.$emit('highlight', []);
    },
    async handleDeletion() {
      this.$emit(
        'delete',
        this.highlightedItems.length
          ? this.highlightedItems.map((i) => i.value)
          : [this.selectedItem.value],
      );
      this.deletePopupState = false;
      this.clearHighlighted();
    },
    displayDeletionPopup() {
      if (this.hasFocus && (this.selectedItem || this.highlightedItems.length) && this.deletable) {
        this.deletePopupState = true;
      }
    },
    /**
     * Recomputes the flat list of toggled items (top-level + nested).
     * Shared by toggleItem() and checkAll() — was duplicated before.
     */
    computeToggledItems() {
      return this.tree.flatMap((i) => {
        if (i.toggled) return i;
        if (i.value.unfold) return i.value.unfold.filter((sub) => sub.toggled);
        return [];
      });
    },
    toggleItem(item) {
      if (item.value.disabled || this.dragging) return;
      item.toggled = !item.toggled;
      this.toggledItems = this.computeToggledItems();
      this.$emit('toggle', this.toggledItems.map((i) => i.value));
    },
    checkAll(state, item) {
      if (item) {
        item.value.unfold?.forEach((i) => { i.toggled = state; });
      } else {
        this.tree.forEach((i) => { i.toggled = state; });
      }
      this.toggledItems = this.computeToggledItems();
      this.$emit('toggle', this.toggledItems.map((i) => i.value));
    },
    handleSingleSelection(item, clearHighlighted = false) {
      this.tree.forEach((treeItem) => {
        treeItem.selected = false;
        if (clearHighlighted) treeItem.highlighted = false;
        treeItem.value.unfold?.forEach((subTreeItem) => {
          if (clearHighlighted) subTreeItem.highlighted = false;
          subTreeItem.selected = false;
        });
      });
      this.selectedItem = item;
      this.selectedIndex = this.tree.indexOf(item);
      item.selected = true;
      if (!this.noHighlight && clearHighlighted) {
        this.clearHighlighted();
      }
      this.$emit('select', this.selectedItem.value);
    },
    handleMultiSelection(item) {
      item.highlighted = !item.highlighted;
      if (item.highlighted) {
        this.highlightedItems.push(item);
      } else {
        const index = this.highlightedItems.findIndex((h) => h.value === item.value);
        this.highlightedItems.splice(index, 1);
      }
      if (!this.selectedItem && this.highlightedItems.length) {
        [this.selectedItem] = this.highlightedItems;
      }
      if (this.selectedItem && this.highlightedItems.length === 1) {
        this.selectedItem.highlighted = true;
        this.highlightedItems.push(this.selectedItem);
      }
      this.$emit('select', this.selectedItem.value);
      this.$emit('highlight', this.highlightedItems.map((i) => i.value));
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
        this.$emit('highlight', this.highlightedItems.map((i) => i.value));
      }
    },
    // eslint-disable-next-line default-param-last
    selectItem(e = {}, item, childs) {
      if (item.value.disabled || this.dragging) return;
      if (e.shiftKey && !this.noHighlight && !this.toggleable) {
        this.handleGroupedSelection(item, childs);
      } else if (e.ctrlKey && !this.noHighlight && !this.toggleable) {
        this.handleMultiSelection(item);
      } else if (!this.toggleable) {
        this.handleSingleSelection(item, true);
      } else {
        this.toggleItem(item);
      }
    },
    startDrag(e, index) {
      this.clearHighlighted();
      this.itms_cpy = JSON.parse(JSON.stringify(this.items));
      this.dragging = true;
      if (this.selectedIndex && this.tree[this.selectedIndex]) {
        this.tree[this.selectedIndex].selected = false;
        this.selectedItem = null;
      }
      this.originalDragItemIndex = index;
      this.dragItemIndex = this.originalDragItemIndex;
      e.dataTransfer.effectAllowed = 'move';
      e.target.style.setProperty('background-color', 'transparent', 'important');
    },
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
    drop(e) {
      e.preventDefault();
      const draggedOverEls = this.$el.getElementsByClassName('dragged_over');
      // eslint-disable-next-line no-restricted-syntax
      for (const el of draggedOverEls) {
        el.classList.remove('dragged_over');
        el.style.setProperty('background-color', '', 'important');
        const childs = el.children;
        for (let i = 0; i < childs.length; i++) {
          childs[i].style.visibility = 'visible';
        }
      }
      e.target.style.setProperty('background-color', '', 'important');
      this.selectItem(undefined, this.tree[this.dragItemIndex]);
      this.$emit('reorder', {
        original: this.originalDragItemIndex,
        final: this.dragItemIndex,
      });
    },
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
  background: var(--primary-light) var(--idle-stripes);
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
