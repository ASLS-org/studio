<template>
  <button
    class="uikit_button"
    :style="{background: (toggled || filled) && color ? color : 'var(--secondary-dark)' }"
    :class="{ disabled, toggled, toggleable, square, filled }"
    @click.stop="handleClick"
  >
    <uk-icon
      v-if="icon"
      class="uikit_button_icon"
      :name="icon"
    />
    <h4>{{ label }}</h4>
  </button>
</template>

<script>
/**
 * @component Butto customisable button component usable as a toggleable and/or temporary switch.
 * @namespace uikit/inputs/buttons
 * @story Default {"label":"default", "value": false}
 * @story Square {"label":"square", "square": true, "value": false}
 * @story Toggle {"label":"toggle", "toggleable": true, "value": false}
 * @story Icon {"label":"Icon", "toggleable": true, "value": false, "icon":"new"}
 * @story Filled {"label":"connect", "filled": true, "color": "var(--accent-green)"}
 */
export default {
  name: 'UkButton',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Text to be displayed in the button.
     */
    label: {
      type: String,
      default: null,
    },
    /**
     *  Whether the button is disabled or not.
     */
    disabled: Boolean,
    /**
     *  Whether the button is toggleabe (cycle on/off) or not.
     */
    toggleable: Boolean,
    /**
     * Whether alternate "square" styling should be applied
     */
    square: Boolean,
    /**
     * Opt-in: the button always shows its `color` (an action that carries a meaning, such as
     * Connect / Disconnect), not only while toggled
     */
    filled: Boolean,
    /**
     * The button's current value. Either true or false.
     */
    modelValue: Boolean,
    /**
     * The button's color. Defaults to #4786B4.
     */
    color: {
      type: String,
      default: '#4786B4',
    },
    /**
     * uikit-icon name to preceed the button's label.
     */
    icon: {
      type: String,
      default: null,
    },
  },
  emits: ['update:modelValue', 'click'],
  data() {
    return {
      /**
       * Button's toggle state.
       */
      toggled: this.toggleable ? this.modelValue : false,
    };
  },
  watch: {
    modelValue(value) {
      if (this.toggleable) {
        this.toggled = value;
      }
    },
  },
  methods: {
    /**
     * Handle button click.
     *
       */
    handleClick() {
      if (!this.disabled) {
        if (this.toggleable) {
          this.toggled = !this.toggled;
        }
        /**
       * Button input event
       *
       * @property {Boolean} toggled button's toggle state
       */
        this.$emit('click', this.toggled);
        this.$emit('update:modelValue', this.toggled);
      }
    },
  },
};
</script>

<style scoped>
.uikit_button {
  display: flex;
  user-select: none;
  background: var(--secondary-dark);
  height: var(--button-height);
  min-height: var(--button-height);
  min-width: 70px;
  /* max-width: 100px; */
  border-radius: var(--radius-pill);
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  padding: 0 var(--space-6);
  opacity: .9;
}
.uikit_button:not(.disabled):not(.toggleable):not(.filled){
  background: var(--secondary-dark)!important;
}
.uikit_button.filled h4 {
  color: var(--on-color-text);
}
.uikit_button.filled.disabled {
  opacity: .4;
}
.uikit_button.toggleable{
  background: var(--secondary-darker);
  opacity: .8;
}
.uikit_button.square{
  border-radius: 0;
  border: 1px solid var(--secondary-dark)
}
.uikit_button_label {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
  font-size: var(--font-xs);
  color: var(--secondary-lighter);
}
.uikit_button:not(.disabled):hover {
  opacity: 1;
  cursor: pointer;
  transition: background-color .1s ease-in-out;
}
.uikit_button.disabled {
  background: var(--secondary-darker)!important;
  cursor: not-allowed!important;
}
.disabled h4{
  color: var(--secondary-light)!important;
}
.disabled .uikit_button_icon{
  fill: var(--secondary-light)!important;
}
.uikit_button.toggled {
  background: var(--accent-blue);
}
.uikit_button_icon{
  fill: var(--secondary-lighter);
  margin-right:var(--space-4);
  height:var(--icon-sm)!important;
  width:14px!important
}
</style>
