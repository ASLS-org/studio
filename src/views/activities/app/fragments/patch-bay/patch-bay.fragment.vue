<template>
  <div class="patch_bay">
    <div class="patch_bay_header">
      <h3>Patch Bay</h3>
      <span style="flex: 1" />
      <uk-button
        icon="new"
        style="margin-right: 8px"
        label="new"
        @click="addUniverse"
      />
    </div>
    <uk-list
      deletable
      colored
      class="patch_bay_universe_list"
      filterable
      :items="pool.patchBayListable"
      :auto-select="routeUniverseIndex"
      delete-note="Every fixture patched on them is deleted too, from its groups and cues."
      @select="displayUniverse"
      @delete="deleteUniverses"
    />
  </div>
</template>

<script>
import ukColors from '@/views/components/uikit/colors/uikit.colors';

export default {
  name: 'PatchBayFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  data() {
    return {
      pool: this.$show.universePool,
    };
  },
  computed: {
    /**
     * Index of the universe the universe view shows, so the list highlights it
     *
     * @type {?Number}
     */
    routeUniverseIndex() {
      const { universeId } = this.$route.params || {};
      if (universeId === undefined) return null;
      const index = this.pool.universes.findIndex((u) => u.id === Number(universeId));
      return index > -1 ? index : null;
    },
  },
  methods: {
    /**
     * Opens the selected universe in the universe view
     *
     * @public
     * @param {Object} universeData listable universe data
     */
    displayUniverse(universeData) {
      if (universeData) {
        this.$router.push(`/universe/${universeData.id}`).catch(() => {});
      }
    },
    /**
     * Adds an empty universe (next free id) and opens it
     *
     * @public
     */
    addUniverse() {
      const id = this.pool.genUniverseId();
      const colors = Object.values(ukColors);
      const universe = this.pool.addRaw({
        id,
        name: `Universe ${id}`,
        color: colors[id % colors.length],
      });
      this.$show.refreshSaveState();
      this.displayUniverse(universe);
    },
    /**
     * Deletes the selected universes with every fixture patched on them, and leaves the universe
     * view if it showed one of them
     *
     * @public
     * @param {Array<Object>} universesData listable data of the universes to delete
     */
    deleteUniverses(universesData) {
      const ids = universesData.map((u) => Number(u.id));
      ids.forEach((id) => {
        this.$show.deleteUniverse({ id });
      });
      this.$show.refreshSaveState();
      if (ids.includes(Number(this.$route.params?.universeId))) {
        this.$router.push('/').catch(() => {});
      }
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
