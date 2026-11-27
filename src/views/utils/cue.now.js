/**
 * NOW: where each family comes from in a group, and its value on the group's fixtures. The cue
 * holding it (the cue and its chase for a chase item), "kept:" the cue whose value Colour,
 * Position or Beam keep with nobody holding them, or "rest". It only shows. Read through the live
 * ticker (holders and values change outside Vue).
 *
 * @module cue.now
 */
import { FAMILIES } from '@/models/DMX/families';
import { readColor, readPanTilt } from '@/models/DMX/cell.access';

/**
 * Highest DMX value
 *
 * @constant {Number} MAX_DMX
 */
const MAX_DMX = 255;

/**
 * Average of numbers
 *
 * @param {Array<Number>} values
 * @returns {Number}
 */
const average = (values) => values.reduce((a, b) => a + b, 0) / values.length;

/**
 * The fixtures of a group
 *
 * @param {Object} group
 * @returns {Array<Object>}
 */
const fixturesOf = (group) => (group && group.fixturePool ? group.fixturePool.fixtures : []);

/**
 * How NOW names a token holding a family: the cue, or the cue and its chase
 *
 * @public
 * @param {Object} token claim token (claims.js)
 * @returns {String}
 */
export function holderName(token) {
  const { cue } = token;
  if (token === cue.itemClaim && cue.itemChase) return `${cue.name} · ${cue.itemChase.name}`;
  return cue.name;
}

/**
 * What the stage shows of a family on a group's fixtures: the average level, colour, aim or zoom
 *
 * @public
 * @param {Object} group
 * @param {Number} family family index
 * @returns {?Object} `{ kind: 'swatch'|'dot'|'level', style }`, null when no fixture has it
 */
export function familyValue(group, family) {
  const fixtures = fixturesOf(group).filter((fixture) => fixture.slots && fixture.slots[family]);
  if (!fixtures.length) return null;
  const read = (fixture) => (index) => fixture.channels[index].value.DMX;
  if (family === FAMILIES.COLOUR) {
    const colours = fixtures.map((fixture) => readColor(fixture.channels, null, read(fixture)));
    const rgb = [0, 1, 2].map((i) => Math.round(average(colours.map((c) => c[i]))));
    return { kind: 'swatch', style: { background: `rgb(${rgb.join(',')})` } };
  }
  if (family === FAMILIES.POSITION) {
    const aims = fixtures.map((fixture) => readPanTilt(fixture.channels, null, read(fixture)));
    const x = average(aims.map((a) => a.pan)) / MAX_DMX;
    const y = average(aims.map((a) => a.tilt)) / MAX_DMX;
    return { kind: 'dot', style: { left: `${x * 100}%`, bottom: `${y * 100}%` } };
  }
  // Intensity: the dimmer when there is one; Beam: its zoom, else its first channel
  const levels = fixtures.map((fixture) => {
    const { channels } = fixture.slots[family];
    const main = channels.find((c) => /^Dimmer|^Intensity|Zoom/.test(c.attribute || ''))
      || channels[0];
    return main.value.DMX;
  });
  return {
    kind: 'level',
    style: { height: `${Math.round((average(levels) / MAX_DMX) * 100)}%` },
  };
}

/**
 * NOW of a family in a group
 *
 * @public
 * @param {Object} group
 * @param {Number} family family index
 * @returns {Object} `{ text, state: 'held'|'kept'|'rest', holder, kept, value }`: `holder` is the
 * token holding it, `kept` the (raw) cue whose values the stage keeps
 */
export function familyNow(group, family) {
  const stack = group && group.familyStacks ? group.familyStacks[family] : null;
  const holder = stack && stack.length ? stack[0] : null;
  const value = familyValue(group, family);
  if (holder) {
    return {
      text: holderName(holder), state: 'held', holder, value,
    };
  }
  const kept = fixturesOf(group)
    .map((fixture) => fixture.slots && fixture.slots[family])
    .find((slot) => slot && !slot.top && !slot.rested && slot.keptFrom);
  if (kept) {
    return {
      text: `kept: ${kept.keptFrom.name}`, state: 'kept', holder: null, kept: kept.keptFrom, value,
    };
  }
  return {
    text: 'rest', state: 'rest', holder: null, value,
  };
}
