<template>
  <component
    :is="svgData"
    class="icon"
  />
</template>

<script>
import { defineAsyncComponent } from 'vue';

const iconMap = new Map();
/**
 * Icons already loaded: their SVG component, used directly (no async wrapper, half the component
 * instances on screens with many icons)
 */
const loadedIcons = new Map();

/**
 * @component Icon Display css-customisable SVG icons from a list of pre-defined icons.
 * @namespace uikit/icons
 * @story Default {"name":"new"}
 */
export default {
  name: 'UkIcon',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Name of the icon as declared within the image folder.
     * @see /images
     */
    name: {
      type: String,
      default: null,
    },
  },
  computed: {
    /**
     * Dynamically requires SVG asset from local "./images" list.
     *
     * @property svgData
     */
    svgData() {
      const { name } = this;
      if (loadedIcons.has(name)) return loadedIcons.get(name);
      if (!iconMap.has(name)) {
        iconMap.set(name, defineAsyncComponent(async () => {
          let icon;
          try {
            icon = await import(`./images/${name}.svg?component`);
          } catch (err) {
            // eslint-disable-next-line import/no-unresolved
            icon = await import('./images/close.svg?component');
          }
          loadedIcons.set(name, icon.default || icon);
          return icon;
        }));
      }
      return iconMap.get(name);
    },
  },
};
</script>

<style scoped>

.icon {
  width: var(--icon-md);
  height: var(--icon-md);
}
</style>
