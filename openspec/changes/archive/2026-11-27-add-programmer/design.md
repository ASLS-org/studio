# Design

## Context

- **Universe-view edits today.** The universe modifier writes the selected fixture only
  (`selectedFixture.setQuickAccessor`, `setColor`, `setPanTilt`). `Fixture.setChannel` writes
  `channel.value` straight away when no cue is writing (`Claims.writer` unset).
  - While a cue holds the family, `Claims.settle()` overwrites the edit on the next tick.
  - At rest, the edit stays and becomes the value the next cue fades from (`fromValue`). For
    Intensity it also becomes the level it returns to (`restValue`). This is the hidden base look
    the proposal removes.
- **Output.** `Universe.packFrame()` builds each universe's 512 values from each channel's
  `value.DMX`, address by address, with invert/swap (`outputSource`, `outputInvert`). Outputs and
  the visualizer read only frames.
- **The channels widget** (`modifier.widget.fixture.channels.vue`) is shared by the universe view
  (live) and the scene editor (blind, scene values). It binds `channel.value` with `v-model`, so it
  writes before telling its parent.
- **What already exists:**
  - `Fixture.setQuickAccessor(channel, value)` finds "the same channel" on another fixture by type
    and index; scenes use it for groups.
  - `cell.access.js` mixes colour and sets pan/tilt per cell.
  - `views/utils/effect.scope.js` `angleRange(fixture, kind)` gives a fixture's pan or tilt range
    in degrees.

## Goals / Non-Goals

**Goals:**
- Hand values that win over playback without touching the merge.
- Clear that hands back at once.
- Park that survives everything and saves.
- A channel that shows where its value comes from.
- Edits on every selected fixture.

**Non-Goals:**
- Recording into cues.
- A Clear time.
- Per-family Clear.
- Grand master and blackout themselves: unit 4 applies them below Park.

## Decisions

### 1. Two overrides at packing time, not two more layers in the merge

`Channel` gets two runtime fields, `programmed` and `parked`, each a DMX number (0–255) or `null`.
`Universe.packFrame()` reads, per address:

```
value = source.parked !== null ? source.parked
      : source.programmed !== null ? source.programmed
      : source.value.DMX
```

- **Playback keeps writing `channel.value` underneath, untouched.** Cues, fades, rest and kept
  values carry on as today. Clearing is simply setting `programmed = null`: the next frame shows
  what plays.
- **No implicit base look any more.** `restValue` and `fromValue` read `channel.value`, which hand
  edits no longer touch.
- **Masters and blackout (unit 4)** will scale the merged value before the `parked` check, so
  parked channels ignore them, as the spec asks.
- **Why not in `Claims`:** a programmer slot would need tokens, stacks and fade rules for
  something that never fades. Packing is the one place every value passes through.
- **Cost:** two null checks per address per tick, no allocation.

### 2. Writing into the programmer: `Programmer.run`

New `models/DMX/programmer.js`, a singleton next to `Claims` (one programmer for the show):

- **`Programmer.run(fixtures, write)`** sets `Programmer.writing`, calls `write(fixture)` for each
  fixture, then unsets it. `Fixture.setChannel` checks `Programmer.writing` first, as it checks
  `Claims.writer`, and stores the clamped value in `channel.programmed`. The fine channel takes the
  fraction, exactly as `value` does today. So `setQuickAccessor`, `setColor`, `setPanTilt` and
  channel presets need no change.
- **`state`** is reactive: `held` and `parked`, the ids of the fixtures holding programmer values
  or parked channels. Writes go through raw channels (Vue never sees them), so these lists are
  what the rows and the header buttons read. `fixtures` (a raw id → fixture map) is what
  `clear()` walks.
- **`clear(fixtures?)`** sets `programmed = null` on those fixtures' channels, or on every held
  fixture; **`clearChannel(fixture, channel)`** clears one channel and its fine channel.
- **When it empties itself:** `Show.clearShowData()` and every show load call `clear()`, and
  `Show.deleteFixture` drops the fixture. The programmer is never in `showData`.

### 3. Park

- **Setting it:** `Fixture.park(channel, value)` and `unpark(channel)` set `channel.parked`
  (coarse and fine channels, as with `programmed`), through the fixture's own channel list, and
  update `Programmer.state.parked`. `parkedCount` counts them.
- **Saving:** `Fixture.showData` saves `parked: { <channel index>: <value> }`, only when some
  channel is parked. Loading (`prepareFixtures`) parks them again, and older files have no key.
  Park and Unpark change `showData`, so the unsaved marker follows by itself.
- **Clear** never touches `parked`.

### 4. Every selected fixture (universe modifier)

The universe fragment's handlers wrap their writes in `Programmer.run(selected, …)`. The selection
is `$view.universeFixtures`; the first fixture is the one the widgets show.

- **A fader, value or preset:** `fixture.setQuickAccessor(channel, value)` on each fixture. Matching
  by `type` and `qaIndex` already skips fixtures without that channel. With cells selected, each
  fixture's channel in the same-named cells.
- **Colour:** `fixture.setColor(rgb, cells)` on each, so each mixes on its own channels.
- **Pan/tilt:** the widget's value is turned into degrees with the first fixture's
  `angleRange(fixture, 'pan' | 'tilt')`. Each other fixture takes the same degrees through its own
  range, clamped to it, or the same DMX values when a range is unknown.

### 5. The channels widget's live mode

The universe view passes `sources` (one per shown channel) and `held` (`{ programmer, parked }`
for the selection); the scene editor passes neither and stays as it is. With `sources`:

- **Values flow one way.** Fader and value show `channel.output` (a getter: `parked ?? programmed
  ?? value.DMX`, read through the live mixin). The widget emits `input`, and the fragment writes
  through `Programmer.run`.
- **The source** comes from `views/utils/channel.source.js` `channelSource(channel)`, which returns
  a kind, a text and a colour (`SOURCE_COLORS`):
  - `parked` → "Parked at N", `--accent-red`;
  - `programmer` → "Programmer", `--accent-violet`;
  - `cue` → "<Family> cue: <name>" (`channel.slot.top.cue`, or the owner of a channel of no
    family), `--accent-blue`;
  - `kept` → "Kept from: <name>" (`slot.keptFrom`), `--accent-blue`;
  - `rest` → "Rest", no colour: the default look. Blue everywhere would bury the colours that
    matter.
  - The colour goes on the channel's menu box (border plus a 25% `color-mix` tint), since that
    box is where the channel is managed, and on the fader's fill. The number field stays plain.
    Box and fader carry the text as `title`.
  - A parked channel's fader and number field are `locked`: a new opt-in mode of
    `uk-fader` and `uk-num-input` that refuses input but keeps the colour (`disabled` greys it
    out). The fader repaints when its `color` changes.
- **The channel box's menu** (the `reselect` presets list) starts with **Park at <value>** or
  **Unpark**, then **Clear** while the channel is in the programmer, then the ranges. The action
  items carry a `live` key (not `action`, which `uk-list` renders as a button). Park sets the
  value its item reads (the first fixture's) on every selected fixture through `fixture.park`, Clear through `Programmer.clearChannel`.
- **Header buttons:** `uk-widget` gets an opt-in `actions` list: square buttons right after the
  title, `gap: --space-4`, each with `disabled`. The channels widget puts **Clear programmer** and
  **Unpark** there, disabled from `held`: in reach however many channels a fixture has, and
  without taking height from the faders.

### 6. Toolbar, keys, rows

- **Toolbar:** no block of its own (it would crowd the toolbar for a rare action). The
  Preferences menu gets **Clear programmer** with shortcut Ctrl+Shift+C, registered by `uk-menu`.
- **Rows:** `Fixture.heldMark` gives ` · prog` / ` · parked` from `Programmer.state`, and
  `Fixture.listable` adds it to its `more` text (`U1 - CH1 · prog`) for the fixture pool. The patch
  bay's universe rows unfold their fixtures with the address only (`addressLabel`): the mark would
  push the fixture names out of the narrow column.

## Risks / Trade-offs

- **[Behaviour change]** The hidden base look at rest goes: a hand-set dimmer no longer becomes
  where Intensity rests. That's the point, so it's in the manual. A wanted base look is a cue (the
  presets' rest cue) or a parked channel.
- **[Values shown vs values played]** In live mode the faders show `output`, not `value`, so they
  move while playback runs and freeze where the programmer holds them. The scene editor keeps
  showing scene values.
- **[Reactivity]** `programmed` and `parked` are plain channel fields, often reached through raw
  objects, so the UI reads `Programmer.state` for the rows and buttons and the live mixin for the
  values. `packFrame` reads them on raw objects: nothing is reactive per tick.
- **[Angles]** `angleRange` falls back to defaults for fixtures without data. The spec's "range
  known" means a range from the fixture profile; otherwise the same DMX values are sent.
- **[Unit 4]** Masters and blackout must be applied before the park check. The design reserves
  that order and `models/DMX/CLAUDE.md` will say so.
