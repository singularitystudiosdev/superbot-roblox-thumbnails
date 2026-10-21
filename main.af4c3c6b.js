// The spot's clock: builds the schedule, the chat and the live view, waits for fonts and images so every measured
// position is final, then paints one frame per animation frame from t, looping every L seconds. ?t=12.5 freezes a frame
// (for thumbnails and captures); space pauses, R restarts, the arrow keys step a second.
import { buildSchedule } from './schedule.af4c3c6b.js';
import { buildScreen, fit, measure, paint, ready } from './screen.af4c3c6b.js';
import { buildFeed, measureFeed, paintFeed } from './feed.af4c3c6b.js';
import { seg, lerp, outCubic, REDUCED } from './lib.af4c3c6b.js';

const S = buildSchedule();
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');
const view = buildScreen(document.querySelector('.cc-view'));
const feed = buildFeed(document.querySelector('.ch'), document.querySelector('.ac'), S);

// the sidebar: off the right edge until the first message is sent, then it slides in as the chat narrows to its left
// (with reduced motion it fades in instead)
const chat = document.querySelector('.ch'), side = document.querySelector('.cc');
const APP_W = 1200, CHAT_W = 476, SIDE_W = 724, SIDE_IN = 0.5;
function dock(t) {
  const k = outCubic(seg(t, S.panel, S.panel + SIDE_IN));
  chat.style.width = `${lerp(APP_W, CHAT_W, REDUCED ? (k > 0 ? 1 : 0) : k).toFixed(2)}px`;
  side.style.transform = REDUCED || k >= 1 ? 'none' : `translateX(${((1 - k) * SIDE_W).toFixed(2)}px)`;
  side.style.opacity = REDUCED ? k.toFixed(3) : '1';
  side.style.visibility = k > 0 ? 'visible' : 'hidden';
}
// the opening layout from the first instant, before the pages have loaded and the clock has started
dock(-1);

function scaleStage() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', scaleStage);
scaleStage();

const params = new URLSearchParams(location.search);
const frozen = params.has('t') ? Number(params.get('t')) : null;
if (frozen !== null) document.body.classList.add('freeze');
// the key hint only on ?controls=1, so the gallery's embed is the app alone
if (params.get('controls') === '1') document.querySelector('.hint').hidden = false;

function frame(t) {
  const lt = ((t % S.L) + S.L) % S.L;
  // a short dip to white where the loop comes round
  dip.style.opacity = Math.max(seg(lt, S.L - 0.45, S.L), 1 - seg(lt, 0, 0.35)).toFixed(3);
  dock(lt);
  if (liveView) paint(view, S, lt);
  paintFeed(feed, S, lt);
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
  // heights are measured at the chat's docked width, the one its messages are read at
  chat.style.width = `${CHAT_W}px`;
  measureFeed(feed);
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
