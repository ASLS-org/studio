<template>
  <uk-widget
    class="position_tool"
    dockable
    :header="header"
    :action="fixtures.length ? action : null"
  >
    <div
      v-if="fixtures.length"
      class="position_tool_body"
    >
      <!-- Where: the stage from above, flush with the widget like the pan/tilt grid -->
      <stage-map
        class="position_tool_map"
        :fixtures="universeFixtures"
        :others="others"
        :selection="selectedIds"
        @selection="(ids) => $emit('selection', ids)"
        @drag-start="snapshot = poses()"
        @drag="moveBy"
        @drag-end="snapshot = null"
      />
      <!-- X, Y, Height down the left; the mounts beside X and Y; turn and tilt beside Height -->
      <div class="position_tool_fields">
        <uk-num-input
          v-for="field in POSITION_FIELDS"
          :key="field.axis"
          :model-value="shared('position', field.axis)"
          :color="field.color"
          :precision="2"
          :min="-1000"
          :max="1000"
          :label="field.label"
          :title="field.title"
          placeholder="--"
          relative
          :class="['position_tool_position', `position_tool_position_${field.axis}`]"
          @update:model-value="(value) => setAxis('position', field.axis, value)"
          @step="(delta) => nudge('position', field.axis, delta * 10)"
        />
        <!-- The mounts as one block: 2 per row -->
        <div class="position_tool_mount_field">
          <!-- v-text: no whitespace before the label's colon -->
          <div
            class="label"
            v-text="'Mount'"
          />
          <div class="position_tool_mounts">
            <!-- Keyed by state too: a click on the mount in use keeps it lit -->
            <uk-button
              v-for="m in MOUNTS"
              :key="`${m.id}-${orientation.mount === m.id}`"
              :icon="m.icon"
              :title="m.name"
              square
              toggleable
              color="var(--accent-blue)"
              :model-value="orientation.mount === m.id"
              :class="['position_tool_mount', `position_tool_mount_${m.id}`]"
              @click="setMount(m.id)"
            />
          </div>
        </div>
        <uk-num-input
          v-for="field in ORIENTATION_FIELDS"
          :key="field.key"
          :model-value="orientation[field.key]"
          :precision="0"
          :min="-180"
          :max="180"
          :label="field.label"
          :title="field.title"
          placeholder="--"
          relative
          :class="['position_tool_orientation', `position_tool_${field.key}`]"
          @update:model-value="(value) => setOrientation(field.key, value)"
          @step="(delta) => nudgeOrientation(field.key, delta * 5)"
        />
      </div>
    </div>
  </uk-widget>
</template>

<script>
import { MOUNTS, mountOf, mountRotation } from '@/views/utils/placement';
import StageMap from './universe.modifier.stage.map.vue';

/**
 * Position fields
 *
 * @constant {Array<Object>}
 */
const POSITION_FIELDS = [
  {
    axis: 'x', label: 'X m', title: 'Left (−) to right (+), as the audience sees it', color: 'var(--accent-maroon)',
  },
  {
    axis: 'y', label: 'Y m', title: 'Audience (−) to back of the stage (+)', color: 'var(--accent-teal)',
  },
  {
    axis: 'z', label: 'Height m', title: 'Up from the floor', color: 'var(--accent-blue)',
  },
];

/**
 * Orientation fields, next to the position fields' rows Y and Height
 *
 * @constant {Array<Object>}
 */
const ORIENTATION_FIELDS = [
  { key: 'turn', label: 'Turn °', title: 'Turns the fixture on its base' },
  { key: 'tilt', label: 'Tilt °', title: "Leans the beam away from the mount's axis" },
];

/**
 * Value shared by every item, or null when they differ
 *
 * @param {Array<Number|String>} values
 * @returns {?(Number|String)}
 */
function sharedValue(values) {
  const first = values[0];
  const same = values.every((value) => (typeof first === 'number'
    ? Math.abs(value - first) < 1e-6
    : value === first));
  return same ? first : null;
}

/**
 * @component PositionTool Places the selected fixtures on stage: a map of the stage seen from
 * above (drag to move), their position, how they are mounted, turned and tilted, and the
 * Arrange popup (header button)
 */
export default {
  name: 'UniverseModifierWidgetPositionTool',
  compatConfig: {
    MODE: 3,
  },
  components: {
    StageMap,
  },
  props: {
    /**
     * Selected fixtures, in fixture pool order
     */
    fixtures: {
      type: Array,
      default: () => [],
    },
    /**
     * Every fixture of the universe (on the map)
     */
    universeFixtures: {
      type: Array,
      default: () => [],
    },
    /**
     * Fixtures of the other universes (faint on the map)
     */
    others: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['arrange', 'selection'],
  data() {
    return {
      /**
       * Header button
       */
      action: {
        text: 'Arrange',
        icon: 'grid',
        callback: () => this.$emit('arrange'),
      },
      /**
       * Poses when a map drag started
       */
      snapshot: null,
      /**
       * Ids of the selection, replaced only when they change: the map doesn't redraw each time
       * the selection is resolved again (on every panel switch)
       */
      selectedIds: this.fixtures.map((fixture) => fixture.id),
    };
  },
  computed: {
    /**
     * Widget header: the selection count when there are several
     *
     * @type {Object}
     */
    header() {
      const count = this.fixtures.length;
      return {
        title: count > 1 ? `Position Tool (${count})` : 'Position Tool',
        icon: 'move',
      };
    },
    /**
     * Mount, turn and tilt the selection shares (null where they differ)
     *
     * @type {Object} `{ mount, turn, tilt }`
     */
    orientation() {
      const all = this.fixtures.map((fixture) => mountOf(fixture.rotation));
      const mount = sharedValue(all.map((o) => o.mount));
      return {
        mount,
        turn: mount ? sharedValue(all.map((o) => o.turn)) : null,
        tilt: mount ? sharedValue(all.map((o) => o.tilt)) : null,
      };
    },
  },
  watch: {
    fixtures(fixtures) {
      const ids = fixtures.map((fixture) => fixture.id);
      const last = this.selectedIds;
      if (last.length !== ids.length || last.some((id, i) => id !== ids[i])) this.selectedIds = ids;
    },
  },
  created() {
    this.POSITION_FIELDS = POSITION_FIELDS;
    this.ORIENTATION_FIELDS = ORIENTATION_FIELDS;
    this.MOUNTS = MOUNTS;
  },
  methods: {
    /**
     * Value every selected fixture shares on an axis, or null when they differ
     *
     * @public
     * @param {String} key 'position' or 'rotation'
     * @param {String} axis 'x', 'y' or 'z'
     * @returns {?Number}
     */
    shared(key, axis) {
      return sharedValue(this.fixtures.map((fixture) => fixture[key][axis]));
    },
    /**
     * Writes poses to the selection
     *
     * @public
     * @param {Array<Object>} poses `{ position, rotation }` per selected fixture
     */
    applyPoses(poses) {
      this.fixtures.forEach((fixture, i) => fixture.setPose(poses[i].position, poses[i].rotation));
    },
    /**
     * Current poses of the selection
     *
     * @public
     * @returns {Array<Object>}
     */
    poses() {
      return this.fixtures.map((fixture) => ({
        position: { ...fixture.position },
        rotation: { ...fixture.rotation },
      }));
    },
    /**
     * Sets one axis on every selected fixture
     *
     * @public
     * @param {String} key 'position' or 'rotation'
     * @param {String} axis
     * @param {Number} value
     */
    setAxis(key, axis, value) {
      if (value == null || Number.isNaN(value)) return;
      this.applyPoses(this.poses().map((pose) => {
        pose[key][axis] = value;
        return pose;
      }));
    },
    /**
     * Adds a step to one axis of every selected fixture, from its own value
     *
     * @public
     * @param {String} key 'position' or 'rotation'
     * @param {String} axis
     * @param {Number} delta
     */
    nudge(key, axis, delta) {
      this.applyPoses(this.poses().map((pose) => {
        pose[key][axis] = Math.round((pose[key][axis] + delta) * 100) / 100;
        return pose;
      }));
    },
    /**
     * Moves the selection on the floor from where a map drag started
     *
     * @public
     * @param {Object} delta `{ x, y }` in metres
     */
    moveBy(delta) {
      if (!this.snapshot) return;
      this.applyPoses(this.snapshot.map((pose) => ({
        position: {
          ...pose.position,
          x: Math.round((pose.position.x + delta.x) * 100) / 100,
          y: Math.round((pose.position.y + delta.y) * 100) / 100,
        },
        rotation: pose.rotation,
      })));
    },
    /**
     * Rewrites each selected fixture's rotation from its mount, turn and tilt
     *
     * @public
     * @param {Function} change `(orientation) => orientation`, per fixture
     */
    orient(change) {
      this.applyPoses(this.poses().map((pose) => {
        const o = change(mountOf(pose.rotation));
        return { position: pose.position, rotation: mountRotation(o.mount, o.turn, o.tilt) };
      }));
    },
    /**
     * Mounts every selected fixture one way, keeping its turn and tilt
     *
     * @public
     * @param {String} mount a `MOUNTS` id
     */
    setMount(mount) {
      this.orient((o) => ({ ...o, mount }));
    },
    /**
     * Sets the turn or the tilt of every selected fixture
     *
     * @public
     * @param {String} key 'turn' or 'tilt'
     * @param {Number} value degrees
     */
    setOrientation(key, value) {
      if (value == null || Number.isNaN(value)) return;
      this.orient((o) => ({ ...o, [key]: value }));
    },
    /**
     * Adds degrees to the turn or the tilt of every selected fixture
     *
     * @public
     * @param {String} key 'turn' or 'tilt'
     * @param {Number} delta degrees
     */
    nudgeOrientation(key, delta) {
      this.orient((o) => ({ ...o, [key]: o[key] + delta }));
    },
  },
};
</script>

<style scoped>
.position_tool {
  min-width: 450px;
  max-width: 450px;
}
.position_tool_body {
  display: flex;
  height: 100%;
  width: 100%;
}
/* Square and flush, like the pan/tilt grid */
.position_tool_map {
  position: relative;
  top: -1px;
  left: -1px;
  height: 100%;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
}
/* Position down the first column; mounts over the next two, then turn and tilt */
.position_tool_fields {
  flex: 1;
  display: grid;
  grid-template-columns: 84px 1fr 1fr;
  grid-auto-flow: column;
  grid-template-rows: repeat(3, auto);
  align-content: start;
  gap: var(--space-5);
  padding: var(--space-5);
}
.position_tool_fields .uikit_num_input {
  width: 100%;
}
.position_tool_position {
  grid-column: 1;
}
/* Down to the bottom of the Y field */
.position_tool_mount_field {
  grid-column: 2 / 4;
  grid-row: 1 / 3;
  display: flex;
  flex-direction: column;
}
.position_tool_orientation {
  grid-row: 3;
}
.position_tool_turn {
  grid-column: 2;
}
.position_tool_tilt {
  grid-column: 3;
}
.position_tool_mounts {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: var(--space-1);
}
.position_tool_mount {
  min-width: 0;
  height: auto;
  padding: 0;
}
.position_tool_mount :deep(.uikit_button_icon) {
  margin-right: 0;
}
</style>
