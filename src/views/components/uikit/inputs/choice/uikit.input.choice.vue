<template>
  <uk-flex
    col
    class="uikit_choice"
  >
    <div
      v-if="label"
      class="label"
    >
      {{ label }}
    </div>
    <div
      class="uikit_choice_row"
      role="radiogroup"
      tabindex="0"
      :aria-label="label"
      @keydown="onKeydown"
    >
      <div
        v-for="option in options"
        :key="option.key"
        class="uikit_choice_option"
        role="radio"
        :aria-checked="option.key === modelValue"
        :class="{ selected: option.key === modelValue, disabled: option.disabled }"
        :title="option.title || null"
        @click="pick(option)"
      >
        <uk-icon
          v-if="option.icon"
          class="uikit_choice_option_icon"
          :name="option.icon"
        />
        <h4 class="uikit_choice_option_label">
          {{ option.label }}
        </h4>
      </div>
    </div>
  </uk-flex>
</template>

<script>
/**
 * @component Choice One option among a row of buttons, each with an icon and a short name, drawn
 * like toggled buttons. Left and Right move the selection while the row has focus; disabled
 * options are dimmed and skipped.
 * @namespace uikit/inputs/choice
 * @story Default {
 *   "label": "Family",
 *   "modelValue": "colour",
 *   "options": [
 *     {"key": "intensity", "label": "Intensity", "icon": "dimmer"},
 *     {"key": "colour", "label": "Colour", "icon": "hslwheel"},
 *     {"key": "position", "label": "Position", "icon": "move"}
 *   ]
 * }
 * @story Disabled option {
 *   "label": "Type",
 *   "modelValue": "scene",
 *   "options": [
 *     {"key": "scene", "label": "Scene", "icon": "mixer"},
 *     {"key": "effect", "label": "Effect", "icon": "waveform", "disabled": true}
 *   ]
 * }
 */
export default {
  name: 'UkChoice',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * Label above the row
     */
    label: {
      type: String,
      default: null,
    },
    /**
     * The options: { key, label, icon, title (a hint), disabled }
     */
    options: {
      type: Array,
      default: () => [],
    },
    /**
     * Key of the selected option
     */
    modelValue: {
      type: [String, Number],
      default: null,
    },
  },
  emits: ['update:modelValue'],
  methods: {
    /**
     * Selects an option, unless it is disabled
     *
     * @public
     * @param {Object} option
     */
    pick(option) {
      if (!option || option.disabled || option.key === this.modelValue) return;
      this.$emit('update:modelValue', option.key);
    },
    /**
     * Left and Right select the previous or next option that can be picked
     *
     * @public
     * @param {KeyboardEvent} e
     */
    onKeydown(e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const step = e.key === 'ArrowRight' ? 1 : -1;
      const { options } = this;
      let index = options.findIndex((option) => option.key === this.modelValue);
      for (let n = 0; n < options.length; n++) {
        index += step;
        if (index < 0 || index >= options.length) return;
        if (!options[index].disabled) {
          this.pick(options[index]);
          return;
        }
      }
    },
  },
};
</script>

<style scoped>
.uikit_choice {
  width: 100%;
}
.uikit_choice_row {
  display: flex;
  gap: var(--space-2);
  outline: none;
}
.uikit_choice_row:focus-visible .uikit_choice_option.selected {
  box-shadow: 0 0 0 var(--border-width) var(--secondary-lighter);
}
.uikit_choice_option {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-2);
  border-radius: var(--radius-md);
  background: var(--secondary-darker);
  user-select: none;
  opacity: .8;
  cursor: pointer;
  transition: background-color .1s ease-in-out;
}
.uikit_choice_option:not(.disabled):hover {
  opacity: 1;
}
.uikit_choice_option.selected {
  background: var(--accent-blue);
  opacity: 1;
}
.uikit_choice_option.disabled {
  opacity: var(--opacity-dimmed);
  cursor: not-allowed;
}
.uikit_choice_option_icon {
  height: var(--icon-md) !important;
  width: var(--icon-md) !important;
  fill: var(--secondary-lighter);
}
.uikit_choice_option.selected .uikit_choice_option_icon {
  fill: var(--on-color-text);
}
.uikit_choice_option_label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-xs);
  text-transform: uppercase;
  color: var(--secondary-lighter);
}
.uikit_choice_option.selected .uikit_choice_option_label {
  color: var(--on-color-text);
}
</style>
