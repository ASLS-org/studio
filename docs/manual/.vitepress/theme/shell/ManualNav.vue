<template>
  <nav
    class="manual_nav"
    aria-label="Manual"
  >
    <section
      v-for="section in sections"
      :key="section.title"
      class="manual_nav_section"
      :style="{ '--section-color': section.color }"
    >
      <h3 class="manual_nav_title">
        <span class="manual_nav_dot" />
        {{ section.title }}
      </h3>
      <uk-list-item
        v-for="page in section.pages"
        :key="page.link"
        large
        class="manual_nav_item"
        :item="{ value: { name: page.title, icon: page.icon }, selected: page.link === current }"
        @click="$emit('open', page.link)"
      />
    </section>
  </nav>
</template>

<script>
/**
 * The manual's navigation panel, in the patch bay's place: sections separated by Studio's
 * separators, each titled with its accent dot, its pages as Studio list rows in their roomy
 * `large` mode; the current page is tinted with its section's colour.
 */
export default {
  name: 'ManualNav',
  props: {
    /**
     * Sections with their pages (shell/nav.js)
     * @type {Array<Object>}
     */
    sections: {
      type: Array,
      default: () => [],
    },
    /**
     * Link of the current page
     * @type {String}
     */
    current: {
      type: String,
      default: '',
    },
  },
  emits: ['open'],
};
</script>

<style scoped>
.manual_nav {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 24px;
  background: var(--primary-light);
}

.manual_nav_section:first-child .manual_nav_title {
  padding-top: 16px;
}

.manual_nav_title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 8px;
  letter-spacing: 0.06em;
}

.manual_nav_dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  margin: 2px;
  border-radius: 50%;
  background: var(--section-color);
}

/* Pages read lighter than their section title, without separators between them */
.manual_nav .manual_nav_item {
  min-height: 36px;
  border-bottom-color: transparent;
}

.manual_nav .manual_nav_item :deep(h4) {
  font-family: Roboto-Regular, sans-serif;
  opacity: 0.85;
}

.manual_nav .manual_nav_section .manual_nav_item :deep(.uikit_list_item_icon) {
  width: 12px !important;
  height: 12px !important;
  opacity: 0.7;
}

/* Current page: a tint of its section's colour, the label and icon in that colour */
.manual_nav .manual_nav_item.selected {
  background: color-mix(in srgb, var(--section-color) 14%, transparent) !important;
}

.manual_nav .manual_nav_item.selected :deep(h4) {
  font-family: Roboto-Medium, sans-serif;
  color: var(--section-color);
  opacity: 1;
}

.manual_nav .manual_nav_item.selected :deep(.uikit_list_item_icon) {
  fill: var(--section-color) !important;
  opacity: 1;
}
</style>
