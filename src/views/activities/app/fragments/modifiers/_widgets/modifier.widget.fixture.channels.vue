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
          v-model.lazy="channel.value"
          class="channel_value"
          :min="0"
          :max="255"
          :default="0"
          :disabled="!channel.active"
          @input="update(channel)"
        />
        <!-- The channel's function and range: opens its full name and ranges -->
        <uk-select-input
          class="channel_select"
          reselect
          searchable
          :title="channelTitle(channel)"
          :items="presetItems(channel.capabilities)"
          :model-value="rangeIndex(channel.capabilities, channel.value)"
          :empty-text="channel.capabilities ? '' : 'Ranges differ between fixtures'"
          @input="applyPreset(channel, $event)"
        >
          <template #trigger>
            <div
              class="channel_select_box"
              :class="{ inactive: !channel.active }"
            >
              <uk-icon
                class="channel_icon"
                :name="getIcon(channel)"
              />
              <span class="channel_select_text">{{ channelText(channel) }}</span>
            </div>
          </template>
          <template #header>
            <uk-icon
              class="channel_icon"
              :name="getIcon(channel)"
            />
            <span class="channel_header_name">{{ channel.name || channel.type }}</span>
          </template>
        </uk-select-input>
        <uk-fader
          v-model.lazy="channel.value"
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
import channelIcon from '@/views/utils/channel.icons';
import { presetItems, rangeIndex, rangeLabel } from '@/views/utils/channel.presets';

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
      default: () => [],
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
    presetItems,
    rangeIndex,
    /**
     * Text of a channel's select: its current range when it has several, else its name
     *
     * @public
     * @param {Object} channel a channel description object
     * @returns {String} text
     */
    channelText(channel) {
      const name = channel.name || channel.type;
      if (!channel.capabilities || channel.capabilities.length < 2) return name;
      return rangeLabel(channel.capabilities, channel.value) || name;
    },
    /**
     * Tooltip of a channel's select: its full name and current range
     *
     * @public
     * @param {Object} channel a channel description object
     * @returns {String} text
     */
    channelTitle(channel) {
      const name = channel.name || channel.type;
      const label = rangeLabel(channel.capabilities, channel.value);
      return label && label !== name ? `${name}: ${label}` : name;
    },
    /**
     * Sets a channel to the first value of one of its ranges, as the fader would. In a scene it
     * also makes the channel active: a preset is a deliberate choice of value.
     *
     * @public
     * @param {Object} channel a channel description object
     * @param {Number} index index of the range in the channel's capabilities
     */
    applyPreset(channel, index) {
      const capability = channel.capabilities && channel.capabilities[index];
      if (!capability) return;
      [channel.value] = capability.range;
      if (this.toggleable) channel.active = true;
      this.update(channel);
    },
    /**
     * Update channel data
     *
       * @public
     * @param {Object} channel a channel description object
     */
    update(channel) {
      this.$nextTick(() => this.$emit('input', channel));
    },
    /**
     * Icon of a channel's function (see views/utils/channel.icons.js)
     *
     * @public
     * @param {Object} channel a channel description object
     * @returns {String} icon name
     */
    getIcon(channel) {
      return channelIcon(channel);
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
  max-width: var(--channel-column-width);
  min-width: var(--channel-column-width);
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  border-right: var(--border-width) solid var(--primary-dark);
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
.channel_select {
  width: 100%;
}
.channel_select_box {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  height: var(--control-height);
  padding: 0 var(--space-3);
  box-sizing: border-box;
  background: var(--secondary-darker);
  border: var(--border-width) solid var(--secondary-dark);
  color: var(--secondary-lighter);
  font-family: Roboto-Regular;
  font-size: var(--font-xs);
}
.channel_select_box:hover {
  background: var(--secondary-dark);
}
.channel_select_box.inactive {
  color: var(--secondary-light);
}
.channel_icon {
  flex-shrink: 0;
  width: var(--icon-sm) !important;
  height: var(--icon-sm) !important;
  min-width: var(--icon-sm);
  min-height: var(--icon-sm);
  fill: var(--secondary-lighter);
}
.channel_select_box.inactive .channel_icon {
  fill: var(--secondary-light);
}
.channel_select_text {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.channel_header_name {
  font-family: Roboto-Bold;
  font-size: var(--font-xs);
}
.channel_activity {
  margin-top: var(--space-4);
  margin-bottom: var(--space-4);
}
</style>
