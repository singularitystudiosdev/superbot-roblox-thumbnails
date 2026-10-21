// The live view: Chrome full screen on a 1470x919 desktop, scaled whole into the sidebar, as the computer-control-v3-soft
// variant draws it. Its pages are the captured Roblox documents (rbx/: roblox.com's ROB IT page and Creator Hub's
// Thumbnails page, plain and in its edit view), each in a frame at Chrome's own page size, so they render as
// themselves. The table's state, every scroll position, the tabs, the address bar and the cursor are painted from t.
import { seg, lerp, outCubic, inOutCubic, caretOn, countAt, lastAt, REDUCED } from './lib.af4c3c6b.js';
import { bindTable, renderTable, THUMBS } from './rbx.af4c3c6b.js';

export const DESK = { w: 1470, h: 919 };
const PAGE_TOP = 82; // the tab strip (42) and the toolbar (40) above the page
const TAB_W = 240, PLUS_GAP = 8, PLUS = 28;
const ROW_H = 89; // one row of Creator Hub's thumbnail table
const TIP = { x: 4, y: 2.5 }; // the arrow's hotspot in its 24px box
const REST = { x: 1010, y: 640 }; // where the cursor sits before superbot moves it
const ARROW = 'M4 2.5 4 19.5 8.6 15.3 11.5 21.8 14.4 20.5 11.6 14.2 17.8 14.2Z';
const IC = {
  x: '<svg viewBox="0 0 16 16"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>',
  plus: '<svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg>',
  back: '<svg viewBox="0 0 16 16"><path d="M13 8H3M7 4L3 8l4 4"/></svg>',
  fwd: '<svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
  reload: '<svg viewBox="0 0 16 16"><path d="M13 8a5 5 0 1 1-1.5-3.5M13 3v3h-3"/></svg>',
  tune: '<svg viewBox="0 0 16 16"><path d="M3 5h5.5M12.5 5H13M3 11h.5M7.5 11H13"/><circle cx="10.5" cy="5" r="1.6"/><circle cx="5.5" cy="11" r="1.6"/></svg>',
  search: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4"/><path d="M10 10l3 3"/></svg>',
  more: '<svg viewBox="0 0 16 16"><path d="M8 3.5h.01M8 8h.01M8 12.5h.01"/></svg>',
};

// the two tabs superbot works in, with what Chrome shows for each
export const TABS = [
  { fav: 'img/fav/roblox.png', title: 'ROB IT | Play on Roblox', host: 'roblox.com', path: '/games/96168869671905/ROB-IT' },
  { fav: 'img/fav/create.png', title: '[🎃] 💎 ROB IT / Thumbnails', host: 'create.roblox.com', path: '/dashboard/creations/experiences/9472441390/places/96168869671905/thumbnails' },
];
const FRAMES = { game: 'rbx/game/index.html', hub: 'rbx/thumbs/index.html', edit: 'rbx/thumbs-edit/index.html' };

function tabHTML(i) {
  return `<span class="cc-tab" data-tab="${i}"><i class="cc-tbg"></i><span class="cc-fav"><img src="${TABS[i].fav}" alt="" width="16" height="16"><i class="cc-spin"></i></span><span class="cc-tt">New Tab</span><span class="cc-x">${IC.x}</span></span>`;
}

export function buildScreen(root) {
  root.innerHTML = `<div class="cc-desk">
      <div class="cc-win">
        <div class="cc-strip">
          <span class="cc-lights"><i></i><i></i><i></i></span>
          <span class="cc-tabs">${TABS.map((_, i) => tabHTML(i)).join('')}</span>
          <span class="cc-plus">${IC.plus}</span>
        </div>
        <div class="cc-bar">
          <span class="cc-ic">${IC.back}</span><span class="cc-ic cc-dim">${IC.fwd}</span><span class="cc-ic cc-reload">${IC.reload}${IC.x}</span>
          <span class="cc-omni">
            <span class="cc-url cc-u-ph"><span class="cc-ic">${IC.search}</span><i class="cc-caret"></i><span class="cc-ph">Search Google or type a URL</span></span>
            <span class="cc-url cc-u-type"><span class="cc-ic">${IC.search}</span><span class="cc-typed"></span><i class="cc-caret"></i></span>
            <span class="cc-url cc-u-url"><span class="cc-ic">${IC.tune}</span><span><span class="cc-host"></span><span class="cc-path"></span></span></span>
          </span>
          <i class="cc-me"></i><span class="cc-ic">${IC.more}</span>
        </div>
        <div class="cc-pages">
          <img class="cc-page cc-ntp" src="img/new-tab.png" width="1470" height="839" alt="Chrome New Tab page">
          ${Object.entries(FRAMES).map(([k, src]) => `<iframe class="cc-page cc-doc" data-page="${k}" src="${src}" width="1470" height="837" tabindex="-1" title="${k}"></iframe>`).join('')}
          <div class="cc-page cc-blank"></div>
        </div>
      </div>
      <svg class="cc-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="${ARROW}"/></svg>
    </div>
    <i class="cc-edge"><i class="cc-soft"><i class="cc-band"></i></i></i>`;
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const frames = Object.fromEntries($$('.cc-doc').map((f) => [f.dataset.page, f]));
  return {
    root, desk: $('.cc-desk'), tabs: $$('.cc-tab'), plus: $('.cc-plus'), reload: $('.cc-reload'), omni: $('.cc-omni'),
    uPh: $('.cc-u-ph'), uType: $('.cc-u-type'), uUrl: $('.cc-u-url'), typed: $('.cc-typed'), host: $('.cc-host'), path: $('.cc-path'),
    carets: $$('.cc-caret'), ntp: $('.cc-ntp'), blank: $('.cc-blank'), frames, cursor: $('.cc-cursor'), edge: $('.cc-edge'), soft: $('.cc-soft'),
    targets: null, shownTyped: null, shownPage: null,
  };
}

// a page that has not arrived by now is not coming: the spot starts without its live view rather than wait forever
const FRAMES_TIMEOUT = 20000;

// every frame loaded, its fonts and images decoded, and every thumbnail the table can show already in the cache;
// rejects, naming the frames still missing, when they have not all loaded within FRAMES_TIMEOUT
export async function ready(v) {
  // a frame starts on an empty about:blank that already reads as complete: wait for its own page
  const pending = new Set(Object.keys(v.frames));
  const loads = Promise.all(Object.entries(v.frames).map(([k, f]) => new Promise((resolve) => {
    const loaded = () => { const d = f.contentDocument; return !!d && d.readyState === 'complete' && d.location.href !== 'about:blank' && !!d.body; };
    const done = () => { pending.delete(k); resolve(); };
    if (loaded()) { done(); return; }
    const onload = () => { if (loaded()) { f.removeEventListener('load', onload); done(); } };
    f.addEventListener('load', onload);
  })));
  let timer;
  const late = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`live view pages did not load within ${FRAMES_TIMEOUT / 1000}s: ${[...pending].map((k) => FRAMES[k]).join(', ')}`)), FRAMES_TIMEOUT); });
  try { await Promise.race([loads, late]); } finally { clearTimeout(timer); }
  await Promise.all(Object.values(v.frames).map(async (f) => {
    const doc = f.contentDocument;
    await doc.fonts.ready;
    await Promise.all([...doc.images].filter((img) => img.getAttribute('src')).map((img) => img.decode().catch((e) => console.error(new Error(`frame image failed to decode: ${img.src}`, { cause: e })))));
  }));
  await Promise.all(Object.values(THUMBS).map((t) => t.img).map((src) => { const img = new Image(); img.src = src; return img.decode().catch((e) => console.error(new Error(`thumbnail failed to decode: ${src}`, { cause: e }))); }));
  const scroller = (doc) => [...doc.querySelectorAll('div')].find((e) => /Grid-root-root-scroll/.test(String(e.className)));
  v.docs = Object.fromEntries(Object.entries(v.frames).map(([k, f]) => [k, f.contentDocument]));
  // the game page's carousel: picture slides stacked in one box, each a .carousel-item the page shows by giving it
  // .carousel-item-active (Roblox's CSS keeps any other at opacity 0); its video slide is left as it was
  v.slides = [...v.docs.game.querySelectorAll('[data-testid="carousel"] .carousel-item')].filter((w) => w.querySelector('img'));
  v.slideFirst = Math.max(0, v.slides.findIndex((w) => w.classList.contains('carousel-item-active')));
  // the order it turns in from the slide it showed, each picture once (the page repeats one to loop)
  const pic = (w) => w.querySelector('img').getAttribute('src');
  v.slideOrder = [];
  for (let k = 0; k < v.slides.length; k++) {
    const i = (v.slideFirst + k) % v.slides.length;
    if (!v.slideOrder.some((j) => pic(v.slides[j]) === pic(v.slides[i]))) v.slideOrder.push(i);
  }
  v.scrollers = { hub: scroller(v.docs.hub), edit: scroller(v.docs.edit), game: v.docs.game.scrollingElement };
  v.tables = { hub: bindTable(v.docs.hub), edit: bindTable(v.docs.edit) };
  // a thumbnail is a live page, not a link: nothing in the frames reacts to the pointer
  for (const doc of Object.values(v.docs)) doc.documentElement.style.pointerEvents = 'none';
}

// fit the desktop into the view's width
export function fit(v) {
  const k = v.root.clientWidth / DESK.w;
  v.desk.style.transform = `scale(${k.toFixed(5)})`;
}

// every spot the cursor goes to, in the desktop's own px; the table's rows are found by index and scroll at move time
export function measure(v) {
  const d = v.desk.getBoundingClientRect();
  const k = d.width / DESK.w;
  const at = (node, fx = 0.5, fy = 0.5) => { const r = node.getBoundingClientRect(); return { x: (r.left - d.left + r.width * fx) / k, y: (r.top - d.top + r.height * fy) / k }; };
  // inside a frame: its own px, the frame sitting at the page's top-left
  const inPage = (node, fx = 0.5, fy = 0.5) => { const r = node.getBoundingClientRect(); return { x: r.left + r.width * fx, y: PAGE_TOP + r.top + r.height * fy }; };
  const button = (doc, text) => [...doc.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
  const tab0 = at(v.tabs[0], 0, 0.5);
  const T = { omni: { x: at(v.omni, 0, 0.5).x + 220, y: at(v.omni).y }, reload: at(v.reload) };
  TABS.forEach((_, i) => {
    T[`plus:${i}`] = { x: tab0.x + i * TAB_W + PLUS_GAP + PLUS / 2, y: at(v.plus).y };
    T[`tab:${i}`] = { x: tab0.x + i * TAB_W + 104, y: tab0.y };
  });
  const game = v.docs.game;
  T['game:hero'] = inPage(v.slides[v.slideFirst].querySelector('img'), 0.55, 0.5);
  const play = [...game.querySelectorAll('button')].sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height)[0];
  T['game:play'] = inPage(play, 0.5, 0.5);
  T['hub:edit'] = inPage(button(v.docs.hub, 'Edit active thumbnails'), 0.45, 0.55);
  T['edit:upload'] = inPage(button(v.docs.edit, 'Upload thumbnails'), 0.45, 0.55);
  T['edit:save'] = inPage(button(v.docs.edit, 'Save Changes'), 0.45, 0.55);
  // the first row's checkbox and rate cell with the table unscrolled: row k is ROW_H further down, less the scroll
  const editDoc = v.docs.edit;
  v.rowBase = {
    check: inPage(editDoc.querySelector('[data-testid="ActiveCheckBox-0"] svg')),
    ptr: inPage(editDoc.querySelector('[data-testid="ThumbnailQualifiedPTR-0"]'), 0.62, 0.5),
  };
  v.targets = T;
}

function target(v, name) {
  if (v.targets[name]) return v.targets[name];
  const m = /^(check|ptr):(\d+)@(\d+)$/.exec(name);
  if (!m) throw new Error(`no cursor target named ${name}`);
  const base = v.rowBase[m[1]];
  return { x: base.x, y: base.y + Number(m[2]) * ROW_H - Number(m[3]) };
}

function cursorAt(v, S, t) {
  let from = REST;
  for (const m of S.moves) {
    if (m.t0 > t) break;
    const to = target(v, m.to);
    if (t < m.t1) { const k = inOutCubic(seg(t, m.t0, m.t1)); return { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k) }; }
    from = to;
  }
  return from;
}

function scrollAt(list, t) {
  const s = lastAt(list, t, 't0');
  return s ? lerp(s.from, s.to, inOutCubic(seg(t, s.t0, s.t1))) : 0;
}

export function paint(v, S, t) {
  // the takeover: the vignette fades in as its gradient turns slowly and gently breathes (held still for reduced motion)
  v.edge.style.opacity = outCubic(seg(t, S.control, S.control + 0.55)).toFixed(3);
  v.edge.style.setProperty('--cc-a', `${REDUCED ? 0 : ((t * 60) % 360).toFixed(1)}deg`);
  v.soft.style.opacity = REDUCED ? '0.9' : (0.9 + 0.08 * Math.sin(t * 2.6)).toFixed(3);

  const active = lastAt(S.active, t).tab;
  const viewOf = (i) => lastAt(S.views[i], t);

  // tabs: a new one grows in from the + button; the active one wears the white
  v.tabs.forEach((tab, i) => {
    const spec = S.tabs[i];
    const o = spec ? outCubic(seg(t, spec.openAt, spec.openAt + 0.3)) : 0;
    tab.style.width = `${(TAB_W * o).toFixed(2)}px`;
    tab.style.opacity = o.toFixed(3);
    tab.classList.toggle('is-on', i === active);
    const vw = o > 0 ? viewOf(i) : null;
    const state = vw ? vw.v : 'ntp';
    tab.dataset.state = state;
    const title = state === 'page' ? TABS[i].title : state === 'load' ? TABS[i].host + TABS[i].path : 'New Tab';
    const tt = tab.querySelector('.cc-tt');
    if (tt.textContent !== title) tt.textContent = title;
    tab.querySelector('.cc-spin').style.transform = `rotate(${((t * 540) % 360).toFixed(1)}deg)`;
  });

  // the page under the active tab: Chrome's New Tab page, a blank load, or one of the captured documents
  const av = viewOf(active);
  const page = av.v === 'page' ? av.page : null;
  v.ntp.style.visibility = av.v === 'ntp' ? 'visible' : 'hidden';
  v.blank.style.visibility = av.v === 'load' ? 'visible' : 'hidden';
  v.reload.classList.toggle('is-load', av.v === 'load');
  if (page !== v.shownPage) {
    for (const [k, f] of Object.entries(v.frames)) f.style.visibility = k === page ? 'visible' : 'hidden';
    v.shownPage = page;
  }

  // Creator Hub's table as it stands at t, in both views; a row superbot just uploaded fades in
  const table = lastAt(S.table, t);
  renderTable(v.tables.hub, table, false);
  renderTable(v.tables.edit, table, true);
  for (const [id, born] of Object.entries(table.fresh || {})) {
    const tr = v.tables.edit.tbody.querySelector(`[data-sb-row="${id}"]`);
    if (tr) tr.style.opacity = outCubic(seg(t, born, born + 0.4)).toFixed(3);
  }
  // the game page's carousel, advanced a slide at a time through the page's own thumbnails: the new slide fades in over
  // the one it replaces in Roblox's own 0.5s ease-in-out, painted from t instead of the page's CSS transition
  const step = lastAt(S.hero, t);
  const n = v.slideOrder.length;
  const cur = v.slideOrder[(step ? step.step : 0) % n];
  const prev = step ? v.slideOrder[(step.step - 1) % n] : -1;
  const fade = step ? (REDUCED ? 1 : inOutCubic(seg(t, step.at, step.at + 0.5))) : 1;
  v.slides.forEach((w, k) => {
    const on = k === cur, under = k === prev && fade < 1;
    w.style.transition = 'none';
    w.style.opacity = on ? fade.toFixed(3) : under ? '1' : '0';
    w.style.visibility = on || under ? 'visible' : 'hidden';
    w.style.zIndex = on ? '5' : under ? '4' : '0';
  });
  for (const k of ['hub', 'edit', 'game']) {
    const top = Math.round(scrollAt(S.scrolls[k], t));
    if (v.scrollers[k].scrollTop !== top) v.scrollers[k].scrollTop = top;
  }

  // the address bar: focused with its placeholder, being typed into, or showing the page's address
  const om = lastAt(S.omni, t);
  const mode = om.mode === 'url' && viewOf(om.tab).v === 'ntp' ? 'ph' : om.mode;
  v.uPh.style.opacity = mode === 'ph' ? '1' : '0';
  v.uType.style.opacity = mode === 'type' ? '1' : '0';
  v.uUrl.style.opacity = mode === 'url' ? '1' : '0';
  v.omni.classList.toggle('is-focus', mode !== 'url');
  if (mode === 'type') {
    const typed = om.text.slice(0, countAt(om.text, om.start, om.cps, t));
    if (typed !== v.shownTyped) { v.typed.textContent = typed; v.shownTyped = typed; }
  }
  if (mode === 'url') {
    const tab = TABS[om.tab];
    if (v.host.textContent !== tab.host) { v.host.textContent = tab.host; v.path.textContent = tab.path; }
  }
  const typing = mode === 'type' && t < om.start + om.text.length / om.cps;
  const blinkOn = typing || caretOn(t - om.at);
  v.carets.forEach((c) => { c.style.opacity = blinkOn ? '1' : '0'; });

  // the screen's own cursor, squeezing briefly on each click
  const p = cursorAt(v, S, t);
  const click = S.clicks.find((k) => t >= k.at - 0.03 && t < k.at + 0.18);
  const squeeze = click && !REDUCED ? 1 - 0.16 * Math.sin(Math.PI * seg(t, click.at - 0.03, click.at + 0.18)) : 1;
  v.cursor.style.transform = `translate(${(p.x - TIP.x).toFixed(2)}px, ${(p.y - TIP.y).toFixed(2)}px) scale(${squeeze.toFixed(3)})`;
}
