// "lisbon" play pages: real Google Hotels captures (headless Chromium, public site, nothing is ever
// booked or sent), staged by DOM edits only so they match the "lisbon" chat in transcripts.bdeb2397.js:
// a made-up "Casa do Chiado Hotel" (4.6, $204 a night, $612 for 3 nights, free cancellation until Nov 17).
// Extends capture-lisbon.bdeb2397.mjs (same search URL, same made-up hotel list).
//
// Pages written to plays/lisbon/ (+ pages.json entries):
//   hotels-top  results as the page loads (search row visible)                       scroll: none
//   hotels      results with Google's compact (scrolled) header, + exact scroll layer
//   hotel       Google's own page for the hotel, Overview view, Stay total prices
// Run from the project root:   node sidebars.bdeb2397/tools/play-lisbon.8889b4ff.mjs [hotels] [hotel]
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'plays', 'lisbon');
const TMP = join(tmpdir(), 'play-lisbon');
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const TS =
  'CAESCgoCCAMKAggDEAAaUAoyEi4yJDB4ZDE5MzQ3ZjAyYTYzOTBmOjB4ZTAwNTFjNTY2ZmRjMWU5NzoGQ2hpYWRvGgASGhIUCgcI6g8QCxgUEgcI6g8QCxgXGAMyAggBKgkKBToDVVNEGgA';
const URL = `https://www.google.com/travel/search?q=hotels%20in%20Chiado%20Lisbon&hl=en&gl=us&curr=USD&ts=${TS}`;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const SKIP_REAL = ['Casinha das Flores']; // real hotels whose photo shows people (a terrace): dropped, the next one takes its place
const BASE_SCROLL = 100; // real scrollY at which Google's header is in its compact (sticky) state

// Made-up hotels, in list order (same as capture-lisbon). nightly x 3 = total. The first is the booked hotel.
const HOTELS = [
  { name: 'Casa do Chiado Hotel', area: 'Chiado', nightly: 204, rating: '4.6', count: '(418)', stars: '4-star hotel', first: true },
  { name: 'Palacete da Baixa', area: 'Baixa', nightly: 187, rating: '4.4', count: '(912)', stars: '4-star hotel' },
  { name: 'Alfama Terraco Hotel', area: 'Alfama', nightly: 238, rating: '4.5', count: '(356)', stars: '4-star hotel' },
  { name: 'Casa Azul Bairro Alto', area: 'Bairro Alto', nightly: 163, rating: '4.3', count: '(642)', stars: '3-star hotel' },
  { name: 'Principe Real Suites', area: 'Principe Real', nightly: 276, rating: '4.7', count: '(203)', stars: '5-star hotel' },
  { name: 'Rua Augusta Boutique', area: 'Baixa', nightly: 219, rating: '4.4', count: '(527)', stars: '4-star hotel' },
  { name: 'Miradouro Alfama Residence', area: 'Alfama', nightly: 152, rating: '4.2', count: '(289)', stars: '3-star hotel' },
  { name: 'Largo do Carmo Hotel', area: 'Chiado', nightly: 311, rating: '4.6', count: '(774)', stars: '5-star hotel' },
  { name: 'Jardim do Principe', area: 'Principe Real', nightly: 198, rating: '4.5', count: '(331)', stars: '4-star hotel' },
  { name: 'Baixa Pombalina Inn', area: 'Baixa', nightly: 171, rating: '4.3', count: '(468)', stars: '3-star hotel' },
];

const wanted = process.argv.slice(2);
const want = (id) => wanted.length === 0 || wanted.includes(id);

// ---------- helpers ----------
const webp = (png, out) => execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', out], { stdio: 'ignore' });
const PAGES_JSON = join(OUT, 'pages.json');
function record(id, entry) {
  const j = existsSync(PAGES_JSON) ? JSON.parse(readFileSync(PAGES_JSON, 'utf8')) : { chat: 'lisbon', pages: {} };
  j.pages[id] = entry;
  writeFileSync(PAGES_JSON, JSON.stringify(j, null, 1));
}
const pathOf = (u) => { const x = new globalThis.URL(u); x.searchParams.delete('ved'); return x.pathname + x.search; };

async function openResults(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US',
    timezoneId: 'America/Los_Angeles', userAgent: UA,
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  for (const name of [/Reject all/i, /Accept all/i]) {
    const btn = page.getByRole('button', { name }).first();
    if (await btn.isVisible().catch(() => false)) { await btn.click().catch(() => {}); await page.waitForTimeout(2000); break; }
  }
  const dates = async () =>
    (await page.getByRole('textbox', { name: /Check-in/i }).first().inputValue()) + '|' +
    (await page.getByRole('textbox', { name: /Check-out/i }).first().inputValue());
  if (!/Nov 20\|.*Nov 23/.test(await dates())) throw new Error('dates not set: ' + (await dates()));
  await page.waitForSelector('.uaTTDe h2', { timeout: 30000 });
  await page.waitForTimeout(5000);
  return { ctx, page };
}

// ---------- staging of the results list (as capture-lisbon, plus: 10 cards, footer) ----------
function stageResults({ HOTELS, SKIP_REAL }) {
  const log = [];
  const setText = (el, t) => { if (el) el.textContent = t; };
  const hide = (el) => { if (el) el.style.setProperty('display', 'none', 'important'); };
  const spon = [...document.querySelectorAll('span,div,h2')].find(
    (e) => e.children.length < 3 && /^Sponsored/.test(e.textContent.trim()) && e.textContent.length < 40);
  let n = spon;
  for (let i = 0; i < 3 && n; i++) n = n.parentElement;
  if (n && n.tagName === 'C-WIZ' && !n.querySelector('.uaTTDe')) hide(n);

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let t;
  while ((t = walker.nextNode())) {
    const s = t.textContent.trim();
    if (/^(Chiado|Lisbon)\s·\s[\d,.K]+\sresults$/.test(s)) { t.textContent = 'Chiado · 40 results'; log.push('heading'); }
    else if (/^Showing results 1 - 20 of [\d,]+$/.test(s)) { t.textContent = `Showing results 1 - ${HOTELS.length} of 40`; log.push('showing'); }
    else if (/^[A-Za-z .'-]+, [A-Z]{2}, USA$/.test(s) && t.parentElement && t.parentElement.tagName === 'B') { t.textContent = 'San Francisco, CA, USA'; log.push('place'); }
  }
  // the bold "<place>, USA" in the footer may not be a <b>: match by its sibling text too
  for (const el of document.querySelectorAll('span,div,b,strong')) {
    if (el.children.length === 0 && /^Laramie, WY, USA$/.test(el.textContent.trim())) { el.textContent = 'San Francisco, CA, USA'; log.push('place2'); }
  }

  const all = [...document.querySelectorAll('.uaTTDe')].filter((c) => c.querySelector('h2.BgYkof'));
  const cards = [];
  for (const c of all) {
    const isHotel = [...c.querySelectorAll('.UqrZme')].some((e) => /star hotel/.test(e.textContent));
    const realName = c.querySelector('h2.BgYkof').textContent.trim();
    if (isHotel && !SKIP_REAL.includes(realName) && cards.length < HOTELS.length) cards.push(c);
    else hide(c.parentElement && c.parentElement.tagName === 'C-WIZ' ? c.parentElement : c);
  }
  cards.forEach((card, i) => {
    const h = HOTELS[i];
    const total = h.nightly * 3;
    setText(card.querySelector('h2.BgYkof'), h.name);
    const pw = card.querySelector('.PwV1Ac');
    const tw = document.createTreeWalker(pw, NodeFilter.SHOW_TEXT);
    let tn;
    while ((tn = tw.nextNode())) {
      const s = tn.textContent.trim();
      if (/^\$[\d,]+$/.test(s)) {
        tn.textContent = '$' + h.nightly;
        if (tn.parentElement) tn.parentElement.style.setProperty('color', '#202124', 'important');
      } else if (/^\$[\d,]+ nightly$/.test(s)) tn.textContent = `$${h.nightly} nightly`;
      else if (/^\$[\d,]+ total$/.test(s)) tn.textContent = `$${total} total`;
    }
    for (const el of card.querySelectorAll('span,div')) {
      if (el.children.length === 0 && /^(GREAT )?(DEAL|PRICE)$/.test(el.textContent.trim())) hide(el);
    }
    const sub = card.querySelector('.SZI0S');
    let hasTotal = false;
    const seen = (e) => !!e && e.getBoundingClientRect().height > 0;
    if (seen(sub)) {
      hasTotal = true;
      sub.textContent = `$${total} total`;
      sub.style.setProperty('color', '#5f6368', 'important');
    } else if (seen(pw.querySelector('.DPNIGe'))) {
      hasTotal = true;
      const d = pw.querySelector('.DPNIGe');
      const tl = document.createElement('div');
      tl.className = d.className;
      tl.textContent = `$${total} total`;
      d.parentElement.insertBefore(tl, d);
    }
    const jga = pw.querySelector('.JGa7fd') || pw;
    if (!hasTotal) {
      const tl = document.createElement('div');
      tl.className = 'fc-total';
      tl.textContent = `$${total} total`;
      tl.style.cssText = `font-size:12px;line-height:16px;text-align:right;color:${h.first ? '#202124' : '#5f6368'};font-weight:${h.first ? 500 : 400}`;
      jga.appendChild(tl);
    }
    if (h.first) {
      const f = document.createElement('div');
      f.textContent = 'Free cancellation';
      f.style.cssText = 'color:#188038;font-size:12px;line-height:16px;margin-top:2px;text-align:right;font-weight:500';
      jga.appendChild(f);
      if (seen(sub)) { sub.style.setProperty('color', '#202124', 'important'); sub.style.fontWeight = '500'; }
    }
    setText(card.querySelector('.KFi5wf'), h.rating);
    setText(card.querySelector('.jdzyld'), ' ' + h.count);
    const loc = card.querySelector('.uTUoTb.pWBec');
    if (loc) loc.textContent = `${h.area} · Excellent location`;
    else {
      const slot = card.querySelector('.nlwZxb.ka7rWc');
      if (slot) { slot.textContent = `${h.area} · Excellent location`; slot.style.cssText = 'color:#1a73e8;font-size:12px'; }
    }
    setText(card.querySelector('.UqrZme'), h.stars);
    const am = [...card.querySelectorAll('li .LtjZ2d')];
    if (h.first) {
      const first = ['Free cancellation', 'Free Wi-Fi', 'Breakfast ($)', 'Air conditioning', 'Bar', 'Restaurant', 'Pet-friendly', 'Fitness center'];
      am.forEach((el, j) => { el.textContent = first[j] || ''; });
    }
    for (const a of card.querySelectorAll('[aria-label]')) {
      const l = a.getAttribute('aria-label');
      if (l && /Brown|Avenue|Hotel|Prices starting/i.test(l) && !/Photo|Next|Previous/.test(l)) a.removeAttribute('aria-label');
    }
  });
  log.push('cards=' + cards.length);
  stageMap();
  function stageMap() {
    let k = 0;
    for (const pin of document.querySelectorAll('a.Kz2OTe')) {
      const price = pin.querySelector('.GIPbOc > div:last-child');
      if (price && /^\$\d/.test(price.textContent)) { price.textContent = '$' + (150 + ((k * 37 + 11) % 171)); k++; }
    }
    log.push('pins=' + k);
    for (const el of document.querySelectorAll('button,span,div')) {
      if (el.children.length < 3 && /^Update list$/.test(el.textContent.trim())) {
        const box = el.closest('button') || el;
        hide(box.parentElement && box.parentElement.children.length === 1 ? box.parentElement : box);
      }
    }
  }
  return log;
}

// Load every lazy photo in the list (scroll through it once), then come back to the top.
async function warmList(page) {
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y <= H; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 300)); }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
}


// ---------- staging of Google's own page for the first hotel (Overview view, Stay total prices) ----------
function stageHotel({ HOTELS, SKIP_REAL, TOTAL }) {
  const log = [];
  const hide = (el) => { if (el) el.style.setProperty('display', 'none', 'important'); };
  const real = (document.querySelector('h1.FNkAEc') || {}).textContent || '';
  const me = HOTELS[0];
  // left list: organic hotels in order take the made-up hotels (same order, photos and prices as the results page)
  const heads = [...document.querySelectorAll('h2.YRhVVc, h2.CF94Hd')];
  const itemOf = (h) => { let e = h; while (e.parentElement && e.parentElement.querySelectorAll('h2.YRhVVc, h2.CF94Hd').length === 1) e = e.parentElement; return e; };
  const names = {}; // real name -> made-up name
  let used = 0;
  for (const h of heads) {
    const item = itemOf(h);
    const ol = item.querySelector('ol');
    const isHotel = h.classList.contains('CF94Hd') && ol && /star hotel/.test(ol.textContent);
    if (!isHotel || SKIP_REAL.includes(h.textContent.trim()) || used >= HOTELS.length) { hide(item); continue; }
    const m = HOTELS[used++];
    names[h.textContent.trim()] = m.name;
    h.textContent = m.name;
    const price = item.querySelector('span.A6Q78d');
    if (price) { price.textContent = '$' + m.nightly; price.style.setProperty('color', '#202124', 'important'); }
    for (const el of item.querySelectorAll('span,div')) if (el.children.length === 0 && (/^(GREAT )?(DEAL|PRICE)$/.test(el.textContent.trim()) || /(less|more) than usual/.test(el.textContent))) hide(el);
    const r = item.querySelector('span.KFi5wf'); if (r) r.textContent = m.rating;
    const c = item.querySelector('span.jdzyld'); if (c) c.textContent = m.count;
    // "4-star hotel ·" first text node of the list
    const tw = document.createTreeWalker(ol, NodeFilter.SHOW_TEXT); let t;
    const gone = [];
    while ((t = tw.nextNode())) {
      if (/star hotel/.test(t.textContent)) t.textContent = t.textContent.replace(/\d-star hotel/, m.stars);
      else if (/^\s*with a pool\s*$/.test(t.textContent)) gone.push(t);
    }
    gone.forEach((n) => { n.textContent = ''; });
  }
  log.push('items=' + used);
  names[real.trim()] = me.name;
  // every other place the real names show (text, aria-label, alt, title)
  const swap = (str) => { for (const [a, b] of Object.entries(names)) if (a && str.includes(a)) str = str.split(a).join(b); return str; };
  const tw2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t2;
  while ((t2 = tw2.nextNode())) { const n = swap(t2.textContent); if (n !== t2.textContent) t2.textContent = n; }
  for (const el of document.querySelectorAll('[aria-label],[alt],[title]')) {
    for (const a of ['aria-label', 'alt', 'title']) { const v = el.getAttribute(a); if (v) { const n = swap(v); if (n !== v) el.setAttribute(a, n); } }
  }
  document.title = swap(document.title);
  // results count
  for (const h1 of document.querySelectorAll('h1.oJinoc')) h1.textContent = 'Chiado · 40 results';
  // this hotel's header block
  const set = (sel, fn) => { for (const el of document.querySelectorAll(sel)) if (el.getBoundingClientRect().height > 0) fn(el); };
  const panel = document.querySelector('h1.FNkAEc').closest('c-wiz') || document.body;
  for (const el of document.querySelectorAll('span.CFH2De')) {
    if (/^\d, ?\d|Lisboa, Portugal/.test(el.textContent)) el.textContent = 'R. do Alecrim 117, 1200-014 Lisboa, Portugal';
    if (/^\+351/.test(el.textContent)) el.textContent = '+351 21 555 0189';
  }
  // rating row in the header (4.6 stays, count from the made-up hotel)
  for (const el of document.querySelectorAll('span.jdzyld')) if (el.getBoundingClientRect().x > 300 && el.getBoundingClientRect().x < 1000) el.textContent = me.count;
  // price badge: nightly price
  for (const el of document.querySelectorAll('span.qQOQpe')) el.textContent = '$' + me.nightly;
  // featured options, Stay total: first provider and its first room carry the booked price
  const opts = [...document.querySelectorAll('span.UeIHqb')].filter((e) => e.getBoundingClientRect().height > 0);
  const totals = [TOTAL, TOTAL, TOTAL + 38, TOTAL + 27, TOTAL + 15, TOTAL + 15, TOTAL + 38, TOTAL + 38];
  opts.forEach((e, i) => { e.textContent = '$' + totals[i % totals.length]; });
  // free cancellation on the first room (the top option's first room line)
  const room = [...document.querySelectorAll('div.WL9xgc')].find((e) => e.getBoundingClientRect().height > 0);
  if (room && !/Free cancellation/.test(room.textContent)) room.textContent = room.textContent.trim() + ' · Free cancellation until Nov 17';
  // the other pins on the map, as on the results page
  let k = 0, big = false;
  for (const g of document.querySelectorAll('.GIPbOc')) {
    const price = g.querySelector(':scope > div:last-child');
    if (!price || !/^\$\d/.test(price.textContent)) continue;
    if (getComputedStyle(g).backgroundColor === 'rgb(240, 98, 146)') { price.textContent = '$' + me.nightly; big = true; }
    else { price.textContent = '$' + (150 + ((k * 37 + 11) % 171)); k++; }
  }
  const biggest = big;
  log.push('pins=' + k + ' big=' + !!biggest + ' real=' + real);
  return log;
}

const browser = await chromium.launch({ headless: true });
try {
  // ====================== hotels-top + hotels (scroll) ======================
  if (want('hotels')) {
    const { ctx, page } = await openResults(browser);
    console.log('staged:', (await page.evaluate(stageResults, { HOTELS, SKIP_REAL })).join(' '));
    await warmList(page);
    await page.mouse.move(760, 30);
    await page.waitForTimeout(500);
    const title = await page.title();
    const url = page.url();

    // --- hotels-top: scrollY 0
    const tPng = join(TMP, 'hotels-top.png');
    const measure = () =>
      page.evaluate(() => {
        const c = (e) => { const r = e.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10]; };
        const cards = [...document.querySelectorAll('.uaTTDe')].filter((e) => e.getBoundingClientRect().height > 0 && e.querySelector('h2.BgYkof'));
        const titleEl = (k) => cards[k].querySelector('h2.BgYkof');
        const btn = [...cards[0].querySelectorAll('a')].find((a) => /View prices/.test(a.textContent));
        return { hotel1: c(titleEl(0)), prices1: c(btn), hotel2: c(titleEl(1)), hotel3: c(titleEl(2)), n: cards.length,
                 map: document.querySelector('.Kz2OTe') ? 1 : 0, scrollH: document.documentElement.scrollHeight };
      });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({ path: tPng });
    webp(tPng, join(OUT, 'hotels-top.webp'));
    const mTop = await measure();
    record('hotels-top', {
      img: 'hotels-top.webp', title, host: 'google.com', path: pathOf(url), fav: '../../screens/fav/hotels-site.png',
      targets: { hotel1: mTop.hotel1, prices1: mTop.prices1, hotel2: mTop.hotel2, hotel3: mTop.hotel3 }, scroll: null, field: null,
    });
    console.log('hotels-top', JSON.stringify(mTop));

    // --- hotels: real scrollY = BASE_SCROLL (compact header)
    await page.evaluate((s) => scrollTo(0, s), BASE_SCROLL);
    await page.waitForTimeout(900);
    const bPng = join(TMP, 'hotels.png');
    await page.screenshot({ path: bPng });
    webp(bPng, join(OUT, 'hotels.webp'));
    const m = await measure();
    // the scrolling region: below Google's fixed filter band, left of the map
    const geo = await page.evaluate(() => {
      const band = document.querySelector('.E4DaWc');
      const mapEl = document.elementFromPoint(1300, 400);
      let e = mapEl, left = 1470;
      while (e && e !== document.body) { const r = e.getBoundingClientRect(); if (r.width < 1470 && r.height > 500) left = Math.min(left, r.x); e = e.parentElement; }
      return { bandBottom: band.getBoundingClientRect().bottom, mapLeft: left, doc: document.documentElement.scrollHeight };
    });
    console.log('geo', JSON.stringify(geo), 'measure', JSON.stringify(m));
    const BOX = [0, Math.ceil(geo.bandBottom), Math.floor(geo.mapLeft), 837 - Math.ceil(geo.bandBottom)];
    const sMax = geo.doc - 837 - BASE_SCROLL;
    const H = sMax + BOX[3];
    // strips of the region at 2x, stitched into one tall image
    const strips = [];
    for (let s = 0; ; s += BOX[3]) {
      const sc = Math.min(s, sMax);
      await page.evaluate((y) => scrollTo(0, y), BASE_SCROLL + sc);
      await page.waitForTimeout(450);
      const f = join(TMP, `strip-${sc}.png`);
      await page.screenshot({ path: f, clip: { x: BOX[0], y: BOX[1], width: BOX[2], height: BOX[3] } });
      strips.push([sc, f]);
      if (sc >= sMax) break;
    }
    const tall = join(TMP, 'hotels.scroll.png');
    execFileSync('magick', ['-size', `${BOX[2] * 2}x${H * 2}`, 'xc:white',
      ...strips.flatMap(([s, f]) => [f, '-geometry', `+0+${s * 2}`, '-composite']), tall]);
    webp(tall, join(OUT, 'hotels.scroll.webp'));

    // proof: composite at several offsets vs a real scrolled viewport
    const proof = [];
    for (const s of [0, 1, 137, 500, 1001, Math.floor(sMax / 2), sMax]) {
      await page.evaluate((y) => scrollTo(0, y), BASE_SCROLL + s);
      await page.waitForTimeout(500);
      const real = join(TMP, `real-${s}.png`);
      await page.screenshot({ path: real });
      const comp = join(TMP, `comp-${s}.png`);
      execFileSync('magick', [bPng, '(', tall, '-crop', `${BOX[2] * 2}x${BOX[3] * 2}+0+${s * 2}`, '+repage', ')',
        '-geometry', `+${BOX[0] * 2}+${BOX[1] * 2}`, '-composite', comp]);
      let ae;
      try { execFileSync('magick', ['compare', '-metric', 'AE', comp, real, 'null:'], { stdio: 'pipe' }); ae = 0; }
      catch (e) {
        ae = Number(String(e.stderr).trim().split(/[ (]/)[0]);
        execFileSync('magick', [comp, real, '-compose', 'difference', '-composite', '-colorspace', 'gray', '-threshold', '0', join(TMP, 'd.png')]);
        copyFileSync(join(TMP, 'd.png'), join(HERE, '..', '..', '.tmp', 'lisbon-play', `diff-${s}.png`));
        ae = [ae, execFileSync('magick', [join(TMP, 'd.png'), '-trim', '-format', '%@', 'info:']).toString()];
      }
      proof.push([s, ae]);
    }
    console.log('scroll proof [offset, differing pixels]:', JSON.stringify(proof));
    writeFileSync(join(TMP, 'proof.json'), JSON.stringify(proof));
    // keep one proof pair for the report
    const proofDir = join(HERE, '..', '..', '.tmp', 'lisbon-play');
    mkdirSync(proofDir, { recursive: true });
    copyFileSync(join(TMP, `comp-1001.png`), join(proofDir, 'hotels-composite-1001.png'));
    copyFileSync(join(TMP, `real-1001.png`), join(proofDir, 'hotels-real-1001.png'));

    // targets in content coordinates (row 0 = BOX[1] at s = 0)
    const ct = (p) => [p[0] - BOX[0], p[1] - BOX[1]];
    // card centres further down the list (for superbot's scroll to hotel3 and beyond)
    record('hotels', {
      img: 'hotels.webp', title, host: 'google.com', path: pathOf(url), fav: '../../screens/fav/hotels-site.png',
      targets: { hotel1: m.hotel1, prices1: m.prices1, hotel2: m.hotel2, hotel3: m.hotel3 },
      scroll: { box: BOX, img: 'hotels.scroll.webp', height: H,
        targets: { hotel1: ct(m.hotel1), prices1: ct(m.prices1), hotel2: ct(m.hotel2), hotel3: ct(m.hotel3) } },
      field: null,
    });
    await ctx.close();
  }

  // ====================== hotel: Google's own page for the hotel ======================
  if (want('hotel')) {
    const { ctx, page } = await openResults(browser);
    await page.locator('.uaTTDe:has(.UqrZme:text-matches("star hotel")) a:has-text("View prices")').first().click();
    await page.waitForSelector('h1.FNkAEc', { timeout: 20000 });
    await page.waitForTimeout(3500);
    // the real "Price displayed" control: Stay total (price for 3 nights with taxes + fees)
    await page.locator('[role=combobox]:visible, button:visible').filter({ hasText: 'Nightly price' }).first().click();
    await page.waitForTimeout(800);
    await page.locator('div:visible').filter({ hasText: /^Stay totalPrice for 3 nights/ }).last().click();
    await page.getByRole('button', { name: 'Done' }).first().click();
    await page.waitForTimeout(3000);
    await page.getByRole('tab', { name: 'Overview' }).first().click().catch(() => {});
    await page.waitForTimeout(2500);
    const url = page.url();
    const log = await page.evaluate(stageHotel, { HOTELS, SKIP_REAL, TOTAL: HOTELS[0].nightly * 3 });
    console.log('hotel staged:', log.join(' '));
    await page.mouse.move(760, 30);
    await page.waitForTimeout(800);
    const title = await page.title();
    const png = join(TMP, 'hotel.png');
    await page.screenshot({ path: png });
    webp(png, join(OUT, 'hotel.webp'));
    const book = await page.evaluate(() => {
      const prov = [...document.querySelectorAll('h3.RjilDd')].find((e) => e.getBoundingClientRect().height > 0);
      let row = prov; while (row && ![...row.querySelectorAll('span')].some((s) => s.textContent === 'Visit site')) row = row.parentElement;
      const btn = [...row.querySelectorAll('span')].find((s) => s.textContent === 'Visit site').closest('a,button,[role=button]');
      const r = btn.getBoundingClientRect();
      return { book: [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10], rect: [r.x, r.y, r.width, r.height], tag: btn.tagName };
    });
    console.log('book', JSON.stringify(book));
    record('hotel', {
      img: 'hotel.webp', title, host: 'google.com', path: pathOf(url), fav: '../../screens/fav/hotels-site.png',
      targets: { book: book.book }, scroll: null, field: null,
    });
    await ctx.close();
  }

  // ====================== train: Comboios de Portugal, Lisboa Rossio > Sintra, Sun Nov 22 2026, 2 passengers ======================
  if (want('train')) {
    const ctx = await browser.newContext({
      viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'Europe/Lisbon', userAgent: UA,
    });
    const page = await ctx.newPage();
    // the same address the site's own search form (Lisboa Rossio > Sintra, 22/11/2026, 2 passengers) navigates to
    const CP = 'https://www.cp.pt/en/resultado-pesquisa?passageiros=2&selectedClass=2&startDate=2026-11-22&departureStation=94-59006&arrivalStation=94-61101';
    await page.goto(CP, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(9000);
    // cookie banner: the site's own "Reject all" button (accepting would also be a real option)
    await page.getByRole('button', { name: /Rejeitar Todos|Reject All/i }).first().click().catch(() => {});
    await page.waitForTimeout(1500);
    const st = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a,button')].filter((e) => /See detail/.test(e.textContent) && e.getBoundingClientRect().height > 0);
      const rows = links.map((l) => { let e = l; while (e.parentElement && !/\d\d:\d\d/.test(e.innerText)) e = e.parentElement; return e; });
      const hid = [];
      for (const r of rows) {
        const hh = Number((r.innerText.match(/(\d\d):\d\d/) || [])[1]);
        // a time filter's effect: only departures from 08:00 on (the real Filters panel offers this)
        if (hh < 8) { r.style.setProperty('display', 'none', 'important'); hid.push(hh); }
      }
      window.scrollTo(0, 0);
      return { rows: rows.length, hidden: hid.length };
    });
    console.log('train rows', JSON.stringify(st));
    await page.mouse.move(760, 20);
    await page.waitForTimeout(800);
    const title = await page.title();
    const png = join(TMP, 'train.png');
    await page.screenshot({ path: png });
    webp(png, join(OUT, 'train.webp'));
    const t = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a,button')].filter((e) => /See detail/.test(e.textContent) && e.getBoundingClientRect().height > 0);
      const l = links[0]; let e = l; while (e.parentElement && !/\d\d:\d\d/.test(e.innerText)) e = e.parentElement;
      const c = (x) => { const r = x.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10]; };
      return { row: c(e), detail: c(l), text: e.innerText.replace(/\n+/g, ' | '), rect: e.getBoundingClientRect().toJSON() };
    });
    console.log('train target', JSON.stringify(t));
    // favicon: the site's own apple-touch-icon, 64px
    const ic = await ctx.request.get('https://www.cp.pt/apple-touch-icon-180x180.png');
    if (ic.ok()) { writeFileSync(join(TMP, 'cp-icon.png'), await ic.body()); execFileSync('magick', [join(TMP, 'cp-icon.png'), '-resize', '64x64', join(OUT, 'fav-cp.png')]); }
    record('train', {
      img: 'train.webp', title, host: 'cp.pt', path: pathOf(page.url()), fav: 'fav-cp.png',
      targets: { row: t.row, detail: t.detail }, scroll: null, field: null,
    });
    await ctx.close();
  }
} finally {
  await browser.close();
  rmSync(TMP, { recursive: true, force: true });
}
