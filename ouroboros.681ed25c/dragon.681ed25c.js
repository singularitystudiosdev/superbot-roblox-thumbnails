// The ouroboros: a dragon biting its own tail, round a ring. Everything is laid out in a straight strip first and then
// bent round the circle: x runs along the ring from the neck toward the tail (clockwise on screen), y outward (the
// dragon's back faces out, its belly in), z toward the viewer. The body is a tube that tapers to a thin tail running back
// in between the jaws (head.681ed25c.js), with spines along its back. The loops slide the spines down the body and into
// the mouth, so the dragon swallows itself forever, or bend, swell, bite, turn or grow it.
import * as THREE from 'three';
import { clayMaterial, fitCamera, smoothstep, easeInOutCubic, easeOutBack } from '../logos.4bc2a2d5/engine.4bc2a2d5.js';
import { headMeshes, EYE, HINGE } from './head.681ed25c.js';

const FRONT = new THREE.Vector3(0, 0, 1);
const LIGHT = new THREE.Vector3(-0.55, 0.8, 0.6);
const R = 1, CIRC = Math.PI * 2 * R;
const THETA0 = Math.PI / 2 - 0.3; // the neck's angle on the ring, so the head sits at the top
const X0 = 0, X1 = CIRC - 0.2; // the body, from inside the neck round to its tail tip inside the mouth
const R_MAX = 0.145, R_TIP = 0.024;
const NU = 420, M = 32, CAP = 6; // rings along the body, points round each ring, rings in each rounded end
const SPACING = 0.17; // between spines at the neck; they close up as the body thins
const JAW = 0.015; // how far the jaw hangs open at rest, in radians: just enough to close on the tail

const radius = (s) => R_TIP + (R_MAX - R_TIP) * Math.cos((Math.PI / 2) * Math.min(1, Math.max(0, s)) ** 1.6);
const crowd = (s) => (radius(s) / R_MAX) ** 0.75; // how far apart the spines sit there, against the neck

// the spines' own coordinate along the body, m: they sit one STEP apart in m, which closes them up as the body thins
const TABLE = 2048;
const M_AT = new Float64Array(TABLE + 1);
for (let i = 1; i <= TABLE; i++) M_AT[i] = M_AT[i - 1] + (X1 - X0) / TABLE / crowd((i - 0.5) / TABLE);
const M_TOTAL = M_AT[TABLE];
export const SPINES = Math.round(M_TOTAL / SPACING);
const STEP = M_TOTAL / SPINES;
function sOfM(m) {
  let lo = 0, hi = TABLE;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (M_AT[mid] <= m) lo = mid;
    else hi = mid;
  }
  return (lo + Math.min(1, Math.max(0, (m - M_AT[lo]) / (M_AT[hi] - M_AT[lo])))) / TABLE;
}

// a mesh whose vertices are placed in the strip and bent round the ring as they are written
function part(count, index, material) {
  const g = new THREE.BufferGeometry();
  const attr = (n) => new THREE.BufferAttribute(new Float32Array(count * n), n);
  g.setAttribute('position', attr(3));
  g.setAttribute('normal', attr(3));
  g.setAttribute('aS', attr(1));
  g.setAttribute('aFlow', attr(2));
  g.setAttribute('aFace', attr(2));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  return mesh;
}

// vertex v from its strip position; yc is the y of the line the hue turns round (the body's centre, or the mouth line).
// aS: how far along the ring, for the light; aFlow: that as a point on a circle; aFace: the angle round the body
function put(g, v, x, y, z, yc) {
  const phi = THETA0 - x / R, rho = R + y;
  const p = g.attributes.position.array, f = g.attributes.aFlow.array, c = g.attributes.aFace.array;
  p[v * 3] = rho * Math.cos(phi);
  p[v * 3 + 1] = rho * Math.sin(phi);
  p[v * 3 + 2] = z;
  g.attributes.aS.array[v] = x;
  const u = (Math.PI * 2 * x) / CIRC, a = Math.atan2(z, y - yc);
  f[v * 2] = Math.cos(u);
  f[v * 2 + 1] = Math.sin(u);
  c[v * 2] = Math.cos(a);
  c[v * 2 + 1] = Math.sin(a);
}

// a strip normal at (x, y) bent with it: the bend stretches x by (R + y) / R, so the normal's x shrinks by that
function putNormal(g, v, x, y, nx, ny, nz) {
  const phi = THETA0 - x / R, sx = (nx * R) / (R + y);
  const wx = sx * Math.sin(phi) + ny * Math.cos(phi), wy = -sx * Math.cos(phi) + ny * Math.sin(phi);
  const len = Math.hypot(wx, wy, nz) || 1;
  const n = g.attributes.normal.array;
  n[v * 3] = wx / len;
  n[v * 3 + 1] = wy / len;
  n[v * 3 + 2] = nz / len;
}

const touch = (g, normals) => {
  for (const name of ['position', 'aS', 'aFlow', 'aFace']) g.attributes[name].needsUpdate = true;
  if (normals) g.attributes.normal.needsUpdate = true;
  else g.computeVertexNormals();
};

function tubeIndex(rings, around) {
  const index = [];
  for (let q = 0; q < rings - 1; q++) for (let j = 0; j < around; j++) {
    const a = q * around + j, b = q * around + ((j + 1) % around), c = a + around, d = b + around;
    index.push(a, b, c, b, d, c);
  }
  return new Uint32Array(index);
}

// the body's centre line and radius at s (0 the neck, 1 the tail tip) under a loop's state
const centre = (st, s) => [X0 + s * (X1 - X0), st.wave ? st.wave(s) : 0];
const thickness = (st, s) => radius(s) + (st.swell ? st.swell(s) : 0);
function frameAt(st, s) {
  const [x, y] = centre(st, s), e = 1e-3;
  const [xa, ya] = centre(st, s - e), [xb, yb] = centre(st, s + e);
  const len = Math.hypot(xb - xa, yb - ya);
  const tx = (xb - xa) / len, ty = (yb - ya) / len;
  return { x, y, tx, ty, nx: -ty, ny: tx };
}

function placeBody(g, st) {
  const [s0, s1] = st.range ?? [0, 1];
  const rings = NU + 2 * CAP;
  for (let q = 0; q < rings; q++) {
    // the rounded ends: a quarter circle of rings closing to a point past each end of the tube
    const k = q < CAP ? CAP - q : q >= CAP + NU ? q - CAP - NU + 1 : 0;
    const beta = (Math.PI / 2) * (k / CAP), dir = q < CAP ? -1 : 1;
    const s = q < CAP ? s0 : q >= CAP + NU ? s1 : s0 + ((s1 - s0) * (q - CAP)) / (NU - 1);
    const f = frameAt(st, s), r = thickness(st, s) * Math.cos(beta), off = dir * thickness(st, s) * Math.sin(beta);
    for (let j = 0; j < M; j++) {
      const a = (Math.PI * 2 * j) / M, up = r * Math.cos(a);
      put(g, q * M + j, f.x + f.nx * up + f.tx * off, f.y + f.ny * up + f.ty * off, r * Math.sin(a), f.y);
    }
  }
  touch(g, false);
}

// one spine: a thorn whose blade runs along the body and leans back toward the tail. Each entry is a vertex as
// [lean, length, height, thickness] multipliers; the base ring sits below the skin
const SPINE_RINGS = 6, SPINE_AROUND = 10;
const SPINE = [];
for (let i = 0; i < SPINE_RINGS; i++) {
  const v = -0.25 + (1.25 * i) / SPINE_RINGS, w = (1 - Math.max(0, v)) ** 0.9;
  for (let k = 0; k < SPINE_AROUND; k++) {
    const c = (Math.PI * 2 * k) / SPINE_AROUND;
    SPINE.push([0.55 * Math.max(0, v) ** 1.6, w * Math.cos(c), v, w * Math.sin(c)]);
  }
}
SPINE.push([0.55, 0, 1, 0]); // the tip
const SPINE_INDEX = (() => {
  const index = Array.from(tubeIndex(SPINE_RINGS, SPINE_AROUND));
  const tip = SPINE.length - 1, last = (SPINE_RINGS - 1) * SPINE_AROUND;
  for (let k = 0; k < SPINE_AROUND; k++) index.push(last + k, tip, last + ((k + 1) % SPINE_AROUND));
  return index;
})();

function placeSpines(g, st) {
  const [s0, s1] = st.range ?? [0, 1];
  for (let k = 0; k < SPINES; k++) {
    const m = ((((k + (st.shift ?? 0)) % SPINES) + SPINES) % SPINES) * STEP;
    const s = sOfM(m);
    let scale = st.spineScale ? st.spineScale(k, m / M_TOTAL, s) : 1;
    if (s < s0 || s > s1) scale = 0;
    const f = frameAt(st, s), r = thickness(st, s);
    const bx = f.x + f.nx * r * 0.85, by = f.y + f.ny * r * 0.85;
    const H = 0.95 * radius(s) * scale, L = 0.45 * STEP * crowd(s) * scale, T = 0.3 * radius(s) * scale;
    SPINE.forEach(([lean, len, h, w], i) => {
      const u = lean * H + len * L, v = h * H;
      put(g, k * SPINE.length + i, bx + f.tx * u + f.nx * v, by + f.ty * u + f.ny * v, w * T, f.y);
    });
  }
  touch(g, false);
}

// the head's meshes: the skull once, the jaw turned about its hinge by `open` radians
function placeHead(g, mesh, open = 0) {
  const c = Math.cos(open), s = Math.sin(open);
  for (let v = 0; v < mesh.pos.length / 3; v++) {
    let x = mesh.pos[v * 3], y = mesh.pos[v * 3 + 1], nx = mesh.nor[v * 3], ny = mesh.nor[v * 3 + 1];
    if (open) {
      const dx = x - HINGE[0], dy = y - HINGE[1];
      [x, y] = [HINGE[0] + dx * c - dy * s, HINGE[1] + dx * s + dy * c];
      [nx, ny] = [nx * c - ny * s, nx * s + ny * c];
    }
    put(g, v, x, y, mesh.pos[v * 3 + 2], 0);
    putNormal(g, v, x, y, nx, ny, mesh.nor[v * 3 + 2]);
  }
  touch(g, true);
}

// keyframes: [[p, value], ...] eased between with easeInOutCubic, for the jaw
function keys(frames, p) {
  for (let i = 1; i < frames.length; i++) {
    const [p0, v0] = frames[i - 1], [p1, v1] = frames[i];
    if (p <= p1) return v0 + (v1 - v0) * easeInOutCubic((p - p0) / (p1 - p0 || 1));
  }
  return frames.at(-1)[1];
}

const wrap = (x) => ((x % 1) + 1) % 1;

// each loop's state at p, from 0 to 1 through the loop. shift: how many spines have slid into the mouth; jaw: radians
// open; spin, yaw: turns of the whole figure in the picture plane and about the vertical
const MOTION = {
  // the spines slide down the body and into the jaws: the dragon swallows itself
  swallow: (p, o) => ({ shift: (o.shifts ?? 2) * p }),
  // turns once while the spines near the neck hold still in the picture: it slithers round after its tail
  chase: (p) => ({ shift: Math.round(CIRC / STEP) * p, spin: Math.PI * 2 * p }),
  // opens, bites down, and pulls two spines' worth of tail in with the jaw shut
  chomp: (p) => ({
    jaw: keys([[0, JAW], [0.3, 0.36], [0.4, -0.03], [0.82, -0.03], [1, JAW]], p),
    shift: 2 * easeInOutCubic(smoothstep(0.42, 0.8, p)),
  }),
  // a wave runs down the body from the head; the head and the bitten tail hold still
  slither: (p) => ({ wave: (s) => 0.06 * Math.max(0, Math.sin(Math.PI * s)) ** 1.2 * Math.sin(Math.PI * 2 * (3 * s - p)), shift: p }),
  // a swallowed lump runs from the throat round to the tail and back into the jaws, which gulp as it goes in
  gulp: (p) => {
    const at = -0.08 + 1.16 * p;
    return {
      swell: (s) => 0.075 * smoothstep(0, 0.06, s) * (1 - smoothstep(0.8, 0.98, s)) * Math.exp(-(((s - at) / 0.05) ** 2)),
      jaw: keys([[0, JAW], [0.82, JAW], [0.9, 0.22], [1, JAW]], p),
    };
  },
  // a light runs down the body, into the jaws and out again at the neck
  band: (p) => ({ band: p }),
  // a dip runs down the row of spines, each flattening as it passes
  ripple: (p) => ({ spineScale: (k, u) => 1 - 0.6 * Math.sin(Math.PI * Math.min(1, wrap(u - p) / 0.16)) ** 2 }),
  // a full turn about the vertical, then a rest
  turn: (p) => ({ yaw: Math.PI * 2 * easeInOutCubic(smoothstep(0.22, 1, p)) }),
  // grows round from the neck with the jaws wide, bites its tail, holds, lets go and draws back in
  build: (p) => {
    const end = p < 0.6 ? easeInOutCubic(smoothstep(0.04, 0.44, p)) : 1 - easeInOutCubic(smoothstep(0.74, 0.97, p));
    return {
      range: [0, Math.max(1e-3, end)],
      spineScale: (k, u, s) => easeOutBack(smoothstep(0, 1, (end - s) / 0.06)),
      jaw: keys([[0, 0.2], [0.3, 0.32], [0.42, 0.32], [0.47, -0.02], [0.7, -0.02], [0.76, 0.3], [0.96, 0.3], [1, 0.2]], p),
    };
  },
};

export function ouroborosFigure({ motion = 'swallow', colour = 'orange', period, shifts }) {
  const material = clayMaterial({ lightDir: LIGHT, view: FRONT, band: motion === 'band' ? 1.3 : 0, len: CIRC, width: 0.5, colour });
  const eyeMaterial = clayMaterial({ lightDir: LIGHT, view: FRONT });
  eyeMaterial.uniforms.uDeep.value.set('#1C0B04');
  eyeMaterial.uniforms.uBase.value.set('#3B1A0B');
  eyeMaterial.uniforms.uLight.value.set('#8A4F2A');

  const head = headMeshes();
  const body = part((NU + 2 * CAP) * M, tubeIndex(NU + 2 * CAP, M), material);
  const spines = part(SPINES * SPINE.length, new Uint32Array(Array.from({ length: SPINES }, (_, k) => SPINE_INDEX.map((i) => i + k * SPINE.length)).flat()), material);
  const skull = part(head.skull.pos.length / 3, head.skull.index, material);
  const jaw = part(head.jaw.pos.length / 3, head.jaw.index, material);
  placeHead(skull.geometry, head.skull);
  const pivot = new THREE.Group();
  pivot.add(body, spines, skull, jaw);
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(EYE.radius, 24, 16), eyeMaterial);
    const [x, y, z] = EYE.centre, phi = THETA0 - x / R;
    eye.position.set((R + y) * Math.cos(phi), (R + y) * Math.sin(phi), side * z);
    pivot.add(eye);
  }

  // the body only moves under the loops that bend, swell or grow it; the jaw only under those that work it
  const bodyMoves = ['slither', 'gulp', 'build'].includes(motion);
  let lastJaw = null;
  const update = (t) => {
    const p = t / period, st = MOTION[motion](p, { shifts });
    if (bodyMoves || lastJaw === null) placeBody(body.geometry, st);
    placeSpines(spines.geometry, st);
    const open = st.jaw ?? JAW;
    if (open !== lastJaw) placeHead(jaw.geometry, head.jaw, open);
    lastJaw = open;
    pivot.rotation.set(0, st.yaw ?? 0, st.spin ?? 0);
    material.uniforms.uPhase.value = st.band ?? 0;
    material.uniforms.uHue.value = p;
  };

  // the camera takes in the figure at every point of its loop
  const points = [];
  for (let i = 0; i < 12; i++) {
    update((i / 12) * period);
    pivot.updateMatrixWorld(true);
    for (const mesh of [body, spines, skull, jaw]) {
      const a = mesh.geometry.attributes.position.array;
      for (let v = 0; v < a.length; v += 3 * 7) points.push(new THREE.Vector3(a[v], a[v + 1], a[v + 2]).applyMatrix4(pivot.matrixWorld));
    }
  }
  update(0);
  return { object: pivot, camera: fitCamera(points, FRONT, 1.06), period, update };
}
