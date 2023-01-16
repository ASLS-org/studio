<template>
  <div class="group_pool">
    <uk-flex center-h class="group_pool_header">
      <h3>Group Pool</h3>
      <uk-spacer />
      <uk-button @click.native="displayGroupPopup" icon="new" style="margin-right: 8px" label="new" />
    </uk-flex>
    <uk-flex class="group_pool_body" resizable>
      <div tabindex="0" @focus="handleFocus(true)" @focusout="handleFocus(false)" :class="{ expand }" class="group_pool_groups">
        <uk-cue-container
          @poolsize="updatePoolSize"
          @scrolled="updateScroll"
          :scroll-to="scrollValue"
          :poolsize="poolsize"
          :selected="selIndex === index"
          @click.native="select(index)"
          v-for="(group, index) in groups"
          :group="group"
          :key="index"
        />
      </div>
      <uk-spacer />
      <uk-cue-container @scrolled="updateScroll" class="group_pool_master" :scroll-to="scrollValue" :poolsize="poolsize" master />
    </uk-flex>
    <group-popup v-model="groupPopupDisplayState" />
    <uk-popup :header="{ title: 'Delete Group' }" @submit="deleteGroup" v-model="deletePopupDsiplayState">
      <uk-flex col style="max-width: 350px">
        <p style="padding: 16px">The group will be permanently removed from your project. Do you wish to continue ?</p>
      </uk-flex>
    </uk-popup>
  </div>
</template>

<script>
import GroupPopup from "./_popups/popup.group.vue";
//Dirty trick but it should do for now.
import EventBus from "@/plugins/eventbus";
const DEFAULT_POOL_SIZE = 10;

export default {
  name: "groupPoolFragment",
  components: {
    GroupPopup,
  },
  data() {
    return {
      /**
       *  Handle to group pool instance
       */
      pool: this.$show.groupPool,
      /**
       *  handle to group instance
       */
      groups: this.$show.groupPool.groups,
      /**
       * Global chase pool size
       */
      poolsize: 10,
      /**
       * Global chase pool scroll value
       */
      scrollValue: 0,
      /**
       * Selected group index
       */
      selIndex: 0,
      /**
       * Handle to selected group
       */
      selectedGroup: null,
      /**
       * Group creation popup display state
       */
      groupPopupDisplayState: false,
      /**
       * Group deletion popup display state
       */
      deletePopupDsiplayState: false,
      /**
       * Group pool container expansion styling states
       */
      expand: false,
    };
  },
  methods: {
    /**
     * Selects a group from the pool
     *
     * @public
     * @param {Number} index index of the pool's group to be selected/displayed in the group modifier.
     */
    select(index) {
      this.selIndex = index;
      this.selectedGroup = this.pool.groups[index];
      this.$router.push(`/group/${this.pool.groups[index].id}`).catch(() => {});
    },
    /**
     * Displays the group creation popup
     *
     * @public
     */
    displayGroupPopup() {
      this.groupPopupDisplayState = true;
    },
    /**
     * Deletes a group from the pool
     *
     * @public
     */
    deleteGroup() {
      this.deletePopupDsiplayState = false;
      if (this.selectedGroup) {
        this.pool.delete(this.selectedGroup);
        //Forcing pool update. It's a bit sparse but it works
        this.groups = [];
        this.groups.splice();
        this.$nextTick(() => {
          this.groups = this.pool.groups;
          this.select(0);
        });
      }
    },
    /**
     * Update global pool's chase slots length based on currently used slots amount.
     *
     * @public
     */
    updatePoolSize() {
      this.poolsize = Math.max(...this.pool.groups.map((group) => group.chasePool.chases.length + DEFAULT_POOL_SIZE), DEFAULT_POOL_SIZE);
    },
    /**
     * Update scroll value in order to synchronise each group's chase pool scrolling position.
     *
     * @public
     * @param {Number} scroll Chase pool scrolling offset
     * @todo Maybe throttle the scroll events ?
     */
    updateScroll(scroll) {
      this.scrollValue = scroll;
    },
    /**
     * Handle component focus event
     *
     * @public
     * @param {Bool} state focus state
     */
    handleFocus(state) {
      window.removeEventListener("keydown", this.keydownHandler);
      if (state) {
        window.addEventListener("keydown", this.keydownHandler);
      }
    },
    /**
     * Keydown handler
     *
     * @public
     * @param {Object} e keydown event
     */
    keydownHandler(e) {
      const key = e.key;
      if (key === "Backspace" || key === "Delete") {
        if (this.selectedGroup && this.$route.params.chaseId == null) {
          this.deletePopupDsiplayState = true;
        }
      }
    },
  },
  mounted() {
    //Dirty trick but it should do for now.
    EventBus.$on("visualizer_visibility", (visibility) => {
      this.expand = !visibility;
    });
  },
};
</script>

<style scoped>
.group_pool {
  width: 100%;
  min-width: 200px;
  overflow: hidden;
  border-left: 1px solid var(--primary-dark);
  border-right: 1px solid var(--primary-dark);
  background: var(--primary-light);
  flex: 1;
}
.group_pool_header {
  min-height: 40px;
  width: 100%;
  padding: 0 8px;
  border-bottom: 1px solid var(--primary-dark);
}
.group_pool_body {
  height: calc(100% - 40px);
  background: var(--primary-dark-alt) repeating-linear-gradient(45deg, #1619130a, #1619130a 10px, #0c0e0a38 10px, #0c0e0a38 20px);
}
.group_pool_groups {
  display: flex;
  max-width: 480px;
  overflow: hidden;
  overflow-x: auto;
}
.group_pool_groups.expand {
  max-width: calc(100vw - 359px);
}
.group_pool_master {
  width: 0px;
  padding-bottom: 5px;
  margin-left: -1px;
}
</style>
