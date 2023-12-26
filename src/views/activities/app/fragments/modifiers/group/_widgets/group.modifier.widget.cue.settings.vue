<template>
  <uk-widget dockable class="modifier_widget_cue_settings" v-if="cue" :header="header">
    <uk-flex class="modifier_widget_cue_settings_body" :gap="16">
      <uk-flex col style="flex: 1" :gap="8">
        <uk-txt-input label="Name" v-model="cue.name" />
        <uk-select-input @input="setCueColor" label="Color" :modelValue="getIndexFromColor(cue.color)" :options="colorOptions" />
        <uk-select-input v-model="cue.loopStyle" label="Loop Style" :modelValue="0" :options="['One Shot', 'Loop']" />
      </uk-flex>
      <uk-flex style="flex: 1" col :gap="8">
        <uk-select-input v-model="cue.triggerStyle" style="z-index: 100" label="Trigger Style" :modelValue="0" :options="['Toggle', 'Temporary']" />
        <uk-select-input v-model="cue.relative" style="z-index: 100" label="Start" :modelValue="0" :options="['Absolute', 'Relative']" />
        <uk-num-input label="Duration" v-model="cue.duration" />
      </uk-flex>
    </uk-flex>
  </uk-widget>
</template>

<script>
import colorMixin from "@/views/mixins/color.mixin";

export default {
  name: "groupModifierWidgetCueSettings",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [colorMixin],
  props: {
    cue: {
      type: Object,
      default: ()=>({

      })
    },
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
  }
};
</script>

<style scoped>

.modifier_widget_cue_settings {
  width: 220px;
  min-width: 220px;
  max-width: 220px;
}
.modifier_widget_cue_settings_body {
  padding: 10px;
}
</style>
