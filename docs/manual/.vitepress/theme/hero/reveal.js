/*
 * Liquid reveal: a full-screen WebGL pass that covers the stage in the page's darkest colour and
 * dissolves it as the reader scrolls, along a slowly flowing, domain-warped noise field that opens
 * the centre first. Drawn only while the reveal is in progress, at a reduced resolution.
 *
 * Client only.
 */

const VERTEX = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;
uniform vec2 uResolution;
uniform float uProgress;
uniform float uTime;
uniform vec3 uColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 q = (uv - vec2(0.5, 0.55)) * vec2(uResolution.x / uResolution.y, 1.0);
  // Domain warp: the field flows like a liquid
  vec2 warp = vec2(
    fbm(q * 1.6 + vec2(0.0, uTime * 0.06)),
    fbm(q * 1.6 + vec2(5.2, -uTime * 0.05))
  );
  float n = fbm(q * 2.4 + warp * 1.8 + uTime * 0.03);
  // The centre opens first, the edges last
  float field = n * 0.9 + length(q * vec2(0.85, 1.0)) * 0.75;
  float threshold = mix(-0.15, 1.85, uProgress);
  float cover = smoothstep(threshold - 0.09, threshold + 0.09, field);
  gl_FragColor = vec4(uColor * cover, cover);
}
`;

/**
 * Compiles a shader
 * @param {WebGLRenderingContext} gl context
 * @param {Number} type shader type
 * @param {String} source GLSL
 * @returns {WebGLShader} shader
 */
function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

/**
 * Reads a CSS colour as 0..1 RGB
 * @param {String} color any CSS colour
 * @returns {Array<Number>} [r, g, b]
 */
function rgbOf(color) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

/**
 * Liquid reveal overlay
 */
export default class LiquidReveal {
  /**
   * @param {HTMLCanvasElement} canvas overlay canvas (sized by CSS)
   * @param {String} color cover colour (CSS)
   * @param {Number} [scale=0.5] resolution scale
   */
  constructor(canvas, color, scale = 0.5) {
    this.canvas = canvas;
    this.scale = scale;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    this.uniforms = {
      resolution: gl.getUniformLocation(program, 'uResolution'),
      progress: gl.getUniformLocation(program, 'uProgress'),
      time: gl.getUniformLocation(program, 'uTime'),
      color: gl.getUniformLocation(program, 'uColor'),
    };
    gl.uniform3fv(this.uniforms.color, rgbOf(color));
    this.resize();
  }

  /**
   * Follows the canvas's CSS size
   */
  resize() {
    const { canvas } = this;
    const width = Math.max(1, Math.round(canvas.clientWidth * this.scale));
    const height = Math.max(1, Math.round(canvas.clientHeight * this.scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      this.gl.viewport(0, 0, width, height);
      this.gl.uniform2f(this.uniforms.resolution, width, height);
    }
  }

  /**
   * Draws the cover
   * @param {Number} progress 0 (covered) … 1 (revealed)
   * @param {Number} time seconds
   */
  render(progress, time) {
    const { gl, uniforms } = this;
    gl.uniform1f(uniforms.progress, progress);
    gl.uniform1f(uniforms.time, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
