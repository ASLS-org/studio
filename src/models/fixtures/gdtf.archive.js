import { unzip } from 'fflate';
import { parseStringPromise } from 'xml2js';

/**
 * Reads `.gdtf` files (zip archives holding `description.xml` and the wheel images).
 *
 * Must stay free of Vue, Three.js and `import.meta` (see fixture.profile.js).
 */

/**
 * GDTF description file inside the archive
 *
 * @constant {String} DESCRIPTION_FILE
 */
const DESCRIPTION_FILE = 'description.xml';

/**
 * Folder of the wheel slot images inside the archive
 *
 * @constant {String} WHEELS_FOLDER
 */
const WHEELS_FOLDER = 'wheels/';

/**
 * Mesh files read for body placement: glTF binaries (any detail level), then 3DS
 *
 * @constant {RegExp} MESH_FILE
 */
const MESH_FILE = /^models\/(gltf\w*|3ds)\/(.+)\.(glb|3ds)$/i;

/**
 * Error raised when a file is not a usable GDTF fixture
 *
 * @class GDTFError
 */
export class GDTFError extends Error {
  /**
   * @param {String} message What is wrong with the file
   */
  constructor(message) {
    super(message);
    this.name = 'GDTFError';
  }
}

/**
 * @typedef {Object} XMLElement
 * @property {String} tag Element name
 * @property {Object} attrs Attributes by name
 * @property {Array<XMLElement>} children Child elements, in document order
 */

/**
 * Turns an xml2js node (explicitChildren, preserveChildrenOrder) into a plain element
 *
 * @param {Object} node xml2js node
 * @returns {XMLElement} Element
 */
function toElement(node) {
  return {
    tag: node['#name'],
    attrs: node.$ || {},
    children: (node.$$ || []).map(toElement),
  };
}

/**
 * Unzips an archive
 *
 * @param {Uint8Array} bytes Archive bytes
 * @returns {Promise<Object>} Files by path
 */
function unzipArchive(bytes) {
  return new Promise((resolve, reject) => {
    unzip(bytes, (error, files) => (error ? reject(error) : resolve(files)));
  });
}

/**
 * Reads a GDTF file
 *
 * @public
 * @param {ArrayBuffer|Uint8Array} data File content
 * @returns {Promise<{description: XMLElement, images: Map<String, Uint8Array>,
 * models: Map<String, Object>}>} The `GDTF` root element of `description.xml`, the wheel images
 * by media file name and the mesh files (`glb`, `threeDs`) by model file name (without extension)
 * @throws {GDTFError} When the file is not a readable GDTF archive
 */
export async function readGDTF(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let files;
  try {
    files = await unzipArchive(bytes);
  } catch (error) {
    throw new GDTFError('The file is not a GDTF fixture or is damaged (not a readable zip archive)');
  }
  if (!files[DESCRIPTION_FILE]) {
    throw new GDTFError('The file is not a GDTF fixture (no description.xml)');
  }
  let parsed;
  try {
    parsed = await parseStringPromise(new TextDecoder().decode(files[DESCRIPTION_FILE]), {
      explicitChildren: true,
      preserveChildrenOrder: true,
      explicitRoot: true,
    });
  } catch (error) {
    throw new GDTFError('The GDTF description is damaged (description.xml is not valid XML)');
  }
  const root = parsed.GDTF;
  if (!root) {
    throw new GDTFError('The file is not a GDTF fixture (no GDTF element)');
  }
  root['#name'] = 'GDTF';
  const images = new Map();
  Object.keys(files).forEach((path) => {
    if (path.startsWith(WHEELS_FOLDER) && files[path].length) {
      images.set(path.slice(WHEELS_FOLDER.length).replace(/\.[^.]+$/, ''), files[path]);
    }
  });
  const models = new Map();
  Object.keys(files).forEach((path) => {
    const match = MESH_FILE.exec(path);
    if (!match || !files[path].length) return;
    const entry = models.get(match[2]) || {};
    if (match[3].toLowerCase() === 'glb') {
      // The standard glTF folder wins over the low and high detail ones
      if (!entry.glb || match[1].toLowerCase() === 'gltf') entry.glb = files[path];
    } else {
      entry.threeDs = files[path];
    }
    models.set(match[2], entry);
  });
  return { description: toElement(root), images, models };
}
