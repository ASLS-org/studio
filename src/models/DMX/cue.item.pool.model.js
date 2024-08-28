import { Proxify } from '../utils/proxify.utils';
import CueItem from './cue.item.model';

/**
 * @class CueItemPool
 * @extends {Proxify}
 * @classdesc Pool of cueItem instances
 */
class CueItemPool extends Proxify {
  /**
   * Creates an instance of CueItemPool.
   *
   * @param {Object} data CueItemPool configuration object
   * @param {Obejct} data.cue Handle to reference cue instance
   */
  constructor(data) {
    super();
    this.cue = data.cue;
    this._items = [];
    this.proxify();
    this.items = data.items || [];
    return this;
  }

  /**
   * reference to CueItem pool array
   *
   * @type {Array}
   */
  set items(items) {
    if (items) {
      items.forEach((item) => this.addRaw(item));
    } else {
      this._items = [];
    }
  }

  get items() {
    return this._items || [];
  }

  get duration() {
    return Math.max(...this.items.map((item) => item.tickDuration + item.tick), 0);
  }

  /**
   * Pool name
   *
   * @readonly
   * @type {String}
   */
  get name() {
    return this.cue.name;
  }

  /**
   * Listable pool instances
   *
   * @readonly
   * @type {Number}
   */
  get listable() {
    return this.cues.map((cue) => cue.listable);
  }

  /**
   * CueItemPool's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return {
      cue: this.cue.id,
      items: this.items.map((i) => i.showData),
    };
  }

  /**
   * Returns cueItem instance from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Object} cueItem instance
   */
  getFromId(id) {
    const cue = this.cues.find((item) => item.id === id);
    if (cue) {
      return cue;
    }
    throw new Error('Cannot find cue in pool');
  }

  /**
   * Pushes existing cueItem into the pool
   *
   * @public
   * @param {Object} cueItem cueItem instance
   */
  addExisting(cueItem) {
    this.items.push(cueItem); // TODO: replace with ..AndStackUndo once patched
    this.duration = Math.max(this.duration, cueItem.tickDuration + cueItem.tick);
  }

  /**
   * Creates a new cueItem instance from provided configuraion data and pushes it to the pool
   *
   * @public
   * @param {Object} cueItemData cueItem configuration object
   * @return {Object} CueItem instance
   * @see cueItem
   */
  addRaw(cueItemData) {
    const cueItem = new CueItem(Object.assign(cueItemData, { cue: this.cue }));
    cueItem.id = cueItemData.id !== undefined ? cueItemData.id : this.genCueItemId();
    this._items.push(cueItem); // TODO: replace with ..AndStackUndo once patched
    this._items.sort((a, b) => a.tick - b.tick);
    return cueItem;
  }

  /**
   * Removes cueItem from pool
   *
   * @public
   * @param {Object} cueItem CueItem instance handle
   */
  delete(cueItem) {
    const cueItemIndex = this.items.findIndex((item) => item.id === cueItem.id);
    if (cueItemIndex > -1) {
      this.items.splice(cueItemIndex, 1); // TODO: replace with ..AndStackUndo once patched
    } else {
      throw new Error('Could not find cueItem in cueItem pool');
    }
  }

  /**
   * Clears all cueItem instances from pool
   *
   * @public
   */
  clearAll() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.delete(this.items[i]);
    }
  }

  /**
   * Generates cueItem unique ID
   *
   * @public
   * @returns {Number} The cueItem's unique ID
   */
  genCueItemId() {
    return this.items.reduce(
      (prev, current) => (
        (prev && prev.id > current.id)
          ? prev.id
          : current.id
      ),
      -1,
    ) + 1;
  }

  /**
   * Manually remove cueItem cueItemPool reference from memory
   *
   * @private
   * @param {Object} instance handle to cueItemPool instance to be freed
   */
  static deleteInstance(instance) {
    Object.keys(instance).forEach((prop) => {
      delete instance[prop];
    });
    instance = null;
  }
}

export default CueItemPool;
