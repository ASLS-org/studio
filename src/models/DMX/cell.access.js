/**
 * Colour and Pan/Tilt access per cell, shared by fixtures and scene fixture values. Works on a
 * fixture's channels (`attribute`, `kind`, `color`, `cell`, `isFine`, `fineIndexes`) and reads or
 * writes values through callbacks, so each caller keeps its own storage.
 *
 * `cells` is a list of cell names, or null for all cells. A selection whose cells have no colour
 * (or Pan/Tilt) channel of their own falls back to the whole fixture's.
 */

const RGB = ['Red', 'Green', 'Blue'];
const CMY = ['Cyan', 'Magenta', 'Yellow'];
const WHITE = 'White';
const MIXING_ATTRIBUTE = /^Color(Add|Sub|RGB)_/;
const MAX = 255;

/**
 * Whether a channel mixes colour (RGB, CMY or white), not a wheel or a macro
 *
 * @public
 * @param {Object} channel Fixture channel
 * @returns {Boolean} Whether it mixes colour
 */
export function isMixingChannel(channel) {
  return !channel.isFine && Boolean(channel.color) && MIXING_ATTRIBUTE.test(channel.attribute)
    && (RGB.includes(channel.color) || CMY.includes(channel.color) || channel.color === WHITE);
}

/**
 * Whether a channel is a coarse Pan or Tilt channel
 *
 * @public
 * @param {Object} channel Fixture channel
 * @param {String} axis `Pan` or `Tilt`
 * @returns {Boolean} Whether it is
 */
export function isAxisChannel(channel, axis) {
  return !channel.isFine && (channel.attribute === axis || channel.kind === axis);
}

/**
 * Indexes of the channels matching a test in the selected cells, or in the whole fixture when the
 * selected cells have none
 *
 * @param {Array<Object>} channels Fixture channels
 * @param {?Array<String>} cells Selected cells, null for all
 * @param {Function} test Channel test
 * @returns {Array<Number>} Channel indexes
 */
function targets(channels, cells, test) {
  const all = [];
  for (let i = 0; i < channels.length; i++) if (test(channels[i])) all.push(i);
  if (!cells) return all;
  const own = all.filter((i) => cells.includes(channels[i].cell));
  return own.length ? own : all.filter((i) => !channels[i].cell);
}

/**
 * Target channel indexes grouped by cell (whole-fixture channels together), in channel order
 *
 * @param {Array<Object>} channels Fixture channels
 * @param {Array<Number>} indexes Channel indexes
 * @returns {Array<Array<Number>>} Groups
 */
function byCell(channels, indexes) {
  const groups = new Map();
  indexes.forEach((i) => {
    const key = channels[i].cell || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  });
  return [...groups.values()];
}

/**
 * Reads the colour of the first selected cell (RGB 0-255): CMY inverted, white added to red,
 * green and blue
 *
 * @public
 * @param {Array<Object>} channels Fixture channels
 * @param {?Array<String>} cells Selected cells, null for all
 * @param {Function} read `(index) => value` DMX value of a channel
 * @returns {Array<Number>} RGB
 */
export function readColor(channels, cells, read) {
  const rgb = [0, 0, 0];
  const [group] = byCell(channels, targets(channels, cells, isMixingChannel));
  if (!group) return rgb;
  let white = 0;
  group.forEach((i) => {
    const { color } = channels[i];
    if (RGB.includes(color)) rgb[RGB.indexOf(color)] = read(i);
    else if (CMY.includes(color)) rgb[CMY.indexOf(color)] = MAX - read(i);
    else if (color === WHITE) white = read(i);
  });
  return rgb.map((v) => Math.min(v + white, MAX));
}

/**
 * Writes a colour (RGB 0-255) to the selected cells: CMY inverted; on a cell with a white channel,
 * white takes the smallest of red, green and blue and they keep the rest
 *
 * @public
 * @param {Array<Object>} channels Fixture channels
 * @param {Array<Number>} rgb Colour
 * @param {?Array<String>} cells Selected cells, null for all
 * @param {Function} write `(index, value)` writes a channel's DMX value
 */
export function writeColor(channels, rgb, cells, write) {
  byCell(channels, targets(channels, cells, isMixingChannel)).forEach((group) => {
    const hasWhite = group.some((i) => channels[i].color === WHITE);
    const hasRgb = group.some((i) => RGB.includes(channels[i].color));
    const white = hasWhite && hasRgb ? Math.min(rgb[0], rgb[1], rgb[2]) : 0;
    group.forEach((i) => {
      const { color } = channels[i];
      if (RGB.includes(color)) write(i, rgb[RGB.indexOf(color)] - white);
      else if (CMY.includes(color)) write(i, MAX - rgb[CMY.indexOf(color)]);
      else if (color === WHITE) write(i, hasRgb ? white : Math.min(rgb[0], rgb[1], rgb[2]));
    });
  });
}

/**
 * Reads Pan and Tilt (coarse and fine, 0-255) of the first selected cell that has them
 *
 * @public
 * @param {Array<Object>} channels Fixture channels
 * @param {?Array<String>} cells Selected cells, null for all
 * @param {Function} read `(index) => value` DMX value of a channel
 * @returns {{pan: Number, panFine: Number, tilt: Number, tiltFine: Number}} Pan/Tilt
 */
export function readPanTilt(channels, cells, read) {
  const result = {
    pan: 0, panFine: 0, tilt: 0, tiltFine: 0,
  };
  [['Pan', 'pan'], ['Tilt', 'tilt']].forEach(([axis, key]) => {
    const [first] = targets(channels, cells, (c) => isAxisChannel(c, axis));
    if (first === undefined) return;
    result[key] = read(first);
    const fine = channels[first].fineIndexes || [];
    if (fine.length) result[`${key}Fine`] = read(fine[0]);
  });
  return result;
}

/**
 * Writes Pan and Tilt (coarse and fine, 0-255) to the selected cells, coarse channels before
 * their fine channels
 *
 * @public
 * @param {Array<Object>} channels Fixture channels
 * @param {{pan: Number, panFine: Number, tilt: Number, tiltFine: Number}} value Pan/Tilt
 * @param {?Array<String>} cells Selected cells, null for all
 * @param {Function} write `(index, value)` writes a channel's DMX value
 */
export function writePanTilt(channels, value, cells, write) {
  [['Pan', 'pan'], ['Tilt', 'tilt']].forEach(([axis, key]) => {
    targets(channels, cells, (c) => isAxisChannel(c, axis)).forEach((i) => {
      write(i, value[key] || 0);
      (channels[i].fineIndexes || []).forEach((f) => write(f, value[`${key}Fine`] || 0));
    });
  });
}

/**
 * Whether the selected cells (or the whole fixture) have colour mixing channels
 *
 * @public
 * @param {Array<Object>} channels Fixture channels
 * @param {?Array<String>} [cells=null] Selected cells, null for all
 * @returns {Boolean} Whether they have
 */
export function hasMixing(channels, cells = null) {
  return targets(channels, cells, isMixingChannel).length > 0;
}

/**
 * Whether the selected cells (or the whole fixture) have Pan and Tilt channels
 *
 * @public
 * @param {Array<Object>} channels Fixture channels
 * @param {?Array<String>} [cells=null] Selected cells, null for all
 * @returns {Boolean} Whether they have
 */
export function hasPanTilt(channels, cells = null) {
  return targets(channels, cells, (c) => isAxisChannel(c, 'Pan')).length > 0
    && targets(channels, cells, (c) => isAxisChannel(c, 'Tilt')).length > 0;
}
