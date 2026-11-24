<template>
  <div
    class="uikit_color_input"
    :class="{ disabled }"
  >
    <div
      v-if="label"
      class="label"
      :class="{ disabled }"
      v-text="label"
    />
    <div class="uikit_color_input_wrapper">
      <!-- The swatch opens the system colour picker; the colour follows it live -->
      <label
        class="uikit_color_input_swatch"
        :style="{ background: colour }"
        :title="disabled ? '' : 'Pick a colour'"
      >
        <input
          type="color"
          class="uikit_color_input_picker"
          :value="colour"
          :disabled="disabled"
          @input="(e) => pick(e.target.value)"
        >
      </label>
      <input
        v-model="text"
        class="uikit_color_input_textbox"
        type="text"
        maxlength="7"
        spellcheck="false"
        :disabled="disabled"
        @keydown.stop
        @keydown.enter="commit"
        @blur="commit"
      >
    </div>
  </div>
</template>

<script>
/**
 * Hex colour pattern, with or without `#`, three or six digits
 *
 * @constant {RegExp}
 */
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * `#rrggbb` (lower case) of a hex colour, or null when it isn't one
 *
 * @param {String} value
 * @returns {?String}
 */
function normalise(value) {
  const match = HEX.exec(String(value || '').trim());
  if (!match) return null;
  const digits = match[1].length === 3
    ? match[1].split('').map((d) => d + d).join('')
    : match[1];
  return `#${digits.toLowerCase()}`;
}

/**
 * @component ColorInput A colour field: a swatch opening the system colour picker, and the
 * colour's hex code, which can be typed (Enter or leaving the field applies it; anything that
 * isn't a colour goes back to the current one).
 * @namespace uikit/inputs/color
 * @story Default {"modelValue": "#ff8000", "label": "Colour"}
 * @story Disabled {"modelValue": "#ff8000", "label": "Colour", "disabled": true}
 */
export default {
  name: 'UkColorInput',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * Label above the field
     */
    label: {
      type: String,
      default: null,
    },
    /**
     * Colour as `#rrggbb`
     */
    modelValue: {
      type: String,
      default: '#000000',
    },
    /**
     * Whether the field can't be changed
     */
    disabled: Boolean,
  },
  emits: ['update:modelValue'],
  data() {
    return {
      /**
       * Hex code in the text box (as typed)
       */
      text: (normalise(this.modelValue) || '#000000').toUpperCase(),
    };
  },
  computed: {
    /**
     * The colour shown, `#rrggbb`
     *
     * @type {String}
     */
    colour() {
      return normalise(this.modelValue) || '#000000';
    },
  },
  watch: {
    colour(colour) {
      this.text = colour.toUpperCase();
    },
  },
  methods: {
    /**
     * Reports a colour from the picker
     *
     * @public
     * @param {String} value `#rrggbb`
     */
    pick(value) {
      const colour = normalise(value);
      if (colour && colour !== this.colour) this.$emit('update:modelValue', colour);
    },
    /**
     * Applies the typed hex code, or puts the current colour back when it isn't one
     *
     * @public
     */
    commit() {
      const colour = normalise(this.text);
      if (!colour) {
        this.text = this.colour.toUpperCase();
        return;
      }
      this.text = colour.toUpperCase();
      if (colour !== this.colour) this.$emit('update:modelValue', colour);
    },
  },
};
</script>

<style scoped>
.uikit_color_input {
  display: flex;
  flex-direction: column;
  min-width: 0;
  user-select: none;
}
/* The text field look: a dark box, blue outline while focused */
.uikit_color_input_wrapper {
  display: flex;
  align-items: center;
  height: var(--control-height);
  border: var(--border-width) solid var(--secondary-dark);
  background: var(--primary-dark);
}
.uikit_color_input_wrapper:focus-within {
  outline: var(--border-width) solid var(--accent-blue);
  outline-offset: -1px;
}
.uikit_color_input_swatch {
  position: relative;
  flex-shrink: 0;
  width: calc(var(--control-height) - 2 * var(--space-2));
  height: calc(var(--control-height) - 2 * var(--space-2));
  margin: 0 var(--space-2);
  border-radius: var(--radius-sm);
  box-shadow: inset 0 0 0 1px var(--secondary-dark);
  cursor: pointer;
}
/* The native picker covers the swatch, invisible: a click on the swatch opens it */
.uikit_color_input_picker {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.uikit_color_input_textbox {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: none;
  background: transparent;
  font-family: Roboto-Regular;
  font-size: var(--font-xs);
  color: var(--secondary-lighter);
}
.uikit_color_input_textbox:focus {
  outline: none;
}
.disabled .uikit_color_input_wrapper {
  background: var(--secondary-darker);
}
.disabled .uikit_color_input_swatch,
.disabled .uikit_color_input_picker {
  cursor: default;
}
</style>
