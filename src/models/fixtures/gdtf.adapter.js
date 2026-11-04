import Capability from '../DMX/capabilityManager.model';
import { PROFILE_SOURCES, buildCapabilityLookup } from './fixture.profile';
import { FINE_CHANNEL_TERMINOLOGY, deriveTypeKey } from './channel.types';
import { GDTFError } from './gdtf.archive';

/**
 * GDTF (`description.xml`) to fixture profile adapter, for GDTF 1.0, 1.1 and 1.2.
 *
 * Channel functions become OFL-shaped capabilities, so the engine, scenes and the visualizer
 * decode GDTF fixtures exactly like OFL ones. Channels on geometries reached through geometry
 * references are repeated once per reference. Virtual channels (no DMX offset), DMX breaks other
 * than the first, mode masters and relations are ignored.
 *
 * Must stay free of Vue, Three.js and `import.meta` (see fixture.profile.js).
 */

/**
 * Type key of DMX addresses no channel uses
 *
 * @constant {String} UNSET_CHANNEL_TYPE
 */
const UNSET_CHANNEL_TYPE = 'Unset';

/**
 * Channel name per GDTF attribute, matching OFL channel naming so `type` keys match
 *
 * @constant {Object} CHANNEL_NAMES
 */
const CHANNEL_NAMES = {
  Dimmer: 'Dimmer',
  Pan: 'Pan',
  Tilt: 'Tilt',
  PanRotate: 'Pan Continuous',
  TiltRotate: 'Tilt Continuous',
  PositionMSpeed: 'Pan/Tilt Speed',
  Shutter1: 'Shutter',
  Shutter2: 'Shutter 2',
  StrobeFrequency: 'Strobe',
  StrobeRate: 'Strobe',
  Color1: 'Color Wheel',
  Color2: 'Color Wheel 2',
  Color3: 'Color Wheel 3',
  Gobo1: 'Gobo Wheel',
  Gobo2: 'Gobo Wheel 2',
  Gobo3: 'Gobo Wheel 3',
  Gobo1Pos: 'Gobo Wheel Rotation',
  Gobo2Pos: 'Gobo Wheel 2 Rotation',
  Prism1: 'Prism',
  Prism1Pos: 'Prism Rotation',
  Prism1PosRotate: 'Prism Rotation',
  Zoom: 'Zoom',
  Focus1: 'Focus',
  Frost1: 'Frost',
  Iris: 'Iris',
  CTO: 'Color Temperature',
  CTC: 'Color Temperature',
  CTB: 'Color Temperature',
  ColorMacro1: 'Color Macro',
  Effects1: 'Effect',
  Control1: 'Control',
};

/**
 * Emitted colour (OFL colour name) of colour mixing attributes
 *
 * @constant {Object} MIXING_COLORS
 */
const MIXING_COLORS = {
  ColorAdd_R: 'Red',
  ColorAdd_G: 'Green',
  ColorAdd_B: 'Blue',
  ColorAdd_W: 'White',
  ColorAdd_WW: 'Warm White',
  ColorAdd_CW: 'Cold White',
  ColorAdd_A: 'Amber',
  ColorAdd_UV: 'UV',
  ColorAdd_L: 'Lime',
  ColorAdd_C: 'Cyan',
  ColorAdd_M: 'Magenta',
  ColorAdd_Y: 'Yellow',
  ColorAdd_RY: 'Amber',
  ColorAdd_I: 'Indigo',
  ColorRGB_Red: 'Red',
  ColorRGB_Green: 'Green',
  ColorRGB_Blue: 'Blue',
  ColorRGB_Cyan: 'Cyan',
  ColorRGB_Magenta: 'Magenta',
  ColorRGB_Yellow: 'Yellow',
  ColorRGB_Quality: 'White',
  ColorSub_C: 'Cyan',
  ColorSub_M: 'Magenta',
  ColorSub_Y: 'Yellow',
};

/**
 * Geometry elements that place a node, by kind (others are skipped with their children)
 *
 * @constant {Object} GEOMETRY_KINDS
 */
const GEOMETRY_KINDS = {
  Geometry: 'body',
  Axis: 'axis',
  Beam: 'beam',
  FilterBeam: 'body',
  FilterColor: 'body',
  FilterGobo: 'body',
  FilterShaper: 'body',
  MediaServerLayer: 'body',
  MediaServerCamera: 'body',
  MediaServerMaster: 'body',
  Display: 'body',
  Laser: 'body',
  Structure: 'body',
  Support: 'body',
  Magnet: 'body',
};

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/* ---------------------------------------------------------------- XML helpers */

const child = (element, tag) => element && element.children.find((c) => c.tag === tag);
const childrenOf = (element, tag) => (element ? element.children.filter((c) => c.tag === tag) : []);
const float = (value, fallback = 0) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Parses a GDTF DMX value: `N/bytes` (1.1, 1.2) or a plain number (1.0, coarse byte)
 *
 * @param {String} value DMX value
 * @param {Number} bytes Channel resolution in bytes
 * @returns {Number} Value in the channel's resolution
 */
function dmxValue(value, bytes) {
  if (value === undefined || value === '') return 0;
  const [raw, resolution] = String(value).split('/');
  const n = parseInt(raw, 10) || 0;
  const from = resolution ? parseInt(resolution, 10) : 1;
  if (from === bytes) return n;
  // Scale between resolutions, keeping the top byte aligned (GDTF byte mirroring)
  return from < bytes ? n * 256 ** (bytes - from) : Math.floor(n / 256 ** (from - bytes));
}

/**
 * Parses a GDTF matrix `{a,b,c,d}{e,f,g,h}{i,j,k,l}{m,n,o,p}`
 *
 * @param {?String} value Matrix
 * @returns {Array<Number>} Row-major 4×4 matrix
 */
function matrix(value) {
  if (!value) return IDENTITY.slice();
  const numbers = value.match(/-?\d*\.?\d+(e[-+]?\d+)?/gi);
  if (!numbers || numbers.length < 12) return IDENTITY.slice();
  const m = numbers.slice(0, 16).map(Number);
  while (m.length < 16) m.push(IDENTITY[m.length]);
  return m;
}

/**
 * CIE xyY (`x,y,Y`) to an sRGB hex colour
 *
 * @param {?String} value Colour
 * @returns {?String} `#rrggbb`, or null
 */
function hexColor(value) {
  if (!value) return null;
  const [x, y] = value.split(',').map(Number);
  if (!(y > 0)) return null;
  const X = x / y;
  const Z = (1 - x - y) / y;
  const lin = [
    3.2406 * X - 1.5372 - 0.4986 * Z,
    -0.9689 * X + 1.8758 + 0.0415 * Z,
    0.0557 * X - 0.204 + 1.057 * Z,
  ].map((c) => Math.max(c, 0));
  const peak = Math.max(...lin, 1e-6);
  return `#${lin.map((c) => {
    const v = c / peak;
    const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(Math.max(s, 0), 1) * 255).toString(16).padStart(2, '0');
  }).join('')}`;
}

/* ---------------------------------------------------------------- Wheels */

/**
 * Builds the wheels in the OFL shape (slots with `type`, `name`, `colors`, plus `image`)
 *
 * @param {Object} fixtureType FixtureType element
 * @returns {Object} Wheels by name
 */
function buildWheels(fixtureType) {
  const wheels = {};
  childrenOf(child(fixtureType, 'Wheels'), 'Wheel').forEach((wheel) => {
    wheels[wheel.attrs.Name] = {
      slots: childrenOf(wheel, 'Slot').map((slot) => {
        const name = slot.attrs.Name || '';
        const color = hexColor(slot.attrs.Color);
        let type = 'Color';
        if (childrenOf(slot, 'Facet').length) type = 'Prism';
        else if (slot.attrs.MediaFileName) type = 'Gobo';
        else if (/^open/i.test(name)) type = 'Open';
        else if (/^closed?$/i.test(name)) type = 'Closed';
        return {
          type,
          name,
          colors: color ? [color] : [],
          image: slot.attrs.MediaFileName || null,
        };
      }),
    };
  });
  return wheels;
}

/* ---------------------------------------------------------------- Geometry */

/**
 * Builds the geometry tree under an element, expanding geometry references
 *
 * @param {Object} element Geometry element
 * @param {Object} context Models, top-level geometries and the reference list being collected
 * @param {String} [prefix] Name prefix inside a referenced geometry
 * @param {?Object} [reference] Geometry reference that instantiated this element
 * @returns {?Object} Geometry node, or null when the element places nothing
 */
function buildNode(element, context, prefix = '', reference = null) {
  if (element.tag === 'GeometryReference') {
    const template = context.geometries.get(element.attrs.Geometry);
    if (!template) return null;
    const instance = {
      name: element.attrs.Name,
      template: template.attrs.Name,
      breaks: childrenOf(element, 'Break').map((b) => ({
        dmxBreak: parseInt(b.attrs.DMXBreak, 10) || 1,
        offset: parseInt(b.attrs.DMXOffset, 10) || 1,
      })),
    };
    context.references.push(instance);
    const node = buildNode(template, context, `${instance.name}.`, instance);
    if (!node) return null;
    node.name = instance.name;
    node.matrix = matrix(element.attrs.Position);
    return node;
  }
  const kind = GEOMETRY_KINDS[element.tag];
  if (!kind) return null;
  const model = context.models.get(element.attrs.Model);
  const isTemplateRoot = reference && prefix === `${reference.name}.` && element.attrs.Name === reference.template;
  const name = isTemplateRoot ? reference.name : `${prefix}${element.attrs.Name}`;
  if (reference) {
    context.instanceNames.set(`${reference.name}|${element.attrs.Name}`, name);
  }
  const node = {
    name,
    kind,
    matrix: matrix(element.attrs.Position),
    size: model ? [model.length, model.width, model.height] : [0, 0, 0],
    shape: model ? model.primitive : null,
    beam: null,
    children: [],
  };
  if (kind === 'beam') {
    const field = float(element.attrs.FieldAngle, float(element.attrs.BeamAngle, 25));
    node.beam = {
      beamAngle: float(element.attrs.BeamAngle, field),
      fieldAngle: field,
      radius: float(element.attrs.BeamRadius, 0.05),
      type: element.attrs.BeamType || 'Wash',
      flux: float(element.attrs.LuminousFlux, 10000),
      colorTemperature: float(element.attrs.ColorTemperature, 6000),
    };
  }
  element.children.forEach((c) => {
    const sub = buildNode(c, context, prefix, reference);
    if (sub) node.children.push(sub);
  });
  return node;
}

/**
 * Finds a mode's root geometry: a top-level geometry by name, a nested one (GDTF 1.0 files
 * sometimes name one), or the first top-level geometry when the mode names none
 *
 * @param {Map<String, Object>} geometries Top-level geometry elements by name
 * @param {?String} name Geometry name
 * @returns {?Object} Geometry element
 */
function findGeometry(geometries, name) {
  if (name && geometries.has(name)) return geometries.get(name);
  const find = (element) => {
    if (element.attrs.Name === name) return element;
    for (let i = 0; i < element.children.length; i++) {
      const found = find(element.children[i]);
      if (found) return found;
    }
    return null;
  };
  if (name) {
    const all = [...geometries.values()];
    for (let i = 0; i < all.length; i++) {
      const found = find(all[i]);
      if (found) return found;
    }
  }
  return geometries.values().next().value || null;
}

/**
 * Visits every node of a tree
 *
 * @param {Object} node Root node
 * @param {Function} fn Called with each node and its depth
 * @param {Number} [depth=0] Depth of `node`
 */
function walk(node, fn, depth = 0) {
  fn(node, depth);
  node.children.forEach((c) => walk(c, fn, depth + 1));
}

/* ---------------------------------------------------------------- Capabilities */

const deg = (v) => `${+v.toFixed(4)}deg`;
const percent = (v) => `${+(v * 100).toFixed(4)}%`;

/**
 * OFL-shaped capability data of one channel function (or one channel set of a wheel function)
 *
 * @param {Object} fn Channel function element
 * @param {Array<Number>} range Coarse DMX range
 * @param {Object} context Wheel names by attribute prefix
 * @returns {Object} Capability data
 */
function capabilityData(fn, range, context) {
  const attribute = fn.attrs.Attribute || '';
  const from = float(fn.attrs.PhysicalFrom);
  const to = float(fn.attrs.PhysicalTo, 1);
  const name = fn.attrs.Name || attribute;
  const base = { dmxRange: range, comment: name };
  if (attribute === 'NoFeature') {
    return { ...base, type: 'NoFunction' };
  }
  if (attribute === 'Dimmer') {
    return {
      ...base, type: 'Intensity', brightnessStart: percent(from), brightnessEnd: percent(to),
    };
  }
  if (attribute === 'Pan' || attribute === 'Tilt') {
    return {
      ...base, type: attribute, angleStart: deg(from), angleEnd: deg(to),
    };
  }
  if (attribute === 'PanRotate' || attribute === 'TiltRotate') {
    return { ...base, type: attribute === 'PanRotate' ? 'PanContinuous' : 'TiltContinuous' };
  }
  if (MIXING_COLORS[attribute]) {
    return {
      ...base,
      type: 'ColorIntensity',
      color: MIXING_COLORS[attribute],
      brightnessStart: percent(from),
      brightnessEnd: percent(to),
    };
  }
  if (/^Shutter\d$/.test(attribute)) {
    return { ...base, type: 'ShutterStrobe', shutterEffect: /clos/i.test(name) ? 'Closed' : 'Open' };
  }
  if (/^Shutter\dStrobe/.test(attribute) || /^Strobe(Rate|Frequency)$/.test(attribute)) {
    let effect = 'Strobe';
    if (/Pulse/.test(attribute)) effect = 'Pulse';
    if (/Random/.test(attribute)) effect = 'Lightning';
    return {
      ...base,
      type: 'ShutterStrobe',
      shutterEffect: effect,
      speedStart: `${+Math.max(from, 0).toFixed(3)}Hz`,
      speedEnd: `${+Math.max(to, 0).toFixed(3)}Hz`,
      randomTiming: /Random/.test(attribute),
    };
  }
  if (/^Gobo\dPosRotate$/.test(attribute)) {
    return {
      ...base,
      type: 'WheelSlotRotation',
      wheel: context.wheelOf[attribute.slice(0, 5)] || '',
      speedStart: `${+(from / 6).toFixed(3)}rpm`,
      speedEnd: `${+(to / 6).toFixed(3)}rpm`,
    };
  }
  if (attribute === 'Zoom') {
    return {
      ...base, type: 'Zoom', angleStart: deg(from), angleEnd: deg(to),
    };
  }
  if (/^Focus\d$/.test(attribute)) {
    return {
      ...base, type: 'Focus', angleStart: percent(from), angleEnd: percent(to),
    };
  }
  if (/^Frost\d$/.test(attribute)) {
    return {
      ...base,
      type: 'Frost',
      frostIntensityStart: percent(from),
      frostIntensityEnd: percent(to),
    };
  }
  if (/^Prism\d$/.test(attribute)) {
    // A prism function whose physical range is 0 takes the prism out
    return from === 0 && to === 0 ? { ...base, type: 'NoFunction' } : { ...base, type: 'Prism' };
  }
  if (/^Prism\dPosRotate$/.test(attribute)) {
    return { ...base, type: 'PrismRotation' };
  }
  if (attribute === 'Iris') {
    return { ...base, type: 'Iris' };
  }
  if (attribute === 'CTO' || attribute === 'CTC' || attribute === 'CTB') {
    return { ...base, type: 'ColorTemperature' };
  }
  return { ...base, type: 'Generic' };
}

/**
 * Builds the capabilities of a DMX channel from its channel functions
 *
 * @param {Array<Object>} functions Channel function elements
 * @param {Number} bytes Channel resolution
 * @param {Object} context Wheel names by attribute prefix
 * @returns {Array<Object>} Capability data, by DMX range
 */
function channelCapabilities(functions, bytes, context) {
  const top = 256 ** bytes - 1;
  const coarse = (v) => Math.floor(v / 256 ** (bytes - 1));
  const sorted = functions
    .map((fn) => ({ fn, from: dmxValue(fn.attrs.DMXFrom, bytes) }))
    .sort((a, b) => a.from - b.from);
  const result = [];
  sorted.forEach(({ fn, from }, i) => {
    const end = i + 1 < sorted.length ? sorted[i + 1].from - 1 : top;
    if (end < from) return;
    const wheel = fn.attrs.Wheel;
    const sets = childrenOf(fn, 'ChannelSet')
      .filter((s) => parseInt(s.attrs.WheelSlotIndex, 10) > 0)
      .map((s) => ({ set: s, from: dmxValue(s.attrs.DMXFrom, bytes) }))
      .sort((a, b) => a.from - b.from);
    if (wheel && sets.length && /^(Color|Gobo|Prism)\d(Select\w*)?$/.test(fn.attrs.Attribute || '')) {
      sets.forEach(({ set, from: setFrom }, j) => {
        const setEnd = j + 1 < sets.length ? sets[j + 1].from - 1 : end;
        if (setFrom > end || setEnd < setFrom) return;
        result.push({
          dmxRange: [coarse(setFrom), coarse(Math.min(setEnd, end))],
          comment: set.attrs.Name || '',
          type: 'WheelSlot',
          wheel,
          slotNumber: String(parseInt(set.attrs.WheelSlotIndex, 10)),
        });
      });
      return;
    }
    result.push(capabilityData(fn, [coarse(from), coarse(end)], context));
  });
  // Coarse ranges of fine functions can collapse onto one value: keep the first per start
  return result.filter((c, i) => i === 0 || c.dmxRange[0] > result[i - 1].dmxRange[0]
    || c.dmxRange[1] > result[i - 1].dmxRange[1]);
}

/* ---------------------------------------------------------------- Modes */

/**
 * Builds one profile channel
 *
 * @param {String} baseName Channel name (OFL naming)
 * @param {String} label Display suffix (geometry instance), or ''
 * @param {Object} info Attribute, geometry, fine flag and capability data
 * @returns {Object} Profile channel without fine pairing and qaIndex
 */
function buildChannel(baseName, label, info) {
  const { type, color } = deriveTypeKey(baseName, info.isFine, info.capabilities);
  const capabilities = info.capabilities.map((capability) => new Capability(capability));
  const name = info.isFine ? `${baseName}${FINE_CHANNEL_TERMINOLOGY}` : baseName;
  return {
    name: label ? `${name} ${label}` : name,
    attribute: info.attribute,
    type,
    color,
    isFine: info.isFine,
    fine: [],
    qaIndex: 0,
    capabilities,
    lookup: buildCapabilityLookup(capabilities),
    geometry: info.geometry,
  };
}

/**
 * Builds one profile mode
 *
 * @param {Object} mode DMXMode element
 * @param {Object} context Models, geometries, attribute names and wheels
 * @returns {?Object} Profile mode, or null when it has no DMX channel
 */
function buildMode(mode, context) {
  const references = [];
  const instanceNames = new Map();
  const root = findGeometry(context.geometries, mode.attrs.Geometry);
  const geometry = root ? buildNode(root, { ...context, references, instanceNames }) : null;

  // Which geometry instances repeat a template geometry, with their DMX offset
  const instancesOf = (geometryName) => references
    .filter((r) => instanceNames.has(`${r.name}|${geometryName}`))
    .map((r) => ({ reference: r, name: instanceNames.get(`${r.name}|${geometryName}`) }));

  const slots = [];
  childrenOf(child(mode, 'DMXChannels'), 'DMXChannel').forEach((dmxChannel) => {
    const offsets = String(dmxChannel.attrs.Offset || '').split(',')
      .map((o) => parseInt(o, 10)).filter((o) => o > 0);
    if (!offsets.length) return; // virtual channel
    const dmxBreak = parseInt(dmxChannel.attrs.DMXBreak, 10) || 1;
    if (dmxChannel.attrs.DMXBreak && dmxChannel.attrs.DMXBreak !== 'Overwrite' && dmxBreak !== 1) {
      return;
    }
    const logical = childrenOf(dmxChannel, 'LogicalChannel');
    if (!logical.length) return;
    const attribute = logical[0].attrs.Attribute || 'Unknown';
    // A function without an attribute takes its logical channel's
    const functions = logical.flatMap((l) => childrenOf(l, 'ChannelFunction').map((fn) => (
      fn.attrs.Attribute ? fn : { ...fn, attrs: { ...fn.attrs, Attribute: l.attrs.Attribute } })));
    const capabilities = channelCapabilities(functions, offsets.length, context);
    const baseName = CHANNEL_NAMES[attribute] || MIXING_COLORS[attribute]
      || context.pretty[attribute] || attribute;

    const geometryName = dmxChannel.attrs.Geometry || null;
    const instances = geometryName ? instancesOf(geometryName) : [];
    const targets = instances.length
      ? instances.map((i) => {
        const { breaks } = i.reference;
        const brk = breaks.find((b) => b.dmxBreak === dmxBreak) || breaks[0];
        return { geometry: i.name, shift: brk ? brk.offset - 1 : 0, label: i.reference.name };
      })
      : [{ geometry: geometryName, shift: 0, label: '' }];

    targets.forEach((target) => {
      const addresses = offsets.map((o) => o + target.shift);
      slots.push({
        address: addresses[0],
        channel: buildChannel(baseName, target.label, {
          attribute, geometry: target.geometry, isFine: false, capabilities,
        }),
        fineAddresses: addresses.slice(1),
        fine: addresses.slice(1).map(() => buildChannel(baseName, target.label, {
          attribute,
          geometry: target.geometry,
          isFine: true,
          // As OFL: a single-function channel's fine byte retypes that function
          capabilities: capabilities.length === 1
            ? [{ ...capabilities[0], dmxRange: [0, 255], type: `${baseName}${FINE_CHANNEL_TERMINOLOGY}` }]
            : capabilities,
        })),
      });
    });
  });
  if (!slots.length) return null;

  const byAddress = new Map();
  slots.forEach((slot) => {
    if (!byAddress.has(slot.address)) byAddress.set(slot.address, slot.channel);
    slot.fineAddresses.forEach((a, i) => {
      if (!byAddress.has(a)) byAddress.set(a, slot.fine[i]);
    });
  });
  const footprint = Math.max(...byAddress.keys());
  const channels = [];
  for (let a = 1; a <= footprint; a++) {
    channels.push(byAddress.get(a) || buildChannel(UNSET_CHANNEL_TYPE, '', {
      attribute: 'Unknown', geometry: null, isFine: false, capabilities: [],
    }));
  }
  slots.forEach((slot) => {
    slot.channel.fine = slot.fineAddresses
      .filter((a, i) => byAddress.get(a) === slot.fine[i])
      .map((a) => a - 1);
  });

  const typeCounts = {};
  channels.forEach((channel) => {
    channel.qaIndex = typeCounts[channel.type] || 0;
    typeCounts[channel.type] = channel.qaIndex + 1;
  });
  return { name: mode.attrs.Name, channels, geometry };
}

/* ---------------------------------------------------------------- Profile */

/**
 * Derives a display category from a geometry tree
 *
 * @param {?Object} geometry Geometry tree
 * @returns {String} Category
 */
function deriveCategory(geometry) {
  if (!geometry) return 'Other';
  let nestedAxes = false;
  let beams = 0;
  walk(geometry, (node) => {
    if (node.kind === 'beam') beams += 1;
    if (node.kind === 'axis') {
      node.children.forEach((c) => walk(c, (n) => { if (n.kind === 'axis') nestedAxes = true; }));
    }
  });
  if (nestedAxes) return 'Moving Head';
  if (beams > 1) return 'Pixel Bar';
  return 'Color Changer';
}

/**
 * Physical data in the OFL shape, from the first beam and the zoom range
 *
 * @param {?Object} geometry Geometry tree of the first mode
 * @param {Array<Object>} channels Channels of the first mode
 * @returns {Object} Physical data
 */
function buildPhysical(geometry, channels) {
  let beam = null;
  if (geometry) walk(geometry, (node) => { if (!beam && node.beam) ({ beam } = node); });
  const zoom = channels.find((c) => c.attribute === 'Zoom' && !c.isFine && c.capabilities.length);
  const physical = {};
  if (geometry && geometry.size.some((v) => v > 0)) {
    const [length, width, height] = geometry.size;
    physical.dimensions = [width * 1000, height * 1000, length * 1000];
  }
  if (zoom) {
    const angles = zoom.capabilities.flatMap((c) => (c.entities.zoom
      ? [c.entities.zoom.start, c.entities.zoom.end] : [])).filter(Number.isFinite);
    if (angles.length) {
      physical.lens = { degreesMinMax: [Math.min(...angles), Math.max(...angles)] };
    }
  }
  if (!physical.lens && beam) physical.lens = { degreesMinMax: [beam.fieldAngle, beam.fieldAngle] };
  if (beam) physical.bulb = { colorTemperature: beam.colorTemperature, lumens: beam.flux };
  return physical;
}

/**
 * Builds a fixture profile from a GDTF description
 *
 * @public
 * @param {Object} description `GDTF` root element (see gdtf.archive.js readGDTF)
 * @returns {Object} Fixture profile (see fixture.profile.js)
 * @throws {GDTFError} When the description has no fixture type or no usable DMX mode
 */
export default function profileFromGDTF(description) {
  const fixtureType = child(description, 'FixtureType');
  if (!fixtureType || !fixtureType.attrs.FixtureTypeID) {
    throw new GDTFError('The GDTF description has no fixture type');
  }
  const models = new Map(childrenOf(child(fixtureType, 'Models'), 'Model').map((m) => [m.attrs.Name, {
    length: float(m.attrs.Length),
    width: float(m.attrs.Width),
    height: float(m.attrs.Height),
    primitive: m.attrs.PrimitiveType || null,
  }]));
  const geometries = new Map(
    (child(fixtureType, 'Geometries') || { children: [] }).children.map((g) => [g.attrs.Name, g]),
  );
  const pretty = {};
  const attributes = child(child(fixtureType, 'AttributeDefinitions'), 'Attributes');
  childrenOf(attributes, 'Attribute').forEach((a) => { pretty[a.attrs.Name] = a.attrs.Pretty || a.attrs.Name; });

  // Wheel used by each wheel attribute family (`Gobo1` → its wheel), for rotation functions
  const wheelOf = {};
  childrenOf(child(fixtureType, 'DMXModes'), 'DMXMode').forEach((mode) => {
    childrenOf(child(mode, 'DMXChannels'), 'DMXChannel').forEach((ch) => {
      childrenOf(ch, 'LogicalChannel').forEach((l) => childrenOf(l, 'ChannelFunction').forEach((fn) => {
        const family = (fn.attrs.Attribute || '').slice(0, 5);
        if (fn.attrs.Wheel && !wheelOf[family]) wheelOf[family] = fn.attrs.Wheel;
      }));
    });
  });

  const context = {
    models, geometries, pretty, wheelOf,
  };
  const modes = childrenOf(child(fixtureType, 'DMXModes'), 'DMXMode')
    .map((mode) => buildMode(mode, context))
    .filter(Boolean);
  if (!modes.length) {
    throw new GDTFError('The GDTF fixture has no DMX mode with DMX channels');
  }
  const revisions = childrenOf(child(fixtureType, 'Revisions'), 'Revision');
  const last = revisions[revisions.length - 1];
  return {
    source: PROFILE_SOURCES.GDTF,
    manufacturer: fixtureType.attrs.Manufacturer || 'Unknown',
    model: fixtureType.attrs.FixtureTypeID.toUpperCase(),
    name: fixtureType.attrs.LongName || fixtureType.attrs.Name || 'GDTF fixture',
    category: deriveCategory(modes[0].geometry),
    physical: buildPhysical(modes[0].geometry, modes[0].channels),
    wheels: buildWheels(fixtureType),
    modes,
    gdtf: {
      fixtureTypeId: fixtureType.attrs.FixtureTypeID.toUpperCase(),
      revision: last ? `${last.attrs.Date || ''} ${last.attrs.Text || ''}`.trim() : '',
      dataVersion: description.attrs.DataVersion || '',
    },
  };
}
