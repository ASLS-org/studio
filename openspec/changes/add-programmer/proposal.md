# Proposal

## Why

The universe view's faders, colour picker and pan/tilt write a fixture's channels once, and the
next cue tick overwrites them: there is no way to take a light by hand during a show. Nothing says
what drives a channel, so an unexpected look is hard to explain. Hazers, house lights and safety
channels can't be locked away from playback. Every console has a programmer, Clear, Park and a
way to see where a value comes from.

## What Changes

- **Programmer.**
  - Edits in the universe view (faders, colour picker, pan/tilt, channel presets) go into the
    programmer.
  - The programmer sits above every cue in the family merge from `add-cue-families`.
  - Programmer values show highlighted on their faders, and each fixture with programmer values
    is marked in the patch bay and the fixture pool.
  - Programmer values are never saved.
- **Clear.**
  - A **Clear** button in the toolbar empties the programmer, and the same Clear is on a key.
  - Cleared channels go back to what plays, else to their defaults, at once.
  - **Clear** in the channels widget's header clears one fixture.
- **Park.**
  - From a channel's menu, **Park** locks the channel at its current value, above the
    programmer and every cue. **Unpark** frees it.
  - Parked channels are saved with the show and show a lock on their fader.
- **Channel source.** Under each fader, the channels widget names what drives the channel: the
  cue (with its colour), *Programmer*, *Parked*, or *Default*.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `playback`: the programmer and Park layers above cues; Clear; the channel source.

## Impact

- **Code:** `Claims` gets the programmer and park layers; the universe modifier widgets; the
  toolbar; the patch bay and fixture pool markers; `app:check`.
- **Showfile:** fixtures save `parked` (channel index → value). Older shows have none.
- **Unsaved marker:** Park and Unpark mark the show unsaved; the programmer doesn't.
- **Live:** one check per proposed write for the programmer and park.
- **WSC output, visualizer, web vs Electron:** none.

## Out of scope

- Recording the programmer into cues (Record, Update, Merge).
- Selection-based programming across several fixtures at once.
- Highlight and lowlight.

Manual: `programming/patching.md` (fixture channels), `programming/playback.md` (Clear, Park),
`reference/shortcuts.md`, `reference/glossary.md`.
