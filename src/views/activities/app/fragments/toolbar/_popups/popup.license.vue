<template>
  <uk-popup @submit="close" :movable="false" backdrop :cancelable="false" @input="update()" v-model="state" :header="headerData">
    <div class="body">
      <p>{{ licenceTXT }}</p>
    </div>
  </uk-popup>
</template>

<script>
import License from "raw-loader!/COPYING";
import PopupMixin from "@/views/mixins/popup.mixin.js"

export default {
  name: "ukPopupLicense",
  mixins: [PopupMixin],
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: {
        title: "License",
      },
      /**
       * Licence as raw text (loaded from project root)
       */
      licenceTXT: License,
    };
  },
};
</script>

<style scoped>

.body {
  white-space: pre;
  padding: 10px;
  overflow: scroll;
  overflow-x: hidden;
  height: 400px;
  width: auto;
}
</style>
