// Extra page captures for the "flights" chat run: Google Flights' REAL "Booking options" view (id options-894) for the
// cheapest itinerary of results-894 (SFO to Haneda, 1 stop, Mon Mar 8 to Mon Mar 22 2027, economy, 1 adult), staged with
// SIX booking sites (the airline + five online agencies, $894 up, cheapest first). Headless Chromium, 1470x837 CSS px,
// DSF 2, cwebp -q 80. Reached the way Google really flows (results -> click a departing flight -> click a return flight
// -> "Booking options"); the page's own booking rows are expanded ("N more booking options"), reordered and re-priced,
// the two selected-flight rows are re-staged as American + Japan Airlines (SFO-HND, 1 stop, 3 hr 10 min LAX) and Japan
// Airlines (HND-SFO nonstop); DOM edits only. Nothing is booked: no "Continue" button is pressed in this part.
//
// Optional --try-jal (off by default): follows the REAL "Continue" on Google's "Book with JAL" row (a different, JAL
// operated itinerary) to see where it really goes (Google clk -> www.jal.co.jp GoogleFlight/dispatch.cgi -> interReservation.cgi
// -> book-i.jal.co.jp/JLInt/dyn/air/booking/availability) in headless Firefox, and saves plays/flights/airline-review.webp ONLY
// if the last page is a real JAL page (not "Access Denied"). Every non-GET request off Google is aborted EXCEPT the POSTs
// the hand-off itself makes to jal.co.jp (search/availability dispatch + the site's own bot-sensor script), and never any whose
// URL looks like pay|credit|purchase|confirm|order|checkout|settle|issue|fix. No payment page is ever reached or filled.
//
// Writes ../plays/flights/options-894.webp, pages.options.json, fav-google-flights.png (copy of ../screens/fav/google-flights.png).
// Run: node sidebars.bdeb2397/tools/play-flights-options.4c8bc671.mjs [--try-jal]
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const require = createRequire('/Users/adrianagne/Documents/cosmos/projects/superbot-roblox-thumbnails/');
const { chromium, firefox } = require('playwright');

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'plays', 'flights');
mkdirSync(OUT, { recursive: true });
const tmp = join(tmpdir(), 'gf-options');
mkdirSync(tmp, { recursive: true });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const Q = 'Flights to TYO from SFO on 2027-03-08 through 2027-03-22 round trip economy 1 adult';
const GF = 'https://www.google.com/travel/flights?hl=en&gl=US&curr=USD&q=' + encodeURIComponent(Q);
const TRY_JAL = process.argv.includes('--try-jal');

// the staged itinerary (the chat's card: SFO to Haneda, 1 stop, $894; same flight as results-894 row 1)
const OUTBOUND = { logo: 'AA', air: 'American, Japan Airlines', dep: '7:05 AM', arr: '5:50 PM', plus: '+1', dur: '17 hr 45 min', stops: '1 stop', lay: '3 hr 10 min', layCode: 'LAX', co2: '688 kg CO2e', badge: '' };
const RETURN = { logo: 'JL', air: 'Japan Airlines', dep: '8:05 PM', arr: '1:15 PM', plus: '', dur: '9 hr 10 min', stops: 'Nonstop', lay: '', layCode: '', co2: '402 kg CO2e', badge: '' };
const PRICES = [894, 899, 912, 918, 931, 947]; // airline first, then five agencies, cheapest first
const AIRLINE_NAME = 'American';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openResults(browser, { route } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA });
  await ctx.addCookies([{ name: 'SOCS', value: 'CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg', domain: '.google.com', path: '/' }]);
  if (route) await route(ctx);
  const page = await ctx.newPage();
  // Google's results sometimes never paint on the first load: reload up to 4 times, then fail loudly
  let lastErr;
  for (let a = 0; a < 4; a++) {
    await page.goto(GF, { waitUntil: 'domcontentloaded' });
    for (const name of [/Reject all/i, /Accept all/i]) {
      const btn = page.getByRole('button', { name }).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) { await btn.click().catch(() => {}); break; }
    }
    try { await page.waitForSelector('li.pIav2d [data-gs]', { timeout: 30000 }); lastErr = null; break; } catch (e) { lastErr = e; console.error('results did not paint, retry', a + 1); }
  }
  if (lastErr) throw lastErr;
  await page.waitForTimeout(5000);
  return { ctx, page };
}

// pick the departing row by a predicate over its text; then the first return row; wait for the booking page
async function toBooking(page, pick) {
  const rows = await page.evaluate(() => [...document.querySelectorAll('li.pIav2d')].map((e) => e.innerText.replace(/\s+/g, ' ')));
  let idx = rows.findIndex(pick);
  if (idx < 0) throw new Error('no departing row matched; rows were:\n' + rows.join('\n'));
  console.log('departing row', idx, rows[idx].slice(0, 120));
  await page.locator('li.pIav2d .yR1fYc').nth(idx).click({ force: true, timeout: 8000 });
  await page.waitForSelector('text=Returning flights', { timeout: 20000 });
  await page.waitForSelector('li.pIav2d [data-gs]', { timeout: 20000 });
  await page.waitForTimeout(4000);
  await page.locator('li.pIav2d .yR1fYc').first().click({ force: true, timeout: 8000 });
  await page.waitForSelector('text=Booking options', { timeout: 25000 });
  await page.waitForSelector('button[aria-label^="Continue to book"]', { timeout: 20000 });
  await page.waitForTimeout(4000);
}

const STAGE_OPTIONS = ({ OUT_, RET_, prices, airlineName }) => {
  const logoVars = (el, code) => {
    el.style.setProperty('--travel-primitives-themeable-image-default', `url(https://www.gstatic.com/flights/airline_logos/70px/${code}.png)`);
    el.style.setProperty('--travel-primitives-themeable-image-dark', `url(https://www.gstatic.com/flights/airline_logos/70px/dark/${code}.png)`);
  };
  const esc = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const report = {};

  // ---- 1) the two selected-flight rows ----
  const slices = [...document.querySelectorAll('.E2ZmUe')];
  const to = [OUT_, RET_];
  report.realSlices = [];
  slices.slice(0, 2).forEach((s, i) => {
    const t = to[i];
    const sp = s.querySelectorAll('.zxVSec span[role="text"]');
    const arrNode = sp[1] && sp[1].cloneNode(true); if (arrNode) arrNode.querySelectorAll('.bOzv6').forEach((x) => x.remove());
    const main = s.querySelector('.OgQvJf') || s;
    const real = {
      dep: sp[0] && sp[0].textContent.trim(), arr: arrNode && arrNode.textContent.trim(),
      air: (main.querySelector('.Ir0Voe > .sSHqwe > span') || {}).textContent,
      dur: (main.querySelector('.gvkrdb') || {}).textContent, co2: (main.querySelector('.O7CXue div') || {}).textContent,
      badge: (main.querySelector('.rRrlfc') || {}).textContent,
    };
    report.realSlices.push(real);
    // single-pass text/attribute swap inside this slice
    const map = new Map(); const add = (a, b) => { if (a && b != null && a !== b) map.set(a, b); };
    add(real.dep, t.dep); add(real.arr, t.arr); add(real.dur, t.dur); add(real.co2, t.co2);
    if (real.co2) add(parseInt(real.co2.replace(/,/g, '')) + ' kilograms', parseInt(t.co2) + ' kilograms');
    if (real.badge && t.badge) add(real.badge, t.badge);
    if (map.size) {
      const re = new RegExp([...map.keys()].sort((a, b) => b.length - a.length).map(esc).join('|'), 'g');
      const sub = (v) => v.replace(re, (m) => map.get(m));
      const w = document.createTreeWalker(s, NodeFilter.SHOW_TEXT); const ns = []; while (w.nextNode()) ns.push(w.currentNode);
      ns.forEach((n) => { re.lastIndex = 0; if (re.test(n.nodeValue)) { re.lastIndex = 0; n.nodeValue = sub(n.nodeValue); } });
      s.querySelectorAll('*').forEach((el) => { for (const a of ['aria-label', 'title']) { const v = el.getAttribute(a); if (v) { re.lastIndex = 0; if (re.test(v)) { re.lastIndex = 0; el.setAttribute(a, sub(v)); } } } });
    }
    // airline logos (several .EbY4Pc per slice)
    s.querySelectorAll('.EbY4Pc').forEach((el) => logoVars(el, t.logo));
    // operators line: "American, Japan Airlines" as one string (the page's own results format)
    const ops = main.querySelector('.Ir0Voe > .sSHqwe'); if (ops) ops.textContent = t.air;
    // "+1" superscript belongs to the outbound only
    const sup = sp[1] && sp[1].querySelector('.bOzv6');
    if (sup) { if (t.plus) sup.textContent = t.plus; else sup.remove(); }
    // stops + layover; the red "long layover" warning triangle goes
    const stops = main.querySelector('.EfT7Ae span'); if (stops) { stops.textContent = t.stops; stops.setAttribute('aria-label', t.stops === 'Nonstop' ? 'Nonstop flight.' : t.stops + ' flight.'); }
    main.querySelectorAll('.EfT7Ae .HZtJGb').forEach((e) => e.remove());
    const lay = main.querySelector('.BbR8Ec .sSHqwe');
    if (lay) {
      if (t.lay) { const code = lay.querySelector('[aria-describedby]'); lay.firstChild.nodeValue = t.lay + ' '; if (code) code.firstChild.textContent = t.layCode; lay.setAttribute('aria-label', `Layover (1 of 1) is a ${t.lay} layover at Los Angeles International Airport in Los Angeles.`); }
      else { lay.textContent = ''; lay.removeAttribute('aria-label'); }
    }
    // emissions badge
    const rio = main.querySelector('.RioxB');
    if (rio) { if (t.badge) { rio.style.visibility = ''; rio.querySelectorAll('.rRrlfc').forEach((b) => (b.textContent = t.badge)); } else rio.style.visibility = 'hidden'; }
    // route: outbound SFO-HND (real page may be NRT), return HND-SFO
    const rs = main.querySelectorAll('.PTuQse .QylvBf span[aria-label=""]');
    const route = i === 0 ? ['SFO', 'HND'] : ['HND', 'SFO'];
    if (rs[0]) rs[0].textContent = route[0]; if (rs[1]) rs[1].textContent = route[1];
    const places = main.querySelectorAll('.PTuQse .eoY5cb');
    const names = i === 0 ? ['San Francisco International Airport', 'Haneda Airport'] : ['Haneda Airport', 'San Francisco International Airport'];
    if (places[0]) places[0].textContent = names[0]; if (places[1]) places[1].textContent = names[1];
  });
  // baggage strip: the staged American + Japan Airlines fare has the same real text; the airline's bag-policy link goes
  document.querySelectorAll('a').forEach((a) => { if (/bag policy/i.test(a.textContent)) a.remove(); });
  const bagNodes = []; { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); while (w.nextNode()) if (/1st checked bag free/.test(w.currentNode.nodeValue)) bagNodes.push(w.currentNode); }
  bagNodes.forEach((n) => (n.nodeValue = n.nodeValue.replace('1st checked bag free', '1st checked bag available for a fee')));

  // ---- 2) booking rows: expand the page's own "N more booking options", then reorder + re-price ----
  const toggle = [...document.querySelectorAll('[data-expandarialabel]')][0];
  report.hadToggle = !!toggle;
  const cells = [...document.querySelectorAll('.gN1nAc')].filter((c) => c.querySelector('.L53Hhb'));
  report.realRows = cells.map((c) => c.querySelector('.L53Hhb').innerText.replace(/\s+/g, ' '));
  const airlineCell = cells.find((c) => c.querySelector('.EA71Tc'));
  const agencyCells = cells.filter((c) => c !== airlineCell);
  // need 5 agencies: clone the page's own agency row when the real page shows fewer
  while (agencyCells.length < 5) { const c = agencyCells[agencyCells.length - 1].cloneNode(true); agencyCells[agencyCells.length - 1].after(c); agencyCells.push(c); }
  const chosen = [airlineCell, ...agencyCells.slice(0, 5)];
  const host = airlineCell.parentElement;
  // all rows now live directly in the first list: move them in order, drop everything else of the collapsed list
  chosen.forEach((c) => host.appendChild(c));
  cells.filter((c) => !chosen.includes(c)).forEach((c) => c.remove());
  document.querySelectorAll('.q0q6Ub').forEach((q) => { if (!q.querySelector('.L53Hhb')) q.style.display = 'none'; });
  // airline row
  const priceColor = getComputedStyle(airlineCell.querySelector('[data-gs]')).color;
  airlineCell.querySelectorAll('.MnHIn, .wxoHzc').forEach((el) => logoVars(el, 'AA'));
  const nameEl = airlineCell.querySelector('.ogfYpf.AdWm1c');
  if (nameEl) { nameEl.firstChild.nodeValue = `Book with ${airlineName}`; }
  report.rows = [];
  chosen.forEach((c, i) => {
    const p = prices[i];
    const price = c.querySelector('[data-gs]');
    price.textContent = '$' + p; price.setAttribute('aria-label', p + ' US dollars'); price.style.color = priceColor;
    const btn = c.querySelector('button[aria-label^="Continue to book"]');
    const nm = (c.querySelector('.ogfYpf.AdWm1c') || {}).firstChild;
    const name = nm ? nm.nodeValue.replace(/^Book with /, '').trim() : '?';
    if (btn) btn.setAttribute('aria-label', `Continue to book with ${name}${i === 0 ? ' airline' : ''} for ${p} US dollars`);
    // hide the (hidden-by-default) "View options" expander of every row so only name, price, Continue show
    c.querySelectorAll('.USZPOc').forEach((e) => (e.style.display = 'none'));
    report.rows.push(`${name}${i === 0 ? ' (Airline)' : ''} $${p}`);
  });
  // ---- 3) header totals: "$N Lowest total price" and the same figure anywhere in text/aria ----
  // the real page's lowest total (the header figure and the insight card repeat it): read it from the header, then swap exactly that string
  const realLow = (document.querySelector('.pfRj6') && (document.querySelector('.pfRj6').textContent.match(/\$[\d,]+/) || [])[0]) || null;
  const hdr = [...document.querySelectorAll('span, div')].find((e) => e.children.length === 0 && /^\$[\d,]+$/.test(e.textContent.trim()) && !e.hasAttribute('data-gs') && e.closest('div') && e.getBoundingClientRect().top < 400);
  const realTotal = (hdr && hdr.textContent.trim()) || realLow;
  report.realTotal = realTotal;
  const NEW = '$' + prices[0];
  const swaps = [[new RegExp(esc(realTotal || '$0') + '(?![\\d,])', 'g'), NEW], [/ — \$[\d,]+ (cheaper|more expensive) than usual/g, ''], [/\$1,300–3,600|\$1,300–\$3,600/g, '$780–1,550'], [/^\$1,300$/, '$780'], [/^\$3,600$/, '$1,550']];
  const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const tn = []; while (w2.nextNode()) tn.push(w2.currentNode);
  tn.forEach((n) => { let v = n.nodeValue; for (const [re, rep] of swaps) v = v.replace(re, rep); if (v !== n.nodeValue) n.nodeValue = v; });
  document.querySelectorAll('[aria-label]').forEach((e) => { const v = e.getAttribute('aria-label'); if (realTotal && v.includes(realTotal.replace(/[$,]/g, ''))) { if (/US dollars/.test(v) && e.closest('.L53Hhb')) return; } });
  document.querySelectorAll('.frOi8 .gOatQ').forEach((s) => (s.textContent = 'typical'));
  const mk = document.querySelector('.pfRj6'); if (mk) mk.style.left = '27%';
  // ---- 4) tidy + fit: the page's own "N more booking options" row goes (all six rows are open); to fit six rows in the
  // 837 px viewport without scrolling (Google's header is sticky and would cut the title), remove, in this order and only
  // as far as needed: the baggage strip, the Share button row, the "How options are ranked" line, the trip-summary line; whatever is still too tall is scrolled.
  [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /more booking options|Hide booking options/.test(e.textContent)).forEach((leaf) => {
    let el = leaf; while (el.parentElement && !el.parentElement.querySelector('.L53Hhb')) el = el.parentElement; el.style.display = 'none';
  });
  const rowsBottom = () => Math.max(...chosen.map((c) => c.getBoundingClientRect().bottom + window.scrollY));
  const hideShare = () => { const b = document.querySelector('button[aria-label="Share this flight"]'); if (!b) return; let el = b; while (el.parentElement && el.parentElement.innerText.trim() === 'Share') el = el.parentElement; el.style.display = 'none'; };
  report.fitSteps = [];
  const hideByText = (re) => { const els = [...document.querySelectorAll('div, span')].filter((e) => re.test(e.innerText.replace(/\s+/g, ' ').trim()) && e.innerText.length < 70); const leaf = els.sort((a, b) => b.innerText.length - a.innerText.length)[0]; if (!leaf) { report.fitSteps.push('MISS ' + re); return; } let el = leaf; const t = leaf.innerText.trim(); while (el.parentElement && el.parentElement.innerText.trim() === t) el = el.parentElement; el.style.display = 'none'; report.fitSteps.push('hid <' + el.tagName + ' class=' + el.className + '> h=' + Math.round(el.getBoundingClientRect().height)); };
  const steps = [['bag strip', () => document.querySelectorAll('.DGndNd').forEach((e) => (e.style.display = 'none'))], ['share row', hideShare], ['ranked line', () => hideByText(/^How options are ranked/)], ['trip summary line', () => hideByText(/^Round trip.*Economy.*passenger/)]];
  report.rowsBottomBefore = Math.round(rowsBottom());
  for (const [name, fn] of steps) { if (rowsBottom() + 20 <= 837) break; fn(); report.fitSteps.push(name); }
  report.rowsBottomAfter = Math.round(rowsBottom());
  return report;
};

const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
const shots = {};
try {
  const { ctx, page } = await openResults(browser);
  // the cheapest itinerary of the staged results page is SFO-HND, 1 stop: any real 1-stop SFO-HND row stands in for it
  await toBooking(page, (t) => /SFO–HND/.test(t) && /1 stop/.test(t));
  const rep = await page.evaluate(STAGE_OPTIONS, { OUT_: OUTBOUND, RET_: RETURN, prices: PRICES, airlineName: AIRLINE_NAME });
  console.log(JSON.stringify(rep, null, 1));
  if (rep.rowsBottomAfter + 20 > 837) await page.evaluate((y) => window.scrollTo(0, y), rep.rowsBottomAfter + 20 - 837);
  await page.waitForTimeout(1500);
  const png = join(tmp, 'options-894.png');
  await page.screenshot({ path: png });
  execFileSync('cwebp', ['-q', '80', '-quiet', png, '-o', join(OUT, 'options-894.webp')]);
  const rect = (sel, idx) => page.evaluate(([s, i]) => { const e = document.querySelectorAll(s)[i]; if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round((r.left + r.width / 2) * 10) / 10, Math.round((r.top + r.height / 2) * 10) / 10]; }, [sel, idx]);
  const targets = { site1: await rect('button[aria-label^="Continue to book"]', 0), site6: await rect('button[aria-label^="Continue to book"]', 5) };
  const leaks = await page.evaluate(() => (document.body.innerText.match(/Cathay|Fiji|HKG|Hong Kong|ZIPAIR|Your location|Mountain View|Denver|Boulder/g) || []));
  const u = new globalThis.URL(page.url());
  shots['options-894'] = { img: 'options-894.webp', title: await page.title(), host: u.host.replace(/^www\./, ''), path: u.pathname + u.search, fav: 'fav-google-flights.png', targets, scroll: null, field: null };
  console.log('options-894', JSON.stringify(shots['options-894']).slice(0, 300), 'leaks:', JSON.stringify(leaks));
  await ctx.close();
} catch (e) { console.error(e.stack || e); throw e; }

// ---- optional: follow the real "Continue" of a JAL-operated itinerary (airline-review) ----
if (TRY_JAL) {
  const ff = await firefox.launch({ headless: true });
  try {
    const hostOk = (h) => /(^|\.)(google\.com|gstatic\.com|googleapis\.com|googleusercontent\.com|gvt1\.com)$/.test(h) || /(^|\.)google\.[a-z.]+$/.test(h);
    const route = (ctx) => ctx.route((u) => !hostOk(u.hostname), (r) => {
      const req = r.request(); const u = new globalThis.URL(req.url());
      const jal = /(^|\.)jal\.co\.jp$/.test(u.hostname);
      if (req.method() === 'GET' || req.method() === 'HEAD' || req.method() === 'OPTIONS') return r.continue();
      if (jal && req.method() === 'POST' && !/pay|credit|purchase|confirm|order|checkout|settle|issue|fix/i.test(req.url())) { console.log('allow POST', u.hostname + u.pathname); return r.continue(); }
      console.log('ABORT', req.method(), u.hostname + u.pathname); return r.abort();
    });
    const { ctx, page } = await openResults(ff, { route });
    await toBooking(page, (t) => /JAL/.test(t) && /Nonstop/.test(t) && /SFO–NRT/.test(t));
    const [pop] = await Promise.all([ctx.waitForEvent('page', { timeout: 20000 }).catch(() => null), page.locator('button[aria-label^="Continue to book with JAL"]').first().click({ force: true })]);
    const tgt = pop || page;
    await sleep(30000);
    const body = await tgt.evaluate(() => document.body.innerText.slice(0, 400));
    console.log('JAL hand-off ended at', tgt.url(), '\n', body);
    if (/Access Denied/i.test(body)) {
      console.error('JAL booking engine walled this browser: "Access Denied ... You don\'t have permission to access ' + tgt.url() + ' on this server." (Akamai); airline-review NOT captured.');
    } else {
      const png = join(tmp, 'airline-review.png');
      await tgt.screenshot({ path: png });
      execFileSync('cwebp', ['-q', '80', '-quiet', png, '-o', join(OUT, 'airline-review.webp')]);
      console.log('saved airline-review.webp (unstaged raw JAL page) - stage it before use');
    }
    await ctx.close();
  } catch (e) { console.error(e.stack || e); throw e; } finally { await ff.close(); }
}

copyFileSync(join(here, '..', 'screens', 'fav', 'google-flights.png'), join(OUT, 'fav-google-flights.png'));
writeFileSync(join(OUT, 'pages.options.json'), JSON.stringify({ chat: 'flights', pages: shots }, null, 1) + '\n');
await browser.close();
