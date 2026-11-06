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
| 3 | `document-show-programming`: concepts + patch → group → scene → effect → chase → master/live, with live previews | 2 | proposed |
| 4 | `document-rig-and-output`: fixture library/OFL/GDTF, outputs and gateway, visualizer, showfiles, desktop app, shortcuts, glossary, troubleshooting | 2 (can run beside 3) | proposed |
| 5 | `gate-manual-upkeep`: OpenSpec rules, archive check, PR template, `user-manual` skill + coverage map | 3, 4 | proposed |

Status values: proposed, refining, applying, archived, deferred.

Units 2–5 hold a proposal and a draft design only, so `openspec validate` reports them as failing
(no spec deltas) until their unit writes specs and tasks. That's expected. They all add to the
same new capability `user-manual`.

## Backlog (not scheduled in this epic)

- CI drift check (fail a PR that changes user-facing code without a manual change), generated
  reference pages, and a scheduled AI routine that proposes manual updates. All three were
  considered and set aside on 2026-11-05 in favour of workflow gates.
- Translations of the manual.
- Versioned manuals per release.
