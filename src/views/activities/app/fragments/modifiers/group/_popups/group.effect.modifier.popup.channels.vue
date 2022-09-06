<template>
  <uk-popup @submit="setupPreset" @input="update()" v-model="state" :header="headerData">
    <uk-flex class="popup_fx_preset">
      <uk-list @select="selectPreset" class="preset_list" :items="effect.listablePresets" filterable selectable />
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from "@/views/mixins/popup.mixin.js"

export default {
  name: "popupFxPreset",
  mixins: [PopupMixin],
  props: {
    effect: Object,
  },
  data() {
    return {
      /**
       * Popup header dtata
       */
      headerData: { title: "Add Modulated Channel" },
      /** 
       * Handle to seected preset 
       */
      selectedPreset: null,
    };
  },
  methods: {
    /**
     * Select preset instance
     * 
       * @public
     * @param {Object} preset preset definition object
     */
    selectPreset(preset) {
      this.selectedPreset = preset;
    },
    /**
     * Setup preset into the effect
     * 
       * @public
     */
    setupPreset(){
      if (this.selectedPreset) {
        this.effect.setupPreset(this.selectedPreset.pool, this.selectedPreset.id);
        this.close();
      }
    }
  }
};
</script>

<style scoped>
.preset_list {
  width: 300px;
  max-height: 250px;
  min-height: 250px;
  border-right: 1px solid var(--primary-dark);
}
.function_button {
  margin-top: 8px;
  margin-left: 8px;
}
</style>
