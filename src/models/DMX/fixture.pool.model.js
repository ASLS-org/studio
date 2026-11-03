import { Proxify } from '../utils/proxify.utils';
import Fixture from './fixture.model';

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
    return this.fixtures.map((fixture) => ({
      name: fixture.name,
      icon: 'movinghead',
      id: fixture.id,
      universe: fixture.universe,
      more: `U${fixture.universe} - CH${fixture.chStart}`,
    }));
  }

  /**
   * Fixtures pool's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return this.fixtures.map((f) => f.showData);
  }

  /**
   * Returns fixture instance from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Object} Fixture instance
   */
  getFromId(id) {
    const fixture = this.fixtures.find((f) => f.id === Number(id));
    if (fixture) {
      return fixture;
    }
    throw new Error('Cannot find fixture in pool');
  }

  /**
   * Checks whether a fixture exists in the pool from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Boolean} whether a fixture exists in the pool or not
   */
  checkIfExists(id) {
    try {
      this.getFromId(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Pushes existing fixture into the pool
   *
   * @public
   * @param {Object} fixture fixture instance
   */
  addExisting(fixture) {
    this.fixtures.push(fixture); // TODO: replace with ..AndStackUndo once patched
  }

  /**
   * Creates a new fixture instance from provided configuraion data and pushes it to the pool.
   * Keeps the provided id when it is free (showfile load), so universes and groups that
   * reference it resolve to the same fixture. Generates one otherwise.
   *
   * @public
   * @param {Object} fixtureData fixture configuration object
   * @return {Object} Fixture instance
   * @see Fixture
   */
  addRaw(fixtureData) {
    const fixture = new Fixture(fixtureData);
    const savedId = parseInt(fixtureData.id, 10);
    fixture.id = Number.isInteger(savedId) && !this.checkIfExists(savedId)
      ? savedId
      : this.genFixtureId();
    this.fixtures.push(fixture); // TODO: replace with ..AndStackUndo once patched
    return fixture;
  }

  moveItem(originalIndex, finalIndex) {
    this.fixtures.splice(finalIndex, 0, this.fixtures.splice(originalIndex, 1)[0]);
  }

  /**
   * Removes fixture from pool
   *
   * @public
   * @param {Object} fixture fixture instance handle
   */
  delete(fixture, destroy = false) {
    const index = this.fixtures.findIndex((item) => item.id === fixture.id);
    if (index > -1) {
      this.fixtures[index].highlight(false, true);
      this.fixtures.splice(index, 1); // TODO: replace with ..AndStackUndo once patched
      if (destroy) {
        Fixture.deleteInstance(fixture);
      }
    } else {
      throw new Error('Could not find fixture in fixture pool');
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
   * Generates fixture unique ID, one above the highest id in the pool
   *
   * @public
   * @returns {Number} The fixture's unique ID
   */
  genFixtureId() {
    return this.fixtures.reduce((maxId, fixture) => Math.max(maxId, fixture.id), -1) + 1;
  }
}

export default FixturePool;
