<template>
  <uk-widget
    class="universe_connection_settings_wrapper"
    :header="{ title: 'Stream', icon: 'connection' }"
    dockable
  >
    <template v-if="universe && universe.stream">
      <uk-flex
        :gap="8"
        col
        class="universe_connection_settings"
      >
        <uk-select-input
          :model-value="protocolIndex"
          label="Protocol"
          :options="protocolOptions"
          placeholder="No protocol selected"
          @update:model-value="setProtocol"
        />

        <uk-select-input
          v-if="ifaceOptions.length > 1"
          :model-value="ifaceIndex"
          label="Interface"
          :options="ifaceOptions"
          placeholder="No interface selected"
          @update:model-value="setIface"
        />

        <!-- Address: layout depends on iface -->
        <uk-flex
          v-if="addrKind === 'net'"
          gap="8"
        >
          <uk-txt-input
            :model-value="getAddr('ip')"
            label="Host"
            placeholder="0.0.0.0"
            @update:model-value="setAddr('ip', $event)"
          />
          <uk-num-input
            :model-value="getAddr('port')"
            label="Port"
            style="max-width: 60px;"
            @update:model-value="setAddr('port', $event)"
          />
        </uk-flex>

        <uk-flex
          v-else-if="addrKind === 'serial'"
          gap="8"
        >
          <uk-num-input
            :model-value="getAddr('portIndex')"
            label="Serial port"
            @update:model-value="setAddr('portIndex', $event)"
          />
          <uk-num-input
            :model-value="getParam('baudRate')"
            label="Baud"
            :max="500000"
            @update:model-value="setParam('baudRate', $event)"
          />
        </uk-flex>

        <uk-flex
          v-else-if="addrKind === 'usb'"
          gap="8"
        >
          <uk-num-input
            :model-value="getAddr('vendorId')"
            label="Vendor ID"
            @update:model-value="setAddr('vendorId', $event)"
          />
          <uk-num-input
            :model-value="getAddr('productId')"
            label="Product ID"
            @update:model-value="setAddr('productId', $event)"
          />
        </uk-flex>

        <uk-txt-input
          v-else-if="addrKind === 'url'"
          :model-value="getAddr('url')"
          label="URL"
          placeholder="ws://host:port/path"
          @update:model-value="setAddr('url', $event)"
        />

        <!-- Optional params -->
        <uk-flex
          v-if="visibleParams.length"
          gap="8"
        >
          <uk-num-input
            v-for="p in visibleParams"
            :key="p.key"
            :model-value="getParam(p.key)"
            :label="p.label"
            @update:model-value="setParam(p.key, $event)"
          />
        </uk-flex>

        <uk-button
          :model-value="!!universe.stream.state"
          :label="universe?.stream?.state ? 'Stop streaming':'Start streaming'"
          toggleable
          square
          style="height:25px; margin-top: 22px"
          color="var(--accent-blue)"
          :disabled="(
            !universe.stream?.connectionHandle?.client
            || !universe?.stream?.connectionHandle?.client?.state
          )"
          @click="handleStreamingState"
        />
      </uk-flex>
    </template>
    <h3
      v-else
      class="empty_text"
    >
      No Output Selected
    </h3>
  </uk-widget>
</template>

<script>
import { STREAM_STATE } from '@/plugins/wsc.connection';
import { WscTransport } from '@asls/wsc-sdk';

/* ------------------------------------------------------------------ *
 * Spec tables (WSC 05-transport-descriptor). Keys are enum NAMES,
 * resolved against WscTransport.* at runtime so names the SDK doesn't
 * expose are skipped instead of crashing.
 * ------------------------------------------------------------------ */

// Protocols a STREAM_CHANNELS message may target
const STREAMABLE = ['DMX512', 'ARTNET', 'SACN', 'KINET', 'MODBUS', 'OSC', 'RAW'];

// Protocol -> permitted interfaces (first entry = default iface)
const IFACE_COMPAT = Object.freeze({
  DMX512: ['SERIAL', 'USB'],
  ARTNET: ['UDP'],
  SACN: ['UDP'],
  KINET: ['UDP'],
  MODBUS: ['TCP', 'SERIAL', 'UDP'],
  OSC: ['UDP', 'TCP', 'WEBSOCKET'],
  RAW: ['UDP', 'TCP', 'SERIAL', 'USB', 'WEBSOCKET', 'HTTP'],
});

// Protocol -> default port / baud (spec defaults)
const PROTOCOL_DEFAULTS = Object.freeze({
  DMX512: { baudRate: 250000 },
  ARTNET: { port: 6454 },
  SACN: { port: 5568, priority: 100 },
  KINET: { port: 6038 },
  MODBUS: { port: 502, baudRate: 9600 },
  OSC: { port: 8000 },
  RAW: {},
});

// Iface -> which address editor to show
const ADDR_KIND = Object.freeze({
  UDP: 'net',
  TCP: 'net',
  SERIAL: 'serial',
  USB: 'usb',
  WEBSOCKET: 'url',
  HTTP: 'url',
});

// Optional params -> label + when they apply
const PARAM_DEFS = Object.freeze([
  { key: 'priority', label: 'Priority', when: (proto) => proto === 'SACN' },
  { key: 'ttl', label: 'TTL', when: (proto, iface) => iface === 'UDP' },
  { key: 'ifaceIdx', label: 'NIC', when: (proto, iface) => ['UDP', 'TCP'].includes(iface) },
]);

// Reverse lookup: numeric enum value -> name
const nameOf = (enumObj, value) => Object.keys(enumObj || {}).find((k) => enumObj[k] === value);

export default {
  name: 'UniverseModifierConnection',
  compatConfig: { MODE: 3 },
  props: {
    modelValue: { type: Object, default: null },
  },
  data() {
    return {
      header: { title: 'Connection Settings', icon: 'wrench' },
      universe: this.modelValue,
      WscTransport,
    };
  },
  computed: {
    /** Protocol names available in both the spec's STREAM_CHANNELS list and the SDK */
    protocolNames() {
      return STREAMABLE.filter((n) => n in (WscTransport.Protocol || {}));
    },
    protocolOptions() {
      return this.protocolNames;
    },
    protocolName() {
      return nameOf(WscTransport.Protocol, this.universe?.stream?.protocol);
    },
    protocolIndex() {
      return this.protocolNames.indexOf(this.protocolName);
    },

    ifaceNames() {
      return (IFACE_COMPAT[this.protocolName] || [])
        .filter((n) => n in (WscTransport.Iface || {}));
    },
    ifaceOptions() {
      return this.ifaceNames;
    },
    ifaceName() {
      return nameOf(WscTransport.Iface, this.universe?.stream?.iface);
    },
    ifaceIndex() {
      return this.ifaceNames.indexOf(this.ifaceName);
    },

    addrKind() {
      return ADDR_KIND[this.ifaceName] || null;
    },
    visibleParams() {
      return PARAM_DEFS.filter((p) => p.when(this.protocolName, this.ifaceName));
    },
  },
  watch: {
    modelValue(value) {
      this.universe = value;
    },
  },
  methods: {
    setProtocol(index) {
      const name = this.protocolNames[index];
      const { stream } = this.universe;
      const next = WscTransport.Protocol[name];
      if (name === undefined || next === stream.protocol) return;

      stream.protocol = next;

      // Keep the current iface if still valid, otherwise fall back to the protocol default
      const ifaces = IFACE_COMPAT[name] || [];
      if (!ifaces.includes(this.ifaceName)) {
        this.applyIface(ifaces.find((n) => n in WscTransport.Iface));
      }

      // Seed spec defaults (port, baud, priority)
      const defaults = PROTOCOL_DEFAULTS[name] || {};
      if (defaults.port !== undefined && this.addrKind === 'net') this.setAddr('port', defaults.port);
      if (defaults.baudRate !== undefined && this.addrKind === 'serial') this.setParam('baudRate', defaults.baudRate);
      if (defaults.priority !== undefined) this.setParam('priority', defaults.priority);
    },

    setIface(index) {
      this.applyIface(this.ifaceNames[index]);
    },
    applyIface(name) {
      if (!name) return;
      const next = WscTransport.Iface[name];
      if (next === this.universe.stream.iface) return;
      this.universe.stream.iface = next;

      // Re-seed defaults that depend on the new iface
      const defaults = PROTOCOL_DEFAULTS[this.protocolName] || {};
      if (ADDR_KIND[name] === 'net' && defaults.port !== undefined) this.setAddr('port', defaults.port);
      if (ADDR_KIND[name] === 'serial' && defaults.baudRate !== undefined) this.setParam('baudRate', defaults.baudRate);
    },

    /* Address / param accessors, minimal-delta writes like before */
    getAddr(key) {
      return this.universe?.stream?.address?.[key];
    },
    setAddr(key, value) {
      if (this.universe.stream.address?.[key] === value) return;
      this.universe.stream.address = { [key]: value };
    },
    getParam(key) {
      return this.universe?.stream?.params?.[key];
    },
    setParam(key, value) {
      if (this.universe.stream.params?.[key] === value) return;
      this.universe.stream.params = { [key]: value };
    },

    handleStreamingState() {
      if (this.universe?.stream) {
        if (this.universe?.stream?.state === STREAM_STATE.IDLE) {
          this.universe?.stream?.start();
        } else {
          this.universe?.stream?.stop();
        }
      }
    },
  },
};
</script>

<style scoped>
.universe_connection_settings_wrapper{
  min-width: 200px;
}
.universe_connection_settings {
  height: 100%;
  padding: 10px;
  min-width: 200px;
}
.empty_text {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  color: var(--secondary-light);
  justify-content: center;
}
</style>
