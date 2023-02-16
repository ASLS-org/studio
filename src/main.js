import Vue from 'vue';
import router from './plugins/router';
import App from './App.vue';
import axios from 'axios';
import uikit from '@/views/components/uikit'
import utils from '@/views/utils'
import EventBus from '@/plugins/eventbus'
import '@/assets/styles/global.css'
import '@/assets/styles/fonts.css'
import ShowSingleton from '@/singletons/show.singleton'

function registerComponents(components) {
  Object.keys(components).forEach(componentKey => {
    let component = components[componentKey]
    if (component.name) {
      Vue.component(component.name, component)
    } else {
      registerComponents(component)
    }
  })
}

try {
  Vue.prototype.$show = ShowSingleton;
  Vue.prototype.$http = axios;
  Vue.prototype.$utils = utils;
  Vue.config.productionTip = false
  Vue.config.errorHandler = (err) => {
    console.log(err);
    EventBus.$emit("app_error", err);
  }
  registerComponents(uikit);
  new Vue({
    router,
    render: h => h(App),
  }).$mount('#app')
} catch (err) {
  console.log(err)
}