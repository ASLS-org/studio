import ukColors from '@/views/components/uikit/colors/uikit.colors';
import FixturePool from './fixture.pool.model';

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
   * Universe ID
   *
   * @memberof Universe
   */
  set id(id) {
    this._id = Math.min(Math.max(parseInt(id, 10), MIN_UNIVERSE_ID), MAX_UNIVERSE_ID);
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
    const DMX_PACKET_LENGTH = 512;
    const DMX_BUFF = new Uint8Array(DMX_PACKET_LENGTH);
    this._addressMap.forEach((address, index) => {
      const fixture = this._patch[address];
      if (fixture) {
        const fixtureChannelIndex = index - fixture.chStart;
        DMX_BUFF[index] = fixture.channels[fixtureChannelIndex].value.DMX || 0;
      } else {
        DMX_BUFF[index] = 0;
      }
    });
    return DMX_BUFF;
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
   */
  patchFixture(fixture) {
    if (this.checkPatchCapability(fixture.chStart, fixture.chCount)) {
      fixture.universe = this.id;
      this._patch[fixture.chStart] = fixture;
      this.fixturePool.addExisting(fixture);
      for (let i = fixture.chStart; i < fixture.chStop; i++) {
        this._addressMap[i] = fixture.chStart;
      }
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
    // eslint-disable-next-line consistent-return
    Object.keys(this._patch).forEach((fixtureAddress) => {
      const fixture = this._patch[fixtureAddress];
      if (chStart <= fixture.chStop && fixture.chStart <= chStop) {
        return false;
      }
    });
    return true;
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
    for (let i = chStart; i < chStart + total; i++) {
      if (this._addressMap[i]) {
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

export default Universe;
