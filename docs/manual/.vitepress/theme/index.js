import DefaultTheme from 'vitepress/theme'
// import './fonts.css'
// import './global.css'
import './custom.css'

const components = import.meta.globEager('./components/**/*.vue')


export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    Object.entries(components).forEach(([_, definition]) => {
      app.component(definition.default.name, definition.default)
    })
  }
}