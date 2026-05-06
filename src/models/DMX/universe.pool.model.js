import Universe from './universe.model';

/**
 * @class UniversePool
 * @extends {Proxify}
 * @classdesc Pool of universe instances
 */
class UniversePool {
  constructor() {
    this.universes = [];
    this.selected = [0];
  }

  /**
   * Pool's listable data
   *
   * @todo remove this ? Am I even using it ?
   * @readonly
   * @type {Array}
   */
  get listable() {
    return this.universes.map((universe) => ({
      id: universe.id,
      name: universe.name,
      color: universe.color,
      unfold: universe.fixturePool.listable,
    }));
  }

  /**
   * Returns universe instance from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Object} Universe instance
   */
  getFromId(id) {
    const universe = this.universes.find((u) => u.id === Number(id));
    if (universe) {
      return universe;
    }
    throw new Error('Cannot find universe in pool');
  }

  /**
   * Pushes existing universe into the pool
   *
   * @public
   * @param {Object} universe universe instance
   */
  addExisting(universe) {
    this.universes.push(universe);
  }

  /**
   * Creates a new universe instance from provided configuraion data and pushes it to the pool
   *
   * @public
   * @param {Object} universeData universe configuration object
   * @return {Object} Universe instance
   * @see Universe
   */
  addRaw(universeData = {}) {
    const universe = new Universe(universeData);
    if (!universe.id) {
      universe.id = this.genUniverseId();
    }
    this.universes.push(universe);
    return universe;
  }

  /**
   * Removes universe from pool
   *
   * @public
   * @param {Object} universe universe instance handle
   */
  delete(universe) {
    const universeIndex = this.universes.findIndex((item) => item.id === universe.id);
    if (universeIndex > -1) {
      this.universes.splice(universeIndex, 1);
    } else {
      throw new Error('Could not find universe in universe pool');
    }
  }

  /**
   * Clears all universe instances from pool
   *
   * @public
   */
  clearAll() {
    for (let i = this.universes.length - 1; i >= 0; i--) {
      this.delete(this.universes[i]);
    }
  }

  /**
   * Generates universe unique ID
   *
   * @public
   * @returns {Number} The universe's unique ID
   */
  genUniverseId() {
    return this.universes.reduce(
      (prev, current) => (
        (prev && prev.id > current.id)
          ? prev.id
          : current.id
      ),
      -1,
    ) + 1;
  }
}

export default UniversePool;
