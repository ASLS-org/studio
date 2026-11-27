/**
 * How cue families look in the UI: name, icon, hint and accent per family key (see
 * models/DMX/families.js)
 *
 * @module cue.families
 */
import { FAMILY_KEYS } from '@/models/DMX/families';

/**
 * Name, icon, hint and accent token (the chase timeline's colour for its items) of each family key
 *
 * @constant {Object} FAMILY_LOOKS
 */
export const FAMILY_LOOKS = {
  intensity: {
    label: 'Intensity',
    icon: 'dimmer',
    title: 'Dimmer, shutter and strobe',
    token: '--accent-gold',
  },
  colour: {
    label: 'Colour',
    icon: 'colorwheel',
    title: 'Colour mixing, colour wheels and colour temperature',
    token: '--accent-pink',
  },
  position: {
    label: 'Position',
    icon: 'move',
    title: 'Pan and tilt',
    token: '--accent-blue',
  },
  beam: {
    label: 'Beam',
    icon: 'zoom',
    title: 'Zoom, focus, gobos, prisms, iris and frost',
    token: '--accent-green',
  },
};

/**
 * The family options of a select, in family order
 *
 * @constant {Array<Object>} FAMILY_OPTIONS
 */
export const FAMILY_OPTIONS = FAMILY_KEYS.map((key) => ({ key, ...FAMILY_LOOKS[key] }));
