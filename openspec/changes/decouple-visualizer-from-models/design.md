# Design

Draft from the epic planning (2026-11-03). Refine in the unit branch before writing specs and
tasks.

## Context

See proposal.md and the epic doc § Target architecture. Today `Fixture.setChannel()` resolves the
capability and writes straight into `_3DModel` (colour, wheel slot, preset, pan/tilt/zoom setters),
`posX`/`rotX` setters call `Controls.detach/attach`, and `highlight*` drive `MovingHead` and
`Controls`. `Universe.DMX512Data` builds a fresh `Uint8Array(512)` on every read for the WSC
stream. The visualizer render loop runs in `AnimationManager` (rAF), separate from `Live`.

## Goals / Non-Goals

**Goals:**
- Models free of Three.js imports.
- One data path for output and visualizer (DMX frames).
- Visualizer API that can cross a Worker boundary.

**Non-Goals:**
- Changing the look, the beam shader or the light model.
- Changing how cues and effects compute values.

## Decisions

1. **Universe-owned frame buffers.** Each universe keeps one persistent `Uint8Array(512)` updated
   when channels change (or packed once per tick), reused by the WSC stream and the visualizer.
   Removes the per-read allocation.
2. **Patch snapshot + frames as the visualizer's input.** The visualizer receives a patch snapshot
   when the patch or placement changes (fixture id, universe, address, profile id, pose) and reads
   frames every rendered frame. Profiles are shared immutable data, sent once.
3. **BeamState buffer** (struct-of-arrays `Float32Array`s: position, direction, colour, intensity,
   field angle, wheel slots, shutter/strobe) filled by a decoder that walks only channels whose
   bytes changed since the last frame.
4. **Interaction through ids and events:** `visualizer.highlight(ids)`,
   `visualizer.focus(id)`, gizmo emits `fixture_transformed { id, position, rotation }` on the event
   bus; the view applies it to the model.
5. **Temporary adapter:** the existing `MovingHead` instanced meshes are driven from BeamState so
   the current look ships unchanged; units 3 and 4 replace it.

## Risks / Trade-offs

- [Strobe and other time-based effects relied on per-write setters] → decoder computes them per
  rendered frame from attribute values and time.
- [One frame of latency between engine and view] → acceptable; matches what hardware sees.
- [Selection code spread over many views] → inventory every `highlight`, `posX`, `rotX` caller
  first (about 10 view files today).

## Open Questions (resolve while refining this unit)

- Pack DMX frames per tick in `Live` or update the universe buffer on each channel write.
- Whether `Fixture` keeps per-channel value objects for the UI or reads from the universe buffer.
