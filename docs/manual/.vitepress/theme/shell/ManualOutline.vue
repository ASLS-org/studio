<template>
  <aside
    class="manual_outline"
    aria-label="On this page"
    :style="{ '--section-color': color }"
  >
    <h3 class="manual_outline_title">
      On this page
    </h3>
    <uk-list-item
      v-for="item in items"
      :key="item.id"
      large
      no-select
      class="manual_outline_item"
      :class="{ sub: item.level > 2, active: item.id === active }"
      :item="{ value: { name: item.title } }"
      @click="$emit('go', item.id)"
    />
  </aside>
</template>

<script>
/**
 * "On this page": the page's sections as quiet Studio list rows (roomy `large` mode), titled like
 * the navigation's sections, sub-sections indented; the section in view is written in the
 * current section's colour (text only, no row highlight).
 */
export default {
  name: 'ManualOutline',
  props: {
    /**
     * Headings: { id, level, title }
     * @type {Array<Object>}
     */
    items: {
      type: Array,
      default: () => [],
    },
    /**
     * Id of the heading in view
     * @type {String}
     */
    active: {
      type: String,
      default: '',
    },
    /**
     * Accent of the current page's section
     * @type {String}
     */
    color: {
      type: String,
      default: 'var(--accent-blue)',
    },
  },
  emits: ['go'],
};
</script>

<style scoped>
.manual_outline {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 24px;
  background: var(--primary-light);
}

.manual_outline_title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 10px;
  letter-spacing: 0.06em;
}

.manual_outline .manual_outline_item {
  min-height: 32px;
  border-bottom-color: transparent;
}

.manual_outline .manual_outline_item.sub {
  padding-left: 32px;
}

.manual_outline .manual_outline_item :deep(h4) {
  font-family: Roboto-Regular, sans-serif;
  font-size: 13px;
  opacity: 0.7;
}

.manual_outline .manual_outline_item:hover :deep(h4) {
  opacity: 1;
}

.manual_outline .manual_outline_item.active :deep(h4) {
  font-family: Roboto-Medium, sans-serif;
  color: var(--section-color);
  opacity: 1;
}
</style>
