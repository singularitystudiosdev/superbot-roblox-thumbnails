// Impossible-looking bands that are real solids: a rounded square tube swept round a closed path (a ring, a rounded
// triangle, a diamond, a pentagon, a figure eight), its cross-section turning a quarter turn on the way round. A square looks the
// same after a quarter turn, so the tube closes on itself, and seen face on its front face seems to become its inner
// wall, as in the impossible ring. Turning the whole twist on by a quarter turn makes the band roll round the path
// forever, back exactly where it began.
import * as THREE from 'three';
import { clayMaterial, fitCamera } from './engine.4bc2a2d5.js';

const FRONT = new THREE.Vector3(0, 0, 1);
const LIGHT = new THREE.Vector3(-0.55, 0.8, 0.6);
const NU = 360, M = 48; // samples along the path, round the cross-section (a multiple of 4)
const BEND = 1.3; // the tightest bend a band takes, in reaches of its cross-section

// a closed path resampled at even spacing along its length
function resample(points, n) {
  const len = [0];
  for (let i = 1; i <= points.length; i++) len.push(len[i - 1] + points[i % points.length].distanceTo(points[i - 1]));
  const total = len.at(-1), out = [];
  for (let k = 0, i = 0; k < n; k++) {
    const d = (k / n) * total;
    while (len[i + 1] < d) i++;
    const f = (d - len[i]) / (len[i + 1] - len[i]);
    out.push(points[i].clone().lerp(points[(i + 1) % points.length], f));
  }
  return out;
}

// a polygon with its corners rounded to `radius`, as a dense point list (dense enough that resampling it leaves no
// kinks sharper than the arc itself)
function roundedPolygon(vertices, radius, perArc = 200) {
  const pts = [];
  vertices.forEach((v, i) => {
    const a = vertices[(i + vertices.length - 1) % vertices.length], b = vertices[(i + 1) % vertices.length];
    const ia = a.clone().sub(v).normalize(), ib = b.clone().sub(v).normalize();
    const half = Math.acos(ia.dot(ib)) / 2;
    const cut = radius / Math.tan(half);
    const centre = v.clone().add(ia.clone().add(ib).normalize().multiplyScalar(radius / Math.sin(half)));
    const from = v.clone().add(ia.clone().multiplyScalar(cut)).sub(centre), to = v.clone().add(ib.clone().multiplyScalar(cut)).sub(centre);
    const a0 = Math.atan2(from.y, from.x);
    let sweep = Math.atan2(to.y, to.x) - a0;
    if (sweep > Math.PI) sweep -= Math.PI * 2;
    if (sweep < -Math.PI) sweep += Math.PI * 2;
    for (let k = 0; k <= perArc; k++) pts.push(centre.clone().add(new THREE.Vector3(Math.cos(a0 + (sweep * k) / perArc), Math.sin(a0 + (sweep * k) / perArc), 0).multiplyScalar(radius)));
  });
  return pts;
}

const regular = (n, r, start) => Array.from({ length: n }, (_, i) => new THREE.Vector3(r * Math.cos(start + (i * 2 * Math.PI) / n), r * Math.sin(start + (i * 2 * Math.PI) / n), 0));

export const PATHS = {
  ring: () => Array.from({ length: 720 }, (_, i) => new THREE.Vector3(Math.cos((i / 720) * Math.PI * 2), Math.sin((i / 720) * Math.PI * 2), 0)),
  // corners at least 1.7 band half-widths round (BEND below): any tighter and the band folds through itself inside them
  triangle: () => roundedPolygon(regular(3, 1.15, -Math.PI / 2 + Math.PI), 0.36), // pointing down, as the tribar is drawn
  diamond: () => roundedPolygon(regular(4, 1.05, Math.PI / 2), 0.36),
  pentagon: () => roundedPolygon(regular(5, 1.1, Math.PI / 2), 0.36), // point up
  // a figure eight whose two crossings pass one in front of the other
  infinity: () => Array.from({ length: 1440 }, (_, i) => {
    const t = (i / 1440) * Math.PI * 2, d = 1 + Math.sin(t) ** 2;
    return new THREE.Vector3((1.45 * Math.cos(t)) / d, (1.45 * Math.sin(t) * Math.cos(t)) / d, 0.3 * Math.sin(t));
  }),
};

// the path's tightest bend: the smallest radius of the circle through any three neighbouring points
function tightestBend(p) {
  let min = Infinity;
  p.forEach((b, i) => {
    const a = p[(i + p.length - 1) % p.length], c = p[(i + 1) % p.length];
    const area = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).length() / 2;
    if (area > 1e-12) min = Math.min(min, (a.distanceTo(b) * b.distanceTo(c) * c.distanceTo(a)) / (4 * area));
  });
  return min;
}

// a frame along the path that does not spin about it (parallel transport), closed by spreading any leftover turn
function frames(p) {
  const n = p.length;
  const T = p.map((_, i) => p[(i + 1) % n].clone().sub(p[(i + n - 1) % n]).normalize());
  const N = [new THREE.Vector3().crossVectors(FRONT, T[0]).normalize()];
  for (let i = 1; i <= n; i++) {
    const t = T[i % n];
    N.push(N[i - 1].clone().sub(t.clone().multiplyScalar(N[i - 1].dot(t))).normalize());
  }
  const left = Math.atan2(new THREE.Vector3().crossVectors(N[n], N[0]).dot(T[0]), N[n].dot(N[0]));
  return T.map((t, i) => {
    const nn = N[i].clone().applyAxisAngle(t, (left * i) / n);
    return { t, n: nn, b: new THREE.Vector3().crossVectors(t, nn) };
  });
}

export function sweepFigure({ path, half = 0.24, period, colour = 'orange' }) {
  const p = resample(PATHS[path](), NU);
  const f = frames(p);
  const section = Array.from({ length: M }, (_, j) => {
    const a = (j / M) * Math.PI * 2, e = 2 / 7; // a superellipse: a square with soft corners
    return [Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** e * half, Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** e * half];
  });
  // the section reaches its corners (1.28 half-widths) on the inside of every bend; a bend tighter than that, with a
  // margin for smooth shading, folds the inner wall through itself into pale slivers
  const reach = Math.max(...section.map(([x, y]) => Math.hypot(x, y)));
  if (tightestBend(p) < reach * BEND) throw new Error(`${path}: its tightest bend (${tightestBend(p).toFixed(3)}) is under ${BEND}x the band's reach (${reach.toFixed(3)})`);
  const geometry = new THREE.BufferGeometry();
  const pos = new Float32Array(NU * M * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(NU * M), 1));
  // the rainbow modes' hues (engine.4bc2a2d5.js COLOURS) as points on a circle: aFlow, one turn of the rainbow along the
  // path; aFace, one turn round the cross-section plus a quarter along the path, so the hue the last ring ends on is the
  // one the first ring starts with a quarter turn on, where the tube closes
  const flow = new Float32Array(NU * M * 2), face = new Float32Array(NU * M * 2);
  for (let i = 0; i < NU; i++) for (let j = 0; j < M; j++) {
    const k = (i * M + j) * 2, u = (Math.PI * 2 * i) / NU, h = Math.PI * 2 * (j / M + i / (4 * NU));
    flow[k] = Math.cos(u); flow[k + 1] = Math.sin(u);
    face[k] = Math.cos(h); face[k + 1] = Math.sin(h);
  }
  geometry.setAttribute('aFlow', new THREE.BufferAttribute(flow, 2));
  geometry.setAttribute('aFace', new THREE.BufferAttribute(face, 2));
  const index = [];
  // the last ring of the tube meets the first a quarter turn on: vertex j there is vertex j + M/4 here
  for (let i = 0; i < NU; i++) for (let j = 0; j < M; j++) {
    const a = i * M + j, b = i * M + ((j + 1) % M);
    const next = i + 1 < NU ? (i + 1) * M : 0, shift = i + 1 < NU ? 0 : M / 4;
    const c = next + ((j + shift) % M), d = next + ((j + 1 + shift) % M);
    index.push(a, c, b, b, c, d);
  }
  geometry.setIndex(index);
  const material = clayMaterial({ lightDir: LIGHT, view: FRONT, colour });
  const mesh = new THREE.Mesh(geometry, material);

  const place = (roll) => {
    for (let i = 0; i < NU; i++) {
      const th = (Math.PI / 2) * (i / NU) + roll, c = Math.cos(th), s = Math.sin(th);
      const { n, b } = f[i];
      for (let j = 0; j < M; j++) {
        const [x, y] = section[j];
        const u = x * c - y * s, v = x * s + y * c;
        const k = (i * M + j) * 3;
        pos[k] = p[i].x + n.x * u + b.x * v;
        pos[k + 1] = p[i].y + n.y * u + b.y * v;
        pos[k + 2] = p[i].z + n.z * u + b.z * v;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  };
  place(0);
  geometry.computeBoundingSphere();
  const corners = p.flatMap((q) => [-1, 1].flatMap((sx) => [-1, 1].map((sy) => q.clone().add(new THREE.Vector3(sx * half * 1.42, sy * half * 1.42, 0)))));
  return {
    object: mesh,
    camera: fitCamera(corners, FRONT, 1.08),
    period,
    // the band rolls a quarter turn and the rainbow goes once round the spectrum in each loop
    update: (t) => {
      place((Math.PI / 2) * (t / period));
      material.uniforms.uHue.value = t / period;
    },
  };
}
