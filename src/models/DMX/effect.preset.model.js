import Live from './live.model';

// TODO: remove this file

const FX_CHANNEL_WAVEFORMS = {
  SINE: 0,
  TRIANGLE: 1,
  SQUARE: 2,
  PWM: 3,
};

const FX_CHANNEL_DIRECTIONS = {
  LTR: 0,
  RTL: 1,
  BOUNCELRT: 2,
  BOUNCERTL: 3,
};

const FXPresets = [{
  name: 'Zoom',
  presets: [{
    waveform: FX_CHANNEL_WAVEFORMS.SINE,
    name: 'zoom',
    channels: {
      zoom: {
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
      dimmer: {
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
      pan: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 1,
      },
      tilt: {
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
      pan: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 1,
      },
      tilt: {
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
      pan: {
        min: 0,
        max: 255,
        phase: 0,
        frequency: 2,
      },
      tilt: {
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
      pan: {
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
      tilt: {
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
      red: {
        min: 0,
        max: 255,
        phase: 60,
        frequency: 1,
      },
      green: {
        min: 0,
        max: 255,
        phase: 180,
        frequency: 1,
      },
      blue: {
        min: 0,
        max: 255,
        phase: 300,
        frequency: 1,
      },
    },
  }, {
    name: 'color intensity red',
    channels: {
      red: {
        min: 0,
        max: 255,
        phase: 60,
        frequency: 1,
      },

    },
  }, {
    name: 'color intensity green',
    channels: {
      green: {
        min: 0,
        max: 255,
        phase: 60,
        frequency: 1,
      },

    },
  }, {
    name: 'color intensity blue',
    channels: {
      blue: {
        min: 0,
        max: 255,
        phase: 60,
        frequency: 1,
      },
    },
  }],
}];

class FXFixture {
  constructor(fixture, fixturePreset = {
    active: true,
    phase: 0,
  }) {
    this.handle = fixture;
    this.phase = fixturePreset.phase;
    this.active = fixturePreset.active;
    this.value = 0;
  }

  get listable() {
    return {
      id: this.handle.id,
      name: this.handle.name,
      active: this.active,
      icon: 'wave',
    };
  }
}

class FXChannel {
  constructor(channel, fixtures, presetValues = {
    min: 0,
    max: 255,
    frequency: 1,
    phase: 0,
  }) {
    this.handle = channel;
    this.fixtures = fixtures;
    this.direction = FX_CHANNEL_DIRECTIONS.LTR;
    this.waveform = FX_CHANNEL_WAVEFORMS.SINE;
    this.max = presetValues.max;
    this.min = presetValues.min;
    this.frequency = presetValues.frequency;
    this.phase = presetValues.phase;
    this.fixturePhaseStart = 0;
    this.fixturePhaseStop = 360;
    this.time = 0;
    this.directionFlag = 0;
    this.update(0);
  }

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
    return this._fixtures;
  }

  set phase(phase) {
    this._phase = phase;
    this._phaseRad = phase * (Math.PI / 180);
  }

  get phase() {
    return this._phase;
  }

  set fixturePhaseStart(fixturePhaseStart) {
    this._fixturePhaseStart = fixturePhaseStart;
    this.computeFixturesPhasing();
  }

  get fixturePhaseStart() {
    return this._fixturePhaseStart || 0;
  }

  set fixturePhaseStop(fixturePhaseStop) {
    this._fixturePhaseStop = fixturePhaseStop;
    this.computeFixturesPhasing();
  }

  get fixturePhaseStop() {
    return this._fixturePhaseStop || 360;
  }

  get phaseRad() {
    return this._phaseRad;
  }

  get listable() {
    const standardizedType = this.handle.type.toLowerCase().replace(' ', '');
    return {
      id: this.handle.id,
      name: this.handle.type === 'Color'
        ? this.handle.color
        : this.handle.type,
      icon: standardizedType + (
        this.handle.type === 'Color'
          ? `intensity${this.handle.color}`
          : ''
      ).toLowerCase(),
      more: `CH-${this.handle.id}`,
    };
  }

  get listableFixtures() {
    return this.fixtures.map((fixture) => fixture.listable);
  }

  get period() {
    return 1 / this.frequency;
  }

  get average() {
    return Math.ceil(0.5 * (this.min + this.max));
  }

  get amplitude() {
    return Math.ceil(0.5 * (this.max - this.min));
  }

  // eslint-disable-next-line class-methods-use-this
  get waveOptions() {
    return Object.keys(FX_CHANNEL_WAVEFORMS);
  }

  // eslint-disable-next-line class-methods-use-this
  get directionOptions() {
    return Object.keys(FX_CHANNEL_DIRECTIONS);
  }

  computeFixturesPhasing() {
    const activeFixtures = this.fixtures.flatMap((fixture) => (fixture.active ? fixture : []));
    activeFixtures.forEach((fixture, index) => {
      fixture.phase = (
        (this.fixturePhaseStop - this.fixturePhaseStart)
        * (index / activeFixtures.length) * (Math.PI / 180)
      );
    });
  }

  addFixture(fixture) {
    this.fixtures.push(new FXFixture(fixture));
    this.computeFixturesPhasing();
  }

  setFixturesActivity(activeIds) {
    this.fixtures.forEach((fixture) => {
      fixture.active = activeIds.includes(fixture.handle.id);
      if (!fixture.active) {
        fixture.handle.setChannel(this.handle.id - 1, 0);
      }
    });
    this.computeFixturesPhasing();
    this.update(this.time);
  }

  genSine(t, phaseOffset = 0) {
    return (
      this.average
      + this.amplitude
      * Math.sin(2 * Math.PI * this.frequency * t + this.phaseRad + phaseOffset)
    );
  }

  genTriangle(t, phaseOffset = 0) {
    return (
      this.average
      + ((2 * this.amplitude) / Math.PI)
      * Math.asin(Math.sin(2 * Math.PI * this.frequency * t + this.phaseRad + phaseOffset))
    );
  }

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

  update(t) {
    this.time = t;
    this.fixtures.forEach((fixture, index) => {
      if (fixture.active) {
        let phase;
        switch (this.direction) {
          case FX_CHANNEL_DIRECTIONS.LTR:
            phase = fixture.phase;
            break;
          case FX_CHANNEL_DIRECTIONS.RTL:
            phase = -fixture.phase;
            break;
          default:
            phase = fixture.phase;
        }
        this.fixtures[index].value = this.getValue(this.time, phase);
        fixture.handle.setChannel(this.handle.id - 1, this.fixtures[index].value);
      }
    });
  }
}

class FX {
  constructor() {
    this.fixtures = [];
    this.channels = [];
    this.bars = 8;
    this.time = 0;
  }

  get duration() {
    return this.bars * Live.barDuration;
  }

  get channelOptions() {
    return this.channels.map((channel) => channel.type);
  }

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

  get listableChannels() {
    return this.channels.map((channel) => channel.listable);
  }

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

  addChannel(channel) {
    if (!this.channels.find((fxChannel) => fxChannel.handle.id === channel.id)) {
      this.channels.push(new FXChannel(channel, this.fixtures));
    } else {
      throw new Error('FX channel already in use');
    }
  }

  getChannelFromId(id) {
    const channel = this.channels.find((item) => item.handle.id === id);
    if (channel) {
      return channel;
    }
    throw new Error('Could not find channel in FX');
  }

  getFixtureFromId(id) {
    const fixture = this.fixtures.find((item) => item.id === id);
    if (fixture) {
      return fixture;
    }
    throw new Error('Could not find fixture in FX');
  }

  setupPreset(poolId, presetId) {
    const preset = FXPresets[poolId].presets[presetId];
    Object.keys(preset.channels).forEach((channelName) => {
      const channelData = preset.channels[channelName];
      const channel = this.fixtures[0].getQuickAccessorChannel(channelName);
      const existing = this.channels.find((fxChannel) => fxChannel.handle.id === channel.id);
      if (!existing) {
        this.channels.push(new FXChannel(channel, this.fixtures, channelData));
      } else {
        existing.min = channelData.min;
        existing.max = channelData.max;
        existing.phase = channelData.phase;
        existing.frequency = channelData.frequency;
      }
    });
  }

  update(t) {
    this.time = (t % this.duration) / this.duration;
    this.channels.forEach((channel) => {
      channel.update(this.time);
    });
  }
}

export default FX;
