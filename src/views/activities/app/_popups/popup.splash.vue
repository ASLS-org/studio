<template>
  <uk-popup backdrop opaque :movable="false" no-header no-validation class="splash_popup" @input="update()" v-model="state" :header="headerData">
    <uk-flex col class="splash_popup_body">
      <!-- <img width="200" class="ASLS_logo" src="/images/asls-logo.png" /> -->
      <div style="flex:.9"/>
      <h1>ASLS Studio</h1>
      <p>Powerful open-source, web-based, DMX lighting control software and visualizer.</p>
      <div class="loading_bar_container">
        <div :style="{ width: `${this.loader.percentage}%` }" class="loading_bar" />
      </div>
      <p class="loader_message">{{ versionData.branch }} - {{ versionData.version }} - {{ versionData.date }} | {{ loader.message }}...</p>
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from "@/views/mixins/popup.mixin.js";

export default {
  name: "ukPopupSplash",
  mixins: [PopupMixin],
  props: {
    /**
     * Splashscreen loading state
     */
    loader: {
      type: Object,
      default() {
        return {
          message: "Loading Showfile",
          percentage: 10,
        };
      },
    },
  },
  data() {
    return {
      headerData: { title: "Splash Screen" },
      versionData: {
        version: process.env.VUE_APP_VERSION,
        branch: process.env.VUE_APP_BRANCH,
        date: new Date(process.env.VUE_APP_COMMITDATE).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
      },
    };
  },
};
</script>

<style scoped>
.splash_popup {
  height: 350px;
  width: 500px;
  border-radius: 5px;
}
.splash_popup_body {
  height: 100%;
  width: 100%;
  padding: 8px;
}
.ASLS_logo {
  opacity: 0.7;
  text-align: center;
}
.splash_popup_body::after {
  content: "";
  opacity: 0.6;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  position: absolute;
  z-index: -1;
  background-image: url("/images/diane-picchiottino-m1ONIaOCmSs-unsplash.jpg");
  height: 100%;
  width: 100%;
  background-position: center;
  background-size: cover;
}
.loader_message {
  position: absolute;
  bottom: 1px;
  left: 8px;
  mix-blend-mode: difference;
  color: white;
}
.loading_bar_container {
  position: absolute;
  bottom: 0px;
  left: 0px;
  height: 16px;
  width: 100%;
  background: var(--secondary-light);
}
.loading_bar {
  position: absolute;
  bottom: 0px;
  left: 0px;
  height: 16px;
  width: 10%;
  background: var(--secondary-lighter);
  transition: width 0.5s;
}
</style>
