<template>
  <uk-flex
    col
    class="app_activity"
  >
    <toolbar />
    <uk-flex
      class="top_fragments"
      :style="{ '--patch-bay-width': `${patchBayWidth}px` }"
    >
      <uk-flex class="top_fragment_left">
        <patch-bay />
        <!-- The patch bay's right border: drag it to widen it (up to twice its width) -->
        <uk-resize-handle
          class="patch_bay_resize"
          axis="x"
          @resize="patchBayWidth = $event"
        />
        <group-pool />
      </uk-flex>
      <visualizer />
    </uk-flex>
    <!-- The border between the top panels and the modifier strip: drag it to share the height -->
    <uk-resize-handle axis="y" />
    <modifier />
    <popup-splash
      v-model="loader.state"
      :loader="loader"
    />
    <missing-fixtures-popup style="z-index: 999" />
    <error-popup
      v-model="errorPopupState"
      style="z-index: 1000"
      :error="errPopup.error"
    />
  </uk-flex>
</template>

<script>
import modal from '@/views/mixins/modal.mixin';
import EventBus from '@/plugins/eventbus';

import Toolbar from './fragments/toolbar/toolbar.fragment.vue';
import PatchBay from './fragments/patch-bay/patch-bay.fragment.vue';
import GroupPool from './fragments/group-pool/group-pool.fragment.vue';
import Visualizer from './fragments/visualizer/visualizer.fragment.vue';
import Modifier from './fragments/modifiers/modifier.fragment.vue';

import PopupSplash from './_popups/popup.splash.vue';
import ErrorPopup from './_popups/popup.error.vue';
import MissingFixturesPopup from './_popups/popup.missing.fixtures.vue';

export default {
  name: 'AppActivity',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    Toolbar,
    PatchBay,
    GroupPool,
    Visualizer,
    Modifier,
    PopupSplash,
    ErrorPopup,
    MissingFixturesPopup,
  },
  data() {
    return {
      /**
       * Patch bay width (px): the group pool's width limits leave room for it
       */
      patchBayWidth: 200,
      /**
       * Error popup description object
       */
      errPopup: {
        error: new Error(),
      },
      /**
       * App readyness state
       */
      ready: false,
      /**
       * App loading state
       */
      loading: true,
      /**
       * Handle to show loading property
       */
      loader: this.$show.loading,
    };
  },
  computed: {
    /**
     * Error popup display state (stays open across a show load)
     */
    errorPopupState: modal('app.error', 'app', true),
  },
  watch: {
    '$show.loading': {
      deep: true,
      handler(value) {
        this.loader = value;
      },
    },
  },
  async mounted() {
    EventBus.on('visualizer_loaded', this.setup);
    EventBus.on('app_error', (err) => {
      this.loader.message = 'An error occured while loading the app...';
      this.errPopup.error = err;
      this.errorPopupState = true;
    });
  },
  methods: {
    /**
     * Setup App. Loads show from local storage or creates new
     * show project if no local data is available
     *
     * @public
     */
    async setup() {
      const localLoadingSucceeded = await this.$show.loadFromLocalStorage();

      if (!localLoadingSucceeded) {
        const res = await fetch(`${import.meta.env.VITE_STATIC_URL}demo/showfiles/demo.showfile.json`);
        const showData = await res.json();
        await this.$show.loadFromData(showData);
      }

      this.loader = {
        message: 'Waiting for views to settle',
        percentage: 90,
        state: true,
      };

      await new Promise((r) => { setTimeout(r, 500); });
      this.loader.state = false;
      this.ready = true;
      EventBus.emit('app_ready');
    },
  },
};
</script>

<style>
.v-application--wrap {
  min-height: 100% !important;
  position: relative;
}
.v-main__wrap {
  overflow: hidden !important;
  position: relative;
}
</style>

<style scoped>
.app_activity{
  position: relative;
  height:100%;
  width: 100%;
}
.top_fragments {
  z-index: 10;
  overflow: hidden;
  min-height: calc(100% - 500px);
  max-height: calc(100% - 280px);
  height: calc(100% - 280px);
}
.top_fragment_left{
  flex: 1;
}
.visualizer {
  height: 100% !important;
}
</style>
