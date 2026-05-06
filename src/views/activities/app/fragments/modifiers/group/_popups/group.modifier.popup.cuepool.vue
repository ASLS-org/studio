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
      :gap="8"
    >
      <uk-select-input
        v-model="cue.type"
        :options="options"
        label="Cue type"
      />
      <uk-select-input
        label="Color"
        :options="colorOptions"
        :model-value="getIndexFromColor(cue.color)"
        @input="setCueColor"
      />
      <uk-txt-input
        v-model="cue.name"
        label="Name"
      />
    </uk-flex>
  </uk-popup>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';
import PopupMixin from '@/views/mixins/popup.mixin';

export default {
  name: 'PopupCuePool',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [colorMixin, PopupMixin],
  props: {
    /**
     * Handle to group instance
     */
    group: {
      type: Object,
      default: () => ({}),
    },
    /**
     * Id of the cue to be created
     */
    cueId: {
      type: Number,
      default: null,
    },
  },
  emits: ['add'],
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: { title: 'Add cue' },
      /**
       * Cue definition object
       */
      cue: {
        name: `Cue ${this.cueId}`,
        type: 0,
        id: this.cueId,
        fixtures: this.group.fixturePool.fixtures,
        color: this.group.color,
      },
      /**
       * Cue option list
       * @todo make this static/hardcoded
       */
      options: ['scene', 'effect'],
    };
  },
  watch: {
    cueId() {
      this.cue = {
        name: `Cue ${this.cueId}`,
        type: 0,
        id: this.cueId,
        fixtures: this.group.fixturePool.fixtures,
        color: this.group.color,
      };
    },
  },
  methods: {
    /**
     * Attribute a uikit color to the cue
     *
       * @public
     * @param {Number} colorIndex index of the color within the uikit's color list
     */
    setCueColor(colorIndex) {
      this.cue.color = this.getColorFromIndex(colorIndex);
    },
    /**
     * Create and add the cue to the group
     *
       * @public
     */
    addCue() {
      const cue = this.group.addCue(this.cue);
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
  padding: 10px;
  min-width: 220px;
}
</style>
