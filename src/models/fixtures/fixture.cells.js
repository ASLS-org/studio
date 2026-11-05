/**
 * A fixture's cells: the parts of a fixture that repeat a set of channels (GDTF heads, pixels or
 * arrays, OFL pixels). Channels outside every cell (master dimmer, strobe, pan on the base, OFL
 * pixel groups) belong to the whole fixture.
 *
 * Must stay free of Vue, Three.js and `import.meta` (see fixture.profile.js).
 */

/**
 * @typedef {Object} FixtureCell
 * @property {String} name Cell name (its geometry or pixel key)
 * @property {Array<Number>} channels Indexes (within the mode) of the cell's channels
 */

/**
 * @typedef {Object} ModeCells
 * @property {Array<FixtureCell>} cells Cells, in channel order
 * @property {Array<?String>} cellOf Cell name of each channel, null for the whole fixture
 * @property {Array<String>} kinds Kind of each channel: its type without the cell's name, the same
 * in every cell (OFL pixel channels are typed with their pixel key)
 */

const cache = new WeakMap();

/**
 * Kind of a channel: its type, without its geometry's name, marked fine for fine channels (some
 * OFL files type a fine channel like its coarse one)
 *
 * @public
 * @param {Object} channel Profile channel
 * @returns {String} Kind
 */
export function channelKind(channel) {
  const kind = channel.geometry
    ? channel.type.replace(channel.geometry, '').replace(/\s+/g, ' ').trim() || channel.type
    : channel.type;
  return channel.isFine && !/fine$/i.test(kind) ? `${kind}Fine` : kind;
}

/**
 * Builds the cells of a profile mode, cached per mode. A geometry is a cell when one of its
 * channel kinds is also driven by a geometry that is neither its ancestor nor its descendant; a
 * cell inside another cell belongs to it (a head's tilt with its yoke's pan).
 *
 * @public
 * @param {Object} mode Profile mode (`channels`, optional `geometry` tree)
 * @param {?Object} [matrix] Profile pixel layout (OFL): its `groups` are whole-fixture channels
 * @returns {ModeCells} Cells
 */
export default function modeCells(mode, matrix = null) {
  if (cache.has(mode)) return cache.get(mode);
  const groups = (matrix && matrix.groups) || {};
  const parent = new Map();
  const walk = (node, parentName) => {
    parent.set(node.name, parentName);
    node.children.forEach((c) => walk(c, node.name));
  };
  if (mode.geometry) walk(mode.geometry, null);
  const ancestors = (name) => {
    const out = [];
    for (let p = parent.get(name); p; p = parent.get(p)) out.push(p);
    return out;
  };
  const related = (a, b) => a === b || ancestors(a).includes(b) || ancestors(b).includes(a);

  const kinds = mode.channels.map(channelKind);
  const geometriesByKind = new Map();
  mode.channels.forEach((channel, i) => {
    if (!channel.geometry || channel.isFine || groups[channel.geometry]) return;
    if (!geometriesByKind.has(kinds[i])) geometriesByKind.set(kinds[i], new Set());
    geometriesByKind.get(kinds[i]).add(channel.geometry);
  });
  const candidates = new Set();
  geometriesByKind.forEach((set) => {
    const list = [...set];
    list.forEach((a) => {
      if (list.some((b) => !related(a, b))) candidates.add(a);
    });
  });
  const tops = new Set([...candidates].filter((g) => !ancestors(g).some((a) => candidates.has(a))));
  const cellNameOf = (geometry) => {
    if (!geometry || groups[geometry]) return null;
    if (tops.has(geometry)) return geometry;
    return ancestors(geometry).find((a) => tops.has(a)) || null;
  };

  const cellOf = mode.channels.map((channel) => cellNameOf(channel.geometry));
  const cells = [];
  const byName = new Map();
  cellOf.forEach((name, i) => {
    if (!name) return;
    if (!byName.has(name)) {
      byName.set(name, { name, channels: [] });
      cells.push(byName.get(name));
    }
    byName.get(name).channels.push(i);
  });
  const result = { cells, cellOf, kinds };
  cache.set(mode, result);
  return result;
}
