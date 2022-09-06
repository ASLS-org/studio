'use strict'

import Cue from './cue.model.js'
import Fade from './fade.model'

/**
 * List of RGB color channels names as described in OFL-formated files
 * 
 * @constant {Array<String>} RGB_CHANNELS
 */
const RGB_CHANNELS = ["Red", "Green", "Blue"];
/**
 * List of CMY color channels names as described in OFL-formated files
 * 
 * @constant {Array<String>} CMY_CHANNELS
 */
const CMY_CHANNELS = ["Cyan", "Magenta", "Yellow"];
/**
 * Enumeration of scene's running directions
 * 
 * @constant {Object} SCENE_DIRECTIONS
 * @enum {Number}
 */
const SCENE_DIRECTIONS = {
  IN: 0,
  OUT: 1
}

/**
 * @class FixtureValue
 * @classdesc FixtureValues describe a set of preset channel values for a given fixture 
 */
class FixtureValue {

  /**
   * Creates an instance of FixtureValue.
   * 
   * @param {Object} fixture handle to fixture instance
   * @param {Array<Number>} channelValues List of fixture's preset channel values
   */
  constructor(fixture, channelValues) {
    this.fixture = fixture;
    this.channelValues = channelValues;
  }

  /**
   * Channel values
   *
   * @type {Array<Number>}
   */
  set channelValues(channelValues) {
    this._quickChannelsAccessors = JSON.parse(JSON.stringify(this.fixture.quickChannelsAccessors));
    if (!channelValues.length) {
      Object.keys(this._quickChannelsAccessors).map(channelType => {
        let channels = this._quickChannelsAccessors[channelType];
        channels.forEach(channel => {
          channel.value = 0;
          channel.active = false;
        })
      })
    } else {
      channelValues.forEach(cv => {
        this.setQuickAccessor(cv)
      })
    }
  }


  /**
   * Fixture's color channels values.
   * Only RGB color suppoprtded at the moment.
   * @todo Implement other color changer types (HSB...). Should do for the alpha
   * 
   * @type {Array<Number>}
   */
  set color(rgbValue) {
    if (this.hasQuickAccessor({
        type: "Color"
      })) {
      this.quickChannelsAccessors.Color.forEach(channel => {
        if (RGB_CHANNELS.includes(channel.color)) {
          channel.value = rgbValue[RGB_CHANNELS.indexOf(channel.color)]
          channel.active = true;
          this.setQuickAccessor(channel)
        } else if (CMY_CHANNELS.includes(channel.color)) {
          channel.value = 255 - rgbValue[CMY_CHANNELS.indexOf(channel.color)];
          channel.active = true;
          this.setQuickAccessor(channel)
        }
      })
    }
  }

  /**
   * Fixture's pan&tilt channels values (0-255)/(0-255)
   * 
   * @type {Object}
   */
  set panTilt(value) {
    this.setQuickAccessor({
      type: "Pan",
      value: value.pan,
      active: true
    });
    this.setQuickAccessor({
      type: "Tilt",
      value: value.tilt,
      active: true
    });
    this.setQuickAccessor({
      type: "PanFine",
      value: value.panFine,
      active: true
    });
    this.setQuickAccessor({
      type: "TiltFine",
      value: value.tiltFine,
      active: true
    });
  }


  /**
   * list of quick channels accessors
   *
   * @readonly
   * @type {Array<Object>}
   */
  get quickChannelsAccessors() {
    return this._quickChannelsAccessors || {};
  }

  get channelValues() {
    let channelValues = Object.keys(this._quickChannelsAccessors).map(channelType => {
      let channels = this._quickChannelsAccessors[channelType];
      return channels.map(channel => {
        return {
          id: channel.id,
          type: channel.type,
          value: channel.value,
          active: channel.active,
          color: channel.color,
          qaIndex: channel.qaIndex
        }
      }).flat();
    }).flat();
    return channelValues;
  }

  get color() {
    let colorValues = [0, 0, 0]
    if (this.hasQuickAccessor({
        type: "Color"
      })) {
      this.quickChannelsAccessors.Color.forEach(colorChannel => {
        if (RGB_CHANNELS.includes(colorChannel.color)) {
          colorValues[RGB_CHANNELS.indexOf(colorChannel.color)] = colorChannel.value
        } else if (CMY_CHANNELS.includes(colorChannel.color)) {
          colorValues[CMY_CHANNELS.indexOf(colorChannel.color)] = 255 - colorChannel.value;
        }
      })
    }
    return colorValues;
  }

  get panTilt() {
    return {
      pan: this.hasQuickAccessor({
        type: "Pan"
      }) ? this.getQuickAccessor({
        type: 'Pan'
      }).value : 0,
      panFine: this.hasQuickAccessor({
        type: "PanFine"
      }) ? this.getQuickAccessor({
        type: "PanFine"
      }).value : 0,
      tilt: this.hasQuickAccessor({
        type: "Tilt"
      }) ? this.getQuickAccessor({
        type: "Tilt"
      }).value : 0,
      tiltFine: this.hasQuickAccessor({
        type: "TiltFine"
      }) ? this.getQuickAccessor({
        type: "TiltFine"
      }).value : 0,
    }
  }


  /**
   * Sets quick accessor activity and value
   * 
   * @public
   * @param {Object} channel channel object
   */
  setQuickAccessor(channel) {
    if (this.hasQuickAccessor(channel)) {
      let accessor = this.getQuickAccessor(channel);
      accessor.value = channel.value;
      accessor.active = channel.active;
      this.fixture.setChannel(accessor.id - 1, accessor.value);
    }
  }

  /**
   * Checks if quick accessor exists
   * 
   * @public
   * @param {Object} channel channel object
   * @returns {Boolean} Whether the accesor exists or not 
   */
  hasQuickAccessor(channel) {
    return this.quickChannelsAccessors[channel.type] != undefined && this.quickChannelsAccessors[channel.type][channel.qaIndex || 0] != undefined
  }

  /**
   * Returns quick accessor from channel
   * 
   * @public
   * @param {Object} channel channel object
   * @returns {Object} handle to quick accessor
   */
  getQuickAccessor(channel) {
    if (this.hasQuickAccessor(channel)) {
      return this.quickChannelsAccessors[channel.type][channel.qaIndex || 0];
    }
  }

}


/**
 * @class Scene
 * @extends {Cue}
 * @classdesc Scenes are cues which allow the control of one or many fixture's channels by providing
 * each with a set of preset values which will be set (gradually or not) on scene cue
 */
class Scene extends Cue {

  /**
   * Creates an instance of Scene.
   * 
   * @param {Object} sceneData Scene configuration object
   * @param {Object} sceneData.fadeIn Scene fadein configuration object
   * @param {Object} sceneData.fadeOut Scene fadeOUT configuration object
   * @param {Object} sceneData.fixtures Scene fixture list
   * @param {Object} sceneData.fixtureValues Scene fixtureValue list for each fixture
   * @see Fade
   * @example let scene = new Scene({});
   */
  constructor(sceneData) {
    super(sceneData)
    this.fadeIn = new Fade(Object.assign({
      direction: 0,
      duration: sceneData.duration
    }, sceneData.fadeIn));
    this.fadeOut = new Fade(Object.assign({
      direction: 1,
      duration: sceneData.duration
    }, sceneData.fadeOut));
    this.direction = SCENE_DIRECTIONS.IN;
    this.fixtures = sceneData.fixtures;
    this.fixtureValues = sceneData.fixtureValues
    return this.proxify(['time', 'deltaStart', 'animationId', 'state', '_state', 'DMXActivity']);
  }

  /**
   * Scene fixtures
   *
   * @type {Array<FixtureValue>}
   */
  set fixtures(fixtures) {
    this._fixtures = fixtures;
    this._fixtureValues = fixtures.map(fixture => {
      return new FixtureValue(fixture, []);
    })
  }

  /**
   * Scene fixturevalues
   *
   * @type {Array<Object>}
   */
  set fixtureValues(fixtureValues) {
    if (fixtureValues && fixtureValues.length) {
      fixtureValues.forEach(fv => {
        let fixtureValue = this.getFixtureValueFromId(fv.fixture.id);
        if (fixtureValue) {
          fixtureValue.channelValues = fv.channelValues;
        }
      })
    }
  }

  /**
   * Scene running direction (in/out)
   *
   * @type {Array<Object>}
   */
  set direction(direction) {
    this._direction = direction;
  }

  /**
   * Cue duration in bars
   *
   * @type {Number}
   */
  set duration(duration) {
    super.duration = duration
    if (this.fadeIn) {
      this.fadeIn.duration = this.duration;
    }
  }


  /**
   * Scene's listable fixtures data
   *
   * @readonly
   * @type {Array<Object>}
   */
  get listableFixtures() {
    return this.fixtureValues.map(fixtureValue => {
      return {
        name: fixtureValue.fixture.name,
        id: fixtureValue.fixture.id,
        icon: 'movinghead',
        more: `U${fixtureValue.fixture.universe}-CH${fixtureValue.fixture.chStart}`
      }
    })
  }

  /**
   * Scene's exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return Object.assign(super.showData, {
      type: 0,
      fixtures: this.fixtures.map(f => f.id),
      fixtureValues: this.fixtureValues.map(fv => {
        return {
          fixture: {
            id: fv.fixture.id
          },
          channelValues: fv.channelValues
        }
      }),
      fadeIn: this.fadeIn.showData,
      fadeOut: this.fadeOut.showData
    })
  }

  get fixtureValues() {
    return this._fixtureValues || [];
  }

  get fixtures() {
    return this._fixtures;
  }

  get direction() {
    return this._direction;
  }

  get duration() {
    return super.duration;
  }

  /**
   * Add a fixture to the scene's fixture pool
   * 
   * @public
   * @param {Object} fixture 
   */
  addFixture(fixture) {
    this._fixtureValues.push(new FixtureValue(fixture, []));
  }

  /**
   * Returns fixtureValue from provided fixture ID
   *
   * @public
   * @param {Number} id fixture ID
   * @return {Object} fixture value
   * @todo Implement null check ?
   */
  getFixtureValueFromId(id) {
    return this.fixtureValues.find(fixtureValue => fixtureValue.fixture.id === id);
  }

  /**
   * Returns fixture from provided fixture ID
   *
   * @public
   * @param {Number} id fixture ID
   * @return {Object} handle to fixture instance
   * @todo Implement null check ?
   */
  getFixtureFromId(id) {
    return this.fixtures.find(fixture => fixture.id === id);
  }

  /**
   * Removes a fixture from the scene's fixture pool
   * 
   * @public
   * @param {Object} fixture 
   */
  deleteFixture(fixture) {
    let index = this.fixtureValues.findIndex(fixtureValue => fixtureValue.fixture.id == fixture.id);
    if (index > -1) {
      this.fixtureValues.splice(index, 1);
    }
  }

  /**
   * Adds curent DMX channel values to every channelValue
   * This is used when running scenes in relative mode so 
   * Transition from current value to preset value is smooth.
   *
   * @public
   */
  prepareStartValues() {
    this.fixtureValues.forEach(fixtureValue => {
      Object.keys(fixtureValue.quickChannelsAccessors).forEach(channelType => {
        let channels = fixtureValue.quickChannelsAccessors[channelType];
        channels.forEach(channel => {
          if (channel.active) {
            channel.startValue = fixtureValue.fixture.getQuickAccessor(channel).value.DMX;
          }
        })
      })
    })
  }

  /**
   * Updates scene over time
   *
   * @public
   * @override
   * @todo this could be massively improved loop complexity wise O(n^3)
   * @todo memoisation could be an option ? It might be memory expensive though ?
   * @param {Number} t update time
   */
  update(time) {
    this.time = time;
    this.DMXActivity = 0;
    if (!this.state && this.relative || time === 0 && this.relative || !this.state && this.direction == SCENE_DIRECTIONS.OUT) {
      this.prepareStartValues();
      this.state = 1;
    }
    let fade = this.direction == SCENE_DIRECTIONS.IN ? this.fadeIn : this.fadeOut;
    let fadeFactor = time < fade.duration ? fade.getValue(time) : 1;
    this.fixtureValues.forEach(fixtureValue => {
      Object.keys(fixtureValue.quickChannelsAccessors).forEach(channelType => {
        let channels = fixtureValue.quickChannelsAccessors[channelType];
        channels.forEach(channelValue => {
          if (channelValue.active) {
            let finalValue = this.direction == SCENE_DIRECTIONS.IN ? channelValue.value : 0;
            let value = this.relative ?
              Math.floor(channelValue.startValue + (finalValue - channelValue.startValue) * fadeFactor) :
              Math.floor(finalValue * fadeFactor);
            fixtureValue.fixture.setQuickAccessor(channelValue, value);
            this.DMXActivity += value;
          }
        })
      })
    })
    if (time >= this.duration) {
      //this.direction = !this.direction;
      this.state = this.direction;
    }
  }

  /**
   * Manually remove scene instance reference from memory
   *
   * @private
   * @param {Object} instance handle to scene instance to be freed
   */
  static deleteInstance(instance) {
    Object.keys(instance).forEach(prop => {
      delete instance[prop]
    })
    instance = null;
  }

}

export default Scene;