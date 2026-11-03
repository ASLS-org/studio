import Capability from '../DMX/capabilityManager.model';
import { PROFILE_SOURCES, buildCapabilityLookup } from './fixture.profile';

/**
 * OFL (Open Fixture Library) JSON to fixture profile adapter.
 *
 * Must stay free of Vue, Three.js and `import.meta` (see fixture.profile.js).
 */

/**
 * Suffix OFL uses for fine channel aliases (e.g. `Pan fine`)
 *
 * @constant {String} FINE_CHANNEL_SPLIT_PATTERN
 */
const FINE_CHANNEL_SPLIT_PATTERN = ' fine';

/**
 * Suffix appended to fine channel type keys (e.g. `PanFine`)
 *
 * @constant {String} FINE_CHANNEL_TERMINOLOGY
 */
const FINE_CHANNEL_TERMINOLOGY = 'Fine';

/**
 * Type key of empty mode slots
 *
 * @constant {String} UNSET_CHANNEL_TYPE
 */
const UNSET_CHANNEL_TYPE = 'Unset';

/**
 * Attribute of channels with no known mapping
 *
 * @constant {String} UNKNOWN_ATTRIBUTE
 */
const UNKNOWN_ATTRIBUTE = 'Unknown';

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
const COLOR_ATTRIBUTES = {
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
 * @returns {{type: String, color: ?String}} Type key and colour
 */
function deriveTypeKey(initialType, isFine, capabilities) {
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
 * @returns {String} Attribute name
 */
function deriveAttribute(channelName, capabilities) {
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

/**
 * Builds one profile channel
 *
 * @param {String} name Channel name
 * @param {Boolean} isFine Whether the channel is a fine channel
 * @param {?Object} channelData OFL channel data
 * @param {Array<Object>} capabilityData OFL capability data, fine retyping applied
 * @returns {Object} Profile channel without fine pairing and qaIndex
 */
function buildChannel(name, isFine, channelData, capabilityData) {
  const { type, color } = deriveTypeKey(name, isFine, capabilityData);
  const capabilities = capabilityData.map((capability) => new Capability(capability));
  return {
    name: isFine ? `${name}${FINE_CHANNEL_TERMINOLOGY}` : name,
    attribute: deriveAttribute(name, capabilityData),
    type,
    color,
    isFine,
    fineChannelAliases: (channelData && channelData.fineChannelAliases) || null,
    fine: [],
    qaIndex: 0,
    capabilities,
    lookup: buildCapabilityLookup(capabilities),
  };
}

/**
 * Builds one profile mode.
 *
 * Reproduces the pre-profile behaviour where a fine channel retypes the single
 * capability of its coarse channel to `<name>Fine` for every later channel of the
 * same mode that uses it.
 *
 * @param {Object} availableChannels OFL available channels
 * @param {Object} mode OFL mode
 * @returns {Object} Profile mode
 */
function buildMode(availableChannels, mode) {
  const retyped = new Set();
  const channels = mode.channels.map((entry) => {
    if (!entry || typeof entry !== 'string') {
      return buildChannel(UNSET_CHANNEL_TYPE, false, null, []);
    }
    const split = entry.split(FINE_CHANNEL_SPLIT_PATTERN);
    const channelName = split[0];
    const isFine = split.length > 1;
    const channelData = availableChannels[channelName];
    if (channelData && channelData.capability && isFine) {
      retyped.add(channelName);
    }
    let capabilityData = [];
    if (channelData && channelData.capability) {
      capabilityData = [retyped.has(channelName)
        ? { ...channelData.capability, type: `${channelName}${FINE_CHANNEL_TERMINOLOGY}` }
        : channelData.capability];
    } else if (channelData && channelData.capabilities) {
      capabilityData = channelData.capabilities;
    }
    return buildChannel(channelName, isFine, channelData, capabilityData);
  });

  channels.forEach((channel) => {
    if (channel.fineChannelAliases && !channel.isFine) {
      channel.fine = channel.fineChannelAliases.flatMap((alias) => {
        const standardizedAlias = alias.replace(' ', '').toLowerCase();
        const index = channels.findIndex(
          (item) => item.type.replace(' ', '').toLowerCase() === standardizedAlias,
        );
        return index > -1 ? [index] : [];
      });
    }
  });

  const typeCounts = {};
  channels.forEach((channel) => {
    channel.qaIndex = typeCounts[channel.type] || 0;
    typeCounts[channel.type] = channel.qaIndex + 1;
  });

  return { name: mode.name, channels };
}

/**
 * Builds a fixture profile from OFL fixture data
 *
 * @public
 * @param {String} manufacturer Manufacturer key in the library
 * @param {String} model Model key in the library (without `.json`)
 * @param {Object} data OFL fixture JSON
 * @returns {Object} Fixture profile (see fixture.profile.js)
 */
export default function profileFromOFL(manufacturer, model, data) {
  const availableChannels = data.availableChannels || {};
  return {
    source: PROFILE_SOURCES.OFL,
    manufacturer,
    model,
    name: data.name,
    category: (data.categories || [])[0] || null,
    physical: data.physical || {},
    wheels: data.wheels || {},
    modes: (data.modes || []).map((mode) => buildMode(availableChannels, mode)),
  };
}
