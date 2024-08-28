<template>
  <uk-widget
    dockable
    :header="headerData"
    :disabled="!channels || !channels.length"
    class="channels_widget"
  >
    <div class="channels_list">
      <div
        v-for="(channel, index) in channels"
        v-show="channels && channels.length > 0"
        :key="index"
        class="channels_channel"
      >
        <uk-num-input
          :value="channel.value"
          class="channel_value"
          :min="0"
          :max="255"
          :default="0"
          :disabled="!channel.active"
          @input="update(channel)"
        />
        <uk-icon
          :class="{ disabled: !channel.active }"
          class="channel_icon"
          :name="getIcon(channel)"
        />
        <uk-fader
          v-model.lazy="channel.value"
          :short="toggleable"
          :min="0"
          :max="255"
          :label="`CH${index + 1}`"
          :disabled="!channel.active"
          color="var(--accent-blue)"
          @input="update(channel)"
        />
        <uk-checkbox
          v-if="toggleable"
          v-model.lazy="channel.active"
          class="channel_activity"
          @input="update(channel)"
        />
      </div>
    </div>
  </uk-widget>
</template>

<script>
export default {
  name: 'ModifierWidgetFixtureChannels',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Channels list
     */
    channels: {
      type: Array,
      default: () => [1, 2, 3, 4, 5],
    },
    /**
     * Whether the channels are toggleable or not (checkbox displayed)
     */
    toggleable: Boolean,
  },
  emits: ['input'],
  data() {
    return {
      /**
       * Widget header data
       */
      headerData: {
        title: 'Channels',
        icon: 'mixer',
      },
    };
  },
  methods: {
    /**
     * Update channel data
     *
       * @public
     * @param {Object} channel a channel description object
     */
    update(channel) {
      this.$emit('input', channel);
    },
    /**
     * GetRetrieves icon that is associated to a specific channel type
     *
     * @public
     * @param {Object} channel a channel description object
     * @returns {String} icon name
     */
    getIcon(channel) {
      switch (channel.type) {
        case 'Color':
          return (`${channel.type}intensity${channel.color}`).toLowerCase().replace(' ', '');
        default:
          return channel.type.toLowerCase().replace(' ', '').replace('fine', '');
      }
    },
  },
};
</script>

<style scoped>
.channels_widget {
  display: flex;
  min-width: fit-content !important;
}
.channels_list {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  white-space: nowrap;
  box-sizing: content-box;
  overflow-x: auto;
  background: var(--primary-light);
}
.channels_list_empty {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  color: var(--secondary-light);
  justify-content: center;
}
.channels_channel {
  display: flex;
  max-width: 52px;
  min-width: 52px;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  border-right: 1px solid var(--primary-dark);
  overflow: hidden;
  box-sizing: content-box;
  background: var(--primary-light);
}
.channels_channel:last-child {
  border-right: none;
}
.channel_value {
  width: 100%;
}
.channel_icon {
  margin-top: 8px;
  height: 20px !important;
  width: 20px !important;
  min-height: 14px !important;
  min-width: 14px !important;
  fill: var(--secondary-lighter);
}
.channel_icon.disabled {
  fill: var(--secondary-light) !important;
}
.channel_activity {
  margin-top: 8px;
  margin-bottom: 8px;
}
</style>
