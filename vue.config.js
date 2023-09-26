const 
  GitRevisionPlugin
 = require('git-revision-webpack-plugin')

module.exports = {
  chainWebpack: (config) => {
    const svgRule = config.module.rule('svg');
    svgRule.uses.clear();
    svgRule
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader');
    config.module.rule('js').exclude.add(/\.worker\.js$/)
    config.module.rule('worker')
      .test(/\.worker\.js$/)
      .use('worker-loader')
      .loader('worker-loader')
    config.plugin('define').tap(args => {
      // const gitRevisionPlugin = new GitRevisionPlugin()
      // args[0]['process.env']['VUE_APP_VERSION'] = JSON.stringify(gitRevisionPlugin.version())
      // args[0]['process.env']['VUE_APP_BRANCH'] = JSON.stringify(gitRevisionPlugin.branch())
      // args[0]['process.env']['VUE_APP_COMMITDATE'] = JSON.stringify(gitRevisionPlugin.lastcommitdatetime())
      return args
    })
  },
};