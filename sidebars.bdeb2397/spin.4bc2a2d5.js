// A working chat's app icon turns slowly once around its vertical axis, rests, and turns again for as long as the chat
// works, as a solid object: the flat icon is rebuilt as a slab (its face at the front, darker copies stacked behind it
// as the edge, and the face again on the back, the right way round), tipping back a little at the half turn so its edge
// shows, each face darkening as it turns from the light. Each chat keeps its own rhythm, the length of its turn, its rest
// and where in the cycle it stands, all drawn from its id: the working icons never move in step, drifting in and out of
// phase, and a chat drawn again lands where it was. A chat that stops working (its li loses .is-working) finishes the
// turn it is in and rests; one that starts again turns at once. Group rows (their folder icons), chats at rest and
// reduced motion keep the plain icon.
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
// deliberate: a slow showcase turn, peaking near half a turn per second (ease-in-out sine), and a short rest before the
// next; each chat's turn and the rest after it fall in these ranges (ms)
const SPIN = { turn: [2600, 3200], rest: [100, 400], tilt: -14 };
const SLAB = { depth: 0.16, edges: 6 }; // thickness in icon widths (the Fluent tiles' own), edge layers inside it
const STEPS = 8; // the faces' shading, every eighth of a turn
const SAMPLES = 24; // points of the turn's ease-in-out sine in a cycle's linear() easing

// a face's brightness at each step: full facing the viewer, dimmer as it turns away (only seen while it faces front)
const shade = (phase) => Array.from({ length: STEPS + 1 }, (_, k) => ({ filter: `brightness(${(0.62 + 0.38 * Math.max(0, Math.cos(((k * 360) / STEPS + phase) * (Math.PI / 180)))).toFixed(3)})` }));

// a chat's rhythm from its id (FNV-1a, then mulberry32 draws), so the same chat always turns the same way: one cycle is
// the turn, eased in and out, then the icon still for the rest of it
function rhythm(id) {
  let h = 2166136261;
  for (const ch of id) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  const draw = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const span = ([lo, hi]) => lo + (hi - lo) * draw();
  const turn = span(SPIN.turn), cycle = turn + span(SPIN.rest);
  const stops = Array.from({ length: SAMPLES + 1 }, (_, i) => `${((1 - Math.cos((Math.PI * i) / SAMPLES)) / 2).toFixed(4)} ${((100 * turn * i) / (SAMPLES * cycle)).toFixed(2)}%`);
  return { duration: Math.round(cycle), easing: `linear(${stops.join(', ')}, 1 100%)`, phase: draw() * cycle };
}

// the plain icon becomes a slab with the same box and classes, so the row and every variant lay it out as before
function slab(icon) {
  const box = document.createElement('span');
  box.className = `${icon.className} sb-spin`;
  const body = document.createElement('span');
  body.className = 'sb-spin-body';
  body.style.setProperty('--depth', SLAB.depth);
  const layer = (cls, z) => {
    const img = icon.cloneNode();
    img.className = cls;
    img.style.setProperty('--z', z);
    return img;
  };
  for (let i = SLAB.edges; i >= 1; i--) body.append(layer('sb-spin-edge', -(SLAB.depth * i) / (SLAB.edges + 1)));
  const back = layer('sb-spin-back', -SLAB.depth), front = layer('sb-spin-front', 0);
  body.append(back, front);
  box.append(body);
  icon.replaceWith(box);
  return { body, front, back };
}

// `host` is a chat's li (interact.bdeb2397.js); only a chat's link row carries an app icon
export function spin(host) {
  const icon = host.querySelector(':scope > a.sb-row > img.sb-ic');
  if (!icon || REDUCED) return;
  const { duration, easing, phase } = rhythm(icon.parentElement.getAttribute('href').slice(1));
  const timing = { duration, easing, iterations: Infinity };
  let layers = null, turn = [];

  // the cycle's three parts, begun at `start` on the document's timeline
  const play = ({ body, front, back }, start) => [
    body.animate([
      { transform: 'rotateX(0deg) rotateY(0turn)' },
      { transform: `rotateX(${SPIN.tilt}deg) rotateY(0.5turn)` },
      { transform: 'rotateX(0deg) rotateY(1turn)' },
    ], timing),
    front.animate(shade(0), timing),
    back.animate(shade(180), timing),
  ].map((a) => Object.assign(a, { startTime: start }));

  // at load a working chat is where its cycle stands; later, one set to work turns at once
  const update = (atLoad) => {
    const working = host.classList.contains('is-working');
    const turning = turn.length > 0 && turn[0].playState !== 'finished';
    if (working && turning) turn.forEach((a) => a.effect.updateTiming({ iterations: Infinity }));
    else if (working) turn = play((layers ??= slab(icon)), atLoad ? -phase : document.timeline.currentTime);
    else if (turning) {
      const iterations = turn[0].effect.getComputedTiming().currentIteration + 1;
      turn.forEach((a) => a.effect.updateTiming({ iterations }));
    }
  };
  new MutationObserver(() => update(false)).observe(host, { attributes: true, attributeFilter: ['class'] });
  update(true);

  // the drag ghost is a copy of the row (drag.bdeb2397.js): its icon carries on turning in step with this one
  host.addEventListener('sb-dragstart', () => {
    const ghost = host.closest('.sb')?.querySelector('.sb-ghost .sb-spin-body');
    if (!ghost) return;
    for (const a of turn) {
      if (a.playState === 'finished') continue;
      const part = a.effect.target === layers.body ? ghost : ghost.querySelector(`:scope > .${a.effect.target.className}`);
      part.animate(a.effect.getKeyframes(), a.effect.getTiming()).startTime = a.startTime;
    }
  });
}
