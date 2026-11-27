## MODIFIED Requirements

### Requirement: Output keeps running while the show is paused or stopped
The system SHALL keep sending, through each enabled route whose gateway is connected, its
universe's current DMX frame (512 channels, 0-255) while the show is playing, paused or stopped.
Pausing freezes playback values; it does not stop output.

#### Scenario: Pause during an effect
- **GIVEN** an enabled route of a universe on a connected gateway, while a dimmer effect plays
- **WHEN** the operator pauses the show
- **THEN** the gateway keeps receiving frames, with the dimmer values frozen where they were

#### Scenario: Edit while stopped
- **GIVEN** the show is stopped and a universe has an enabled route on a connected gateway
- **WHEN** the operator sets a fixture's Dimmer fader to 255
- **THEN** the next frames sent carry 255 on that fixture's Dimmer channel

## REMOVED Requirements

### Requirement: Universe Config opens the connections
**Reason**: The universe's Output select, its Config button and the Stream widget are replaced by
the universe's Output widget and the Outputs workspace.
**Migration**: A universe's routes are set in its Output widget or in the Outputs workspace.

## ADDED Requirements

### Requirement: The Outputs workspace shows the signal flow
The **Outputs** workspace (Preferences → Outputs, Ctrl+Shift+O) SHALL show, on its left, three
lists joined by wires: the show's universes, its gateways, and the destinations of its DMX routes.
Each route SHALL be one destination row, wired from its universe through its gateway, in the
universe's colour: solid while it sends, dashed while it is off, red while its gateway is lost or
reports an error. Selecting a universe, a gateway or a destination SHALL open its page on the
right of the lists.

#### Scenario: Two routes from one universe
- **GIVEN** universe 1 with an Art-Net route and an sACN route on gateway *Local*
- **WHEN** the operator opens Preferences → Outputs
- **THEN** universe 1 is wired through *Local* to two destination rows, one per route

#### Scenario: Inspecting a route
- **WHEN** the operator selects a destination row
- **THEN** the page on the right shows that route's protocol, interface, destination, universe
  number and parameters

### Requirement: Gateways
The operator SHALL add a gateway with **Add** in the Gateways header, set for a gateway on this computer
(`127.0.0.1`, port 4515), and set its name, host (an IPv4 address or a hostname) and port on its
page. **Connect** and **Disconnect** SHALL open and close its session. Deleting a gateway (its
row's bin) SHALL close its session and delete its routes.

#### Scenario: Connecting to the built-in gateway
- **GIVEN** the desktop app, with its built-in gateway running
- **WHEN** the operator adds a gateway and presses **Connect**
- **THEN** its state goes from *Connecting* to *Connected*

#### Scenario: Deleting a gateway with routes
- **GIVEN** a connected gateway with two routes
- **WHEN** the operator deletes the gateway
- **THEN** its session closes, its two destination rows disappear, and nothing else is sent to it

### Requirement: A gateway shows its state
A gateway's row SHALL show its state (a dot) and its round-trip time in ms while connected. Its
page SHALL say whether it is connected, connecting, trying again (with the attempt number) or not
connected, and show the system information the gateway sends (hostname, platform, uptime, CPU
load) while connected.

#### Scenario: Connected gateway
- **GIVEN** a connected gateway
- **WHEN** the operator selects it
- **THEN** its page says it is connected with its round-trip time and shows the gateway
  computer's hostname, platform, uptime and CPU load

### Requirement: A gateway keeps a log
A gateway's page SHALL end with its log, filling the rest of the page: one line per event in
plain words with its time, newest at the bottom (connecting, connected, lost or unreachable once
per outage, refused packets, disconnected), errors in red.

#### Scenario: Restarted gateway
- **GIVEN** a connected gateway
- **WHEN** the gateway stops, then comes back
- **THEN** its log adds one "Connection lost" line, then "Connected to 127.0.0.1:4515"

### Requirement: Connect on load
Each gateway SHALL have a **Connect on load** setting, off for new gateways and for gateways of
older showfiles. When a show opens, the system SHALL connect the gateways that have it on, and
no others.

#### Scenario: Opening a show
- **GIVEN** a show saved with gateway A (Connect on load on) and gateway B (off)
- **WHEN** the show is opened
- **THEN** A connects and its enabled routes start sending; B stays *Disconnected*

### Requirement: The session stays alive and comes back
While a gateway is connected, the system SHALL send it a `STATE_QUERY` KEEPALIVE every 1000 ms
and take the round-trip time from its answer. When the session closes or fails without the
operator disconnecting, the system SHALL show *Reconnecting* with the attempt number and try
again after 1, 2, 4 and 8 seconds, then every 10 seconds, until it connects or the operator
presses **Disconnect**. Once it reconnects, its enabled routes SHALL send again without any
action from the operator.

#### Scenario: Gateway restarted during a show
- **GIVEN** a connected gateway with an enabled Art-Net route
- **WHEN** the gateway process stops, then starts again 5 seconds later
- **THEN** the gateway shows *Reconnecting*, connects again within 10 seconds of its restart, and
  the Art-Net receiver gets frames again without the operator touching anything

#### Scenario: Operator disconnects
- **WHEN** the operator presses **Disconnect**
- **THEN** the gateway goes to *Disconnected* and no reconnection is attempted

### Requirement: Gateway errors are shown
When a gateway answers with a `STATE_ERROR`, the system SHALL add the refusal, its WSC error code
in words (when it is one of WSC's) and the gateway's message to that gateway's log, and mark the
gateway lost until the operator opens its page.

#### Scenario: Incompatible protocol
- **WHEN** a gateway reports `INCOMPATIBLE_PROTOCOL` for a route's packets
- **THEN** the gateway is marked and its log reads "The gateway refused a packet. Incompatible
  protocol" with the gateway's message

### Requirement: DMX routes
A route SHALL send one universe through one gateway with a protocol, an interface, a destination,
a universe number, its parameters and a **Forwarding** switch. A universe MAY have several routes.
A route that isn't forwarding SHALL send nothing, and its row SHALL read "not forwarding".

#### Scenario: Turning a route off
- **GIVEN** universe 1 with two enabled routes on a connected gateway
- **WHEN** the operator turns Forwarding off on one of them
- **THEN** its wire turns dashed and its destination stops receiving frames, while the other
  keeps receiving them

### Requirement: The lists keep their marked rows
Each of the three lists SHALL keep its marked row, so the flow reads left to right: the first
universe and the first gateway are marked when the workspace opens, and opening a route marks its
universe and gateway.

#### Scenario: Opening a route
- **WHEN** the operator opens a route of universe 1 through *FOH node*
- **THEN** universe 1, *FOH node* and the route are marked in their lists

### Requirement: New routes are prefilled
**Add** in the Destinations header SHALL add a forwarding Art-Net route
from the marked universe through the marked gateway, over UDP to `127.0.0.1:6454`, with the
universe number that follows the highest one Art-Net routes already use (else 0), and open its
page. It SHALL be unavailable while there is no gateway.

#### Scenario: New route
- **GIVEN** a show with gateways *Local* and *FOH node* and no routes
- **WHEN** the operator clicks universe 1, then *FOH node*, then **Add** above Destinations
- **THEN** a route appears for universe 1 through *FOH node*: Art-Net, UDP, `127.0.0.1:6454`,
  universe 0.0.0, forwarding, and its page opens

### Requirement: Conflicting routes are marked
Two enabled routes on the same gateway with the same protocol, destination and universe number
SHALL both be marked as a conflict.

#### Scenario: Conflicting routes
- **WHEN** two enabled routes on *Local* both send Art-Net 0.0.1 to `10.0.0.20:6454`
- **THEN** both destination rows are marked as a conflict

### Requirement: Route protocol and interface
The protocol choices SHALL be those WSC allows for channel streams: DMX512, Art-Net, sACN, KiNET,
Modbus, OSC and Raw. The interface choices SHALL be the ones WSC allows for that protocol, shown
only when there are several. Changing any route setting SHALL apply to the next frame sent.

#### Scenario: Protocol with one interface
- **WHEN** the operator picks Art-Net
- **THEN** no interface choice is shown, and the route uses UDP

### Requirement: Route destination follows the interface
The destination fields SHALL follow the interface: host and port for UDP and TCP, with the
protocol's default port filled in (Art-Net 6454, sACN 5568, KiNET 6038, Modbus 502, OSC 8000);
serial port index and baud rate for serial (DMX512 250000); vendor and product IDs for USB; a URL
for WebSocket and HTTP.

#### Scenario: Serial DMX
- **WHEN** the operator picks DMX512 and the serial interface
- **THEN** the destination shows a serial port index and a baud rate of 250000, and the next
  packets carry them

### Requirement: Route universe number and parameters
The universe number SHALL be Net (0-127), Subnet (0-15) and Universe (0-15) for Art-Net, 1-63999
for sACN, and 0-65535 otherwise. Priority (0-200, default 100) SHALL be offered for sACN, TTL for
UDP, and the gateway computer's network card index for UDP and TCP.

#### Scenario: Switching to sACN
- **GIVEN** an Art-Net route to `10.0.0.20:6454`, universe 0.0.1
- **WHEN** the operator picks sACN
- **THEN** the port becomes 5568, the universe number becomes a single field set to 1, and
  Priority appears at 100

### Requirement: Channel packets follow WSC
For each enabled route on a connected gateway, every engine tick, the system SHALL send one
`STREAM_CHANNELS` packet carrying the universe number, start channel 1 and the 512 channel values,
with the TR and GW flags set and a transport descriptor naming the route's protocol, interface,
destination and parameters. An Art-Net universe number SHALL be sent as its 15-bit port-address
(Net × 256 + Subnet × 16 + Universe).

#### Scenario: Art-Net packet
- **GIVEN** an enabled route: Art-Net over UDP to `10.0.0.20:6454`, universe 0.1.2
- **WHEN** the gateway receives the next packet
- **THEN** it is a valid `STREAM_CHANNELS` with TR and GW set, universe 18, start channel 1, 512
  values, and a UDP transport to `10.0.0.20:6454`

### Requirement: What the bundled gateway forwards
The page of a route whose protocol the gateway bundled with Studio does not forward SHALL say
that this gateway does not send it yet.

#### Scenario: sACN on the bundled gateway
- **WHEN** the operator picks sACN for a route
- **THEN** its page notes that the bundled gateway doesn't send sACN yet

### Requirement: Gateways and routes are saved with the show
Gateways (name, host, port, Connect on load) and routes (universe, gateway, protocol, interface,
destination, universe number, parameters, Forwarding) SHALL be saved with the show and restored when it
opens. Connection states SHALL NOT be saved, and connecting, disconnecting or reconnecting SHALL
NOT mark the show unsaved. Outputs of older showfiles SHALL load as gateways with Connect on load
off and no routes.

#### Scenario: Reload
- **GIVEN** a saved show with gateway *Local* and an Art-Net route for universe 1
- **WHEN** Studio reloads
- **THEN** the Outputs workspace shows the same gateway and route, with the same settings

#### Scenario: Older showfile
- **WHEN** a showfile saved before routes existed, with one output, is opened
- **THEN** it has one gateway with that output's name, host and port, Connect on load off, and no
  routes, and the show isn't marked unsaved

### Requirement: The toolbar shows the output state
The toolbar SHALL show one output indicator: idle when no route is enabled, sending when every
enabled route's gateway is connected, connecting while one is connecting or reconnecting, and lost
when a gateway with enabled routes is in error, has been reconnecting for more than 10 seconds,
or is marked with an error. Clicking it SHALL open the Outputs workspace.

#### Scenario: Gateway lost
- **GIVEN** every enabled route sending
- **WHEN** their gateway stops and doesn't come back within 10 seconds
- **THEN** the indicator shows lost, and clicking it opens the Outputs workspace

### Requirement: A universe lists its routes
The universe panel SHALL have an **Output** widget listing that universe's routes (protocol,
universe number, destination, gateway), each with a check that turns its forwarding on or off. **OUTPUTS**
in its header SHALL open the Outputs workspace on the universe, and clicking a route SHALL open
it on that route.

#### Scenario: Universe without routes
- **WHEN** the operator opens a universe that has no routes
- **THEN** its Output widget shows that it isn't sent anywhere, and **OUTPUTS** opens the
  workspace with that universe marked, ready for **Add**
