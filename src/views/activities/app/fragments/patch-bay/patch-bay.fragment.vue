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
      accordion
      @unfold="displayUniverse"
      @select="displayFixture"
      @delete="deleteFixtures"
    />
    <media-popup
      v-model="mediaPopupState"
      @create="displayUniverse"
    />
  </div>
</template>

<script>
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
      /**
       * New media popup display state
       */
      mediaPopupState: false,
    };
  },
  methods: {
    /**
     * Displays the modifier of the unfolded universe
     *
     * @public
     */
    displayUniverse(universeData) {
      if (universeData) {
        this.$router.push(`/universe/${universeData.id}`).catch(() => {});
      }
    },
    /**
     * Displays the modifier of the unfolded universe
     * and pre-selects selected fixture within the modifier.
     *
     * @public
     */
    displayFixture(fixtureData) {
      if (fixtureData) {
        this.$router.push({ path: `/universe/${fixtureData.universe}`, query: { fixtureId: fixtureData.id } }).catch(() => {});
      }
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
      // the route no longer points at a deleted fixture
      const { fixtureId } = this.$route.query;
      if (fixtureId !== undefined && !this.$show.fixturePool.checkIfExists(Number(fixtureId))) {
        this.$router.replace({ path: this.$route.path }).catch(() => {});
      }
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
