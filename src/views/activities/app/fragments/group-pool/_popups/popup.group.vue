<template>
  <uk-popup
    v-model="state"
    :header="headerData"
    @submit="create()"
    @input="update()"
  >
    <uk-flex class="group_popup">
      <uk-flex>
        <uk-list
          class="fixture_list"
          :items="universes"
          colored
          toggleable
          filterable
          no-highlight
          auto-select-first
          accordion
          @toggle="setFixtureList"
        />
      </uk-flex>
      <uk-flex col>
        <uk-flex
          class="group_settings"
          col
          :gap="8"
        >
          <uk-txt-input
            v-model="name"
            label="Name"
          />
          <uk-select-input
            label="Color"
            :options="colorOptions"
            :model-value="getIndexFromColor(color)"
            @input="setGroupColor"
          />
        </uk-flex>
      </uk-flex>
    </uk-flex>
  </uk-popup>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';
import PopupMixin from '@/views/mixins/popup.mixin';

export default {
  name: 'UkPopupGroup',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [colorMixin, PopupMixin],
  emits: ['create'],
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: { title: 'Create Group' },
      /**
       * Group name
       */
      name: 'New Group',
      /**
       * Group Color
       */
      color: this.getColorFromIndex(0),
      /**
       * Handle to show universe pool
       */
      // JSON.parse(JSON.stringify(this.$show.universePool.listable)),
      universes: this.$show.universePool.listable,
      /**
       * List of fixtures selected for grouping
       */
      selectedFixtures: [],
    };
  },
  watch: {
    modelValue(state) {
      if (state) {
        this.init();
      } else {
        this.deinit();
      }
    },
  },
  methods: {
    /**
     * Init popup. Automatically fetches default group name and color.
     *
     * @public
     */
    init() {
      /**
       * Deeply copying listable universe data.
       * Item list would be refreshed  and untoggled on any change operation otherwise
       * @todo Check this weird behavior.
       * It seems like their is a very weird issue in list reactivity/component dependency ?
       * Anyway, it should do the job for now.
       */
      this.universes = this.$show.universePool.listable;
      const groupId = this.$show.groupPool.genGroupId();
      this.name = `Group ${groupId}`;
      this.color = this.getColorFromIndex(groupId);
      this.selectedFixtures = [];
    },
    /**
     * Associates a color to the group
     *
     * @public
     * @param {Number} colorIndex uikit color index
     */
    setGroupColor(colorIndex) {
      this.color = this.getColorFromIndex(colorIndex);
    },
    /**
     * Fetch and the list of fixtures selected for grouping
     *
     * @public
     * @param {Array} fixturesData array of fixture objects
     */
    setFixtureList(fixturesData) {
      /**
       * Force clearing selected fixtures appearance on toggled data change
       */
      if (this.selectedFixtures.length) {
        this.selectedFixtures[0].highlightSingle(false, true);
      }
      this.selectedFixtures = fixturesData.map((fixture, index) => {
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
     * Create new group
     *
     * @public
     */
    create() {
      const group = this.$show.groupPool.addRaw({
        color: this.color,
        name: this.name,
      });
      this.selectedFixtures.forEach((fixture) => {
        group.addFixture(fixture);
      });
      this.$emit('create', group);
      this.close();
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
  },
};
</script>

<style scoped>
.group_popup {
  display: flex;
  flex-direction: row !important;
  height: 100%;
  min-height: 300px;
  max-height: 300px;
}
.fixture_list {
  height: 100%;
  width: 300px;
  border-right: 1px solid var(--primary-dark);
}
.group_settings{
  padding: 10px;
  min-width: 150px;
}
</style>
