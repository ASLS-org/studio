# Proposal

## Why

Cues sharing fixtures play partly over each other and nothing says which part: colours mix,
stopping freezes the stage, an edit over a running look doesn't show. Programming must be readable
by anyone.

## What Changes

- **Families:** **Intensity**, **Colour**, **Position**, **Beam**, from channel attributes. A cue
  sets one; chases combine them. Older multi-family cues are split per family on load.
- **One cue per family in a group:** starting takes them, stopping hands them back, a cue left
  with nothing turns off and stays off (chase items too); across groups the newest wins.
- **Rest:** an unheld Intensity goes back to its pre-playback level; the other families keep
  their last value (its row's fill stays where it stopped) until another cue takes them.
- **Mode:** new cues **Replace**, **Layer** settable. No priority: the cue started last wins.
- **Cue pool = family columns** of list rows: **add** in each head; rows preview their content with
  a value line ("75%", "Pan 30° Tilt 45°"), a play button and a progress fill, no cue colour; a
  read-only **NOW** names each family's source (cue, chase, kept, rest).
- **Blind programming:** a click opens a cue, never plays it.
- **Chase timeline:** lanes grouped by family, holders drawn over time.
- **Scenes stay on**; editors show only the cue's family.
- **Removed:** the 120-slot grid, HELD tiles, Release, held looks. Supersedes the unarchived
  `add-cue-priorities`.

## Capabilities

### New Capabilities

- `playback`: families, sharing rules, rest and kept values, flashes, blind programming.

### Modified Capabilities

- `grouping`: the cue pool as family columns.
- `scenes`: scenes stay on; the editor follows the family.
- `effects`: fades blend with what is underneath; Add Modulated Channel follows the family.
- `chases`: items take families; the timeline by family.
- `uikit`: a choice input with icons; list rows with custom content.

## Impact

- **Showfile:** cues save `family`; older cues are split per family (chase lanes copied), a
  saved `priority` ignored; not marked unsaved.
- **Live:** one pass per tick over held channels.
- **WSC output, visualizer, web vs Electron:** none.

## Out of scope

- The live (session) and timecode views; programmer, Clear, Park (`add-programmer`).
- Virtual intensity, group masters, Blackout (`wire-group-masters`).
- Standard cue presets, export, import, clear (next change).

Manual: `concepts/timing.md`, `concepts/index.md`, `programming/playback.md`,
`programming/scenes.md`, `programming/effects.md`, `programming/chases.md`,
`getting-started/first-show.md`, `reference/glossary.md`, `reference/limitations.md`; previews
`group-cuepool`, `cuepool-add`, `cue-settings`, `scene-stage`, `effect-stage`,
`effect-channel-add`, `chase-modifier`, `timeline-add`.
