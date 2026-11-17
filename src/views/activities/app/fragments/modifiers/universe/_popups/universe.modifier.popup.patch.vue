<template>
  <uk-popup
    v-model="state"
    :valid="fixture.loaded && !patchError && !loading"
    :header="headerData"
    @submit="patchFixtures"
    @input="update()"
  >
    <uk-flex class="patch_popup">
      <uk-flex
        col
        class="fixture_sources"
        :class="{ dragging }"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="dropFiles"
      >
        <uk-list
          class="fixture_list"
          :items="fixtures"
          filterable
          @select="loadFixture"
        />
        <div class="import_bar">
          <uk-button
            square
            icon="library"
            label="Import GDTF…"
            :disabled="importing"
            style="width: 100%; height: var(--control-height)"
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
        </div>
      </uk-flex>
      <uk-flex
        col
        class="patch_form"
      >
        <div style="padding: var(--space-5)">
          <uk-flex
            :gap="8"
            class="patch_form_section"
          >
            <uk-txt-input
              v-model="fixture.name"
              :disabled="!fixture.loaded || loading"
              style="flex: 1"
              label="Name"
            />
            <uk-num-input
              v-model="fixture.universe"
              disabled
              class="field"
              label="Universe"
              @input="autoPatch"
            />
          </uk-flex>
          <uk-flex
            :gap="8"
            class="patch_form_section"
          >
            <uk-select-input
              v-model="fixture.mode"
              :disabled="!fixture.loaded || loading"
              style="flex: 1"
              label="Fixture mode"
              :options="fixture.modeNames"
            />
            <!-- DMX address (1-512); chStart stays 0-based -->
            <uk-num-input
              :model-value="dmxAddress(chStart)"
              :disabled="!fixture.loaded || loading"
              class="field"
              label="Address"
              :min="1"
              :max="512"
              @update:model-value="setAddress"
            />
            <uk-num-input
              v-model="amount"
              :disabled="!fixture.loaded || loading"
              class="field"
              label="Amount"
              :min="1"
              :max="512"
              @input="autoPatch"
            />
            <uk-num-input
              v-model="chStop"
              disabled
              class="field"
              label="Stop"
            />
          </uk-flex>
          <uk-flex
            :gap="8"
            class="patch_form_section"
          >
            <uk-txt-input
              v-model="fixture.category"
              readonly
              :disabled="!fixture.loaded || loading"
              class="field"
              style="flex: 1"
              label="Fixture type"
            />
          </uk-flex>
          <!-- What the universe holds, and the range the new fixtures would take -->
          <universe-map
            v-if="universe && universe.fixturePool"
            readonly
            :labels="false"
            class="patch_map"
            style="--universe-map-row: 20px"
            :fixtures="patchedFixtures"
            :color="universe.color"
            :highlight="fixture.loaded ? {
              chStart,
              count: chStop - chStart,
              error: patchError,
              name: fixture.name,
              size: modeChannels,
            } : null"
          />
          <universe-message
            v-if="fixture.loaded && patchError"
            class="patch_error"
          >
            {{ patchErrorText }}
          </universe-message>
        </div>
        <uk-spacer />
      </uk-flex>
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';
import EventBus from '@/plugins/eventbus';
import FixtureLibrary from '@/models/fixtures/fixture.library';
import { PROFILE_SOURCES } from '@/models/fixtures/fixture.profile';
import { dmxAddress, chStartOf } from '@/views/utils/dmx';
import UniverseMap from '../_widgets/universe.modifier.map.vue';
import UniverseMessage from '../_widgets/universe.modifier.message.vue';

const NO_FIXTURE_STR = 'No fixture model selected';
const DEFAULT_FIXTURE_AMOUNT = 1;
const DEFAULT_FIXTURE_DATA = {
  name: NO_FIXTURE_STR,
  modeNames: [NO_FIXTURE_STR],
  category: NO_FIXTURE_STR,
  modes: [{}],
  chStart: 0,
  universe: 0,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  mode: 0,
  loaded: false,
};

export default {
  name: 'UkPopupPatch',
  components: {
    UniverseMap,
    UniverseMessage,
  },
  mixins: [PopupMixin],
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    universe: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      headerData: { title: 'Patch fixture' },
      fixtures: [],
      fixture: JSON.parse(JSON.stringify(DEFAULT_FIXTURE_DATA)),
      amount: DEFAULT_FIXTURE_AMOUNT,
      chStop: 0,
      chStart: 0,
      patchError: false,
      loading: false,
      importing: false,
      dragging: false,
    };
  },
  computed: {
    /**
     * Channels of one fixture in the chosen mode
     */
    modeChannels() {
      return this.fixture.modes[this.fixture.mode]?.channels?.length || 0;
    },
    /**
     * Why the range can't be patched: past 512, or the fixtures already there
     */
    patchErrorText() {
      const chCount = this.fixture.modes[this.fixture.mode]?.channels?.length || 0;
      const count = chCount * this.amount;
      if (this.universe.findChStartAutoPatch(chCount, this.amount) < 0) {
        return `No free range of ${count} addresses in ${this.universe.name}: free some, or patch `
          + 'fewer fixtures or another universe.';
      }
      const range = `${dmxAddress(this.chStart)}–${dmxAddress(this.chStart + count - 1)}`;
      if (this.chStart + count > 512) {
        return `${this.amount > 1 ? `${this.amount} fixtures need` : 'This fixture needs'} `
          + `addresses ${range}: past address 512 of ${this.universe.name}.`;
      }
      const taken = this.universe.fixturePool.fixtures
        .filter((f) => f.chStart < this.chStart + count && this.chStart < f.chStart + f.chCount)
        .map((f) => `${f.name} (${dmxAddress(f.chStart)}–${dmxAddress(f.chStart + f.chCount - 1)})`);
      if (taken.length) {
        return `Addresses ${range} are taken by ${taken.join(', ')}. Pick another address or `
          + 'fewer fixtures.';
      }
      return `Addresses ${range} can't be patched.`;
    },
    /**
     * Fixtures of the universe, for the map
     */
    patchedFixtures() {
      return this.universe.fixturePool.fixtures.map((fixture) => ({
        id: fixture.id, name: fixture.name, chStart: fixture.chStart, count: fixture.chCount,
      }));
    },
    count() {
      if (this.fixture.modes[this.fixture.mode]) {
        return this.fixture.modes[this.fixture.mode].length - 1;
      }
      return 0;
    },
  },
  watch: {
    state(state) {
      if (state) {
        this.init();
      }
    },
  },
  mounted() {
    this.init();
  },
  methods: {
    dmxAddress,
    /**
     * Sets the start from a typed DMX address and checks the range
     *
     * @public
     * @param {Number} address DMX address, 1 to 512
     */
    setAddress(address) {
      this.chStart = chStartOf(address);
      this.checkPatch();
    },
    /**
     * Initialise popup variables
     *
     * @public
     */
    init() {
      this.refreshFixtures();
      this.fixture = JSON.parse(JSON.stringify(DEFAULT_FIXTURE_DATA));
      this.amount = DEFAULT_FIXTURE_AMOUNT;
      this.chStop = 0;
      this.patchError = false;
    },
    /**
     * Patch selected fixture using provided form parameters.
     *
     * @public
     */
    // eslint-disable-next-line consistent-return
    patchFixtures() {
      if (this.fixture.loaded && !this.patchError) {
        this.loading = true;
        const fixtures = [];
        if (this.checkPatch()) {
          try {
            const chCount = this.fixture.modes[this.fixture.mode].channels.length;
            for (let i = 0; i < this.amount; i++) {
              this.fixture.chStart = i * chCount + this.chStart;
              const fixture = this.$show.fixturePool.addRaw({
                profile: this.fixture.profile,
                manufacturer: this.fixture.manufacturer,
                model: this.fixture.model,
                // identical fixtures are told apart by a number: "Spot 1", "Spot 2"...
                name: this.amount > 1 ? `${this.fixture.name} ${i + 1}` : this.fixture.name,
                category: this.fixture.category,
                mode: this.fixture.modeNames[this.fixture.mode],
                universe: this.fixture.universe,
                chStart: this.fixture.chStart,
                position: { ...this.fixture.position },
                rotation: { ...this.fixture.rotation },
              });
              this.universe.patchFixture(fixture);
            }
            this.loading = false;
            this.close();
            return fixtures;
          } catch (err) {
            this.loading = false;
            throw err;
          }
        } else {
          this.loading = false;
          throw new Error('Out of universe bounds');
        }
      }
    },
    /**
     * Loads selected fixture configuration file
     *
     * @public
     * @async
     */
    async loadFixture(item) {
      if (!item || !item.fixture) return;
      const { source, manufacturer, fixture } = item;
      const profile = await FixtureLibrary.getProfile(source, manufacturer, fixture);
      Object.assign(this.fixture, {
        profile,
        modes: profile.modes,
        modeNames: profile.modes.map((mode) => mode.name),
        name: profile.name,
        model: profile.model,
        manufacturer: profile.manufacturer,
        category: profile.category,
        mode: 0,
        loaded: true,
      });
      this.patchError = false;
      this.autoPatch();
    },
    /**
     * Checks that provided patch configuration is valid
     *
     * @public
     */
    checkPatch() {
      const chCount = this.fixture.modes[this.fixture.mode].channels.length;
      this.chStop = chCount * this.amount + this.chStart;
      if (this.universe.canPatchMany(this.chStart, chCount, this.amount)) {
        this.patchError = false;
        return true;
      }
      this.patchError = true;
      return false;
    },
    /**
     * Automatically patches fixture within available universe address space.
     *
     * @public
     */
    autoPatch() {
      const chCount = this.fixture.modes[this.fixture.mode].channels.length;
      const chStart = this.universe.findChStartAutoPatch(chCount, this.amount);
      if (chStart > -1) {
        this.patchError = false;
        this.chStart = chStart;
      } else {
        this.patchError = true;
      }
      this.chStop = chCount * this.amount + this.chStart;
    },
    /**
     * Lists the fixtures to patch: imported GDTF fixtures (this device's library), bundled GDTF
     * fixtures, then the OFL library by manufacturer
     *
     * @public
     * @async
     */
    async refreshFixtures() {
      const gdtfItem = (f) => ({
        name: f.name,
        more: f.manufacturer,
        icon: 'wave',
        source: PROFILE_SOURCES.GDTF,
        manufacturer: f.manufacturer,
        fixture: f.fixtureTypeId,
      });
      const { imported, bundled } = await FixtureLibrary.listGDTF();
      const ofl = this.$show.rawOFLFixtures.map((manufacturer) => ({
        name: manufacturer.name,
        icon: 'folder',
        unfold: manufacturer.fixtures.map((fixture) => ({
          name: fixture,
          icon: 'wave',
          source: PROFILE_SOURCES.OFL,
          manufacturer: manufacturer.name,
          fixture,
        })),
      }));
      this.fixtures = [
        { name: 'Imported (GDTF)', icon: 'library', unfold: imported.map(gdtfItem) },
        { name: 'Bundled (GDTF)', icon: 'library', unfold: bundled.map(gdtfItem) },
        ...ofl,
      ];
    },
    /**
     * Imports `.gdtf` files into this device's fixture library, then refreshes the list. A file
     * that is not a usable GDTF fixture is reported and skipped.
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
        await this.refreshFixtures();
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
     * Imports the `.gdtf` files dropped on the fixture list
     *
     * @public
     * @param {DragEvent} event Drop event
     */
    dropFiles(event) {
      this.dragging = false;
      const files = [...event.dataTransfer.files].filter((f) => /\.gdtf$/i.test(f.name));
      if (files.length) this.importFiles(files);
    },
  },
};
</script>

<style scoped>
.patch_popup {
  height: 100%;
}
.patch_form {
  min-width: 340px;
}
.patch_form_subsection {
  margin-bottom: unset;
}
/* Takes no height of its own: the form sets the popup's height and the list fills it */
.fixture_sources {
  align-self: stretch;
  contain: size;
  width: var(--widget-width-md);
  border-right: var(--border-width) solid var(--primary-dark);
}
.fixture_sources.dragging {
  outline: var(--border-width) dashed var(--accent-blue);
  outline-offset: -2px;
}
/* Fills the popup's height, whatever the form beside it takes */
.fixture_list {
  flex: 1;
  min-height: 0;
  width: var(--widget-width-md);
  overflow: hidden;
}
.import_bar {
  padding: var(--space-4);
  border-top: var(--border-width) solid var(--primary-dark);
}
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-4);
  width: 55px;
}
.field_label {
  margin-bottom: var(--space-4);
}
.patch_button {
  margin-left: var(--space-4);
}
.patch_map {
  margin-top: var(--space-4);
}
.patch_error {
  margin-top: var(--space-4);
  max-width: 340px;
}
h4 {
  margin-bottom: var(--space-4);
}
.form_validation {
  display: flex;
  border-top: var(--border-width) solid var(--primary-dark);
  padding: var(--space-4);
  width: 100%;
}
</style>
