<template>
  <div />
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';

export default {
  name: 'UkPopupSaveas',
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
      headerData: { title: 'Export Project' },
    };
  },
  watch: {
    modelValue(state) {
      this.state = state;
      if (state) {
        this.displaySaveasPopup();
      }
    },
  },
  methods: {
    /**
     * Generate showfile and display native download popup
     *
       * @public
     */
    displaySaveasPopup() {
      try {
        const el = document.createElement('a');
        el.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(this.$show.genShowFile())}`);
        el.setAttribute('download', `${this.$show.name || 'asls_showfile'}.json` || 'showfile.json');
        el.style.display = 'none';
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
      } catch (err) {
        console.log(err);
      } finally {
        this.state = false;
        this.update();
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
