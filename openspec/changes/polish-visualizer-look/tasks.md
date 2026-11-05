# Tasks

## 1. Visualizer: beams (plugins/visualizer)

- [x] 1.1 Beam rows carry the lens radius and the light output (13th texel). The light output is
      the summed flux of the row's cells, over 10,000 lm, clamped. OFL pixels share the fixture's
      lumens. `beamPower` applies the light output to floor and air light. Verify in Node:
      - the sweep draws every GDTF and OFL mode with no error;
      - a 12-pixel OFL bar's cells carry 1/12 of its lumens;
      - no allocation per frame (heap stable over 3600 frames).
      Passed:
      - 765 GDTF and 2240 OFL modes draw with no error;
      - OFL pixels split the fixture's lumens (Astera Titan Tube: 2900 lm over 16 pixels);
      - bundled pixel bar cells come out at 0.05 and the spot at 0.90;
      - heap −277 KB over 3600 frames.
- [ ] 1.2 Air beams: inverse-square falloff softened within 1 m of the lens, with the gain
      recalibrated so a shaft 6 m out keeps today's brightness; highlight rolloff toward white
      shared with the lens glow. Verify: shaders compile in the app (user check 3.1).
- [ ] 1.3 Lens glow sized from the lens radius (clusters by their cell count), scaled by intensity
      and the square root of the light output; glow-only cells smaller; less glow in the bloom.
      Verify: user check 3.1.

## 2. Visualizer: look and settings (plugins/visualizer, views)

- [ ] 2.1 Neutral tone mapping; darker, cooler checkerboard floor with a lower ambient; dark satin
      bodies with a hemisphere light and a key light; a subtle background gradient. Verify: user
      check 3.1.
- [x] 2.2 Render resolution setting (50%, 80%, 100%, default 80%) in `quality.js`, applied by the
      visualizer and shown in the visualizer popup. Verify in Node that settings load with the
      default and survive a stored value; in the app, user check 3.1.

## 3. In-app check (user)

- [ ] 3.1 Ask the user to check in `npm start`:
      - shafts bright at the neck and fading, strong colours paling at the neck;
      - lens glows that blend (pixel bar beside a moving head);
      - floor, bodies and background;
      - the Render resolution setting, at every quality level;
      - the demo show plays as before, with no console error.
      Fix what the user reports.

## 4. Docs and lint

- [x] 4.1 User manual, visualizer page: Render resolution, light output, lens glow. Verify:
      `npm run docs:manual:build`.
- [ ] 4.2 AI context: `src/plugins/visualizer/CLAUDE.md` (beam row texels, light output, tone
      curve). Epic status: final pass. Verify: `openspec validate polish-visualizer-look`.
- [x] 4.3 `npx eslint` on all touched files is clean.
