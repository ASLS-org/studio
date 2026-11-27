<template>
  <outputs-page
    icon="connection"
    :title="gateway.name"
    :text="summary"
  >
    <outputs-row label="Name">
      <uk-txt-input
        class="outputs_side_field"
        :model-value="gateway.name"
        @update:model-value="setField('name', String($event).trim() || gateway.name)"
      />
    </outputs-row>
    <outputs-row label="Host">
      <uk-txt-input
        class="outputs_side_field"
        :model-value="gateway.remote"
        placeholder="127.0.0.1"
        @update:model-value="setAddress('remote', $event)"
      />
    </outputs-row>
    <outputs-row label="Port">
      <uk-num-input
        class="outputs_side_num"
        :model-value="gateway.port"
        :min="1"
        :max="65535"
        :precision="0"
        @update:model-value="setAddress('port', $event)"
      />
    </outputs-row>
    <outputs-row label="Connect on load">
      <uk-checkbox
        :model-value="gateway.autoConnect"
        @update:model-value="setField('autoConnect', $event)"
      />
    </outputs-row>
    <outputs-row label="Session">
      <uk-button
        class="outputs_side_field"
        :label="isOpen ? 'disconnect' : 'connect'"
        :color="isOpen ? 'var(--accent-red)' : 'var(--accent-green)'"
        filled
        square
        @click="isOpen ? gateway.disconnect() : gateway.connect()"
      />
    </outputs-row>

    <template v-if="system.length">
      <outputs-row section="Gateway computer" />
      <outputs-row
        v-for="line in system"
        :key="line.label"
        :label="line.label"
      >
        <p>{{ line.value }}</p>
      </outputs-row>
    </template>

    <outputs-row
      section="Log"
      flush
    />
    <!-- A log reads as one: a dark console filling the rest of the page, kept on the newest -->
    <div
      ref="log"
      class="outputs_log"
    >
      <p
        v-if="!activity.length"
        class="outputs_log_empty"
      >
        Nothing logged yet
      </p>
      <div
        v-for="entry in activity"
        :key="entry.id"
        class="outputs_log_line"
        :class="entry.type"
      >
        <span class="outputs_log_time">{{ entry.time }}</span>
        <span class="outputs_log_text">{{ entry.text }}</span>
      </div>
    </div>
  </outputs-page>
</template>

<script>
import { GATEWAY_STATUS } from '@/plugins/wsc.connection';
import OutputsPage from './outputs.page.vue';
import OutputsRow from './outputs.row.vue';

/** Log lines kept in view (the gateway keeps 100) */
const LOG_SHOWN = 50;

/**
 * Seconds as "2 h 05 min", "4 min 10 s"
 *
 * @param {Number} seconds
 * @returns {String}
 */
function duration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const pad = (n) => String(n).padStart(2, '0');
  if (s >= 3600) return `${Math.floor(s / 3600)} h ${pad(Math.floor((s % 3600) / 60))} min`;
  if (s >= 60) return `${Math.floor(s / 60)} min ${pad(s % 60)} s`;
  return `${s} s`;
}

/**
 * @component The Outputs side page of a gateway: where it runs, Connect on load, its session, the
 * computer it runs on, and what happened.
 */
export default {
  name: 'OutputsSideGateway',
  compatConfig: {
    MODE: 3,
  },
  components: {
    OutputsPage,
    OutputsRow,
  },
  props: {
    /**
     * The gateway (WscGateway)
     */
    gateway: { type: Object, required: true },
  },
  computed: {
    session() {
      return this.gateway.session;
    },
    isOpen() {
      return this.session.status !== GATEWAY_STATUS.IDLE;
    },
    summary() {
      const { status, attempt, rtt } = this.session;
      const at = `${this.gateway.remote}:${this.gateway.port}`;
      switch (status) {
        case GATEWAY_STATUS.CONNECTED:
          return rtt === null ? `Connected to ${at}.` : `Connected to ${at}, answering in ${rtt} ms.`;
        case GATEWAY_STATUS.CONNECTING: return `Connecting to ${at}…`;
        case GATEWAY_STATUS.RECONNECTING: return `Trying to reach ${at} again (attempt ${attempt}).`;
        default: return `Not connected. It runs at ${at}.`;
      }
    },
    system() {
      const info = this.session.system;
      if (!info || this.session.status !== GATEWAY_STATUS.CONNECTED) return [];
      const sys = info.system || {};
      return [
        { label: 'Name', value: sys.hostname },
        { label: 'System', value: [sys.platform, sys.arch].filter(Boolean).join(' ') },
        { label: 'Running for', value: info.uptime !== undefined ? duration(info.uptime) : '' },
        { label: 'CPU load', value: sys.cpuLoad !== undefined ? `${Math.round(sys.cpuLoad)} %` : '' },
      ].filter((line) => line.value);
    },
    activity() {
      return this.session.log.slice(-LOG_SHOWN);
    },
  },
  watch: {
    // Showing the activity is how the operator sees an error: it clears the gateway's mark
    gateway: {
      immediate: true,
      handler(gateway) {
        gateway.acknowledgeErrors();
      },
    },
    'session.errored': function clearSeenError(errored) {
      if (errored) this.gateway.acknowledgeErrors();
    },
    'session.log.length': {
      immediate: true,
      handler() {
        this.$nextTick(() => {
          const { log } = this.$refs;
          if (log) log.scrollTop = log.scrollHeight;
        });
      },
    },
  },
  methods: {
    /**
     * Sets a saved field and re-checks the saved state
     *
     * @param {String} key
     * @param {*} value
     */
    setField(key, value) {
      if (this.gateway[key] === value) return;
      this.gateway[key] = value;
      this.$show.refreshSaveState();
    },
    /**
     * Sets the host or port; an open session reopens at the new address
     *
     * @param {String} key 'remote' or 'port'
     * @param {*} value
     */
    setAddress(key, value) {
      const next = key === 'port' ? Number(value) : String(value).trim();
      if (!next || this.gateway[key] === next) return;
      this.setField(key, next);
      if (this.isOpen) this.gateway.connect();
    },
  },
};
</script>

<style scoped>
.outputs_side_field {
  width: 160px;
}
.outputs_side_num {
  width: 64px;
}
.outputs_log {
  flex: 1;
  min-height: calc(6 * var(--control-height));
  overflow-y: auto;
  padding: var(--space-3) 0;
  background: var(--primary-dark);
  border-top: var(--border-width) solid var(--primary-dark);
}
.outputs_log_empty {
  justify-content: center;
  height: 100%;
  color: var(--secondary-light);
}
.outputs_log_line {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  padding: var(--space-1) var(--space-5);
  font-family: Roboto-Regular;
  font-size: var(--font-xs);
  line-height: 1.5;
  color: var(--secondary-lighter);
}
.outputs_log_time {
  flex-shrink: 0;
  color: var(--secondary-light);
  font-variant-numeric: tabular-nums;
}
.outputs_log_line.success .outputs_log_text {
  color: var(--accent-green);
}
.outputs_log_line.error .outputs_log_text {
  color: var(--accent-red);
}
.outputs_log_text {
  min-width: 0;
  white-space: normal;
}
</style>
