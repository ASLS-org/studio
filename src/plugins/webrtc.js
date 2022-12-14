'use strict'

import {
  EventEmitter
} from 'events';

/**
 * WebRTC DataChannel name
 * 
 * @constant {String} DATA_CHANNEL_NAME
 */
const DATA_CHANNEL_NAME = "ALSL_STUDIO_DMX";
/**
 * Discovery Websocket poll interval
 * 
 * @constant {Number} WS_POLL_INTERVAL
 */
const WS_POLL_INTERVAL = 500;
/**
 * LOcal communicator mesasge prefix
 * 
 * @constant {String} LOCALCOM_MSG_PREFIX
 */
const LOCALCOM_MSG_PREFIX = "__LCMSG"
/**
 * WebRTC messages types enumeration
 * 
 * @constant WS_MSG_TYPES
 * @enum {String}
 */
const WS_MSG_TYPES = {
  WebRTC_OFFER: "__WRTC_OFR",
  WebRTC_ICE: "__WRTC_ICE",
  OUTPUTS_LIST: "__OUTPUTS_LIST",
  OUTPUTS_SET: "__OUTPUTS__SET"
}
/**
 * WebRTC remoteHost states enumeration
 * 
 * @constant REMOTE_HOST_STATES
 * @enum {Number}
 */
const REMOTE_HOST_STATES = {
  UNBOUND: 0,
  CONNECTING: 1,
  BOUND: 2
}
/**
 * WebRTC remoteHost default values
 * 
 * @constant REMOTE_HOST_STATES
 * @enum {Number}
 */
const REMOTE_HOST_DEFAULT = {
  URL: "localhost",
  PORT: 5214,
  STATE: REMOTE_HOST_STATES.UNBOUND
}

/**
 * @class LocalCom
 * @classdesc Local communicator singleton. Establishes inter-tab/window communication through local storage
 * @extends EventEmitter
 */

class LocalCom extends EventEmitter {

  constructor() {
    if (!LocalComInstance) {
      super();
      this.id = performance.now();
      this.listen();
      LocalComInstance = this;
    }
    return LocalComInstance
  }

  /**
   * Start listening for incomming local messages
   * 
   * @public
   */
  listen() {
    window.addEventListener("storage", this.handleIncoming.bind(this));
  }

  /**
   * Send message 
   * 
   * @public
   * @param {String} type Message type
   * @param {Object} data data to be sent through
   */
  send(type, data) {
    localStorage.setItem(`${LOCALCOM_MSG_PREFIX}${type}$${this.id}`, JSON.stringify(data));
  }

  /**
   * Closes local communication
   * 
   * @public
   */
  close() {
    window.removeEventListener("storage", this.handleIncoming.bind(this));
  }

  /**
   * Parses incomming messages. and emmit it through parent's emit method
   * 
   * @param {Event} e local stoage event
   */
  handleIncoming(e) {
    let splitted = e.key.split("$");
    let id = parseInt(splitted[1])
    let type = splitted[0].replace(LOCALCOM_MSG_PREFIX, '');
    if (e.key.includes(LOCALCOM_MSG_PREFIX) && id != this.id) {
      this.emit("message", {
        type: type,
        data: JSON.parse(e.newValue)
      })
    }
  }

}

var LocalComInstance = new LocalCom();


/**
 * @class
 * @classdesc Singleton WebRTC communication handler
 * @extends EventEmitter
 * @todo Re-implement UDP over WEBRTC
 */
class WebRTC extends EventEmitter {

  constructor() {
    if (!WebRTCInstance) {
      super();
      this.ws = null;
      this.remoteHost = {
        url: REMOTE_HOST_DEFAULT.URL,
        port: REMOTE_HOST_DEFAULT.PORT,
        state: REMOTE_HOST_DEFAULT.STATE
      }
      this.ifaces = [];
      this.init();
      // this.tunnelLocally();
      this.waitForWsHandshake();
      WebRTCInstance = this;
    }
    return WebRTCInstance;
  }

  /**
   * Binds a remote host for communication over WEBRTC
   * For our specific purpuse, handshake is done over websocket
   * 
   * @public
   */
  bindRemoteHost(remoteHostConfig) {
    this.remoteHost.url = remoteHostConfig.url;
    this.remoteHost.port = remoteHostConfig.port;
    this.waitForWsHandshake();
  }

  setOutputs(outputs){
    if(this.remoteHost.state === REMOTE_HOST_STATES.BOUND){
      this.ws.send(JSON.stringify({
        type: WS_MSG_TYPES.OUTPUTS_SET,
        data: outputs
      }))
    }
  }

  /**
   * Initialise WebRTC peer connection
   * 
   * @public
   */
  init() {
    this.peer = new RTCPeerConnection();
    this.DMXDataChannel = this.peer.createDataChannel(DATA_CHANNEL_NAME);
    this.DMXDataChannel.onmessage = this.DMXDataChannelMsgHandler.bind(this);
    this.DMXDataChannel.onopen = this.forwardOpenMessage.bind(this);
    this.DMXDataChannel.onclose = this.handleClosure.bind(this)
  }

  /**
   * Terminates WebRTC peer and channelData connections
   * 
   * @public
   */
  terminate() {
    // alert("term")
    // this.peer.close();
    // this.DMXDataChannel.close();
    // this.DMXDataChannel = null;
  }

  /**
   * Tunnel communication locally through LocalCom
   * 
   * @public
   */
  tunnelLocally() {
    this.peer.ondatachannel = (e) => {
      this.DMXDataChannel = e.channel
      e.onmessage = this.DMXDataChannelMsgHandler.bind(this);
      e.onopen = this.forwardOpenMessage.bind(this);
    }
    this.peer.onicecandidate = (e) => LocalComInstance.send(WS_MSG_TYPES.WebRTC_ICE, e.candidate);
    this.peer.onnegotiationneeded = async () => {
      try {
        let offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(offer);
        LocalComInstance.send(WS_MSG_TYPES.WebRTC_OFFER, this.peer.localDescription)
      } catch (err) {
        console.log(err)
      }
    }
    this.waitForLocalHandshake();
  }

  /**
   * Waits for local handshake procedure to go through
   * 
   * @public
   */
  waitForLocalHandshake() {
    LocalComInstance.on("message", async (msg) => {
      switch (msg.type) {
        case WS_MSG_TYPES.WebRTC_OFFER:
          try {
            if (msg.data) {
              await this.peer.setRemoteDescription(new RTCSessionDescription(msg.data));
              if (this.peer.signalingState != "stable") {
                let answer = await this.peer.createAnswer();
                await this.peer.setLocalDescription(answer);
                LocalComInstance.send(WS_MSG_TYPES.WebRTC_OFFER, this.peer.localDescription);
              }
            }
          } catch (err) {
            console.log(err);
          }
          break;
        case WS_MSG_TYPES.WebRTC_ICE:
          try {
            if (msg.data)
              await this.peer.addIceCandidate(new RTCIceCandidate(msg.data));
          } catch (err) {
            console.log(err);
          }
          break;
      }
    })
  }

  /**
   * Waits for distant WebSocket handshake procedure to go through
   * 
   * @public
   */
  waitForWsHandshake() {
    try {
      this.ws = new WebSocket(`ws://${this.remoteHost.url}:${this.remoteHost.port}/ws`);
    } catch (err) {
      console.log(err)
    }
    console.log("connecting again...")
    this.ws.onopen = () => {
      this.initDMXDataChannel(localDecription => this.ws.send(JSON.stringify({
        type: WS_MSG_TYPES.WebRTC_OFFER,
        data: localDecription
      })))
      this.ws.onmessage = async (msg) => {
        msg = JSON.parse(msg.data)
        switch (msg.type) {
          case WS_MSG_TYPES.WebRTC_OFFER:
            try {
              this.peer.setRemoteDescription(new RTCSessionDescription(msg.data));
              this.ws.send(JSON.stringify({
                type: WS_MSG_TYPES.OUTPUTS_LIST,
              }));
            } catch (err) {
              console.log(err);
            }
            break;
          case WS_MSG_TYPES.WebRTC_ICE:
            try {
              if (msg.data) {
                await this.peer.addIceCandidate(new RTCIceCandidate(msg.data));
              }
            } catch (err) {
              console.log(err);
            }
            break;
          case WS_MSG_TYPES.OUTPUTS_LIST:
            this.ifaces = msg.data;
            this.emit("config-update")
            break;
        }
      }
    }
    this.ws.onerror = () => {
      console.log("error connecting ws. closing");
      this.ws.close();
      this.terminate();
      this.init();
    }
    this.ws.onclose = () => {
      this.terminate();
      this.init();
      this.ws.onopen = () => {}
      this.ws.onclose = () => {}
      setTimeout(() => {
        this.waitForWsHandshake()
      }, WS_POLL_INTERVAL)
    }
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
    this.emit("universeData", data)
  }

  /**
   * Broadcasts Universe data to all peers through DMX DataChannel
   * 
   * @param {Object} data 
   * @public
   */
  broadcastUniverseData(data) {
    if (this.DMXDataChannel.readyState === "open") {
      this.DMXDataChannel.send(JSON.stringify(data));
    }
  }

  /**
   * Forwards open communication message to parent.
   *
   * @public
   */

  forwardOpenMessage() {
    this.emit("open");
    this.remoteHost.state = REMOTE_HOST_STATES.BOUND;
  }

  /**
   * Handles DMXdatachannel closure
   * 
   * @public
   */
  handleClosure() {
    this.emit("closed");
    this.remoteHost.state = REMOTE_HOST_STATES.UNBOUND;
  }

}

var WebRTCInstance = new WebRTC();
export default WebRTCInstance