import MovingHead from './moving_head';
import GeometryFixture from './geometry_fixture';
import { synthesizeGeometry } from './fixture_shapes';
import Controls from './controls';
import EventBus from '../eventbus';
import { NO_CAPABILITY } from '../../models/fixtures/fixture.profile';

/**
 * Capability types decoded with special handling (others map their value keys onto the model)
 *
 * @constant {Object} CAPABILITY_TYPES
 */
const CAPABILITY_TYPES = {
  ColorIntensity: 'ColorIntensity',
  ColorPreset: 'ColorPreset',
  WheelSlot: 'WheelSlot',
};

/**
 * Wheel channel types (channel `type` keys)
 *
 * @constant {Object} WHEEL_CHANNEL_TYPES
 */
const WHEEL_CHANNEL_TYPES = {
  COLOR_WHEEL: 'Color Wheel',
  GOBO_WHEEL: 'Gobo Wheel',
};

/**
 * Standard attribute of gobo wheel channels (see the OFL adapter)
 *
 * @constant {String} GOBO_ATTRIBUTE
 */
const GOBO_ATTRIBUTE = 'Gobo1';

/**
 * Finds the name of a fixture's first wheel matching a pattern (OFL wheel names vary: "Gobo Wheel",
 * "Rotating Gobo Wheel"...)
 *
 * @param {Object} wheels Fixture wheels keyed by name
 * @param {RegExp} pattern Wheel name pattern
 * @returns {?String} Wheel name
 */
const findWheel = (wheels, pattern) => Object.keys(wheels).find((key) => pattern.test(key)) || null;

const radToDeg = (rad) => rad * (180 / Math.PI);
const degToRad = (deg) => deg * (Math.PI / 180);

/**
 * @class FixtureHandle
 * @classdesc What the move/rotate gizmo (Controls) holds for a fixture: its 3D instance plus
 * position/rotation accessors. Writes from the gizmo move the instance and are reported with a
 * `fixture_transformed` event; the view applies them to the fixture.
 */
class FixtureHandle {
  /**
   * @param {Number} id Fixture id
   * @param {MovingHead} model Fixture's 3D instance
   */
  constructor(id, model) {
    this.id = id;
    this._3DModel = model;
    this.silent = false;
  }

  /**
   * Position in 3D space (meter)
   *
   * @type {Object}
   */
  get position() {
    const { x, y, z } = this._3DModel.position;
    return { x, y, z };
  }

  set position(value) {
    const position = { x: value.x, y: value.y, z: value.z };
    this._3DModel.position = position;
    if (!this.silent) {
      EventBus.emit('fixture_transformed', { id: this.id, position });
    }
  }

  /**
   * Rotation in 3D space (degree)
   *
   * @type {Object}
   */
  get rotation() {
    const { x, y, z } = this._3DModel.rotation;
    return { x: radToDeg(x), y: radToDeg(y), z: radToDeg(z) };
  }

  set rotation(value) {
    this._3DModel.rotation = { x: degToRad(value.x), y: degToRad(value.y), z: degToRad(value.z) };
    if (!this.silent) {
      EventBus.emit('fixture_transformed', { id: this.id, rotation: { ...value } });
    }
  }
}

/**
 * @class FixtureRenderer
 * @classdesc Draws the patched fixtures from the universes' DMX frames. Input is data only:
 * a patch snapshot (Show.patchSnapshot), pose and highlight updates. Each rendered frame, fixtures
 * whose DMX bytes changed are decoded through their profile channels.
 */
class FixtureRenderer {
  /**
   * @param {Function} [onChange] Called when the patch, a pose or a highlight changes
   */
  constructor(onChange = () => {}) {
    this.onChange = onChange;
    /**
     * Rendered fixtures keyed by fixture id
     *
     * @type {Map<Number, Object>}
     */
    this.instances = new Map();
  }

  /**
   * Creates, updates and removes 3D instances to match the patch
   *
   * @public
   * @param {Array<Object>} entries Patch snapshot entries (see Show.patchSnapshot)
   */
  setPatch(entries) {
    const seen = new Set();
    entries.forEach((entry) => {
      seen.add(entry.id);
      let instance = this.instances.get(entry.id);
      if (instance && instance.channels !== entry.channels) {
        this.removeInstance(instance);
        instance = null;
      }
      if (!instance) {
        instance = this.createInstance(entry);
      }
      instance.frame = entry.frame;
      instance.chStart = entry.chStart;
      instance.force = true;
    });
    this.instances.forEach((instance, id) => {
      if (!seen.has(id)) {
        this.removeInstance(instance);
      }
    });
    this.onChange();
  }

  /**
   * Creates the 3D instance of a patch entry
   *
   * @private
   * @param {Object} entry Patch snapshot entry
   * @returns {Object} Rendered fixture
   */
  createInstance(entry) {
    const { channels, physical, wheels } = entry;
    // OFL moving heads keep their model; everything else is drawn from a geometry tree
    const pixels = channels.some((channel) => channel.geometry);
    if (entry.geometry || entry.category !== 'Moving Head' || pixels) {
      return this.createGeometryInstance(entry);
    }
    // Only one gobo wheel is drawn: the fixture's first
    const goboWheel = findWheel(wheels, /gobo/i);
    const tilt = channels.find((channel) => channel.type === 'Tilt');
    const pan = channels.find((channel) => channel.type === 'Pan');
    const zoom = channels.find((channel) => channel.type === 'Zoom');
    const range = (channel) => (channel && channel.capabilities.length
      ? [channel.capabilities[0].min, channel.capabilities[channel.capabilities.length - 1].max]
      : [0, 0]);
    const model = new MovingHead({
      minAngle: physical.lens ? physical.lens.degreesMinMax[0] : 10,
      maxAngle: physical.lens ? physical.lens.degreesMinMax[1] : 25,
      minTilt: range(tilt)[0],
      maxTilt: range(tilt)[1],
      minPan: range(pan)[0],
      maxPan: range(pan)[1],
      colorTemp: physical.bulb ? physical.bulb.colorTemperature : undefined,
      intensity: 0.0,
      pan: 128,
      tilt: 128,
      colorWheel: wheels['Color Wheel'] ? wheels['Color Wheel'].slots : [],
      goboWheel: goboWheel ? wheels[goboWheel].slots : [],
      zoomInPercent: FixtureRenderer.zoomInPercent(zoom),
    });
    model.position = { ...entry.position };
    model.rotation = { ...entry.rotation };
    const instance = {
      id: entry.id,
      model,
      handle: new FixtureHandle(entry.id, model),
      channels,
      goboWheel,
      last: new Uint8Array(channels.length),
      frame: entry.frame,
      chStart: entry.chStart,
      force: true,
    };
    this.instances.set(entry.id, instance);
    return instance;
  }

  /**
   * Creates the 3D instance of a fixture drawn from its geometry tree (GDTF, or built from its
   * OFL facts)
   *
   * @private
   * @param {Object} entry Patch snapshot entry
   * @returns {Object} Rendered fixture
   */
  createGeometryInstance(entry) {
    const {
      channels, wheels, matrix, images,
    } = entry;
    const geometry = entry.geometry || synthesizeGeometry(entry, channels);
    const model = new GeometryFixture({
      geometry,
      channels,
      wheels,
      matrix,
      images,
      centerAngles: !entry.geometry,
      lens: entry.physical && entry.physical.lens ? entry.physical.lens.degreesMinMax : null,
      zoomInPercent: FixtureRenderer.zoomInPercent(channels.find((c) => c.type === 'Zoom')),
    });
    model.position = { ...entry.position };
    model.rotation = { ...entry.rotation };
    const instance = {
      id: entry.id,
      model,
      handle: new FixtureHandle(entry.id, model),
      channels,
      goboWheel: null,
      last: new Uint8Array(channels.length),
      frame: entry.frame,
      chStart: entry.chStart,
      force: true,
    };
    this.instances.set(entry.id, instance);
    return instance;
  }

  /**
   * Whether a zoom channel's values are a percentage of the lens range (OFL "narrow" / "wide"
   * presets decode to 1 / 100) rather than field angles in degrees
   *
   * @private
   * @param {?Object} channel Zoom channel
   * @returns {Boolean} Whether zoom values are percentages
   */
  static zoomInPercent(channel) {
    if (!channel) return false;
    const presets = [0, 1, 100];
    return channel.capabilities.every((capability) => {
      const entity = capability.entities && capability.entities.zoom;
      return !entity || [entity.start, entity.end, entity.value]
        .every((v) => v === undefined || presets.includes(v));
    });
  }

  /**
   * Removes a rendered fixture
   *
   * @private
   * @param {Object} instance Rendered fixture
   */
  removeInstance(instance) {
    if (Controls.pooledInstances.includes(instance.handle)) {
      // The fixture is going away: don't report its position back while detaching
      instance.handle.silent = true;
      Controls.detachAll();
    }
    if (instance.model instanceof GeometryFixture) instance.model.dispose();
    else MovingHead.deleteInstance(instance.model);
    this.instances.delete(instance.id);
  }

  /**
   * Applies a fixture's position (meter) and rotation (radian)
   *
   * @public
   * @param {Object} pose fixture_pose event payload
   * @param {Number} pose.id Fixture id
   * @param {Object} pose.position Position in meters
   * @param {Object} pose.rotation Rotation in radians
   * @param {Boolean} pose.reattach Whether the gizmo is re-attached to the fixture
   */
  setPose({
    id, position, rotation, reattach,
  }) {
    const instance = this.instances.get(id);
    if (!instance) return;
    if (reattach) {
      // Detaching writes the gizmo group's positions back: keep this fixture's old position
      // from overwriting the edit that triggered this pose
      instance.handle.silent = true;
      Controls.detach();
      instance.handle.silent = false;
    }
    instance.model.position = { ...position };
    instance.model.rotation = { ...rotation };
    if (reattach) {
      Controls.attach(instance.handle);
    }
    this.onChange();
  }

  /**
   * Highlights a fixture, optionally moving the gizmo with it
   *
   * @public
   * @param {Object} highlight fixture_highlight event payload
   * @param {Number} highlight.id Fixture id
   * @param {Boolean} highlight.state Highlight state
   * @param {Boolean} highlight.single Whether other fixtures are unhighlighted
   * @param {Boolean} highlight.center Whether the gizmo follows the highlight
   */
  highlight({
    id, state, single, center,
  }) {
    const instance = this.instances.get(id);
    if (!instance) return;
    if (single) {
      this.instances.forEach((other) => { other.model.highlighted = false; });
      instance.model.highlighted = state;
      if (state && center) {
        Controls.detachAll();
        Controls.attach(instance.handle);
      } else if (!state) {
        Controls.detachAll();
        Controls.setFocus(false);
      }
    } else {
      instance.model.highlighted = state;
      if (center) {
        if (state) {
          Controls.attach(instance.handle);
        } else {
          Controls.detach(instance.handle);
        }
      }
    }
    this.onChange();
  }

  /**
   * Decodes the fixtures whose DMX bytes changed since the last rendered frame
   *
   * @public
   * @returns {Boolean} Whether a fixture changed
   */
  update() {
    let any = false;
    this.instances.forEach((instance) => {
      const { frame, chStart, last } = instance;
      let changed = instance.force;
      for (let i = 0; i < last.length; i++) {
        const value = frame[chStart + i];
        if (value !== last[i]) {
          last[i] = value;
          changed = true;
        }
      }
      if (changed) {
        instance.force = false;
        any = true;
        FixtureRenderer.decode(instance);
      }
    });
    return any;
  }

  /**
   * Pushes every channel of a fixture to its 3D instance, in mode order, channel 0 first
   * (any change resets the colour preset before the channels re-apply it)
   *
   * @private
   * @param {Object} instance Rendered fixture
   */
  static decode(instance) {
    const {
      model, channels, last, goboWheel,
    } = instance;
    if (model instanceof GeometryFixture) {
      model.decode(last);
      return;
    }
    model.colorPreset = null;
    model.resetCapabilityValues();
    for (let id = 0; id < channels.length; id++) {
      const channel = channels[id];
      const value = last[id];
      const index = channel.lookup ? channel.lookup[value] : NO_CAPABILITY;
      const capability = index === NO_CAPABILITY ? null : channel.capabilities[index];
      if (capability) {
        const values = capability.getValue(value);
        switch (capability.type) {
          case CAPABILITY_TYPES.ColorIntensity:
            model.colorIntensity = values;
            break;
          case CAPABILITY_TYPES.WheelSlot:
            if (channel.type === WHEEL_CHANNEL_TYPES.COLOR_WHEEL) {
              model.colorWheelSlot = Math.floor(values.slotNumber) - 1.0;
            } else if ((channel.attribute === GOBO_ATTRIBUTE
              || channel.type === WHEEL_CHANNEL_TYPES.GOBO_WHEEL)
              && (values.wheel || channel.type) === goboWheel) {
              model.goboWheelSlot = Math.floor(values.slotNumber) - 1.0;
            }
            break;
          case CAPABILITY_TYPES.ColorPreset:
            model.colorPreset = values.color ? values.color[0] : null;
            break;
          default: {
            const { valueKeys } = capability;
            for (let k = 0; k < valueKeys.length; k++) {
              model[valueKeys[k]] = values[valueKeys[k]];
            }
            break;
          }
        }
      }
    }
  }
}

export default FixtureRenderer;
