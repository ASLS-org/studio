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
          v-model="protocol"
          label="Protocol"
          :options="protocolOptions"
        />
        <!-- TODO: find a way to implement a better condition matrix -->
        <!-- <template v-if="universe?.stream?.transport?.iface === WscTransport.Iface.UDP"> -->
        <uk-flex gap="8">
          <uk-txt-input
            v-model="ip"
            label="Host"
          />
          <uk-num-input
            v-model="port"
            label="Port"
            style="max-width: 60px;"
          />
        </uk-flex>

        <!-- </template> -->
        <uk-button
          :model-value="!!universe.stream.state"
          :label="universe?.stream?.state ? 'Stop streaming':'Start streaming'"
          toggleable
          square
          style="height:25px; margin-top: 22px"
          color="var(--accent-blue)"
          :disabled="!universe.stream?.connectionHandle?.client"
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

const lightingProtocolOptions = Object.freeze({
  ArtNet: WscTransport.Protocol.ARTNET,
  // sACN: WscTransport.Protocol.SACN,
  // Raw: WscTransport.Protocol.RAW,
});

export default {
  name: 'UniverseModifierConnection',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    modelValue: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      header: {
        title: 'Connection Settings',
        icon: 'wrench',
      },
      universe: this.modelValue,
      WscTransport,
    };
  },
  computed: {
    /**
     * Returns an array of HTML-formated strings s to be fed into uikit select inputs
     *
     * @returns {Array<String>} An array of HTML-formated strings
     */
    protocolOptions() {
      return Object.keys(lightingProtocolOptions);
    },
    protocol: {
      get() {
        const values = Object.values(lightingProtocolOptions);
        return values.indexOf(this.universe?.stream?.protocol);
      },
      set(index) {
        const values = Object.values(lightingProtocolOptions);
        const next = values[index];

        if (next === this.universe.stream.protocol) return;

        this.universe.stream.protocol = next;
      },
    },
    ip: {
      get() {
        return this.universe?.stream?.address?.ip;
      },
      set(ip) {
        if (this.universe.stream.address?.ip === ip) return;

        this.universe.stream.address = { ip }; // ✅ minimal delta
      },
    },
    port: {
      get() {
        return this.universe?.stream?.address?.port;
      },
      set(port) {
        if (this.universe.stream.address?.port === port) return;

        this.universe.stream.address = { port }; // ✅ minimal delta
      },
    },
  },
  watch: {
    modelValue(value) {
      this.universe = value;
    },
  },
  methods: {
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
    background: var(--primary-light) repeating-linear-gradient(
    45deg,
    #1619130a,
    #1619130a 10px,
    #0c0e0a38 10px,
    #0c0e0a38 20px
  );
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
