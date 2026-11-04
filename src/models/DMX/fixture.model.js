import { markRaw } from '../utils/reactivity';
import Channel from './channel.model';
import { PROFILE_SOURCES, resolveModeName } from '../fixtures/fixture.profile';
import EventBus from '../../plugins/eventbus';

/**
 * Highest DMX channel value
 *
 * @constant
 * @type {Number}
 * @default
 */
const MAX_DMX_VALUE = 255;

/**
 * OFL Fixture category definitions for parsing fixture type
 *
 * @constant
 * @type {Object}
 * @default
 */
const FIXTURE_TYPES = {
  MOVING_HEAD: 'Moving Head',
};

/**
 * Default fixture name
 *
 * @constant
 * @type {Object}
 * @default
 */
const DEFAULT_FIXTURE_NAME = 'Unknown Fixture';

const RGB_CHANNELS = ['Red', 'Green', 'Blue'];
const CMY_CHANNELS = ['Cyan', 'Magenta', 'Yellow'];

/**
 * Default fixture constructor data
 *
 * @constant
 * @type {Object}
 * @default
 */
const DEFAULT_FIXTURE_DATA = {
  profile: undefined,
  manufacturer: undefined,
  model: undefined,
  mode: undefined,
  id: 0,
  chStart: 0,
  universe: 0,
  position: {
    x: 0,
    y: 0,
    z: 0,
  },
  rotation: {
    x: 0,
    y: 0,
    z: 0,
  },
};

/**
 * @class
 * @classdesc Definition of a DMX512 Fixture model
 */
class Fixture {
  /**
   * @param {Object} data Fixture initialisation data
   * @param {Object} data.profile Fixture profile (see models/fixtures/fixture.profile.js)
   * @param {Object} data.id Fixture's unique identifier
   * @param {Object} data.universe Fixture's DMX512 Universe
   * @param {Object} data.manufacturer Fixture manufacturer name as described in fixture_list.json
   * @param {Object} data.model Manufacturer's fixture model name as described in fixture_list.json
   * @param {String|Number} data.mode Name (or index) of the fixture's selected running mode
   * @param {Object} data.chStart FIxture's universe address/starting channel
   * @param {Number} [data.channelCount] Channel count saved with the show
   * @param {Object} data.position Fixture's position in 3D space
   * @param {Object} data.rotation Fixture's rotation in 3D space
   */
  constructor(data = DEFAULT_FIXTURE_DATA) {
    if (!data.isStub) {
      this.profile = data.profile;
      this.source = data.profile.source || PROFILE_SOURCES.OFL;
      this.id = parseInt(data.id, 10);
      this.universe = parseInt(data.universe, 10);
      this.manufacturer = data.manufacturer;
      this.model = data.model;
      this.modeName = resolveModeName(data.profile, data.mode);
      this.wheels = {};
      this.name = data.name || DEFAULT_FIXTURE_NAME;
      this.category = data.category;
      this.chStart = parseInt(data.chStart, 10);
      // Channel count saved with the show (absent in showfiles saved before it existed)
      this.savedChannelCount = Number.isInteger(data.channelCount) ? data.channelCount : null;
      this.channels = [];
      this.quickChannelsAccessors = {};
      this._highlighted = false;
      this._rotation = {
        x: 0,
        y: 0,
        z: 0,
      };
      this._position = data.position || {
        x: 0,
        y: 0,
        z: 0,
      };
      this.position = data.position || {
        x: this.id,
        y: this.universe,
        z: 10,
      };
      this.rotation = data.rotation || {
        x: 180,
        y: 0,
        z: 0,
      };
      this.parseFromProfile();
      this.channels.forEach((channel) => {
        this.setChannel(channel.id - 1, 0);
      });
    }
  }

  /** *******************************************
   * DESCRIPTION MODIFIERS                     *
   ******************************************** */

  set model(model) {
    this._model = model?.replace('.json', '');
  }

  get model() {
    return this._model;
  }

  get listable() {
    return {
      name: this.name,
      icon: 'movinghead',
      id: this.id,
      universe: this.universe,
      more: `U${this.universe}-CH${this.chStart}`,
    };
  }

  /**
   * Fixture's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return {
      id: this.id,
      model: this.model,
      category: this.category,
      manufacturer: this.manufacturer,
      name: this.name,
      universe: this.universe,
      chStart: this.chStart,
      channelCount: this.channels.length,
      mode: this.modeName,
      source: this.source,
      position: this.position,
      rotation: this.rotation,
    };
  }

  /**
   * Whether the fixture's channel count differs from the one saved with the show: the profile
   * changed since (for OFL modes with pixel channels, which used to drop them, shows saved before
   * the count existed count as changed)
   *
   * @public
   * @readonly
   * @type {Boolean}
   */
  get footprintChanged() {
    if (this.savedChannelCount !== null) return this.savedChannelCount !== this.channels.length;
    return Boolean(this.mode && this.mode.matrixInserts);
  }

  /** *******************************************
   * POSITION MODIFIERS                        *
   ******************************************** */

  /**
   * Tells the visualizer the fixture's position or rotation changed
   *
   * @private
   * @param {Boolean} [reattach=false] Whether the move/rotate gizmo should be re-attached to the
   * fixture (position tool edits), as opposed to loads and gizmo write-backs
   */
  emitPose(reattach = false) {
    EventBus.emit('fixture_pose', {
      id: this.id,
      position: this.position,
      rotation: { ...this._rotation },
      reattach,
    });
  }

  /**
   * Fixture's X position in 3D space (meter)
   *
   * @type {Number}
   */
  set posX(xVal) {
    if (!Number.isNaN(xVal)) {
      this._position.x = xVal;
      this.emitPose(true);
    } else {
      this._position.x = this.position.x;
    }
  }

  get posX() {
    return this.position.x;
  }

  /**
   * Fixture's Y position in 3D space (meter)
   *
   * @type {Number}
   */
  set posY(yVal) {
    if (!Number.isNaN(yVal)) {
      this._position.y = yVal;
      this.emitPose(true);
    } else {
      this._position.y = this.position.y;
    }
  }

  get posY() {
    return this.position.y;
  }

  /**
   * Fixture's Z position in 3D space (meter)
   *
   * @type {Number}
   */
  set posZ(zVal) {
    if (!Number.isNaN(zVal)) {
      this._position.z = zVal;
      this.emitPose(true);
    } else {
      this._position.z = this.position.z;
    }
  }

  get posZ() {
    return this.position.z;
  }

  /**
   * Fixture's position in 3D space (meter)
   *
   * @type {Object}
   */
  set position(positionData) {
    this._position = {
      x: positionData.x,
      y: positionData.y,
      z: positionData.z, // Math.max(positionData.z, 0)
    };
    this.emitPose();
  }

  get position() {
    return {
      x: this._position.x,
      y: this._position.y,
      z: this._position.z,
    };
  }

  /**
   * Fixture's X rotation in 3D space (degree)
   *
   * @type {Number}
   */
  set rotX(xVal) {
    this._rotation.x = Fixture.degToRad(xVal);
    this.emitPose(true);
  }

  get rotX() {
    return this.rotation.x;
  }

  /**
   * Fixture's Y rotation in 3D space (degree)
   *
   * @type {Number}
   */
  set rotY(yVal) {
    this._rotation.y = Fixture.degToRad(yVal);
    this.emitPose(true);
  }

  get rotY() {
    return this.rotation.y;
  }

  /**
   * Fixture's Z rotation in 3D space (degree)
   *
   * @type {Number}
   */
  set rotZ(zVal) {
    this._rotation.z = Fixture.degToRad(zVal);
    this.emitPose(true);
  }

  get rotZ() {
    return this.rotation.z;
  }

  /**
   * Fixture's rotation in 3D space (degree)
   *
   * @type {Object}
   */
  set rotation(rotationData) {
    this._rotation = {
      x: Fixture.degToRad(rotationData.x),
      y: Fixture.degToRad(rotationData.y),
      z: Fixture.degToRad(rotationData.z),
    };
    this.emitPose();
  }

  get rotation() {
    return {
      x: Fixture.radToDeg(this._rotation.x),
      y: Fixture.radToDeg(this._rotation.y),
      z: Fixture.radToDeg(this._rotation.z),
    };
  }

  set rotationRad(rotationData) {
    if (rotationData) {
      this._rotation = {
        x: rotationData.x,
        y: rotationData.y,
        z: rotationData.z,
      };
      this.emitPose();
    }
  }

  /** *******************************************************************
   * CHANNELS MODIFIERS                                                *
   * TODO: remove unused content following quickChannelAccessor update *
   ******************************************************************** */

  /**
   * Fixture's mode index for channel setting/parsing mode
   *
   * @type {Number}
   */
  set modeIndex(modeIndex) {
    const previousValues = {};
    this.channels.forEach((channel) => {
      previousValues[`${channel.type}#${channel.qaIndex}`] = channel.value.DMX;
    });
    this.channels = [];
    this.quickChannelsAccessors = {};
    this.modeName = this.modeNames[modeIndex];
    this.prepareChannels();
    this.setupFineChannels();
    this.setupQuickAccessors();
    // Coarse channels first: writing a coarse channel resets its fine byte
    const restore = (channel) => {
      this.setChannel(channel.id - 1, previousValues[`${channel.type}#${channel.qaIndex}`] || 0);
    };
    this.channels.filter((channel) => !channel.isFine).forEach(restore);
    this.channels.filter((channel) => channel.isFine).forEach(restore);
  }

  get modeIndex() {
    const modeIndex = this.modeNames.indexOf(this.modeName);
    return modeIndex > -1 ? modeIndex : 0;
  }

  /**
   * Simplified channel object. does not contain capability(ies) data
   *
   * @type {Object}
   */
  set simplifiedChannels(channels) {
    channels.forEach((channel, index) => {
      this.setChannel(index, channel.value);
    });
  }

  get simplifiedChannels() {
    return this.channels.map((channel) => ({
      color: channel.color,
      type: channel.type,
      id: channel.id + this.chStart,
      value: channel.value.DMX,
      active: channel.active,
      qaIndex: channel.qaIndex,
    }));
  }

  /**
   * Fixture's pan&tilt channels values (0-255)/(0-255)
   *
   * @type {Number}
   */
  set panTilt(value) {
    this.setQuickAccessor({
      type: 'Pan',
    }, value.pan);
    this.setQuickAccessor({
      type: 'Tilt',
    }, value.tilt);
    this.setQuickAccessor({
      type: 'PanFine',
    }, value.panFine);
    this.setQuickAccessor({
      type: 'TiltFine',
    }, value.tiltFine);
  }

  get panTilt() {
    return {
      pan: this.hasQuickAccessor({
        type: 'Pan',
      }) ? this.getQuickAccessor({
          type: 'Pan',
        }).value.DMX : 0,
      panFine: this.hasQuickAccessor({
        type: 'PanFine',
      }) ? this.getQuickAccessor({
          type: 'PanFine',
        }).value.DMX : 0,
      tilt: this.hasQuickAccessor({
        type: 'Tilt',
      }) ? this.getQuickAccessor({
          type: 'Tilt',
        }).value.DMX : 0,
      tiltFine: this.hasQuickAccessor({
        type: 'TiltFine',
      }) ? this.getQuickAccessor({
          type: 'TiltFine',
        }).value.DMX : 0,
    };
  }

  /**
   * Fixture's color channels values.
   * Only RGB color suppoprtded at the moment.
   * @todo Implement other color changer types (HSB...). Should do for the alpha
   * @todo, this causes massive slowdowns, this should be refactpred and optimized
   * @type {Number}
   */
  set color(rgbValue) {
    if (this.hasColor) {
      this.quickChannelsAccessors.Color.forEach((channel) => {
        if (RGB_CHANNELS.includes(channel.color)) {
          const value = rgbValue[RGB_CHANNELS.indexOf(channel.color)];
          this.setChannel(channel.id - 1, value);
        } else if (CMY_CHANNELS.includes(channel.color)) {
          const value = 255 - rgbValue[CMY_CHANNELS.indexOf(channel.color)];
          this.setChannel(channel.id - 1, value);
        }
      });
    }
  }

  get color() {
    const colorValues = [0, 0, 0];
    if (this.hasColor) {
      this.quickChannelsAccessors.Color.forEach((colorChannel) => {
        if (RGB_CHANNELS.includes(colorChannel.color)) {
          colorValues[RGB_CHANNELS.indexOf(colorChannel.color)] = colorChannel.value.DMX;
        } else if (CMY_CHANNELS.includes(colorChannel.color)) {
          colorValues[CMY_CHANNELS.indexOf(colorChannel.color)] = 255 - colorChannel.value.DMX;
        }
      });
    }
    return colorValues;
  }

  /**
   * List of fixture's mode names
   *
   * @type {Array<String>}
   * @readonly
   */
  get modeNames() {
    return this.modes.map((mode) => mode.name);
  }

  get instance() {
    return this;
  }

  /**
   * Whether the fixture has dimmer capabilities or not
   *
   * @type {Object}
   * @readonly
   */
  get hasDimmer() {
    return this.quickChannelsAccessors.Dimmer !== undefined;
  }

  /**
   * Whether the fixture has zoom capabilities or not
   *
   * @type {Object}
   * @readonly
   */
  get hasZoom() {
    return this.quickChannelsAccessors.Zoom !== undefined;
  }

  /**
   * Whether the fixture has pan capabilities or not
   *
   * @type {Object}
   * @readonly
   */
  get hasPan() {
    return this.quickChannelsAccessors.Pan !== undefined;
  }

  /**
   * Whether the fixture has tilt capabilities or not
   *
   * @type {Object}
   * @readonly
   */
  get hasTilt() {
    return this.quickChannelsAccessors.Tilt !== undefined;
  }

  /**
   * Whether the fixture has color capabilities or not
   *
   * @type {Object}
   * @readonly
   */
  get hasColor() {
    return this.quickChannelsAccessors.Color !== undefined;
  }

  /**
   * The fixture's stop address as defined by it's universe configuration
   *
   * @type {Number}
   * @readonly
   */
  get chStop() {
    return this.chStart + this.channels.length;
  }

  /**
   * The fixture's number of DMX channels in its current mode
   *
   * @type {Number}
   * @readonly
   */
  get chCount() {
    return this.channels.length;
  }

  /**
   * Whether the fixture is highlighted in the visualizer
   *
   * @readonly
   * @type {Boolean}
   */
  get highlighted() {
    return this._highlighted;
  }

  setQuickAccessor(channel, value) {
    if (this.hasQuickAccessor(channel)) {
      this.setChannel(this.getQuickAccessor(channel).id - 1, value);
    }
  }

  hasQuickAccessor(channel) {
    return this.quickChannelsAccessors[channel.type] !== undefined
      && this.quickChannelsAccessors[channel.type][channel.qaIndex || 0] !== undefined;
  }

  getQuickAccessor(channel) {
    if (this.hasQuickAccessor(channel)) {
      return this.quickChannelsAccessors[channel.type][channel.qaIndex || 0];
    }
    return null;
  }

  /**
   * Sets specified channel value for given fixture channel index. A channel with a fine
   * companion takes the integer part and its fine channel the fractional part (16-bit);
   * other channels take the value rounded to the nearest step. The visualizer reads the
   * resulting values from the universe frame.
   *
   * @param {Number} id fixture's channel index
   * @param {Number} value channel value (0-255, fractional values allowed)
   */
  setChannel(id, value) {
    const channel = this.channels[id];
    const clampedValue = Math.min(Math.max(Number(value) || 0, 0), MAX_DMX_VALUE);
    if (channel.fineChannels.length > 0) {
      // Fine channel takes the fractional part
      this.setChannel(channel.fineChannels[0].id - 1, (clampedValue % 1) * MAX_DMX_VALUE);
      channel.value = Math.floor(clampedValue);
    } else {
      channel.value = Math.round(clampedValue);
    }
  }

  /**
   * Prepares fixture parameters and channels from the fixture's profile
   *
   * @public
   * @todo improve error handling.
   * @todo Implement other fixure categories
   */
  parseFromProfile() {
    const { profile } = this;
    this.category = profile.category; // Main category of the fixture type
    this.wheels = profile.wheels; // Fixture's wheels configuration
    this.bulb = profile.physical.bulb; // Fixture's bulb configuration
    this._name = profile.name; // Fixture type's default name
    this.modes = profile.modes; // Fixture's modes, shared with every fixture of this type
    this.prepareChannels(); // Prepare fixture's channels
    this.setupFineChannels();
    this.setupQuickAccessors();
    if (this.category !== FIXTURE_TYPES.MOVING_HEAD) {
      throw new Error('This fixture type is not supported yet.');
    }
  }

  /**
   * Prepares fixture's channels from the selected mode of its profile
   *
   * @public
   */
  prepareChannels() {
    this.mode = this.modes[this.modeIndex] || this.modes[0]; // Selected profile mode
    // Channels are raw: playback writes them every tick, widgets read them through the live ticker
    this.channels = this.mode.channels.map((profileChannel, index) => markRaw(new Channel({
      id: index + 1,
      profileChannel,
    })));
  }

  /**
   * Sets up fixture's quick accessors
   *
   * @public
   */
  setupQuickAccessors() {
    this.channels.forEach((channel) => {
      if (this.quickChannelsAccessors[channel.type]) {
        channel.qaIndex = this.quickChannelsAccessors[channel.type].length;
        this.quickChannelsAccessors[channel.type].push(channel);
      } else {
        channel.qaIndex = 0;
        this.quickChannelsAccessors[channel.type] = [channel];
      }
    });
  }

  /**
   * Sets up fine channels
   *
   * @public
   */
  setupFineChannels() {
    this.channels.forEach((channel) => {
      channel.fineChannels = channel.fineIndexes.map((index) => this.channels[index]);
    });
  }

  /**
   * Highlights the fixture in the visualizer
   *
   * @param {Boolean} state wheter the fixture should be highlighted or not
   * @param {Boolean} [centerControls=false] whether the move/rotate gizmo follows the highlight
   */
  highlight(state, centerControls = false) {
    this._highlighted = state;
    EventBus.emit('fixture_highlight', {
      id: this.id, state, single: false, center: centerControls,
    });
  }

  /**
   * Highlights the fixture in the visualizer while unhighlighting any other highlighted fixture
   *
   * @param {Boolean} state wheter the fixture should be highlighted or not
   * @param {Boolean} [centerControls=false] whether the move/rotate gizmo follows the highlight
   */
  highlightSingle(state, centerControls = false) {
    this._highlighted = state;
    EventBus.emit('fixture_highlight', {
      id: this.id, state, single: true, center: centerControls,
    });
  }

  /**
   * Releases a fixture instance. Its 3D instance is removed by the visualizer when the patch
   * changes.
   *
   * @param {Fixture} instance fixture instance
   * @static
   */
  static deleteInstance(instance) {
    instance.channels = [];
  }

  /**
   * Converts a provided value from degrees into radians
   *
   * @param {Number} deg input degrees value to be converted to radians
   * @returns Result of the conversion of the provided degree value into radians
   * @todo this could go in an util.js as it might/will be used elsewhere
   */
  static degToRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Converts a provided value from radians into degrees
   *
   * @param {Number} deg input radians value to be converted to degrees
   * @returns Result of the conversion of the provided radians value into degrees
   * @todo this could go in an util.js as it might/will be used elsewhere
   */
  static radToDeg(rad) {
    return rad * (180 / Math.PI);
  }
}

export default Fixture;
