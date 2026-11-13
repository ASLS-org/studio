<template>
  <uk-popup
    v-model="state"
    backdrop
    :movable="false"
    :cancelable="false"
    :header="headerData"
    :validate-txt="remaining ? 'open anyway' : 'open'"
    :valid="!importing"
    @submit="open"
  >
    <uk-flex
      col
      class="missing_body"
      :class="{ dragging }"
      gap="12"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="dropFiles"
    >
      <p>
        This show uses GDTF fixtures that are not in this device's fixture library. Import their
        .gdtf files to open the show with them.
      </p>
      <ul class="missing_list">
        <li
          v-for="fixture in missing"
          :key="fixture.fixtureTypeId"
          :class="{ found: fixture.found }"
        >
          <uk-icon
            :name="fixture.found ? 'tick' : 'cross'"
            class="missing_icon"
          />
          <p class="missing_name">
            {{ fixture.name }}
          </p>
          <p class="missing_manufacturer">
            {{ fixture.manufacturer }}
          </p>
        </li>
      </ul>
      <uk-button
        square
        icon="library"
        label="Import GDTF…"
        :disabled="importing"
        style="height: 25px"
        @click="$refs.gdtfFiles.click()"
      />
      <input
        ref="gdtfFiles"
        type="file"
        accept=".gdtf"
        multiple
        hidden
        @change="pickFiles"
      >
      <p
        v-if="remaining"
        class="missing_note"
      >
        Open anyway keeps the missing fixtures' addresses, groups and scene values in the show, so
        importing them later and reopening the saved show brings them back.
      </p>
    </uk-flex>
  </uk-popup>
</template>

<script>
import modal from '@/views/mixins/modal.mixin';
import EventBus from '@/plugins/eventbus';
import FixtureLibrary from '@/models/fixtures/fixture.library';
import { PROFILE_SOURCES } from '@/models/fixtures/fixture.profile';
import { MISSING_FIXTURES_EVENT } from '@/models/DMX/show.model';

/**
 * @component Asks for the GDTF fixtures a show uses that are missing on this device, while the
 * show opens: the operator imports their files or opens the show without them.
 */
export default {
  name: 'PopupMissingFixtures',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  data() {
    return {
      /**
       * Popup header definition
       */
      headerData: { title: 'Missing fixtures' },
      /**
       * Missing fixture types: `manufacturer`, `fixtureTypeId`, `name`, `found`
       */
      missing: [],
      /**
       * Import in progress
       */
      importing: false,
      /**
       * Files dragged over the popup
       */
      dragging: false,
      /**
       * Resumes loading the show
       */
      done: null,
    };
  },
  computed: {
    /**
     * Popup display state
     */
    state: modal('app.missing-fixtures', 'app', true),
    /**
     * Number of fixture types still missing
     *
     * @type {Number}
     */
    remaining() {
      return this.missing.filter((f) => !f.found).length;
    },
  },
  watch: {
    state(state) {
      // Closing the popup from its header opens the show as it is
      if (!state && this.done) this.open();
    },
  },
  mounted() {
    EventBus.on(MISSING_FIXTURES_EVENT, this.ask);
  },
  beforeUnmount() {
    EventBus.off(MISSING_FIXTURES_EVENT, this.ask);
  },
  methods: {
    /**
     * Shows the popup for a show being opened
     *
     * @public
     * @param {Object} request Missing fixtures event payload
     * @param {Array<Object>} request.missing Missing fixture types
     * @param {Function} request.done Resumes loading the show
     */
    ask({ missing, done }) {
      this.missing = missing.map((f) => ({ ...f, found: false }));
      this.done = done;
      this.state = true;
    },
    /**
     * Imports `.gdtf` files, then checks which missing types are now available
     *
     * @public
     * @async
     * @param {Array<File>} files Picked or dropped files
     */
    async importFiles(files) {
      this.importing = true;
      try {
        for (let i = 0; i < files.length; i++) {
          try {
            await FixtureLibrary.importGDTF(await files[i].arrayBuffer());
          } catch (error) {
            EventBus.emit('app_error', new Error(`${files[i].name}: ${error.message}`));
          }
        }
        await Promise.all(this.missing.filter((f) => !f.found).map(async (f) => {
          try {
            await FixtureLibrary.getProfile(PROFILE_SOURCES.GDTF, f.manufacturer, f.fixtureTypeId);
            f.found = true;
          } catch (error) {
            // Still missing
          }
        }));
      } finally {
        this.importing = false;
      }
    },
    /**
     * Imports the files picked with the Import GDTF button
     *
     * @public
     * @param {Event} event File input change event
     */
    pickFiles(event) {
      const files = [...event.target.files];
      event.target.value = '';
      this.importFiles(files);
    },
    /**
     * Imports the `.gdtf` files dropped on the popup
     *
     * @public
     * @param {DragEvent} event Drop event
     */
    dropFiles(event) {
      this.dragging = false;
      const files = [...event.dataTransfer.files].filter((f) => /\.gdtf$/i.test(f.name));
      if (files.length) this.importFiles(files);
    },
    /**
     * Opens the show, with the fixtures imported meanwhile
     *
     * @public
     */
    open() {
      this.state = false;
      const { done } = this;
      this.done = null;
      if (done) done();
    },
  },
};
</script>

<style scoped>
.missing_body {
  width: 460px;
  padding: 16px;
}
.missing_body.dragging {
  outline: 1px dashed var(--accent-blue);
  outline-offset: -4px;
}
.missing_list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--primary-dark);
}
.missing_list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
}
.missing_list li + li {
  border-top: 1px solid var(--primary-dark);
}
.missing_icon {
  width: 12px;
  height: 12px;
}
.missing_name {
  flex: 1;
}
.missing_manufacturer {
  opacity: 0.6;
}
.found .missing_name {
  opacity: 0.6;
}
.missing_note {
  opacity: 0.7;
}
</style>
