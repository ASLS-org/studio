# Electron shell (src/electron)

Built with `electron-vite` (`electron.vite.config.js`) and packaged by `electron-builder`
(`electron-builder.yml`, `npm run dist:*`).

- `main.js`: creates the window. In dev it loads `http://localhost:5173` when
  `VITE_DEV_SERVER_URL` is set, otherwise `out/renderer/index.html`. It sets an empty app menu,
  registers the privileged `static://` scheme that serves `out/renderer/*` (the renderer uses
  `VITE_STATIC_URL='static:/'`), and **spawns the bundled WSC gateway** binary from `bin/`.
- `prebuild.js`: `beforePack` hook that downloads the `wsc-server-node18-<os>-<arch>` binary for
  `WSC_VERSION` (from `.env`) from `github.com/ASLS-org/WSC/releases` into `src/electron/bin/`
  (git-ignored). The URL is built as `v${version}`, so set `WSC_VERSION` without a leading `v`.
- `preload.js`: currently empty. The renderer runs with `nodeIntegration: true` and
  `sandbox: false`, so treat any remote content as trusted-code execution and never load it.

Rules:
- Renderer code must keep working in the plain browser build. Guard Electron-only behaviour and
  never import `electron` from `src/views` or `src/models`.
- Gateway binary names (`getTargetName`, `getBinaryName`) must stay in sync with the WSC release
  assets.
