# Views (src/views)

Use skill `vue-ui-change` for any UI work. This file is the map.

```
views/
  activities/            top-level screens (router targets)
    app/app.activity.vue   main shell: loads localStorage or demo showfile, lays out fragments
    app/_popups/           app-level popups (splash, error)
    app/fragments/<area>/  toolbar, patch-bay, group-pool, visualizer, modifiers/{universe,group,chase}
      _widgets/            widgets scoped to that fragment (modifiers/_widgets: shared by the
                           modifiers, e.g. the cells selector used by universe and scene views)
      _popups/             popups scoped to that fragment
    visualizer/            standalone visualizer route (/visualizer)
  components/uikit/      `uk-*` design system, registered globally in main.js
  mixins/                popup.mixin.js (v-model open/close), color.mixin.js
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
- Navigation: `this.$router.push(path).catch(() => {})`. Routes are in `plugins/router.js`.
- Styling: `<style scoped>` plain CSS using the design tokens in `src/assets/styles/tokens.css`
  (`--primary-*`, `--secondary-*`, `--accent-*`; shared with the user manual). No new hard-coded
  colours; palette lives in `uikit/colors/uikit.colors.js` and `views/utils/palette.js`.
- The user manual mounts real widgets and panels as live previews
  (`docs/manual/.vitepress/theme/previews/presets.js`). Renaming or moving a widget, or changing
  its props, breaks them: update the preset (`npm run docs:manual:check` mounts all of them).
  `previews/FixtureControl.vue` copies the universe fragment's wiring of the channels, colour,
  pan/tilt and cells widgets.
- The patch bay lists top-level media items (DMX universes; other media types later, added
  through its **New** popup, `popup.media.vue`), each unfolding to its fixtures.
- `uk-popup` opens in the injected `popupHost` element when one is provided (the manual's
  previews), else on the body. Idle surfaces (empty lists, the modifier strip, the group pool)
  use `var(--idle-stripes)` over their base colour.
- File names: `<area>.<kind>.<thing>.vue`, e.g. `group.modifier.widget.cuepool.vue`,
  `popup.connections.vue`, `uikit.input.select.vue`.
