<template>
  <uk-popup
    v-model="state"
    :movable="true"
    :header="headerData"
    no-validation
    backdrop
    @submit="
      updateOutputs();
      close();
    "
    @input="update()"
  >
    <div class="body">
      <uk-flex
        class="list_wrapper"
        col
      >
        <uk-list
          :items="outputs"
          accordion
          colored
          auto-select-first
          :auto-select="selectedOutputIndex"
          filterable
          class="list"
          @select="selectOutput"
        />
        <uk-flex
          style="
            align-items: flex-end;
            border-top:1px solid var(--primary-dark)
          "
          gap="8"
        >
          <uk-button
            label="add new connection"
            icon="new"
            square
            style="width:100%;height:28px"
            @click="addNewConnection"
          />
        </uk-flex>
      </uk-flex>
      <uk-flex
        v-show="!!selectedOutput"
        col
        class="form"
      >
        <uk-flex
          col
          gap="8"
          style="padding: 10px;height:100%"
        >
          <uk-flex
            col
            gap="10"
          >
            <uk-txt-input
              v-model="formOutput.name"
              label="Label"
              style="width: 100%;"
              :disabled="!selectedOutput"
            />
            <uk-select-input
              :options="['WSC (Web Show Control)']"
              label="Type / Protocol"
              :disabled="!selectedOutput"
            />
          </uk-flex>
          <uk-flex
            row
            gap="8"
          >
            <uk-flex
              col
            >
              <uk-flex
                row
                gap="0"
                style="align-items: flex-end"
              >
                <uk-num-input
                  v-model="formOutput.ip[0]"
                  label="IP"
                  :min="0"
                  :max="255"
                  style="max-width:48px"
                  :disabled="!selectedOutput"
                />
                <uk-num-input
                  v-model="formOutput.ip[1]"
                  :min="0"
                  :max="255"
                  style="max-width:48px"
                  :disabled="!selectedOutput"
                />
                <uk-num-input
                  v-model="formOutput.ip[2]"
                  :min="0"
                  :max="255"
                  style="max-width:48px"
                  :disabled="!selectedOutput"
                />
                <uk-num-input
                  v-model="formOutput.ip[3]"
                  :min="0"
                  :max="255"
                  style="max-width:48px"
                  :disabled="!selectedOutput"
                />
              </uk-flex>
            </uk-flex>
            <uk-num-input
              v-model="formOutput.port"
              label="Port"
              style="max-width:64px"
              :disabled="!selectedOutput"
            />
          </uk-flex>
          <p
            ref="debugger"
            class="debugger"
            v-html="debug"
          />
        </uk-flex>
        <uk-flex
          style="
            align-items: flex-end;
            /* padding:10px; */
            border-top:1px solid var(--primary-dark)
          "
          gap="1"
        >
          <uk-button
            square
            label="delete"
            style="width:100%;height:28px"
            :disabled="!selectedOutput"
            color="red"
            @click="deleteOutput"
          />
          <uk-button
            square
            icon="patch"
            :label="
              selectedOutput?.client?.state > 1
                ? 'disconnect'
                : 'connect'
            "
            color="var(--accent-blue)"
            style="width:100%;height:28px"
            :disabled="!selectedOutput"
            @click="connect"
          />
        </uk-flex>
      </uk-flex>
    </div>
  </uk-popup>
</template>

<script>

import PopupMixin from '@/views/mixins/popup.mixin';

export default {
  name: 'UkPopupConnections',
  mixins: [PopupMixin],
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    value: Boolean,
  },
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: {
        title: 'Input/Outputs',
      },
      formOutput: {
        ip: [0, 0, 0, 0],
        port: 0,
        name: '',
        universe: 0,
      },
      selectedOutput: null,
      selectedOutputIndex: 0,
    };
  },
  computed: {
    debug() {
      return this.selectedOutput?.client?.debug.map((log) => (
        `<span style="alignt-items: start;color: ${[
          'var(--accent-maroon)',
          'var(--secondary-lighter)',
          'var(--accent-sea-green)'][log.type + 1]
        }">
            <span style="color: var(--secondary-lighter); opacity:.8">
              [${log.timestamp}] - 
            </span>
              ${log.data}
            <span style="color: var(--accent-gold); display: ${log.context ? 'initial' : 'none'}">
              ${log.context}
            </span>
          </span>`
      )).join('\n')
      || '<p style="color: var(--secondary-lighter); opacity: .8">Waiting for connection...</p>';
    },
    outputs() {
      return this.$show.outputPool.outputs.map((o) => ({
        name: o.name,
        id: o.id,
        icon: 'patch',
        more: [
          'Conn error',
          'Disconnected',
          'Connecting...',
          'Connected',
        ][(o?.client?.state || 0) + 1],
      }));
    },
  },
  watch: {
    state(state) {
      if (state) {
        this.selectedOutput = null;
        this.formOutput = {
          active: false,
          ip: [0, 0, 0, 0],
          port: 0,
          name: '',
          universe: 0,
        };
      }
    },
    'selectedOutput.client.debug.length': function watchDebugOuptutLength() {
      this.$nextTick(() => {
        const debuggerEl = this.$refs.debugger;
        if (debuggerEl) {
          debuggerEl.scrollTop = debuggerEl.scrollHeight;
        }
      });
    },
  },
  methods: {
    selectOutput(output) {
      if (output) {
        this.selectedOutput = this.$show.outputPool.getFromId(output.id);
        this.selectedOutputIndex = this.outputs.findIndex((o) => o.id === this.selectedOutput.id);
        this.formOutput = {
          ip: this.selectedOutput.remote.split('.'),
          port: this.selectedOutput?.port,
          name: this.selectedOutput?.name,
        };
      } else {
        this.selectedOutput = null;
        this.selectedOutputIndex = 0;
      }
    },
    addNewConnection() {
      const output = this.$show.outputPool.addRaw({
        name: `New Connection ${this.outputs.length + 1}`,
        remote: '127.0.0.1',
        port: '4515',
      });
      this.selectOutput({ id: output.id });
    },
    connect() {
      this.selectedOutput.remote = this.formOutput.ip.join('.');
      this.selectedOutput.port = this.formOutput.port;
      this.selectedOutput.name = this.formOutput.name;
      this.selectedOutput.connect();
    },
    deleteOutput() {
      if (this.selectedOutput) {
        this.$show.outputPool.delete(this.selectedOutput);
        this.formOutput = {
          ip: [0, 0, 0, 0],
          port: 0,
          name: '',
        };
        this.selectOutput(this.outputs[0]);
      }
    },
  },
};
</script>

<style>
.spinner{
  height: 10px;
  width: 10px;
  border-radius: 100%;
  border: 2px solid var(--accent-sea-green)
}
</style>

<style scoped>
.body {
  display: flex;
  min-height: 350px;
  max-height: 350px;
  height: 350px;
  padding: 0px !important;
}
.list{
  min-width:270px;
  max-width: 270px;
  overflow-y: auto;
}
.list_wrapper{
  height: 100%;
}
.form{
  border-left: 1px solid var(--primary-dark);
  width: 370px;
}
.stats{
  height: 100%;
  width: 100%;
  flex: 1;
  background-color: var(--primary-dark-alt);
  background-image:
    linear-gradient(
      to right,
      var(--primary-dark) 0,
      var(--primary-dark) 1px,
      transparent 1px,
      transparent 100%
    ),
    linear-gradient(
      to bottom,
      var(--primary-dark) 0,
      var(--primary-dark) 1px,
      transparent 1px,
      transparent 100%
    );
  background-size: calc(100% / 20) calc(100% / 12);
  /* background-position: 0px -1px; */
  /* border: 1px solid var(--primary-dark) */
}
.debugger{
  flex: 1;
  background: var(--primary-dark);
  overflow-y: auto;
  flex-direction: column;
  align-items: start;
  padding: 5px;
  max-height: 122px;
}
</style>
