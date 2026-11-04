# Design

## Context

See proposal.md and the epic doc § Target architecture. Current state (2026-11-04):

- `Fixture.setChannel()` writes `channel.value.DMX`, then resolves the capability and pushes the
  values into `_3DModel` (a `MovingHead`): `colorIntensity`, `colorWheelSlot`, `colorPreset`, or
  the capability's value keys (`intensity`, `pan`, `panFine`, `strobeFrequency`, ...). A write to
  channel 0 also resets `colorPreset`. `Fixture` imports `MovingHead` and `Controls`; `highlight*`,
  `posX..rotZ` and `position`/`rotation` setters drive them directly; `FixturePool.delete` calls
  `highlight(false, true)` and `Fixture.deleteInstance` removes the 3D instance.
- `Universe.DMX512Data` allocates a `Uint8Array(512)` per read. `WscConnectionStream.start()`
  registers `forward()` as a `Live` animation, so it runs in registration order relative to cues,
  and not at all while `Live` is paused or stopped (`Live.update()` only runs animations while
  playing).
- The show is loaded through the reactive `$show`, so cues and scenes hold reactive fixture
  references and `Live` callbacks are bound to reactive `this`: playback writes trigger Vue.
  Widgets read live values through `simplifiedChannels`, `panTilt` and `color` getters (which
  allocate), `cue.time`, `cue.state`, `chase.elapsedPerc`, `chase.state` and a watcher on
  `group.DMXActivity`.
- There is no picking in the 3D view: selection always starts in the UI (6 view files call
  `highlight` / `highlightSingle`, the position tool binds `posX..rotZ`).

## Goals / Non-Goals

**Goals:**
- No Three.js import and no 3D work in `src/models`.
- One DMX frame per universe per tick, shared by output and visualizer.
- No Vue work in the engine tick; UI refresh cost independent of the number of running cues.
- A visualizer driven only by data and events, so unit 3 can move it into a Worker unchanged.

**Non-Goals:**
- New look, new light model, render on demand (unit 3).
- Engine in a Worker (see § Next evolution).
- Rendering other fixture categories; patching still refuses non-Moving Head fixtures (unit 5).

## Decisions

1. **Two phases per `Live` tick.** `Live.update()` runs animations (only while playing), then
   always runs frame callbacks registered with `Live.onFrame(fn)` / `Live.offFrame(id)`.
   *Alternative:* keep streams as animations. Rejected: order-dependent lag, no output when paused.
2. **Universe frame packing.** Each `Universe` owns one persistent `frame = Uint8Array(512)`.
   `UniversePool` registers one frame callback that packs every universe (address map → fixture
   channel value) and then calls `forward(frame)` on each running stream. `DMX512Data` returns the
   frame without allocating. `WscConnectionStream.start/stop` only flip its state.
   Cost: 512 byte copies per universe per tick.
3. **Raw engine tick.** `Cue.cue()` and `Chase.cue()` bind their `Live` callbacks to the raw
   object; `Fixture` builds `Channel`s with `markRaw`. Both go through one helper,
   `src/models/utils/reactivity.js` (re-exporting `markRaw`/`toRaw`), the only Vue touch point in
   the models, to be replaced when the engine moves to a Worker.
4. **UI ticker** (`src/plugins/live.ticker.js`, `this.$liveTicker`): a reactive `frame` counter
   incremented every 40 ms (25 Hz) while at least one widget is subscribed, plus `bump()` for an
   immediate refresh after an operator edit. Live-value widgets subscribe on mount, unsubscribe
   on unmount, and read live values inside a computed that touches `$liveTicker.frame`. The
   `group.DMXActivity` watcher becomes ticker-driven.
5. **Visualizer input = patch snapshot + frames.** `Show.patchSnapshot` returns plain entries
   `{ id, universe, chStart, channels (shared profile mode channels), category, physical, wheels,
   panRange, tiltRange, position, rotation }`. A new `plugins/visualizer/fixture_renderer.js` keeps
   one `MovingHead` per entry (created, updated or deleted by diffing ids), keeps a copy of the
   last decoded frame per universe, and on each rendered frame re-decodes every fixture with a
   changed byte: all its channels in mode order, channel 0 first, through the same capability
   switch `Fixture.setChannel` uses today (moved here).
6. **Model → view events** on the existing `EventBus` (mitt):
   - `patch_changed` (no payload) from patch, unpatch, mode change, fixture add/delete; coalesced
     to one rebuild per animation frame.
   - `fixture_pose { id, position, rotation }` from `Fixture` position/rotation setters (`posX`..).
   - `fixture_highlight { id, state, single, center }` from `highlight` / `highlightSingle`, which
     keep their signatures so the 6 calling views don't change.
   The visualizer fragment subscribes and calls the renderer; models never import the visualizer.
7. **Gizmo writes back through an event.** `Controls` works on renderer instances keyed by fixture
   id and emits `fixture_transformed { id, position, rotation }` after a drag; the visualizer
   fragment applies it to the fixture (`position`/`rotation` setters, which emit `fixture_pose`).
8. **Patching stays Moving Head only** in this unit: the check moves from
   `Fixture.prepare3DModelInstance()` to the patch path (`FixtureLibrary` profile category), with
   the same error message.

9. **Chase-driven cues get their own runtime flag.** Chases call `CueItem.update()` directly, so
   `cue.state` never reflects chase playback (and `Chase.update()` resets it to 0 for items outside
   their window). Reusing `state` would break `Scene`, which reads it to re-capture start values
   for relative fades. A separate `chaseActive` flag, set per cue item pool on every chase tick,
   drives the play indicator and `Group.DMXActivity`. One chase runs per group at a time
   (`Group.cueChase` stops the others), so a boolean is enough.

## Next evolution: engine in a Worker (not in this unit)

Once frames exist, the engine can move off the main thread with the universe buffer as the only
value storage (option C in the planning discussion):

```
 main thread                               engine worker
 +---------------------------+   edits     +------------------------------+
 | Vue UI, show document     | ----------> | cues, effects, chases, Live  |
 | visualizer (or its worker)| <---------- | universe buffers (only store)|
 +---------------------------+   frames    +------------------------------+
                                  (transferred or SharedArrayBuffer)
```

Channels then hold no values; UI, output and visualizer read frames. This needs: the show
document split from runtime state, edits sent as messages, and `SharedArrayBuffer` (requires
cross-origin isolation: COOP/COEP headers on the web host, available in Electron) or transferred
copies per frame. Decisions 1-6 are chosen so that move only replaces where frames come from.
Tracked in the epic backlog.

## Risks / Trade-offs

- [A widget showing live values is missed and freezes] → inventory with
  `grep -rn "elapsedPerc\|DMXActivity\|\.time\b\|\.state\b\|simplifiedChannels\|panTilt" src/views`
  before switching to raw writes; each one gets a task.
- [Output now runs while stopped: someone relying on "stop = blackout"] → documented in the
  manual; stop still resets playback.
- [Decoding differences from per-write pushes (order, channel 0 quirk)] → decode whole fixtures in
  mode order with channel 0 first; compare the demo show side by side with the previous build.
- [Many `patch_changed` events while loading a show] → coalesced per animation frame.
- [Gizmo feels different] → same `Controls` code, only the instance lookup and write-back change.
- [PR size] → likely above the 400-line guideline; the task groups split cleanly into "engine
  frame + output + UI ticker" (groups 1-3) and "visualizer decoupling" (groups 4-5) if review
  needs two PRs.

## Migration Plan

No data migration. Rollback is reverting the commits.
