<template>
  <uk-popup
    v-model="state"
    :header="headerData"
    :valid="picked.length > 0"
    @submit="addChannels"
    @input="update()"
  >
    <uk-flex
      col
      class="popup_fx_channels"
    >
      <!-- Every channel the effect's fixtures have; those in use can't be picked again -->
      <uk-list
        class="popup_fx_channels_list"
        :items="items"
        :selection="picked"
        filterable
        @selection="pick"
      />
      <p
        class="popup_fx_channels_hint"
        v-text="hint"
      />
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';
import channelIcon from '@/views/utils/channel.icons';
import { availableChannels } from '@/views/utils/effect.scope';
import { familyIndex } from '@/models/DMX/families';

/**
 * @component PopupFxChannels Adds modulated channels to an effect: lists every channel its
 * fixtures have, with its icon (those already modulated are marked and can't be picked); OK adds
 * the picked ones (Ctrl/⌘ or Shift for several)
 */
export default {
  name: 'PopupFxChannels',
  compatConfig: {
    MODE: 3,
  },
  mixins: [PopupMixin],
  props: {
    /**
     * Effect cue
     */
    effect: {
      type: Object,
      default: null,
    },
  },
  emits: ['added'],
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: { title: 'Add Modulated Channel' },
      /**
       * Picked channel types
       */
      picked: [],
    };
  },
  computed: {
    /**
     * Channel types already modulated
     *
     * @type {Set<String>}
     */
    inUse() {
      return new Set((this.effect?.channels || []).map((channel) => channel.type));
    },
    /**
     * List rows: every channel type the effect's fixtures have, of its family or of none
     *
     * @type {Array<Object>}
     */
    items() {
      const fixtures = this.effect?.fixtures || [];
      const family = familyIndex(this.effect?.family);
      return availableChannels(fixtures, family).map(({ type, channel }) => ({
        id: type,
        name: type,
        icon: channelIcon(channel),
        more: this.inUse.has(type) ? 'in use' : '',
        disabled: this.inUse.has(type),
      }));
    },
    /**
     * What the popup says under the list
     *
     * @type {String}
     */
    hint() {
      if (!(this.effect?.fixtures || []).length) {
        return 'The effect has no fixtures yet: add some to its group';
      }
      if (!this.items.length) return 'The group\'s fixtures have no channels of this family';
      return this.picked.length > 1
        ? `${this.picked.length} channels to add`
        : 'Ctrl/⌘ or Shift + click to add several';
    },
  },
  watch: {
    modelValue(open) {
      if (open) this.picked = [];
    },
  },
  methods: {
    /**
     * Picks rows (those in use are left out)
     *
     * @public
     * @param {Array<Object>} items the selected rows (`id`: channel type)
     */
    pick(items) {
      this.picked = items.map((item) => item.id).filter((id) => !this.inUse.has(id));
    },
    /**
     * Adds the picked channels with default waves, then closes
     *
     * @public
     */
    addChannels() {
      const added = this.picked.filter((type) => !this.inUse.has(type));
      added.forEach((type) => this.effect.addChannel({ type }));
      if (added.length) this.$emit('added', added);
      this.close();
    },
  },
};
</script>

<style scoped>
.popup_fx_channels {
  width: var(--widget-width-md);
}
.popup_fx_channels_list {
  height: calc(8 * var(--row-height));
}
.popup_fx_channels_hint {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  font-family: Roboto-Regular;
  font-size: var(--font-xs);
  color: var(--secondary-light-alt);
}
</style>
