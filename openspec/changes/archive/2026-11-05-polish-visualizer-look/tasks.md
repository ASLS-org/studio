# Tasks

## 1. Visualizer: beams (plugins/visualizer)

- [x] 1.1 Beam rows carry the lens radius and the light output (13th texel). The light output is
      the summed flux of the row's cells: (flux / 5,000 lm)^0.5, clamped to 0.1–3. The first version was
      linear over 10,000 lm and made typical fixtures (median 3,000 lm) too faint. OFL pixels share the fixture's
      lumens. `beamPower` applies the light output to floor and air light. Verify in Node:
      - the sweep draws every GDTF and OFL mode with no error;
      - a 12-pixel OFL bar's cells carry 1/12 of its lumens;
      - no allocation per frame (heap stable over 3600 frames).
      Passed:
      - 765 GDTF and 2240 OFL modes draw with no error;
      - OFL pixels split the fixture's lumens (Astera Titan Tube: 2900 lm over 16 pixels);
      - bundled pixel bar cells come out at 0.05 and the spot at 0.90;
      - heap −277 KB over 3600 frames.
- [x] 1.2 Air beams: inverse-square falloff softened within 1 m of the lens, with the gain
      recalibrated so a shaft 6 m out keeps today's brightness; highlight rolloff toward white
      shared with the lens glow. Verify: shaders compile in the app (user check 3.1).
- [x] 1.3 Lens glow sized from the lens radius (clusters by their cell count), scaled by intensity
      and the square root of the light output; glow-only cells smaller; less glow in the bloom.
      Verify: user check 3.1.

- [x] 1.4 Spill light for glowing cells: neighbouring cells grouped (0.4 m, at most 4 per fixture),
      one wide (70°) row per group, fading out from 4 m to 8 m, at 0.15 of its cells' light output, on surfaces only (flag in the 13th texel: no haze,
      no glow, no guide). Verified in Node: 8 of 207 GDTF fixtures get spill lights, at most 3; the
      bundled pixel bar gets 3 groups of 4 cells; sweep with no error, heap stable.

## 2. Visualizer: look and settings (plugins/visualizer, views)

- [x] 2.1 Neutral tone mapping; darker, cooler checkerboard floor with a lower ambient; dark satin
      bodies with a hemisphere light and a key light. (A background gradient was tried and dropped:
      the user preferred the flat background.) Verify: user
      check 3.1.
- [x] 2.2 Render resolution setting (50%, 80%, 100%, default 80%) in `quality.js`, applied by the
      visualizer and shown in the visualizer popup. Verify in Node that settings load with the
      default and survive a stored value; in the app, user check 3.1.

## 3. In-app check (user)

- [x] 3.1 Ask the user to check in `npm start`:
      - shafts bright at the neck and fading, strong colours paling at the neck;
      - lens glows that blend (pixel bar beside a moving head);
      - floor, bodies and background;
      - the Render resolution setting, at every quality level;
      - the demo show plays as before, with no console error.
      Fix what the user reports.
      Done over several review rounds on 2026-11-05:
      - neck from the lens width with falloff from the apex, and a knee on axial views;
      - light output on a square-root scale, with OFL lumens estimated from power;
      - background kept flat;
      - spill soft and fading, at 0.15 of its cells' light output;
      - cells glowing as bright as a lens, their halo in front of their face;
      - a shader compile error in the glow pass found and fixed.
      Final verdict from the user: "absolutely lovely".

## 4. Docs and lint

- [x] 4.1 User manual, visualizer page: Render resolution, light output, lens glow. Verify:
      `npm run docs:manual:build`.
- [x] 4.2 AI context: `src/plugins/visualizer/CLAUDE.md` (beam row texels, light output, tone
      curve). Epic status: final pass. Verify: `openspec validate polish-visualizer-look`.
- [x] 4.3 `npx eslint` on all touched files is clean.
