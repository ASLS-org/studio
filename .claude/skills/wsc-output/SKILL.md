---
name: wsc-output
description: Everything about sending show data to hardware over WSC (Web Show Control), using @asls/wsc-client, @asls/wsc-sdk, plugins/wsc.connection.js (gateways, sessions), OutputPool and DMX routes, the Outputs workspace and the universe Output widget, and the gateway bundled with Electron. Use for any output, protocol, transport, Art-Net/sACN/DMX512/OSC/MIDI, gateway or connection work, or when upgrading the WSC packages.
---

# WSC output

Reference baseline: **@asls/wsc-client 2.2.0 / @asls/wsc-sdk 2.2.0**, installed since change
`rework-outputs` (2026-11-27; SDK `src/` identical to 2.1.0, the client's manager singleton is
created lazily). Before relying on any API below, check the
installed version: `npm ls @asls/wsc-client @asls/wsc-sdk`, and read
`node_modules/@asls/wsc-*/README.md` plus `src/`. If a newer version is out, diff its `src/`
against this skill and update the skill (skill `ai-context-maintenance`).
Protocol spec: https://github.com/ASLS-org/WSC

## How Studio uses it

```
OutputPool (models/DMX/output.pool.model.js)
├─ outputs: WscGateway (plugins/wsc.connection.js)   saved as `outputs`: name, remote, port, autoConnect
│    session (reactive): status, attempt, rtt, system, log, errored, lost   never saved
│    new WscClient(...) built directly (not createClient), keepalive STATE_QUERY every 1000 ms,
│    lost after 3000 ms without answer or client.state ERROR → reconnect 1, 2, 4, 8 s then 10 s
│    until disconnect(); STATE_ERROR → log + errored (cleared when the inspector shows the log)
└─ routes: DmxRoute (models/DMX/route.model.js)      saved as `routes`: universe, output, protocol,
     iface, address, universeNumber (Art-Net = 15-bit port-address), params, enabled
     transport + packet options rebuilt on change (SDK builders, params), never per tick
Every Live tick (Live.onFrame, also while paused or stopped):
   UniversePool.processFrame() → universe.packFrame() → sink.forward(universe.id, frame)
     → OutputPool._sending (raw, per universe, rebuilt by refresh()) → route.forward(client, frame)
        WscPacket.create(STREAM_CHANNELS, {universe: n, startChannel: 1, values}, {TR+GW flags, transport})
UI: toolbar/_popups/outputs/ (popup.outputs.vue: flow + pages), toolbar OUTPUT indicator
    (OutputPool.state), universe.modifier.widget.output.vue; views/utils/outputs.js (states)
Electron: main.js spawns bundled `wsc-server-node18-<os>-<arch>` (version = WSC_VERSION in .env)
Browser: user runs the gateway (`@asls/wsc-server`) themselves, default 127.0.0.1:4515
```

## API essentials (2.2.0)

**Client** (`@asls/wsc-client`)
- Named exports: `WscClient`, `WSC_REMOTE_STATE` (`IDLE 0, CONNECTING 1, CONNECTED 2, ERROR -1`),
  `KEEPALIVE_INTERVAL` (1000 ms), `DEBUGGER_LOG_TYPE`. The default export is the singleton
  `WscClientManager`.
- `new WscClient(host, port, onOpen, onMessage, onClose, onError)`, then `connect()`. Transport is
  WebRTC DataChannels signalled over a WebSocket. Each message type gets its own
  `WSC!DC:<TYPE_NAME>` channel.
- `send(packet)` drops the packet silently if the channel isn't open. Also `close()`,
  `startKeepAliveSession()`, `stopKeepaliveSession()`, `state`, `debug` (last 100 entries).
- ⚠ `WscClientManager.createClient(remote, port, onOpen, onMessage, onError)` passes `onError`
  into the **onClose** slot (still in 2.2.0). Studio constructs `WscClient` directly.
- The client calls `onClose` from its own `close()` too; WebRTC `failed`/`disconnected` only set
  `state = ERROR` (no callback): poll it. `send()` throws when there is no peer connection.
- `STATE_QUERY` carries no query id and the gateway echoes an undefined `queryId`: keep one
  keepalive in flight and time it.

**SDK** (`@asls/wsc-sdk`)
- `WscPacket.create(type, data, { id?, flags?, transport? })` → `.serialize()` /
  `WscPacket.deserialize(buf)` / `WscPacket.decode(pkt)` / `WscPacket.validate(pkt)` →
  `{ valid, errors, warnings }`. `validate` **throws** if the TR flag and the transport disagree.
- `new WscFlags(tr, gw, ack, mc, ts)`. A packet the gateway must forward downstream needs
  `new WscFlags(true, true)` (TR + GW) **and** a transport.
- Types: `STREAM_CHANNELS` (`{ universe, startChannel = 1, values: Uint8Array }`),
  `STREAM_TIMECODE` (`{hours, minutes, seconds, frames, rate}`), `CONTROL_CUE`
  (`{address: WscAddress, action: WscPacket.CueAction.*}`), `CONTROL_PARAM`
  (`{address, valueType, value}`), `TUNNEL_RAW` (`{raw}`, protocol RAW), and `STATE_*`.
- Transports: `WscTransport.udp(proto, ip, port, params?)`, `.tcp(...)`,
  `.serial(proto, portIndex, baudRate)`, `.usb(proto, vendorId, productId)`, `.http(proto, url)`,
  `.websocket(proto, url)`, `.raw()`.
- The SDK ships its own tables: `WscTransport.ifaceCompat` (protocol → interfaces),
  `WscTransport.defaults` (ports), `WscPacket.typeProtocolCompat` (type → protocols). Use these
  instead of hand-copied tables.
- `STREAM_CHANNELS` allows protocols `DMX512, ARTNET, SACN, KINET, MODBUS, OSC, RAW`.

## Known issues (as of 2026-11-27)

Fixed by `rework-outputs`: flags, start channel, transport rebuilds and params, pool deletes,
saving, dead `sendLighting`, hand-copied tables. Left:

1. The bundled gateway (binary of 2026-10-04 in `src/electron/bin`) forwards `STREAM_CHANNELS`
   over Art-Net only and drops other protocols **silently** (no `STATE_ERROR`). Keep
   `BUNDLED_GATEWAY_FORWARDS` in `wsc.connection.js` in step with it.
2. WSC has no capability query: Studio can't ask a gateway what it supports (upstream wishlist in
   `openspec/epics/show-control.md`).
3. `prebuild.js` builds `v${version}` but defaults to `'v0.8.4'`, which gives `vv0.8.4` when
   `WSC_VERSION` is unset.

## Rules for changes

- Build every packet through `WscPacket.create` with explicit `flags` and `transport`. In dev,
  run `WscPacket.validate(packet)` once when a route changes (`DmxRoute._rebuild`), never per tick.
- Streaming is per-tick (`Live` frame phase, 60 fps), whatever the play state: output keeps
  running while the show is paused or stopped. `forward` walks raw entries and the universe's
  reused frame: no allocations beyond the SDK's packet, no reactive reads, no logging, no
  validation. Call `OutputPool.refresh()` after any route or gateway change (route setters do).
- Session state lives in `gateway.session` (reactive on its own, written from the client's
  callbacks on the raw instance). Never put it in `showData`.
- Sending is not a `Live` animation; timers (keepalive, retry) are cleared by `disconnect()`,
  which `OutputPool.delete` and `clearAll` call.
- Persist user-entered output config through `showData` and the load path (skill
  `dmx-model-change`).
- Keep the browser build working without Electron. In the browser the gateway is external.
- Bumping `@asls/wsc-*`: update `package.json` and the lockfile, re-read the README and `src/` for
  API changes, update this skill's baseline line, and keep `WSC_VERSION` (the gateway binary) on a
  version compatible with the client.
- Restore a broken `npm link` (`node_modules/@asls/wsc-client → ./wsc-client` with an empty
  folder) with `npm install`.

## Verify

1. Run a gateway (Electron starts one; in the browser run the binary from `src/electron/bin`).
2. Outputs (Ctrl+Shift+O) → + gateway → Connect: *Connected* with a round-trip time.
3. + route on a universe → Destination `127.0.0.1` → listen on UDP 6454 (a Node `dgram`
   socket, or `tcpdump -i lo0 udp port 6454`): ArtDmx at the route's port-address, 512 values
   following a fader.
4. Kill the gateway: *Reconnecting* after 3–4 s; restart it: back within a second or two, frames
   resume. Disconnect stops the retries.
5. Save → reload: gateways and routes come back; connecting never sets `*`.
6. `npm run app:check -- --only outputs` covers routes, packets, saving and older files.
