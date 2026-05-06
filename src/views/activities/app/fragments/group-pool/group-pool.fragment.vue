<template>
  <div class="group_pool">
    <uk-flex
      center-h
      class="group_pool_header"
    >
      <h3>Group Pool</h3>
      <uk-spacer />
      <uk-button
        icon="new"
        style="margin-right: 8px"
        label="new"
        @click="displayGroupPopup"
      />
    </uk-flex>
    <uk-flex
      class="group_pool_body"
      resizable
    >
      <div
        tabindex="0"
        :class="{ expand }"
        class="group_pool_groups"
        @focus="handleFocus(true)"
        @focusout="handleFocus(false)"
      >
        <uk-cue-container
          v-for="(group, index) in groups"
          :key="index"
          :scroll-to="scrollValue"
          :poolsize="poolsize"
          :group="group"
          :selected="
            Number($route.params?.groupId) === group.id
              && $route.params?.chaseId === undefined
          "
          :selected-chase-id="
            Number($route.params?.groupId) === group.id
              ? Number($route.params?.chaseId)
              : null
          "
          @poolsize="updatePoolSize"
          @scrolled="updateScroll"
          @click="select(group)"
          @select-chase="selectChase"
        />
      </div>
      <uk-spacer />
      <uk-cue-container
        class="group_pool_master"
        :scroll-to="scrollValue"
        :poolsize="poolsize"
        master
        @scrolled="updateScroll"
      />
    </uk-flex>
    <group-popup v-model="groupPopupDisplayState" />
    <uk-popup
      v-model="deletePopupDsiplayState"
      :header="{ title: 'Delete Group' }"
      @submit="deleteGroup"
    >
      <uk-flex
        col
        style="max-width: 350px"
      >
        <p style="padding: 16px">
          The group will be permanently removed from your project. Do you wish to continue ?
        </p>
      </uk-flex>
    </uk-popup>
  </div>
</template>

<script>
import EventBus from '@/plugins/eventbus';
import GroupPopup from './_popups/popup.group.vue';
// Dirty trick but it should do for now.

const DEFAULT_POOL_SIZE = 10;

export default {
  name: 'GroupPoolFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
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
      poolsize: DEFAULT_POOL_SIZE,
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
      /**
       * Id of the currently selected group
       */
      // selectedGroup: {
      //   type: Number,
      //   default: null,
      // },
      selectedChase: null,
    };
  },
  mounted() {
    this.groups = this.$show.groupPool.groups;
    // Dirty trick but it should do for now.
    EventBus.on('visualizer_visibility', (visibility) => {
      this.expand = !visibility;
    });
    EventBus.on('show_loaded', () => {
      this.pool = this.$show.groupPool;
    });
  },
  methods: {
    /**
     * Selects a group from the pool
     *
     * @public
     * @param {Number} index index of the pool's group to be selected in the group modifier.
     */
    select(group) {
      this.selectedGroup = group;
      this.$router.push(`/group/${group.id}`).catch(() => {});
    },
    selectChase(group, chase) {
      this.selectedChase = chase;
      this.$router.push(`/group/${group.id}/chase/${chase.id}`).catch(console.log);
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
    async deleteGroup() {
      this.deletePopupDsiplayState = false;
      if (this.selectedGroup) {
        await this.$router.push(`/group/${this.groups[0].id}`);
        this.pool.delete(this.selectedGroup);
        // Forcing pool update. It's a bit sparse but it works
        this.groups = [];
        this.groups.splice();
        this.$nextTick(() => {
          this.groups = this.pool.groups;
          // this.select(0);
        });
      }
    },
    /**
     * Update global pool's chase slots length based on currently used slots amount.
     *
     * @public
     */
    updatePoolSize() {
      // todo: Math.max on arrays got a bit of overhead, change to reduce
      this.poolsize = Math.max(
        ...this.pool.groups.map((group) => group.chasePool.chases.length + DEFAULT_POOL_SIZE),
        DEFAULT_POOL_SIZE,
      );
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
      window.removeEventListener('keydown', this.keydownHandler);
      if (state) {
        window.addEventListener('keydown', this.keydownHandler);
      }
    },
    /**
     * Keydown handler
     *
     * @public
     * @param {Object} e keydown event
     */
    keydownHandler(e) {
      const { key } = e;
      if (key === 'Backspace' || key === 'Delete') {
        if (this.selectedGroup && this.$route.params.chaseId == null) {
          this.deletePopupDsiplayState = true;
        }
      }
    },
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
  background: var(--primary-dark-alt) repeating-linear-gradient(
    45deg,
    #1619130a,
    #1619130a 10px,
    #0c0e0a38 10px,
    #0c0e0a38 20px
  );
}
.group_pool_groups {
  display: flex;
  width: 480px;
  max-width: calc(100vw - 920px);
  min-width: 240px;
  overflow: hidden;
  overflow-x: auto;
  resize: horizontal
}
.group_pool_groups.expand {
  max-width: calc(100vw - 359px);
  width: 100%;
  resize: unset;
}
.group_pool_master {
  width: 0px;
  margin-left: -1px;
}
</style>
