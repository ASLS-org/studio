<template>
  <uk-popup
    v-model="state"
    :header="headerData"
    @submit="addCue()"
    @input="update()"
  >
    <uk-flex
      class="cue_popup"
      col
      :gap="12"
    >
      <!-- The column it is added to sets its family: a scene sets values, an effect moves them -->
      <uk-choice
        class="cue_popup_type"
        label="Type"
        :model-value="cue.type"
        :options="typeOptions"
        @update:model-value="setType"
      />
      <uk-txt-input
        v-model="cue.name"
        label="Name"
        @update:model-value="nameEdited = true"
      />
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';
import { CUE_TYPES } from '@/models/DMX/cue.model';
import { FAMILY_KEYS } from '@/models/DMX/families';
import { FAMILY_LOOKS } from '@/views/utils/cue.families';

/**
 * Type options of the popup, with what each does
 *
 * @constant {Array<Object>} TYPE_OPTIONS
 */
const TYPE_OPTIONS = [
  {
    key: CUE_TYPES.SCENE,
    label: 'Scene',
    icon: 'mixer',
    title: 'Channel values, reached with a fade. Replaces the cue holding its column',
  },
  {
    key: CUE_TYPES.EFFECT,
    label: 'Effect',
    icon: 'waveform',
    title: 'Waves moving channels, in bars. Plays over what holds its column, and gives it back',
  },
];

/**
 * @component PopupCuePool Adds a cue to a cue pool column: its type (a scene or an effect) and
 * its name (a cue is shown by its content, not a colour: it keeps the group's in its data). Its
 * family is the column's, and its Mode follows its type: a scene replaces what holds its column,
 * an effect layers over it
 */
export default {
  name: 'PopupCuePool',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [PopupMixin],
  props: {
    /**
     * Handle to group instance
     */
    group: {
      type: Object,
      default: () => ({}),
    },
    /**
     * Family of the column the cue is added to (a family key)
     */
    family: {
      type: String,
      default: FAMILY_KEYS[0],
    },
  },
  emits: ['add'],
  data() {
    return {
      /**
       * Cue definition object
       */
      cue: this.newCue(),
      /**
       * Whether the name was typed (it then no longer follows the column)
       */
      nameEdited: false,
      /**
       * Type options
       */
      typeOptions: TYPE_OPTIONS,
    };
  },
  computed: {
    /**
     * Popup header data: the column the cue goes to
     *
     * @type {Object}
     */
    headerData() {
      return { title: `Add ${this.columnName} cue` };
    },
    /**
     * Name of the column's family ("Colour")
     *
     * @type {String}
     */
    columnName() {
      return (FAMILY_LOOKS[this.family] || FAMILY_LOOKS[FAMILY_KEYS[0]]).label;
    },
  },
  watch: {
    modelValue(open) {
      // Each opening starts afresh, for the column it was opened from
      if (open) {
        this.cue = this.newCue();
        this.nameEdited = false;
      }
    },
  },
  methods: {
    /**
     * A new cue definition for the column: a scene, named after the column
     *
     * @public
     * @returns {Object}
     */
    newCue() {
      return {
        name: this.defaultName(),
        type: CUE_TYPES.SCENE,
        family: this.family,
        relative: 0,
        fixtures: this.group.fixturePool ? this.group.fixturePool.fixtures : [],
        color: this.group.color,
      };
    },
    /**
     * The default name: the column's name and its count plus one ("Colour 3")
     *
     * @public
     * @returns {String}
     */
    defaultName() {
      const cues = this.group.cuePool ? this.group.cuePool.cues : [];
      const count = cues.filter((cue) => cue.family === this.family).length;
      return `${this.columnName} ${count + 1}`;
    },
    /**
     * Picks the cue's type (a new cue is Replace whatever its type)
     *
     * @public
     * @param {Number} type CUE_TYPES value
     */
    setType(type) {
      this.cue.type = type;
    },
    /**
     * Create and add the cue to the group, at the end of its column
     *
     * @public
     */
    addCue() {
      const cue = this.group.addCue({ ...this.cue });
      this.close();
      this.$emit('add', cue);
    },
  },
};
</script>

<style scoped>
.cue_popup {
  height: 100%;
  width: 100%;
  padding: var(--space-5);
  min-width: var(--widget-width-md);
}
</style>
