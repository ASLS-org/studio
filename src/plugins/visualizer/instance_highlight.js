import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const COMMON_VERTEX_HEAD = /* glsl */`
  attribute float highlight;
`;

const FILL_VERTEX = /* glsl */`
  attribute float highlight;
  varying vec3 vNormalView;
  varying vec3 vViewPos;
  void main() {
    if (highlight < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    mat4 mv = modelViewMatrix * instanceMatrix;
    vec4 viewPos = mv * vec4(position, 1.0);
    vNormalView = normalize(mat3(mv) * normal);
    vViewPos = viewPos.xyz;
    gl_Position = projectionMatrix * viewPos;
  }
`;

const FILL_FRAGMENT = /* glsl */`
  uniform vec3 uColor;
  uniform float uFill;
  uniform float uRim;
  uniform float uRimPower;
  varying vec3 vNormalView;
  varying vec3 vViewPos;
  void main() {
    float facing = abs(dot(normalize(vNormalView), normalize(-vViewPos)));
    float shade = mix(0.55, 1.0, facing);
    float rim = pow(1.0 - facing, uRimPower) * uRim;
    vec3 rgb = mix(uColor * shade, uColor, rim);
    gl_FragColor = vec4(rgb, clamp(uFill + rim, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

const OUTLINE_VERTEX = /* glsl */`
  ${COMMON_VERTEX_HEAD}
  uniform float uWidth;      // in drawing-buffer pixels
  uniform vec2 uResolution;  // drawing-buffer size
  void main() {
    if (highlight < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    mat4 mv = modelViewMatrix * instanceMatrix;
    vec4 clip = projectionMatrix * mv * vec4(position, 1.0);
    vec3 nView = normalize(mat3(mv) * normal);
    vec2 nClip = normalize((projectionMatrix * vec4(nView, 0.0)).xy);
    clip.xy += nClip * (uWidth * 2.0 / uResolution) * clip.w;
    gl_Position = clip;
  }
`;

const OUTLINE_FRAGMENT = /* glsl */`
  uniform vec3 uOutlineColor;
  void main() {
    gl_FragColor = vec4(uOutlineColor, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Ghost + outline highlight overlay for InstancedMeshes.
 * Per-instance state lives in one shared InstancedBufferAttribute ("highlight").
 */
export default class InstanceHighlight {
  constructor(maxInstances, {
    color = 0xE046A6,
    outlineColor = 0xFFE0C0,
    edgeColor = 0xffc266,
    outlineWidth = 2.0,
    fillOpacity = 0.7,
    rimStrength = 0.35,
    rimPower = 2.0,
    edgeSensitivity = 1.0,
    xray = true,
  } = {}) {
    this.maxInstances = maxInstances;
    this.attribute = new THREE.InstancedBufferAttribute(new Float32Array(maxInstances), 1);
    this.attribute.setUsage(THREE.DynamicDrawUsage);

    this.uniforms = {
      uColor: { value: new THREE.Color(color) },
      uOutlineColor: { value: new THREE.Color(outlineColor) },
      uEdgeColor: { value: new THREE.Color(edgeColor) },
      uFill: { value: fillOpacity },
      uRim: { value: rimStrength },
      uRimPower: { value: rimPower },
      uEdgeSensitivity: { value: edgeSensitivity },
      uWidth: { value: outlineWidth },
      uResolution: { value: new THREE.Vector2(1, 1) },
    };

    this.fillMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: FILL_VERTEX,
      fragmentShader: FILL_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending, // was Additive
      side: THREE.FrontSide,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
    });

    this.outlineMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: OUTLINE_VERTEX,
      fragmentShader: OUTLINE_FRAGMENT,
      side: THREE.BackSide,
      toneMapped: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.NotEqualStencilFunc,
      stencilFail: THREE.KeepStencilOp,
      stencilZFail: THREE.KeepStencilOp,
      stencilZPass: THREE.KeepStencilOp,
    });

    this.meshes = [];
    this.xray = xray;
  }

  /**
   * Creates fill + outline companions for a source InstancedMesh.
   * Add the returned meshes to the scene.
   */
  attach(sourceMesh) {
    sourceMesh.geometry.setAttribute('highlight', this.attribute);

    // smooth-normal copy for the outline only
    const plain = new THREE.BufferGeometry();
    plain.setAttribute('position', sourceMesh.geometry.attributes.position);
    if (sourceMesh.geometry.index) plain.setIndex(sourceMesh.geometry.index);
    const welded = mergeVertices(plain, 1e-4);
    welded.computeVertexNormals();
    const hullGeo = new THREE.InstancedBufferGeometry();
    THREE.BufferGeometry.prototype.copy.call(hullGeo, welded);
    hullGeo.setAttribute('highlight', this.attribute);

    const make = (geometry, material, renderOrder, isOutline = false) => {
      const mesh = new THREE.InstancedMesh(geometry, material, this.maxInstances);
      mesh.instanceMatrix = sourceMesh.instanceMatrix;
      mesh.frustumCulled = false;
      mesh.renderOrder = renderOrder;
      mesh.count = sourceMesh.count;
      if (isOutline) {
        // keep the pixel width correct on every frame and every resize
        mesh.onBeforeRender = (renderer) => {
          renderer.getDrawingBufferSize(this.uniforms.uResolution.value);
        };
      }
      this.meshes.push(mesh);
      return mesh;
    };

    return [
      make(sourceMesh.geometry, this.fillMaterial, 1),
      make(hullGeo, this.outlineMaterial, 2, true),
    ];
  }

  set(id, state) {
    this.attribute.setX(id, state ? 1.0 : 0.0);
    this.attribute.needsUpdate = true;
  }

  clear() {
    this.attribute.array.fill(0);
    this.attribute.needsUpdate = true;
  }

  setCount(count) {
    this.meshes.forEach((mesh) => { mesh.count = count; });
  }

  /** Show the highlight through occluding geometry (Blender "X-ray"). */
  set xray(value) {
    this._xray = value;
    this.fillMaterial.depthTest = !value;
    this.outlineMaterial.depthTest = !value;
  }

  get xray() {
    return this._xray;
  }
}
