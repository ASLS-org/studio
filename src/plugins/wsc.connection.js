import WscClientManager, { WSC_REMOTE_STATE } from '@asls/wsc-client';
import { WscPacket, WscTransport } from '@asls/wsc-sdk';

export const DEFAULT_REMOTE_ADDRESS = '127.0.0.1';
export const DEFAULT_WSC_PORT = 4515;

const connectionManager = new WscClientManager();

export const STREAM_STATE = Object.freeze({
  IDLE: 0,
  RUNNING: 1,
});

export class WscConnectionStream {
  /**
   * @param {WscConnection} wscConnectionHandle
   * @param {Number} targetId forward target id (eg. universe id)
   * @param {()=>Uint8Array} getFrame
   * @param {Object} address
   * @param {Number} protocol
   */
  constructor(wscConnectionHandle, targetId, getFrame, protocol, address) {
    this.targetId = targetId;
    this.connectionHandle = wscConnectionHandle;
    this.getFrame = getFrame;
    this.state = STREAM_STATE.IDLE;
    this.protocol = protocol;
    this.address = address;
  }

  set protocol(protocol) {
    this._protocol = protocol;
    this._rebuildTransport();
  }

  get protocol() {
    return this._protocol;
  }

  set interface(iface) {
    this._interface = iface;
    this._rebuildTransport();
  }

  get interface() {
    return this._interface;
  }

  set address(address) {
    this._address = {
      ...this._address,
      ...address,
    };
    this._rebuildTransport();
  }

  get address() {
    return this._address;
  }

  _rebuildTransport() {
    switch (this._protocol) {
      case WscTransport.Protocol.ARTNET: {
        const ip = this._address?.ip || '127.0.0.1';
        const port = this._address?.port || 6454;

        this.transport = WscTransport.udp(this._protocol, ip, port);
        this._address = { ip, port };
      } break;
      case WscTransport.Protocol.DMX512:
        this.transport = WscTransport.serial(this._protocol);
        break;
      default:
        this.transport = new WscTransport(this._protocol, this._interface);
    }
  }

  /**
   * Whether the stream sends frames. Running streams are fed by the universe pool's Live
   * frame phase, every tick and whatever the play state.
   *
   * @readonly
   * @type {Boolean}
   */
  get isRunning() {
    return this.state === STREAM_STATE.RUNNING;
  }

  start() {
    this.state = STREAM_STATE.RUNNING;
  }

  /**
   * Sends one universe frame to the gateway
   *
   * @param {Uint8Array} [frame] Universe frame, defaults to the stream's frame getter
   */
  forward(frame = this.getFrame()) {
    let packet = null;

    switch (this.protocol) {
      case WscTransport.Protocol.DMX512:
      case WscTransport.Protocol.ARTNET:
        // eslint-disable-next-line no-case-declarations
        packet = WscPacket.create(
          WscPacket.Type.STREAM_CHANNELS,
          { universe: this.targetId, startChannel: 0, values: frame },
          { transport: this.transport },
        );
        break;
      default:
        throw new Error(`Unsupported protocol: 0x${parseInt(this.protocol, 16)}\nthis protocol isn't supported yet`);
    }

    if (packet && this.connectionHandle.client) {
      this.connectionHandle.client.send(packet);
    }
  }

  stop() {
    this.state = STREAM_STATE.IDLE;
  }
}

class WscConnection {
  constructor(remote, port, name) {
    this.remote = remote;
    this.port = port;
    this.streams = [];
    this.name = name;
    this.client = null;
  }

  /**
   * Setup a new connection stream
   *
   * @param {WscConnection} wscConnectionHandle
   * @param {Number} targetId forward target id (eg. universe id)
   * @param {Uint8Array} dataStreamHandle
   * @param {Object} address
   * @param {Number} protocol
   */
  setupStream(targetId, protocol, address, dataStreamHandle) {
    const stream = new WscConnectionStream(
      this,
      targetId,
      dataStreamHandle,
      protocol,
      address,
    );

    this.streams.push(stream);

    return stream;
  }

  async connect() {
    this.client = connectionManager.createClient(
      this.remote,
      this.port,
      this.onOpen,
      this.onMessage,
      this.onError,
    );
    await this.client.connect();
  }

  async disconnect() {
    if (this?.client?.state === WSC_REMOTE_STATE.CONNECTED) {
      this.streams.forEach((s) => s.stop());
      this.client.close();
    }
  }

  /**
   *
   * @param {Uint8Array} channelsData
   * @param {WscTransport} transport
   */
  sendLighting(universe, channelsData, transport) {
    const data = { universe, startChannel: 0, data: channelsData };
    const packet = WscPacket.create(
      WscPacket.Type.STREAM_CHANNELS,
      data,
      null,
      transport,
    );
    this.client.send(packet);
  }

  // eslint-disable-next-line class-methods-use-this
  onOpen() {
    // eslint-disable-next-line no-console
    console.log('No onOpen method implemented');
  }

  // eslint-disable-next-line class-methods-use-this
  onMessage() {
    // eslint-disable-next-line no-console
    console.log('No onMessage method implemented');
  }

  // eslint-disable-next-line class-methods-use-this
  onError() {
    // eslint-disable-next-line no-console
    console.log('No onError method implemented');
  }
}

export default WscConnection;
