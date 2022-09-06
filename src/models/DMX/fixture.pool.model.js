'use strict'
import {Proxify} from '../utils/proxyfy.utils.model';
import Fixture from './fixture.model'

/**
 * @class FixturePool
 * @extends {Proxify}
 * @classdesc Pool of fixture instances
 * @todo It really feels like there could be a parent pool class
 * as many of the pools mostly implement the same functionalities.
 */
class FixturePool extends Proxify {

  constructor() {
    super();
    this.fixtures = [];
    this.selected = null;
    return this.proxify();
  }

  /**
   * Pool's listable data
   *
   * @todo remove this ? Am I even using it ?
   * @readonly
   * @type {Array}
   */
  get listable() {
    return this.fixtures.map(fixture => {
      return {
        name: fixture.name,
        icon: 'movinghead',
        id: fixture.id,
        universe: fixture.universe,
        more: `U${fixture.universe} - CH${fixture.chStart}`
      }
    })
  }

  /**
   * Fixtures pool's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData(){
    return this.fixtures.map(f => f.showData)
  }

  /**
   * Returns fixture instance from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Object} Fixture instance 
   */
  getFromId(id) {
    let fixture = this.fixtures.find(fixture => fixture.id == id);
    if (fixture) {
      return fixture;
    } else {
      throw {
        errcode: -10,
        msg: "Cannot find fixture in pool"
      }
    }
  }

  /**
   * Checks whether a fixture exists in the pool from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Boolean} whether a fixture exists in the pool or not
   */
  checkIfExists(id){
    try{
      this.getFromId(id);
      return true;
    }catch{
      return false
    }
  }

  /**
   * Pushes existing fixture into the pool
   *
   * @public
   * @param {Object} fixture fixture instance
   */
  addExisting(fixture) {
    this.fixtures.pushAndStackUndo(fixture);
  }

  /**
   * Creates a new fixture instance from provided configuraion data and pushes it to the pool
   *
   * @public
   * @param {Object} chaseData fixture configuration object
   * @return {Object} Fixture instance 
   * @see Fixture
   */
  addRaw(fixtureData) {
    let fixture = new Fixture(fixtureData)
    fixture.id = this.genFixtureId();
    this.fixtures.pushAndStackUndo(fixture);
    return fixture;
  }

  moveItem(originalIndex, finalIndex){
    this.fixtures.splice(finalIndex, 0, this.fixtures.splice(originalIndex, 1)[0]);
  }

  /**
   * Removes fixture from pool
   *
   * @public
   * @param {Object} fixture fixture instance handle
   */
  delete(fixture, destroy = false) {
    let index = this.fixtures.findIndex(item => item.id == fixture.id);
    if (index > -1) {
      this.fixtures[index].highlight(false, true);
      this.fixtures.spliceAndStackUndo(index, 1)
      if (destroy) {
        Fixture.deleteInstance(fixture);
      }
    } else {
      throw {
        errcode: -12,
        msg: "Could not find fixture in fixture pool"
      }
    }
  }

    /**
   * Clears all fixture instances from pool
   *
   * @public
   */
  clearAll(destroy = false) {
    for (let i = this.fixtures.length - 1; i >= 0; i--) {
      this.delete(this.fixtures[i], destroy);
    }
  }

  /**
   * Generates fixture unique ID
   *
   * @public
   * @returns {Number} The fixture's unique ID
   */
  genFixtureId() {
    let id = this.fixtures.length ? this.fixtures[this.fixtures.length - 1].id + 1 : 0;
    while (this.fixtures.find(fixture => fixture.id === id)) {
      id++;
    }
    return id;
  }

}

export default FixturePool;