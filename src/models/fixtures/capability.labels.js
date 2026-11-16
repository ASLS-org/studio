/**
 * Short labels for channel ranges (capabilities), shared by every source adapter.
 *
 * A range keeps the text its source gives it (OFL `comment`, GDTF channel set or function name).
 * Otherwise its label is built from its OFL-shaped data: type, effect, wheel slot, colour or the
 * first start/end pair of its parameters. Labels are runtime only, never saved. Must stay free of
 * Vue, Three.js and `import.meta` (see fixture.profile.js).
 */

/**
 * Words used for capability types, when the type split on capitals doesn't read well
 *
 * @constant {Object} TYPE_WORDS
 */
const TYPE_WORDS = {
  NoFunction: 'No function',
  ShutterStrobe: 'Shutter',
  StrobeSpeed: 'Strobe speed',
  StrobeDuration: 'Strobe duration',
  Intensity: 'Intensity',
  ColorIntensity: 'Color',
  ColorPreset: 'Color preset',
  ColorTemperature: 'Color temperature',
  PanContinuous: 'Pan rotation',
  TiltContinuous: 'Tilt rotation',
  PanTiltSpeed: 'Pan/Tilt speed',
  WheelSlotRotation: 'Slot rotation',
  WheelShake: 'Shake',
  WheelRotation: 'Wheel rotation',
  EffectSpeed: 'Effect speed',
  EffectDuration: 'Effect duration',
  EffectParameter: 'Effect parameter',
  SoundSensitivity: 'Sound sensitivity',
  BeamAngle: 'Beam angle',
  BeamPosition: 'Beam position',
  BladeInsertion: 'Blade',
  BladeRotation: 'Blade rotation',
  BladeSystemRotation: 'Blade system rotation',
  IrisEffect: 'Iris effect',
  FrostEffect: 'Frost effect',
  PrismRotation: 'Prism rotation',
  FogOutput: 'Fog output',
  FogType: 'Fog type',
  Generic: 'Generic',
};

/**
 * Parameter names read for a range's value, in order (OFL capability properties, each also with
 * `Start` / `End` variants)
 *
 * @constant {Array<String>} VALUE_PARAMETERS
 */
const VALUE_PARAMETERS = [
  'speed', 'shakeSpeed', 'duration', 'time', 'angle', 'horizontalAngle', 'verticalAngle',
  'distance', 'brightness', 'colorTemperature', 'frostIntensity', 'openPercent', 'insertion',
  'parameter', 'soundSensitivity', 'fogOutput', 'slotNumber',
];

/**
 * Splits a camel-case type into words (`EffectSpeed` → `Effect speed`)
 *
 * @param {String} type Capability type
 * @returns {String} Words
 */
function typeWords(type) {
  if (TYPE_WORDS[type]) return TYPE_WORDS[type];
  const words = String(type || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Name of one wheel slot: its own name, else its type and number (`Gobo 3`), `Open` alone
 *
 * @param {?Object} slot OFL wheel slot
 * @param {Number} number Slot number, from 1
 * @returns {String} Slot name, or an empty string
 */
function nameOfSlot(slot, number) {
  if (!slot) return '';
  if (slot.name) return slot.name;
  if (!slot.type || slot.type === 'Open' || slot.type === 'Closed') return slot.type || '';
  return `${typeWords(slot.type)} ${number}`;
}

/**
 * The value text of a range's first parameter: `value`, or `start → end`
 *
 * @param {Object} data OFL-shaped capability data
 * @returns {String} Value text, or an empty string
 */
function valueText(data) {
  for (let i = 0; i < VALUE_PARAMETERS.length; i++) {
    const name = VALUE_PARAMETERS[i];
    const start = data[`${name}Start`];
    const end = data[`${name}End`];
    if (start !== undefined && end !== undefined) {
      return String(start) === String(end) ? String(start) : `${start} → ${end}`;
    }
    if (data[name] !== undefined) return String(data[name]);
  }
  return '';
}

/**
 * Name of the wheel slot a range points at, from the profile's wheels (OFL shape)
 *
 * @param {Object} data OFL-shaped capability data
 * @param {Object} wheels Wheels of the profile, keyed by wheel name
 * @param {String} channelName Name of the channel, the wheel's name when the range names none
 * @returns {String} Slot name, or an empty string
 */
function slotName(data, wheels, channelName) {
  const wheel = wheels && (wheels[data.wheel] || wheels[channelName]);
  const number = Number(data.slotNumber ?? data.slotNumberStart);
  if (!wheel || !wheel.slots || !Number.isFinite(number)) return '';
  const first = Math.floor(number);
  const name = nameOfSlot(wheel.slots[first - 1], first);
  if (data.slotNumberStart !== undefined && data.slotNumberEnd !== undefined
    && data.slotNumberStart !== data.slotNumberEnd) {
    const end = Math.ceil(Number(data.slotNumberEnd));
    const lastName = nameOfSlot(wheel.slots[end - 1], end);
    return name && lastName ? `${name} → ${lastName}` : '';
  }
  return name;
}

/**
 * Builds the label of a range from its OFL-shaped data
 *
 * @param {Object} data OFL-shaped capability data (`type`, `comment`, parameters)
 * @param {Object} [wheels={}] Wheels of the profile, keyed by wheel name (OFL shape)
 * @param {String} [channelName=''] Name of the channel holding the range
 * @public
 * @returns {String} Label, never empty
 */
export default function capabilityLabel(data, wheels = {}, channelName = '') {
  const comment = typeof data.comment === 'string' ? data.comment.trim() : '';
  if (comment) return comment;
  const value = valueText(data);
  switch (data.type) {
    case 'Effect':
    case 'IrisEffect':
    case 'FrostEffect':
      return [data.effectName || typeWords(data.effectPreset || data.type), value]
        .filter(Boolean).join(' ');
    case 'ShutterStrobe':
      return [typeWords(data.shutterEffect || 'Shutter'), data.randomTiming ? 'random' : '', value]
        .filter(Boolean).join(' ');
    case 'ColorIntensity':
      return data.color || 'Color';
    case 'WheelSlot': {
      const name = slotName(data, wheels, channelName);
      if (name) return name;
      break;
    }
    case 'WheelShake': {
      const name = slotName(data, wheels, channelName);
      if (name) return [name, 'shake', value].filter(Boolean).join(' ');
      break;
    }
    case 'NoFunction':
      return 'No function';
    default:
  }
  if (data.type === 'WheelSlot' && value) return `Slot ${value}`;
  return [typeWords(data.type), value].filter(Boolean).join(' ') || 'Range';
}
