import UkColors from '@/views/components/uikit/colors/uikit.colors';
import Cue, { CUE_LOOP_STYLES } from './cue.model';

let fxFixtureId = 0;

/**
 * The colour each colour channel removes (CMY) or adds (RGB): a red effect drives cyan inverted
 *
 * @constant {Object} COMPLEMENTS
 */
const COMPLEMENTS = {
  Red: 'Cyan', Green: 'Magenta', Blue: 'Yellow', Cyan: 'Red', Magenta: 'Green', Yellow: 'Blue',
};
const MAX_DMX = 255;

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
  SYMREV: 5,
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
class FXFixture {
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
  constructor(
    fixture,
    // eslint-disable-next-line default-param-last
    fixturePreset = {
      active: true,
      phase: 0,
    },
    fxChannelHandle,
  ) {
    const preset = fixturePreset || { active: true, phase: 0 };
    this.handle = fixture;
    this.channelHandle = fxChannelHandle;
    this.phase = preset.phase;
    this.active = preset.active;
    this.value = 0;
    this.id = fxFixtureId++;
    this.buildTargets();
  }

  /**
   * The fixture channels the effect channel drives, per cell (the fixture's cells in order, then
   * the whole fixture's channels): `direct` indexes take the value, `inverted` ones 255 minus it
   * (CMY for a colour effect). Each target has its own `phase` (radians) for phases across cells
   *
   * @public
   */
  buildTargets() {
    const { type } = this.channelHandle;
    const channels = this.handle.channels || [];
    const complement = COMPLEMENTS[type];
    const groups = new Map();
    (this.handle.cells || []).forEach((cell) => groups.set(cell.name, null));
    groups.set('', null);
    channels.forEach((channel, index) => {
      if (channel.isFine) return;
      let inverted = false;
      if (complement) {
        const mixing = /^Color(Add|Sub|RGB)_/.test(channel.attribute || '');
        if (!mixing || (channel.color !== type && channel.color !== complement)) return;
        inverted = channel.color === complement;
      } else if (channel.kind !== type) return;
      const key = channel.cell || '';
      if (!groups.get(key)) {
        groups.set(key, {
          cell: channel.cell, direct: [], inverted: [], phase: 0,
        });
      }
      groups.get(key)[inverted ? 'inverted' : 'direct'].push(index);
    });
    this.targets = [...groups.values()].filter(Boolean);
    this._channels = channels;
  }

  /**
   * Rebuilds the targets when the fixture's channels changed (mode change)
   *
   * @public
   * @returns {Boolean} Whether they were rebuilt
   */
  refreshTargets() {
    if (this._channels === this.handle.channels) return false;
    this.buildTargets();
    return true;
  }

  /**
   * Number of cell targets (phase slots across cells), at least 1
   *
   * @readonly
   * @type {Number}
   */
  get cellCount() {
    let count = 0;
    for (let i = 0; i < this.targets.length; i++) if (this.targets[i].cell) count += 1;
    return Math.max(count, 1);
  }

  /**
   * Writes a value to every target channel
   *
   * @public
   * @param {Number} value DMX value (0-255, fractional values set the fine channel)
   */
  writeAll(value) {
    for (let k = 0; k < this.targets.length; k++) this.writeTarget(this.targets[k], value);
  }

  /**
   * Writes a value to one target's channels
   *
   * @public
   * @param {Object} target Target
   * @param {Number} value DMX value
   */
  writeTarget(target, value) {
    const { handle } = this;
    for (let i = 0; i < target.direct.length; i++) handle.setChannel(target.direct[i], value);
    for (let i = 0; i < target.inverted.length; i++) {
      handle.setChannel(target.inverted[i], MAX_DMX - value);
    }
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
class FXChannel {
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
   * @param {Boolean} [channel.cellPhase=false] Whether the phase spreads over every cell of the
   * fixtures rather than over the fixtures

   * @param {Array} fixtures Array of fixture instances
   */
  constructor(channel, fixtures, duration) {
    this.type = channel.type;
    this._cellPhase = channel.cellPhase === true;
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
  }

  /**
   * Whether the phase spreads over every cell of the fixtures (fixture order, then cell order)
   * rather than over the fixtures
   *
   * @type {Boolean}
   */
  set cellPhase(cellPhase) {
    this._cellPhase = Boolean(cellPhase);
    this.computeFixturesPhasing();
    this.update(this.time);
  }

  get cellPhase() {
    return this._cellPhase;
  }

  /**
   * FXChannel fixture pool
   *
   * @type {Number}
   */
  set fixtures(fixtures) {
    this._fixtures = fixtures.map((fixture, index) => {
      const phase = 360 * (index / fixtures.length) * (Math.PI / 180);
      const fxFixture = new FXFixture(
        fixture,
        {
          active: true,
          phase,
        },
        this,
      );
      return fxFixture;
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
      cellPhase: this.cellPhase,
    };
  }

  /**
   * Compute fixtures phase based on fixturePhaseStart/Stop values
   *
   * Rewritten from flatMap()+forEach() to a manual for-loop: flatMap()
   * allocates an intermediate array just to flatten single-element arrays,
   * and the span/start values in radians were being recomputed on every
   * iteration even though they don't depend on the loop index.
   *
   * @public
   */
  computeFixturesPhasing() {
    const { fixtures } = this;
    const activeFixtures = [];

    for (let i = 0; i < fixtures.length; i++) {
      if (fixtures[i].active) {
        activeFixtures.push(fixtures[i]);
      }
    }

    // Phase slots: one per fixture, or one per cell when the phase spreads across cells
    let len = 0;
    for (let i = 0; i < activeFixtures.length; i++) {
      len += this._cellPhase ? activeFixtures[i].cellCount : 1;
    }
    const startRad = this.fixturePhaseStart * (Math.PI / 180);
    const spanRad = (this.fixturePhaseStop - this.fixturePhaseStart) * (Math.PI / 180);

    let index = 0;
    for (let f = 0; f < activeFixtures.length; f++) {
      const fixture = activeFixtures[f];
      fixture.phase = this.slotPhase(index, len, startRad, spanRad);
      const { targets } = fixture;
      for (let k = 0; k < targets.length; k++) {
        if (this._cellPhase && targets[k].cell) {
          targets[k].phase = this.slotPhase(index, len, startRad, spanRad);
          index += 1;
        } else {
          targets[k].phase = fixture.phase;
        }
      }
      if (!this._cellPhase || !targets.some((t) => t.cell)) index += 1;
    }
  }

  /**
   * Phase of one slot (a fixture, or a cell) among `len`, from the direction and the phase start
   * and span
   *
   * @private
   * @param {Number} index Slot index
   * @param {Number} len Slot count
   * @param {Number} startRad Phase start, radians
   * @param {Number} spanRad Phase span, radians
   * @returns {Number} Phase in radians
   */
  slotPhase(index, len, startRad, spanRad) {
    switch (this.direction) {
      case FX_CHANNEL_DIRECTIONS.LTR:
        return spanRad * (index / len) + startRad;
      case FX_CHANNEL_DIRECTIONS.RTL:
        return -spanRad * (index / len) + startRad;
      case FX_CHANNEL_DIRECTIONS.SYM: {
        const normalizedIndex = index / (len - 1);
        // First half: 0 to 0.5, second half: 0.5 to 0
        const phaseOffset = normalizedIndex <= 0.5
          ? normalizedIndex * 2
          : (1 - normalizedIndex) * 2;
        return spanRad * phaseOffset + startRad;
      }
      case FX_CHANNEL_DIRECTIONS.SYMREV: {
        const halfLength = len / 2;
        if (index < halfLength) {
          // First half: spread from 0 to π
          return (index / (halfLength - 1)) * Math.PI;
        }
        // Second half: spread from 2π to π
        return (2 * Math.PI) - (((index - halfLength) / (halfLength - 1)) * Math.PI);
      }
      default:
        return 0;
    }
  }

  /**
   * Pushes a new FXFixture instance into the fixture pool
   *
   * @public
   * @param {Object} fixture Fixture instance handle
   */
  addFixture(fixture) {
    const fxFixture = new FXFixture(
      fixture,
      null,
      this,
    );
    this.fixtures.push(fxFixture);
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
      this.fixtures.splice(index, 1);
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
        fixture.writeAll(0);
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
   * Updates channel value over time: writes every target channel of every active fixture (each
   * cell at its own phase when the phase spreads across cells). No allocation per call; targets
   * are rebuilt only when a fixture's channels change.
   *
   * @private
   * @param {Number} t update time
   * @todo Implement computation in webworkers to free eventloop
   */
  update(t) {
    this.time = t;
    this.DMXData = 0;

    const fixtures = this._fixtures || [];
    let rephase = false;
    for (let i = 0; i < fixtures.length; i++) {
      if (fixtures[i].refreshTargets()) rephase = true;
    }
    if (rephase) this.computeFixturesPhasing();

    for (let i = 0; i < fixtures.length; i++) {
      const fixture = fixtures[i];

      if (!fixture.active) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const value = this.getValue(this.time, fixture.phase) || 0;
      fixture.value = value;
      this.DMXData += value;

      const { targets } = fixture;
      for (let k = 0; k < targets.length; k++) {
        const target = targets[k];
        fixture.writeTarget(target, this._cellPhase && target.cell
          ? this.getValue(this.time, target.phase) || 0
          : value);
      }
    }
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
    this.loopStyle = data.loopStyle != null ? data.loopStyle : CUE_LOOP_STYLES.LOOP;
    this.type = CUE_TYPE_EFFECT;
    this._channels = [];
    this.fixtures = data.fixtures;
    this.channels = data.channels;
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
      this.fixtures.push(fixture);
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
      this.fixtures.splice(index, 1);
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
      const fxChannel = new FXChannel(channel, this.fixtures, this.duration);
      this.channels.push(fxChannel);
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
      this.channels.splice(channelIndex, 1);
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
   * Updates effect's channels individually using provided time in milliseconds.
   *
   * Rewritten from forEach() to a for-loop, and `t % this.durationMS` is now
   * computed once and reused for both this.time and percent instead of twice.
   *
   * @public
   * @param {Number} t Live animation time in milliseconds
   * @todo find a way to implement webworkers to avoid stalling the eventloop
   * @todo memoisation could be an option too ? It might be memory expensive though ?
   */
  update(t) {
    const time = t % this.durationMS;
    this.time = time;
    this.DMXActivity = 0;
    const percent = time / this.durationMS;

    const { channels } = this;
    let activity = 0;

    for (let i = 0; i < channels.length; i++) {
      channels[i].update(percent);
      activity += channels[i].DMXData;
    }

    this.DMXActivity = activity;
  }
}

export default FX;
