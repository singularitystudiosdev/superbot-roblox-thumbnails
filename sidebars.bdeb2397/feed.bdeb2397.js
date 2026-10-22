// A copy of the creative's feed.af4c3c6b.js as it stands in the working tree (2026-10-21), where another chat taught
// measureFeed and paintFeed the chat's two widths (`wide`); that edit is uncommitted and not this folder's to commit, so
// this folder carries its own copy and never depends on it. Imports point back at the creative's unchanged modules.
// The left pane (the chat with its composer) and the activity tab under the live view, both painted from t. Items are
// laid out once, at their final size (streamed text keeps its unrevealed rest as transparent text), so a pane scrolls by
// summing the heights of what has arrived, each weighted by its entrance: the newest line slides up into view. The
// activity tab: one line per step behind a small Fluent 3D icon (img/fx/CREDITS.txt), a breakthrough's line bold in the
// ink with a party popper after it that pops in and fires a burst of confetti. It paints every sidebar chat's run the
// same way (chatplay.8889b4ff.js): those bring their own cards (a picture, or a 3D icon on a tile), icons and suggestions.
import { seg, lerp, outCubic, caretOn, countAt, lastAt, el, esc, REDUCED, STREAM_CPS, TYPE_CPS } from '../lib.af4c3c6b.js';
import { THUMBS } from '../rbx.af4c3c6b.js';
import { linkRefs } from './automation-refs.3c255b31.js';
import { following } from './latest.bfdfd5c2.js';

const GAP = 14; // between chat items (.cm margin-bottom)
const PAD = 28; // the thread's top and bottom padding (.ch-in) until it is measured: latest.bfdfd5c2.css deepens its foot
const ENTER = 0.32; // an item's fade and rise
const FX = 'img/fx/';

// a new low's party popper: it pops in with a wobble a beat after its line, then fires a short burst of confetti from its
// mouth, each bit flung out, slowed by drag and pulled down by gravity, fading at the end; every value is a function of t
// (the Profile settings' Save fires the same burst: settings.854d0793.js)
export const POP_AT = 0.08, POP_IN = 0.42, BURST_AT = 0.12, BURST_LIFE = 0.95, BITS = 10, DRAG = 3.2, GRAV = 110;
export const BIT_COLORS = ['#fd9e43', '#f472b6', '#60a5fa', '#34d399', '#facc15', '#a78bfa'];
// a fixed pseudo-random number per (row, bit, property), so the burst is the same on every pass
const rnd = (a, b, c) => { const x = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return x - Math.floor(x); };
const backOut = (k) => 1 + 3.2 * (k - 1) ** 3 + 2.2 * (k - 1) ** 2;
function burst(n) {
  return Array.from({ length: BITS }, (_, j) => {
    const a = ((-100 + 110 * rnd(n, j, 1)) * Math.PI) / 180, v = 70 + 60 * rnd(n, j, 2);
    return { vx: v * Math.cos(a), vy: v * Math.sin(a), spin: (rnd(n, j, 3) - 0.5) * 900, dot: j % 3 === 0, color: BIT_COLORS[(n + j) % BIT_COLORS.length] };
  });
}
function popHTML(bits) {
  const dots = bits.map((b) => `<i class="ac-bit${b.dot ? ' ac-dot' : ''}" style="background:${b.color}"></i>`).join('');
  return `<span class="ac-fx" aria-hidden="true"><img class="ac-pop" src="${FX}party_popper.png" alt="" width="15" height="15">${dots}</span>`;
}
// a popper (an Activity win's, or a breakthrough card's) as it stands at t, popping from `at`
function paintPop(fx, at, t) {
  const tau = t - at - POP_AT;
  if (REDUCED) { fx.pop.style.transform = 'none'; return; }
  const k = seg(tau, 0, POP_IN);
  const wobble = tau > 0 ? 10 * Math.sin(tau * 20) * Math.exp(-tau * 7) : 0;
  fx.pop.style.transform = `rotate(${(-40 * (1 - outCubic(k)) + wobble).toFixed(1)}deg) scale(${(tau > 0 ? backOut(k) : 0).toFixed(3)})`;
  const bt = tau - BURST_AT;
  for (const b of fx.bits) {
    if (bt <= 0 || bt >= BURST_LIFE) { if (b.on) { b.el.style.opacity = '0'; b.on = false; } continue; }
    b.on = true;
    const e = (1 - Math.exp(-DRAG * bt)) / DRAG;
    b.el.style.opacity = (1 - seg(bt, 0.55, BURST_LIFE)).toFixed(3);
    b.el.style.transform = `translate(${(b.vx * e).toFixed(2)}px, ${(b.vy * e + 0.5 * GRAV * bt * bt).toFixed(2)}px) rotate(${(b.spin * bt).toFixed(1)}deg)`;
  }
}

// the composer's placeholder: the hub's own line until the prompt is sent, then follow-ups the user could send, one at a
// time, each rising in, held long enough to read, then fading up and out before the next rises in
const HINT_FIRST = 'How can ouroboro help you today?';
const HINTS = [
  'Do the same for my game icon...',
  'Wait 7 days of data before each swap...',
  'Always keep my top 2 thumbnails active...',
  'Try a Halloween version of the museum one...',
  'Tell me when one beats 1.5%...',
  'Put the guard in the next round...',
  'Test brighter colors next...',
  'Run this on my other games too...',
];
const HINT_SLOT = 4.2; // one suggestion, in to out
const HINT_FADE = 0.35; // its rise in, and its fade out
const HINT_RISE = 5; // px it travels in and out
// a chat's run (play.8889b4ff.js) brings its own suggestions (S.hints) from its own start (S.hintFrom); one stays put
function hintAt(t, from, hints) {
  if (t < from) return { text: HINT_FIRST, k: 1, y: 0 };
  if (hints.length === 1) return { text: hints[0], k: 1, y: 0 };
  const n = Math.floor((t - from) / HINT_SLOT), p = t - from - n * HINT_SLOT;
  const kin = outCubic(seg(p, 0, HINT_FADE)), kout = seg(p, HINT_SLOT - HINT_FADE, HINT_SLOT);
  return { text: hints[n % hints.length], k: Math.min(kin, 1 - kout), y: ((1 - kin) - kout) * HINT_RISE };
}

// a card's picture: a thumbnail, or (a chat's card with no picture of its own) its 3D icon on a tile the same size
const art = (c, cls) => (c.tile
  ? `<span class="${cls} cv-tile"><img class="cv-tile-ic" src="${c.tile}" alt="" width="96" height="96"></span>`
  : `<img src="${c.img}" alt="" width="768" height="432">`);
// one picture of a strip: an iteration by its id, or a chat's own { img | tile, name }
const figure = (s) => (typeof s === 'string'
  ? `<figure><img src="${THUMBS[s].img}" alt="" width="768" height="432"><figcaption>${esc(THUMBS[s].name)}</figcaption></figure>`
  : `<figure>${art(s, 'cv-fig')}<figcaption>${esc(s.name)}</figcaption></figure>`);

// a card: one thumbnail with its rate (a finding or a breakthrough), or a strip of the iterations superbot made; a
// breakthrough's rate, and a chat's new find (`find`: a lower price, a listing, a place), carries the party popper beside
// it, firing as the card comes in
function cardHTML(card, bits) {
  if (!card) return '';
  if (card.strip) return `<div class="cm-card cm-strip">${card.strip.map(figure).join('')}</div>`;
  return `<div class="cm-card">
      ${card.tile ? art(card, 'cm-thumb') : `<span class="cm-thumb">${art(card)}</span>`}
      <span class="cm-card-t"><b>${esc(card.title)}</b><small>${esc(card.sub)}</small><small>${esc(card.line)}</small></span>
      <span class="cm-card-p"><b>${bits ? popHTML(bits) : ''}${esc(card.value)}</b><small>${esc(card.unit)}</small></span>
    </div>`;
}

// a sent message shows a web address in it as a link, as the chat renders one, opening in a new tab; punctuation after
// it stays outside. A library automation it names is a link to it (automation-refs.3c255b31.js)
const linkify = (html) => html.replace(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|gg|io|net|org)(?:\/[^\s<]*[^\s<.,;:!?)])?/gi, (url) => `<a class="cm-link" href="${/^https?:\/\//i.test(url) ? url : `https://${url}`}" target="_blank" rel="noopener noreferrer">${url}</a>`);

// superbot's messages are bare text and cards, no name line over them
function chatItem(c, bits) {
  if (c.kind === 'user') return `<div class="cm cm-u"><span>${linkRefs(linkify(esc(c.text)))}</span></div>`;
  const card = cardHTML(c.card, bits);
  const after = c.after ? `<p class="cm-say cm-after"><span class="cm-v"></span><span class="cm-h">${esc(c.after)}</span></p>` : '';
  return `<div class="cm cm-b"><p class="cm-say"><span class="cm-v"></span><span class="cm-h">${esc(c.text)}</span></p>${card}${after}</div>`;
}

export function buildFeed(left, act, S) {
  const feedIn = left.querySelector('.ch-in');
  const items = S.chat.map((c, k) => {
    const bits = c.card && (c.card.win || c.card.find) ? burst(100 + k) : null;
    const node = el(chatItem(c, bits));
    feedIn.appendChild(node);
    if (bits) [...node.querySelectorAll('.ac-bit')].forEach((b, j) => { bits[j].el = b; bits[j].on = false; });
    const say = [...node.querySelectorAll('.cm-say')].map((p) => ({ v: p.firstElementChild, h: p.lastElementChild, text: p.lastElementChild.textContent, shown: -1 }));
    const textEnd = c.at + 0.08 + (c.text.length / STREAM_CPS);
    const cardAt = textEnd + 0.15;
    return { c, node, say, card: node.querySelector('.cm-card'), pop: node.querySelector('.ac-pop'), bits, textEnd, cardAt, h: 0 };
  });
  const actIn = act.querySelector('.ac-in');
  const rows = S.acts.map((a, n) => {
    const bits = a.win ? burst(n) : null;
    // the creative's icons by name (img/fx), a chat's run by its own resolved path
    const icon = `<img class="ac-ic" src="${a.icon.includes('/') ? a.icon : `${FX}${a.icon}.png`}" alt="" width="15" height="15">`;
    const node = el(`<div class="ac-row${a.win ? ' ac-win' : ''}">${icon}<span>${esc(a.text)}</span>${bits ? popHTML(bits) : ''}</div>`);
    actIn.appendChild(node);
    if (bits) [...node.querySelectorAll('.ac-bit')].forEach((b, j) => { bits[j].el = b; bits[j].on = false; });
    return { a, node, pop: node.querySelector('.ac-pop'), bits, h: 0 };
  });
  return {
    feed: left.querySelector('.ch-feed'), feedIn, items,
    typed: left.querySelector('.rc-typed'), ph: left.querySelector('.rc-hint'), caret: left.querySelector('.rc-caret'), send: left.querySelector('.rc-send'),
    list: act.querySelector('.ac-list'), actIn, rows, empty: act.querySelector('.ac-empty'), shownTyped: null, shownHint: null,
  };
}

// heights once laid out (fonts loaded): a chat item's at the chat's docked width, or with `wide` at the full window's,
// where its lines run longer
export function measureFeed(f, wide = false) {
  const pad = getComputedStyle(f.feedIn);
  f.pad = parseFloat(pad.paddingTop) + parseFloat(pad.paddingBottom);
  for (const it of f.items) it[wide ? 'hw' : 'h'] = it.node.offsetHeight + GAP;
  if (!wide) for (const r of f.rows) r.h = r.node.offsetHeight;
}

const enter = (t, at) => outCubic(seg(t, at, at + ENTER));
// an arrival fades in and rises 6px; with reduced motion it only fades
function reveal(node, k) {
  node.style.opacity = k.toFixed(3);
  node.style.transform = k >= 1 || REDUCED ? 'none' : `translateY(${((1 - k) * 6).toFixed(2)}px)`;
}
function stream(line, start, t) {
  const n = countAt(line.text, start, STREAM_CPS, t);
  if (n === line.shown) return;
  line.shown = n;
  line.v.textContent = line.text.slice(0, n);
  line.h.textContent = line.text.slice(n);
}
// how much of a pane has arrived: the heights of what is in, each weighted by its entrance; `wide` (0 docked, 1 full
// window) blends a chat item's two heights as the chat widens
function arrived(list, t, wide = 0) {
  let used = 0;
  for (const it of list) used += lerp(it.h, it.hw ?? it.h, wide) * enter(t, it.c ? it.c.at : it.a.at);
  return used;
}

export function paintFeed(f, S, t, wide = 0) {
  // chat
  for (const it of f.items) {
    const k = enter(t, it.c.at);
    reveal(it.node, k);
    if (k <= 0) continue;
    if (it.c.kind === 'bot') {
      stream(it.say[0], it.c.at + 0.08, t);
      if (it.card) reveal(it.card, enter(t, it.cardAt));
      if (it.pop) paintPop(it, it.cardAt + 0.1, t);
      if (it.say[1]) stream(it.say[1], it.cardAt + 0.35, t);
    }
  }
  // the thread reaches as far as what has arrived and is clipped there (latest.bfdfd5c2.css), so the chat scrolls over
  // that and no further; it keeps its latest in view unless the viewer has scrolled up from it (latest.bfdfd5c2.js)
  f.feedIn.style.height = `${(arrived(f.items, t, wide) + (f.pad ?? PAD)).toFixed(2)}px`;
  if (following(f.feed)) f.feed.scrollTop = f.feed.scrollHeight;

  // composer: the user's draft types in, the send button lights while there is text; while it is empty the placeholder
  // turns through its suggestions (with reduced motion they only fade)
  const draft = S.typing.find((d) => t >= d.start && t < d.send);
  const text = draft ? draft.text.slice(0, countAt(draft.text, draft.start, TYPE_CPS, t)) : '';
  if (text !== f.shownTyped) { f.typed.textContent = text; f.shownTyped = text; }
  const hint = hintAt(t, S.hintFrom ?? S.typing[0].send, S.hints ?? HINTS);
  if (hint.text !== f.shownHint) { f.ph.textContent = hint.text; f.shownHint = hint.text; }
  f.ph.style.opacity = hint.k.toFixed(3);
  f.ph.style.transform = REDUCED || !hint.y ? 'none' : `translateY(${hint.y.toFixed(2)}px)`;
  f.ph.style.display = text ? 'none' : '';
  f.caret.style.display = draft ? '' : 'none';
  f.caret.style.opacity = !draft || t < draft.start + draft.text.length / TYPE_CPS || caretOn(t) ? '1' : '0';
  f.send.classList.toggle('is-on', !!text);

  // activity
  const last = lastAt(S.acts, t);
  f.empty.style.opacity = last ? '0' : '1';
  for (const r of f.rows) {
    reveal(r.node, enter(t, r.a.at));
    if (r.pop) paintPop(r, r.a.at, t);
  }
  const actRoom = f.list.clientHeight - 12; // .ac-in padding
  f.actIn.style.transform = `translateY(${(-Math.max(0, arrived(f.rows, t) - actRoom)).toFixed(2)}px)`;
}
