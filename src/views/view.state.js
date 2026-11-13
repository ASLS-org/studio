import { markRaw } from 'vue';

/**
 * Panels the modifier strip can show
 *
 * @constant {Object} PANELS
 * @enum {String}
 */
export const PANELS = {
  UNIVERSE: 'universe',
  GROUP: 'group',
  CHASE: 'chase',
};

/** Owner of modals that outlive panel switches */
export const APP_OWNER = 'app';

/**
 * Finds an item by id in an array, without throwing
 *
 * @param {Array<Object>} items items with an `id`
 * @param {*} id id to find (coerced to a number)
 * @returns {?Object} the item, or null
 */
const byId = (items, id) => (id === null || id === undefined
  ? null
  : (items || []).find((item) => item.id === Number(id)) || null);

/**
 * Fixtures of a memory entry that are still in a list, else the list's first fixture
 *
 * @param {Array<Object>} list fixtures the selection is made in
 * @param {?Object} memory memory entry ({ fixtureIds })
 * @returns {Array<Object>} selected fixtures, main one first
 */
const resolveFixtures = (list, memory) => {
  const fixtures = list || [];
  const found = (memory?.fixtureIds || []).map((id) => byId(fixtures, id)).filter(Boolean);
  if (found.length) return found;
  return fixtures.length ? [fixtures[0]] : [];
};

/**
 * @class ViewState
 * @classdesc What the app shows: the panel in view, the selection, each group's and universe's
 * last selection (for the session), and the open popups. It holds ids only and resolves them
 * through the show's pools on read, so a deleted item falls back to the first one (or to nothing)
 * wherever it is read, without repair code. Never saved: not in showData, not in localStorage.
 */
export default class ViewState {
  /**
   * Creates a view state for a show
   *
   * @param {Object} show the (reactive) show instance whose pools ids are resolved against
   */
  constructor(show) {
    /** The show whose pools ids resolve against */
    this.show = show;
    /** Panel asked for (the `panel` getter falls back when its target is gone) */
    this._panel = PANELS.UNIVERSE;
    /** @type {?Number} universe in view */
    this.universeId = null;
    /** @type {?Number} group in view, and the chase's group */
    this.groupId = null;
    /** @type {?Number} chase in view */
    this.chaseId = null;
    /** Last selection per universe and per group, for the session */
    this.memory = { universes: {}, groups: {} };
    /** Named popups open, bottom to top: { name, owner } */
    this.modals = [];
    /** Fixtures a popup is choosing among, highlighted instead of the panel's selection */
    this.previewIds = null;
    /**
     * Popups on screen, bottom to top ({ el, close, submit }): where Escape and Enter go.
     * Not reactive: DOM elements and callbacks stay raw.
     */
    this.layers = markRaw([]);
  }

  /* -------------------------------------------------------------------------------------- */
  /* What's in view                                                                          */
  /* -------------------------------------------------------------------------------------- */

  /**
   * Universe in view: the one asked for, else the first universe
   *
   * @type {?Object}
   */
  get universe() {
    const universes = this.show?.universePool?.universes || [];
    return byId(universes, this.universeId) || universes[0] || null;
  }

  /**
   * Group in view (or the chase's group): the one asked for, else the first group
   *
   * @type {?Object}
   */
  get group() {
    const groups = this.show?.groupPool?.groups || [];
    return byId(groups, this.groupId) || groups[0] || null;
  }

  /**
   * Chase in view, or null when gone
   *
   * @type {?Object}
   */
  get chase() {
    if (this.group?.id !== Number(this.groupId)) return null;
    return byId(this.group?.chasePool?.chases, this.chaseId);
  }

  /**
   * Panel in view: the one asked for, falling back when its target is gone
   * (chase → group → universe)
   *
   * @type {String}
   */
  get panel() {
    if (this._panel === PANELS.CHASE && this.chase) return PANELS.CHASE;
    if (this._panel !== PANELS.UNIVERSE && this.group) return PANELS.GROUP;
    return PANELS.UNIVERSE;
  }

  /**
   * Memory of the universe in view, if any (read only: actions create entries)
   *
   * @type {?Object}
   */
  get universeMemory() {
    return this.universe ? this.memory.universes[this.universe.id] || null : null;
  }

  /**
   * Memory of the group in view, if any (read only: actions create entries)
   *
   * @type {?Object}
   */
  get groupMemory() {
    return this.group ? this.memory.groups[this.group.id] || null : null;
  }

  /**
   * Group's selected cue: the remembered one, else the group's first cue
   *
   * @type {?Object}
   */
  get cue() {
    const cues = this.group?.cuePool?.cues || [];
    return byId(cues, this.groupMemory?.cueId) || cues[0] || null;
  }

  /**
   * Selected fixtures of the universe in view (whatever the panel): the remembered ones still
   * there, else its first fixture
   *
   * @type {Array<Object>}
   */
  get universeFixtures() {
    return resolveFixtures(this.universe?.fixturePool?.fixtures, this.universeMemory);
  }

  /**
   * Selected fixtures of the group in view (whatever the panel): the remembered ones still
   * there, else its first fixture
   *
   * @type {Array<Object>}
   */
  get groupFixtures() {
    return resolveFixtures(this.group?.fixturePool?.fixtures, this.groupMemory);
  }

  /**
   * Selected fixtures of the panel in view (none for a chase)
   *
   * @type {Array<Object>}
   */
  get fixtures() {
    if (this.panel === PANELS.UNIVERSE) return this.universeFixtures;
    if (this.panel === PANELS.GROUP) return this.groupFixtures;
    return [];
  }

  /**
   * Main selected fixture of the panel in view (the one whose controls are shown)
   *
   * @type {?Object}
   */
  get fixture() {
    return this.fixtures[0] || null;
  }

  /**
   * Selected fixture ids of the panel in view
   *
   * @type {Array<Number>}
   */
  get fixtureIds() {
    return this.fixtures.map((fixture) => fixture.id);
  }

  /**
   * Selected cells of the universe in view (cell names), null for the whole fixture
   *
   * @type {?Array<String>}
   */
  get universeCells() {
    return this.universeMemory?.cells ?? null;
  }

  /**
   * Selected cells of the group in view (cell names), null for the whole fixture
   *
   * @type {?Array<String>}
   */
  get groupCells() {
    return this.groupMemory?.cells ?? null;
  }

  /**
   * Selected cells of the panel in view
   *
   * @type {?Array<String>}
   */
  get cells() {
    return this.panel === PANELS.UNIVERSE ? this.universeCells : this.groupCells;
  }

  /**
   * What the 3D view highlights: a popup's preview when there is one, else the selection
   *
   * @type {{ids: Array<Number>, gizmo: Boolean}}
   */
  get highlight() {
    const ids = this.previewIds ? [...this.previewIds] : this.fixtureIds;
    return { ids, gizmo: ids.length > 0 };
  }

  /* -------------------------------------------------------------------------------------- */
  /* Navigation and selection                                                                */
  /* -------------------------------------------------------------------------------------- */

  /**
   * Memory entry of a universe or group, created on first use
   *
   * @param {String} kind 'universes' or 'groups'
   * @param {Number} id universe or group id
   * @returns {Object} its memory entry
   */
  memoryOf(kind, id) {
    const key = Number(id);
    if (!this.memory[kind][key]) {
      this.memory[kind][key] = kind === 'groups'
        ? { cueId: null, fixtureIds: [], cells: null }
        : { fixtureIds: [], cells: null };
    }
    return this.memory[kind][key];
  }

  /**
   * Memory entry of the panel in view (the universe's, or the group's), created if needed
   *
   * @returns {?Object} memory entry, null when nothing is in view
   */
  contextMemory() {
    if (this.panel === PANELS.UNIVERSE) {
      return this.universe ? this.memoryOf('universes', this.universe.id) : null;
    }
    return this.group ? this.memoryOf('groups', this.group.id) : null;
  }

  /**
   * Shows a universe
   *
   * @public
   * @param {Number} id universe id
   */
  openUniverse(id) {
    this.closePanelModals();
    this._panel = PANELS.UNIVERSE;
    this.universeId = Number(id);
  }

  /**
   * Follows a universe whose id changed: the view and its memory of it move to the new id
   *
   * @public
   * @param {Number} oldId previous id
   * @param {Number} newId new id
   */
  moveUniverse(oldId, newId) {
    const from = Number(oldId);
    const to = Number(newId);
    if (this.universeId === from) this.universeId = to;
    if (this.memory.universes[from]) {
      this.memory.universes[to] = this.memory.universes[from];
      delete this.memory.universes[from];
    }
  }

  /**
   * Shows a universe with one of its fixtures selected
   *
   * @public
   * @param {Number} universeId universe id
   * @param {Number} fixtureId fixture id
   */
  openFixture(universeId, fixtureId) {
    this.openUniverse(universeId);
    this.selectFixtures([fixtureId]);
  }

  /**
   * Shows a group
   *
   * @public
   * @param {Number} id group id
   */
  openGroup(id) {
    this.closePanelModals();
    this._panel = PANELS.GROUP;
    this.groupId = Number(id);
    this.chaseId = null;
  }

  /**
   * Shows a group's chase
   *
   * @public
   * @param {Number} groupId group id
   * @param {Number} chaseId chase id
   */
  openChase(groupId, chaseId) {
    this.closePanelModals();
    this._panel = PANELS.CHASE;
    this.groupId = Number(groupId);
    this.chaseId = Number(chaseId);
  }

  /**
   * Selects a cue of the group in view
   *
   * @public
   * @param {?Number} id cue id
   */
  selectCue(id) {
    if (!this.group) return;
    this.memoryOf('groups', this.group.id).cueId = id === null || id === undefined
      ? null
      : Number(id);
  }

  /**
   * Selects fixtures of the panel in view (first = main one)
   *
   * @public
   * @param {Array<Number>} ids fixture ids
   */
  selectFixtures(ids) {
    const context = this.contextMemory();
    if (!context) return;
    const next = (ids || []).map(Number).filter((id) => !Number.isNaN(id));
    if (next.length === context.fixtureIds.length
      && next.every((id, i) => id === context.fixtureIds[i])) return;
    context.fixtureIds = next;
  }

  /**
   * Selects cells of the panel in view
   *
   * @public
   * @param {?Array<String>} cells cell names, or null for the whole fixture
   */
  selectCells(cells) {
    const context = this.contextMemory();
    if (context) context.cells = cells && cells.length ? [...cells] : null;
  }

  /**
   * Highlights the fixtures a popup is choosing among, instead of the selection
   *
   * @public
   * @param {?Array<Number>} ids fixture ids, or null to go back to the selection
   */
  previewFixtures(ids) {
    this.previewIds = ids ? ids.map(Number) : null;
  }

  /**
   * Starts afresh (a show was loaded): first universe, memory and popups cleared
   *
   * @public
   */
  reset() {
    this._panel = PANELS.UNIVERSE;
    this.universeId = null;
    this.groupId = null;
    this.chaseId = null;
    this.memory = { universes: {}, groups: {} };
    this.modals = this.modals.filter((modal) => modal.owner === APP_OWNER && modal.keep);
    this.previewIds = null;
  }

  /* -------------------------------------------------------------------------------------- */
  /* Popups                                                                                  */
  /* -------------------------------------------------------------------------------------- */

  /**
   * Whether a named popup is open
   *
   * @public
   * @param {String} name popup name
   * @returns {Boolean}
   */
  isOpen(name) {
    return this.modals.some((modal) => modal.name === name);
  }

  /**
   * Opens a named popup on top of the others
   *
   * @public
   * @param {String} name popup name
   * @param {String} [owner='app'] panel it belongs to (closed when the panel changes), or 'app'
   * @param {Boolean} [keep=false] app popups only: survives a show load (loading, errors)
   */
  openModal(name, owner = APP_OWNER, keep = false) {
    if (this.isOpen(name)) return;
    this.modals.push({ name, owner, keep });
  }

  /**
   * Closes a named popup
   *
   * @public
   * @param {String} name popup name
   */
  closeModal(name) {
    const index = this.modals.findIndex((modal) => modal.name === name);
    if (index > -1) this.modals.splice(index, 1);
  }

  /**
   * Closes the popups that belong to a panel (any panel: the view is changing)
   */
  closePanelModals() {
    if (this.modals.some((modal) => modal.owner !== APP_OWNER)) {
      this.modals = this.modals.filter((modal) => modal.owner === APP_OWNER);
    }
  }

  /**
   * Registers a popup on screen as the top layer (where Escape and Enter go)
   *
   * @public
   * @param {{el: HTMLElement, close: Function, submit: Function}} layer the popup
   */
  pushLayer(layer) {
    this.removeLayer(layer);
    this.layers.push(markRaw(layer));
  }

  /**
   * Removes a popup from the layers
   *
   * @public
   * @param {Object} layer the popup, as pushed
   */
  removeLayer(layer) {
    const index = this.layers.indexOf(layer);
    if (index > -1) this.layers.splice(index, 1);
  }

  /**
   * Top popup on screen, or null
   *
   * @type {?Object}
   */
  get topLayer() {
    return this.layers[this.layers.length - 1] || null;
  }
}
