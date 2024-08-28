<template>
  <div
    ref="chase"
    class="uikit_chase"
    :style="{ background: chase.color, top: `${chase.id * 26}px` }"
    :class="{ playing: chase.state, selected: selected }"
    @mousedown="startDrag"
    @mouseup="stopDrag"
  >
    <div
      class="uikit_chase_btn"
      @click.stop="toggle"
    >
      <uk-icon
        class="uikit_chase_icon"
        :name="chase.state ? 'stop' : 'play'"
      />
    </div>
    <div
      class="uikit_chase_loader"
      :style="{ width: chase.elapsedPerc * 100 + '%' }"
    />
    <h4 class="uikit_chase_title">
      {{ chase.name }}
    </h4>
  </div>
</template>

<script>
export default {
  name: 'UkChase',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Handle to chase instance
     */
    value: {
      type: Object,
      default: null,
    },
  },
  emits: ['cue'],
  data() {
    return {
      /**
       * Handle to chase instance
       */
      chase: this.value,
      /**
       * Whether the chase is currently selected or not
       */
      selected: false,
      /**
       * The chase's default snapHeight
       * TODO: this should be hardcoded ?
       */
      snapHeight: 26,
    };
  },
  computed: {
    /**
     * Component's top offset
     *
     * @property offsetTop
     * @returns {String} css-forted top-offset string
     */
    offsetTop() {
      return `${this.chase.id * 26}px`;
    },
  },
  watch: {
    modelValue(value) {
      this.chase = value;
    },
    '$route.params.chaseId': function routeParamsChaseIdWatcher() {
      this.selected = this.$route.params.chaseId === this.chase.id;
    },
  },
  methods: {
    /**
     * Toggles chase's state ON/OFF
     */
    toggle() {
      /**
       * Chase pool toggle event
       *
       * @property {Object} chase handle to the chase instance
       */
      this.$emit('cue', this.chase);
    },
    /**
     * Prepare chase's element dragging.
     */
    startDrag() {
      document.body.style.cursor = 'move';
      const viewportOffset = this.$refs.chase.getBoundingClientRect();
      // eslint-disable-next-line max-len
      this.startY = viewportOffset.top - this.$refs.chase.offsetTop + this.$refs.chase.clientHeight / 2;
      window.addEventListener('mousemove', this.drag);
      window.addEventListener('mouseup', this.stopDrag);
    },
    /**
     * Re-compute chase's Y position accordingly to mouse move
     *
     * @param {Object} e mousemove event
     */
    drag(e) {
      const tick = Math.max(Math.floor((e.clientY - this.startY) / this.snapHeight), 0);
      this.$refs.chase.style.top = `${tick * this.snapHeight}px`;
      this.chase.id = tick;
    },
    /**
     * Ends chase element dragging procedure.
     */
    stopDrag() {
      document.body.style.cursor = 'unset';
      window.removeEventListener('mousemove', this.drag);
    },
  },
};
</script>

<style scoped>
.uikit_chase {
  position: absolute;
  display: flex;
  height: 25px;
  width: 100%;
  border: 1px solid var(--secondary-light);
  background: rgb(202, 39, 93);
  opacity: 0.8;
}
.uikit_chase.selected {
  opacity: 1 !important;
  border-color: rgba(255, 255, 255, 0.4);
}
.uikit_chase:active {
  cursor: move !important;
}
.uikit_chase_btn {
  display: flex;
  height: 100%;
  width: 30px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #ffffff33; /* Since cues are colored, we're enforcing dark theme font color */
}
.selected > .uikit_chase_btn {
  background: rgba(255, 255, 255, 0.4);
}
.uikit_chase_icon {
  height: 14px !important;
  width: 14px !important;
  fill: #ffffffb3 !important; /* Since cues are colored, we're enforcing dark theme font color */
}
.playing .uikit_chase_icon {
  height: 10px !important;
  width: 10px !important;
  animation: softblink linear 0.8s infinite alternate;
}
.uikit_chase_title {
  display: flex;
  align-items: center;
  padding: 0 8px;
  width: 100%;
  height: 100%;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #ffffffb3 !important; /* Since cues are colored, we're enforcing dark theme font color */
}
.uikit_chase_loader {
  position: absolute;
  height: 100%;
  pointer-events: none;
}
.playing .uikit_chase_loader {
  width: 0%;
  background-color: var(--secondary-light);
}
/* The animation code */
@keyframes load {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}
/* The animation code */
@keyframes softblink {
  from {
    fill: var(--secondary-lighter);
  }
  to {
    fill: var(--secondary-light);
  }
}
</style>
