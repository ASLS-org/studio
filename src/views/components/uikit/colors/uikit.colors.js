const documentStyle = getComputedStyle(document.documentElement);
/*
 * Full color palette
 */
export default {
  Maroon: documentStyle.getPropertyValue('--accent-maroon'),
  Pink: documentStyle.getPropertyValue('--accent-pink'),
  Violet: documentStyle.getPropertyValue('--accent-violet'),
  Purple: documentStyle.getPropertyValue('--accent-purple'),
  DarkPurple: documentStyle.getPropertyValue('--accent-dark-purple'),
  Blue: documentStyle.getPropertyValue('--accent-blue'),
  LightBlue: documentStyle.getPropertyValue('--accent-light-blue'),
  Teal: documentStyle.getPropertyValue('--accent-teal'),
  SeaGreen: documentStyle.getPropertyValue('--accent-sea-green'),
  Green: documentStyle.getPropertyValue('--accent-green'),
  LightGreen: documentStyle.getPropertyValue('--accent-light-green'),
  Gold: documentStyle.getPropertyValue('--accent-gold'),
  Orange: documentStyle.getPropertyValue('--accent-orange'),
  Red: documentStyle.getPropertyValue('--accent-red'),
};
