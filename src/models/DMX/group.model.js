import ukColors from '@/views/components/uikit/colors/uikit.colors';
import EventBus from '../../plugins/eventbus';
import CuePool from './cue.pool.model';
import ChasePool from './chase.pool.model';
import Modifier from './modifier.model';
import FixturePool from './fixture.pool.model';
import { markRaw } from '../utils/reactivity';
import { FAMILY_COUNT, FAMILY_KEYS } from './families';

/**
 * List of available modifier types
 *
 * @constant {Array<String>} MODIFIER_TYPES
 */
const MODIFIER_TYPES = [
  'Shutter',
  'Dimmer',
  'Zoom',
  'Color',
];

/**
 * @class Group
 * @classdesc Chases are collections of cues to be triggered over time
 */
class Group {
  /**
   * Creates an instance of Group.
   * @param {Object} [data={}] group configuration object
   * @param {Number} data.id the group's unique ID
   * @param {String} data.name the group's name
   * @param {String} data.color the group's color string
   */
  constructor(data = {}) {
    if (!data.isStub) {
      this.id = data.id;
      this.name = data.name;
      this._fixtures = [];
      this.modifiers = [];
      this.fixturePool = new FixturePool();
      // One stack per family of the tokens playing it in the group (claims.js), runtime only
      this.familyStacks = markRaw([[], [], [], []]);
      // What the masters let through of the group's playback (Master.prepare, once per tick),
      // read by its cues' claim tokens when frames are packed. Runtime only
      this.output = markRaw({ factor: 1 });
      this.cuePool = new CuePool(this.familyStacks, this.output);
      this.chasePool = new ChasePool();
      // The masters (never saved: a show opens at full): dimmer knob (DMX 0-255), Isolate,
      // Blackout
      this.solo = false;
      this.disabled = false;
      this._color = data.color;
      this.master = 255;
    }
  }

  /**
   * Group color
   *
   * @type {String}
   */
  set color(color) {
    this._color = color;
    this.chasePool.chases.forEach((chase) => {
      chase.color = this.color;
    });
  }

  get color() {
    return this._color || ukColors[Object.keys(ukColors)[this.id % Object.keys(ukColors).length]];
  }

  get name() {
    return this._name || `Group ${this.id}`;
  }

  /**
   * Group name
   *
   * @type {String}
   */
  set name(name) {
    this._name = name;
  }

  /**
   * Group's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return {
      id: this.id,
      name: this.name,
      fixtures: this.fixturePool.fixtures.map((f) => ({
        id: f.id,
      })),
      cues: this.cuePool.cues.map((c) => c.showData),
      chases: this.chasePool.chases.map((c) => c.showData),
      color: this.color,
    };
  }

  /**
   * Group's DMX activity
   *
   * @readonly
   * @type {Object}
   */
  get DMXActivity() {
    let DMXActivity = 0;
    let TOTChannels = 0;
    if (this.cuePool) {
      this.cuePool.cues.forEach((cue) => {
        if (cue.state || cue.chaseActive) {
          DMXActivity += cue.DMXActivity;
        }
      });
      this.fixturePool.fixtures.forEach((f) => {
        TOTChannels += f.channels.length;
      });
    }
    return (DMXActivity / (TOTChannels * 255));
  }

  /**
   * Add a fixture to the group's fixture pool
   *
   * @public
   * @param {Object} fixture
   */
  addFixture(fixture) {
    this.fixturePool.addExisting(fixture);
    this.cuePool.cues.forEach((cue) => {
      cue.addFixture(fixture);
    });
  }

  /**
   * Removes a fixture from the group's fixture pool
   *
   * @public
   * @param {Object} fixture
   */
  deleteFixture(fixture) {
    // The fixture leaves the group first: a cue failing to drop it can't keep it here
    if (this.fixturePool.checkIfExists(fixture.id)) this.fixturePool.delete(fixture);
    this.cuePool.cues.forEach((cue) => {
      try {
        cue.deleteFixture(fixture);
      } catch (err) {
        EventBus.emit('app_error', new Error(`Cue "${cue.name}" could not drop fixture `
          + `${fixture.id}: ${err.message}`));
      }
    });
  }

  addModifiers(fixture) {
    fixture.channels.forEach((channel, index) => {
      if (MODIFIER_TYPES.includes(channel.type)) {
        let { type } = channel;
        if (channel.type === 'Color') {
          type = channel.color;
        }
        if (!this.modifiers[type]) {
          this.modifiers[type] = new Modifier(type);
        }
        this.modifiers[type].add(fixture, index);
      }
    });
  }

  /**
   * Add a cue to the group's cue pool
   *
   * @public
   * @param {Object} cueData cue configuration object
   * @see Cue
   */
  addCue(cueData) {
    const cue = this.cuePool.addRaw(Object.assign(cueData, {
      fixtures: this.fixturePool.fixtures,
    }));
    this.chasePool.chases.forEach((chase) => chase.addCue({
      cue,
    }));
    return cue;
  }

  /**
   * Adds the cues of a show file. A cue saved without a family, or as a Look (several families),
   * is split into one cue per family it sets, in family order, each with only that family's
   * content: the first keeps its id and the channels of no family, the others get ids after every
   * saved one; a cue setting no family is an Intensity cue
   *
   * @public
   * @param {Array<Object>} cuesData cue configuration objects
   * @returns {Map<Number, Array<Object>>} the cues each saved id was loaded as
   */
  loadCues(cuesData) {
    let nextId = cuesData.reduce((max, c) => Math.max(max, Number(c.id) || 0), -1) + 1;
    const parts = new Map();
    cuesData.forEach((cueData) => {
      if (FAMILY_KEYS.includes(cueData.family)) {
        parts.set(cueData.id, [this.addCue(cueData)]);
        return;
      }
      const whole = this.cuePool.build({ ...cueData, fixtures: this.fixturePool.fixtures });
      const used = whole.usedFamilies;
      const families = [];
      for (let f = 0; f < FAMILY_COUNT; f++) if (used[f]) families.push(f);
      if (families.length < 2) {
        parts.set(cueData.id, [this.addCue({ ...cueData, family: FAMILY_KEYS[families[0] || 0] })]);
        return;
      }
      parts.set(cueData.id, families.map((family, i) => {
        // The first part also keeps the channels of no family, and the waves of a family the
        // cue doesn't use (on inactive fixtures)
        const keeps = i === 0
          ? (f) => f === family || f < 0 || !used[f]
          : (f) => f === family;
        const id = i === 0 ? cueData.id : nextId++;
        return this.addCue({ ...whole.familyData(keeps), id, family: FAMILY_KEYS[family] });
      }));
    });
    return parts;
  }

  /**
   * Removes a cue from the group's cue pool
   *
   * @public
   * @param {Object} cueItemData handle to cue to be removed
   */
  deleteCue(cue) {
    this.cuePool.delete(cue);
    this.chasePool.chases.forEach((chase) => {
      chase.deleteCue(cue);
    });
  }

  /**
   * Adds a chase to the group's chase pool
   *
   * @public
   * @param {Object} chase handle to chase to be added
   * @param {Map<Number, Array<Object>>} [parts] the cues each loaded cue id became (loadCues): a
   * split cue's lane is copied for each part, with the same items
   */
  addChase(chase, parts) {
    chase.color = chase.color || this.color;
    chase.cues = chase.cues ? chase.cues.flatMap((lane) => {
      const cues = (parts && parts.get(lane.cue)) || [this.cuePool.getFromId(lane.cue)];
      return cues.map((cue, i) => ({
        cue,
        items: i === 0 ? lane.items : (lane.items || []).map((item) => ({ ...item })),
      }));
    }) : this.cuePool.cues;

    return this.chasePool.addRaw(chase);
  }

  /**
   * Remove a chase from the group's chase pool
   *
   * @public
   * @param {Object} chase handle to chase to be removed
   */
  deleteChase(chase) {
    try {
      this.chasePool.delete(chase);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Cues chase on/off
   *
   * @public
   * @param {Object} chase handle to chase instance
   * @param {Boolean} state chase's cueing state
   */
  cueChase(chase, state) {
    try {
      chase.cue(state, this.stopAllChases.bind(this, chase));
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Stops all the chases from playing
   *
   * @public
   */
  stopAllChases(except = {}) {
    this.chasePool.chases.forEach((chase) => {
      if (except.id !== chase.id) chase.cue(false);
    });
  }

  /**
   * Manually remove group instance reference from memory
   *
   * @private
   * @param {Object} instance handle to group instance to be freed
   */
  static deleteInstance(instance) {
    Object.keys(instance).forEach((prop) => {
      delete instance[prop];
    });
    instance = null;
  }
}

export default Group;
