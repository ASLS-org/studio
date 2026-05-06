import liveInstance from '@/models/DMX/live.model';
import WscClientManager from '@asls/wsc-client';
import { WscPacket, WscTransport } from '@asls/wsc-sdk';

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
    this.streamId = null;
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
      case WscTransport.Protocol.ARTNET:
        this.transport = WscTransport.udp(
          this._protocol,
          this._address?.ip || '127.0.0.1',
          this._address?.port || 6454,
        );
        break;
      default:
        this.transport = new WscTransport(this._protocol);
    }
  }

  start() {
    if (this.state === STREAM_STATE.IDLE && !this.streamId) {
      this.streamId = liveInstance.add(this.forward.bind(this));
      this.state = STREAM_STATE.RUNNING;
    }
  }

  forward() {
    let packet = null;

    switch (this.protocol) {
      case WscTransport.Protocol.ARTNET:
        packet = WscPacket.create(
          WscPacket.Type.STREAM_CHANNELS,
          { universe: this.targetId, startChannel: 0, values: this.getFrame() },
          { transport: this.transport },
        );
        break;
      default:
        throw new Error(`Unsupported protocol: 0x${parseInt(this.protocol, 16)}\nthis protocol isn't supported yet`);
    }

    if (packet) {
      this.connectionHandle.client.send(packet);
    }
  }

  stop() {
    if (this.state === STREAM_STATE.RUNNING && this.streamId) {
      liveInstance.remove(this.streamId);
      this.state = STREAM_STATE.IDLE;
    }
  }
}

class WscConnection {
  constructor(remote, port, name) {
    this.remote = remote;
    this.port = port;
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
    return new WscConnectionStream(
      this,
      targetId,
      dataStreamHandle,
      protocol,
      address,
    );
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
