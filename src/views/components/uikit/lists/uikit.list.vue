<template>
  <div
    class="uikit_list"
    :class="{ disabled }"
  >
    <uk-list-item
      v-if="toggleable && !hasParents"
      toggleable
      :disabled="disabled"
      :item="checkAllItem(visibleRows)"
      style="padding: 6px 8px;"
      @click="checkAll(visibleRows)"
      @toggle="checkAll(visibleRows)"
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
      v-if="visibleRows.length"
      ref="body"
      tabindex="0"
      class="uikit_list_body"
      :class="{ accordion, dragging: !!drag?.active }"
      @focusin="handleFocusIn"
      @focusout="handleFocusOut"
      @keydown="handleKeydown"
    >
      <template
        v-for="row in visibleRows"
        :key="row.key"
      >
        <div
          v-if="row.children"
          class="uikit_list_group"
          :class="{ open: row.unfolded || closing[row.key] }"
        >
          <uk-list-item
            :colored="colored"
            :item="row"
            :tall="tall"
            :disabled="disabled"
            :data-key="row.key"
            @click="unfold(row)"
          />
          <Transition
            name="uikit-unfold"
            @before-leave="closing = { ...closing, [row.key]: true }"
            @after-leave="closing = omit(closing, row.key)"
          >
            <div
              v-if="row.unfolded"
              class="uikit_list_children"
            >
              <div class="uikit_list_children_inner">
                <template v-if="row.children.length">
                  <uk-list-item
                    v-if="toggleable"
                    toggleable
                    :disabled="disabled"
                    :item="checkAllItem(row.children)"
                    style="padding: 6px 6px 6px 16px;"
                    @click="checkAll(row.children)"
                    @toggle="checkAll(row.children)"
                  />
                  <uk-list-item
                    v-for="child in row.children"
                    :key="child.key"
                    class="uikit_sublist_body"
                    :data-key="child.key"
                    :item="child"
                    :toggleable="toggleable"
                    :no-highlight="noHighlight"
                    :focused="hasFocus"
                    :tall="tall"
                    :no-select="noSelect"
                    :disabled="disabled"
                    @pointerdown="focusBody"
                    @click="(e) => clickRow(e, child)"
                    @contextmenu="(e) => openContextMenu(e, child)"
                    @toggle="toggleRow(child)"
                  />
                </template>
                <div
                  v-else
                  class="uikit_list_body_empty"
                >
                  <h3>Nothing to display</h3>
                </div>
              </div>
            </div>
          </Transition>
        </div>
        <uk-list-item
          v-else
          :data-key="row.key"
          :item="row"
          :class="{ uikit_list_dragged: drag?.active && drag.key === row.key }"
          :style="dragStyle(row)"
          :colored="colored"
          :toggleable="toggleable"
          :handle="canReorder"
          :no-highlight="noHighlight"
          :focused="hasFocus"
          :tall="tall"
          :no-select="noSelect"
          :disabled="disabled"
          @pointerdown="focusBody"
          @handle="(e) => pressHandle(e, row)"
          @click="(e) => clickRow(e, row)"
          @contextmenu="(e) => openContextMenu(e, row)"
          @toggle="toggleRow(row)"
        />
      </template>
      <!-- the space the rows don't fill -->
      <div class="uikit_list_filler" />
    </div>
    <div
      v-else
      class="uikit_list_body_empty"
    >
      <h3>
        Nothing to display
      </h3>
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
        <p class="uikit_list_delete_text">
          Are you sure you want to delete
          {{ deletionRows.length > 1 ? `these ${deletionRows.length} items` : 'this item' }}?
        </p>
        <uk-flex
          col
          class="uikit_list_delete_items"
        >
          <p
            v-for="row in deletionRows.slice(0, 5)"
            :key="row.key"
          >
            {{ row.value.name }}
            <span
              v-if="row.value.more"
              class="uikit_list_delete_more"
            >{{ row.value.more }}</span>
          </p>
          <p
            v-if="deletionRows.length > 5"
            class="uikit_list_delete_more"
          >
            and {{ deletionRows.length - 5 }} more
          </p>
        </uk-flex>
      </uk-flex>
    </uk-popup>
    <uk-context-menu
      v-model="contextMenu.open"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.entries"
      @select="runContextEntry"
    />
  </div>
</template>

<script>
/** Pointer travel (px) before a press on a row's handle becomes a drag */
const DRAG_THRESHOLD = 3;
/** Duration of the rows sliding apart while dragging */
const DRAG_SLIDE = 'transform 0.15s ease';
/** Distance (px) from the list's top or bottom edge where a drag scrolls it */
const DRAG_SCROLL_EDGE = 24;

/**
 * A row's key: its item's id, else its name
 *
 * @param {Object} item list item
 * @returns {String}
 */
const itemKey = (item) => (item?.id !== undefined && item?.id !== null
  ? `id:${item.id}`
  : `name:${item?.name}`);

/**
 * Keys of a list of items, made unique with a `#n` suffix
 *
 * @param {Array<Object>} items list items
 * @param {String} prefix parent key prefix, for sub-rows
 * @returns {Array<String>}
 */
const keysOf = (items, prefix = '') => {
  const seen = {};
  return items.map((item) => {
    const key = `${prefix}${itemKey(item)}`;
    seen[key] = (seen[key] || 0) + 1;
    return seen[key] > 1 ? `${key}#${seen[key]}` : key;
  });
};

/**
 * @component List of selectable, checkable, unfoldable, reorderable and deletable rows.
 * Row state (selection, highlights, checks, unfolded rows) is kept by key (item id, else name),
 * so it survives item changes and searches. The list never writes to `items`.
 * @namespace uikit/lists
 */
export default {
  name: 'UkList',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /** Greys the list out and ignores every interaction */
    disabled: Boolean,
    /** Delete/Backspace and the rows' ✕ ask to delete rows (`delete` event) */
    deletable: Boolean,
    /** Shows a search box filtering rows (and sub-rows) by name */
    filterable: Boolean,
    /** Rows have checkboxes (`toggle` event); a click checks instead of selecting */
    toggleable: Boolean,
    /** Top-level rows can be dragged to reorder (`reorder` event) */
    draggable: Boolean,
    /** No multi-selection highlights (Ctrl/⌘/Shift+click select a single row) */
    noHighlight: Boolean,
    /** Selected rows aren't styled as selected */
    noSelect: Boolean,
    /**
     * Items: `{ id?, name, icon?, color?, more?, action?, disabled?, active?, unfold? }`.
     * `unfold` holds sub-items; `active` seeds the row's check. Rows are keyed by `id`, else
     * `name`, so items need one of them stable and unique.
     */
    items: {
      type: Array,
      default: () => [],
    },
    /** Shows each item's colour as a dot */
    colored: Boolean,
    /** Taller rows */
    tall: Boolean,
    /** Selects the first row (or unfolds the first parent) when items first appear */
    autoSelectFirst: Boolean,
    /** Selects the top-level row at this index whenever it changes */
    autoSelect: {
      type: Number,
      default: null,
    },
    /** Kept for compatibility: focus follows the browser's and needs no exceptions */
    preventUnfocus: {
      type: Array,
      default: () => [],
    },
    /** Only one parent unfolded at a time; the open one fills the list and scrolls */
    accordion: Boolean,
  },
  emits: ['unfold', 'focused', 'highlight', 'toggle', 'select', 'reorder', 'delete'],
  data() {
    return {
      searchString: '',
      /** Unfolded parents: key → true */
      unfolded: {},
      /** Checked rows: key → true */
      checked: {},
      /** Highlighted rows' keys, in the order they were highlighted */
      highlighted: [],
      /** Selected row's key */
      selectedKey: null,
      /** Keys shown in the delete confirmation */
      deletionKeys: [],
      deletePopupState: false,
      hasFocus: false,
      /** Drag in progress: { key, from, to, startY, startScroll, rows, dy, active, settling } */
      drag: null,
      /** Context menu: where it opens, its entries and the row it was opened on */
      contextMenu: {
        open: false,
        x: 0,
        y: 0,
        entries: [],
        row: null,
      },
      /** Parents whose sub-rows are folding away (they share the space while animating) */
      closing: {},
    };
  },
  computed: {
    /**
     * Rows built from the items and the row state; `value` is the caller's item
     */
    rows() {
      const keys = keysOf(this.items);
      return this.items.map((item, index) => {
        const key = keys[index];
        const row = this.makeRow(key, item);
        row.index = index;
        if (Array.isArray(item.unfold)) {
          const childKeys = keysOf(item.unfold, `${key}/`);
          row.unfolded = !!this.unfolded[key];
          row.children = item.unfold.map((sub, subIndex) => {
            const child = this.makeRow(childKeys[subIndex], sub);
            child.index = subIndex;
            child.parentKey = key;
            return child;
          });
        }
        return row;
      });
    },
    /**
     * Rows as shown: filtered by the search string (a parent with matching sub-rows shows open
     * with only those)
     */
    visibleRows() {
      let { rows } = this;
      const query = this.searchString.trim().toLowerCase();
      if (query) {
        const matches = (name) => String(name ?? '').toLowerCase().replace('-', ' ').includes(query);
        rows = rows.flatMap((row) => {
          const children = row.children?.filter((child) => matches(child.value.name));
          if (children?.length) return [{ ...row, unfolded: true, children }];
          return matches(row.value.name) ? [row] : [];
        });
      }
      return rows;
    },
    /** Every row and sub-row by key */
    rowsByKey() {
      const map = {};
      this.rows.forEach((row) => {
        map[row.key] = row;
        row.children?.forEach((child) => { map[child.key] = child; });
      });
      return map;
    },
    /** Visible rows that can be selected, top to bottom (arrow keys) */
    selectableRows() {
      return this.visibleRows.flatMap((row) => {
        if (!row.children) return [row];
        return row.unfolded ? row.children : [];
      }).filter((row) => !row.value.disabled);
    },
    /** Whether rows can be reordered now (flat lists, no search typed) */
    canReorder() {
      return this.draggable && !this.disabled && !this.hasParents && !this.searchString.trim();
    },
    /** Whether any item unfolds */
    hasParents() {
      return this.rows.some((row) => row.children);
    },
    /** Rows the delete confirmation lists */
    deletionRows() {
      return this.deletionKeys.map((key) => this.rowsByKey[key]).filter(Boolean);
    },
  },
  watch: {
    items: {
      handler(items, oldItems) {
        this.reconcile(items, oldItems);
        if (items?.length && !oldItems?.length) this.maybeAutoSelectFirst();
      },
      flush: 'pre',
    },
    autoSelect(index) {
      const row = this.rows[index];
      if (row && !row.children) this.selectRow(row);
    },
    deletePopupState(state) {
      if (!state) this.$nextTick(() => this.focusBody());
    },
    searchString() {
      this.cancelDrag();
    },
  },
  created() {
    // Last seen keys and `active` values, to carry state over edits (not reactive)
    this.lastKeys = null;
    this.lastActive = {};
    this.reconcile(this.items);
  },
  mounted() {
    if (this.items?.length) this.maybeAutoSelectFirst();
  },
  beforeUnmount() {
    this.stopDragListeners();
  },
  unmounted() {
    this.$emit('focused', false);
  },
  methods: {
    /**
     * A copy of an object without one key
     *
     * @param {Object} object source
     * @param {String} key key to leave out
     * @returns {Object}
     */
    omit(object, key) {
      const copy = { ...object };
      delete copy[key];
      return copy;
    },
    /**
     * A row's view: the item plus its state
     *
     * @param {String} key row key
     * @param {Object} value the caller's item
     * @returns {Object}
     */
    makeRow(key, value) {
      return {
        key,
        value,
        selected: this.selectedKey === key,
        highlighted: this.highlighted.includes(key),
        toggled: !!this.checked[key],
      };
    },
    /**
     * Keys of the given items and of their sub-items
     *
     * @param {Array<Object>} items list items
     * @returns {{ top: Array<String>, children: Object<String, Array<String>> }}
     */
    collectKeys(items) {
      const top = keysOf(items || []);
      const children = {};
      (items || []).forEach((item, index) => {
        if (Array.isArray(item.unfold)) children[top[index]] = keysOf(item.unfold, `${top[index]}/`);
      });
      return { top, children };
    },
    /**
     * Carries row state over an item change: a row whose id or name changed in place keeps its
     * state, rows that are gone leave it, and checks follow the items' `active` values
     *
     * @param {Array<Object>} items new items
     */
    reconcile(items) {
      const next = this.collectKeys(items);
      const prev = this.lastKeys;
      const nextTop = new Set(next.top);
      const renames = {};
      if (prev) {
        const prevTop = new Set(prev.top);
        next.top.forEach((key, index) => {
          const old = prev.top[index];
          if (old && old !== key && !prevTop.has(key) && !nextTop.has(old)) {
            renames[old] = key;
          }
        });
        // Sub-rows: carried along when their parent is renamed, and renamed in place
        const parents = {};
        Object.entries(renames).forEach(([from, to]) => { parents[to] = from; });
        Object.entries(next.children).forEach(([parent, childKeys]) => {
          const oldParent = parents[parent] || parent;
          const original = prev.children[oldParent] || [];
          const translated = original.map((key) => `${parent}${key.slice(oldParent.length)}`);
          const oldSet = new Set(translated);
          const newSet = new Set(childKeys);
          original.forEach((old, index) => {
            const key = childKeys[index];
            if (newSet.has(translated[index])) {
              if (translated[index] !== old) renames[old] = translated[index];
            } else if (key !== undefined && !oldSet.has(key)) {
              renames[old] = key;
            }
          });
        });
      }
      const valid = new Set(next.top);
      Object.values(next.children).forEach((keys) => keys.forEach((k) => valid.add(k)));
      const carry = (key) => {
        const renamed = renames[key] || key;
        return valid.has(renamed) ? renamed : null;
      };
      const carryMap = (map) => {
        const out = {};
        Object.keys(map).forEach((key) => {
          const target = carry(key);
          if (target && map[key]) out[target] = true;
        });
        return out;
      };
      this.unfolded = carryMap(this.unfolded);
      this.checked = carryMap(this.checked);
      this.highlighted = this.highlighted.map(carry).filter(Boolean);
      this.selectedKey = this.selectedKey ? carry(this.selectedKey) : null;
      // Checks follow `active` when a row first appears or its `active` changes
      const lastActive = {};
      const seed = (key, item) => {
        if (item?.active === undefined) return;
        lastActive[key] = item.active;
        if (this.lastActive[key] !== item.active) {
          if (item.active) this.checked[key] = true;
          else delete this.checked[key];
        }
      };
      (items || []).forEach((item, index) => {
        seed(next.top[index], item);
        if (Array.isArray(item.unfold)) {
          const childKeys = next.children[next.top[index]];
          item.unfold.forEach((sub, subIndex) => seed(childKeys[subIndex], sub));
        }
      });
      this.lastActive = lastActive;
      this.lastKeys = next;
    },
    /**
     * Selects the first row, or unfolds the first parent, when asked to
     */
    maybeAutoSelectFirst() {
      if (!this.autoSelectFirst) return;
      const [first] = this.rows;
      if (!first) return;
      if (first.children) {
        this.unfolded = { ...this.unfolded, [first.key]: true };
      } else if (!this.toggleable) {
        this.selectRow(first);
      }
    },
    /**
     * Unfolds or folds a parent row (only one open in accordion lists)
     *
     * @param {Object} row parent row
     */
    unfold(row) {
      if (this.disabled) return;
      const open = !this.unfolded[row.key];
      this.unfolded = this.accordion ? {} : { ...this.unfolded };
      if (open) this.unfolded[row.key] = true;
      else delete this.unfolded[row.key];
      this.$emit('unfold', row.value);
    },
    /** Focuses the rows (so keys reach this list), without scrolling */
    focusBody() {
      if (this.$refs.body && document.activeElement !== this.$refs.body) {
        this.$refs.body.focus({ preventScroll: true });
      }
    },
    handleFocusIn() {
      if (this.hasFocus) return;
      this.hasFocus = true;
      this.$emit('focused', true);
    },
    handleFocusOut(e) {
      // focus moving between elements inside the rows isn't a focus loss
      if (this.$refs.body?.contains(e?.relatedTarget)) return;
      if (!this.hasFocus) return;
      this.hasFocus = false;
      this.$emit('focused', false);
    },
    handleKeydown(e) {
      if (e.defaultPrevented || this.deletePopupState || this.disabled) return;
      if (e.key === 'Escape') {
        if (this.drag?.active) {
          this.cancelDrag();
        } else {
          this.clearHighlighted();
          this.$refs.body?.blur();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        this.displayDeletionPopup();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.moveSelection(e.key === 'ArrowDown' ? 1 : -1);
      }
    },
    /**
     * Selects the next or previous visible row
     *
     * @param {Number} step 1 (down) or -1 (up)
     */
    moveSelection(step) {
      if (this.toggleable) return;
      const rows = this.selectableRows;
      if (!rows.length) return;
      const index = rows.findIndex((row) => row.key === this.selectedKey);
      const firstIndex = step > 0 ? 0 : rows.length - 1;
      const nextIndex = index < 0
        ? firstIndex
        : Math.min(rows.length - 1, Math.max(0, index + step));
      if (nextIndex === index) return;
      const row = rows[nextIndex];
      this.selectRow(row);
      this.$nextTick(() => {
        this.$refs.body?.querySelector(`[data-key="${CSS.escape(row.key)}"]`)
          ?.scrollIntoView({ block: 'nearest' });
      });
    },
    /** Values of the highlighted rows, in order */
    highlightedValues() {
      return this.highlighted.map((key) => this.rowsByKey[key]?.value).filter(Boolean);
    },
    clearHighlighted() {
      if (this.noHighlight) return;
      this.highlighted = [];
      this.$emit('highlight', []);
    },
    /**
     * Selects one row, clearing highlights
     *
     * @param {Object} row row to select
     */
    selectRow(row) {
      if (!this.noHighlight) this.clearHighlighted();
      this.selectedKey = row.key;
      this.$emit('select', row.value);
    },
    /**
     * Adds a row to the highlights, or takes it out (Ctrl/⌘+click)
     *
     * @param {Object} row clicked row
     */
    toggleHighlight(row) {
      let highlighted = [...this.highlighted];
      if (!highlighted.length && this.selectedKey && this.selectedKey !== row.key) {
        highlighted.push(this.selectedKey);
      }
      if (highlighted.includes(row.key)) {
        highlighted = highlighted.filter((key) => key !== row.key);
        if (this.selectedKey === row.key) [this.selectedKey = null] = highlighted;
      } else {
        highlighted.push(row.key);
      }
      if (!this.selectedKey && highlighted.length) [this.selectedKey] = highlighted;
      this.highlighted = highlighted;
      const selected = this.rowsByKey[this.selectedKey];
      if (selected) this.$emit('select', selected.value);
      this.$emit('highlight', this.highlightedValues());
    },
    /**
     * Highlights the rows between the selected row and this one (Shift+click), when both are at
     * the same level; else selects this row
     *
     * @param {Object} row clicked row
     */
    highlightRange(row) {
      const selected = this.rowsByKey[this.selectedKey];
      const siblings = row.parentKey
        ? this.visibleRows.find((r) => r.key === row.parentKey)?.children || []
        : this.visibleRows.filter((r) => !r.children);
      const from = siblings.findIndex((r) => r.key === selected?.key);
      const to = siblings.findIndex((r) => r.key === row.key);
      if (!selected || from < 0 || to < 0 || selected.parentKey !== row.parentKey) {
        this.selectRow(row);
        return;
      }
      this.highlighted = siblings
        .slice(Math.min(from, to), Math.max(from, to) + 1)
        .filter((r) => !r.value.disabled)
        .map((r) => r.key);
      this.$emit('highlight', this.highlightedValues());
    },
    /**
     * Row click: check (checkable lists), add (Ctrl/⌘), range (Shift) or select
     *
     * @param {MouseEvent} e click event
     * @param {Object} row clicked row
     */
    clickRow(e, row) {
      if (this.disabled || row.value.disabled) return;
      if (this.suppressClick) {
        this.suppressClick = false;
        return;
      }
      this.focusBody();
      if (this.toggleable) {
        this.toggleRow(row);
      } else if ((e?.ctrlKey || e?.metaKey) && !this.noHighlight) {
        this.toggleHighlight(row);
      } else if (e?.shiftKey && !this.noHighlight) {
        this.highlightRange(row);
      } else {
        this.selectRow(row);
      }
    },
    /** Values of the checked rows: checked parents, else their checked sub-rows */
    checkedValues() {
      return this.rows.flatMap((row) => {
        if (this.checked[row.key]) return [row.value];
        return (row.children || []).filter((child) => this.checked[child.key])
          .map((child) => child.value);
      });
    },
    /**
     * Flips a row's check
     *
     * @param {Object} row row to check or uncheck
     */
    toggleRow(row) {
      if (this.disabled || row.value.disabled) return;
      const checked = { ...this.checked };
      if (checked[row.key]) delete checked[row.key];
      else checked[row.key] = true;
      this.checked = checked;
      this.$emit('toggle', this.checkedValues());
    },
    /**
     * The **Check All** row for these rows
     *
     * @param {Array<Object>} rows rows it covers
     * @returns {Object}
     */
    checkAllItem(rows) {
      const count = rows.filter((row) => this.checked[row.key]).length;
      return {
        value: {
          name: count ? 'Uncheck All' : 'Check All',
          more: `${count}/${rows.length}`,
        },
        toggled: count > 0,
      };
    },
    /**
     * Unchecks the rows if any is checked, else checks them all (disabled rows don't change)
     *
     * @param {Array<Object>} rows rows the Check All row covers
     */
    checkAll(rows) {
      if (this.disabled) return;
      const state = !rows.some((row) => this.checked[row.key]);
      const checked = { ...this.checked };
      rows.filter((row) => !row.value.disabled).forEach((row) => {
        if (state) checked[row.key] = true;
        else delete checked[row.key];
      });
      this.checked = checked;
      this.$emit('toggle', this.checkedValues());
    },
    /**
     * Opens the delete confirmation for the highlighted rows, else the selected one
     */
    displayDeletionPopup() {
      if (!this.deletable || this.disabled) return;
      const keys = this.highlighted.length
        ? [...this.highlighted]
        : [this.selectedKey].filter(Boolean);
      const deletable = keys.filter((key) => this.rowsByKey[key]);
      if (!deletable.length) return;
      this.deletionKeys = deletable;
      this.deletePopupState = true;
    },
    handleDeletion() {
      const values = this.deletionRows.map((row) => row.value);
      this.deletePopupState = false;
      this.deletionKeys = [];
      if (values.length) this.$emit('delete', values);
      this.clearHighlighted();
    },
    /**
     * Opens the context menu on a row, selecting it first unless it's part of the selection.
     * Lists that allow no entry leave the browser's own menu.
     *
     * @param {MouseEvent} e contextmenu event
     * @param {Object} row row under the pointer
     */
    openContextMenu(e, row) {
      if (this.disabled || row.value.disabled || this.drag) return;
      const entries = this.contextEntries(row);
      if (!entries.length) return;
      e.preventDefault();
      this.focusBody();
      const inSelection = this.highlighted.includes(row.key) || this.selectedKey === row.key;
      if (!inSelection && !this.toggleable) this.selectRow(row);
      this.contextMenu = {
        open: true,
        x: e.clientX,
        y: e.clientY,
        entries: this.contextEntries(row),
        row,
      };
    },
    /**
     * The context menu's entries for a row: what this list allows
     *
     * @param {Object} row row the menu is opened on
     * @returns {Array<Object>}
     */
    contextEntries(row) {
      const entries = [];
      if (this.canReorder && !row.parentKey) {
        entries.push(
          {
            name: 'Move up', icon: 'arrow_up', command: 'up', disabled: row.index === 0,
          },
          {
            name: 'Move down',
            icon: 'arrow_down',
            command: 'down',
            disabled: row.index === this.rows.length - 1,
          },
        );
      }
      if (!this.toggleable && !this.noHighlight) {
        entries.push({ name: 'Select all', icon: 'check', command: 'all' });
      }
      if (this.deletable && !this.toggleable) {
        const count = this.highlighted.includes(row.key) ? this.highlighted.length : 1;
        entries.push({
          name: 'Delete', icon: 'trash', command: 'delete', more: count > 1 ? `${count} items` : '',
        });
      }
      return entries;
    },
    /**
     * Runs a context menu entry
     *
     * @param {Object} entry chosen entry
     */
    runContextEntry(entry) {
      const { row } = this.contextMenu;
      if (!row) return;
      this.focusBody();
      if (entry.command === 'up' || entry.command === 'down') {
        const final = row.index + (entry.command === 'up' ? -1 : 1);
        if (final >= 0 && final < this.rows.length) {
          this.$emit('reorder', { original: row.index, final });
        }
      } else if (entry.command === 'all') {
        this.selectAll(row);
      } else if (entry.command === 'delete') {
        this.displayDeletionPopup();
      }
    },
    /**
     * Highlights every visible, enabled row of a row's level
     *
     * @param {Object} row a row of that level
     */
    selectAll(row) {
      const siblings = (row.parentKey
        ? this.visibleRows.find((r) => r.key === row.parentKey)?.children || []
        : this.visibleRows.filter((r) => !r.children))
        .filter((r) => !r.value.disabled);
      if (!siblings.length) return;
      if (!siblings.some((r) => r.key === this.selectedKey)) {
        this.selectedKey = siblings[0].key;
        this.$emit('select', siblings[0].value);
      }
      this.highlighted = siblings.map((r) => r.key);
      this.$emit('highlight', this.highlightedValues());
    },
    /**
     * Press on a row's handle: starts a drag once the pointer moves
     *
     * @param {PointerEvent} e pointerdown event
     * @param {Object} row the row
     */
    pressHandle(e, row) {
      if (!this.canReorder || e.button !== 0) return;
      e.preventDefault();
      this.focusBody();
      const { body } = this.$refs;
      // Top-level rows as laid out now: the drag works on these positions
      const rows = [...body.children]
        .filter((el) => el.dataset.key)
        .map((el) => ({ key: el.dataset.key, top: el.offsetTop, height: el.offsetHeight }));
      const from = rows.findIndex((r) => r.key === row.key);
      if (from < 0) return;
      this.drag = {
        key: row.key,
        from,
        to: from,
        startY: e.clientY,
        startScroll: body.scrollTop,
        rows,
        dy: 0,
        active: false,
        settling: false,
      };
      window.addEventListener('pointermove', this.moveDrag);
      window.addEventListener('pointerup', this.endDrag);
      window.addEventListener('pointercancel', this.cancelDrag);
    },
    moveDrag(e) {
      const { drag } = this;
      const { body } = this.$refs;
      if (!drag || drag.settling || !body) return;
      if (!drag.active) {
        if (Math.abs(e.clientY - drag.startY) < DRAG_THRESHOLD) return;
        drag.active = true;
      }
      e.preventDefault();
      const bounds = body.getBoundingClientRect();
      if (e.clientY < bounds.top + DRAG_SCROLL_EDGE) body.scrollTop -= 8;
      else if (e.clientY > bounds.bottom - DRAG_SCROLL_EDGE) body.scrollTop += 8;
      const dragged = drag.rows[drag.from];
      const first = drag.rows[0];
      const last = drag.rows[drag.rows.length - 1];
      // The row follows the pointer, kept between the first and last rows
      const dy = e.clientY - drag.startY + (body.scrollTop - drag.startScroll);
      drag.dy = Math.max(first.top - dragged.top, Math.min(last.top + last.height
        - dragged.top - dragged.height, dy));
      // Target: how many other rows have their middle above the dragged row's middle
      const middle = dragged.top + drag.dy + dragged.height / 2;
      drag.to = drag.rows.filter((r, index) => index !== drag.from
        && r.top + r.height / 2 < middle).length;
    },
    /**
     * Where a row is drawn while dragging: the dragged row at the pointer, the rows it passed
     * moved by its height to open the gap where it will land
     *
     * @param {Object} row a top-level row
     * @returns {Object} inline style
     */
    dragStyle(row) {
      const { drag } = this;
      if (!drag?.active) return null;
      const index = drag.rows.findIndex((r) => r.key === row.key);
      if (index === drag.from) {
        return {
          transform: `translateY(${drag.dy}px)`,
          transition: drag.settling ? DRAG_SLIDE : 'none',
        };
      }
      const height = drag.rows[drag.from].height;
      let shift = 0;
      if (drag.from < drag.to && index > drag.from && index <= drag.to) shift = -height;
      else if (drag.to < drag.from && index >= drag.to && index < drag.from) shift = height;
      return { transform: `translateY(${shift}px)`, transition: DRAG_SLIDE };
    },
    endDrag() {
      const { drag } = this;
      this.stopDragListeners();
      if (!drag || drag.settling) return;
      this.drag = null;
      if (!drag.active) return;
      // the click that ends a drag isn't a selection
      this.suppressClick = true;
      setTimeout(() => { this.suppressClick = false; });
      if (drag.to !== drag.from) {
        this.$emit('reorder', { original: drag.from, final: drag.to });
      }
      // the moved row is selected (checkable lists have no selection)
      const row = this.rowsByKey[drag.key];
      if (row && !this.toggleable) this.selectRow(row);
    },
    /**
     * Cancels a drag: the rows slide back to where they were
     */
    cancelDrag() {
      this.stopDragListeners();
      const { drag } = this;
      if (!drag?.active || drag.settling) {
        this.drag = null;
        return;
      }
      drag.settling = true;
      drag.dy = 0;
      drag.to = drag.from;
      setTimeout(() => {
        if (this.drag === drag) this.drag = null;
      }, 160);
    },
    stopDragListeners() {
      window.removeEventListener('pointermove', this.moveDrag);
      window.removeEventListener('pointerup', this.endDrag);
      window.removeEventListener('pointercancel', this.cancelDrag);
    },
  },
};
</script>

<style scoped>
.uikit_list {
  display: flex;
  flex-direction: column;
  background: var(--primary-light);
  height: 100%;
  width: 100%;
  min-height: 0;
  user-select: none;
}
.uikit_list.disabled {
  opacity: 0.6;
}
.uikit_list_body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  outline: none !important;
  background: var(--primary-light);
}
.uikit_list_filler {
  flex: 1 0 0 !important;
  min-height: 0;
  background: var(--primary-light) var(--idle-stripes);
}
.uikit_list_body > * {
  flex-shrink: 0;
}
.uikit_list_body.dragging {
  cursor: grabbing;
}
.uikit_list_group {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
}
/* Accordion: the open parent shrinks to the space left and scrolls its sub-rows */
.uikit_list_body.accordion > .uikit_list_group.open {
  flex-shrink: 1;
}
.uikit_list_children {
  display: grid;
  grid-template-rows: 1fr;
  min-height: 0;
}
.uikit_list_children_inner {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}
.uikit_list_children_inner > * {
  flex-shrink: 0;
}
.uikit-unfold-enter-active,
.uikit-unfold-leave-active {
  transition: grid-template-rows 0.15s ease, opacity 0.15s ease;
}
.uikit-unfold-enter-active .uikit_list_children_inner,
.uikit-unfold-leave-active .uikit_list_children_inner {
  overflow-y: hidden;
}
.uikit-unfold-enter-from,
.uikit-unfold-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .uikit-unfold-enter-active,
  .uikit-unfold-leave-active {
    transition: none;
  }
}
.uikit_list_body_empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 60px;
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
.uikit_sublist_body {
  padding-left: 16px !important;
}
.uikit_list_dragged {
  position: relative;
  z-index: 2;
  opacity: 1 !important;
  outline: 1px solid var(--accent-blue);
  outline-offset: -1px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}
.uikit_list_body.dragging :deep(.uikit_list_item_handle) {
  cursor: grabbing;
}
.uikit_list_delete_text {
  padding: 16px 16px 8px;
}
.uikit_list_delete_items {
  padding: 0 16px 16px;
  gap: 4px;
}
.uikit_list_delete_items > p {
  gap: 8px;
}
.uikit_list_delete_more {
  color: var(--secondary-light-alt);
  font-family: Roboto-Regular;
}
</style>
