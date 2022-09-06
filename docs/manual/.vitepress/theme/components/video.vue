<template>
  <div class="wrapper">
    <Transition name="fade">
      <div class="pause_overlay" v-show="!playing">
        <div class="pause_bar" />
        <div class="pause_bar" />
      </div>
    </Transition>
    <video class="video" ref="video" loop="true" muted>
      <source :src="src" type="video/webm" />
      Your browser does not support the video tag.
    </video>
    <div class="loader">
      <span ref="progress" class="loader_progress" />
    </div>
  </div>
</template>

<script>
export default {
  name: "Video",
  props: {
    src: String,
  },
  data() {
    return {
      videoElHandle: null,
      playing: false,
      intervalHandle: null,
    };
  },
  methods: {
    toggleVisibility() {
      let box = this.videoElHandle.getBoundingClientRect();
      let boxCenterY = box.top + box.height / 2.0;
      let screenCenterY = window.innerHeight / 2;
      let playing = this.playing;
      if (boxCenterY <= screenCenterY + box.height && boxCenterY >= screenCenterY - box.height) {
        this.playing = true;
      } else {
        this.playing = false;
        this.videoElHandle.pause();
        this.videoElHandle.currentTime = 0;
      }
      playing ? this.videoElHandle.play() : this.videoElHandle.pause();
      this.updateProgress();
    },
    updateProgress() {
      if (this.$refs.progress) {
        this.$refs.progress.style.transition = this.videoElHandle.currentTime >= 0.5 ? 'width .5s' : 'width 0s';
        this.$refs.progress.style.width = `${(this.videoElHandle.currentTime / this.videoElHandle.duration) * 100}%`;
      }
    },
  },
  beforeDestroy() {
    clearInterval(this.intervalHandle);
  },
  mounted() {
    this.videoElHandle = this.$refs.video;
    this.intervalHandle = setInterval(this.toggleVisibility, 250);
  },
};
</script>

<style scoped>
.wrapper {
  position: relative;
  display: inline-block;
  border-radius: 5px;
  border: 1px solid #0c0e0a;
  overflow: hidden;
  background: #0c0e0a;
}
.pause_overlay {
  border-radius: 5px;
  position: absolute;
  height: 100%;
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.pause_bar {
  height: 64px;
  width: 16px;
  background: rgba(255, 255, 255, 0.63);
  border-radius: 5px;
}
.loader {
  position: absolute;
  width: 100%;
  height: 5px;
  bottom: 0px;
  left: 0px;
  background: rgba(255, 255, 255, 0.2);
}
.loader_progress {
  position: absolute;
  width: 10%;
  height: 100%;
  background: var(--vp-c-brand);
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
