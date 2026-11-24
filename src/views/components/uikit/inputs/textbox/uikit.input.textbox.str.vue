<template>
  <div class="uikit_txt_input">
    <div
      v-if="label"
      :class="{ disabled }"
      class="label"
    >
      {{ label }}
    </div>
    <div
      class="uikit_txt_input_textbox_wrapper"
      tabindex="0"
      :class="{ disabled: disabled || readonly, outlined }"
    >
      <input
        v-model="content"
        class="uikit_txt_input_textbox"
        :disabled="disabled || readonly"
        type="text"
        :placeholder="placeholder"
        @keydown.stop
        @keydown.enter="updateValue"
        @blur="updateValue"
        @input="
          (v) => {
            if (autoUpdate) updateValue(v);
          }
        "
      >
    </div>
  </div>
</template>

<script>
/**
 * @component TextualInput A text input which can hold a value string.
 * @namespace uikit/inputs/textboxes
 * @story Default {"value": "Default", "label":"default"}
 * @story Disabled {"value": "Default", "label":"default", "disabled": true}
 * @story "Read Only" {"value": "Default", "label":"default", "readonly": true}
 */
export default {
  name: 'UkTxtInput',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * The textual input's text label value
     */
    label: {
      type: String,
      default: null,
    },
    /**
     * The textual input's placeholder text
     */
    placeholder: {
      type: String,
      default: null,
    },
    /**
     * The actual textual input value
     */
    modelValue: {
      type: String,
      default: null,
    },
    /**
     * Whether or not the input should be disabled
     */
    disabled: Boolean,
    /**
     * Whether or not the input should be read-only
     */
    readonly: Boolean,
    /**
     * Whether or not to apply alternative outlined styling to the input
     */
    outlined: {
      type: Boolean,
      default: true,
    },
    /**
     * Whether value should be automatically updated on each keystroke or not
     * value is updated on input blur or keydown "enter" otherwise
     */
    autoUpdate: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'input'],
  data() {
    return {
      /**
       * Textual input's value (reactive)
       */
      content: this.modelValue,
    };
  },
  watch: {
    modelValue(newValue) {
      this.content = newValue;
    },
  },
  methods: {
    /**
     * Updates input value
     *
     */
    updateValue() {
      /**
       * Input value changed
       *
       * @property {String} content Textualinput value
       */
      this.$emit('update:modelValue', this.content);
      this.$emit('input', this.content);
    },
  },
};
</script>

<style scoped>
.uikit_txtinput {
  display: flex;
  flex-direction: column;
  user-select: none;
}
.uikit_txt_input_textbox_wrapper {
  display: flex;
  height: var(--control-height);
}
.uikit_txt_input_textbox_wrapper.outlined {
  border: var(--border-width) solid var(--secondary-dark);
}
.uikit_txt_input_textbox_wrapper:focus-within {
  outline: var(--border-width) solid var(--accent-blue) !important;
  outline-offset: -1px;
}
.uikit_txt_input_textbox {
  font-family: Roboto-Regular;
  border: none;
  background: var(--primary-dark);
  color: var(--secondary-lighter);
  font-size: var(--font-xs);
  display: flex;
  width: 100%;
  padding: 0;
  padding-left: var(--space-2);
  -moz-appearance: textfield;
}
.disabled .uikit_txt_input_textbox {
  background: var(--secondary-darker);
  color: var(--secondary-light);
}
.disabled .uikit_txt_input_textbox::placeholder {
  color: var(--secondary-light);
}
.disabled:focus-within {
  outline: none !important;
}
.uikit_txt_input_textbox:focus {
  outline: none;
}
.uikit_txt_input_textbox::placeholder {
  font-size: var(--font-xs);
}
</style>
