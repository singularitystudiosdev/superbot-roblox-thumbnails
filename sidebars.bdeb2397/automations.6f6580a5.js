// The Automations page for view.html, loaded after main.bdeb2397.js and hung on the sidebar it built: the sidebar's
// "Automations" row opens it over the chat and the live view, a chat row or New chat closes it. A search field, the
// category chips the query points at (apps, any number picked at once), then the grid of automations. The open page,
// the query and the picks live in the URL (?tab=automations&q=&apps=), so a reload or a link lands on the same view.
// What matches what: automations-search.6f6580a5.js; the markup: automations-markup.6f6580a5.js.
import { APPS } from './apps.6f6580a5.js';
import { searchAutomations } from './automations-search.6f6580a5.js';
import { PAGE, card, chip, cardSkeletons, chipSkeletons, summary, tryLabel } from './automations-markup.6f6580a5.js';

const START_MS = 900; // "Starting" before an automation shows as running

function writeUrl(ui, s) {
  const url = new URL(location.href);
  const set = (key, value) => (value && !ui.page.hidden ? url.searchParams.set(key, value) : url.searchParams.delete(key));
  set('tab', 'automations');
  set('q', s.query.trim());
  set('apps', s.picked.join(','));
  history.replaceState(null, '', url);
}

// the chip row's edge fades: each grows with how far the row is scrolled from that edge, up to --sp-48, so a row
// at its start has no left fade and one at its end no right fade
function fadeEdges(cats) {
  const full = parseFloat(getComputedStyle(cats).getPropertyValue('--sp-48'));
  const room = cats.scrollWidth - cats.clientWidth;
  cats.style.setProperty('--fade-l', String(Math.min(1, Math.max(0, cats.scrollLeft / full))));
  cats.style.setProperty('--fade-r', String(Math.min(1, Math.max(0, (room - cats.scrollLeft) / full))));
}

function render(ui, s) {
  ui.clear.hidden = !s.query;
  ui.kbd.hidden = Boolean(s.query);
  if (s.loading) {
    ui.cats.innerHTML = chipSkeletons();
    ui.say.textContent = 'Loading automations';
    ui.grid.innerHTML = cardSkeletons();
    return;
  }
  const { topics, apps, counts, items } = searchAutomations(s.query, s.picked);
  ui.cats.innerHTML = chip({ id: '', label: 'All', pressed: s.picked.length === 0 })
    + apps.map((id) => chip({ id, label: APPS[id].name, count: counts.get(id) ?? 0, pressed: s.picked.includes(id) })).join('');
  fadeEdges(ui.cats);
  ui.say.textContent = summary(items.length, s.query, topics, s.picked);
  ui.grid.innerHTML = items.map((a) => card(a, s.running.get(a.id) ?? 'idle')).join('');
  ui.empty.hidden = items.length > 0;
  if (!items.length) {
    const otherChips = apps.length > s.picked.length;
    ui.empty.querySelector('p').textContent = s.picked.length && otherChips ? 'Nothing here for those categories. Pick another one, or clear them.' : 'No automations match that yet. Try an app name or a topic like Video.';
  }
  writeUrl(ui, s);
}

// the sidebar: Automations opens the page and becomes the current row; a chat or New chat goes back to the chat
function wireSidebar(sb, ui, s) {
  const navRow = sb.querySelector('a[href="#automations"]');
  let chatCurrent = null;
  const open = () => {
    if (!ui.page.hidden) return;
    // one row is current at a time: every mark goes, New chat's too, not only a chat's
    chatCurrent = sb.querySelector('[aria-current="page"]:not(a[href="#automations"])');
    for (const a of sb.querySelectorAll('[aria-current]')) a.removeAttribute('aria-current');
    navRow?.setAttribute('aria-current', 'page');
    ui.page.hidden = false;
    render(ui, s);
  };
  const close = () => {
    if (ui.page.hidden) return;
    ui.page.hidden = true;
    navRow?.removeAttribute('aria-current');
    // the row clicked may have taken the mark already
    if (!sb.querySelector('[aria-current]')) chatCurrent?.setAttribute('aria-current', 'page');
    writeUrl(ui, s);
  };
  sb.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    if (link === navRow) open(); else if (link.closest('.sb-scroll') || link.getAttribute('href') === '#new-chat') close();
  });
  return { open, close };
}

function wireSearch(ui, s) {
  const setQuery = (q) => { ui.input.value = q; s.query = q; render(ui, s); };
  ui.input.addEventListener('input', () => { s.query = ui.input.value; render(ui, s); });
  ui.input.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (ui.input.value) { e.preventDefault(); setQuery(''); } else ui.input.blur();
  });
  ui.clear.addEventListener('click', () => { setQuery(''); ui.input.focus(); });
  ui.empty.querySelector('.au-reset').addEventListener('click', () => { s.picked = []; setQuery(''); ui.input.focus(); });
  // "/" puts the cursor in the search field, as on GitHub and YouTube
  addEventListener('keydown', (e) => {
    if (ui.page.hidden || e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea, [contenteditable]')) return;
    e.preventDefault();
    ui.input.focus();
  });
}

// a chip adds its app to the picks or takes it out; All clears them
function wireChips(ui, s) {
  ui.cats.addEventListener('click', (e) => {
    const btn = e.target.closest('.au-chip[data-app]');
    if (!btn) return;
    const id = btn.dataset.app;
    s.picked = !id ? [] : s.picked.includes(id) ? s.picked.filter((p) => p !== id) : [...s.picked, id];
    render(ui, s);
    // the render replaced the chip just pressed: the focus goes to its new copy
    ui.cats.querySelector(`.au-chip[data-app="${id}"]`)?.focus();
  });
  ui.cats.addEventListener('scroll', () => fadeEdges(ui.cats), { passive: true });
  // the row scrolls only sideways: a mouse wheel's up and down moves it left and right while it has room that way,
  // and the page takes the wheel back once the row reaches its end
  ui.cats.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const room = ui.cats.scrollWidth - ui.cats.clientWidth;
    const step = e.deltaY * (e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1);
    if (room <= 0 || (step < 0 && ui.cats.scrollLeft <= 0) || (step > 0 && ui.cats.scrollLeft >= room)) return;
    e.preventDefault();
    ui.cats.scrollLeft += step;
  }, { passive: false });
}

// Try Me!: Starting, then Running; a running one stops when pressed again. The state outlives re-renders.
function wireTry(ui, s) {
  const paint = (id, state) => {
    if (state === 'idle') s.running.delete(id); else s.running.set(id, state);
    const btn = ui.grid.querySelector(`.au-try[data-id="${id}"]`);
    if (!btn) return;
    btn.dataset.state = state;
    btn.innerHTML = tryLabel(state);
    btn.toggleAttribute('aria-disabled', state === 'starting');
  };
  ui.grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.au-try');
    if (!btn || btn.dataset.state === 'starting') return;
    const { id } = btn.dataset;
    const name = btn.closest('.au-card').querySelector('.au-name').textContent;
    if (btn.dataset.state === 'on') { paint(id, 'idle'); ui.say.textContent = `Stopped ${name}.`; return; }
    paint(id, 'starting');
    ui.say.textContent = `Starting ${name}.`;
    setTimeout(() => { paint(id, 'on'); ui.say.textContent = `${name} is running. Press it again to stop it.`; }, START_MS);
  });
}

export function mountAutomations(app, sb, { loading = false } = {}) {
  app.insertAdjacentHTML('beforeend', PAGE);
  const page = app.querySelector('.au');
  const $ = (sel) => page.querySelector(sel);
  const ui = { page, input: $('input'), clear: $('.au-clear'), kbd: $('.au-kbd'), cats: $('.au-cats'), grid: $('.au-grid'), empty: $('.au-empty'), say: $('.au-say') };
  const params = new URLSearchParams(location.search);
  const s = { query: params.get('q') ?? '', picked: (params.get('apps') ?? '').split(',').filter((id) => APPS[id]), running: new Map(), loading };
  ui.input.value = s.query;
  const scroller = $('.au-scroll');
  scroller.addEventListener('scroll', () => page.classList.toggle('is-scrolled', scroller.scrollTop > 0), { passive: true });
  const nav = wireSidebar(sb, ui, s);
  wireSearch(ui, s);
  wireChips(ui, s);
  wireTry(ui, s);
  if (params.get('tab') === 'automations') nav.open();
  return nav;
}

const app = document.querySelector('.app');
const sb = app?.querySelector('.sb');
if (!sb) throw new Error('no sidebar to hang the Automations page on: load main.bdeb2397.js before automations.6f6580a5.js');
mountAutomations(app, sb, { loading: new URLSearchParams(location.search).get('state') === 'loading' });
