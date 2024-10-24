import axios from 'axios';
import {
  EventEmitter,
} from 'events';
import {
  parseStringPromise as XMLParse,
} from 'xml2js';
import {
  ProxifySingleton,
} from '../utils/proxify.utils';

import Master from './master.model';
import GroupPool from './group.pool.model';
import UniversePool from './universe.pool.model';
import FixturePool from './fixture.pool.model';
import Live from './live.model';
import OutputPool from './output.pool.model';

const LOCALSTORAGE_SHOWFILE_KEY = 'ASLS_STUDIO_SHOWFILE';
const DEFAULT_PROJECT_NAME = 'new_project.asls';
const DEFAULT_BPM_VALUE = 120;

const SHOWFILE_EXTENSIONS = {
  QLC: 'qxw',
  ASLS: 'json',
};

const fixtureDataCache = {};

/**
 * Storage for show definitions
 * TODO: Refactor and document.
 *
 * @class Show
 * @todo Refactor whole class. it's messy
 * @extends {EventEmitter}
 */
class Show extends EventEmitter {
  /**
   * Creates an instance of Show.
   */
  constructor() {
    super();
    this.name = '';
    this.isSaved = true;
    this.rawOFLFixtures = [];
    this.fixturePool = new FixturePool();
    this.universePool = new UniversePool();
    this.groupPool = new GroupPool();
    this.master = new Master(this.groupPool);
    this.outputPool = new OutputPool();
    this.running = false;
    this.slave = false;
    this.selectedOutputs = [];
    this.loading = {
      state: true,
      message: 'Preparing Environment',
      percentage: 10,
    };
    this.ready = false;
    this.artnetServerUrl = import.meta.env.VITE_APP_DMX2WS_SERVER_URL;
    this.visualizerHandle = null;
    ProxifySingleton.on('changed', () => {
      this.isSaved = false;
      this.emit('saveState', this.isSaved);
    });
    this.universePool.addRaw();
    this.preloadFixtureList();
  }

  set saveState(saveState) {
    this.isSaved = saveState;
  }

  get saveState() {
    return this.isSaved;
  }

  get isSaved() {
    return this._isSaved;
  }

  set isSaved(isSaved) {
    this._isSaved = isSaved;
  }

  // eslint-disable-next-line class-methods-use-this
  get tick() {
    return Live.tick;
  }

  get showData() {
    return {
      name: this.name,
      bpm: this.bpm,
      fixtures: this.fixturePool.fixtures.map((f) => f.showData),
      universes: this.universePool.universes.map((u) => u.showData),
      groups: this.groupPool.groups.map((g) => g.showData),
      visualizer: this.visualizerHandle.showData,
      outputs: this.outputPool.showData,
    };
  }

  /**
   * Show name
   *
   * @type {String}
   */
  set name(name) {
    if (name) {
      this._name = name.replace('.json', '');
    } else {
      this._name = 'Untitled project';
    }
  }

  get name() {
    return this._name ? this._name : DEFAULT_PROJECT_NAME;
  }

  /**
   * Current show state
   *
   * @type {Number}
   */
  // eslint-disable-next-line class-methods-use-this
  set state(state) {
    Live.state = state;
  }

  // eslint-disable-next-line class-methods-use-this
  get state() {
    return Live.state;
  }

  /**
   * Show's BPM value as defined in the Live singleton
   *
   * @type {Number}
   */
  // eslint-disable-next-line class-methods-use-this
  set bpm(bpm) {
    Live.bpm = bpm;
  }

  // eslint-disable-next-line class-methods-use-this
  get bpm() {
    return Live.bpm;
  }

  /**
   * Show's output DMX streaming interfaces
   *
   * @type {Array<Object>}
   */
  set selectedOutputs(data = []) {
    this._selectedOutputs = data;
  }

  get selectedOutputs() {
    return this._selectedOutputs;
  }

  /**
   * @method undo
   * forward undo instruction to prify instance
   */
  static undo() {
    ProxifySingleton.undo();
  }

  /**
   * @method redo
   * forward redo instruction to prify instance
   */
  static redo() {
    ProxifySingleton.redo();
  }

  /**
   * @method tapTempo
   * Forwards tap tempo request to live singleton
   */
  tapTempo() {
    this.bpm = Live.tapTempo();
    return this.bpm;
  }

  /**
   * Persist show data in localstorage
   *
   * @public
   */
  persistLocally() {
    localStorage.setItem(LOCALSTORAGE_SHOWFILE_KEY, JSON.stringify(this.showData));
    this.isSaved = true;
    this.emit('saveState', this.isSaved);
  }

  /**
   * Prepares universes from show data.
   *
   * @param {Object} showData hande toa show configuration object
   */
  async prepareUniverses(showData) {
    showData.universes.forEach((universeData) => {
      const universe = this.universePool.addRaw(universeData);
      universeData.fixtures.forEach((fixtureData) => {
        const fixture = this.fixturePool.getFromId(fixtureData.id);
        universe.patchFixture(fixture);
      });
    });
  }

  /**
   * Prepares fixture groups from show data.
   *
   * @param {Object} showData hande toa show configuration object
   */
  prepareGroups(showData) {
    if (showData.groups) {
      showData.groups.forEach((g) => {
        const group = this.groupPool.addRaw(g);
        g.fixtures.forEach((f) => {
          const fixture = this.fixturePool.getFromId(f.id);
          group.addFixture(fixture);
        });
        g.cues.forEach((c) => {
          group.addCue(c);
        });
        g.chases.forEach((c) => {
          group.addChase(c);
        });
      });
    }
  }

  /**
   * Prepares show outputs from show data.
   *
   * @param {Object} showData hande toa show configuration object
   */
  prepareOutputs(showData) {
    if (showData.outputs) {
      showData.outputs.forEach((o) => {
        this.outputPool.addRaw({
          ...o,
          universe: this.universePool.getFromId(o.universe),
        });
      });
    }
  }

  /**
   * Deletes a fixture from the show.
   *
   * @param {Object} fixture a fixture configuration object
   */
  deleteFixture(fixture) {
    const fixtureHandle = this.fixturePool.getFromId(fixture.id);
    if (fixtureHandle) {
      this.groupPool.groups.forEach((g) => {
        if (g.fixturePool.checkIfExists(fixtureHandle.id)) {
          g.deleteFixture(fixtureHandle);
        }
      });
      const universe = this.universePool.getFromId(fixtureHandle.universe);
      universe.unpatchFixture(fixtureHandle);
      this.fixturePool.delete(fixtureHandle, true);
    }
  }

  /**
   * Clears show data
   *
   * @public
   */
  clearShowData() {
    this.groupPool.clearAll();
    this.universePool.clearAll();
    this.fixturePool.clearAll(true);
    this.outputPool.clearAll();
    this.name = '';
    this.isSaved = true;
    this.bpm = DEFAULT_BPM_VALUE;
  }

  /**
   * Generates shiwfile from shuw data
   *
   * @returns {String} JSON formated show data.
   */
  genShowFile() {
    return JSON.stringify(this.showData);
  }

  /**
   * Loads showfile from provided URL
   *
   * @param {String} url local url of the showfile
   */
  async loadFromUrl(url) {
    const res = await fetch(url);
    const data = await res.json();
    await this.loadFromData(data);
  }

  /**
   * Loads showfile from provided frile
   *
   * @param {File} file handle to raw showfile instance
   * @returns {Promise}
   * @async
   * @public
   */
  async loadFromFile(file) {
    try {
      const fileData = await Show.readFileAsync(file);
      await this.loadShowFile(file.name, fileData);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Loads showfile from local storage
   *
   * @async
   * @public
   */
  async loadFromLocalStorage() {
    const ls_showdata = localStorage.getItem(LOCALSTORAGE_SHOWFILE_KEY);
    if (ls_showdata != null) {
      await this.loadFromData(JSON.parse(ls_showdata));
      return true;
    }
    return false;
  }

  /**
   * Parses and loads showfile from provided data
   *
   * @todo re-implement QLC loader better
   *
   * @param {String} filename Name of the file
   * @param {Object} data RAW show data to be parsed
   * @async
   * @public
   */
  async loadShowFile(filename, data) {
    const extension = Show._getShowFileType(filename);
    const showData = await Show._parseShowData(data, extension);
    await this.loadFromData(showData);
    this.name = filename;
  }

  /**
   * Prepares and sets up a show from provided show data configuration
   *
   * @param {Object} showData raw show configuration data to be parsed/loaded
   * @public
   * @async
   */
  async loadFromData(showData) {
    this.loading.state = true;
    this.loading.message = 'Clearing Show Data';
    this.loading.percentage = 20;
    this.clearShowData();

    this.loading.message = 'Setting preferences';
    this.loading.percentage = 30;
    this.visualizerHandle.preferences = showData.visualizer;

    this.loading.message = 'Preloading fixture library';
    this.loading.percentage = 40;
    await this.preloadFixtureList();

    this.loading.message = 'Setting up show fixtures';
    this.loading.percentage = 60;
    await this.prepareFixtures(showData);

    this.loading.message = 'Setting up universes';
    this.loading.percentage = 80;
    this.name = showData.name;
    this.bpm = showData.bpm;
    await this.prepareUniverses(showData);

    this.loading.message = 'Loading groups data';
    this.loading.percentage = 90;
    this.prepareGroups(showData);

    this.loading.message = 'Loading outputs';
    this.loading.percentage = 90;
    this.prepareOutputs(showData);

    this.loading.message = 'Finalizing';
    this.loading.percentage = 95;
    this.name = showData.name;
    this.ready = true;
    this.isSaved = true;

    this.persistLocally();
  }

  /**
   * Prepares show fixtures from provided show data
   *
   * @param {Object} handle to show data configuration object
   * @public
   * @async
   */
  async prepareFixtures(showData) {
    for (let i = 0; i < showData.fixtures.length; i++) {
      const fixtureData = showData.fixtures[i];
      fixtureData.OFLData = JSON.parse(fixtureDataCache[`${fixtureData.manufacturer}/${fixtureData.model}`] || null);
      if (!fixtureData.OFLData) {
        const res = await axios.get(`${import.meta.env.VITE_STATIC_URL}fixtures/${fixtureData.manufacturer}/${fixtureData.model}.json`);
        fixtureData.OFLData = res.data;
        fixtureDataCache[`${fixtureData.manufacturer}/${fixtureData.model}`] = JSON.stringify(fixtureData.OFLData);
      }
      this.fixturePool.addRaw(fixtureData);
    }
  }

  /**
   * Preloads fixture library from provided fixture list configuration
   *
   * @public
   * @async
   * @see ./fixtures/fixture_list.json
   * @see https://open-fixture-library.org/
   */
  async preloadFixtureList() {
    try {
      const res = await axios.get(`${import.meta.env.VITE_STATIC_URL}fixtures/fixture_list.json`);
      this.rawOFLFixtures = res.data;
    } catch (err) {
      console.log('could not fetch fixture list.');
    }
  }

  /**
   * Gets showfile type from showfile extension
   *
   * @todo Implement QLC and other showfile formats better
   *
   * @param {String} showFileName show file name
   * @static
   */
  static _getShowFileType(showFileName) {
    const splitted = showFileName.split('.');
    return splitted[splitted.length - 1];
  }

  /**
   * Parses show data
   *
   * @todo Implement QLC and other showfile formats better
   *
   * @param {File} showFile handle to raw showfile instance
   * @param {String} extension extendion of the provided showfile
   * @static
   */
  static _parseShowData(showFile, extension) {
    switch (extension) {
      case SHOWFILE_EXTENSIONS.QLC:
        return Show._parseQLCShowFile(showFile);
      case SHOWFILE_EXTENSIONS.ASLS:
        return JSON.parse(showFile);
      default:
        throw new Error('Could not load provided file');
    }
  }

  /**
   * Parses QLC showfile
   *
   * @todo Implement QLC parsing better
   *
   * @param {File} showFile handle to QLC showfile
   * @static
   * @async
   */
  static async _parseQLCShowFile(showFile) {
    let parsed = await XMLParse(showFile);
    // eslint-disable-next-line prefer-destructuring
    parsed = parsed.Workspace.Engine[0];
    const showData = {
      universes: parsed.InputOutputMap[0].Universe.map((universe) => ({
        id: universe.$.ID,
        name: universe.$.Name,
      })),
      fixtures: parsed.Fixture.map((fixtureData) => ({
        manufacturer: fixtureData.Manufacturer[0].replace(/\s/g, '-').toLowerCase(),
        model: fixtureData.Model[0].replace(/\s/g, '-').toLowerCase(),
        mode: fixtureData.Mode[0],
        id: fixtureData.ID[0],
        chStart: fixtureData.Address[0],
        universe: fixtureData.Universe[0],
      })),
      functions: {
        scenes: parsed.Function.filter((fun) => fun.$.Type === 'Scene').map((sceneData) => ({
          name: sceneData.$.Name,
          id: sceneData.$.ID,
          fixtures: sceneData.FixtureVal.map((fixtureVal) => ({
            id: fixtureVal.$.ID,
            values: fixtureVal._ ? fixtureVal._.split(',') : [],
          })),
        })),
      },
    };
    return showData;
  }

  /**
   * Reads a file asynchronously
   *
   * @todo put this in utils
   *
   * @param {File} file handle to file instance
   * @static
   * @async
   */
  static async readFileAsync(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.onerror = reject;
      fr.readAsText(file);
    });
  }
}

export default Show;
