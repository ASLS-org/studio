<template>
  <uk-popup
    v-model="state"
    backdrop
    opaque
    :movable="false"
    no-header
    no-validation
    class="splash_popup"
    :header="headerData"
    @input="update()"
  >
    <uk-flex
      col
      class="splash_popup_body"
      center-both
    >
      <div class="grainy_overlay" />
      <uk-flex
        row
        center-both
        gap="32"
      >
        <studio-logo class="studio_logo" />
        <div class="vertical_seprator" />
        <div class="build_info">
          <p>
            Version:&nbsp;<a
              traget="_blank"
              :href="
                versionData.version
                  ? `https://github.com/getcaravel/caravel-api/releases/tag/${versionData.version}`
                  : 'https://github.com/getcaravel/caravel-api/releases/'
              "
            >{{ versionData.version || 'no-version-data' }}</a>
          </p>
          <p>Build date: {{ versionData.date || 'no-build-date' }}</p>
          <p style="margin-bottom:16px">
            Branch:&nbsp;<a
              traget="_blank"
              :href="
                versionData.branch
                  ? `https://github.com/ASLS-org/studio/tree/${versionData.branch}`
                  : 'https://github.com/ASLS-org/studio/'
              "
            >{{ versionData.branch || 'no-branch-data' }}</a>
          </p>
          <p>
            Copyright ©&nbsp;<a
              traget="_blank"
              href="https://github.com/asls-org"
            >ASLS-org</a>&nbsp;2021-{{ new Date().getFullYear() }}
          </p>
          <p>
            Released under the&nbsp;<a
              href="/COPYING"
              traget="_blank"
            >GPLv3 License</a>
          </p>
        </div>
      </uk-flex>
      <div class="loading_bar_container">
        <div class="loading_bar_unloaded" />
        <div
          :style="{ width: `${loader.percentage}%` }"
          class="loading_bar_loaded"
        />
        <p class="loader_message">
          {{ loader.message }}...
        </p>
      </div>
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';
import StudioLogo from '@/assets/images/studio_logo_textual.svg';

export default {
  name: 'UkPopupSplash',
  components: {
    StudioLogo,
  },
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [PopupMixin],
  props: {
    /**
     * Splashscreen loading state
     */
    loader: {
      type: Object,
      default() {
        return {
          message: 'Loading Showfile',
          percentage: 10,
        };
      },
    },
  },
  data() {
    return {
      headerData: { title: 'Splash Screen' },
      versionData: {
        branch: import.meta.env.VITE_APP_BRANCH,
        version: import.meta.env.VITE_APP_VERSION,
        date: import.meta.env.VITE_APP_BUILD_DATE,
      },
    };
  },
};
</script>

<style scoped>
.splash_popup {
  height: 350px;
  width: 650px;
  border-radius: 0px;
  border: unset !important;
}

.grainy_overlay{
  position: absolute;
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
  background: url('@/assets/images/noise.png'), rgb(255, 255, 255) 0% 0% / 100px 100px repeat;
  mix-blend-mode: multiply;
}
.splash_popup_body {
  height: 100%;
  width: 100%;
  background: linear-gradient(111deg, #712AE5 0%, #442AE5 26.41%, #712AE5 96.16%, #712AE5 99.64%);
  border: unset!important;
  padding: 64px;
}
.ASLS_logo {
  opacity: 0.7;
  text-align: center;
}
.loader_message {
  position: absolute;
  bottom: 1px;
  left: 8px;
  mix-blend-mode: difference;
  opacity: .7;
  color: white;
  font-family: roboto-regular;
}
.loading_bar_container {
  position: absolute;
  bottom: 0px;
  left: 0px;
  height: 18px;
  width: 100%;
  opacity: 1;
}

.loading_bar_unloaded{
  position: absolute;
  bottom: 0px;
  left: 0px;
  height: 18px;
  width: 100%;
  background: var(--primary-dark);
  opacity: .5;
}
.loading_bar_loaded {
  position: absolute;
  bottom: 0px;
  left: 0px;
  height: 18px;
  width: 0%;
  background: var(--primary-dark);
  transition: width 0.5s;
  opacity: .5;
}
.studio_logo{
  opacity: .74;
  height: 90px;
}
.vertical_seprator{
  height: 100%;
  width: 1px;
  background-color: var(--secondary-lighter);
}
.build_info p{
  font-family: roboto-regular;
  opacity: .9;
  font-size: 12px;
}
a{
  color: inherit!important;
  opacity: .6;
}
</style>
