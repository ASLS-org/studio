import ukColors from '@/views/components/uikit/colors/uikit.colors';
import FixturePool from './fixture.pool.model';
import EventBus from '../../plugins/eventbus';
import { scaledLevel } from './master.model';

/**
 * DMX512 universe length
 *
 * @constant {Number} DMX_UNIVERSE_LENGTH
 */
const DMX_UNIVERSE_LENGTH = 512;

/**
 * Minimum universe ID
 *
 * @constant {Number} DMX_UNIVERSE_LENGTH
 */
const MIN_UNIVERSE_ID = 0;
/**
 * Maximum universe ID
 *
 * @constant {Number} DMX_UNIVERSE_LENGTH
 */
const MAX_UNIVERSE_ID = 65535;
/**
 * Universe channels lengh
 *
 * @constant {Number} DMX_UNIVERSE_CHANNELS_LENGTH
 */
const DMX_UNIVERSE_CHANNELS_LENGTH = 512;

/**
 * Default universe data
 *
 * @constant {Object} DEFAULT_UNIVERSE_DATA
 * @todo remove this ?
 */
const DEFAULT_UNIVERSE_DATA = {
  name: 'Universe',
};

/**
 * @class Universe
 * @classdesc Universes are a set of DMX compatible fixtures connected to the same.
 * DMX daisy chain using the same set of 512 DMX channels
 */
class Universe {
  /**
   * Creates an instance of Universe.
   *
   * @param {*} [data={}]
   * @param {Number} data.id Universe ID
   * @param {String} data.name Universe name
   * @param {String} data.color Universe color string
   * @memberof Universe
   */
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.color = data.color;
    this._patch = {};
    this._addressMap = new Array(DMX_UNIVERSE_LENGTH).fill(undefined);
    this._dmxBuffer = new Uint8Array(DMX_UNIVERSE_CHANNELS_LENGTH);
    this.fixturePool = new FixturePool();
  }

  /**
   * Universe color string
   *
   * @memberof Universe
   */
  set color(color) {
    this._color = color;
  }

  get color() {
    return this._color
      || ukColors[Object.keys(ukColors)[(this.id * 3) % Object.keys(ukColors).length]];
  }

  /**
   * Universe name
   *
   * @memberof Universe
   */
  set name(name) {
    this._name = name;
  }

  get name() {
    return this._name || `${DEFAULT_UNIVERSE_DATA.name} ${this.id}`;
  }

  /**
   * Universe ID, set once when the universe is created or loaded (unique in the show; it is
   * also the universe number its output sends to). Its fixtures follow it (their `universe`
   * number).
   *
   * @memberof Universe
   */
  set id(id) {
    this._id = Math.min(Math.max(parseInt(id, 10), MIN_UNIVERSE_ID), MAX_UNIVERSE_ID);
    this.fixturePool?.fixtures.forEach((fixture) => { fixture.universe = this._id; });
  }

  get id() {
    return this._id;
  }

  /**
   * Universe simplified channel set
   *
   * @memberof Universe
   */
  set simplifiedChannels(channels) {
    channels.forEach((channelData) => {
      const fixtureAddress = this._addressMap[channelData.id - 1];
      const fixtureChannel = channelData.id - fixtureAddress - 1;
      if (this._patch[fixtureAddress]) {
        this._patch[fixtureAddress].setChannel(fixtureChannel, channelData.value);
      }
    });
  }

  get simplifiedChannels() {
    if (this._patch) {
      return Object.keys(this._patch).map((fixtureAddress) => {
        const fixture = this._patch[fixtureAddress];
        return fixture.simplifiedChannels;
      }).flat() || [];
    }
    return [];
  }

  /**
   * Universe's DMX512 channel data buffer
   *
   * @memberof Universe
   */
  set DMX512Data(DMX512ValueBuffer) {
    DMX512ValueBuffer.forEach((value, channel) => {
      const fixtureAddress = this._addressMap[channel];
      const fixtureChannel = channel - fixtureAddress;
      if (this._patch[fixtureAddress]) {
        this._patch[fixtureAddress].setChannel(fixtureChannel, value);
      } else {
        // Handle address error here
      }
    });
  }

  get DMX512Data() {
    return this._dmxBuffer;
  }

  /**
   * Universe's current DMX frame (512 channels), packed once per Live tick by the universe pool.
   * The buffer is reused: copy it to keep a snapshot.
   *
   * @readonly
   * @type {Uint8Array}
   */
  get frame() {
    return this._dmxBuffer;
  }

  /**
   * Copies the patched fixtures' output values (parked, programmer, playback) into the frame,
   * levels scaled by the masters
   *
   * @public
   * @param {Master} [master] the show's master (raw), its factors computed for this tick
   * @returns {Uint8Array} The universe frame
   */
  packFrame(master = null) {
    const frame = this._dmxBuffer;
    const grand = master ? master.grand : 1;
    for (let i = 0; i < DMX_UNIVERSE_LENGTH; i++) {
      const address = this._addressMap[i];
      const fixture = address === undefined ? undefined : this._patch[address];
      const channel = fixture ? fixture.channels[i - address] : undefined;
      if (channel) {
        // Invert / swap pan and tilt (Fixture.setupOutput): plain numbers, no allocation.
        // Parked, then the programmer's, then playback's value (models/DMX/programmer.js)
        const source = fixture.channels[channel.outputSource] || channel;
        let value = source.value.DMX;
        if (source.parked !== null) value = source.parked;
        else if (source.programmed !== null) value = source.programmed;
        // Levels as the masters let them through (master.model.js)
        if (source.scale !== null && source.parked === null) {
          value = scaledLevel(source, value, grand);
        }
        frame[i] = channel.outputInvert ? 255 - value : value;
      } else {
        frame[i] = 0;
      }
    }
    return frame;
  }

  /**
   * Universe's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      fixtures: this.fixturePool.showData,
    };
  }

  /**
   * Patch a fixture into the universe
   *
   * @public
   * @param {Object} fixture Fixture instance
   * @param {Boolean} [allowOverlap=false] Skip the overlap check, used when loading a showfile so
   * shows saved with overlapping fixtures keep loading
   */
  patchFixture(fixture, allowOverlap = false) {
    if (allowOverlap || this.checkPatchCapability(fixture.chStart, fixture.chCount)) {
      fixture.universe = this.id;
      this._patch[fixture.chStart] = fixture;
      this.fixturePool.addExisting(fixture);
      for (let i = fixture.chStart; i < fixture.chStop; i++) {
        this._addressMap[i] = fixture.chStart;
      }
      EventBus.emit('patch_changed');
    } else {
      throw new Error('Cannot patch fixture on this interval');
    }
  }

  /**
   * Unpatches a universe's fixture
   *
   * @public
   * @param {Object} fixture Fixture instance
   */
  unpatchFixture(fixture) {
    this.fixturePool.delete(fixture);
    delete this._patch[fixture.chStart];
    this._addressMap = this._addressMap.map((address) => (
      address === fixture.chStart
        ? undefined
        : address
    ));
    EventBus.emit('patch_changed');
  }

  /**
   * Switches a patched fixture to another mode and moves its address range to the new mode's
   * channel count. Refuses the change when the new range would overlap another fixture or pass
   * the end of the universe.
   *
   * @public
   * @param {Object} fixture Fixture instance (or reactive proxy) patched in this universe
   * @param {Number} modeIndex Index of the new mode in the fixture's modes
   */
  changeFixtureMode(fixture, modeIndex) {
    const chCount = fixture.modes[modeIndex].channels.length;
    const chStop = fixture.chStart + chCount;
    const overlaps = Object.values(this._patch).some((patched) => (
      patched.id !== fixture.id && chStop > patched.chStart && fixture.chStart < patched.chStop
    ));
    if (overlaps || chStop > DMX_UNIVERSE_LENGTH) {
      throw new Error(`Mode "${fixture.modeNames[modeIndex]}" needs ${chCount} channels and would overlap another fixture or exceed the universe`);
    }
    for (let i = fixture.chStart; i < fixture.chStop; i++) {
      this._addressMap[i] = undefined;
    }
    fixture.modeIndex = modeIndex;
    for (let i = fixture.chStart; i < fixture.chStop; i++) {
      this._addressMap[i] = fixture.chStart;
    }
    EventBus.emit('patch_changed');
  }

  /**
   * Check whether or not a configuration is patchable
   *
   * @public
   * @param {Number} chStart start channel universe address
   * @param {Number} chCount Amount of channels to be patched
   * @return {Boolean} patching capability
   */
  checkPatchCapability(chStart, chCount) {
    const chStop = chStart + chCount;
    // chStop is exclusive on both sides, so back-to-back fixtures don't overlap
    return Object.values(this._patch).every(
      (fixture) => chStop <= fixture.chStart || chStart >= fixture.chStop,
    );
  }

  /**
   * Check whether a set of N similar fixtures is patchable or not
   *
   * @public
   * @param {Number} chStart start channel universe address
   * @param {Number} chCount per-instance count of channels to be patched
   * @param {Number} amount Amount of instances to be patched
   * @return {Boolean} patching capability
   */
  canPatchMany(chStart, chCount, amount) {
    const total = chCount * amount;
    if (chStart < 0 || chStart + total > DMX_UNIVERSE_LENGTH) return false;
    for (let i = chStart; i < chStart + total; i++) {
      // A fixture at address 0 owns slots holding 0: test for any owner
      if (this._addressMap[i] != null) {
        return false;
      }
    }
    return true;
  }

  /**
   * Finds patch start address for a set of N similar fixtures
   *
   * @public
   * @param {Number} chCount per-instance count of channels to be patched
   * @param {Number} amount Amount of instances to be patched
   * @return {Number} Available address
   */
  findChStartAutoPatch(chCount, amount) {
    const total = chCount * amount;
    for (let i = 0; i < DMX_UNIVERSE_LENGTH; i++) {
      let canPatch = true;
      for (let j = 0; j < total; j++) {
        if (j + i >= DMX_UNIVERSE_LENGTH || this._addressMap[j + i] != null) {
          canPatch = false;
          break;
        }
      }
      if (canPatch) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Manually remove universe instance reference from memory
   *
   * @private
   * @param {Object} instance handle to universe instance to be freed
   */
  static deleteInstance(instance) {
    Object.keys(instance).forEach((prop) => {
      delete instance[prop];
    });
    instance = null;
  }
}

export { DMX_UNIVERSE_LENGTH };
export default Universe;
