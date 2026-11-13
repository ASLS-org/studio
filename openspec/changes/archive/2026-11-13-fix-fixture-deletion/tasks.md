# Tasks

## 1. Engine (models/DMX)

- [x] 1.1 `Universe` id setter updates its fixtures' `universe`; `UniversePool.changeId(universe,
  id)` refuses ids in use and returns whether it changed. Verify: renumber universe 0 to 5,
  fixtures report `universe` 5.
- [x] 1.2 `Show.deleteFixture` finds the universe by membership (fallback: the fixture's number)
  and isolates each group; `Group.deleteFixture` removes from its pool first, then each cue in its
  own try (reported through `app_error`). Verify: after renumbering, deleting from the patch bay removes the fixture
  from show, universe, patch, groups and the visualizer; with a cue forced to throw, the fixture
  still leaves the group.
- [x] 1.3 `prepareUniverses` / `prepareGroups` skip and count references to missing fixtures; one
  `app_error` reports the count. Verify: a showfile with a group listing a missing fixture opens,
  reports one dropped reference, and reopens without the report.

## 2. UI (views)

- [x] 2.1 Universe settings: ID field calls `changeId`; a refused id shows the current one again;
  the route follows the new id. Verify: type 1 for universe 0 with universe 1 present → field
  back to 0; type 5 → view and patch bay follow, labels read U5.

## 3. Docs and checks

- [x] 3.1 Manual: `programming/patching` universe **ID** row (unique, fixtures follow);
  `reference/troubleshooting` § Saving and Showfiles (the dropped references message). Check in
  `npm run docs:manual:serve`. (`universe-settings` preset: run `npm run docs:manual:check`.)
- [x] 3.2 AI context: `src/models/DMX/CLAUDE.md` notes the load skips dangling fixture references
  and universe ids change through `UniversePool.changeId`.
- [x] 3.3 `npx eslint` on all touched files is clean.
