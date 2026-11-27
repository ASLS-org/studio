# Tasks

## 1. Output: packages and gateway session (plugins/wsc.connection.js)

- [x] 1.1 Bump `@asls/wsc-client` and `@asls/wsc-sdk` to 2.2.0 (package.json + lockfile); re-read
  both READMEs and `src/` for API changes. Verify: `npm ls @asls/wsc-client @asls/wsc-sdk` shows
  2.2.0 and `npm start` loads the app with no console error.
- [x] 1.2 `WscConnection` → `WscGateway`: builds `WscClient` directly with bound handlers, runtime
  `status`, `attempt`, `rtt`, `system`, `log` (100 plain entries, client debug merged), `errored`,
  `lostSince`; saved `autoConnect`; `sendLighting` removed. Verify: in the browser with
  `wsc-server` running, Connect goes *Connecting* → *Connected*; Disconnect goes *Disconnected*.
- [x] 1.3 Keepalive every 1000 ms (one query in flight), `rtt` and `system` from `STATE_ANSWER`,
  loss after 3000 ms without answer or on `client.state === ERROR` or an unasked close. Verify:
  connected gateway shows a round-trip time and the gateway's hostname; stopping the gateway
  shows *Reconnecting* 3 to 4 s after its last answer (3 s, checked once a second).
- [x] 1.4 Reconnect with backoff 1, 2, 4, 8 s then every 10 s, `attempt` counted, stopped by
  Disconnect. Verify: stop the gateway, restart it after 5 s: the gateway reconnects within 10 s of
  the restart; Disconnect while *Reconnecting* stops the attempts (no new log entries).
- [x] 1.5 `STATE_ERROR` decoded, its code name and message logged, `errored` set until the log is
  opened. Verify: send a route packet with a protocol the gateway rejects (or a malformed one from
  the console): the log shows the code name and the node is marked.

## 2. Engine: routes, sending and the showfile (models/DMX)

- [x] 2.1 `DmxRoute` (`route.model.js`): fields, setters rebuilding the transport with the SDK
  builders and params, protocol and interface lists from the SDK tables, Art-Net port-address
  split, protocol switch defaults, `validate` once per rebuild in dev. Verify: in the console, a
  route set to Art-Net 0.1.2 to `10.0.0.20:6454` builds a packet that `WscPacket.validate` passes
  and `decode` reads back as universe 18, start channel 1, TR and GW set.
- [x] 2.2 `OutputPool`: `routes`, `addRoute` (prefilled per design § 2), `deleteRoute`, cached
  `conflicts`, `state` (idle / sending / connecting / lost), `delete(gateway)` disconnecting and
  deleting its routes, `clearAll` safe, `routesData`. Verify: delete a connected gateway with two
  routes: no error, its rows gone; load another show with outputs: no error.
- [x] 2.3 Sending: `UniversePool.processFrame()` → `outputPool.forward(index, frame)` over the raw
  per-universe route entries, reused `data` and `opts`; `Universe.stream` and `setupConnection`
  removed; `UniversePool.delete` deletes the universe's routes. Verify: a UDP listener on 6454
  receives 512-channel frames at about 60 per second, values following a fader, and nothing for
  a route that is off.
- [x] 2.4 Showfile: `outputs` save `autoConnect`, `Show.showData` saves `routes`, `prepareOutputs`
  reads them (defaults for older files, routes with a missing universe or gateway dropped),
  gateways with Connect on load connect after `ready`. Verify: edit a route → `*` appears →
  save → `*` clears → reload → same gateway and routes; connect and disconnect never set `*`; an
  older showfile with one output opens with one gateway, no routes and no `*`.
- [x] 2.5 Performance: profile 8 enabled routes while an effect plays. Verify: no reactive reads or
  allocations other than the SDK packet in `forward`, and no frame drops in the Live stats.
- [x] 2.6 `BUNDLED_GATEWAY_FORWARDS` constant with its update comment. Verify: grep shows it used
  by the route inspector only.
- [x] 2.7 Check what the bundled gateway (2.2.0-rc.6) forwards: stream Art-Net and sACN to a UDP
  listener (6454, 5568). Verify: record the result in `BUNDLED_GATEWAY_FORWARDS` and in the
  manual's What's Verified table.

## 3. UI: the Outputs workspace (views)

- [x] 3.1 `toolbar/_popups/outputs/popup.outputs.vue` (replaces `popup.connections.vue`) with a
  `focus` prop and its own `{kind, id}` selection; Preferences → Outputs and Ctrl+Shift+O open it.
  Verify: the shortcut and the menu open the popup; Escape closes it.
- [x] 3.2 `outputs.flow.vue`: three `uk-list` columns in one scroll container, fixed rows
  (`--output-row-height` + `geometry.js` constant), SVG wires per route from row indexes (universe
  colour, dashed when off, red when lost or errored), destinations sorted by gateway then
  universe, state dots, round-trip time, conflict marks, **+ route** and **+ gateway**, idle
  stripes when empty. Verify: two routes from one universe draw two wires through their gateway;
  scrolling keeps wires aligned; turning a route off dashes its wire; no forced layout when the
  popup opens (performance profile).
- [x] 3.3 `outputs.inspector.gateway.vue`: name, host (IPv4 or hostname), port, Connect on load,
  Connect / Disconnect, Delete, state, round-trip time, system information, the log as a
  `uk-list` with Errors / All. Verify: each field round-trips through save and reload; opening the
  log clears the error mark.
- [x] 3.4 `outputs.inspector.route.vue`: gateway, protocol, interface (when several), destination
  fields per interface, universe number (Net / Subnet / Universe for Art-Net, one field
  otherwise, with ranges), Priority, TTL, NIC, On, Delete, and the bundled gateway note. Verify:
  the spec scenarios "Switching to sACN" and "Serial DMX"; values reach the next packet (UDP
  listener).
- [x] 3.5 `outputs.inspector.universe.vue`: the universe's routes and **+ route**. Verify: **+
  route** gives Art-Net, UDP, `127.0.0.1:6454`, the next free universe number, On.
- [x] 3.6 Toolbar indicator in `toolbar.fragment.vue` (square `uk-button`, `connection` icon,
  coloured by `outputPool.state`, tooltip naming what's lost) opening the workspace. Verify: idle
  with no route on; green while sending; gold while reconnecting; red after 10 s without the
  gateway.
- [x] 3.7 `universe.modifier.widget.output.vue` replaces `universe.modifier.widget.connection.vue`
  (routes with On, state, gateway, protocol, destination, number; **+ route**; **Open in
  Outputs** on the selected route); the settings widget loses its Output select and button.
  Verify: a universe without routes says it isn't sent anywhere; **Open in Outputs** opens the
  popup with that route selected.

## 4. Checks

- [x] 4.1 `app:check`: an `outputs` scenario (gateway and routes added, protocol defaults,
  port-address, conflicts, save and reload, older showfile, gateway delete, packet validated and
  decoded, no forced layout opening the popup); update the scenarios that used the old popup or
  the Stream widget. Verify: `npm run app:check` passes, run alone.
- [x] 4.2 Session against the real gateway (Electron dev, or `wsc-server` in the browser) with a UDP
  listener: connect, stream, stop and restart the gateway, Connect on load after reopening the
  show. Verify: each spec scenario of "The session stays alive and comes back" and "Connect on
  load" holds.

## 5. Docs and AI context

- [x] 5.1 Manual: `rig/outputs.md` (the workspace, gateways, routes, universe numbers, params,
  Connect on load, the indicator, What's Verified), `getting-started/interface.md` (toolbar
  indicator), `reference/shortcuts.md`, `reference/troubleshooting.md` (Outputs rows),
  `reference/limitations.md` (Outputs rows removed or rewritten), `reference/glossary.md`
  (Gateway, Route, Port-address). Previews: `outputs-popup` on the new popup, `universe-stream`
  renamed `universe-output`; the manual's demo show gets one gateway and two routes; demos never
  press Connect. Verify: `npm run docs:manual:serve` shows the pages; `npm run docs:manual:check`
  passes (run alone).
- [x] 5.2 AI context: skill `wsc-output` (map, API baseline 2.2.0, known issues fixed or left),
  `src/models/DMX/CLAUDE.md` (routes, raw sending path), `src/views/CLAUDE.md` (Outputs popup),
  skill `user-manual` coverage map (new files and presets), `openspec/config.yaml` vocabulary
  (Output → gateway and routes). Verify: every path and symbol named exists (`ls`, `grep`).
- [x] 5.3 Epic doc: unit 2b renamed `rework-outputs` with its scope, and the upstream WSC wishlist
  (capability query, `NO_ROUTE` instead of silent drops, sACN and DMX512 forwarding,
  `createClient` argument order, a query id on `STATE_QUERY`). Verify: the status table row and
  the wishlist read as planned.
- [x] 5.4 `npx eslint` on all touched files is clean.

## 6. UI review (2026-11-27)

- [x] 6.1 Rebuild the workspace on the Arrange popup's layout: flow left (plain kit lists with
  titles, delete bins, wires), the selected item's page right (`outputs.page.vue`,
  `outputs.row.vue`), New gateway in the footer, a universe's page adding routes with an explicit
  Gateway and Protocol. Verify: screenshots at 1440 × 900 next to Arrange and Visualizer Settings:
  the same fonts, rows, controls and spacing; nothing stretches.
- [x] 6.2 Activity in plain words, once per event (no client debug). Verify: kill and restart the
  gateway: one "Connection lost" line, then "Connected".
- [x] 6.3 The universe Output widget: OUTPUTS as its header action, routes as a toggleable list.
  Verify: its check turns a route off; a click opens Outputs on that route.
- [x] 6.4 Spec, design, manual (`rig/outputs`, troubleshooting), previews and `app:check` follow
  the new layout. Verify: `app:check --only outputs` passes; `docs:manual:check` passes.

## 7. UI review, second round (2026-11-27)

- [x] 7.1 Lists read left to right: each keeps its marked row; **Add** in the Gateways and
  Destinations headers (a route from the marked universe through the marked gateway); the
  universe page lists its routes only; no footer action. Verify: click Universe 1, FOH node, Add:
  the route goes from Universe 1 through FOH node and its page opens.
- [x] 7.2 The log is a log: a dark console filling the gateway page, time and text per line,
  errors red, newest at the bottom. Verify: screenshot with a refused packet.
- [x] 7.3 Connect / Disconnect coloured (`uk-button` `filled`, opt-in); Forwarding instead of On;
  sections as full-width header bands; dividers across the whole panel; the universe page without
  a second border. Verify: screenshots of the three pages.
- [x] 7.4 Spec, design, manual (`rig/outputs`, troubleshooting, glossary), demos, `app:check` and
  AI context (`vue-ui-change`: `filled`, full-width dividers) follow; lint, `docs:manual:check`
  and the full `app:check` pass, each run alone.

## Workflow follow-up

- Rebase `feat/rework-outputs` onto `epic/show-control` once PR #84 is merged.
- The user retests; archive only on their approval (sync `output-wsc`), then PR into
  `epic/show-control`.
