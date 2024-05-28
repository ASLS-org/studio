<template>
  <uk-widget :header="header">
    <uk-flex
      :gap="8"
      col
      class="group_settings"
    >
      <uk-txt-input
        v-model="group.name"
        label="Name"
      />
      <uk-select-input
        label="Color"
        :model-value="getIndexFromColor(group.color)"
        :options="colorOptions"
        @input="setGroupColor"
      />
    </uk-flex>
  </uk-widget>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';

export default {
  name: 'GroupModifierWidgetSettings',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [colorMixin],
  props: {
    group: {
      type: Object,
      default: () => ({
        name: 'undefined group',
        color: undefined,
      }),
    },
  },
  data() {
    return {
      /**
       * Widget header description
       * @todo this sould/should be static/hardcoded
       */
      header: {
        title: 'Group Settings',
        icon: 'wrench',
      },
    };
  },
  methods: {
    /**
     * Set the group's color from uikit color list
     *
     * @public
     * @param {Number} index of the color to be picked within the uikit's color list
     * @see colorMixin
     */
    setGroupColor(colorIndex) {
      this.group.color = this.getColorFromIndex(colorIndex);
    },
  },
};
</script>

<style scoped>

.group_settings {
  height: 100%;
  padding: 10px;
}
</style>
