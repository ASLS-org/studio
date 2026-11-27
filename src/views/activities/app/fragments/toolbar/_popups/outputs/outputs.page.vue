<template>
  <div class="outputs_page">
    <!-- What is selected, as the Arrange popup heads its modes -->
    <div
      class="outputs_page_heading"
      :class="{ flush }"
    >
      <uk-icon
        class="outputs_page_icon"
        :name="icon"
      />
      <div class="outputs_page_titles">
        <div class="outputs_page_title">
          {{ title }}
        </div>
        <div
          v-if="text"
          class="outputs_page_text"
        >
          {{ text }}
        </div>
      </div>
    </div>
    <slot />
  </div>
</template>

<script>
/**
 * @component A page of the Outputs workspace's side panel: the selected item's icon, name and
 * one line about it, then its rows (`outputs-row`) and sections (`outputs-section`).
 */
export default {
  name: 'OutputsPage',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * Icon name
     */
    icon: { type: String, default: 'connection' },
    /**
     * The item's name
     */
    title: { type: String, default: '' },
    /**
     * One line about it
     */
    text: { type: String, default: '' },
    /**
     * The content starts right under the heading's line (a page that is a list)
     */
    flush: Boolean,
  },
};
</script>

<style scoped>
.outputs_page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  /* Rows and sections pad themselves: dividers run the panel's full width */
}
.outputs_page_heading {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  padding: var(--space-5);
  margin-bottom: var(--space-4);
  border-bottom: var(--border-width) solid var(--primary-dark);
}
.outputs_page_heading.flush {
  margin-bottom: 0;
}
.outputs_page_icon {
  flex-shrink: 0;
  width: var(--icon-lg) !important;
  height: var(--icon-lg) !important;
  fill: var(--secondary-lighter);
}
.outputs_page_titles {
  min-width: 0;
}
.outputs_page_title {
  font-family: Roboto-Medium;
  font-size: var(--font-md);
  color: var(--secondary-lighter);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.outputs_page_text {
  margin-top: var(--space-2);
  font-family: Roboto-Regular;
  font-size: var(--font-sm);
  color: var(--secondary-light);
  white-space: normal;
}
</style>
