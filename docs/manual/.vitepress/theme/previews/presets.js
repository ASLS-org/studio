/*
 * Live preview presets: what <LivePreview preset="…"> mounts. Each one is a real Studio component
 * and the demo show objects it gets (public/presets/manual.showfile.json).
 *
 * Demo show ids: universe 0 "Stage"; fixtures 0–1 MAC Aura, 2 ColorBand Pix (12 cells),
 * 3–4 PAR; groups 0 "Moving heads" (cues 0 Open white, 1 Deep blue, 2 Circle, 3 Hue shift),
 * 1 "Pixel bar" (0 Amber, 1 Split, 2 Rainbow), 2 "PARs" (0 Red, 1 Teal, 2 Pulse); each group has
 * chase 0.
 *
 * Sizes are Studio's, measured in a 1440×900 window: the modifier strip is 239px tall and each
 * widget keeps its own width; the patch bay and the group pool are 620px tall. The preview shows
 * the component at that size on Studio's idle surface, scaled down to fit the page.
 *
 * Fields:
 * - title: the frame's title while loading (the component's own header once mounted)
 * - component: lazy import of the real .vue
 * - props(show): the component's props, from the demo show
 * - height: stage height (px). width: stage width (px; default: the component's own width)
 * - componentWidth / componentHeight: the component's box when it differs from the stage (a
 *   widget that fills its row in Studio; a demo whose popup needs more room than the widget)
 * - fit: 'scale' (default: whole, scaled down to fit) or 'scroll' (panels wider than the page)
 * - route: initial path of the preview's router; with `panel`, the router view is the preview
 *   (Studio panels that read the route)
 * - warmRoute: where the router starts before going to `route`, for panels that read their route
 *   only when it changes (the group and chase panels: their route watchers aren't immediate)
 * - clock: true when it shows anything moving (Studio's clock runs while it's visible)
 * - demo: steps a fake cursor plays on the component (previews/demo.js); the reader watches
 * - video: the page's recording of it, played when the preview can't run
 * - webgl: needs WebGL (without it, the video or a message)
 *
 * Nothing interactive that opens a hardware connection or saves files belongs here (no
 * connections widget or popup; the toolbar only as a demo, which points at its entries and
 * never runs one). Demos may open popups, and always close them.
 */

/* eslint-disable import/no-unresolved -- resolved by the manual's Vite alias */
const fixture = (show, id) => show.fixturePool.getFromId(id);
const group = (show, id) => show.groupPool.getFromId(id);
const cue = (show, groupId, id) => group(show, groupId).cuePool.getFromId(id);
const universe = (show) => show.universePool.getFromId(0);

/** Height of Studio's modifier strip, where every widget sits */
const STRIP = 239;

const FixtureControl = () => import('./FixtureControl.vue');
const FixturePool = () => import('@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.fixture.pool.vue');
const PatchBay = () => import('@/views/activities/app/fragments/patch-bay/patch-bay.fragment.vue');
const GroupPool = () => import('@/views/activities/app/fragments/group-pool/group-pool.fragment.vue');
const CuePool = () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.modifier.widget.cuepool.vue');
const EffectModifier = () => import('@/views/activities/app/fragments/modifiers/group/group.effect.modifier.fragment.vue');
const Toolbar = () => import('@/views/activities/app/fragments/toolbar/toolbar.fragment.vue');

/* ── Demo steps ─────────────────────────────────────────────────────── */

/** A fixture row in the patch bay (under its universe) */
const patchRow = (has) => ({ click: '.uikit_list_item.uikit_sublist_body', has });
/** A row in a widget's list */
const row = (has) => ({ click: '.uikit_list_item', has });
/** Closes the open popup with its close icon */
const closePopup = { click: '.popup_close_icon' };
/** Opens a toolbar menu */
const openMenu = (has) => ({ click: '.header_menu', has });
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
  /* ── Fixture controls (universe view) ── */
  'fixture-channels': {
    title: 'Channels',
    width: 742,
    height: STRIP,
    component: FixtureControl,
    props: (show) => ({ fixture: fixture(show, 0), widget: 'channels' }),
    clock: true,
  },
  'fixture-color': {
    title: 'Color Picker',
    width: 560,
    height: STRIP,
    component: FixtureControl,
    props: (show) => ({ fixture: fixture(show, 0), widget: 'color' }),
    clock: true,
  },
  'fixture-pantilt': {
    title: 'Pan/Tilt',
    width: 350,
    height: STRIP,
    component: FixtureControl,
    props: (show) => ({ fixture: fixture(show, 0), widget: 'pantilt' }),
    clock: true,
  },
  'fixture-cells': {
    title: 'Cells',
    height: STRIP,
    component: FixtureControl,
    props: (show) => ({ fixture: fixture(show, 2), widget: 'cells' }),
  },
  'fixture-pool': {
    title: 'Fixture Pool',
    width: 250,
    height: STRIP,
    component: FixturePool,
    props: (show) => ({ pool: universe(show).fixturePool }),
  },
  'group-fixture-pool': {
    title: 'Fixture Pool',
    width: 250,
    height: STRIP,
    component: FixturePool,
    props: (show) => ({ pool: group(show, 0).fixturePool }),
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
    width: 170,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/universe/_widgets/universe.modifier.widget.fixture.position.tool.vue'),
    props: (show) => ({ fixture: fixture(show, 0) }),
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
    props: (show) => ({ group: group(show, 0) }),
  },
  'group-cuepool': {
    title: 'Cue Pool',
    width: 440,
    height: STRIP,
    component: CuePool,
    props: (show) => ({ group: group(show, 0) }),
    clock: true,
  },
  'cue-settings': {
    title: 'Cue Settings',
    width: 220,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.modifier.widget.cue.settings.vue'),
    props: (show) => ({ cue: cue(show, 0, 1) }),
  },
  'scene-fixtures': {
    title: 'Scene Fixtures',
    width: 250,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.scene.modifier.widget.fixtures.vue'),
    props: (show) => ({ scene: cue(show, 0, 1) }),
  },
  'scene-curve': {
    title: 'Fade in',
    width: 341,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.scene.modifier.widget.curve.vue'),
    props: (show) => ({ fade: cue(show, 0, 1).fadeIn }),
  },
  'effect-channels': {
    title: 'Modulated Channels',
    width: 300,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.effect.modifier.widget.channels.vue'),
    props: (show) => ({ effect: cue(show, 0, 2) }),
    clock: true,
  },
  'effect-wave': {
    title: 'Effect Tool',
    width: 665,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/_widgets/group.effect.modifier.widget.wave.vue'),
    props: (show) => ({ channel: cue(show, 0, 2).channels[0] }),
    clock: true,
  },
  'chase-timeline': {
    // Fills the rest of the strip in Studio: shown at a typical width
    title: 'Timeline',
    width: 760,
    componentWidth: 760,
    height: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/chase/_widgets/chase.modifier.widget.timeline.vue'),
    props: (show) => ({ pool: group(show, 0).chasePool.getFromId(0) }),
    route: '/group/0/chase/0',
    clock: true,
  },
  /* ── Panels ── */
  'patch-bay': {
    title: 'Patch Bay',
    width: 200,
    height: 620,
    component: PatchBay,
    clock: true,
  },
  'group-pool': {
    title: 'Group Pool',
    width: 601,
    height: 620,
    component: GroupPool,
    clock: true,
  },
  'universe-modifier': {
    title: 'Universe',
    height: STRIP,
    fit: 'scroll',
    component: () => import('@/views/activities/app/fragments/modifiers/universe/universe.modifier.fragment.vue'),
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
    props: (show) => ({ scene: cue(show, 0, 1) }),
    clock: true,
  },
  'scene-modifier-bar': {
    // The pixel bar's Split scene: the cells widget, a colour per cell
    title: 'Scene',
    height: STRIP,
    fit: 'scroll',
    component: () => import('@/views/activities/app/fragments/modifiers/group/group.scene.modifier.fragment.vue'),
    props: (show) => ({ scene: cue(show, 1, 1) }),
    clock: true,
  },
  'effect-modifier': {
    title: 'Effect',
    height: STRIP,
    fit: 'scroll',
    component: EffectModifier,
    props: (show) => ({ effect: cue(show, 0, 2) }),
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
    height: 580,
    component: () => import('./VisualizerPreview.vue'),
    webgl: true,
    clock: true,
    video: '/interface/visualizer.webm',
  },
  /* ── Demos: a cursor plays the flow on the real component ── */
  'patch-bay-select': {
    title: 'Patch Bay',
    width: 200,
    height: 620,
    component: PatchBay,
    demo: [
      { caption: 'Click' },
      patchRow('MAC Aura 1'),
      { wait: 600 },
      { caption: 'Ctrl + click' },
      { ...patchRow('ColorBand Pix'), ctrl: true },
      { ...patchRow('PAR 2'), ctrl: true },
      { wait: 1800 },
    ],
  },
  'patch-bay-filter': {
    title: 'Patch Bay',
    width: 200,
    height: 620,
    component: PatchBay,
    demo: [
      { caption: 'Type to filter' },
      { type: '.uikit_list_searchbox input', text: 'PAR' },
      { caption: null },
      { wait: 1800 },
    ],
  },
  'patch-bay-delete': {
    title: 'Patch Bay',
    width: 520,
    componentWidth: 200,
    height: 620,
    component: PatchBay,
    demo: [
      patchRow('PAR 2'),
      { caption: 'Delete or Backspace' },
      { key: 'Delete' },
      { caption: null },
      { wait: 2200 },
      closePopup,
    ],
  },
  'fixture-pool-delete': {
    title: 'Fixture Pool',
    width: 520,
    height: 420,
    componentWidth: 250,
    componentHeight: STRIP,
    component: FixturePool,
    props: (show) => ({ pool: universe(show).fixturePool }),
    demo: [
      row('PAR 2'),
      { caption: 'Delete or Backspace' },
      { key: 'Delete' },
      { caption: null },
      { wait: 2200 },
      closePopup,
    ],
  },
  'patch-add': {
    // The universe view's fixture pool ADD opens the patch popup (the patch bay's NEW doesn't yet)
    title: 'Universe',
    width: 900,
    height: 620,
    componentHeight: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/universe/universe.modifier.fragment.vue'),
    route: '/universe/0',
    panel: true,
    demo: [
      { caption: 'Add' },
      { click: '.uikit_button', has: 'add' },
      { caption: null },
      { wait: 2600 },
      closePopup,
    ],
  },
  'group-patch-add': {
    title: 'Group',
    width: 900,
    height: 620,
    componentHeight: STRIP,
    component: () => import('@/views/activities/app/fragments/modifiers/group/group.modifier.fragment.vue'),
    route: '/group/0',
    warmRoute: '/group/1',
    panel: true,
    demo: [
      { caption: 'Add' },
      { click: '.uikit_button', has: 'add' },
      { caption: null },
      { wait: 2600 },
      closePopup,
    ],
  },
  'cuepool-add': {
    title: 'Cue Pool',
    width: 760,
    height: 520,
    componentWidth: 440,
    componentHeight: STRIP,
    component: CuePool,
    props: (show) => ({ group: group(show, 0) }),
    demo: [
      { caption: 'Double click an empty slot' },
      // Filled cues sit over their slot: the first free one is C-4
      { dblclick: '.grid_item.empty', has: 'C-4' },
      { caption: null },
      { wait: 2600 },
      closePopup,
    ],
  },
  'effect-channel-add': {
    title: 'Effect',
    width: 760,
    height: 520,
    componentHeight: STRIP,
    component: EffectModifier,
    props: (show) => ({ effect: cue(show, 0, 2) }),
    demo: [
      { caption: 'Add' },
      { click: '.uikit_button', has: 'add' },
      { caption: null },
      { wait: 2600 },
      closePopup,
    ],
  },
  'group-pool-new': {
    title: 'Group Pool',
    width: 860,
    height: 620,
    componentWidth: 601,
    component: GroupPool,
    demo: [
      { caption: 'New' },
      { click: '.uikit_button', has: 'new' },
      { caption: null },
      { wait: 2600 },
      closePopup,
    ],
  },
  'chase-play': {
    title: 'Group Pool',
    width: 601,
    height: 620,
    component: GroupPool,
    clock: true,
    demo: [
      { caption: 'Play' },
      { click: '.uikit_chase_btn' },
      { caption: null },
      { wait: 4500 },
      { caption: 'Stop' },
      { click: '.uikit_chase_btn' },
      { caption: null },
      { wait: 1200 },
    ],
  },
  'toolbar-menus': {
    ...TOOLBAR,
    demo: [
      ...FILE_MENU,
      ...PREFERENCES_MENU,
      { caption: 'About' },
      openMenu('About'),
      { caption: null },
      pointEntry('Manual'),
      pointEntry('License'),
      pointEntry('Credits'),
      { wait: 1200 },
    ],
  },
  'toolbar-file': { ...TOOLBAR, demo: FILE_MENU },
  'toolbar-preferences': { ...TOOLBAR, demo: PREFERENCES_MENU },
  'group-fixture-pool-delete': {
    title: 'Fixture Pool',
    width: 520,
    height: 420,
    componentWidth: 250,
    componentHeight: STRIP,
    component: FixturePool,
    props: (show) => ({ pool: group(show, 0).fixturePool }),
    demo: [
      row('MAC Aura 2'),
      { caption: 'Delete or Backspace' },
      { key: 'Delete' },
      { caption: null },
      { wait: 2200 },
      closePopup,
    ],
  },
};

export default PRESETS;
