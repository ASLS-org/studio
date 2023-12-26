<template>
  <div :class="{ docked, disabled }" class="widget">
    <div class="header">
      <uk-icon class="header_icon" v-if="header.icon" :name="header.icon" />
      <h3>{{ header.title }}</h3>
      <span style="flex: 1" />
      <uk-button @click="action.callback" v-if="action" v-show="!docked" :label="action.text" :icon="action.icon" />
      <uk-icon v-if="dockable" @click="docked = !disabled && !docked" class="widget_action" name="arrow_down" />
    </div>
    <div v-show="!docked" class="body">
      <slot />
    </div>
  </div>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s;
  max-width: 230px;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
  max-width: 0px;
}
</style>
<script>
/**
 * @component Widget Widgets are used within modifiers in order to offer users with unique
 * ways to interract with a modifier.
 * @namespace uikit/widgets
 * @story Default {"header":{"title":"Default","icon":"grid"}}
 * @story Disabled {"header":{"title":"Default","icon":"grid"}, "disabled":true}
 * @story Dockable {"header":{"title":"Default","icon":"grid"}, "dockable":true}
 */
export default {
  name: "ukWidget",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Header Definition object:
     * {title: "String", icon: "String"}
     */
    header: {
      type: Object,
      default: () => ({
        title: "Unnamed Widget",
      }),
    },
    /**
     * Whether the widget is dockable or not
     */
    dockable: {
      type: Boolean,
      default: false,
    },
    /**
     * An action configuration object:
     * {text: "String", icon: "String", callback: ()=>{console.log("Hello World")}}
     */
    action: Object,
    /**
     * Whether the widget should be docked by default
     */
    defaultDocked: Boolean,
    /**
     * Whether the widget is disabled or not
     */
    disabled: Boolean,
  },
  data() {
    return {
      /**
       * The widget's docking state
       */
      docked: this.defaultDocked,
    };
  },
};
</script>

<style scoped>
.widget {
  display: flex;
  flex-direction: column;
  height: fit-content;
  border-right: 1px solid var(--primary-dark);
  background: var(--primary-light);
  user-select: none;
  overflow: hidden;
  height: 100%;
  min-width: 150px;
  transition: all .15s ease-in;
  white-space: nowrap;
}
.header {
  display: flex;
  flex-direction: row;
  min-height: 30px;
  width: 100%;
  padding: 0 10px;
  align-items: center;
  border-bottom: 1px solid var(--primary-dark);
  user-select: none;
}
.header_icon {
  fill: var(--secondary-lighter) !important;
  margin-right: 8px;
  height: 14px !important;
  width: 14px !important;
}
.widget.docked {
  min-width: 30px !important;
  max-width: 30px !important;
}
.docked .widget_action {
  margin: unset !important;
  transform: rotate(180deg);
}
.widget_action {
  width: 10px !important;
  height: 10px !important;
  fill: var(--secondary-lighter);
  margin-left: 8px;
}
.widget_action:hover {
  cursor: pointer;
}
.body {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.docked .header {
  width: 30px !important;
  height: 100%;
  text-align: left;
  justify-content: center;
  text-orientation: vertical-rl;
  padding-bottom: 10px;
  padding-top: 10px;
  flex-direction: column-reverse;
  background: repeating-linear-gradient(45deg, var(--primary-light), var(--primary-light) 10px, var(--primary-dark) 10px, var(--primary-dark) 20px);
}
.docked .header_icon {
  margin: 0 !important;
  margin-top: 8px !important;
}
.docked h3 {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  transform: scale(-1);
}
.disabled .header_icon,
.disabled .widget_action {
  fill: var(--secondary-light) !important;
  cursor: unset;
}
.disabled h3 {
  color: var(--secondary-light) !important;
}
</style>
