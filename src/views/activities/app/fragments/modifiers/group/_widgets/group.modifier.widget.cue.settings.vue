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
      <!-- What it is -->
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
          class="cue_settings_family"
          label="Family"
          :title="hints.family"
          :model-value="familyIndex"
          :options="familyLabels"
          @input="setFamily"
        />
        <!-- An effect's timing (a scene's is in its fades) -->
        <uk-select-input
          v-if="isEffect"
          v-model="cue.loopStyle"
          style="z-index: 98"
          label="Loop Style"
          :title="hints.loop"
          :options="['One Shot', 'Loop']"
        />
      </uk-flex>
      <!-- How it plays and shares the stage with other cues -->
      <uk-flex
        style="flex: 1"
        col
        :gap="8"
      >
        <uk-select-input
          v-model="cue.triggerStyle"
          style="z-index: 100"
          label="Trigger Style"
          :title="hints.trigger"
          :options="['Toggle', 'Temporary']"
        />
        <uk-select-input
          v-model="cue.relative"
          class="cue_settings_mode"
          style="z-index: 99"
          label="Mode"
          :title="hints.mode"
          :options="['Replace', 'Layer']"
        />
        <uk-num-input
          v-if="isEffect"
          v-model="cue.duration"
          label="Duration"
          :title="hints.duration"
        />
      </uk-flex>
    </uk-flex>
  </uk-widget>
</template>

<script>
import { CUE_TYPES } from '@/models/DMX/cue.model';
import { FAMILY_OPTIONS } from '@/views/utils/cue.families';

/**
 * What each setting does, shown when the pointer rests on it
 *
 * @constant {Object} HINTS
 */
const HINTS = {
  family: 'What the cue controls, and its column in the cue pool: its editor shows these '
    + 'channels, and those of no family. A group plays one cue per family at a time. Set while '
    + 'the cue sets nothing',
  loop: 'One Shot: plays its Duration once, then stops. Loop: repeats until stopped',
  trigger: 'Toggle: a click starts it, the next stops it. Temporary: plays while held down, '
    + 'over the cues it covers',
  mode: 'Replace: turns off the cue it takes over. Layer: plays over that cue and gives it back '
    + 'when stopped, fading in from it and back into it',
  duration: 'Length of one pass of the effect, in bars',
};

export default {
  name: 'GroupModifierWidgetCueSettings',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    cue: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      /**
       * Hints for the settings
       */
      hints: HINTS,
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
  computed: {
    /**
     * Whether the cue is an effect (a scene has no Loop Style or Duration)
     *
     * @type {Boolean}
     */
    isEffect() {
      return this.cue?.type === CUE_TYPES.EFFECT;
    },
    /**
     * The families the cue can be made for: every family while it sets nothing, else its own (so
     * changing it never drops a channel)
     *
     * @type {Array<Object>}
     */
    familyOptions() {
      const used = this.cue?.usedFamilies || [];
      if (!used.some(Boolean)) return FAMILY_OPTIONS;
      return FAMILY_OPTIONS.filter((option) => option.key === this.cue.family);
    },
    /**
     * Names of the family options
     *
     * @type {Array<String>}
     */
    familyLabels() {
      return this.familyOptions.map((option) => option.label);
    },
    /**
     * Index of the cue's family among the options
     *
     * @type {Number}
     */
    familyIndex() {
      const index = this.familyOptions.findIndex((option) => option.key === this.cue?.family);
      return index > -1 ? index : this.familyOptions.length - 1;
    },
  },
  methods: {
    /**
     * Sets the family the cue is made for
     *
     * @public
     * @param {Number} index option index
     */
    setFamily(index) {
      const option = this.familyOptions[index];
      if (option) this.cue.family = option.key;
    },
  },
};
</script>

<style scoped>

.modifier_widget_cue_settings {
  /* Two columns (what it is, how it plays), an effect's timing at their foot */
  width: 220px;
  min-width: 220px;
  max-width: 220px;
}
.modifier_widget_cue_settings_body {
  padding: var(--space-5);
  height: 100%;
}
</style>
