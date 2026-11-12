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

### Reorder with pointer events

- **Start:**
  - only on lists with `draggable`, only for top-level rows, and only while no search is typed;
  - `pointerdown` on a row records the start, and a move of 4 px starts the drag.
- **During the drag:**
  - the target index is the number of other rows whose midpoint is above the pointer;
  - `dragOrder` re-renders the rows in preview order, with the dragged row marked `dragging`
    (lifted, accent outline);
  - the body auto-scrolls near its edges.
- **Release** emits `reorder({ original, final })`, in item indices, and selects the row as
  today. The click that follows a drag is ignored.
- **Escape or `pointercancel`** restores the order.

HTML5 drag-and-drop is dropped: its ghost images, child `dragenter` flicker and prop splicing
caused the ambiguity.

### Unfold animation and empty space

- **Animation:**
  - sub-rows render inside `<Transition name="uikit-unfold">` on a grid wrapper, so the height
    animates without measuring;
  - the CSS animates `grid-template-rows` from 0fr to 1fr, with opacity, over 150 ms ease;
  - it is disabled under `prefers-reduced-motion`.
- **Layout:**
  - in an `accordion` list, the open group can shrink (`flex: 0 1 auto; min-height: 0`), and
    its sub-rows scroll inside it, so the other headers stay visible;
  - the body's background is `var(--primary-light) var(--idle-stripes)`, and rows keep their
    solid background.
- **Row ✕:** rows now get `deletable` (it was never passed, so the ✕ never showed). Clicking it
  selects the row and opens the confirmation.

## Risks / Trade-offs

- **Callers that relied on index-carried state.** The old list carried highlights by index;
  keyed state is stricter. Every caller is retested (task 3.1).
- **Rows without a stable `id` and with duplicate names** fall back to `#n` suffixes, which are
  index-like. The notes in `src/views/CLAUDE.md` ask for an `id` or a unique `name`.
- **`grid-template-rows` transitions** need Chromium 107 or later. Electron 41 and current
  browsers have it; older browsers just skip the animation.
- **The ✕ appears on deletable rows** (on hover, or when selected). This is a visible change,
  and intended.
