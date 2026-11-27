# Outputs

Studio computes your show as DMX: 512 values per universe, many times a second. To reach real
lights, each universe goes through the **gateway**, a small program that turns Studio's output
into a lighting protocol on your network, such as **Art-Net**. An Art-Net node (or a light that
speaks Art-Net) turns that into DMX on a cable.

<OutputPath />

Getting output going takes three steps: run the gateway, connect Studio to it, then route each
universe through it. Gateways and routes are saved with the show.

## 1. Run the Gateway

| Studio runs | The gateway |
| --- | --- |
| **Desktop app** | Is built in: it starts and stops with the app. Nothing to do |
| **In the browser** | Must run on the same computer. Get it from the [WSC releases](https://github.com/ASLS-org/WSC/releases) (`wsc-server-…` for your system) and start it; leave it running while you work |

The gateway listens for Studio on port **4515**. Your computer and the Art-Net node must be on the
same network, with the node's address reachable (Art-Net nodes often use `2.x.x.x` or
`10.x.x.x` addresses: set your computer's network address to match, as the node's manual says).

## The Outputs Workspace

Open **Preferences → Outputs** (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd>), or click
**OUTPUT** at the right of the toolbar. On the left, three lists show where your show goes:

| List | What it holds |
| --- | --- |
| **Universes** | Every universe of the show, with how many routes send it |
| **Gateways** | The gateways Studio connects to, with their state (dot) and response time |
| **Destinations** | One row per route: its protocol, universe number and receiver |

A wire joins each route's universe, gateway and destination, in the universe's colour: solid
while it sends, faint while its gateway isn't connected, dashed while the route is off, red when
its gateway is lost or reports an error. Click a row to open its page on the right. Each list
keeps its marked row, so the flow reads left to right: a universe, the gateway it goes through,
the route. **Add** in the Gateways and Destinations headers adds one; the bin on a gateway or
destination deletes it (a gateway takes its routes with it). Changes apply at once; **Done** (or
<kbd>Esc</kbd>) closes the workspace.

<LivePreview preset="outputs-popup" />

## 2. Connect Studio to the Gateway

1. Press **Add** in the **Gateways** header. The gateway is set for a gateway on this computer
   (`127.0.0.1`, port `4515`), which fits the desktop app, and its page opens.
2. Press **Connect**. The dot turns green and the response time appears; **Disconnect** (red)
   closes the session.

| Setting | Description |
| --- | --- |
| **Name** | The gateway's name, as the lists show it |
| **Host**, **Port** | Where the gateway runs: `127.0.0.1` (this computer) and `4515`, or another computer's address |
| **Connect on load** | Connects the gateway when the show opens. Off by default, so opening a show never sends to a rig by surprise |
| **Session** | **Connect** or **Disconnect** |

While connected, Studio checks the gateway every second. If it stops answering, Studio says so
and tries again on its own (after 1, 2, 4 and 8 seconds, then every 10 seconds) until it's back
or you press **Disconnect**; the routes send again as soon as it reconnects. The page also shows
the **Gateway computer** (its name, system, how long the gateway has run, its load) and the
gateway's **Log**: a line per event (connecting, connected, lost, anything the gateway refused),
newest at the bottom, errors in red.

## 3. Route a Universe

A **route** sends one universe through one gateway to one receiver. A universe can have several:
two nodes, or Art-Net and sACN at once.

1. Click the universe, then the gateway it goes through, then **Add** in the **Destinations**
   header. The route opens: Art-Net to `127.0.0.1:6454`, with the next free universe number.
2. **Protocol**: Art-Net for an Art-Net node; pick another when your receiver needs it.
3. **Address**: your node's address. **Port** `6454` is the Art-Net port.
4. **Net · Subnet · Universe**: the Art-Net universe the node listens to.

A route that is **Forwarding** sends the universe every frame while its gateway is connected, whether the
show plays, is paused or stopped. Turn **Forwarding** off to hold it back without losing its
settings: the list then reads "not forwarding".

| Setting | Shown for | Description |
| --- | --- | --- |
| **Forwarding** | Always | Whether the route sends |
| **Universe**, **Gateway** | Always | What is sent, and through which gateway |
| **Protocol** | Always | How the gateway sends the universe: DMX512, Art-Net, sACN, KiNET, Modbus, OSC or Raw |
| **Interface** | Protocols with several | The gateway's way out: network (UDP, TCP), serial, USB, WebSocket |
| **Address**, **Port** | Network interfaces | The receiving device's address. Picking a protocol fills in its usual port |
| **Serial port**, **Baud rate** | Serial | The port's number on the gateway's computer and its speed (DMX512: 250000) |
| **Vendor ID**, **Product ID** | USB | The USB interface's identifiers |
| **URL** | WebSocket, HTTP | The receiver's address (`ws://host:port/path`) |
| **Net · Subnet · Universe** | Art-Net | The Art-Net universe (0–127, 0–15, 0–15): set the node to the same |
| **Universe number** | Other protocols | The universe number (sACN: 1–63999) |
| **Priority** | sACN | The stream's priority (0–200, default 100): receivers follow the highest |
| **TTL** | UDP | How many network hops packets may cross (0: the gateway's default) |
| **Network card** | UDP, TCP | Which of the gateway computer's network cards sends them (0: the default) |

Two routes on the same gateway sending the same universe number to the same receiver read
**conflict** in the Destinations list: the receiver would get two streams for one universe.

In the universe panel, the **Output** widget lists the universe's routes, each with a check that
turns its forwarding on or off. **OUTPUTS** in its header opens the workspace on the universe; clicking a
route opens it on that route.

<LivePreview preset="universe-output" />

## The OUTPUT Indicator

The dot next to **OUTPUT** in the toolbar sums up what is sent:

| Dot | Means |
| --- | --- |
| Grey | Nothing is sent: no route is on, or their gateways are disconnected |
| Green | Every route that is on is sending |
| Gold | A gateway is connecting or reconnecting |
| Red | A gateway has been gone for more than 10 seconds, or reported an error. Hover the dot for its name |

## Check That It Works

1. Patch a fixture at the address its display shows
   ([Patching](/programming/patching#patch-settings)), in the universe you're streaming.
2. In the universe view, push its dimmer fader up (and open its shutter if it has one).
3. The light should follow. If it doesn't, see [Troubleshooting](/reference/troubleshooting#outputs).

On a computer without lights, an Art-Net monitor (a free app that shows the Art-Net packets on
your network) shows the values Studio sends.

## What's Verified

Checked with the gateway bundled with Studio, sending to a receiver on the same computer:
connecting, reconnecting after the gateway restarts, streaming Art-Net, and the values following
faders, scenes and effects.

| Protocol | Status |
| --- | --- |
| **Art-Net** over UDP | Works |
| **sACN** | The bundled gateway doesn't send it yet (nothing goes out, and no error is shown) |
| **DMX512** (USB or serial), **KiNET**, **Modbus**, **OSC**, **Raw** | Not verified yet |
