// The fx pack's page (pack.d3748edf.html): the niches down the rail, their icons in the grid, a search over every key
// and niche. Clicking an icon copies its key, the name FX (chats.bdeb2397.js) knows it by. The niche and the search
// live in the URL (?niche=, ?q=), so a view can be linked.
import { PACK, PACK_FX, PACK_GROUPS, packKeys } from './fx-pack.d3748edf.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const src = (key) => new URL(PACK_FX[key], import.meta.url).href;
const words = (key) => key.replace(/_/g, ' ');
const ALL = Object.keys(PACK_FX);

const rail = document.querySelector('.pk-niches');
const body = document.querySelector('.pk-body');
const field = document.querySelector('.pk-search input');
const status = document.querySelector('.pk-status');

const url = new URL(location.href);
const state = { niche: PACK.some((n) => n.id === url.searchParams.get('niche')) ? url.searchParams.get('niche') : 'all', q: url.searchParams.get('q') ?? '' };
field.value = state.q;

// a term matches the start of a word ("rain" finds rainbow, not brain): an icon by its name, a niche by its label and
// use, so "sword" finds crossed swords and "youtube" finds the Creators niche
const wordsOf = (text) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const matches = (text, terms) => {
  const list = wordsOf(text);
  return terms.every((t) => list.some((w) => w.startsWith(t)));
};

const row = (id, label, count, icon) => `<li><button class="pk-niche" type="button" data-niche="${id}" aria-current="${state.niche === id}"><img src="${src(icon)}" alt="" width="16" height="16" draggable="false"><span>${esc(label)}</span><small>${count}</small></button></li>`;

function paintRail() {
  const groupAt = new Map(PACK_GROUPS.map((g) => [g.from, g.label]));
  rail.innerHTML = row('all', 'All icons', ALL.length, 'sparkles') + PACK.map((n) => {
    const head = groupAt.has(n.id) ? `<li class="pk-group" aria-hidden="true">${esc(groupAt.get(n.id))}</li>` : '';
    return head + row(n.id, n.label, packKeys(n).length, packKeys(n)[0]);
  }).join('');
}

const tile = (key) => `<li><button class="pk-tile" type="button" data-key="${key}" title="${esc(words(key))}"><img src="${src(key)}" alt="" width="96" height="96" loading="lazy" decoding="async" draggable="false"><span>${esc(words(key))}</span></button></li>`;
const grid = (keys) => `<ul class="pk-grid">${keys.map(tile).join('')}</ul>`;
const section = (n, keys = packKeys(n)) => `<section class="pk-sec" aria-labelledby="pk-${n.id}"><h2 id="pk-${n.id}">${esc(n.label)}</h2><p>${esc(n.use)}, ${keys.length} icons</p>${grid(keys)}</section>`;

function paintBody() {
  const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  const niche = PACK.find((n) => n.id === state.niche);
  if (!terms.length) {
    body.innerHTML = niche ? section(niche) : PACK.map((n) => section(n)).join('');
    return;
  }
  const pool = niche ? packKeys(niche) : ALL;
  const hits = pool.filter((key) => matches(words(key), terms));
  const nicheHits = niche ? [] : PACK.filter((n) => matches(`${n.label} ${n.use}`, terms));
  const where = niche ? ` in ${niche.label}` : '';
  const named = hits.length ? `<section class="pk-sec" aria-labelledby="pk-results"><h2 id="pk-results">${hits.length} ${hits.length === 1 ? 'icon matches' : 'icons match'} "${esc(state.q)}"${esc(where)}</h2><p>Click one to copy its key</p>${grid(hits)}</section>` : '';
  body.innerHTML = hits.length || nicheHits.length
    ? named + nicheHits.map((n) => section(n)).join('')
    : `<div class="pk-empty"><span>No icon${esc(where)} matches "${esc(state.q)}".</span><button class="pk-clear" type="button">Clear search</button></div>`;
}

function remember() {
  const next = new URL(location.href);
  next.searchParams.delete('niche');
  next.searchParams.delete('q');
  if (state.niche !== 'all') next.searchParams.set('niche', state.niche);
  if (state.q) next.searchParams.set('q', state.q);
  history.replaceState(null, '', next);
}

let statusTimer;
function say(text) {
  status.textContent = text;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { status.textContent = ''; }, 2400);
}

async function copy(key, button) {
  try {
    await navigator.clipboard.writeText(key);
    say(`Copied ${key}, at ${PACK_FX[key]}`);
  } catch (err) {
    console.error('fx pack: clipboard write failed', err);
    say(`${key}, at ${PACK_FX[key]} (copy it from here: the clipboard refused)`);
  }
  for (const el of body.querySelectorAll('.pk-tile.is-copied')) el.classList.remove('is-copied');
  button.classList.add('is-copied');
}

rail.addEventListener('click', (e) => {
  const button = e.target.closest('.pk-niche');
  if (!button) return;
  state.niche = button.dataset.niche;
  for (const el of rail.querySelectorAll('.pk-niche')) el.setAttribute('aria-current', String(el === button));
  remember();
  paintBody();
  window.scrollTo({ top: 0 });
});

body.addEventListener('click', (e) => {
  const button = e.target.closest('.pk-tile');
  if (button) copy(button.dataset.key, button);
  if (e.target.closest('.pk-clear')) {
    field.value = '';
    state.q = '';
    remember();
    paintBody();
    field.focus();
  }
});

field.addEventListener('input', () => {
  state.q = field.value.trim();
  remember();
  paintBody();
});

paintRail();
paintBody();
