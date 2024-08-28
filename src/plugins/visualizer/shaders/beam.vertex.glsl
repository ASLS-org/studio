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
vec3 computeRadiusVertexScaleFactor(vec3 vector) {
  if(index >= vertexCount / 2.0) {
    float height = topRadius / tan(radians(angle.x)) + length + 20.0; //20.0 offset seems to be do the job taking into accont that light is emitted from a conical frustum.. There should be a formula capable of handling that more accurately though
    float radius = tan(radians(angle.x)) * height;
    float scaleFactor = radius / topRadius;
    return vector * vec3(scaleFactor, scaleFactor, 1.5);
  }
  return vector;
}

void main() {
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
  vWorldPosition = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(vPosition, 1.0);      //Determining vertex worldspace coordinates
  vNormal = vec3(viewMatrix * modelMatrix * instanceMatrix * vec4(normal, 0.0));  //Computing instance normal

  gl_Position = vWorldPosition;   //Setting up fragment world position 
}
