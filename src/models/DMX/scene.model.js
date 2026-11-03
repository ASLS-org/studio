import Cue from './cue.model';
import Fade from './fade.model';

/**
 * List of RGB color channels names as described in OFL-formated files
 *
 * @constant {Array<String>} RGB_CHANNELS
 */
const RGB_CHANNELS = ['Red', 'Green', 'Blue'];

/**
 * List of CMY color channels names as described in OFL-formated files
 *
 * @constant {Array<String>} CMY_CHANNELS
 */
const CMY_CHANNELS = ['Cyan', 'Magenta', 'Yellow'];

/**
 * Enumeration of scene's running directions
 *
 * @constant {Object} SCENE_DIRECTIONS
 * @enum {Number}
 */
const SCENE_DIRECTIONS = {
  IN: 0,
  OUT: 1,
};

/**
 * Deep-clones the {type: [channel, ...]} accessor map without going through
 * JSON.stringify/JSON.parse. The JSON round trip was serializing every
 * channel object to a string and re-parsing it just to get a structurally
 * identical object graph - a manual clone of this fixed, known shape does the
 * same job for a fraction of the cost, which matters because this runs once
 * per fixture every time a scene/fixtureValue is built.
 *
 * @param {Object} source
 * @return {Object}
 */
function cloneQuickAccessors(source) {
  const clone = {};
  const keys = Object.keys(source);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const channels = source[key];
    const clonedChannels = new Array(channels.length);

    for (let j = 0; j < channels.length; j++) {
      const c = channels[j];
      clonedChannels[j] = {
        id: c.id,
        type: c.type,
        value: c.value,
        active: c.active,
        color: c.color,
        qaIndex: c.qaIndex,
      };
    }

    clone[key] = clonedChannels;
  }

  return clone;
}

/**
 * @class FixtureValue
 * @classdesc FixtureValues describe a set of preset channel values for a given fixture
 */
class FixtureValue {
  /**
   * Creates an instance of FixtureValue.
   *
   * @param {Object} fixture handle to fixture instance
   * @param {Array<Number>} channelValues List of fixture's preset channel values
   */
  constructor(fixture, channelValues) {
    this.fixture = fixture;

    // Internal flattened representation used by the runtime update loop.
    // Keeping the original quickChannelsAccessors structure intact preserves
    // the public API while avoiding Object.keys()/nested iteration per frame.
    this._channels = [];

    this.channelValues = channelValues;
  }

  /**
   * Channel values
   *
   * @type {Array<Number>}
   */
  set channelValues(channelValues) {
    const source = this.fixture.quickChannelsAccessors;

    // Preserve the existing behavior of creating an independent runtime
    // structure for this FixtureValue, without paying for a JSON round trip.
    this._quickChannelsAccessors = cloneQuickAccessors(source);

    // Build the flattened channel list once.
    this._channels.length = 0;

    const channelTypes = Object.keys(this._quickChannelsAccessors);

    for (let i = 0; i < channelTypes.length; i++) {
      const channels = this._quickChannelsAccessors[channelTypes[i]];

      for (let j = 0; j < channels.length; j++) {
        this._channels.push(channels[j]);
      }
    }

    if (!channelValues.length) {
      for (let i = 0; i < this._channels.length; i++) {
        const channel = this._channels[i];

        channel.value = 0;
        channel.active = false;
      }
    } else {
      for (let i = 0; i < channelValues.length; i++) {
        this.setQuickAccessor(channelValues[i]);
      }
    }
  }

  /**
   * Returns the flattened runtime channel list.
   *
   * This is primarily intended for internal animation/update processing.
   *
   * @readonly
   * @type {Array<Object>}
   */
  get channels() {
    return this._channels;
  }

  /**
   * Channel values
   *
   * @type {Array<Number>}
   */
  // eslint-disable-next-line grouped-accessor-pairs
  get channelValues() {
    const channelValues = [];

    const channels = this._channels;

    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];

      channelValues.push({
        id: channel.id,
        type: channel.type,
        value: channel.value,
        active: channel.active,
        color: channel.color,
        qaIndex: channel.qaIndex,
      });
    }

    return channelValues;
  }

  /**
   * Fixture's color channels values.
   * Only RGB color suppoprtded at the moment.
   *
   * @todo Implement other color changer types (HSB...). Should do for the alpha
   *
   * @type {Array<Number>}
   */
  set color(rgbValue) {
    if (this.hasQuickAccessor({
      type: 'Color',
    })) {
      const channels = this.quickChannelsAccessors.Color;

      for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];

        if (RGB_CHANNELS.includes(channel.color)) {
          channel.value = rgbValue[RGB_CHANNELS.indexOf(channel.color)];
          channel.active = true;
          this.setQuickAccessor(channel);
        } else if (CMY_CHANNELS.includes(channel.color)) {
          channel.value = 255 - rgbValue[CMY_CHANNELS.indexOf(channel.color)];
          channel.active = true;
          this.setQuickAccessor(channel);
        }
      }
    }
  }

  /**
   * Fixture's color channels values.
   *
   * @type {Array<Number>}
   */
  get color() {
    const colorValues = [0, 0, 0];

    if (this.hasQuickAccessor({
      type: 'Color',
    })) {
      const channels = this.quickChannelsAccessors.Color;

      for (let i = 0; i < channels.length; i++) {
        const colorChannel = channels[i];

        if (RGB_CHANNELS.includes(colorChannel.color)) {
          colorValues[RGB_CHANNELS.indexOf(colorChannel.color)] = colorChannel.value;
        } else if (CMY_CHANNELS.includes(colorChannel.color)) {
          colorValues[CMY_CHANNELS.indexOf(colorChannel.color)] = 255 - colorChannel.value;
        }
      }
    }

    return colorValues;
  }

  /**
   * Fixture's pan&tilt channels values (0-255)/(0-255)
   *
   * @type {Object}
   */
  set panTilt(value) {
    this.setQuickAccessor({
      type: 'Pan',
      value: value.pan,
      active: true,
    });

    this.setQuickAccessor({
      type: 'Tilt',
      value: value.tilt,
      active: true,
    });

    this.setQuickAccessor({
      type: 'PanFine',
      value: value.panFine,
      active: true,
    });

    this.setQuickAccessor({
      type: 'TiltFine',
      value: value.tiltFine,
      active: true,
    });
  }

  /**
   * Fixture's pan&tilt channels values (0-255)/(0-255)
   *
   * @type {Object}
   */
  get panTilt() {
    const result = {
      pan: 0,
      panFine: 0,
      tilt: 0,
      tiltFine: 0,
    };

    let accessor;

    if (this.hasQuickAccessor({
      type: 'Pan',
    })) {
      accessor = this.getQuickAccessor({
        type: 'Pan',
      });

      result.pan = accessor.value;
    }

    if (this.hasQuickAccessor({
      type: 'PanFine',
    })) {
      accessor = this.getQuickAccessor({
        type: 'PanFine',
      });

      result.panFine = accessor.value;
    }

    if (this.hasQuickAccessor({
      type: 'Tilt',
    })) {
      accessor = this.getQuickAccessor({
        type: 'Tilt',
      });

      result.tilt = accessor.value;
    }

    if (this.hasQuickAccessor({
      type: 'TiltFine',
    })) {
      accessor = this.getQuickAccessor({
        type: 'TiltFine',
      });

      result.tiltFine = accessor.value;
    }

    return result;
  }

  /**
   * List of quick channels accessors
   *
   * @readonly
   * @type {Array<Object>}
   */
  get quickChannelsAccessors() {
    return this._quickChannelsAccessors || {};
  }

  /**
   * Sets quick accessor activity and value
   *
   * @public
   * @param {Object} channel channel object
   */
  setQuickAccessor(channel) {
    const channels = this._quickChannelsAccessors[channel.type];

    if (!channels) {
      return;
    }

    const accessor = channels[channel.qaIndex || 0];

    if (!accessor) {
      return;
    }

    accessor.value = channel.value;
    accessor.active = channel.active;

    this.fixture.setChannel(accessor.id - 1, accessor.value);
  }

  /**
   * Checks if quick accessor exists
   *
   * @public
   * @param {Object} channel channel object
   * @returns {Boolean} Whether the accesor exists or not
   */
  hasQuickAccessor(channel) {
    const channels = this._quickChannelsAccessors[channel.type];

    return channels !== undefined
      && channels[channel.qaIndex || 0] !== undefined;
  }

  /**
   * Returns quick accessor from channel
   *
   * @public
   * @param {Object} channel channel object
   * @returns {Object} handle to quick accessor
   */
  getQuickAccessor(channel) {
    if (!this.hasQuickAccessor(channel)) {
      return null;
    }

    return this._quickChannelsAccessors[channel.type][channel.qaIndex || 0];
  }
}

/**
 * @class Scene
 * @extends {Cue}
 * @classdesc Scenes are cues which allow the control of one or many fixture's channels by providing
 * each with a set of preset values which will be set (gradually or not) on scene cue
 */
class Scene extends Cue {
  /**
   * Creates an instance of Scene.
   *
   * @param {Object} sceneData Scene configuration object
   * @param {Object} sceneData.fadeIn Scene fadein configuration object
   * @param {Object} sceneData.fadeOut Scene fadeOUT configuration object
   * @param {Object} sceneData.fixtures Scene fixture list
   * @param {Object} sceneData.fixtureValues Scene fixtureValue list for each fixture
   * @see Fade
   * @example let scene = new Scene({});
   */
  constructor(sceneData) {
    super(sceneData);

    this.direction = SCENE_DIRECTIONS.IN;
    this.fixtures = sceneData.fixtures;
    this.fixtureValues = sceneData.fixtureValues;

    this.fadeIn = new Fade({
      direction: 0,
      // duration: sceneData.duration
      ...sceneData.fadeIn,
    });

    this.fadeOut = new Fade({
      direction: 1,
      // duration: sceneData.duration
      ...sceneData.fadeOut,
    });

    this.duration = sceneData.duration;
  }

  /**
   * Scene fixtures
   *
   * @type {Array<FixtureValue>}
   */
  set fixtures(fixtures) {
    this._fixtures = fixtures;

    const fixtureValues = new Array(fixtures.length);

    for (let i = 0; i < fixtures.length; i++) {
      fixtureValues[i] = new FixtureValue(fixtures[i], []);
    }

    this._fixtureValues = fixtureValues;
  }

  /**
   * Scene fixtures
   *
   * @type {Array<FixtureValue>}
   */
  get fixtures() {
    return this._fixtures;
  }

  /**
   * Scene fixturevalues
   *
   * @type {Array<Object>}
   */
  set fixtureValues(fixtureValues) {
    if (fixtureValues && fixtureValues.length) {
      for (let i = 0; i < fixtureValues.length; i++) {
        const fixtureValueData = fixtureValues[i];
        const fixtureValue = this.getFixtureValueFromId(
          fixtureValueData.fixture.id,
        );

        if (fixtureValue) {
          fixtureValue.channelValues = fixtureValueData.channelValues;
        }
      }
    }
  }

  /**
   * Scene fixturevalues
   *
   * @type {Array<Object>}
   */
  get fixtureValues() {
    return this._fixtureValues || [];
  }

  /**
   * Scene running direction (in/out)
   *
   * @type {Number}
   */
  set direction(direction) {
    this._direction = direction;
  }

  get direction() {
    return this._direction;
  }

  /**
   * Cue duration in bars
   *
   * @type {Number}
   */
  set duration(duration) {
    super.duration = duration;

    if (this.fadeIn) {
      this.fadeIn.duration = this.duration;
      this.fadeOut.duration = this.duration;
    }
  }

  /**
   * Cue duration in bars
   *
   * @type {Number}
   */
  get duration() {
    return super.duration;
  }

  /**
   * Scene's listable fixtures data
   *
   * @readonly
   * @type {Array<Object>}
   */
  get listableFixtures() {
    const fixtureValues = this._fixtureValues;

    return fixtureValues.map((fixtureValue) => ({
      name: fixtureValue.fixture.name,
      id: fixtureValue.fixture.id,
      icon: 'movinghead',
      more: `U${fixtureValue.fixture.universe}-CH${fixtureValue.fixture.chStart}`,
    }));
  }

  /**
   * Scene's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return Object.assign(super.showData, {
      type: 0,
      fixtures: this.fixtures.map((f) => f.id),
      fixtureValues: this.fixtureValues.map((fv) => ({
        fixture: {
          id: fv.fixture.id,
        },
        channelValues: fv.channelValues,
      })),
      fadeIn: this.fadeIn.showData,
      fadeOut: this.fadeOut.showData,
    });
  }

  /**
   * Add a fixture to the scene's fixture pool
   *
   * @public
   * @param {Object} fixture
   */
  addFixture(fixture) {
    this._fixtureValues.push(new FixtureValue(fixture, []));
  }

  /**
   * Returns fixtureValue from provided fixture ID
   *
   * @public
   * @param {Number} id fixture ID
   * @return {Object}
   */
  getFixtureValueFromId(id) {
    const fixtureValues = this._fixtureValues;

    for (let i = 0; i < fixtureValues.length; i++) {
      if (fixtureValues[i].fixture.id === id) {
        return fixtureValues[i];
      }
    }

    return undefined;
  }

  /**
   * Returns fixture from provided fixture ID
   *
   * @public
   * @param {Number} id fixture ID
   * @return {Object}
   */
  getFixtureFromId(id) {
    const fixtures = this._fixtures;

    for (let i = 0; i < fixtures.length; i++) {
      if (fixtures[i].id === id) {
        return fixtures[i];
      }
    }

    return undefined;
  }

  /**
   * Removes a fixture from the scene's fixture pool
   *
   * @public
   * @param {Object} fixture
   */
  deleteFixture(fixture) {
    const fixtureValues = this._fixtureValues;

    for (let i = 0; i < fixtureValues.length; i++) {
      if (fixtureValues[i].fixture.id === fixture.id) {
        fixtureValues.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Adds current DMX channel values to every channelValue
   *
   * This is used when running scenes in relative mode so
   * transition from current value to preset value is smooth.
   *
   * @public
   */
  prepareStartValues() {
    const fixtureValues = this._fixtureValues;

    for (let i = 0; i < fixtureValues.length; i++) {
      const fixtureValue = fixtureValues[i];
      const { channels } = fixtureValue;
      const { fixture } = fixtureValue;

      for (let j = 0; j < channels.length; j++) {
        const channel = channels[j];

        if (channel.active) {
          const accessor = fixture.getQuickAccessor(channel);

          if (accessor) {
            channel.startValue = accessor.value.DMX;
          }
        }
      }
    }
  }

  /**
   * Updates scene over time
   *
   * @public
   * @override
   *
   * @param {Number} time update time
   * @param {Number} duration update duration
   */
  update(time, duration = null) {
    this.time = time;
    this.DMXActivity = 0;

    const { relative } = this;

    if (
      (!this.state && relative)
      || (time === 0 && relative)
    ) {
      this.prepareStartValues();
      this.state = 1;
    }

    // Preserve the existing fallback behavior.
    duration = duration || this.durationMS;

    const directionIn = this.direction === SCENE_DIRECTIONS.IN;
    const fade = directionIn ? this.fadeIn : this.fadeOut;

    // Fade is calculated exactly once per Scene update.
    const fadeFactor = time < duration
      ? fade.getValue(time, duration)
      : 1;

    const fixtureValues = this._fixtureValues;

    let activity = 0;

    // Hot path:
    // - no Object.keys()
    // - no nested Object.keys()
    // - no forEach callbacks
    // - no repeated fixtureValues getter
    for (let i = 0; i < fixtureValues.length; i++) {
      const fixtureValue = fixtureValues[i];
      const { channels } = fixtureValue;
      const { fixture } = fixtureValue;

      for (let j = 0; j < channels.length; j++) {
        const channelValue = channels[j];

        if (!channelValue.active) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const finalValue = directionIn
          ? channelValue.value
          : 0;

        const value = relative
          ? channelValue.startValue
            + (finalValue - channelValue.startValue) * fadeFactor
          : finalValue * fadeFactor;

        // This condition patches fine channels not updating automatically.
        if (!channelValue.isFine) {
          fixture.setQuickAccessor(channelValue, value);
        }

        activity += value;
      }
    }

    this.DMXActivity = activity;

    if (time >= duration) {
      this.state = this.direction;
    }
  }

  /**
   * Manually remove scene instance reference from memory
   *
   * @private
   * @param {Object} instance
   */
  static deleteInstance(instance) {
    Object.keys(instance).forEach((prop) => {
      delete instance[prop];
    });

    instance = null;
  }
}

export default Scene;
