import { WscPacket, WscFlags, WscTransport } from '@asls/wsc-sdk';
import { markRaw } from '../utils/reactivity';

const { Protocol, Iface } = WscTransport;

/** Display names of the protocols a channel stream may use */
export const PROTOCOL_LABELS = Object.freeze({
  [Protocol.DMX512]: 'DMX512',
  [Protocol.ARTNET]: 'Art-Net',
  [Protocol.SACN]: 'sACN',
  [Protocol.KINET]: 'KiNET',
  [Protocol.MODBUS]: 'Modbus',
  [Protocol.OSC]: 'OSC',
  [Protocol.RAW]: 'Raw',
});

/** Display names of the interfaces */
export const IFACE_LABELS = Object.freeze({
  [Iface.UDP]: 'UDP',
  [Iface.TCP]: 'TCP',
  [Iface.SERIAL]: 'Serial',
  [Iface.USB]: 'USB',
  [Iface.WEBSOCKET]: 'WebSocket',
  [Iface.HTTP]: 'HTTP',
});

/**
 * Protocols WSC allows for channel streams (`STREAM_CHANNELS`), from the SDK's own table
 *
 * @type {Number[]}
 */
export const STREAM_PROTOCOLS = Object.freeze(
  [...WscPacket.typeProtocolCompat[WscPacket.Type.STREAM_CHANNELS]],
);

/**
 * How an interface addresses its receiver
 *
 * @param {Number} iface
 * @returns {String} 'net', 'serial', 'usb' or 'url'
 */
export function addressKind(iface) {
  switch (iface) {
    case Iface.UDP:
    case Iface.TCP: return 'net';
    case Iface.SERIAL: return 'serial';
    case Iface.USB: return 'usb';
    default: return 'url';
  }
}

/**
 * Interfaces WSC allows for a protocol
 *
 * @param {Number} protocol
 * @returns {Number[]}
 */
export function protocolInterfaces(protocol) {
  return WscTransport.ifaceCompat[protocol] || [];
}

/**
 * Range of a protocol's universe number
 *
 * @param {Number} protocol
 * @returns {{min: Number, max: Number}}
 */
export function universeRange(protocol) {
  if (protocol === Protocol.ARTNET) return { min: 0, max: 32767 };
  if (protocol === Protocol.SACN) return { min: 1, max: 63999 };
  return { min: 0, max: 65535 };
}

/**
 * Art-Net port-address split into Net, Subnet and Universe
 *
 * @param {Number} portAddress 15-bit port-address
 * @returns {{net: Number, subnet: Number, universe: Number}}
 */
export function splitPortAddress(portAddress) {
  return {
    // Lint forbids bitwise operators: 15 bits = net (7) · subnet (4) · universe (4)
    net: Math.floor(portAddress / 256) % 128,
    subnet: Math.floor(portAddress / 16) % 16,
    universe: portAddress % 16,
  };
}

/**
 * Art-Net port-address from Net, Subnet and Universe
 *
 * @param {Number} net 0-127
 * @param {Number} subnet 0-15
 * @param {Number} universe 0-15
 * @returns {Number}
 */
export function joinPortAddress(net, subnet, universe) {
  const clamp = (v, max) => Math.min(max, Math.max(0, Math.round(Number(v) || 0)));
  return clamp(net, 127) * 256 + clamp(subnet, 15) * 16 + clamp(universe, 15);
}

/**
 * A route's universe number as shown: `0.1.2` for Art-Net, the number otherwise
 *
 * @param {Number} protocol
 * @param {Number} number
 * @returns {String}
 */
export function universeLabel(protocol, number) {
  if (protocol !== Protocol.ARTNET) return `${number}`;
  const { net, subnet, universe } = splitPortAddress(number);
  return `${net}.${subnet}.${universe}`;
}

// The address a new interface starts from
function defaultAddress(protocol, iface) {
  const defaults = WscTransport.defaults[protocol] || {};
  switch (addressKind(iface)) {
    case 'net': return { ip: '127.0.0.1', port: defaults.port ?? 6454 };
    case 'serial': return { portIndex: 0 };
    case 'usb': return { vendorId: 0, productId: 0 };
    default: return { url: '' };
  }
}

const clampInt = (value, min, max) => Math.min(max, Math.max(min, Math.round(Number(value) || 0)));

/**
 * @class DmxRoute
 * @classdesc One universe sent through one gateway: protocol, interface, destination, universe
 * number and the protocol's parameters. The transport and the packet options are rebuilt on
 * every change, never per tick.
 */
class DmxRoute {
  /**
   * @param {Object} data route data (see `showData`)
   * @param {Function} [onChange] called after any change (the pool's refresh)
   */
  constructor(data = {}, onChange = null) {
    this._onChange = null;
    this.id = data.id;
    this._universeId = Number(data.universe ?? 0);
    this._gatewayId = Number(data.output ?? 0);
    this._enabled = data.enabled ?? true;
    this._protocol = STREAM_PROTOCOLS.includes(Number(data.protocol))
      ? Number(data.protocol)
      : Protocol.ARTNET;
    const ifaces = protocolInterfaces(this._protocol);
    this._iface = ifaces.includes(Number(data.iface)) ? Number(data.iface) : ifaces[0];
    this._address = { ...defaultAddress(this._protocol, this._iface), ...(data.address || {}) };
    const range = universeRange(this._protocol);
    this._universeNumber = clampInt(data.universeNumber ?? range.min, range.min, range.max);
    this._params = {
      priority: 100,
      ttl: 0,
      ifaceIdx: 0,
      baudRate: WscTransport.defaults[this._protocol]?.baudRate ?? 250000,
      ...(data.params || {}),
    };
    /**
     * Why the transport can't be built (an invalid address), else null
     *
     * @type {String|null}
     */
    this.invalid = null;
    this.transport = null;
    this._packetData = markRaw({ universe: 0, startChannel: 1, values: null });
    this._packetOpts = markRaw({ flags: markRaw(new WscFlags(true, true)), transport: null });
    this._rebuild();
    this._onChange = onChange;
  }

  /**
   * Id of the universe sent
   *
   * @type {Number}
   */
  set universeId(value) {
    this._universeId = Number(value);
    this._changed();
  }

  get universeId() {
    return this._universeId;
  }

  /**
   * Id of the gateway it goes through
   *
   * @type {Number}
   */
  set gatewayId(value) {
    this._gatewayId = Number(value);
    this._changed();
  }

  get gatewayId() {
    return this._gatewayId;
  }

  /**
   * Whether the route sends
   *
   * @type {Boolean}
   */
  set enabled(value) {
    this._enabled = !!value;
    this._changed();
  }

  get enabled() {
    return this._enabled;
  }

  /**
   * Downstream protocol (`WscTransport.Protocol`). Switching resets the interface, the
   * destination's port and baud rate, and converts the universe number (Art-Net n ↔ sACN n + 1).
   *
   * @type {Number}
   */
  set protocol(value) {
    const next = Number(value);
    if (next === this._protocol || !STREAM_PROTOCOLS.includes(next)) return;
    const previous = this._protocol;
    this._protocol = next;
    const ifaces = protocolInterfaces(next);
    const iface = ifaces.includes(this._iface) ? this._iface : ifaces[0];
    const fresh = defaultAddress(next, iface);
    this._iface = iface;
    this._address = addressKind(iface) === 'net'
      ? { ...fresh, ...(this._address.ip ? { ip: this._address.ip } : {}) }
      : { ...fresh, ...this._address };
    const baudRate = WscTransport.defaults[next]?.baudRate;
    if (baudRate) this._params.baudRate = baudRate;
    let number = this._universeNumber;
    if (previous === Protocol.ARTNET && next === Protocol.SACN) number += 1;
    if (previous === Protocol.SACN && next === Protocol.ARTNET) number -= 1;
    const range = universeRange(next);
    this._universeNumber = clampInt(number, range.min, range.max);
    this._changed();
  }

  get protocol() {
    return this._protocol;
  }

  /**
   * Interface (`WscTransport.Iface`), one of those WSC allows for the protocol
   *
   * @type {Number}
   */
  set iface(value) {
    const next = Number(value);
    if (next === this._iface || !protocolInterfaces(this._protocol).includes(next)) return;
    const kindChanged = addressKind(next) !== addressKind(this._iface);
    this._iface = next;
    if (kindChanged) this._address = defaultAddress(this._protocol, next);
    this._changed();
  }

  get iface() {
    return this._iface;
  }

  /**
   * Destination: `{ip, port}`, `{portIndex}`, `{vendorId, productId}` or `{url}`
   *
   * @type {Object}
   */
  set address(value) {
    this._address = { ...this._address, ...value };
    this._changed();
  }

  get address() {
    return this._address;
  }

  /**
   * Universe number sent (an Art-Net 15-bit port-address, sACN 1-63999, else 0-65535)
   *
   * @type {Number}
   */
  set universeNumber(value) {
    const range = universeRange(this._protocol);
    this._universeNumber = clampInt(value, range.min, range.max);
    this._changed();
  }

  get universeNumber() {
    return this._universeNumber;
  }

  /**
   * Parameters: `priority` (sACN, 0-200), `ttl` (UDP, 0 = gateway default), `ifaceIdx`
   * (gateway network card, 0 = default), `baudRate` (serial)
   *
   * @type {Object}
   */
  set params(value) {
    this._params = { ...this._params, ...value };
    this._changed();
  }

  get params() {
    return this._params;
  }

  /**
   * Destination as shown (`10.0.0.20:6454`, `Serial 0`, `USB 0403:6001`, a URL)
   *
   * @readonly
   * @type {String}
   */
  get destinationLabel() {
    const a = this._address;
    switch (addressKind(this._iface)) {
      case 'net': return `${a.ip}:${a.port}`;
      case 'serial': return `Serial ${a.portIndex}`;
      case 'usb': return `USB ${Number(a.vendorId).toString(16).padStart(4, '0')}:`
        + `${Number(a.productId).toString(16).padStart(4, '0')}`;
      default: return a.url || 'no URL';
    }
  }

  /**
   * What makes two routes collide: same gateway, protocol, destination and universe number
   *
   * @readonly
   * @type {String}
   */
  get conflictKey() {
    return `${this.gatewayId}|${this._protocol}|${this.destinationLabel}|${this._universeNumber}`;
  }

  /**
   * Sends one frame (per tick, on the raw instance: no allocation but the SDK's packet)
   *
   * @public
   * @param {Object} client connected WSC client
   * @param {Uint8Array} frame the universe's 512 channel values
   */
  forward(client, frame) {
    this._packetData.values = frame;
    client.send(WscPacket.create(
      WscPacket.Type.STREAM_CHANNELS,
      this._packetData,
      this._packetOpts,
    ));
  }

  /**
   * The packet the next frame would go out as (checks and the manual)
   *
   * @public
   * @param {Uint8Array} frame
   * @returns {WscPacket|null}
   */
  packetFor(frame) {
    if (!this.transport) return null;
    this._packetData.values = frame;
    return WscPacket.create(WscPacket.Type.STREAM_CHANNELS, this._packetData, this._packetOpts);
  }

  /**
   * Route data saved with the show
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return {
      id: this.id,
      universe: this.universeId,
      output: this.gatewayId,
      enabled: this._enabled,
      protocol: this._protocol,
      iface: this._iface,
      address: { ...this._address },
      universeNumber: this._universeNumber,
      params: { ...this._params },
    };
  }

  _changed() {
    this._rebuild();
    if (this._onChange) this._onChange(this);
  }

  _rebuild() {
    this._packetData.universe = this._universeNumber;
    try {
      this.transport = markRaw(this._buildTransport());
      this.invalid = null;
    } catch (err) {
      this.transport = null;
      this.invalid = err.message;
    }
    this._packetOpts.transport = this.transport;
    if (this.transport && import.meta.env?.DEV) {
      const { valid, errors } = WscPacket.validate(
        WscPacket.create(WscPacket.Type.STREAM_CHANNELS, {
          universe: this._universeNumber, startChannel: 1, values: new Uint8Array(512),
        }, this._packetOpts),
      );
      if (!valid) this.invalid = errors.join(', ');
    }
  }

  _buildTransport() {
    const a = this._address;
    const p = this._params;
    const protocol = this._protocol;
    let transport;
    switch (this._iface) {
      case Iface.UDP:
        transport = WscTransport.udp(protocol, String(a.ip).trim(), Number(a.port));
        if (p.ttl) transport.setParam(WscTransport.Param.TTL, clampInt(p.ttl, 1, 255));
        break;
      case Iface.TCP:
        transport = WscTransport.tcp(protocol, String(a.ip).trim(), Number(a.port));
        break;
      case Iface.SERIAL:
        transport = WscTransport.serial(
          protocol,
          clampInt(a.portIndex, 0, 255),
          clampInt(p.baudRate, 1, 4000000),
        );
        break;
      case Iface.USB:
        transport = WscTransport.usb(
          protocol,
          clampInt(a.vendorId, 0, 65535),
          clampInt(a.productId, 0, 65535),
        );
        break;
      case Iface.WEBSOCKET:
        if (!a.url) throw new Error('No URL');
        transport = WscTransport.websocket(protocol, a.url);
        break;
      case Iface.HTTP:
        if (!a.url) throw new Error('No URL');
        transport = WscTransport.http(protocol, a.url);
        break;
      default:
        throw new Error('No interface');
    }
    if (protocol === Protocol.SACN) {
      transport.setParam(WscTransport.Param.PRIORITY, clampInt(p.priority, 0, 200));
    }
    if ((this._iface === Iface.UDP || this._iface === Iface.TCP) && p.ifaceIdx) {
      transport.setParam(WscTransport.Param.IFACE_IDX, clampInt(p.ifaceIdx, 1, 255));
    }
    return transport;
  }
}

export default DmxRoute;
