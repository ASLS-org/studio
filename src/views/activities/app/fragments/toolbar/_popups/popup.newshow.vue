<template>
  <uk-popup
    v-model="state"
    :validate-txt="isSaved ? 'create' : 'yes'"
    :cancel-txt="isSaved ? 'cancel' : 'no'"
    :on-cancel="handleCancel"
    :valid="!isSaved || name != ''"
    backdrop
    :movable="false"
    :header="headerData"
    @submit="submit()"
    @input="update()"
  >
    <div class="body">
      <Transition name="slide">
        <span
          v-if="!isSaved"
          :key="0"
        >
          <!-- eslint-disable-next-line max-len -->
          <p>Modifications applied to the current project will be lost. Do you wish to export a copy of the current project's showfile ?</p>
        </span>
        <span
          v-else
          :key="1"
        >
          <uk-txt-input
            v-model="name"
            label="Project Name"
            placeholder="project name"
          />
        </span>
      </Transition>
    </div>
    <saveas-popup v-model="saveasPopupDisplayState" />
  </uk-popup>
</template>
<script>
import PopupMixin from '@/views/mixins/popup.mixin';
import SaveasPopup from './popup.saveas.vue';

export default {
  name: 'UkPopupNewshow',
  components: {
    SaveasPopup,
  },
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [PopupMixin],
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: { title: 'Save Project' },
      /**
       * New project name
       */
      name: '',
      /**
       * Show exported/saved flag.
       * Used to transition between save/export and create states
       */
      isSaved: false,
      /**
       * Save as popup display state
       */
      saveasPopupDisplayState: false,
    };
  },
  watch: {
    modelValue(state) {
      this.state = state;
      this.isSaved = false;
      this.name = '';
      this.saveasPopupDisplayState = false;
    },
  },
  methods: {
    /**
     * Submit new project creation
     *
       * @public
     */
    submit() {
      if (!this.isSaved) {
        this.saveasPopupDisplayState = true;
        this.isSaved = true;
        this.headerData = { title: 'New Project' };
      } else {
        this.$show.setupNewProject(this.name);
        this.$router.push('/').then(() => {
          this.state = false;
          this.isSaved = false;
          this.name = '';
          this.update();
          this.$router.push('/universe/0');
        });
      }
    },
    /**
     * Handle cancellation. for both first and second phase
     * (save actual project or create new project)
     *
       * @public
     */
    handleCancel() {
      if (!this.isSaved) {
        this.isSaved = true;
      } else {
        this.state = false;
        this.update();
      }
    },
  },
};
</script>
<style scoped>
.slide-leave-active,
.slide-enter-active {
  transition: 0.25s;
}
.slide-enter {
  position: absolute;
  transform: translate(100%, 0);
}
.slide-leave-to {
  position: absolute;
  transform: translate(-100%, 0);
}
</style>

<style scoped>
.body {
  display: flex;
  flex-direction: column;
  width: 300px;
  padding: 16px;
}
</style>
