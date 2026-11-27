<template>
  <uk-widget
    dockable
    :header="headerData"
    :actions="headerActions"
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
          :locked="isParked(index)"
          @input="update(channel)"
        />
        <!-- The channel's function and range: opens its full name and ranges -->
        <uk-select-input
          class="channel_select"
          reselect
          searchable
          :title="menuTitle(channel, index)"
          :items="menuItems(channel, index)"
          :model-value="menuIndex(channel, index)"
          :empty-text="channel.capabilities ? '' : 'Ranges differ between fixtures'"
          @input="applyPreset(channel, $event, index)"
        >
          <template #trigger>
            <!-- The box holding the channel's menu shows what drives it (rest: none) -->
            <div
              class="uikit_select_trigger_box channel_select_box"
              :class="{ inactive: !channel.active, held: !!sourceOf(index)?.color }"
              :style="sourceOf(index)?.color ? { '--held-color': sourceOf(index).color } : null"
            >
              <uk-icon
                class="channel_icon"
                :name="getIcon(channel)"
              />
              <span class="uikit_select_trigger_text channel_select_text">
                {{ channelText(channel) }}
              </span>
            </div>
          </template>
          <template #header>
            <uk-icon
              class="channel_icon"
              :name="getIcon(channel)"
            />
            <span>{{ channel.name || channel.type }}</span>
          </template>
        </uk-select-input>
        <uk-fader
          v-model.lazy="channel.value"
          :min="0"
          :max="255"
          :label="`CH${index + 1}`"
          :disabled="!channel.active"
          :locked="isParked(index)"
          :color="sourceOf(index)?.color || 'var(--accent-blue)'"
          :title="sourceOf(index)?.text"
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
    /**
     * The universe view's live mode: what drives each channel (views/utils/channel.source.js),
     * one per channel, colouring its fader and value; its menu then offers Park / Unpark
     */
    sources: {
      type: Array,
      default: null,
    },
    /**
     * Live mode: what the selected fixtures hold, `{ programmer, parked }` (enables the buttons)
     */
    held: {
      type: Object,
      default: () => ({ programmer: false, parked: false }),
    },
  },
  emits: ['input', 'park', 'clear-channel', 'clear', 'unpark'],
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
  computed: {
    /**
     * Live mode's header actions for the selected fixtures: Clear programmer, Unpark
     */
    headerActions() {
      if (!this.sources) return [];
      return [
        {
          text: 'clear programmer',
          icon: 'close',
          title: "The selected fixtures' hand-set values go back to playback",
          disabled: !this.held.programmer,
          callback: () => this.$emit('clear'),
        },
        {
          text: 'unpark',
          icon: 'key',
          title: "Frees the selected fixtures' parked channels",
          disabled: !this.held.parked,
          callback: () => this.$emit('unpark'),
        },
      ];
    },
  },
  methods: {
    presetItems,
    rangeIndex,
    /**
     * What drives a channel, in live mode
     *
     * @public
     * @param {Number} index
     * @returns {?Object} `{ kind, text, color }`
     */
    sourceOf(index) {
      return this.sources ? this.sources[index] || null : null;
    },
    /**
     * Whether a channel is parked (its fader and value locked), in live mode
     *
     * @public
     * @param {Number} index
     * @returns {Boolean}
     */
    isParked(index) {
      return this.sourceOf(index)?.kind === 'parked';
    },
    /**
     * The actions heading a channel's menu in live mode: Park / Unpark, then Clear when the
     * programmer holds the channel
     *
     * @public
     * @param {Object} channel a channel description object
     * @param {Number} index
     * @returns {Array<Object>} `{ live, name, icon, more }` (`live`: 'park' or 'clear')
     */
    menuActions(channel, index) {
      if (!this.sources) return [];
      const parked = this.isParked(index);
      const actions = [parked
        ? { live: 'park', name: 'Unpark', icon: 'key' }
        : {
          live: 'park', name: `Park at ${Math.round(channel.value)}`, icon: 'key', more: 'locks it',
        }];
      if (this.sourceOf(index)?.kind === 'programmer') {
        actions.push({
          live: 'clear', name: 'Clear', icon: 'close', more: 'back to playback',
        });
      }
      return actions;
    },
    /**
     * A channel's menu: the live actions first, then its ranges
     *
     * @public
     * @param {Object} channel a channel description object
     * @param {Number} index
     * @returns {Array<Object>} uk-list items (`id` = option index)
     */
    menuItems(channel, index) {
      const ranges = presetItems(channel.capabilities);
      const actions = this.menuActions(channel, index);
      if (!actions.length) return ranges;
      return [
        ...actions.map((item, i) => ({ ...item, id: i })),
        ...ranges.map((item) => ({ ...item, id: item.id + actions.length })),
      ];
    },
    /**
     * The menu row matching the channel's value (after the live actions)
     *
     * @public
     * @param {Object} channel a channel description object
     * @param {Number} index
     * @returns {Number}
     */
    menuIndex(channel, index) {
      const range = rangeIndex(channel.capabilities, channel.value);
      return range < 0 ? range : range + this.menuActions(channel, index).length;
    },
    /**
     * Tooltip of a channel's menu box: its name and range, and what holds it by hand
     *
     * @public
     * @param {Object} channel a channel description object
     * @param {Number} index
     * @returns {String}
     */
    menuTitle(channel, index) {
      const source = this.sourceOf(index);
      const title = this.channelTitle(channel);
      return source ? `${title} · ${source.text}` : title;
    },
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
     * @param {Number} option the menu row picked: the live actions first (Park / Unpark, Clear),
     * then the channel's ranges in order
     * @param {Number} column the channel's place in the widget
     */
    applyPreset(channel, option, column) {
      const actions = this.menuActions(channel, column);
      if (option < actions.length) {
        // Park sets the value its item reads on every selected fixture, as any edit does
        if (actions[option].live === 'park') this.$emit('park', channel, Math.round(channel.value));
        else this.$emit('clear-channel', channel);
        return;
      }
      const index = option - actions.length;
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
.channel_select_box.held {
  border-color: var(--held-color);
  background: color-mix(in srgb, var(--held-color) 25%, transparent);
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
.channel_activity {
  margin-top: var(--space-4);
  margin-bottom: var(--space-4);
}
</style>
