<template>
  <uk-popup
    v-model="state"
    :valid="fixtures.length > 0"
    :header="headerData"
    @submit="apply"
    @input="update()"
  >
    <template #actions>
      <uk-button
        label="apply"
        title="Keeps this arrangement and goes on from it"
        class="arrange_commit"
        square
        :disabled="!changed"
        @click="commit"
      />
    </template>
    <uk-flex
      :gap="12"
      class="arrange_popup"
    >
      <div class="arrange_modes">
        <uk-list
          :items="modeItems"
          :selection="[mode]"
          no-highlight
          filterable
          @selection="pickMode"
        />
      </div>
      <div class="arrange_side">
        <!-- What the mode does, apart from its settings -->
        <div class="arrange_heading">
          <uk-icon
            class="arrange_heading_icon"
            :name="current.icon"
          />
          <div>
            <div class="arrange_heading_title">
              {{ current.name }}
            </div>
            <div class="arrange_heading_text">
              {{ current.description }}
            </div>
          </div>
        </div>
        <!-- One row per setting: its name, then its inputs (X, Y, Z coloured) -->
        <div
          v-for="row in current.rows"
          :key="row.label"
          class="arrange_row"
        >
          <div class="arrange_row_label">
            {{ row.label }}
          </div>
          <uk-flex :gap="4">
            <template
              v-for="field in row.fields"
              :key="field.key"
            >
              <uk-select-input
                v-if="field.options"
                class="arrange_select"
                :class="`arrange_${field.key}`"
                :model-value="field.options.indexOf(settings[mode][field.key])"
                :options="field.options.map((option) => field.names[option])"
                @update:model-value="(index) => set(field.key, field.options[index])"
              />
              <uk-num-input
                v-else
                class="arrange_num"
                :class="`arrange_${field.key}`"
                :title="field.title"
                :color="field.color"
                :model-value="settings[mode][field.key]"
                :precision="field.precision ?? 1"
                :min="field.min ?? -1000"
                :max="field.max ?? 1000"
                @update:model-value="(value) => set(field.key, value)"
              />
            </template>
          </uk-flex>
        </div>
      </div>
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';
import { ARRANGE, extent } from '@/views/utils/placement';

const AXIS = {
  options: ['x', 'y', 'z'],
  names: { x: 'X', y: 'Y', z: 'Z' },
};
/** Axis colours, as in the Position Tool */
const COLOR = {
  x: 'var(--accent-maroon)',
  y: 'var(--accent-teal)',
  z: 'var(--accent-blue)',
};
const axisFields = (prefix, axes, title) => axes.map((axis) => ({
  key: `${prefix}${axis.toUpperCase()}`,
  color: COLOR[axis],
  title: `${title} ${axis.toUpperCase()}`,
}));
const CIRCLE_ROWS = [
  { label: 'Radius (m)', fields: [{ key: 'radius', min: 0 }] },
  { label: 'Centre (X, Y, Z)', fields: axisFields('centre', ['x', 'y', 'z'], 'Centre') },
  {
    label: 'Plane',
    fields: [{
      key: 'plane',
      options: ['floor', 'upright'],
      names: { floor: 'Floor (X, Y)', upright: 'Upright (X, Z)' },
    }],
  },
  {
    label: 'Facing',
    fields: [{
      key: 'facing',
      options: ['keep', 'in', 'out'],
      names: { keep: 'Unchanged', in: 'The centre', out: 'Away from the centre' },
    }],
  },
];
const DEGREES = { precision: 0, min: -360, max: 360 };

/**
 * Arrange modes: name, icon, description and settings, in rows
 *
 * @constant {Array<Object>}
 */
const MODES = [
  {
    id: 'line',
    icon: 'arrange_line',
    name: 'Line',
    description: 'Evenly along an axis, at a spacing, around a centre.',
    rows: [
      { label: 'Axis', fields: [{ key: 'axis', ...AXIS }] },
      { label: 'Spacing (m)', fields: [{ key: 'spacing' }] },
      { label: 'Centre (m)', fields: [{ key: 'centre' }] },
    ],
  },
  {
    id: 'grid',
    icon: 'arrange_grid',
    name: 'Grid',
    description: 'In rows of a number of columns on the floor, around a centre.',
    rows: [
      {
        label: 'Columns',
        fields: [{
          key: 'columns', precision: 0, min: 1, max: 512,
        }],
      },
      { label: 'Spacing (X, Y)', fields: axisFields('spacing', ['x', 'y'], 'Spacing') },
      { label: 'Centre (X, Y)', fields: axisFields('centre', ['x', 'y'], 'Centre') },
    ],
  },
  {
    id: 'circle',
    icon: 'arrange_circle',
    name: 'Circle',
    description: 'Evenly on a circle, on the floor or upright facing the audience.',
    rows: CIRCLE_ROWS,
  },
  {
    id: 'arc',
    icon: 'arrange_arc',
    name: 'Arc',
    description: 'Evenly on part of a circle, from a start to an end angle (0° on +X).',
    rows: [
      ...CIRCLE_ROWS,
      {
        label: 'Angles (°)',
        fields: [
          { key: 'start', title: 'Start', ...DEGREES },
          { key: 'end', title: 'End', ...DEGREES },
        ],
      },
    ],
  },
  {
    id: 'align',
    icon: 'arrange_align',
    name: 'Align',
    description: 'All at the lowest, centre or highest value of the selection on an axis.',
    rows: [
      { label: 'Axis', fields: [{ key: 'axis', ...AXIS }] },
      {
        label: 'To',
        fields: [{
          key: 'to',
          options: ['min', 'centre', 'max'],
          names: { min: 'Lowest', centre: 'Centre', max: 'Highest' },
        }],
      },
    ],
  },
  {
    id: 'distribute',
    icon: 'arrange_distribute',
    name: 'Distribute',
    description: 'Even gaps between the two outermost fixtures on an axis.',
    rows: [{ label: 'Axis', fields: [{ key: 'axis', ...AXIS }] }],
  },
  {
    id: 'fan',
    icon: 'arrange_fan',
    name: 'Fan',
    description: 'Spreads the rotations evenly from −angle to +angle about an axis.',
    rows: [
      { label: 'About', fields: [{ key: 'axis', ...AXIS }] },
      {
        label: 'Angle (°)',
        fields: [{
          key: 'angle', precision: 0, min: 0, max: 180,
        }],
      },
    ],
  },
  {
    id: 'aim',
    icon: 'arrange_aim',
    name: 'Aim',
    description: 'Turns every fixture to point its beam at one point.',
    rows: [{ label: 'Point (X, Y, Z)', fields: axisFields('target', ['x', 'y', 'z'], 'Point') }],
  },
];

/**
 * Settings → arguments of the placement function
 *
 * @param {String} mode
 * @param {Object} s settings
 * @returns {Object}
 */
function argsOf(mode, s) {
  if (mode === 'circle' || mode === 'arc') {
    return {
      ...s,
      centre: { x: s.centreX, y: s.centreY, z: s.centreZ },
    };
  }
  if (mode === 'aim') return { target: { x: s.targetX, y: s.targetY, z: s.targetZ } };
  return s;
}

/**
 * @component ArrangePopup Places the selected fixtures in a line, grid, circle or arc, aligns,
 * distributes, fans or aims them. A draft: fixtures move live, Cancel restores them.
 */
export default {
  name: 'UniverseModifierPopupArrange',
  compatConfig: {
    MODE: 3,
  },
  mixins: [PopupMixin],
  props: {
    /**
     * Fixtures to arrange, in fixture pool order
     */
    fixtures: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      headerData: { title: 'Arrange' },
      /**
       * Mode in use
       */
      mode: 'line',
      /**
       * Settings of each mode
       */
      settings: {},
      /**
       * Poses when the popup opened
       */
      snapshot: [],
      /**
       * Fixtures the snapshot belongs to
       */
      arranged: [],
      /**
       * Whether OK kept the draft
       */
      applied: false,
      /**
       * Whether a setting or the mode changed since opening or the last Apply
       */
      changed: false,
    };
  },
  computed: {
    /**
     * Mode list items
     */
    modeItems() {
      return MODES.map(({ id, name, icon }) => ({ id, name, icon }));
    },
    /**
     * Mode in use, with its fields
     */
    current() {
      return MODES.find(({ id }) => id === this.mode);
    },
  },
  watch: {
    state(open) {
      if (open) this.init();
      else this.restore();
    },
  },
  mounted() {
    if (this.state) this.init();
  },
  beforeUnmount() {
    this.restore();
  },
  methods: {
    /**
     * Snapshots the poses and fills each mode's settings from the selection
     *
     * @public
     */
    init() {
      this.applied = false;
      this.changed = false;
      this.arranged = [...this.fixtures];
      this.snapshot = this.arranged.map((fixture) => ({
        position: fixture.position,
        rotation: fixture.rotation,
      }));
      if (!this.snapshot.length) return;
      const x = extent(this.snapshot, 'x');
      const y = extent(this.snapshot, 'y');
      const z = extent(this.snapshot, 'z');
      const round = (value) => Math.round(value * 10) / 10;
      const circle = {
        radius: 2,
        centreX: round(x.centre),
        centreY: round(y.centre),
        centreZ: round(z.centre),
        plane: 'floor',
        facing: 'keep',
      };
      this.settings = {
        line: { axis: 'x', spacing: 1, centre: round(x.centre) },
        grid: {
          columns: Math.ceil(Math.sqrt(this.snapshot.length)),
          spacingX: 1,
          spacingY: 1,
          centreX: round(x.centre),
          centreY: round(y.centre),
        },
        circle,
        arc: { ...circle, start: 0, end: 180 },
        align: { axis: 'x', to: 'centre' },
        distribute: { axis: 'x' },
        fan: { axis: 'y', angle: 30 },
        aim: { targetX: 0, targetY: 0, targetZ: 0 },
      };
      this.preview();
    },
    /**
     * Picks a mode from the list
     *
     * @public
     * @param {Array<Object>} items selected list items
     */
    pickMode(items) {
      if (!items.length) return;
      if (items[0].id === this.mode) return;
      this.mode = items[0].id;
      this.changed = true;
      this.preview();
    },
    /**
     * Changes a setting of the mode in use
     *
     * @public
     * @param {String} key
     * @param {*} value
     */
    set(key, value) {
      if (value == null || Number.isNaN(value)) return;
      this.settings[this.mode][key] = value;
      this.changed = true;
      this.preview();
    },
    /**
     * Moves the fixtures to the mode's result, from the poses they had on opening
     *
     * @public
     */
    preview() {
      if (!this.snapshot.length || !this.settings[this.mode]) return;
      const poses = ARRANGE[this.mode](this.snapshot, argsOf(this.mode, this.settings[this.mode]));
      this.write(poses);
    },
    /**
     * Writes poses to the arranged fixtures
     *
     * @public
     * @param {Array<Object>} poses
     */
    write(poses) {
      this.arranged.forEach((fixture, i) => {
        // A fixture deleted while the popup is open is skipped
        if (fixture && poses[i]) fixture.setPose(poses[i].position, poses[i].rotation);
      });
    },
    /**
     * Keeps the arrangement shown and goes on from it: the next mode starts from these poses, and
     * Cancel comes back to them
     *
     * @public
     */
    commit() {
      this.changed = false;
      this.snapshot = this.arranged.map((fixture) => ({
        position: { ...fixture.position },
        rotation: { ...fixture.rotation },
      }));
    },
    /**
     * Keeps the draft
     *
     * @public
     */
    apply() {
      this.applied = true;
      this.close();
    },
    /**
     * Puts every fixture back as it was on opening, unless OK kept the draft
     *
     * @public
     */
    restore() {
      if (!this.applied && this.snapshot.length) this.write(this.snapshot);
      this.snapshot = [];
      this.arranged = [];
    },
  },
};
</script>

<style scoped>
/* As tall as the mode list: its search box and one row per mode */
.arrange_popup {
  height: calc(9 * var(--row-height));
}
/* The footer's border closes the list: no second line under the last mode */
.arrange_modes :deep(.uikit_list_item:last-child) {
  border-bottom-color: transparent;
}
.arrange_modes {
  width: 160px;
  border-right: var(--border-width) solid var(--primary-dark);
}
.arrange_side {
  flex: 1;
  width: 330px;
  overflow-y: auto;
  padding-right: var(--space-5);
}
.arrange_heading {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  padding: var(--space-5) 0 var(--space-4);
  margin-bottom: var(--space-4);
  border-bottom: var(--border-width) solid var(--primary-dark);
}
.arrange_heading_icon {
  flex-shrink: 0;
  width: var(--icon-lg) !important;
  height: var(--icon-lg) !important;
  fill: var(--secondary-lighter);
}
.arrange_heading_title {
  font-family: Roboto-Medium;
  font-size: var(--font-md);
  color: var(--secondary-lighter);
}
.arrange_heading_text {
  margin-top: var(--space-2);
  font-family: Roboto-Regular;
  font-size: var(--font-sm);
  color: var(--secondary-light);
  white-space: normal;
}
.arrange_row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: var(--control-height);
  margin-bottom: var(--space-4);
}
.arrange_row_label {
  font-family: Roboto-Medium;
  font-size: var(--font-sm);
  color: var(--secondary-lighter);
}
.arrange_num {
  width: 64px;
}
.arrange_select {
  width: 160px;
}
</style>
