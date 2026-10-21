// The spot with a chosen chat sidebar inside its own 1200x675 app, so the page keeps the creative's 16:9 and nothing is
// letterboxed beside it. This is the creative's main.af4c3c6b.js (as of 2026-10-21, with its sidebar layout: the chat
// and the live view share what the sidebar leaves), with two differences: the sidebar is this folder's (?v= picks the
// variant, ?state=loading|empty its list states), and it is static, so nothing paints it per frame. The chat's left
// offset and the live view's width are set inline here rather than through the creative's stylesheet.
import { buildSchedule } from '../schedule.af4c3c6b.js';
import { buildScreen, fit, measure, paint, ready } from '../screen.af4c3c6b.js';
import { buildFeed, measureFeed, paintFeed } from '../feed.af4c3c6b.js';
import { seg, lerp, outCubic, REDUCED } from '../lib.af4c3c6b.js';
import { sidebarHTML, variantIndex } from './shell.bdeb2397.js';
import { enhanceSidebar } from './interact.bdeb2397.js';

const S = buildSchedule();
const params = new URLSearchParams(location.search);
const stage = document.getElementById('stage');
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
const APP_W = 1200 - SIDEBAR_W, SIDE_W = 560, CHAT_W = APP_W - SIDE_W, SIDE_IN = 0.5;
chat.style.left = `${SIDEBAR_W}px`;
side.style.width = `${SIDE_W}px`;

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

function scaleStage() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', scaleStage);
scaleStage();

const frozen = params.has('t') ? Number(params.get('t')) : null;
if (frozen !== null) document.body.classList.add('freeze');
if (params.get('controls') === '1') document.querySelector('.hint').hidden = false;

function frame(t) {
  const lt = ((t % S.L) + S.L) % S.L;
  // a short dip to white where the loop comes round
  dip.style.opacity = Math.max(seg(lt, S.L - 0.45, S.L), 1 - seg(lt, 0, 0.35)).toFixed(3);
  const docked = dock(lt);
  if (liveView) paint(view, S, lt);
  paintFeed(feed, S, lt, 1 - docked);
}

// false when the live view's pages never loaded: the chat and the Activity tab still play
let liveView = true;

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
  // the chat's heights at both of its widths: docked beside the live view, and the whole window once it is away
  chat.style.width = `${CHAT_W}px`;
  measureFeed(feed);
  chat.style.width = `${APP_W}px`;
  measureFeed(feed, true);
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
