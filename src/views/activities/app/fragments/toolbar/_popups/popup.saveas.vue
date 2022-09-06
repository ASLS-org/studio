<template>
  <uk-popup @submit="submit()" backdrop :movable="false" @input="update()" v-model="state" :header="headerData"/>
</template>

<script>
import PopupMixin from "@/views/mixins/popup.mixin.js"

export default {
  name: "ukPopupSaveas",
  mixins: [PopupMixin],
  props: {
    error: [Error, Object],
  },
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: { title: "Export Project" },
    };
  },
  methods: {
    /**
     * Generate showfile and display native download popup
     * 
       * @public
     */
    displaySaveasPopup() {
      try {
        var el = document.createElement("a");
        el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(this.$show.genShowFile()));
        el.setAttribute("download", `${this.$show.name || "asls_showfile"}.json` || "showfile.json");
        el.style.display = "none";
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
      } catch (err) {
        console.log(err);
      }finally{
        this.state = false;
        this.update();
      }
    },
  },
  watch: {
    value(state) {
      this.state = state;
      if(state){
        this.displaySaveasPopup();
      }
    },
  },
};
</script>

<style scoped>
.body {
  display: flex;
  flex-direction: column;
  width: 300px;
  padding: 16px;
}
</style>
