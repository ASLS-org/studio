import axios from 'axios';
import { markRaw } from 'vue';
import profileFromOFL from './ofl.adapter';
import profileFromGDTF from './gdtf.adapter';
import { readGDTF } from './gdtf.archive';
import GDTFStore from './gdtf.store';
import { PROFILE_SOURCES } from './fixture.profile';

/**
 * Loaded profiles (or pending loads) keyed by `source/manufacturer/model`
 *
 * @constant {Map<String, Promise<Object>>} profiles
 */
const profiles = new Map();

/**
 * Wheel slot images of GDTF profiles, decoded once per type (kept out of the frozen profile)
 *
 * @constant {WeakMap<Object, Map<String, ImageBitmap>>} wheelImages
 */
const wheelImages = new WeakMap();

/**
 * Mesh files of each GDTF profile drawn in the 3D view, kept beside the frozen profile: only the
 * files and detail folders its geometry nodes can draw (see gdtf.meshes.js modelMeshes)
 *
 * @constant {WeakMap<Object, Map<String, Object>>} modelFiles
 */
const modelFiles = new WeakMap();

/**
 * The mesh files a profile's geometry nodes can draw
 *
 * @param {Object} profile GDTF fixture profile (before freezing)
 * @param {Map<String, Object>} models Mesh files by model file name (see gdtf.archive.js)
 * @returns {Map<String, Object>} Bytes by detail folder, by model file name
 */
function drawableModels(profile, models) {
  const drawable = new Map();
  const visit = (node) => {
    if (node.file && node.meshes && !drawable.has(node.file) && models.has(node.file)) {
      const files = models.get(node.file);
      const kept = {};
      Object.keys(node.meshes).forEach((folder) => { kept[folder] = files[folder]; });
      drawable.set(node.file, kept);
    }
    node.children.forEach(visit);
  };
  profile.modes.forEach((mode) => visit(mode.geometry));
  return drawable;
}

/**
 * Index of the GDTF fixtures bundled with the app (public/gdtf), loaded once
 *
 * @type {?Promise<Array<Object>>}
 */
let bundle = null;

/**
 * Raised when a GDTF fixture type is neither in this device's library nor bundled
 *
 * @class MissingFixtureError
 */
export class MissingFixtureError extends Error {
  /**
   * @param {String} manufacturer Manufacturer name
   * @param {String} fixtureTypeId GDTF fixture type ID
   */
  constructor(manufacturer, fixtureTypeId) {
    super(`GDTF fixture ${manufacturer} ${fixtureTypeId} is not in this device's fixture library`);
    this.name = 'MissingFixtureError';
    this.manufacturer = manufacturer;
    this.fixtureTypeId = fixtureTypeId;
  }
}

/**
 * Makes a profile immutable and keeps it out of Vue reactivity. Frozen objects are never
 * proxied by Vue; capabilities stay extensible (they reuse an output object) so they are
 * marked raw instead.
 *
 * @param {Object} profile Fixture profile
 * @returns {Object} The same profile, frozen
 */
function freezeProfile(profile) {
  profile.modes.forEach((mode) => {
    mode.channels.forEach((channel) => {
      channel.capabilities.forEach((capability) => markRaw(capability));
      Object.freeze(channel.capabilities);
      Object.freeze(channel.fine);
      Object.freeze(channel);
    });
    Object.freeze(mode.channels);
    Object.freeze(mode);
  });
  Object.freeze(profile.modes);
  return Object.freeze(markRaw(profile));
}

/**
 * Fetches and builds an OFL profile from the bundled library
 *
 * @param {String} manufacturer Manufacturer key
 * @param {String} model Model key (without `.json`)
 * @returns {Promise<Object>} Fixture profile
 */
async function loadOFLProfile(manufacturer, model) {
  const res = await axios.get(`${import.meta.env.VITE_STATIC_URL}fixtures/${manufacturer}/${model}.json`);
  const profile = profileFromOFL(manufacturer, model, res.data);
  if (!profile.modes.length) {
    throw new Error(`Fixture ${manufacturer}/${model} defines no modes and cannot be patched`);
  }
  return freezeProfile(profile);
}

/**
 * Loads the bundled GDTF index
 *
 * @returns {Promise<Array<Object>>} Bundled fixtures (`file`, `name`, `manufacturer`,
 * `fixtureTypeId`)
 */
function loadBundle() {
  if (!bundle) {
    bundle = axios.get(`${import.meta.env.VITE_STATIC_URL}gdtf/gdtf_list.json`)
      .then((res) => res.data.fixtures || [])
      .catch(() => []);
  }
  return bundle;
}

/**
 * Decodes a profile's wheel slot images (browser only)
 *
 * @param {Object} profile GDTF profile
 * @param {Map<String, Uint8Array>} images Image files by media name
 * @returns {Promise<Map<String, ImageBitmap>>} Decoded images by media name
 */
async function decodeWheelImages(profile, images) {
  const decoded = new Map();
  if (typeof createImageBitmap !== 'function') return decoded;
  const used = new Set();
  Object.values(profile.wheels).forEach((wheel) => wheel.slots.forEach((slot) => {
    if (slot.image && images.has(slot.image)) used.add(slot.image);
  }));
  await Promise.all([...used].map(async (name) => {
    try {
      decoded.set(name, await createImageBitmap(new Blob([images.get(name)])));
    } catch (error) {
      // An unreadable image falls back to a built-in gobo pattern
    }
  }));
  return decoded;
}

/**
 * Builds a frozen GDTF profile from a file, with its wheel images
 *
 * @param {ArrayBuffer|Uint8Array} file `.gdtf` file
 * @returns {Promise<Object>} Fixture profile
 */
async function buildGDTFProfile(file) {
  const { description, images, models } = await readGDTF(file);
  const profile = profileFromGDTF(description, { models });
  wheelImages.set(profile, await decodeWheelImages(profile, images));
  modelFiles.set(profile, drawableModels(profile, models));
  return freezeProfile(profile);
}

/**
 * Loads a GDTF profile from this device's library, then from the bundle
 *
 * @param {String} manufacturer Manufacturer name
 * @param {String} fixtureTypeId GDTF fixture type ID
 * @returns {Promise<Object>} Fixture profile
 * @throws {MissingFixtureError} When neither has the fixture type
 */
async function loadGDTFProfile(manufacturer, fixtureTypeId) {
  const record = await GDTFStore.get(fixtureTypeId);
  if (record) return buildGDTFProfile(record.file);
  const bundled = (await loadBundle()).find((f) => f.fixtureTypeId === fixtureTypeId);
  if (bundled) {
    const res = await axios.get(`${import.meta.env.VITE_STATIC_URL}gdtf/${bundled.file}`, {
      responseType: 'arraybuffer',
    });
    return buildGDTFProfile(res.data);
  }
  throw new MissingFixtureError(manufacturer, fixtureTypeId);
}

/**
 * @class FixtureLibrary
 * @classdesc Loads fixture definitions and turns them into shared, cached profiles
 */
class FixtureLibrary {
  /**
   * Returns the profile of a fixture type, loading it once per session
   *
   * @public
   * @param {String} source Profile source, one of PROFILE_SOURCES
   * @param {String} manufacturer Manufacturer key
   * @param {String} model Model key, with or without `.json`
   * @returns {Promise<Object>} Fixture profile
   */
  static getProfile(source, manufacturer, model) {
    const modelKey = model.replace('.json', '');
    const key = `${source}/${manufacturer}/${modelKey}`;
    if (!profiles.has(key)) {
      let load;
      switch (source) {
        case PROFILE_SOURCES.OFL:
          load = loadOFLProfile(manufacturer, modelKey);
          break;
        case PROFILE_SOURCES.GDTF:
          load = loadGDTFProfile(manufacturer, modelKey);
          break;
        default:
          return Promise.reject(new Error(`Unknown fixture profile source: ${source}`));
      }
      profiles.set(key, load);
      load.catch(() => profiles.delete(key));
    }
    return profiles.get(key);
  }

  /**
   * Imports a `.gdtf` file into this device's library. A file for a fixture type already in the
   * library keeps a single entry, with the newer revision.
   *
   * @public
   * @param {ArrayBuffer} file `.gdtf` file
   * @returns {Promise<Object>} The imported profile
   * @throws {GDTFError} When the file is not a usable GDTF fixture
   */
  static async importGDTF(file) {
    const profile = await buildGDTFProfile(file);
    const { fixtureTypeId, revision } = profile.gdtf;
    const existing = await GDTFStore.get(fixtureTypeId);
    if (!existing || !(existing.revision > revision)) {
      await GDTFStore.put({
        fixtureTypeId,
        revision,
        manufacturer: profile.manufacturer,
        name: profile.name,
        file,
        importedAt: new Date().toISOString(),
      });
      const key = `${PROFILE_SOURCES.GDTF}/${profile.manufacturer}/${fixtureTypeId}`;
      profiles.set(key, Promise.resolve(profile));
    }
    return profile;
  }

  /**
   * Lists the GDTF fixtures available to patch
   *
   * @public
   * @returns {Promise<{imported: Array<Object>, bundled: Array<Object>}>} Imported (this
   * device's library) and bundled fixtures, each with `manufacturer`, `name` and `fixtureTypeId`
   */
  static async listGDTF() {
    const [imported, bundled] = await Promise.all([GDTFStore.list().catch(() => []), loadBundle()]);
    return { imported, bundled };
  }

  /**
   * Wheel slot images of a GDTF profile, by media file name
   *
   * @public
   * @param {Object} profile Fixture profile
   * @returns {Map<String, ImageBitmap>} Decoded images (empty for OFL profiles)
   */
  static wheelImages(profile) {
    return wheelImages.get(profile) || new Map();
  }

  /**
   * Mesh files of a GDTF profile that its geometry nodes can draw. They come from the operator's
   * imported file and stay on this device: never saved in a showfile.
   *
   * @public
   * @param {Object} profile Fixture profile
   * @returns {Map<String, Object>} Bytes by detail folder, by model file name (empty for OFL
   * profiles and fixtures without usable meshes)
   */
  static modelFiles(profile) {
    return modelFiles.get(profile) || new Map();
  }
}

export default FixtureLibrary;
