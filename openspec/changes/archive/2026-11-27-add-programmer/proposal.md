# Proposal

## Why

Universe-view edits are overwritten by the next tick of a cue holding that family, so no light can
be taken by hand during a show; at rest, an edit silently becomes the base cues fade from. Edits
reach one fixture of a selection, hazers can't be locked away from playback, and nothing says
what drives a channel.

## What Changes

- **Programmer.** Universe-view edits (faders, colour, pan/tilt, channel presets) go into the
  programmer, above every cue. Never saved; no base look at rest.
- **Every selected fixture.** An edit sets the same channel kind on every selected fixture that
  has it; colour mixes per fixture; pan/tilt sets the same angle where the fixture's range is
  known, else the same value. Faders show the first selected fixture.
- **Clear**, instant: everything from Preferences → **Clear programmer** (Ctrl+Shift+C); the
  selection from the channels widget header; one channel from its menu.
- **Park.** **Park at <value>** / **Unpark** at the top of a channel's menu, for the selected
  fixtures; **Unpark** in the channels widget header. A parked channel sits above the
  programmer, ignores the grand master and blackout, survives Clear, and is saved with the show.
- **Where a value comes from.** Channel menu box and fader fill: violet for programmer, red and
  locked for parked, blue for playback; rest keeps the default look. Hovering names the source
  ("Colour cue: Red", "Rest"). Fixture pool rows read `· prog` / `· parked`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `playback`: programmer and park layers above cues, Clear, the channel source.
- `patching`: universe-view edits reach every selected fixture; Park in the channel menu.

## Impact

- **Code:** `Universe.packFrame`, `Fixture` set paths, the universe modifier, channels widget,
  toolbar menu, fixture pool, uikit opt-ins (widget header actions, locked fader and number
  field), `app:check`.
- **Showfile:** fixtures save `parked` (channel index → value); older shows have none.
- **Unsaved marker:** Park and Unpark mark it; the programmer and Clear don't.
- **Live:** two null checks per address per tick.
- **Output, visualizer:** follow the frame. **Web vs Electron:** none.

## Out of scope

- Recording the programmer into cues (Record, Update, Merge: `add-record-workflow`).
- A Clear time (a programmer fade) and Clear per family.
- Programmer values from the group view: cue editing stays blind.
- Highlight and lowlight.

Manual: `programming/patching.md` (fixture channels, Park), `programming/playback.md` (programmer,
Clear), `reference/shortcuts.md`,
`reference/glossary.md`.
