/**
 * What the Outputs views show for gateways and routes (flow, inspectors, a universe's Output
 * widget).
 *
 * @module views/utils/outputs
 */
import { GATEWAY_STATUS } from '@/plugins/wsc.connection';

/** A gateway's dot colour, by session status (the list rows' dot) */
export const GATEWAY_COLORS = {
  [GATEWAY_STATUS.IDLE]: 'var(--secondary-light)',
  [GATEWAY_STATUS.CONNECTING]: 'var(--accent-gold)',
  [GATEWAY_STATUS.RECONNECTING]: 'var(--accent-gold)',
  [GATEWAY_STATUS.CONNECTED]: 'var(--accent-green)',
  [GATEWAY_STATUS.ERROR]: 'var(--accent-red)',
};

/** A gateway's status as written */
export const GATEWAY_STATUS_LABELS = {
  [GATEWAY_STATUS.IDLE]: 'Disconnected',
  [GATEWAY_STATUS.CONNECTING]: 'Connecting',
  [GATEWAY_STATUS.RECONNECTING]: 'Reconnecting',
  [GATEWAY_STATUS.CONNECTED]: 'Connected',
  [GATEWAY_STATUS.ERROR]: 'Error',
};

/**
 * What a route does now: 'sending', 'off', 'waiting' (its gateway isn't connected) or 'lost'
 *
 * @param {Object} route
 * @param {Object} gateway
 * @returns {String}
 */
export function routeState(route, gateway) {
  if (!route.enabled) return 'off';
  if (!gateway) return 'waiting';
  const { session } = gateway;
  if (session.errored || session.lost || session.status === GATEWAY_STATUS.ERROR) return 'lost';
  if (route.invalid) return 'lost';
  return session.status === GATEWAY_STATUS.CONNECTED ? 'sending' : 'waiting';
}
