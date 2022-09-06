<template>
  <uk-widget class="modifier_widget_effect_channels" :header="header" :action="{ icon: 'new', text: 'add', callback: displayPopup }" dockable>
    <uk-list
      auto-select-first
      class="modifier_widget_effect_channels_body"
      filterable
      deletable
      :key="effect.id"
      :items="effect.listableChannels"
      @select="selectChannel"
      @delete="deleteChannel"
    />
    <popup-fx-preset v-model="fxPopupDisplayState" :effect="effect" />
  </uk-widget>
</template>

<script>
import PopupFxPreset from "../_popups/group.effect.modifier.popup.channels.vue";

const POPUP_DISPLAY_STATES = {
  HIDDEN: false,
  ACTIVE: true,
};

export default {
  name: "groupEffectModifierWidgetChannels",
  components: {
    PopupFxPreset,
  },
  props: {
    value: Object,
  },
  data() {
    return {
      /**
       * Widget header data
       */
      header: {
        title: "Modulated Channels",
        icon: "mixer",
      },
      /**
       * Handle to effect instance
       */
      effect: this.value,
      /**
       * Effect preset popup display state
       */
      fxPopupDisplayState: POPUP_DISPLAY_STATES.HIDDEN,
    };
  },
  methods: {
    /**
     * Display effect channel preset popup
     * 
       * @public
     */
    displayPopup() {
      this.fxPopupDisplayState = POPUP_DISPLAY_STATES.ACTIVE;
    },
    /**
     * Select an affect's channel
     * 
       * @public
     * @param {Object} channelData channel configuration object
     */
    selectChannel(channelData) {
      let channel = this.effect.getChannelFromType(channelData.type);
      this.$emit("select", channel);
    },
    /**
     * Deletes a channel from the effect's modulated channel pool
     * 
       * @public
     * @param {ObjArrayect} channels Array of channel configuration objects
     */
    deleteChannel(channels) {
      channels.forEach((channel) => {
        this.effect.deleteChannel(channel);
      });
      this.$emit("delete", channels);
    },
  },
  watch: {
    value() {
      this.effect = this.value;
    },
  },
};
</script>

<style scoped>

.modifier_widget_effect_channels {
  min-width: 300px;
}
.modifier_widget_effect_channels_body {
  width: 100%;
  height: 100%;
}
</style>
