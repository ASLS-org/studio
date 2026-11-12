<template>
  <uk-popup
    v-model="state"
    :header="headerData"
    @submit="create()"
    @input="update()"
  >
    <uk-flex
      class="media_popup"
      col
      :gap="8"
    >
      <uk-select-input
        v-model="type"
        label="Type"
        :options="typeOptions"
      />
      <uk-txt-input
        v-model="name"
        label="Name"
      />
      <uk-select-input
        label="Color"
        :options="colorOptions"
        :model-value="getIndexFromColor(color)"
        @input="color = getColorFromIndex($event)"
      />
    </uk-flex>
  </uk-popup>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';
import PopupMixin from '@/views/mixins/popup.mixin';
import ukColors from '@/views/components/uikit/colors/uikit.colors';

/**
 * Media types the patch bay can hold. Only DMX universes for now; other kinds (pyro, media…)
 * come later as new entries
 *
 * @constant {Array<String>} MEDIA_TYPES
 */
const MEDIA_TYPES = ['DMX Universe'];

/**
 * Popup creating a patch bay item: a media type (a DMX universe for now), its name and colour
 *
 * @displayName Media creation popup
 */
export default {
  name: 'UkPopupMedia',
  compatConfig: {
    MODE: 3,
  },
  mixins: [colorMixin, PopupMixin],
  emits: ['create'],
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: { title: 'New Media' },
      /**
       * Selected media type (index in MEDIA_TYPES)
       */
      type: 0,
      /**
       * Name of the item to create
       */
      name: '',
      /**
       * Colour of the item to create
       */
      color: null,
    };
  },
  computed: {
    /**
     * Media type options
     *
     * @type {Array<String>}
     */
    typeOptions() {
      return MEDIA_TYPES;
    },
  },
  watch: {
    state(open) {
      if (open) this.reset();
    },
  },
  mounted() {
    this.reset();
  },
  methods: {
    /**
     * Proposes a name and colour for the next universe
     *
     * @public
     */
    reset() {
      const id = this.$show.universePool.genUniverseId();
      const colors = Object.values(ukColors);
      this.type = 0;
      this.name = `Universe ${id}`;
      this.color = colors[id % colors.length];
    },
    /**
     * Creates the item (a DMX universe, the next free id) and closes the popup
     *
     * @public
     */
    create() {
      const universe = this.$show.universePool.addRaw({
        id: this.$show.universePool.genUniverseId(),
        name: this.name,
        color: this.color,
      });
      this.$show.refreshSaveState();
      this.$emit('create', universe);
      this.close();
    },
  },
};
</script>

<style scoped>
.media_popup {
  min-width: 300px;
  padding: 16px;
}
</style>
