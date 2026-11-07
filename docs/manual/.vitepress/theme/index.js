/* eslint-disable import/no-extraneous-dependencies */
import DefaultTheme from 'vitepress/theme-without-fonts';
import { useData } from 'vitepress';
import { onMounted, watch } from 'vue';
import uikit from '../../../../src/views/components/uikit';
import Video from './components/video.vue';
import StudioFrame from './components/StudioFrame.vue';
import LivePreview from './components/LivePreview.vue';
import ShowMap from './components/ShowMap.vue';
import SceneFade from './components/SceneFade.vue';
import EffectWave from './components/EffectWave.vue';
import ResourceLink from './components/ResourceLink.vue';
import StudioLayout from './shell/Layout.vue';
import HomeStory from './hero/HomeStory.vue';
import ManualTicker from './hero/ticker';
import './custom.css';
import './asls-scope.css';
import './prose.css';

/**
 * Registers every uk-* component of Studio's uikit, as src/main.js does.
 * @param {Object} components nested component map
 * @param {Object} app Vue app
 */
function registerComponents(components, app) {
  Object.keys(components).forEach((componentKey) => {
    const component = components[componentKey];
    if (component.name) {
      app.component(component.name, component);
    } else {
      registerComponents(component, app);
    }
  });
}

export default {
  extends: DefaultTheme,
  Layout: StudioLayout,
  enhanceApp({ app, siteData }) {
    // Resource URLs from config.js, for Options API components (this.$links)
    app.config.globalProperties.$links = siteData.value.themeConfig.links || {};
    // Studio widgets read live values through $liveTicker; the manual's own ticker stands in
    app.config.globalProperties.$liveTicker = ManualTicker;
    registerComponents(uikit, app);
    // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
    app.component('Video', Video);
    app.component('StudioFrame', StudioFrame);
    app.component('LivePreview', LivePreview);
    app.component('ShowMap', ShowMap);
    app.component('SceneFade', SceneFade);
    app.component('EffectWave', EffectWave);
    app.component('ResourceLink', ResourceLink);
    app.component('HomeStory', HomeStory);
  },
  setup() {
    // Studio's tokens switch on html[data-theme]; VitePress switches html.dark. Keep them in step.
    const { isDark } = useData();
    onMounted(() => {
      watch(isDark, (dark) => {
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      }, { immediate: true });
    });
  },
};
