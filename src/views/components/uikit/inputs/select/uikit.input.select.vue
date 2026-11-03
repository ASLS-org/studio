<template>
  <uk-flex
    col
    class="uikit_select"
  >
    <div
      v-if="label"
      class="label"
      :class="{ disabled: disabled }"
    >
      {{ label }}
    </div>
    <div
      ref="select_box"
      class="uikit_select_box"
      tabindex="0"
      :class="{ disabled: disabled }"
      @focusout="hide"
    >
      <uk-flex
        class="uikit_select_textbox_wrapper"
        :class="{ selected: displayed }"
        @click="show()"
      >
        <!-- eslint-disable vue/no-v-html, vue/no-v-text-v-html-on-component -->
        <uk-flex
          class="uikit_select_textbox"
          :class="{placeholder: isEmpty}"
          v-html="value"
        />
        <!-- eslint-enable vue/no-v-html, vue/no-v-text-v-html-on-component -->
        <span class="uikit_select_button">
          <uk-icon
            class="uikit_select_button_icon"
            name="arrow_down"
          />
        </span>
      </uk-flex>
      <Teleport to="body">
        <uk-flex
          v-show="displayed"
          ref="options"
          tabindex="0"
          col
          class="uikit_select_option_list"
          :style="optionListStyle"
        >
          <!--eslint-disable vue/no-v-html-->
          <h4
            v-for="(option, index) in options"
            :key="index"
            class="uikit_select_option"
            @click="select(index)"
            v-html="option"
          />
          <!--eslint-enable vue/no-v-html-->
        </uk-flex>
      </Teleport>
    </div>
  </uk-flex>
</template>

<script>
/**
  * @component Select A multiple-choices input with customisable option list.
  * @namespace uikit/inputs/selects
  * @story Default {"options":["one","two","three"], "label":"Hello World", "value": "0"}
  * @story Disabled {
  *   "options":["one","two","three"],
  *   "label":"Hello World",
  *   "value": "0",
  *   "disabled": true
  * }
  */
export default {
  name: 'UkSelectInput',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * The input's label value
     */
    label: {
      type: String,
      default: '',
    },
    /**
     * The input's placeholder value
     */
    placeholder: {
      type: String,
      default: '',
    },
    /**
     * An Array of HTML-formated string of select options
     */
    options: {
      type: Array,
      default: () => [],
    },
    /**
     * The input's actual value
     */
    modelValue: {
      type: [String, Number],
      default: 0,
    },
    /**
     * Whether or not the input is disabled
     */
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'input'],
  data() {
    return {
      /**
       * Seleted item value (reactive)
       */
      selected: parseInt(this.modelValue, 10),
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
  computed: {
    value: {
      get() {
        return this.isEmpty
          ? this.placeholder
          : this.options[this.selected];
      },
    },
    isEmpty: {
      get() {
        return (
          this.selected === null
          || this.selected === undefined
          || Number.isNaN(this.selected)
          || this.selected < 0
        );
      },
    },
  },
  watch: {
    modelValue(newValue) {
      this.select(parseInt(newValue, 10));
    },
    displayed(displayed) {
      if (displayed) {
        window.addEventListener('scroll', this.computeOptionListStyle, true);
        window.addEventListener('resize', this.computeOptionListStyle);
      } else {
        this.removeListeners();
      }
    },
  },
  beforeUnmount() {
    this.removeListeners();
  },
  methods: {
    /**
     * Selects a value from the option list
     *
     * @param {Number} index index of the selected option within te option list
     */
    select(index) {
      const previous = this.selected;

      if (!this.disabled && index !== previous) {
        this.selected = index;
        /**
         * Selected value changed
         *
         * @property {Number} index index of the selected option within te option list
         */
        this.$emit('update:modelValue', index);
        this.$emit('input', index);
      }
      this.hide();
    },
    /**
     * Hides the input's option list
     *
     * @param {Object} e click event
     */
    hide(e) {
      const el = this.$refs?.options?.$el;
      if (el) {
        const childClicked = e
          ? el.contains(e.relatedTarget) || el.contains(e.explicitOriginalTarget)
          : false;
        if (!this.disabled && !childClicked) {
          this.displayed = false;
        }
      }
    },
    /**
     * Displays the input's option list
     *
     */
    show() {
      if (!this.disabled) {
        this.displayed = !this.displayed;
        if (this.displayed) {
          this.$nextTick(this.computeOptionListStyle);
        }
      }
    },
    /**
     * Stops following scroll and resize events
     *
     */
    removeListeners() {
      window.removeEventListener('scroll', this.computeOptionListStyle, true);
      window.removeEventListener('resize', this.computeOptionListStyle);
    },
    /**
     * Computes the option list styling. Also runs on scroll and resize while the list is
     * displayed so it follows the input.
     *
     */
    computeOptionListStyle() {
      const selectBoxEl = this.$refs.select_box;
      const optionListEl = this.$refs.options.$el;
      if (selectBoxEl && optionListEl) {
        const box = selectBoxEl.getBoundingClientRect();
        this.optionListStyle = {
          width: `${selectBoxEl.clientWidth}px`,
          top: `${box.top - Math.min(this.options.length * 25, 100)}px`,
          left: `${box.left}px`,
          height: `${this.options.length * 25}px`,
          maxHeight: '100px',
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
.uikit_select_textbox.placeholder{
  color: var(--secondary-light-alt);
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
  cursor: not-allowed;
}
.disabled.label{
  color: var(--secondary-lighter)!important;
}
.disabled {
  color: var(--secondary-light) !important;
}
.disabled .uikit_select_button {
  background: var(--secondary-darker);
}
.uikit_select_option_list {
  position: fixed;
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
