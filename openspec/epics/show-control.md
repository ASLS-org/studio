# Epic: Show control

Branch: `epic/show-control` (from `develop`). Workflow: skill `git-collaboration` § Epics.

## Goal

Make Studio a console a lighting operator can run a large event on: a playback engine that
behaves like the industry's (grandMA, Eos, MagicQ, Hog, Titan). That means predictable merges,
fades without jumps, a programmer, cue lists, palettes, masters, external control and timecode,
output at scale, and reliability under pressure. Every unit stays plain to use. Studio's
strengths stay: tempo-synced effects, live previews and the 3D visualizer.

## Decisions (2026-11-24, with the user)

- **Families** (`add-cue-families`, 2026-11-25, replacing `add-cue-priorities`):
  - every channel is in a family (Intensity, Colour, Position, Beam); a cue is made for one, or
    Custom for several;
  - one cue per family in a group: a new cue takes its families, turning it off hands them back
    to the newest cue still playing, and a cue left with nothing turns off;
  - Mode **Replace** turns off what it takes over, **Layer** plays over it and gives it back;
  - across groups, the newest cue wins a shared fixture; priority (0 to 200) stays on top;
  - a family nobody holds rests: Intensity back to its level before playback, the rest stays;
  - tiles show the family icons, lit while held, dimmed once taken. No held looks, no Release.
- **Fades** are crossfades from what is on stage, and back into what is handed back to.
- **Scenes** stay on while they hold a family. Chase items play their cues' own fades, and the
  item's length is the hold (`add-cue-fades`).
- **Programmer** (`add-programmer`): it sits above every cue, is emptied with **Clear**, and is
  never saved. **Park** sits above the programmer and is saved. Each channel shows its source.

## Show control goes through WSC

Everything Studio exchanges with the outside world goes through the user's WSC protocol
(https://github.com/ASLS-org/WSC, `@asls/wsc-client` / `@asls/wsc-sdk`, skill `wsc-output`).
Studio never speaks Art-Net, OSC or MIDI itself: the gateway does.
- **Sessions are full-duplex** (spec 06).
- **Message types are protocol-neutral.** The transport descriptor (spec 05) names the protocol
  (DMX512, Art-Net, sACN, KiNET, RDM, MIDI, MIDI 2, MSC, MTC, MMC, OSC, NDI, VISCA, Modbus,
  GPI/GPO, tally, HTTP, WebSocket, MQTT, raw), the interface and the address.
- **The address system** (spec 03) gives Studio's objects protocol-neutral names, for example
  `lighting.cue.42` or `lighting.layer.2.intensity`.

| Need | WSC | Direction |
|---|---|---|
| DMX output: DMX512, Art-Net, sACN, KiNET | `STREAM_CHANNELS` per universe; params PRIORITY (sACN), TTL, IFACE_IDX | out |
| Input merge from another desk or node | `STREAM_CHANNELS` from the gateway | in |
| Timecode master: Studio drives video and audio | `STREAM_TIMECODE` over MTC, MIDI, Art-Net, OSC | out |
| Timecode chase: Studio follows LTC/MTC | `STREAM_TIMECODE` from the gateway | in |
| Trigger other systems (QLab, media servers, Companion) | `CONTROL_CUE` over MSC, OSC, MIDI, HTTP, WebSocket, GPI/GPO, with ACK | out |
| Be triggered: MSC GO, OSC, MIDI notes, Companion | `CONTROL_CUE` to Studio's cue addresses | in |
| Values to other systems (media layers, motors, PLCs, controller feedback) | `CONTROL_PARAM` over OSC, MIDI, Modbus, CANopen, ... | out |
| Faders and encoders driving Studio (MIDI, OSC controllers) | `CONTROL_PARAM` to Studio's parameter addresses | in |
| RDM: discovery and addressing | RDM transport | both |
| Cameras and tally for broadcast events | VISCA, TALLY | out |
| Gateway health, capabilities, errors, keepalive | `STATE_QUERY` / `STATE_ANSWER` / `STATE_ERROR` | both |

**Planning notes.**
- **Inbound at the gateway.** The reference JS gateway (`implementations/js/server`) forwards
  outbound streams and controls and answers keepalive. Inbound listeners (MIDI, OSC, timecode,
  DMX input) are gateway work on the WSC side. Each inbound unit checks the gateway it targets
  first, and confirms against the spec how Studio asks the gateway to listen on a port.
- **Reconnection** is up to the application (spec 06). Studio must reconnect on its own and show
  the session state.
- **Streams drop rather than queue** (spec 06): stale frames are dropped. Control messages that
  must arrive use ACK with retry.

## Units

| # | Change | Content | Status |
|---|---|---|---|
| 1 | `add-cue-fades` | Fade In / Fade Out for every cue (bars); scenes lose Duration and Loop Style and end once faded in; Relative effects fade; chase items start and end their cues by the cues' fades; the item preview draws the fades | Archived (branch `feat/add-cue-fades`, merged with `add-cue-families` in its PR) |
| 2 | `add-cue-families` | Four channel families (Intensity, Colour, Position, Beam), one cue per family in a group, newest wins, Replace (default) and Layer, hand-back and rest, kept values; family columns in the cue pool with a read-only NOW line, blind programming, cue pictures, the Add Cue family picker (`uk-choice`), family-filtered editors, family accents in the chase timeline; older cues split per family on load. Replaces `add-cue-priorities` (merge by channel, held looks), which operators found unreadable | Archived (branch `feat/add-cue-families`, PR into `epic/show-control`) |
| 2b | `rework-outputs` | One Outputs workspace (signal flow: universes → gateways → destinations, wires, inspector) replacing the connections popup, the universe Output select and the Stream widget; gateways (Connect on load, state, round-trip time, system information, log) and DMX routes (protocol, interface, destination, universe number, params, On; several per universe) saved with the show; packets per WSC (TR+GW, transport, channels from 1, Art-Net port-address); keepalive, reconnection with backoff, `STATE_ERROR` shown; toolbar OUTPUT indicator; `@asls/wsc-*` 2.2.0 | Archived (branch `feat/rework-outputs`, PR into `epic/show-control`) |
| 3 | `add-programmer` | Programmer above cues (applied when packing frames), universe-view edits on every selected fixture (same channel, colour per fixture, same angle), Clear (Preferences and Ctrl+Shift+C, the channels widget header, a channel's menu), Park (saved, above everything, in the channel's menu, Unpark in the header), channel source as colour (violet programmer, red parked, blue playback) and tooltip, fixture pool marks; hand values no longer become the rest | Archived (branch `feat/add-programmer`, PR into `epic/show-control`) |
| 4 | `wire-group-masters` | Group knob (playback master), Isolate (solo) and Blackout per group, grand master and DBO on the master column, applied when packing frames (levels only: dimmers, else additive colour; shutters untouched; parked ignores them; the programmer follows the grand master only); not saved; two-tone activity dots (sent / asked), a held-back column greys its knob and says why, double-click to full | Archived (branch `feat/wire-group-masters`, PR into `epic/show-control`) |
| 4b | `add-master-panel` | A Master panel opened from the master column's header: named, coloured master rows with what each plays per group; show-wide actions (Restore masters, Clear programmer, Unpark all, Stop all); a home for cue-list playbacks and timecode later | To explore |
| 5 | `add-cue-lists` | Cue lists: numbered cues with GO, Back and Pause; per-cue fade, delay, follow and wait; tracking; a list as a playback on the group pool | To explore |
| 6 | `add-palettes` | Position, colour, beam and focus palettes that cues refer to, so updating a palette updates every cue; palettes as live references in scenes and in the programmer | To explore |
| 7 | `add-record-workflow` | Select fixtures, set them in the programmer, then Record, Update or Merge into a cue or palette; highlight and lowlight | To explore |
| 7b | `add-wsc-addressing` | Every playback and master in Studio gets a WSC address: cues as `lighting.cue.<id>` (per group), group masters and playback faders as `...intensity`, the grand master, chases and cue lists. One registry, shown in the UI and the manual, so inbound controls can target it without learning, and outbound feedback can name it | To explore (foundation for 8 to 10b) |
| 8 | `add-show-triggers` | Cues and cue-list steps send WSC `CONTROL_CUE` / `CONTROL_PARAM` to other systems (QLab, media servers, Companion) through a chosen output and transport, with ACK and error feedback | To explore |
| 9 | `add-timecode` | A timecode track per show driving cue lists and chases. Studio is either master (an internal clock sent as `STREAM_TIMECODE` over MTC, Art-Net or OSC) or chase (follows `STREAM_TIMECODE` from the gateway, with freewheel on dropouts and an offset). Frame rates 24, 25, 30 and 60 | To explore |
| 10 | `add-output-scale` | Dozens of universes per gateway without frame drops (one `STREAM_CHANNELS` per universe per tick, packets reused), several gateways (a universe sent to two for redundancy), sACN priority, input merge (`STREAM_CHANNELS` in, HTP or LTP with Studio's output), node discovery and an output monitor (`STATE_*`) | To explore |
| 10b | `add-external-control` | Studio driven from outside: MIDI and OSC controllers (`CONTROL_PARAM` in for faders and encoders, `CONTROL_CUE` in for buttons), MSC GO/Stop/Resume, Companion, keyboard mapping. A learn mode maps a received message to a Studio address. Feedback goes back out (controller LEDs and motor faders through `CONTROL_PARAM`) | To explore |
| 10c | `add-rdm` | RDM over WSC: discover fixtures on a line, read and set their DMX addresses and modes, compare them with the patch | To explore |
| 11 | `add-mvr-import` | MVR import (GDTF + positions from Vectorworks or Capture): patch and place a whole rig at once | To explore |
| 12 | `add-reliability` | Autosave with versions, crash recovery, show lock; undo/redo (`add-undo-redo`); visualizer in a worker (`move-visualizer-to-worker`) | To explore |

## Order and dependencies

- 2 needs 1, and 3 needs 2 (its layers sit in the merge).
- 4 applies after the merge, so after 2.
- 5 to 7 share the programmer and palettes: do 3 first.
- 2b should come early: every WSC unit (8, 9, 10, 10b) builds on a correct output path.
- 8 and 9 trigger playbacks, so they come after 5.
- 7b (addresses) comes before 8, 9 and 10b: inbound and outbound controls target those addresses.
- Each inbound unit checks the target gateway's support first.
- 10 to 12 are otherwise independent and can be done when a show needs them.

## Upstream WSC wishlist

Found while building `rework-outputs`; work for the WSC spec and `asls-server`, not Studio:

- A `STATE_QUERY` capability query: which protocols, interfaces, NICs and serial ports a gateway
  has, so Studio offers only those.
- `STATE_ERROR NO_ROUTE` (or `INCOMPATIBLE_PROTOCOL`) instead of dropping a stream the gateway
  can't send (sACN today).
- Wire the existing sACN, serial and USB DMX forwarders into the stream gateway.
- `WscClientManager.createClient` passes `onError` into the `onClose` slot.
- A query id on `STATE_QUERY`, echoed by `STATE_ANSWER`, to time keepalives exactly.

## Candidates (not planned yet)

- A tracking backup: a second Studio following the main one (its playback state over WSC, through
  the gateway or Studio to Studio), taking over the output when the main one goes quiet.
- Several operators on one show (remote tablets), the same way.
- Camera control and tally for broadcast events (VISCA, TALLY).
- Effect speed groups and per-effect tap.
