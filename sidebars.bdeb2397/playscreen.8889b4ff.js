// A chat's computer view while its run plays (play.8889b4ff.js): Chrome full screen on the creative's 1470x919 desktop,
// built from the live view's own markup and classes (screen.af4c3c6b.js, style.af4c3c6b.css .cc-*) and painted from t
// the way its paint() is: the tabs superbot opens, the address bar focused, typed into or showing the page's address,
// Chrome's New Tab page, a blank load, the cursor squeezing on each press, and the takeover's vignette in the color of
// the chat's task, one color for the whole run (tint.bdeb2397.js). Each page is a real capture of the app
// (plays/<id>/pages.json); a page that scrolls carries its scrolling region's whole content as one picture, and a field
// superbot types into is revealed a character at a time from the capture of it filled in. Nothing is drawn over a page
// but the cursor.
import { seg, lerp, outCubic, inOutCubic, caretOn, countAt, lastAt, esc, REDUCED } from '../lib.af4c3c6b.js';
import { tintEdge } from './tint.bdeb2397.js';

const DESK_W = 1470;
// the live view's own icons (screen.af4c3c6b.js IC)
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
const PAGE_TOP = 82; // the tab strip (42) and the toolbar (40) above the page
const TAB_W = 240, PLUS_GAP = 8, PLUS = 28;
const TIP = { x: 4, y: 2.5 }; // the arrow's hotspot in its 24px box
const REST = { x: 1010, y: 640 }; // where the cursor sits before superbot moves it
const ARROW = 'M4 2.5 4 19.5 8.6 15.3 11.5 21.8 14.4 20.5 11.6 14.2 17.8 14.2Z';

const tabHTML = (i) => `<span class="cc-tab" data-tab="${i}"><i class="cc-tbg"></i><span class="cc-fav"><img alt="" width="16" height="16"><i class="cc-spin"></i></span><span class="cc-tt">New Tab</span><span class="cc-x">${IC.x}</span></span>`;
const px = (n) => `${n}px`;
const box = ([x, y, w, h]) => `left:${px(x)};top:${px(y)};width:${px(w)};height:${px(h)}`;

function pageHTML(id, pg) {
  const scroll = pg.scroll ? `<div class="cv-pg-clip" style="${box(pg.scroll.box)}"><img class="cv-pg-scroll" src="${pg.scroll.img}" alt="" width="${pg.scroll.box[2]}" height="${pg.scroll.height}"></div>` : '';
  const f = pg.field;
  const field = f ? `<div class="cv-pg-clip cv-pg-field" style="${box(f.box)};width:0"><img src="${f.filledImg}" alt="" width="${DESK_W}" height="837" style="left:${px(-f.box[0])};top:${px(-f.box[1])}"></div>` : '';
  return `<div class="cc-page cv-pg" data-page="${esc(id)}"><img class="cv-pg-img" src="${pg.img}" alt="" width="${DESK_W}" height="837">${scroll}${field}</div>`;
}

// the frame (.cc-frame) for a chat's run, its pages laid in, every one hidden until it is on screen, and its vignette
// in `app`'s colors (the chat's task, screens.bdeb2397.js) from start to end
export function buildPlayScreen(root, S, app) {
  root.innerHTML = `<div class="cc-frame cv-frame">
    <div class="cc-view cv-view">
      <div class="cc-desk">
        <div class="cc-win">
          <div class="cc-strip">
            <span class="cc-lights"><i></i><i></i><i></i></span>
            <span class="cc-tabs">${S.tabs.map((_, i) => tabHTML(i)).join('')}</span>
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
            <div class="cc-page cc-blank"></div>
            ${Object.entries(S.pages).map(([id, pg]) => pageHTML(id, pg)).join('')}
          </div>
        </div>
        <svg class="cc-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="${ARROW}"/></svg>
      </div>
      <i class="cc-edge cv-edge"><i class="cc-soft"><i class="cc-band"></i></i></i>
    </div>
    <span class="cc-stop"><i></i>Stop</span>
  </div>`;
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const pageEls = Object.fromEntries($$('.cv-pg').map((n) => [n.dataset.page, { n, scroll: n.querySelector('.cv-pg-scroll'), field: n.querySelector('.cv-pg-field') }]));
  tintEdge($('.cc-edge'), app);
  return {
    root, desk: $('.cc-desk'), back: $('.cc-bar .cc-ic'), tabs: $$('.cc-tab'), plus: $('.cc-plus'), reload: $('.cc-reload'), omni: $('.cc-omni'),
    uPh: $('.cc-u-ph'), uType: $('.cc-u-type'), uUrl: $('.cc-u-url'), typed: $('.cc-typed'), host: $('.cc-host'), path: $('.cc-path'),
    carets: $$('.cc-caret'), ntp: $('.cc-ntp'), blank: $('.cc-blank'), pageEls, cursor: $('.cc-cursor'), edge: $('.cc-edge'), soft: $('.cc-soft'),
    targets: null, shown: {},
  };
}

// every picture the run shows, decoded, so no page arrives half drawn
export function decodePlay(v) {
  return Promise.all([...v.root.querySelectorAll('img')].filter((img) => img.getAttribute('src')).map((img) => img.decode().catch((e) => console.error(new Error(`play image failed to decode: ${img.src}`, { cause: e })))));
}

// Chrome's own targets, in the desktop's px; the screen must be laid out (and scaled) when this runs
export function measurePlay(v, S) {
  const d = v.desk.getBoundingClientRect();
  const k = d.width / DESK_W;
  const at = (node, fx = 0.5, fy = 0.5) => { const r = node.getBoundingClientRect(); return { x: (r.left - d.left + r.width * fx) / k, y: (r.top - d.top + r.height * fy) / k }; };
  // a closed tab has no width yet: the first one, open from the start, places them all
  const tab0 = at(v.tabs[0], 0, 0.5);
  const T = { omni: { x: at(v.omni, 0, 0.5).x + 220, y: at(v.omni).y }, reload: at(v.reload), back: at(v.back) };
  for (let i = 0; i <= S.tabs.length; i++) {
    T[`plus:${i}`] = { x: tab0.x + i * TAB_W + PLUS_GAP + PLUS / 2, y: at(v.plus).y };
    T[`tab:${i}`] = { x: tab0.x + i * TAB_W + 104, y: tab0.y };
  }
  v.targets = T;
}

const scrollAt = (S, id, t) => {
  const s = lastAt(S.scrolls[id] ?? [], t, 't0');
  return s ? lerp(s.from, s.to, inOutCubic(seg(t, s.t0, s.t1))) : 0;
};

// a move's target in the desktop's px: a page's target sits under Chrome's bars, one in a scrolling region where the
// region stood when the cursor got there
function targetAt(v, S, m) {
  const to = m.to;
  if (to.chrome) return v.targets[to.chrome];
  const pg = S.pages[to.page];
  if (!to.inScroll) { const [x, y] = pg.targets[to.name]; return { x, y: y + PAGE_TOP }; }
  const [x, y] = pg.scroll.targets[to.name], [bx, by] = pg.scroll.box;
  return { x: bx + x, y: PAGE_TOP + by + y - scrollAt(S, to.page, m.t1) };
}

function cursorAt(v, S, t) {
  let from = REST;
  for (const m of S.moves) {
    if (m.t0 > t) break;
    const to = targetAt(v, S, m);
    if (t < m.t1) { const k = inOutCubic(seg(t, m.t0, m.t1)); return { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k) }; }
    from = to;
  }
  return from;
}

const viewOf = (S, i, t) => lastAt(S.views[i], t);

export function paintPlay(v, S, t) {
  // the takeover: the vignette fades in as its gradient turns slowly and gently breathes (held still for reduced motion)
  v.edge.style.opacity = outCubic(seg(t, S.control, S.control + 0.55)).toFixed(3);
  v.edge.style.setProperty('--cc-a', `${REDUCED ? 0 : ((t * 60) % 360).toFixed(1)}deg`);
  v.soft.style.opacity = REDUCED ? '0.9' : (0.9 + 0.08 * Math.sin(t * 2.6)).toFixed(3);

  const active = lastAt(S.active, t).tab;
  // tabs: a new one grows in from the + button; the active one wears the white
  v.tabs.forEach((tab, i) => {
    const o = outCubic(seg(t, S.tabs[i].openAt, S.tabs[i].openAt + 0.3));
    tab.style.width = `${(TAB_W * o).toFixed(2)}px`;
    tab.style.opacity = o.toFixed(3);
    tab.classList.toggle('is-on', i === active);
    const vw = o > 0 ? viewOf(S, i, t) : null;
    const state = vw ? vw.v : 'ntp';
    tab.dataset.state = state;
    const pg = state === 'ntp' ? null : S.pages[vw.page];
    const title = state === 'page' ? pg.title : state === 'load' ? pg.host + pg.path : 'New Tab';
    const tt = tab.querySelector('.cc-tt');
    if (tt.textContent !== title) tt.textContent = title;
    const fav = tab.querySelector('.cc-fav img');
    if (pg && fav.getAttribute('src') !== pg.fav) fav.setAttribute('src', pg.fav);
    tab.querySelector('.cc-spin').style.transform = `rotate(${((t * 540) % 360).toFixed(1)}deg)`;
  });

  // the page under the active tab: Chrome's New Tab page, a blank load, or a capture of the app
  const av = viewOf(S, active, t);
  const page = av.v === 'page' ? av.page : null;
  v.ntp.style.visibility = av.v === 'ntp' ? 'visible' : 'hidden';
  v.blank.style.visibility = av.v === 'load' ? 'visible' : 'hidden';
  v.reload.classList.toggle('is-load', av.v === 'load');
  for (const [id, el] of Object.entries(v.pageEls)) {
    const on = id === page;
    if (v.shown[id] !== on) { el.n.style.visibility = on ? 'visible' : 'hidden'; v.shown[id] = on; }
    if (!on) continue;
    if (el.scroll) el.scroll.style.transform = `translateY(${(-Math.round(scrollAt(S, id, t))).toFixed(0)}px)`;
    if (el.field) {
      // the field fills in a character at a time, each one's right edge where the capture of it filled in has it
      const f = S.pages[id].field, typing = lastAt(S.fields.filter((e) => e.page === id), t, 'start');
      const n = typing ? countAt(f.text, typing.start, typing.cps, t) : 0;
      el.field.style.width = n ? px(Math.max(0, f.stops[n - 1] - f.box[0])) : '0px';
    }
  }

  // the address bar: focused with its placeholder, being typed into, or showing the page's address
  const om = lastAt(S.omni, t);
  const omView = om.mode === 'url' ? viewOf(S, om.tab, t) : null;
  const mode = om.mode === 'url' && omView.v === 'ntp' ? 'ph' : om.mode;
  v.uPh.style.opacity = mode === 'ph' ? '1' : '0';
  v.uType.style.opacity = mode === 'type' ? '1' : '0';
  v.uUrl.style.opacity = mode === 'url' ? '1' : '0';
  v.omni.classList.toggle('is-focus', mode !== 'url');
  if (mode === 'type') {
    const typed = om.text.slice(0, countAt(om.text, om.start, om.cps, t));
    if (v.typed.textContent !== typed) v.typed.textContent = typed;
  }
  if (mode === 'url') {
    const pg = S.pages[omView.page];
    if (v.host.textContent !== pg.host || v.path.textContent !== pg.path) { v.host.textContent = pg.host; v.path.textContent = pg.path; }
  }
  const typing = mode === 'type' && t < om.start + om.text.length / om.cps;
  const blinkOn = typing || caretOn(t - om.at);
  v.carets.forEach((c) => { c.style.opacity = blinkOn ? '1' : '0'; });

  // the screen's own cursor, squeezing briefly on each press, as the live one does
  const p = cursorAt(v, S, t);
  const click = S.clicks.find((k) => t >= k.at - 0.03 && t < k.at + 0.18);
  const squeeze = click && !REDUCED ? 1 - 0.16 * Math.sin(Math.PI * seg(t, click.at - 0.03, click.at + 0.18)) : 1;
  v.cursor.style.transform = `translate(${(p.x - TIP.x).toFixed(2)}px, ${(p.y - TIP.y).toFixed(2)}px) scale(${squeeze.toFixed(3)})`;
}
