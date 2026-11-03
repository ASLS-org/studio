module.exports = {
  extends: [
    'airbnb-base',
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
  ],
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'vue/no-mutating-props': ['error', {
      shallowOnly: true,
    }],
    'no-plusplus': 'off',
    'no-underscore-dangle': 'off',
    'max-classes-per-file': 'off',
    'no-constructor-return': 'off',
    'no-param-reassign': 'off',
    'no-await-in-loop': 'off',
    camelcase: 'off',
    // Vite query imports and three's package "exports" can't be followed by the alias resolver
    'import/no-unresolved': ['error', {
      ignore: ['\\?(worker|raw)$', '^three/examples/jsm/'],
    }],
  },
  overrides: [{
    // three's package "exports" require explicit .js on three/examples/jsm/* imports
    files: ['src/plugins/visualizer/**/*.js'],
    rules: {
      'import/extensions': 'off',
    },
  }],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.vue'],
      },
      alias: {
        map: [
          ['@', './src'],
          ['@root', './'],
        ],
        extensions: ['.js', '.vue'],
      },
    },
  },
};
