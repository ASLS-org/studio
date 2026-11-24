/**
 * Icon of a fixture channel, for the channels widget.
 *
 * Channels of both sources carry a standard GDTF attribute (OFL ones derive a subset of them, see
 * models/fixtures/channel.types.js; GDTF ones keep the file's), so the rules match GDTF attribute
 * families (`Gobo2PosRotate`, `Shutter1StrobeRandom`...). Then the legacy type keys that have an
 * icon file, then words in the channel name, then a generic channel icon: never a missing file.
 */

/**
 * Names of the icon files (uikit/icons/images)
 *
 * @constant {Set<String>} ICON_FILES
 */
const ICON_FILES = new Set(Object.keys(import.meta.glob('../components/uikit/icons/images/*.svg'))
  .map((path) => path.slice(path.lastIndexOf('/') + 1, -'.svg'.length)));

/**
 * Generic icon, for channels no rule matches
 *
 * @constant {String} GENERIC_CHANNEL_ICON
 */
export const GENERIC_CHANNEL_ICON = 'channel';

/**
 * Colour icons by emitted colour (GDTF colour attribute suffix or OFL colour name)
 *
 * @constant {Object} COLOR_ICONS
 */
const COLOR_ICONS = {
  R: 'colorintensityred',
  Red: 'colorintensityred',
  G: 'colorintensitygreen',
  Green: 'colorintensitygreen',
  B: 'colorintensityblue',
  Blue: 'colorintensityblue',
  C: 'colorintensitycyan',
  Cyan: 'colorintensitycyan',
  M: 'colorintensitymagenta',
  Magenta: 'colorintensitymagenta',
  Y: 'colorintensityyellow',
  Yellow: 'colorintensityyellow',
  W: 'colorintensitywhite',
  White: 'colorintensitywhite',
  WW: 'colorintensitywarmwhite',
  'Warm White': 'colorintensitywarmwhite',
  CW: 'colorintensitycoldwhite',
  'Cold White': 'colorintensitycoldwhite',
  A: 'colorintensityamber',
  RY: 'colorintensityamber',
  Amber: 'colorintensityamber',
  GY: 'colorintensitylime',
  Lime: 'colorintensitylime',
  UV: 'colorintensityuv',
  Indigo: 'colorintensityuv',
};

/**
 * Rules on the GDTF attribute, in order: [pattern, icon]
 *
 * @constant {Array<Array>} ATTRIBUTE_RULES
 */
const ATTRIBUTE_RULES = [
  [/Reset$|^Control\d*$|^FixtureGlobalReset|^LampControl|^DMXInput|^DisplayIntensity|^Function$/,
    'maintenance'],
  [/MSpeed$|^PanTiltSpeed$/, 'speed'],
  [/Mode$|Modes$|Calibration|Consistency|Uniformity|Stability|^ColorControl|^CustomColor|^WhiteCount|^WavelengthCorrection|^ColorSettings/,
    'control'],
  [/^(Dimmer|Intensity)/, 'dimmer'],
  [/^HSB_Brightness|^CIE_Brightness/, 'dimmer'],
  [/^PositionEffect/, 'effect'],
  [/^(XYZ|Rot|Scale)_/, 'move'],
  [/^Pan/, 'pan'],
  [/^Tilt/, 'tilt'],
  [/^(CTO|CTC|CTB|Tint)/, 'colortemperature'],
  [/^HSB_Hue|^VideoHueShift/, 'hueshift'],
  [/^HSB_Saturation|^VideoSaturation/, 'saturation'],
  [/^(HSB|CIE)_/, 'hslwheel'],
  [/^ColorMacro|^ColorMix/, 'colorpreset'],
  [/^Color\d+/, 'colorwheel'],
  [/^Gobo\d+(Pos)?Shake|^Gobo\d+(Select|Wheel)Shake/, 'shake'],
  [/^Gobo\d+(Pos(Rotate)?|WheelSpin|SelectSpin)$/, 'goborotation'],
  [/^Gobo\d+/, 'gobowheel'],
  [/^Animation/, 'animation'],
  [/^Shutter\d+Strobe|^Strobe/, 'strobe'],
  [/^Shutter\d+/, 'shutter'],
  [/^Iris/, 'iris'],
  [/^Frost/, 'frost'],
  [/^Prism\d+(Pos|PosRotate|SelectSpin)$/, 'prismrotation'],
  [/^Prism/, 'prism'],
  [/^Effects\d+(Rate|Fade)$/, 'speed'],
  [/^Effects\d+(Pos|PosRotate)$/, 'goborotation'],
  [/^Effects/, 'effect'],
  [/^(BeamShaper|Blade|Shaper|KeyStone)/, 'shaper'],
  [/^(Digital)?Zoom/, 'zoom'],
  [/^Focus/, 'focus'],
  [/^(Fog|Haze)/, 'fog'],
  [/^(Fan|Blower)/, 'fan'],
  [/^Video/, 'visualizer'],
];

/**
 * Rules on the channel name (case-insensitive), in order: [pattern, icon]
 *
 * @constant {Array<Array>} NAME_RULES
 */
const NAME_RULES = [
  [/\bwarm ?white\b|\bww\b/, 'colorintensitywarmwhite'],
  [/\bcold ?white\b|\bcool ?white\b|\bcw\b/, 'colorintensitycoldwhite'],
  [/\bred\b/, 'colorintensityred'],
  [/\bgreen\b/, 'colorintensitygreen'],
  [/\bblue\b/, 'colorintensityblue'],
  [/\bwhite\b/, 'colorintensitywhite'],
  [/\bamber\b/, 'colorintensityamber'],
  [/\blime\b/, 'colorintensitylime'],
  [/\buv\b|\bindigo\b/, 'colorintensityuv'],
  [/\bcyan\b/, 'colorintensitycyan'],
  [/\bmagenta\b/, 'colorintensitymagenta'],
  [/\byellow\b/, 'colorintensityyellow'],
  [/reset|maintenance|lamp|reserved|control|setting/, 'maintenance'],
  [/strobe|flash/, 'strobe'],
  [/shutter/, 'shutter'],
  [/temperature|\bcto\b|\bctb\b|\bctc\b|kelvin/, 'colortemperature'],
  [/\bhue\b/, 'hueshift'],
  [/saturation/, 'saturation'],
  [/speed|\brate\b|\btime\b|duration|fade/, 'speed'],
  [/dimmer|intensity|master|brightness/, 'dimmer'],
  [/macro|program|preset|chase|scene|auto|sound|music/, 'macro'],
  [/mode|function|curve/, 'control'],
  [/zoom/, 'zoom'],
  [/focus/, 'focus'],
  [/iris/, 'iris'],
  [/frost/, 'frost'],
  [/prism/, 'prism'],
  [/gobo/, 'gobowheel'],
  [/colou?r/, 'colorwheel'],
  [/\bpan\b/, 'pan'],
  [/\btilt\b/, 'tilt'],
  [/rotat|spin/, 'goborotation'],
  [/shake/, 'shake'],
  [/fog|haze|smoke/, 'fog'],
  [/\bfan\b|blower/, 'fan'],
  [/blade|shaper/, 'shaper'],
  [/effect|\bfx\b/, 'effect'],
];

/**
 * Icon of a colour attribute (`ColorAdd_R`, `ColorSub_C`, `ColorRGB_Red`...), or null
 *
 * @param {String} attribute GDTF attribute
 * @returns {?String} Icon name
 */
function colorAttributeIcon(attribute) {
  const match = /^Color(Add|Sub|RGB)_([A-Za-z]+)$/.exec(attribute);
  if (!match) return null;
  return COLOR_ICONS[match[2]] || 'colorintensity';
}

/**
 * Icon from the legacy type key, as the widget built it before, when that file exists
 *
 * @param {Object} channel Channel row (`type`, `color`)
 * @returns {?String} Icon name
 */
function typeIcon(channel) {
  const type = String(channel.type || '');
  const name = type === 'Color'
    ? `${type}intensity${channel.color || ''}`.toLowerCase().replace(/ /g, '')
    : type.toLowerCase().replace(/ /g, '').replace(/fine$/, '');
  return name && ICON_FILES.has(name) ? name : null;
}

/**
 * Icon name of a channel
 *
 * @public
 * @param {Object} channel Channel row or Channel: `attribute`, `type`, `color` and `name`
 * @returns {String} Name of an existing icon file
 */
export default function channelIcon(channel) {
  const attribute = String(channel.attribute || '');
  let icon = colorAttributeIcon(attribute);
  if (!icon && channel.color && COLOR_ICONS[channel.color]) icon = COLOR_ICONS[channel.color];
  if (!icon && attribute && attribute !== 'Unknown' && attribute !== 'NoFeature') {
    const rule = ATTRIBUTE_RULES.find(([pattern]) => pattern.test(attribute));
    icon = rule ? rule[1] : null;
  }
  if (!icon) icon = typeIcon(channel);
  if (!icon) {
    const name = String(channel.name || channel.type || '').toLowerCase();
    const rule = NAME_RULES.find(([pattern]) => pattern.test(name));
    icon = rule ? rule[1] : null;
  }
  return icon && ICON_FILES.has(icon) ? icon : GENERIC_CHANNEL_ICON;
}
