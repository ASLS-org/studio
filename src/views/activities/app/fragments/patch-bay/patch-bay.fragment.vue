<template>
  <div class="patch_bay">
    <div class="patch_bay_header">
      <h3>Patch Bay</h3>
      <span style="flex: 1" />
      <uk-button
        icon="new"
        style="margin-right: 8px"
        label="new"
        @click="mediaPopupState = true"
      />
    </div>
    <uk-list
      deletable
      colored
      auto-select-first
      class="patch_bay_universe_list"
      filterable
      :items="pool.listable"
      :selection="selection"
      accordion
      @unfold="displayUniverse"
      @selection="displayFixtures"
      @delete="deleteFixtures"
    />
    <media-popup
      v-model="mediaPopupState"
      @create="displayUniverse"
    />
  </div>
</template>

<script>
import modal from '@/views/mixins/modal.mixin';
import MediaPopup from './_popups/popup.media.vue';

export default {
  name: 'PatchBayFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    MediaPopup,
  },
  data() {
    return {
      pool: this.$show.universePool,
    };
  },
  computed: {
    /**
     * New media popup display state
     */
    mediaPopupState: modal('media.new', 'app'),
    /**
     * Fixtures selected in the universe in view (none while another panel is in view)
     *
     * @type {Array<Number>}
     */
    selection() {
      return this.$view.panel === 'universe' ? this.$view.fixtureIds : [];
    },
  },
  methods: {
    /**
     * Shows an unfolded (or created) universe
     *
     * @public
     * @param {Object} universeData listable data of the universe
     */
    displayUniverse(universeData) {
      if (universeData) this.$view.openUniverse(universeData.id);
    },
    /**
     * Shows the universe of the selected fixtures, with them selected
     *
     * @public
     * @param {Array<Object>} items listable data of the selected rows, selected one first
     */
    displayFixtures(items) {
      const fixtures = items.filter((item) => item && item.universe !== undefined
        && item.unfold === undefined);
      if (!fixtures.length) return;
      const { universe } = fixtures[0];
      this.$view.openUniverse(universe);
      this.$view.selectFixtures(fixtures.filter((f) => f.universe === universe).map((f) => f.id));
    },
    /**
     * Deletes the selected fixtures from the show (as the universe view's fixture pool does).
     * Universes in the selection are left alone
     *
     * @public
     * @param {Array<Object>} items listable data of the selected rows
     */
    deleteFixtures(items) {
      items
        .filter((item) => item && item.unfold === undefined && item.universe !== undefined
          && this.$show.fixturePool.checkIfExists(item.id))
        .forEach((fixture) => this.$show.deleteFixture(fixture));
      this.$show.refreshSaveState();
    },
  },
};
</script>

<style scoped>
.patch_bay{
  background: var(--primary-light);
}
.patch_bay_header {
  display: flex;
  flex-direction: row;
  min-height: 40px;
  width: 100%;
  padding: 0 8px;
  align-items: center;
  border-bottom: 1px solid var(--primary-dark);
}
.patch_bay_universe_list {
  display: flex;
  width: 200px;
  height: calc(100% - 39px);
}
</style>
