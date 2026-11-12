# Proposal: fix-fixture-deletion

## Why

Deleting fixtures can stop halfway: the fixture leaves its groups but stays patched, in the patch
bay, in the universe view and in the visualizer, with no error shown. This happens after a
universe's id was edited, because fixtures keep the old universe number and the delete looks the
universe up by it. Any error in a group's cues during a delete also leaves the fixture in that
group. A show saved in such a state can then fail to open ("Cannot find fixture in pool"), and the
operator loses access to it.

## What Changes

- Editing a universe's id updates its fixtures' universe number. An id another universe already
  uses is refused (the field returns to the current id), and the universe view follows the new id.
- Deleting a fixture always completes. Its universe is the one it's patched in. It leaves every
  group even if one of the group's cues fails to drop it, and the failure is reported.
- Opening a show skips universe and group references to fixtures that aren't in the show, and
  reports how many were dropped.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `patching`: universe id edits, deleting fixtures always completes.
- `showfile`: shows with dangling fixture references still open.

## Impact

- Code: `models/DMX/universe.model.js`, `universe.pool.model.js`, `show.model.js`,
  `group.model.js`, `views/.../universe/_widgets/universe.modifier.widget.settings.vue`.
- Showfile format: unchanged. Older or damaged files open: dangling references are dropped, with
  a report.
- Unsaved marker: none. Opening saves the show locally as today, so the cleaned show replaces the
  damaged local copy.
- Live playback/timing, WSC output, visualizer: none. The visualizer already follows the patch.
- Web vs Electron: same.

Manual: `programming/patching` (the universe **ID** row), and
`reference/troubleshooting` § Saving and Showfiles (a show that reports dropped fixture
references).

## Out of scope

- Repairing references inside cues: scenes and effects already rebuild from the group's
  fixtures.
- Universe deletion, which stays unsupported.
