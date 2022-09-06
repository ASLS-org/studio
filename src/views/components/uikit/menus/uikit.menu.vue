<template>
  <div tabindex="0" @focusout="handleFocusOut" class="menus">
    <div class="menu" v-for="(menu, index) in mens" :key="index" @mouseover="handleHover(menu)" @click="select(menu)">
      <div class="header_menu" :class="{ selected: menu.selected }">
        <h3>{{ menu.name }}</h3>
      </div>
      <div class="menu_list" v-show="menu.selected">
        <uk-list tall @select="selectSubItem" @selected="unselectAll()" class="list" no-highlight no-select :items="menu.items" />
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
  ctrl: "ctrlKey",
  shift: "shiftKey",
};

export default {
  name: "ukMenu",
  props: {
    menus: Array,
  },
  data() {
    return {
      /**
       * Current menu disaply state
       */
      displayState: false,
    };
  },
  methods: {
    /**
     * Handles component focus out
     * 
       * @param {Object} e Focus event
     */
    handleFocusOut(e) {
      if (!this.$el.contains(e.relatedTarget) && !this.$el.contains(e.explicitOriginalTarget)) {
        this.unselectAll()
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
        this.mens.forEach((menu) => {
          menu.selected = false;
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
      let state = !menu.selected;
      this.mens.forEach((menu) => {
        menu.selected = false;
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
      let keys = shortcutString.split("+");
      let conditionStr = keys
        .map((key) => {
          key = key.toLowerCase();
          // eslint-disable-next-line no-unused-vars
          let eKey = e.key.toLowerCase();
          return `${SHORTCUT_KEYS_STR[key] ? "e."+SHORTCUT_KEYS_STR[key] : `"${eKey}" === '${key.toLowerCase()}'`}`;
        })
        .join("&&");
      return eval(conditionStr);
    },
  },
  computed: {
    /**
     * Computes menu items to ease listability.
     * 
     * @todo Remove this, it is utterly stupid (well, it sure seems like I am).This could be done on the mounted hook using a simple method.
     * 
     * @property mens
     * @returns {Array} An array of listable menu items
     */
    mens() {
      return this.menus.map((menu) => {
        menu.items = menu.items.map((item) => {
          if (item.shortcut) {
            let shortcuCallback = (e) => {
              if (this.parseAndEvaluateShortcut(e, item.shortcut)) {
                e.preventDefault();
                item.callback();
              }
            };
            window.addEventListener("keydown", shortcuCallback);
            this.$once("hook:destroy", () => {
              window.removeEventListener("keydown", shortcuCallback);
            });
          }
          item.more = item.shortcut ? `(${item.shortcut})` : "";
          return item;
        });
        return menu;
      });
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
  margin-left: 0px;
  z-index: 1;
  box-shadow: 0px 10px 15px 1px var(--primary-dark);
  border: 1px solid var(--primary-dark);
  border-top: none;
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
