<template>
  <uk-flex col class="uikit_select">
    <div class="label"  :class="{ disabled: disabled }" v-if="label">
      {{ label }}
    </div>
    <div class="uikit_select_box" tabindex="0" @focusout="hide" ref="select_box" :class="{ disabled: disabled }">
      <uk-flex class="uikit_select_textbox_wrapper" :class="{ selected: displayed }" @click.native="show()">
        <uk-flex class="uikit_select_textbox" v-html="options[value]" />
        <span class="uikit_select_button">
          <uk-icon class="uikit_select_button_icon" name="arrow_down" />
        </span>
      </uk-flex>
      <uk-flex tabindex="0" v-show="displayed" col class="uikit_select_option_list" :style="optionListStyle" ref="options">
        <h4 class="uikit_select_option" v-on:click="select(index)" v-html="option" v-for="(option, index) in options" :key="index" />
      </uk-flex>
    </div>
  </uk-flex>
</template>

<script>
 /**
  * @component Select A multiple-choices input with customisable option list.
  * @namespace uikit/inputs/selects
  * @story Default {"options":["one","two","three"], "label":"Hello World", "value": "0"}
  * @story Disabled {"options":["one","two","three"], "label":"Hello World", "value": "0", "disabled": true}
  */
export default {
  name: "ukSelectInput",
  props: {
    /**
     * The gauge's text label value
     */
    label: String,
    /**
     * An Array of HTML-formated string of select options
     */
    options: Array,
    /**
     * The input's actual value
     */
    value: Number,
    /**
     * WHether or not the input is disabled
     */
    disabled: Boolean,
  },
  data() {
    return {
      /**
       * Seleted item value (reactive)
       */
      selected: parseInt(this.value),
      /**
       * Whether the option list is displayed or not
       */
      displayed: false,
      /**
       * Convey optionList styling properties
       */
      optionListStyle: {},
    };
  },
  methods: {
    /**
     * Selects a value from the option list
     * 
       * @param {Number} index index of the selected option within te option list
     */
    select(index) {
      if (!this.disabled) {
        this.selected = index;
        /**
         * Selected value changed
         *
         * @property {Number} index index of the selected option within te option list
         */
        this.$emit("input", index);
        this.hide();
      }
    },
    /**
     * Hides the input's option list
     * 
       * @param {Object} e click event
     */
    hide(e) {
      let el = this.$refs.options.$el;
      let childClicked = e ? el.contains(e.relatedTarget) || el.contains(e.explicitOriginalTarget) : false;
      if (!this.disabled && !childClicked) {
        this.displayed = false;
      }
    },
    /**
     * Displays the input's option list
     * 
       */
    show() {
      if (!this.disabled) {
        let body = document.body;
        this.displayed = !this.displayed;
        if (this.displayed) {
          body.appendChild(this.$refs.options.$el);
          this.$nextTick(this.computeOptionListStyle);
        } else {
          body.removeChild(this.$refs.options.$el);
        }
      }
    },
    /**
     * Computes the option list styling.
     * 
       */
    computeOptionListStyle() {
      let selectBoxEl = this.$refs.select_box;
      let optionListEl = this.$refs.options.$el;
      if (selectBoxEl && optionListEl) {
        let box = selectBoxEl.getBoundingClientRect();
        this.optionListStyle = {
          width: `${selectBoxEl.clientWidth}px`,
          top: `${box.top - Math.min(this.options.length * 25, 100)}px`,
          left: `${box.left}px`,
          height: this.options.length * 25 + "px",
          maxHeight: "100px",
        };
      }
    },
  },
};
</script>

<style scoped>

.uikit_select {
  user-select: none;
  width: 100%;
  z-index: 100;
}
.uikit_select_box {
  position: relative;
}
.uikit_select_box.disabled:focus {
  outline: unset;
}
.uikit_select_textbox_wrapper {
  height: 25px;
  border: 1px solid var(--secondary-dark);
}
.uikit_select_textbox {
  font-family: Roboto-Regular;
  background: var(--primary-dark);
  color: var(--secondary-lighter);
  font-size: 10px;
  width: 100%;
  padding: 0;
  padding-left: 5px;
  -moz-appearance: none;
  -webkit-appearance: none;
  outline: 0;
  align-items: center;
  cursor: pointer;
}
.uikit_select_button {
  background: var(--secondary-dark);
  min-width: 14px;
  max-width: 14px;
  height: 100%;
  margin-left: -14px; /*Offseting button to fit inside the texbox frame*/
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  pointer-events: none;
}
.uikit_select_button_icon {
  height: 8px !important;
  width: 8px !important;
  fill: var(--secondary-lighter);
  fill-opacity: 0.7;
}
.disabled .uikit_select_button_icon {
  fill: var(--secondary-light);
}
.disabled .uikit_select_textbox {
  background: var(--secondary-darker);
  color: var(--secondary-light);
  cursor: unset;
}
.disabled {
  color: var(--secondary-light) !important;
}
.disabled .uikit_select_button {
  background: var(--secondary-darker);
}
.uikit_select_option_list {
  position: absolute;
  bottom: 26px;
  z-index: 1000;
  width: inherit;
  overflow-y: auto;
  overflow-x: hidden;
  height: fit-content;
  width: inherit;
  background: var(--primary-dark);
  outline: 1px solid var(--secondary-light);
  border-bottom: none;
  box-shadow: 0px -5px 10px -2px var(--primary-dark);
}
.uikit_select_option {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 25px;
  max-height: 25px;
  padding: 0 5px;
  width: inherit;
  background: var(--secondary-darker);
}
.uikit_select_option:hover {
  background: var(--secondary-dark);
  cursor: pointer;
}
.selected {
  outline: 1px solid var(--accent-blue);
  outline-offset: -1px;
}
</style>
