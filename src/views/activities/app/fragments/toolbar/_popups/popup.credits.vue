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
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="creditsTXT" />
    </div>
  </uk-popup>
</template>

<script>
import Credits from '@root/CREDITS.html?raw';
import PopupMixin from '@/views/mixins/popup.mixin';

export default {
  name: 'PopupCredits',
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
        title: 'Credits',
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
:deep(h1) {
  font-family: Roboto-Regular;
  font-size: 24px;
  color: var(--secondary-lighter);
}

:deep(h2) {
  font-family: Roboto-Regular;
  font-size: 16px;
  color: var(--secondary-lighter);
}

:deep(h3) {
  font-family: Roboto-Bold;
  text-transform: uppercase;
  font-size: 12px;
  color: var(--secondary-lighter);
  margin: 0;
  padding: 0;
  font-weight: normal;
}

:deep(h4) {
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

:deep(p) {
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
:deep(a){
  font-family: Roboto-Medium;
  font-size: 12px;
  color: var(--accent-blue)
}
</style>
