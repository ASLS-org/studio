<template>
  <uk-flex
    tabindex="0"
    center-v
    class="navigation_header"
  >
    <uk-menu :menus="menus" />
    <uk-spacer />
    <p>{{ saveState ? "" : "*" }} {{ project }}</p>
    <uk-spacer />

    <uk-flex
      center-both
      class="bpm_container"
      @click="()=>{}"
    >
      <h3>BPM: </h3>
      <uk-num-input
        v-model="$show.bpm"
        style="margin-left:var(--space-4);width:60px"
        @input="bpm=$show.bpm"
      />
      <div
        class="colored_dot"
        :style="{
          animationDuration: 60000 / bpm + 'ms',
          animationPlayState: state === 1 ? 'running' : 'paused'
        }"
      />
    </uk-flex>
    <uk-flex
      center-both
      class="state_container"
      @click="playPauseShow()"
    >
      <div
        class="play_state_icon"
        :class="liveState.text"
      />
      <h3>{{ liveState.text }}</h3>
    </uk-flex>
    <uk-flex
      center-both
      class="tap_container"
      @click="bpm = $show.tapTempo()"
    >
      <h3>TAP TEMPO</h3>
    </uk-flex>
    <uk-flex
      center-both
      class="output_container"
      :title="outputTitle"
      @click="connectionsPopupState = true"
    >
      <div
        class="output_state_icon"
        :class="outputState"
      />
      <h3>OUTPUT</h3>
    </uk-flex>
    <visualizer-popup v-model="visualizerPopupState" />
    <license-popup v-model="licensePopupState" />
    <credits-popup v-model="creditsPopupState" />
    <newshow-popup v-model="newProjectPopupState" />
    <saveas-popup v-model="saveasPopupState" />
    <outputs-popup v-model="connectionsPopupState" />
  </uk-flex>
</template>

<script>
import modal from '@/views/mixins/modal.mixin';
import EventBus from '@/plugins/eventbus';
import { OUTPUT_STATE } from '@/models/DMX/output.pool.model';
import { GATEWAY_STATUS } from '@/plugins/wsc.connection';
import VisualizerPopup from './_popups/popup.visualizer.vue';
import LicensePopup from './_popups/popup.license.vue';
import CreditsPopup from './_popups/popup.credits.vue';
import NewshowPopup from './_popups/popup.newshow.vue';
import SaveasPopup from './_popups/popup.saveas.vue';
import OutputsPopup from './_popups/outputs/popup.outputs.vue';

/**
 * Window events that end an edit gesture and trigger a save state check
 *
 * @constant {Array<String>} SAVE_STATE_EVENTS
 */
const SAVE_STATE_EVENTS = ['pointerup', 'keyup', 'change'];
/**
 * Delay in milliseconds before the save state is checked after an edit gesture
 *
 * @constant {Number} SAVE_STATE_REFRESH_DELAY
 */
const SAVE_STATE_REFRESH_DELAY = 250;

export default {
  name: 'ToolbarFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    VisualizerPopup,
    LicensePopup,
    CreditsPopup,
    NewshowPopup,
    SaveasPopup,
    OutputsPopup,
  },
  data() {
    return {
      /**
       * Current show project naem
       * @todo, change name/use show handle directly ?
       */
      project: this.$show.name,
      /**
       * Current show savestate
       */
      saveState: true,
      /**
       * CUrrent show bpm value
       */
      bpm: this.$show.bpm,
      /**
       * Current show state
       */
      state: this.$show.state,
      /**
       * Toolbarmenu configuration object
       */
      menus: [
        {
          name: 'File',
          selected: false,
          items: [
            {
              name: 'New Showfile',
              icon: 'newfile',
              shortcut: 'Shift+N',
              callback: () => {
                this.displayNewProjectPopup();
              },
            },
            {
              name: 'Load Showfile',
              icon: 'folder',
              shortcut: 'Ctrl+O',
              callback: () => {
                this.loadFile();
              },
            },
            {
              name: 'Save Showfile Locally',
              shortcut: 'Ctrl+S',
              icon: 'save',
              callback: () => {
                this.saveLocal();
              },
            },
            {
              name: 'Export Showfile',
              shortcut: 'Ctrl+Shift+S',
              icon: 'export',
              callback: () => {
                this.saveasPopupState = true;
              },
            },
          ],
        },
        {
          name: 'Preferences',
          selected: false,
          items: [
            {
              name: 'Visualizer',
              shortcut: 'Ctrl+Shift+V',
              icon: 'visualizer',
              callback: () => {
                this.displayVisualizerPopup();
              },
            },
            {
              name: 'Outputs',
              shortcut: 'Ctrl+Shift+o',
              icon: 'zoom',
              callback: () => {
                this.connectionsPopupState = true;
              },
            },
          ],
        },
        {
          name: 'About',
          selected: false,
          items: [
            {
              name: 'Manual',
              icon: 'help',
              callback: () => {
                window.open(import.meta.env.VITE_MANUAL_URL, '_blank');
              },
            },
            {
              name: 'License',
              icon: 'key',
              callback: () => {
                this.displayLicensePopup();
              },
            },
            {
              name: 'Credits',
              icon: 'opensource',
              callback: () => {
                this.displayCreditsPopup();
              },
            },
            {
              name: 'Contact',
              icon: 'contact',
              callback: () => {
                window.open('https://github.com/timekadel', '_blank');
              },
            },
          ],
        },
      ],
    };
  },
  computed: {
    /**
     * I/O popup state
     */
    bpmPopupState: modal('toolbar.bpm', 'app'),
    /**
     * Outputs popup state
     */
    connectionsPopupState: modal('toolbar.connections', 'app'),
    /**
     * What the output indicator shows (OUTPUT_STATE)
     */
    outputState() {
      return this.$show.outputPool.state;
    },
    /**
     * The output indicator's tooltip: what's lost, else the state
     */
    outputTitle() {
      const pool = this.$show.outputPool;
      if (this.outputState === OUTPUT_STATE.LOST) {
        const lost = pool.outputs.filter((g) => g.session.errored || g.session.lost
          || g.session.status === GATEWAY_STATUS.ERROR);
        return `Output lost: ${lost.map((g) => g.name).join(', ')}. Click to open Outputs`;
      }
      return {
        [OUTPUT_STATE.IDLE]: 'Nothing is sent. Click to set up Outputs',
        [OUTPUT_STATE.CONNECTING]: 'Connecting to a gateway…',
        [OUTPUT_STATE.SENDING]: 'Every route is sending',
      }[this.outputState];
    },
    /**
     * Credits popup state
     */
    creditsPopupState: modal('toolbar.credits', 'app'),
    /**
     * License popup state
     */
    licensePopupState: modal('toolbar.license', 'app'),
    /**
     * New project popup state
     */
    newProjectPopupState: modal('toolbar.newshow', 'app'),
    /**
     * Save as popup state
     */
    saveasPopupState: modal('toolbar.saveas', 'app'),
    /**
     * Visualizer popup state
     */
    visualizerPopupState: modal('toolbar.visualizer', 'app'),
    liveState() {
      switch (this.state) {
        case 0:
          return {
            text: 'stopped',
            color: 'red',
            icon: 'stop',
          };
        case 1:
          return {
            text: 'playing',
            color: 'green',
            icon: 'play',
          };
        case 2:
          return {
            text: 'paused',
            color: 'yellow',
            icon: 'pause',
          };
        default: break;
      }
      return {};
    },
  },
  mounted() {
    this.$show.on('saveState', (state) => {
      this.saveState = state;
    });
    EventBus.on('app_ready', () => {
      this.project = this.$show.name;
    });
    // Space plays or pauses the show: a global shortcut (never while typing or in a popup)
    this.removePlayShortcut = this.$keyboard?.addShortcut(
      (e) => e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey,
      () => this.playPauseShow(),
    );
    this.saveStateTimer = null;
    SAVE_STATE_EVENTS.forEach((event) => {
      window.addEventListener(event, this.scheduleSaveStateRefresh, true);
    });
  },
  beforeUnmount() {
    if (this.removePlayShortcut) this.removePlayShortcut();
    clearTimeout(this.saveStateTimer);
    SAVE_STATE_EVENTS.forEach((event) => {
      window.removeEventListener(event, this.scheduleSaveStateRefresh, true);
    });
  },
  methods: {
    /**
     * Re-checks the show's saved state once an edit gesture has settled
     *
     * @public
     */
    scheduleSaveStateRefresh() {
      clearTimeout(this.saveStateTimer);
      this.saveStateTimer = setTimeout(() => {
        this.$show.refreshSaveState();
      }, SAVE_STATE_REFRESH_DELAY);
    },
    /**
     * Toggle between show's play & pause states
     */
    playPauseShow() {
      if (this.$show.state !== 1) {
        this.$show.state = 1;
      } else {
        this.$show.state = 2;
      }
      this.state = this.$show.state;
    },
    /**
     * Set show in stop state
     */
    stopShow() {
      this.$show.state = 0;
      this.state = this.$show.state;
    },
    /**
     * Load showfile from native file loader
     *
     * @public
     * @async
     */
    async loadFile() {
      const el = document.createElement('input');
      el.type = 'file';
      el.accept = '.qxw,.asls,.json,';
      el.style.display = 'none';
      el.addEventListener('change', async () => {
        if (el.files) {
          try {
            await this.$show.loadFromFile(el.files[0]);
            // Yeah it sucks... But cleaning up everything from the view was a nightmare so for now:
            window.location.reload();
          } catch (err) {
            EventBus.emit('app_error', err);
          }
        }
        document.body.removeChild(el);
      });
      document.body.appendChild(el);
      el.click();
    },
    /**
     * Persists showfile locally
     *
     * @public
     */
    saveLocal() {
      this.$show.persistLocally();
    },
    /**
     * Display visualizer popup
     *
     * @public
     */
    displayVisualizerPopup() {
      this.visualizerPopupState = true;
    },
    /**
     * Display new project popup
     *
     * @public
     */
    displayNewProjectPopup() {
      this.newProjectPopupState = true;
    },
    /**
     * Display license popup
     *
     * @public
     */
    displayLicensePopup() {
      this.licensePopupState = true;
    },
    /**
     * Display credits popup
     *
     * @public
     */
    displayCreditsPopup() {
      this.creditsPopupState = true;
    },
    /**
     * Display BPM popup
     *
     * @public
     */
    displayBPMPopup() {
      this.bpmPopupState = true;
    },
  },
};
</script>

<style scoped>
.navigation_header {
  min-height: var(--header-height);
  width: 100%;
  background: var(--primary-light);
  border-bottom: var(--border-width) solid var(--primary-dark);
  z-index: 20;
}
.header_menu,
.bpm_container,
.tap_container,
.state_container,
.output_container {
  height: 100%;
  padding: 0 var(--space-7);
  border-left: var(--border-width) solid var(--primary-dark);
}
.state_container{
  width: 100px;
  min-width: 100px;
  max-width: 100px;
}
.tap_container:active, .state_container:active, .output_container:active {
  background: var(--secondary-dark) !important;
}
.tap_container:hover, .state_container:hover, .output_container:hover {
  background: var(--secondary-darker);
  cursor: pointer;
}
.colored_dot {
  height: 10px;
  width: 10px;
  border-radius: var(--radius-round);
  margin-left: var(--space-7);
  animation-name: softblink;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}
.output_state_icon {
  height: 8px;
  width: 8px;
  border-radius: var(--radius-round);
  margin-right: var(--space-4);
  background: var(--secondary-light);
}
.output_state_icon.sending {
  background: var(--accent-green);
}
.output_state_icon.connecting {
  background: var(--accent-gold);
}
.output_state_icon.lost {
  background: var(--accent-red);
}
.play_state_icon {
  height: var(--icon-xs);
  width: var(--icon-xs);
  margin-right: var(--space-4);
}
.play_state_icon.playing {
  background: transparent;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 10px solid var(--accent-sea-green);
}
.play_state_icon.stopped {
  background: var(--accent-red);
  border-radius: var(--radius-sm);
}
.play_state_icon.paused {
  background-size: 10px;
  background:
    linear-gradient(
      90deg ,
      var(--accent-gold) 0px,
      var(--accent-gold) 3px,
      transparent 3px,
      transparent 7px,
      var(--accent-gold) 7px,
      var(--accent-gold) 10px
    );
}

@keyframes softblink {
  0% {
    background: var(--primary-light);
    border: 2px solid var(--accent-sea-green);
  }
  50% {
    background: transparent;
    border: 2px solid var(--accent-sea-green);
  }
  50% {
    background: var(--accent-sea-green);
    border: 2px solid transparent;
  }
  100% {
    background: var(--accent-sea-green);
    border: 2px solid transparent;
  }
}
</style>
