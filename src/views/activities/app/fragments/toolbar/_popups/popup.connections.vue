<template>
  <uk-popup
    @submit="
      updateOutputs();
      close();
    "
    :movable="true"
    backdrop
    @input="update()"
    v-model="state"
    :header="headerData"
  >
    <div class="body">
      <uk-list toggleable @toggle="selectIface" :items="outputs" />
      <uk-button style="margin: 16px" :square="true" label="refresh" @click.native="updateOutputs" />
    </div>
  </uk-popup>
</template>

<script>

import PopupMixin from "@/views/mixins/popup.mixin.js";

export default {
  name: "ukPopupConnections",
  mixins: [PopupMixin],
  props: {
    value: Boolean,
  },
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: {
        title: "Outputs",
      },
      outputs: [],
      state: this.value,
    };
  },
  methods: {
    update() {
      this.$emit("input", this.state);
      if(this.state){
        this.updateOutputs()
      }
    },
    // close() {
    //   this.state = false;
    // },
    selectIface(outputs) {
      this.$show.setOutputs(
        outputs.map((o) => {
          return this.$show.outputs[o.id];
        })
      );
    },
    updateOutputs() {
      this.outputs = this.$show.outputs.map((output, i) => {
        let oDeepCpy = JSON.parse(JSON.stringify(output));
        return Object.assign(oDeepCpy, {
          id: i,
          name: `${output.name} - ${output.cidr.split("/")[0]}`,
          more: "Artnet",
          active: this.$show.selectedOutputs.length ? this.$show.selectedOutputs.some((v) => v.name === output.name) : false,
        });
      });
    },
  },
  mounted() {
    this.updateOutputs();
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
