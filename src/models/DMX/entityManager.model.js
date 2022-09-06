'use strict'

/**
 * Entity Hertz unit 
 * 
 * @constant {String} ENTITY_UNIT_HZ
 */
const ENTITY_UNIT_HZ = "Hz";
/**
 * Entity Beats Per Minute unit 
 * 
 * @constant {String} ENTITY_UNIT_BPM
 */
const ENTITY_UNIT_BPM = "bpm";
/**
 * Entity Meter unit 
 * 
 * @constant {String} ENTITY_UNIT_DIST
 */
const ENTITY_UNIT_DIST = "m";
/**
 * Entity Round Per Minutes unit 
 * 
 * @constant {String} ENTITY_UNIT_RPM
 */
const ENTITY_UNIT_RPM = "rpm";
/**
 * Entity percent unit 
 * 
 * @constant {String} ENTITY_UNIT_PERC
 */
const ENTITY_UNIT_PERC = "%";
/**
 * Entity second unit 
 * 
 * @constant {String} ENTITY_UNIT_S
 */
const ENTITY_UNIT_S = "s";
/**
 * Entity millisecond unit 
 * 
 * @constant {String} ENTITY_UNIT_MS
 */
const ENTITY_UNIT_MS = "ms";
/**
 * Entity lumen unit 
 * 
 * @constant {String} ENTITY_UNIT_LM
 */
const ENTITY_UNIT_LM = "lm";
/**
 * Entity Kelvin unit 
 * 
 * @constant {String} ENTITY_UNIT_K
 */
const ENTITY_UNIT_K = "K";
/**
 * Entity Cubic meter per minute unit
 * 
 * @constant {String} ENTITY_UNIT_M3MIN
 */
const ENTITY_UNIT_M3MIN = "m^3/min";
/**
 * Entity Degree unit 
 * 
 * @constant {String} ENTITY_UNIT_DEG
 */
const ENTITY_UNIT_DEG = "deg";
/**
 * Entity no unit 
 * 
 * @constant ENTITY_UNIT_NONE
 */
const ENTITY_UNIT_NONE = null;

/**
 * Preset value minus 100
 * 
 * @constant PRESET_VALUE_M100
 */
const PRESET_VALUE_M100 = "-100%";
/**
 * Preset value minus 1
 * 
 * @constant PRESET_VALUE_M1
 */
const PRESET_VALUE_M1 = "-1%";
/**
 * Preset value zero
 * 
 * @constant PRESET_VALUE_0
 */
const PRESET_VALUE_0 = "0%";
/**
 * Preset value 1
 * 
 * @constant PRESET_VALUE_1
 */
const PRESET_VALUE_1 = "1%";
/**
 * Preset value 100
 * 
 * @constant PRESET_VALUE_100
 */
const PRESET_VALUE_100 = "100%";


/**
 * List of entities configurations
 * 
 * @constant {Object} ENTITIES
 * @see https://github.com/OpenLightingProject/open-fixture-library/blob/master/docs/capability-types.md
 */
const ENTITIES = {
  Speed: {
    units: [
      ENTITY_UNIT_HZ,
      ENTITY_UNIT_BPM,
      ENTITY_UNIT_PERC
    ],
    values: {
      "fast reverse": PRESET_VALUE_M100,
      "slow reverse": PRESET_VALUE_M1,
      "stop": PRESET_VALUE_0,
      "slow": PRESET_VALUE_1,
      "fast": PRESET_VALUE_100
    }
  },
  RotationSpeed: {
    units: [
      ENTITY_UNIT_HZ,
      ENTITY_UNIT_RPM,
      ENTITY_UNIT_PERC
    ],
    values: {
      "fast CCW": PRESET_VALUE_M100,
      "slow CCW": PRESET_VALUE_M1,
      "stop": PRESET_VALUE_0,
      "slow CW": PRESET_VALUE_1,
      "fast CW": PRESET_VALUE_100
    }
  },
  Time: {
    units: [
      ENTITY_UNIT_S,
      ENTITY_UNIT_MS,
      ENTITY_UNIT_PERC
    ],
    values: {
      "instant": PRESET_VALUE_0,
      "short": PRESET_VALUE_1,
      "long": PRESET_VALUE_100
    }
  },
  Duration: {
    units: [
      ENTITY_UNIT_S,
      ENTITY_UNIT_MS,
      ENTITY_UNIT_PERC
    ],
    values: null
  },
  Distance: {
    units: [
      ENTITY_UNIT_DIST,
      ENTITY_UNIT_PERC
    ],
    values: {
      "near": PRESET_VALUE_1,
      "far": PRESET_VALUE_100
    }
  },
  Brightness: {
    units: [
      ENTITY_UNIT_LM,
      ENTITY_UNIT_PERC
    ],
    values: {
      "off": PRESET_VALUE_0,
      "dark": PRESET_VALUE_1,
      "bright": PRESET_VALUE_100
    }
  },
  ColorTemperature: {
    units: [
      ENTITY_UNIT_K,
      ENTITY_UNIT_PERC
    ],
    values: {
      "warm / CTO": PRESET_VALUE_M100,
      "default": PRESET_VALUE_0,
      "cold / CTB": PRESET_VALUE_100
    }
  },
  FogOutput: {
    units: [
      ENTITY_UNIT_M3MIN,
      ENTITY_UNIT_PERC
    ],
    values: {
      "off": PRESET_VALUE_0,
      "weak": PRESET_VALUE_1,
      "strong": PRESET_VALUE_100
    }
  },
  Angle: {
    units: [
      ENTITY_UNIT_DEG,
      ENTITY_UNIT_PERC
    ],
    values: null
  },
  RotationAngle: {
    units: [
      ENTITY_UNIT_DEG,
      ENTITY_UNIT_PERC
    ],
    values: null
  },
  BeamAngle: {
    units: [
      ENTITY_UNIT_DEG,
      ENTITY_UNIT_PERC
    ],
    values: {
      "closed": PRESET_VALUE_0,
      "narrow": PRESET_VALUE_1,
      "wide": PRESET_VALUE_100
    }
  },
  HorizontalAngle: {
    units: [
      ENTITY_UNIT_DEG,
      ENTITY_UNIT_PERC
    ],
    values: {
      "left": PRESET_VALUE_M100,
      "center": PRESET_VALUE_0,
      "right": PRESET_VALUE_100
    }
  },
  VerticalAngle: {
    units: [
      ENTITY_UNIT_DEG,
      ENTITY_UNIT_PERC
    ],
    values: {
      "top": PRESET_VALUE_M100,
      "center": PRESET_VALUE_0,
      "bottom": PRESET_VALUE_100
    }
  },
  SwingAngle: {
    units: [
      ENTITY_UNIT_DEG,
      ENTITY_UNIT_PERC
    ],
    values: {
      "off": PRESET_VALUE_0,
      "narrow": PRESET_VALUE_1,
      "wide": PRESET_VALUE_100
    }
  },
  Parameter: {
    units: [
      ENTITY_UNIT_NONE,
      ENTITY_UNIT_PERC
    ],
    values: {
      "off / instant": PRESET_VALUE_0,
      "low / slow / small / short": PRESET_VALUE_1,
      "high / fast / big / long": PRESET_VALUE_100
    }
  },
  SlotNumber: {
    units: [
      ENTITY_UNIT_NONE
    ],
    values: null
  },
  Percent: {
    units: [
      ENTITY_UNIT_PERC
    ],
    values: {
      "off": PRESET_VALUE_0,
      "low": PRESET_VALUE_1,
      "high": PRESET_VALUE_100
    }
  },
  Insertion: {
    units: [
      ENTITY_UNIT_PERC
    ],
    values: {
      "out": PRESET_VALUE_0,
      "in": PRESET_VALUE_100
    }
  },
  IrisPercent: {
    units: [
      ENTITY_UNIT_PERC
    ],
    values: {
      "closed": PRESET_VALUE_0,
      "open": PRESET_VALUE_100
    }
  },
}


/**
 * Describes a type-specific property
 * 
 * @class Entity
 * @classdesc Describes a type-specific property
 * @see https://github.com/OpenLightingProject/open-fixture-library/blob/master/docs/capability-types.md
 */
class Entity {

  /**
   * Creates an instance of Entity.
   * 
   * @param {String} type entity type
   * @param {Object} values list of entity values
   * @param {Array} units list of available entity units
   */
  constructor(type, values, units) {
    this._type = type;
    this._values = values;
    this._units = units;
  }

  /**
   * Converts input value to unit of choice
   *
   * @public
   * @param {String} value unsplitted input value string containing value unit or preset value
   * @param {String} unit units to be converted to
   * @param {Number} min minimum value
   * @param {Number} max maximum value
   * @return {Number} converted value  
   */
  getValue(value, unit, min, max) {
    value = this.getValueFromPresets(value)
    let valueUnit = this.parseValueUnit(value)
    if (valueUnit == unit) {
      return parseFloat(value);
    } else if (valueUnit == ENTITY_UNIT_PERC) {
      return (parseFloat(value) / 100) * (max - min);
    } else {
      if (this._type == "Speed" || this._type == "RotationSpeed") {
        return parseFloat(value) * (unit == ENTITY_UNIT_BPM || unit == ENTITY_UNIT_RPM ? 60 : 1 / 60)
      } else {
        return parseFloat(value) * (unit == ENTITY_UNIT_S ? 1 / 1000 : 1000)
      }
    }
  }

  /**
   * Fetches value from preset 
   *
   * @public
   * @param {String} value  preset value string
   * @return {Number} Preset value  
   */
  getValueFromPresets(value) {
    if (this._values) {
      return this._values[value] || value;
    }
    return value
  }

  /**
   * Parses and returns a valuestring's unit
   *
   * @param {String} value
   * @return {String} unit string 
   */
  parseValueUnit(value) {
    return value.toString().replace(/[0-9]/g, '') || null;
  }

}


/**
 * @class EntityManager
 * @classdesc Entity manager singleton. Manages Entities.
 * @see Entity
 */
class EntityManager {

  constructor() {
    if (!EntityManagerInstance) {
      this.entities = {};
      this.init();
      EntityManagerInstance = this;
    }
    return EntityManagerInstance;
  }

  /**
   * Initilises entity manager.
   * parses each entity tye described 
   * in ENTITIES constant
   * 
   * @see ENTITIES
   */
  init() {
    Object.keys(ENTITIES).forEach(entityType => {
      let entityData = ENTITIES[entityType];
      this.entities[entityType] = new Entity(
        entityType,
        entityData.values,
        entityData.units
      )
    })
  }

}

var EntityManagerInstance = new EntityManager();
export default EntityManagerInstance;