// A chat's run playing in its open chat view (chatview.bdeb2397.js), on its own clock from the moment it opens, looped
// with the live chat's dip to white: the chat and the Activity tab painted by the creative's own feed
// (feed.bdeb2397.js), the computer view by playscreen.8889b4ff.js, all from one schedule (play.8889b4ff.js) built from
// the chat's script (plays.8889b4ff.js). ?t= holds a chat at that moment, as it holds the live one. Space pauses,
// R restarts and the arrows step a second, as they do the live one.
import { seg } from '../lib.af4c3c6b.js';
import { buildPlay } from './play.8889b4ff.js';
import { buildPlayScreen, decodePlay, measurePlay, paintPlay } from './playscreen.8889b4ff.js';
import { buildFeed, measureFeed, paintFeed } from './feed.bdeb2397.js';
import { PLAYS } from './plays.8889b4ff.js';
import { SCREENS } from './screens.bdeb2397.js';
import { FX } from './chats.bdeb2397.js';
import { asset } from './parts.bdeb2397.js';

export const hasPlay = (id) => !!PLAYS[id];

const params = new URLSearchParams(location.search);
const frozen = params.has('t') ? Number(params.get('t')) : null;

// a chat's pages: its pages.json files (or pages written into its script), every path made absolute
async function pagesOf(play) {
  const files = typeof play.pages === 'object' && !Array.isArray(play.pages) ? [null] : [play.pages].flat();
  const pages = {};
  for (const file of files) {
    const url = file ? asset(file) : import.meta.url;
    let list = play.pages;
    if (file) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      list = (await res.json()).pages;
    }
    const at = (p) => new URL(p, url).href;
    for (const [id, pg] of Object.entries(list)) {
      pages[id] = { ...pg, img: at(pg.img), fav: at(pg.fav), scroll: pg.scroll && { ...pg.scroll, img: at(pg.scroll.img) }, field: pg.field && { ...pg.field } };
    }
  }
  for (const pg of Object.values(pages)) if (pg.field) pg.field.filledImg = pages[pg.field.filled].img;
  // a target the capture did not record, measured off the capture itself, written into the chat's script
  for (const [id, more] of Object.entries(play.targets ?? {})) pages[id].targets = { ...pages[id].targets, ...more };
  return pages;
}

// the chat's own cards and icons, in the feed's terms: pictures and icons by absolute path, an icon card on a tile
const pic = (c) => (c.img ? { img: asset(c.img) } : { tile: asset(FX[c.fx]) });
const card = (c) => c && (c.strip ? { strip: c.strip.map((s) => ({ ...pic(s), name: s.name })) } : { ...c, ...pic(c) });

const cache = new Map();
async function scheduleOf(id) {
  if (!cache.has(id)) {
    cache.set(id, (async () => {
      const play = PLAYS[id];
      const S = buildPlay(play, await pagesOf(play));
      for (const c of S.chat) c.card = card(c.card);
      for (const a of S.acts) a.icon = asset(FX[a.icon]);
      return S;
    })());
    // a run that failed to build is tried again the next time its chat opens
    cache.get(id).catch(() => cache.delete(id));
  }
  return cache.get(id);
}

const idle = { stop() {} };

// `page` is the open chat view (.cv), shown, and `fit` scales its computer view to the panel; resolves to the running
// play, whose stop() ends its clock and now() reads it. `current()` turns false once another chat has opened: then
// nothing is drawn. `at` is the clock it picks up from: a chat switched back to goes on where it was
export async function startPlay(page, id, fit, current, { at = 0 } = {}) {
  const S = await scheduleOf(id);
  if (!current()) return idle;
  const chat = page.querySelector('.cv-chat'), act = page.querySelector('.cv-side .ac');
  chat.querySelector('.cv-in').replaceChildren();
  act.querySelector('.ac-in').replaceChildren();
  const feed = buildFeed(chat, act, S);
  // the vignette in the chat's task color for the whole run, the one its still screen wears (screens.bdeb2397.js)
  const view = buildPlayScreen(page.querySelector('.cv-screen'), S, SCREENS[id].app);
  const dip = page.querySelector('.cv-dip');
  fit();
  await document.fonts.ready;
  measureFeed(feed);
  measurePlay(view, S);

  const frame = (t) => {
    const lt = ((t % S.L) + S.L) % S.L;
    // a short dip to white where the loop comes round, as the live chat's; none as the chat first opens
    dip.style.opacity = Math.max(seg(lt, S.L - 0.45, S.L), t >= S.L ? 1 - seg(lt, 0, 0.35) : 0).toFixed(3);
    paintPlay(view, S, lt);
    paintFeed(feed, S, lt);
  };
  const remeasure = () => { measureFeed(feed); frame(now()); };
  addEventListener('resize', remeasure);

  let origin = performance.now() - at * 1000, paused = false, pausedAt = 0, running = true;
  const now = () => (frozen !== null ? frozen : paused ? pausedAt : (performance.now() - origin) / 1000);
  const keys = (e) => {
    if (frozen !== null || e.target.closest?.('input, textarea, dialog, [role="menu"]')) return;
    if (e.key === ' ') { e.preventDefault(); if (paused) { origin = performance.now() - pausedAt * 1000; paused = false; } else { pausedAt = now(); paused = true; } }
    else if (e.key === 'r' || e.key === 'R') { origin = performance.now(); pausedAt = 0; }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const d = e.key === 'ArrowRight' ? 1 : -1; if (paused) pausedAt = Math.max(0, pausedAt + d); else origin -= d * 1000; }
  };
  addEventListener('keydown', keys);
  frame(now());
  await decodePlay(view);
  frame(now());
  if (frozen !== null) {
    // a held frame says how long a pass is, for the tools that step through a run (tools/plays-verify.8889b4ff.mjs)
    window.__playLength = S.L;
    window.__playReady = true;
  } else {
    origin = performance.now() - at * 1000;
    const loop = () => { if (!running) return; frame(now()); requestAnimationFrame(loop); };
    loop();
  }
  return {
    S,
    now,
    stop() { running = false; removeEventListener('resize', remeasure); removeEventListener('keydown', keys); },
  };
}
