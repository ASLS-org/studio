
import { create } from '@storybook/theming';

/*
{ name: 'primary-dark', value: '#161913' },
{ name: 'primary-dark-alt', value: '#131510' },
{ name: 'primary-light', value: '#161913' },
{ name: 'primary-light-alt', value: '#1c1f18' },
{ name: 'primary-lighter', value: '#2e302b4d' },
{ name: 'primary-lighter-alt', value: '#22251f' },
*/
//
export default create({
  base: 'dark',
  brandTitle: 'ASLS Studio storybook',
  brandUrl: 'https://asls.studio.timekadel.com',
  brandImage: '/images/asls.logo.white.png',
  brandTarget: '_self',

  colorPrimary: 'hotpink',
  colorSecondary: '#4a47b4',

  // UI
  appBg: '#1c1f18',
  appContentBg: '#161913',
  appBorderColor: '#2e302b4d',
  appBorderRadius: 0,

  // Typography
  fontBase: '"Roboto", sans-serif',
  fontCode: 'monospace',

  //inputs
  inputBg: '#1c1f18'

});
