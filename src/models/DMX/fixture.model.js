import {
  Proxify,
} from '../utils/proxify.utils';
import Channel from './channel.model';
import MovingHead from '../../plugins/visualizer/moving_head';
import Controls from '../../plugins/visualizer/controls';

/**
 * Splitting pattern for parsing fine channels
 *
 * @constant
 * @type {String}
 * @default
 */
const FINE_CHANNEL_SPLIT_PATERN = ' fine';

/**
 * Fine channel terminology to be used for fine channel detection
 *
 * @constant
 * @type {String}
 * @default
 */
const FINE_CHANNEL_TERMINOLOGY = 'Fine';

/**
 * OFL Capability types strings for parsing OFL Fixture channels
 *
 * @constant
 * @type {String}
 * @default
 */
const CAPABILITY_TYPES = {
  ShutterStrobe: 'ShutterStrobe',
  StrobeSpeed: 'StrobeSpeed',
  StrobeDuration: 'StrobeDuration',
  Intensity: 'Intensity',
  ColorIntensity: 'ColorIntensity',
  ColorPreset: 'ColorPreset',
  ColorTemperature: 'ColorTemperature',
  Pan: 'Pan',
  PanFine: 'PanFine',
  PanContinuous: 'PanContinuous',
  Tilt: 'Tilt',
  TiltFine: 'TiltFine',
  TiltContinuous: 'TiltContinuous',
  PanTiltSpeed: 'PanTiltSpeed',
  WheelSlot: 'WheelSlot',
  WheelShake: 'WheelShake',
  WheelSlotRotation: 'WheelSlotRotation',
  Effect: 'Effect',
  BeamAngle: 'BeamAngle',
  BeamPosition: 'BeamPosition',
  EffectSpeed: 'EffectSpeed',
  EffectDuration: 'EffectDuration',
  EffectPrameter: 'EffectPrameter',
  SoundSensitivity: 'SoundSensitivity',
  Focus: 'Focus',
  Zoom: 'Zoom',
};

/**
 * OFL Wheel channels types strings for parsing OFL Fixture wheels
 *
 * @constant
 * @type {Object}
 * @default
 */
const WHEEL_CHANNEL_TYPES = {
  COLOR_WHEEL: 'Color Wheel',
  GOBO_WHEEL: 'Gobo Wheel',
};

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
  OFLData: undefined,
  manufacturer: undefined,
  model: undefined,
  modeName: undefined,
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
class Fixture extends Proxify {
  /**
   * @param {Object} data Fixture initialisation data
   * @param {Object} data.OFLData OFL Object fixture configuration
   * @param {Object} data.id Fixture's unique identifier
   * @param {Object} data.universe Fixture's DMX512 Universe
   * @param {Object} data.manufacturer Fixture manufacturer name as described in fixture_list.json
   * @param {Object} data.model Manufacturer's fixture model name as described in fixture_list.json
   * @param {Object} data.modeName Mode name of the fixture's selected running mode
   * @param {Object} data.wheels Fixture's wheels data
   * @param {Object} data.category Fixture category as parsed from OFL data
   * @param {Object} data.chStart FIxture's universe address/starting channel
   * @param {Object} data.position Fixture's position in 3D space
   * @param {Object} data.OFLData Fixture's rotation in 3D space
   */
  constructor(data = DEFAULT_FIXTURE_DATA) {
    super();
    if (!data.isStub) {
      this.OFLData = data.OFLData;
      this.id = parseInt(data.id, 10);
      this.universe = parseInt(data.universe, 10);
      this.manufacturer = data.manufacturer;
      this.model = data.model;
      this.modeName = data.mode;
      this.wheels = {};
      this.name = data.name || DEFAULT_FIXTURE_NAME;
      this.category = data.category;
      this.chStart = parseInt(data.chStart, 10);
      this.channels = [];
      this.quickChannelsAccessors = {};
      this._3DModel = null;
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
      this.parseFromOFLData();
      this.channels.forEach((channel) => {
        this.setChannel(channel.id - 1, 0);
      });
    }
    return this.proxify(['_3DModel']);
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
      mode: this.modeNam,
      position: this.position,
      rotation: this.rotation,
    };
  }

  /** *******************************************
   * POSITION MODIFIERS                        *
   ******************************************** */

  /**
   * Fixture's X position in 3D space (meter)
   *
   * @type {Number}
   */
  set posX(xVal) {
    if (!Number.isNaN(xVal)) {
      Controls.detach(this);
      this._position.x = xVal;
      this._3DModel.position = this.position;
      Controls.attach(this);
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
      Controls.detach(this);
      this._position.y = yVal;
      this._3DModel.position = this.position;
      Controls.attach(this);
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
      Controls.detach(this);
      this._position.z = zVal;
      this._3DModel.position = this.position;
      Controls.attach(this);
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
    if (this._3DModel) {
      this._3DModel.position = this._position;
    }
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
    Controls.detach(this);
    this._rotation.x = Fixture.degToRad(xVal);
    this._3DModel.rotation = this._rotation;
    Controls.attach(this);
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
    Controls.detach(this);
    this._rotation.y = Fixture.degToRad(yVal);
    this._3DModel.rotation = this._rotation;
    Controls.attach(this);
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
    Controls.detach(this);
    this._rotation.z = Fixture.degToRad(zVal);
    this._3DModel.rotation = this._rotation;
    Controls.attach(this);
  }

  get rotZ() {
    return this.rotation.z;
  }

  /**
   * Fixture's rotation in 3D space (meter)
   *
   * @type {Object}
   */
  set rotation(rotationData) {
    this._rotation = {
      x: Fixture.degToRad(rotationData.x),
      y: Fixture.degToRad(rotationData.y),
      z: Fixture.degToRad(rotationData.z),
    };
    if (this._3DModel) {
      this._3DModel.rotation = this._rotation;
    }
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
      if (this._3DModel) {
        this._3DModel.rotation = this._rotation;
      }
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
    this.channels = [];
    this.quickChannelsAccessors = {};
    this.modeName = this.modeNames[modeIndex];
    // this.parseFromOFLData();
    this.prepareChannels();
    this.setupFineChannels();
    this.setupQuickAccessors();
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

  get highlighted() {
    return this._3DModel.highlighted;
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
   *
   * @param {Object} fixtureData
   * @todo check and remove this, it's not used anymore.
   */
  init(fixtureData) {
    this.parseFromOFLData(fixtureData);
  }

  /**
   * Sets specified channel value for given fixture channel index.
   *
   * @param {Number} id fixture's channel index
   * @param {Number} value channel value (0-255)
   */
  /* eslint-disable max-len */
  setChannel(id, value) {
    const channel = this.channels[id]; // Getting channel instance from ID
    if (channel.fineChannels.length > 0) { // Channel has fine capabilities ?
      this.setChannel(channel.fineChannels[0].id - 1, (value % 1) * 255); // Setting fine channel values recursively
    }
    value = Math.ceil(Math.min(Math.max(value, 0), 255)); // Clamping value between 0 and 255
    const capability = channel.getCapability(value); // Fetching channel's capability from value
    this.channels[id].value = value; // Setting channel's value
    if (id === 0) { // If channel is first
      this._3DModel.colorPreset = null; // Defaulting color preset to null
    }
    if (capability) { // Making sure channel's capability is defined
      const values = capability.getValue(value); // Fetching values from capability value
      switch (capability.type) { // Checking capability type
        case CAPABILITY_TYPES.ColorIntensity: // Capability is color
          this._3DModel.colorIntensity = values; // Updating fixture 3D model color intensity with provided color value
          break;
        case CAPABILITY_TYPES.WheelSlot: { // Capability is wheelSlot
          const slot = Math.floor(capability.getValue(value).slotNumber) - 1.0; // Parsing slot number from value
          switch (channel.type) { // Dtermining wheel type
            case WHEEL_CHANNEL_TYPES.COLOR_WHEEL: // Wheel is color wheel
              this._3DModel.colorWheelSlot = slot; // Updating 3D model's color wheel slot in use
              break;
            case WHEEL_CHANNEL_TYPES.GOBO_WHEEL: // Wheel is gobo wheel
              // TODO handle gobo selection here
              break;
            default: break;
          }
          break;
        }
        case CAPABILITY_TYPES.ColorPreset:
          this._3DModel.colorPreset = values.color ? values.color[0] : null;
          break;
        default:
          Object.keys(values).forEach((val) => {
            this._3DModel[val] = values[val];
          });
          break;
      }
    }
  }
  /* eslint-disable max-len */

  /**
   * Parses OFL data and rpepares fixture parameters and channels
   *
   * @public
   * @todo improve error handling.
   * @todo Implement other fixure categories
   */
  parseFromOFLData() {
    // eslint-disable-next-line prefer-destructuring
    this.category = this.OFLData.categories[0]; // We're only interested in the first category asset ATM.
    this.wheels = this.OFLData.wheels; // Isolating and setting fixture's wheels configuration from OFL data
    this.bulb = this.OFLData.physical.bulb; // Isolating and setting fixture's bulb configuration from OFL data
    this._name = this.OFLData.name; // Isolating and setting fixture's default name from OFL data
    this.modes = this.OFLData.modes; // Isolating and setting fixture's modes configuration from OFL data
    this.prepareChannels(); // Prepare fixture's channels
    this.setupFineChannels();
    this.setupQuickAccessors();
    this.prepare3DModelInstance();
  }

  /**
   * Handles instanciation of 3D model to be bound to fixture instance
   *
   * @pulic
   * @todo implement every fixture type
   */
  prepare3DModelInstance() {
    switch (this.category) { // Checking fixture category
      case FIXTURE_TYPES.MOVING_HEAD: { // Fixture is a moving head
        const movingHead = new MovingHead({ // Creating new moving head instance
          minAngle: this.OFLData.physical.lens ? this.OFLData.physical.lens.degreesMinMax[0] : 10, // Setting moving head's minimum beam angle
          maxAngle: this.OFLData.physical.lens ? this.OFLData.physical.lens.degreesMinMax[1] : 25, // Setting moving head's maximum beam angle
          minTilt: this.quickChannelsAccessors.Tilt ? this.quickChannelsAccessors.Tilt[0].minVal : 0,
          maxTilt: this.quickChannelsAccessors.Tilt ? this.quickChannelsAccessors.Tilt[0].maxVal : 0,
          minPan: this.quickChannelsAccessors.Pan ? this.quickChannelsAccessors.Pan[0].minVal : 0,
          maxPan: this.quickChannelsAccessors.Pan ? this.quickChannelsAccessors.Pan[0].maxVal : 0,
          colorTemp: this.OFLData.physical.bulb.colorTemperature, // Setting moving head's default bulb color temperature
          intensity: 0.0, // Setting moving head's default intensity
          pan: 128, // Setting moving head's default pan value
          tilt: 128, // Setting moving head's default tilt value
          colorWheel: this.OFLData.wheels && this.OFLData.wheels['Color Wheel'] ? this.OFLData.wheels['Color Wheel'].slots : [], // Providing color wheel data (if necessary)
          goboWheel: this.OFLData.wheels && this.OFLData.wheels['Gobo Wheel'] ? this.OFLData.wheels['Gobo Wheel'].slots : [], // Providing gobo wheel data (if necessary) (not supported in renderer yet...)
        });
        movingHead.position = this._position; // Setting moving head's position in 3D space
        movingHead.rotation = this._rotation; // Setting moving head's rotation in 3D space
        this._3DModel = movingHead; // Binding moving head instance to this fixture instance
        break;
      }
      default: { // Do nothing for every other fixture types.
        throw new Error('This fixture type is not supported yet.');
      }
    }
  }

  /**
   * Prepare fixture's channel from provided OFL configuration data
   *
   * @public
   */
  prepareChannels() {
    const OFLData = JSON.parse(JSON.stringify(this.OFLData));
    this.channels = [];
    let channelId = 0; // Initialising channel index to 0
    this.mode = OFLData.modes[this.modeIndex] || OFLData.modes[0]; // Parsing and setting fixture channel mode
    this.mode.channels.forEach((channel) => { // Looping through channel modes
      if (channel && typeof channel === 'string') { // Making sure the OFL mode data contains a channel value
        const split = channel.split(FINE_CHANNEL_SPLIT_PATERN); // Looking for and parsing fine channel aliases
        const channelName = split[0]; // Getting channel name from split result
        const isFine = split.length > 1; // Checking if split result contains a result for fine alias
        const channelData = OFLData.availableChannels[channelName]; // Isolating channel data
        if (channelData && channelData.capability && isFine) { // Checking if the channel has a fine alias
          channelData.capability.type = `${channelName}${FINE_CHANNEL_TERMINOLOGY}`; // Setting fine terminology to channel's capability type
        }
        const chn = new Channel({ // Instanciating new channel
          id: ++channelId, // Channel's ID is set and incremented for the next loop occurence
          type: channelName, // Setting channel type name @see channel.model.js
          name: `${channelName}${isFine ? FINE_CHANNEL_TERMINOLOGY : ''}`, // Setting channel name and fine terminology @see channel.model.js
          OFLData: channelData, // Providing channel data
          isFine, // Setting fine flag
        });
        this.channels.push(chn); // Instanciating channel in the fixture's channel pool
      } else { // In case the OFL channel configuration is emty/undefined
        const chn = new Channel({ // Instanciating a new empty channel
          type: 'Unset',
          id: ++channelId, // Setting channel's ID and incrementing for the next loop occurence
        });
        this.channels.push(chn); // Pushing empty channel in to the fixture's channel pool
      }
    });
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
      if (channel.fineChannelAliases && !channel.isFine) {
        channel.fineChannels = channel.fineChannelAliases.flatMap((alias) => {
          const standardizedAlias = alias.replace(' ', '').toLowerCase();
          const fineChannel = this.channels.find((item) => item.type.replace(' ', '').toLowerCase() === standardizedAlias);
          return fineChannel || [];
        });
      }
    });
  }

  /**
   * Highlights the fixture model
   *
   * @param {Boolean} state wheter the fixture Model should be highlighted or not
   */
  highlight(state, centerControls = false) {
    if (this._3DModel) {
      this._3DModel.highlighted = state;
      if (centerControls) {
        if (state) {
          Controls.attach(this);
        } else {
          Controls.detach(this);
        }
      }
    }
  }

  /**
   * Highlights the fixture model while unhighlighting any other already highlighted instance
   *
   * @param {Boolean} state wheter the fixture Model should be highlighted or not
   */
  highlightSingle(state, centerControls = false) {
    if (this._3DModel) {
      this._3DModel.setSinglyHighlighted(state);
      if (state && centerControls) {
        Controls.detachAll();
        Controls.attach(this);
      } else if (!state) {
        Controls.detachAll();
        Controls.setFocus(false);
      }
    }
  }

  /**
   * Delete fixture instance by removing the model from the instanced mesh pool
   * and unreferencing each instance property.
   *
   * @param {Fixture}
   * @static
   */
  static deleteInstance(instance) {
    switch (instance.category) {
      case FIXTURE_TYPES.MOVING_HEAD:
        MovingHead.deleteInstance(instance._3DModel);
        break;
      default:
        break;
    }
    Object.keys(instance).forEach((prop) => {
      delete instance[prop];
    });
    instance = null;
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
