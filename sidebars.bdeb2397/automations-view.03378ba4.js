// The Automations tab: a search field, the apps the search reaches as categories to pick from, and a grid of
// automations, each card its thumbnail, the app it works in, what it does, its rating, how often it is used and a Try
// Me! button. It takes the place of the chat and the live view while the sidebar's Automations row is the current page;
// any other row in the sidebar brings the chat back, and so does Prompt your own! under a search with no match, which is
// New chat: the live chat from its start, its prompt being typed. A press on a card opens it in full
// (automation-detail.71c311e9.js): its whole description, its ratings and reviews, its uses and how it runs. Its Try Me!,
// on the card or in that view, starts it in a chat of its own: the live chat's run with "Use the <automation>
// automation" typed in and sent (am-start, newchat.854d0793.js; spot-ask, main.bdeb2397.js), which then asks which game
// it runs on above the composer (gameask.b3fb005c.js) and goes on with the answer.
// Publish, before the categories, puts the viewer's own automation in the grid (publish.6c0fd59e.js): its cards follow
// the catalogue's, and a start of one counts a use and makes its publisher credits (published.6c0fd59e.js).
// It mounts itself into the app main.bdeb2397.js has built (view.03378ba4.html loads it after that), and talks to the
// spot only through the keys and events main.bdeb2397.js already answers: ?tab=automations opens it, and
// &automation=<id> opens that automation over it.
import { ALL_APPS, thumbOf, iconOf } from './automations.03378ba4.js';
import { CHATS } from './chats.bdeb2397.js';
import { esc, lu, fx, asset } from './parts.bdeb2397.js';
import { onChange } from './store.854d0793.js';
import { mountGameAsk } from './gameask.b3fb005c.js';
import { mountDetail } from './automation-detail.71c311e9.js';
import { catalogue, automationById, countUse, appsOf } from './published.6c0fd59e.js';
import { openPublish } from './publish.6c0fd59e.js';

const SKELETON_CARDS = 8, SKELETON_CHIPS = 6;
const AUTOMATIONS_ROW = 'a[href="#automations"]';
const LIVE_ROW = `.sb-scroll a.sb-row[href="#${CHATS.find((c) => c.live).id}"]`;
// the keys main.bdeb2397.js turns into the spot's controls; inside the tab they are typing, never the spot's
const SPOT_KEYS = new Set([' ', 'r', 'R', 'ArrowLeft', 'ArrowRight']);
// lucide x (https://lucide.dev, ISC), the field's clear button
const X_ICON = '<svg class="am-lu" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const APP_ORDER = Object.keys(ALL_APPS);
// what the grid offers: the catalogue's and the viewer's own, taken again whenever they publish, edit or unpublish
let items = [];
const countText = (shown) => (shown === items.length ? `${shown} automations` : `${shown} of ${items.length}`);

// ---------- matching: a query's every word must appear in what an automation is matched against ----------
// its title, description and topics, and its apps' names, keywords and topics: "game design" reaches every app that
// serves game design. One the viewer published is filed under each of its categories (published.6c0fd59e.js appsOf)
const haystacks = new Map(), appsById = new Map();
function index() {
  items = catalogue();
  haystacks.clear();
  appsById.clear();
  for (const a of items) {
    const apps = appsOf(a).filter((id) => ALL_APPS[id]);
    haystacks.set(a.id, [a.title, a.desc, ...a.topics, ...apps.flatMap((id) => [ALL_APPS[id].name, ALL_APPS[id].keywords, ...ALL_APPS[id].topics])].join(' ').toLowerCase());
    appsById.set(a.id, apps);
  }
}
index();
const termsOf = (query) => query.toLowerCase().split(/\s+/).filter(Boolean);
const matches = (id, terms) => terms.every((t) => haystacks.get(id).includes(t));

// the categories a query offers: every app with a match, most matches first, catalogue order between equals. Only the
// first two lines of them show (clampChips), so a picked app leads them, the query reaching it or not: the filter in
// force is always in sight and can be unpicked. Picking never moves a chip; the order is set as the query changes.
function categories(terms, picked) {
  const counts = new Map();
  for (const a of items) if (matches(a.id, terms)) for (const id of appsById.get(a.id)) counts.set(id, (counts.get(id) ?? 0) + 1);
  const reached = [...counts.keys()].sort((x, y) => counts.get(y) - counts.get(x) || APP_ORDER.indexOf(x) - APP_ORDER.indexOf(y));
  return [...picked, ...reached.filter((id) => !picked.has(id))].map((id) => ({ id, n: counts.get(id) ?? 0 }));
}

// the categories take two lines at most, the first ones: a chip past them is hidden rather than cut off, so the keyboard
// never lands on one out of sight. An app off them is still a search away.
const CHIP_LINES = 2;
function clampChips(cats) {
  const chips = [...cats.children];
  for (const c of chips) c.hidden = false;
  // every chip measured before any is hidden: hiding one lets a later, narrower one move up into the room it left
  const tops = chips.map((c) => c.offsetTop);
  const lines = [...new Set(tops)].sort((a, b) => a - b);
  // laid out yet (a hidden tab measures every chip at 0): the ones below the last line kept go
  if (lines.length > CHIP_LINES) chips.forEach((c, i) => { c.hidden = tops[i] > lines[CHIP_LINES - 1]; });
}

// ---------- markup ----------
// one just published has no rating yet
const rateHTML = (a) => (a.rating ? `<span class="am-rate" role="img" aria-label="Rated ${a.rating} out of 5"><img class="am-star" src="${asset('./automations/star.png')}" alt="" width="12" height="12" draggable="false"><span aria-hidden="true">${a.rating.toFixed(1)}</span></span>` : '<span class="am-rate">New</span>');

function card(a) {
  const app = ALL_APPS[a.app], rate = rateHTML(a);
  // the card's own button, the whole card under Try Me!: it opens the automation in full
  return `<li class="am-card" data-id="${a.id}">
  <button class="am-open" type="button" aria-haspopup="dialog" aria-label="${esc(a.title)}, details"></button>
  <img class="am-thumb" src="${asset(thumbOf(a))}" alt="" width="768" height="432" decoding="async" draggable="false">
  <div class="am-head"><img class="am-app" src="${asset(iconOf(a.app))}" alt="" width="20" height="20" draggable="false"><div class="am-name"><h2 class="am-title" id="am-t-${a.id}">${esc(a.title)}</h2><span class="am-app-name">${esc(app.name)}</span></div></div>
  <p class="am-desc">${esc(a.desc)}</p>
  <div class="am-foot">${rate}<span class="am-uses">${compact.format(a.uses)} uses</span><button class="am-try" type="button" aria-describedby="am-t-${a.id}">Try Me!</button></div>
</li>`;
}

const chip = ({ id, n }, on) => `<button class="am-chip" type="button" data-app="${id}" aria-pressed="${on}" aria-label="${esc(ALL_APPS[id].name)}, ${n} automations"><img class="am-chip-ic" src="${asset(iconOf(id))}" alt="" width="16" height="16" draggable="false">${esc(ALL_APPS[id].name)}<span class="am-chip-n" aria-hidden="true">${n}</span></button>`;
const allChip = (on) => `<button class="am-chip" type="button" data-app="" aria-pressed="${on}">All</button>`;

// the shapes of a card and a category while the catalogue loads
const skeletonCard = '<li class="am-card am-skel" aria-hidden="true"><i class="am-thumb"></i><b></b><b></b><b></b></li>';
const skeletonChip = '<i class="am-chip am-skel-chip" aria-hidden="true"></i>';

function pageHTML(state) {
  const loading = state === 'loading';
  const cards = loading ? skeletonCard.repeat(SKELETON_CARDS) : items.map(card).join('');
  return `<section class="am" aria-label="Automations" hidden>
  <header class="am-top">
    <p class="am-count" aria-live="polite">${loading ? 'Loading automations' : countText(items.length)}</p>
    <div class="am-search">${lu('search', 'am-lu')}<input type="search" placeholder="Search automations, apps or topics like game design" aria-label="Search automations" autocomplete="off" spellcheck="false"><button class="am-clear" type="button" aria-label="Clear search" hidden>${X_ICON}</button></div>
    <div class="am-cats-row"><button class="am-publish" type="button" aria-haspopup="dialog">${fx('rocket', 'am-publish-ic')}Publish</button><div class="am-cats" role="group" aria-label="Filter by app">${loading ? skeletonChip.repeat(SKELETON_CHIPS) : ''}</div></div>
  </header>
  <div class="am-scroll">
    <ul class="am-grid"${loading ? ' aria-busy="true"' : ''}>${cards}</ul>
    <div class="am-empty" hidden><p class="am-empty-t">No automations existing for this yet!</p><button class="am-btn am-new" type="button">Prompt your own!</button></div>
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
  const input = page.querySelector('.am-search input'), clear = page.querySelector('.am-clear');
  const cats = page.querySelector('.am-cats'), grid = page.querySelector('.am-grid'), count = page.querySelector('.am-count');
  const empty = page.querySelector('.am-empty');
  const row = sb.querySelector(AUTOMATIONS_ROW);
  // the row the sidebar marks as open, a chat or New chat: it is what the window shows again when the tab closes, taken
  // again each time the tab opens
  let openRow = sb.querySelector('[aria-current="page"]');
  const picked = new Set();
  let open = false;

  // `chips: false` when only the picking changed: the chips on offer and their counts depend on the query alone, so
  // they are updated in place and the one just clicked keeps the focus the click gave it (a redrawn chip focused from
  // script would show the keyboard's focus ring after a mouse click)
  function render({ chips = true } = {}) {
    clear.hidden = !input.value;
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
    clampChips(cats);
    let shown = 0;
    for (const li of grid.querySelectorAll('.am-card[data-id]')) {
      const hit = matches(li.dataset.id, terms) && (!picked.size || appsById.get(li.dataset.id).some((id) => picked.has(id)));
      li.hidden = !hit;
      if (hit) shown++;
    }
    count.textContent = countText(shown);
    empty.hidden = shown > 0;
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
    // one row is current at a time: opening clears every mark (New chat's too, not only a chat's); closing hands the mark
    // back only when the row clicked has not taken it (newchat.854d0793.js and chatview.bdeb2397.js mark their own)
    if (open) {
      openRow = sb.querySelector(`a[aria-current]:not(${AUTOMATIONS_ROW})`) ?? openRow;
      for (const a of sb.querySelectorAll('a[aria-current]')) a.removeAttribute('aria-current');
      row?.setAttribute('aria-current', 'page');
    } else {
      row?.removeAttribute('aria-current');
      if (!sb.querySelector('a[aria-current]')) openRow?.setAttribute('aria-current', 'page');
    }
    if (open && focus) input.focus();
    // R is the spot's restart (main.bdeb2397.js): Try Me! plays the automation from its first message
    if (restart) dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape' && input.value) { e.preventDefault(); reset(); } });
  // a key pressed inside the tab stays there: space types a space and presses a button rather than pausing the spot
  page.addEventListener('keydown', (e) => { if (SPOT_KEYS.has(e.key)) e.stopPropagation(); });
  clear.addEventListener('click', reset);
  empty.querySelector('.am-new').addEventListener('click', () => show(false, { restart: true }));
  cats.addEventListener('click', (e) => { const c = e.target.closest('button.am-chip'); if (c) toggle(c.dataset.app); });
  // an automation is a chat: New chat (newchat.854d0793.js) makes it one and opens it, its prompt sent, and the run asks
  // for the game; a page without New chat (view.03378ba4.html) plays it in the live chat
  function start(automation) {
    const ask = `Use the ${automation.title} automation`;
    // one the viewer published counts the use and its credits, whichever page starts it
    if (automation.mine) countUse(automation.id);
    if (!sb.dispatchEvent(new CustomEvent('am-start', { cancelable: true, detail: { automation, ask } }))) return;
    sb.querySelector(LIVE_ROW)?.click();
    sb.dispatchEvent(new CustomEvent('spot-ask', { detail: { ask, restart: true, automation: automation.id } }));
  }
  const detail = mountDetail({ sb, start });

  // published, edited or unpublished (here or in Settings): the grid drawn again with what the search and the picked
  // apps still show; a start's use counts on its card. Picked apps no longer offered are let go.
  function refresh() {
    if (state === 'loading') return;
    index();
    grid.innerHTML = items.map(card).join('');
    for (const id of picked) if (!items.some((a) => appsById.get(a.id).includes(id))) picked.delete(id);
    render();
  }
  onChange((part) => {
    if (part === 'published') refresh();
    // a rating (in an automation's full view) changes only the rating on the viewer's own cards, drawn again in place so
    // the card that opened the view is still there to take the focus back
    if (part === 'rated') {
      for (const a of items) {
        if (!a.mine) continue;
        const rate = grid.querySelector(`.am-card[data-id="${CSS.escape(a.id)}"] .am-rate`);
        if (rate) rate.outerHTML = rateHTML(automationById(a.id));
      }
    }
  });
  // Publish: the new one shown in the grid, every filter let go, its card focused
  page.querySelector('.am-publish').addEventListener('click', () => openPublish({
    sb,
    onDone: (a) => {
      input.value = '';
      picked.clear();
      render();
      const li = grid.querySelector(`.am-card[data-id="${CSS.escape(a.id)}"]`);
      li?.scrollIntoView({ block: 'nearest' });
      li?.querySelector('.am-open').focus();
      count.textContent = `${a.title} is published. ${countText(items.length)}`;
    },
  }));
  // Try Me! starts it; a press anywhere else on the card opens it in full
  grid.addEventListener('click', (e) => {
    const li = e.target.closest('.am-card[data-id]');
    if (!li) return;
    if (e.target.closest('.am-try')) start(automationById(li.dataset.id));
    // a click a key made (Enter or space on the card's button) has no pointer count
    else detail.open(li.dataset.id, li.querySelector('.am-open'), { keyboard: e.detail === 0 });
  });
  // an automation named in the composer or a sent message (automation-refs.3c255b31.js) opens in full as its card does,
  // over whatever the window shows; with a modifier key its address opens the tab on it elsewhere
  document.addEventListener('click', (e) => {
    const ref = e.target.closest?.('a.am-ref[data-automation]');
    if (!ref || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    detail.open(ref.dataset.automation, ref, { keyboard: e.detail === 0 });
  });
  // New chat's popular automations (newchat.854d0793.js) start as their cards do
  sb.addEventListener('am-try', (e) => {
    const automation = automationById(e.detail.id);
    if (!automation) return;
    e.preventDefault();
    start(automation);
  });
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

  // the two lines hold a different number of chips at another width, and the tab is first laid out when it opens: the
  // chips are measured again whenever the row's width changes (not its height, which the measuring itself changes)
  let catsWidth = -1;
  new ResizeObserver(([e]) => {
    if (e.contentRect.width === catsWidth) return;
    catsWidth = e.contentRect.width;
    clampChips(cats);
  }).observe(cats);

  render();
  return { show, detail };
}

const app = document.querySelector('.app');
const sb = app?.querySelector('.sb');
if (!sb) throw new Error('no sidebar to hang the Automations tab on: load main.bdeb2397.js before automations-view.03378ba4.js');
const params = new URLSearchParams(location.search);
const tab = mountAutomations({ app, sb, state: params.get('state') || 'ready' });
mountGameAsk({ app, sb });
if (params.get('tab') === 'automations') {
  tab.show(true);
  if (params.get('automation')) tab.detail.open(params.get('automation'), document.querySelector(`.am-card[data-id="${CSS.escape(params.get('automation'))}"] .am-open`));
}
