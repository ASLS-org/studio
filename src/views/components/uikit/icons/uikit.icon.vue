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
      if (!iconMap.has(this.name)) {
        iconMap.set(this.name, defineAsyncComponent(async () => {
          try {
            return await import(`./images/${this.name}.svg?component`);
          } catch (err) {
            // eslint-disable-next-line no-return-await, import/no-unresolved
            return await import('./images/close.svg?component');
          }
        }));
      }
      return iconMap.get(this.name);
    },
  },
};
</script>

<style scoped>

.icon {
  width: 16px;
  height: 16px;
}
</style>
