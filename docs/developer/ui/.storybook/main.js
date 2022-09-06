const path = require('path');

module.exports = {
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-actions"
  ],
  "stories": [
    "./**/*.stories.mdx",
    "./**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "framework": "@storybook/vue",
  "staticDirs": ['./static'],
  "webpackFinal": async (config)=>{
      /**
       * Getting vue-svg-loader to work with storybook.
       */
      let rule = config.module.rules.find(r =>
          r.test && r.test.toString().includes('svg') &&
          r.loader && r.loader.includes('file-loader')
      );
      rule.test = /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani)(\?.*)?$/;
      config.module.rules.push(
          {
              test: /\.svg$/,
              use: ['vue-svg-loader']
          }
      )
      /**
       * Getting '@' shortcut to be resolved by webpack
       */
      config.resolve.alias['@'] = path.resolve(__dirname, '../../../../src/');
      return config;
  }
}
