# Proposal

Epic: `openspec/epics/gdtf-render-pipeline.md`, unit 5b. Split from `add-gdtf-fixtures` (5a) on
2026-11-04.

## Why

After 5a, GDTF fixtures render as proxy boxes. Operators recognise fixtures by their shape, and
the 3D view should look like the real rig while staying smooth on weak hardware.

## What Changes

- Load each GDTF fixture's own 3D models (`gltf_low`, `gltf`, `gltf_high`; 3ds converted or
  skipped) for its geometry nodes, in place of the 5a proxy boxes.
- Pick a level of detail per quality level (Guides and Low: `gltf_low` or proxy; Medium: `gltf`;
  High: `gltf_high`), with a polygon budget per level; fall back to the proxy when a file has no
  model or the budget is exceeded.
- Instance the meshes per fixture type and geometry part, so large rigs of the same fixture cost
  one draw per part.

## Capabilities

### Modified Capabilities
- `visualizer`: fixture bodies from GDTF models, level of detail per quality level.

## Impact

- Showfile format: none.
- Unsaved marker: none.
- Live playback/timing: none.
- WSC output: none.
- Visualizer: model loading and instancing per type; memory per imported fixture.
- Web vs Electron: none.

## Out of scope

- MVR scene import, decimating models on import (only if refining shows it is needed).

## User manual

Visualizer page: fixture models and what each quality level shows.
