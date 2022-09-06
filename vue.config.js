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

      // workerLoaderRule.uses.clear();
      // workerLoaderRule
    // config.entry('worker:').add('./src/plugins/timer.worker.js');

    
  },

};