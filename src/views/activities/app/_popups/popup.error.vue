<template>
  <uk-popup @submit="close()" backdrop :movable="false" :cancelable="false" @input="update()" v-model="state" :header="headerData">
    <div class="error_body">
      <h4 class="error_message">{{ error.name || 'Unknow Error' }}:</h4>
      <h4 class="error_message">{{error.message}}</h4>
    </div>
  </uk-popup>
</template>

<script>
import PopupMixin from "@/views/mixins/popup.mixin.js"

export default {
  name: "popupError",
  mixins: [PopupMixin],
  props: {
    /**
     * Popup error definition
     */
    error: [Error, Object],
  },
  data() {
    return {
      /**
       * Popup header definition
       */
      headerData: { title: "An Error Has Occured" },
    };
  }
};
</script>

<style scoped>

.error_body {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 16px;
}
.error_message {
  color: #ce3d3db3;
}
.error_buttons {
  display: flex;
  padding: 8px;
  border-top: 1px solid var(--primary-dark);
}
</style>
