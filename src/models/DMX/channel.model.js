import Capability from './capabilityManager.model';

/**
 * Enumeration of every available capability types.
 *
 * @constant {Object} CAPABILITY_TYPES
 * @enum {String}
 * @see Capability
 */
const CAPABILITY_TYPES = {
  /** SHUTTER */
  ShutterStrobe: 'ShutterStrobe',
  StrobeSpeed: 'StrobeSpeed',
  StrobeDuration: 'StrobeDuration',
  /** DIMMER */
  Intensity: 'Intensity',
  /** COLOR */
  ColorIntensity: 'ColorIntensity',
  /** COLOR PRESET */
  ColorPreset: 'ColorPreset',
  /** COLOR TEMP */
  ColorTepemrature: 'ColorTepemrature',
  /** PAN */
  Pan: 'Pan',
  PanFine: 'PanFine',
  /** PAN CNOTINUOUS */
  PanContinuous: 'PanContinuous',
  /** TILT */
  Tilt: 'Tilt',
  TiltFine: 'TiltFine',
  /** TILT CONTINUOUS */
  TiltContinuous: 'TiltContinuous',
  /** PANTILT SPEED */
  PanTiltSpeed: 'PanTiltSpeed',
  /** WHEELSLOT */
  WheelSlot: 'WheelSlot',
  /** WHEELSHAKE */
  WheelShake: 'WheelShake',
  /** WHEELSLOTROT */
  WheelSlotRotation: 'WheelSlotRotation',
  /** ZOOM */
  BeamAngle: 'BeamAngle',
  Zoom: 'Zoom',
  /** POSITION */
  BeamPosition: 'BeamPosition',
  /** EFFECT */
  Effect: 'Effect',
  EffectSpeed: 'EffectSpeed',
  EffectDuration: 'EffectDuration',
  EffectParameter: 'EffectParameter',
  SoundSensitivity: 'SoundSensitivity',
  /** FOCUS */
  Focus: 'Focus',
  /** TIME/SPEED */
  Speed: 'Speed',
  Time: 'Time',
  /** SPECIAL */
  Maintenance: 'Maintenance',
};

/**
 * @class Channel
 * @classdesc Describes a DMX512 fixture channel
 */
class Channel {
  /**
   * Creates an instance of Channel.
   *
   * @param {Object} data Channel data
   * @param {Number} data.id Channel ID
   * @param {String} data.type Channel type
   * @param {Boolean} data.isFine Whether or not the channel is a fine channel
   * @param {Object} data.OFLData OFL Data channel object
   */
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.fineChannelAliases = null;
    this.fineChannels = [];
    this.isFine = data.isFine;
    this.capabilities = [];
    this.color = null;
    this.active = true;
    this._value = {
      DMX: 0,
      model: 0,
    };
    this.setup(data.OFLData);
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
   * Setup Channel
   *
   * @param {Object} channelData OFL Channel data
   * @see https://github.com/OpenLightingProject/open-fixture-library
   */
  setup(channelData) {
    if (channelData) {
      this.fineChannelAliases = channelData.fineChannelAliases;
      if (channelData.capability) {
        this.setChannelTypes(channelData.capability);
        this.capabilities = [new Capability(channelData.capability)];
      } else {
        this.capabilities = channelData.capabilities.map((capability) => {
          this.setChannelTypes(capability);
          return new Capability(capability);
        });
      }
    }
  }

  /**
   * Sets channel type(s) from capability
   *
   * @public
   * @param {Object} capability capability instance handle
   */
  setChannelTypes(capability) {
    this.type = [
      CAPABILITY_TYPES.ShutterStrobe,
      CAPABILITY_TYPES.StrobeDuration,
      CAPABILITY_TYPES.StrobeSpeed,
    ].includes(capability.type) ? 'Shutter' : this.type;

    this.type = [
      CAPABILITY_TYPES.Intensity,
    ].includes(capability.type) ? 'Dimmer' : this.type;

    this.type = [
      CAPABILITY_TYPES.ColorIntensity,
    ].includes(capability.type) ? 'Color' : this.type;

    this.type = [
      CAPABILITY_TYPES.ColorPreset,
    ].includes(capability.type) ? 'ColorPreset' : this.type;

    this.type = [
      CAPABILITY_TYPES.ColorTemperature,
    ].includes(capability.type) ? 'ColorTemp' : this.type;

    this.type = [
      CAPABILITY_TYPES.Pan,
      CAPABILITY_TYPES.PanFine,
    ].includes(capability.type) ? 'Pan' : this.type;

    this.type = [
      CAPABILITY_TYPES.Tilt,
      CAPABILITY_TYPES.TiltFine,
    ].includes(capability.type) ? 'Tilt' : this.type;

    this.type = [
      CAPABILITY_TYPES.PanContinuous,
    ].includes(capability.type) ? 'PanContinuous' : this.type;

    this.type = [
      CAPABILITY_TYPES.TiltContinuous,
    ].includes(capability.type) ? 'TiltContinuous' : this.type;

    this.type = [
      CAPABILITY_TYPES.BeamAngle,
      CAPABILITY_TYPES.Zoom,
    ].includes(capability.type) ? 'Zoom' : this.type;

    this.type = [
      CAPABILITY_TYPES.Effect,
      CAPABILITY_TYPES.EffectDuration,
      CAPABILITY_TYPES.EffectSpeed,
      CAPABILITY_TYPES.EffectParameter,
      CAPABILITY_TYPES.SoundSensitivity,
    ].includes(capability.type) ? 'Effect' : this.type;

    this.type = [
      CAPABILITY_TYPES.Focus,
    ].includes(capability.type) ? 'Focus' : this.type;

    this.type = [
      CAPABILITY_TYPES.Maintenance,
    ].includes(capability.type) ? 'Maintenance' : this.type;

    this.type = this.isFine ? `${this.type}Fine` : this.type;

    if (this.type === 'Color') {
      this.color = capability.color;
    }
  }

  /**
   * Returns capability from provided DMX value
   *
   * @param {Number} DMXValue channel value between 0 and 255
   * @return {Object} capability instance
   */
  getCapability(DMXValue) {
    if (this.capabilities) {
      return this.capabilities.find(
        (capability) => capability.range[0] <= DMXValue
        && capability.range[1] >= DMXValue,
      );
    }
    return null;
  }
}

export default Channel;
