# Proposal: rebuild-uk-list

## Why

Lists make up most of Studio's UI and misbehave every session. After a delete, clicking the list
focuses nothing. Shift-clicking a fixture row throws, and the error popup then swallows clicks.
A checkbox click does nothing, because it toggles twice. Checks made during a search are lost.
Dragging to reorder shows no drop position and, during a search, moves the wrong item. Unfolded
rows fold when items change.

The causes are structural: row state lives on wrappers rebuilt on every change, focus is tracked
by hand and drifts from the browser's, and every list listens to keys on `window`. Patching keeps
breaking something else.

## What Changes

- Rewrite `uk-list` around rows keyed by item id (else name). Selection, highlights, checks and
  unfolded state are kept by key across item changes and searches; deleted rows drop out.
- Focus follows the browser's: clicking a row focuses the list; only the focused list takes keys.
- Click selects; Ctrl/⌘+click adds or removes; Shift+click selects a range within one level;
  ↑/↓ move the selection.
- Checkable rows: row and checkbox each toggle once; **Check All** stays accurate.
- Reorderable rows get a grip handle. Dragging it lifts the row under the pointer while the
  others slide apart where it will land; release confirms, Escape cancels; off during a search.
- Right-click a row for a context menu (new `uk-context-menu`): Move up/down, Select all,
  Delete. The list keeps focus after a delete; the confirmation uses Studio's text styles.
- Unfolding reveals sub-rows with a short (about 150 ms) height-and-fade animation.
- Space below the rows shows the idle stripes.
- Props, events, payloads and the row classes the manual's demos use stay the same.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `uikit`: list selection, focus, checks, unfolding, reorder, delete, empty space.

## Impact

- Code: `uikit/lists/uikit.list.vue`, `uikit.list.item.vue`, new
  `uikit/menus/uikit.context.menu.vue` and a `drag` icon. Every `<uk-list>` caller is retested,
  none edited.
- Showfile format, unsaved marker, live playback/timing, WSC output, visualizer: none.
- Web vs Electron: same.

Manual: `reference/shortcuts` (Lists), `getting-started/interface#widgets`,
`reference/limitations` (drop the Shift+click row); run `npm run docs:manual:check`.

## Out of scope

- Keyboard reordering, multi-row drag, dragging sub-rows between parents.
- Virtual scrolling.
- Caller behaviour, e.g. what gets selected after a delete.
- Universe id edits not updating their fixtures' universe number.
