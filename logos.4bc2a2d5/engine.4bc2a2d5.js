// The renderer every logo shares: one clay material (a ramp from deep to light by how much a surface faces the light, a
// soft top-to-bottom lift across the frame, a small highlight, and an optional warm band of light that runs along the
// figure) in the swatch's orange or in one of the rainbow modes (COLOURS), an orthographic camera fitted to the figure, and `mount`, which draws a figure at any time t so a
// loop can be played live or captured frame by frame.
import * as THREE from 'three';

export const PALETTE = { deep: '#C25F22', base: '#F0A156', light: '#FFDDBA', glow: '#A88160' }; // base: the swatch; glow: what the band adds

// the rainbow modes: one hue for the whole figure tweening through the spectrum (cycle), a full rainbow running round the
// path (flow), a hue to each side of the band that rolls with its twist (faces), a rainbow turning round the centre (spin)
// and diagonal bands of colour sliding across (sweep). A hue that varies over the surface comes in per vertex as a point
// on a circle (aFlow, aFace) and is read back with atan, so it never smears from violet back to red inside a triangle
export const COLOURS = ['orange', 'cycle', 'flow', 'faces', 'spin', 'sweep'];

const VERT = /* glsl */ `
attribute float aS;
attribute vec2 aFlow, aFace;
varying vec3 vN;
varying vec2 vScr, vFlow, vFace;
varying float vS;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vS = aS;
  vFlow = aFlow;
  vFace = aFace;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vScr = gl_Position.xy / gl_Position.w;
}`;

const FRAG = /* glsl */ `
uniform vec3 uDeep, uBase, uLight, uGlow, uLightDir, uView;
uniform float uBand, uPhase, uLen, uWidth, uMode, uHue;
varying vec3 vN;
varying vec2 vScr, vFlow, vFace;
varying float vS;
const float TAU = 6.2831853;
vec3 hsl(float h, float s, float l) {
  vec3 k = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return pow(l + s * (k - 0.5) * (1.0 - abs(2.0 * l - 1.0)), vec3(2.2)); // to linear, as the uniforms are
}
void main() {
  vec3 n = normalize(vN);
  vec3 l = normalize(uLightDir);
  float t = clamp((dot(n, l) - 0.2) / 0.65, 0.0, 1.0);
  vec3 deep = uDeep, base = uBase, light = uLight;
  if (uMode > 0.5) {
    float h = uMode < 1.5 ? uHue
      : uMode < 2.5 ? atan(vFlow.y, vFlow.x) / TAU - uHue
      : uMode < 3.5 ? atan(vFace.y, vFace.x) / TAU
      : uMode < 4.5 ? atan(vScr.y, vScr.x) / TAU - uHue
      : (vScr.x - vScr.y) * 0.4 - uHue;
    h = fract(h);
    deep = hsl(h, 0.75, 0.40);
    base = hsl(h, 0.85, 0.58);
    light = hsl(h, 0.9, 0.82);
  }
  vec3 c = t < 0.5 ? mix(deep, base, t * 2.0) : mix(base, light, t * 2.0 - 1.0);
  c *= 0.95 + 0.1 * (vScr.y * 0.5 + 0.5);
  c += pow(max(dot(n, normalize(l + uView)), 0.0), 48.0) * 0.1;
  if (uBand > 0.0) {
    float x = mod(vS - uPhase * uLen, uLen);
    x = min(x, uLen - x);
    c += uGlow * uBand * exp(-x * x / (uWidth * uWidth)); // added, so each face keeps its shade under the light
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export function clayMaterial({ lightDir, view, band = 0, len = 1, width = 1, colour = 'orange' }) {
  if (!COLOURS.includes(colour)) throw new Error(`unknown colour mode ${colour}`);
  const color = (hex) => ({ value: new THREE.Color(hex) });
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uDeep: color(PALETTE.deep), uBase: color(PALETTE.base), uLight: color(PALETTE.light), uGlow: color(PALETTE.glow),
      uLightDir: { value: lightDir.clone() }, uView: { value: view.clone().normalize() },
      uBand: { value: band }, uPhase: { value: 0 }, uLen: { value: len }, uWidth: { value: width },
      uMode: { value: COLOURS.indexOf(colour) }, uHue: { value: 0 },
    },
  });
}

// an orthographic camera looking along -view at the points' centre, square, with a margin around their silhouette
export function fitCamera(points, view, margin = 1.14) {
  const back = view.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0).sub(back.clone().multiplyScalar(back.y)).normalize();
  const right = new THREE.Vector3().crossVectors(up, back).normalize();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    const x = p.dot(right), y = p.dot(up);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const half = (Math.max(maxX - minX, maxY - minY) / 2) * margin;
  const centre = right.clone().multiplyScalar((minX + maxX) / 2).add(up.clone().multiplyScalar((minY + maxY) / 2));
  const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 1000);
  camera.up.copy(up);
  camera.position.copy(centre).add(back.multiplyScalar(200));
  camera.lookAt(centre);
  return camera;
}

// draws `figure` (lattice.4bc2a2d5.js, sweep.4bc2a2d5.js) into `canvas`; `capture` keeps the buffer for toDataURL
export function mount(canvas, figure, { size = 512, pixelRatio = 2, capture = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: capture });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(size, size, false);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(figure.object);
  return {
    period: figure.period,
    renderAt(t) {
      figure.update(((t % figure.period) + figure.period) % figure.period);
      renderer.render(scene, figure.camera);
    },
  };
}

export const smoothstep = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
export const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
// overshoots a little and settles, for a cube popping into place
export const easeOutBack = (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;
