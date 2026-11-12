# Proposal

## Why

Four controls show in Studio but do nothing (the manual lists them as limitations):

- The cue **Trigger Style** **Temporary** is saved but never used: every cue toggles on click.
- The patch bay's **New** button has an empty handler, and there is no way to add a universe.
- Deleting in the patch bay asks for confirmation, then does nothing.
- The universe settings' **Config** button has no handler.

The patch bay is meant to list top-level items only (universes; later pyro, media).

## What Changes

- **Temporary** cues play while the mouse button is held on them and stop on release. **Toggle**
  keeps today's behaviour.
- The patch bay lists universes only, with no fixture sub-items. Clicking a universe opens it, as
  unfolding does today.
- **New** adds an empty universe (the next free id, named *Universe <id>*) and opens it.
- Deleting in the patch bay deletes the selected universes with every fixture patched on them,
  including those fixtures in groups, scenes and effects. The confirmation says so. A deleted
  universe stops its stream.
- **Config** opens the **Connections** popup (as the toolbar does).
- New universe ids are unique (the generator used the last id, not the highest).

## Capabilities

### New Capabilities
- `grouping`: how a group's cues trigger (Toggle, Temporary).

### Modified Capabilities
- `patching`: the patch bay lists, adds and deletes universes.
- `output-wsc`: the universe's **Config** opens the Connections popup. Deleting a universe stops
  its stream.

## Out of scope

- Group dimmer, **Isolate**, **Blackout**, master column controls (own change).
- Effect PWM, bounce, chase quantize (change `fix-effect-chase-values`).
- Non-DMX patch bay items (pyro, media).
- Restoring streams after reload (WSC known issue 6) and the other WSC known issues.

## Impact

- **Showfile:** no new fields; older files load unchanged. Loading stops looking up each
  output's saved universe (unused, and it throws once that universe is gone).
- **Unsaved marker:** adding or deleting a universe marks the show unsaved (it's in `showData`).
- **Live playback and timing:** none per tick.
- **WSC output:** a deleted universe's stream stops; connections stay.
- **Visualizer:** a deleted universe's fixtures leave the stage (`patch_changed`).
- **Web vs Electron:** none.

Manual: `getting-started/interface#patch-bay`, `programming/patching`, `programming/scenes`,
`programming/playback`, `rig/outputs`, `getting-started/first-show`, `interface/visualizer`,
`concepts/index`, `reference/limitations`
(presets `patch-bay`, `patch-bay-select`, `patch-bay-filter`, `visualizer-modes`, `cue-settings`,
`group-cuepool`, `universe-settings`).
