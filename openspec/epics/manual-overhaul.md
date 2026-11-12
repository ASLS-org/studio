# Epic: user manual overhaul

Branch: `epic/manual-overhaul` (from `develop`). Workflow: skill `git-collaboration` § Epics.

## Goal

Give users a manual that presents the product, teaches every feature, looks like Studio, and
stays current. Today (2026-11-05) the manual at `docs/manual` is a stock VitePress site in
purple/blue. Most features are undocumented, and the pages rely on 40+ hand-recorded `.webm`
clips that nobody re-records.

## What the user asked for (2026-11-05)

1. Visual style follows ASLS's design rules and design system as closely as possible.
2. Live, interactive dummy presets of the components a page talks about, instead of video
   embeds. Video or screenshots only when a live preview isn't possible.
3. Cover the features: most are missing.
4. A real product presentation.
5. Kept up to date on every significant change.
6. A pleasing hero page that points to the correct resources and gets visitors interested.

## Decisions (2026-11-05, with the user)

- **Revision after the first review of unit 1:** the manual must look like Studio itself (its
  toolbar, patch bay, widgets, icons and borders, built from real `uk-*` components), not a
  recoloured VitePress theme. The home hero is a cinematic 3D scene rendered live by Studio's
  visualizer and doesn't have to follow the uikit. No agent-made screenshots: product visuals
  are live.

- **Design source = the app's own uikit.** The manual reuses Studio's CSS tokens
  (`--primary-*`, `--secondary-*`, `--accent-*` in `src/assets/styles/global.css`, light variant
  under `[data-theme="light"]`), Roboto, and the `uk-*` components. There's no separate brand
  guide.
- **Upkeep = workflow gates only.** No CI drift check, no generated pages, no scheduled AI
  routine. OpenSpec rules, the archive check, the PR template and the `user-manual` skill make
  the manual update part of the definition of done.
- **URLs are configured in one place** in the manual's site config, with TODO placeholders for
  the canonical demo, website and developer-docs URLs. Today's values conflict
  (`asls.io/studio`, `studio.asls.io`, `demo.studio.asls.timekadel.com`,
  `dev.studio.asls.timekadel.com`, `asls.io/studio/live`). The user fills them in before
  release.
- **Live previews run real app components** against a manual-only dummy show, loaded on the
  client only. Videos stay only where a live component can't show the point (for example
  dragging across several regions of the full app).

- **Home page fine-tuning waits for the end of the epic (2026-11-06).** Unit 1 shipped the
  scroll story (2D hero, liquid reveal, four MAC Auras, live widgets, scroll-driven show,
  global autoplay and Next, final hero). The user called it good enough for now; a polish pass
  happens once units 2–5 are done. Also for that pass (unit 2, 2026-11-06): the visualizer
  preview's framing of the demo rig.

## Findings that shaped the plan (2026-11-05)

- `.vitepress/theme/index.js` registers the uikit but doesn't load the app's tokens or fonts
  (the import is commented out because `global.css` also resets `body`, `h1`–`h4` and `*`). So
  embedded `uk-*` controls render without colours.
- `uikit/colors/uikit.colors.js` reads `getComputedStyle(document…)` at import time, which is
  unsafe during the VitePress server-side build.
- Widgets take model objects as props (`group`, `cue`, …). Only the modifier fragments read the
  memory-history router. One manual-only `Show` loaded from a dedicated showfile can therefore
  feed every preview on a page.
- `theme/components/video.vue` is never registered, so `<Video>` tags may not render at all.
- `.github/workflows/deploy.docs.yaml` runs `docs:manual:build` in place of `npm install`, then
  builds the app. Its `if:` only lets it run on `staging`. The published manual is probably stale
  or failing.
- Content gaps: every `workflow/*` page is "in progress", and `introduction/overview.md` is
  empty. Nothing covers outputs/WSC, the gateway, the desktop app, GDTF import, fixture models
  and cells, the visualizer settings and standalone view, master, live/BPM, showfile
  management, shortcuts or troubleshooting.

## Changes

| # | Change | Depends on | Status |
|---|---|---|---|
| 1 | `restyle-manual-site`: Studio look (tokens, fonts, dark default + light), hero and product presentation, URL config, a working docs build and deploy | none | archived (branch `docs/restyle-manual-site`) |
| 2 | `add-manual-live-previews`: `<LivePreview>` harness, manual dummy showfile, presets per widget, video fallback; the home page already runs Studio's real widgets live (unit 1), so this unit covers the manual pages (no screenshots anywhere) | 1 | archived (branch `docs/add-manual-live-previews`) |
| 3 | `document-show-programming`: concepts + patch → group → scene → effect → chase → master/live, with live previews | 2 | archived (branch `docs/document-show-programming`) |
| 4 | `document-rig-and-output`: fixture library/OFL/GDTF, outputs and gateway, visualizer, showfiles, desktop app, shortcuts, glossary, troubleshooting | 2 (can run beside 3) | archived (branch `docs/document-rig-and-output`) |
| 5 | `gate-manual-upkeep`: OpenSpec rules, archive check, PR template, `user-manual` skill + coverage map, preview check | 3, 4 | archived (branch `chore/gate-manual-upkeep`) |

Status values: proposed, refining, applying, archived, deferred.

All five units are archived (2026-11-12): the epic branch is ready for its PR into `develop`.

## Backlog (not scheduled in this epic)

- **Studio bugs found while documenting (2026-11-06; checked in the running app).** The manual
  doesn't present these as working:
  - Cue **Trigger Style** is saved but never used: every cue toggles on click; **Temporary**
    does nothing.
  - The group pool's **dimmer knob**, **Isolate** and **Blackout** are saved but don't affect
    output. The master column's knob and buttons aren't bound to anything.
  - Patch bay **Shift+click** range selection selects nothing (`handleGroupedSelection`).
  - The scene panel throws on opening a scene of a group whose fixtures aren't the show's first
    (`selectionKey`); the panel goes on.
  - <kbd>Ctrl</kbd> multi-selection in **Scene Fixtures** is ignored for a group's first cue
    (`selectMultipleFixtures` checks `scene.id`, which is 0), and it starts from fixture id 0
    (`getFixtureValueFromId(0)`): the same root as the error above.
  - The patch bay's **New** button does nothing (`displayPatchPopup() {}`).
  - `CuePool.genCueId()` reduces over `this.chases` and throws when a cue is added without an
    id (the UI always passes one).
  - (2026-11-11) The patch bay's list asks to delete (popup, OK) but the patch bay fragment has no
    `@delete` handler: deleting from the patch bay does nothing. The universe view's fixture pool
    deletes.
  - (2026-11-11) The visualizer's scene is a module singleton (`SceneManager`) and `Controls` keeps
    the last camera: a second `Visualizer` adds its floor and lights to the first's, and its
    constructor's `autoFocus = true` starts a focus flight on the old camera that lands on the new
    one (at z = 0, looking at the origin). Studio mounts one visualizer, so only the manual's
    previews hit it (handled there); a `Visualizer.dispose()` would fix it at the source.
  - (2026-11-11) With auto-focus on, deselecting doesn't fly the camera back out
    (`setFocus(false)` is commented out in `Controls.handleKeydown`).
  - (2026-11-11, unit 4) The universe settings' **Config** button has no handler. Connections
    (outputs) and universe streams aren't restored after a reload (worse than the WSC known issue
    6, which only names streams). The bundled gateway (WSC 2.2.0-rc.6) forwards Art-Net; sACN
    gets "Unsupported protocol: 0x3". The visualizer's `popout()` (second-screen window) is never
    called, and with the memory-history router `/visualizer` would open the app anyway. Menu
    shortcuts match Ctrl only (not Cmd on macOS). Open Fixture Library entries are listed by file
    key (`mac-aura.json`).

- CI drift check (fail a PR that changes user-facing code without a manual change), generated
  reference pages, and a scheduled AI routine that proposes manual updates. All three were
  considered and set aside on 2026-11-05 in favour of workflow gates.
- Translations of the manual.
- Versioned manuals per release.
