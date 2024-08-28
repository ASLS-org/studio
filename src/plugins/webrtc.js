import {
  EventEmitter,
} from 'events';

/**
 * WebRTC DataChannel name
 *
 * @constant {String} DATA_CHANNEL_NAME
 */
const DATA_CHANNEL_NAME = 'ALSL_STUDIO_DMX';

/**
 * WebRTC messages types enumeration
 *
 * @constant WS_MSG_TYPES
 * @enum {String}
 */
const WS_MSG_TYPES = {
  WebRTC_OFFER: '__WRTC_OFR',
  WebRTC_ICE: '__WRTC_ICE',
  OUTPUTS_LIST: '__OUTPUTS_LIST',
  OUTPUTS_SET: '__OUTPUTS__SET',
};

/**
 * WebRTC remoteHost states enumeration
 *
 * @constant REMOTE_HOST_STATES
 * @enum {Number}
 */
const REMOTE_HOST_STATES = {
  UNBOUND: 0,
  CONNECTING: 1,
  BOUND: 2,
};

/**
 * WebRTC remoteHost default values
 *
 * @constant REMOTE_HOST_STATES
 * @enum {Number}
 */
const REMOTE_HOST_DEFAULT = {
  URL: '192.168.1.23',
  PORT: 80,
  STATE: REMOTE_HOST_STATES.UNBOUND,
};

/**
 * @class
 * @classdesc Singleton WebRTC communication handler
 * @extends EventEmitter
 * @todo Re-implement UDP over WEBRTC
 */
class WebRTC extends EventEmitter {
  constructor() {
    // eslint-disable-next-line no-use-before-define
    if (!WebRTCInstance) {
      super();
      this.ws = null;
      this.remoteHost = {
        url: REMOTE_HOST_DEFAULT.URL,
        port: REMOTE_HOST_DEFAULT.PORT,
        state: REMOTE_HOST_DEFAULT.STATE,
      };
      this.ifaces = [];
      this.init();
      // this.tunnelLocally();
      this.waitForWsHandshake();
      // eslint-disable-next-line no-use-before-define
      WebRTCInstance = this;
    }
    // eslint-disable-next-line no-use-before-define
    return WebRTCInstance;
  }

  /**
   * Binds a remote host for communication over WEBRTC
   * For our specific purpuse, handshake is done over websocket
   *
   * @public
   */
  async bindRemoteHost(remoteHostConfig) {
    this.remoteHost.url = remoteHostConfig.url;
    this.remoteHost.port = remoteHostConfig.port;
    try {
      this.ws = new WebSocket(`ws://${this.remoteHost.url}:${this.remoteHost.port}/ws`);
      this.ws.onopen = () => {
        this.ws.send(
          JSON.stringify({
            method: 'offer',
            id: 12,
          }),
        );
      };
      this.ws.onmessage = async (msg) => {
        msg = JSON.parse(msg.data);
        console.log(msg);
        if (msg.id === 12) {
          const sdp = msg.result;
          const offer = { type: 'offer', sdp };
          this.peer.setRemoteDescription(offer);
          const description = await this.peer.createAnswer();
          this.peer.setLocalDescription(description);
        } else if (msg.id === 50) {
          console.log('receive answer ok');
        }
      };
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * Initialise WebRTC peer connection
   *
   * @public
   */
  init() {
    this.peer = new RTCPeerConnection();
    this.peer.onicecandidate = (event) => {
      if (event.candidate === null) {
        const json = {
          jsonrpc: '2.0',
          method: 'answer',
          params: this.peer.localDescription.sdp,
          id: 50,
        };
        this.ws.send(JSON.stringify(json));
      }
    };
    this.DMXDataChannel = this.peer.createDataChannel(DATA_CHANNEL_NAME);
    this.DMXDataChannel.binaryType = 'arraybuffer';
    this.DMXDataChannel.onmessage = this.DMXDataChannelMsgHandler.bind(this);
    this.DMXDataChannel.onopen = this.forwardOpenMessage.bind(this);
    this.DMXDataChannel.onclose = this.handleClosure.bind(this);
  }

  /**
   * Terminates WebRTC peer and channelData connections
   *
   * @public
   */
  // eslint-disable-next-line class-methods-use-this
  terminate() {
    this.peer.close();
    this.DMXDataChannel.close();
    this.DMXDataChannel = null;
  }

  /**
   * Waits for distant WebSocket handshake procedure to go through
   *
   * @public
   */
  waitForWsHandshake() {
    try {
      this.ws = new WebSocket(`ws://${this.remoteHost.url}:${this.remoteHost.port}/ws`);
      this.ws.onopen = () => {
        this.ws.send(
          JSON.stringify({
            method: 'offer',
            id: 12,
          }),
        );
      };
      this.ws.onmessage = async (msg) => {
        msg = JSON.parse(msg.data);
        console.log(msg);
        if (msg.id === 12) {
          const sdp = msg.result;
          const offer = { type: 'offer', sdp };

          console.log(offer);
          this.peer.setRemoteDescription(offer);
          this.peer.createAnswer()
            .then((d) => this.peer.setLocalDescription(d))
            .catch(console.log);
        } else if (msg.id === 50) {
          console.log('receive answer ok');
        }
        // switch (msg.type) {
        //   case WS_MSG_TYPES.WebRTC_OFFER:
        //     try {
        //       await this.peer.setRemoteDescription(new RTCSessionDescription(msg.data));
        //       const stats = await this.peer.getStats();
        //       console.log(stats);
        //       console.log(this.peer);
        //       this.ws.send(JSON.stringify({
        //         type: WS_MSG_TYPES.OUTPUTS_LIST,
        //       }));
        //     } catch (err) {
        //       console.log(err);
        //     }
        //     break;
        //   case WS_MSG_TYPES.WebRTC_ICE:
        //     try {
        //       if (msg.data) {
        //         await this.peer.addIceCandidate(new RTCIceCandidate(msg.data));
        //       }
        //     } catch (err) {
        //       console.log(err);
        //     }
        //     break;
        //   case WS_MSG_TYPES.OUTPUTS_LIST:
        //     this.ifaces = msg.data;
        //     this.emit('config-update');
        //     break;
        //   default: break;
        // }
      };
    } catch (err) {
      console.log(err);
    }
    // console.log('connecting again...');
    // this.ws.onopen = () => {
    //   this.ws.send(
    //     JSON.stringify({
    //       jsonrpc: '2.0',
    //       method: 'offer',
    //       id: 12,
    //     }),
    //   );
    //   // this.initDMXDataChannel((localDecription) => {
    //   //   console.log(localDecription);
    //   //   this.ws.send(JSON.stringify({
    //   //     type: WS_MSG_TYPES.WebRTC_OFFER,
    //   //     data: localDecription,
    //   //   }));
    //   // });
    //   this.ws.onmessage = async (msg) => {
    //     msg = JSON.parse(msg.data);
    //     console.log(msg);
    //     if (msg.id === 12) {
    //       const sdp = msg.result;
    //       const offer = { type: 'offer', sdp };

    //       console.log(offer);
    //       this.peer.setRemoteDescription(offer);
    //       this.peer.createAnswer()
    //         .then((d) => this.peer.setLocalDescription(d))
    //         .catch(console.log);
    //     } else if (msg.id === 50) {
    //       console.log('receive answer ok');
    //     }
    //     // switch (msg.type) {
    //     //   case WS_MSG_TYPES.WebRTC_OFFER:
    //     //     try {
    //     //       await this.peer.setRemoteDescription(new RTCSessionDescription(msg.data));
    //     //       const stats = await this.peer.getStats();
    //     //       console.log(stats);
    //     //       console.log(this.peer);
    //     //       this.ws.send(JSON.stringify({
    //     //         type: WS_MSG_TYPES.OUTPUTS_LIST,
    //     //       }));
    //     //     } catch (err) {
    //     //       console.log(err);
    //     //     }
    //     //     break;
    //     //   case WS_MSG_TYPES.WebRTC_ICE:
    //     //     try {
    //     //       if (msg.data) {
    //     //         await this.peer.addIceCandidate(new RTCIceCandidate(msg.data));
    //     //       }
    //     //     } catch (err) {
    //     //       console.log(err);
    //     //     }
    //     //     break;
    //     //   case WS_MSG_TYPES.OUTPUTS_LIST:
    //     //     this.ifaces = msg.data;
    //     //     this.emit('config-update');
    //     //     break;
    //     //   default: break;
    //     // }
    //   };
    // };
    // this.ws.onerror = (err) => {
    //   console.log(err);
    //   console.log('error connecting ws. closing');
    //   this.ws.close();
    //   this.terminate();
    //   this.init();
    // };
    // this.ws.onclose = () => {
    //   this.terminate();
    //   this.init();
    //   this.ws.onopen = () => {};
    //   this.ws.onclose = () => {};
    //   setTimeout(() => {
    //     this.waitForWsHandshake();
    //   }, WS_POLL_INTERVAL);
    // };
  }

  /**
   * Initilializes DMX data channel
   *
   * @public
   * @async
   * @param {Function} offerFn
   */
  async initDMXDataChannel(offerFn) {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    offerFn(this.peer.localDescription);
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
  broadcastUniverseData(data) {
    if (this.DMXDataChannel.readyState === 'open') {
      this.DMXDataChannel.send(data);
    }
  }

  /**
   * Forwards open communication message to parent.
   *
   * @public
   */

  forwardOpenMessage() {
    this.emit('open');
    this.remoteHost.state = REMOTE_HOST_STATES.BOUND;
  }

  /**
   * Handles DMXdatachannel closure
   *
   * @public
   */
  handleClosure() {
    this.emit('closed');
    this.remoteHost.state = REMOTE_HOST_STATES.UNBOUND;
  }
}

// eslint-disable-next-line vars-on-top, no-var, import/no-mutable-exports
var WebRTCInstance = new WebRTC();
export default WebRTCInstance;
