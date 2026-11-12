# Tasks

See design.md for the row model, focus, drag and animation decisions.

## 1. UI: row model (views/components/uikit/lists/uikit.list.vue)

- [x] 1.1 Replace the rebuilt wrapper tree with state kept by row key (`id`, else `name`; sub-rows
  `<parent>/<child>`): `unfolded`, `checked`, `highlighted` sets, `selectedKey`, `anchorKey`.
  Build rows as a computed from `items` + state; never mutate `items` (today `unfold` arrays are
  rewritten in place). A row whose key vanished hands its state to the new row at its index
  (id or name edited in place). Seed `checked` from `item.active` when a key first appears or its
  `active` changes. Drop the `JSON.stringify` diff. Verify: patch bay keeps universe 0 unfolded
  through patch, delete, New and an id edit in Settings.
- [x] 1.2 Search: filter the computed rows (a parent with matching children shows unfolded) without
  copying state, so selection and checks made while filtering stick. Verify in the group
  creation popup: check a row during a search, clear it, row still checked.
- [x] 1.3 Events keep their payloads: `select`, `highlight`, `toggle`, `delete` and `unfold` send
  the caller's original item objects (menus call `callback` on them); `focused` on real focus
  changes; `reorder` `{ original, final }` in item indices. Verify each caller (list in 3.1).

## 2. UI: interaction

- [x] 2.1 Focus: `focusin`/`focusout` on the list root drive `hasFocus`; a row click focuses the
  body (`preventScroll`); keys are handled on the body, the `window` keydown listener goes.
  After the delete popup closes, focus returns to the body. Verify: delete, click another row,
  Delete opens the confirmation; Escape in one list leaves the other's highlights.
- [x] 2.2 Selection: click, Ctrl/⌘+click, Shift+click range among same-level visible rows (other
  level: single select), ↑/↓ move the selection among visible selectable rows and scroll it into
  view; `noHighlight`, `noSelect`, `disabled` rows respected. Verify Shift ranges in the patch
  bay and fixture pool, ⌘+click on macOS, no app error.
- [x] 2.3 Checks: `uk-list-item` gets a `toggle` event from its checkbox (click stopped there), the
  row click toggles once; **Check All** (top and per parent) counts from state. Verify in the
  group popup, the group patch popup (disabled rows) and an effect's fixtures.
- [x] 2.4 Reorder: pointer-based drag of top-level rows (`draggable`, not while searching, starts
  after 4 px), rows render in the preview order with the dragged row lifted, release emits
  `reorder` and selects the row, Escape or pointercancel restores. Remove the HTML5 drag
  handlers. Verify in a group's fixture pool and an effect's fixtures (order applied, phases
  follow).
- [x] 2.5 Delete: the ✕ on a deletable row selects it and opens the confirmation; `item.action`
  buttons don't select the row. Verify in the patch bay and the fixture pool.
- [x] 2.6 Unfold: reveal animation on sub-rows (grid rows 0fr→1fr plus opacity, 150 ms ease;
  respects `prefers-reduced-motion`); accordion behaviour kept. Verify by unfolding universes.
- [x] 2.7 Empty space: list body background `var(--primary-light) var(--idle-stripes)`, rows keep
  their solid background; "Nothing to display" unchanged. Verify on a short list.

## 3. Verification across callers

- [x] 3.1 In the running app (port 5180): patch bay, universe and group fixture pools, cells
  widget, scene fixtures, effect channels and fixtures, universe patch popup, group patch
  popup, group creation popup, new-show and connections popups, effect presets popup, toolbar
  menus. Each: select, search, its own events (delete, reorder, toggle, unfold); no app error.

## 4. Docs and AI context

- [x] 4.1 Manual: `reference/shortcuts` Lists table (⌘+click, Shift+click range, arrows, drag to
  reorder, ✕), `getting-started/interface#widgets`, remove the Shift+click row from
  `reference/limitations`. Check in `npm run docs:manual:serve`, then `npm run docs:manual:check`
  passes (presets click `.uikit_list_item` / `.uikit_sublist_body`, which stay).
- [x] 4.2 AI context: note in `src/views/CLAUDE.md` that list row state is keyed by item id/name
  (items need a stable `id` or unique `name`) and lists never mutate `items`.
- [x] 4.3 `npx eslint` on all touched files is clean.
