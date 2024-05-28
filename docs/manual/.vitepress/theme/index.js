import DefaultTheme from 'vitepress/theme'
import './custom.css'
import uikit from '../../../../src/views/components/uikit';
// TODO: find a way to prevent css overrides. (import ui-kit build ?)
// import '../../../../src/assets/styles/global.css';
// import '../../../../src/assets/styles/fonts.css';

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
  ...DefaultTheme,
  enhanceApp({ app }) {
    registerComponents(uikit, app);
  }
}
