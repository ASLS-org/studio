import WscGateway, {
  DEFAULT_REMOTE_ADDRESS, DEFAULT_WSC_PORT, GATEWAY_STATUS,
} from '@/plugins/wsc.connection';
import { WscTransport } from '@asls/wsc-sdk';
import DmxRoute, { universeRange } from './route.model';
import { markRaw, reactive, toRaw } from '../utils/reactivity';

/**
 * What the toolbar indicator shows
 *
 * @enum {String}
 */
export const OUTPUT_STATE = Object.freeze({
  IDLE: 'idle',
  SENDING: 'sending',
  CONNECTING: 'connecting',
  LOST: 'lost',
});

const nextId = (items) => items.reduce((max, item) => Math.max(max, Number(item.id)), -1) + 1;

/**
 * @class OutputPool
 * @classdesc The show's gateways (WSC servers, saved as `outputs`) and its DMX routes (a
 * universe sent through a gateway). It sends every packed universe frame on its enabled routes.
 */
class OutputPool {
  constructor() {
    /**
     * Gateways
     *
     * @type {WscGateway[]}
     */
    this.outputs = [];
    /**
     * DMX routes
     *
     * @type {DmxRoute[]}
     */
    this.routes = [];
    /**
     * Ids of the enabled routes that collide with another one (reactive on its own: route
     * changes refresh it from the raw pool)
     *
     * @type {Set<Number>}
     */
    this.conflicts = reactive(new Set());
    // universe id → [{ route, gateway }] (raw): what the per-tick sender walks
    this._sending = markRaw(new Map());
    this._onRouteChange = (route) => toRaw(this).refresh(route);
  }

  /**
   * Gateways saved with the show
   *
   * @readonly
   * @type {Object[]}
   */
  get showData() {
    return this.outputs.map((output) => ({
      id: output.id,
      name: output.name,
      color: output.color,
      remote: output.remote,
      port: output.port,
      autoConnect: output.autoConnect,
    }));
  }

  /**
   * Routes saved with the show
   *
   * @readonly
   * @type {Object[]}
   */
  get routesData() {
    return this.routes.map((route) => route.showData);
  }

  /**
   * What the toolbar indicator shows. Gateways the operator disconnected don't count.
   *
   * @readonly
   * @type {String} one of OUTPUT_STATE
   */
  get state() {
    const active = this.outputs.filter((gateway) => gateway.session.status !== GATEWAY_STATUS.IDLE
      && this.routes.some((route) => route.enabled && route.gatewayId === gateway.id));
    if (!active.length) return OUTPUT_STATE.IDLE;
    if (active.some((g) => g.session.errored || g.session.lost
      || g.session.status === GATEWAY_STATUS.ERROR)) return OUTPUT_STATE.LOST;
    if (active.some((g) => g.session.status !== GATEWAY_STATUS.CONNECTED)) {
      return OUTPUT_STATE.CONNECTING;
    }
    return OUTPUT_STATE.SENDING;
  }

  /**
   * Returns a gateway from its id
   *
   * @public
   * @param {Number} id
   * @return {WscGateway}
   */
  getFromId(id) {
    const output = this.outputs.find((u) => u.id === Number(id));
    if (output) return output;
    throw new Error('Cannot find output in pool');
  }

  /**
   * Adds a gateway
   *
   * @public
   * @param {Object} outputData name, remote, port, autoConnect (id kept when loading)
   * @return {WscGateway}
   */
  addRaw(outputData = {}) {
    const id = outputData.id !== undefined && !this.outputs.some((o) => o.id === outputData.id)
      ? Number(outputData.id)
      : nextId(this.outputs);
    const output = new WscGateway({
      remote: DEFAULT_REMOTE_ADDRESS,
      port: DEFAULT_WSC_PORT,
      name: `Gateway ${this.outputs.length + 1}`,
      ...outputData,
      id,
    });
    this.outputs.push(output);
    return this.outputs[this.outputs.length - 1];
  }

  /**
   * Deletes a gateway: closes its session and deletes its routes
   *
   * @public
   * @param {WscGateway} output
   */
  delete(output) {
    const index = this.outputs.findIndex((item) => item.id === output.id);
    if (index < 0) throw new Error('Could not find output in output pool');
    this.outputs[index].disconnect();
    this.routes = this.routes.filter((route) => route.gatewayId !== output.id);
    this.outputs.splice(index, 1);
    this.refresh();
  }

  /**
   * Deletes every route and gateway
   *
   * @public
   */
  clearAll() {
    this.routes = [];
    for (let i = this.outputs.length - 1; i >= 0; i--) this.delete(this.outputs[i]);
    this.refresh();
  }

  /**
   * Adds a route. What isn't given is prefilled: the first gateway, Art-Net, the protocol's
   * first interface and port at `127.0.0.1`, the universe number after the highest one that
   * protocol uses (else its first).
   *
   * @public
   * @param {Object} data route data (`universe` = universe id)
   * @return {DmxRoute}
   */
  addRoute(data = {}) {
    const protocol = Number(data.protocol ?? WscTransport.Protocol.ARTNET);
    const same = this.routes.filter((r) => r.protocol === protocol);
    const route = new DmxRoute({
      output: this.outputs[0]?.id ?? 0,
      universeNumber: same.length
        ? Math.max(...same.map((r) => r.universeNumber)) + 1
        : universeRange(protocol).min,
      ...data,
      protocol,
      id: data.id !== undefined && !this.routes.some((r) => r.id === data.id)
        ? Number(data.id)
        : nextId(this.routes),
    }, this._onRouteChange);
    this.routes.push(route);
    this.refresh();
    return this.routes[this.routes.length - 1];
  }

  /**
   * Deletes a route
   *
   * @public
   * @param {DmxRoute} route
   */
  deleteRoute(route) {
    this.routes = this.routes.filter((r) => r.id !== route.id);
    this.refresh();
  }

  /**
   * Deletes a universe's routes (the universe is gone)
   *
   * @public
   * @param {Number} universeId
   */
  deleteUniverseRoutes(universeId) {
    this.routes = this.routes.filter((r) => r.universeId !== Number(universeId));
    this.refresh();
  }

  /**
   * A universe's routes
   *
   * @public
   * @param {Number} universeId
   * @return {DmxRoute[]}
   */
  routesOf(universeId) {
    return this.routes.filter((r) => r.universeId === Number(universeId));
  }

  /**
   * Rebuilds what the sender walks and the conflicts, after any route or gateway change
   *
   * @public
   */
  refresh() {
    const raw = toRaw(this);
    const sending = raw._sending;
    sending.clear();
    const keys = new Map();
    const { conflicts } = raw;
    conflicts.clear();
    raw.routes.forEach((r) => {
      const route = toRaw(r);
      if (!route.enabled) return;
      const gateway = raw.outputs.find((g) => g.id === route.gatewayId);
      if (!gateway) return;
      const key = route.conflictKey;
      if (keys.has(key)) {
        conflicts.add(route.id);
        conflicts.add(keys.get(key));
      } else keys.set(key, route.id);
      if (!sending.has(route.universeId)) sending.set(route.universeId, []);
      sending.get(route.universeId).push(markRaw({ route, gateway: toRaw(gateway) }));
    });
  }

  /**
   * Sends a packed universe frame on the universe's enabled routes whose gateway is connected.
   * Per tick, on raw objects.
   *
   * @public
   * @param {Number} universeId
   * @param {Uint8Array} frame
   */
  forward(universeId, frame) {
    const entries = this._sending.get(universeId);
    if (!entries) return;
    for (let i = 0; i < entries.length; i++) {
      const { route, gateway } = entries[i];
      if (route.transport && gateway.isConnected) route.forward(gateway.client, frame);
    }
  }

  /**
   * Connects the gateways set to connect when the show opens
   *
   * @public
   */
  connectOnLoad() {
    this.outputs.forEach((gateway) => {
      if (gateway.autoConnect) gateway.connect();
    });
  }
}

export default OutputPool;
