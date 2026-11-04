import Capability from '../DMX/capabilityManager.model';
import { PROFILE_SOURCES, buildCapabilityLookup } from './fixture.profile';
import { FINE_CHANNEL_TERMINOLOGY, deriveTypeKey, deriveAttribute } from './channel.types';

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
 * Type key of empty mode slots
 *
 * @constant {String} UNSET_CHANNEL_TYPE
 */
const UNSET_CHANNEL_TYPE = 'Unset';

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
