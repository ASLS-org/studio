<template>
  <uk-popup @submit="create()" @input="update()" v-model="state" :header="headerData">
    <uk-flex class="group_popup">
      <uk-flex>
        <uk-list
          class="fixture_list"
          :items="universes.listable"
          colored
          toggleable
          filterable
          noHighlight
          @toggle="setFixtureList"
        />
      </uk-flex>
      <uk-flex col>
        <uk-flex style="padding: 10px" col :gap="8">
          <uk-txt-input label="Name" v-model="name" />
          <uk-select-input label="Color" @input="setGroupColor" :options="colorOptions" :value="getIndexFromColor(color)" />
        </uk-flex>
      </uk-flex>
    </uk-flex>
  </uk-popup>
</template>

<script>
import colorMixin from "@/views/mixins/color.mixin";
import PopupMixin from "@/views/mixins/popup.mixin.js"

export default {
  name: "ukPopupGroup",
  mixins: [colorMixin, PopupMixin],
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: { title: "Create Group" },
      /**
       * Group name
       */
      name: "New Group",
      /**
       * Group Color
       */
      color: this.getColorFromIndex(0),
      /**
       * Handle to show universe pool
       */
      universes: this.$show.universePool,
      /**
       * List of fixtures selected for grouping
       */
      fixtures: [],
    };
  },
  methods: {
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
    setFixtureList(fixturesData){
      this.fixtures = fixturesData.map((fixture, index)=>{
        let fxt = this.$show.fixturePool.getFromId(fixture.id);
        index == 0 ? fxt.highlightSingle(true) : fxt.highlight(true);
        return fxt;
      })
    },
    /**
     * Create new group
     * 
       * @public
     */
    create() {
      let group = this.$show.groupPool.addRaw({
        color: this.color,
        name: this.name
      })
      this.fixtures.forEach(fixture=>{
        group.addFixture(fixture);
      })
      this.$emit("create", group);
      this.close();
    }
  },
  watch: {
    value(state) {
      this.universe = this.$show.universePool;
      let groupId = this.$show.groupPool.genGroupId()
      this.name = `Group ${groupId}`;
      this.color = this.getColorFromIndex(groupId);
      this.fixtures = [];
      this.state = state;
    }
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
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  margin-right: 8px;
  width: 55px;
}
.field_label {
  margin-bottom: 8px;
}
.form_validation{
  width:100%;
  padding: 8px;
  border-top: 1px solid var(--primary-dark);
}
</style>
