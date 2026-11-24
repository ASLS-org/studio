/**
 * Channel presets: a channel's DMX ranges (profile capabilities) as list rows.
 *
 * Capability arrays are shared, frozen profile data, so everything derived from one is cached per
 * array: the channels widget re-renders with the live ticker and reads these on every render.
 */

/** List rows by capability array */
const itemsCache = new WeakMap();

/** Comparison keys (spans and labels) by capability array */
const keyCache = new WeakMap();

/**
 * List rows of a channel's ranges, in DMX order: the label, then the DMX span on the right
 *
 * @public
 * @param {?Array<Object>} capabilities Channel capabilities (`range`, `label`)
 * @returns {Array<Object>} `uk-list` items (`id` = range index, `name`, `more`)
 */
export function presetItems(capabilities) {
  if (!capabilities) return [];
  if (!itemsCache.has(capabilities)) {
    itemsCache.set(capabilities, capabilities.map((capability, index) => {
      const [start, end] = capability.range;
      const span = start === end ? `${start}` : `${start}–${end}`;
      return { id: index, name: capability.label, more: span };
    }));
  }
  return itemsCache.get(capabilities);
}

/**
 * Index of the range holding a DMX value, -1 when none does
 *
 * @public
 * @param {Array<Object>} capabilities Channel capabilities (`range`)
 * @param {Number} value DMX value 0-255
 * @returns {Number} Range index
 */
export function rangeIndex(capabilities, value) {
  if (!capabilities) return -1;
  const dmx = Math.round(Number(value) || 0);
  for (let i = 0; i < capabilities.length; i++) {
    const [start, end] = capabilities[i].range;
    if (dmx >= start && dmx <= end) return i;
  }
  return -1;
}

/**
 * Label of the range holding a DMX value, or an empty string
 *
 * @public
 * @param {Array<Object>} capabilities Channel capabilities (`range`, `label`)
 * @param {Number} value DMX value 0-255
 * @returns {String} Label
 */
export function rangeLabel(capabilities, value) {
  const index = rangeIndex(capabilities, value);
  return index > -1 ? capabilities[index].label : '';
}

/**
 * Comparison key of a capability array (spans and labels)
 *
 * @param {Array<Object>} capabilities Channel capabilities
 * @returns {String} Key
 */
function rangesKey(capabilities) {
  if (!keyCache.has(capabilities)) {
    keyCache.set(capabilities, capabilities
      .map((capability) => `${capability.range[0]}-${capability.range[1]}:${capability.label}`)
      .join('|'));
  }
  return keyCache.get(capabilities);
}

/**
 * Whether two channels have the same ranges and labels
 *
 * @public
 * @param {?Array<Object>} a Capabilities of one channel
 * @param {?Array<Object>} b Capabilities of the other
 * @returns {Boolean} Whether they match
 */
export function sameRanges(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return rangesKey(a) === rangesKey(b);
}
