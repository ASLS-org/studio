<template>
  <div class="uikit_checkbox" :class="{ disabled }">
    <span class="uikit_checkbox_tickbox" v-bind:class="{ active }" @click="toggle()">
      <span class="uikit_checkbox_tickbox_tick">
        <!-- TODO: replace this by a div with svg mask to change color dynamically/clean !-->
        <svg width="9" height="8" viewbox="0 0 9 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 3.85714L3.33333 6L8 1" stroke-width="2" />
        </svg>
      </span>
    </span>
    <span class="uikit_checkbox_label" v-if="label != null" v-bind:class="{ active: active }">
      {{ label }}
    </span>
  </div>
</template>

<script>
/**
 * @component Checkbox A simple checkbox toggle component.
 * @namespace uikit/inputs/toggles
 * @story Default {"value": "Default", "label":"default"}
 * @story Disabled {"value": "Default", "label":"default", "disabled": true}
 */
export default {
  name: "ukCheckbox",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  emits:['update:modelValue','input'],
  props: {
    /**
     * The checkbox's value.
     */
    modelValue: Boolean,
    /**
     * Whether the checkbox is disabled or not.
     */
    disabled: Boolean,
    /**
     * Text label to be displayed on the right of the checkbox
     */
    label: String,
  },
  data() {
    return {
      /**
       * Checkbox's activity value
       */
      active: this.modelValue,
    };
  },
  methods: {
    /**
     * Toggle the checkbox activity ON/OFF
     *
       */
    toggle() {
      if (!this.disabled) {
        this.active = !this.active;
        /**
         * Checkbox's activity changed
         *
         * @property {Boolean} active the checkbox's activity value
         */
        this.$emit("input", this.active);
        this.$emit("update:modelValue", this.active);
      }
    },
  },
  watch: {
    modelValue(val) {
      this.active = val;
    },
  },
};
</script>

<style scoped>
.uikit_checkbox {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-family: Roboto-Regular;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  user-select: none;
  width: min-content;
  width: auto;
}
.uikit_checkbox_tickbox {
  background: var(--secondary-darker);
  height: 16px;
  width: 16px;
  display: flex;
  align-items: center;
  flex-direction: row;
  cursor: pointer;
  opacity: 0.8;
  border-radius: 2px;
}
.uikit_checkbox_tickbox_tick {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  stroke: var(--primary-light);
}
.uikit_checkbox_label {
  font-size: 12px;
  padding-left: 8px;
  color: var(--secondary-light);
}
.uikit_checkbox_tickbox.active {
  background: var(--accent-blue);
}
.uikit_checkbox_label.active {
  color: var(--secondary-lighter);
}
.uikit_checkbox_tickbox.active .uikit_checkbox_tickbox_tick {
  stroke: var(--secondary-lighter);
}
.uikit_checkbox_tickbox:disabled {
  background: var(--secondary-dark);
}
.disabled .uikit_checkbox_tickbox {
  cursor: unset !important;
}
</style>
