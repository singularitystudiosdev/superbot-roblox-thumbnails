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
import { tintEdge } from './tint.bdeb2397.js';
import { mountChats } from './chatview.bdeb2397.js';
import { mountLatest, park, land } from './latest.bfdfd5c2.js';
import { CHATS } from './chats.bdeb2397.js';

// the run: built again around another prompt when a chat started from the Automations tab plays it (spot-ask, below)
let S = buildSchedule();
const params = new URLSearchParams(location.search);
const dip = document.getElementById('dip');
const view = buildScreen(document.querySelector('.cc-view'));
// the live chat works on a Roblox game: its vignette is Roblox's logo blue for the whole run (tint.bdeb2397.js)
tintEdge(view.edge, 'roblox');
let feed = buildFeed(document.querySelector('.ch'), document.querySelector('.ac'), S);

const chat = document.querySelector('.ch'), side = document.querySelector('.cc');
const app = document.querySelector('.app');
// the chat scrolls as the run plays, a pill over the composer counting what is under the view (latest.bfdfd5c2.js)
mountLatest(chat.querySelector('.ch-feed'));
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
// the sidebar's own width, or none while its Collapse button has folded it away (sb-collapse, sidebar-tools.854d0793.js)
let sbW = SIDEBAR_W;
// the stage is the frame the page is in, edge to edge, on any page that loads this (the creative's own stage is a
// 1920x1080 picture scaled to fit, bars beside it)
Object.assign(document.getElementById('stage').style, { position: 'fixed', inset: '0', width: 'auto', height: 'auto', transform: 'none' });
function layout() {
  const k = Math.min(innerWidth / BASE_W, innerHeight / BASE_H);
  const w = innerWidth / k, h = innerHeight / k;
  app.style.width = `${w.toFixed(2)}px`;
  app.style.height = `${h.toFixed(2)}px`;
  app.style.transform = `scale(${k.toFixed(5)})`;
  APP_W = w - sbW;
  CHAT_W = APP_W - SIDE_W;
  chat.style.left = `${sbW}px`;
}
layout();
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
function relayout() {
  layout();
  if (!measured) return;
  measureChat();
  frame(frozen ?? now());
}
addEventListener('resize', relayout);
sb.addEventListener('sb-collapse', (e) => { sbW = e.detail.shut ? 0 : SIDEBAR_W; relayout(); });

const frozen = params.has('t') ? Number(params.get('t')) : null;
if (frozen !== null) document.body.classList.add('freeze');
if (params.get('controls') === '1') document.querySelector('.hint').hidden = false;

function frame(t) {
  if (held) t = pausedAt;
  // a run that asks which game it is for waits at its question until it is answered (spot-answer, below), and says when
  // it is there and when it is not (gameask.b3fb005c.js shows the question)
  const asking = waiting() && t >= S.gate;
  if (asking) t = S.gate;
  if (asking !== gateOpen) {
    gateOpen = asking;
    sb.dispatchEvent(new CustomEvent('spot-gate', { detail: { open: asking, automation } }));
  }
  work(t);
  const lt = ((t % S.L) + S.L) % S.L;
  // a short dip to white where the loop comes round
  dip.style.opacity = Math.max(seg(lt, S.L - 0.45, S.L), 1 - seg(lt, 0, 0.35)).toFixed(3);
  const docked = dock(lt);
  if (liveView) paint(view, S, lt);
  // held (spot-still, below), the chat and the Activity tab stay as they were laid out to scroll
  if (!held) paintFeed(feed, S, lt, 1 - docked);
}

// the agent at work as the run shows it: the Activity steps, clicks on the computer view and replies the run has
// passed since the last frame go to the sidebar as spot-work, which spends credits on them (sidebar-tools.854d0793.js).
// A held run (its jump to where every step is in), a frozen frame, a run started again or a gap longer than a loop
// does no work
let workedTo = null;
function work(t) {
  const from = workedTo;
  workedTo = held || frozen !== null ? null : t;
  if (from === null || workedTo === null || t <= from || t - from > S.L) return;
  const a = ((from % S.L) + S.L) % S.L, b = ((t % S.L) + S.L) % S.L;
  const passed = (at) => (a < b ? at > a && at <= b : at > a || at <= b);
  const detail = {
    steps: S.acts.filter((x) => passed(x.at)).length,
    clicks: S.clicks.filter((x) => passed(x.at)).length,
    replies: S.chat.filter((x) => x.kind === 'bot' && passed(x.at)).length,
  };
  if (detail.steps + detail.clicks + detail.replies) sb.dispatchEvent(new CustomEvent('spot-work', { detail }));
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
  if (held) settle();
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
  // a held chat is the viewer's, not a playback
  if (frozen !== null || held) return;
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

// spot-ask: a chat started from the Automations tab (newchat.854d0793.js) is this run with its own prompt typed in. The
// run is built again around that prompt and plays from its start; `ask: null` is the spot's own prompt, and `restart`
// plays from the start even when the prompt asked for is the one already playing. `automation` (the id of the one
// started) makes the run ask which game it is for once the prompt is sent, and `game` is the answer once there is one
let ask = null, automation = null, game = null, gateOpen = false;
const waiting = () => S.gate !== undefined && !game;
// `keep`: what the viewer added to a held chat (live.e61b4e86.js) stays at its foot
function rebuild(keep = false) {
  const ours = new Set([...feed.items, ...feed.rows].map((it) => it.node));
  const extra = (parent) => (keep ? [...parent.children].filter((n) => !ours.has(n)) : []);
  const keptChat = extra(feed.feedIn), keptActs = extra(feed.actIn);
  S = buildSchedule(ask ?? undefined, { asks: !!automation, game });
  feed.feedIn.replaceChildren();
  feed.actIn.replaceChildren();
  feed = buildFeed(chat, document.querySelector('.ac'), S);
  feed.feedIn.append(...keptChat);
  feed.actIn.append(...keptActs);
  // before the first measure, start() measures it
  if (measured) measureChat();
}
// where each chat the live view plays was left: its clock, when, and how far its chat was scrolled. One switched back to
// goes on as if it had played all along, its chat where the viewer left it and what came in meanwhile under the view
// (latest.bfdfd5c2.js); one played for the first time, or started afresh (`restart`), plays from its start, its chat
// at the top. `resumeAt` is the clock the run switched to picks up from
const places = new Map();
let shownId = CHATS.find((c) => c.live).id, resumeAt = 0;
function switchChat(id, fresh) {
  places.set(shownId, { at: now(), when: performance.now(), top: feed.feed.scrollTop });
  shownId = id;
  const p = fresh ? null : places.get(id);
  resumeAt = p ? p.at + (performance.now() - p.when) / 1000 : 0;
  park(feed.feed, p ? p.top : 0);
}
sb.addEventListener('spot-ask', (e) => {
  const next = e.detail.ask ?? null, nextAuto = e.detail.automation ?? null, nextGame = e.detail.game ?? null;
  const same = next === ask && nextAuto === automation && nextGame === game;
  if (same && !e.detail.restart) return;
  switchChat(e.detail.id ?? shownId, !!e.detail.restart);
  if (!same) {
    ask = next; automation = nextAuto; game = nextGame;
    rebuild();
  }
  if (held) { hold(false); return; }
  origin = performance.now() - resumeAt * 1000; pausedAt = resumeAt; resumeAt = 0;
  if (frozen !== null && measured) frame(frozen);
});

// spot-answer (gameask.b3fb005c.js): the run's question answered, it goes on from where it waited, the answer its next
// message; a held chat stays held, laid out again at its latest
sb.addEventListener('spot-answer', (e) => {
  if (!waiting()) return;
  game = e.detail.game;
  rebuild(true);
  if (held) { hold(true); return; }
  if (paused) pausedAt = S.gate; else origin = performance.now() - S.gate * 1000;
  if (frozen !== null && measured) frame(frozen);
});

// spot-still and spot-play (live.e61b4e86.js): the viewer takes the chat over, writing in it or stopping it, and the run
// holds where every message and step is in, before the loop comes round, the chat and the Activity tab laid out to
// scroll at their latest (.is-still); or gives it back, the run from its start. A run still asking which game it is for
// holds at its question, nothing after it in yet
const STILL_BEFORE = 0.5; // s before the loop's end: the last card out, the dip to white (its last 0.45 s) not begun
let held = false;
function settle() {
  paintFeed(feed, S, pausedAt, 0);
  // the thread grows with what the viewer sends, and the Activity tab scrolls rather than moves
  feed.feedIn.style.height = '';
  feed.actIn.style.transform = '';
  // the chat where the viewer left it, or at its latest if they were following it (latest.bfdfd5c2.js)
  land(feed.feed);
  feed.list.scrollTop = feed.list.scrollHeight;
}
function hold(on) {
  // a run already playing has nothing to give back: spot-ask has picked it up where it was
  if (!on && !held) return;
  held = on;
  app.classList.toggle('is-still', on);
  if (on) { paused = true; pausedAt = waiting() ? S.gate : S.L - STILL_BEFORE; } else { paused = false; pausedAt = 0; origin = performance.now() - resumeAt * 1000; resumeAt = 0; }
  // before the first measure, start() settles it
  if (!measured) return;
  if (on) settle(); else { feed.feed.scrollTop = 0; feed.list.scrollTop = 0; }
  frame(frozen ?? now());
}
sb.addEventListener('spot-still', () => hold(true));
sb.addEventListener('spot-play', () => hold(false));

start().catch((e) => { console.error(e); throw e; });
