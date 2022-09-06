'use strict'

import EntityManager from './entityManager.model';

//TODO: Fetching these from EntityManager would be nicer
/**
 * Entity Hertz unit 
 * 
 * @constant {String} ENTITY_UNIT_HZ
 */
const ENTITY_UNIT_HZ = "Hz";
// const ENTITY_UNIT_BPM   = "bpm";
// const ENTITY_UNIT_DIST  = "m";
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
// const ENTITY_UNIT_S     = "s";
/**
 * Entity millisecond unit 
 * 
 * @constant {String} ENTITY_UNIT_MS
 */
const ENTITY_UNIT_MS = "ms";
// const ENTITY_UNIT_LM    = "lm";
/**
 * Entity Kelvin unit 
 * 
 * @constant {String} ENTITY_UNIT_K
 */
const ENTITY_UNIT_K = "K";
// const ENTITY_UNIT_M3MIN = "m^3/min";
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
 * Ranged capability property start pattern
 * 
 * @constant {String} RANGED_CAPABILITY_PATTERN_START
 */
const RANGED_CAPABILITY_PATTERN_START = "Start"
/**
 * Ranged capability property end pattern
 * 
 * @constant {String} RANGED_CAPABILITY_PATTERN_END
 */
const RANGED_CAPABILITY_PATTERN_END = "End"

/**
 * Minimum DMX channel value
 * 
 * @constant {Number} MIN_DMX_VALUE
 */
const MIN_DMX_VALUE = 0;
/**
 * Maximum DMX channel value
 * 
 * @constant {Number} MAX_DMX_VALUE
 */
const MAX_DMX_VALUE = 255;
/**
 * Default capability DMX value range 
 * 
 * @constant {Array} DEFAULT_CAPABILITY_RANGE
 */
const DEFAULT_CAPABILITY_RANGE = [
  MIN_DMX_VALUE,
  MAX_DMX_VALUE
];
/**
 * Shutter effect values enumeration
 * 
 * @constant {Object} SHUTTER_EFFECTS
 * @enum {String}
 */
const SHUTTER_EFFECTS = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  STROBE: 'Strobe',
  PULSE: 'Pulse',
  RAMP_UP: 'RampUp',
  RAMP_DOWN: 'RampDown',
  RAMP_UP_DOWN: 'RampUpDown',
  LIGHTNING: 'Lightning',
  SPIKES: 'Spikes'
}
/**
 * Default suhtter effect value
 * 
 * @constant {String} SHUTER_EFFECTS_DEFAULT
 */
const SHUTER_EFFECTS_DEFAULT = SHUTTER_EFFECTS.OPEN;
/**
 * Default strobe soundcontrol activation value
 * 
 * @constant {Boolean} SHUTTER_STROBE_SOUNDCONTROL_DEFAULT
 */
const SHUTTER_STROBE_SOUNDCONTROL_DEFAULT = false;
/**
 * Default strobe randomtimnig activation value
 * 
 * @constant {Boolean} SHUTTER_STROBE_SOUNDCONTROL_DEFAULT
 */
const SHUTTER_STROBE_RANDOMTIMING_DEFAULT = false;
/**
 * Default color value for color intensity
 * 
 * @constant {String} COLOR_INTENSITY_COLOR_DEFAULT
 */
const COLOR_INTENSITY_COLOR_DEFAULT = 'red';
/**
 * Default colorpreset value
 * 
 * @constant COLOR_PRESET_COLOR_DEFAULT
 */
const COLOR_PRESET_COLOR_DEFAULT = null;
/**
 * List of configurations of available capability types
 * 
 * @constant {Object} CAPABILITY_TYPES
 * @see https://github.com/OpenLightingProject/open-fixture-library/blob/master/docs/capability-types.md
 */
const CAPABILITY_TYPES = {
  ShutterStrobe: {
    shutterEffect: {
      alias: "strobeEffect",
      default: SHUTER_EFFECTS_DEFAULT
    },
    soundControlled: {
      alias: "shutterStrobeSoundControlled",
      default: SHUTTER_STROBE_SOUNDCONTROL_DEFAULT
    },
    speed: {
      alias: "strobeFrequency",
      entity: EntityManager.entities.Speed,
      unit: ENTITY_UNIT_HZ,
      min: 0,
      max: 10
    },
    duration: {
      alias: "strobeDuration",
      entity: EntityManager.entities.Time,
      unit: ENTITY_UNIT_MS,
      min: 0,
      max: 1000
    },
    randomTiming: {
      alias: "strobeRandom",
      default: SHUTTER_STROBE_RANDOMTIMING_DEFAULT
    }
  },
  StrobeSpeed: {
    speed: {
      alias: "strobeFrequency",
      entity: EntityManager.entities.Speed,
      unit: ENTITY_UNIT_HZ,
      min: 0,
      max: 10
    }
  },
  StrobeDuration: {
    speed: {
      alias: "strobeDuration",
      entity: EntityManager.entities.Time,
      unit: ENTITY_UNIT_MS,
      min: 0,
      max: 1000
    }
  },
  Intensity: {
    brightness: {
      alias: "intensity",
      entity: EntityManager.entities.Brightness,
      unit: ENTITY_UNIT_PERC,
      min: 0,
      max: 1
    }
  },
  ColorIntensity: {
    color: {
      alias: "color",
      default: COLOR_INTENSITY_COLOR_DEFAULT
    },
    brightness: {
      alias: "colorBrightness",
      entity: EntityManager.entities.Brightness,
      unit: ENTITY_UNIT_PERC,
      min: 0,
      max: 1
    }
  },
  ColorPreset: {
    colors: {
      alias: "color",
      default: COLOR_PRESET_COLOR_DEFAULT
    },
    colorTemperature: {
      alias: "colorTemperature",
      entity: EntityManager.entities.ColorTemperature,
      unit: ENTITY_UNIT_K,
      min: 0,
      max: 100
    }
  },
  ColorTeperature: {
    colorTemperature: {
      alias: "colorTemperature",
      entity: EntityManager.entities.ColorTemperature,
      unit: ENTITY_UNIT_K,
      min: 0,
      max: 100
    }
  },
  Pan: {
    angle: {
      alias: "pan",
      entity: EntityManager.entities.RotationAngle,
      unit: ENTITY_UNIT_DEG,
      min: 0,
      max: 360
    }
  },
  PanFine: {
    angle: {
      alias: "panFine",
      isFine: true,
      entity: EntityManager.entities.RotationAngle,
      unit: ENTITY_UNIT_DEG,
      min: 0,
      max: 360
    }
  },
  PanContinuous: {
    speed: {
      alias: "panContinuousSpeed",
      entity: EntityManager.entities.RotationSpeed,
      unit: ENTITY_UNIT_RPM,
      min: 0,
      max: 360
    }
  },
  Tilt: {
    angle: {
      alias: "tilt",
      entity: EntityManager.entities.RotationAngle,
      unit: ENTITY_UNIT_DEG,
      min: 0,
      max: 360
    }
  },
  TiltFine: {
    angle: {
      alias: "tiltFine",
      isFine: true,
      entity: EntityManager.entities.RotationAngle,
      unit: ENTITY_UNIT_DEG,
      min: 0,
      max: 360
    }
  },
  TiltContinuous: {
    speed: {
      alias: "tiltContinuousSpeed",
      entity: EntityManager.entities.RotationSpeed,
      unit: ENTITY_UNIT_RPM,
      min: 0,
      max: 360
    }
  },
  PanTiltSpeed: {
    speed: {
      alias: "panTiltSpeed",
      entity: EntityManager.entities.Speed,
      unit: ENTITY_UNIT_RPM,
      min: 0,
      max: 360
    },
    duration: {
      alias: "panTiltDuration",
      entity: EntityManager.entities.Time,
      unit: ENTITY_UNIT_MS,
      min: 0,
      max: 1000
    },
  },
  WheelSlot: {
    wheel: {
      alias: "wheel",
      default: ''
    },
    slotNumber: {
      alias: "slotNumber",
      entity: EntityManager.entities.SlotNumber,
      unit: ENTITY_UNIT_NONE,
      min: 0,
      max: 0
    }
  },
  WheelShake: {
    isShaking: {
      alias: "isShaking",
      default: "wheel"
    },
    wheel: {
      alias: "wheel",
      default: ''
    },
    slotNumber: {
      alias: "slotNumber",
      entity: EntityManager.entities.SlotNumber,
      unit: ENTITY_UNIT_NONE,
      min: 0,
      max: 0
    },
    shakeSpeed: {
      alias: "shakeSpeed",
      entity: EntityManager.entities.Speed,
      unit: ENTITY_UNIT_RPM,
      min: 0,
      max: 360
    },
    shakeAngle: {
      alias: "shakeAngle",
      entity: EntityManager.entities.SwingAngle,
      unit: ENTITY_UNIT_DEG,
      min: 0,
      max: 90
    }
  },
  WheelSlotRotation: {
    wheel: {
      alias: "wheel",
      default: ''
    },
    speed: {
      alias: "wheelRotationSpeed",
      entity: EntityManager.entities.Speed,
      unit: ENTITY_UNIT_RPM,
      min: 0,
      max: 360
    },
    shakeAngle: {
      alias: "wheelRotationAngle",
      entity: EntityManager.entities.SwingAngle,
      unit: ENTITY_UNIT_DEG,
      min: 0,
      max: 90
    }
  },
  Effect: {

  },
  BeamAngle: {
    angle: {
      alias: "angle",
      entity: EntityManager.entities.BeamAngle,
      unit: ENTITY_UNIT_DEG,
      min: 0,
      max: 90
    }
  },
  BeamPosition: {
    horizontalAngle: {
      alias: "pan",
      entity: EntityManager.entities.HorizontalAngle,
      unit: ENTITY_UNIT_DEG,
      min: 0,
      max: 90
    },
    verticalAngle: {
      alias: "tilt",
      entity: EntityManager.entities.VerticalAngle,
      unit: ENTITY_UNIT_DEG,
      min: 0,
      max: 90
    }
  },
  EffectSpeed: {
    speed: {
      alias: "effectSpeed",
      entity: EntityManager.entities.Speed,
      unit: ENTITY_UNIT_PERC,
      min: 0,
      max: 360
    },
  },
  EffectDuration: {
    speed: {
      alias: "effectDuration",
      entity: EntityManager.entities.Duration,
      unit: ENTITY_UNIT_MS,
      min: 0,
      max: 360
    },
  },
  EffectPrameter: {
    speed: {
      alias: "effectParameter",
      entity: EntityManager.entities.Parameter,
      unit: ENTITY_UNIT_NONE,
      min: 0,
      max: 100
    },
  },
  SoundSensitivity: {

  },
  Focus: {
    angle: {
      alias: "focus",
      entity: EntityManager.entities.Distance,
      unit: ENTITY_UNIT_PERC,
      min: 0,
      max: 100
    }
  },
  Zoom: {
    angle: {
      alias: "zoom",
      entity: EntityManager.entities.BeamAngle,
      unit: ENTITY_UNIT_DEG,
      min: 0,
      max: 100
    }
  }
}


/**
 * Capability class instance
 *
 * @class Capability
 * @classdesc Describes a DMX channel capability
 * @see https://github.com/OpenLightingProject/open-fixture-library/blob/master/docs/capability-types.md
 */
class Capability {

  /**
   * Creates an instance of Capability.
   * 
   * @param {Object} capabilityData capability configuration
   */
  constructor(capabilityData) {
    this.type = capabilityData.type;
    this.range = capabilityData.dmxRange || DEFAULT_CAPABILITY_RANGE;
    this.entities = {};
    this.parameters = {};
    this.isFine = false;
    this.init(capabilityData);
  }

  /**
   * Capability's minimum value
   *
   * @readonly
   * @type {Number}
   */
  get min() {
    return this.entities[Object.keys(this.entities)[0]].start;
  }

  /**
   * Capability's maximum value
   *
   * @readonly
   * @type {Number}
   */
  get max() {
    let entityKeys = Object.keys(this.entities);
    return this.entities[entityKeys[entityKeys.length - 1]].end;
  }

  /**
   * Initialises capability using provided configuration
   *
   * @public
   * @param {Object} capabilityData capability configuration object
   */
  init(capabilityData) {
    var capabilitySettings = CAPABILITY_TYPES[this.type];
    if (capabilitySettings) {
      Object.keys(capabilitySettings).forEach(feature => {
        let setting = capabilitySettings[feature];
        let alias = setting.alias || feature;
        this.isFine = setting.isFine || false;
        if (setting.entity) {
          let entityValue = capabilityData[feature];
          let entityValueStart = capabilityData[feature + RANGED_CAPABILITY_PATTERN_START];
          let entityValueStop = capabilityData[feature + RANGED_CAPABILITY_PATTERN_END];
          this.entities[alias] = this.entities[alias] || {};
          if (entityValue) {
            this.entities[alias].value = setting.entity.getValue(
              entityValue,
              setting.unit,
              setting.min,
              setting.max
            )
          }
          if (entityValueStart) {
            this.entities[alias].start = setting.entity.getValue(
              entityValueStart,
              setting.unit,
              setting.min,
              setting.max
            )
          }
          if (entityValueStop) {
            this.entities[alias].end = setting.entity.getValue(
              entityValueStop,
              setting.unit,
              setting.min,
              setting.max
            )
          }
          if (!entityValue && !entityValueStart && !entityValueStop) {
            this.entities[alias].start = setting.entity.getValue(
              setting.min + setting.unit,
              setting.unit,
              setting.min,
              setting.max
            )
            this.entities[alias].end = setting.entity.getValue(
              setting.max + setting.unit,
              setting.unit,
              setting.min,
              setting.max
            )
          }
        } else {
          this.parameters[alias] = capabilityData[feature] || setting.default;
        }
      })
    }
  }

  /**
   * Returns capability value from DMX channel value
   *
   * @public
   * @param {Number} DMXValue DMX channel value
   */
  getValue(DMXValue) {
    let value = {};
    Object.keys(this.entities).forEach(entityName => {
      value[entityName] = this.getEntityValue(
        this.entities[entityName],
        DMXValue,
        this.isFine
      )
    })
    Object.keys(this.parameters).forEach(parameterName => {
      value[parameterName] = this.parameters[parameterName];
    })
    return value
  }

  /**
   * Fetches entity value from provided DMX channel value
   *
   * @public
   * @param {Object} entity Entity
   * @param {Number} DMXValue DMX channel value
   * @param {Boolean} isFine WHether or not the DMX channel is a fine channel
   */
  getEntityValue(entity, DMXValue, isFine) {
    let perc = this.getPercentValue(DMXValue);
    return this.getValueInInterval(entity, perc, isFine);
  }

  /**
   * Creates percentage from value
   * 
   * @public
   * @param {Number} value DMX channel value
   * @return {Number} percent-converted value 
   */
  getPercentValue(value) {
    return (value - this.range[0]) / (this.range[1] - this.range[0]);
  }

  /**
   * Returns a percentage's value scaled on entity's [start,end] interval
   * 
   * @public
   * @param {Object} entity handle to entity instance
   * @param {Number} percent percentage to be scaled
   * @param {Boolean} isFine WHether or not the DMX channel is a fine channel
   * @returns {Number} percented value scaled in entity's value interval
   */
  getValueInInterval(entity, percent, isFine) {
    let fineDiv = isFine ? 255 : 1;
    let val = entity.value ? entity.value :
      ((entity.start / fineDiv) + ((entity.end / fineDiv) - (entity.start / fineDiv)) * percent);
    return val
  }

}

export default Capability;