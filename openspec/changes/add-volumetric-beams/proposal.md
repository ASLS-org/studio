# Proposal

Epic: `openspec/epics/gdtf-render-pipeline.md`, unit 4.

## Why

In-air beams are additive cones shaded with four octaves of 3D noise per pixel at full
resolution. They are the most expensive part of the scene on weak GPUs, they cannot show gobo
patterns in the haze, and their quality cannot be lowered. After unit 3 they are the last piece of
the old renderer.

## What Changes

- New in-air beams built on the unit 3 beam state, by quality level:
  - Guides: no air beam.
  - Low: closed-form scattering for a cone in uniform haze (no steps), no gobo.
  - Medium: the same with a soft gobo approximation, plus bloom.
  - High: raymarching inside the cone with 8-16 samples, gobo sampled at each step (visible gobo
    shafts) in uniform haze, plus bloom.
- Beams render into a reduced-resolution buffer (1/4 at Low and Medium, 1/2 at High) composited
  with a depth-aware upsample. The governor lowers step count before lowering the level.
- Haze replaces Fogging in the visualizer settings: one static density (no shape or motion);
  older showfiles open at the default density so their beams still show.
- Lens glow and bloom at Medium and High, from a small built-in bloom pass.
- The old beam shaders and `MovingHead` beam meshes are removed.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `visualizer`: in-air beams per tier, gobos visible in haze at T2, Haze settings, bloom.

## Impact

- Showfile format: backward compatible. Fog preferences are read and mapped to haze; new haze keys
  are added with defaults.
- Undo/redo: none.
- Live playback/timing: none.
- WSC output: none.
- Visualizer: new beam look at every tier.
- Web vs Electron: same.
- Code: `plugins/visualizer/*` (beam pass, compositor), visualizer showData/preferences, settings
  popup; delete `shaders/beam.*.glsl`.

## Out of scope

- 32+ step beams, beam shadows, froxel fog, WebGPU (epic backlog).
- Haze machines driven by DMX.

## User manual

Visualizer page § Settings: replace Fogging and Volumetrics with Haze; describe what changes with
the Quality setting.
