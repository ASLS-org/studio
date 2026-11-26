/**
 * Channel families: what a channel does on stage, from its fixture attribute (GDTF names, which
 * the OFL and GDTF adapters both give). A group holds one cue per family at a time (claims.js),
 * and cues are made for one family, or Custom for several.
 *
 * @module families
 */

/**
 * Family indexes (a set of families is an array of FAMILY_COUNT booleans, by index)
 *
 * @constant {Object} FAMILIES
 * @enum {Number}
 */
export const FAMILIES = {
  INTENSITY: 0,
  COLOUR: 1,
  POSITION: 2,
  BEAM: 3,
};

/**
 * Number of families
 *
 * @constant {Number} FAMILY_COUNT
 */
export const FAMILY_COUNT = 4;

/**
 * A cue's family keys (saved in showfiles), in family index order: a cue sets one family
 *
 * @constant {Array<String>} FAMILY_KEYS
 */
export const FAMILY_KEYS = ['intensity', 'colour', 'position', 'beam'];

/**
 * The key older shows saved for a Look, a cue spread over several families: such a cue is split
 * into one cue per family on load (Group.loadCues)
 *
 * @constant {String} LOOK_FAMILY
 */
export const LOOK_FAMILY = 'custom';

/**
 * Families by attribute, in order: [family index, pattern]. Speeds, controls, fog and the like
 * match none
 *
 * @constant {Array<Array>} ATTRIBUTE_FAMILIES
 */
const ATTRIBUTE_FAMILIES = [
  [-1, /MSpeed$|^PanTiltSpeed$|Rate$|Fade$/],
  [FAMILIES.INTENSITY, /^(Dimmer|Intensity)|^(HSB|CIE)_Brightness|^Shutter|^Strobe/],
  [FAMILIES.COLOUR,
    /^Color(Add|Sub|RGB)_|^Color\d|^(CTO|CTC|CTB|Tint)|^HSB_(Hue|Saturation)|^CIE_|^ColorMacro|^ColorMix/],
  [FAMILIES.POSITION, /^Pan|^Tilt|^XYZ_/],
  [FAMILIES.BEAM,
    /Zoom|^Focus|^Gobo|^Prism|^Iris|^Frost|^(BeamShaper|Blade|Shaper|KeyStone)|^Animation|^Effects\d/],
];

/**
 * The family of a channel attribute, -1 for none
 *
 * @param {?String} attribute GDTF attribute name
 * @returns {Number} family index, or -1
 */
export function familyOfAttribute(attribute) {
  if (!attribute) return -1;
  for (let i = 0; i < ATTRIBUTE_FAMILIES.length; i++) {
    if (ATTRIBUTE_FAMILIES[i][1].test(attribute)) return ATTRIBUTE_FAMILIES[i][0];
  }
  return -1;
}

/**
 * The family of a fixture channel (fine channels follow their coarse one: -1 here)
 *
 * @param {Object} channel fixture channel
 * @returns {Number} family index, or -1
 */
export function familyOf(channel) {
  if (!channel || channel.isFine) return -1;
  return familyOfAttribute(channel.attribute);
}

/**
 * The index of a family key, -1 for an unknown key
 *
 * @param {String} key family key
 * @returns {Number}
 */
export function familyIndex(key) {
  return FAMILY_KEYS.indexOf(key);
}

/**
 * The family of a fixture's channel by index: a fine channel follows its coarse channel
 *
 * @param {Array<Object>} channels the fixture's channels
 * @param {Number} index channel index
 * @returns {Number} family index, -1 for none
 */
export function familyAt(channels, index) {
  const channel = channels[index];
  if (!channel) return -1;
  if (!channel.isFine) return channel.family ?? familyOf(channel);
  const coarse = channels.find((c) => c.fineChannels && c.fineChannels.includes(channel));
  return coarse ? coarse.family ?? familyOf(coarse) : -1;
}

/**
 * An empty set of families (one boolean per family index)
 *
 * @returns {Array<Boolean>}
 */
export function noFamilies() {
  return [false, false, false, false];
}

/**
 * The keys of the families in a set, in family order
 *
 * @param {Array<Boolean>} set one boolean per family index
 * @returns {Array<String>}
 */
export function familyKeys(set) {
  const keys = [];
  for (let i = 0; i < FAMILY_COUNT; i++) if (set[i]) keys.push(FAMILY_KEYS[i]);
  return keys;
}
