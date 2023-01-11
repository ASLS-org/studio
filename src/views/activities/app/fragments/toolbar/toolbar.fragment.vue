<template>
  <uk-flex tabindex="0" center-v class="navigation_header">
    <uk-menu :menus="menus" />
    <uk-spacer />
    <p>{{ this.saveState ? "" : "*" }} {{ project }}</p>
    <uk-spacer />
    <uk-flex center-both class="state_container" @click.native="playPauseShow()">
      <div class="play_state_icon" :class="liveState.text" :style="{ animationDuration: 60000 / bpm + 'ms' }" />
      <h3>{{ liveState.text }}</h3>
    </uk-flex>
    <uk-flex @click.native="()=>{}" center-both class="bpm_container">
      <h3>BPM: </h3>
      <uk-num-input style="margin-left:8px;width:60px;" @input="bpm=$show.bpm" v-model="$show.bpm"/>
      <div class="colored_dot" :style="{ animationDuration: 60000 / bpm + 'ms' }" />
    </uk-flex>
    <uk-flex center-both @click.native="bpm = $show.tapTempo()" class="tap_container">
      <h3>TAP</h3>
    </uk-flex>
    <visualizer-popup v-model="visualizerPopupState" />
    <license-popup v-model="licensePopupState" />
    <credits-popup v-model="creditsPopupState" />
    <newshow-popup v-model="newProjectPopupState" />
    <saveas-popup v-model="saveasPopupState" />
    <connections-popup v-model="connectionsPopupState" />
  </uk-flex>
</template>

<script>
import EventBus from "@/plugins/eventbus";
import VisualizerPopup from "./_popups/popup.visualizer.vue";
import LicensePopup from "./_popups/popup.license.vue";
import CreditsPopup from "./_popups/popup.credits.vue";
import NewshowPopup from "./_popups/popup.newshow.vue";
import SaveasPopup from "./_popups/popup.saveas.vue";
import ConnectionsPopup from "./_popups/popup.connections.vue";

export default {
  name: "toolbarFragment",
  components: {
    VisualizerPopup,
    LicensePopup,
    CreditsPopup,
    NewshowPopup,
    SaveasPopup,
    ConnectionsPopup,
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
       * @todo implement play/pause/stop button & visual feedback ?
       */
      state: this.$show.state,
      /**
       * Connection popup state
       */
      connectionsPopupState: false,
      /**
       * New project popup state
       */
      newProjectPopupState: false,
      /**
       * Visualizer popup state
       */
      visualizerPopupState: false,
      /**
       * License popup state
       */
      licensePopupState: false,
      /**
       * Credits popup state
       */
      creditsPopupState: false,
      /**
       * Save as popup state
       */
      saveasPopupState: false,
      /**
       * I/O popup state
       */
      bpmPopupState: false,
      /**
       * Toolbarmenu configuration object
       */
      menus: [
        {
          name: "File",
          selected: false,
          items: [
            {
              name: "New Showfile",
              icon: "newfile",
              shortcut: "Shift+N",
              callback: () => {
                this.displayNewProjectPopup();
              },
            },
            {
              name: "Load Showfile",
              icon: "folder",
              shortcut: "Ctrl+O",
              callback: () => {
                this.loadFile();
              },
            },
            {
              name: "Save Showfile Locally",
              shortcut: "Ctrl+S",
              icon: "save",
              callback: () => {
                this.saveLocal();
              },
            },
            {
              name: "Export Showfile",
              shortcut: "Ctrl+Shift+S",
              icon: "export",
              callback: () => {
                this.saveasPopupState = true;
              },
            },
          ],
        },
        {
          name: "Edit",
          selected: false,
          items: [
            {
              name: "Undo",
              shortcut: "Ctrl+Z",
              icon: "undo",
              callback: () => {
                this.$show.undo();
              },
            },
            {
              name: "Redo",
              shortcut: "Ctrl+Y",
              icon: "redo",
              callback: () => {
                this.$show.redo();
              },
            },
          ],
        },
        {
          name: "Preferences",
          selected: false,
          items: [
            {
              name: "Visualizer",
              shortcut: "Ctrl+Shift+V",
              icon: "visualizer",
              callback: () => {
                this.displayVisualizerPopup();
              },
            },
            {
              name: "Outputs",
              shortcut: "Ctrl+Shift+o",
              icon: "zoom",
              callback: () => {
                this.connectionsPopupState = true;
              },
            },
          ],
        },
        {
          name: "About",
          selected: false,
          items: [
            {
              name: "Manual",
              icon: "help",
              callback: () => {
                window.open("https://studio.asls.timekadel.com/", "_blank");
              },
            },
            {
              name: "License",
              icon: "key",
              callback: () => {
                this.displayLicensePopup();
              },
            },
            {
              name: "Credits",
              icon: "opensource",
              callback: () => {
                this.displayCreditsPopup();
              },
            },
            {
              name: "Contact",
              icon: "contact",
              callback: () => {
                window.open("https://github.com/timekadel", "_blank");
              },
            },
          ],
        },
      ],
    };
  },
  methods: {
    /**
     * Toggle between show's play & pause states
     */
    playPauseShow() {
      if (this.$show.state != 1) {
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
      var el = document.createElement("input");
      el.type = "file";
      el.accept = ".qxw,.asls,.json,";
      el.style.display = "none";
      el.addEventListener("change", async () => {
        if (el.files) {
          try {
            await this.$router.push("/");
            await this.$show.loadFromFile(el.files[0]);
            this.$router
              .push("/universe/0")
              .then(() => {
                this.$show.loading.state = false;
              })
              .catch(() => {
                this.$show.loading.state = false;
              });
            this.project = this.$show.name;
            EventBus.$emit("show_loaded");
          } catch (err) {
            EventBus.$emit("app_error", err);
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
     * Keydown event handler
     *
     * @public
     * @param {Object} e keydown event
     */
    handleKeydownEvent(e) {
      switch (e.code) {
        case "Space":
          this.playPauseShow();
          break;
      }
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
  computed: {
    liveState() {
      switch (this.state) {
        case 0:
          return {
            text: "stopped",
            color: "red",
            icon: "stop",
          };
        case 1:
          return {
            text: "playing",
            color: "green",
            icon: "play",
          };
        case 2:
          return {
            text: "paused",
            color: "yellow",
            icon: "pause",
          };
      }
      return {};
    },
  },
  mounted() {
    this.$show.on("saveState", (state) => {
      this.saveState = state;
    });
    EventBus.$on("app_ready", () => {
      this.project = this.$show.name;
      window.removeEventListener("keydown", this.handleKeydownEvent);
      window.addEventListener("keydown", this.handleKeydownEvent);
    });
  },
  watch: {
    "$show.bpm":{
      deep: true,
      handler(){
        alert(33)
      }
    }
  },
};
</script>

<style scoped>
.navigation_header {
  height: 40px;
  width: 100%;
  background: var(--primary-light);
  border-bottom: 1px solid var(--primary-dark);
  z-index: 20;
}
.header_menu,
.bpm_container,
.tap_container,
.state_container {
  height: 100%;
  padding: 0 16px;
  border-left: 1px solid var(--primary-dark);
}
.tap_container:active, .state_container:active, .bpm_container:active {
  background: var(--secondary-dark) !important;
}
.bpm_container:hover, .tap_container:hover, .state_container:hover {
  background: var(--secondary-darker);
  cursor: pointer;
}
.colored_dot {
  height: 10px;
  width: 10px;
  border-radius: 50%;
  background: #2fbb6e;
  margin-left: 8px;
  animation-name: softblink;
  animation-iteration-count: infinite;
  animation-direction: alternate; 
}
.play_state_icon {
  height: 10px;
  width: 10px;
  margin-right: 8px;
}
.play_state_icon.playing {
  background: transparent;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 10px solid #2fbb6e;
}
.play_state_icon.stopped {
  background: #ce2d5e;
  border-radius: 2px;
}
.play_state_icon.paused {
  background-size: 10px;
  background: linear-gradient(90deg ,#d3a526 0px, #d3a526 3px, transparent 3px, transparent 7px,#d3a526 7px, #d3a526 10px);
} 
.header_state_btn {
  margin-right: 8px;
  fill: var(--secondary-lighter);
  cursor: pointer;
  opacity: 0.8;
}
.header_state_btn.play {
  height: 20px !important;
  width: 20px !important;
}
.header_state_btn.stop {
  height: 14px !important;
  width: 14px !important;
}

@keyframes softblink {
  0% {
    background: #2fbb6e2f;
    border: 2px solid #2fbb6e;
  }
  50% {
    background: transparent;
    border: 2px solid #2fbb6e;
  }
  50% {
    background: #2fbb6e;
    border: 2px solid transparent;
  }
  100% {
    background: #2fbb6e;
    border: 2px solid transparent;
  }
}
</style>
