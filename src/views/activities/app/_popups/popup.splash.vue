<template>
  <uk-popup backdrop :movable="false" no-header no-validation class="splash_popup" @input="update()" v-model="state" :header="headerData">
    <uk-flex col class="splash_popup_body">
      <img class="ASLS_logo" src="/images/asls.logo.black.png" />
      <span class="ASLS_version">Studio V1.0</span>
      <div class="loading_bar_container">
        <div :style="{ width: `${this.loader.percentage}%` }" class="loading_bar" />
      </div>
      <p class="loader_message">{{ loader.message }}...</p>
    </uk-flex>
  </uk-popup>
</template>

<script>

import PopupMixin from "@/views/mixins/popup.mixin.js"

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
    };
  },
};
</script>

<style scoped>

.splash_popup {
  height: 350px;
  width: 500px;
}
.splash_popup_body {
  height: 100%;
  width: 100%;
  justify-content: center;
  background-position: center;
}
.ASLS_logo {
  width: 100%;
  padding: 0 10%;
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
  background-image: url("/images/splash.jpg");
  height: 100%;
  width: 100%;
  background-position: center;
}
.ASLS_version {
  width: 100%;
  padding: 0 10%;
  margin-top: 16px;
  opacity: 0.9;
  text-align: right;
  color: rgba(0, 0, 0, 0.8);
  font-family: Roboto;
}
.loading_bar {
  position: absolute;
  bottom: 0px;
  left: 0px;
  height: 16px;
  width: 100%;
  background-image: linear-gradient(90deg, var(--secondary-lighter) 0%, var(--secondary-lighter) 15%, var(--secondary-light) 15%, var(--secondary-light));
}
.loader_message {
  position: absolute;
  bottom: 24px;
  left: 5px;
  color: rgba(0, 0, 0, 0.8) !important;
  font-family: Roboto;
}
.loading_bar_container {
  position: absolute;
  bottom: 0px;
  left: 0px;
  height: 16px;
  width: 100%;
  background: #00000033;
}
.loading_bar {
  position: absolute;
  bottom: 0px;
  left: 0px;
  height: 16px;
  width: 10%;
  background: #FFFFFF73;
  transition: width .5s;
}
</style>
