<template>
  <div
    class="content_bar"
    :class="{ no_link: !editLink }"
  >
    <p
      v-if="section"
      class="content_bar_crumbs"
      :style="{ '--section-color': section.color }"
    >
      <span class="content_bar_dot" />
      <span class="content_bar_section">{{ section.title }}</span>
      <span class="content_bar_sep">/</span>
      <span class="content_bar_page">{{ title }}</span>
    </p>
    <span class="content_bar_spacer" />

    <div
      class="content_bar_group"
      role="radiogroup"
      aria-label="Appearance"
    >
      <h3 class="content_bar_label">
        Theme
      </h3>
      <div class="content_bar_segments">
        <button
          v-for="option in appearanceOptions"
          :key="option.value"
          type="button"
          role="radio"
          :aria-checked="appearance === option.value"
          class="content_bar_segment"
          :class="{ active: appearance === option.value }"
          @click="$emit('appearance', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <a
      v-if="editLink"
      class="content_bar_link"
      :href="editLink"
      target="_blank"
      rel="noreferrer"
    >
      <uk-icon name="wrench" />
      <h3>Edit page</h3>
    </a>
  </div>
</template>

<script>
/**
 * The toolbar's content section, between the search and the action buttons: where you are
 * (section / page), the theme (light, dark or the system's) and a link to edit the page on
 * GitHub.
 */
export default {
  name: 'ManualContentBar',
  props: {
    /**
     * Current section ({ title, color })
     * @type {?Object}
     */
    section: {
      type: Object,
      default: null,
    },
    /**
     * Page title
     * @type {String}
     */
    title: {
      type: String,
      default: '',
    },
    /**
     * Appearance mode: 'light' | 'dark' | 'system'
     * @type {String}
     */
    appearance: {
      type: String,
      default: 'dark',
    },
    /**
     * Link to edit this page's source
     * @type {String}
     */
    editLink: {
      type: String,
      default: '',
    },
  },
  emits: ['appearance'],
  data() {
    return {
      appearanceOptions: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'system', label: 'System' },
      ],
    };
  },
};
</script>

<style scoped>
/* A section of the toolbar: fills the space between the search and the action buttons */
.content_bar {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 20px;
  min-width: 0;
  height: 100%;
  padding-left: 16px;
}

.content_bar_crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  white-space: nowrap;
}

.content_bar_dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--section-color);
}

.content_bar_section {
  font-family: Roboto-Bold, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--section-color);
}

.content_bar_sep {
  opacity: 0.4;
}

.content_bar_page {
  overflow: hidden;
  text-overflow: ellipsis;
}

.content_bar_spacer {
  flex: 1;
}

.content_bar_group {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.content_bar_label {
  opacity: 0.6;
}

/* Segmented control drawn like Studio's small round buttons */
.content_bar_segments {
  display: flex;
  padding: 2px;
  border-radius: 12px;
  background: var(--primary-dark);
}

.content_bar_segment {
  height: 20px;
  padding: 0 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-family: Roboto-Regular, sans-serif;
  font-size: 11px;
  text-transform: uppercase;
  color: var(--secondary-lighter);
  opacity: 0.7;
  cursor: pointer;
}

.content_bar_segment:hover {
  opacity: 1;
}

.content_bar_segment.active {
  background: var(--secondary-dark);
  opacity: 1;
}

/* Without the edit cell, keep the gap before the toolbar's action buttons */
.content_bar.no_link {
  padding-right: 20px;
}

/* Edit page: a toolbar cell */
.content_bar_link {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  height: 100%;
  padding: 0 16px;
  border-left: 1px solid var(--primary-dark);
  text-decoration: none;
}

.content_bar_link:hover {
  background: var(--secondary-darker);
}

.content_bar_link :deep(svg) {
  width: 12px;
  height: 12px;
  fill: var(--secondary-lighter);
}

@media (max-width: 1279px) {
  .content_bar_crumbs,
  .content_bar_label {
    display: none;
  }
}

@media (max-width: 959px) {
  .content_bar {
    flex: 0 0 auto;
    gap: 8px;
    padding-left: 8px;
  }

  .content_bar_spacer,
  .content_bar_link {
    display: none;
  }

  .content_bar_segment {
    padding: 0 7px;
  }
}
</style>
