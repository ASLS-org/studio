# DMX engine (src/models/DMX)

Use skill `dmx-model-change` for any change here. This file is the map.

## Object graph

```
Show (show.model.js, singleton via singletons/show.singleton.js)
├─ fixturePool  FixturePool → Fixture → Channel (runtime value per fixture)
│                Fixture.profile → shared, frozen FixtureProfile (src/models/fixtures/):
│                modes → channels { type, attribute, fine, capabilities, lookup }
├─ universePool UniversePool → Universe        (patch map, 512-byte frame, .stream)
├─ groupPool    GroupPool → Group
│                ├─ fixturePool (shared Fixture refs, via addExisting)
│                ├─ cuePool  CuePool → Cue → Scene | Effect
│                │            Scene: per-fixture channel values + Fade (Bézier in/out)
│                │            Effect: EffectPreset waves (sine/triangle/square), phase, spread
│                └─ chasePool ChasePool → Chase → CueItemPool → CueItem (bar-grid timeline)
├─ master       Master: triggers chase "rows" (same chase id) across all groups
├─ outputPool   OutputPool → WscConnection (plugins/wsc.connection.js)
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
  Three.js, `import.meta`). GDTF profiles carry a geometry tree per mode (`mode.geometry`).
- **Channel `type` keys and `qaIndex` are stored in showfile scenes.** `channel.types.js` keeps
  the original derivation (typos included); OFL pixel channels keep `type` = their name.
- A show whose GDTF type is missing asks through `MISSING_FIXTURES_EVENT` (show.model.js), then
  keeps each missing fixture as a placeholder (`placeholderProfile`): same id, address, groups and
  raw scene values, saved back unchanged. Fixtures save `channelCount`; a mismatch on load is
  reported (`Fixture.footprintChanged`).
- `Capability.getValue()` returns one reused object per capability: read it immediately. Entities
  the data doesn't give span their whole range and are flagged `implicit`.
- GDTF channels start at their home value (`profileChannel.defaultValue`, runtime only, never
  saved); OFL channels start at 0 (their `defaultValue` isn't read, to keep shows unchanged).

## Invariants

- **Serialization:** every persisted model exposes `get showData()`. `Show.showData` aggregates
  them; `Show.loadFromData()` rebuilds in this order: fixtures → universes (patch) → groups
  (fixtures, cues, chases) → outputs. References are serialized as ids and resolved through pools.
- **No undo:** models are plain classes; undo/redo is removed until change `add-undo-redo`.
  The unsaved `*` compares `Show.showData` with the last save (`Show.refreshSaveState()`), so keep
  playback/runtime state out of `showData`.
- **Reactivity:** `$show` is deeply reactive. Wrap render objects stored on models (3D instances)
  in `markRaw` where they are created.
- **Frames:** `Live.onFrame(fn)` callbacks run after the animations on every tick, also while
  paused or stopped. `UniversePool` uses one to pack each universe's persistent `frame`
  (`Uint8Array(512)`) and send it on running streams. Output, and later the visualizer, read
  frames, never channel objects.
- **Live:** `Live.add(updateFn, quantize = 0, fps = 60, onReady)` returns an id. With `quantize`
  the callback starts on the next quantized bar boundary. Always pair it with `Live.remove(id)`.
  Time units: `Live.beatDuration` / `Live.barDuration` in ms, derived from BPM.
- **Pools:** `addRaw`, `addExisting`, `getFromId` (throws), `delete`, `clearAll`, plus a `listable`
  getter that shapes data for `uk-list`. New pools follow the same API.
- **Ids:** numeric and unique per pool. Getters coerce with `Number(id)`. `FixturePool.addRaw`
  renumbers fixtures in load order, so never skip a saved fixture on load (references would shift).

## Known debt (don't copy these patterns)

- `show.model.js` is flagged `@todo Refactor whole class`. Keep additions minimal and well placed.
- `modifier.model.js` is marked for removal. Don't build on it.
- Several `console.log` calls remain; new code reports errors via `throw` or `EventBus.emit('app_error', err)`.
