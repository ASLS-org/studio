# Design

## Context

- **Delete path:** `Show.deleteFixture(fixture)` (`src/models/DMX/show.model.js`):
  1. gets the handle with `fixturePool.getFromId`;
  2. calls `group.deleteFixture` for each group that holds it;
  3. calls `universePool.getFromId(handle.universe).unpatchFixture(handle)`;
  4. calls `fixturePool.delete(handle, true)`.
- **Group side:** `Group.deleteFixture` runs every cue's `deleteFixture` and then
  `fixturePool.delete`, all inside one `try/catch` that only logs. If a cue throws, the fixture
  stays in the group.
- **Universe ids:** `Fixture.universe` is a number set by `Universe.patchFixture`. The universe
  settings widget edits `universe.id` through `v-model`, and the `Universe` id setter only clamps
  it. Fixtures keep the old number, so step 3 throws "Cannot find universe in pool" after step 2
  has run. The error goes to the app error handler, which the delete popup's flow doesn't surface.
- **Load:** `Show.prepareUniverses` and `prepareGroups` call `fixturePool.getFromId` for every
  saved reference, and it throws on a missing id. `loadFromData` ends with `persistLocally()`.

## Goals / Non-Goals

**Goals:** deletes that can't stop halfway, universe ids that can be edited safely, and damaged
local shows that open again.

**Non-Goals:** universe deletion; repairing cue internals (cues are rebuilt from the group's
fixtures on load).

## Decisions

### Universe id edits

- **Pool method:** `UniversePool.changeId(universe, id)` refuses an id another universe uses (it
  returns `false`). Otherwise it sets the id, which the setter clamps, and writes it into each of
  the universe's fixtures' `universe`.
- **Setter:** the `Universe` id setter also updates its fixtures' `universe` when its fixture
  pool exists, so a direct assignment stays consistent too. Uniqueness lives in the pool, which
  knows the other universes.
- **Widget:** the settings widget uses `:model-value` with `@update:model-value`, calling
  `changeId`. On a refusal it shows the current id again. When the route is `/universe/<old>`, it
  replaces it with the new id (and the query), so the view and the patch bay keep pointing at the
  universe.

### Deletes that always complete

- **Finding the universe:** `Show.deleteFixture` finds the universe by membership,
  `universePool.universes.find((u) => u.fixturePool.checkIfExists(id))`, and falls back to the
  `universe` number.
- **Order and isolation:** each group is handled in its own `try`. `Group.deleteFixture` first
  removes the fixture from its own pool, then drops it from each cue in a separate `try` that
  reports through `app_error`. A failing cue no longer keeps the fixture in the group, and other
  cues still run.
- **Visualizer:** the patch is still emitted through `patch_changed` by `unpatchFixture`, so the
  visualizer follows as before.

### Lenient load

`prepareUniverses` and `prepareGroups` skip references that `fixturePool.checkIfExists` doesn't
find, and count them. After loading, a non-zero count emits one `app_error`, the way footprint
changes are reported today ("N fixture references in this show pointed to missing fixtures and
were dropped"). `persistLocally()` then writes the cleaned show.

## Risks / Trade-offs

- **Silent data loss is avoided by the report.** The dropped references pointed to nothing, so no
  show content is lost.
- **Per-tick cost:** none. This is all edit-time and load-time code.
