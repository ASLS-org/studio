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
  utils/                 palette, setCapture (exposed as this.$utils)
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
  (`--primary-*`, `--secondary-*`, `--accent-*`; shared with the user manual). No new hard-coded
  colours; palette lives in `uikit/colors/uikit.colors.js` and `views/utils/palette.js`.
- The user manual mounts real widgets and panels as live previews
  (`docs/manual/.vitepress/theme/previews/presets.js`). Renaming or moving a widget, or changing
  its props, breaks them: update the preset (`npm run docs:manual:check` mounts all of them).
  `previews/FixtureControl.vue` copies the universe fragment's wiring of the channels, colour,
  pan/tilt and cells widgets.
- `uk-list` keys rows by item `id`, else `name` (row state survives item changes, the list never
  writes to `items`): see skill `vue-ui-change` § Lists.
- The patch bay lists top-level media items (DMX universes; other media types later, added
  through its **New** popup, `popup.media.vue`), each unfolding to its fixtures.
- `uk-popup` opens in the injected `popupHost` element when one is provided (the manual's
  previews), else on the body. Idle surfaces (empty lists, the modifier strip, the group pool)
  use `var(--idle-stripes)` over their base colour.
- File names: `<area>.<kind>.<thing>.vue`, e.g. `group.modifier.widget.cuepool.vue`,
  `popup.connections.vue`, `uikit.input.select.vue`.
