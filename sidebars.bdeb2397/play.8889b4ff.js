// A chat's run as data, scripted the way schedule.af4c3c6b.js scripts the live one: what superbot does on the screen,
// the Activity line it logs for each step, and what it posts to the chat. A chat's script (plays/<id>.8889b4ff.js)
// drives a clock through the calls below; each call lands its events at the clock's time and moves it on. The pages
// are real captures of each app (plays/<id>/pages.json): superbot types an address, a page loads, the cursor travels to
// a real element on it and presses it, the page scrolls or changes state, exactly as the app does. One pass is L
// seconds; the chat view (chatplay.8889b4ff.js) loops it as the live chat loops.
import { STREAM_CPS } from '../lib.af4c3c6b.js';

const URL_CPS = 34; // superbot's typing in Chrome's address bar
const LONG_URL_CPS = 80; // a long address, typed fast
const LONG_URL = 48; // characters past which an address counts as long
const FIELD_CPS = 30; // superbot's typing in a page's own field
const MOVE = 0.45; // the cursor's travel to a target
const PRESS = 0.05; // from arriving to pressing
const LOAD = 0.45; // a page's load, blank, before it shows
const POST = 0.25; // a chat post lands this long after the Activity line it belongs to
const HOLD = 3.4; // the last post stays up this long once it is fully out, before the loop comes round
const ENTER = 0.32; // an item's fade and rise (feed.bdeb2397.js)

// `transcript` is the chat's (transcripts.bdeb2397.js): its messages are posted and its Activity lines landed in their
// order, each where the script calls for the next one, and the script must use every one. `pages` is the chat's
// pages.json `pages`, every path resolved.
export function buildPlay({ transcript, script }, pages) {
  const S = {
    chat: [], acts: [], moves: [], clicks: [], tabs: [{ openAt: -1 }], views: [[{ at: -1, v: 'ntp' }]], active: [{ at: -1, tab: 0 }],
    omni: [{ at: -1, mode: 'ph' }], scrolls: {}, fields: [], typing: [], hints: [transcript.hint], hintFrom: 0, control: 0.6, L: 0, pages,
  };
  const messages = [...transcript.messages], acts = [...transcript.acts];
  let t = 0, tab = 0;
  const shown = [null]; // the page each tab shows, null on its New Tab page
  const scrollOf = {}; // where each page is scrolled
  const page = (id) => {
    const pg = pages[id];
    if (!pg) throw new Error(`no page named ${id} in this chat's pages.json`);
    return pg;
  };

  // the cursor's moves name a target: Chrome's own (omni, reload, back, plus:<n>, tab:<i>) or one on the page shown
  const target = (name) => {
    if (/^(omni|reload|back|plus:\d+|tab:\d+)$/.test(name)) return { chrome: name };
    const id = shown[tab];
    const pg = page(id);
    // one in the scrolling region goes with it
    if (pg.scroll?.targets?.[name]) return { page: id, name, inScroll: true };
    if (pg.targets?.[name]) return { page: id, name };
    throw new Error(`page ${id} has no target named ${name}`);
  };
  const move = (to, dur = MOVE) => { S.moves.push({ t0: t, t1: t + dur, to: target(to) }); t += dur; };
  const show = (id, v = 'page') => { S.views[tab].push({ at: t, v, page: id }); if (v === 'page') shown[tab] = id; };
  const urlOf = (id) => page(id).host + page(id).path;

  const p = {
    get t() { return t; },
    wait(s) { t += s; return p; },
    at(s) { t = s; return p; },
    // the chat's next message: the user's lands now, superbot's a beat after the Activity line it belongs to
    post() {
      const m = messages.shift();
      if (!m) throw new Error('the script posts more messages than the chat has');
      S.chat.push(m.u ? { at: t, kind: 'user', text: m.u } : { at: t + POST, kind: 'bot', text: m.b, card: m.card, after: m.after });
      return p;
    },
    // the chat's next Activity line, now
    step() {
      const a = acts.shift();
      if (!a) throw new Error('the script lands more Activity lines than the chat has');
      const [icon, text, win = false] = a;
      S.acts.push({ at: t, icon, text, win });
      return p;
    },
    // superbot takes the computer: the vignette comes up
    control() { S.control = t; return p; },
    // the cursor goes to a target and rests there, or goes and presses it
    point(name, dur = MOVE) { move(name, dur); return p; },
    press(name) { move(name); t += PRESS; S.clicks.push({ at: t }); return p; },
    // an address typed into the omnibox of the tab on screen (the page's own, or the shorter one a person would type,
    // `typed`), then the page it loads
    open(id, typed) {
      p.press('omni');
      S.omni.push({ at: t, mode: 'ph' });
      t += 0.15;
      const url = typed ?? urlOf(id), cps = url.length > LONG_URL ? LONG_URL_CPS : URL_CPS;
      S.omni.push({ at: t, mode: 'type', text: url, start: t, cps });
      t += url.length / cps + 0.12;
      return p.load(id);
    },
    // a new tab from the + button, and the address typed into it
    newTab(id, typed) {
      p.press(`plus:${S.tabs.length}`);
      S.tabs.push({ openAt: t });
      S.views.push([{ at: t, v: 'ntp' }]);
      shown.push(null);
      tab = S.tabs.length - 1;
      S.active.push({ at: t, tab });
      S.omni.push({ at: t, mode: 'ph' });
      t += 0.2;
      return p.open(id, typed);
    },
    // back to a tab already open
    tab(i) {
      p.press(`tab:${i}`);
      tab = i;
      S.active.push({ at: t, tab });
      S.omni.push({ at: t, mode: 'url', tab });
      return p;
    },
    // a navigation: the tab loads, blank, then the page; the address shows the new page's as soon as it starts
    load(id, dur = LOAD) {
      show(id, 'load');
      S.omni.push({ at: t, mode: 'url', tab });
      t += dur;
      show(id);
      return p;
    },
    // the page changing in place (a list re-sorted, a box ticked, a dialog opened): no load
    show(id) { show(id); S.omni.push({ at: t, mode: 'url', tab }); return p; },
    // Chrome's reload button, and what the page shows after it
    reload(id) { p.press('reload'); return p.load(id); },
    // Chrome's back button, to the page before
    back(id) { p.press('back'); return p.load(id); },
    // the page on screen scrolled, its own scrolling region, from where it is to `to` px
    scroll(to, dur = 0.7) {
      const id = shown[tab];
      if (!page(id).scroll) throw new Error(`page ${id} has no scroll layer`);
      (S.scrolls[id] ??= []).push({ t0: t, t1: t + dur, from: scrollOf[id] ?? 0, to });
      scrollOf[id] = to;
      t += dur;
      return p;
    },
    // superbot types into the page's field, then the page shows it filled
    type() {
      const id = shown[tab], f = page(id).field;
      if (!f) throw new Error(`page ${id} has no typed field`);
      S.fields.push({ page: id, start: t, cps: FIELD_CPS, n: f.text.length });
      t += f.text.length / FIELD_CPS + 0.15;
      return p.show(f.filled);
    },
  };
  script(p);
  if (messages.length || acts.length) throw new Error(`the script left ${messages.length} messages and ${acts.length} Activity lines unused`);

  // one pass: until the last post is fully out and has been read, or the last line has landed
  const out = (c) => c.at + ENTER + (c.kind === 'bot' ? 0.08 + c.text.length / STREAM_CPS + (c.card ? 0.15 + ENTER : 0) + (c.after ? 0.35 + c.after.length / STREAM_CPS : 0) : 0);
  S.L = Math.max(t, ...S.chat.map(out), ...S.acts.map((a) => a.at + ENTER)) + HOLD;

  for (const list of [S.chat, S.acts, S.active, S.omni, S.clicks]) list.sort((a, b) => a.at - b.at);
  for (const v of S.views) v.sort((a, b) => a.at - b.at);
  // moves must follow one another: two that overlap would make the cursor jump
  for (let k = 1; k < S.moves.length; k++) if (S.moves[k].t0 < S.moves[k - 1].t1 - 1e-6) throw new Error(`cursor moves overlap at ${S.moves[k].t0.toFixed(2)}s`);
  return S;
}
