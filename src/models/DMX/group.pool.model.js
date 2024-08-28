import Group from './group.model';

/**
 * @class GroupPool
 * @extends {Proxify}
 * @classdesc Pool of group instances
 * @see Group
 */
class GroupPool {
  /**
   * Creates an instance of GroupPool.
   */
  constructor() {
    this.groups = [];
  }

  /**
   * Pool's listable data
   *
   * @todo remove this ? Am I even using it ?
   * @readonly
   * @type {Array}
   */
  get listable() {
    return this.groups.map((group) => ({
      name: group.name,
      unfold: group.cuePool.listable,
    }));
  }

  /**
   * Returns group instance from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Object} Group instance
   */
  getFromId(id) {
    const group = this.groups.find((item) => item.id === Number(id));
    if (group) {
      return group;
    }
    throw new Error('Cannot find group in pool');
  }

  /**
   * Pushes existing group into the pool
   *
   * @public
   * @param {Object} group group instance
   */
  addExisting(group) {
    this.groups.push(group);
  }

  /**
   * Creates a new group instance from provided configuraion data and pushes it to the pool
   *
   * @public
   * @param {Object} groupData group configuration object
   * @return {Object} Group instance
   * @see Chase
   */
  addRaw(groupData) {
    const group = new Group(groupData);
    if (!group.id) {
      group.id = this.genGroupId();
    }
    this.groups.push(group);
    return group;
  }

  /**
   * Removes group from pool
   *
   * @public
   * @param {Object} group group instance handle
   */
  delete(group) {
    const groupIndex = this.groups.findIndex((item) => item.id === group.id);
    if (groupIndex > -1) {
      group.chasePool.clearAll();
      group.cuePool.clearAll();
      group.fixturePool.clearAll();
      this.groups.splice(groupIndex, 1);
      Group.deleteInstance(group);
    } else {
      throw new Error('Could not find group in group pool');
    }
  }

  /**
   * Clears all group instances from pool
   *
   * @public
   */
  clearAll() {
    for (let i = this.groups.length - 1; i >= 0; i--) {
      this.delete(this.groups[i]);
    }
  }

  /**
   * Generates group unique ID
   *
   * @public
   * @returns {Number} The group's unique ID
   */
  genGroupId() {
    return this.groups.reduce(
      (prev, current) => (
        (prev && prev.id > current.id)
          ? prev.id
          : current.id
      ),
      -1,
    ) + 1;
  }
}

export default GroupPool;
