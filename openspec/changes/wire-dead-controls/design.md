# Design

## Context

- **Cues.**
  - `Cue.triggerStyle` (`CUE_TRIGGER_STYLES.TOGGLE` / `TEMPORARY`) is saved, and the cue settings
    widget edits it.
  - The cue pool widget (`group.modifier.widget.cuepool.vue`) plays a cue on `@click` with
    `playCue(cue)`, which calls `cue.cue(true)`. Calling `cue(true)` on a playing cue stops it,
    so every cue toggles.
  - Cue tiles are `draggable` (dragged onto chase timelines).
- **The patch bay.**
  - `patch-bay.fragment.vue` binds a `uk-list` to `universePool.listable`. Each item has
    `unfold: fixturePool.listable`, so the list shows universes as an accordion with fixtures
    under them.
  - The list is `deletable`, but the fragment has no `@delete` handler.
  - `displayPatchPopup() {}` is an empty stub.
- **Universe pool.**
  - `UniversePool.delete` splices the universe and emits `patch_changed`. It leaves the
    universe's fixtures in `Show.fixturePool` and its groups.
  - `genUniverseId` compares a number with `.id`, so it returns the last universe's id + 1.
- **Fixtures.** `Show.deleteFixture(fixture)` removes a fixture from its groups (which drop it
  from cues), unpatches it and deletes it.
- **Outputs.**
  - `Show.loadFromData` passes `universe: universePool.getFromId(o.universe)` to
    `OutputPool.addRaw`, which ignores it.
  - `OutputPool.showData` writes `output.universe.id`, which throws for a connection created in
    the popup (it has no `universe`).
  - Removing outputs goes through `OutputPool.delete`, which throws (WSC known issue 5). This
    change doesn't remove outputs.
- **The Connections popup.** `popup.connections.vue` (`UkPopupConnections`, `v-model`) is
  mounted by the toolbar, and only reads `$show`.

## Goals / Non-Goals

**Goals:**
- The four controls work.
- The patch bay holds top-level items only.
- Deleting a universe leaves the show consistent: it saves, reloads, and the visualizer matches.

**Non-Goals:**
- Non-DMX patch bay items.
- Fixing outputs beyond the load lookup.
- Restoring streams after a reload.

## Decisions

### D1. Temporary: pointer events on the cue tile
- **Events:** the tile gets `@pointerdown`, which calls `pressCue(cue)`, next to `@click`.
- **Temporary press:** for a **Temporary** cue, `pressCue` selects the cue and calls
  `cue.cue(true)` if it isn't playing. It then listens once on `window` for `pointerup` and
  `pointercancel`, plus the tile's `dragstart`, and on the first of them calls `cue.cue(false)`.
- **No toggle after a hold:** `playCue` (the click) does nothing for a **Temporary** cue, so the
  click that follows a release doesn't restart it.
- **Toggle:** unchanged.
- **Why `window`:** it catches a release outside the tile without pointer capture, which would
  interfere with dragging the tile onto a chase.
- **Chases:** a chase calls `cue.cue()` directly, so it isn't affected.

### D2. The patch bay lists universes only
- **List items:** `UniversePool.listable` drops `unfold`. Nothing else uses it (to confirm with a
  grep during apply).
- **Opening a universe:** the patch bay's `uk-list` loses `accordion` and opens a universe on
  `@select` (the route `/universe/<id>`). `displayFixture` goes.
- **Fixture selection elsewhere:** the universe view's fixture pool already selects fixtures, and
  the visualizer's outline follows the fixture pools.

### D3. New: add a universe
- **Handler:** `displayPatchPopup` is renamed `addUniverse`. It calls
  `universePool.addRaw({ name: `Universe ${id}`, color })` with the id from a fixed
  `genUniverseId` (the max id + 1, or 0 when the pool is empty), then pushes `/universe/<id>`.
- **Colour:** the universe gets the first colour of the universe colour options, as new shows do
  (checked during apply in `Show`'s new-show code).
- **Id 0:** `addRaw` keeps `if (universe.id == null)` rather than `!universe.id`, so id 0 isn't
  regenerated.

### D4. Delete: universes with their fixtures
- **Engine:** a new `Show.deleteUniverse(universe)`:
  1. calls `deleteFixture` on each of its fixtures (copied first, since the pool shrinks);
  2. stops `universe.stream`;
  3. calls `universePool.delete(universe)`.
- **Handler:** the patch bay's `@delete` handler calls it for each selected item.
- **The universe view:** if the current route is a deleted universe, the handler pushes `/`.
- **Confirmation:** `uk-list` owns the popup and its text. It gains an optional
  `delete-message` prop (a function of the items). The patch bay passes "Delete N universes and
  the M fixtures patched on them?". Lists without the prop keep their text.
- **Loading:** `Show.loadFromData` stops passing `universe` to `OutputPool.addRaw`, and
  `OutputPool.showData` writes `universe: output.universe?.id ?? null`. Saved files keep the key,
  so older Studio versions still read them.

### D5. Config: the widget mounts the Connections popup
- **The widget:** `universe.modifier.widget.settings.vue` imports `popup.connections.vue` and
  opens it from **Config** with a local `v-model`.
- **Previews:** a component-local popup works in the manual's `universe-settings` preview
  (`popupHost`), where there is no toolbar.
- **Alternative considered:** an EventBus event caught by the toolbar. Rejected, because it does
  nothing in previews and adds a global event.

## Risks / Trade-offs

- **Deleting is permanent:** a universe's fixtures disappear from every scene with no undo
  (there is none in Studio). The confirmation says how many fixtures go.
- **Manual previews:** the patch bay previews (`patch-bay-select`, `visualizer-modes`) select
  fixtures from the patch bay. Their demos need rewriting to select from the universe view's
  fixture pool, or `patch-bay-select` goes.
- **Temporary with the keyboard:** there is no keyboard path to hold a cue. Cue tiles have no
  keyboard play today either.
