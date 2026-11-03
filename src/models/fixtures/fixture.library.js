import axios from 'axios';
import { markRaw } from 'vue';
import profileFromOFL from './ofl.adapter';
import { PROFILE_SOURCES } from './fixture.profile';

/**
 * Loaded profiles (or pending loads) keyed by `source/manufacturer/model`
 *
 * @constant {Map<String, Promise<Object>>} profiles
 */
const profiles = new Map();

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
        default:
          return Promise.reject(new Error(`Unknown fixture profile source: ${source}`));
      }
      profiles.set(key, load);
      load.catch(() => profiles.delete(key));
    }
    return profiles.get(key);
  }
}

export default FixtureLibrary;
