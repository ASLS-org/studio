<template>
  <uk-popup
    v-model="state"
    backdrop
    :movable="false"
    :cancelable="false"
    :header="headerData"
    @submit="close()"
    @input="update()"
  >
    <div class="error_body">
      <h4 class="error_message">
        {{ error.name || 'Unknow Error' }}:
      </h4>
      <h4 class="error_message">
        {{ error.message }}
      </h4>
    </div>
  </uk-popup>
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';

export default {
  name: 'PopupError',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [PopupMixin],
  props: {
    /**
     * Popup error definition
     */
    error: {
      type: [Error, Object],
      default: new Error('Unhandled error'),
    },
  },
  data() {
    return {
      /**
       * Popup header definition
       */
      headerData: { title: 'An Error Has Occured' },
    };
  },
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
