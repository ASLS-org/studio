# Design

## Context

- **Controls today.** `uk-cue-container` (`views/components/uikit/cues/uikit.cue.container.vue`)
  binds each group's knob, **Isolate** and **Blackout** to `group.master` (0–255), `group.solo` and
  `group.disabled`. The master column is the same component with `master` set, its controls
  bound to an empty object. Nothing reads these values. `Group.showData` saves them, and the
  constructor resets them to 255, false and false on load.
- **Output.** `UniversePool.processFrame()` (a `Live.onFrame` callback) packs each universe with
  `Universe.packFrame()`: per address, parked, else programmed, else `value.DMX`, then invert. The
  visualizer and the output read only these frames.
- **Who shows a channel.** Each family channel has a raw `slot` (claims.js): `top` (the token
  shown), `under` and `fader` (while fading) and `keptFrom` (the cue that left a kept value). A
  token knows its cue; a cue knows its group's family stacks through its `CuePool` (`cue.stage`).
- **Intensity is wider than levels.** `families.js` puts Shutter and Strobe in Intensity, so the
  family alone can't tell what to scale.
- **Saving.** A load ends with `persistLocally()`, whose snapshot comes from `genShowFile()`, so
  dropping keys from `Group.showData` doesn't mark an older show unsaved.

## Goals / Non-Goals

**Goals:**
- Masters scale what is sent, never what cues or the programmer hold, so they can't leak into fades,
  kept values or the rest.
- No per-tick allocation; a few multiplications per scaled address.

**Non-Goals:**
- Changing the merge (`Claims.settle`).

## Decisions

### 1. Scale at packing time, like the programmer

`packFrame` gets, per address whose channel is **scaled** and not parked:

```
programmed !== null → programmed × grand
otherwise           → value × group(slot) × grand
```

- `grand` = 0 with DBO, else grand master ÷ 255.
- `group(slot)` = the factor of the group whose token the slot shows. While the slot fades
  (`fader` alive, factor `k` < 1), it blends: `under`'s group factor + (top's − under's) × k. A
  slot at rest or kept uses `keptFrom`'s group, else 1.
- **Alternative rejected: scaling inside `Claims.settle`.** It writes `channel.value`, which
  becomes the base for the next fade and the kept colour, so a knob at 0 would leave a dark colour
  kept after the cue stops.

### 2. Which channels are scaled

`Fixture.setupFamilies()` marks each channel once with a runtime `scale`:

- `'level'`: Intensity channels whose attribute is a level (`Dimmer`, `Intensity`,
  `HSB_Brightness`, `CIE_Brightness`, and their fine channels);
- `'colour'`: on a fixture with no level channel, additive colour channels (`ColorAdd_*`,
  `ColorRGB_*`);
- `null`: everything else (shutter, strobe, CMY, CTO, positions, beam).

A fine channel gets a runtime `coarse` link. A scaled 16-bit pair is scaled as one value: the
coarse address sends `floor(v × f)`, the fine address the fraction × 255, both from the coarse
and fine values together.

### 3. Group factors, computed once per tick

- **Group** keeps `master`, `solo` and `disabled` as runtime fields, plus a raw
  `output = markRaw({ factor: 1 })` shared with its `CuePool`. `CuePool` sets `cue.output`
  next to `cue.stage`, and a `ClaimToken` copies it at take.
- **Master** gets `level` (0–255, 255) and `blackout` (false), runtime, and `prepare()`. It
  computes every group's `output.factor`:
  - 0 with Blackout;
  - 0 when some group is isolated and this one isn't;
  - else `master ÷ 255`.
  It also computes `grand`. `UniversePool.processFrame` calls it before packing: a loop over a
  few groups, no allocation.
- **Why per tick and not on change:** the knob writes through the reactive groups. Reading
  the plain fields once per tick needs no watcher, and Isolate needs every group anyway.
- `Universe.packFrame` reads `grand` and the factors through a raw handle on `Master` that
  `UniversePool` holds (`UniversePool.master`, set by `Show` next to `sink`).

### 4. Not saved

`Group.showData` drops `solo`, `disabled` and `master`. The constructor already ignores them on
load, so older files load as before. `Master` has no `showData`.

### 5. UI

In `uk-cue-container`:
- **A group** keeps its knob (`group.master`), **Isolate** and **Blackout**.
- **The master column** binds its knob to `$show.master.level` and **Blackout** to
  `$show.master.blackout`, and shows no **Isolate**.

DBO lit uses the existing Blackout colour.

### 6. Activity dots that show the output

- **Today.** The five dots read `Group.DMXActivity`, a sum never wired to the merge, through a
  binary trick, so they say nothing useful.
- **`scaledLevel` moves to `master.model.js`,** so the packing and the dots share one formula.
- **Group dots.** `Master.groupLevel(group)` is the highest sent level of the group's coarse
  scaled channels whose slot shows the group (`top.output`, else `keptFrom.output`), skipping
  programmed and parked ones.
- **Master column dots.** `Master.rigLevel()` is the highest over every fixture (it gets the fixture
  pool), whatever sends it.
- **Two tones.** `groupLevels` / `rigLevels` return `{ asked, sent }`: `asked` is the value before
  the masters. `ceil(level × 5)` dots light from the bottom (any level lights one): `sent` in the
  column's colour, then up to `asked` in a 30 % `color-mix` of it over `--secondary-dark`.
- **Held back.** A container computes why its column is held back (DBO, its Blackout, Isolate
  elsewhere) from the reactive settings. The knob's arc turns `--secondary-light` and its
  `title` says why.
- **Double-click.** `uk-knob` gets an opt-in `reset` (a value). A double-click sets it and emits
  `update:modelValue`. Without it, the old double-click stays (emits `input` 0, ignored by
  `v-model`).
- **Refresh.** The container reads the levels through `live()`, so they follow the live ticker
  while playing. A computed key of every master setting makes them follow a knob at once while
  paused, calling `prepare()` first. The cost is a pass over a group's fixtures at 25 Hz, in the
  UI and not per tick.
- **Tried and dropped after review:** a level bar (`uk-vumeter`) and faders in place of the knobs.

## Risks / Trade-offs

- **[Cross-group fades]** A fixture fading from group A's cue to group B's blends the two factors
  by the fade. A knob moved mid-fade takes effect at once.
- **[Kept colours]** On a fixture without a dimmer, a colour kept after its cue stops follows that
  cue's group knob. That knob still owns the look on stage.
- **[Programmer and Isolate]** Hand values ignore group knobs, Isolate and Blackout by design;
  only the grand master and DBO reach them. Parked channels ignore everything.
- **[Per-tick cost]** For each scaled address: one slot read, two multiplications, and a blend
  while fading. Unscaled addresses are unchanged.
