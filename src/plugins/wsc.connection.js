import { WscClient, WSC_REMOTE_STATE } from '@asls/wsc-client';
import { WscPacket, WscFlags, WscTransport } from '@asls/wsc-sdk';
import { markRaw, reactive } from '@/models/utils/reactivity';

export const DEFAULT_REMOTE_ADDRESS = '127.0.0.1';
export const DEFAULT_WSC_PORT = 4515;

/**
 * Protocols the gateway bundled with Studio (`WSC_VERSION` in `.env`) forwards for channel
 * streams. Update it when the bundled gateway changes: the route inspector notes the others.
 */
export const BUNDLED_GATEWAY_FORWARDS = Object.freeze([WscTransport.Protocol.ARTNET]);

/**
 * Session states shown for a gateway
 *
 * @enum {String}
 */
export const GATEWAY_STATUS = Object.freeze({
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
});

/** Keepalive period (WSC spec 06) */
export const KEEPALIVE_MS = 1000;
/** A session with no keepalive answer for this long is lost */
export const LOSS_MS = 3000;
/** A gateway reconnecting for longer than this counts as lost for the toolbar */
export const LOST_AFTER_MS = 10000;
/** Reconnection delays, then every BACKOFF_MAX_MS */
const BACKOFF_MS = [1000, 2000, 4000, 8000];
const BACKOFF_MAX_MS = 10000;
const LOG_MAX = 100;

/**
 * Name of a WSC error code
 *
 * @param {Number} code
 * @returns {String}
 */
export function errorCodeName(code) {
  return Object.keys(WscPacket.ErrorCode).find((k) => WscPacket.ErrorCode[k] === code)
    || `0x${Number(code).toString(16).padStart(4, '0')}`;
}

/**
 * A WSC error code as an operator reads it: `INCOMPATIBLE_PROTOCOL` → "Incompatible protocol"
 *
 * @param {Number} code
 * @returns {String}
 */
export function errorCodeText(code) {
  const name = errorCodeName(code);
  if (name.startsWith('0x')) return `Error ${name}`;
  const words = name.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

let logId = 0;

/**
 * @class WscGateway
 * @classdesc A WSC gateway (a WSC server) Studio sends to: its saved settings and its session,
 * kept alive with keepalives and reconnected on its own until the operator disconnects.
 */
class WscGateway {
  /**
   * @param {Object} data
   * @param {Number} data.id
   * @param {String} data.name
   * @param {String} [data.color]
   * @param {String} data.remote host (IPv4 address or hostname)
   * @param {Number} data.port
   * @param {Boolean} [data.autoConnect] connect when the show opens
   */
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name ?? 'Gateway';
    this.color = data.color ?? null;
    this.remote = data.remote ?? DEFAULT_REMOTE_ADDRESS;
    this.port = Number(data.port ?? DEFAULT_WSC_PORT);
    this.autoConnect = !!data.autoConnect;
    /**
     * Runtime session state (never saved). Reactive on its own: session events are written
     * from the client's callbacks, which run on this raw instance.
     *
     * @type {Object}
     */
    this.session = reactive({
      status: GATEWAY_STATUS.IDLE,
      attempt: 0,
      rtt: null,
      system: null,
      log: [],
      errored: false,
      lost: false,
    });
    this.client = null;
    this._timers = markRaw({
      keepalive: null, retry: null, lost: null,
    });
    this._query = markRaw({ inFlight: false, sentAt: 0 });
    this._userClosed = true;
  }

  /**
   * Whether the session is open (read per tick by the route sender, on the raw instance)
   *
   * @readonly
   * @type {Boolean}
   */
  get isConnected() {
    return !!this.client && this.client.state === WSC_REMOTE_STATE.CONNECTED;
  }

  /**
   * Opens the session. It then stays up on its own until `disconnect()`.
   *
   * @public
   */
  connect() {
    this._userClosed = false;
    this.session.attempt = 0;
    this.session.errored = false;
    this._open();
  }

  /**
   * Closes the session; no reconnection follows.
   *
   * @public
   */
  disconnect() {
    const wasOpen = this.session.status !== GATEWAY_STATUS.IDLE;
    this._userClosed = true;
    this._clearTimers();
    this._dropClient();
    Object.assign(this.session, { status: GATEWAY_STATUS.IDLE, attempt: 0, rtt: null });
    this._clearLost();
    if (wasOpen) this.addLog('Disconnected');
  }

  /**
   * Adds a line to the gateway's activity (last 100 kept), written for an operator
   *
   * @public
   * @param {String} text
   * @param {String} [type] 'info', 'success' or 'error'
   */
  addLog(text, type = 'info') {
    logId += 1;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.session.log.push({
      id: logId, time, type, text,
    });
    const extra = this.session.log.length - LOG_MAX;
    if (extra > 0) this.session.log.splice(0, extra);
  }

  /**
   * Clears the error mark (the operator has seen the log)
   *
   * @public
   */
  acknowledgeErrors() {
    this.session.errored = false;
  }

  _open() {
    this._clearTimers();
    this._dropClient();
    this.session.status = this.session.attempt
      ? GATEWAY_STATUS.RECONNECTING
      : GATEWAY_STATUS.CONNECTING;
    this.session.rtt = null;
    // An outage logs once: its retries show in the status, not as lines
    if (!this.session.attempt) this.addLog(`Connecting to ${this.remote}:${this.port}`);
    const client = new WscClient(
      this.remote,
      this.port,
      () => this._onOpen(client),
      (packet) => this._onMessage(client, packet),
      () => this._onClose(client),
      () => this._onClose(client),
    );
    this.client = markRaw(client);
    client.connect().catch(() => this._lose());
  }

  _onOpen(client) {
    if (client !== this.client) return;
    this._clearTimers();
    this._clearLost();
    Object.assign(this.session, { status: GATEWAY_STATUS.CONNECTED, attempt: 0 });
    this.addLog(`Connected to ${this.remote}:${this.port}`, 'success');
    this._query.inFlight = false;
    this._timers.keepalive = setInterval(() => this._keepalive(), KEEPALIVE_MS);
  }

  _keepalive() {
    const { client } = this;
    if (!client) return;
    if (client.state === WSC_REMOTE_STATE.ERROR) {
      this._lose();
      return;
    }
    const now = performance.now();
    if (this._query.inFlight) {
      if (now - this._query.sentAt > LOSS_MS) {
        this._lose(`Connection lost: the gateway stopped answering (${LOSS_MS / 1000} s)`);
      }
      return;
    }
    try {
      client.send(WscPacket.create(
        WscPacket.Type.STATE_QUERY,
        { queryType: WscPacket.StateQuery.KEEPALIVE },
        { flags: new WscFlags() },
      ));
      this._query.inFlight = true;
      this._query.sentAt = now;
    } catch (err) {
      this._lose();
    }
  }

  _onMessage(client, packet) {
    if (client !== this.client || !packet) return;
    if (packet.type === WscPacket.Type.STATE_ANSWER) {
      if (!this._query.inFlight) return;
      const answer = WscPacket.decode(packet);
      this._query.inFlight = false;
      this.session.rtt = Math.round(performance.now() - this._query.sentAt);
      if (answer?.data && !(answer.data instanceof Uint8Array)) this.session.system = answer.data;
    } else if (packet.type === WscPacket.Type.STATE_ERROR) {
      const error = WscPacket.decode(packet);
      this.session.errored = true;
      // Gateways may answer with codes of their own: only WSC's are named
      const known = !errorCodeName(error?.errorCode).startsWith('0x');
      const what = [known ? errorCodeText(error.errorCode) : '', error?.message || '']
        .filter(Boolean).join(': ');
      this.addLog(`The gateway refused a packet${what ? `. ${what}` : ''}`, 'error');
    }
  }

  _onClose(client) {
    // The client calls it when it closes itself too: only a close we didn't ask for counts
    if (client !== this.client || this._closing) return;
    this._lose();
  }

  /**
   * The session dropped or never opened: logs it once per outage and retries
   *
   * @param {String} [reason] what happened, else worked out from the state
   */
  _lose(reason) {
    if (this._userClosed) return;
    const wasUp = this.session.status === GATEWAY_STATUS.CONNECTED;
    this._clearTimers();
    this._dropClient();
    if (wasUp || !this.session.attempt) {
      this.addLog(reason || (wasUp
        ? 'Connection lost'
        : `Can't reach the gateway at ${this.remote}:${this.port}. Trying again`), 'error');
    }
    this.session.attempt += 1;
    this.session.status = GATEWAY_STATUS.RECONNECTING;
    this.session.rtt = null;
    if (!this.session.lost && !this._timers.lost) {
      this._timers.lost = setTimeout(() => {
        this._timers.lost = null;
        this.session.lost = true;
      }, LOST_AFTER_MS);
    }
    const delay = BACKOFF_MS[this.session.attempt - 1] ?? BACKOFF_MAX_MS;
    this._timers.retry = setTimeout(() => this._open(), delay);
  }

  _dropClient() {
    if (!this.client) return;
    this._closing = true;
    try {
      this.client.stopKeepaliveSession();
      this.client.close();
    } catch (err) {
      // A half-open client may throw while closing: it's dropped either way
    }
    this._closing = false;
    this.client = null;
    this._query.inFlight = false;
  }

  _clearTimers() {
    clearInterval(this._timers.keepalive);
    clearTimeout(this._timers.retry);
    this._timers.keepalive = null;
    this._timers.retry = null;
  }

  // The "lost" mark (and its pending timer) last until the session opens or is closed
  _clearLost() {
    clearTimeout(this._timers.lost);
    this._timers.lost = null;
    this.session.lost = false;
  }
}

export default WscGateway;
