import { createApp, reactive } from 'vue';
import axios from 'axios';
import uikit from '@/views/components/uikit';
import utils from '@/views/utils';
import EventBus from '@/plugins/eventbus';
import LiveTicker from '@/plugins/live.ticker';
import '@/assets/styles/global.css';
import '@/assets/styles/fonts.css';
import ShowSingleton from '@/singletons/show.singleton';
import ViewState from '@/views/view.state';
import Keyboard from '@/views/keyboard';
import router from './plugins/router';
import App from './App.vue';

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

try {
  const app = createApp(App);
  registerComponents(uikit, app);
  app.config.globalProperties.$show = reactive(ShowSingleton);
  // What's in view, selected and open: one source of truth, reset when a show is loaded
  const view = reactive(new ViewState(app.config.globalProperties.$show));
  app.config.globalProperties.$view = view;
  app.provide('view', view);
  EventBus.on('show_loaded', () => view.reset());
  // One keyboard path: top popup, then the focused block, then global shortcuts
  app.config.globalProperties.$keyboard = new Keyboard(view);
  app.config.globalProperties.$http = axios;
  app.config.globalProperties.$utils = reactive(utils);
  app.config.globalProperties.$liveTicker = LiveTicker;
  app.config.errorHandler = (err) => {
    console.log(err);
    EventBus.emit('app_error', err);
  };
  app.use(router);
  app.mount('#app');
} catch (err) {
  console.log(err);
}
