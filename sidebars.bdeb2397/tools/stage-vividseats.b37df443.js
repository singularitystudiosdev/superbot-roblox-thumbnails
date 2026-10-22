// The made-up Neon Harbor show staged onto the real Vivid Seats event page (DOM edits only), shared by the capture tools
// of the chats done on it: play-tickets.8889b4ff.mjs ("tickets") and play-pricewatch.b37df443.mjs ("pricewatch").
// STAGE and PREP run in the page (page.evaluate); L and STATES are the listings each state shows.

// [section, row, price, deal score, label, seat-view thumbnail section, zone]; one listing per section (each is "Lowest Price in Section")
export const L = {
  '108': ['108', 'K', 142, '9.8', 'Excellent', '8', 'lower'],
  '115': ['115', 'M', 159, '9.4', 'Excellent', '11', 'lower'],
  '120': ['120', 'R', 171, '9.1', 'Excellent', '120', 'lower'],
  '209a': ['209', 'F', 204, '8.9', 'Great', '209', 'upper'],
  '214': ['214', 'C', 238, '8.9', 'Great', '214', 'upper'],
  '112': ['112', 'H', 249, '8.9', 'Great', '12', 'lower'],
  '226': ['226', 'B', 261, '8.7', 'Great', '226', 'upper'],
  '209b': ['209', 'F', 274, '8.8', 'Great', '209', 'upper'],
  '118': ['118', 'L', 288, '8.6', 'Great', '118', 'lower'],
  '103': ['103', 'D', 305, '8.7', 'Great', '103', 'lower'],
  tail: [
    ['219', 'E', 312, '9.0', 'Excellent', '219', 'upper'], ['205', 'M', 326, '8.8', 'Great', '205', 'upper'],
    ['221', 'G', 338, '9.2', 'Excellent', '221', 'upper'], ['204', 'N', 349, '8.9', 'Great', '204', 'upper'],
    ['217', 'J', 361, '9.0', 'Excellent', '217', 'upper'], ['224', 'K', 372, '9.1', 'Excellent', '224', 'upper'],
    ['210', 'P', 384, '8.8', 'Great', '210', 'upper'], ['203', 'H', 397, '8.9', 'Great', '203', 'upper'],
    ['216', 'L', 409, '9.0', 'Excellent', '216', 'upper'], ['202', 'B', 424, '8.8', 'Great', '202', 'upper'],
    ['215', 'R', 439, '9.2', 'Excellent', '215', 'upper'], ['211', 'D', 455, '8.9', 'Great', '211', 'upper'],
    ['207', 'F', 468, '9.0', 'Excellent', '207', 'upper'], ['213', 'G', 481, '8.8', 'Great', '213', 'upper'],
  ],
};
export const STATES = {
  'event-238': { count: 44, list: [L['214'], L['112'], L['226'], L['209b'], L['118'], L['103'], ...L.tail] },
  'event-171': { count: 45, list: [L['120'], L['209a'], L['214'], L['112'], L['226'], L['118'], L['103'], ...L.tail] },
  'event-142': { count: 46, list: [L['108'], L['115'], L['120'], L['209a'], L['214'], L['112'], L['226'], L['118'], L['103'], ...L.tail] },
};
for (const s of Object.values(STATES)) s.list = s.list.slice(0, 20);

// ---------- in-page staging (idempotent; run again after every state change) ----------
export const STAGE = ({ list, count, WHEN, WHEN_LONG, selected }) => {
  const log = [];
  const SUBS = [
    [/Teddy Swims/g, 'Neon Harbor'], [/T-Mobile Arena/g, 'Riverside Arena'], [/Las Vegas, NV( \d{5})?/g, 'Portland, OR'], [/3780 Las Vegas Blvd\. South, Portland, OR/g, '1200 NE Riverside Dr, Portland, OR 97232'],
    [/Las Vegas/g, 'Portland'], [/ALLEGIANT FLIGHT DECK/gi, 'NORTH DECK'], [/HYDE LOUNGE/gi, 'EAST LOUNGE'], [/\d+ fans shopping/g, '88 fans shopping'],
    [/(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \w{3} \d+ at [\d:]+[ap]m/g, WHEN], [/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) \w+ \d+ at [\d:]+[ap]m/g, WHEN_LONG],
  ];
  const sub = (s) => SUBS.reduce((a, [re, to]) => a.replace(re, to), s);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) { const t = sub(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; }
  document.querySelectorAll('[aria-label],[title],[alt]').forEach((e) => {
    for (const a of ['aria-label', 'title', 'alt']) { const v = e.getAttribute(a); if (v && sub(v) !== v) e.setAttribute(a, sub(v)); }
  });
  document.title = 'Neon Harbor Portland tickets - Riverside Arena - 11/14/2026 | Vivid Seats';
  // the artist's photo beside the event name: a flat block in the site's navy instead of a real person
  const stack = window.__photoDone ? [] : document.elementsFromPoint(64, 190).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 30 && r.width < 140 && r.height < 140 && r.x < 100 && (e.tagName === 'IMG' || e.querySelector('img') || getComputedStyle(e).backgroundImage !== 'none'); });
  if (stack.length) window.__photoDone = true;
  for (const im of stack) {
    im.removeAttribute('srcset'); im.removeAttribute('src');
    im.style.background = 'linear-gradient(135deg,#14143c 0%,#14143c 55%,#c93a9a 100%)';
    im.querySelectorAll('img,source').forEach((c) => c.remove());
  }
  log.push('photo x' + stack.length);
  const rows = [...document.querySelectorAll('[data-testid=listing-row-container]')];
  if (!rows.length) return log;
  const minP = Math.min(...list.map((l) => l[2]));
  for (const e of document.querySelectorAll('button,span,div')) {
    if (e.children.length === 0 && /^\$\d+ - \$\d+\+?$/.test(e.textContent.trim())) e.textContent = e.textContent.trim().replace(/^\$\d+/, '$' + minP);
    if (e.children.length === 0 && /^\d+ listings$/.test(e.textContent.trim())) e.textContent = count + ' listings';
  }
  // ----- listing rows: slot i <- list[i] -----
  rows.forEach((c, i) => {
    const d = list[i]; if (!d) return;
    const [sec, row, price, score, label, thumb] = d;
    const r = c.querySelector('[data-listingid]');
    r.dataset.sectionid = sec; r.dataset.rowid = row; r.dataset.price = '$' + price; r.dataset.dealscore = score;
    r.style.borderLeft = '6px solid ' + (window.__zone[d[6]] || '#ccc');
    const sectionEl = c.querySelector('[data-testid^="Section "]');
    sectionEl.textContent = 'Section ' + sec; sectionEl.setAttribute('data-testid', 'Section ' + sec);
    const rowEl = c.querySelector('[data-testid=row]'); rowEl.textContent = ' Row ' + row;
    for (const n of rowEl.parentElement.childNodes) if (n.nodeType === 3 && /ticket/.test(n.nodeValue)) n.nodeValue = ' 2 tickets ';
    c.querySelectorAll('[data-testid=badge-URGENCY]').forEach((b) => b.closest('[class*=brokerSale]')?.remove());
    const sv = c.querySelector('[data-testid=deal-score-value]'), sl = c.querySelector('[data-testid=deal-score-label]');
    if (sv) sv.textContent = score; if (sl) sl.textContent = label;
    const dp = c.querySelector('[data-testid=discount-price]'); if (dp) dp.textContent = '$' + price;
    const lp = c.querySelector('[data-testid=listing-price]'); if (lp) lp.textContent = '$' + price;
    const img = c.querySelector('img[data-testid="3ddv-static-thumbnail"]');
    if (img) { img.removeAttribute('srcset'); img.src = img.src.replace(/Section\d+_\d+\.jpeg/, `Section${thumb}_${thumb}.jpeg`); }
  });
  // ----- map -----
  const svg = document.querySelector('svg.original-map');
  if (svg) {
    // section numbers on the lower bowl that the chat names: the bowl is numbered 1-20 on this map
    const big = [...svg.querySelectorAll('text')].filter((t) => /^\d{1,3}$/.test(t.textContent.trim()) && t.getBoundingClientRect().height >= 10);
    for (const t of big) { const m = { 8: '108', 12: '112', 15: '115' }[t.textContent.trim()]; if (m) t.textContent = m; }
    const labelOf = {}; // section -> {x,y,path}
    for (const t of big) {
      const b = t.getBoundingClientRect(), x = b.x + b.width / 2, y = b.y + b.height / 2;
      const p = document.elementsFromPoint(x, y).find((e) => e.matches('path[data-svg-section-id]') && svg.contains(e));
      labelOf[t.textContent.trim()] = { x, y, p };
    }
    const zoneOf = Object.fromEntries(list.map((d) => [d[0], d[6]]));
    for (const [sec, o] of Object.entries(labelOf)) {
      if (!o.p) continue;
      const z = zoneOf[sec];
      o.p.setAttribute('fill', z ? window.__zone[z] : '#fff'); o.p.style.fill = z ? window.__zone[z] : '#fff';
      if (window.__sel) { o.p.setAttribute('class', window.__sel.baseClass); o.p.setAttribute('stroke', window.__sel.baseStroke ?? 'none'); o.p.removeAttribute('stroke-width'); }
    }
    // pins: one per staged section (the 12 cheapest), price = that section's lowest listing
    let pins = [...document.querySelectorAll('[data-testid=svg-map-tooltip]')];
    let selPin = null;
    if (selected) { selPin = pins.find((p) => /selected/.test(p.className)); pins = pins.filter((p) => p !== selPin); }
    const want = list.filter((d) => d[0] !== selected).slice(0, 12);
    while (pins.length < want.length) { const c = pins[0].cloneNode(true); pins[0].parentElement.appendChild(c); pins.push(c); }
    pins.forEach((p, i) => {
      const d = want[i];
      if (!d) { p.style.display = 'none'; return; }
      p.style.display = '';
      p.querySelector('[data-testid=map-tooltip-price]').textContent = '$' + d[2];
    });
    pins.forEach((p, i) => {
      const d = want[i]; if (!d) return;
      const o = labelOf[d[0]]; if (!o) { log.push('no label ' + d[0]); return; }
      const m = /translate3d\((-?[\d.]+)px, (-?[\d.]+)px/.exec(p.style.transform || '');
      const tx = m ? +m[1] : 0, ty = m ? +m[2] : 0;
      const b = p.getBoundingClientRect();
      p.style.transform = `translate3d(${tx + (o.x - (b.x + b.width / 2))}px, ${ty + (o.y - 14 - b.bottom)}px, 0px)`;
      p.dataset.sec = d[0];
    });
    if (selPin) { const d = list.find((x) => x[0] === selected), o = labelOf[selected]; selPin.querySelector('[data-testid=map-tooltip-price]').textContent = '$' + d[2]; selPin.style.display = '';
      const m = /translate3d\((-?[\d.]+)px, (-?[\d.]+)px/.exec(selPin.style.transform || ''); const b = selPin.getBoundingClientRect();
      selPin.style.transform = `translate3d(${(m ? +m[1] : 0) + (o.x - (b.x + b.width / 2))}px, ${(m ? +m[2] : 0) + (o.y - 14 - b.bottom)}px, 0px)`; }
    log.push('pins ' + want.map((d) => d[0] + ':$' + d[2]).join(' '));
    // selected section (listing detail view): mirror the site's own selected look from the section it selected itself
    if (selected && window.__sel && labelOf[selected]?.p) {
      // the site draws the selected section's outline with a generated <style> keyed by the section id: point it at the staged section
      const tsid = labelOf[selected].p.getAttribute('data-svg-section-id'), re = new RegExp('\\b' + window.__sel.sid + '\\b', 'g');
      document.querySelectorAll('style').forEach((st) => {
        if (st.dataset.orig === undefined && /stroke|outline/.test(st.textContent) && new RegExp('\\b' + window.__sel.sid + '\\b').test(st.textContent)) { st.dataset.orig = st.textContent; log.push('style ' + st.textContent.slice(0, 160)); }
        if (st.dataset.orig !== undefined) st.textContent = st.dataset.orig.replace(re, tsid);
      });
    }
  }
  return log;
};

// first-time capture of colours and of the site's own "selected section" look, before anything is edited
export const PREP = () => {
  if (window.__zone) return;
  const zone = (name) => {
    const item = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === name);
    const dot = item?.parentElement?.querySelector('i,span:first-child,div:first-child');
    return dot ? getComputedStyle(dot).backgroundColor : null;
  };
  window.__zone = { lower: zone('Lower Level'), upper: zone('200 Level') };
};
