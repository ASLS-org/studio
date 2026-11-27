# DMX engine (src/models/DMX)

Use skill `dmx-model-change` for any change here. This file is the map.

## Object graph

```
Show (show.model.js, singleton via singletons/show.singleton.js)
├─ fixturePool  FixturePool → Fixture → Channel (runtime value per fixture)
│                Fixture.profile → shared, frozen FixtureProfile (src/models/fixtures/):
│                modes → channels { type, attribute, fine, capabilities, lookup }
├─ universePool UniversePool → Universe        (patch map, 512-byte frame; packed frames → sink)
├─ groupPool    GroupPool → Group
│                ├─ fixturePool (shared Fixture refs, via addExisting)
│                ├─ cuePool  CuePool → Cue → Scene | Effect
│                │            Scene: per-fixture channel values + Fade (Bézier in/out)
│                │            Effect: EffectPreset waves (sine/triangle/square), phase, spread
│                └─ chasePool ChasePool → Chase → CueItemPool → CueItem (bar-grid timeline)
├─ master       Master: triggers chase "rows" (same chase id) across all groups
├─ outputPool   OutputPool → WscGateway (plugins/wsc.connection.js) + DmxRoute (route.model.js)
└─ Live         live.model.js: singleton clock, BPM, tap tempo, animation pool
```

Enums live next to their model and are exported: `CUE_TYPES`, `CUE_STATES`,
`CUE_TRIGGER_STYLES`, `CUE_LOOP_STYLES` (cue.model.js), `LIVE_STATES` (live.model.js).

## Fixture profiles (src/models/fixtures)

- `fixture.library.js` (`FixtureLibrary.getProfile(source, manufacturer, model)`) is the only way
  to get a fixture definition; it caches one frozen profile per fixture type. Never fetch library
  JSON elsewhere.
- Sources: `ofl.adapter.js` (bundled OFL JSON; pixel blocks expanded per cell) and
  `gdtf.adapter.js` + `gdtf.archive.js` (`.gdtf` zip). GDTF files come from `gdtf.store.js`
  (IndexedDB, imported with `FixtureLibrary.importGDTF`), then the `public/gdtf/` bundle; neither →
  `MissingFixtureError`. Adapters, `channel.types.js` and `fixture.profile.js` stay pure (no Vue,
  Three.js, `import.meta`). GDTF profiles carry a geometry tree per mode (`mode.geometry`);
  wheel images and mesh files stay beside the frozen profile (`FixtureLibrary.wheelImages` /
  `modelFiles`) and reach the visualizer through `Show.patchSnapshot`, never `showData`.
- **Channel `type` keys and `qaIndex` are stored in showfile scenes.** `channel.types.js` keeps
  the original derivation (typos included); OFL pixel channels keep `type` = their name.
- A show whose GDTF type is missing asks through `MISSING_FIXTURES_EVENT` (show.model.js), then
  keeps each missing fixture as a placeholder (`placeholderProfile`): same id, address, groups and
  raw scene values, saved back unchanged. Fixtures save `channelCount`; a mismatch on load is
  reported (`Fixture.footprintChanged`).
- `Capability.getValue()` returns one reused object per capability: read it immediately. Entities
  the data doesn't give span their whole range and are flagged `implicit`. `Capability.label` is
  the range's short name (`fixtures/capability.labels.js`, set by the adapters, never saved).
- **Cells** (`fixtures/fixture.cells.js`): parts repeating a set of channels (GDTF geometries,
  OFL pixels; pixel groups and other channels are the whole fixture). Each `Channel` has `cell`
  and `kind` (type without the cell's name: OFL pixel types differ per cell, so compare on
  `kind`). Colour and Pan/Tilt per cell go through `cell.access.js`, shared by `Fixture` and the
  scene's `FixtureValue` (`getColor(cells)`, `setPanTilt(value, cells)`; `color` / `panTilt` are
  all cells). Effects write precomputed per-cell targets (`FXFixture.targets`), never quick
  accessors.
- GDTF channels start at their home value (`profileChannel.defaultValue`, runtime only, never
  saved); OFL channels start at 0 (their `defaultValue` isn't read, to keep shows unchanged).

## Invariants

- **Serialization:** every persisted model exposes `get showData()`. `Show.showData` aggregates
  them; `Show.loadFromData()` rebuilds in this order: fixtures → universes (patch) → groups
  (fixtures, cues, chases) → outputs (gateways, then routes; a route missing its universe or
  gateway is dropped). References are serialized as ids and resolved through pools.
- **No undo:** models are plain classes; undo/redo is removed until change `add-undo-redo`.
  The unsaved `*` compares `Show.showData` with the last save (`Show.refreshSaveState()`), so keep
  playback/runtime state out of `showData`.
- **Reactivity:** `$show` is deeply reactive. Wrap render objects stored on models (3D instances)
  in `markRaw` where they are created.
- **Output remap:** `Universe.packFrame` writes each address from
  `channels[channel.outputSource]`, as `255 - value` when `channel.outputInvert`; `Fixture.setupOutput`
  sets both from `invertPan` / `invertTilt` / `swapPanTilt` (saved). Programmed values never change.
- **Programmer and Park (programmer.js):** two runtime fields per `Channel`, `programmed` and
  `parked` (DMX or `null`), applied only in `Universe.packFrame` (parked, else programmed, else
  `value.DMX`; `Channel.output` is the same). Playback keeps writing `value` underneath, so Clear
  is `programmed = null`. Hand edits go through `Programmer.run(fixtures, write)`: while
  `Programmer.writing`, `Fixture.setChannel` stores into `programmed` (checked before
  `Claims.writer`). Park is `Fixture.park` / `unpark`, saved as `showData.parked` (index → value);
  the programmer is never saved and `Programmer.reset()` runs on show clear. The UI reads
  `Programmer.state` (reactive id lists), not the channels. Unit 4's masters and blackout must
  scale the merged value before the parked check.
- **Frames:** `Live.onFrame(fn)` callbacks run after the animations on every tick, also while
  paused or stopped. `UniversePool` uses one to pack each universe's persistent `frame`
  (`Uint8Array(512)`) and hand it to `UniversePool.sink` (the output pool, raw), which sends it on
  the universe's enabled routes (skill `wsc-output`). Output, and later the visualizer, read
  frames, never channel objects.
- **Live:** `Live.add(updateFn, quantize = 0, fps = 60, onReady)` returns an id. With `quantize`
  (in beats, fractions allowed) the callback starts on the next multiple of that many beats of
  Live time. Chases store their Quantize as an option index and convert it with
  `CHASE_QUANTIZE_BEATS`. Always pair it with `Live.remove(id)`.
  Time units: `Live.beatDuration` / `Live.barDuration` in ms, derived from BPM.
- **Fades:** `Fade.getValue(time, duration)` solves the Bézier for time (x(t) = time fraction,
  Newton then bisection, no allocation) and plays y(t), so playback matches the drawn curve.
  Presets are indexed in `FADE_PRESETS` order (stored in showfiles): append, never reorder.
  Control point Y may overshoot (−1 to 2); scenes clamp each written value to 0–255 (the universe
  frame is a `Uint8Array`, which would wrap).
- **Merge (claims.js, families.js):** cues never write channels directly while they play.
  - **Families.** `familyOf(channel)` sorts channels by GDTF attribute into Intensity, Colour,
    Position, Beam (else -1: newest writer wins). `Fixture.setupFamilies()` gives each fixture one
    raw **slot** per family. Family sets are arrays of 4 booleans (lint forbids bitwise ops).
  - **Tokens.** Each play (`cue(true)`, a chase item entering in `playItem`) takes a raw token
    (`Claims.take(cue, { layer, temporary })`): start stamp (the newest wins; no priority), fade
    state, and a `values` Map of what the cue last wrote. `Cue.play` wraps `update(t)` in
    `Claims.open/close`;
    `Fixture.setChannel` then only stores values (`Claims.write`), so skipped ticks keep them.
  - **Events, not ticks.** `close()` places a token in its group's `familyStacks` (newest
    first) and its slots when what it writes changes; `release()` takes it out. Each slot's
    `top` = the best group holder reaching that fixture; `under` = what it fades from or hands
    back to. A Replace token turns off cues it covers entirely once faded in (`pendingOff` →
    `Cue.letGo`); Layer and Temporary tokens never do.
  - **Settle.** `Live.update` calls `Claims.settle()` after the animations: one pass over
    `liveSlots`, blending top with under by the fader's factor; undriven colour channels at 0,
    other undriven channels at `fromValue`. A slot nobody holds rests (Intensity → `restValue`,
    others keep what the stage showed, with `keptFrom` = the cue that left, until another cue
    takes them; there is no reset) and leaves `liveSlots`. `restValue` is recorded only when a
    `rested` slot is taken, so a kept value never becomes the rest.
  - **No direct writes.** Writes with no writer (scene editing, loading) go straight to the
    channel; the universe view writes into the programmer, so hand values never become the rest.
  - **Programming is blind.** A click on a cue only opens it; only `cue()` and chase items play.
    There is no preview token and no raise.
  - **One family per cue.** `Cue.family` (saved key, one of `FAMILY_KEYS`) is its cue pool column.
    `Group.loadCues` splits an older cue (no family, or `LOOK_FAMILY` `'custom'`) into one cue per
    family it uses (`familyData(keeps)` on scenes and effects; the first part keeps the id and
    the channels of no family) and `Group.addChase(data, parts)` copies its lanes.
  - **Progress.** `Cue.progress` (a scene's fade factor, an effect's pass) fills its row;
    `stopProgress` records it when a play stops (stop, fade-out start, One Shot end, item let
    go): a kept cue's row shows it.
  - **Chips** read `cue.heldFamilies` (set on events), `usedFamilies` (from content),
    `holdsItem`; NOW (`views/utils/cue.now.js`) reads `group.familyStacks[f][0]`, else the slots'
    `keptFrom`. `Claims.reset()` runs on show clear; `CuePool.delete` stops and releases.
- **Cue fades:** every `Cue` has `fadeIn` / `fadeOut` (`Fade`, `duration` in bars, 0 = none;
  `Cue.buildFade`; an older scene's Fade In takes its saved Duration).
  - Every cue fades, scenes and effects in either Mode (`relative`, labelled Replace/Layer in
    the UI); a Replace cue turns off what it covers once faded in.
  - `Cue._update` computes one `fadeFactor` per tick (`computeFadeFactor`). The token carries it
    (`factor`, `releasing`), and the merge does the blending. Scenes and effects write plain
    values.
  - `cue(false)` with a Fade Out sets `IDLE` at once and keeps the Live animation until the
    release ends (`stopNow`).
  - Scenes stay on until turned off (`endsAfterDuration` false). A One Shot effect ends at its
    Duration, fading out first when it has a Fade Out.
  - `cue()` on a running cue stops it, whatever the argument (the cue pool toggles with
    `cue(true)`).
- **Chase items:** `Chase.update` calls `CueItem.update` → `Cue.playItem(t, lengthMS)` for the item
  under the playhead, and `cue.endItem()` once the item is left (faded out: released; else its
  token keeps its families until taken, the chase stops, or NOW naming it is clicked). It tags
  `cue.itemChase` for NOW.
  - An item token a Replace cue turns off (`Cue.letGo`) sets `itemCut`: the item stays off until
    the cue's next item (re-taking at once made two overlapping Replace items swap every tick).
  - The factor comes from `itemFades(lengthMS)`, the fades shrunk to fit; `itemOut` marks the
    item's fade-out as releasing.
  - Items never call `cue()`. The timeline's item preview uses the same `itemFades`.
  - A chase stopped, by hand or at a One Shot end, releases its items' tokens.
- **Pools:** `addRaw`, `addExisting`, `getFromId` (throws), `delete`, `clearAll`, plus a `listable`
  getter that shapes data for `uk-list`. New pools follow the same API.
- **Ids:** numeric and unique per pool. Getters coerce with `Number(id)`. A fixture or universe
  loaded from a show keeps its saved id (references point to it); new ones get the highest id + 1.
  A universe's id never changes after that (routes refer to it; the number sent is the route's).
  Addresses (`chStart`) are 0-based in the engine and showfiles; views show them 1–512
  (`views/utils/dmx.js`). Move patched fixtures only through `UniversePool.repatch(moves)` (checks
  the whole result, then unpatches and patches), never by writing `chStart`. Loading
  skips universe/group references to missing fixtures and reports the count.
  `Show.deleteFixture` finds the universe by membership and never stops halfway.

## Known debt (don't copy these patterns)

- `show.model.js` is flagged `@todo Refactor whole class`. Keep additions minimal and well placed.
- `modifier.model.js` is marked for removal. Don't build on it.
- Several `console.log` calls remain; new code reports errors via `throw` or `EventBus.emit('app_error', err)`.
