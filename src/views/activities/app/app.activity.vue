<template>
  <uk-flex
    col
    class="app_activity"
  >
    <toolbar />
    <uk-flex class="top_fragments">
      <uk-flex class="top_fragment_left">
        <patch-bay />
        <group-pool />
      </uk-flex>
      <visualizer />
    </uk-flex>
    <modifier />
    <popup-splash
      v-model="loader.state"
      :loader="loader"
    />
    <error-popup
      v-model="errPopup.state"
      style="z-index: 1000"
      :error="errPopup.error"
    />
  </uk-flex>
</template>

<script>
import EventBus from '@/plugins/eventbus';

import { nextTick } from 'vue';
import Toolbar from './fragments/toolbar/toolbar.fragment.vue';
import PatchBay from './fragments/patch-bay/patch-bay.fragment.vue';
import GroupPool from './fragments/group-pool/group-pool.fragment.vue';
import Visualizer from './fragments/visualizer/visualizer.fragment.vue';
import Modifier from './fragments/modifiers/modifier.fragment.vue';

import PopupSplash from './_popups/popup.splash.vue';
import ErrorPopup from './_popups/popup.error.vue';

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
  },
  data() {
    return {
      /**
       * Error popup description object
       */
      errPopup: {
        error: new Error(),
        state: false,
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
  watch: {
    '$show.loading': {
      deep: true,
      handler(value) {
        this.loader = value;
      },
    },
  },
  async mounted() {
    this.$router._appReayState = false;
    EventBus.on('visualizer_loaded', this.setup);
    EventBus.on('app_error', (err) => {
      this.loader.message = 'An error occured while loading the app...';
      this.errPopup.error = err;
      this.errPopup.state = true;
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
      this.loader = {
        message: 'Loading show data',
        percentage: 0,
      };
      await this.$show.loadFromLocalStorage();
      await this.$router.push('/universe/0');
      this.loader = {
        message: 'Waiting for views to settle',
        percentage: 90,
        state: true,
      };
      await new Promise((r) => { setTimeout(r, 500); });
      this.loader.state = false;
      this.$router._appReayState = true;
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
  max-height: calc(100% - 260px)!important;
  min-height: calc(100% - 260px)!important;
  z-index: 10;
}
.top_fragment_left{
  flex: 1;
}
.visualizer {
  height: 100% !important;
}
</style>
