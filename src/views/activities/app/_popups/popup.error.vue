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
    <uk-flex
      col
      class="error_body"
      gap="12"
    >
      <h4>
        {{ error.name || 'Unknow Error' }}:
      </h4>
      <p class="error_message">
        {{ error.message }}
      </p>
    </uk-flex>
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
  width: 100%;
  padding: 16px;
}
.error_message {
  color: var(--accent-red);
}
.error_buttons {
  display: flex;
  padding: 8px;
  border-top: 1px solid var(--primary-dark);
}
</style>
