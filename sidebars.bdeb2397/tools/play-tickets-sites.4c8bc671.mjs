// Live-run captures for the "tickets" chat, second batch: the same made-up show on three more REAL resale sites
// (the "Checked 4 resale sites" Activity line). The Vivid Seats payment step (Step 2 of 2) is NOT captured: it only
// exists after "Continue as a Guest" POSTs the email and the site creates a hold, which this tool never does.
// Same real event as play-tickets.8889b4ff.mjs (Teddy Swims, Nov 14 2026), staged by DOM edits only (text, attributes,
// the site's own price-display/price strings, removing pop-ups). SeatGeek / StubHub / TickPick / viagogo answer headless with a
// bot wall (DataDome / Cloudflare), so the three that load are used: Gametime, TicketSmarter, TicketNetwork.
// Headless, public. Nothing is bought, held, sent or saved: every non-GET to an order/checkout/payment/account endpoint is aborted,
// no email is submitted and no checkout/payment button is pressed.
//   node sidebars.bdeb2397/tools/play-tickets-sites.4c8bc671.mjs [site ...]      (sites: gametime ticketsmarter ticketnetwork; default all)
// Output: plays/tickets/{site-gametime,site-ticketsmarter,site-ticketnetwork}.webp (2940x1674) + fav-*.png
//         + pages.sites.json (merged with an earlier run). CREDITS.sites.txt is written by hand.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('/Users/adrianagne/Documents/cosmos/projects/superbot-roblox-thumbnails/');
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'plays', 'tickets');
const TMP = path.join(tmpdir(), 'play-tickets-sites');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true });
const WANT = process.argv.slice(2);
const want = (s) => !WANT.length || WANT.includes(s);

const PAGES_FILE = path.join(OUT, 'pages.sites.json');
const pages = existsSync(PAGES_FILE) ? JSON.parse(readFileSync(PAGES_FILE, 'utf8')).pages : {};
const rec = (id, o) => { pages[id] = { img: id + '.webp', title: o.title, host: o.host, path: o.path, fav: o.fav, targets: o.targets, scroll: null, field: o.field ?? null }; };
const rnd1 = (n) => Math.round(n * 10) / 10;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA });
const blockedAll = [];

async function newPage(guard) {
  const page = await ctx.newPage();
  const blocked = [];
  await page.route('**/*', (route) => {
    const r = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method()) && guard.test(r.url())) { blocked.push(r.method() + ' ' + r.url()); blockedAll.push(r.method() + ' ' + r.url()); return route.abort(); }
    route.continue();
  });
  page.blocked = blocked;
  return page;
}
async function shot(page, name, wait = 1200, pre = null) {
  await page.mouse.move(1000, 836);
  await page.waitForTimeout(wait);
  if (pre) await page.evaluate(pre); // last touch right before the pixels are taken (apps that re-render a node)
  const png = path.join(TMP, name + '.png');
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 1470, height: 837 } });
  execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', path.join(OUT, name + '.webp')], { stdio: 'ignore' });
  console.log('wrote', name);
}
const centre = (page, sel, nth = 0) => page.evaluate(([s, n]) => { const e = document.querySelectorAll(s)[n]; if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10]; }, [sel, nth]);
async function favicon(page, url, name) {
  const res = await page.request.get(url);
  if (!res.ok()) throw new Error('favicon ' + url + ' -> ' + res.status());
  const raw = path.join(TMP, name + '.raw');
  writeFileSync(raw, await res.body());
  // always re-encode to a 48px PNG (sips reads png/ico/svg-less raster)
  execFileSync('sips', ['-s', 'format', 'png', '-Z', '48', raw, '--out', path.join(OUT, name + '.png')], { stdio: 'ignore' });
  console.log('wrote', name + '.png');
}

// text replacement shared by every site (text nodes + aria-label/title/alt/placeholder), run inside the page
const TEXT_SUBS = `
const SUBS = [
  [/Teddy Swims with Freak Freely/g, 'Neon Harbor'], [/Teddy Swims/gi, (m) => (m === m.toUpperCase() ? 'NEON HARBOR' : 'Neon Harbor')],
  [/T-Mobile Arena/gi, (m) => (m === m.toUpperCase() ? 'RIVERSIDE ARENA' : 'Riverside Arena')],
  [/3780[\\s\\u00a0]+Las Vegas[\\s\\u00a0]+Blvd\\.?[\\s\\u00a0]+South,[\\s\\u00a0]+Las Vegas,?[\\s\\u00a0]+NV/g, '1200 NE Riverside Dr, Portland, OR 97232'],
  [/Las Vegas, Nevada/g, 'Portland, Oregon'], [/Las Vegas, NV/g, 'Portland, OR'], [/Las Vegas/gi, (m) => (m === m.toUpperCase() ? 'PORTLAND' : 'Portland')],
  [/\\bNV\\b/g, 'OR'], [/Nevada/g, 'Oregon'],
  [/3780[\\s\\u00a0]+Portland[\\s\\u00a0]+Blvd\\.?[\\s\\u00a0]+South,[\\s\\u00a0]+Portland,?[\\s\\u00a0]+OR/g, '1200 NE Riverside Dr, Portland, OR 97232'],
  [/7:00([\\s\\u00a0]?)(PM|pm)/g, '7:30$1$2'],
];
const sub = (s) => SUBS.reduce((a, [re, to]) => a.replace(re, to), s);
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
for (let n = walker.nextNode(); n; n = walker.nextNode()) { const t = sub(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; }
document.querySelectorAll('[aria-label],[title],[alt],[placeholder],[data-title]').forEach((e) => {
  for (const a of ['aria-label', 'title', 'alt', 'placeholder']) { const v = e.getAttribute(a); if (v && sub(v) !== v) e.setAttribute(a, sub(v)); }
});
document.title = sub(document.title);
`;
const withSubs = (body) => new Function('arg', TEXT_SUBS + body);
const leftovers = (page) => page.evaluate(() => {
  const hits = []; const re = /Teddy|Swims|T-Mobile|Vegas|Nevada|Freak/i;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) if (re.test(n.nodeValue)) hits.push('text:' + n.nodeValue.trim().slice(0, 60));
  document.querySelectorAll('[aria-label],[alt],[title]').forEach((e) => { for (const a of ['aria-label', 'alt', 'title']) { const v = e.getAttribute(a); if (v && re.test(v)) hits.push(a + ':' + v.slice(0, 60)); } });
  if (re.test(document.title)) hits.push('title:' + document.title);
  return hits;
});
// a flat navy block in place of the artist photo: the real photo is of a real person
const FLAT = 'linear-gradient(135deg,#14143c 0%,#14143c 55%,#c93a9a 100%)';

// ---------------------------------------------------------------- Gametime
async function gametime() {
  const URL0 = 'https://gametime.co/concert/teddy-swims-tickets/11-14-2026-las-vegas-nv-t-mobile-arena/events/69e17124eb91be296b0521a2?quantity=2';
  const page = await newPage(/gametime\.co\/(v\d+\/)?(api|checkout|cart|order|purchase|auth|user|account|login|signup)|\/graphql/);
  await page.goto(URL0, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('a[data-testid^="listing-card-"]', { timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.getByText("No thanks, I'll pay full price").click({ timeout: 8000 }).catch(() => console.log('gametime: no email pop-up'));
  await page.waitForTimeout(1500);
  await page.evaluate(() => { document.querySelector('[data-testid=listing-card-0]')?.scrollIntoView(); window.scrollTo(0, 0); document.querySelectorAll('._inventory-viewport_1k6ro_40').forEach((e) => (e.scrollTop = 0)); });
  const STAGE = withSubs(`
    // prices: one monotone map, so the real ordering (cheapest first) is kept and the cheapest pair becomes $246
    const f = (x) => Math.round(x < 47 ? 246 : 246 + (x - 47) * 0.5);
    const base = window.__gtBase ??= (() => { const c = [...document.querySelectorAll('a[data-testid^="listing-card-"] price-display')].map((e) => +e.getAttribute('cents') / 100).filter(Boolean); return Math.min(...c); })();
    const g = (x) => Math.round(246 + (x - base) * 0.5);
    document.querySelectorAll('price-display').forEach((e) => { const o = e.dataset.orig ?? (e.dataset.orig = e.getAttribute('cents')); e.setAttribute('cents', String(g(+o / 100) * 100)); });
    const pinRe = /^\\$(\\d+)$/;
    for (const e of document.querySelectorAll('span')) if (e.children.length === 0) { const o = e.dataset.orig ?? (pinRe.test(e.textContent.trim()) ? e.textContent.trim() : null); if (o) { e.dataset.orig = o; e.textContent = '$' + g(+pinRe.exec(o)[1]); } }
    // the <time> elements format themselves from their timestamp: move it to 7:30 PM Pacific (03:30Z) so the app's own text says 7:30 PM
    document.querySelectorAll('time[data-date-timestamp="2026-11-15T03:00:00.000Z"]').forEach((t) => { t.setAttribute('data-date-timestamp', '2026-11-15T03:30:00.000Z'); t.setAttribute('datetime', '2026-11-15T03:30:00.000Z'); t.textContent = t.textContent.replace('7:00', '7:30'); });
    // promo box (email for $20 off)
    const promo = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Get \\$20 off your first order/.test(e.textContent));
    if (promo) { let n = promo; while (n.parentElement && !/Top Deals on Gametime/.test(n.parentElement.innerText)) n = n.parentElement; n.remove(); }
    // artist photo in the header
    document.querySelectorAll('header img, [class*=header] img').forEach((im) => { const r = im.getBoundingClientRect(); if (r.x < 140 && r.y < 90 && r.width < 80) { im.removeAttribute('srcset'); im.setAttribute('alt', ''); im.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; im.style.background = ${JSON.stringify(FLAT)}; im.style.borderRadius = '6px'; } });
    return { base };
  `);
  let info = await page.evaluate(STAGE);
  console.log('gametime stage', JSON.stringify(info));
  await page.waitForTimeout(2500);
  info = await page.evaluate(STAGE);
  await page.waitForTimeout(500);
  console.log('gametime leftovers', JSON.stringify(await leftovers(page)));
  const mins = await page.evaluate(() => [...document.querySelectorAll('a[data-testid^="listing-card-"]')].map((a) => a.innerText.replace(/\n+/g, ' | ')).slice(6, 12));
  console.log('gametime rows', JSON.stringify(mins));
  // targets: the cheapest listing (the "Cheapest" tagged row of the main list) and its price
  const tg = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a[data-testid^="listing-card-"]')].find((x) => /Cheapest/i.test(x.innerText));
    const r = a.getBoundingClientRect(), p = a.querySelector('price-display').getBoundingClientRect();
    return { row1: [r.x + r.width / 2, r.y + r.height / 2], price1: [p.x + p.width / 2, p.y + p.height / 2], priceText: a.querySelector('price-display').shadowRoot?.textContent ?? a.querySelector('[data-testid=listing-card-current-price]').innerText };
  });
  console.log('gametime targets', JSON.stringify(tg));
  await favicon(page, 'https://assets.gametime.co/favicon/favicon_9388a924d3b2b9da814f.png?width=48', 'fav-gametime');
  await shot(page, 'site-gametime');
  const title = await page.title();
  rec('site-gametime', { title, host: 'gametime.co', path: '/concert/neon-harbor-tickets/11-14-2026-portland-or-riverside-arena/events/69e17124eb91be296b0521a2?quantity=2', fav: 'fav-gametime.png', targets: { price1: tg.price1.map(rnd1), row1: tg.row1.map(rnd1) } });
  await page.close();
}

// ---------------------------------------------------------------- Seatics sites (TicketSmarter, TicketNetwork): same engine, different skins
async function seatics(id, url, o) {
  const page = await newPage(/(ticketsmarter|ticketnetwork|seatics|tnwebservices)[^/]*\/(.*\/)?(api|checkout|cart|order|purchase|account|login|signup|basket|payment)/i);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#sea-quantity-modal', { timeout: 40000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => { document.querySelectorAll('#onetrust-consent-sdk,#onetrust-banner-sdk,.onetrust-pc-dark-filter').forEach((e) => e.remove()); });
  await page.locator('#sea-quantity-modal label:has(input[value="2"])').click();
  await page.waitForTimeout(4000);
  await page.evaluate(() => { document.querySelectorAll('#sea-quantity-modal').forEach((e) => (e.style.display = 'none')); });
  // the site's own "Inventory is limited" nudge (TicketNetwork): dismiss it with its own button, client-side only
  const nudge = page.getByRole('button', { name: 'View Tickets' });
  if (await nudge.isVisible().catch(() => false)) { await nudge.click(); console.log(id, 'dismissed the inventory nudge'); await page.waitForTimeout(1500); }
  // cookie banner / consent / chat widgets
  await page.evaluate(() => { document.querySelectorAll('#onetrust-consent-sdk,#onetrust-banner-sdk,.onetrust-pc-dark-filter,[id*=cookie i],[class*=cookie-banner i],[id*=chat i][class*=widget i]').forEach((e) => e.remove()); document.body.style.overflow = ''; });
  const STAGE = withSubs(`
    const o = arg;
    const money = /(US)?\\$(\\d[\\d,]*)(\\/ea)?/;
    const rows = [...document.querySelectorAll('${o.rowSel}')];
    const priceOf = (r) => { const m = /\\$(\\d[\\d,]*)/.exec(r.querySelector('${o.priceSel}')?.textContent ?? ''); return m ? +m[1].replace(/,/g, '') : null; };
    const base = window.__sBase ??= Math.min(...rows.map(priceOf).filter(Boolean));
    const g = (x) => Math.round(o.first + (x - base) * 0.55);
    for (const e of document.querySelectorAll('${o.rowSel} *, .venue-ticket-list-tbl *, [class*=ticket-list] *, [class*=listing] *')) {
      if (e.children.length) continue;
      if (e.dataset.orig === undefined && /\\$\\d/.test(e.textContent)) e.dataset.orig = e.textContent;
      if (e.dataset.orig !== undefined) e.textContent = e.dataset.orig.replace(/\\$(\\d[\\d,]*)/g, (m, d) => '$' + g(+d.replace(/,/g, '')));
    }
    ${o.extra || ''}
    // breadcrumb: the last crumb repeats the artist once the long event name is replaced
    const crumbs = [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && /^Neon Harbor Tickets$/.test(e.textContent.trim()) && e.getBoundingClientRect().y < 200);
    if (crumbs.length > 1) crumbs[crumbs.length - 1].textContent = 'Neon Harbor in Portland Tickets';
    return { rows: rows.length, base };
  `);
  const info = await page.evaluate(STAGE, o);
  console.log(id, 'stage', JSON.stringify(info));
  await page.waitForTimeout(2500);
  await page.evaluate(STAGE, o);
  console.log(id, 'leftovers', JSON.stringify(await leftovers(page)));
  console.log(id, 'rows', JSON.stringify(await page.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0, 4).map((r) => r.innerText.replace(/\s+/g, ' ').slice(0, 90)), o.rowSel)));
  // targets: the first row that is actually on screen (the DOM also holds hidden copies of the list) and its visible price
  const tg = await page.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 20 && r.height > 10 && r.y >= 0 && r.y < 837 && r.x > 700; };
    const price = [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && /^(US)?\$\d+/.test(e.textContent.trim()) && vis(e))[0];
    if (!price) throw new Error('no visible price');
    let row = price; while (row.parentElement && !(row.getBoundingClientRect().height >= 60 && row.getBoundingClientRect().height <= 220 && row.getBoundingClientRect().width > 300)) row = row.parentElement;
    const r = row.getBoundingClientRect(), p = price.getBoundingClientRect();
    return { row1: [r.x + r.width / 2, r.y + r.height / 2], price1: [p.x + p.width / 2, p.y + p.height / 2], priceText: price.textContent.trim(), rowText: row.innerText.replace(/\s+/g, ' ').slice(0, 80) };
  });
  console.log(id, 'targets', JSON.stringify(tg));
  await favicon(page, o.favUrl, o.fav);
  await shot(page, id);
  rec(id, { title: await page.title(), host: o.host, path: o.path, fav: o.fav + '.png', targets: { price1: tg.price1.map(rnd1), row1: tg.row1.map(rnd1) } });
  await page.close();
}

if (want('gametime')) await gametime().catch((e) => { console.error(e.stack); throw e; });
if (want('ticketsmarter')) {
  await seatics('site-ticketsmarter', 'https://www.ticketsmarter.com/e/teddy-swims-with-freak-freely-tickets-las-vegas-11-14-2026-t-mobile-arena/3361089', {
    first: 251, rowSel: '.venue-ticket-list-tbl', priceSel: '.venue-ticket-list-cta-amt', host: 'ticketsmarter.com',
    path: '/e/neon-harbor-tickets-portland-11-14-2026-riverside-arena/3361089', fav: 'fav-ticketsmarter',
    favUrl: 'https://www.ticketsmarter.com/content/uploaded/TicketSmarter-512x512.png',
  }).catch((e) => { console.error(e.stack); throw e; });
}
if (want('ticketnetwork')) {
  await seatics('site-ticketnetwork', 'https://www.ticketnetwork.com/tickets/7883124/teddy-swims-tickets-sat-nov-14-2026-t-mobile-arena', {
    first: 262, rowSel: '.venue-ticket-list-tbl', priceSel: '.venue-ticket-list-cta-amt', host: 'ticketnetwork.com',
    path: '/tickets/7883124/neon-harbor-tickets-sat-nov-14-2026-riverside-arena', fav: 'fav-ticketnetwork',
    favUrl: 'https://www.ticketnetwork.com/icons/ticketnetwork/apple-icon-192x192.png',
  }).catch((e) => { console.error(e.stack); throw e; });
}

console.log('BLOCKED non-GETs:', blockedAll.length, blockedAll.slice(0, 5));
await browser.close();
writeFileSync(PAGES_FILE, JSON.stringify({ chat: 'tickets', pages }, null, 1));
console.log('pages.sites.json written');
