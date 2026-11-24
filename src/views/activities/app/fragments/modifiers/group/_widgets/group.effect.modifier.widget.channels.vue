<template>
  <uk-widget
    class="modifier_widget_effect_channels"
    :header="header"
    :action="{ icon: 'new', text: 'add', callback: displayPopup }"
    dockable
  >
    <uk-list
      :key="id"
      auto-select-first
      class="modifier_widget_effect_channels_body"
      filterable
      deletable
      :items="channels"
      :selection="selected ? [selected] : []"
      @select="selectChannel"
      @delete="deleteChannel"
    />
    <popup-fx-channels
      v-model="fxPopupDisplayState"
      :effect="effect"
      @added="(types) => selectChannel({ type: types[0] })"
    />
  </uk-widget>
</template>

<script>
import modal from '@/views/mixins/modal.mixin';
import PopupFxChannels from '../_popups/group.effect.modifier.popup.channels.vue';

const POPUP_DISPLAY_STATES = {
  HIDDEN: false,
  ACTIVE: true,
};

export default {
  name: 'GroupEffectModifierWidgetChannels',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    PopupFxChannels,
  },
  props: {
    effect: {
      type: Object,
      default: () => ({
        id: 0,
        listableChannels: [],
      }),
    },
    /**
     * Type of the selected channel (the panel's), null for none
     */
    selected: {
      type: String,
      default: null,
    },
  },
  emits: ['select', 'delete'],
  data() {
    return {
      /**
       * Widget header data
       */
      header: {
        title: 'Modulated Channels',
        icon: 'mixer',
      },
      id: this.effect.id || -1,
    };
  },
  computed: {
    /**
     * Add Modulated Channel popup display state
     */
    fxPopupDisplayState: modal('effect.channels', 'group'),
    /**
     * The effect's channels, read live: a channel added elsewhere (a scope preset) shows at once
     *
     * @type {Array<Object>}
     */
    channels() {
      // Keyed by type: the selection names the channel
      return (this.effect.listableChannels || []).map((item) => ({ ...item, id: item.type }));
    },
  },
  watch: {
    effect: {
      handler(effect) {
        this.updateEffect(effect);
      },
    },
  },
  methods: {
    updateEffect(effect) {
      this.id = effect.id;
    },
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
      const channel = this.effect.getChannelFromType(channelData.type);
      this.$emit('select', channel);
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
      this.$emit('delete', channels);
    },
  },
};
</script>

<style scoped>

.modifier_widget_effect_channels {
  min-width: var(--widget-width-md);
}
.modifier_widget_effect_channels_body {
  width: 100%;
  height: 100%;
}
</style>
