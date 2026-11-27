# Design

## Context

- **Packages:** `@asls/wsc-client` and `@asls/wsc-sdk` 2.1.0 are installed. 2.2.0 is on npm:
  - the SDK's `src/` is identical;
  - the client only creates its manager singleton lazily;
  - `WscClientManager.createClient` still passes `onError` into the `onClose` slot.
- **The bundled gateway** is `WSC_VERSION` 2.2.0-rc.6. The `asls-server` sources (`stream.gateway.js`) forward `STREAM_CHANNELS` over Art-Net only; other protocols are dropped silently.
- **The client has no reconnection.** WebRTC `failed` / `disconnected` only sets `state = ERROR`, with no callback. WSC spec 06 leaves reconnection to the application and asks the client for a keepalive every 1000 ms.
- **The keepalive answer can't be matched to its query.** `STATE_QUERY` carries no query id, and the gateway echoes an undefined `queryId`. So the round-trip time is measured with one query in flight at a time.
- **Today's code:**
  - `plugins/wsc.connection.js` holds `WscConnection` and `WscConnectionStream`.
  - `OutputPool` holds the connections and saves `{id, name, color, remote, port, universe}`.
  - Each `Universe` has one `stream`, fed in `UniversePool.processFrame()` (`Live.onFrame`).
  - The UI is `toolbar/_popups/popup.connections.vue`, the Output select in `universe.modifier.widget.settings.vue`, and `universe.modifier.widget.connection.vue`.

## Goals / Non-Goals

**Goals:**
- A gateway and route model that saves, loads and sends correct packets.
- A session that keeps itself alive and comes back.
- One Outputs workspace that shows the whole signal flow.

**Non-Goals:**
- Message types other than `STREAM_CHANNELS`.
- Free node placement or dragging wires.
- Changes to the WSC spec or the gateway.

## Decisions

### 1. Gateway: `WscGateway` in `plugins/wsc.connection.js`

`WscConnection` becomes `WscGateway`. Its fields:
- **Saved:** `name`, `color`, `remote`, `port`, `autoConnect`.
- **Runtime:** `status` (`IDLE | CONNECTING | CONNECTED | RECONNECTING | ERROR`), `attempt`, `rtt`, `system` (the keepalive answer's data), `log` (100 entries), `errored`, `lostSince`.

**The client.** It builds `new WscClient(remote, port, onOpen, onMessage, onClose, onError)` itself, with bound handlers. That avoids the manager's argument swap. The fix goes upstream separately.

**Reactivity.** Session events are rare (state changes, one keepalive a second), so they write through the reactive instance and the UI binds to them directly. Per-tick sending never touches reactive objects (§ 4).

**Keepalive.**
- A `setInterval` of 1000 ms, not `Live`: it must run whatever the play state, and it isn't per frame.
- It sends `STATE_QUERY` KEEPALIVE (`new WscFlags()`), only when no query is in flight.
- A `STATE_ANSWER` sets `rtt = now - sentAt` and `system = data`.

**Liveness.** The session counts as lost when any of these happens:
- no answer for 3000 ms;
- `client.state === ERROR` (read on each keepalive tick, which covers WebRTC failing silently);
- `onClose` without `userClosed`.

**Reconnect.** On a loss: `close()`, `status = RECONNECTING`, then retry after 1, 2, 4 and 8 s, then every 10 s.
- `connect()` resets `attempt`.
- `disconnect()` sets `userClosed`, clears the timers and goes `IDLE`.

**Errors.** A `STATE_ERROR` is decoded with `WscPacket.decode`. Its code name comes from `WscPacket.ErrorCode`. It is logged and sets `errored`; opening the log clears it.

**Log.** Studio's own entries plus the client's `debug` **error** entries (its other lines, data channels and ICE candidates, are noise to an operator), as plain objects `{id, time, type, text}`. Never HTML.

### 2. Routes: `DmxRoute` in `models/DMX/route.model.js`, held by `OutputPool`

`OutputPool` keeps `outputs` (the gateways, so the showfile key stays) and gains `routes`. A route holds:
- `id`, `universeId`, `gatewayId`, `enabled`;
- `protocol`, `iface`, `address`: `{ip, port}`, `{portIndex}`, `{vendorId, productId}` or `{url}`;
- `universeNumber`;
- `params`: `{priority, ttl, ifaceIdx, baudRate}`.

**Rebuilt on change, not per tick.** Setters rebuild `transport` with the SDK builders (`WscTransport.udp/tcp/serial/usb/websocket/http`, params included). The protocol and interface lists come from the SDK tables: `WscPacket.typeProtocolCompat[STREAM_CHANNELS]`, `WscTransport.ifaceCompat` and `WscTransport.defaults`. The widget's hand-copied tables go.

**The Art-Net universe number** is stored as the 15-bit port-address. The inspector splits it into Net, Subnet and Universe (`>> 8`, `>> 4 & 15`, `& 15`).

**Switching protocol** resets to that protocol's defaults:
- the port from `WscTransport.defaults`;
- the universe number: an Art-Net number `n` becomes sACN `n + 1`, and back;
- Priority 100 for sACN.

**New routes** use the first gateway, Art-Net, UDP and `127.0.0.1:6454`. Their universe number is one more than the highest Art-Net number in use, or 0.

**Conflicts.** The pool has a cached `conflicts` set, keyed by `gatewayId|protocol|destination|universeNumber`. It is rebuilt when routes change, never per tick.

**Deletes.**
- `OutputPool.delete(gateway)` disconnects (`userClosed`), deletes the gateway's routes and splices it out. `handleClosure` goes.
- `clearAll()` deletes routes, then gateways.
- `Universe.stream`, `setupConnection` and `WscConnection.sendLighting` go.

### 3. Showfile

```
outputs: [{ id, name, color, remote, port, autoConnect }]
routes:  [{ id, universe, output, enabled, protocol, iface, address, universeNumber, params }]
```

**Saving.** `Show.showData` adds `routes: this.outputPool.routesData`. No runtime field goes into `showData`, so connecting never marks the show unsaved.

**Loading.**
- `prepareOutputs` reads `autoConnect ?? false`, ignores the old `universe` key, then builds routes.
- A route whose universe or gateway is missing is dropped.
- After `ready`, the gateways with `autoConnect` connect, from a `setTimeout(0)` so loading isn't blocked.

**Older files** have no `routes`, so they get none, and the saved data compares equal: the show isn't marked unsaved.

### 4. Sending (per tick)

`UniversePool.processFrame()` packs each universe, then calls `outputPool.forward(universeIndex, frame)`. The work per route:

- **Routes by universe.** The pool keeps a raw array (`markRaw`) of enabled routes per universe, rebuilt when routes or `enabled` change. Each entry holds a raw reference to its gateway's client.
- **Per route:** `if (client.state === CONNECTED) client.send(WscPacket.create(STREAM_CHANNELS, data, opts))`.
  - `data` is one reused object per route: `{ universe: universeNumber, startChannel: 1, values: frame }`.
  - `opts` is one reused object: `{ flags: new WscFlags(true, true), transport }`.
- **Allocation.** The SDK builds a packet per call, as today; nothing else is allocated per tick.
- **Cost:** one `create` and one `send` per enabled route per tick. No reactive reads, because entries are raw.
- **Validation.** `WscPacket.validate` runs once when a route's transport is rebuilt (in dev), never per tick.

### 5. What the bundled gateway forwards

`BUNDLED_GATEWAY_FORWARDS = [ARTNET]` sits in `wsc.connection.js`, with a comment to update it when the gateway changes. The route inspector shows a note for any other protocol. Checked on the bundled binary (2026-10-04): Art-Net arrives; sACN is dropped with no `STATE_ERROR`.

### 6. UI

Revised after the first review (2026-11-27): the first build mixed button types, stretched its
forms, set text outside the kit's fonts, laid lists on idle stripes and stacked the inspector
under the flow. The workspace now copies the **Arrange** popup, the closest existing screen (a
list on the left, the selected item's page on the right, settings as label/control rows, actions
in the footer), and uses only what the kit already draws.

**The workspace:** `toolbar/_popups/outputs/`: `popup.outputs.vue`, `outputs.flow.vue`, the
pages `outputs.side.{universe,gateway,route}.vue`, and two layout pieces taken from Arrange:
`outputs.page.vue` (icon, title, one line) and `outputs.row.vue` (label left, controls right, or a
section title).
- `uk-popup`, movable, 1020 × 16 rows, **Done** (Escape and Enter close it).
- Opened from Preferences → Outputs, Ctrl+Shift+O, the toolbar indicator, and the universe Output
  widget (with a `focus` prop: `{kind, id}`).
- **Marked rows, left to right.** Each list keeps its own marked row (`selection: {universe,
  gateway, route}`, the popup's own, not `$view`'s) and the page shows the last one clicked:
  click a universe, then a gateway, then **Add** above Destinations. Opening a route marks its
  universe and gateway; the first universe and gateway start marked. (A route form on the
  universe's page, with a protocol picked before the gateway, read as configuring the universe
  and went against the flow; it was dropped in the second review.)

**The flow** (`outputs.flow.vue`), left:
- Three plain `uk-list`s (`colored`, `no-highlight`), each under a header like a widget's (`h3`
  title; **Add** on Gateways and Destinations, as the Fixture Pool's): universes (dot in
  the universe colour, "2 routes"), gateways (dot in the state colour, response time or state,
  the kit's bin to delete), destinations (dot in the universe colour, address, "off" or
  "conflict", bin). The destinations list takes the remaining width.
- Standard 30 px rows (`OUTPUT_ROW_PITCH`), 30 px headers (`--output-head-height`), 170 px fixed
  columns and 48 px gaps (`--output-column-width`, `--output-wire-gap`), each with its constant in
  `views/utils/geometry.js`.
- Wires: an SVG under the lists, one path per route from the row indexes (never measured): stroke
  in the universe colour, dashed when off, faint while the gateway isn't connected, red when lost.

**The pages**, right (340 px, scrolls). Dividers run the panel's full width (rows pad
themselves); each section opens with a header band (a line above and below its title).
- Universe: its routes right under the heading's line, then how to add one.
- Gateway: Name, Host, Port, Connect on load, Session (**Connect** green / **Disconnect** red,
  `uk-button`'s opt-in `filled` mode); **Gateway computer** while connected; **Log**: a dark
  console filling the rest of the page, a line per event (time, text; errors red), newest at the
  bottom.
- Route: Forwarding, Universe, Gateway, Protocol, Interface; **Destination** (fields by interface, Net ·
  Subnet · Universe or the universe number); **Network** (Priority, TTL, network card); **Notes**
  (not sent, conflict, what the bundled gateway sends, what to set on the node).

**Log** (`WscGateway.addLog`): Studio's own lines only, one per event, never the client's
debug: "Connecting to …", "Connected to …", "Can't reach the gateway at … Trying again" or
"Connection lost: the gateway stopped answering (3 s)" once per outage, "The gateway refused a
packet. Incompatible protocol: …" (`errorCodeText`; a gateway's own codes are left out, only its
message shows), "Disconnected".

**Toolbar indicator** (`toolbar.fragment.vue`): a block like the play state's, a dot coloured by
`outputPool.state` (idle, sending, connecting, lost) and **OUTPUT**; its tooltip names what's lost.

**The universe panel:** `universe.modifier.widget.output.vue`: **OUTPUTS** as the widget header's
action (as the Fixture Pool's **ADD**), and the routes as a `toggleable` `uk-list` whose checks
(`active` = On) turn routes on and off; clicking a route opens the workspace on it. The settings
widget loses its Output select.

### 7. Manual and checks

- **Previews:**
  - `outputs-popup` remounts on the new popup;
  - `universe-stream` becomes `universe-output`.
  - Demos never press Connect.
- **The manual's demo show** gets one gateway and two routes, so the flow isn't empty.
- **`app:check` gets an `outputs` scenario:**
  - add a gateway and routes;
  - field defaults per protocol;
  - the port-address;
  - conflicts;
  - the save → reload round trip;
  - an older showfile loading clean;
  - deleting a gateway;
  - the packet built for a route, checked with `WscPacket.validate` and `decode` (flags, universe, start channel, transport);
  - no forced layout opening the popup.
- **The session is checked by hand** against the real gateway (Electron dev, or `wsc-server` in the browser), with a UDP listener on 6454, stopping and restarting the gateway.

## Risks / Trade-offs

- **[The SDK allocates a packet per route per tick]** → It already does today. If dozens of routes show up in profiles, add an in-place packet to the SDK (epic unit 10, `add-output-scale`).
- **[Gateway status is reactive while sending is raw]** → Two paths to keep apart. The per-universe route entries are rebuilt from a watcher on `routes` and `enabled`, and documented in `models/DMX/CLAUDE.md`.
- **[The round-trip time can be off by one query]** if an answer arrives after the 3 s timeout → Answers for a query that timed out are ignored (the in-flight query is cleared).
- **[Protocols offered that the gateway drops]** → The inspector note (§ 5), plus the upstream wishlist in the epic: a capability query, `NO_ROUTE` errors, sACN and DMX512 forwarding.
- **[Reconnect loops while the gateway is gone for good]** → The backoff is capped at 10 s, and Disconnect stops it.
- **[A wide popup on small screens]** → The flow scrolls; the inspector stacks under it.
