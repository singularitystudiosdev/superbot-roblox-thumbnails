// ROB IT's Thumbnails table in Creator Hub, as the ad drives it. The pages under rbx/ are the real Creator Hub and
// roblox.com documents, captured from the owner's signed-in Chrome and made static (img/CREDITS.txt); their analytics
// were blanked at build. Here: the table's rows (the page's own ten thumbnails plus the iterations superbot uploads),
// the illustrative figures each data update shows, and renderTable(), which writes one state into a captured page using
// that page's own row markup, so every cell, checkbox and chip is Creator Hub's.
export const PERIODS = [
  { date: 'Oct 21', range: 'Oct 14 - Oct 21' },
  { date: 'Oct 23', range: 'Oct 16 - Oct 23' },
  { date: 'Oct 25', range: 'Oct 18 - Oct 25' },
  { date: 'Oct 27', range: 'Oct 20 - Oct 27' },
];

const ASSET = (f) => `rbx/assets/${f}`;
const ITER = (n) => `img/iter/iter-${n}.webp`;

// every thumbnail the table can list, in the order the edit view lists them; `name` is how the chat refers to it
export const THUMBS = {
  gold: { img: ASSET('a3def5f381990d.webp'), name: 'gold vault' },
  dark: { img: ASSET('11c779beff20d2.webp'), name: 'dark vault' },
  bank: { img: ASSET('d0624696be2811.webp'), name: 'bank vault' },
  police: { img: ASSET('7d845c7485b985.webp'), name: 'police' },
  museum: { img: ASSET('cd3cce6d08bc20.webp'), name: 'museum' },
  gold2: { img: ASSET('a3def5f381990d.webp') },
  gold3: { img: ASSET('a3def5f381990d.webp') },
  sleepy: { img: ASSET('de34075a235bc0.webp') },
  spooky: { img: ASSET('6a870bc1f466fa.webp') },
  diamond: { img: ASSET('31d0a6cdb1dac6.webp') },
  it1: { img: ITER(3), name: 'Iteration 1', on: 'museum' },
  it2: { img: ITER(4), name: 'Iteration 2', on: 'museum' },
  it3: { img: ITER(5), name: 'Iteration 3', on: 'diamond' },
  it4: { img: ITER(6), name: 'Iteration 4', on: 'bedroom' },
  it5: { img: ITER(1), name: 'Iteration 5', on: 'bedroom' },
};
export const START_ORDER =['gold', 'dark', 'bank', 'police', 'museum', 'gold2', 'gold3', 'sleepy', 'spooky', 'diamond'];
export const START_ACTIVE = ['gold', 'dark', 'bank', 'police', 'museum'];

// illustrative qualified play-through rates (%) per data update; a thumbnail missing from a period has no data yet
const RATE = [
  { gold: 0.58, dark: 0.86, bank: 0.97, police: 0.71, museum: 1.12 },
  { dark: 0.85, bank: 0.98, police: 0.70, museum: 1.11, it1: 1.34 },
  { dark: 0.85, bank: 0.97, museum: 1.11, it1: 1.36, it2: 1.19 },
  { bank: 0.98, museum: 1.10, it1: 1.35, it2: 1.21, it4: 1.46 },
];
// impressions over each period: the old ones even under personalization, a new one fewer in its first days
const IMPRESSIONS = { gold: 84210, dark: 92486, bank: 88903, police: 90117, museum: 86542, it1: 41380, it2: 43215, it4: 39870 };
const SESSION = { gold: 8.6, dark: 9.0, bank: 9.3, police: 8.9, museum: 9.4, it1: 9.6, it2: 9.2, it4: 9.7 };

export function rateOf(period, id) { return RATE[period][id] ?? null; }
export function figures(period, id) {
  const ptr = rateOf(period, id);
  if (ptr === null) return null;
  const grow = period > 0 && IMPRESSIONS[id] < 60000 ? 1 + 0.9 * (period - 1) : 1; // a new thumbnail's reach builds
  const imp = Math.round((IMPRESSIONS[id] * grow) / 10) * 10 + ((period * 37) % 97);
  return { imp, plays: Math.round((imp * ptr) / 100), time: SESSION[id], ptr };
}
// the active set's average rate, for the chat's summary
export function averageRate(period, active) {
  const r = active.map((id) => rateOf(period, id)).filter((v) => v !== null);
  return r.reduce((a, b) => a + b, 0) / r.length;
}

const int = (n) => n.toLocaleString('en-US');
const BLANK = '<path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>';

// a captured page: its tbody, a row to clone, and the text nodes that carry the period. The edit view's Active box comes
// in Creator Hub's three states: ticked; unticked and locked, inside its "Only 5 thumbnails can be active at once"
// wrapper, while five are active; and unticked and free, the ticked one with its tick taken out
export function bindTable(doc) {
  const tbody = doc.querySelector('tbody');
  const template = tbody.querySelector('tr').cloneNode(true);
  const box = (tr) => tr && tr.querySelector('[data-table-column-key="ActiveCheckBox"]');
  let checks = null;
  if (box(template)) {
    const free = box(template).cloneNode(true);
    free.querySelector('.Mui-checked')?.classList.remove('Mui-checked');
    const input = free.querySelector('input');
    input.removeAttribute('checked');
    input.nextElementSibling.innerHTML = BLANK;
    input.nextElementSibling.dataset.testid = 'CheckBoxOutlineBlankIcon';
    const locked = [...tbody.rows].map(box).find((td) => td && td.querySelector('input[disabled]'));
    checks = { on: box(template).innerHTML, free: free.innerHTML, locked: locked ? locked.innerHTML : free.innerHTML };
  }
  const leaf = (re) => [...doc.querySelectorAll('bdi, div, span, p')].find((e) => e.children.length === 0 && re.test(e.textContent));
  // the Total row's figure cells, the ones after its label (blank since the build scrubbed them)
  const totals = [];
  for (let th = [...doc.querySelectorAll('thead th')].find((h) => h.textContent.trim() === 'Total')?.nextElementSibling; th; th = th.nextElementSibling) totals.push(th);
  // the pager under the table: rows per page, and which rows of how many
  const perPage = leaf(/^Rows per page:$/);
  const pageSize = perPage && [...perPage.parentElement.querySelectorAll('div')].find((e) => e.children.length === 0 && /^\d+$/.test(e.textContent.trim()));
  return { doc, tbody, template, checks, banner: leaf(/Data last updated on/), title: leaf(/^Thumbnail performance \(/), totals, pageSize, range: leaf(/^\d+-\d+ of \d+$/), key: '' };
}

function setCell(tr, key, text) {
  const td = tr.querySelector(`[data-table-column-key="${key}"]`);
  if (td && td.textContent !== text) td.textContent = text;
}

// one table state into one page: `edit` lists every row with its Active checkbox, the normal view only the active ones
export function renderTable(tb, state, edit) {
  const order = edit ? state.order : state.order.filter((id) => state.active.includes(id));
  const key = `${state.period}|${order.join(',')}|${state.active.join(',')}`;
  if (tb.key === key) return;
  tb.key = key;
  const P = PERIODS[state.period];
  if (tb.banner) tb.banner.textContent = `Personalization is active. Data last updated on ${P.date}, 2:00 AM.`;
  if (tb.title) tb.title.textContent = `Thumbnail performance (${P.range})`;
  // the edit view's first page holds every row the ad shows: 25 to a page, out of the game's eight more on page two
  if (tb.pageSize) tb.pageSize.textContent = '25';
  if (tb.range) tb.range.textContent = edit ? `1-${order.length} of ${order.length + 8}` : `1-${order.length} of ${order.length}`;
  tb.tbody.replaceChildren(...order.map((id, k) => {
    const tr = tb.template.cloneNode(true);
    tr.dataset.sbRow = id;
    tr.querySelectorAll('[data-testid]').forEach((n) => { n.dataset.testid = n.dataset.testid.replace(/-\d+$/, `-${k}`); });
    const btn = tr.querySelector('[data-table-column-key="Thumbnail"] button');
    if (btn) btn.style.backgroundImage = `url("../../${THUMBS[id].img}")`;
    const on = state.active.includes(id);
    const cell = tr.querySelector('[data-table-column-key="ActiveCheckBox"]');
    if (cell && tb.checks) cell.innerHTML = on ? tb.checks.on : state.active.length >= 5 ? tb.checks.locked : tb.checks.free;
    const f = state.active.includes(id) || edit ? figures(state.period, id) : null;
    setCell(tr, 'ThumbnailImpressions', f ? int(f.imp) : '0');
    setCell(tr, 'ThumbnailQualifiedPlays', f ? int(f.plays) : '0');
    setCell(tr, 'ThumbnailAVGPlayTime', f ? `${f.time.toFixed(1)} min` : '0.0 min');
    setCell(tr, 'ThumbnailQualifiedPTR', f ? `${f.ptr.toFixed(2)}%` : 'N/A');
    setCell(tr, 'ThumbnailWinningSegments', f && f.ptr === Math.max(...state.active.map((a) => rateOf(state.period, a) ?? 0)) ? '18+, <18' : 'N/A');
    return tr;
  }));
  // the Total row: the active thumbnails' sums, its rate their plays over their impressions
  const live = state.active.map((id) => figures(state.period, id)).filter(Boolean);
  const imp = live.reduce((a, f) => a + f.imp, 0), plays = live.reduce((a, f) => a + f.plays, 0);
  const time = live.reduce((a, f) => a + f.time * f.imp, 0) / (imp || 1);
  [int(imp), int(plays), `${time.toFixed(1)} min`, `${((plays / (imp || 1)) * 100).toFixed(2)}%`, 'N/A'].forEach((v, k) => { if (tb.totals[k]) tb.totals[k].textContent = v; });
}
