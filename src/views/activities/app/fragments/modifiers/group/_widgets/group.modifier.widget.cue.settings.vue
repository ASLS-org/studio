<template>
  <uk-widget
    v-if="cue"
    dockable
    class="modifier_widget_cue_settings"
    :header="header"
  >
    <uk-flex
      class="modifier_widget_cue_settings_body"
      :gap="16"
    >
      <uk-flex
        col
        style="flex: 1"
        :gap="8"
      >
        <uk-txt-input
          v-model="cue.name"
          label="Name"
        />
        <uk-select-input
          label="Color"
          :model-value="getIndexFromColor(cue.color)"
          :options="colorOptions"
          @input="setCueColor"
        />
        <uk-select-input
          v-model="cue.loopStyle"
          label="Loop Style"
          :options="['One Shot', 'Loop']"
        />
      </uk-flex>
      <uk-flex
        style="flex: 1"
        col
        :gap="8"
      >
        <uk-select-input
          v-model="cue.triggerStyle"
          style="z-index: 100"
          label="Trigger Style"
          :options="['Toggle', 'Temporary']"
        />
        <uk-select-input
          v-model="cue.relative"
          style="z-index: 100"
          label="Start"
          :options="['Absolute', 'Relative']"
        />
        <uk-num-input
          v-model="cue.duration"
          label="Duration"
        />
      </uk-flex>
    </uk-flex>
  </uk-widget>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';

export default {
  name: 'GroupModifierWidgetCueSettings',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [colorMixin],
  props: {
    cue: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      /**
       * Widget header description
       * @todo this sould/should be static/hardcoded
       */
      header: {
        title: 'Cue Settings',
        icon: 'wrench',
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
  },
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
  height: 100%;
}
</style>
