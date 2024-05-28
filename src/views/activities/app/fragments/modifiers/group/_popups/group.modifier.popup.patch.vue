<template>
  <uk-popup
    v-model="state"
    :valid="selectedFixtures.length > 0"
    :header="headerData"
    @submit="addFixturesToGroup"
    @input="update()"
  >
    <uk-flex
      col
      class="group_patch_popup"
    >
      <uk-list
        class="fixture_list"
        :items="availableFixtures"
        colored
        toggleable
        filterable
        no-highlight
        auto-select-first
        @toggle="selectFixtures"
      />
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';

export default {
  name: 'UkPopupGroupPatch',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [PopupMixin],
  props: {
    /**
     * Handle to group instance
     */
    group: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      /**
       * POpup header data
       */
      headerData: { title: 'Add Group Fixture' },
      /**
       * List of available fixtures
       */
      availableFixtures: [],
      /**
       * List of fixtures selected for grouping
       */
      selectedFixtures: [],
    };
  },
  watch: {
    state(state) {
      if (state) {
        this.init();
      } else {
        this.deinit();
      }
    },
  },
  mounted() {
    this.init();
  },
  methods: {
    /**
     * Init popup. Fetch available fixture list by comparing available show fixtures
     * with fixtures that are already present in the group. fixtures that are already
     * present are excluded from the selection.
     *
     * @public
     */
    init() {
      this.availableFixtures = [];
      this.selectedFixtures = [];
      this.availableFixtures = this.$show.universePool.listable.map((universe) => ({
        name: universe.name,
        color: universe.color,
        id: universe.id,
        unfold: universe.unfold.flatMap((fixture) => {
          try {
            this.group.fixturePool.getFromId(fixture.id);
            return Object.assign(fixture, { disabled: true });
          } catch (err) {
            return fixture;
          }
        }),
      }));
    },
    /**
     * Deinit popup and environment. unselects and unhighlights all selected fixtures.
     * @public
     */
    deinit() {
      if (this.selectedFixtures.length) {
        this.selectedFixtures[0].highlightSingle(false, true);
      }
    },
    /**
     * Select fixture instances to be added into the group
     *
     * @public
     * @param {Array} fixtures array of fixture definition objects
     */
    selectFixtures(fixtures) {
      /**
       * Force clearing selected fixtures appearance on toggled data change
       */
      if (this.selectedFixtures.length) {
        this.selectedFixtures[0].highlightSingle(false, true);
      }
      this.selectedFixtures = fixtures.map((fixture, index) => {
        const fxt = this.$show.fixturePool.getFromId(fixture.id);
        if (index) {
          fxt.highlight(true, true);
        } else {
          fxt.highlightSingle(true, true);
        }
        return fxt;
      });
    },
    /**
     * Add selected fixtures to the group
     *
     * @public
     */
    addFixturesToGroup() {
      this.selectedFixtures.forEach((fixture) => {
        this.group.addFixture(fixture);
      });
      this.close();
    },
  },
};
</script>

<style scoped>
.group_patch_popup {
  height: 100%;
}
.fixture_list {
  min-height: 350px;
  max-height: 350px;
  flex: 1;
  width: 300px;
  border-right: 1px solid var(--primary-dark);
}
.form_validation {
  width: 100%;
  padding: 8px;
  border-top: 1px solid var(--primary-dark);
}
</style>
