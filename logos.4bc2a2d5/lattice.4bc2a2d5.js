// Impossible figures made of unit cubes. A figure is a walk on the cube lattice, one axis step per cube, that closes in
// the picture but not in space: its steps add up to k(1,1,1), the direction the isometric camera looks along, so the
// last cube lands one step from the first on screen while sitting k cubes nearer the eye. Drawn with a true depth
// buffer, the walk shows the classic impossible joint where its two ends meet. Steps: x y z forwards, X Y Z backwards
// (on screen x runs down-right, y up, z down-left).
import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { clayMaterial, fitCamera, smoothstep, easeInOutCubic, easeOutBack } from './engine.4bc2a2d5.js';

const AXIS = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1], X: [-1, 0, 0], Y: [0, -1, 0], Z: [0, 0, -1] };
const ISO = new THREE.Vector3(1, 1, 1).normalize();
// from above, a little toward the left face (+z): tops light, left faces the swatch, right faces deep
const LIGHT = new THREE.Vector3(0.35, 1, 0.75);

// "3y 3x 3z" -> the cells of the walk and each one's outgoing step
function walk(path) {
  const steps = path.trim().split(/\s+/).flatMap((run) => Array(Number(run.slice(0, -1)) || 1).fill(run.slice(-1)));
  const cells = [], dirs = [];
  const at = new THREE.Vector3();
  for (const s of steps) {
    cells.push(at.clone());
    dirs.push(new THREE.Vector3(...AXIS[s]));
    at.add(dirs.at(-1));
  }
  return { cells, dirs, net: at };
}

// a rounded cube for one cell, carrying aS, its place along the walk
function cubeGeometry(i, dir) {
  const g = new RoundedBoxGeometry(0.97, 0.97, 0.97, 3, 0.07);
  const pos = g.attributes.position, s = new Float32Array(pos.count);
  for (let v = 0; v < pos.count; v++) s[v] = i + pos.getX(v) * dir.x + pos.getY(v) * dir.y + pos.getZ(v) * dir.z;
  g.setAttribute('aS', new THREE.BufferAttribute(s, 1));
  return g;
}

// the smooth figure as one surface: each cell gives only the faces that open onto an empty cell, so no hidden face is
// left to flicker through along a shared edge (separate bars showed a dotted hairline wherever one met the next), and
// neighbouring faces meet corner to corner, with nothing to crack. Cells at the joint are far apart in space, so both
// ends keep all their faces and the depth buffer draws the joint as before
function smoothGeometry(cells, dirs, centre) {
  const key = (v) => `${v.x},${v.y},${v.z}`;
  const filled = new Set(cells.map(key));
  const pos = [], nor = [], s = [], index = [];
  const unit = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
  cells.forEach((c, i) => {
    for (let a = 0; a < 3; a++) for (const sign of [1, -1]) {
      const n = unit[a].clone().multiplyScalar(sign);
      if (filled.has(key(c.clone().add(n)))) continue;
      // u x v = n, so the four corners run counter-clockwise seen from outside
      let u = unit[(a + 1) % 3], v = unit[(a + 2) % 3];
      if (sign < 0) [u, v] = [v, u];
      const base = pos.length / 3;
      for (const [du, dv] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) {
        const p = c.clone().addScaledVector(n, 0.5).addScaledVector(u, du).addScaledVector(v, dv);
        pos.push(p.x - centre.x, p.y - centre.y, p.z - centre.z);
        nor.push(n.x, n.y, n.z);
        s.push(i + p.clone().sub(c).dot(dirs[i]));
      }
      index.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(s, 1));
  g.setIndex(index);
  return g;
}

const MOTION = {
  // a dip that travels round the loop, each cube shrinking a little as it passes
  wave: ({ cubes }, p) => cubes.forEach((m, i) => {
    const x = (((i / cubes.length - p) % 1) + 1) % 1;
    m.scale.setScalar(1 - 0.3 * Math.sin(Math.PI * Math.min(1, x / 0.22)) ** 2);
  }),
  // a soft light that runs round the loop and through the impossible joint as if it were not there
  band: ({ material }, p) => { material.uniforms.uPhase.value = p; },
  // the cubes pop in one after another, the figure holds, then they leave in the same order
  build: ({ cubes }, p) => cubes.forEach((m, i) => {
    const k = i / cubes.length;
    const grow = easeOutBack(smoothstep(0, 1, (p - k * 0.36) / 0.1));
    const shrink = 1 - smoothstep(0, 1, (p - 0.72 - k * 0.24) / 0.06);
    m.scale.setScalar(Math.max(0.0001, Math.min(grow, shrink)));
  }),
  // a full turn about the vertical: the joint comes apart, shows the walk is open, and closes again
  reveal: ({ pivot }, p) => { pivot.rotation.y = Math.PI * 2 * easeInOutCubic(smoothstep(0.22, 1, p)); },
};

export function latticeFigure({ path, style = 'cubes', motion, period }) {
  const { cells, dirs, net } = walk(path);
  const material = clayMaterial({ lightDir: LIGHT, view: ISO, band: motion === 'band' ? 1 : 0, len: cells.length, width: 1.1 });
  const centre = cells.reduce((a, c) => a.add(c), new THREE.Vector3()).divideScalar(cells.length);
  const pivot = new THREE.Group();
  pivot.position.copy(centre);
  const cubes = style === 'cubes'
    ? cells.map((c, i) => {
      const m = new THREE.Mesh(cubeGeometry(i, dirs[i]), material);
      m.position.copy(c).sub(centre);
      return m;
    })
    : [new THREE.Mesh(smoothGeometry(cells, dirs, centre), material)];
  cubes.forEach((m) => pivot.add(m));
  // fitted to the figure's corners, over a whole turn when it turns
  const corners = [];
  const turns = motion === 'reveal' ? 16 : 1;
  for (let r = 0; r < turns; r++) {
    const rot = new THREE.Matrix4().makeRotationY((Math.PI * 2 * r) / turns);
    for (const c of cells) for (const dx of [-0.5, 0.5]) for (const dy of [-0.5, 0.5]) for (const dz of [-0.5, 0.5]) {
      corners.push(new THREE.Vector3(c.x - centre.x + dx, c.y - centre.y + dy, c.z - centre.z + dz).applyMatrix4(rot).add(centre));
    }
  }
  const state = { cubes, material, pivot };
  return {
    object: pivot,
    camera: fitCamera(corners, ISO, motion === 'reveal' ? 1.06 : 1.14),
    period,
    k: net.x === net.y && net.y === net.z ? net.x : null, // how many cubes nearer the eye the walk ends; null: it does not close
    update: (t) => MOTION[motion](state, t / period),
  };
}
