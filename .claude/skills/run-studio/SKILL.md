---
name: run-studio
description: Launch ASLS Studio (web dev server or Electron) and verify a change in the running app, including first-run demo loading, resetting the local show, and per-area manual test recipes. Use when asked to run, start, screenshot or smoke-test the app, or to verify any change before calling it done (there is no automated test suite).
---

# Running and verifying Studio

## Launch

| Target | Command | Notes |
|---|---|---|
| Web (default) | `npm start` | Vite on http://localhost:5173. Run in the background and wait for `ready in`. |
| Desktop | `npm run electron:start` | Spawns the WSC gateway from `src/electron/bin/`. If that folder is empty, run `node src/electron/prebuild.js` first (downloads the gateway for `WSC_VERSION`). |
| Prod web build | `npm run build && npx vite preview` | Catches build-only breakage (`?raw`, `?worker`, static paths). |

Preflight when startup fails:
- `ls node_modules/@asls/wsc-client/src` is empty or missing → `npm install` (a stale `npm link`).
- `node -v` should match `.nvmrc` (18).

## App boot behaviour

1. `app.activity.vue` loads the show from `localStorage['ASLS_STUDIO_SHOWFILE']`. If it's absent,
   it loads `public/demo/showfiles/demo.showfile.json`. Then it routes to `/universe/0`.
2. Every load calls `persistLocally()`, so the last state survives reloads.
3. **Fresh state:** in DevTools run `localStorage.removeItem('ASLS_STUDIO_SHOWFILE')` and reload, or
   use Toolbar → New show → Blank or Demo.
4. Errors thrown anywhere surface in the error popup (`app_error`) and the console.

## Verification recipes

Always check the browser console for errors and the frame rate (visualizer Stats panel) while
playing.

| Area changed | Check |
|---|---|
| Model / showfile | Edit the value → Toolbar → Save as (downloads JSON) → reload the page (localStorage) → value restored. Then load the downloaded file → value restored. Load the **old** demo showfile → no errors. |
| Unsaved marker | Edit a value → `*` appears before the project name → <kbd>Ctrl+S</kbd> → `*` clears. Set the value back by hand → `*` clears. Play cues and chases on a saved show → `*` never appears. (Undo/redo is removed until change `add-undo-redo`; only <kbd>Space</kbd> play/pause is bound.) |
| Cues / effects / chases | Trigger, stop and retrigger. Change BPM / tap tempo during playback and check it stays in sync. Pause/resume. Delete while running → no leftover animation (channels stop moving). |
| Patching / fixtures | Patch N fixtures (auto-address) → channel faders move the visualizer → delete → references gone from groups. |
| UI widget | Interact at speed (drag faders and knobs), resize and dock the widget, check the empty/disabled state. |
| Visualizer | Orbit, transform a fixture, fog and brightness settings, reload → position kept. |
| WSC output | See the skill `wsc-output` § Verify. |
| Electron-only | `npm run electron:start`: static assets load via `static://`, gateway log lines `[wsc stdout]`. |

## Browser automation

When a browser tool is available (built-in browser or Claude in Chrome), open
http://localhost:5173, wait for the splash to clear, and verify with screenshots and the console.
Otherwise give the user the exact manual steps from the table above and say the change is
unverified in-app.

Stop background dev servers when done.
