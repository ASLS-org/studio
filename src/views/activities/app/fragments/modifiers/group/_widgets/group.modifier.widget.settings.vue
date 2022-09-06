<template>
  <uk-widget :header="header">
    <uk-flex :gap="8" col class="group_settings">
      <uk-txt-input label="Name" v-model="group.name" />
      <uk-select-input @input="setGroupColor" label="Color" :value="getIndexFromColor(group.color)" :options="colorOptions" />
    </uk-flex>
  </uk-widget>
</template>

<script>
import colorMixin from "@/views/mixins/color.mixin";

export default {
  name: "groupModifierWidgetSettings",
  mixins: [colorMixin],
  props: {
    value: Object,
  },
  data() {
    return {
      /**
       * Widget header description
       * @todo this sould/should be static/hardcoded
       */
      header: {
        title: "Group Settings",
        icon: "wrench",
      },
      /**
       * Handle to group instance
       */
      group: this.value,
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
  watch: {
    value(value) {
      this.group = value;
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
