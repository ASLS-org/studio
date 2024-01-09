<template>
  <uk-popup @submit="addCue()" @input="update()" v-model="state" :header="headerData">
    <uk-flex class="cue_popup" col :gap="8">
      <uk-select-input :options="options" label="Cue type" v-model="cue.type" />
      <uk-select-input label="Color" @input="setCueColor" :options="colorOptions" :modelValue="getIndexFromColor(cue.color)" />
      <uk-txt-input label="Name" v-model="cue.name" />
    </uk-flex>
  </uk-popup>
</template>

<script>
import colorMixin from "@/views/mixins/color.mixin";
import PopupMixin from "@/views/mixins/popup.mixin.js"

export default {
  name: "popupCuePool",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  emits:['add'],
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
    cueId: Number,
  },
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: { title: "Add cue" },
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
      options: ["scene", "effect"],
    };
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
      let cue = this.group.addCue(this.cue);
      this.close();
      this.$emit("add", cue);
    }
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
    //TODO check if this can be removed
    /*group() {
      this.cue = this.group
        ? {
            name: `Cue ${this.cueId}`,
            type: 0,
            id: this.cueId,
            fixtures: this.group.fixturePool.fixtures,
            color: this.group.color,
          }
        : {};
    },*/
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
