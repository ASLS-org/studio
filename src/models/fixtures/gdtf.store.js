/**
 * Local library of imported GDTF files, kept in IndexedDB (browser and Electron alike).
 *
 * One record per GDTF fixture type: `{ fixtureTypeId, revision, manufacturer, name, file,
 * importedAt }`, where `file` is the `.gdtf` file as an ArrayBuffer.
 */

const DATABASE = 'asls-fixtures';
const STORE = 'gdtf';
const VERSION = 1;

let opening = null;

/**
 * Opens the database once per session
 *
 * @returns {Promise<IDBDatabase>} Database
 */
function open() {
  if (!opening) {
    opening = new Promise((resolve, reject) => {
      const req = indexedDB.open(DATABASE, VERSION);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'fixtureTypeId' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    opening.catch(() => { opening = null; });
  }
  return opening;
}

/**
 * Runs one request on the store
 *
 * @param {String} mode `readonly` or `readwrite`
 * @param {Function} fn Builds the request from the object store
 * @returns {Promise<*>} Request result
 */
async function request(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const req = fn(transaction.objectStore(STORE));
    transaction.oncomplete = () => resolve(req.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/**
 * @class GDTFStore
 * @classdesc Imported GDTF files on this device
 */
class GDTFStore {
  /**
   * Returns the record of a fixture type
   *
   * @public
   * @param {String} fixtureTypeId GDTF fixture type ID
   * @returns {Promise<?Object>} Record, or null when it isn't in the library
   */
  static async get(fixtureTypeId) {
    return (await request('readonly', (store) => store.get(fixtureTypeId))) || null;
  }

  /**
   * Adds or replaces the record of a fixture type
   *
   * @public
   * @param {Object} record Library record
   * @returns {Promise<void>}
   */
  static async put(record) {
    await request('readwrite', (store) => store.put(record));
  }

  /**
   * Lists the library without the files
   *
   * @public
   * @returns {Promise<Array<Object>>} Records without `file`, sorted by manufacturer and name
   */
  static async list() {
    const records = await request('readonly', (store) => store.getAll());
    return records
      .map(({ file, ...meta }) => meta)
      .sort((a, b) => `${a.manufacturer} ${a.name}`.localeCompare(`${b.manufacturer} ${b.name}`));
  }
}

export default GDTFStore;
