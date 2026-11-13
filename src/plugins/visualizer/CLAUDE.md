# Visualizer (src/plugins/visualizer)

Three.js r170 WebGL renderer for the rig. It is instantiated by
`views/activities/app/fragments/visualizer/visualizer.fragment.vue` and exposed as
`$show.visualizerHandle`, whose `showData` / `preferences` are persisted in the showfile.

| Module | Role |
|---|---|
| `visualizer.js` | renderer, camera, orbit controls, render-on-demand loop, haze/brightness preferences, quality settings |
| `scene_manager.js` | singleton `THREE.Scene` |
| `animation_manager.js` | singleton rAF loop for render-side animations (separate from `Live`) |
| `model_instancer.js` | GLTF/Draco preloading from `public/visualizer/models/model_list.json` (the moving head model whose base, yoke and head parts `fixture_meshes.js` uses); exports the shared `dracoLoader` |
| `fixture_renderer.js` | one `GeometryFixture` per patched fixture from `Show.patchSnapshot` (OFL trees synthesized); decodes universe frames; gizmo handles |
| `geometry_fixture.js` | fixture drawn from a geometry tree (GDTF, or synthesized): axes, per-node decoding with inheritance, lit cells (one instanced mesh), up to 8 clustered projector rows, 1 mm rows for glow-only cells, up to 4 spill rows per fixture for them (surfaces only: texel 12.z skips haze, glow and guides); bodies in shared instanced pools, one per shape (4096 slots) or per GDTF mesh (`type|file|folder`, 16 slots doubling, disposed when empty); `setModelLevel` swaps pieces between them |
| `fixture_shapes.js` | pure: body role and shape per node (GDTF primitive, else role), synthesized trees for OFL fixtures (moving heads keep the bundled model's proportions, pivot at the origin), mesh detail per quality level (`modelDetail`: detail order and triangle budget) |
| `fixture_meshes.js` | unit meshes per body shape (box, cylinder, sphere, conventional, scanner, base, yoke, head), GDTF axes, built on first use |
| `fixture_models.js` | GDTF fixture meshes from the imported file (patch entry `models`): glTF or 3DS (texture maps skipped) baked into one unit-box geometry in GDTF axes with its centre, cached per `type|file|folder` |
| `beam_state.js` | per-beam float texture, 13 texels per row (cone matrix, inverse, colour, gobo, floor footprint, origin, lens radius and light output = summed cell flux / 10,000 lm), rewritten each frame; read by every lighting pass |
| `stage_lighting.js` | quality levels: Guides (unlit), Low (floor decals), Medium/High (deferred light volumes on receivers at a resolution scale), beam guides; object layers RECEIVER/OCCLUDER |
| `gobos.js`, `gobo_patterns.js` | shared gobo texture array: built-in patterns (pure module, also used by the GDTF bundle generator), then GDTF wheel images (`goboImageLayer`, up to 64 layers) |
| `beam_shading.js` | GLSL shared by every beam pass (beam state reads, gobo lookup, light falloff), cone hull geometry, `ACCUM` |
| `air_beams.js` | beams in the haze: cone cut at the lens (hull widened in the vertex shader), inverse-square falloff from the apex behind the lens, soft knee per beam; closed form (Low, Medium + soft gobo) or raymarch with the gobo (High), uniform haze, 1/2 or full buffer, depth-aware upsample |
| `bloom.js` | lens glow sprites (Low and up) and bloom from the air buffer and lens glows (Medium, High) |
| `quality.js` | quality settings in `localStorage` (never in `showData`): level, lighting scale, guides, render scale (pixel ratio, default 0.8); starting level from the device, `QualityGovernor` for Auto |
| `controls.js` | TransformControls (translate/rotate) for fixture placement. `Visualizer.warmUp()` draws one frame with a fixture selected at boot, so the gizmo and selection box programs never compile mid-show |
| `instance_highlight.js` | selection outline |
| `grid.js` | infinite grid helper |
| `orbitcontrol.zup.patch.js` | vendored OrbitControls patched for Z-up. Don't edit or lint it |

## Rules

- The world is **Z-up**. Fixture `position` / `rotation` are persisted in the fixture's `showData`.
- The visualizer is driven by data only. `visualizer.fragment.vue` feeds the renderer:
  `patch_changed` → `setPatch(Show.patchSnapshot)` (coalesced per animation frame),
  `fixture_pose` → `setPose`, and it watches `$view.highlight` → `FixtureRenderer.setSelection(ids,
  gizmo)` (re-applied when a patch rebuild recreates a selected fixture). Each rendered frame the renderer
  re-decodes fixtures whose bytes changed in their universe `frame`. Models never import this folder.
- The only write back is the gizmo: `FixtureHandle` setters emit `fixture_transformed`, and the
  fragment applies it to the fixture (`position` / `rotation` setters). Nothing else here writes
  into models.
- Per-frame code (`update(t)`, setters called each tick) must not allocate: reuse vectors, colours
  and materials. Dispose geometries, materials and textures when removing instances.
- Render on demand: `Visualizer.render()` draws only when `needsRender` is set (DMX change, camera
  move, gizmo `change`, pointer/key input, settings, patch/pose/highlight via `FixtureRenderer`'s
  `onChange`) or something animates (strobe, gobo rotation). Anything new that changes
  the picture must call `visualizer.invalidate()`.
- Tone curve: `NeutralToneMapping` for the scene and the surface light; air beams and lens glows
  use `ROLLOFF_GLSL` (beam_shading.js), which keeps hues and pales toward white past the knee.
- There are no three.js lights for fixtures. Beam light comes from `stage_lighting.js`; a surface
  lit by beams registers with `lighting.addReceiver(mesh, albedoMaterial)`, and fixture bodies sit on
  the OCCLUDER layer. The world floor is the plane z = 0.
- Static assets load through `import.meta.env.VITE_STATIC_URL` (the `static://` protocol in
  Electron). Never hard-code `/`.
- Many files are `/* eslint-disable */`. Don't spread that: new modules lint clean, and imports from
  `three/examples/jsm/*` keep the explicit `.js` extension (lint override is in `.eslintrc.js`).
- `new Visualizer(canvas, { showcase: true, quality })` is the user manual's hero mode: no
  grid, axes, Stats, orbit or transform controls, a plain matte floor, no render loop of its own
  (the caller calls `render(t)`), and quality settings neither read from nor written to
  `localStorage`. The app never passes options; keep the default path unchanged.
- `hazeDensity` and `exposure` are in the visualizer `showData` (older showfiles without them open
  at 50 and 100; their `globalFogging*` keys are ignored). Quality settings are not.
- `visualizer.render` wraps every fixture class's `update(t, beamState)` in one
  `beamState.begin()` / `end()`. A new fixture class writes its rows there and exposes `_dummy`,
  `position` / `rotation` (radians) and `highlighted` for `Controls` and `FixtureRenderer`.
- Geometry trees use the GDTF convention (beams along -Z, hanging); `GeometryFixture` flips them
  so a fixture rotation of x = 180° hangs it (the renderer takes radians: `x: Math.PI`; the
  fixture model converts its degree setters). OFL Pan/Tilt ranges start at 0 and are re-centred,
  and OFL pan is reversed to turn as the retired `MovingHead` did; GDTF ranges are already signed.
- Fixture meshes follow the quality level: `Visualizer.applyQuality()` → `FixtureRenderer.setModelLevel`.
  A fixture shows its generated parts first and swaps when its meshes resolve (`onChange` redraws);
  meshes come only from `FixtureLibrary.modelFiles` and are never saved or bundled.
- Read a capability entity only when it isn't `implicit` (absent from the data, it spans its whole
  range): e.g. a speed-only rotation would otherwise also decode an index angle.
