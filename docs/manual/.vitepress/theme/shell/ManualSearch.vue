<template>
  <button
    class="manual_search"
    type="button"
    aria-label="Search the manual"
    @click="$emit('open')"
  >
    <span class="manual_search_label">Search</span>
    <kbd class="manual_search_kbd">{{ shortcut }}</kbd>
  </button>
</template>

<script>
/**
 * The manual's search field: drawn like Studio's text inputs (uk-txt-input), it opens the search
 * box when clicked or on its shortcut, and shows the shortcut on its right.
 */
export default {
  name: 'ManualSearch',
  emits: ['open'],
  data() {
    return {
      shortcut: 'Ctrl K',
    };
  },
  mounted() {
    this.shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
  },
};
</script>

<style scoped>
.manual_search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 30px;
  padding: 0 6px 0 10px;
  border: none;
  border-radius: 2px;
  background: var(--primary-dark);
  color: inherit;
  font: inherit;
  cursor: text;
}

.manual_search:hover {
  outline: 1px solid var(--secondary-dark);
  outline-offset: -1px;
}

.manual_search:focus-visible {
  outline: 1px solid var(--accent-blue);
  outline-offset: -1px;
}

.manual_search_label {
  flex: 1;
  text-align: left;
  font-family: Roboto-Regular, sans-serif;
  font-size: 12px;
  text-transform: none;
  color: var(--secondary-light);
}

.manual_search_kbd {
  padding: 0 6px;
  border-radius: 8px;
  background: var(--secondary-dark);
  font-family: Roboto-Regular, sans-serif;
  font-size: 10px;
  line-height: 18px;
  color: var(--secondary-lighter);
}
</style>
