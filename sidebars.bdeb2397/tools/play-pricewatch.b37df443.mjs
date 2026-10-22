// Live-run captures for the "pricewatch" chat, the steps the "tickets" captures start after: the REAL Vivid Seats home
// page, its search field focused, the search typed with the site's own suggestions open, and the event page as it first
// opens, asking how many tickets, and the same page once the pair bought is gone and the watch goes on. Staged by DOM edits only (the search is typed for the real show and restaged to Neon
// Harbor, the event page with stage-vividseats.b37df443.js, the artist's photos replaced by a flat navy block).
// Headless, public. Nothing is bought, held, signed into or submitted: every non-GET to a vividseats.com
// cart/checkout/order API is aborted, and the only thing typed is the search.
//   node sidebars.bdeb2397/tools/play-pricewatch.b37df443.mjs [event-url]
// Output: plays/pricewatch/{home,home-focus,home-typed,event-qty,event-159}.webp (2940x1674) + pages.json
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATES, STAGE, PREP } from './stage-vividseats.b37df443.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'plays', 'pricewatch');
const TMP = path.join(tmpdir(), 'play-pricewatch');
const HOME = 'https://www.vividseats.com/';
const BASE = process.argv[2] || 'https://www.vividseats.com/teddy-swims-tickets-las-vegas-t-mobile-arena-11-14-2026--concerts-rb/production/6912149';
const REAL_QUERY = 'Teddy Swims'; // typed for real, so the site draws its own suggestions for a touring act
const QUERY = 'Neon Harbor';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const SLUG = '/neon-harbor-tickets-portland-riverside-arena-11-14-2026--concerts-rb/production/6912149';
const TITLE = 'Neon Harbor Portland tickets - Riverside Arena - 11/14/2026 | Vivid Seats';
// the site's search field, found by its placeholder and then marked, since step 2 clears the placeholder
const SEARCH_BY = 'input[placeholder^="Search by"]';
const SEARCH = 'input[data-pricewatch-search]';
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true });

const day = (d, style) => new Date(Date.UTC(2026, 10, d)).toLocaleDateString('en-US', { weekday: style, timeZone: 'UTC' });
const WHEN = `${day(14, 'short')}, Nov 14 at 7:30pm`;
const WHEN_LONG = `${day(14, 'long')} November 14 at 7:30pm`;
// the tour's next three dates as the suggestions list them, the chat's show second
const TOUR = [
  { wd: day(12, 'short'), date: 'Nov 12', city: 'Seattle, WA', href: '/neon-harbor-tickets-seattle-climate-pledge-arena-11-12-2026--concerts-rb/production/6912147' },
  { wd: day(14, 'short'), date: 'Nov 14', city: 'Portland, OR', href: SLUG },
  { wd: day(16, 'short'), date: 'Nov 16', city: 'Sacramento, CA', href: '/neon-harbor-tickets-sacramento-golden-1-center-11-16-2026--concerts-rb/production/6912151' },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA });
await ctx.addInitScript(() => {
  const css = document.createElement('style');
  css.textContent = '.ab-iam-root,.ab-in-app-message,#onetrust-consent-sdk,[id*=cookie],[class*=CookieBanner]{display:none!important}';
  document.addEventListener('DOMContentLoaded', () => document.head.appendChild(css));
});
// the site's own location, the one it would detect for a visitor in Portland (it reads the visitor's IP otherwise), so the
// home page's top picks are Portland's and not the capture machine's city
await ctx.addCookies([{ name: 'user-location', value: encodeURIComponent(JSON.stringify({ latitude: 45.5152, longitude: -122.6784, countryCode: 'US', region: 'OR', city: 'Portland', countryName: 'United States', method: 'auto-detected' })), domain: 'www.vividseats.com', path: '/' }]);
const page = await ctx.newPage();
const blocked = [];
await page.route('**/*', (route) => {
  const r = route.request();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method()) && /vividseats\.com\/(hermes|api|checkout|cart|order|purchase)/.test(r.url())) { blocked.push(r.method() + ' ' + r.url()); return route.abort(); }
  route.continue();
});

async function shot(name, wait = 1500) {
  await page.mouse.move(1000, 828);
  await page.waitForTimeout(wait);
  const png = path.join(TMP, name + '.png');
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 1470, height: 837 } });
  execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', path.join(OUT, name + '.webp')], { stdio: 'ignore' });
  console.log('wrote', name);
}
const rect = (sel, nth = 0) => page.evaluate(([s, n]) => { const e = document.querySelectorAll(s)[n]; if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10]; }, [sel, nth]);
const must = async (sel, nth = 0) => { const r = await rect(sel, nth); if (!r) throw new Error(`nothing matches ${sel} [${nth}]`); return r; };
const pages = {};
const FAV = '../../screens/fav/tickets-site.png';
const rec = (id, o) => { pages[id] = { img: id + '.webp', title: o.title, host: 'vividseats.com', path: o.path, fav: FAV, targets: o.targets, scroll: null, field: o.field ?? null }; };

// ---------- 1: the home page ----------
await page.goto(HOME, { waitUntil: 'domcontentloaded', timeout: 45000 });
// the site's own browser check answers first, then the page loads in its place
await page.waitForSelector(SEARCH_BY, { timeout: 60000 });
await page.waitForTimeout(4000);
await page.evaluate((s) => document.querySelector(s).setAttribute('data-pricewatch-search', ''), SEARCH_BY);
const picks = await page.evaluate(() => document.querySelector('[data-testid=top-picks-title]')?.textContent);
console.log('home', picks);
if (!/Portland, OR/.test(picks)) throw new Error(`the home page picks for "${picks}", not Portland, OR`);
const homeTitle = await page.title();
const search = await must(SEARCH);
await shot('home');
rec('home', { title: homeTitle, path: '/', targets: { search } });

// ---------- 2: the search field focused, empty (its placeholder gone, as it goes with the first key) ----------
await page.locator(SEARCH).click();
await page.waitForTimeout(1200);
await page.evaluate((s) => { document.querySelector(s).placeholder = ''; }, SEARCH);
await shot('home-focus', 300);

// ---------- 3: the search typed, the site's suggestions open, restaged to the made-up show ----------
await page.locator(SEARCH).pressSequentially(REAL_QUERY, { delay: 90 });
await page.waitForSelector('[data-testid=search-suggestions-container] [data-testid^=production-suggestion-]', { timeout: 20000 });
await page.waitForTimeout(2500);
const STAGE_SEARCH = ({ sel, query, tour }) => {
  const inp = document.querySelector(sel);
  // no input event: the suggestions stay as the site drew them for the real query, and are restaged below
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, query);
  const box = document.querySelector('[data-testid=search-suggestions-container]');
  const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) if (/Teddy Swims/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/Teddy Swims/g, 'Neon Harbor');
  // the act's photo (a lazily set background): a flat block in the site's navy instead of a real person
  const photos = [...box.querySelectorAll('[data-testid^=performer-suggestion-] [data-testid=lazy-background-image]')];
  photos.forEach((e) => { e.style.backgroundImage = 'linear-gradient(135deg,#14143c 0%,#14143c 55%,#c93a9a 100%)'; });
  if (!photos.length) throw new Error('no performer photo found in the suggestions');
  const rows = [...box.querySelectorAll('[data-testid^=production-suggestion-]')];
  rows.forEach((row, i) => {
    const d = tour[i]; if (!d) { row.remove(); return; }
    const t = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
    for (let n = t.nextNode(); n; n = t.nextNode()) {
      const v = n.nodeValue;
      let to = v.replace(/^(\s*)(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(\s*)$/, `$1${d.wd}$3`)
        .replace(/^(\s*)(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}(\s*)$/, `$1${d.date}$3`)
        .replace(/\d{1,2}:\d{2}[ap]m/, '7:30pm')
        .replace(/[A-Z][A-Za-z .'-]+, [A-Z]{2}(\s*)$/, `${d.city}$1`);
      if (to !== v) n.nodeValue = to;
    }
    row.setAttribute('href', d.href);
  });
  const cs = getComputedStyle(inp), r = inp.getBoundingClientRect();
  const left = r.x + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft);
  const cv = document.createElement('canvas').getContext('2d');
  cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const stops = [...query].map((_, i) => Math.round((left + cv.measureText(query.slice(0, i + 1)).width) * 10) / 10);
  const h = parseFloat(cs.fontSize) * 1.3;
  return {
    field: { box: [Math.round(left * 10) / 10, Math.round((r.y + r.height / 2 - h / 2) * 10) / 10, Math.round(cv.measureText(query).width * 10) / 10, Math.round(h * 10) / 10], stops },
    rows: [...box.querySelectorAll('a')].map((a) => a.textContent.replace(/ShopIcon\S+/g, '').trim()),
  };
};
const staged = await page.evaluate(STAGE_SEARCH, { sel: SEARCH, query: QUERY, tour: TOUR });
console.log('suggestions', JSON.stringify(staged.rows));
if (!staged.rows.some((t) => /Nov 14.*Neon Harbor.*Portland, OR/.test(t))) throw new Error('the Portland date is not in the suggestions');
const suggest = await must('[data-testid=search-suggestions-container] [data-testid^=production-suggestion-]', 1);
await shot('home-typed', 300);
const value = await page.evaluate((s) => document.querySelector(s).value, SEARCH);
if (value !== QUERY) throw new Error(`the search field reads "${value}" at the shot`);
rec('home-focus', { title: homeTitle, path: '/', targets: {}, field: { ...staged.field, text: QUERY, filled: 'home-typed' } });
rec('home-typed', { title: homeTitle, path: '/', targets: { suggest } });

// ---------- 4: the event page as it opens, asking how many tickets ----------
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForSelector('[data-testid=listing-row-container]', { timeout: 60000 });
await page.waitForSelector('[data-testid=quantity-2-button]', { timeout: 30000 });
await page.waitForTimeout(4000);
await page.evaluate(PREP);
// before a quantity is picked the page lists every listing, more than the 2-ticket filter leaves (44 on event-238)
const QTY = { list: STATES['event-238'].list, count: 61, WHEN, WHEN_LONG, selected: null };
console.log('event-qty', (await page.evaluate(STAGE, QTY)).join(' | '));
await page.waitForTimeout(2500);
await page.evaluate(STAGE, QTY); // thumbnails/pins settled, re-assert
const qty2 = await must('[data-testid=quantity-2-button]');
await shot('event-qty', 500);
rec('event-qty', { title: TITLE, path: SLUG, targets: { qty2 } });

// ---------- 5: the event page once the pair bought is gone (Section 108, Row K), the watch going on: $159 the cheapest ----------
await page.goto(BASE + '?quantity=2', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForSelector('[data-testid=listing-row-container]', { timeout: 60000 });
await page.waitForTimeout(4000);
await page.evaluate(PREP);
const AFTER = { list: [...STATES['event-142'].list.slice(1), ['206', 'E', 497, '8.9', 'Great', '206', 'upper']], count: 45, WHEN, WHEN_LONG, selected: null };
console.log('event-159', (await page.evaluate(STAGE, AFTER)).join(' | '));
await page.waitForTimeout(2500);
await page.evaluate(STAGE, AFTER); // thumbnails/pins settled, re-assert
const after = { row1: await must('[data-testid=listing-row-container]'), price1: await must('[data-testid=listing-price]') };
await shot('event-159', 500);
rec('event-159', { title: TITLE, path: SLUG + '?quantity=2', targets: after });

console.log('BLOCKED non-GETs:', blocked.length, blocked.slice(0, 3));
await browser.close();
writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify({ chat: 'pricewatch', pages }, null, 1));
console.log('pages.json written');
