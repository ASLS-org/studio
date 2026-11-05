/**
 * Channel naming shared by every source adapter: the channel `type` key derivation and the
 * standard (GDTF) attribute of a channel, both from OFL-shaped capability data.
 *
 * Channel `type` keys and their index are stored in showfile scenes, so these rules must not
 * change. Must stay free of Vue, Three.js and `import.meta` (see fixture.profile.js).
 */

/**
 * Suffix appended to fine channel type keys (e.g. `PanFine`)
 *
 * @constant {String} FINE_CHANNEL_TERMINOLOGY
 */
export const FINE_CHANNEL_TERMINOLOGY = 'Fine';

/**
 * Attribute of channels with no known mapping
 *
 * @constant {String} UNKNOWN_ATTRIBUTE
 */
export const UNKNOWN_ATTRIBUTE = 'Unknown';

/**
 * OFL capability types used to derive channel type keys.
 *
 * Copied verbatim from the pre-profile Channel model, including the misspelled
 * `ColorTepemrature` key: the type keys are stored in showfile scenes, so the
 * derivation must not change. `LEGACY_CAPABILITY_TYPES.ColorTemperature` is
 * therefore undefined on purpose.
 *
 * @constant {Object} LEGACY_CAPABILITY_TYPES
 */
const LEGACY_CAPABILITY_TYPES = {
  ShutterStrobe: 'ShutterStrobe',
  StrobeSpeed: 'StrobeSpeed',
  StrobeDuration: 'StrobeDuration',
  Intensity: 'Intensity',
  ColorIntensity: 'ColorIntensity',
  ColorPreset: 'ColorPreset',
  ColorTepemrature: 'ColorTepemrature',
  Pan: 'Pan',
  PanFine: 'PanFine',
  PanContinuous: 'PanContinuous',
  Tilt: 'Tilt',
  TiltFine: 'TiltFine',
  TiltContinuous: 'TiltContinuous',
  BeamAngle: 'BeamAngle',
  Zoom: 'Zoom',
  Effect: 'Effect',
  EffectSpeed: 'EffectSpeed',
  EffectDuration: 'EffectDuration',
  EffectParameter: 'EffectParameter',
  SoundSensitivity: 'SoundSensitivity',
  Focus: 'Focus',
  Maintenance: 'Maintenance',
};

/**
 * Channel type key rules, applied in order for every capability of a channel (last match wins)
 *
 * @constant {Array<Array>} LEGACY_TYPE_RULES
 */
const LEGACY_TYPE_RULES = [
  [[LEGACY_CAPABILITY_TYPES.ShutterStrobe, LEGACY_CAPABILITY_TYPES.StrobeDuration,
    LEGACY_CAPABILITY_TYPES.StrobeSpeed], 'Shutter'],
  [[LEGACY_CAPABILITY_TYPES.Intensity], 'Dimmer'],
  [[LEGACY_CAPABILITY_TYPES.ColorIntensity], 'Color'],
  [[LEGACY_CAPABILITY_TYPES.ColorPreset], 'ColorPreset'],
  [[LEGACY_CAPABILITY_TYPES.ColorTemperature], 'ColorTemp'],
  [[LEGACY_CAPABILITY_TYPES.Pan, LEGACY_CAPABILITY_TYPES.PanFine], 'Pan'],
  [[LEGACY_CAPABILITY_TYPES.Tilt, LEGACY_CAPABILITY_TYPES.TiltFine], 'Tilt'],
  [[LEGACY_CAPABILITY_TYPES.PanContinuous], 'PanContinuous'],
  [[LEGACY_CAPABILITY_TYPES.TiltContinuous], 'TiltContinuous'],
  [[LEGACY_CAPABILITY_TYPES.BeamAngle, LEGACY_CAPABILITY_TYPES.Zoom], 'Zoom'],
  [[LEGACY_CAPABILITY_TYPES.Effect, LEGACY_CAPABILITY_TYPES.EffectDuration,
    LEGACY_CAPABILITY_TYPES.EffectSpeed, LEGACY_CAPABILITY_TYPES.EffectParameter,
    LEGACY_CAPABILITY_TYPES.SoundSensitivity], 'Effect'],
  [[LEGACY_CAPABILITY_TYPES.Focus], 'Focus'],
  [[LEGACY_CAPABILITY_TYPES.Maintenance], 'Maintenance'],
];

/**
 * OFL capability type to standard (GDTF) attribute
 *
 * @constant {Object} ATTRIBUTES_BY_CAPABILITY
 */
const ATTRIBUTES_BY_CAPABILITY = {
  Intensity: 'Dimmer',
  ShutterStrobe: 'Shutter1',
  StrobeSpeed: 'Shutter1Strobe',
  StrobeDuration: 'Shutter1Strobe',
  ColorPreset: 'ColorMacro1',
  ColorTemperature: 'CTO',
  Pan: 'Pan',
  PanFine: 'Pan',
  Tilt: 'Tilt',
  TiltFine: 'Tilt',
  PanContinuous: 'PanRotate',
  TiltContinuous: 'TiltRotate',
  PanTiltSpeed: 'PositionMSpeed',
  WheelSlotRotation: 'Gobo1PosRotate',
  WheelShake: 'Gobo1PosShake',
  Zoom: 'Zoom',
  BeamAngle: 'Zoom',
  Focus: 'Focus1',
  Prism: 'Prism1',
  PrismRotation: 'Prism1PosRotate',
  Iris: 'Iris',
  Frost: 'Frost1',
  Effect: 'Effects1',
  EffectSpeed: 'Effects1Rate',
  EffectDuration: 'Effects1Rate',
  EffectParameter: 'Effects1Adjust1',
  Maintenance: 'Control1',
};

/**
 * OFL colour intensity colour to standard (GDTF) attribute
 *
 * @constant {Object} COLOR_ATTRIBUTES
 */
export const COLOR_ATTRIBUTES = {
  Red: 'ColorAdd_R',
  Green: 'ColorAdd_G',
  Blue: 'ColorAdd_B',
  White: 'ColorAdd_W',
  'Warm White': 'ColorAdd_WW',
  'Cold White': 'ColorAdd_CW',
  Amber: 'ColorAdd_A',
  UV: 'ColorAdd_UV',
  Cyan: 'ColorSub_C',
  Magenta: 'ColorSub_M',
  Yellow: 'ColorSub_Y',
};

/**
 * Derives a channel's type key and colour exactly as the pre-profile Channel model did
 *
 * @param {String} initialType Channel name (or `Unset`)
 * @param {Boolean} isFine Whether the channel is a fine channel
 * @param {Array<Object>} capabilities OFL capability data
 * @public
 * @returns {{type: String, color: ?String}} Type key and colour
 */
export function deriveTypeKey(initialType, isFine, capabilities) {
  let type = initialType;
  let color = null;
  capabilities.forEach((capability) => {
    LEGACY_TYPE_RULES.forEach(([capabilityTypes, key]) => {
      type = capabilityTypes.includes(capability.type) ? key : type;
    });
    type = isFine ? `${type}${FINE_CHANNEL_TERMINOLOGY}` : type;
    if (type === 'Color') {
      color = capability.color;
    }
  });
  return { type, color: color ?? null };
}

/**
 * Picks a channel's standard attribute from its first mappable capability
 *
 * @param {String} channelName Channel name, used to tell colour and gobo wheels apart
 * @param {Array<Object>} capabilities OFL capability data
 * @public
 * @returns {String} Attribute name
 */
export function deriveAttribute(channelName, capabilities) {
  for (let i = 0; i < capabilities.length; i++) {
    const capability = capabilities[i];
    if (capability.type === 'ColorIntensity' && COLOR_ATTRIBUTES[capability.color]) {
      return COLOR_ATTRIBUTES[capability.color];
    }
    if (capability.type === 'WheelSlot') {
      const wheel = capability.wheel || channelName;
      if (/gobo/i.test(wheel)) return 'Gobo1';
      if (/colou?r/i.test(wheel)) return 'Color1';
    }
    if (ATTRIBUTES_BY_CAPABILITY[capability.type]) {
      return ATTRIBUTES_BY_CAPABILITY[capability.type];
    }
  }
  return UNKNOWN_ATTRIBUTE;
}
