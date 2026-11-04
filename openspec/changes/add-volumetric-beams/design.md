# Design

Refined 2026-11-04 on `feat/add-volumetric-beams`. Unit 3's spike already measured the air beam
variants (8 steps at 1/4, 16 steps at 1/2): both held 60 fps at 40 beams on a Pixel 7a and an M1.
The Pi 5 numbers come with unit 3 task 1.3.

## Context

See proposal.md. Unit 3 delivered the beam state texture (pose, cone, gobo layer, rotation and
blur, colour, prism facets), the gobo texture array, quality levels Guides / Low / Medium / High,
the governor, render on demand, and at Medium/High a prepass target holding receiver albedo and
the depth of receivers and fixture bodies. The floor (z = 0) is the only receiver. The current beam shader
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

1. **Shared cone hull, analytic ray/cone entry and exit** in the fragment shader (as in the spike);
   the exit is also clipped by the floor plane and, where the prepass exists, by its depth. The
   closed form integrates in-scattering of a point source with inverse-square falloff along that
   segment (an `atan` expression in the ray parameter); the raymarch takes N jittered samples.
2. **Cookie sampled in projector space at each sample**, the same texture array as surfaces, so
   gobos match between air and floor.
3. **Baked tileable 3D noise texture** (for example 64^3, R8) scrolled over time for haze motion,
   one lookup per sample instead of procedural noise.
4. **Half/quarter-resolution beam buffer** with a depth-aware upsample against the scene depth;
   additive, so order-independent.
5. **Fog to haze mapping on load** (corrected 2026-11-04 after reading the old shader): the old
   fog settings never hid beams. `globalFoggingState` only switched the noise on, and
   `globalFoggingDensity` set the noise size, not brightness. So a showfile without haze keys opens
   with `hazeDensity` 50 (the default) and `hazeMovement` = `globalFoggingTurbulences` when
   fogging was enabled, 0 otherwise. Saving writes only `hazeDensity` and `hazeMovement` (0-100).
6. **Air beams per quality level** (confirmed 2026-11-04):

   | Level | Air beam | Buffer | Bloom |
   |---|---|---|---|
   | Guides | none | - | no |
   | Low | closed form, no gobo, clipped by the floor plane only | 1/4 | no |
   | Medium | closed form, gobo sampled once at the segment middle with extra blur | 1/4 | yes |
   | High | raymarch, 16 samples (governor: 8 before any resolution step), gobo and haze noise per sample | 1/2 | yes |

   Low has no prepass, so its beams are not hidden behind fixture bodies; Medium and High clip
   against the prepass depth and upsample depth-aware.
7. **Own bloom pass** (confirmed 2026-11-04): bright-pass on the air beam buffer plus the lens
   glows into a 1/2 target, a 4-level downsample/upsample blur chain, added back. The source is
   the emissive passes only, not the whole frame: the main pass draws straight to the antialiased
   canvas, which can't be sampled. Lens glow is a small additive sprite per
   beam at the lens, scaled by intensity, so the bloom has something bright to catch at every
   lit level. The unused `postprocessing` dependency is removed.
8. **Governor:** at High it first drops raymarch samples from 16 to 8, then follows unit 3's
   resolution and level steps.

## Risks / Trade-offs

- [Upsample halos at depth edges] → bilateral (depth-aware) upsample; full resolution at T3.
- [Banding at low step counts] → per-pixel jitter plus temporal blend.
- [Look differs from the current one] → side-by-side comparison on the demo show before removing
  the old shaders.

## Open Questions

- none (Pi 5 numbers may move the Low/Medium boundary; unit 3 task 1.3)
