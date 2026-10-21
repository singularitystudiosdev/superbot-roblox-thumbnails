// The spot with a chosen chat sidebar inside its app, which fills whatever frame it is in: drawn at the creative's own
// scale (the most of its 1200x675 the frame holds) and laid out as wide and as tall as the frame is at that scale, so no
// frame is letterboxed. This is the creative's main.af4c3c6b.js (as of 2026-10-21, with its sidebar layout: the chat
// and the live view share what the sidebar leaves), with two differences: the sidebar is this folder's (?v= picks the
// variant, ?state=loading|empty its list states), and it is static, so nothing paints it per frame. The chat's left
// offset and the live view's width are set inline here rather than through the creative's stylesheet.
import { buildSchedule } from '../schedule.af4c3c6b.js';
import { buildScreen, fit, measure, paint, ready } from '../screen.af4c3c6b.js';
import { buildFeed, measureFeed, paintFeed } from './feed.bdeb2397.js';
import { seg, lerp, outCubic, REDUCED } from '../lib.af4c3c6b.js';
import { sidebarHTML, variantIndex } from './shell.bdeb2397.js';
import { enhanceSidebar } from './interact.bdeb2397.js';
import { tinter } from './tint.bdeb2397.js';
import { mountChats } from './chatview.bdeb2397.js';

const S = buildSchedule();
// the vignette's color follows the app on screen (tint.bdeb2397.js)
const tint = tinter(S);
const params = new URLSearchParams(location.search);
const dip = document.getElementById('dip');
const view = buildScreen(document.querySelector('.cc-view'));
const feed = buildFeed(document.querySelector('.ch'), document.querySelector('.ac'), S);

const chat = document.querySelector('.ch'), side = document.querySelector('.cc');
const app = document.querySelector('.app');
app.insertAdjacentHTML('afterbegin', sidebarHTML(variantIndex(params.get('v') ?? 1), { state: params.get('state') || 'ready' }));
const sb = app.querySelector('.sb');
// the sidebar is a picture of the app: its rows are links to nowhere, so a click never leaves the spot
sb.addEventListener('click', (e) => { if (e.target.closest('a')) e.preventDefault(); });
enhanceSidebar(sb);
// its drawn width (the tokens' --sidebar-w, Claude's 242px at this app's scale) sets the app's columns
const SIDEBAR_W = parseFloat(getComputedStyle(sb).width);
if (!(SIDEBAR_W > 0)) throw new Error('the sidebar has no width: load sidebars.bdeb2397/tokens.bdeb2397.css before main.bdeb2397.js');
const SIDE_W = 560, SIDE_IN = 0.5;
// the creative's app: 1200x675, as the spot lays it out
const BASE_W = 1200, BASE_H = 675;
// the chat's width before the live view docks (the app's, less the sidebar) and after (less the live view as well);
// the room past 16:9 goes to the chat, the live view keeping its width
let APP_W = 0, CHAT_W = 0;
// the stage is the frame the page is in, edge to edge, on any page that loads this (the creative's own stage is a
// 1920x1080 picture scaled to fit, bars beside it)
Object.assign(document.getElementById('stage').style, { position: 'fixed', inset: '0', width: 'auto', height: 'auto', transform: 'none' });
function layout() {
  const k = Math.min(innerWidth / BASE_W, innerHeight / BASE_H);
  const w = innerWidth / k, h = innerHeight / k;
  app.style.width = `${w.toFixed(2)}px`;
  app.style.height = `${h.toFixed(2)}px`;
  app.style.transform = `scale(${k.toFixed(5)})`;
  APP_W = w - SIDEBAR_W;
  CHAT_W = APP_W - SIDE_W;
}
layout();
chat.style.left = `${SIDEBAR_W}px`;
side.style.width = `${SIDE_W}px`;
// every other chat in the sidebar opens over the spot, its Activity tab the live view's width (chatview.bdeb2397.js)
app.style.setProperty('--cv-side', `${SIDE_W}px`);
mountChats({ app, sb });

// the viewer's own control over it: the close button on the sidebar's top bar slides it away and the chat takes the
// window, the chat's panel button brings it back. It eases in real time, over whatever the spot's own clock is doing
const SIDE_TOGGLE = 420; // ms
const closeBtn = document.querySelector('.cc-close'), openBtn = document.querySelector('.ch-open');
let userSide = { from: 1, to: 1, at: 0 };
const userOpen = () => lerp(userSide.from, userSide.to, REDUCED ? 1 : outCubic(seg(performance.now(), userSide.at, userSide.at + SIDE_TOGGLE)));
function setSide(open) {
  userSide = { from: userOpen(), to: open ? 1 : 0, at: performance.now() };
  // a frozen frame has no loop of its own: run one until the slide has played
  if (frozen !== null) { const until = userSide.at + SIDE_TOGGLE + 30; const step = () => { frame(frozen); if (performance.now() < until) requestAnimationFrame(step); }; step(); }
}
closeBtn.addEventListener('click', () => setSide(false));
openBtn.addEventListener('click', () => setSide(true));

function dock(t) {
  const docked = outCubic(seg(t, S.panel, S.panel + SIDE_IN));
  const k = docked * userOpen();
  chat.style.width = `${lerp(APP_W, CHAT_W, REDUCED ? (k > 0 ? 1 : 0) : k).toFixed(2)}px`;
  side.style.transform = REDUCED || k >= 1 ? 'none' : `translateX(${((1 - k) * SIDE_W).toFixed(2)}px)`;
  side.style.opacity = REDUCED ? k.toFixed(3) : '1';
  side.style.visibility = k > 0 ? 'visible' : 'hidden';
  // the way back in shows only once there is a sidebar to bring back
  const back = docked * (1 - userOpen());
  openBtn.style.opacity = back.toFixed(3);
  openBtn.style.pointerEvents = back > 0.5 ? 'auto' : 'none';
  return k;
}
// the opening layout from the first instant, before the pages have loaded and the clock has started
dock(-1);

// a new frame size: the app laid out again, and once the chat's heights are known, measured again at its new widths
let measured = false;
addEventListener('resize', () => {
  layout();
  if (!measured) return;
  measureChat();
  frame(frozen ?? now());
});

const frozen = params.has('t') ? Number(params.get('t')) : null;
if (frozen !== null) document.body.classList.add('freeze');
if (params.get('controls') === '1') document.querySelector('.hint').hidden = false;

function frame(t) {
  const lt = ((t % S.L) + S.L) % S.L;
  // a short dip to white where the loop comes round
  dip.style.opacity = Math.max(seg(lt, S.L - 0.45, S.L), 1 - seg(lt, 0, 0.35)).toFixed(3);
  const docked = dock(lt);
  if (liveView) { paint(view, S, lt); tint(view.edge, lt); }
  paintFeed(feed, S, lt, 1 - docked);
}

// false when the live view's pages never loaded: the chat and the Activity tab still play
let liveView = true;

// the chat's heights at both of its widths: docked beside the live view, and the whole window once it is away (the
// next frame sets its width back)
function measureChat() {
  chat.style.width = `${CHAT_W}px`;
  measureFeed(feed);
  chat.style.width = `${APP_W}px`;
  measureFeed(feed, true);
}

let origin = 0, paused = false, pausedAt = 0;
const now = () => (paused ? pausedAt : (performance.now() - origin) / 1000);
function loop() {
  frame(now());
  requestAnimationFrame(loop);
}

async function start() {
  await document.fonts.ready;
  await Promise.all([...document.images].filter((img) => img.getAttribute('src')).map((img) => img.decode().catch((e) => console.error(new Error(`image failed to decode: ${img.src}`, { cause: e })))));
  try {
    await ready(view);
  } catch (e) {
    console.error(new Error('starting without the live view', { cause: e }));
    liveView = false;
  }
  if (liveView) {
    fit(view);
    measure(view);
  }
  measureChat();
  measured = true;
  window.__sidebarReady = true;
  if (frozen !== null) {
    frame(frozen);
    // the table's thumbnails are CSS backgrounds in the Creator Hub frame: give them a beat to paint before a capture
    await new Promise((r) => setTimeout(r, 400));
    frame(frozen);
    window.__ready = true;
    return;
  }
  origin = performance.now();
  window.__ready = true;
  loop();
}

addEventListener('keydown', (e) => {
  if (frozen !== null) return;
  // typing a group's name, or moving through a menu, is not playback control
  if (e.target.closest?.('input, textarea, dialog, [role="menu"]')) return;
  if (e.key === ' ') {
    e.preventDefault();
    if (paused) { origin = performance.now() - pausedAt * 1000; paused = false; } else { pausedAt = now(); paused = true; }
  } else if (e.key === 'r' || e.key === 'R') {
    origin = performance.now(); pausedAt = 0;
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const d = e.key === 'ArrowRight' ? 1 : -1;
    if (paused) pausedAt = Math.max(0, pausedAt + d); else origin -= d * 1000;
  }
});

start().catch((e) => { console.error(e); throw e; });
