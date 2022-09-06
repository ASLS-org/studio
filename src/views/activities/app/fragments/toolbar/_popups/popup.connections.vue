<template>
  <uk-popup @input="update()" v-model="state" :header="headerData">
    <div style="display: flex; flex-direction: column; padding: 16px; min-width: 340px">
      <div style="display: flex">
        <uk-txt-input style="flex: 1; margin-right: 16px" label="DMX2WS Server IP" v-model="artnet.ip" />
        <uk-num-input class="field" label="Port" v-model="artnet.port" />
      </div>
    </div>
  </uk-popup>
</template>

<script>
// import icons from "../icons/uikit.icons";

export default {
  name: "ukPopupConnections",
  props: {
    value: Boolean,
  },
  data() {
    return {
      headerData: { title: "Conection settings" },
      state: this.value,
      artnet: {
        ip: this.$show.artnetServerUrl,
        port: 5214,
      },
    };
  },
  methods: {
    update() {
      this.$emit("input", this.state);
    },
    close() {
      this.state = false;
      this.update();
    },
    selectFixtures(fixtures) {
      this.selectedFixtures = fixtures;
    },
  },
  computed: {
    fixtureChoices() {
      return (
        this.fxt.map((fixture) => {
          return {
            name: fixture.name,
            callback: () => {},
            selected: false,
          };
        }) || [{ name: "test" }]
      );
    },
  },
  watch: {
    value(state) {
      this.state = state;
    },
    fixtures(fixtures) {
      console.log(fixtures);
    },
  },
};
</script>

<style scoped>

.function_popup {
  display: flex;
  flex-direction: row !important;
  height: 100%;
}
.fixture_list {
  height: 100;
  width: 300px;
  border-right: 1px solid var(--primary-dark);
}
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  margin-right: 8px;
  width: 55px;
}
.field_label {
  margin-bottom: 8px;
}
.function_button {
  margin-top: 8px;
  margin-left: 8px;
}
</style>
