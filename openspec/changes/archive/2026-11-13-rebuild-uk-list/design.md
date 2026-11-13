# Design

## Context

`uk-list` (`src/views/components/uikit/lists/uikit.list.vue`) and `uk-list-item`
(`uikit.list.item.vue`) back 14 lists: patch bay, fixture pools, cells, scene fixtures, effect
channels and fixtures, five popups, and the toolbar menus. The manual mounts `uk-list-item` on its
own, and its demos click `.uikit_list_item`, `.uikit_sublist_body` and `.uikit_list_searchbox
input`.

The current list holds state on wrapper objects (`tree`) rebuilt whenever
`JSON.stringify(items)` changes, and writes them back into the caller's `items` (`unfold` arrays
are replaced in place). It tracks focus in a `hasFocus` flag fed by `focusin`/`focusout` plus
manual resets. Every list adds a `window` keydown listener. Drag uses HTML5 events and splices the
`items` prop. Search copies rows. See proposal.md for the bugs this causes.

## Goals / Non-Goals

**Goals:**
- One source of truth for row state, robust to item changes, searches and deletes.
- Behaviour that matches the browser for focus and keys.
- Keep every prop, event and payload, and the CSS class names used by the manual.

**Non-Goals:**
- Changing any caller.
- Virtual scrolling, keyboard reorder, multi-row drag.

## Decisions

### Row state is kept by key, rows are computed

- **Keys:** a row's key is its item's `id` (`id:<id>`), else its `name` (`name:<name>`).
  Duplicates get a `#n` suffix. A sub-row's key is `<parent key>/<child key>`.
- **State** lives in `data` and holds only keys:
  - `unfolded` and `checked` are plain objects (key → true);
  - `highlighted` is an ordered array of keys, since callers treat the first highlighted
    fixture specially;
  - `selectedKey` holds the single selected row.
- **Rows** come from a computed over `items` plus that state. Each render builds fresh view
  objects `{ key, value, selected, highlighted, toggled, unfolded, children }` for `uk-list-item`.
  `value` is the caller's own item object, so payloads stay identical (menus call
  `value.callback`). The list never writes to `items`.
- **Reconciling** (an `items` watcher, flushed before render) compares the new keys with the
  last keys:
  - a key that disappeared hands its state, and its sub-row keys, to the new key at the same
    index when that one is new: an id or name edited in place;
  - every other vanished key is pruned from all the state, so deleted rows leave the selection;
  - `checked` is seeded from `item.active` when a key first appears or its `active` changes. The
    effect fixtures list reflects the model this way, while popups keep local checks.
- **Why not deep-watch wrappers:** wrappers are what drifted. Keyed state is small, and
  recomputing the rows of a few hundred items per change is cheap and outside the per-tick path.

### Search is a view

`visibleRows` filters the computed rows:
- a parent whose sub-rows match shows open with only those sub-rows, without changing
  `unfolded`;
- a row that matches by its own name shows as usual.

Selection, checks and highlights act on keys, so they stick after the search is cleared.

### Focus and keys follow the browser

- **Focus:**
  - `hasFocus` comes only from `focusin`/`focusout` on the body (`tabindex="0"`), ignoring
    moves inside the body;
  - a row press focuses the body (`preventScroll`);
  - when the delete popup closes, the body is focused again.
- **Keys** are handled by `@keydown` on the body, so only the focused list reacts. The `window`
  listener goes.
  - Escape clears highlights and blurs.
  - Delete/Backspace opens the confirmation.
  - ↑/↓ move the selection among visible selectable rows (unfoldable parents and disabled rows
    are skipped) and scroll the row into view.
- `preventUnfocus` stays as an accepted prop: no caller uses it, and focus now handles itself.

### Selection rules

- **Click** clears highlights, emitting `highlight([])` as today since callers rely on it to
  reset visualizer outlines, then selects and emits `select`.
- **Ctrl/⌘+click** adds or removes a row in `highlighted`. The first time, the selected row
  joins first. It emits `select(selected)` and then `highlight`.
- **Shift+click** at the same level as the selected row highlights the visible siblings between
  them, in order, and emits `highlight`. Otherwise it acts as a click.
- **Lists with `toggleable`:** a click toggles the check instead.
- **Lists with `disabled`:** no interaction.

### Checks

- **Checkbox:** `uk-list-item` wraps it in a span that stops the click and emits `toggle`. The
  checkbox itself is display-only (`pointer-events: none`), so there is one toggle path and no
  double flip.
- **Check All** (the top one, and one per parent) acts on visible, enabled rows. Its count comes
  from state.
- **`toggle` payload:** checked top-level rows, then the checked sub-rows of unchecked parents,
  as today.

### Reorder with a handle and transforms

- **Handle:** draggable top-level rows render a grip (`drag` icon) at their left
  (`uk-list-item` `handle` prop, `handle` event on its `pointerdown`). Only the handle starts a
  drag, so clicks and selection on the rest of the row stay unambiguous. Handles are hidden while
  a search is typed.
- **During the drag** the DOM order doesn't change. At the start the list measures the
  top-level rows. On each move:
  - the dragged row is translated by the pointer's travel (plus any auto-scroll), lifted with a
    shadow and outline;
  - the target index is the number of other rows whose original midpoint is above the dragged
    row's midpoint;
  - the rows between the start and the target slide by the dragged row's height
    (`transform`, 150 ms), opening the gap where it will land;
  - the body auto-scrolls near its edges.
- **Release** clears the transforms and emits `reorder({ original, final })` in the same tick.
  The caller reorders the model, so the new items render already in place, without a flicker.
  Lists without checkboxes then select the moved row.
- **Escape or `pointercancel`** clears the transforms, and the rows slide back.

HTML5 drag-and-drop is dropped: its ghost images, child `dragenter` flicker and prop splicing
caused the ambiguity. An earlier version of this rebuild re-rendered rows in preview order. It
didn't show what was being dragged.

### Row tools

- **Trash icon:** `uk-list-item` shows it when `deletable` and emits `delete` on click
  (pointerdown and click stopped, so the row isn't selected). `uk-list` passes `deletable` to
  top-level and sub-rows; `deleteRow(row)` opens the confirmation for the highlighted rows when
  the row is one of several, else for that row.
- **Grip:** at the far right of the row, after the trash icon.
- **Colour:** both icons use `--secondary-light`, and `--secondary-lighter` (the label's colour)
  on hover and on selected or highlighted rows.
- An earlier version used a right-click context menu; it didn't fit the uikit and was removed.
- **Delete confirmation:** written like the group pool's own confirmation, in plain `<p>` text
  with 16 px padding, in the global text style. A `<b>` outside a `<p>` fell back to the
  browser's serif font.

### Unfold animation and empty space

- **Animation:**
  - sub-rows render inside `<Transition name="uikit-unfold">` on a grid wrapper, so the height
    animates without measuring;
  - the CSS animates `grid-template-rows` from 0fr to 1fr, with opacity, over 150 ms ease;
  - it is disabled under `prefers-reduced-motion`.
- **Layout:**
  - in an `accordion` list, the open group grows into the space left (`flex-grow` animated
    with the reveal), pushing the closed headers after it to the bottom, and shrinks with its
    sub-rows scrolling inside it when they don't fit; stripes fill below its last sub-row;
  - the body's background is `var(--primary-light) var(--idle-stripes)`, and rows keep their
    solid background.

## Risks / Trade-offs

- **Callers that relied on index-carried state.** The old list carried highlights by index;
  keyed state is stricter. Every caller is retested (task 3.1).
- **Rows without a stable `id` and with duplicate names** fall back to `#n` suffixes, which are
  index-like. The notes in `src/views/CLAUDE.md` ask for an `id` or a unique `name`.
- **`grid-template-rows` transitions** need Chromium 107 or later. Electron 41 and current
  browsers have it; older browsers just skip the animation.
- **Trash icons take row width.** Labels in narrow lists ellipsize sooner; the icon only shows on
  lists that pass `deletable`.
