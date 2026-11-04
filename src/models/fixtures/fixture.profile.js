/**
 * Internal fixture profile shared by every fixture source (OFL, GDTF).
 *
 * Profiles are plain, immutable data built once per fixture type by an adapter
 * (see ofl.adapter.js, gdtf.adapter.js) and shared by every patched instance of that type. This
 * module must stay free of Vue, Three.js and `import.meta` so adapters can run in
 * Node or a worker.
 */

/**
 * @typedef {Object} ProfileChannel
 * @property {String} name Channel name as defined by the source
 * @property {String} attribute Standard attribute name (GDTF vocabulary, e.g. `Dimmer`, `Pan`)
 * @property {String} type Channel type key used by quick accessors and stored in showfile
 * scenes. Must stay stable for existing showfiles
 * @property {?String} color Emitted colour of colour intensity channels (e.g. `Red`)
 * @property {Boolean} isFine Whether the channel is the fine byte of another channel
 * @property {Array<Number>} fine Indexes (within the mode) of this channel's fine channels
 * @property {Number} qaIndex Index of the channel among the mode's channels of the same type
 * @property {Array<Object>} capabilities Capability instances (see capabilityManager.model.js)
 * @property {Int16Array} lookup Capability index for each DMX value 0-255, NO_CAPABILITY if none
 * @property {?String} geometry Name of the geometry node the channel drives (see GeometryNode),
 * null for the whole fixture
 */

/**
 * @typedef {Object} GeometryNode
 * @property {String} name Unique node name; channels refer to it by `geometry`
 * @property {String} kind `body`, `axis` or `beam`
 * @property {Array<Number>} matrix 4×4 placement relative to the parent, row-major, meters
 * @property {Array<Number>} size Length, width and height in meters (0 when unknown)
 * @property {?String} shape Source shape hint (GDTF primitive type), or null
 * @property {?Object} beam Beam data on `beam` nodes: `beamAngle`, `fieldAngle` (degrees),
 * `radius` (m), `type` (GDTF beam type), `flux` (lm), `colorTemperature` (K)
 * @property {Array<GeometryNode>} children Child nodes
 */

/**
 * @typedef {Object} ProfileMode
 * @property {String} name Mode name
 * @property {Array<ProfileChannel>} channels Channels in DMX order
 * @property {?GeometryNode} geometry Geometry tree of the mode (GDTF), or null
 */

/**
 * @typedef {Object} FixtureProfile
 * @property {String} source Profile source, one of PROFILE_SOURCES
 * @property {String} manufacturer Manufacturer key in the source library
 * @property {String} model Model key in the source library
 * @property {String} name Display name
 * @property {?String} category Main fixture category (e.g. `Moving Head`)
 * @property {Object} physical Physical data (lens, bulb, dimensions) as given by the source
 * @property {Object} wheels Wheel definitions keyed by wheel name
 * @property {Array<ProfileMode>} modes Available modes
 * @property {?Object} gdtf GDTF identity: `fixtureTypeId`, `revision`, `dataVersion`
 */

/**
 * Profile sources
 *
 * @constant {Object} PROFILE_SOURCES
 * @enum {String}
 */
export const PROFILE_SOURCES = {
  OFL: 'ofl',
  GDTF: 'gdtf',
};

/**
 * Lookup value for DMX values that match no capability
 *
 * @constant {Number} NO_CAPABILITY
 */
export const NO_CAPABILITY = -1;

const DMX_VALUE_COUNT = 256;

/**
 * Builds the DMX value to capability index table of a channel. The first
 * capability whose range contains a value wins, as before profiles existed.
 *
 * @public
 * @param {Array<Object>} capabilities Capabilities with a `range` of [start, end]
 * @returns {Int16Array} Capability index per DMX value
 */
export function buildCapabilityLookup(capabilities) {
  const lookup = new Int16Array(DMX_VALUE_COUNT).fill(NO_CAPABILITY);
  for (let value = 0; value < DMX_VALUE_COUNT; value++) {
    for (let i = 0; i < capabilities.length; i++) {
      const { range } = capabilities[i];
      if (range[0] <= value && range[1] >= value) {
        lookup[value] = i;
        break;
      }
    }
  }
  return lookup;
}

/**
 * Resolves a mode reference (name, or index from older callers) to a mode name.
 * Unknown or missing references resolve to the first mode.
 *
 * @public
 * @param {FixtureProfile} profile Fixture profile
 * @param {String|Number} [mode] Mode name or index
 * @returns {String} Mode name
 */
export function resolveModeName(profile, mode) {
  const { modes } = profile;
  if (typeof mode === 'string' && modes.some((m) => m.name === mode)) {
    return mode;
  }
  if (Number.isInteger(mode) && modes[mode]) {
    return modes[mode].name;
  }
  return modes[0].name;
}
