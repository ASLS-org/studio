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
   */
  constructor(data) {
    const { profileChannel } = data;
    this.id = data.id;
    this.type = profileChannel.type;
    this.attribute = profileChannel.attribute;
    this.isFine = profileChannel.isFine;
    this.color = profileChannel.color;
    this.capabilities = profileChannel.capabilities;
    this.fineIndexes = profileChannel.fine;
    this.fineChannels = [];
    this.active = true;
    this._lookup = profileChannel.lookup || EMPTY_LOOKUP;
    this._value = {
      DMX: 0,
      model: 0,
    };
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
