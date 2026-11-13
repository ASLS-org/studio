import GeometryFixture from './geometry_fixture';
import { synthesizeGeometry } from './fixture_shapes';
import Controls from './controls';
import EventBus from '../eventbus';

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
   * @param {GeometryFixture} model Fixture's 3D instance
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
    /**
     * Quality level fixture meshes are drawn at, null for the generated parts
     *
     * @type {?String}
     */
    this.modelLevel = null;
  }

  /**
   * Draws every fixture's meshes at the detail of a quality level
   *
   * @public
   * @param {?String} level Quality level (see QUALITY_LEVELS)
   */
  setModelLevel(level) {
    if (level === this.modelLevel) return;
    this.modelLevel = level;
    this.instances.forEach((instance) => instance.model.setModelLevel(level));
    this.onChange();
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
    let selectionChanged = false;
    this.instances.forEach((instance, id) => {
      if (!seen.has(id)) {
        this.removeInstance(instance);
      }
    });
    // A selected fixture was rebuilt (or appeared): show the selection on its new instance
    const selected = this.selection?.ids || [];
    selected.forEach((id) => {
      const instance = this.instances.get(id);
      if (instance && !instance.model.highlighted) selectionChanged = true;
    });
    if (selectionChanged) this.setSelection(this.selection.ids, this.selection.gizmo);
    this.onChange();
  }

  /**
   * Creates the 3D instance of a patch entry, drawn from its geometry tree (GDTF, or built from
   * its OFL facts)
   *
   * @private
   * @param {Object} entry Patch snapshot entry
   * @returns {Object} Rendered fixture
   */
  createInstance(entry) {
    const {
      channels, wheels, matrix, images, models, type,
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
      models,
      type,
      onChange: () => this.onChange(),
    });
    model.setModelLevel(this.modelLevel);
    model.position = { ...entry.position };
    model.rotation = { ...entry.rotation };
    const instance = {
      id: entry.id,
      model,
      handle: new FixtureHandle(entry.id, model),
      channels,
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
    instance.model.dispose();
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
   * Shows a selection: exactly these fixtures are highlighted, and the move/rotate gizmo is
   * attached to them when asked (else detached). Kept, and re-applied when a patch rebuild
   * recreates one of them.
   *
   * @public
   * @param {Array<Number>} ids Selected fixture ids
   * @param {Boolean} gizmo Whether the gizmo follows the selection
   */
  setSelection(ids, gizmo) {
    this.selection = { ids: [...ids], gizmo };
    const wanted = new Set(ids);
    this.instances.forEach((instance, id) => {
      instance.model.highlighted = wanted.has(id);
    });
    Controls.detachAll();
    const attached = gizmo ? ids.map((id) => this.instances.get(id)).filter(Boolean) : [];
    if (attached.length) {
      attached.forEach((instance) => Controls.attach(instance.handle));
    } else {
      Controls.setFocus(false);
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
   * Pushes a fixture's DMX bytes to its 3D instance
   *
   * @private
   * @param {Object} instance Rendered fixture
   */
  static decode(instance) {
    instance.model.decode(instance.last);
  }
}

export default FixtureRenderer;
