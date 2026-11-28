# Proposal

## Why

Each group's dimmer knob, **Isolate** and **Blackout**, and the master column's knob and
**Blackout**, change nothing: an operator can't pull a group down or cut the stage.

## What Changes

- **Group dimmer knob** (a playback master): scales the Intensity of what that group's cues and
  chases send. Other groups' cues and the programmer aren't affected.
- **Group Blackout**: that group's playback Intensity goes to 0 at once; off, it comes back.
- **Isolate** (solo): while any group is isolated, only isolated groups' playback reaches the
  stage; the others' Intensity goes to 0. Several groups can be isolated.
- **Grand master**: the master column's knob scales every Intensity value sent, the programmer
  included.
- **DBO**: the master column's **Blackout** takes the grand master to 0 at once, without moving
  the knob.
- **Level channels only** (dimmer, brightness); on fixtures without one (RGB PARs), additive
  colour. Parked channels ignore masters.
- **Not saved**: shows open at full, Isolate, Blackout and DBO off; moving them never marks the
  show unsaved.
- **Activity dots**: bright up to what a group sends, faint up to what its cues ask (the master
  column: the rig). A held-back column greys its knob and says why; double-click resets to full.
- The master column has no **Isolate**.

## Capabilities

### New Capabilities

- `master`: group masters, Isolate and Blackout, the grand master and DBO, and how they scale
  what is sent.

### Modified Capabilities

None.

## Impact

- **Code:** `Universe.packFrame` (scaling at packing time), `Group` and `Master` (levels),
  `CuePool` (cues reach their group's level), the group pool's cue containers, `app:check`.
- **Showfile:** groups stop saving `master`, `solo` and `disabled`; older files that have them
  load as before (the keys were already ignored).
- **Unsaved marker:** none of these controls marks the show unsaved.
- **Live:** one multiplication per Intensity (or virtual-intensity) address per tick, no
  allocation; levels are computed when a control moves, not per tick.
- **Output, visualizer:** both follow the packed frame. **Web vs Electron:** none.

## Out of scope

- Fades on Blackout and DBO (both cut at once).
- Per-fixture output views (a strip of sent colours).
- Playback faders per cue, flash buttons on masters, master pages.
- External control of the masters (MIDI, OSC: `add-external-control`).

Manual: `programming/playback.md` (Master Rows, Group Controls), `reference/limitations.md`
(remove the row), `reference/glossary.md` (Grand master, DBO, Isolate), `concepts/timing.md`.
