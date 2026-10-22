// The dragon's head as signed distance fields, meshed once with surface nets: the skull (snout, brow, horns, cheek
// spikes and upper fangs) and the lower jaw apart, so the jaw can open. Built in the strip frame (dragon.681ed25c.js): x
// along the ring from the neck toward the tail (the snout at negative x), y outward (the back), z toward the viewer.
// The mouth line is y = 0, where the tail runs in between the jaws.

// the distance to a cone with round ends: a sphere of radius r1 at a swept into one of r2 at b (after Inigo Quilez)
function roundCone(a, b, r1, r2) {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2];
  const l2 = bx * bx + by * by + bz * bz, rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  return (x, y, z) => {
    const px = x - a[0], py = y - a[1], pz = z - a[2];
    const along = px * bx + py * by + pz * bz, past = along - l2;
    const qx = px * l2 - bx * along, qy = py * l2 - by * along, qz = pz * l2 - bz * along;
    const x2 = qx * qx + qy * qy + qz * qz, y2 = along * along * l2, z2 = past * past * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(past) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(along) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + along * rr) * il2 - r1;
  };
}

// an ellipsoid's distance, close enough near its surface
function ellipsoid(c, r) {
  return (x, y, z) => {
    const px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2];
    const k0 = Math.hypot(px, py, pz), k1 = Math.hypot(px / r[0], py / r[1], pz / r[2]);
    return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
  };
}

const sphere = (c, r) => (x, y, z) => Math.hypot(x - c[0], y - c[1], z - c[2]) - r;
const smin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const smax = (a, b, k) => -smin(-a, -b, k);

// a tapering horn along a quadratic curve: round cones end to end, so each joint is the same sphere on both sides
function horn(p0, p1, p2, r0, r1, n = 8) {
  const at = (t) => [0, 1, 2].map((i) => (1 - t) ** 2 * p0[i] + 2 * (1 - t) * t * p1[i] + t * t * p2[i]);
  const radius = (t) => r0 + (r1 - r0) * t ** 0.8;
  const parts = Array.from({ length: n }, (_, i) => roundCone(at(i / n), at((i + 1) / n), radius(i / n), radius((i + 1) / n)));
  return (x, y, z) => parts.reduce((d, f) => Math.min(d, f(x, y, z)), Infinity);
}

// one of each for the near side (z > 0) and the far side, mirrored
const pair = (make) => {
  const near = make(1), far = make(-1);
  return (x, y, z) => Math.min(near(x, y, z), far(x, y, z));
};

// the head is drawn at unit size and scaled up against the body; the neck is drawn at full size, so the body's tube
// (dragon.681ed25c.js, 0.145 across the neck) comes out of it where the two radii cross
export const SCALE = 1.45;
const scaled = (f) => (x, y, z) => f(x / SCALE, y / SCALE, z / SCALE) * SCALE;
const EYE_AT = [-0.215, 0.128, 0.094], EYE_R = 0.036; // at unit size
export const EYE = { centre: EYE_AT.map((v) => v * SCALE), radius: EYE_R * SCALE };
export const HINGE = [-0.1 * SCALE, 0.0]; // where the lower jaw turns, inside the cheek
const LIP = 0.026; // the jaws' inner edges sit this far either side of the mouth line

const skull = scaled((() => {
  const cranium = ellipsoid([-0.07, 0.075, 0], [0.2, 0.17, 0.14]);
  const snout = roundCone([-0.24, 0.11, 0], [-0.575, 0.08, 0], 0.095, 0.052);
  // a ridge over each eye that runs back into its horn
  const brow = pair((s) => roundCone([-0.31, 0.155, s * 0.058], [-0.11, 0.2, s * 0.06], 0.026, 0.05));
  const nose = ellipsoid([-0.56, 0.115, 0], [0.05, 0.035, 0.05]);
  const horns = [
    horn([-0.1, 0.19, 0.06], [0.06, 0.3, 0.08], [0.3, 0.33, 0.09], 0.062, 0.007),
    horn([-0.04, 0.2, -0.06], [0.12, 0.34, -0.08], [0.36, 0.4, -0.09], 0.056, 0.007),
    horn([-0.5, 0.13, 0], [-0.47, 0.18, 0], [-0.42, 0.205, 0], 0.024, 0.004, 4), // a small one on the nose
  ];
  const cheek = pair((s) => horn([-0.04, -0.02, s * 0.08], [0.06, -0.05, s * 0.1], [0.17, -0.11, s * 0.1], 0.035, 0.004, 5));
  const crest = pair((s) => horn([0.02, 0.16, s * 0.09], [0.12, 0.17, s * 0.11], [0.24, 0.12, s * 0.12], 0.032, 0.004, 5));
  const fangs = pair((s) => roundCone([-0.5, 0.05, s * 0.045], [-0.49, -0.04, s * 0.05], 0.018, 0.003));
  const nostril = pair((s) => sphere([-0.585, 0.12, s * 0.045], 0.017));
  const socket = pair((s) => sphere([EYE_AT[0], EYE_AT[1], s * EYE_AT[2]], EYE_R + 0.006));
  // the gape: a slot along the mouth line, open toward the snout and rounded off at the corner of the mouth
  const gape = roundCone([-0.26, 0, 0], [-1.2, 0, 0], LIP, LIP);
  return (x, y, z) => {
    const zz = z / 0.88; // a head a little narrower than it is tall
    let d = smin(cranium(x, y, zz), snout(x, y, zz), 0.08);
    d = smin(d, nose(x, y, zz), 0.04);
    d = smin(d, brow(x, y, z), 0.05);
    d = smax(d, -gape(x, y, 0), 0.012);
    for (const h of horns) d = smin(d, h(x, y, z), 0.03);
    d = smin(d, cheek(x, y, z), 0.025);
    d = smin(d, crest(x, y, z), 0.02);
    d = smin(d, fangs(x, y, z), 0.012);
    d = smax(d, -nostril(x, y, z), 0.01);
    return smax(d, -socket(x, y, z), 0.016);
  };
})());

const lowerJaw = scaled((() => {
  const jaw = roundCone([-0.14, -0.065, 0], [-0.53, -0.055, 0], 0.08, 0.038);
  const chin = ellipsoid([-0.52, -0.06, 0], [0.05, 0.035, 0.045]);
  const fangs = pair((s) => roundCone([-0.44, -0.045, s * 0.042], [-0.435, 0.035, s * 0.046], 0.015, 0.003));
  const beard = horn([-0.43, -0.085, 0], [-0.38, -0.14, 0], [-0.29, -0.165, 0], 0.026, 0.004, 5);
  return (x, y, z) => {
    const zz = z / 0.85;
    let d = smin(jaw(x, y, zz), chin(x, y, zz), 0.04);
    d = smin(d, beard(x, y, z), 0.02);
    d = smax(d, y + LIP, 0.012); // nothing above the lower lip
    return smin(d, fangs(x, y, z), 0.01);
  };
})());

// the neck, at full size: thicker than the body where it leaves the skull, thinner where the body takes over
const neck = roundCone([-0.12, 0, 0], [0.32, 0, 0], 0.175, 0.128);
const skullAndNeck = (x, y, z) => smin(skull(x, y, z), neck(x, y, z), 0.06);

// surface nets: one vertex per grid cell the surface passes through, at the mean of the edge crossings, and a quad
// across every grid edge the surface cuts. Normals come from the field's gradient, so the shading stays smooth
function surfaceNets(sdf, lo, hi, h) {
  const [nx, ny, nz] = [0, 1, 2].map((a) => Math.ceil((hi[a] - lo[a]) / h) + 1);
  const field = new Float32Array(nx * ny * nz);
  const at = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    field[at(i, j, k)] = sdf(lo[0] + i * h, lo[1] + j * h, lo[2] + k * h);
  }
  const cell = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cellAt = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos = [], nor = [], index = [];
  const CORNERS = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let inside = 0;
    for (let c = 0; c < 8; c++) {
      v[c] = field[at(i + CORNERS[c][0], j + CORNERS[c][1], k + CORNERS[c][2])];
      if (v[c] < 0) inside++;
    }
    if (inside === 0 || inside === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of EDGES) {
      if ((v[a] < 0) === (v[b] < 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      sx += CORNERS[a][0] + t * (CORNERS[b][0] - CORNERS[a][0]);
      sy += CORNERS[a][1] + t * (CORNERS[b][1] - CORNERS[a][1]);
      sz += CORNERS[a][2] + t * (CORNERS[b][2] - CORNERS[a][2]);
      n++;
    }
    const x = lo[0] + (i + sx / n) * h, y = lo[1] + (j + sy / n) * h, z = lo[2] + (k + sz / n) * h;
    const e = h * 0.5;
    const g = [sdf(x + e, y, z) - sdf(x - e, y, z), sdf(x, y + e, z) - sdf(x, y - e, z), sdf(x, y, z + e) - sdf(x, y, z - e)];
    const len = Math.hypot(...g) || 1;
    cell[cellAt(i, j, k)] = pos.length / 3;
    pos.push(x, y, z);
    nor.push(g[0] / len, g[1] / len, g[2] / len);
  }
  // the quad round each cut edge, wound so it faces from inside to outside: for an edge along axis a, the four cells
  // step through the next two axes (u, then v) counter-clockwise seen from the edge's positive end
  const quad = (c0, c1, c2, c3, flip) => {
    if ([c0, c1, c2, c3].some((c) => c < 0)) return;
    if (flip) index.push(c0, c2, c1, c0, c3, c2);
    else index.push(c0, c1, c2, c0, c2, c3);
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const here = field[at(i, j, k)] < 0;
    if (here !== (field[at(i + 1, j, k)] < 0)) quad(cell[cellAt(i, j - 1, k - 1)], cell[cellAt(i, j, k - 1)], cell[cellAt(i, j, k)], cell[cellAt(i, j - 1, k)], !here);
    if (here !== (field[at(i, j + 1, k)] < 0)) quad(cell[cellAt(i - 1, j, k - 1)], cell[cellAt(i - 1, j, k)], cell[cellAt(i, j, k)], cell[cellAt(i, j, k - 1)], !here);
    if (here !== (field[at(i, j, k + 1)] < 0)) quad(cell[cellAt(i - 1, j - 1, k)], cell[cellAt(i, j - 1, k)], cell[cellAt(i, j, k)], cell[cellAt(i - 1, j, k)], !here);
  }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), index: new Uint32Array(index) };
}

// meshed once per page and shared by every figure on it
let cached = null;
export function headMeshes(h = 0.0105) {
  cached ??= {
    skull: surfaceNets(skullAndNeck, [-0.98, -0.32, -0.24], [0.62, 0.7, 0.24], h),
    jaw: surfaceNets(lowerJaw, [-0.95, -0.3, -0.19], [0, 0.1, 0.19], h),
  };
  return cached;
}
