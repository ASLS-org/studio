# Proposal

Epic: `openspec/epics/gdtf-render-pipeline.md`, unit 3.

## Why

Light on the stage is drawn with one real `SpotLight` per fixture. Every lit pixel loops over all
of them, materials recompile when fixtures are added or removed, and low-end GPUs hit their limits
well before a real rig size. Gobos never appear on surfaces, nothing adapts to the machine, and the
renderer shares the main thread with the engine and the UI. The target is smooth playback on a
2015 integrated-graphics laptop, and ideally a Raspberry Pi 5.

## What Changes

- **Spike first:** a throwaway prototype (not shipped) measures surface lighting with gobos and
  raymarched beams on the target machines, and fixes the tier boundaries with numbers.
- Every beam becomes a projector built from the per-beam state of unit 2: pose, field angle,
  iris, gobo cookie (rotation, shake), focus/frost as blur, colour, prism sub-beams, intensity.
- Light on surfaces uses one strategy per tier: footprint decals (T0) or deferred light volumes
  with cookies (T1-T2). Gobos show on the floor and set at every tier. No real lights per fixture.
- Beam guides: thin lines for each beam's axis, cone edges and floor footprint, sharp at any
  resolution scale and cheap enough for the weakest machines. They are the lowest tier (Guides)
  and a Visualizer setting (Auto, On, Off) at every tier.
- A quality governor picks the starting tier from the device and steps tier and resolution scale
  from measured frame time. A Quality setting (Auto, Low, Medium, High, plus resolution scale) in
  the visualizer settings overrides it, stored per device, not in the showfile.
- The visualizer runs in a Worker with an OffscreenCanvas, falling back to the main thread when
  unsupported. Rendering only happens when DMX or the camera changed.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `visualizer`: quality tiers, adaptive quality, the Quality setting, gobos on surfaces, render
  on demand.

## Impact

- Showfile format: none (quality is a device setting).
- Undo/redo: none.
- Live playback/timing: none; rendering leaves the main thread where supported.
- WSC output: none.
- Visualizer: new surface lighting at all tiers; the in-air beams stay as today until unit 4.
- Web vs Electron: same; WebGL2 required.
- Code: `plugins/visualizer/*` (new renderer modules), visualizer fragment and settings popup,
  removal of per-fixture `SpotLight`s.

## Out of scope

- New in-air beams and haze (unit 4).
- GDTF geometry and wheel images (unit 5); gobos use a built-in set until then.
- T3 (shadows, WebGPU) and the 2D plan view (epic backlog).

## User manual

Visualizer page § Settings: add the Quality setting and explain Auto; update § Lighting.
