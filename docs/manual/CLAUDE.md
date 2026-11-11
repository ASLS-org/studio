# User manual (docs/manual)

This is the end-user manual: how to use ASLS Studio. Never put developer or technical
documentation here (code, classes, files, architecture, protocols on the wire, build steps).
Follow skill `user-manual` for structure, page style, media naming and the sidebar
(`.vitepress/config.js`).

The manual is built from Studio's own interface (`.vitepress/theme/shell/Layout.vue`: toolbar,
patch bay, widgets) and Studio's design tokens: no colour values in the shell or prose CSS, and
no screenshots of the app as product imagery. The home hero is Studio's visualizer in showcase
mode (`.vitepress/theme/hero/`). Studio URLs come from `MANUAL_URL_*` in the repo `.env`, never
hard-coded. Pages show Studio's widgets and panels live with `<LivePreview preset="…">`
(`.vitepress/theme/previews/`, demo show in `public/presets/` = the home page's rig); one preview
runs at a time, demos run to their end; one floating visualizer card per page comes next to the
running stage preview; each topic and each preview has one home page; no recordings of the app.
Details: skill `user-manual` § Theme, § Live previews, § Resource links, § Home page.
