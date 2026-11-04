import * as THREE from 'three';
import { LIGHT_LAYERS } from './stage_lighting';
import { goboLayer, goboImageLayer } from './gobos';
import { SHAPE_ROLES, assignRoles } from './fixture_shapes';
import { NO_CAPABILITY } from '../../models/fixtures/fixture.profile';

const LIGHT_LENGTH = 60; // meters
const GLOW_LENGTH = 0.001; // meters: cells that only glow write a row for their lens glow only
const GLOW_HALF_ANGLE = 60; // degrees
const MAX_HALF_ANGLE = 45; // degrees
const MAX_PROJECTORS = 8; // projected beams per fixture
const CLUSTER_SPAN = 0.4; // meters: a group of cells wider than this is split
const CLUSTER_COS = Math.cos((5 * Math.PI) / 180); // cells within 5° point the same way
const PROJECTING_TYPES = ['Wash', 'Spot', 'PC', 'Fresnel'];
const FROST_BLUR = 3; // gobo blur at full frost, in mip levels
const FOCUS_BLUR = 1; // gobo blur at focus 0, in mip levels
const PRISM_FACETS = 3; // prisms without facet data (OFL, image-only GDTF slots)
const PRISM_SPREAD = 1.6; // their facet offset, in half field angles
const PRISM_MIN_SPREAD = Math.tan((4 * Math.PI) / 180); // at least 4°, so narrow beams split
const PRISM_FACET_INTENSITY = 0.6; // most light per facet (3 facets, as MovingHead)
const PRISM_TOTAL = 1.8;
const PRISM_MAX_FACETS = 16;
const CELL_OFF = 0.04; // brightness of an unlit cell
const YOKE_THICKNESS = 0.18; // arm thickness, share of the yoke length

// Emitted colour of colour mixing channels (OFL colour names), linear RGB
const EMITTER_COLORS = {
  Red: [1, 0, 0],
  Green: [0, 1, 0],
  Blue: [0, 0, 1],
  White: [1, 1, 1],
  'Warm White': [1, 0.72, 0.42],
  'Cold White': [0.82, 0.9, 1],
  Amber: [1, 0.45, 0],
  UV: [0.25, 0, 1],
  Lime: [0.55, 1, 0],
  Indigo: [0.25, 0, 0.55],
  Cyan: [0, 1, 1],
  Magenta: [1, 0, 1],
  Yellow: [1, 1, 0],
};
// Primary a subtractive filter removes
const SUBTRACTIVE = { Cyan: 0, Magenta: 1, Yellow: 2 };
const BLACK = [0, 0, 0];

const BODY_MATERIAL = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const HIGHLIGHT_MATERIAL = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  emissive: new THREE.Color(0x5a71d3),
  emissiveIntensity: 0.6,
  side: THREE.DoubleSide,
});
const LENS_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x0d0d0d, side: THREE.DoubleSide });
const CELL_MATERIAL = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });

// Shared unit shapes, centered on the origin (Z up)
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYLINDER = new THREE.CylinderGeometry(0.5, 0.5, 1, 24).rotateX(Math.PI / 2);
const DISC = new THREE.CircleGeometry(0.5, 20);

// Scratch values (no allocation per frame)
const row = {
  origin: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  right: new THREE.Vector3(),
  up: new THREE.Vector3(),
  tanHalf: 0,
  length: LIGHT_LENGTH,
  color: new THREE.Color(),
  intensity: 0,
  goboLayer: 0,
  goboRotation: 0,
  blur: 0,
};
const axis = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3();
const point = new THREE.Vector3();
const turn = new THREE.Quaternion();
const cellMatrix = new THREE.Matrix4();
const cellScale = new THREE.Matrix4();
const cellColor = new THREE.Color();
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const degToRad = (deg) => (deg * Math.PI) / 180;

const instances = [];
let sceneHandle = null;

/**
 * Linear RGB of a colour temperature
 *
 * @param {Number} kelvin Colour temperature
 * @returns {Array<Number>} RGB, 0 to 1
 */
function kelvinToRGB(kelvin) {
  const t = kelvin / 100;
  const rgb = t <= 66
    ? [255, 99.47 * Math.log(t) - 161.12, t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04]
    : [329.7 * (t - 60) ** -0.1332, 288.12 * (t - 60) ** -0.0755, 255];
  return rgb.map((c) => {
    const s = Math.min(Math.max(c, 0), 255) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
}

/**
 * Beams in a node's subtree
 *
 * @param {Object} entry Node entry
 * @returns {Array<Number>} Beam indexes
 */
function beamsUnder(entry) {
  const out = [];
  const visit = (e) => {
    if (e.beamIndex !== undefined) out.push(e.beamIndex);
    e.children.forEach(visit);
  };
  visit(entry);
  return out;
}

/**
 * Middle of a Pan or Tilt channel's angle range (OFL ranges start at 0), over the capabilities
 * that have an angle
 *
 * @param {Object} channel Profile channel
 * @returns {Number} Middle angle in degrees
 */
function angleCenter(channel) {
  let min = Infinity;
  let max = -Infinity;
  channel.capabilities.forEach((capability) => {
    const entity = capability.entities.pan || capability.entities.tilt;
    if (!entity) return;
    [entity.start, entity.end, entity.value].forEach((v) => {
      if (Number.isFinite(v)) {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    });
  });
  return Number.isFinite(min) ? (min + max) / 2 : 0;
}

/**
 * Builds the body meshes of a node by role, scaled to its size
 *
 * @param {String} role Body role
 * @param {Array<Number>} size Length, width, height
 * @param {Array<Number>} [offset] Body centre relative to the node's origin
 * @returns {Array<THREE.Mesh>} Meshes, in the node's frame
 */
function bodyMeshes(role, size, offset = [0, 0, 0]) {
  const [length, width, height] = size;
  const mesh = (geometry, sx, sy, sz, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geometry, BODY_MATERIAL);
    m.scale.set(Math.max(sx, 1e-3), Math.max(sy, 1e-3), Math.max(sz, 1e-3));
    m.position.set(x + offset[0], y + offset[1], z + offset[2]);
    m.layers.enable(LIGHT_LAYERS.OCCLUDER);
    return m;
  };
  switch (role) {
    case SHAPE_ROLES.YOKE: {
      const t = length * YOKE_THICKNESS;
      return [
        mesh(BOX, length, width, t, 0, 0, height / 2 - t / 2),
        mesh(BOX, t, width, height, -length / 2 + t / 2, 0, 0),
        mesh(BOX, t, width, height, length / 2 - t / 2, 0, 0),
      ];
    }
    case SHAPE_ROLES.HEAD:
    case SHAPE_ROLES.CAN:
      return [mesh(CYLINDER, Math.min(length, width), Math.min(length, width), height)];
    case SHAPE_ROLES.BASE:
    case SHAPE_ROLES.BAR:
    case SHAPE_ROLES.PANEL:
    case SHAPE_ROLES.BOX:
      return [mesh(BOX, length, width, height)];
    default:
      return [];
  }
}

/**
 * @class GeometryFixture
 * @classdesc A fixture drawn from its geometry tree (GDTF, or built from OFL facts): bodies,
 * pan/tilt axes and beams. Each beam follows its own channels, inheriting the channels of the
 * nodes above it. Every beam shows as a lit cell; projected light comes from a few clusters of
 * cells per fixture, so the lighting cost stays per fixture rather than per cell.
 */
class GeometryFixture {
  /**
   * @param {Object} data Fixture data
   * @param {Object} data.geometry Geometry tree (GDTF convention: beams along -Z, hanging)
   * @param {Array<Object>} data.channels Profile channels of the patched mode
   * @param {Object} data.wheels Profile wheels
   * @param {?Object} data.matrix Profile pixel groups (OFL), or null
   * @param {Map<String, ImageBitmap>} [data.images] Wheel slot images by media file name (GDTF)
   * @param {?Array<Number>} [data.lens] Lens field angle range in degrees [min, max]
   * @param {Boolean} [data.zoomInPercent=false] Whether zoom values are a percentage of the lens
   * range (OFL "narrow" / "wide" presets) rather than degrees
   * @param {Boolean} [data.centerAngles=false] Whether Pan/Tilt ranges start at 0 (OFL) and are
   * turned around their middle, as GDTF ranges are
   */
  constructor({
    geometry, channels, wheels, matrix, centerAngles = false, images = new Map(),
    lens = null, zoomInPercent = false,
  }) {
    this._lens = lens;
    this._zoomInPercent = zoomInPercent;
    // Gobo layer of each wheel slot: its image when it has one, else a built-in pattern
    this._slotLayers = {};
    Object.entries(wheels || {}).forEach(([name, wheel]) => {
      this._slotLayers[name] = wheel.slots.map((slot, i) => {
        const image = slot.image && images.get(slot.image);
        const layer = image ? goboImageLayer(image) : -1;
        return layer >= 0 ? layer : goboLayer(wheel.slots, i);
      });
    });
    this._centerAngles = centerAngles;
    this._wheels = wheels || {};
    this._groups = (matrix && matrix.groups) || {};
    this._position = { x: 0, y: 0, z: 0 };
    this._rotation = { x: 0, y: 0, z: 0 };
    this._highlighted = false;
    this._lastTime = null;
    this._poseDirty = true;
    this._colorsDirty = true;
    this._lastWorld = new THREE.Matrix4();
    this._facetCache = new Map();

    this._dummy = new THREE.Object3D();
    // GDTF trees hang with beams down; flip them so rotation conventions match MovingHead
    this._frame = new THREE.Object3D();
    this._frame.rotation.x = Math.PI;
    this._dummy.add(this._frame);

    this._nodes = new Map();
    this._axes = [];
    this._beams = [];
    this._meshes = [];
    const roles = assignRoles(geometry);
    this.buildNode(geometry, this._frame, 0, roles, null);

    this._cells = new THREE.InstancedMesh(DISC, CELL_MATERIAL, Math.max(this._beams.length, 1));
    this._cells.count = this._beams.length;
    this._cells.frustumCulled = false;
    this._cells.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._cells.setColorAt(0, cellColor.setRGB(0, 0, 0));

    this.routeChannels(channels);
    this._dummy.updateMatrixWorld(true);
    this.buildClusters();

    sceneHandle.add(this._dummy, this._cells);
    instances.push(this);
  }

  /**
   * Builds the Object3D of a geometry node and its children
   *
   * @private
   * @param {Object} data Geometry node
   * @param {THREE.Object3D} parent Parent object
   * @param {Number} depth Depth in the tree
   * @param {Map<Object, String>} roles Body role by node
   * @param {?Object} parentEntry Parent node entry
   */
  buildNode(data, parent, depth, roles, parentEntry) {
    const object = new THREE.Object3D();
    object.matrix.set(...data.matrix);
    object.matrix.decompose(object.position, object.quaternion, object.scale);
    parent.add(object);
    const entry = {
      data,
      object,
      depth,
      parent: parentEntry,
      children: [],
      rest: object.quaternion.clone(),
      pan: 0,
      tilt: 0,
    };
    if (parentEntry) parentEntry.children.push(entry);
    this._nodes.set(data.name, entry);
    bodyMeshes(roles.get(data), data.size, data.offset).forEach((mesh) => {
      object.add(mesh);
      this._meshes.push(mesh);
    });
    if (data.kind === 'axis') this._axes.push(entry);
    if (data.kind === 'beam') {
      const beam = data.beam || {};
      const radius = Math.max(beam.radius || 0.05, 0.005);
      const lens = new THREE.Mesh(DISC, LENS_MATERIAL);
      lens.scale.set(radius * 2.2, radius * 2.2, 1);
      lens.position.z = 0.002;
      object.add(lens);
      entry.beamIndex = this._beams.length;
      this._beams.push({
        entry,
        radius,
        fieldAngle: beam.fieldAngle || 25,
        projects: PROJECTING_TYPES.includes(beam.type || 'Wash'),
        white: kelvinToRGB(beam.colorTemperature || 6500),
        hasMixing: false,
        state: {
          dimmer: 1,
          shutter: 1,
          strobe: 0,
          add: [0, 0, 0],
          filter: [1, 1, 1],
          zoom: null,
          preset: null,
          focus: 100,
          frost: 0,
          prism: false,
          gobo: null,
          goboSpeed: 0,
          goboAngle: 0,
          color: [1, 1, 1],
          intensity: 0,
        },
      });
    }
    data.children.forEach((c) => this.buildNode(c, object, depth + 1, roles, entry));
  }

  /**
   * The node a Pan or Tilt channel turns. For a named geometry: the outermost (Pan) or innermost
   * (Tilt) axis on its path from the root, or the geometry itself when that path has no axis
   * (files that don't declare axes). Channels on the fixture root (OFL, a few GDTF files) turn the
   * outermost (Pan) or innermost (Tilt) axis below it.
   *
   * @private
   * @param {Object} entry Channel's node entry
   * @param {Boolean} tilt Whether the channel is a Tilt channel
   * @returns {?Object} Node entry to turn
   */
  axisFor(entry, tilt) {
    if (entry.parent) {
      // Axes on the path from the root to the named geometry: Pan turns the outermost, Tilt the
      // innermost (some files name the head for both)
      const path = [];
      for (let e = entry; e; e = e.parent) if (e.data.kind === 'axis') path.unshift(e);
      if (tilt && path.length === 1 && entry.data.kind !== 'axis') {
        // Tilt on a plain geometry below the pan axis (the head isn't declared an axis)
        if (!this._axes.includes(entry)) this._axes.push(entry);
        return entry;
      }
      if (tilt && path.length === 1) {
        // Tilt named on the pan axis (some files name the yoke for both): the axis below it
        const below = entry.children.find((c) => this.subtreeHasAxis(c));
        const inner = below && this.axisFor(below, true);
        if (inner && inner !== path[0]) return inner;
        // No axis below (the head is a plain geometry): the child holding the beams
        const head = !below && entry.children.find((c) => c.data.kind !== 'beam'
          && beamsUnder(c).length);
        if (head) {
          if (!this._axes.includes(head)) this._axes.push(head);
          return head;
        }
      }
      if (path.length) return tilt ? path[path.length - 1] : path[0];
      if (!this._axes.includes(entry)) this._axes.push(entry);
      return entry;
    }
    const chain = [];
    let e = entry;
    while (e) {
      if (e.data.kind === 'axis') chain.push(e);
      e = e.children.find((c) => this.subtreeHasAxis(c)) || null;
    }
    if (!chain.length) return null;
    return tilt ? chain[chain.length - 1] : chain[0];
  }

  /**
   * Whether a node or one below it is an axis
   *
   * @private
   * @param {Object} entry Node entry
   * @returns {Boolean} Whether an axis is found
   */
  subtreeHasAxis(entry) {
    return entry.data.kind === 'axis' || entry.children.some((c) => this.subtreeHasAxis(c));
  }

  /**
   * Routes every channel to the axis or beams it drives, shallow nodes first so a beam's own
   * channels override the fixture-wide ones
   *
   * @private
   * @param {Array<Object>} channels Profile channels of the patched mode
   */
  routeChannels(channels) {
    const root = this._nodes.values().next().value;
    this._routes = [];
    channels.forEach((channel, index) => {
      if (channel.isFine || !channel.capabilities.length) return;
      const named = channel.geometry && this._nodes.get(channel.geometry);
      const group = !named && channel.geometry && this._groups[channel.geometry];
      const entry = named || root;
      const isPan = channel.attribute === 'Pan' || channel.type === 'Pan';
      const isTilt = channel.attribute === 'Tilt' || channel.type === 'Tilt';
      const route = {
        index,
        center: this._centerAngles && (isPan || isTilt) ? angleCenter(channel) : 0,
        fine: channel.fine.length ? channel.fine[0] : -1,
        channel,
        depth: group ? 1 : entry.depth,
        axis: isPan || isTilt ? this.axisFor(entry, isTilt) : null,
        beams: group
          ? group.map((key) => this._nodes.get(key)).filter(Boolean).flatMap(beamsUnder)
          : beamsUnder(entry),
      };
      // Beams with colour mixing channels are dark when those are at 0 (not white)
      const mixing = !/^ColorSub_/.test(channel.attribute)
        && channel.capabilities.some((c) => c.type === 'ColorIntensity');
      if (mixing) {
        route.beams.forEach((b) => { this._beams[b].hasMixing = true; });
      }
      this._routes.push(route);
    });
    // A beam with subtractive (CMY) filters has a white source: additive channels on it are
    // accessory LEDs (strips, rings), so it isn't a colour-mixing beam
    this._routes.forEach((route) => {
      if (!/^ColorSub_/.test(route.channel.attribute)) return;
      route.beams.forEach((b) => { this._beams[b].hasMixing = false; });
    });
    this._routes.sort((a, b) => a.depth - b.depth);
  }

  /**
   * Groups the projecting beams into at most MAX_PROJECTORS clusters: beams moving with the same
   * axis (or the fixture body) and pointing within 5° of each other, split along their long side
   * when wider than 0.4 m
   *
   * @private
   */
  buildClusters() {
    const groups = [];
    this._beams.forEach((beam, index) => {
      if (!beam.projects) return;
      const { object } = beam.entry;
      const e = object.matrixWorld.elements;
      const dir = new THREE.Vector3(-e[8], -e[9], -e[10]).normalize();
      const pos = new THREE.Vector3().setFromMatrixPosition(object.matrixWorld);
      let mover = beam.entry.parent;
      while (mover && mover.data.kind !== 'axis') mover = mover.parent;
      let group = groups.find((g) => g.mover === mover && g.dir.dot(dir) > CLUSTER_COS);
      if (!group) {
        group = { mover, dir, members: [] };
        groups.push(group);
      }
      group.members.push({ index, pos });
    });
    const parts = groups.map((g) => {
      const box = new THREE.Box3().setFromPoints(g.members.map((m) => m.pos));
      const span = box.getSize(new THREE.Vector3());
      let along = span.y >= span.z ? 'y' : 'z';
      if (span.x >= span.y && span.x >= span.z) along = 'x';
      return { g, along, k: Math.max(1, Math.ceil(span[along] / CLUSTER_SPAN)) };
    });
    const total = parts.reduce((s, p) => s + p.k, 0);
    if (total > MAX_PROJECTORS) {
      parts.forEach((p) => { p.k = Math.max(1, Math.floor((p.k * MAX_PROJECTORS) / total)); });
    }
    this._clusters = [];
    parts.forEach(({ g, along, k }) => {
      const sorted = g.members.slice().sort((a, b) => a.pos[along] - b.pos[along]);
      for (let i = 0; i < k; i++) {
        const members = sorted.slice(
          Math.floor((i * sorted.length) / k),
          Math.floor(((i + 1) * sorted.length) / k),
        ).map((m) => m.index);
        if (members.length) {
          if (this._clusters.length < MAX_PROJECTORS) this._clusters.push(members);
          else this._clusters[this._clusters.length - 1].push(...members);
        }
      }
    });
  }

  /**
   * Decodes the fixture's DMX bytes into its axes and beams
   *
   * @public
   * @param {Uint8Array} values DMX values of the fixture's channels
   */
  decode(values) {
    for (let i = 0; i < this._axes.length; i++) {
      this._axes[i].pan = 0;
      this._axes[i].tilt = 0;
    }
    for (let b = 0; b < this._beams.length; b++) {
      const beam = this._beams[b];
      const s = beam.state;
      s.dimmer = 1;
      s.macro = null;
      s.shutter = 1;
      s.strobe = 0;
      s.add[0] = 0; s.add[1] = 0; s.add[2] = 0;
      s.filter[0] = 1; s.filter[1] = 1; s.filter[2] = 1;
      s.zoom = null;
      s.preset = null;
      s.focus = 100;
      s.frost = 0;
      s.prism = false;
      s.gobo = null;
      s.goboSpeed = 0;
    }
    for (let r = 0; r < this._routes.length; r++) {
      this.applyRoute(this._routes[r], values);
    }
    for (let b = 0; b < this._beams.length; b++) {
      const beam = this._beams[b];
      const s = beam.state;
      // A colour preset overrides everything, as for MovingHead. A fixture that mixes its colour
      // is dark with its mix at 0, unless a colour wheel slot (a macro on LED fixtures) is set
      let base = beam.white;
      if (s.preset) base = s.preset;
      else if (beam.hasMixing) {
        base = s.add[0] + s.add[1] + s.add[2] > 0 ? s.add : (s.macro || BLACK);
      }
      const peak = Math.max(base[0], base[1], base[2], 1);
      for (let c = 0; c < 3; c++) s.color[c] = (base[c] / peak) * s.filter[c];
      s.intensity = Math.min(Math.max(s.dimmer, 0), 1);
    }
    this._poseDirty = true;
    this._colorsDirty = true;
  }

  /**
   * Applies one channel's value to its axis or beams
   *
   * @private
   * @param {Object} route Channel route
   * @param {Uint8Array} values DMX values of the fixture's channels
   */
  applyRoute(route, values) {
    const { channel } = route;
    const coarse = values[route.index];
    const lookup = channel.lookup ? channel.lookup[coarse] : NO_CAPABILITY;
    if (lookup === NO_CAPABILITY) return;
    const capability = channel.capabilities[lookup];
    const value = capability.getValue(coarse + (route.fine >= 0 ? values[route.fine] / 256 : 0));
    switch (capability.type) {
      case 'Pan':
        if (route.axis) route.axis.pan = (value.pan || 0) - route.center;
        return;
      case 'Tilt':
        if (route.axis) route.axis.tilt = (value.tilt || 0) - route.center;
        return;
      default:
        break;
    }
    for (let i = 0; i < route.beams.length; i++) {
      const beam = this._beams[route.beams[i]];
      this.applyToBeam(beam, capability, value, channel);
    }
  }

  /**
   * Applies a decoded capability value to a beam
   *
   * @private
   * @param {Object} beam Beam
   * @param {Capability} capability Capability
   * @param {Object} value Decoded value
   * @param {Object} channel Profile channel
   */
  applyToBeam(beam, capability, value, channel) {
    const s = beam.state;
    switch (capability.type) {
      case 'Intensity':
        // Master and cell dimmers multiply (GDTF relations)
        s.dimmer *= value.intensity;
        break;
      case 'ColorIntensity': {
        const name = value.color;
        const k = Math.min(Math.max(value.colorBrightness || 0, 0), 1);
        if (/^ColorSub_/.test(channel.attribute) && SUBTRACTIVE[name] !== undefined) {
          s.filter[SUBTRACTIVE[name]] *= 1 - k;
        } else if (EMITTER_COLORS[name]) {
          const c = EMITTER_COLORS[name];
          s.add[0] += c[0] * k;
          s.add[1] += c[1] * k;
          s.add[2] += c[2] * k;
        }
        break;
      }
      case 'WheelSlot': {
        // OFL wheel slots without a wheel name use the wheel named like their channel
        const wheelName = value.wheel || channel.name;
        const wheel = this._wheels[wheelName];
        const index = Math.floor(value.slotNumber) - 1;
        const slot = wheel && wheel.slots[index];
        if (!slot) break;
        if (slot.type === 'Color' && slot.colors && slot.colors[0]) {
          cellColor.set(slot.colors[0]);
          if (beam.hasMixing) {
            // On a colour-mixing fixture a wheel colour is a macro, not a filter
            s.macro = [cellColor.r, cellColor.g, cellColor.b];
          } else {
            s.filter[0] *= cellColor.r;
            s.filter[1] *= cellColor.g;
            s.filter[2] *= cellColor.b;
          }
        } else if (slot.type === 'Gobo') {
          s.gobo = this._slotLayers[wheelName][index];
        } else if (slot.type === 'Prism') {
          s.prism = this.facetsOf(slot);
        }
        break;
      }
      case 'WheelSlotRotation':
        s.goboSpeed = value.wheelRotationSpeed || 0;
        break;
      case 'ShutterStrobe':
        // As MovingHead: a closed shutter doesn't black the beam out, strobes flash it
        if (value.strobeEffect !== 'Open' && value.strobeEffect !== 'Closed') {
          s.strobe = value.strobeFrequency || 0;
        }
        break;
      case 'ColorPreset':
        if (value.color && value.color[0]) {
          cellColor.set(value.color[0]);
          s.preset = [cellColor.r, cellColor.g, cellColor.b];
        }
        break;
      case 'Zoom':
        s.zoom = this._zoomInPercent && this._lens
          ? this._lens[0] + (this._lens[1] - this._lens[0]) * (value.zoom / 100)
          : value.zoom;
        break;
      case 'BeamAngle':
        s.zoom = value.angle;
        break;
      case 'Focus':
        s.focus = value.focus;
        break;
      case 'Frost':
        s.frost = Math.max(s.frost, value.frost || 0); // several frost filters: the strongest
        break;
      case 'Prism':
        s.prism = true;
        break;
      default:
        break;
    }
  }

  /**
   * Facet layout of a prism slot, cached per slot: directions around the beam scaled so the
   * furthest facet is 1 (exporters disagree on the deflection's scale, so only the layout is
   * kept), at most PRISM_MAX_FACETS. Slots without a usable layout give `true` (3 facets).
   *
   * @private
   * @param {Object} slot Prism wheel slot
   * @returns {Array<Array<Number>>|Boolean} Facet layout, or true
   */
  facetsOf(slot) {
    if (this._facetCache.has(slot)) return this._facetCache.get(slot);
    let layout = true;
    const facets = slot.facets || [];
    const reach = Math.max(0, ...facets.map(([x, y]) => Math.hypot(x, y)));
    if (facets.length > 1 && reach > 0) {
      const step = Math.max(1, Math.ceil(facets.length / PRISM_MAX_FACETS));
      layout = facets.filter((_, i) => i % step === 0).map(([x, y]) => [x / reach, y / reach]);
    }
    this._facetCache.set(slot, layout);
    return layout;
  }

  /**
   * Fixture position in 3D space (meter)
   *
   * @type {Object}
   */
  set position(value) {
    this._position = value;
    this._dummy.position.set(value.x, value.y, value.z);
    this._poseDirty = true;
  }

  get position() {
    return this._position;
  }

  /**
   * Fixture rotation in 3D space (radian)
   *
   * @type {Object}
   */
  set rotation(value) {
    this._rotation = value;
    this._dummy.rotation.set(value.x, value.y, value.z);
    this._poseDirty = true;
  }

  get rotation() {
    return this._rotation;
  }

  /**
   * Whether the fixture is highlighted (selection)
   *
   * @type {Boolean}
   */
  set highlighted(state) {
    this._highlighted = Boolean(state);
    const material = this._highlighted ? HIGHLIGHT_MATERIAL : BODY_MATERIAL;
    this._meshes.forEach((mesh) => { mesh.material = material; });
  }

  get highlighted() {
    return this._highlighted;
  }

  /**
   * Whether a beam changes on its own between DMX updates (strobe, rotating gobo)
   *
   * @type {Boolean}
   */
  get animating() {
    return this._beams.some((b) => b.state.strobe > 0 || b.state.goboSpeed !== 0);
  }

  /**
   * Turns the axes and places the cells
   *
   * @private
   */
  updatePose() {
    for (let i = 0; i < this._axes.length; i++) {
      const a = this._axes[i];
      a.object.quaternion.copy(a.rest)
        .multiply(turn.setFromAxisAngle(Z_AXIS, degToRad(a.pan)))
        .multiply(turn.setFromAxisAngle(X_AXIS, degToRad(a.tilt)));
    }
    this._dummy.updateMatrixWorld(true);
    for (let b = 0; b < this._beams.length; b++) {
      const beam = this._beams[b];
      const d = beam.radius * 2;
      cellMatrix.copy(beam.entry.object.matrixWorld).multiply(cellScale.makeScale(d, d, 1));
      this._cells.setMatrixAt(b, cellMatrix);
    }
    this._cells.instanceMatrix.needsUpdate = true;
  }

  /**
   * Colours the cells from their beams' light
   *
   * @private
   */
  updateCells() {
    for (let b = 0; b < this._beams.length; b++) {
      const s = this._beams[b].state;
      const k = s.intensity * s.shutter;
      cellColor.setRGB(
        CELL_OFF + s.color[0] * k,
        CELL_OFF + s.color[1] * k,
        CELL_OFF + s.color[2] * k,
      );
      this._cells.setColorAt(b, cellColor);
    }
    if (this._cells.instanceColor) this._cells.instanceColor.needsUpdate = true;
  }

  /**
   * Advances strobes and gobo rotation
   *
   * @private
   * @param {Number} t Time in seconds
   */
  animate(t) {
    const dt = this._lastTime === null ? 0 : t - this._lastTime;
    this._lastTime = t;
    for (let b = 0; b < this._beams.length; b++) {
      const s = this._beams[b].state;
      const open = s.strobe > 0 ? Math.sin(2 * Math.PI * s.strobe * t) > 0 : true;
      const shutter = s.shutter > 0 && open ? 1 : 0;
      if ((s.strobe > 0) !== (s.lastStrobe > 0) || s.strobe > 0) this._colorsDirty = true;
      s.lastStrobe = s.strobe;
      s.open = shutter;
      if (s.goboSpeed !== 0) {
        s.goboAngle = (s.goboAngle + (s.goboSpeed / 60) * 2 * Math.PI * dt) % (2 * Math.PI);
      }
    }
  }

  /**
   * Writes one beam row from a set of beams
   *
   * @private
   * @param {BeamState} beamState Beam state being written
   * @param {Array<Number>} members Beam indexes
   * @param {Boolean} glow Whether the row only carries a lens glow
   */
  writeRow(beamState, members, glow) {
    row.origin.set(0, 0, 0);
    axis.set(0, 0, 0);
    right.set(0, 0, 0);
    row.color.setRGB(0, 0, 0);
    let intensity = 0;
    let field = 0;
    for (let i = 0; i < members.length; i++) {
      const beam = this._beams[members[i]];
      const s = beam.state;
      const e = beam.entry.object.matrixWorld.elements;
      row.origin.add(point.set(e[12], e[13], e[14]));
      axis.add(point.set(-e[8], -e[9], -e[10]));
      right.add(point.set(e[0], e[1], e[2]));
      const k = s.intensity * s.open;
      intensity += k;
      row.color.r += s.color[0] * k;
      row.color.g += s.color[1] * k;
      row.color.b += s.color[2] * k;
      field += s.zoom !== null && s.zoom > 0 ? s.zoom : beam.fieldAngle;
    }
    if (intensity <= 0) return;
    const n = members.length;
    row.origin.multiplyScalar(1 / n);
    axis.normalize();
    right.addScaledVector(axis, -right.dot(axis)).normalize();
    up.crossVectors(axis, right);
    row.color.multiplyScalar(1 / intensity);
    row.intensity = intensity / n;
    const lead = this._beams[members[0]].state;
    const half = glow ? GLOW_HALF_ANGLE : Math.min(Math.max(field / n, 0.5) / 2, MAX_HALF_ANGLE);
    row.tanHalf = Math.tan(degToRad(half));
    row.length = glow ? GLOW_LENGTH : LIGHT_LENGTH;
    row.goboLayer = lead.gobo || 0;
    row.goboRotation = lead.goboAngle;
    row.blur = (lead.frost / 100) * FROST_BLUR + (1 - lead.focus / 100) * FOCUS_BLUR;
    if (glow || !lead.prism) {
      row.direction.copy(axis);
      row.right.copy(right);
      row.up.copy(up);
      beamState.push(row);
      return;
    }
    // One beam per facet: the fixture's facet layout when it has one, else three around the axis
    const facets = Array.isArray(lead.prism) ? lead.prism : null;
    const count = facets ? facets.length : PRISM_FACETS;
    const spread = Math.max(row.tanHalf * PRISM_SPREAD, PRISM_MIN_SPREAD);
    row.intensity *= Math.min(PRISM_FACET_INTENSITY, PRISM_TOTAL / count);
    for (let k = 0; k < count; k++) {
      const a = (k / count) * 2 * Math.PI;
      const dx = (facets ? facets[k][0] : Math.cos(a)) * spread;
      const dy = (facets ? facets[k][1] : Math.sin(a)) * spread;
      row.direction.copy(axis)
        .addScaledVector(right, dx)
        .addScaledVector(up, dy)
        .normalize();
      row.up.copy(up).addScaledVector(row.direction, -up.dot(row.direction)).normalize();
      row.right.crossVectors(row.up, row.direction);
      beamState.push(row);
    }
  }

  /**
   * Updates the fixture and appends its beams to the beam state
   *
   * @public
   * @param {Number} t Time in seconds
   * @param {BeamState} beamState Beam state being written this frame
   */
  update(t, beamState) {
    this.animate(t);
    // The gizmo moves fixtures by re-parenting them into its group: follow the world transform
    this._dummy.updateWorldMatrix(true, false);
    if (!this._lastWorld.equals(this._dummy.matrixWorld)) {
      this._lastWorld.copy(this._dummy.matrixWorld);
      this._poseDirty = true;
    }
    if (this._poseDirty) {
      this.updatePose();
      this._poseDirty = false;
    }
    if (this._colorsDirty) {
      this.updateCells();
      this._colorsDirty = false;
    }
    for (let c = 0; c < this._clusters.length; c++) {
      this.writeRow(beamState, this._clusters[c], false);
    }
    if (!this._glowMembers) {
      this._glowMembers = this._beams.map((b, i) => (b.projects ? -1 : i)).filter((i) => i >= 0)
        .map((i) => [i]);
    }
    for (let g = 0; g < this._glowMembers.length; g++) {
      this.writeRow(beamState, this._glowMembers[g], true);
    }
  }

  /**
   * Removes the fixture from the scene
   *
   * @public
   */
  dispose() {
    sceneHandle.remove(this._dummy, this._cells);
    this._cells.dispose();
    const index = instances.indexOf(this);
    if (index > -1) instances.splice(index, 1);
  }

  /**
   * Keeps the scene fixtures are added to
   *
   * @public
   * @param {THREE.Scene} scene Scene
   */
  static prepareInstanciation(scene) {
    sceneHandle = scene;
  }

  /**
   * Updates every fixture and appends their beams (between BeamState begin and end)
   *
   * @public
   * @param {Number} t Time in seconds
   * @param {BeamState} beamState Beam state being written
   * @returns {Boolean} Whether a beam animates on its own
   */
  static update(t, beamState) {
    let animating = false;
    for (let i = 0; i < instances.length; i++) {
      instances[i].update(t, beamState);
      animating = animating || instances[i].animating;
    }
    return animating;
  }

  /**
   * Clears the highlight of every fixture
   *
   * @public
   */
  static clearHighlighting() {
    instances.forEach((instance) => { instance.highlighted = false; });
  }
}

export default GeometryFixture;
