// The Automations tab: a search field, the apps the search reaches as categories to pick from, and a grid of
// automations, each card its thumbnail, the app it works in, what it does, its rating, how often it is used and a Try
// Me! button. It takes the place of the chat and the live view while the sidebar's Automations row is the current page;
// any other row in the sidebar brings the chat back, and so does Try Me!, which plays the spot from its start.
// It mounts itself into the app main.bdeb2397.js has built (view.03378ba4.html loads it after that), and talks to the
// spot only through the keys main.bdeb2397.js already answers, so it needs no change there: ?tab=automations opens it.
import { APPS, AUTOMATIONS, thumbOf, iconOf } from './automations.03378ba4.js';
import { esc, lu, asset } from './parts.bdeb2397.js';

const SKELETON_CARDS = 8, SKELETON_CHIPS = 6;
const AUTOMATIONS_ROW = 'a[href="#automations"]';
// the keys main.bdeb2397.js turns into the spot's controls; inside the tab they are typing, never the spot's
const SPOT_KEYS = new Set([' ', 'r', 'R', 'ArrowLeft', 'ArrowRight']);
// lucide x (https://lucide.dev, ISC), the field's clear button
const X_ICON = '<svg class="am-lu" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const countText = (shown) => (shown === AUTOMATIONS.length ? `${shown} automations` : `${shown} of ${AUTOMATIONS.length}`);
const APP_ORDER = Object.keys(APPS);

// ---------- matching: a query's every word must appear in what an automation is matched against ----------
// its title, description and topics, and its app's name, keywords and topics: "game design" reaches every app that
// serves game design
const haystacks = new Map(AUTOMATIONS.map((a) => {
  const app = APPS[a.app];
  return [a.id, [a.title, a.desc, ...a.topics, app.name, app.keywords, ...app.topics].join(' ').toLowerCase()];
}));
const appOf = new Map(AUTOMATIONS.map((a) => [a.id, a.app]));
const termsOf = (query) => query.toLowerCase().split(/\s+/).filter(Boolean);
const matches = (id, terms) => terms.every((t) => haystacks.get(id).includes(t));

// the categories a query offers: every app with a match, most matches first, catalogue order between equals. A picked
// app the query no longer reaches stays on offer, last, so it can be unpicked. Picking never moves a chip.
function categories(terms, picked) {
  const counts = new Map();
  for (const a of AUTOMATIONS) if (matches(a.id, terms)) counts.set(a.app, (counts.get(a.app) ?? 0) + 1);
  const reached = [...counts.keys()].sort((x, y) => counts.get(y) - counts.get(x) || APP_ORDER.indexOf(x) - APP_ORDER.indexOf(y));
  const stranded = [...picked].filter((id) => !counts.has(id));
  return [...reached, ...stranded].map((id) => ({ id, n: counts.get(id) ?? 0 }));
}

// ---------- markup ----------
function card(a) {
  const app = APPS[a.app];
  return `<li class="am-card" data-id="${a.id}">
  <img class="am-thumb" src="${asset(thumbOf(a))}" alt="" width="768" height="432" decoding="async" draggable="false">
  <div class="am-head"><img class="am-app" src="${asset(iconOf(a.app))}" alt="" width="20" height="20" draggable="false"><div class="am-name"><h2 class="am-title" id="am-t-${a.id}">${esc(a.title)}</h2><span class="am-app-name">${esc(app.name)}</span></div></div>
  <p class="am-desc">${esc(a.desc)}</p>
  <div class="am-foot"><span class="am-rate" role="img" aria-label="Rated ${a.rating} out of 5"><img class="am-star" src="${asset('./automations/star.png')}" alt="" width="12" height="12" draggable="false"><span aria-hidden="true">${a.rating.toFixed(1)}</span></span><span class="am-uses">${compact.format(a.uses)} uses</span><button class="am-try" type="button" aria-describedby="am-t-${a.id}">Try Me!</button></div>
</li>`;
}

const chip = ({ id, n }, on) => `<button class="am-chip" type="button" data-app="${id}" aria-pressed="${on}" aria-label="${esc(APPS[id].name)}, ${n} automations"><img class="am-chip-ic" src="${asset(iconOf(id))}" alt="" width="16" height="16" draggable="false">${esc(APPS[id].name)}<span class="am-chip-n" aria-hidden="true">${n}</span></button>`;
const allChip = (on) => `<button class="am-chip" type="button" data-app="" aria-pressed="${on}">All apps</button>`;

// the shapes of a card and a category while the catalogue loads
const skeletonCard = '<li class="am-card am-skel" aria-hidden="true"><i class="am-thumb"></i><b></b><b></b><b></b></li>';
const skeletonChip = '<i class="am-chip am-skel-chip" aria-hidden="true"></i>';

function pageHTML(state) {
  const loading = state === 'loading';
  const cards = loading ? skeletonCard.repeat(SKELETON_CARDS) : AUTOMATIONS.map(card).join('');
  return `<section class="am" aria-labelledby="am-h" hidden>
  <header class="am-top">
    <div class="am-bar"><h1 class="am-h" id="am-h">Automations</h1><p class="am-count" aria-live="polite">${loading ? 'Loading automations' : countText(AUTOMATIONS.length)}</p></div>
    <div class="am-search">${lu('search', 'am-lu')}<input type="search" placeholder="Search automations, apps or topics like game design" aria-label="Search automations" autocomplete="off" spellcheck="false"><kbd class="am-key" aria-hidden="true">/</kbd><button class="am-clear" type="button" aria-label="Clear search" hidden>${X_ICON}</button></div>
    <div class="am-cats" role="group" aria-label="Filter by app">${loading ? skeletonChip.repeat(SKELETON_CHIPS) : ''}</div>
  </header>
  <div class="am-scroll">
    <ul class="am-grid"${loading ? ' aria-busy="true"' : ''}>${cards}</ul>
    <div class="am-empty" hidden><p class="am-empty-t"></p><button class="am-btn" type="button">Clear search</button></div>
  </div>
</section>`;
}

// ---------- behaviour ----------
function mountAutomations({ app, sb, state }) {
  // held by reference, never looked up by class: another page's tab could share the app
  const template = document.createElement('template');
  template.innerHTML = pageHTML(state);
  const page = template.content.firstElementChild;
  app.append(page);
  const input = page.querySelector('.am-search input'), clear = page.querySelector('.am-clear'), key = page.querySelector('.am-key');
  const cats = page.querySelector('.am-cats'), grid = page.querySelector('.am-grid'), count = page.querySelector('.am-count');
  const empty = page.querySelector('.am-empty'), emptyText = page.querySelector('.am-empty-t');
  const row = sb.querySelector(AUTOMATIONS_ROW);
  // the chat the sidebar marks as open: it is what the window shows again when the tab closes
  const chatRow = sb.querySelector('[aria-current="page"]');
  const picked = new Set();
  let open = false;

  // `chips: false` when only the picking changed: the chips on offer and their counts depend on the query alone, so
  // they are updated in place and the one just clicked keeps the focus the click gave it (a redrawn chip focused from
  // script would show the keyboard's focus ring after a mouse click)
  function render({ chips = true } = {}) {
    clear.hidden = !input.value;
    key.hidden = Boolean(input.value);
    if (state === 'loading') return;
    const query = input.value.trim(), terms = termsOf(query);
    const offer = categories(terms, picked);
    if (chips) {
      cats.innerHTML = allChip(!picked.size) + offer.map((c) => chip(c, picked.has(c.id))).join('');
    } else {
      const offered = new Set(offer.map((c) => c.id));
      for (const b of cats.querySelectorAll('button.am-chip')) {
        const id = b.dataset.app;
        // an app the query no longer reached stayed on offer only while picked
        if (id && !offered.has(id)) b.remove();
        else b.setAttribute('aria-pressed', String(id ? picked.has(id) : !picked.size));
      }
    }
    let shown = 0;
    for (const li of grid.querySelectorAll('.am-card[data-id]')) {
      const hit = matches(li.dataset.id, terms) && (!picked.size || picked.has(appOf.get(li.dataset.id)));
      li.hidden = !hit;
      if (hit) shown++;
    }
    count.textContent = countText(shown);
    empty.hidden = shown > 0;
    const within = picked.size ? ` in ${[...picked].map((id) => APPS[id].name).join(', ')}` : '';
    emptyText.textContent = `No automations match "${query}"${within}.`;
  }

  function reset() {
    input.value = '';
    picked.clear();
    render();
    input.focus();
  }

  function toggle(id) {
    if (!id) picked.clear(); else if (picked.has(id)) picked.delete(id); else picked.add(id);
    render({ chips: false });
  }

  function show(next, { focus = false, restart = false } = {}) {
    if (next === open) { if (next && focus) input.focus(); return; }
    open = next;
    page.hidden = !open;
    document.body.classList.toggle('am-open', open);
    (open ? chatRow : row)?.removeAttribute('aria-current');
    (open ? row : chatRow)?.setAttribute('aria-current', 'page');
    if (open && focus) input.focus();
    // R is the spot's restart (main.bdeb2397.js): Try Me! plays the automation from its first message
    if (restart) dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape' && input.value) { e.preventDefault(); reset(); } });
  // a key pressed inside the tab stays there: space types a space and presses a button rather than pausing the spot
  page.addEventListener('keydown', (e) => { if (SPOT_KEYS.has(e.key)) e.stopPropagation(); });
  clear.addEventListener('click', reset);
  empty.querySelector('.am-btn').addEventListener('click', reset);
  cats.addEventListener('click', (e) => { const c = e.target.closest('button.am-chip'); if (c) toggle(c.dataset.app); });
  grid.addEventListener('click', (e) => { if (e.target.closest('.am-try')) show(false, { restart: true }); });
  sb.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) show(a.matches(AUTOMATIONS_ROW), { focus: true });
  });
  // "/" jumps to the search field while the tab is open
  addEventListener('keydown', (e) => {
    if (!open || e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input')) return;
    e.preventDefault();
    input.focus();
  });

  render();
  return { show };
}

const app = document.querySelector('.app');
const sb = app?.querySelector('.sb');
if (!sb) throw new Error('no sidebar to hang the Automations tab on: load main.bdeb2397.js before automations-view.03378ba4.js');
const params = new URLSearchParams(location.search);
const tab = mountAutomations({ app, sb, state: params.get('state') || 'ready' });
if (params.get('tab') === 'automations') tab.show(true);
