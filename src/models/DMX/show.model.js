'use strict'

import axios from 'axios';
import {
  EventEmitter
} from 'events';
import {
  parseStringPromise as XMLParse
} from 'xml2js'
import {
  ProxifySingleton
} from '../utils/proxify.utils';

import Master from './master.model'
import GroupPool from './group.pool.model'
import UniversePool from './universe.pool.model';
import FixturePool from './fixture.pool.model';
import Live from './live.model';
import WebRTC from '@/plugins/webrtc.js'

const LOCALSTORAGE_SHOWFILE_KEY = "ASLS_STUDIO_SHOWFILE"
const DEFAULT_PROJECT_NAME = "new_project.asls"
const DEFAULT_BPM_VALUE = 120

const SHOWFILE_EXTENSIONS = {
  QLC: "qxw",
  ASLS: "json"
}

const SHOW_ERRCODES = {
  UNSUPPORTED_FILE: 0
}

var fixtureDataCache = {};

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
    this.name = ""
    this.isSaved = true;
    this.rawOFLFixtures = [];
    this.fixturePool = new FixturePool();
    this.universePool = new UniversePool();
    this.groupPool = new GroupPool();
    this.master = new Master(this.groupPool);
    // this.bpm = Live.bpm
    this.running = false;
    this.slave = false;
    this.outputs = [];
    this.selectedOutputs = [];
    this.loading = {
      state: true,
      message: "Preparing Environment",
      percentage: 10,
    }
    this.ready = false;
    this.artnetServerUrl = process.env.VUE_APP_DMX2WS_SERVER_URL
    this.visualizerHandle = null;
    ProxifySingleton.on("changed", () => {
      this.isSaved = false;
      this.emit("saveState", this.isSaved)
    })
    WebRTC.on("open", () => {
      Live.add(this.dumpShowData.bind(this))
    })
    WebRTC.on("config-update", () => {
      this.outputs = WebRTC.ifaces
      /*.map((output, i) => {
              return Object.assign(output,{
                id: i,
                name: `${output.name} - ${output.cidr.split("/")[0]}`,
                more: "Artnet",
                toggled: this.selectedOutputs.name === output.name
              });
            });*/
    });
    // WebRTC.on("universeData", this.syncShowData.bind(this))
    this.universePool.addRaw();
    this.preloadFixtureList();
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

  set saveState(saveState) {
    this.isSaved = saveState
  }

  get name() {
    return this._name ? this._name : DEFAULT_PROJECT_NAME;
  }

  get tick() {
    return Live.tick;
  }

  get state() {
    return Live.state
  }

  get showData() {
    return {
      name: this.name,
      bpm: this.bpm,
      fixtures: this.fixturePool.fixtures.map(f => f.showData),
      universes: this.universePool.universes.map(u => u.showData),
      groups: this.groupPool.groups.map(g => g.showData),
      visualizer: this.visualizerHandle.showData,
      selectedOutputs: this.selectedOutputs,
    }
  }

  set name(name) {
    if (name) {
      this._name = name.replace(".json", "");
    }
  }

  set state(state) {
    Live.state = state
  }

  get bpm() {
    return Live.bpm;
  }

  set bpm(bpm) {
    Live.bpm = bpm;
  }

  set selectedOutputs(data = []) {
    this._selectedOutputs = data;
  }

  get selectedOutputs() {
    return this._selectedOutputs;
  }

  undo() {
    ProxifySingleton.undo();
  }

  redo() {
    ProxifySingleton.redo();
  }

  tapTempo() {
    return this.bpm = Live.tapTempo();
  }

  persistLocally() {
    localStorage.setItem(LOCALSTORAGE_SHOWFILE_KEY, JSON.stringify(this.showData));
    this.isSaved = true;
    this.emit("saveState", this.isSaved)
  }

  setOutputs(outputs) {
    WebRTC.setOutputs(outputs)
    this.selectedOutputs = outputs;
  }

  /*syncShowData(msg) {
    if (this.slave) {
      let data = JSON.parse(msg.data);
      if (this.universePool.universes[data.universe]) {
        this.universePool.universes[data.universe].DMX512Data = data.DMX512Buffer;
        this.running = !this.running
      }
    }
  }*/

  dumpShowData() {
    if (!this.slave) {
      this.universePool.universes.forEach(universe => {
        WebRTC.broadcastUniverseData(universe.DMX512Data);
      })
    }
  }

  async prepareUniverses(showData) {

    showData.universes.forEach(universeData => {
      let universe = this.universePool.addRaw(universeData);
      universeData.fixtures.forEach(fixtureData => {
        let fixture = this.fixturePool.getFromId(fixtureData.id);
        universe.patchFixture(fixture);
      })
    })
  }

  prepareGroups(showData) {
    if (showData.groups) {
      showData.groups.forEach(g => {
        let group = this.groupPool.addRaw(g)
        g.fixtures.forEach(f => {
          let fixture = this.fixturePool.getFromId(f.id)
          group.addFixture(fixture);
        })
        g.cues.forEach(c => {
          group.addCue(c);
        })
        g.chases.forEach(c => {
          group.addChase(c);
        })
      })
    }
  }

  deleteFixture(fixture) {
    let fixtureHandle = this.fixturePool.getFromId(fixture.id);
    if (fixtureHandle) {
      this.groupPool.groups.forEach(g => {
        if (g.fixturePool.checkIfExists(fixtureHandle.id)) {
          g.deleteFixture(fixtureHandle);
        }
      })
      let universe = this.universePool.getFromId(fixtureHandle.universe);
      universe.unpatchFixture(fixtureHandle);
      this.fixturePool.delete(fixtureHandle, true);
    }
  }

  clearShowData() {
    this.groupPool.clearAll();
    this.universePool.clearAll();
    this.fixturePool.clearAll(true);
    this.name = ""
    this.isSaved = true;
    this.bpm = DEFAULT_BPM_VALUE
  }

  setupNewProject(name) {
    this.loading = {
      state: true,
      message: "Clearing show data",
      percentage: 20,
    }
    this.clearShowData();
    this.loading = {
      state: true,
      message: "Setting up new project",
      percentage: 40,
    }
    this.name = name;
    this.bpm = 120;
    this.universePool.addRaw();
    this.groupPool.addRaw()
    this.loading = {
      state: true,
      message: "Preloading fixture library",
      percentage: 60,
    }
    this.preloadFixtureList();
    this.loading = {
      state: true,
      message: "Persisting project locally",
      percentage: 80,
    }
    this.persistLocally();
  }

  genShowFile() {
    return JSON.stringify(this.showData);
  }

  async loadFromUrl(url) {
    let res = await axios.get(url);
    await this.loadShowFile(url, res.data);
  }

  async loadFromFile(file) {
    try {
      let fileData = await Show.readFileAsync(file)
      await this.loadShowFile(file.name, fileData)
    } catch (err) {
      console.log(err)
    }
  }

  async loadFromLocalStorage() {
    let ls_showdata = localStorage.getItem(LOCALSTORAGE_SHOWFILE_KEY)
    if (ls_showdata != null) {
      await this.loadFromData(JSON.parse(ls_showdata));
    } else {
      await this.setupNewProject();
    }
  }

  async loadShowFile(filename, data) {
    let extension = Show._getShowFileType(filename);
    let showData = await Show._parseShowData(data, extension);
    await this.loadFromData(showData);
    this.name = filename
  }

  async loadFromData(showData) {
    this.loading.state = true;
    this.loading.message = "Clearing Show Data";
    this.loading.percentage = 20;
    this.clearShowData();

    this.loading.message = "Setting preferences";
    this.loading.percentage = 30;
    this.visualizerHandle.preferences = showData.visualizer

    this.loading.message = "Preloading fixture library";
    this.loading.percentage = 40;
    await this.preloadFixtureList();

    this.loading.message = "Setting up show fixtures";
    this.loading.percentage = 60;
    await this.prepareFixtures(showData);

    this.loading.message = "Setting up universes";
    this.loading.percentage = 80;
    this.name = showData.name;
    this.bpm = showData.bpm;
    await this.prepareUniverses(showData);

    this.loading.message = "Loading groups data";
    this.loading.percentage = 90;
    this.prepareGroups(showData);

    this.loading.message = "Finalizing";
    this.loading.percentage = 95;
    this.name = showData.name
    this.selectedOutputs = showData.selectedOutputs
    this.ready = true;
    this.isSaved = true;
  }

  async prepareFixtures(showData) {
    for (let i = 0; i < showData.fixtures.length; i++) {
      let fixtureData = showData.fixtures[i];
      fixtureData.OFLData = JSON.parse(fixtureDataCache[`${fixtureData.manufacturer}/${fixtureData.model}`] || null);
      if (!fixtureData.OFLData) {
        let res = await axios.get(`/fixtures/${fixtureData.manufacturer}/${fixtureData.model}.json`);
        fixtureData.OFLData = res.data;
        fixtureDataCache[`${fixtureData.manufacturer}/${fixtureData.model}`] = JSON.stringify(fixtureData.OFLData);
      }
      this.fixturePool.addRaw(fixtureData);
    }
  }

  async preloadFixtureList() {
    try {
      let res = await axios.get('/fixtures/fixture_list.json');
      this.rawOFLFixtures = res.data
    } catch (err) {
      console.log("could not fetch fixture list.")
    }
  }

  static _getShowFileType(showFileName) {
    let splitted = showFileName.split('.')
    return splitted[splitted.length - 1]
  }

  static _parseShowData(showFile, extension) {
    switch (extension) {
      case SHOWFILE_EXTENSIONS.QLC:
        return Show._parseQLCShowFile(showFile);
      case SHOWFILE_EXTENSIONS.ASLS:
        return JSON.parse(showFile)
      default:
        throw {
          code: SHOW_ERRCODES.UNSUPPORTED_FILE,
            info: "Could not load provided file"
        }
    }
  }

  static async _parseQLCShowFile(showFile) {
    let parsed = await XMLParse(showFile);
    parsed = parsed.Workspace.Engine[0];
    let showData = {
      universes: parsed.InputOutputMap[0].Universe.map(universe => {
        return {
          id: universe.$.ID,
          name: universe.$.Name
        }
      }),
      fixtures: parsed.Fixture.map(fixtureData => {
        return {
          manufacturer: fixtureData.Manufacturer[0].replace(/\s/g, '-').toLowerCase(),
          model: fixtureData.Model[0].replace(/\s/g, '-').toLowerCase(),
          mode: fixtureData.Mode[0],
          id: fixtureData.ID[0],
          chStart: fixtureData.Address[0],
          universe: fixtureData.Universe[0],
        }
      }),
      functions: {
        scenes: parsed.Function.filter(fun => fun.$.Type == "Scene").map(sceneData => {
          return {
            name: sceneData.$.Name,
            id: sceneData.$.ID,
            fixtures: sceneData.FixtureVal.map(fixtureVal => {
              return {
                id: fixtureVal.$.ID,
                values: fixtureVal._ ? fixtureVal._.split(',') : []
              }
            })
          }
        })
      }
    }
    return showData;
  }

  static async readFileAsync(file) {
    return new Promise((resolve, reject) => {
      let fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.onerror = reject;
      fr.readAsText(file);
    })
  }


}

export default Show;