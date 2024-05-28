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
  return mod289(((x * 34.0) + 10.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

  // Permutations
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  //Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

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
varying vec3 beamPos;           //Vertex local position
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
float fogging(vec3 coord) {
  float fog = 0.0;
  fog += abs(snoise(coord)) * 1.0;
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
vec3 rgb2hsv(vec3 c) {
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
vec3 hsv2rgb(vec3 c) {
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
float computeFog(float minValue) {
  if(fogState) {
    float fogPositionFactor = fogFactor * 30.0;
    float fogTime = time / (30.0 / fogTurbulence);
    vec3 fogCoord = vec3(vWorldPosition.x / fogPositionFactor, vWorldPosition.y / fogPositionFactor, fogTime);
    return max(fogging(fogCoord), minValue);
  } else {
    return 1.0;
  }
}

/**
 * @function recomputeVertexNormal
 * @brief computes vertex's normal. (e.g Vertex displacement happened in the shader.)
 * @returns vec3 the vertex's normal
 */
vec3 recomputeVertexNormal() {
  vec3 X = dFdx(vWorldPosition.xyz);
  vec3 Y = dFdy(vWorldPosition.xyz);
  return normalize(cross(X, Y));
}

void main() {
  #include <clipping_planes_fragment>

  vec3 normal = recomputeVertexNormal();

  vec3 dirCamToLight = normalize(cameraPos - beamPos);
  float alignmentFactor = 1.0 - abs(dot(vDirection, dirCamToLight));
  float glareFactor = min(max(1.0 - (dot(-cameraDir, vDirection)), abs(sin(radians(vAngle)))), 0.5);
  float distance = sqrt(pow(vPosition.x, 2.0) + pow(vPosition.y, 2.0) + pow(vPosition.z, 2.0));
  float attenuation = 2.0 / (1.0 + alignmentFactor * distance + radians(vAngle) * distance * distance);
  float anglePower = pow(dot(normalize(vWorldPosition.xyz), (normal)), 4.0 * alignmentFactor);

  float intensity = attenuation * anglePower;

  vec3 hsvColor = rgb2hsv(vColor);
  hsvColor.z = hsvColor.z > 0.001 ? hsvColor.z * intensity : 0.0;
  vec3 rgbColor = hsv2rgb(hsvColor);

  gl_FragColor = vec4(rgbColor * computeFog(intensity) * vIntensity, 1.0);

}
