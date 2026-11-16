# Tasks

## 1. Baseline

- [x] 1.1 Take reference screenshots of the current UI with headless Chrome on the demo show (patch bay with universe 0 open, universe view, group view with a scene, group view with an effect, chase view, patch popup, group popup, toolbar menu open) into the scratchpad. Verify: the screenshots exist; `npm run app:check` passes on this branch before any change.

## 2. Tokens (UI)

- [x] 2.1 `tokens.css`: add the scale (spacing, type, icons, controls, radius, border, widget widths) and the fixed-geometry variables from design §1–2, each fixed one with a comment naming the code that reads it; add the colour roles of §3 (`--on-color-text`, `--on-color-surface`, `--curve-handle`); remove `--test` and `--some`. Add `views/utils/geometry.js` (cue tile, chase row, select option sizes) and make `computeCueStyle`, the group pool's chase rows and `computeOptionListStyle` read it. Verify: `grep -rn "var(--test)\|var(--some)" src docs/manual/.vitepress` finds nothing; in the app, cues sit on the same grid, chase rows line up with their cells, select lists open in the same place.
- [x] 2.2 `global.css`: headings, paragraphs and base elements use the type, spacing and border tokens. Verify: screenshots of the main screens match the baseline except for snapped 1–2 px.

## 3. Styles on the scale (UI), batch by batch

Each batch maps paddings, margins, gaps (`:gap` props too), font sizes, radii and borders to tokens, snapping per design §1. Shared roles (row, header, control heights, widget widths, icons) use their tokens. Other sizes stay raw unless they're a named fixed variable. One-off hex colours map per §3. Every batch ends with: `npx eslint` on its files, `npm run app:check`, and screenshots compared with the baseline.

- [x] 3.1 uikit inputs, buttons and menus (`components/uikit/inputs`, `buttons`, `menus`). Verify: fields, faders, knobs, checkboxes, buttons and the toolbar menu look as before within 1–2 px.
- [x] 3.2 uikit lists, popups, widgets and containers. Verify: the list rows still sit 30 px apart (drag reorder still lands where the gap opens); popups and widget headers match.
- [x] 3.3 uikit cues, loaders, colors, icons. Verify: cue tiles and chase rows are unchanged (fixed geometry); the splash loader looks as before.
- [x] 3.4 Fragments: toolbar, patch bay, group pool, visualizer fragment. Verify: the main screen's top half matches the baseline.
- [x] 3.5 Fragments: modifiers (universe, group, scene, effect, chase and their widgets and popups). Verify: each modifier panel matches its baseline screenshot; the chase timeline grid is unchanged.
- [x] 3.6 App popups and activities (`app/_popups`, `app.activity.vue`, visualizer activity). Verify: splash, error and missing-fixtures popups as before.
- [x] 3.7 Sweep: list what's left raw in `src/views` (`grep` for `px` and `#hex` in `<style>` blocks) and check every remaining value is a fixed size or a one-off on purpose. Verify: the remaining list is written in the PR description.

## 4. Behaviour (UI)

- [x] 4.1 `views/utils/overflow.scroll.js` per design §4, installed in `main.js` and the manual's preview host. Verify in the app: a long fixture name in the patch bay scrolls to its end on hover, pauses, comes back; leaving resets it with its ellipsis; short names don't move; text fields are untouched; with reduced motion emulated nothing scrolls. Add an `app:check` scenario for the patch bay name.
- [x] 4.2 `uk-select`: current value marked in the open list, ↑/↓ open and move, Enter chooses, Escape closes without change, a letter jumps; pointer use unchanged. Verify in the app on the chase **Quantize** select (1/4, Down, Down, Enter gives 1/1) and with Escape; add an `app:check` scenario.

## 6. Resizable panels (UI)

- [x] 6.1 `uk-resize-handle` (uikit containers): an 8px grab area straddling a border, a 2px line lit on hover and while dragging, pointer capture, the target's own min/max. Replace the CSS `resize` of `.top_fragments` and `.group_pool_groups` with handles; add one on the patch bay's right border (200 to 400 px; the groups' maximum subtracts `--patch-bay-width`); the groups' handle hides while the visualizer is hidden (the dragged width comes back). Verify: real drags from 5%, 50% and 95% along each border follow the pointer, limits hold, no CSS `resize` left; an `app:check` scenario.
- [x] 6.2 Manual: `getting-started/interface` (group pool, modifier strip); AI context: skill `vue-ui-change` (`uk-resize-handle`). Verify: `npm run docs:manual:check`.

## 5. Docs and AI context

- [x] 5.1 Manual: `getting-started/interface#widgets` (cut text scrolls on hover; selects work with the keyboard), `reference/shortcuts` (a Selects table). Verify in `npm run docs:manual:serve`, then `npm run docs:manual:check` passes.
- [x] 5.2 AI context: `src/views/CLAUDE.md` (styling uses the scale tokens; fixed geometry variables and `geometry.js`; never add raw spacing), skill `vue-ui-change` (the token table, the snapping rule, the fixed-value rule), skill `code-quality` if it covers CSS. Verify: the docs name every token group and the fixed-value rule.
- [x] 5.3 `npx eslint` on all touched files is clean.
