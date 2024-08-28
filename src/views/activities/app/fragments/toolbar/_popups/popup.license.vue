<template>
  <uk-popup
    v-model="state"
    :movable="false"
    backdrop
    :cancelable="false"
    :header="headerData"
    @submit="close"
    @input="update()"
  >
    <div class="body">
      <p>{{ licenceTXT }}</p>
    </div>
  </uk-popup>
</template>

<script>
import License from '@root/COPYING?raw';
import PopupMixin from '@/views/mixins/popup.mixin';

export default {
  name: 'UkPopupLicense',
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
        title: 'License',
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
