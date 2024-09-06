<template>
  <div
    tabindex="0"
    class="menus"
    @focusout="handleFocusOut"
  >
    <div
      v-for="(menu, index) in mens"
      :key="index"
      class="menu"
      @mouseover="handleHover(menu)"
      @click="select(menu)"
    >
      <div
        class="header_menu"
        :class="{ selected: menu.selected }"
      >
        <h3>{{ menu.name }}</h3>
      </div>
      <div
        v-show="menu.selected"
        class="menu_list"
      >
        <uk-list
          tall
          class="list"
          no-highlight
          no-select
          :items="menu.items"
          @select="selectSubItem"
          @selected="unselectAll()"
        />
      </div>
    </div>
  </div>
</template>

<script>

/**
 * Shortcut string special values
 *
 * @constant {Object} SHORTCUT_KEYS_STR
 */
const SHORTCUT_KEYS_STR = {
  ctrl: 'ctrlKey',
  shift: 'shiftKey',
};

export default {
  name: 'UkMenu',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    menus: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      /**
       * Current menu disaply state
       */
      displayState: false,
    };
  },
  computed: {
    /**
     * Computes menu items to ease listability.
     *
     * @todo Remove this, it is utterly stupid (well, it sure seems like I am).
     * This could be done on the mounted hook using a simple method.
     *
     * @property mens
     * @returns {Array} An array of listable menu items
     */
    mens() {
      return this.menus.map((menu) => {
        menu.items = menu.items.map((item) => {
          if (item.shortcut) {
            const shortcuCallback = (e) => {
              if (this.parseAndEvaluateShortcut(e, item.shortcut)) {
                e.preventDefault();
                item.callback();
              }
            };
            window.addEventListener('keydown', shortcuCallback);
          }
          item.more = item.shortcut ? `(${item.shortcut})` : '';
          return item;
        });
        return menu;
      });
    },
  },
  beforeUnmount() {
    // window.removeEventListener("keydown", shortcuCallback);
  },
  methods: {
    /**
     * Handles component focus out
     *
       * @param {Object} e Focus event
     */
    handleFocusOut(e) {
      if (!this.$el.contains(e.relatedTarget) && !this.$el.contains(e.explicitOriginalTarget)) {
        this.unselectAll();
        this.displayState = false;
      }
    },
    /**
     * Handles menu hovering.
     *
       * @param {Object} menu Handle to the menu item being hovered
     */
    handleHover(menu) {
      if (this.displayState) {
        this.mens.forEach((item) => {
          item.selected = false;
        });
        menu.selected = true;
      }
    },
    /**
     * Unselects all menu items.
     *
       */
    unselectAll() {
      this.mens.forEach((menu) => {
        menu.selected = false;
      });
    },
    /**
     * Selects a single menu item. Unselects every other
     *
       * @param {Object} menu Handle to the menu to be selected
     */
    select(menu) {
      this.displayState = !this.displayState;
      const state = !menu.selected;
      this.mens.forEach((item) => {
        item.selected = false;
      });
      menu.selected = state;
    },
    /**
     * Executes menu sub item callback.
     *
       * @param {Object} subItem Handle to the menu's subitem to be selected
     */
    selectSubItem(subItem) {
      subItem.callback();
    },
    /**
     * Parses and evaluates shortcut strings.
     * Shortcut strings should be described as follows:
     * "SHORTCUT_KEYS_STR+keyValue+..." eg: Ctrl+S, Ctrl+Shift+S
     *
       * @param {Object} e Keydown Event
     * @param {String} shortcutString The shortcut string to be parsed and evaluated
     */
    parseAndEvaluateShortcut(e, shortcutString) {
      const keys = shortcutString.split('+');
      const conditionStr = keys
        .map((key) => {
          key = key.toLowerCase();
          // eslint-disable-next-line no-unused-vars
          const eKey = e.key.toLowerCase();
          return `${SHORTCUT_KEYS_STR[key] ? `e.${SHORTCUT_KEYS_STR[key]}` : `"${eKey}" === '${key.toLowerCase()}'`}`;
        })
        .join('&&');
      // eslint-disable-next-line no-eval
      return eval(conditionStr);
    },
  },
};
</script>

<style scoped>

.menus {
  display: flex;
  height: 100%;
}
.header_menu {
  height: 100%;
  width: 100%;
  z-index: 10;
  justify-content: center;
  align-items: center;
  display: flex;
  padding: 0 16px;
  background: var(--primary-light);
}
.menu {
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  border-right: 1px solid var(--primary-dark);
  z-index: 10;
  justify-content: left;
  align-items: center;
}
.header_menu:hover {
  cursor: pointer;
  background: var(--secondary-darker);
}
.menu_list {
  position: absolute;
  top: 40px;
  margin-left: -1px;
  z-index: 1;
  /* box-shadow: 0px 10px 15px 1px var(--primary-dark); */
  box-shadow: -2px 10px 15px 0px rgba(0,0,0,.6);
  border: 1px solid var(--primary-dark);
  border-top: none;
  border-bottom: none;
  overflow: hidden;
}
.list {
  background: #22251f;
  z-index: -1;
  min-width: 250px;
}
.selected {
  background: var(--secondary-darker);
}
</style>
