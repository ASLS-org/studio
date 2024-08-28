import UkColors from '@/views/components/uikit/colors/uikit.colors';
import {
  Proxify,
} from '../utils/proxify.utils';
import Cue from './cue.model';

/**
 * Available color channels
 *
 * @constant {Array} COLOR_CHANNELS
 */
const COLOR_CHANNELS = ['Red', 'Green', 'Blue', 'Cyan', 'Magenta', 'Yellow'];

/**
 * Cue type "Effect" value
 *
 * @constant {Number} CUE_TYPE_EFFECT
 * @see Cue
 */
const CUE_TYPE_EFFECT = 1;

/**
 * Efeect channel waveforms enumeration
 *
 * @constant {Object} FX_CHANNEL_WAVEFORMS
 * @enum {Number}
 */
const FX_CHANNEL_WAVEFORMS = {
  SINE: 0,
  TRIANGLE: 1,
  SQUARE: 2,
  PWM: 3,
};
/**
 * Effect channel direction enumeration
 *
 * @constant {Object} FX_CHANNEL_DIRECTIONS
 * @enum {Number}
 */
const FX_CHANNEL_DIRECTIONS = {
  LTR: 0,
  RTL: 1,
  BOUNCELRT: 2,
  BOUNCERTL: 3,
  SYM: 4,
};

/**
 * Default FXChannel data
 *
 * @constant {Object} DEFAULT_FXCHANNEL_DATA
 */
const DEFAULT_FXCHANNEL_DATA = {
  DIRECTION: FX_CHANNEL_DIRECTIONS.LTR,
  WAVEFORM: FX_CHANNEL_WAVEFORMS.SINE,
  MIN: 0,
  MAX: 255,
  FREQUENCY: 1,
  PHASE: 0,
  FIXTURE_PHASE: {
    START: 0,
    STOP: 360,
  },
};

/**
 * Effects presets
 *
 * @constant {Array} FXPresets
 */
const FXPresets = [{
  name: 'Zoom',
  presets: [{
    waveform: FX_CHANNEL_WAVEFORMS.SINE,
    name: 'zoom',
    channels: {
      Zoom: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 1,
      },
    },
  }],
}, {
  name: 'Dimmer',
  presets: [{
    waveform: FX_CHANNEL_WAVEFORMS.SINE,
    name: 'dimmer',
    channels: {
      Dimmer: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 1,
      },
    },
  }],
}, {
  name: 'pan & tilt',
  presets: [{
    waveform: FX_CHANNEL_WAVEFORMS.SINE,
    name: 'Line',
    channels: {
      Pan: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 1,
      },
      Tilt: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 1,
      },
    },
  }, {
    name: 'Circle',
    waveform: FX_CHANNEL_WAVEFORMS.SINE,
    channels: {
      Pan: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 1,
      },
      Tilt: {
        min: 0,
        max: 255,
        phase: 90,
        frequency: 1,
      },
    },
  }, {
    name: 'Eight',
    waveform: FX_CHANNEL_WAVEFORMS.SINE,
    channels: {
      Pan: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 2,
      },
      Tilt: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 1,
      },
    },
  }, {
    name: 'Pan',
    waveform: FX_CHANNEL_WAVEFORMS.SINE,
    channels: {
      Pan: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 1,
      },
    },
  }, {
    name: 'Tilt',
    waveform: FX_CHANNEL_WAVEFORMS.SINE,
    channels: {
      Tilt: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 1,
      },
    },
  }],
}, {
  name: 'Color',
  waveform: FX_CHANNEL_WAVEFORMS.SINE,
  presets: [{
    name: 'Hue shift',
    channels: {
      Red: {
        min: 0,
        max: 255,
        phase: 60,
        frequency: 1,
      },
      Green: {
        min: 0,
        max: 255,
        phase: 180,
        frequency: 1,
      },
      Blue: {
        min: 0,
        max: 255,
        phase: 300,
        frequency: 1,
      },
    },
  }, {
    name: 'color intensity red',
    channels: {
      Red: {
        min: 0,
        max: 255,
        phase: 60,
        frequency: 1,
      },

    },
  }, {
    name: 'color intensity green',
    channels: {
      Green: {
        min: 0,
        max: 255,
        phase: 60,
        frequency: 1,
      },

    },
  }, {
    name: 'color intensity blue',
    channels: {
      Blue: {
        min: 0,
        max: 255,
        phase: 60,
        frequency: 1,
      },
    },
  }],
}];

/**
 * @class FXFixture
 * @classdesc Effect fixture instance
 */
class FXFixture extends Proxify {
  /**
   * Creates an instance of FXFixture.
   *
   * @param {Object} fixture fixture instance
   * @param {Number} fixture.phase fixture phasing value
   * @param {Number} fixture.active fixture activity state
   * @param {boolean} [fixturePreset={
   *     active: true,
   *     phase: 0
   *   }] fixture preset instance
   */
  constructor(fixture, fixturePreset = {
    active: true,
    phase: 0,
  }) {
    super();
    this.handle = fixture;
    this.phase = fixturePreset.phase;
    this.active = fixturePreset.active;
    this.value = 0;
    return this.proxify();
  }

  /**
   * FXFixture listable data
   *
   * @type {Object}
   * @readonly
   */
  get listable() {
    return {
      id: this.handle.id,
      name: this.handle.name,
      active: this.active,
      icon: this.handle.listable.icon,
      more: this.handle.listable.more,
    };
  }

  /**
   * FXFixture's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return {
      id: this.handle.id,
      active: this.active,
      phase: this.phase,
    };
  }
}

/**
 * @class FXChannel
 * @classdesc Effect channel instance
 */
class FXChannel extends Proxify {
  /**
   * Creates an instance of FXChannel.
   *
   * @param {Object} channel FXChannel configuration object
   * @param {Number} channel.type FXChannel type
   * @param {Number} channel.direction FXChannel direction
   * @param {Number} channel.waveform FXChannel waveform
   * @param {Number} channel.max FXChannel max value
   * @param {Number} channel.min FXChannel min value
   * @param {Number} channel.frequency FXChannel frequency in Hertz
   * @param {Number} channel.phase FXChannel phasing in degrees
   * @param {Number} channel.fixturePhaseStart FXChannel fixtures phasing start interval in degrees
   * @param {Number} channel.fixturePhaseStop FXChannel fixtures phasing stop interval in degrees

   * @param {Array} fixtures Array of fixture instances
   */
  constructor(channel, fixtures, duration) {
    super();
    this.type = channel.type;
    this.fixtures = fixtures;
    this.direction = channel.direction;
    this.waveform = channel.waveform;
    this.max = channel.max;
    this.min = channel.min;
    this.frequency = channel.frequency;
    this.phase = channel.phase;
    this.fixturePhaseStart = channel.fixturePhaseStart;
    this.fixturePhaseStop = channel.fixturePhaseStop;
    this.time = 0;
    this.duration = duration;
    this.directionFlag = 0;
    this.update(0);
    this.DMXData = 0;
    return this.proxify(['time', 'DMXData']);
  }

  /**
   * FXChannel fixture pool
   *
   * @type {Number}
   */
  set fixtures(fixtures) {
    this._fixtures = fixtures.map((fixture, index) => {
      const phase = 360 * (index / fixtures.length) * (Math.PI / 180);
      return new FXFixture(fixture, {
        active: true,
        phase,
      });
    });
  }

  get fixtures() {
    return this._fixtures || [];
  }

  /**
   * FXChannel effect direction
   *
   * @type {Number}
   */
  set direction(direction) {
    this._direction = direction != null ? direction : DEFAULT_FXCHANNEL_DATA.DIRECTION;
    this.computeFixturesPhasing();
    this.update(this.time);
  }

  get direction() {
    return this._direction;
  }

  /**
   * FXChannel waveform type
   *
   * @type {Number}
   */
  set waveform(waveform) {
    this._waveform = waveform != null ? waveform : DEFAULT_FXCHANNEL_DATA.WAVEFORM;
    this.update(this.time);
  }

  get waveform() {
    return this._waveform;
  }

  /**
   * FXChannel minimum value
   *
   * @type {Number}
   */
  set min(min) {
    this._min = min != null ? min : DEFAULT_FXCHANNEL_DATA.MIN;
    this.update(this.time);
  }

  get min() {
    return this._min;
  }

  /**
   * FXChannel maximum value
   *
   * @type {Number}
   */
  set max(max) {
    this._max = max != null ? max : DEFAULT_FXCHANNEL_DATA.MAX;
    this.update(this.time);
  }

  get max() {
    return this._max;
  }

  /**
   * FXChannel effect frequency (max 10)
   *
   * @type {Number}
   */
  set frequency(frequency) {
    this._frequency = frequency != null ? frequency : DEFAULT_FXCHANNEL_DATA.FREQUENCY;
    this.update(this.time);
  }

  get frequency() {
    return this._frequency;
  }

  /**
   * FXChannel phasing in degrees (max 360)
   *
   * @type {Number}
   */
  set phase(phase) {
    this._phase = phase != null ? phase : DEFAULT_FXCHANNEL_DATA.PHASE;
    this._phaseRad = this.phase * (Math.PI / 180);
    this.update(this.time);
  }

  get phase() {
    return this._phase;
  }

  /**
   * FXChannel fixture phasing start interval value in degrees (min -360, max 360)
   *
   * @type {Number}
   */
  set fixturePhaseStart(fixturePhaseStart) {
    this._fixturePhaseStart = fixturePhaseStart != null
      ? fixturePhaseStart
      : DEFAULT_FXCHANNEL_DATA.FIXTURE_PHASE.START;
    this.computeFixturesPhasing();
    this.update(this.time);
  }

  get fixturePhaseStart() {
    return this._fixturePhaseStart != null
      ? this._fixturePhaseStart
      : DEFAULT_FXCHANNEL_DATA.FIXTURE_PHASE.START;
  }

  /**
   * FXChannel fixture phasing stop interval value in degrees (min -360, max 360)
   *
   * @type {Number}
   */
  set fixturePhaseStop(fixturePhaseStop) {
    this._fixturePhaseStop = fixturePhaseStop != null
      ? fixturePhaseStop
      : DEFAULT_FXCHANNEL_DATA.FIXTURE_PHASE.STOP;
    this.computeFixturesPhasing();
    this.update(this.time);
  }

  get fixturePhaseStop() {
    return this._fixturePhaseStop != null
      ? this._fixturePhaseStop
      : DEFAULT_FXCHANNEL_DATA.FIXTURE_PHASE.STOP;
  }

  /**
   * FXChannel phase value in radians
   *
   * @readonly
   * @type {Number}
   */
  get phaseRad() {
    return this._phaseRad;
  }

  /**
   * FXChannel listable data
   *
   * @readonly
   * @type {Object}
   */
  get listable() {
    const standardizedType = this.type.toLowerCase().replace(' ', '');
    return {
      name: this.type,
      icon: standardizedType,
      type: this.type,
    };
  }

  /**
   * FXChannel listable fixtures data
   *
   * @readonly
   * @type {Number}
   */
  get listableFixtures() {
    return this.fixtures.map((fixture) => fixture.listable);
  }

  /**
   * FXChannel effect period
   *
   * @readonly
   * @type {Number}
   */
  get period() {
    return 1 / this.frequency;
  }

  /**
   * FXChannel effect average value
   *
   * @readonly
   * @type {Number}
   */
  get average() {
    return Math.ceil(0.5 * (this.min + this.max));
  }

  /**
   * FXChannel effect amplitude
   *
   * @readonly
   * @type {Number}
   */
  get amplitude() {
    return Math.ceil(0.5 * (this.max - this.min));
  }

  /**
   * FXChannel available wave options
   *
   * @readonly
   * @type {Number}
   */
  // eslint-disable-next-line class-methods-use-this
  get waveOptions() {
    return Object.keys(FX_CHANNEL_WAVEFORMS);
  }

  /**
   * FXChannel available direction options
   *
   * @readonly
   * @type {Number}
   */
  // eslint-disable-next-line class-methods-use-this
  get directionOptions() {
    return Object.keys(FX_CHANNEL_DIRECTIONS);
  }

  /**
   * FXChannel color
   *
   * @readonly
   * @type {Number}
   */
  get color() {
    switch (this.type) {
      case 'Red':
        return UkColors.Maroon;
      case 'Green':
        return UkColors.Green;
      case 'Blue':
        return UkColors.Blue;
      case 'Cyan':
        return UkColors.LightBlue;
      case 'Magenta':
        return UkColors.Maroon;
      case 'Yellow':
        return UkColors.Gold;
      default:
        return UkColors[Object.keys(UkColors)[this.hashCode % Object.keys(UkColors).length]];
    }
  }

  /**
   * FXChannel hashcode (mostmy for color generation)
   *
   * @readonly
   * @type {Number}
   */
  get hashCode() {
    let hashCode = 0;
    for (let i = 0; i < Math.min(this.type.length, 3); i++) {
      hashCode += this.type.charCodeAt(i);
    }
    return hashCode;
  }

  /**
   * FXChannel exportable show data chunk
   *
   * @readonly
   * @type {Number}
   */
  get showData() {
    return {
      type: this.type,
      fixtures: this.fixtures.map((f) => f.showData),
      direction: this.direction,
      waveform: this.waveform,
      max: this.max,
      min: this.min,
      frequency: this.frequency,
      phase: this.phase,
      fixturePhaseStart: this.fixturePhaseStart,
      fixturePhaseStop: this.fixturePhaseStop,
    };
  }

  /**
   * Compute fixtures phase based on fixturePhaseStart/Stop values
   *
   * @public
   */
  computeFixturesPhasing() {
    const activeFixtures = this.fixtures.flatMap((fixture) => (fixture.active ? fixture : []));
    activeFixtures.forEach((fixture, index) => {
      switch (this.direction) {
        case FX_CHANNEL_DIRECTIONS.LTR:
          fixture.phase = (
            (this.fixturePhaseStop - this.fixturePhaseStart)
            * (index / activeFixtures.length)
            * (Math.PI / 180) + this.fixturePhaseStart * (Math.PI / 180)
          );
          break;
        case FX_CHANNEL_DIRECTIONS.RTL:
          fixture.phase = -(this.fixturePhaseStop - this.fixturePhaseStart)
          * (index / activeFixtures.length) * (Math.PI / 180)
          + this.fixturePhaseStart * (Math.PI / 180);
          break;
        case FX_CHANNEL_DIRECTIONS.SYM:
          // eslint-disable-next-line no-case-declarations
          const midpoint = (activeFixtures.length - 1) / 2;
          if (index <= midpoint) {
            fixture.phase = (
              (this.fixturePhaseStop / 2 - this.fixturePhaseStart)
              * (index / midpoint)
              * (Math.PI / 180)
              + this.fixturePhaseStart * (Math.PI / 180)
            );
          } else {
            fixture.phase = (
              (this.fixturePhaseStop / 2 - this.fixturePhaseStart)
              * ((activeFixtures.length - 1 - index) / midpoint)
              * (Math.PI / 180)
              + this.fixturePhaseStart * (Math.PI / 180)
            );
          }
          break;
        default: break;
      }
    });
  }

  /**
   * Pushes a new FXFixture instance into the fixture pool
   *
   * @public
   * @param {Object} fixture Fixture instance handle
   */
  addFixture(fixture) {
    this.fixtures.push(new FXFixture(fixture)); // TODO: replace with ..AndStackUndo once patched
    this.computeFixturesPhasing();
  }

  /**
   * Changes a fixture's index within the list, thus affecting the effect's
   * playing order
   *
   * @public
   * @param {Number} originalIndex Index of the fixture to be moved
   * @param {Number} finalIndex Position index of the slot to be moved at
   */
  changeFixtureOrder(originalIndex, finalIndex) {
    this.fixtures.splice(finalIndex, 0, this.fixtures.splice(originalIndex, 1)[0]);
    this.computeFixturesPhasing();
    this.update(this.time);
  }

  /**
   * Removes an FXFixture instance from the fixture pool
   *
   * @public
   * @param {Object} fixture Fixture instance handle
   */
  deleteFixture(fixture) {
    const index = this.fixtures.findIndex((f) => f.handle.id === fixture.id);
    if (index > -1) {
      this.fixtures.splice(index, 1); // TODO: replace with ..AndStackUndo once patched
    }
    this.computeFixturesPhasing();
  }

  /**
   * Set FXFixtures activity
   *
   * @public
   * @param {Array} activeIds list of FXFixtures IDs to be enabled
   */
  setFixturesActivity(activeIds) {
    this.fixtures.forEach((fixture) => {
      fixture.active = activeIds.includes(fixture.handle.id);
      if (!fixture.active) {
        fixture.handle.setQuickAccessor({
          type: this.type,
          qaIndex: 0,
        }, 0);
      }
    });
    this.computeFixturesPhasing();
    this.update(this.time);
  }

  /**
   * Return triangle wave value at any given time based on channel configuration
   *
   * @public
   * @param {Number} t
   * @param {Number} [phaseOffset=0]
   * @return {Number} sine wave value
   */
  genSine(t, phaseOffset = 0) {
    return (
      this.average
      + this.amplitude
      * Math.sin(2 * Math.PI * this.frequency * t + this.phaseRad + phaseOffset)
    );
  }

  /**
   * Return triangle wave value at any given time based on channel configuration
   *
   * @public
   * @param {Number} t
   * @param {Number} [phaseOffset=0]
   * @return {Number} sinewave value
   */
  genTriangle(t, phaseOffset = 0) {
    return (
      this.average
      + ((2 * this.amplitude) / Math.PI)
      * Math.asin(Math.sin(2 * Math.PI * this.frequency * t + this.phaseRad + phaseOffset))
    );
  }

  /**
   * Returns FXChannel value at any given time based on channel configuration
   *
   * @public
   * @param {Number} t
   * @param {Number} [phaseOffset=0]
   * @return {Number} Channel value
   */
  getValue(t, phaseOffset) {
    switch (this.waveform) {
      case FX_CHANNEL_WAVEFORMS.SINE:
        return this.genSine(t, phaseOffset);
      case FX_CHANNEL_WAVEFORMS.TRIANGLE:
        return this.genTriangle(t, phaseOffset);
      case FX_CHANNEL_WAVEFORMS.SQUARE:
        return this.genSine(t, phaseOffset) >= this.average ? this.max : this.min;
      default:
        return 1;
    }
  }

  /**
   * Updates channel value over time
   *
   * @private
   * @param {Number} t update time
   * @todo Implement computation in webworkers to free eventloop
   */
  update(t) {
    this.time = t;
    this.DMXData = 0;
    this.fixtures.forEach((fixture, index) => {
      if (fixture.active) {
        this.fixtures[index].value = this.getValue(this.time, fixture.phase) || 0;
        this.DMXData += this.fixtures[0].value;
        if (!COLOR_CHANNELS.includes(this.type)) {
          fixture.handle.setQuickAccessor({
            type: this.type,
          }, this.fixtures[index].value);
        } else {
          const currentColorValue = [...fixture.handle.color];
          switch (this.type) {
            case 'Red':
              currentColorValue[0] = this.fixtures[index].value;
              break;
            case 'Green':
              currentColorValue[1] = this.fixtures[index].value;
              break;
            case 'Blue':
              currentColorValue[2] = this.fixtures[index].value;
              break;
            default: break;
          }
          fixture.handle.color = currentColorValue;
        }
      }
    });
  }
}

/**
 * @class FX
 * @extends {Cue}
 * @classdesc Effect cues are cues which allow for parametric modulation of a fixture's channel
 */
class FX extends Cue {
  /**
   * Creates an instance of FX.
   *
   * @param {Object} [data={}]
   * @param {Array} data.fixtures List of FXFixture instances to be associated to the effect
   * @param {Array} data.channels List of FXChannel instances to be associated to the effect
   * @memberof FX
   */
  constructor(data = {}) {
    super(data);
    this.type = CUE_TYPE_EFFECT;
    this._channels = [];
    this.proxify();
    this.fixtures = data.fixtures;
    this.channels = data.channels;
    return this.proxify();
  }

  /**
   * Effect's FXFixture pool
   *
   * @memberof FX
   */
  set fixtures(fixtures) {
    this._fixtures = fixtures.slice();
  }

  get fixtures() {
    return this._fixtures;
  }

  /**
   * Effect's FXChannel pool
   *
   * @memberof FX
   */
  set channels(channels) {
    if (channels) {
      channels.forEach((channel) => this.addChannel(channel));
    } else {
      this._channels = [];
    }
  }

  get channels() {
    return this._channels || [];
  }

  /**
   * List of available channel options
   *
   * @readonly
   * @memberof FX
   */
  get channelOptions() {
    return this.channels.map((channel) => channel.type);
  }

  /**
   * List of available effect presets
   *
   * @readonly
   * @memberof FX
   */
  // eslint-disable-next-line class-methods-use-this
  get listablePresets() {
    return FXPresets.map((item, poolIndex) => ({
      name: item.name,
      icon: 'folder',
      id: poolIndex,
      unfolded: true,
      unfold: item.presets.map((preset, presetIndex) => ({
        name: preset.name,
        icon: preset.name.toLowerCase().replaceAll(' ', ''),
        pool: poolIndex,
        id: presetIndex,
      })),
    }));
  }

  /**
   * Effect's listable channel pool data
   *
   * @type {Object}
   * @readonly
   */
  get listableChannels() {
    return this.channels.map((channel) => channel.listable);
  }

  /**
   * Effect's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return Object.assign(super.showData, {
      type: this.type,
      fixtures: this.fixtures.map((f) => f.id),
      channels: this.channels.map((c) => c.showData),
    });
  }

  /**
   * Add a fixture instance to each effect's channels
   *
   * @public
   * @param {Object} fixture handle to fixture instance
   */
  addFixture(fixture) {
    if (!this.fixtures.find((fxFixture) => fxFixture.id === fixture.id)) {
      this.fixtures.push(fixture); // TODO: replace with ..AndStackUndo once patched
      this.channels.forEach((channel) => {
        channel.addFixture(fixture);
      });
    } else {
      throw new Error('Fixture already in use');
    }
  }

  /**
   * Removes a fixture instance from the effect's channels
   *
   * @public
   * @param {Object} fixture handle to fixture instance
   */
  deleteFixture(fixture) {
    const index = this.fixtures.findIndex((f) => f.id === fixture.id);
    if (index > -1) {
      this.fixtures.splice(index, 1); // TODO: replace with ..AndStackUndo once patched
    }
    this.channels.forEach((channel) => {
      channel.deleteFixture(fixture);
    });
  }

  /**
   * Changes a fixture's index within the list, thus affecting the effect's
   * playing order
   *
   * @public
   * @param {Number} originalIndex Index of the fixture to be moved
   * @param {Number} finalIndex Position index of the slot to be moved at
   */
  changeFixtureOrder(originalIndex, finalIndex) {
    // TODO: replace with ..AndStackUndo once patched
    this.fixtures.splice(finalIndex, 0, this.fixtures.splice(originalIndex, 1)[0]);
    this.channels.forEach((channel) => {
      channel.changeFixtureOrder(originalIndex, finalIndex);
    });
  }

  /**
   * Add a channel instance to the effect's channel pool
   *
   * @public
   * @param {Object} channel handle to channel instance
   */
  addChannel(channel) {
    if (!this.channels.find((fxChannel) => fxChannel.type === channel.type)) {
      // TODO: replace with ..AndStackUndo once patched
      this.channels.push(new FXChannel(channel, this.fixtures, this.duration));
    } else {
      throw new Error('FX channel already in use');
    }
  }

  /**
   * Delete a channel instance from the effect's channel pool
   *
   * @public
   * @param {Object} channel handle to channel instance
   */
  deleteChannel(channel) {
    const channelIndex = this.channels.findIndex((item) => item.type === channel.type);
    if (channelIndex > -1) {
      this.channels.splice(channelIndex, 1); // TODO: replace with ..AndStackUndo once patched
    }
  }

  /**
   * Return channel instance from provided channel type string
   *
   * @public
   * @param {String} type channel type string
   * @returns {Object} handle to channel instance
   */
  getChannelFromType(type) {
    const channel = this.channels.find((item) => item.type === type);
    if (channel) {
      return channel;
    }
    throw new Error('Could not find channel in FX');
  }

  /**
   * Return fixture instance from provided fixture id
   *
   * @public
   * @param {Number} id fixture id
   * @returns {Object} handle to fixture instance
   */
  getFixtureFromId(id) {
    const fixture = this.fixtures.find((item) => item.id === id);
    if (fixture) {
      return fixture;
    }
    throw new Error('Could not find fixture in FX');
  }

  /**
   * Sets up preset channels. If channels already exist, value
   * are replaced with preset's channel values.
   *
   * @public
   * @param {Number} poolId preset pool ID
   * @param {Number} presetId preset ID
   * @see FXPresets
   */
  setupPreset(poolId, presetId) {
    const preset = FXPresets[poolId].presets[presetId];
    Object.keys(preset.channels).forEach((channelName) => {
      const channelData = preset.channels[channelName];
      const existing = this.channels.find((fxChannel) => fxChannel.type === channelName);
      if (!existing) {
        // TODO: replace with ..AndStackUndo once patched
        this.channels.push(new FXChannel(Object.assign(channelData, {
          type: channelName,
        }), this.fixtures, this.duration));
      } else {
        existing.min = channelData.min;
        existing.max = channelData.max;
        existing.phase = channelData.phase;
        existing.frequency = channelData.frequency;
      }
    });
  }

  /**
   * Updates effect's channels individually using provided time in milliseconds
   *
   * @public
   * @param {Number} t Live animation time in milliseconds
   * @todo find a way to implement webworkers to avoid stalling the eventloop
   * @todo memoisation could be an option too ? It might be memory expensive though ?
   */
  update(t) {
    this.time = t % this.durationMS;
    this.DMXActivity = 0;
    const percent = (t % this.durationMS) / this.durationMS;
    this.channels.forEach((channel) => {
      channel.update(percent);
      this.DMXActivity += channel.DMXData;
    });
  }
}

export default FX;
