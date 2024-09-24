import {
  EventEmitter,
} from 'events';
import Live from '@/models/DMX/live.model';
// eslint-disable-next-line no-unused-vars
import adapter from 'webrtc-adapter';

console.log(adapter.browserDetails);

/**
 * List of handled WabRTC messages
 *
 * @constant {Object} WS_MSG_TYPES
 * @global
 */
const WS_MSG_TYPES = {
  WebRTC_OFFER: '__WRTC_OFR',
  WebRTC_ANSWER: '__WRTC_ANS',
  WebRTC_STATE: '__WRTC_STA',
  WebRTC_END: '__WRTC_END',
};

/**
 * WebShow DMX DataChannel name
 *
 * @constant {String} DATA_CHANNEL_NAME
 */
const DATA_CHANNEL_NAME = 'DMX';

const DEBUG_QUEUE_MAXLEN = 100;

/**
 * WebShow remoteHost states enumeration
 *
 * @constant WSC_REMOTE_STATE
 * @enum {Number}
 */
export const WSC_REMOTE_STATE = {
  ERROR: -1,
  IDLE: 0,
  CONNECTING: 1,
  CONNECTED: 2,
};

export const DEBUGGER_LOG_TYPE = {
  ERROR: -1,
  INFO: 0,
  SUCCESS: 1,
};

class WebShowSclient extends EventEmitter {
  constructor(remote, port, universe, name) {
    super();
    this.id = null;
    this.remote = remote;
    this.port = port;
    this.universe = universe;
    this.name = name;
    this.state = WSC_REMOTE_STATE.IDLE;
    this.ws = null;
    this.peer = null;
    this.dc = null;
    this.debug = [];
    this.init();
  }

  pushToDebug(data, type = DEBUGGER_LOG_TYPE.INFO) {
    this.debug.push({ data, type, timestamp: new Date().toLocaleTimeString() });
    if (this.debug.length > DEBUG_QUEUE_MAXLEN) this.debug.shift();
  }

  /**
   * Initialise WebRTC peer connection
   *
   * @public
   */
  init() {
    this.peer = new RTCPeerConnection({
      iceServers: [],
    });
    this.peer.onicecandidate = async (event) => {
      console.log(this.peer.localDescription.sdp);
      if (event.candidate === null) {
        await this.peer.setLocalDescription();
        this.ws.send(JSON.stringify({
          type: WS_MSG_TYPES.WebRTC_ANSWER,
          data: this.peer.localDescription.sdp,
        }));
      }
    };
    this.peer.addEventListener('connectionstatechange', (e) => {
      if (e.currentTarget.connectionState === 'disconnected') {
        this.handleClosure();
      }
    });
    this.dc = this.peer.createDataChannel(DATA_CHANNEL_NAME);/* , {
      ordered: false,
      maxRetransmits: 2,
      id: 0,
      negotiated: true,
    }); */
    this.dc.binaryType = 'arraybuffer';
    this.dc.bufferedAmountLowThreshold = 0;
    this.dc.onmessage = this.DMXDataChannelMsgHandler.bind(this);
    this.dc.onopen = this.handleDcOpen.bind(this);
    this.dc.onclose = this.handleClosure.bind(this);
  }

  /**
   * Trys and establish WebShow connection
   *
   * @public
   */
  async connect() {
    if (this.state === WSC_REMOTE_STATE.CONNECTING) {
      this.handleClosure();
    }
    this.pushToDebug('Connecting...');
    this.pushToDebug(`Signaling through ws://${this.remote}:${this.port}/ws`);
    this.state = WSC_REMOTE_STATE.CONNECTING;
    try {
      this.ws = new WebSocket(`ws://${this.remote}:${this.port}/ws`);
      this.ws.onopen = () => {
        this.pushToDebug('Sendind SDP offer');
        this.ws.send(
          JSON.stringify({ type: WS_MSG_TYPES.WebRTC_OFFER }),
        );
      };
      this.ws.onerror = () => {
        this.pushToDebug(`Signaling error, couldn't ws://${this.remote}:${this.port}/ws`, DEBUGGER_LOG_TYPE.ERROR);
        this.handleClosure();
      };
      this.ws.onmessage = async ({ data }) => {
        try {
          const msg = JSON.parse(data);
          if (msg.type === WS_MSG_TYPES.WebRTC_ANSWER) {
            const sdp = msg.data;
            const offer = { type: 'offer', sdp };
            this.pushToDebug('Setting remote description');
            await this.peer.setRemoteDescription(offer);
            const d = await this.peer.createAnswer();
            await this.peer.setLocalDescription(d);
          }
        } catch (err) {
          console.error(err);
          this.pushToDebug(`Signaling error: ${JSON.stringify(err)}`, DEBUGGER_LOG_TYPE.ERROR);
          this.handleClosure();
        }
      };
    } catch (err) {
      this.pushToDebug(`Unknown error: ${JSON.stringify(err)}`, DEBUGGER_LOG_TYPE.ERROR);
      this.handleClosure();
    }
  }

  /**
   * Handler for DMX DataChannel messages
   *
   * @public
   * @param {Object} data DMX DataChannel message
   */
  DMXDataChannelMsgHandler(data) {
    this.emit('universeData', data);
  }

  /**
   * Broadcasts Universe data to all peers through DMX DataChannel
   *
   * @param {Object} data
   *
   * @public
   */
  broadcastUniverseData() {
    if (this.dc.readyState === 'open' && this.universe) {
      // DO NOT OMIT.
      // This solves the buffer overflow issues
      if (this.dc.bufferedAmount <= 0) {
        this.dc.send(this.universe.DMX512Data);
      } else {
        console.log('skipped');
      }
    }
  }

  /**
   * Forwards open communication message to parent.
   *
   * @public
   */

  handleDcOpen() {
    this.pushToDebug('Connected to DMX datachannel', DEBUGGER_LOG_TYPE.SUCCESS);
    this._animationId = Live.add(this.broadcastUniverseData.bind(this), null, 60);
    this.state = WSC_REMOTE_STATE.CONNECTED;
    this.emit('open');
  }

  /**
   * Handles DMXdatachannel closure
   *
   * @public
   */
  handleClosure() {
    this.pushToDebug('Closing connection', DEBUGGER_LOG_TYPE.ERROR);
    if (this._animationId) Live.remove(this._animationId);
    if (this.ws) {
      this.ws.onclose = () => {};
      this.ws.onerror = () => {};
      this.ws.close();
      this.ws = null;
    }
    this.peer.close();
    this.state = WSC_REMOTE_STATE.IDLE;
    this.emit('close');
  }
}

export default WebShowSclient;
