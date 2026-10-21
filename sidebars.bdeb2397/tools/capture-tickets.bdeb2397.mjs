// Captures a real Vivid Seats event page (headless, never clicks buy) and STAGES it by editing the DOM only, for the "tickets"
// chat in transcripts.bdeb2397.js: event "Neon Harbor" at "Riverside Arena", Sat, Nov 14, quantity 2, listings from the chat
// (Section 108 Row K $142 on top, Section 120 Row R $171, Section 214 Row C $238, plus plausible others).
// Output: screens/tickets.webp (2940x1674) and screens/fav/tickets-site.png (64px, the site's real favicon).
//   node sidebars.bdeb2397/tools/capture-tickets.bdeb2397.mjs [event-url]
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'screens', 'tickets.webp');
const FAV = path.join(ROOT, 'screens', 'fav', 'tickets-site.png');
const TMP = path.join(tmpdir(), 'capture-tickets');
const URL_ = process.argv[2] || 'https://www.vividseats.com/teddy-swims-tickets-las-vegas-t-mobile-arena-11-14-2026--concerts-rb/production/6912149';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// the weekday for the made-up date comes from the calendar, not from memory
const wd = new Date(Date.UTC(2026, 10, 14)).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
const WHEN = `${wd}, Nov 14 at 7:30pm`;

// the staged listings, cheapest first, as the site sorts them: [section, row, price, deal score, label, thumbnail section, zone]
const LISTINGS = [
  ['108', 'K', 142, '9.8', 'Excellent', '8', 'lower'],
  ['115', 'M', 159, '9.4', 'Excellent', '11', 'lower'],
  ['120', 'R', 171, '7.9', 'Very Good', '120', 'lower'],
  ['209', 'F', 204, '8.9', 'Great', '209', 'upper'],
  ['214', 'C', 238, '8.9', 'Great', '214', 'upper'],
  ['112', 'H', 249, '8.9', 'Great', '12', 'lower'],
];

mkdirSync(TMP, { recursive: true });
mkdirSync(path.dirname(OUT), { recursive: true });
mkdirSync(path.dirname(FAV), { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US',
  timezoneId: 'America/Los_Angeles', userAgent: UA,
});
// marketing pop-ups (Braze in-app message, cookie banners) are removed at load, before they can draw
await ctx.addInitScript(() => {
  const css = document.createElement('style');
  css.textContent = '.ab-iam-root,.ab-in-app-message,#onetrust-consent-sdk,[id*=cookie],[class*=CookieBanner]{display:none!important}';
  document.addEventListener('DOMContentLoaded', () => document.head.appendChild(css));
});
const page = await ctx.newPage();
await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 45000 });
// the site draws a blank "Loading" shell for ~15s in headless before the event page hydrates
await page.waitForSelector('[data-testid=listing-row-container]', { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);

// the site's own "How many tickets?" dialog: choose 2 (a filter, not a purchase)
const two = page.locator('[data-testid=quantity-2-button]');
if (await two.count()) await two.first().click({ timeout: 10000 }).catch(() => {});
await page.waitForTimeout(5000);
await page.waitForSelector('[data-testid=listing-row-container]', { timeout: 20000 });

// ---- favicon: the site's own icon, 64px PNG ----
if (!existsSync(FAV) || process.env.REFAV) {
  const href = await page.evaluate(() => {
    const links = [...document.querySelectorAll('link[rel*=icon]')].map((l) => ({ href: l.href, sizes: l.sizes?.value || '', rel: l.rel }));
    const best = links.find((l) => /apple/.test(l.rel)) || links.find((l) => /png/.test(l.href)) || links[0];
    return best?.href || new URL('/favicon.ico', location.href).href;
  });
  const res = await ctx.request.get(href);
  const raw = path.join(TMP, 'favicon-src' + (path.extname(new URL(href).pathname) || '.png'));
  writeFileSync(raw, await res.body());
  execFileSync('sips', ['-s', 'format', 'png', '-z', '64', '64', raw, '--out', FAV], { stdio: 'ignore' });
  console.log('favicon', href, '->', FAV);
}

// ---- stage the page: DOM edits only ----
const info = await page.evaluate(({ LISTINGS, WHEN }) => {
  const log = [];
  // text everywhere (nodes, titles, aria labels) that names the real show or venue
  const SUBS = [
    [/Teddy Swims/g, 'Neon Harbor'], [/T-Mobile Arena/g, 'Riverside Arena'], [/Las Vegas, NV/g, 'Portland, OR'],
    [/Las Vegas/g, 'Portland'], [/ALLEGIANT FLIGHT DECK/gi, 'NORTH DECK'], [/HYDE LOUNGE/gi, 'EAST LOUNGE'], [/\d+ fans shopping/g, '88 fans shopping'],
    [/(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \w{3} \d+ at [\d:]+[ap]m/g, WHEN],
  ];
  const sub = (s) => SUBS.reduce((a, [re, to]) => a.replace(re, to), s);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = sub(n.nodeValue);
    if (t !== n.nodeValue) n.nodeValue = t;
  }
  document.querySelectorAll('[aria-label],[title],[alt]').forEach((e) => {
    for (const a of ['aria-label', 'title', 'alt']) { const v = e.getAttribute(a); if (v && sub(v) !== v) e.setAttribute(a, sub(v)); }
  });
  document.title = `Neon Harbor Portland tickets - Riverside Arena - 11/14/2026 | Vivid Seats`;
  // the artist's photo beside the event name: a flat block in the site's navy instead of a real person
  // every image-like element stacked at the photo's spot (64px, left of the event name)
  const stack = document.elementsFromPoint(62, 192).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 30 && r.width < 140 && r.height < 140; });
  for (const im of stack) {
    im.removeAttribute('srcset'); im.removeAttribute('src');
    im.style.background = 'linear-gradient(135deg,#14143c 0%,#14143c 55%,#c93a9a 100%)';
    im.querySelectorAll('img,source').forEach((c) => c.remove());
  }
  log.push('photo x' + stack.length);
  // price filter, listing count
  for (const e of document.querySelectorAll('button,span,div')) {
    if (e.children.length === 0 && /^\$47 - \$488\+$/.test(e.textContent.trim())) e.textContent = '$142 - $488+';
    if (e.children.length === 0 && /^\d+ listings$/.test(e.textContent.trim())) e.textContent = '46 listings';
      }
  document.querySelectorAll('svg text, svg tspan').forEach((t) => { if (t.textContent.trim() === '8' && t.children.length === 0) { t.textContent = '108'; log.push('map 108'); } });
  // map price pins: nothing may undercut the staged cheapest pair
  document.querySelectorAll('[data-testid=map-tooltip-price]').forEach((e) => {
    const v = parseInt(e.textContent.replace(/\D/g, ''), 10);
    if (v) e.textContent = '$' + (v < 150 ? v + 100 : Math.round(v * 1.15));
  });
  // listing rows
  const zone = (name) => {
    const item = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === name);
    const dot = item?.parentElement?.querySelector('i,span:first-child,div:first-child');
    return dot ? getComputedStyle(dot).backgroundColor : null;
  };
  const colors = { lower: zone('Lower Level'), upper: zone('200 Level') };
  const rows = [...document.querySelectorAll('[data-testid=listing-row-container]')];
  LISTINGS.forEach(([sec, row, price, score, label, thumb, z], i) => {
    const c = rows[i]; if (!c) return;
    const r = c.querySelector('[data-listingid]');
    r.dataset.sectionid = sec; r.dataset.rowid = row; r.dataset.price = '$' + price; r.dataset.dealscore = score;
    if (colors[z]) r.style.borderLeft = '6px solid ' + colors[z];
    const sectionEl = c.querySelector('[data-testid^="Section "]');
    sectionEl.textContent = 'Section ' + sec; sectionEl.setAttribute('data-testid', 'Section ' + sec);
    const rowEl = c.querySelector('[data-testid=row]'); rowEl.textContent = ' Row ' + row;
    const info = rowEl.parentElement;
    for (const n of info.childNodes) if (n.nodeType === 3 && /ticket/.test(n.nodeValue)) n.nodeValue = ' 2 tickets ';
    c.querySelectorAll('[data-testid=badge-URGENCY]').forEach((b) => b.closest('[class*=brokerSale]')?.remove());
    const sv = c.querySelector('[data-testid=deal-score-value]'), sl = c.querySelector('[data-testid=deal-score-label]');
    if (sv) sv.textContent = score; if (sl) sl.textContent = label;
    const dp = c.querySelector('[data-testid=discount-price]'); if (dp) dp.textContent = '$' + price;
    const lp = c.querySelector('[data-testid=listing-price]'); if (lp) lp.textContent = '$' + price;
    const img = c.querySelector('img[data-testid="3ddv-static-thumbnail"]');
    if (img) {
      const u = img.src.replace(/Section\d+_\d+\.jpeg/, `Section${thumb}_${thumb}.jpeg`);
      img.removeAttribute('srcset'); img.src = u;
    }
  });
  log.push('rows ' + rows.length);
  return log;
}, { LISTINGS, WHEN });
console.log('staged:', info.join(', '));
await page.mouse.move(1000, 820);
await page.waitForTimeout(2500); // thumbnails, map pins settle
// nothing else may be on top of the page
const blockers = await page.evaluate(() => [...document.querySelectorAll('[role=dialog],.ab-iam-root,[aria-modal=true]')].map((e) => e.className || e.tagName));
if (blockers.length) console.log('WARNING dialogs still present:', blockers);

const png = path.join(TMP, 'tickets.png');
await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 1470, height: 837 } });
execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', OUT], { stdio: 'ignore' });
console.log('wrote', OUT, 'title:', await page.title());
await browser.close();
