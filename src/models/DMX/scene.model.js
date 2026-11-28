import Cue from './cue.model';
import { familyAt, noFamilies } from './families';
import {
  readColor, writeColor, readPanTilt, writePanTilt,
} from './cell.access';

/**
 * A fine byte's full scale: a 16-bit channel's value is coarse + fine / MAX_FINE
 *
 * @constant {Number} MAX_FINE
 */
const MAX_FINE = 255;

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
    // A placeholder fixture (type missing on this device) has no channels to hold the values:
    // keep them as saved so they are written back unchanged
    this._savedChannelValues = this.fixture.isPlaceholder ? channelValues : null;
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

    this.linkFineChannels();

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
   * Links each entry of a 16-bit channel to its fine channel's entry (`fine`), and marks fine
   * entries (`isFine`): a playing scene sends both as one value. Runtime only, not enumerable, so
   * never saved
   *
   * @private
   */
  linkFineChannels() {
    const entries = this._channels;
    const { channels } = this.fixture;
    if (!channels || !channels.length) return;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const channel = channels[entry.id - 1];
      const fineChannel = channel && channel.fineChannels[0];
      const fine = fineChannel ? entries.find((e) => e.id === fineChannel.id) || null : null;
      Object.defineProperty(entry, 'fine', { value: fine, writable: true, enumerable: false });
      Object.defineProperty(entry, 'isFine', {
        value: !!(channel && channel.isFine), writable: true, enumerable: false,
      });
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
    if (this._savedChannelValues) return this._savedChannelValues;
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
   * Fixture's colour (RGB 0-255), every cell's (reads the first); CMY inverted, white mixed in
   *
   * @type {Array<Number>}
   */
  set color(rgbValue) {
    this.setColor(rgbValue);
  }

  get color() {
    return this.getColor();
  }

  /**
   * Fixture's pan&tilt channels values (0-255)/(0-255), every head's (reads the first)
   *
   * @type {Object}
   */
  set panTilt(value) {
    this.setPanTilt(value);
  }

  get panTilt() {
    return this.getPanTilt();
  }

  /**
   * Reads the colour of the first of some cells (see cell.access.js)
   *
   * @public
   * @param {?Array<String>} [cells=null] Cell names, null for all
   * @returns {Array<Number>} RGB 0-255
   */
  getColor(cells = null) {
    // Through the object it's called on: an editor's call reads (and a chip's preview tracks) the
    // reactive entries
    return readColor(this.fixture.channels, cells, (index) => this.readEntry(index));
  }

  /**
   * Writes a colour to some cells, activating the channels written (see cell.access.js)
   *
   * @public
   * @param {Array<Number>} rgbValue RGB 0-255
   * @param {?Array<String>} [cells=null] Cell names, null for all
   */
  setColor(rgbValue, cells = null) {
    // Through the object it's called on: an editor's write reaches Vue (the chip redraws at once)
    writeColor(this.fixture.channels, rgbValue, cells, (index, v) => this.writeEntry(index, v));
  }

  /**
   * Reads the pan&tilt of the first of some cells (see cell.access.js)
   *
   * @public
   * @param {?Array<String>} [cells=null] Cell names, null for all
   * @returns {Object} `pan`, `panFine`, `tilt`, `tiltFine` (0-255)
   */
  getPanTilt(cells = null) {
    return readPanTilt(this.fixture.channels, cells, (index) => this.readEntry(index));
  }

  /**
   * Writes pan&tilt to some cells, activating the channels written (see cell.access.js)
   *
   * @public
   * @param {Object} value `pan`, `panFine`, `tilt`, `tiltFine` (0-255)
   * @param {?Array<String>} [cells=null] Cell names, null for all
   */
  setPanTilt(value, cells = null) {
    writePanTilt(this.fixture.channels, value, cells, (index, v) => this.writeEntry(index, v));
  }

  /**
   * This scene's value of a fixture channel, by the channel's index in the fixture (0 when unset)
   *
   * @public
   * @param {Number} index Channel index
   * @returns {Number}
   */
  readEntry(index) {
    const entry = this.entryOf(index);
    return entry ? entry.value : 0;
  }

  /**
   * Sets this scene's value of a fixture channel, by the channel's index in the fixture, and
   * activates it
   *
   * @public
   * @param {Number} index Channel index
   * @param {Number} value DMX value
   */
  writeEntry(index, value) {
    const entry = this.entryOf(index);
    if (!entry) return;
    entry.value = value;
    entry.active = true;
    this.setQuickAccessor(entry);
  }

  /**
   * This scene's entry of a fixture channel, by the channel's index in the fixture
   *
   * @public
   * @param {Number} index Channel index
   * @returns {?Object} Entry (`type`, `qaIndex`, `value`, `active`)
   */
  entryOf(index) {
    const channel = this.fixture.channels[index];
    const entries = channel && this._quickChannelsAccessors[channel.type];
    return (entries && entries[channel.qaIndex || 0]) || null;
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

    this.fixtures = sceneData.fixtures;
    this.fixtureValues = sceneData.fixtureValues;
    // A scene saved before fades had their own time faded in over its Duration; a new scene fades
    // in over a bar
    this.fadeIn = Cue.buildFade(sceneData.fadeIn, 0, sceneData.duration ?? 1);
  }

  /**
   * A scene stays on until it is turned off, taken over or deleted, whatever its Loop Style
   *
   * @readonly
   * @type {Boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  get endsAfterDuration() {
    return false;
  }

  /**
   * The scene's show data with only some families' channels active (an older Look split into one
   * cue per family on load): the other entries stay, inactive
   *
   * @public
   * @param {Function} keeps `(family) => Boolean` for a family index, -1 for no family
   * @returns {Object} show data
   */
  familyData(keeps) {
    const data = this.showData;
    data.fixtureValues = data.fixtureValues.map((fixtureValue, i) => {
      const { fixture } = this.fixtureValues[i];
      // A placeholder's channels are unknown: its values stay with the cue keeping the channels
      // of no family
      if (fixture.isPlaceholder) {
        return keeps(-1) ? fixtureValue : { ...fixtureValue, channelValues: [] };
      }
      const channels = fixture.channels || [];
      return {
        ...fixtureValue,
        channelValues: fixtureValue.channelValues.map((entry) => ({
          ...entry,
          active: !!entry.active && keeps(familyAt(channels, entry.id - 1)),
        })),
      };
    });
    return data;
  }

  /**
   * The families of the channels the scene sets (its active channels)
   *
   * @readonly
   * @type {Array<Boolean>}
   */
  get usedFamilies() {
    const used = noFamilies();
    const fixtureValues = this._fixtureValues || [];
    for (let i = 0; i < fixtureValues.length; i++) {
      const { fixture, channels } = fixtureValues[i];
      for (let j = 0; j < channels.length; j++) {
        const entry = channels[j];
        const channel = entry.active && fixture.channels ? fixture.channels[entry.id - 1] : null;
        if (channel && channel.family > -1) used[channel.family] = true;
      }
    }
    return used;
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
   * Writes the scene's values. While it plays, they are proposals: the merge blends them with what
   * is underneath by the cue's fade (claims.js)
   *
   * @public
   * @override
   * @param {Number} time time since cued (or within the chase item), in ms
   */
  update(time) {
    this.time = time;
    const fixtureValues = this._fixtureValues;
    let activity = 0;

    // Hot path: no Object.keys(), no callbacks, no repeated getters
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

        const { value, fine } = channelValue;

        // A 16-bit channel goes out as one value, its fine byte as the fraction (the merge writes
        // both); the fine entry itself isn't sent
        if (!channelValue.isFine) {
          const sent = fine && fine.active ? value + fine.value / MAX_FINE : value;
          fixture.setQuickAccessor(channelValue, sent);
        }

        activity += value;
      }
    }

    this.DMXActivity = activity;
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
