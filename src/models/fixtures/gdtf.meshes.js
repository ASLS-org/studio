/**
 * Where a GDTF model's mesh sits around its geometry's origin, as a normalised centre: the
 * centre of the mesh's bounding box divided by the box size. GDTF scales a mesh to its model's
 * Length, Width and Height, so the centre times those sizes places the body, whatever the mesh's
 * units. Manufacturers' meshes differ (a yoke usually hangs from its origin, a head is centred),
 * so the mesh is read when the file has one; otherwise the GDTF primitive meshes' convention is
 * used.
 *
 * Must stay free of Vue, Three.js and `import.meta` (see fixture.profile.js).
 */

/**
 * Normalised centres of the GDTF primitive meshes (measured from the reference meshes in the
 * GDTF spec repository, meshes/1.0 and meshes/1.1). Primitives not listed are centred.
 *
 * @constant {Object} PRIMITIVE_CENTERS
 */
const PRIMITIVE_CENTERS = {
  Conventional: [0, -0.17, 0.01],
  Scanner: [0, -0.21, 0],
  Base1_1: [0, 0, -0.5],
  Conventional1_1: [0, 0, -0.5],
  Scanner1_1: [0, -0.17, -0.5],
};

const CENTERED = [0, 0, 0];
const MAX_CENTER = 0.6; // a body further off its origin than this means the mesh is misplaced
const MAX_ASPECT_ERROR = 0.25;

/**
 * Bounding box accumulator
 *
 * @returns {Object} Box with `add(x, y, z)` and `center()`
 */
function box() {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  return {
    add(x, y, z) {
      const p = [x, y, z];
      for (let k = 0; k < 3; k++) {
        if (p[k] < min[k]) min[k] = p[k];
        if (p[k] > max[k]) max[k] = p[k];
      }
    },
    center() {
      if (!(max[0] >= min[0])) return null;
      const size = [0, 1, 2].map((k) => max[k] - min[k]);
      const center = [0, 1, 2].map((k) => (size[k] > 0
        ? +(((max[k] + min[k]) / 2 / size[k]).toFixed(3)) : 0));
      return { center, size };
    },
  };
}

/**
 * Normalised centre of a binary glTF (GLB) mesh, in GDTF axes (glTF is Y-up, GDTF Z-up). Node
 * matrices are applied (one level, as GDTF exporters write them).
 *
 * @param {Uint8Array} bytes GLB file
 * @returns {?Array<Number>} Normalised centre, or null when it can't be read
 */
function glbCenter(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67) return null;
  const jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength)));
  const binStart = 20 + jsonLength + 8;
  const b = box();
  (json.nodes || []).forEach((node) => {
    if (node.mesh === undefined || !json.meshes[node.mesh]) return;
    const m = node.matrix || null;
    const t = node.translation || [0, 0, 0];
    const s = node.scale || [1, 1, 1];
    json.meshes[node.mesh].primitives.forEach((primitive) => {
      const accessor = json.accessors[primitive.attributes.POSITION];
      if (!accessor || accessor.bufferView === undefined) return;
      const bufferView = json.bufferViews[accessor.bufferView];
      const stride = bufferView.byteStride || 12;
      const start = binStart + (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
      for (let i = 0; i < accessor.count; i++) {
        const o = start + i * stride;
        const x = view.getFloat32(o, true);
        const y = view.getFloat32(o + 4, true);
        const z = view.getFloat32(o + 8, true);
        let p;
        if (m) {
          p = [
            m[0] * x + m[4] * y + m[8] * z + m[12],
            m[1] * x + m[5] * y + m[9] * z + m[13],
            m[2] * x + m[6] * y + m[10] * z + m[14],
          ];
        } else {
          p = [x * s[0] + t[0], y * s[1] + t[1], z * s[2] + t[2]];
        }
        b.add(p[0], -p[2], p[1]); // Y-up to Z-up
      }
    });
  });
  return b.center();
}

/**
 * Normalised centre of a 3DS mesh (Z-up, like GDTF)
 *
 * @param {Uint8Array} bytes 3DS file
 * @returns {?Array<Number>} Normalised centre, or null when it can't be read
 */
function threeDsCenter(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const b = box();
  const walk = (start, end) => {
    let offset = start;
    while (offset + 6 <= end) {
      const id = view.getUint16(offset, true);
      const length = view.getUint32(offset + 2, true);
      if (length < 6 || offset + length > end) return;
      if (id === 0x4d4d || id === 0x3d3d || id === 0x4100) {
        walk(offset + 6, offset + length);
      } else if (id === 0x4000) {
        let p = offset + 6;
        while (p < offset + length && bytes[p] !== 0) p += 1;
        walk(p + 1, offset + length);
      } else if (id === 0x4110) {
        const count = view.getUint16(offset + 6, true);
        for (let i = 0; i < count; i++) {
          const o = offset + 8 + i * 12;
          b.add(
            view.getFloat32(o, true),
            view.getFloat32(o + 4, true),
            view.getFloat32(o + 8, true),
          );
        }
      }
      offset += length;
    }
  };
  walk(0, bytes.byteLength);
  return b.center();
}

/**
 * Whether a mesh's box matches the model it is scaled to: same proportions (within 25%, so the
 * axes and units are what GDTF expects) and a centre near the origin. Exporters sometimes write
 * meshes in other orientations or with offsets; those fall back to the primitive's convention.
 *
 * @param {?Object} measured Mesh box: normalised `center` and `size`
 * @param {Array<Number>} dims Model length, width, height
 * @returns {Boolean} Whether the mesh can place the body
 */
function plausible(measured, dims) {
  if (!measured) return false;
  const { center, size } = measured;
  if (center.some((c) => Math.abs(c) > MAX_CENTER)) return false;
  const usable = [0, 1, 2].filter((k) => dims[k] > 0 && size[k] > 0);
  if (usable.length < 2) return false;
  const scale = usable.map((k) => size[k] / dims[k]);
  const mean = scale.reduce((a, b) => a + b, 0) / scale.length;
  return scale.every((r) => Math.abs(r / mean - 1) < MAX_ASPECT_ERROR);
}

/**
 * Normalised centre of a model: from its mesh when the file has a plausible one, else from its
 * primitive
 *
 * @public
 * @param {String} primitive GDTF primitive type
 * @param {?Object} files Mesh files of the model: `glb` and/or `threeDs` bytes
 * @param {Array<Number>} dims Model length, width, height
 * @returns {Array<Number>} Normalised centre [x, y, z]
 */
export default function modelCenter(primitive, files, dims) {
  if (files) {
    try {
      const glb = files.glb && glbCenter(files.glb);
      if (plausible(glb, dims)) return glb.center;
      const threeDs = files.threeDs && threeDsCenter(files.threeDs);
      if (plausible(threeDs, dims)) return threeDs.center;
    } catch (error) {
      // An unreadable mesh falls back to the primitive's convention
    }
  }
  return PRIMITIVE_CENTERS[primitive] || CENTERED;
}
