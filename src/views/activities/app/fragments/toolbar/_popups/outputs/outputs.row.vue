<template>
  <div
    class="outputs_row"
    :class="{ section: !!section, flush }"
  >
    <h3
      v-if="section"
      class="outputs_row_section"
    >
      {{ section }}
    </h3>
    <template v-else>
      <div
        class="outputs_row_label"
        :class="{ muted, error }"
      >
        {{ label }}
      </div>
      <uk-flex
        v-if="$slots.default"
        :gap="4"
        class="outputs_row_controls"
      >
        <slot />
      </uk-flex>
    </template>
  </div>
</template>

<script>
/**
 * @component One row of an Outputs page, as the Arrange popup lays out its settings: the name on
 * the left, its controls on the right. With `section`, a section title instead.
 */
export default {
  name: 'OutputsRow',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * The setting's name (or a line of text when there are no controls)
     */
    label: { type: String, default: '' },
    /**
     * A section title: the row shows only that
     */
    section: { type: String, default: '' },
    /**
     * A section whose content starts right under its band (a list, a log)
     */
    flush: Boolean,
    /**
     * Quieter text (a note, a time)
     */
    muted: Boolean,
    /**
     * Something went wrong
     */
    error: Boolean,
  },
};
</script>

<style scoped>
.outputs_row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: var(--control-height);
  padding: 0 var(--space-5);
  margin-bottom: var(--space-4);
}
/* A section opens with a header band across the whole panel, as the flow's column headers */
.outputs_row.section {
  flex-shrink: 0;
  height: var(--widget-header-height);
  margin: var(--space-5) 0 var(--space-4);
  border-top: var(--border-width) solid var(--primary-dark);
  border-bottom: var(--border-width) solid var(--primary-dark);
}
.outputs_row.section.flush {
  margin-bottom: 0;
  border-bottom: none;
}
.outputs_row_label {
  min-width: 0;
  font-family: Roboto-Medium;
  font-size: var(--font-sm);
  color: var(--secondary-lighter);
  white-space: normal;
}
.outputs_row_label.muted {
  font-family: Roboto-Regular;
  color: var(--secondary-light);
}
.outputs_row_label.error {
  color: var(--accent-red);
}
.outputs_row_controls {
  flex-shrink: 0;
  align-items: center;
}
</style>
