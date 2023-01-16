<template>
  <div class="uikit_txt_input">
    <div :class="{ disabled }" class="label" v-if="label">
      {{ label }}
    </div>
    <div class="uikit_txt_input_textbox_wrapper" tabindex="0" :class="{ disabled: disabled || readonly, outlined }">
      <input
        @keydown.stop
        @keydown.enter="updateValue"
        @blur="updateValue"
        class="uikit_txt_input_textbox"
        :disabled="disabled || readonly"
        type="text"
        v-model="content"
        :placeholder="placeholder"
        @input="
          (v) => {
            if (autoUpdate) updateValue(v);
          }
        "
      />
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
  name: "ukTxtInput",
  props: {
    /**
     * The textual input's text label value
     */
    label: String,
    /**
     * The textual input's placeholder text
     */
    placeholder: String,
    /**
     * The actual textual input value
     */
    value: String,
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
  data() {
    return {
      /**
       * Textual input's value (reactive)
       */
      content: this.value,
    };
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
      this.$emit("input", this.content);
    },
  },
  watch: {
    value: function (newValue) {
      this.content = newValue;
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
  height: 25px;
}
.uikit_txt_input_textbox_wrapper.outlined {
  border: 1px solid var(--secondary-dark);
}
.uikit_txt_input_textbox_wrapper:focus-within {
  outline: 1px solid var(--accent-blue) !important;
  outline-offset: -1px;
}
.uikit_txt_input_textbox {
  font-family: Roboto-Regular;
  border: none;
  background: var(--primary-dark);
  color: var(--secondary-lighter);
  font-size: 10px;
  display: flex;
  width: 100%;
  padding: 0;
  padding-left: 5px;
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
  font-size: 10px;
  /* color: var(--secondary-light); */
}
</style>
