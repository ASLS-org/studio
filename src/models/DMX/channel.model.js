import { NO_CAPABILITY } from '../fixtures/fixture.profile';

/**
 * Lookup used by channels without a profile (no capability for any value)
 *
 * @constant {Int16Array} EMPTY_LOOKUP
 */
const EMPTY_LOOKUP = new Int16Array(256).fill(NO_CAPABILITY);

/**
 * @class Channel
 * @classdesc Describes a DMX512 fixture channel: one patched fixture's runtime state for a
 * channel of its profile mode. Capabilities and lookup are shared with every fixture of the
 * same type.
 */
class Channel {
  /**
   * Creates an instance of Channel.
   *
   * @param {Object} data Channel data
   * @param {Number} data.id Channel ID (1-based position in the fixture's mode)
   * @param {Object} data.profileChannel Profile channel (see models/fixtures/fixture.profile.js)
   * @param {?String} [data.cell] Name of the fixture's cell holding the channel (see
   * models/fixtures/fixture.cells.js), null for the whole fixture
   * @param {String} [data.kind] Channel kind: its type without its cell's name
   */
  constructor(data) {
    const { profileChannel } = data;
    this.id = data.id;
    this.type = profileChannel.type;
    this.name = profileChannel.name || profileChannel.type;
    this.attribute = profileChannel.attribute;
    this.isFine = profileChannel.isFine;
    this.color = profileChannel.color;
    this.geometry = profileChannel.geometry || null;
    this.cell = data.cell || null; // the fixture's cell holding it, null for the whole fixture
    this.kind = data.kind || profileChannel.type;
    this.capabilities = profileChannel.capabilities;
    this.fineIndexes = profileChannel.fine;
    this.fineChannels = [];
    this.active = true;
    // What goes out on this channel's address (Fixture.setupOutput): the value of the channel at
    // this index of the fixture, reversed (255 - value) when outputInvert is set
    this.outputSource = data.id - 1;
    this.outputInvert = false;
    this._lookup = profileChannel.lookup || EMPTY_LOOKUP;
    // GDTF channels start at the fixture's home value
    this._value = {
      DMX: profileChannel.defaultValue || 0,
      model: 0,
    };
    // Merge state (models/DMX/claims.js), runtime only: its family and its fixture's slot for it
    // (set by Fixture.setupFamilies), the newest writer of a channel with no family, its value
    // when its slot changed hands, and the Intensity level it goes back to at rest
    this.family = -1;
    this.slot = null;
    this.owner = null;
    this.fromValue = 0;
    this.restValue = 0;
    /**
     * What the masters scale on this channel (Fixture.setupFamilies, runtime): 'level' (a dimmer),
     * 'colour' (additive colour on a fixture without a dimmer) or null. A fine channel takes its
     * coarse channel's, and links it as `coarse`
     *
     * @type {?String}
     */
    this.scale = null;
    this.coarse = null;
    /**
     * A value set by hand in the universe view (models/DMX/programmer.js), DMX 0-255, else null.
     * It goes out instead of what playback writes, until cleared. Runtime only.
     *
     * @type {?Number}
     */
    this.programmed = null;
    /**
     * A parked value (Fixture.park), DMX 0-255, else null: it goes out whatever plays, above the
     * programmer. Saved with the show by its fixture.
     *
     * @type {?Number}
     */
    this.parked = null;
  }

  /**
   * The value that goes out: parked, else the programmer's, else what playback wrote
   *
   * @readonly
   * @type {Number}
   */
  get output() {
    if (this.parked !== null) return this.parked;
    if (this.programmed !== null) return this.programmed;
    return this._value.DMX;
  }

  /**
   * Minimum channel value
   *
   * @todo this is a bit dodgy but it seems like the only way to get single capabilities minmax
   * @readonly
   * @type {Number}
   */
  get minVal() {
    return this.capabilities[0].min;
  }

  /**
   * Maximum channel value
   *
   * @todo this is a bit dodgy but it seems like the only way to get single capabilities minmax
   * @readonly
   * @type {Number}
   */
  get maxVal() {
    return this.capabilities[this.capabilities.length - 1].max;
  }

  /**
   * DMX channel value object
   *
   * @type {Object}
   */
  get value() {
    return this._value;
  }

  set value(value) {
    this._value.DMX = value;
  }

  /**
   * Returns capability from provided DMX value
   *
   * @param {Number} DMXValue integer channel value between 0 and 255
   * @return {?Object} capability instance, or null when no capability covers the value
   */
  getCapability(DMXValue) {
    const index = this._lookup[DMXValue];
    return index === undefined || index === NO_CAPABILITY ? null : this.capabilities[index];
  }
}

export default Channel;
