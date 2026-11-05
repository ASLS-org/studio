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
 * @param {?String} [pixel] Pixel key or pixel group of a matrix channel, null otherwise
 * @returns {Object} Profile channel without fine pairing and qaIndex
 */
function buildChannel(name, isFine, channelData, capabilityData, pixel = null) {
  const derived = deriveTypeKey(name, isFine, capabilityData);
  const capabilities = capabilityData.map((capability) => new Capability(capability));
  // Pixel channels keep their name as type key, as before they had capabilities, so saved
  // scenes still find them
  const type = pixel === null ? derived.type : name;
  const colorCapability = capabilityData.find((c) => c.type === 'ColorIntensity');
  let { color } = derived;
  if (pixel !== null) color = colorCapability ? colorCapability.color || null : null;
  return {
    name: isFine ? `${name}${FINE_CHANNEL_TERMINOLOGY}` : name,
    attribute: deriveAttribute(name, capabilityData),
    type,
    color,
    geometry: pixel,
    isFine,
    fineChannelAliases: (channelData && channelData.fineChannelAliases) || null,
    fine: [],
    qaIndex: 0,
    capabilities,
    lookup: buildCapabilityLookup(capabilities),
  };
}

/**
 * Pixel keys of an OFL matrix with their position on the grid
 *
 * @param {?Object} matrix OFL matrix
 * @returns {Array<{key: String, x: Number, y: Number, z: Number}>} Pixels
 */
function matrixPixels(matrix) {
  const pixels = [];
  if (!matrix) return pixels;
  if (matrix.pixelKeys) {
    matrix.pixelKeys.forEach((layer, z) => layer.forEach((row, y) => row.forEach((key, x) => {
      if (key) {
        pixels.push({
          key, x, y, z,
        });
      }
    })));
  } else if (matrix.pixelCount) {
    const [nx, ny, nz] = matrix.pixelCount;
    const dimensions = matrix.pixelCount.filter((n) => n > 1).length;
    for (let z = 0; z < nz; z++) {
      for (let y = 0; y < ny; y++) {
        for (let x = 0; x < nx; x++) {
          let key = `${x + y + z + 1}`;
          if (dimensions === 2) key = nz > 1 ? `(${x + 1}, ${z + 1})` : `(${x + 1}, ${y + 1})`;
          if (dimensions === 2 && nx === 1) key = `(${y + 1}, ${z + 1})`;
          if (dimensions === 3) key = `(${x + 1}, ${y + 1}, ${z + 1})`;
          pixels.push({
            key, x, y, z,
          });
        }
      }
    }
  }
  return pixels;
}

/**
 * Pixel groups of an OFL matrix (arrays of keys; `all` and constraint groups take every pixel)
 *
 * @param {?Object} matrix OFL matrix
 * @param {Array<Object>} pixels Matrix pixels
 * @returns {Object} Pixel keys by group name
 */
function matrixGroups(matrix, pixels) {
  const groups = {};
  Object.entries((matrix && matrix.pixelGroups) || {}).forEach(([name, group]) => {
    groups[name] = Array.isArray(group) ? group : pixels.map((p) => p.key);
  });
  return groups;
}

/**
 * Pixel keys a matrix insert block repeats for, in order
 *
 * @param {String|Array<String>} repeatFor Keys, groups, or an `eachPixel...` / `eachPixelGroup`
 * order
 * @param {Array<Object>} pixels Matrix pixels
 * @param {Object} groups Pixel groups
 * @returns {Array<String>} Pixel keys or group names
 */
function repeatKeys(repeatFor, pixels, groups) {
  if (Array.isArray(repeatFor)) return repeatFor;
  if (repeatFor === 'eachPixelGroup') return Object.keys(groups);
  if (repeatFor === 'eachPixelABC') {
    return pixels.map((p) => p.key)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }
  const order = /^eachPixel([XYZ]{3})$/.exec(repeatFor || '');
  if (!order) return pixels.map((p) => p.key);
  // The first letter changes fastest
  const axes = order[1].toLowerCase().split('').reverse();
  return pixels.slice().sort((a, b) => {
    for (let i = 0; i < axes.length; i++) {
      const d = a[axes[i]] - b[axes[i]];
      if (d) return d;
    }
    return 0;
  }).map((p) => p.key);
}

/**
 * Expands a mode's channel list: matrix insert blocks become one entry per pixel and template
 * channel (`perPixel` or `perChannel` order)
 *
 * @param {Array} entries OFL mode channel entries
 * @param {Array<Object>} pixels Matrix pixels
 * @param {Object} groups Pixel groups
 * @returns {Array<?String>} Channel names (null for empty slots)
 */
function expandEntries(entries, pixels, groups) {
  return entries.flatMap((entry) => {
    if (!entry || typeof entry === 'string') return [entry || null];
    if (entry.insert !== 'matrixChannels') return [null];
    const keys = repeatKeys(entry.repeatFor, pixels, groups);
    const templates = entry.templateChannels || [];
    const name = (template, key) => (template ? template.replace(/\$pixelKey/g, key) : null);
    if (entry.channelOrder === 'perChannel') {
      return templates.flatMap((t) => keys.map((k) => name(t, k)));
    }
    return keys.flatMap((k) => templates.map((t) => name(t, k)));
  });
}

/**
 * Template channels of a matrix fixture, expanded for every pixel key and group name
 *
 * @param {Object} templateChannels OFL template channels
 * @param {Array<String>} keys Pixel keys and group names
 * @returns {Map<String, {data: Object, pixel: String}>} Channel data and pixel by channel name
 */
function expandTemplates(templateChannels, keys) {
  const expanded = new Map();
  Object.entries(templateChannels || {}).forEach(([template, data]) => {
    keys.forEach((key) => {
      const json = JSON.stringify(data).replace(/\$pixelKey/g, key.replace(/"/g, '\\"'));
      expanded.set(template.replace(/\$pixelKey/g, key), { data: JSON.parse(json), pixel: key });
    });
  });
  return expanded;
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
 * @param {Object} matrix Matrix pixels, groups and expanded template channels
 * @returns {Object} Profile mode
 */
function buildMode(availableChannels, mode, matrix) {
  const retyped = new Set();
  const entries = expandEntries(mode.channels, matrix.pixels, matrix.groups);
  const channels = entries.map((entry) => {
    if (!entry) {
      return buildChannel(UNSET_CHANNEL_TYPE, false, null, []);
    }
    const split = entry.split(FINE_CHANNEL_SPLIT_PATTERN);
    const channelName = split[0];
    const isFine = split.length > 1;
    const template = availableChannels[channelName] ? null : matrix.templates.get(channelName);
    const channelData = template ? template.data : availableChannels[channelName];
    const pixel = template ? template.pixel : null;
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
    return buildChannel(channelName, isFine, channelData, capabilityData, pixel);
  });

  channels.forEach((channel) => {
    if (channel.fineChannelAliases && !channel.isFine) {
      channel.fine = channel.fineChannelAliases.flatMap((alias) => {
        const standardizedAlias = alias.replace(' ', '').toLowerCase();
        let index = channels.findIndex(
          (item) => item.type.replace(' ', '').toLowerCase() === standardizedAlias,
        );
        // A template channel's alias names its pixel by `$pixelKey`: find the expanded entry
        if (index < 0 && channel.geometry) {
          index = entries.indexOf(alias.replace(/\$pixelKey/g, channel.geometry));
        }
        return index > -1 ? [index] : [];
      });
    }
  });

  const typeCounts = {};
  channels.forEach((channel) => {
    channel.qaIndex = typeCounts[channel.type] || 0;
    typeCounts[channel.type] = channel.qaIndex + 1;
  });

  // Modes with insert blocks used to drop their pixel channels (see Fixture.footprintChanged)
  const matrixInserts = mode.channels.some((entry) => entry && typeof entry === 'object');
  return { name: mode.name, channels, matrixInserts };
}

/**
 * Builds a fixture profile from OFL fixture data
 *
 * @public
 * @param {String} manufacturer Manufacturer key in the library
 * @param {String} model Model key in the library (without `.json`)
 * @param {Object} data OFL fixture JSON
 * @returns {Object} Fixture profile (see fixture.profile.js); matrix fixtures also carry
 * `matrix` (pixels on their grid and pixel groups)
 */
export default function profileFromOFL(manufacturer, model, data) {
  const availableChannels = data.availableChannels || {};
  const pixels = matrixPixels(data.matrix);
  const groups = matrixGroups(data.matrix, pixels);
  const templates = expandTemplates(
    data.templateChannels,
    pixels.map((p) => p.key).concat(Object.keys(groups)),
  );
  const matrix = { pixels, groups, templates };
  return {
    source: PROFILE_SOURCES.OFL,
    manufacturer,
    model,
    name: data.name,
    category: (data.categories || [])[0] || null,
    physical: data.physical || {},
    wheels: data.wheels || {},
    modes: (data.modes || []).map((mode) => ({
      ...buildMode(availableChannels, mode, matrix),
      geometry: null,
    })),
    matrix: pixels.length ? { pixels, groups } : null,
  };
}
