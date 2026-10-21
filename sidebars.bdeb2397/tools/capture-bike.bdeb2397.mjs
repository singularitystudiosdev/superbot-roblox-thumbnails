// Capture a real Craigslist (SF Bay Area) bicycles results page, then stage the
// listing rows with the "bike" chat's made-up content and write
//   sidebars.bdeb2397/screens/bike.webp          (2940x1674, the 2x capture)
//   sidebars.bdeb2397/screens/fav/craigslist.png (32x32, Craigslist's real favicon)
// Headless chromium only. List view (no images) is used, so no stranger's photo
// is ever on the page. Run: node sidebars.bdeb2397/tools/capture-bike.bdeb2397.mjs
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const screens = resolve(here, '../screens');
const OUT_WEBP = join(screens, 'bike.webp');
const OUT_FAV = join(screens, 'fav', 'craigslist.png');
mkdirSync(join(screens, 'fav'), { recursive: true });

// `#search=2~list~0` is Craigslist's own hash for the plain list view mode.
const TARGET = 'https://sfbay.craigslist.org/search/bia?query=road%20bike%2056cm&max_price=600#search=2~list~0';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';

// [title, location, date, price]; the first row is the one superbot picks.
const STAGED = [
  ['Aluminum road bike 56cm, new chain + tires', 'oakland rockridge', 'just now', 540],
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
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1470, height: 837 },
  deviceScaleFactor: 2,
  locale: 'en-US',
  timezoneId: 'America/Los_Angeles',
  userAgent: UA,
});
const page = await ctx.newPage();
await page.goto(TARGET, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.cl-search-result .posting-title', { timeout: 30000 });
await page.waitForFunction(() => document.querySelectorAll('.cl-search-result').length >= 10, null, { timeout: 30000 });
await page.waitForTimeout(1500);
if (!(await page.evaluate(() => document.querySelector('main')?.className.includes('cl-search-view-mode-list')))) {
  throw new Error('Craigslist did not render the list view mode');
}

// --- stage the DOM ---
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
    const dateEl = meta && [...meta.children].filter((c) => c.tagName === 'SPAN' && c.className !== 'separator')[1]; // [location, date, price]
    if (dateEl) { dateEl.textContent = date; dateEl.setAttribute('title', date); }
    const p = el.querySelector('.priceinfo');
    if (p) p.textContent = '$' + price;
    el.querySelectorAll('img').forEach((im) => im.remove());
  });
  // remove anything that could reveal the capture machine / session
  document.querySelectorAll('[class*="banner"], [class*="cookie"], .cl-banner, #cl-top-banner').forEach((b) => b.remove());
  document.activeElement?.blur?.();
  window.scrollTo(0, 0);
}, STAGED);
await page.mouse.move(1200, 600);
await page.waitForTimeout(500);

// Safety: no listing image may be on the page.
const photos = await page.evaluate(() =>
  [...document.querySelectorAll('.cl-search-result img, .gallery-card img, .swipe img')].length);
if (photos) throw new Error(`${photos} listing images still on the page`);

const png = join(tmpdir(), 'bike-capture.png');
await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 1470, height: 837 } });
execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', OUT_WEBP], { stdio: 'ignore' });
rmSync(png, { force: true });
console.log('wrote', OUT_WEBP, '| title:', await page.title(), '| host:', new URL(page.url()).host);

// --- favicon (the real one, https://www.craigslist.org/favicon.ico, 32x32 entry) ---
const res = await ctx.request.get('https://www.craigslist.org/favicon.ico');
if (!res.ok()) throw new Error('favicon fetch ' + res.status());
const ico = join(tmpdir(), 'cl-fav.ico');
writeFileSync(ico, await res.body());
execFileSync('sips', ['-s', 'format', 'png', ico, '--out', OUT_FAV], { stdio: 'ignore' });
rmSync(ico, { force: true });
console.log('wrote', OUT_FAV);

await browser.close();
