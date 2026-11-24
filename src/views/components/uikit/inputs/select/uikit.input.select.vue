<template>
  <uk-flex
    col
    class="uikit_select"
    :class="{ with_trigger: !!$slots.trigger }"
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
      <!-- A trigger slot replaces the text box: the list opens from what it holds (an icon) -->
      <div
        v-if="$slots.trigger"
        class="uikit_select_trigger"
        :class="{ selected: displayed }"
        @click="show()"
      >
        <slot name="trigger" />
      </div>
      <uk-flex
        v-else
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
        <!-- Built only while open: a strip of selects (channels) stays cheap to mount -->
        <uk-flex
          v-if="displayed"
          ref="options"
          tabindex="0"
          col
          class="uikit_select_option_list"
          :class="{ with_trigger: !!$slots.trigger }"
          :style="optionListStyle"
          @focusout="onListFocusOut"
        >
          <!-- A trigger's list: a header (what it is about), then a real uk-list of `items` -->
          <div
            v-if="$slots.header"
            class="uikit_select_header"
          >
            <slot name="header" />
          </div>
          <uk-list
            v-if="$slots.trigger"
            ref="list"
            class="uikit_select_list"
            no-highlight
            :filterable="searchable"
            :items="items"
            :selection="marked > -1 ? [marked] : []"
            :empty-text="emptyText || undefined"
            :style="{ height: listHeight, flex: 'none' }"
            @select="(item) => select(item.id)"
            @keydown.capture="onListKeydown"
          />
          <template v-else>
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
          </template>
        </uk-flex>
      </Teleport>
    </div>
  </uk-flex>
</template>

<script>
import { SELECT_OPTION_HEIGHT, SELECT_VISIBLE_OPTIONS } from '@/views/utils/geometry';

/**
 * Widest a trigger's option list gets (px)
 *
 * @constant {Number} SELECT_TRIGGER_LIST_MAX_WIDTH
 */
const SELECT_TRIGGER_LIST_MAX_WIDTH = 360;

/**
 * Narrowest a trigger's option list gets (px)
 *
 * @constant {Number} SELECT_TRIGGER_LIST_MIN_WIDTH
 */
const SELECT_TRIGGER_LIST_MIN_WIDTH = 200;

/**
 * Rows a trigger's list always has room for (it scrolls past them, idle below fewer)
 *
 * @constant {Number} SELECT_TRIGGER_LIST_ROWS
 */
const SELECT_TRIGGER_LIST_ROWS = 6;

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
    /**
     * Whether choosing the current option emits again (an action menu, e.g. channel presets)
     */
    reselect: {
      type: Boolean,
      default: false,
    },
    /**
     * A trigger's list rows (`uk-list` items, `id` = option index): shown instead of `options`
     */
    items: {
      type: Array,
      default: () => [],
    },
    /**
     * Whether a trigger's list has its search box
     */
    searchable: {
      type: Boolean,
      default: false,
    },
    /**
     * What an empty trigger list says (default: the list's own)
     */
    emptyText: {
      type: String,
      default: '',
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
    /**
     * Height of a trigger's list: its search box, if any, and a fixed number of rows
     */
    listHeight() {
      const rows = `${SELECT_TRIGGER_LIST_ROWS} * var(--row-height)`;
      return this.searchable ? `calc(var(--control-height) + ${rows})` : `calc(${rows})`;
    },
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
      // An action menu only follows the value: choosing is the operator's, never the parent's
      if (this.reselect) this.selected = parseInt(newValue, 10);
      else this.select(parseInt(newValue, 10));
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

      if (!this.disabled && (index !== previous || this.reselect)) {
        this.selected = index;
        /**
         * Selected value changed
         *
         * @property {Number} index index of the selected option within te option list
         */
        this.$emit('update:modelValue', index);
        this.$emit('input', index);
      }
      // Choosing from the list: the select gets the focus back
      if (this.$slots.trigger && this.displayed) this.$refs.select_box?.focus();
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
            if (this.searchable) this.searchBox()?.focus();
            // the list is built on opening and sized by that style: scroll once it applies
            this.$nextTick(this.revealMarked);
          });
        }
      }
    },
    /**
     * Closes the list when the focus leaves it for something else than the select
     *
     * @param {FocusEvent} e focusout event
     */
    onListFocusOut(e) {
      const to = e.relatedTarget;
      const list = this.$refs.options?.$el;
      if (to && (list?.contains(to) || this.$refs.select_box?.contains(to))) return;
      this.displayed = false;
    },
    /**
     * Keys typed in a trigger list's search box (it keeps its keys from bubbling, so they're
     * caught on the way down); the list body's own keys are left to the list
     *
     * @param {KeyboardEvent} e keydown event
     */
    onListKeydown(e) {
      if (e.target === this.searchBox()) this.onKeydown(e);
    },
    /**
     * The search box of a trigger's list
     *
     * @returns {?HTMLInputElement} search input
     */
    searchBox() {
      return this.$refs.list?.$el.querySelector('.uikit_list_searchbox input') || null;
    },
    /**
     * Option indexes shown, in order: every option, or a trigger list's rows left by its search
     *
     * @returns {Array<Number>} option indexes
     */
    shownIndexes() {
      if (this.$refs.list) return this.$refs.list.visibleRows.map((row) => row.value.id);
      return this.options.map((_, index) => index);
    },
    /**
     * Keeps the marked option in view in the open list
     */
    revealMarked() {
      const el = this.$refs.list
        ? this.$refs.list.$el.querySelector(`[data-key="id:${this.marked}"]`)
        : this.optionEls[this.marked];
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
      const shown = this.shownIndexes();
      const count = shown.length;
      const inSearch = !!this.$refs.list && e.target === this.searchBox();
      if (e.key === 'Escape') {
        if (!this.displayed) return;
        e.preventDefault();
        e.stopPropagation();
        if (inSearch) this.$refs.select_box?.focus();
        this.displayed = false;
        return;
      }
      if (!count) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!this.displayed) {
          this.show();
          return;
        }
        const step = e.key === 'ArrowDown' ? 1 : -1;
        let at = shown.indexOf(this.marked);
        if (at < 0) at = step > 0 ? -1 : 0;
        this.mark(shown[(at + step + count) % count]);
      } else if (e.key === 'Enter' || (e.key === ' ' && !inSearch)) {
        e.preventDefault();
        if (this.displayed) this.select(shown.includes(this.marked) ? this.marked : shown[0]);
        else this.show();
      } else if (e.key.length === 1 && !inSearch) {
        if (this.searchable && this.displayed) {
          // typing on the select goes to the search field
          this.searchBox()?.focus();
          return;
        }
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
      const optionListEl = this.$refs.options?.$el;
      if (selectBoxEl && optionListEl) {
        const box = selectBoxEl.getBoundingClientRect();
        // A trigger is narrower than its options: the list fits them, opens upwards from the
        // trigger with its header and search on top, and stays inside the window
        if (this.$slots.trigger) {
          this.optionListStyle = {
            width: 'max-content',
            minWidth: `${Math.max(box.width, SELECT_TRIGGER_LIST_MIN_WIDTH)}px`,
            maxWidth: `${Math.min(SELECT_TRIGGER_LIST_MAX_WIDTH, window.innerWidth - 8)}px`,
            left: `${box.left}px`,
            top: 'auto',
            bottom: `${window.innerHeight - box.top}px`,
            height: 'auto',
          };
          this.$nextTick(() => {
            const width = optionListEl.offsetWidth;
            const left = Math.max(4, Math.min(box.left, window.innerWidth - width - 4));
            this.optionListStyle = { ...this.optionListStyle, left: `${left}px` };
          });
          return;
        }
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
.uikit_select_trigger {
  display: flex;
  cursor: pointer;
}
/* The look of a trigger box (an icon and a text), for callers' trigger slots */
:slotted(.uikit_select_trigger_box) {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  height: var(--control-height);
  padding: 0 var(--space-3);
  box-sizing: border-box;
  background: var(--secondary-darker);
  border: var(--border-width) solid var(--secondary-dark);
  color: var(--secondary-lighter);
  font-family: Roboto-Regular;
  font-size: var(--font-xs);
}
:slotted(.uikit_select_trigger_box:hover) {
  background: var(--secondary-dark);
}
:slotted(.uikit_select_trigger_text) {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
  /* a tint over a solid base: the idle stripes under a short list never show through */
  background:
    linear-gradient(var(--secondary-darker), var(--secondary-darker)),
    var(--primary-dark);
}
/* A trigger's list: header, then a uk-list of fixed height (see listHeight) */
.uikit_select_option_list.with_trigger {
  overflow: hidden;
}
.uikit_select_header {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  gap: var(--space-2);
  min-height: var(--select-option-height);
  padding: 0 var(--space-2);
  background: var(--primary-dark);
  color: var(--secondary-lighter);
  border-bottom: var(--border-width) solid var(--secondary-dark);
  font-family: Roboto-Bold;
  font-size: var(--font-xs);
  white-space: nowrap;
}
.uikit_select_option:hover,
.uikit_select_option.marked {
  background: linear-gradient(var(--secondary-dark), var(--secondary-dark)), var(--primary-dark);
  cursor: pointer;
}
/* The current value, in the list: styled like a selected list row, hovered or marked too */
.uikit_select_option.current,
.uikit_select_option.current:hover,
.uikit_select_option.current.marked {
  color: var(--secondary-lighter);
  background: var(--accent-blue);
}
.selected {
  outline: var(--border-width) solid var(--accent-blue);
  outline-offset: -1px;
}
</style>
