# Views (src/views)

Use skill `vue-ui-change` for any UI work. This file is the map.

```
views/
  view.state.js          ViewState ($view): panel in view, selection by id, memory, popups
  keyboard.js            Keyboard ($keyboard): top popup → focused block → global shortcuts
  activities/            top-level screens
    app/app.activity.vue   main shell: loads localStorage or demo showfile, lays out fragments
    app/_popups/           app-level popups (splash, error)
    app/fragments/<area>/  toolbar, patch-bay, group-pool, visualizer, modifiers/{universe,group,chase}
      _widgets/            widgets scoped to that fragment (modifiers/_widgets: shared by the
                           modifiers, e.g. the cells selector used by universe and scene views)
      _popups/             popups scoped to that fragment
    visualizer/            standalone visualizer route (/visualizer)
  components/uikit/      `uk-*` design system, registered globally in main.js
  mixins/                popup.mixin.js (v-model open/close), modal.mixin.js (named popup
                         state in $view), keys.mixin.js (keyboard block), color.mixin.js
  utils/                 palette, setCapture (exposed as this.$utils); channel.icons.js and
                         channel.presets.js (channels widget: icon per function, range menu);
                         dmx.js (addresses shown 1-512, stored from 0); placement.js (pure
                         pose maths: line, grid, circle, arc, align, distribute, fan,
                         aim for the Arrange popup; mounts, turn and tilt for the
                         Position Tool; patchPoses for where the patch popup puts new
                         fixtures); effect.scope.js (an effect's waves sampled over one loop
                         and matched per fixture, colour mixing, pan/tilt angle ranges
                         from profiles and the degree view, speed, absolute shapes,
                         spreads and colour presets: the Pan/Tilt and Colour scopes;
                         availableChannels by family); cue.families.js (each cue family's
                         name, icon and hint); cue.previews.js (a cue pool chip's
                         picture and value line: colour, level, aims, beam, wave or path,
                         "75%", "Pan 30° Tilt 45°"; waves over one cycle; cached per cue); cue.now.js (NOW: a family's source and value,
                         the kept cue); chase.outcome.js (who holds what along a
                         chase's timeline); outputs.js (gateway and route states for
                         the Outputs views)
```

## Ground rules

- Options API only (`name`, `compatConfig: { MODE: 3 }`, `components`, `props`, `emits`, `data`,
  `computed`, `watch`, methods, hooks). No `<script setup>`, no Composition API.
- Show state comes from `this.$show` (reactive singleton). Read it directly and call model methods.
  Don't copy model state into local `data`. There is no Vuex/Pinia store.
- Live values (channel values, cue state/progress, chase playheads, DMX activity) are written by
  playback outside Vue: read them through `views/mixins/live.mixin.js` (`live(value)`), which
  refreshes with `$liveTicker` (25 Hz while playing; `$liveTicker.bump()` after edits).
- **What's in view is `$view`'s** (`views/view.state.js`), the single source of truth for the
  panel (universe, group, chase), the selected cue, fixtures and cells, and the open popups.
  Navigate with its actions (`openUniverse`, `openGroup`, `openChase`, `openFixture`), select
  with `selectCue` / `selectFixtures` / `selectCells`, read its getters (`universe`, `group`,
  `cue`, `chase`, `fixtures`; per context `universeFixtures`, `groupFixtures`). It holds ids and
  resolves them on read, so deletes fall back to the first item without repair code: never copy
  its objects into `data`, never write a "selected" flag of your own. Each group and universe
  remembers its selection for the session (never saved). The router only has activities.
- **Lists bound to a selection** use `uk-list`'s `selection` prop (ids) and `selection` event,
  not `auto-select-first`. The 3D highlight follows `$view.highlight` (visualizer fragment):
  don't call the visualizer to highlight; a popup choosing fixtures uses `previewFixtures(ids)`.
- **Popups:** give each one a name with `modal(name, owner)` from `mixins/modal.mixin.js` as a
  computed `v-model`; owner = the panel it belongs to (closed on any panel change) or `'app'`.
  `uk-popup` registers itself as a layer of `$view`: Escape and Enter go to the top one only.
- **Keys:** never add a `window` keydown listener. A block that reacts to keys while focused uses
  `mixins/keys.mixin.js` (`handleKeys(e)` returns true when handled; give it a focusable
  element); app-wide shortcuts use `$keyboard.addShortcut(match, handler)`. Fields keep their
  keys, and nothing behind an open popup gets any.
- Styling: `<style scoped>` plain CSS using the design tokens in `src/assets/styles/tokens.css`
  (colours `--primary-*`, `--secondary-*`, `--accent-*`; the design scale `--space-*`, `--font-*`,
  `--icon-*`, `--radius-*`, `--border-width` and the role sizes; shared with the user manual). No
  raw spacing, type or radius values and no new hard-coded colours; palette lives in
  `uikit/colors/uikit.colors.js` and `views/utils/palette.js`. Fixed geometry (sizes the code
  computes with) has its own variable plus a constant in `views/utils/geometry.js`, and is never a
  scale step: see skill `vue-ui-change` § Design scale.
- The user manual mounts real widgets and panels as live previews
  (`docs/manual/.vitepress/theme/previews/presets.js`). Renaming or moving a widget, or changing
  its props, breaks them: update the preset (`npm run docs:manual:check` mounts all of them).
  `previews/FixtureControl.vue` copies the universe fragment's wiring of the channels, colour,
  pan/tilt and cells widgets.
- `uk-list` keys rows by item `id`, else `name` (row state survives item changes, the list never
  writes to `items`): see skill `vue-ui-change` § Lists.
- **The cue pool** (`group.modifier.widget.cuepool.vue`) is the group's programming view: one
  column per family, a head with an **add** button and a read-only NOW (`utils/cue.now.js`),
  the cues as `uk-list` rows (`row` slot) with a picture (`uk-cue-picture`) and a value line
  (`utils/cue.previews.js`, `sharedContent`: one cached computed per cue, shared with the chase
  timeline). Cues show no colour of their own. A click (or Up/Down) only opens a cue
  (programming is blind); its play button (over the picture, on hover; the stop whenever it
  plays) plays it with fades, and new cues are Replace; a playing row fills with
  `cue.progress`, a kept cue's stays at `cue.stopProgress`. The chase timeline groups its lanes
  the same way (foldable family heads, each family's accent from `cue.families.js` tinting its
  items, holders and edges) and draws who holds each family
  (`utils/chase.outcome.js`, a pass over the items by the playback rules).
  Icons in rows are mask classes (`maskClass`): components or style objects per row pushed
  panel switches over 50 ms.
- **Outputs** (`toolbar/_popups/outputs/`): one workspace (Preferences → Outputs, Ctrl+Shift+O,
  the toolbar OUTPUT indicator, a universe's Output widget), laid out as the Arrange popup: the
  signal flow left (universes, gateways, destinations as three `uk-list`s under widget-like
  headers with **Add**, joined by SVG wires drawn from row indexes, `OUTPUT_*` in
  `utils/geometry.js`, never measured), the page of the item clicked last right
  (`outputs.page.vue`, `outputs.row.vue`, `outputs.side.*`). Each list keeps its marked row
  (`{universe, gateway, route}`, the popup's own, not `$view`'s): a route is added from the marked
  universe through the marked gateway.
- The patch bay lists top-level media items (DMX universes; other media types later, added
  through its **New** popup, `popup.media.vue`), each unfolding to its fixtures.
- `uk-popup` opens in the injected `popupHost` element when one is provided (the manual's
  previews), else on the body. Idle surfaces (empty lists, the modifier strip, the group pool)
  use `var(--idle-stripes)` over their base colour.
- File names: `<area>.<kind>.<thing>.vue`, e.g. `group.modifier.widget.cuepool.vue`,
  `popup.outputs.vue`, `uikit.input.select.vue`.
