'use strict'

import CuePool from './cue.pool.model'
import ChasePool from './chase.pool.model'
import Modifier from './modifier.model'
import FixturePool from './fixture.pool.model'
import ukColors from '@/views/components/uikit/colors/uikit.colors.js'


/**
 * List of available modifier types
 * 
 * @constant {Array<String>} MODIFIER_TYPES
 */
const MODIFIER_TYPES = [
  "Shutter",
  "Dimmer",
  "Zoom",
  "Color"
]

/**
 * @class Group
 * @extends {Proxify}
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
    this.id = data.id;
    this.name = data.name;
    this._fixtures = [];
    this.modifiers = [];
    this.fixturePool = new FixturePool()
    this.cuePool = new CuePool();
    this.chasePool = new ChasePool();
    this.solo = false;
    this.disabled = false;
    this._color = data.color;
    this.master = 255;
  }

  /**
   * Group color
   * 
   * @type {String}
   */
  set color(color) {
    this._color = color;
    this.chasePool.chases.forEach(chase => {
      chase.color = this.color
    })
  }


  get name() {
    return this._name || `Group ${this.id}`
  }

  /**
   * Group name
   * 
   * @type {String}
   */
  set name(name) {
    this._name = name;
  }

  get color() {
    return this._color || ukColors[Object.keys(ukColors)[this.id % Object.keys(ukColors).length]]
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
      fixtures: this.fixturePool.fixtures.map(f => ({
        id: f.id
      })),
      cues: this.cuePool.cues.map(c => c.showData),
      chases: this.chasePool.chases.map(c => c.showData),
      solo: this.solo,
      disabled: this.disabled,
      color: this.color,
      master: this.master
    }
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
      this.cuePool.cues.forEach(cue => {
        if (cue.state) {
          DMXActivity += cue.DMXActivity;
        }
      })
      this.fixturePool.fixtures.forEach(f => {
        TOTChannels += f.channels.length;
      })
    }
    return (DMXActivity / TOTChannels * 255);
  }

  /**
   * Add a fixture to the group's fixture pool
   * 
   * @public
   * @param {Object} fixture 
   */
  addFixture(fixture) {
    this.fixturePool.addExisting(fixture);
    this.cuePool.cues.forEach(cue => {
      cue.addFixture(fixture);
    })
  }

  /**
   * Removes a fixture from the group's fixture pool
   * 
   * @public
   * @param {Object} fixture 
   */
  deleteFixture(fixture) {
    try {
      this.cuePool.cues.forEach(cue => {
        cue.deleteFixture(fixture);
      })
      this.fixturePool.delete(fixture);
    } catch (err) {
      console.log(err);
    }
  }

  addModifiers(fixture) {
    fixture.channels.forEach((channel, index) => {
      if (MODIFIER_TYPES.includes(channel.type)) {
        let type = channel.type;
        if (channel.type == "Color") {
          type = channel.color
        }
        if (!this.modifiers[type]) {
          this.modifiers[type] = new Modifier(type);
        }
        this.modifiers[type].add(fixture, index);
      }
    })
  }

  /**
   * Add a cue to the group's cue pool
   *
   * @public
   * @param {Object} cueData cue configuration object
   * @see Cue
   */
  addCue(cueData) {
    let cue = this.cuePool.addRaw(Object.assign(cueData, {
      fixtures: this.fixturePool.fixtures
    }))
    this.chasePool.chases.forEach(chase => chase.addCue({
      cue: cue
    }))
    return cue;
  }

  /**
   * Removes a cue from the group's cue pool
   *
   * @public
   * @param {Object} cueItemData handle to cue to be removed
   */
  deleteCue(cue) {
    this.cuePool.delete(cue);
    this.chasePool.chases.forEach(chase => {
      chase.deleteCue(cue);
    })
  }

  /**
   * Adds a chase to the group's chase pool
   *
   * @public
   * @param {Object} chase handle to chase to be added
   */
  addChase(chase) {
    chase.color = chase.color || this.color;
    chase.cues = chase.cues ? chase.cues.map(cue => {
      return {
        cue: this.cuePool.getFromId(cue.cue),
        items: cue.items
      }
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
      this.chasePool.delete(chase)

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
      this.stopAllChases();
      chase.cue(state);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Stops all the chases from playing
   * 
   * @public
   */
  stopAllChases(){
    this.chasePool.chases.forEach(chase => {
      chase.cue(false);
    })
  }

  /**
   * Manually remove group instance reference from memory
   *
   * @private
   * @param {Object} instance handle to group instance to be freed
   */
  static deleteInstance(instance) {
    Object.keys(instance).forEach(prop => {
      delete instance[prop]
    })
    instance = null;
  }

}

export default Group;