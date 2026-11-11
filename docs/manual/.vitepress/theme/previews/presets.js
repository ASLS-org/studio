/*
 * Live preview presets: what <LivePreview preset="…"> mounts. Each one is a real Studio component
 * and the demo show objects it gets (public/presets/manual.showfile.json).
 *
 * The demo show is the home page's rig: universe 0 "Stage"; fixtures 0–3 "MAC Aura 1" to
 * "MAC Aura 4" (Standard mode, 14 channels, hung 6 m up at x = −4.5, −1.5, 1.5, 4.5); group 0
 * "Rig" with cues 0 "Warm wash" (scene), 1 "Rainbow" (effect), 2 "Ballyhoo" (effect), 3 "Sunset"
 * (scene) and chase 0 "Story" (8 bars, each cue 2 bars).
 *
 * Sizes are Studio's, measured in a 1440×900 window: the modifier strip is 239px tall and each
 * widget keeps its own width; the patch bay and the group pool are 620px tall. The preview shows
 * the component at that size on Studio's idle surface, scaled down to fit the page.
 *
 * Fields:
 * - title: the frame's title while paused or loading
 * - component: lazy import of the real .vue
 * - props(show): the component's props, from the demo show
 * - height: stage height (px). width: stage width (px; default: the component's own width)
 * - componentWidth / componentHeight: the component's box when it differs from the stage (a
 *   widget that fills its row in Studio; a demo whose popup needs more room than the widget)
 * - stage: the component next to the visualizer (StageWrap.vue), so readers see what it does to
 *   the rig; viewWidth sets the visualizer's width (default 480)
 * - fit: 'scale' (default: whole, scaled down to fit) or 'scroll' (panels wider than the page)
 * - route: initial path of the preview's router; with `panel`, the router view is the preview
 *   (Studio panels that read the route)
 * - warmRoute: where the router starts before going to `route`, for panels that read their route
 *   only when it changes (the group and chase panels: their route watchers aren't immediate)
 * - clock: true when it shows anything moving (Studio's clock runs while it's the active preview)
 * - demo: steps a fake cursor plays on the component (previews/demo.js); the reader watches. A
 *   demo plays its flow to the end; each loop starts again from the demo show
 * - video: the page's recording of it, played when the preview can't run
 * - webgl: needs WebGL (stage presets do too; without it, the video or a message)
 *
 * Nothing interactive that opens a hardware connection or saves files belongs here (no
 * connections widget or popup; the toolbar only as a demo, which points at its entries and
 * never runs one).
 */

/* eslint-disable import/no-unresolved -- resolved by the manual's Vite alias */
const fixture = (show, id) => show.fixturePool.getFromId(id);
const group = (show) => show.groupPool.getFromId(0);
const cue = (show, id) => group(show).cuePool.getFromId(id);
const chase = (show) => group(show).chasePool.getFromId(0);
const universe = (show) => show.universePool.getFromId(0);

/** Height of Studio's modifier strip, where every widget sits */
const STRIP = 239;
/** Stage height when a strip widget sits next to the visualizer */
const STAGE = 320;
/** Visualizer width next to a component */
const VIEW = 480;
/**
 * Stage width of a component with the visualizer beside it
 * @param {Number} width component width
 * @param {Number} [view=VIEW] visualizer width
 * @returns {Number} stage width
 */
const beside = (width, view = VIEW) => width + 16 + view;

const FixtureControl = () => import('./FixtureControl.vue');
const FixturePool = () => import('@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.fixture.pool.vue');
const PatchBay = () => import('@/views/activities/app/fragments/patch-bay/patch-bay.fragment.vue');
const GroupPool = () => import('@/views/activities/app/fragments/group-pool/group-pool.fragment.vue');
const CuePool = () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.modifier.widget.cuepool.vue');
const EffectModifier = () => import('@/views/activities/app/fragments/modifiers/group/group.effect.modifier.fragment.vue');
const Timeline = () => import('@/views/activities/app/fragments/modifiers/chase/_widgets/chase.modifier.widget.timeline.vue');
const UniverseModifier = () => import('@/views/activities/app/fragments/modifiers/universe/universe.modifier.fragment.vue');
const Toolbar = () => import('@/views/activities/app/fragments/toolbar/toolbar.fragment.vue');

/* ── Demo steps ─────────────────────────────────────────────────────── */

/** A fixture row in the patch bay (under its universe) */
const patchRow = (has) => ({ click: '.uikit_list_item.uikit_sublist_body', has });
/**
 * The patch bay opens a fixture in the universe panel, whose fixture pool outlines it in the
 * visualizer (with the move/rotate controls): without that panel, outline it here
 * @param {Show} show
 * @param {Object} to route
 */
const outlineFixture = (show, to) => {
  const id = Number(to.query.fixtureId);
  if (Number.isNaN(id) || !show.fixturePool.checkIfExists(id)) return;
  show.fixturePool.getFromId(id).highlightSingle(true, true);
};
/** A row in a widget's list */
const row = (has) => ({ click: '.uikit_list_item', has });
/** A cue's body in the cue pool (plays or stops it), by slot */
const cueBody = (nth) => ({ click: '.grid_item:not(.empty) .grid_item_body', nth });
/** A popup's button */
const popupButton = (has) => ({ click: '.popup .uikit_button', has });
/**
 * The fixture pool widget only asks for deletion: its panel deletes. As the universe panel does,
 * delete from the show
 * @param {Show} show
 * @returns {Function} delete handler
 */
const unpatch = (show) => (fixtures) => fixtures.forEach((f) => show.deleteFixture(f));
/**
 * As the group panel does: take the fixtures out of the group
 * @param {Show} show
 * @returns {Function} delete handler
 */
const ungroup = (show) => (fixtures) => fixtures.forEach((f) => group(show).deleteFixture(f));
/** Opens a toolbar menu */
const openMenu = (has) => ({ click: '.header_menu', has });
/** With a menu open, hovering another header switches to it (as in Studio) */
const hoverMenu = (has) => ({ move: '.header_menu', has });
/** Points at a menu entry (never clicks: entries run Studio actions) */
const pointEntry = (has) => ({ move: '.menu_list .uikit_list_item', has, after: 500 });

const FILE_MENU = [
  { caption: 'File' },
  openMenu('File'),
  { caption: null },
  pointEntry('New Showfile'),
  pointEntry('Load Showfile'),
  pointEntry('Save Showfile Locally'),
  pointEntry('Export Showfile'),
  { wait: 900 },
];
const PREFERENCES_MENU = [
  { caption: 'Preferences' },
  openMenu('Preferences'),
  { caption: null },
  pointEntry('Visualizer'),
  pointEntry('Outputs'),
  { wait: 900 },
];
/** The toolbar: a desktop-wide bar, shown at a typical width with room for its menus */
const TOOLBAR = {
  title: 'Toolbar',
  width: 760,
  height: 280,
  componentWidth: 760,
  componentHeight: 40,
  component: Toolbar,
  // Studio's clock runs, so the toolbar shows the show playing
  clock: true,
};

/**
 * Preset registry, by id
 * @type {Object<string, Object>}
 */
const PRESETS = {
  /* ── Trying a fixture (universe view), with the rig beside ── */
  'fixture-channels': {
    title: 'Channels',
    width: beside(742),
    height: STAGE,
    componentWidth: 742,
    componentHeight: STRIP,
    stage: true,
    component: FixtureControl,
    props: (show) => ({ fixture: fixture(show, 1), widget: 'channels' }),
    clock: true,
  },
  'fixture-color': {
    title: 'Color Picker',
    width: beside(560),
    height: STAGE,
    componentWidth: 560,
    componentHeight: STRIP,
    stage: true,
    component: FixtureControl,
    props: (show) => ({ fixture: fixture(show, 1), widget: 'color' }),
    clock: true,
  },
  'fixture-pantilt': {
    title: 'Pan/Tilt',
    width: beside(350),
    height: STAGE,
    componentWidth: 350,
    componentHeight: STRIP,
    stage: true,
    component: FixtureControl,
    props: (show) => ({ fixture: fixture(show, 1), widget: 'pantilt' }),
    clock: true,
  },
  'fixture-pool': {
    title: 'Fixture Pool',
    width: 250,
    height: STRIP,
    component: FixturePool,
    props: (show) => ({ pool: universe(show).fixturePool, onDelete: unpatch(show) }),
  },
  'group-fixture-pool': {
    title: 'Fixture Pool',
    width: 250,
    height: STRIP,
    component: FixturePool,
    props: (show) => ({ pool: group(show).fixturePool, onDelete: ungroup(show) }),
  },
  'fixture-settings': {
    title: 'Fixture Settings',
    width: 200,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/universe/_widgets/universe.modifier.widget.fixture.settings.vue'),
    props: (show) => ({ fixture: fixture(show, 0) }),
  },
  'fixture-position': {
    title: 'Position Tool',
    width: beside(170),
    height: STAGE,
    componentWidth: 170,
    componentHeight: STRIP,
    stage: true,
    component: () => import('@/views/activities/app/fragments/modifiers/universe/_widgets/universe.modifier.widget.fixture.position.tool.vue'),
    props: (show) => ({ fixture: fixture(show, 0) }),
    clock: true,
  },
  'universe-settings': {
    title: 'Universe',
    width: 250,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/universe/_widgets/universe.modifier.widget.settings.vue'),
    props: (show) => ({ modelValue: universe(show) }),
  },
  /* ── Groups and cues ── */
  'group-settings': {
    title: 'Group Settings',
    width: 150,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.modifier.widget.settings.vue'),
    props: (show) => ({ group: group(show) }),
  },
  'group-cuepool': {
    title: 'Cue Pool',
    width: beside(440),
    height: STAGE,
    componentWidth: 440,
    componentHeight: STRIP,
    stage: true,
    component: CuePool,
    props: (show) => ({ group: group(show) }),
    clock: true,
  },
  'cue-settings': {
    title: 'Cue Settings',
    width: 220,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.modifier.widget.cue.settings.vue'),
    props: (show) => ({ cue: cue(show, 3) }),
  },
  'scene-fixtures': {
    title: 'Scene Fixtures',
    width: 250,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.scene.modifier.widget.fixtures.vue'),
    props: (show) => ({ scene: cue(show, 3) }),
  },
  'scene-curve': {
    title: 'Fade in',
    width: 341,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.scene.modifier.widget.curve.vue'),
    props: (show) => ({ fade: cue(show, 3).fadeIn }),
  },
  'effect-channels': {
    title: 'Modulated Channels',
    width: 300,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.effect.modifier.widget.channels.vue'),
    props: (show) => ({ effect: cue(show, 2) }),
    clock: true,
  },
  'effect-wave': {
    title: 'Effect Tool',
    width: 665,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.effect.modifier.widget.wave.vue'),
    props: (show) => ({ channel: cue(show, 2).channels[0] }),
    clock: true,
  },
  'chase-timeline': {
    // Fills the rest of the strip in Studio: shown at a typical width
    title: 'Timeline',
    width: 760,
    componentWidth: 760,
    height: STRIP,
    component: Timeline,
    props: (show) => ({ pool: chase(show) }),
    route: '/group/0/chase/0',
    clock: true,
  },
  /* ── Panels ── */
  'patch-bay': {
    title: 'Patch Bay',
    width: beside(200, 520),
    height: 620,
    componentWidth: 200,
    componentHeight: 620,
    viewWidth: 520,
    stage: true,
    component: PatchBay,
    onRoute: outlineFixture,
    clock: true,
  },
  'group-pool': {
    title: 'Group Pool',
    width: beside(601, 520),
    height: 620,
    componentWidth: 601,
    componentHeight: 620,
    viewWidth: 520,
    stage: true,
    component: GroupPool,
    clock: true,
  },
  'universe-modifier': {
    title: 'Universe',
    height: STRIP,
    fit: 'scroll',
    component: UniverseModifier,
    route: '/universe/0',
    panel: true,
    clock: true,
  },
  'group-modifier': {
    title: 'Group',
    height: STRIP,
    fit: 'scroll',
    component: () => import('@/views/activities/app/fragments/modifiers/group/group.modifier.fragment.vue'),
    route: '/group/0',
    warmRoute: '/group/1',
    panel: true,
    clock: true,
  },
  'scene-modifier': {
    title: 'Scene',
    height: STRIP,
    fit: 'scroll',
    component: () => import('@/views/activities/app/fragments/modifiers/group/group.scene.modifier.fragment.vue'),
    props: (show) => ({ scene: cue(show, 3) }),
    clock: true,
  },
  'effect-modifier': {
    title: 'Effect',
    height: STRIP,
    fit: 'scroll',
    component: EffectModifier,
    props: (show) => ({ effect: cue(show, 2) }),
    clock: true,
  },
  'chase-modifier': {
    title: 'Chase',
    width: 1440,
    componentWidth: 1440,
    height: STRIP,
    fit: 'scroll',
    component: () => import('@/views/activities/app/fragments/modifiers/chase/chase.modifier.fragment.vue'),
    route: '/group/0/chase/0',
    warmRoute: '/group/1/chase/0',
    panel: true,
    clock: true,
  },
  /* ── Visualizer ── */
  visualizer: {
    title: 'Visualizer',
    width: 639,
    // The visualizer sizes its canvas from its box: give the box Studio's size
    componentWidth: 639,
    height: 580,
    component: () => import('./VisualizerPreview.vue'),
    webgl: true,
    clock: true,
  },
  'visualizer-modes': {
    // Select a fixture in the patch bay: the visualizer shows its transform controls; T, R, H
    title: 'Patch Bay',
    width: beside(200, 600),
    height: 520,
    componentWidth: 200,
    componentHeight: 520,
    viewWidth: 600,
    stage: true,
    component: PatchBay,
    onRoute: outlineFixture,
    demo: [
      { caption: 'Select a fixture' },
      patchRow('MAC Aura 2'),
      { wait: 1500 },
      { caption: 'T: move (arrows)' },
      { key: 't', global: true },
      { wait: 2500 },
      { caption: 'R: rotate (rings)' },
      { key: 'r', global: true },
      { wait: 2500 },
      { caption: 'H: hide the controls' },
      { key: 'h', global: true },
      { wait: 2200 },
      { key: 't', global: true },
      { caption: null },
    ],
  },
  /* ── On stage: a cue pool next to the visualizer, a cursor plays cues ── */
  'scene-stage': {
    // The rig's two scenes, one after the other: each fades in over its duration
    title: 'Cue Pool',
    width: beside(440, 560),
    height: 400,
    componentWidth: 440,
    componentHeight: STRIP,
    viewWidth: 560,
    stage: true,
    component: CuePool,
    props: (show) => ({ group: group(show) }),
    clock: true,
    demo: [
      { caption: 'Warm wash: fades in over 1 bar' },
      cueBody(0),
      { wait: 3800 },
      { caption: 'Sunset: fades in over 1 bar' },
      cueBody(3),
      { wait: 3800 },
      { caption: 'Warm wash again: the look changes back' },
      cueBody(0),
      { wait: 3600 },
      { caption: null },
    ],
  },
  'effect-stage': {
    // The rig's effects: a hue chase across the heads, then crossing circles in blue
    title: 'Cue Pool',
    width: beside(440, 560),
    height: 400,
    componentWidth: 440,
    componentHeight: STRIP,
    viewWidth: 560,
    stage: true,
    component: CuePool,
    props: (show) => ({ group: group(show) }),
    clock: true,
    demo: [
      cueBody(0),
      { caption: 'Rainbow: the hue cycles, one head after the other' },
      cueBody(1),
      { wait: 7000 },
      cueBody(1),
      { caption: 'Ballyhoo: pan and tilt draw crossing circles' },
      cueBody(2),
      { wait: 7000 },
      cueBody(2),
      { caption: null },
    ],
  },
  /* ── Demos: a cursor plays the flow on the real component, to the end ── */
  'patch-bay-select': {
    title: 'Patch Bay',
    width: beside(200, 520),
    height: 520,
    componentWidth: 200,
    componentHeight: 520,
    viewWidth: 520,
    stage: true,
    component: PatchBay,
    onRoute: outlineFixture,
    demo: [
      { caption: 'Click: one fixture' },
      patchRow('MAC Aura 1'),
      { wait: 1500 },
      { caption: 'Ctrl + click: add to the selection' },
      { ...patchRow('MAC Aura 3'), ctrl: true },
      { ...patchRow('MAC Aura 4'), ctrl: true },
      { wait: 2500 },
      { caption: null },
    ],
  },
  'patch-bay-filter': {
    title: 'Patch Bay',
    width: 200,
    height: 420,
    component: PatchBay,
    demo: [
      { caption: 'Type to filter' },
      { type: '.uikit_list_searchbox input', text: 'Aura 3' },
      { caption: null },
      { wait: 2200 },
    ],
  },
  'fixture-pool-delete': {
    title: 'Fixture Pool',
    width: beside(250),
    height: 420,
    componentWidth: 250,
    componentHeight: STRIP,
    stage: true,
    component: FixturePool,
    props: (show) => ({ pool: universe(show).fixturePool, onDelete: unpatch(show) }),
    clock: true,
    demo: [
      row('MAC Aura 4'),
      { caption: 'Delete or Backspace' },
      { key: 'Delete' },
      { wait: 1200 },
      { caption: 'Confirm: the fixture leaves the show' },
      popupButton('ok'),
      { wait: 2600 },
      { caption: null },
    ],
  },
  'group-fixture-pool-delete': {
    title: 'Fixture Pool',
    width: 520,
    height: 420,
    componentWidth: 250,
    componentHeight: STRIP,
    component: FixturePool,
    props: (show) => ({ pool: group(show).fixturePool, onDelete: ungroup(show) }),
    demo: [
      row('MAC Aura 4'),
      { caption: 'Delete or Backspace' },
      { key: 'Delete' },
      { wait: 1200 },
      { caption: 'Confirm: it leaves the group (it stays patched)' },
      popupButton('ok'),
      { wait: 2400 },
      { caption: null },
    ],
  },
  'patch-add': {
    // The universe view's fixture pool Add opens the patch popup (the patch bay's New doesn't
    // yet). A PAR is patched, hung at the front, and appears in the rig
    title: 'Universe',
    width: beside(345),
    height: 620,
    componentWidth: 345,
    componentHeight: STRIP,
    stage: true,
    component: UniverseModifier,
    route: '/universe/0',
    panel: true,
    clock: true,
    demo: [
      { caption: 'Add opens the patch popup' },
      { click: '.uikit_button', has: 'add' },
      { wait: 900 },
      { caption: 'Pick a fixture' },
      { click: '.popup .uikit_list_item', has: 'Bundled (GDTF)' },
      { click: '.popup .uikit_list_item', has: 'Generic PAR RGBW' },
      { wait: 900 },
      { caption: 'Place it: 4 m up, 3 m in front, hanging' },
      { field: 'Pos Y', text: '-3', within: '.popup' },
      { field: 'Pos Z', text: '4', within: '.popup' },
      { field: '°Rot X', text: '180', within: '.popup' },
      { caption: 'OK patches it' },
      popupButton('ok'),
      { wait: 1200 },
      { caption: 'In the fixture pool and on stage' },
      { wait: 600 },
      { caption: 'Select it: the visualizer outlines it, 3 m in front of the rig' },
      row('Generic PAR RGBW'),
      { wait: 2800 },
      { caption: null },
    ],
  },
  'cuepool-add': {
    // A new cue starts empty: played over Warm wash, it changes nothing until it is given values
    title: 'Cue Pool',
    width: beside(440, 520),
    height: 420,
    componentWidth: 440,
    componentHeight: STRIP,
    viewWidth: 520,
    stage: true,
    component: CuePool,
    props: (show) => ({ group: group(show) }),
    clock: true,
    demo: [
      { caption: 'Warm wash is playing' },
      cueBody(0),
      { wait: 2600 },
      { caption: 'Double click an empty slot: a new cue' },
      // Filled cues sit over their slot: the first free one is C-4
      { dblclick: '.grid_item.empty', has: 'C-4' },
      { wait: 900 },
      { caption: 'Name it' },
      { field: 'Name', text: 'Blackout', within: '.popup' },
      { caption: 'OK adds it to the pool, after Sunset' },
      popupButton('ok'),
      { wait: 1600 },
      { caption: 'Play it: the rig doesn\'t change, a new cue holds no values yet' },
      cueBody(4),
      { wait: 3600 },
      { caption: 'Its values are set in the scene editor (Scenes)' },
      { wait: 2600 },
      { caption: null },
    ],
  },

  'effect-channel-add': {
    // Rainbow plays (colour only); the Eight preset adds pan and tilt: the beams start drawing
    title: 'Effect',
    width: beside(760, 480),
    height: 520,
    componentWidth: 760,
    componentHeight: STRIP,
    viewWidth: 480,
    stage: true,
    component: EffectModifier,
    props: (show) => ({ effect: cue(show, 1) }),
    start: (show) => cue(show, 1).cue(true),
    clock: true,
    demo: [
      { caption: 'Rainbow plays: it only moves the colour' },
      { wait: 3000 },
      { caption: 'Add a modulated channel' },
      { click: '.uikit_button', has: 'add' },
      { wait: 900 },
      { caption: 'Pick a preset: pan & tilt, Eight' },
      { click: '.popup .uikit_list_item', has: 'pan & tilt' },
      { click: '.popup .uikit_list_item.uikit_sublist_body', has: 'Eight' },
      popupButton('ok'),
      { wait: 1000 },
      { caption: 'Pan and Tilt join the effect, over their whole range: beams sweep off stage' },
      { wait: 3500 },
      { caption: 'Narrow Pan: Min and Max bound the wave' },
      row('Pan'),
      { field: 'Min', text: '92' },
      { field: 'Max', text: '164' },
      { caption: 'Same for Tilt' },
      row('Tilt'),
      { field: 'Min', text: '104' },
      { field: 'Max', text: '152' },
      { caption: 'The beams now draw figures of eight on the floor, in rainbow colours' },
      { wait: 7000 },
      { caption: null },
    ],
  },

  'group-pool-new': {
    // A group for the two outer heads, then its fixtures shown on stage
    title: 'Group Pool',
    width: beside(601, 520),
    height: 620,
    componentWidth: 601,
    componentHeight: 620,
    viewWidth: 520,
    stage: true,
    component: GroupPool,
    clock: true,
    demo: [
      { caption: 'New' },
      { click: '.uikit_button', has: 'new' },
      { wait: 900 },
      { caption: 'Pick its fixtures: the two outer heads' },
      { click: '.popup .uikit_list_item.uikit_sublist_body', has: 'MAC Aura 1' },
      { click: '.popup .uikit_list_item.uikit_sublist_body', has: 'MAC Aura 4' },
      { caption: 'Name it' },
      { field: 'Name', text: 'Outer pair', within: '.popup' },
      { caption: 'OK creates it' },
      popupButton('ok'),
      { wait: 1400 },
      { caption: 'A new column: its own cues and chases, for those two heads only' },
      { wait: 3600 },
      { caption: null },
    ],
  },

  'chase-play': {
    // The Story chase from start to end: 8 bars, 16 s at 120 BPM
    title: 'Group Pool',
    width: beside(601, 520),
    height: 620,
    componentWidth: 601,
    componentHeight: 620,
    viewWidth: 520,
    stage: true,
    component: GroupPool,
    clock: true,
    demo: [
      { caption: 'Play the Story chase' },
      { click: '.uikit_chase_btn' },
      { caption: 'Warm wash, Rainbow, Ballyhoo, Sunset: 2 bars each' },
      { wait: 16500 },
      { caption: 'Click again to stop' },
      { click: '.uikit_chase_btn' },
      { wait: 1500 },
      { caption: null },
    ],
  },
  'master-row': {
    title: 'Group Pool',
    width: beside(601, 520),
    height: 620,
    componentWidth: 601,
    componentHeight: 620,
    viewWidth: 520,
    stage: true,
    component: GroupPool,
    clock: true,
    demo: [
      { caption: 'Master row 0: chase 0 of every group' },
      { click: '.uikit_chase.master .uikit_chase_btn' },
      { wait: 8500 },
      { caption: 'Again to stop' },
      { click: '.uikit_chase.master .uikit_chase_btn' },
      { wait: 1500 },
      { caption: null },
    ],
  },
  'timeline-add': {
    // The Story chase plays; a Sunset item is added in bar 1 over Warm wash, then removed
    title: 'Timeline',
    width: 760,
    componentWidth: 760,
    height: STRIP,
    component: Timeline,
    props: (show) => ({ pool: chase(show) }),
    route: '/group/0/chase/0',
    demo: [
      { caption: 'Double click a lane: a cue item (here Sunset, in bar 1)' },
      { dblclick: '.widget_pool_timeline_grid_row', nth: 3, x: 90 },
      { wait: 2600 },
      { caption: 'Drag its edges to resize it, its body to move it' },
      { wait: 2200 },
      { caption: 'Right click it to remove it' },
      { context: '.widget_pool_timeline_grid_row', nth: 3, x: 110 },
      { wait: 1800 },
      { caption: null },
    ],
  },

  /* ── Toolbar ── */
  'toolbar-menus': {
    ...TOOLBAR,
    demo: [
      ...FILE_MENU,
      { caption: 'Preferences' },
      hoverMenu('Preferences'),
      { caption: null },
      pointEntry('Visualizer'),
      pointEntry('Outputs'),
      { wait: 900 },
      { caption: 'About' },
      hoverMenu('About'),
      { caption: null },
      pointEntry('Manual'),
      pointEntry('License'),
      pointEntry('Credits'),
      { wait: 1200 },
    ],
  },
  'toolbar-file': { ...TOOLBAR, demo: FILE_MENU },
  'toolbar-preferences': { ...TOOLBAR, demo: PREFERENCES_MENU },
};

export default PRESETS;
