# Proposal

Epic: `openspec/epics/gdtf-render-pipeline.md`, final pass (2026-11-05). Committed on the epic
branch directly, as the user asked.

## Why

The user reviewed the rig after 5b. The haze beams look flat and dull, the lens flare is sometimes
too strong (multi-cell bars stand out), and the floor and fixture bodies look cartoonish: a bright
flat floor and bodies drawn as black holes.

## What Changes

- Beams in the haze are brightest at the lens and fade along the shaft, as light from a source
  falls off with distance. Strong beams roll off toward white at their neck instead of clipping
  per colour.
- Each beam's brightness follows its fixture's light output (GDTF luminous flux, OFL bulb lumens),
  shared over the cells of multi-cell fixtures.
- Lens glow is sized from the lens and scaled by the light output, so bars, pixels and moving heads
  blend at the same rule. Glow-only cells get a small glow, and lens glows feed the bloom less.
- Glowing cells (pixels, panels) spill soft light on nearby surfaces, by groups of neighbouring
  cells, with no beam in the haze.
- Look: a neutral tone curve that keeps hues; the checkerboard floor darker and less flat; dark
  satin fixture bodies with soft ambient light, so their shapes read. The background stays as it
  is (a gradient was tried and dropped on the user's review).
- A Render resolution setting in the visualizer popup (default 80%, today's value), kept on the
  device like the other quality settings.

## Capabilities

### Modified Capabilities
- `visualizer`: air beam falloff and highlight rolloff, light output per fixture, lens glow,
  render resolution setting.

## Impact

- Showfile format: none. Unsaved marker: none (the new setting is per device).
- Live playback/timing: none. WSC output: none.
- Visualizer: shader constants, one more beam texel per row, materials and scene lights. No new
  per-frame pass.
- Existing shows look different: fixtures with low output are dimmer, high output ones brighter.

## User manual

Visualizer page: Render resolution setting; light output and lens glow behaviour.
