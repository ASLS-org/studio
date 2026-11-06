<template>
  <div class="wrapper">
    <Transition name="fade">
      <div
        v-show="!playing"
        class="pause_overlay"
      >
        <div class="pause_bar" />
        <div class="pause_bar" />
      </div>
    </Transition>
    <video
      ref="video"
      class="video"
      loop
      muted
    >
      <source
        :src="src"
        type="video/webm"
      >
      Your browser does not support the video tag.
    </video>
    <div class="loader">
      <span
        ref="progress"
        class="loader_progress"
      />
    </div>
  </div>
</template>

<script>
/**
 * Muted looping screen recording that plays while it sits near the middle of the viewport.
 * @example <Video src="/interface/toolbar.webm" />
 */
export default {
  // Existing pages use <Video>; renaming it would break them
  // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
  name: 'Video',
  props: {
    /**
     * WebM file path under docs/manual/public
     * @type {String}
     */
    src: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      videoElHandle: null,
      playing: false,
      intervalHandle: null,
    };
  },
  mounted() {
    this.videoElHandle = this.$refs.video;
    this.intervalHandle = setInterval(this.toggleVisibility, 250);
  },
  beforeUnmount() {
    clearInterval(this.intervalHandle);
  },
  methods: {
    /**
     * Plays the video while its centre is within one video height of the viewport centre,
     * otherwise pauses and rewinds it.
     */
    toggleVisibility() {
      const box = this.videoElHandle.getBoundingClientRect();
      const boxCenterY = box.top + box.height / 2.0;
      const screenCenterY = window.innerHeight / 2;
      const wasPlaying = this.playing;
      if (boxCenterY <= screenCenterY + box.height && boxCenterY >= screenCenterY - box.height) {
        this.playing = true;
      } else {
        this.playing = false;
        this.videoElHandle.pause();
        this.videoElHandle.currentTime = 0;
      }
      if (wasPlaying) {
        this.videoElHandle.play();
      } else {
        this.videoElHandle.pause();
      }
      this.updateProgress();
    },
    /**
     * Moves the progress bar to the video's current time.
     */
    updateProgress() {
      const { progress } = this.$refs;
      if (progress) {
        const { currentTime, duration } = this.videoElHandle;
        progress.style.transition = currentTime >= 0.5 ? 'width .5s' : 'width 0s';
        progress.style.width = `${(currentTime / duration) * 100}%`;
      }
    },
  },
};
</script>

<style scoped>
.wrapper {
  position: relative;
  display: inline-block;
  border-radius: 5px;
  border: 1px solid var(--secondary-dark);
  overflow: hidden;
  background: var(--primary-dark);
}
.pause_overlay {
  border-radius: 5px;
  position: absolute;
  height: 100%;
  width: 100%;
  background: color-mix(in srgb, var(--primary-dark) 50%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.pause_bar {
  height: 64px;
  width: 16px;
  background: var(--secondary-lighter);
  border-radius: 5px;
}
.loader {
  position: absolute;
  width: 100%;
  height: 5px;
  bottom: 0px;
  left: 0px;
  background: var(--secondary-light);
}
.loader_progress {
  position: absolute;
  width: 10%;
  height: 100%;
  background: var(--vp-c-brand-1);
  transition: width 1s;
  opacity: .8
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
