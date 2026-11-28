import Universe, { DMX_UNIVERSE_LENGTH } from './universe.model';
import Live from './live.model';
import EventBus from '../../plugins/eventbus';

/**
 * @class UniversePool
 * @classdesc Pool of universe instances
 */
class UniversePool {
  constructor() {
    this.universes = [];
    this.selected = [0];
    /**
     * Where packed frames go (the show's output pool, raw), set by the show
     *
     * @type {OutputPool|null}
     */
    this.sink = null;
    /**
     * The show's master (raw), set by the show: its factors scale levels when packing
     *
     * @type {Master|null}
     */
    this.master = null;
    this.frameCallbackId = Live.onFrame(this.processFrame.bind(this));
  }

  /**
   * Live frame phase: packs every universe's frame, then sends it on the universe's routes.
   * Runs after the animations of every tick, also while the show is paused or stopped.
   *
   * @public
   */
  processFrame() {
    if (this.master) this.master.prepare();
    for (let i = 0; i < this.universes.length; i++) {
      const universe = this.universes[i];
      const frame = universe.packFrame(this.master);
      if (this.sink) this.sink.forward(universe.id, frame);
    }
  }

  /**
   * Pool's listable data: each universe unfolds to its fixtures (patch bay, fixture pickers)
   *
   * @readonly
   * @type {Array}
   */
  get listable() {
    return this.universes.map((universe) => ({
      id: universe.id,
      name: universe.name,
      color: universe.color,
      // The patch bay is narrow: its fixture rows keep the address only (no held marks)
      unfold: universe.fixturePool.fixtures.map((fixture) => ({
        ...fixture.listable,
        more: fixture.addressLabel,
      })),
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
   * Moves fixtures to new addresses, in their universe or another, all at once. The whole result
   * is checked first (no overlap with the fixtures that stay or move, nothing past address 512):
   * when it isn't valid nothing changes. Moved fixtures are unpatched before any is patched again,
   * so two fixtures can trade places. A fixture keeps its id, so groups and scenes keep it.
   *
   * @public
   * @param {Array<Object>} moves `{ fixture, universe, chStart }`: the fixture, its target universe
   * id and its target start address (0-based)
   * @throws {Error} When the result would overlap or pass the end of a universe
   */
  repatch(moves) {
    const changed = moves.filter(({ fixture, universe, chStart }) => (
      Number(fixture.universe) !== Number(universe) || fixture.chStart !== chStart));
    if (!changed.length) return;
    const movedIds = new Set(changed.map(({ fixture }) => fixture.id));
    // Ranges each target universe would hold
    const ranges = new Map();
    const add = (universeId, start, count) => {
      const key = Number(universeId);
      if (!ranges.has(key)) ranges.set(key, []);
      ranges.get(key).push([start, start + count]);
    };
    changed.forEach(({ universe, chStart, fixture }) => {
      add(universe, chStart, fixture.chCount);
    });
    ranges.forEach((list, universeId) => {
      this.getFromId(universeId).fixturePool.fixtures
        .filter((fixture) => !movedIds.has(fixture.id))
        .forEach((fixture) => list.push([fixture.chStart, fixture.chStop]));
    });
    ranges.forEach((list, universeId) => {
      const sorted = [...list].sort((a, b) => a[0] - b[0]);
      sorted.forEach(([start, stop], i) => {
        if (start < 0 || stop > DMX_UNIVERSE_LENGTH || (i && start < sorted[i - 1][1])) {
          throw new Error(`The new patch overlaps or passes the end of universe ${universeId}`);
        }
      });
    });
    changed.forEach(({ fixture }) => this.getFromId(fixture.universe).unpatchFixture(fixture));
    changed.forEach(({ fixture, universe, chStart }) => {
      fixture.chStart = chStart;
      this.getFromId(universe).patchFixture(fixture);
    });
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
    if (universeData.id == null) {
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
      if (this.sink) this.sink.deleteUniverseRoutes(universe.id);
      EventBus.emit('patch_changed');
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
    return this.universes.reduce((max, universe) => Math.max(max, Number(universe.id)), -1) + 1;
  }
}

export default UniversePool;
