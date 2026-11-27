<template>
  <div class="outputs_flow">
    <div
      class="outputs_flow_inner"
      :style="{ minHeight: `${height}px` }"
    >
      <svg
        class="outputs_flow_wires"
        :width="width"
        :height="height"
        :viewBox="`0 0 ${width} ${height}`"
      >
        <path
          v-for="wire in wires"
          :key="wire.key"
          :d="wire.d"
          :class="['outputs_flow_wire', wire.state]"
          :style="{ stroke: wire.state === 'lost' ? null : wire.color }"
        />
      </svg>
      <div
        v-for="column in columns"
        :key="column.kind"
        class="outputs_flow_column"
        :class="`outputs_flow_${column.kind}`"
      >
        <!-- A column's title and its action, as a widget header -->
        <div class="outputs_flow_head">
          <h3>{{ column.title }}</h3>
          <uk-spacer />
          <uk-button
            v-if="column.add"
            icon="new"
            label="add"
            :title="column.add.title"
            :disabled="column.add.disabled"
            @click="$emit(column.add.event)"
          />
        </div>
        <uk-list
          :items="column.items"
          :selection="selection[column.kind] === null ? [] : [selection[column.kind]]"
          :deletable="column.deletable"
          :empty-text="column.empty"
          colored
          no-highlight
          @select="(item) => $emit('select', { kind: column.kind, id: item.id })"
          @delete="(items) => $emit('delete', { kind: column.kind, ids: items.map((i) => i.id) })"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { PROTOCOL_LABELS, universeLabel } from '@/models/DMX/route.model';
import { GATEWAY_STATUS } from '@/plugins/wsc.connection';
import { GATEWAY_COLORS, routeState } from '@/views/utils/outputs';
import {
  OUTPUT_HEAD_HEIGHT, OUTPUT_COLUMN_WIDTH, OUTPUT_WIRE_GAP, OUTPUT_ROW_PITCH,
} from '@/views/utils/geometry';

/**
 * @component The Outputs workspace's signal flow: the show's universes, its gateways and its
 * routes' destinations as three lists, joined by one wire per route (drawn from row indexes,
 * nothing measured).
 */
export default {
  name: 'OutputsFlow',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * The row marked in each list: `{ universe, gateway, route }` (ids or null). A route is added
     * from the marked universe through the marked gateway, so the lists read left to right.
     */
    selection: { type: Object, default: () => ({ universe: null, gateway: null, route: null }) },
  },
  emits: ['select', 'delete', 'add-gateway', 'add-route'],
  computed: {
    pool() {
      return this.$show.outputPool;
    },
    universes() {
      return this.$show.universePool.universes;
    },
    gateways() {
      return this.pool.outputs;
    },
    // Routes ordered by gateway, then universe: wires cross as little as possible
    routes() {
      const gIndex = new Map(this.gateways.map((g, i) => [g.id, i]));
      const uIndex = new Map(this.universes.map((u, i) => [u.id, i]));
      return [...this.pool.routes].sort((a, b) => (
        (gIndex.get(a.gatewayId) ?? 0) - (gIndex.get(b.gatewayId) ?? 0)
        || (uIndex.get(a.universeId) ?? 0) - (uIndex.get(b.universeId) ?? 0)
        || a.id - b.id
      ));
    },
    columns() {
      return [
        {
          kind: 'universe',
          title: 'Universes',
          empty: 'No universe',
          items: this.universes.map((u) => {
            const count = this.pool.routes.filter((r) => r.universeId === u.id).length;
            return {
              id: u.id,
              name: u.name,
              color: u.color,
              more: count ? `${count} route${count > 1 ? 's' : ''}` : 'not sent',
            };
          }),
        },
        {
          kind: 'gateway',
          title: 'Gateways',
          empty: 'No gateway',
          deletable: true,
          add: {
            event: 'add-gateway',
            title: 'Adds a gateway on this computer (127.0.0.1, port 4515)',
          },
          items: this.gateways.map((g) => ({
            id: g.id,
            name: g.name,
            color: GATEWAY_COLORS[g.session.status],
            more: this.gatewayMore(g),
          })),
        },
        {
          kind: 'route',
          title: 'Destinations',
          empty: 'Not sent anywhere',
          deletable: true,
          add: {
            event: 'add-route',
            disabled: !this.gateways.length,
            title: this.addRouteTitle,
          },
          items: this.routes.map((r) => {
            const universe = this.universes.find((u) => u.id === r.universeId);
            let more = r.destinationLabel;
            if (!r.enabled) more = 'not forwarding';
            else if (this.pool.conflicts.has(r.id)) more = 'conflict';
            return {
              id: r.id,
              name: `${PROTOCOL_LABELS[r.protocol]} ${universeLabel(r.protocol, r.universeNumber)}`,
              color: universe?.color,
              more,
            };
          }),
        },
      ];
    },
    addRouteTitle() {
      if (!this.gateways.length) return 'Add a gateway first';
      const universe = this.markedName(this.universes, this.selection.universe);
      const gateway = this.markedName(this.gateways, this.selection.gateway);
      return `Adds a route: ${universe} through ${gateway}`;
    },
    height() {
      const rows = Math.max(this.universes.length, this.gateways.length, this.routes.length, 1);
      return OUTPUT_HEAD_HEIGHT + rows * OUTPUT_ROW_PITCH;
    },
    // The wires span the first two columns and the two gaps (the last column takes the rest)
    width() {
      return 2 * OUTPUT_COLUMN_WIDTH + 2 * OUTPUT_WIRE_GAP;
    },
    wires() {
      const centre = (i) => OUTPUT_HEAD_HEIGHT + i * OUTPUT_ROW_PITCH + OUTPUT_ROW_PITCH / 2;
      const curve = (x1, y1, x2, y2) => {
        const mid = (x2 - x1) / 2;
        return `M ${x1} ${y1} C ${x1 + mid} ${y1}, ${x2 - mid} ${y2}, ${x2} ${y2}`;
      };
      const uIndex = new Map(this.universes.map((u, i) => [u.id, i]));
      const gIndex = new Map(this.gateways.map((g, i) => [g.id, i]));
      const x1 = OUTPUT_COLUMN_WIDTH;
      const x2 = x1 + OUTPUT_WIRE_GAP;
      const x3 = x2 + OUTPUT_COLUMN_WIDTH;
      const x4 = x3 + OUTPUT_WIRE_GAP;
      const wires = [];
      this.routes.forEach((r, d) => {
        if (!uIndex.has(r.universeId) || !gIndex.has(r.gatewayId)) return;
        const universe = this.universes[uIndex.get(r.universeId)];
        const gateway = this.gateways[gIndex.get(r.gatewayId)];
        const yG = centre(gIndex.get(r.gatewayId));
        const state = routeState(r, gateway);
        const { color } = universe;
        wires.push({
          key: `${r.id}-in`, d: curve(x1, centre(uIndex.get(r.universeId)), x2, yG), state, color,
        });
        wires.push({
          key: `${r.id}-out`, d: curve(x3, yG, x4, centre(d)), state, color,
        });
      });
      return wires;
    },
  },
  methods: {
    /**
     * Name of a list's marked item, else of its first
     *
     * @param {Object[]} items
     * @param {?Number} id
     * @returns {String}
     */
    markedName(items, id) {
      return (items.find((item) => item.id === id) || items[0])?.name ?? '';
    },
    /**
     * A gateway row's value: its response time while connected, else its state
     *
     * @param {Object} gateway
     * @returns {String}
     */
    gatewayMore(gateway) {
      const { status, rtt } = gateway.session;
      if (status === GATEWAY_STATUS.CONNECTED) return rtt === null ? 'connected' : `${rtt} ms`;
      if (status === GATEWAY_STATUS.RECONNECTING) return 'retrying';
      if (status === GATEWAY_STATUS.CONNECTING) return 'connecting';
      return 'offline';
    },
  },
};
</script>

<style scoped>
.outputs_flow {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
.outputs_flow_inner {
  position: relative;
  display: flex;
  height: 100%;
  /* Wires run in the gaps between the lists */
  gap: var(--output-wire-gap);
}
.outputs_flow_wires {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
.outputs_flow_wire {
  fill: none;
  stroke-width: 1.5;
}
.outputs_flow_wire.off {
  stroke-dasharray: 3 3;
  opacity: 0.5;
}
.outputs_flow_wire.waiting {
  opacity: 0.4;
}
.outputs_flow_wire.lost {
  stroke: var(--accent-red);
}
.outputs_flow_column {
  display: flex;
  flex-direction: column;
  width: var(--output-column-width);
  flex-shrink: 0;
  border-right: var(--border-width) solid var(--primary-dark);
}
/* Destinations take the room left: protocol, universe number and address */
.outputs_flow_route {
  flex: 1;
  min-width: var(--output-column-width);
  border-right: none;
}
.outputs_flow_column + .outputs_flow_column {
  border-left: var(--border-width) solid var(--primary-dark);
}
.outputs_flow_head {
  display: flex;
  align-items: center;
  /* A widget header's height, part of the rows' pitch: the wires are drawn from it */
  height: var(--output-head-height);
  flex-shrink: 0;
  padding: 0 var(--space-4) 0 var(--space-5);
  border-bottom: var(--border-width) solid var(--primary-dark);
}
</style>
