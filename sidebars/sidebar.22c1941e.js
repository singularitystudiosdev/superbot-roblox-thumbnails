// A chat list on the app's left (?sidebar=1..10 on the spot, all ten side by side on sidebars/index.html). Built once,
// then painted from t like the rest of the spot: until the prompt is sent "New chat" is the current place; once it is,
// the new chat grows into the list as the current one, its ring turns while superbot works, and its second line and
// thumbnail follow the Activity tab and the newest winning iteration. With reduced motion the chat appears at once and
// the ring holds still.
import { seg, outCubic, lastAt, el, REDUCED } from '../lib.af4c3c6b.js';
import { CHATS } from './data.22c1941e.js';
import { VARIANTS_A } from './variants-a.22c1941e.js';
import { VARIANTS_B } from './variants-b.22c1941e.js';

export const VARIANTS = [...VARIANTS_A, ...VARIANTS_B];
export const SIDEBAR_W = 240;
const GROW = 0.4; // s, the new chat's arrival
const TURN = 3; // s, one full turn of the running ring

// `n` is 1-based; null when it names no variant. `base` is the path from the page to the spot's root.
export function buildSidebar(host, n, base = '') {
  const v = VARIANTS[n - 1];
  if (!v) return null;
  const node = el(`<aside class="sb sb-v${n}" aria-hidden="true">${v.html(base)}</aside>`);
  host.prepend(node);
  const all = (sel) => [...node.querySelectorAll(sel)];
  return {
    node, base,
    grows: all('[data-grow]'), empties: all('[data-empty]'), live: all('[data-live]'), fresh: all('[data-new]'),
    rings: all('.sb-ring'), steps: all('[data-step]'), thumbs: all('[data-thumb]'), counts: all('[data-count]'),
    shownStep: null, shownThumb: null, wins: null,
  };
}

export function paintSidebar(b, S, t) {
  const sent = S.typing[0].send;
  const k = REDUCED ? (t >= sent ? 1 : 0) : outCubic(seg(t, sent, sent + GROW));
  const fit = (g, x) => { g.style.gridTemplateRows = `${x.toFixed(3)}fr`; g.style.opacity = x.toFixed(3); };
  for (const g of b.grows) fit(g, k);
  for (const g of b.empties) fit(g, 1 - k);
  for (const r of b.live) r.classList.toggle('is-on', k >= 0.5);
  for (const r of b.fresh) r.classList.toggle('is-on', k < 0.5);
  for (const c of b.counts) c.textContent = k >= 0.5 ? '1' : '0';

  const turn = REDUCED ? 'none' : `rotate(${(((t / TURN) % 1) * 360).toFixed(1)}deg)`;
  for (const r of b.rings) r.style.transform = turn;

  const act = lastAt(S.acts, t);
  const text = act ? act.text : 'Starting';
  if (text !== b.shownStep) { for (const s of b.steps) s.textContent = text; b.shownStep = text; }

  b.wins ??= S.chat.filter((c) => c.card && c.card.win && c.card.img);
  const win = lastAt(b.wins, t);
  const src = b.base + (win ? win.card.img : CHATS[0].thumb);
  if (src !== b.shownThumb) { for (const img of b.thumbs) img.src = src; b.shownThumb = src; }
}
