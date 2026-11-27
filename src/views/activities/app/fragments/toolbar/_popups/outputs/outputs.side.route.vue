<template>
  <outputs-page
    icon="patch"
    :title="title"
    :text="summary"
  >
    <outputs-row label="Forwarding">
      <uk-checkbox
        :model-value="route.enabled"
        @update:model-value="set('enabled', $event)"
      />
    </outputs-row>
    <outputs-row label="Universe">
      <uk-select-input
        class="outputs_side_select"
        :model-value="universes.findIndex((u) => u.id === route.universeId)"
        :options="universes.map((u) => u.name)"
        @update:model-value="(i) => universes[i] && set('universeId', universes[i].id)"
      />
    </outputs-row>
    <outputs-row label="Gateway">
      <uk-select-input
        class="outputs_side_select"
        :model-value="gatewayIndex"
        :options="gateways.map((g) => g.name)"
        placeholder="No gateway"
        @update:model-value="(i) => gateways[i] && set('gatewayId', gateways[i].id)"
      />
    </outputs-row>
    <outputs-row label="Protocol">
      <uk-select-input
        class="outputs_side_select"
        :model-value="protocols.indexOf(route.protocol)"
        :options="protocols.map((p) => protocolLabels[p])"
        @update:model-value="(i) => set('protocol', protocols[i])"
      />
    </outputs-row>
    <outputs-row
      v-if="ifaces.length > 1"
      label="Interface"
    >
      <uk-select-input
        class="outputs_side_select"
        :model-value="ifaces.indexOf(route.iface)"
        :options="ifaces.map((i) => ifaceLabels[i])"
        @update:model-value="(i) => set('iface', ifaces[i])"
      />
    </outputs-row>

    <outputs-row section="Destination" />
    <template v-if="kind === 'net'">
      <outputs-row label="Address">
        <uk-txt-input
          class="outputs_side_select"
          :model-value="route.address.ip"
          placeholder="10.0.0.20"
          @update:model-value="setAddress('ip', String($event).trim())"
        />
      </outputs-row>
      <outputs-row label="Port">
        <uk-num-input
          class="outputs_side_num"
          :model-value="route.address.port"
          :min="1"
          :max="65535"
          :precision="0"
          @update:model-value="setAddress('port', $event)"
        />
      </outputs-row>
    </template>
    <template v-else-if="kind === 'serial'">
      <outputs-row label="Serial port">
        <uk-num-input
          class="outputs_side_num"
          :model-value="route.address.portIndex"
          :min="0"
          :max="255"
          :precision="0"
          @update:model-value="setAddress('portIndex', $event)"
        />
      </outputs-row>
      <outputs-row label="Baud rate">
        <uk-num-input
          class="outputs_side_wide_num"
          :model-value="route.params.baudRate"
          :min="1"
          :max="4000000"
          :precision="0"
          @update:model-value="setParam('baudRate', $event)"
        />
      </outputs-row>
    </template>
    <template v-else-if="kind === 'usb'">
      <outputs-row label="Vendor ID">
        <uk-num-input
          class="outputs_side_wide_num"
          :model-value="route.address.vendorId"
          :min="0"
          :max="65535"
          :precision="0"
          @update:model-value="setAddress('vendorId', $event)"
        />
      </outputs-row>
      <outputs-row label="Product ID">
        <uk-num-input
          class="outputs_side_wide_num"
          :model-value="route.address.productId"
          :min="0"
          :max="65535"
          :precision="0"
          @update:model-value="setAddress('productId', $event)"
        />
      </outputs-row>
    </template>
    <outputs-row
      v-else
      label="URL"
    >
      <uk-txt-input
        class="outputs_side_select"
        :model-value="route.address.url"
        placeholder="ws://host:port/path"
        @update:model-value="setAddress('url', String($event).trim())"
      />
    </outputs-row>
    <outputs-row
      v-if="isArtnet"
      label="Net · Subnet · Universe"
    >
      <uk-num-input
        v-for="part in ['net', 'subnet', 'universe']"
        :key="part"
        class="outputs_side_small_num"
        :model-value="portAddress[part]"
        :min="0"
        :max="part === 'net' ? 127 : 15"
        :precision="0"
        @update:model-value="setPortAddress(part, $event)"
      />
    </outputs-row>
    <outputs-row
      v-else
      label="Universe number"
    >
      <uk-num-input
        class="outputs_side_wide_num"
        :model-value="route.universeNumber"
        :min="range.min"
        :max="range.max"
        :precision="0"
        @update:model-value="set('universeNumber', $event)"
      />
    </outputs-row>

    <template v-if="isSacn || isUdp || kind === 'net'">
      <outputs-row section="Network" />
      <outputs-row
        v-if="isSacn"
        label="Priority"
      >
        <uk-num-input
          class="outputs_side_num"
          :model-value="route.params.priority"
          :min="0"
          :max="200"
          :precision="0"
          @update:model-value="setParam('priority', $event)"
        />
      </outputs-row>
      <outputs-row
        v-if="isUdp"
        label="TTL (0: the gateway's)"
      >
        <uk-num-input
          class="outputs_side_num"
          :model-value="route.params.ttl"
          :min="0"
          :max="255"
          :precision="0"
          @update:model-value="setParam('ttl', $event)"
        />
      </outputs-row>
      <outputs-row label="Network card (0: default)">
        <uk-num-input
          class="outputs_side_num"
          :model-value="route.params.ifaceIdx"
          :min="0"
          :max="255"
          :precision="0"
          @update:model-value="setParam('ifaceIdx', $event)"
        />
      </outputs-row>
    </template>

    <template v-if="notes.length">
      <outputs-row section="Notes" />
      <outputs-row
        v-for="note in notes"
        :key="note.text"
        :label="note.text"
        :error="note.error"
        :muted="!note.error"
      />
    </template>
  </outputs-page>
</template>

<script>
import { WscTransport } from '@asls/wsc-sdk';
import { BUNDLED_GATEWAY_FORWARDS } from '@/plugins/wsc.connection';
import {
  STREAM_PROTOCOLS, PROTOCOL_LABELS, IFACE_LABELS, addressKind, protocolInterfaces,
  universeRange, universeLabel, splitPortAddress, joinPortAddress,
} from '@/models/DMX/route.model';
import OutputsPage from './outputs.page.vue';
import OutputsRow from './outputs.row.vue';

const { Protocol, Iface } = WscTransport;

/**
 * @component The Outputs side page of a route: what it sends and through which gateway, its
 * protocol, where it goes and the protocol's settings.
 */
export default {
  name: 'OutputsSideRoute',
  compatConfig: {
    MODE: 3,
  },
  components: {
    OutputsPage,
    OutputsRow,
  },
  props: {
    /**
     * The route (DmxRoute)
     */
    route: { type: Object, required: true },
  },
  data() {
    return {
      protocols: STREAM_PROTOCOLS,
      protocolLabels: PROTOCOL_LABELS,
      ifaceLabels: IFACE_LABELS,
    };
  },
  computed: {
    universes() {
      return this.$show.universePool.universes;
    },
    gateways() {
      return this.$show.outputPool.outputs;
    },
    gatewayIndex() {
      const index = this.gateways.findIndex((g) => g.id === this.route.gatewayId);
      return index < 0 ? null : index;
    },
    title() {
      return `${PROTOCOL_LABELS[this.route.protocol]} `
        + `${universeLabel(this.route.protocol, this.route.universeNumber)}`;
    },
    summary() {
      const universe = this.universes.find((u) => u.id === this.route.universeId);
      const gateway = this.gateways[this.gatewayIndex];
      const sends = `${universe?.name ?? 'A universe'} through ${gateway?.name ?? 'no gateway'} `
        + `to ${this.route.destinationLabel}`;
      return this.route.enabled
        ? `Forwards ${sends}.`
        : `Not forwarding. Would forward ${sends}.`;
    },
    ifaces() {
      return protocolInterfaces(this.route.protocol);
    },
    kind() {
      return addressKind(this.route.iface);
    },
    isArtnet() {
      return this.route.protocol === Protocol.ARTNET;
    },
    isSacn() {
      return this.route.protocol === Protocol.SACN;
    },
    isUdp() {
      return this.route.iface === Iface.UDP;
    },
    portAddress() {
      return splitPortAddress(this.route.universeNumber);
    },
    range() {
      return universeRange(this.route.protocol);
    },
    notes() {
      const notes = [];
      if (this.route.invalid) notes.push({ text: `Not sent: ${this.route.invalid}.`, error: true });
      if (this.$show.outputPool.conflicts.has(this.route.id)) {
        notes.push({
          text: 'Another route sends the same universe number to this destination.',
          error: true,
        });
      }
      if (!BUNDLED_GATEWAY_FORWARDS.includes(this.route.protocol)) {
        notes.push({
          text: `The gateway that comes with Studio doesn't send ${PROTOCOL_LABELS[this.route.protocol]} yet. Use Art-Net, or a gateway that does.`,
        });
      }
      if (this.isArtnet) {
        notes.push({ text: 'Set your node to the same Net, Subnet and Universe.' });
      }
      return notes;
    },
  },
  methods: {
    /**
     * Sets one route setting and re-checks the saved state
     *
     * @param {String} key
     * @param {*} value
     */
    set(key, value) {
      if (value === undefined || this.route[key] === value) return;
      this.route[key] = value;
      this.$show.refreshSaveState();
    },
    setAddress(key, value) {
      if (this.route.address[key] === value) return;
      this.set('address', { [key]: value });
    },
    setParam(key, value) {
      if (this.route.params[key] === Number(value)) return;
      this.set('params', { [key]: Number(value) });
    },
    setPortAddress(part, value) {
      const next = { ...this.portAddress, [part]: Number(value) };
      this.set('universeNumber', joinPortAddress(next.net, next.subnet, next.universe));
    },
  },
};
</script>

<style scoped>
.outputs_side_select {
  width: 160px;
}
.outputs_side_num {
  width: 64px;
}
.outputs_side_wide_num {
  width: 96px;
}
.outputs_side_small_num {
  width: 52px;
}
</style>
