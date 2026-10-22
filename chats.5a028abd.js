// The chat list down the app's left edge: ?chats=1..10 picks one of chat-variants.5a028abd.js; with no parameter the spot
// is as it was. The app is laid out that much wider and drawn that much smaller, so the chat and the sidebar keep the
// sizes every measurement is taken at. The open chat's slots are painted from t like the rest of the spot: its icon pops
// from the new chat's speech balloon to the thumbnails' framed picture once the prompt is sent, and to a trophy for a
// beat on each new best; its title, last message and current step fade in as they change.
import { seg, outCubic, lastAt, el, REDUCED } from './lib.af4c3c6b.js';
import { VARIANTS, LIVE } from './chat-variants.5a028abd.js';

const FX = 'img/fx/';
const APP_W = 1200, APP_H = 675, STAGE_W = 1920;
const FADE = 0.3, POP = 0.35, TROPHY_HOLD = 2.6;
const IMG_SLOTS = new Set(['icon', 'step-icon']);
const backOut = (k) => 1 + 3.2 * (k - 1) ** 3 + 2.2 * (k - 1) ** 2;
const byAt = (a, b) => a.at - b.at;

// what each slot shows over the loop, as a time-sorted list of { at, v }
function timelines(S) {
  const sent = S.chat[0].at;
  const wins = S.acts.filter((a) => a.icon === 'trophy');
  return {
    icon: [{ at: -Infinity, v: 'speech_balloon' }, { at: sent, v: 'framed_picture' },
      ...wins.flatMap((a) => [{ at: a.at, v: 'trophy' }, { at: a.at + TROPHY_HOLD, v: 'framed_picture' }])].sort(byAt),
    title: [{ at: -Infinity, v: LIVE.draft }, { at: sent, v: LIVE.title }],
    short: [{ at: -Infinity, v: LIVE.draft }, { at: sent, v: LIVE.short }],
    preview: [{ at: -Infinity, v: LIVE.hint }, ...S.chat.map((c) => ({ at: c.at, v: c.text }))].sort(byAt),
    'step-icon': [{ at: -Infinity, v: 'speech_balloon' }, ...S.acts.map((a) => ({ at: a.at, v: a.icon }))].sort(byAt),
    step: [{ at: -Infinity, v: LIVE.idle }, { at: sent, v: LIVE.reading }, ...S.acts.map((a) => ({ at: a.at, v: a.text }))].sort(byAt),
    work: [{ at: -Infinity, v: 0 }, { at: sent, v: 1 }],
  };
}

function write(node, kind, v) {
  if (IMG_SLOTS.has(kind)) node.src = `${FX}${v}.png`;
  else if (kind !== 'work') node.textContent = v;
}

// an icon pops in on its change (with reduced motion it only swaps); text and the working dot fade in
function animate(node, kind, e, t) {
  const dt = t - e.at;
  if (IMG_SLOTS.has(kind)) {
    node.style.transform = REDUCED || dt >= POP ? 'none' : `scale(${backOut(seg(dt, 0, POP)).toFixed(3)})`;
  } else {
    node.style.opacity = (kind === 'work' && !e.v ? 0 : outCubic(seg(dt, 0, FADE))).toFixed(3);
  }
}

export function mountChats(S) {
  const v = VARIANTS[Number(new URLSearchParams(location.search).get('chats')) - 1];
  if (!v) return null;
  const app = document.querySelector('.app');
  const w = APP_W + v.width;
  app.dataset.chats = v.id;
  app.style.setProperty('--cl', `${v.width}px`);
  app.style.width = `${w}px`;
  app.style.height = `${((APP_H * w) / APP_W).toFixed(2)}px`;
  app.style.transform = `scale(${(STAGE_W / w).toFixed(5)})`;
  const nav = el(`<nav class="cl cl-${v.id}" aria-label="Chats">${v.html()}</nav>`);
  app.prepend(nav);

  const tl = timelines(S);
  // every icon the open chat can turn to, in the document so main.af4c3c6b.js start() decodes it before the clock runs
  const icons = new Set([...tl.icon, ...tl['step-icon']].map((e) => e.v));
  nav.append(el(`<span class="cl-preload" aria-hidden="true">${[...icons].map((i) => `<img src="${FX}${i}.png" alt="" width="1" height="1">`).join('')}</span>`));

  const slots = [...nav.querySelectorAll('[data-live]')].map((node) => ({ node, kind: node.dataset.live, tl: tl[node.dataset.live], cur: null }));
  return {
    paint(t) {
      for (const s of slots) {
        const e = lastAt(s.tl, t);
        if (e !== s.cur) { s.cur = e; write(s.node, s.kind, e.v); }
        animate(s.node, s.kind, e, t);
      }
    },
  };
}
