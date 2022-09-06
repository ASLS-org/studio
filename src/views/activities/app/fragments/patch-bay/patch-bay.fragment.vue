<template>
  <div class="patch_bay">
    <div class="patch_bay_header">
      <h3>Patch Bay</h3>
      <span style="flex: 1" />
      <uk-button @click.native="displayPatchPopup" icon="patch" style="margin-right: 8px" label="patch" />
    </div>
    <uk-list deletable @unfold="displayUniverse" @select="displayFixture" colored class="patch_bay_universe_list" filterable :items="pool.listable" />
  </div>
</template>

<script>
export default {
  name: "patchBayFragment",
  data() {
    return {
      pool: this.$show.universePool,
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
     * Displays the modifier of the unfolded universe and pre-selects selected fixture within the modifier.
     *
       * @public
     */
    displayFixture(fixtureData) {
      if (fixtureData) {
        this.$router.push({ path: `/universe/${fixtureData.universe}`, query: { fixtureId: fixtureData.id } }).catch(() => {});
      }
    },
    /**
     * Displays the patch popup
     *
       * @public
     * @todo implement the patch popup
     */
    displayPatchPopup() {},
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
