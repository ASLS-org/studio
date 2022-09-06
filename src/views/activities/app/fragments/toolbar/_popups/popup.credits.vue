<template>
  <uk-popup @submit="close" :movable="false" backdrop :cancelable="false" @input="update()" v-model="state" :header="headerData">
    <div class="body">
      <div v-html="creditsTXT"/>
    </div>
  </uk-popup>
</template>

<script>
import Credits from "raw-loader!/CREDITS.html";
import PopupMixin from "@/views/mixins/popup.mixin.js"

export default {
  name: "popupCredits",
  mixins: [PopupMixin],
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: {
        title: "Credits",
      },
      /**
       * Raw HTLM credits text (loaded from project's root)
       */
      creditsTXT: Credits,
    };
  },
};
</script>
<style>
</style>
<style scoped>

.body {
  padding: 10px;
  overflow: scroll;
  overflow-x: hidden;
  height: 400px;
  max-width:500px;
  width: auto;
  display: block;
}
::v-deep h1 {
  font-family: Roboto-Regular;
  font-size: 24px;
  color: var(--secondary-lighter);
}

::v-deep h2 {
  font-family: Roboto-Regular;
  font-size: 16px;
  color: var(--secondary-lighter);
}

::v-deep h3 {
  font-family: Roboto-Bold;
  text-transform: uppercase;
  font-size: 12px;
  color: var(--secondary-lighter);
  margin: 0;
  padding: 0;
  font-weight: normal;
}

::v-deep h4 {
  font-family: Roboto-Bold;
  font-size: 12px;
  color: var(--secondary-lighter);
  margin: 0;
  padding: 0;
  font-weight: normal;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

::v-deep p {
  font-family: Roboto-Medium;
  font-style: normal;
  font-weight: normal;
  font-stretch: normal;
  -webkit-font-smoothing: antialiased;
  line-height: 16px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--secondary-lighter);
  margin: 0;
}
::v-deep a{
  font-family: Roboto-Medium;
  font-size: 12px;
  color: var(--accent-blue)
}
</style>
