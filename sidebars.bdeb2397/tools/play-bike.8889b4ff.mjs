// Craigslist "bike" play: three real-page captures for the live run.
//   plays/bike/search.webp (+ search.scroll.webp)  the results list, as screens/bike.webp (same first 18 rows, 14 more below)
//   plays/bike/listing.webp                        a real Craigslist posting page (an Oakland Rockridge one with a single
//                                                  photo), restaged as the $540 aluminum 56cm bike; photo = chats/bike-listing.webp
//   plays/bike/reply.webp                          the same page right after pressing the site's real "reply" button
//                                                  (the email / chat panel, before any contact info or captcha)
//   plays/bike/pages.json
// Extends capture-bike.bdeb2397.mjs (same rows, same staging). Headless chromium only, public pages, nothing is sent:
// "reply" is pressed once and only its option list is shown; email / chat are never clicked.
// Run: node sidebars.bdeb2397/tools/play-bike.8889b4ff.mjs
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const OUT = join(root, 'plays', 'bike');
mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';
const SEARCH_URL = 'https://sfbay.craigslist.org/search/bia?query=road%20bike%2056cm&max_price=600#search=2~list~0';
const r1 = (n) => Math.round(n * 10) / 10;

// [title, location, date, price]; row 0 is the one superbot picks. Rows 0-17 are capture-bike's, 18+ are new (scroll).
const STAGED = [
  ['Aluminum road bike 56cm - new chain and tires', 'oakland rockridge / claremont', '12m ago', 540],
  ['56cm carbon road bike, Shimano 105, clean', 'berkeley', '10/21', 590],
  ['Road bike 54cm aluminum, tuned up, ready to ride', 'alameda', '10/21', 450],
  ['Aluminum endurance road bike 56cm, 2x9 Tiagra', 'san francisco', '10/20', 575],
  ['58cm carbon fiber road bike, Ultegra, light', 'walnut creek', '10/20', 600],
  ['Road bike, 56cm, aluminum frame, new bar tape', 'oakland lake merritt', '10/20', 495],
  ['52cm women’s aluminum road bike, great shape', 'albany / el cerrito', '10/20', 480],
  ['56cm steel road bike, Reynolds 520, 10 speed', 'emeryville', '10/19', 525],
  ['Carbon road bike 56cm, Sora groupset, light use', 'san leandro', '10/19', 565],
  ['61cm aluminum road bike, big frame, Shimano 105', 'hayward', '10/19', 470],
  ['Road bike 55cm aluminum, disc brakes, with pedals', 'oakland piedmont / montclair', '10/18', 580],
  ['56cm aluminum road bike, fresh service, 700c', 'richmond', '10/18', 460],
  ['58cm carbon road bike, mechanical Ultegra', 'san mateo', '10/18', 595],
  ['Road bike 54cm, aluminum, new tires and cables', 'fremont / union city / newark', '10/17', 455],
  ['56cm aluminum gravel / road bike, 2x10', 'pleasant hill / concord', '10/17', 535],
  ['Vintage 57cm aluminum road bike, 12 speed', 'daly city', '10/16', 510],
  ['Carbon road bike frame 56cm w/ wheels, 105', 'oakland north / temescal', '10/16', 585],
  ['Road bike, 54cm, light aluminum frame, clipless pedals', 'san rafael', '10/15', 475],
  ['56cm aluminum road bike, Claris 2x8, rack included', 'berkeley north / hills', '10/15', 420],
  ['Road bike 58cm aluminum, Shimano Sora, tuned', 'south san francisco', '10/14', 380],
  ['Carbon road bike 54cm, 105 11-speed, race wheels', 'palo alto', '10/14', 600],
  ['56cm aluminum road bike, bar-end shifters', 'oakland adams point', '10/14', 350],
  ['Road bike 52cm, aluminum, great for commuting', 'alameda', '10/13', 340],
  ['Steel road bike 56cm, 8 speed, new saddle', 'mission district', '10/13', 300],
  ['Aluminum road bike 56cm, Tiagra 3x10, great price', 'castro valley', '10/12', 445],
  ['Road bike 59cm carbon fork, Shimano Sora', 'oakland fruitvale', '10/12', 390],
  ['56cm road bike, aluminum, low miles, with bottle cages', 'berkeley', '10/11', 505],
  ['Bianchi style road bike 55cm, celeste, aluminum', 'sausalito / mill valley', '10/11', 560],
  ['Road bike 56cm aluminum, 9 speed, includes helmet', 'pacifica', '10/10', 410],
  ['Carbon road bike 56cm, Tiagra, tubeless wheels', 'san jose south', '10/10', 595],
  ['Road bike 50cm aluminum, 2x8, starter bike', 'oakland temescal', '10/09', 275],
  ['Aluminum road bike 58cm, Ultegra 6600, polished', 'daly city', '10/09', 540],
  ['56cm aluminum road bike, Shimano 2300, ready to go', 'hayward', '10/08', 360],
];
const ROWS_GLANCED = { rowA: 1, rowB: 5, rowC: 8 };

const LISTING = {
  title: 'Aluminum road bike 56cm - new chain and tires',
  price: '$540',
  place: '(oakland rockridge / claremont)',
  postId: '7961204418',
  slug: 'oakland-aluminum-road-bike-56cm-new/Q8mZ2vKd4rWnTq7LcHs3Bx',
  body: [
    'Selling my 56cm aluminum road bike. About 1,500 miles on it, always kept indoors.',
    'New chain and new 700x28 tires this month, so it is ready to ride. Shimano 105 groupset (2x11), compact crank, rim brakes, fresh bar tape. Frame is clean, no cracks or dents.',
    'Fits riders about 5\'9" to 6\'0". Pickup in Oakland, cash. No shipping.',
  ],
  posted: { text: '12 minutes ago', datetime: '2026-10-21T09:36:00-0700', title: '2026-10-21 09:36' },
};
// A real posting to restage: a single-photo Oakland Rockridge one. If it has expired, discover another the same way.
const POSTING_CANDIDATES = ['https://www.craigslist.org/view/d/oakland-cannondale-st400-touring-bike/5ensNTVuXakgyVXERs27DD'];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA });
const page = await ctx.newPage();
const tmp = (n) => join(tmpdir(), 'playbike-' + n);
const toWebp = (png, out) => { execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', out], { stdio: 'ignore' }); rmSync(png, { force: true }); };
const rect = (sel, nth = 0) => page.evaluate(([s, n]) => { const e = document.querySelectorAll(s)[n]; if (!e) return null; const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }, [sel, nth]);
const centre = (r) => [r1(r[0] + r[2] / 2), r1(r[1] + r[3] / 2)];
const pages = {};

// ============================== 1. search (scroll) ==============================
await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.cl-search-result .posting-title', { timeout: 30000 });
await page.waitForFunction((n) => document.querySelectorAll('.cl-search-result').length >= n, STAGED.length, { timeout: 30000 });
await page.waitForTimeout(1500);
if (!(await page.evaluate(() => document.querySelector('main')?.className.includes('cl-search-view-mode-list')))) throw new Error('not list view');

await page.evaluate((rows) => {
  const results = [...document.querySelectorAll('.cl-search-result')];
  results.forEach((el, i) => {
    const r = rows[i];
    if (!r) { el.remove(); return; }
    const [title, loc, date, price] = r;
    el.setAttribute('title', title);
    el.removeAttribute('data-pid');
    const label = el.querySelector('.posting-title .label');
    if (label) label.textContent = title;
    const a = el.querySelector('a.posting-title');
    if (a) a.setAttribute('href', '#');
    const l = el.querySelector('.result-location');
    if (l) l.textContent = loc;
    const meta = el.querySelector('.meta');
    const dateEl = meta && [...meta.children].filter((c) => c.tagName === 'SPAN' && c.className !== 'separator')[1];
    if (dateEl) { dateEl.textContent = date; dateEl.setAttribute('title', date); }
    const p = el.querySelector('.priceinfo');
    if (p) p.textContent = '$' + price;
    el.querySelectorAll('img').forEach((im) => im.remove());
  });
  document.querySelectorAll('[class*="banner"], [class*="cookie"], .cl-banner, #cl-top-banner').forEach((b) => b.remove());
  const total = [...document.querySelectorAll('.visible-counts span')][1];
  if (total) total.textContent = ' of ' + rows.length;
  document.activeElement?.blur?.();
  window.scrollTo(0, 0);
}, STAGED);
await page.waitForTimeout(800);
const photos = await page.evaluate(() => document.querySelectorAll('.cl-search-result img, .gallery-card img, .swipe img').length);
if (photos) throw new Error(`${photos} listing images still on the page`);

const sTitle = await page.title();
const sUrl = new URL(page.url());
const rowTarget = (i) => page.evaluate((i) => { const r = document.querySelectorAll('.cl-search-result a.posting-title')[i].getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, i);
const sTargets = { row540: await rowTarget(0) };
for (const [k, i] of Object.entries(ROWS_GLANCED)) sTargets[k] = await rowTarget(i);
const docH = await page.evaluate(() => document.documentElement.scrollHeight);
const box = await rect('.cl-search-results-container'); // x=200, y=151 (below the fixed query bar + toolbar), w=1270
const queryBottom = await page.evaluate(() => { const r = document.querySelector('.cl-search-toolbar').getBoundingClientRect(); return r.bottom; });
const BOX = [200, queryBottom, 1270, 837 - queryBottom];
await page.screenshot({ path: tmp('search.png'), clip: { x: 0, y: 0, width: 1470, height: 837 } });
toWebp(tmp('search.png'), join(OUT, 'search.webp'));
// keep a PNG of the exact viewport for the scroll proof
await page.screenshot({ path: tmp('search0.png'), clip: { x: 0, y: 0, width: 1470, height: 837 } });

// --- scroll layer: the document from y=BOX[1] down to its end, shot in a viewport as tall as the page ---
const contentH = docH - BOX[1];
const sTargetsContent = {};
for (const [k, v] of Object.entries(sTargets)) sTargetsContent[k] = [r1(v[0] - BOX[0]), r1(v[1] + 0 - BOX[1])];
await page.setViewportSize({ width: 1470, height: docH });
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: tmp('scroll.png'), clip: { x: BOX[0], y: BOX[1], width: BOX[2], height: contentH } });
await page.setViewportSize({ width: 1470, height: 837 });
await page.waitForTimeout(800);
// real scrolled viewports for the proof
const maxS = docH - 837;
const proofs = [Math.round(maxS / 2), maxS];
const real = {};
for (const s of proofs) {
  await page.evaluate((s) => window.scrollTo(0, s), s);
  await page.waitForTimeout(700);
  const y = await page.evaluate(() => window.scrollY);
  if (y !== s) throw new Error(`scrolled to ${y}, wanted ${s}`);
  await page.screenshot({ path: tmp(`real-${s}.png`), clip: { x: 0, y: 0, width: 1470, height: 837 } });
  real[s] = tmp(`real-${s}.png`);
}
execFileSync('cwebp', ['-q', '80', '-m', '6', tmp('scroll.png'), '-o', join(OUT, 'search.scroll.webp')], { stdio: 'ignore' });
const proofLog = [];
for (const s of proofs) {
  // composite: the scroll-0 page with rows [s, s+box.h] of the scroll image laid over the box
  const comp = tmp(`comp-${s}.png`);
  const dec = tmp('scroll-dec.png');
  execFileSync('dwebp', [join(OUT, 'search.scroll.webp'), '-o', dec], { stdio: 'ignore' });
  const pg = tmp('search-dec.png');
  execFileSync('dwebp', [join(OUT, 'search.webp'), '-o', pg], { stdio: 'ignore' });
  execFileSync('magick', [pg, '(', dec, '-crop', `${BOX[2] * 2}x${BOX[3] * 2}+0+${s * 2}`, '+repage', ')', '-geometry', `+${BOX[0] * 2}+${BOX[1] * 2}`, '-composite', comp]);
  // compare the box region only, and the whole viewport
  const cmp = (a, b, geo) => { try { return execFileSync('magick', ['compare', '-metric', 'AE', '-fuzz', '4%', ...(geo ? ['(', a, '-crop', geo, '+repage', ')', '(', b, '-crop', geo, '+repage', ')'] : [a, b]), 'null:'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); } catch (e) { return (e.stderr || '').toString(); } };
  const geo = `${BOX[2] * 2}x${BOX[3] * 2}+${BOX[0] * 2}+${BOX[1] * 2}`;
  proofLog.push({ scroll: s, boxDiffPx: cmp(comp, real[s], geo).trim(), viewportDiffPx: cmp(comp, real[s]).trim(), of: '2940x1674 / box ' + BOX[2] * 2 + 'x' + BOX[3] * 2 });
  execFileSync('cp', [comp, join(root, '..', '.tmp', `play-bike-search-comp-${s}.png`)]).toString();
}
console.log('scroll proof', JSON.stringify(proofLog));
for (const f of [tmp('scroll.png'), tmp('search0.png'), ...Object.values(real)]) rmSync(f, { force: true });

pages.search = {
  img: 'search.webp', title: sTitle, host: sUrl.host.replace(/^www\./, ''), path: sUrl.pathname + sUrl.search,
  fav: '../../screens/fav/craigslist.png',
  targets: Object.fromEntries(Object.entries(sTargets).map(([k, v]) => [k, [r1(v[0]), r1(v[1])]])),
  scroll: { box: BOX, img: 'search.scroll.webp', height: contentH, targets: sTargetsContent },
  field: null,
};

// ============================== 2./3. listing + reply ==============================
async function openPosting() {
  for (const url of POSTING_CANDIDATES) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const ok = await page.evaluate(() => !!document.querySelector('.reply-button') && !!document.querySelector('figure.oneimage') && !document.querySelector('.thumb') && /\(oakland/.test(document.querySelector('.postingtitletext')?.textContent || ''));
    if (ok) return url;
  }
  // fall back: look for another single-photo Oakland Rockridge posting
  await page.goto('https://sfbay.craigslist.org/search/eby/bia?query=bike&max_price=800#search=2~list~0', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.cl-search-result .posting-title', { timeout: 30000 });
  await page.waitForTimeout(1500);
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('.cl-search-result')].filter((r) => /rockridge/i.test(r.querySelector('.result-location')?.textContent || '')).map((r) => r.querySelector('a.posting-title').href));
  for (const url of hrefs) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const ok = await page.evaluate(() => !!document.querySelector('.reply-button') && !!document.querySelector('figure.oneimage') && !document.querySelector('.thumb'));
    if (ok) return url;
  }
  throw new Error('no single-photo Oakland posting found');
}
const sourceUrl = await openPosting();
const photoUrl = 'data:image/webp;base64,' + readFileSync(join(root, 'chats', 'bike-listing.webp')).toString('base64');

await page.evaluate(([L, photo]) => {
  const fullTitle = `${L.title} - bicycles - by owner - bike sale - craigslist`;
  const fakeUrl = 'https://www.craigslist.org/view/d/' + L.slug;
  document.title = fullTitle;
  const setMeta = (sel, attr, v) => document.querySelectorAll(sel).forEach((m) => m.setAttribute(attr, v));
  setMeta('meta[property="og:title"]', 'content', fullTitle);
  setMeta('meta[property="og:description"], meta[name="description"]', 'content', L.body[0]);
  setMeta('meta[property="og:url"], link[rel="canonical"], link[rel="alternate"]', document.querySelector('link[rel=canonical]') ? 'href' : 'content', fakeUrl);
  setMeta('meta[property="og:url"]', 'content', fakeUrl);
  document.querySelectorAll('meta[property="og:image"]').forEach((m) => m.remove());
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
  // headline: the real markup is  <span id=titletextonly> - <span class=price> <span>(place)</span>
  document.getElementById('titletextonly').textContent = L.title;
  document.querySelector('.postingtitletext .price').textContent = L.price;
  const place = document.querySelector('.postingtitletext > span:last-child');
  if (place) place.textContent = ' ' + L.place;
  // dates: posted today, and the "updated" line (not shown for a fresh posting) removed
  document.querySelectorAll('time.timeago').forEach((t) => { t.textContent = L.posted.text; t.setAttribute('datetime', L.posted.datetime); t.setAttribute('title', L.posted.title); });
  [...document.querySelectorAll('.postinginfos .postinginfo')].forEach((p) => {
    if (/^\s*updated:/.test(p.textContent)) p.remove();
    else if (/^\s*post id:/.test(p.textContent)) p.textContent = 'post id: ' + L.postId;
  });
  // body text
  const body = document.getElementById('postingbody');
  [...body.childNodes].forEach((n) => { if (!(n.nodeType === 1 && n.classList.contains('print-information'))) n.remove(); });
  L.body.forEach((para, i) => { if (i) { body.appendChild(document.createElement('br')); body.appendChild(document.createElement('br')); } body.appendChild(document.createTextNode(para)); });
  body.appendChild(document.createElement('br'));
  const qr = body.querySelector('.print-qrcode'); if (qr) qr.setAttribute('data-location', fakeUrl);
  // attributes: type road, frame size 56cm, wheel 700c, material aluminum (make/model dropped)
  const grp = document.querySelector('.attrgroup');
  grp.querySelectorAll('.attr.sale_manufacturer, .attr.sale_model').forEach((a) => a.remove());
  const wheel = grp.querySelector('.attr.bicycle_wheel_size .valu a'); if (wheel) wheel.textContent = '700c';
  const size = document.createElement('div'); size.className = 'attr bicycle_frame_size';
  size.innerHTML = '<span class="labl">frame size:</span>\n<span class="valu">56cm</span>';
  grp.querySelector('.attr.bicycle_type').after(size);
  // photo: swap the one image (single-photo posting, so no thumbnails)
  const img = document.querySelector('figure.oneimage .slide img');
  img.removeAttribute('srcset'); img.src = photo; img.alt = L.title + ' 1';
  // keep the page from linking back to the real posting
  document.querySelectorAll('a[href*="5ensNTVuXakgyVXERs27DD"], a.prev, a.next').forEach((a) => a.setAttribute('href', '#'));
  document.querySelector('#sharebutton-container a')?.setAttribute('href', '#share');
  document.activeElement?.blur?.();
  window.scrollTo(0, 0);
}, [LISTING, photoUrl]);
await page.waitForFunction(() => { const i = document.querySelector('figure.oneimage .slide img'); return i && i.complete && i.naturalWidth > 0; });
await page.waitForTimeout(800);

const lTitle = await page.title();
const lUrl = new URL('https://www.craigslist.org/view/d/' + LISTING.slug);
const replyBtn = await rect('.reply-button');
const photoR = await rect('figure.oneimage .slide img');
await page.screenshot({ path: tmp('listing.png'), clip: { x: 0, y: 0, width: 1470, height: 837 } });
toWebp(tmp('listing.png'), join(OUT, 'listing.webp'));
const hasMap = await page.evaluate(() => document.querySelectorAll('#map .leaflet-tile-loaded').length);
if (!hasMap) throw new Error('map tiles missing');
pages.listing = {
  img: 'listing.webp', title: lTitle, host: lUrl.host.replace(/^www\./, ''), path: lUrl.pathname + lUrl.search,
  fav: '../../screens/fav/craigslist.png',
  targets: { reply: centre(replyBtn), photo: centre(photoR) }, scroll: null, field: null,
};

// reply: press the site's own reply button (its panel lists email / chat; nothing is chosen or sent)
await page.click('.reply-button');
// the panel is the site's own .cl-reply-flap: its option list (email / chat). Craigslist sometimes puts an hCaptcha first
// (risk based); that is never solved, the run just stops and says so.
await page.waitForFunction(() => {
  const f = document.querySelector('.cl-reply-flap');
  return !!f && ([...f.querySelectorAll('*')].some((e) => /^\s*email\s*$/i.test(e.textContent) && e.getBoundingClientRect().width > 0) ||
    [...document.querySelectorAll('iframe[src*="hcaptcha"]')].some((i) => i.style.display !== 'none' || i.getBoundingClientRect().width > 50));
}, null, { timeout: 25000 });
await page.waitForTimeout(1200);
const panel = await page.evaluate(() => document.querySelector('.cl-reply-flap').innerText);
console.log('reply panel text:', JSON.stringify(panel));
if (/@|\d{3}[-. ]\d{3}/i.test(panel)) throw new Error('reply panel shows contact info');
if (!/email/i.test(panel)) { await page.screenshot({ path: join(root, '..', '.tmp', 'play-bike-reply-captcha.png') }); throw new Error('reply forced a captcha (not solved); see .tmp/play-bike-reply-captcha.png'); }
await page.evaluate(() => { document.activeElement?.blur?.(); });
const emailR = await page.evaluate(() => {
  const el = [...document.querySelectorAll('.cl-reply-flap *')].filter((e) => /^\s*email\s*$/i.test(e.textContent) || /^\s*email\s*$/i.test(e.getAttribute('title') || ''));
  // the option's whole row: the widest element whose text is only "email"
  const row = el.filter((e) => e.closest('.cl-reply-flap')).sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  const r = row.getBoundingClientRect(); return [r.x, r.y, r.width, r.height];
});
await page.screenshot({ path: tmp('reply.png'), clip: { x: 0, y: 0, width: 1470, height: 837 } });
toWebp(tmp('reply.png'), join(OUT, 'reply.webp'));
const shotText = await page.evaluate(() => document.body.innerText + document.documentElement.outerHTML.length);
pages.reply = {
  img: 'reply.webp', title: lTitle, host: lUrl.host.replace(/^www\./, ''), path: lUrl.pathname + lUrl.search,
  fav: '../../screens/fav/craigslist.png',
  targets: { email: centre(emailR) }, scroll: null, field: null,
};
console.log('source posting restaged:', sourceUrl);

writeFileSync(join(OUT, 'pages.json'), JSON.stringify({ chat: 'bike', pages }, null, 2) + '\n');
console.log(JSON.stringify(pages, null, 1));
await browser.close();
