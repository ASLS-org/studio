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
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './src'],
          ['@root', './'],
        ],
      },
    },
  },
};
