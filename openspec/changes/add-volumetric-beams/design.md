# Design

Draft from the epic planning (2026-11-03). Refine in the unit branch, using the unit 3 spike
numbers, before writing specs and tasks.

## Context

See proposal.md. Unit 3 delivers projectors (pose, cone, cookie texture array, colour, prism
sub-beams), the governor and the off-screen render setup. The current beam shader
(`beam.vertex.glsl` / `beam.fragment.glsl`) uses per-fragment 4-octave simplex noise, an
`rgb2hsv`/`hsv2rgb` round trip that is equivalent to an RGB multiply, and `dFdx` normals.
Visualizer preferences today: `globalFoggingState`, `globalFoggingDensity`,
`globalFoggingTurbulences`, `globalBrightness`, `autoRotate`.

## Goals / Non-Goals

**Goals:**
- One beam technique with a quality knob (step count, buffer scale) rather than unrelated shaders.
- Gobo shafts in haze at T2.
- Cost bounded by buffer resolution, not by screen-space overdraw at full resolution.

**Non-Goals:**
- Occlusion of beams by truss or set (backlog, T3).

## Decisions

1. **Shared cone hull, analytic ray/cone entry and exit** in the fragment shader; T1 integrates
   in-scattering in closed form over that segment, T2 marches N samples over it.
2. **Cookie sampled in projector space at each sample**, the same texture array as surfaces, so
   gobos match between air and floor.
3. **Baked tileable 3D noise texture** (for example 64^3, R8) scrolled over time for haze motion,
   one lookup per sample instead of procedural noise.
4. **Half/quarter-resolution beam buffer** with a depth-aware upsample against the scene depth;
   additive, so order-independent.
5. **Fog to haze mapping on load:** `globalFoggingState` false means density 0; density and
   turbulence map to haze density and motion; new keys default from those.

## Risks / Trade-offs

- [Upsample halos at depth edges] → bilateral (depth-aware) upsample; full resolution at T3.
- [Banding at low step counts] → per-pixel jitter plus temporal blend.
- [Look differs from the current one] → side-by-side comparison on the demo show before removing
  the old shaders.

## Open Questions (resolve while refining this unit)

- Bloom implementation (the `postprocessing` dependency is WebGL-only and unused; custom pass vs
  library).
- Whether T0 shows any air beam at all on the Pi.
