var THREE = window.THREE = require('three');
import ModelInstancer from './model_instancer'


const VOLUMETRIC_VERTEX_SHADER = `
#include <clipping_planes_pars_vertex>

attribute float index;      //fragment index
attribute vec3 direction;   //beam direction
attribute vec3 color;       //beam color
attribute float intensity;  //beam intensity
attribute vec3 angle;       //beam angle
attribute vec3 wpos;        //beam position

uniform float vertexCount;  //Total vertex count
uniform float topRadius;    //Top radius of the cylinder
uniform float length;       //Maximum length of the cylinder

varying vec3 vPosition;         //Vertex local position
varying vec3 beamPos;
varying vec4 vWorldPosition;    //Vertex world position
varying vec2 vUv;               //UV position
varying vec3 vNormal;           //Vertex normal (not used here. recomputed in the vertex shader since vertex displacement is involved)
varying vec3 vDirection;        //Beam direction in worldspace coordinates
varying vec3 vColor;            //Beam color
varying float vIntensity;       //Beam intensity
varying float vAngle;           //Beam angle
varying float vIndex;           //Vertex index


/**
 * @function computeRadiusVertexScaleFactor
 * @brief Computes cylinder's bottom cap vertex displacement
 * needed in order to set the beam's angle at the provided value 
 * @param vec3 vector input vertex position vector
 * @returns vec3 the transformed vertex position vector
 */
vec3 computeRadiusVertexScaleFactor(vec3 vector){
    if(index >= vertexCount/2.0){
        float height = topRadius/tan(radians(angle.x)) + length + 20.0; //20.0 offset seems to be do the job taking into accont that light is emitted from a conical frustum.. There should be a formula capable of handling that more accurately though
        float radius = tan(radians(angle.x))*height;
        float scaleFactor = radius/topRadius;
        return vector * vec3(scaleFactor,scaleFactor,1.5);
    }
    return vector;
}

void main(){
    #include <begin_vertex>
    #include <project_vertex>
    #include <clipping_planes_vertex>

    vDirection = direction;     //forwarding direction value to fragement shader
    beamPos = wpos;
    vColor = color;             //forwarding color value to fragement shader
    vIntensity = intensity;     //forwarding intensity value to fragement shader
    vAngle = angle.x;           //forwarding angle value to fragement shader
    vUv = uv;                   //forwarding UV values to fragement shader
    vIndex = index;             //forwarding vertex index to fragement shader
    vPosition = computeRadiusVertexScaleFactor(position);     //Displaing vertex position to match desired angle
    vWorldPosition = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(vPosition, 1.0 );      //Determining vertex worldspace coordinates
    vNormal	= vec3(viewMatrix * modelMatrix * instanceMatrix * vec4(normal, 0.0));  //Computing instance normal

    gl_Position	= vWorldPosition;   //Setting up fragment world position 
}`;

const VOLUMETRIC_3DNOISE_FRAGMENT_SHADER =
  `
//
// Description : Array and textureless GLSL 2D/3D/4D simplex 
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20201014 (stegu)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+10.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
  }

`;

const VOLUMETRIC_FRAGMENT_SHADER =
  VOLUMETRIC_3DNOISE_FRAGMENT_SHADER + ` 
#include <clipping_planes_pars_fragment>
#define M_PI 3.1415926535897932384626433832795
precision highp float;

uniform float glowFactor;       //Global glow factor
uniform bool fogState;
uniform float fogFactor;        //Global fogging factor
uniform float fogTurbulence;    //Global fogging turbulence factor
uniform float time;             //Current time
uniform float vertexCount;      //Per instance vertex count
uniform vec3 cameraDir;         //Camera direction
uniform vec3 cameraPos;

varying vec3 vPosition;         //Vertex local position
varying vec3 beamPos;         //Vertex local position
varying vec3 vNormal;           //Vertex normal
varying vec2 vUv;               //UV position
varying vec3 vDirection;        //Intance direction
varying vec3 vColor;            //Instance colro
varying vec4 vWorldPosition;    //Vertex world position
varying float vIntensity;       //Instance intensity
varying float vAngle;           //Instance angle
varying float vIndex;           //Vertex index


/**
 * @function fogging
 * @brief Uses 3D simplex noise functions in order to mimmic fogging
 * @param coord fog coordinates
 * @returns float the fog opacity at provided coordinates 
 */
float fogging( vec3 coord ){
	float fog = 0.0;
	fog += abs(snoise(coord      )) * 1.0;
	fog += abs(snoise(coord * 2.0)) * 0.5;
	fog += abs(snoise(coord * 4.0)) * 0.25;
	fog += abs(snoise(coord * 8.0)) * 0.125;
	return fog;
}

/**
 * @function rgb2hsv
 * @brief converts RGB value to HSV
 * @param vec3 c RGB color to be converted
 * @returns vec3 HSV color
 */
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

/**
 * @function hsv2rgb
 * @brief converts HSV value to RGB
 * @param vec3 c HSV color to be converted
 * @returns vec3 RGB color
 */
vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

/**
 * @function computeFog
 * @brief computes fogging intensity at vertex's world position
 * @param float minValue the minimum fog intensity (i.e. vertex intensity)
 * @returns float fogging intensity at provided world coordinates
 */
float computeFog(float minValue){
  if(fogState){
    float fogPositionFactor = fogFactor * 30.0;
    float fogTime = time/(30.0/fogTurbulence);
    vec3 fogCoord = vec3(
        vWorldPosition.x/fogPositionFactor, 
        vWorldPosition.y/fogPositionFactor, 
        fogTime
    );
    return max(fogging(fogCoord), minValue);
  }else{
    return 1.0;
  }
}

/**
 * @function recomputeVertexNormal
 * @brief computes vertex's normal. (e.g Vertex displacement happened in the shader.)
 * @returns vec3 the vertex's normal
 */
vec3 recomputeVertexNormal(){
    vec3 X = dFdx(vWorldPosition.xyz);
    vec3 Y = dFdy(vWorldPosition.xyz);
    return normalize(cross(X,Y));
}

void main(){
    #include <clipping_planes_fragment>

    vec3 normal = recomputeVertexNormal();

    vec3 dirCamToLight = normalize(cameraPos - beamPos);
    float alignmentFactor = 1.0-abs(dot(vDirection, dirCamToLight));
    float glareFactor = min(max(1.0 - (dot(-cameraDir,vDirection)),abs(sin(radians(vAngle)))),0.5);
    float distance = sqrt(pow(vPosition.x,2.0)+pow(vPosition.y,2.0)+pow(vPosition.z,2.0));
    float attenuation = 2.0/(1.0+alignmentFactor*distance+radians(vAngle)*distance*distance);
    float anglePower = pow(dot(normalize(vWorldPosition.xyz),(normal)),4.0*alignmentFactor);

    float intensity = attenuation*anglePower;

    vec3 hsvColor = rgb2hsv(vColor);
    hsvColor.z = hsvColor.z > 0.001 ? hsvColor.z*intensity : 0.0;
    vec3 rgbColor = hsv2rgb(hsvColor);
    
    gl_FragColor = vec4(rgbColor*computeFog(intensity)*vIntensity,1.0);

}
`;

const MODEL_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  transparent: true,
  flatShading: false,
  side: THREE.DoubleSide,
  clippingPlanes: true,

});

MODEL_MATERIAL.onBeforeCompile = shader => {
  //the rest is the same
  shader.vertexShader = shader.vertexShader.replace(
    '#define STANDARD\n',
    `#define STANDARD
         attribute float highlight;
         varying float vHighlight;`
  )
  shader.vertexShader = shader.vertexShader.replace(
    '#include <clipping_planes_vertex>\n\t',
    '#include <clipping_planes_vertex>\nvHighlight = highlight;\n'
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    'varying vec3 vViewPosition;\n',
    'varying vec3 vViewPosition;\nvarying float vHighlight;\n'
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    'totalEmissiveRadiance = emissive;\n',
    'totalEmissiveRadiance = vHighlight == 0.0 ? emissive : vec3(.92,.24,.33);\n'
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    'vec4 diffuseColor = vec4( diffuse, opacity );\n',
    'vec4 diffuseColor = vec4( diffuse, vHighlight == 0.0 ? 1.0 : 0.5 );\n'
  )

  MODEL_MATERIAL.userData.shader = shader;
}


const MAX_INSTANCES = 100;
const vector_cam = new THREE.Vector3();
const vector_beam = new THREE.Vector3();
const vector_beam_pos = new THREE.Vector3();
const vector_cam_pos = new THREE.Vector3();


const BEAM_RESOLUTION = 100;
const BEAM_SEGMENTS = 1;
const BEAM_LENGTH = 100;
const BEAM_TOP_RADIUS = 0.09;
const BEAM_MAX_ANGLE = 45;

const SPOTLIGHT_PHYSICALLY_CORRECT_DISTANCE = 0;
const SPOTLIGHT_PHYSICALLY_CORRECT_INTENSITY = 100.0;
const SPOTLIGHT_PHYSICALLY_CORRECT_DECAY = 1.0;
const SPOTLIGHT_PHYSICALLY_CORRECT_PENUMBRA = 1.2;

const DEFAULT_COLOR_TEMP = 8000;

const SLOT_TYPES = {
  OPEN: "Open",
  COLOR: "Color",
  GOBO: "Gobo"
}

const SHUTTER_STROBE_EFFETCS = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  STROBE: 'Strobe',
  PULSE: 'Strobe',
  RAMP_UP: 'RampUp',
  RAMP_DOWN: 'RampDown',
  RAMP_UP_DOWN: 'RampUpDown',
  LIGHTNING: 'Lighting',
  SPIKES: 'Spikes',
}

const SHUTTER_VALUE = {
  OPEN: 1.0,
  CLOSED: 0.0
}

const SHUTTER_STROBE_FREQUENCIES_DEFAULT = {
  SLOW: 1,
  FAST: 10
}

var position_buffer_attribute = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3)
var direction_buffer_attribute = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3)
var intensity_buffer_attribute = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES), 1)
var color_buffer_attribute = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3)
var emissive_buffer_attribute = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES), 1)
var angle_buffer_attribute = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 2), 2)

var baseGeo = new THREE.InstancedBufferGeometry();
var yokeGeo = new THREE.InstancedBufferGeometry();
var headGeo = new THREE.InstancedBufferGeometry();
var beamGeo = new THREE.InstancedBufferGeometry();
var targetGeo = new THREE.InstancedBufferGeometry();
var boxHelperGeo = new THREE.InstancedBufferGeometry();


var baseMesh;
var yokeMesh;
var headMesh;
var beamMesh;
var capMesh;
var boxHelperMesh;

var camera_handle = null;
var scene_handle = null;

var instances = [];
var instanceCount = 0;

/**
 * Defines a 3D moving head instance
 *
 * @class MovingHead
 */
class MovingHead {

  /**
   * Creates an instance of MovingHead.
   * @param {string} [data={
   *     minAngle: 0.0,
   *     maxAngle: 10.0,
   *     minTilt: 0.0,
   *     maxTilt: 0.0,
   *     minPan: 0.0,
   *     maxPan: 0.0,
   *     color: 'white',
   *     colorTemp: DEFAULT_COLOR_TEMP,
   *     intensity: 0.0,
   *     pan: 0.0,
   *     tilt: 0.0,
   *     goboWheel: [],
   *     colorWheel: []
   *   }]
   * @memberof MovingHead
   */
  constructor(data = {
    minAngle: 0.0,
    maxAngle: 10.0,
    minTilt: 0.0,
    maxTilt: 0.0,
    minPan: 0.0,
    maxPan: 0.0,
    color: 'white',
    colorTemp: DEFAULT_COLOR_TEMP,
    intensity: 0.0,
    pan: 0.0,
    tilt: 0.0,
    goboWheel: [],
    colorWheel: []
  }) {

    this._id = instanceCount++;
    this._position = new THREE.Vector3();
    this._rotation = new THREE.Vector3();
    this._minAngle = data.minAngle + 1.0;
    this._maxAngle = data.maxAngle + 1.0;
    this._shutter = SHUTTER_VALUE.OPEN;
    this._goboWheel = data.goboWheel;
    this._colorWheel = data.colorWheel;
    this._activeColorPreset = false;
    this._highlighted = false;

    this.prepareInstance();

    this.angle = this._maxAngle;
    this.color = data.color;
    this.colorTemp = data.colorTemp;
    this.intensity = data.intensity;
    this.minTilt = data.minTilt;
    this.maxTilt = data.maxTilt;
    this.minPan = data.minPan;
    this.maxPan = data.maxPan;
    this.pan = data.pan;
    this.tilt = data.tilt;
    this.strobeFrequency = 0.0;

    this._shutterStrobe = {
      effect: SHUTTER_STROBE_EFFETCS.OPEN,
      frequency: SHUTTER_STROBE_FREQUENCIES_DEFAULT.SLOW
    }

  }

  /**
   * Instance ID
   * 
   * @type {Number}
   */
  get id() {
    return this._id;
  }

  /**
   * Beam angle
   * 
   * @type {Number}
   */
  get angle() {
    return this._angle || 10.0;
  }

  /**
   * Beam color
   * 
   * @type {String}
   */
  get color() {
    return this._color || new THREE.Color('white');
  }

  /**
   * Pan value in degrees
   * 
   * @type {Number}
   */
  get pan() {
    return this._pan || 0.0;
  }

  /**
   * Pan-fine value in degrees
   * 
   * @type {Number}
   */
  get panFine() {
    return this._panFine || 0.0;
  }

  /**
   * Tilt value in degrees
   * 
   * @type {Number}
   */
  get tilt() {
    return this._tilt || 0.0;
  }

  /**
   * Tilt-fine value in degrees
   * 
   * @type {Number}
   */
  get tiltFine() {
    return this._tiltFine || 0.0;
  }

  /**
   * Beam intensity
   * @todo path shutter bug 
   * 
   * @type {Number}
   */
  get intensity() {
    return this._intensity * this._shutter || 0.0;
  }

  /**
   * Beam radius
   * 
   * @type {Number}
   * @private
   */
  get radius() {
    var angle = MovingHead.degToRad(this._angle);
    var height = BEAM_TOP_RADIUS / Math.tan(angle) + BEAM_LENGTH;
    var radius = Math.tan(angle) * height;
    return radius;
  }

  /**
   * Vertex scaling factor used for angle definition through vertex transformation
   * 
   * @type {Number}
   * @todo check if it is used
   * @private
   */
  get vertexScaleFactor() {
    return this.radius / BEAM_TOP_RADIUS;
  }

  /**
   * Moving Head position in 3D space
   * 
   * @type {Object}
   */
  get position() {
    return this._position;
  }

  /**
   * Moving Head rotaition in 3D space
   * 
   * @type {Object}
   */
  get rotation() {
    return this._rotation;
  }

  /**
   * Beam strobe frequency in HZ
   * 
   * @type {Number}
   */
  get strobeFrequency() {
    return this._strobeFrequency;
  }


  /**
   * Beam instance highlighting state
   * 
   * @type {Boolean}
   * @private
   */
  get highlighted() {
    return this._highlighted;
  }

  set id(id) {
    this._id = id;
  }

  set strobeFrequency(frequency) {
    this._strobeFrequency = Math.round(frequency);
  }

  set zoom(zoomValue) {
    let angle = this._maxAngle * (zoomValue / 100);
    let clampedAngleValue = Math.min(angle / 2, BEAM_MAX_ANGLE);
    this._angle = clampedAngleValue
    this._spotLight.angle = MovingHead.degToRad(this._angle);
    angle_buffer_attribute.setY(this._id, 1.0);
    angle_buffer_attribute.setX(this._id, this._angle);
    angle_buffer_attribute.needsUpdate = true;
  }

  set focus(focus) {
    this._spotLight.penumbra = Math.max(SPOTLIGHT_PHYSICALLY_CORRECT_PENUMBRA - SPOTLIGHT_PHYSICALLY_CORRECT_PENUMBRA * (focus / 100), 0.3);
  }

  set angle(angle) {
    let clampedAngleValue = Math.min(angle / 2, BEAM_MAX_ANGLE);
    if (clampedAngleValue != this._angle) {
      this._angle = clampedAngleValue
      this._spotLight.angle = MovingHead.degToRad(this.angle);
      angle_buffer_attribute.setY(this._id, 1.0);
      angle_buffer_attribute.setX(this._id, this.angle);
    } else {
      angle_buffer_attribute.setY(this._id, 0.0);
    }
    angle_buffer_attribute.needsUpdate = true;
  }

  /**
   * Color wheel slot value
   * 
   * @type {Number}
   */
  set colorWheelSlot(slotId) {
    if (this._colorWheel.length && slotId < this._colorWheel.length) {
      let slotValue = this._colorWheel[slotId];
      if (slotValue.type == SLOT_TYPES.COLOR) {
        this.color = slotValue.colors ? slotValue.colors[0] : 'white';
      } else if (slotValue.type == SLOT_TYPES.OPEN) {
        this.colorTemp = this._colorTemp;
      }
    }
  }

  // set gobo(goboId){
  //     if(this.gobos.length && goboId < this.gobos.length){

  //     }
  // }

  /**
   * Color preset slot value
   * 
   * @type {Number}
   */
  set colorPreset(value) {
    if (value) {
      this._activeColorPreset = true;
      this.color = value;
    } else {
      this._activeColorPreset = false;
    }
  }

  set color(color) {
    this._color = color instanceof THREE.Color ? color : new THREE.Color(color);
    this._spotLight.color = this._color;
    color_buffer_attribute.setXYZ(this._id, this._color.r, this._color.g, this._color.b);
    color_buffer_attribute.needsUpdate = true;
  }

  /**
   * Bulb/Beam color temperature in Kelvin
   * props to:  http://www.tannerhelland.com/4435/convert-temperature-rgb-algorithm-code/
   * 
   * @type {Number}
   */
  set colorTemp(colorTemp = DEFAULT_COLOR_TEMP) {
    var temp = colorTemp / 100;
    var rgbData = [0, 0, 0]
    if (temp <= 66) {
      rgbData = [
        255,
        99.4708025861 * Math.log(temp) - 161.1195681661,
        temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307
      ]
    } else {
      rgbData = [
        329.698727446 * Math.pow(temp - 60, -0.1332047592),
        288.1221695283 * Math.pow(temp - 60, -0.0755148492),
        255
      ]
    }
    this._colorTemp = colorTemp;
    this.color = `rgb(
            ${Math.round(Math.min(Math.max(rgbData[0], 0), 255))},
            ${Math.round(Math.min(Math.max(rgbData[1], 0), 255))},
            ${Math.round(Math.min(Math.max(rgbData[2], 0), 255))}
        )`;
  }

  /**
   * Single color-chanel intensity value (RGBCMY...)
   * 
   * @type {Object}
   */
  set colorIntensity(channelData) {
    if (!this._activeColorPreset) {
      let color_tmp = this.color;
      let channel = channelData.color.toLowerCase().charAt(0);
      switch (channel) {
        case "r":
        case "g":
        case "b":
          color_tmp[channel] = Math.max(channelData.colorBrightness, 0.00001);
          this.color = color_tmp;
          break;
        case "c":
          color_tmp.r = Math.max(1.0 - channelData.colorBrightness, 0.00001);
          this.color = color_tmp;
          break;
        case "m":
          color_tmp.g = Math.max(1.0 - channelData.colorBrightness, 0.00001);
          this.color = color_tmp;
          break;
        case "y":
          color_tmp.b = Math.max(1.0 - channelData.colorBrightness, 0.00001);
          this.color = color_tmp;
          break;
      }
    }
  }

  set pan(panAngle) {
    this._pan = panAngle;
    this._yokeDummy.rotation.z = MovingHead.degToRad((this.pan + this.panFine) - this.maxPan / 2);
    this._matrixNeedsUpdate = true;
  }

  set panFine(fineAngle) {
    this._panFine = fineAngle;
    this._yokeDummy.rotation.z = MovingHead.degToRad((this.pan + this.panFine) - this.maxPan / 2);
    this._matrixNeedsUpdate = true;
  }

  set tilt(tiltAngle) {
    this._tilt = tiltAngle;
    this._headDummy.rotation.x = MovingHead.degToRad((this.tilt + this.tiltFine) - this.maxTilt / 2);
    this._matrixNeedsUpdate = true;
  }

  set tiltFine(fineAngle) {
    this._tiltFine = fineAngle;
    this._headDummy.rotation.x = MovingHead.degToRad((this.tilt + this.tiltFine) - this.maxTilt / 2);
    this._matrixNeedsUpdate = true;
  }

  set intensity(intensity) {
    this._intensity = Math.min(Math.abs(intensity), 1.0);
    this._spotLight.intensity = SPOTLIGHT_PHYSICALLY_CORRECT_INTENSITY * this._intensity;
    intensity_buffer_attribute.setX(this._id, this._intensity);
    intensity_buffer_attribute.needsUpdate = true;
  }

  set position(positionVector) {
    this._position = positionVector;
    this._dummy.position.set(
      positionVector.x,
      positionVector.y,
      // positionVector.z
      Math.max(positionVector.z, 0.51)
    );
    this._matrixNeedsUpdate = true;
  }

  set rotation(rotationVector) {
    this._rotation = rotationVector;
    this._dummy.rotation.set(
      rotationVector.x,
      rotationVector.y,
      rotationVector.z
    );
    this._matrixNeedsUpdate = true;
  }

  set highlighted(state) {
    this._highlighted = state;
    emissive_buffer_attribute.setX(this._id, this._highlighted ? 1.0 : 0.0);
    emissive_buffer_attribute.needsUpdate = true;
  }

  /**
   * Hilight a single moving head instance within the pool
   *
   * @param {Boolean} state highlighting state
   * @memberof MovingHead
   */
  setSinglyHighlighted(state) {
    instances.forEach(instance => {
      instance.highlighted = false
    })
    this.highlighted = state;
  }

  /**
   * Prepare new moving head instance
   *
   * @private
   */
  prepareInstance() {
    this._dummy = new THREE.Object3D();
    this._headDummy = new THREE.Object3D();
    this._yokeDummy = new THREE.Object3D();
    this._beamDummy = new THREE.Object3D();
    this._targetDummy = new THREE.Object3D();
    this._boxHelperDummy = new THREE.Object3D();

    this._spotLight = new THREE.SpotLight(
      this.colorTemp,
      SPOTLIGHT_PHYSICALLY_CORRECT_INTENSITY,
      SPOTLIGHT_PHYSICALLY_CORRECT_DISTANCE,
      MovingHead.degToRad(this.angle),
      SPOTLIGHT_PHYSICALLY_CORRECT_PENUMBRA,
      SPOTLIGHT_PHYSICALLY_CORRECT_DECAY
    )


    this._spotLight.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
    this._spotLight.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, .9))

    this._dummy.add(this._yokeDummy);

    this._yokeDummy.attach(this._headDummy);
    this._headDummy.attach(this._beamDummy);
    this._beamDummy.attach(this._targetDummy);
    this._beamDummy.attach(this._spotLight);


    this._spotLight.target = this._targetDummy;

    baseMesh.count = instanceCount;
    yokeMesh.count = instanceCount;
    headMesh.count = instanceCount;
    beamMesh.count = instanceCount;
    // capMesh.count = instanceCount;
    boxHelperMesh.count = 0;

    scene_handle.add(this._dummy)

    instances.push(this);

    this._matrixNeedsUpdate = true;

  }

  /**
   * Updates the Moving Head instance and childs matrixworld
   * 
   * @private
   */
  updateMatrix() {
    if (this._matrixNeedsUpdate) {
      this._dummy.updateMatrixWorld();
      this._yokeDummy.updateMatrixWorld();
      this._headDummy.updateMatrixWorld();
      this._beamDummy.updateMatrixWorld();
      this._targetDummy.updateMatrixWorld();
      baseMesh.setMatrixAt(this._id, this._dummy.matrixWorld);
      yokeMesh.setMatrixAt(this._id, this._yokeDummy.matrixWorld);
      headMesh.setMatrixAt(this._id, this._headDummy.matrixWorld);
      beamMesh.setMatrixAt(this._id, this._beamDummy.matrixWorld);
      capMesh.setMatrixAt(this._id, this._targetDummy.matrixWorld);
      boxHelperMesh.setMatrixAt(this._id, this._dummy.matrixWorld);
      baseMesh.instanceMatrix.needsUpdate = true;
      yokeMesh.instanceMatrix.needsUpdate = true;
      headMesh.instanceMatrix.needsUpdate = true;
      beamMesh.instanceMatrix.needsUpdate = true;
      capMesh.instanceMatrix.needsUpdate = true;
      boxHelperMesh.instanceMatrix.needsUpdate = true;
    }
  }

  updateDirectionVector() {
    this._beamDummy.getWorldDirection(vector_beam.normalize());
    direction_buffer_attribute.setXYZ(this._id, vector_beam.x, vector_beam.y, vector_beam.z);
    direction_buffer_attribute.needsUpdate = true;
    this._beamDummy.getWorldPosition(vector_beam_pos.normalize());
    position_buffer_attribute.setXYZ(this._id, vector_beam_pos.x, vector_beam_pos.y, vector_beam_pos.z);
    position_buffer_attribute.needsUpdate = true;
  }

  updateStrobe(t) {

    if (this._strobeFrequency > 0.0) {
      this._shutter = Math.sin(2.0 * Math.PI * this._strobeFrequency * t) > 0.0 ? SHUTTER_VALUE.OPEN : SHUTTER_VALUE.CLOSED;
    } else {
      this._shutter = 1.0;
    }

    this._spotLight.intensity = SPOTLIGHT_PHYSICALLY_CORRECT_INTENSITY * this.intensity * this._shutter;
    intensity_buffer_attribute.setX(this._id, this.intensity * this._shutter);
    intensity_buffer_attribute.needsUpdate = true;
  }

  update(t) {
    this.updateStrobe(t);
    this.updateMatrix();
    this.updateDirectionVector();
  }

  static degToRad(degAngle) {
    return degAngle * (Math.PI / 180);
  }

  static prepareModelInstance() {

    let model = ModelInstancer.models.visualizer.models.scenography.beam;
    let base = model.children[0];
    let yoke = model.children[2];
    let head = model.children[1];

    base.geometry.rotateX(Math.PI / 2)
    yoke.geometry.rotateX(Math.PI / 2)
    head.geometry.rotateX(Math.PI / 2)

    base.geometry.translate(0, 0, -.5)
    yoke.geometry.translate(0, 0, -.40)

    THREE.BufferGeometry.prototype.copy.call(baseGeo, base.geometry);
    THREE.BufferGeometry.prototype.copy.call(yokeGeo, yoke.geometry);
    THREE.BufferGeometry.prototype.copy.call(headGeo, head.geometry);

    baseGeo.setAttribute('highlight', emissive_buffer_attribute);
    yokeGeo.setAttribute('highlight', emissive_buffer_attribute);
    headGeo.setAttribute('highlight', emissive_buffer_attribute);

    baseMesh = new THREE.InstancedMesh(baseGeo, MODEL_MATERIAL, MAX_INSTANCES);
    yokeMesh = new THREE.InstancedMesh(yokeGeo, MODEL_MATERIAL, MAX_INSTANCES);
    headMesh = new THREE.InstancedMesh(headGeo, MODEL_MATERIAL, MAX_INSTANCES);

    baseMesh.instanceCount = instanceCount;
    yokeMesh.instanceCount = instanceCount;
    yokeMesh.instanceCount = instanceCount;

    baseMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    yokeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    headMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    baseMesh.instanceMatrix.needsUpdate = true;
    yokeMesh.instanceMatrix.needsUpdate = true;
    headMesh.instanceMatrix.needsUpdate = true;

  }

  static prepareBeamInstance() {

    let beamGeometry = new THREE.CylinderGeometry(
      BEAM_TOP_RADIUS,
      BEAM_TOP_RADIUS,
      BEAM_LENGTH,
      BEAM_RESOLUTION,
      BEAM_SEGMENTS,
      true
    );

    beamGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -beamGeometry.parameters.height / 2, 0));
    beamGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    beamGeometry.applyMatrix4(new THREE.Matrix4().setPosition(0, 0, .258));

    THREE.BufferGeometry.prototype.copy.call(beamGeo, beamGeometry);

    var verticesIndexBuffer = [];
    for (let i = 0; i < beamGeo.attributes.position.count; i++) {
      verticesIndexBuffer[i] = i
    }
    var indexAttributes = new THREE.BufferAttribute(
      new Float32Array(verticesIndexBuffer), 1
    ).setUsage(THREE.StaticDrawUsage);

    beamGeo.setAttribute('index', indexAttributes);
    beamGeo.setAttribute('wpos', position_buffer_attribute);
    beamGeo.setAttribute('direction', direction_buffer_attribute);
    beamGeo.setAttribute('color', color_buffer_attribute);
    beamGeo.setAttribute('intensity', intensity_buffer_attribute);
    beamGeo.setAttribute('angle', angle_buffer_attribute);

    beamMesh = new THREE.InstancedMesh(beamGeo, new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      clipping: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: VOLUMETRIC_VERTEX_SHADER,
      fragmentShader: VOLUMETRIC_FRAGMENT_SHADER,
      fog: false,
      toneMapped: false,
      dithering: false,
      uniforms: {
        cameraDir: {
          type: "v3",
          value: vector_cam
        },
        cameraPos: {
          type: "v3",
          value: vector_cam_pos
        },
        vertexCount: {
          type: "f",
          value: beamGeo.attributes.position.count
        },
        topRadius: {
          type: "f",
          value: BEAM_TOP_RADIUS
        },
        length: {
          type: "f",
          value: BEAM_LENGTH
        },
        time: {
          type: "f",
          value: 0.0
        },
        fogState: {
          type: "b",
          value: true
        },
        fogFactor: {
          type: "f",
          value: 1.0
        },
        fogTurbulence: {
          type: "f",
          value: 1.0
        },
        glowFactor: {
          type: "f",
          value: 1.0
        }
      },
    }), MAX_INSTANCES);

    beamMesh.instanceCount = instanceCount;
    beamMesh.frustumCulled = true;
    beamMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    beamMesh.instanceMatrix.needsUpdate = true;

  }

  static prepareCapInstance() {

    let capGeometry = new THREE.CircleGeometry(BEAM_TOP_RADIUS, 40);
    let capMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide
    })

    capGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, .255));

    THREE.BufferGeometry.prototype.copy.call(targetGeo, capGeometry);

    capMesh = new THREE.InstancedMesh(targetGeo, capMaterial, MAX_INSTANCES);

    capMesh.instanceCount = instanceCount;
    capMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    capMesh.instanceMatrix.needsUpdate = true;

  }

  static prepareBoxHelperInstance() {

    let boxHelperGeometry = new THREE.BoxGeometry(1, 1, 1);
    let boxHelperMaterial = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      wireframe: true,
      color: 'rgb(30, 69, 185)',
      transparent: true,
      opacity: .5,
    })

    boxHelperGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -0.15));

    THREE.BufferGeometry.prototype.copy.call(boxHelperGeo, boxHelperGeometry);

    boxHelperMesh = new THREE.InstancedMesh(boxHelperGeo, boxHelperMaterial, MAX_INSTANCES);

    boxHelperMesh.instanceCount = instanceCount;
    boxHelperMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    boxHelperMesh.instanceMatrix.needsUpdate = true;

  }

  static prepareInstanciation(camera, scene) {
    camera_handle = camera;
    scene_handle = scene;
    MovingHead.prepareModelInstance();
    MovingHead.prepareBeamInstance();
    MovingHead.prepareCapInstance();
    MovingHead.prepareBoxHelperInstance();

    scene.add(baseMesh, yokeMesh, headMesh, beamMesh, capMesh, boxHelperMesh);
  }

  static update(t) {
    instances.forEach(instance => {
      instance.update(t);
    })
    beamMesh.material.uniforms.time.value = t;
    camera_handle.getWorldDirection(vector_cam.normalize());
    beamMesh.material.uniforms.cameraDir.value = vector_cam;
    camera_handle.getWorldPosition(vector_cam_pos.normalize());
    beamMesh.material.uniforms.cameraPos.value = vector_cam_pos;
  }

  static deleteInstance(instance) {
    scene_handle.remove(instance._headDummy);
    scene_handle.remove(instance._yokeDummy);
    scene_handle.remove(instance._beamDummy);
    scene_handle.remove(instance._spotLight);
    scene_handle.remove(instance._dummy);

    instances.splice(instance.id, 1)
    for (let i = instance.id; i < instanceCount - 1; i++) {
      instances[i].id--;
    }
    instance = null;
    instanceCount--;

    baseMesh.count = instanceCount;
    yokeMesh.count = instanceCount;
    headMesh.count = instanceCount;
    beamMesh.count = instanceCount;
    capMesh.count = instanceCount;
    boxHelperMesh.count = 0;

  }

  static getBA() {
    return position_buffer_attribute;
  }

  static get fogState() {
    return beamMesh.material.uniforms.fogState.value;
  }

  static get fogDensity() {
    return beamMesh.material.uniforms.fogFactor.value;
  }

  static get fogTurbulence() {
    return beamMesh.material.uniforms.fogTurbulence.value;
  }

  static set fogState(value) {
    beamMesh.material.uniforms.fogState.value = value
  }

  static set fogDensity(value) {
    beamMesh.material.uniforms.fogFactor.value = value;
  }

  static set fogTurbulence(value) {
    beamMesh.material.uniforms.fogTurbulence.value = value;
  }


}

export default MovingHead;