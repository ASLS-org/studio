# Proposal

## Why

Output setup is spread over a popup, a select and a widget per universe, nothing shows what goes
where, and only the gateway's address is saved: every reload means reconnecting and pressing
Start on each universe. Packets miss WSC's required flags, keepalive is never sent, a dropped
gateway stays down, and Interface, Priority, TTL and Baud do nothing. A show can't rely on this.

## What Changes

- **Outputs workspace** replaces the Input/Outputs popup, the universe's Output select and the
  Stream widget: universes → gateways → destinations as three columns joined by wires, with an
  inspector for the selected node.
- **Gateways**: name, host, port, *connect on load* (off by default), state, latency, the
  gateway's system information and its log.
- **DMX routes**: universe → gateway → protocol, interface, destination, universe number (Art-Net
  Net/Subnet/Universe, sACN 1-63999) and the protocol's params. A universe can have several. An
  enabled route sends whenever its gateway is connected.
- **Every `STREAM_CHANNELS` protocol** WSC allows; packets carry the TR and GW flags, channels
  from 1.
- **Session**: keepalive every second, reconnect with backoff, routes resume on reconnect,
  gateway errors shown.
- **Saved with the show**: gateways and routes. Older shows' outputs load as gateways.
- **Toolbar indicator**: all sending, connecting, or something lost; it opens the workspace.
- Fixes: deleting a gateway, loading a show with outputs, streams left behind. `@asls/wsc-*` go
  to 2.2.0.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `output-wsc`: the Outputs workspace, gateways, routes, packets, session, saving, indicator.

## Impact

- **Code:** `wsc.connection.js`, `OutputPool`, `Universe`, `Show`, the toolbar, the universe
  modifier, a new Outputs popup, `app:check`.
- **Showfile:** `outputs` gain `autoConnect`; new `routes`. Older files load (no routes).
- **Unsaved marker:** editing gateways and routes marks it; connecting doesn't.
- **Live:** one packet per enabled route per tick, built from reused objects.
- **WSC output:** flags, channel base, keepalive; 2.2.0. The bundled gateway forwards Art-Net
  only for now, and the inspector says so.
- **Visualizer:** none. **Web vs Electron:** same UI; the gateway is external in the browser.

## Out of scope

- Timecode, cue triggers, parameters out, controller inputs (epic units 8, 9, 10b add their tabs).
- Dragging wires.
- WSC and gateway work: a capability query, errors instead of silent drops, sACN and DMX512
  forwarding (noted in the epic).

Manual: `rig/outputs.md` (previews `outputs-popup`, `universe-stream`),
`getting-started/interface.md` (toolbar), `reference/shortcuts.md`,
`reference/troubleshooting.md`, `reference/limitations.md`, `reference/glossary.md`.
