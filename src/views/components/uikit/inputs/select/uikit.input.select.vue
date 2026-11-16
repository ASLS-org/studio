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
      :data-own-keys="displayed || null"
      @focusout="hide"
      @keydown="onKeydown"
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
            :ref="(el) => { optionEls[index] = el; }"
            class="uikit_select_option"
            :class="{ current: index === selected, marked: index === marked }"
            @click="select(index)"
            @mouseenter="marked = index"
            v-html="option"
          />
          <!--eslint-enable vue/no-v-html-->
        </uk-flex>
      </Teleport>
    </div>
  </uk-flex>
</template>

<script>
import { SELECT_OPTION_HEIGHT, SELECT_VISIBLE_OPTIONS } from '@/views/utils/geometry';

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
      /**
       * Option the keys (or the pointer) point at in the open list
       */
      marked: -1,
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
  created() {
    /** Option elements by index (to keep the marked one in view) */
    this.optionEls = [];
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
          this.marked = this.isEmpty ? 0 : this.selected;
          this.$nextTick(() => {
            this.computeOptionListStyle();
            this.revealMarked();
          });
        }
      }
    },
    /**
     * Keeps the marked option in view in the open list
     */
    revealMarked() {
      const el = this.optionEls[this.marked];
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    },
    /**
     * Marks an option and keeps it in view
     *
     * @param {Number} index option index
     */
    mark(index) {
      this.marked = index;
      this.$nextTick(this.revealMarked);
    },
    /**
     * Keys on the focused select: Up and Down open the list, then move the mark (wrapping);
     * Enter or Space choose the marked option (or open the list); Escape closes it unchanged;
     * a letter marks the next option that starts with it
     *
     * @param {KeyboardEvent} e keydown event
     */
    onKeydown(e) {
      if (this.disabled || e.ctrlKey || e.metaKey || e.altKey) return;
      const count = this.options.length;
      if (!count) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!this.displayed) {
          this.show();
          return;
        }
        this.mark((this.marked + (e.key === 'ArrowDown' ? 1 : -1) + count) % count);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.displayed) this.select(this.marked);
        else this.show();
      } else if (e.key === 'Escape') {
        if (!this.displayed) return;
        e.preventDefault();
        e.stopPropagation();
        this.displayed = false;
      } else if (e.key.length === 1) {
        const letter = e.key.toLowerCase();
        const text = (option) => String(option).replace(/<[^>]*>/g, '').trim().toLowerCase();
        const from = this.displayed ? this.marked : this.selected;
        for (let i = 1; i <= count; i += 1) {
          const index = (from + i + count) % count;
          if (text(this.options[index]).startsWith(letter)) {
            e.preventDefault();
            if (!this.displayed) this.show();
            this.mark(index);
            return;
          }
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
          top: `${box.top - Math.min(this.options.length, SELECT_VISIBLE_OPTIONS) * SELECT_OPTION_HEIGHT}px`,
          left: `${box.left}px`,
          height: `${this.options.length * SELECT_OPTION_HEIGHT}px`,
          maxHeight: `${SELECT_VISIBLE_OPTIONS * SELECT_OPTION_HEIGHT}px`,
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
  height: var(--control-height);
  border: var(--border-width) solid var(--secondary-dark);
}
.uikit_select_textbox {
  font-family: Roboto-Regular;
  background: var(--primary-dark);
  color: var(--secondary-lighter);
  font-size: var(--font-xs);
  width: 100%;
  padding: 0;
  padding-left: var(--space-2);
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
  outline: var(--border-width) solid var(--secondary-light);
  border-bottom: none;
  box-shadow: 0px -5px 10px -2px var(--primary-dark);
}
.uikit_select_option {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: var(--select-option-height);
  max-height: var(--select-option-height);
  padding: 0 var(--space-2);
  width: inherit;
  background: var(--secondary-darker);
}
.uikit_select_option:hover,
.uikit_select_option.marked {
  background: var(--secondary-dark);
  cursor: pointer;
}
/* The current value, in the list: styled like a selected list row */
.uikit_select_option.current {
  color: var(--secondary-lighter);
  background: var(--accent-blue);
}
.selected {
  outline: var(--border-width) solid var(--accent-blue);
  outline-offset: -1px;
}
</style>
