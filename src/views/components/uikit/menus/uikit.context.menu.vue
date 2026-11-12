<template>
  <Teleport :to="host">
    <div
      v-if="modelValue && items.length"
      ref="menu"
      class="uikit_context_menu"
      :style="position"
      @contextmenu.prevent
    >
      <uk-list-item
        v-for="(entry, index) in items"
        :key="entry.name"
        class="uikit_context_menu_item"
        :class="{ active: index === activeIndex }"
        :item="{ value: entry }"
        no-select
        @pointerenter="activeIndex = index"
        @click="pick(entry)"
      />
    </div>
  </Teleport>
</template>

<script>
/** Gap (px) kept between the menu and the window's edges */
const EDGE = 4;

/**
 * @component Context menu: a list of entries opened at a point (usually the pointer), styled as
 * Studio's toolbar menus. Arrow keys and Enter pick an entry; Escape, a press elsewhere,
 * scrolling, resizing or leaving the window close it.
 * @namespace uikit/menus
 * @story Default {
 *   "modelValue": true, "x": 40, "y": 40,
 *   "items": [{"name": "Move up"}, {"name": "Delete", "icon": "trash"}]
 * }
 */
export default {
  name: 'UkContextMenu',
  compatConfig: {
    MODE: 3,
  },
  inject: {
    // the user manual mounts Studio inside its own page and gives its popup host
    popupHost: { default: null },
  },
  props: {
    /** Whether the menu is open */
    modelValue: Boolean,
    /** Horizontal position (px, viewport) of the menu's top-left corner */
    x: {
      type: Number,
      default: 0,
    },
    /** Vertical position (px, viewport) of the menu's top-left corner */
    y: {
      type: Number,
      default: 0,
    },
    /**
     * Entries: `{ name, icon?, more?, disabled? }`, plus anything the caller needs back (except
     * `action`, which list rows draw as a button)
     */
    items: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'select'],
  data() {
    return {
      /** Entry under the pointer or picked with the arrow keys */
      activeIndex: -1,
      /** Position once kept inside the window */
      left: this.x,
      top: this.y,
    };
  },
  computed: {
    /** Where the menu is attached */
    host() {
      return this.popupHost || 'body';
    },
    position() {
      return { left: `${this.left}px`, top: `${this.top}px` };
    },
  },
  watch: {
    modelValue: {
      handler(open) {
        if (open) this.open();
        else this.stopListening();
      },
    },
    x() { if (this.modelValue) this.place(); },
    y() { if (this.modelValue) this.place(); },
  },
  mounted() {
    if (this.modelValue) this.open();
  },
  beforeUnmount() {
    this.stopListening();
  },
  methods: {
    open() {
      this.activeIndex = -1;
      this.place();
      this.stopListening();
      window.addEventListener('pointerdown', this.handlePointerDown, true);
      window.addEventListener('keydown', this.handleKeydown, true);
      window.addEventListener('wheel', this.close, true);
      window.addEventListener('resize', this.close);
      window.addEventListener('blur', this.close);
    },
    /**
     * Places the menu at (x, y), moved back inside the window when it would overflow
     */
    place() {
      this.left = this.x;
      this.top = this.y;
      this.$nextTick(() => {
        const { menu } = this.$refs;
        if (!menu) return;
        const { width, height } = menu.getBoundingClientRect();
        this.left = Math.max(EDGE, Math.min(this.x, window.innerWidth - width - EDGE));
        this.top = Math.max(EDGE, Math.min(this.y, window.innerHeight - height - EDGE));
      });
    },
    close() {
      this.stopListening();
      this.$emit('update:modelValue', false);
    },
    stopListening() {
      window.removeEventListener('pointerdown', this.handlePointerDown, true);
      window.removeEventListener('keydown', this.handleKeydown, true);
      window.removeEventListener('wheel', this.close, true);
      window.removeEventListener('resize', this.close);
      window.removeEventListener('blur', this.close);
    },
    handlePointerDown(e) {
      if (!this.$refs.menu?.contains(e.target)) this.close();
    },
    handleKeydown(e) {
      const enabled = this.items
        .map((entry, index) => (entry.disabled ? -1 : index))
        .filter((index) => index >= 0);
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!enabled.length) return;
        const at = enabled.indexOf(this.activeIndex);
        const step = e.key === 'ArrowDown' ? 1 : -1;
        const start = step > 0 ? -1 : enabled.length;
        const next = (at < 0 ? start : at) + step;
        this.activeIndex = enabled[(next + enabled.length) % enabled.length];
      } else if (e.key === 'Enter') {
        const entry = this.items[this.activeIndex];
        if (entry) this.pick(entry);
      } else {
        return;
      }
      // the menu took the key: the list (or anything else) underneath ignores it
      e.preventDefault();
      e.stopPropagation();
    },
    /**
     * Runs an entry and closes the menu
     *
     * @param {Object} entry chosen entry
     */
    pick(entry) {
      if (entry.disabled) return;
      this.close();
      /**
       * An entry was chosen
       *
       * @property {Object} entry the entry, as given in `items`
       */
      this.$emit('select', entry);
    },
  },
};
</script>

<style scoped>
.uikit_context_menu {
  position: fixed;
  z-index: 2000;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  background: var(--primary-light);
  border: 1px solid var(--primary-dark);
  box-shadow: -2px 10px 15px 0px rgba(0, 0, 0, 0.6);
  user-select: none;
}
.uikit_context_menu_item:last-child {
  border-bottom: none;
}
.uikit_context_menu_item.active:not(.disabled) {
  --row-bg: var(--secondary-darker);
  background: var(--row-bg);
}
</style>
