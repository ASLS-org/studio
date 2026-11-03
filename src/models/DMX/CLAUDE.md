# DMX engine (src/models/DMX)

Use skill `dmx-model-change` for any change here. This file is the map.

## Object graph

```
Show (show.model.js, singleton via singletons/show.singleton.js)
├─ fixturePool  FixturePool → Fixture (Proxify) → Channel → Capability (capabilityManager)
├─ universePool UniversePool → Universe        (patch map, 512-byte _dmxBuffer, .stream)
├─ groupPool    GroupPool → Group
│                ├─ fixturePool (shared Fixture refs, via addExisting)
│                ├─ cuePool  CuePool → Cue (Proxify) → Scene | Effect
│                │            Scene: per-fixture channel values + Fade (Bézier in/out)
│                │            Effect: EffectPreset waves (sine/triangle/square), phase, spread
│                └─ chasePool ChasePool → Chase → CueItemPool → CueItem (bar-grid timeline)
├─ master       Master: triggers chase "rows" (same chase id) across all groups
├─ outputPool   OutputPool → WscConnection (plugins/wsc.connection.js)
└─ Live         live.model.js: singleton clock, BPM, tap tempo, animation pool
```

Enums live next to their model and are exported: `CUE_TYPES`, `CUE_STATES`,
`CUE_TRIGGER_STYLES`, `CUE_LOOP_STYLES` (cue.model.js), `LIVE_STATES` (live.model.js).

## Invariants

- **Serialization:** every persisted model exposes `get showData()`. `Show.showData` aggregates
  them; `Show.loadFromData()` rebuilds in this order: fixtures → universes (patch) → groups
  (fixtures, cues, chases) → outputs. References are serialized as ids and resolved through pools.
- **Undo:** classes that extend `Proxify` call `return this.proxify([...except])` at the end of the
  constructor. `except` lists keys that must not be tracked (handles, caches, runtime state).
  Undo entries are batched per mouse-down/up (`ProxifySingleton.regenHash`).
- **Live:** `Live.add(updateFn, quantize = 0, fps = 60, onReady)` returns an id. With `quantize`
  the callback starts on the next quantized bar boundary. Always pair it with `Live.remove(id)`.
  Time units: `Live.beatDuration` / `Live.barDuration` in ms, derived from BPM.
- **Pools:** `addRaw`, `addExisting`, `getFromId` (throws), `delete`, `clearAll`, plus a `listable`
  getter that shapes data for `uk-list`. New pools follow the same API.
- **Ids:** numeric and unique per pool. Getters coerce with `Number(id)`.

## Known debt (don't copy these patterns)

- `show.model.js` is flagged `@todo Refactor whole class`. Keep additions minimal and well placed.
- `modifier.model.js` is marked for removal. Don't build on it.
- `fixture.model.js` builds its `MovingHead` 3D instance itself (models → visualizer coupling).
- Several `console.log` calls remain; new code reports errors via `throw` or `EventBus.emit('app_error', err)`.
