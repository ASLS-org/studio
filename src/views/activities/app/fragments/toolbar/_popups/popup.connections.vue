<template>
  <uk-popup
    v-model="state"
    :movable="true"
    backdrop
    :header="headerData"
    @submit="
      updateOutputs();
      close();
    "
    @input="update()"
  >
    <div class="body">
      <uk-list
        toggleable
        :items="outputs"
        @toggle="selectIface"
      />
      <uk-button
        style="margin: 16px"
        square
        label="add input"
        @click="displayAddInputPopup"
      />
    </div>
  </uk-popup>
  <uk-popup
    v-model="addInputPopupState"
    :movable="false"
    backdrop
    :header="{
      title: 'Add connection'
    }"
    @submit="
      updateOutputs();
      close();
    "
    @input="update()"
  >
    <uk-flex
      gap="8"
      col
      style="padding: 10px;"
    >
      <uk-select-input
        :options="['WebDMX']"
        label="Type / Protocol"
      />
      <uk-flex
        row
        gap="8"
      >
        <uk-txt-input
          v-model="ip"
          label="IP Address"
        />
        <uk-num-input
          v-model="port"
          label="Port"
          style="max-width:64px"
        />
      </uk-flex>
    </uk-flex>
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
        title: 'Outputs',
      },
      addInputPopupState: false,
      ip: 'dslmdksqlkdsqmk',
      port: 0,
      outputs: [],
    };
  },
  mounted() {
    this.updateOutputs();
  },
  methods: {
    selectIface(outputs) {
      this.$show.setOutputs(
        outputs.map((o) => this.$show.outputs[o.id]),
      );
    },
    displayAddInputPopup() {
      this.displayAddInputPopup = true;
    },
    updateOutputs() {
      this.outputs = this.$show.outputs.map((output, i) => {
        const oDeepCpy = JSON.parse(JSON.stringify(output));
        return Object.assign(oDeepCpy, {
          id: i,
          name: `${output.name} - ${output.cidr.split('/')[0]}`,
          more: 'Artnet',
          active: this.$show.selectedOutputs.length
            ? this.$show.selectedOutputs.some((v) => v.name === output.name)
            : false,
        });
      });
    },
  },
};
</script>

<style scoped>
.body {
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 300px;
  padding: 0px !important;
}
.subtitle {
  font-family: Roboto-Regular;
  margin-bottom: 8px;
  color: var(--secondary-lighter-alt);
}
.title_icon {
  fill: var(--secondary-lighter);
}
h4 {
  margin-bottom: 4px;
}
</style>
