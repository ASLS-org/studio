<template>
  <uk-widget dockable class="modifier_widget_cue_settings" style="min-width: 220px" v-if="cue" :header="header">
    <uk-flex class="modifier_widget_cue_settings_body" :gap="16">
      <uk-flex col style="flex: 1" :gap="8">
        <uk-txt-input label="Name" v-model="cue.name" />
        <uk-select-input @input="setCueColor" label="Color" :value="getIndexFromColor(cue.color)" :options="colorOptions" />
        <uk-select-input v-model="cue.loopStyle" label="Loop Style" :value="0" :options="['One Shot', 'Loop']" />
      </uk-flex>
      <uk-flex style="flex: 1" col :gap="8">
        <uk-select-input v-model="cue.triggerStyle" style="z-index: 100" label="Trigger Style" :value="0" :options="['Toggle', 'Temporary']" />
        <uk-select-input v-model="cue.relative" style="z-index: 100" label="Start" :value="0" :options="['Absolute', 'Relative']" />
        <uk-num-input label="Duration" v-model="cue.duration" />
      </uk-flex>
    </uk-flex>
  </uk-widget>
</template>

<script>
import colorMixin from "@/views/mixins/color.mixin";

export default {
  name: "groupModifierWidgetCueSettings",
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
        title: "Cue Settings",
        icon: "wrench",
      },
      /**
       * Handle to cue instance
       */
      cue: this.value,
    };
  },
  methods: {
    /**
     * Set the cue's color from uk color list
     * 
       * @public
     * @param {Number} index of the color to be picked within the uikit's color list
     * @see colorMixin
     */
    setCueColor(colorIndex) {
      this.cue.color = this.getColorFromIndex(colorIndex);
    },
  },
  watch: {
    value(value) {
      this.cue = value;
    },
  },
};
</script>

<style scoped>

.modifier_widget_cue_settings {
  width: 220px;
}
.modifier_widget_cue_settings_body {
  padding: 10px;
}
</style>
