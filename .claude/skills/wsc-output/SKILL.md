---
name: wsc-output
description: Everything about sending show data to hardware over WSC (Web Show Control), using @asls/wsc-client, @asls/wsc-sdk, plugins/wsc.connection.js, OutputPool, universe streams, the connection widgets/popups, and the gateway bundled with Electron. Use for any output, protocol, transport, Art-Net/sACN/DMX512/OSC/MIDI, gateway or connection work, or when upgrading the WSC packages.
---

# WSC output

Reference baseline: **@asls/wsc-client 2.2.0 / @asls/wsc-sdk 2.2.0** (latest on npm on
2026-11-03; SDK `src/` is identical to 2.1.0). Before relying on any API below, check the
installed version: `npm ls @asls/wsc-client @asls/wsc-sdk`, and read
`node_modules/@asls/wsc-*/README.md` plus `src/`. If a newer version is out, diff its `src/`
against this skill and update the skill (skill `ai-context-maintenance`).
Protocol spec: https://github.com/ASLS-org/WSC

## How Studio uses it

```
Toolbar → popup.connections.vue ─► OutputPool.addRaw({remote, port, name}) ─► WscConnection
                                                                          └─ client = WscClientManager.createClient(...)
Universe modifier → universe.modifier.widget.connection.vue
   └─ universe.setupConnection(connection, protocol, address)
        └─ connection.setupStream(universeId, protocol, address, () => universe.frame)
             └─ WscConnectionStream: start()/stop() only flip its state
Every Live tick (Live.onFrame, after the animations, also while paused or stopped):
   UniversePool.processFrame() → universe.packFrame() → stream.forward(frame) if running:
        WscPacket.create(STREAM_CHANNELS, {universe, startChannel, values}, {transport})
        → connection.client.send(packet)
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
  into the **onClose** slot, so errors never reach a handler. Either fix upstream in the WSC repo
  or construct `WscClient` directly.

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

## Known issues in Studio's WSC code (as of 2026-11-03)

Check these before building on the output path. They are good candidates for an OpenSpec
change (`fix-wsc-output`).

1. `WscConnectionStream.forward()` sends no flags, so TR/GW are unset while a transport is
   attached. That is a spec violation, and `validate()` throws on it. The gateway may not forward.
2. `startChannel: 0` is sent, but the SDK default is 1-based (`startChannel = 1`). Confirm against
   the WSC spec and fix.
3. ~~`stop()` never clears `streamId`~~: fixed, streams are no longer `Live` animations.
4. The connection widget writes `stream.iface` and `stream.params`, but the stream class exposes
   `interface` and has no `params`. Interface changes don't rebuild the transport, and
   baud/priority/portIndex/TTL are ignored. `_rebuildTransport()` calls `serial(proto)` without
   `portIndex` / `baudRate`.
5. `OutputPool.delete()` calls `output.handleClosure()`, which doesn't exist. `clearAll()` (run on
   every show load) throws once any output exists.
6. Universe stream settings (connection, protocol, address) are missing from `Universe.showData`,
   so they're lost on reload. Only outputs are persisted.
7. `WscConnection.sendLighting()` is dead code with the wrong `create()` signature and a `data`
   key instead of `values`. Delete it rather than fixing it.
8. `universe.modifier.widget.connection.vue` duplicates the SDK compat/default tables.
9. `prebuild.js` builds `v${version}` but defaults to `'v0.8.4'`, which gives `vv0.8.4` when
   `WSC_VERSION` is unset.

## Rules for changes

- Build every packet through `WscPacket.create` with explicit `flags` and `transport`. In dev,
  run `WscPacket.validate(packet)` once when a stream (re)configures, not on every tick.
- Streaming is per-tick (`Live` frame phase, 60 fps), whatever the play state: output keeps
  running while the show is paused or stopped. `forward(frame)` receives the universe's reused
  frame: no allocations beyond the packet, no logging, no validation. Rebuild the transport only when protocol, interface, address or params
  change.
- Streams are not `Live` animations. Stop them before disconnecting or deleting a connection,
  universe or output.
- Persist user-entered output config through `showData` and the load path (skill
  `dmx-model-change`).
- Keep the browser build working without Electron. In the browser the gateway is external.
- Bumping `@asls/wsc-*`: update `package.json` and the lockfile, re-read the README and `src/` for
  API changes, update this skill's baseline line, and keep `WSC_VERSION` (the gateway binary) on a
  version compatible with the client.
- Restore a broken `npm link` (`node_modules/@asls/wsc-client → ./wsc-client` with an empty
  folder) with `npm install`.

## Verify

1. Run a gateway (Electron starts one, or run `@asls/wsc-server` locally).
2. `npm start` → Toolbar → Connections → add `127.0.0.1:4515` → connect. Expect the state to reach
   CONNECTED.
3. Universe modifier → Connection Settings → Art-Net → `127.0.0.1:6454` → start streaming.
4. Watch traffic with an Art-Net monitor (or `tcpdump -i lo0 udp port 6454`). Move a fader and
   expect the channel value to change. Stop, then start again: streaming must resume.
5. Save → reload: the output config must come back.
