---
name: dmx-model-change
description: Checklist for adding or changing anything in the DMX show engine (src/models/DMX, Live). Use for new model properties, new cue/effect/chase behaviour, new pools, or any change to what a showfile stores. It keeps save/load, the unsaved marker, Live animations and older showfiles working.
---

# Changing the DMX engine

Read `src/models/DMX/CLAUDE.md` first for the object graph.

## 1. Locate the change

- Find the owning model and every caller: `grep -rn "<prop or method>" src`.
- Check whether the value is **persisted** (belongs in the showfile) or **runtime-only** (playback
  state, handles, caches). Each kind gets different handling below.

## 2. Add or change a property

Follow the getter/setter pattern used across the models:

```js
/**
 * Fade-out duration in bars
 *
 * @type {Number}
 */
set fadeOut(value) {
  this._fadeOut = Math.max(0, Number(value));
}

get fadeOut() {
  return this._fadeOut;
}
```

- Clamp and coerce in setters. Values arrive from UI inputs as strings or out of range.
- Give a default in the constructor from the `DEFAULT_*_DATA` constant:
  `this.fadeOut = data.fadeOut ?? DEFAULT_CUE_DATA.FADE_OUT`.

## 3. Persisted? Do the round trip

- [ ] Add the key to the model's `get showData()`. Store ids for references, never instances.
- [ ] Make sure the constructor or `addRaw()` reads it back, with a default when the key is missing.
      Older showfiles never contain new keys.
- [ ] If the field references another entity, resolve it in the right `Show.prepare*()` step. The
      load order is fixtures → universes → groups (fixtures, cues, chases) → outputs.
- [ ] If the field is useful in the demo, add it to `public/demo/showfiles/demo.showfile.json`.
- [ ] Never rename or remove an existing showfile key without a fallback read of the old key.

## 4. Runtime-only?

- [ ] Keep it out of `get showData()`. The unsaved `*` compares `showData` with the last save, so a
      playback value there would mark the show unsaved while it plays.
- [ ] Render objects (3D instances, Three.js handles) stored on a model are wrapped in `markRaw`
      where they are created, so Vue doesn't proxy them through `$show`.
- [ ] There is no undo/redo to register with (removed until change `add-undo-redo`).

## 5. Time-based behaviour

- [ ] Register with `Live.add(this._update.bind(this), quantize, fps, onReady)` and store the id.
- [ ] `Live.remove(id)` on stop, on delete, and before re-adding. `remove` throws on an unknown id,
      so guard on state.
- [ ] Express durations in bars and convert with `Live.barDuration` so BPM changes stay in sync.
- [ ] Per-tick code: no allocations, no `console`, no Vue-reactive writes in hot loops.
- [ ] `Live` callbacks run on the raw object (`toRaw` from `src/models/utils/reactivity.js`, as in
      `Cue.cue()`): fields they write don't notify Vue. If the UI shows such a field, the widget
      reads it through the live mixin (`$liveTicker`); never rely on reactivity for playback fields.
- [ ] Work that must run every tick whatever the play state (packing, output) uses
      `Live.onFrame(fn)` / `Live.offFrame(id)`, not `Live.add`.

## 6. Deletion paths

Deleting an entity must remove every reference to it. Follow `Show.deleteFixture()`: groups →
cues → universe patch → pool. Stop its `Live` animations and WSC streams first.

## 7. Finish

- [ ] JSDoc on every new class, method and accessor (docma builds `src/models/**`).
- [ ] `npx eslint <touched files>` is clean.
- [ ] Verify with skill `run-studio`: edit → `*` appears → save → `*` clears → reload page → value
      restored; playback starts and stops cleanly without setting `*`.
- [ ] If users see the change: skill `user-manual`. If the architecture changed: skill
      `ai-context-maintenance`.
