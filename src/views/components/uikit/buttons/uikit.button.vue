<template>
  <uk-flex @click="handleClick" class="uikit_button" :style="{background: toggled && color ? color : 'var(--secondary-dark)' }" :class="{ disabled, toggled, toggleable, square }">
    <uk-icon class="uikit_button_icon" v-if="icon" :name="icon"/>
    <h4>{{ label }}</h4>
  </uk-flex>
</template>

<script>
/**
 * @component Button A multi-function customisable button component which can be used as a toggleable and/or temporary switch.
 * @namespace uikit/inputs/buttons
 * @story Default {"label":"default", "value": false}
 * @story Square {"label":"square", "square": true, "value": false}
 * @story Toggle {"label":"toggle", "toggleable": true, "value": false}
 * @story Icon {"label":"Icon", "toggleable": true, "value": false, "icon":"new"}
 */
export default {
  name: "ukButton",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  emits: ['update:modelValue','click'],
  props: {
    /**
     * Text to be displayed in the button.
     */
    label: String,
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
     * The button's current value. Either true or false.
     */
    modelValue: Boolean,
    /**
     * The button's color. Defaults to #4786B4.
     */
    color: {
      type: String,
      default: '#4786B4'
    },
    /**
     * uikit-icon name to preceed the button's label.
     */
    icon: String
  },
  data() {
    return {
      /**
       * Button's toggle state.
       */
      toggled: this.toggleable ? this.value : false,
    };
  },
  methods:{
    /**
     * Handle button click.
     * 
       */
    handleClick(){
      if(this.toggleable){
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
  }
};
</script>

<style scoped>
.uikit_button {
  user-select: none;
  background: var(--secondary-dark);
  height: 20px;
  min-height: 20px;
  min-width: 70px;
  /* max-width: 100px; */
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  padding: 0 14px;
}
.uikit_button:active:not(.toggleable){
  background: var(--secondary-light)!important;
}
.uikit_button.toggleable{
  background: var(--secondary-darker);
  opacity: .8;
}
.uikit_button.square{
  border-radius: 0;
}
.uikit_button_label {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
  font-size: 10px;
  color: var(--secondary-lighter);
}
.uikit_button:hover {
  background: var(--secondary-light);
  cursor: pointer;
}
.uikit_button.disabled {
  background: var(--secondary-darker)!important;
  cursor: unset!important;
}
.disabled h4{
  color: var(--secondary-light)!important;
}
.uikit_button.toggled {
  background: var(--accent-blue);
}
.uikit_button_icon{
  fill: var(--secondary-lighter);
  margin-right:8px;
  height:14px!important;
  width:14px!important
}
</style>
