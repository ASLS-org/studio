# Tasks

## 1. Demo show

- [x] 1.1 Pick from `public/fixtures` an RGB bar with cells and a PAR that the engine and
      visualizer support (skill `fixture-library`). Build the manual showfile in Studio:
      - one universe;
      - fixtures: the MAC Aura, the bar, two PARs;
      - groups: moving heads, bar, PARs, each with at least one scene, one effect and a chase.

      Export it to `docs/manual/public/presets/manual.showfile.json`. Verify: it loads in
      `npm start` through Open, and the cues and chases play.
- [x] 1.2 Add the profiles it uses to `APP_STATIC_FILES` in `docs/manual/vite.config.js`.
      Verify: in `docs:manual:serve`, each profile URL returns 200, and after
      `docs:manual:build` the files are in the dist.

## 2. Preview host (docs/manual theme)

- [x] 2.1 Spike: `previews/host.js` creates a child app with `main.js`'s setup (uikit, `$show`,
      `$http`, `$utils`, the real `LiveTicker`, its own memory router), loads the manual showfile
      and mounts one component. Mount every candidate from design D3 on a dev-only page and
      record the result in design.md: works, needs a minimal widget fix, or stays on video.
      Verify: the dev page shows each candidate working or recorded as excluded.
- [x] 2.2 `previews/presets.js`, the registry from design D3: component, props, route, height,
      caption, clock, video. It holds only the candidates that passed 2.1. Verify: each preset id
      mounts on the dev page.
- [x] 2.3 `<LivePreview preset>`, registered in `theme/index.js`:
      - inside `<StudioFrame>`, the component's title and an empty body until it loads;
      - loads within one screen height of view;
      - unmounts when the page is left;
      - a **Reset** action that reloads the showfile.

      Verify: the network panel shows no engine chunk before scrolling to a preview. Reset
      restores the values after edits.
- [x] 2.4 Clock: Live runs only while a visible preview has `clock: 'on'`, and stops off screen,
      in a hidden tab and on page change. Verify: a frame counter on Live's tick (dev only) stops
      when the preview scrolls away and resumes when it comes back.
- [x] 2.5 Fallback (design D6):
      - on an import or mount error, or without WebGL or Workers, play the preset's video, or
        else show a message;
      - log the error to the console;
      - never show an image.

      Verify: headless Chrome with `--disable-webgl` shows the visualizer preset's video; a
      forced throw in a preset shows the message and the page's other previews still work.
- [x] 2.6 An unknown preset id shows an error box in dev, and `docs:manual:build` logs the page
      and the id. Verify: a deliberate typo shows the box and the build logs it.
- [x] 2.7 Isolation: the host never mounts `app.activity`, never persists, and offers no
      connection component. Verify: after using every preset, the manual origin's localStorage
      has no showfile key. With the network panel open, no WebSocket is opened.

## 3. Visualizer preset

- [x] 3.1 A `visualizer` preset: Studio's visualizer on the demo show in its normal mode (orbit
      controls on), with Guides quality via `options.quality`, paused off screen, and falling
      back to `visualizer.webm`. Verify: dragging orbits the view, a cue lights the rig, and it
      stops rendering off screen (frame counter).

## 4. Pages and media (docs)

- [x] 4.1 On the seven pages that embed videos, replace each video with its preset wherever one
      exists. Multi-panel flows keep `<Video>`. Verify: each page in `docs:manual:serve` shows
      working previews, with no broken media.
- [x] 4.2 Delete the media in `docs/manual/public/interface/` that no page references any more.
      Verify: `grep -r` for each deleted name across `docs/manual` finds nothing, and
      `docs:manual:build` succeeds.
- [x] 4.3 Check the previews in light and dark themes and at 375px width. Verify: headless
      screenshots for review only, never committed.

## 5. AI context

- [x] 5.1 Update skill `user-manual`:
      - how to use `<LivePreview>` and add a preset;
      - the demo showfile and its static files;
      - the fallback rule (video or message, no screenshots).

      Also update `docs/manual/CLAUDE.md` and `openspec/epics/manual-overhaul.md` (unit 2
      status). Verify: grep shows the new sections.

## 6. Done

- [x] 6.1 `npm run docs:manual:build` succeeds with no unknown-preset warnings, and
      `npx eslint --ext .js,.vue --ignore-pattern '!docs/manual/.vitepress'` on
      `docs/manual/.vitepress/theme`, `docs/manual/.vitepress/config.js`,
      `docs/manual/vite.config.js` and any touched `src/` file is clean. Verify: exit 0.

## 7. Revision after review (2026-11-06)

- [x] 7.1 Previews at Studio's size (measured widths, strip and panel heights) on the idle
      surface, scaled to fit, panels scrolling. Verify: Group Settings renders 150×239, Channels
      742×239, centred on the stripes; no page overflow at 1280 and 375 px.
- [x] 7.2 Token `--idle-stripes` in `tokens.css`, used by the app's empty list rows and bodies,
      modifier strip and group pool. Verify: Studio's computed backgrounds unchanged.
- [x] 7.3 `uk-popup` `popupHost` injection; previews host their popups in an overlay, scaled to
      fit. Verify: in Studio a popup still opens on the body, centred; in the manual popups stay
      inside their preview.
- [x] 7.4 Reset available after a real reader input only. Verify: real clicks — unavailable,
      available after a click on a cue, values restored and unavailable after Reset.
- [x] 7.5 Demo runner and 14 demo presets (patch bay select/filter/delete, fixture pool delete
      ×2, patch add ×2, cue pool add, effect channel add, group pool new, chase play, toolbar
      menus/file/preferences). Verify: each reaches its key moment (selection, filter, popup
      open, chase playing) with no errors; no other preview changes.
- [x] 7.6 Pages: screenshots and recordings replaced by demos; unused media deleted. Verify: 8
      pages, every preview ready, no broken media; only the gizmo recordings and the visualizer
      fallback remain.

## Workflow follow-up

- `/opsx:archive add-manual-live-previews` in the unit branch, then a PR into
  `epic/manual-overhaul`.
