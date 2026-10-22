// Live-run captures for the "tickets" chat: the REAL Vivid Seats event page (same site, same page as capture-tickets.bdeb2397.mjs),
// staged by DOM edits only, in the three states of the storyboard, then the listing detail panel and the checkout page it really opens.
// Headless, public. Nothing is bought, held or submitted: every non-GET to a vividseats.com cart/checkout/order API is aborted
// (the site only POSTs price quotes there), the "Checkout" link is only navigated to (that page is the guest/sign-in gate), no form is submitted.
//   node sidebars.bdeb2397/tools/play-tickets.8889b4ff.mjs [event-url]
// Output: plays/tickets/{event-238,event-171,event-142,listing-108,checkout,checkout-filled}.webp (2940x1674) + pages.json + CREDITS.txt
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATES, STAGE, PREP } from './stage-vividseats.b37df443.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'plays', 'tickets');
const TMP = path.join(tmpdir(), 'play-tickets');
const BASE = process.argv[2] || 'https://www.vividseats.com/teddy-swims-tickets-las-vegas-t-mobile-arena-11-14-2026--concerts-rb/production/6912149';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const SLUG = '/neon-harbor-tickets-portland-riverside-arena-11-14-2026--concerts-rb/production/6912149';
const TITLE = 'Neon Harbor Portland tickets - Riverside Arena - 11/14/2026 | Vivid Seats';
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true });

const wd = new Date(Date.UTC(2026, 10, 14)).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
const WHEN = `${wd}, Nov 14 at 7:30pm`;
const WHEN_LONG = `${new Date(Date.UTC(2026, 10, 14)).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })} November 14 at 7:30pm`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA });
await ctx.addInitScript(() => {
  const css = document.createElement('style');
  css.textContent = '.ab-iam-root,.ab-in-app-message,#onetrust-consent-sdk,[id*=cookie],[class*=CookieBanner]{display:none!important}';
  document.addEventListener('DOMContentLoaded', () => document.head.appendChild(css));
});
const page = await ctx.newPage();
const blocked = [];
await page.route('**/*', (route) => {
  const r = route.request();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method()) && /vividseats\.com\/(hermes|api|checkout|cart|order|purchase)/.test(r.url())) { blocked.push(r.method() + ' ' + r.url()); return route.abort(); }
  route.continue();
});

const SELPREP = () => {
  const svg = document.querySelector('svg.original-map');
  const ps = [...svg.querySelectorAll('path[data-svg-section-id]')].filter((x) => x.getAttribute('data-svg-section-id'));
  const p = ps.find((x) => { const c = getComputedStyle(x); return parseFloat(c.strokeWidth) > 0.5 || /select|active|highlight/i.test(x.getAttribute('class') || ''); });
  if (!p) return { none: true, sample: ps.slice(0, 2).map((x) => x.outerHTML.replace(/ (d|path)="[^"]*"/g, '')) };
  const attrs = {}; for (const a of p.attributes) if (!['d', 'path', 'transform', 'id', 'data-svg-section-id', 'data-testid', 'data-for', 'style'].includes(a.name)) attrs[a.name] = a.value;
  const base = ps.find((x) => x !== p);
  window.__sel = { attrs, style: p.getAttribute('style') || '', sid: p.getAttribute('data-svg-section-id'), baseClass: base.getAttribute('class'), baseStroke: base.getAttribute('stroke'), cs: getComputedStyle(p).stroke + ' ' + getComputedStyle(p).strokeWidth };
  return window.__sel;
};

async function shot(name, wait = 1500) {
  await page.mouse.move(1000, 828);
  await page.waitForTimeout(wait);
  const png = path.join(TMP, name + '.png');
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 1470, height: 837 } });
  execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', path.join(OUT, name + '.webp')], { stdio: 'ignore' });
  console.log('wrote', name);
}
const rect = (sel, nth = 0) => page.evaluate(([s, n]) => { const e = document.querySelectorAll(s)[n]; if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10, Math.round(r.width), Math.round(r.height)]; }, [sel, nth]);
const pages = {};
const FAV = '../../screens/fav/tickets-site.png';
const rec = (id, o) => { pages[id] = { img: id + '.webp', title: o.title ?? TITLE, host: 'vividseats.com', path: o.path, fav: FAV, targets: o.targets, scroll: null, field: o.field ?? null }; };

// ---------- 1-3: the event page ----------
await page.goto(BASE + '?quantity=2', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForSelector('[data-testid=listing-row-container]', { timeout: 60000 });
await page.waitForTimeout(4000);
await page.evaluate(PREP);
for (const [id, st] of Object.entries(STATES)) {
  const log = await page.evaluate(STAGE, { list: st.list, count: st.count, WHEN, WHEN_LONG, selected: null });
  console.log(id, log.join(' | '));
  await page.waitForTimeout(2500);
  await page.evaluate(STAGE, { list: st.list, count: st.count, WHEN, WHEN_LONG, selected: null }); // thumbnails/pins settled, re-assert
  await page.waitForTimeout(500);
  const blockers = await page.evaluate(() => [...document.querySelectorAll('[role=dialog],.ab-iam-root,[aria-modal=true]')].map((e) => e.className || e.tagName));
  if (blockers.length) console.log('WARNING dialogs present:', blockers);
  const tg = { row1: (await rect('[data-testid=listing-row-container]', 0)).slice(0, 2), price1: (await rect('[data-testid=listing-price]', 0)).slice(0, 2) };
  if (id === 'event-238') tg.sort = (await page.evaluate(() => { const e = document.querySelector('[data-testid=listing-sort-label]'); const b = e.closest('button,[role=button],[class*=sort]') || e; const r = b.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10]; }));
  await shot(id);
  rec(id, { path: SLUG + '?quantity=2', targets: tg });
}

// ---------- 4: the listing detail panel for the first row (108 K) ----------
await page.evaluate(() => { document.querySelector('[data-testid=listing-row-container]').scrollIntoView(); });
await page.mouse.move(300, 560);
await page.mouse.move(300, 560);
await page.locator('[data-testid=listing-row-container]').first().click();
await page.waitForSelector('[data-testid=ticket-details-sheet]', { timeout: 20000 });
await page.waitForTimeout(5000);
const detailUrl = page.url();
console.log('real selected-section look', JSON.stringify(await page.evaluate(SELPREP)));
console.log('quantity select', JSON.stringify(await page.evaluate(() => { const e = document.querySelector('[data-testid=quantity-select]'); return e && { disabled: e.disabled, color: getComputedStyle(e).color, opacity: getComputedStyle(e).opacity, cls: e.className.slice(-60) }; })));
const STAGE_DETAIL = () => {
  const q = (s) => document.querySelector(s);
  const sheet = q('[data-testid=ticket-details-sheet]');
  const set = (sel, t) => { const e = sheet.querySelector(sel); if (e) e.textContent = t; };
  set('[data-testid=section-name]', 'Section 108'); set('[data-testid=row-name]', 'Row K');
  set('[data-testid=deal-score-value]', '9.8'); set('[data-testid=deal-score-label]', 'Excellent'); set('[data-testid=ticket-price]', '$142');
  sheet.querySelectorAll('[data-testid="3ddv-static-image"]').forEach((e) => { e.style.backgroundImage = e.style.backgroundImage.replace(/Section\d+_\d+\.jpeg/, 'Section8_8.jpeg'); });
  const mi = sheet.querySelector('[data-testid=map-image]'); if (mi) mi.style.backgroundImage = mi.style.backgroundImage.replace(/\/\d+\.png/, '/8.png');
  const b = sheet.querySelector('[data-testid=seated-together-ticket-info-item]')?.nextElementSibling?.querySelector('b'); if (b) b.textContent = 'Row K';
  const qs = sheet.querySelector('[data-testid=quantity-select]'); if (qs) { qs.removeAttribute('disabled'); qs.value = '2'; }
  const co = sheet.querySelector('[data-testid=desktop-checkout-button]'); if (co) co.href = co.href.replace(/dealScore=[\d.]+/, 'dealScore=9.8');
  return co?.getAttribute('href');
};
await page.evaluate(PREP);
const href = await page.evaluate(STAGE_DETAIL);
await page.evaluate(STAGE, { list: STATES['event-142'].list, count: 46, WHEN, WHEN_LONG, selected: '108' });
await page.waitForTimeout(3000);
await page.evaluate(STAGE_DETAIL);
await page.evaluate(STAGE, { list: STATES['event-142'].list, count: 46, WHEN, WHEN_LONG, selected: '108' });
const dtg = { checkout: (await rect('[data-testid=desktop-checkout-button]')).slice(0, 2) };
await shot('listing-108');
const dpath = new URL(detailUrl).pathname.replace(/^.*\/production\//, SLUG.replace(/production\/.*/, 'production/')) + new URL(detailUrl).search;
rec('listing-108', { path: dpath, targets: dtg });
console.log('detail url', detailUrl, '->', dpath, 'checkout href', href);

// ---------- 5: the checkout page (guest / sign-in gate; step 1 of 2) ----------
await page.locator('[data-testid=desktop-checkout-button]').click();
await page.waitForURL(/\/purchase/, { timeout: 30000 });
await page.waitForSelector('[data-testid=guest-login-form]', { timeout: 30000 });
await page.waitForTimeout(300);
const coUrl = new URL(page.url());
const STAGE_CO = (email) => {
  const sub = (s) => s.replace(/Teddy Swims/g, 'Neon Harbor').replace(/T-Mobile Arena, Las Vegas, NV/g, 'Riverside Arena, Portland, OR').replace(/(\w+day) November 14 at [\d:]+[ap]m/, '$1 November 14 at 7:30pm').replace(/Section \d+, Row \w+/, 'Section 108, Row K');
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { const t = sub(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; }
  document.querySelectorAll('[aria-label],[alt],[title]').forEach((e) => { for (const a of ['aria-label', 'alt', 'title']) { const v = e.getAttribute(a); if (v && sub(v) !== v) e.setAttribute(a, sub(v)); } });
  document.querySelectorAll('img').forEach((i) => { if (/Section\d+_\d+\.jpeg/.test(i.src)) { i.removeAttribute('srcset'); i.src = i.src.replace(/Section\d+_\d+\.jpeg/, 'Section8_8.jpeg'); } });
  document.querySelectorAll('[style*="background-image"]').forEach((e) => { e.style.backgroundImage = e.style.backgroundImage.replace(/Section\d+_\d+\.jpeg/, 'Section8_8.jpeg'); });
  document.querySelectorAll('img').forEach((i) => { if (/\/event\/concerts\//.test(i.src)) { i.removeAttribute('srcset'); i.src = 'https://media.vsstatic.com/image/upload/f_auto,q_auto:best,h_80,w_100,c_fit/hero/3ddv/14509_TMobileArena/10946_EndStage/20240816/fullscreen/Section8_8.jpeg'; i.style.objectFit = 'cover'; } if (/section-highlight-images\/\d+\/\d+\.png/.test(i.src)) { i.removeAttribute('srcset'); i.src = i.src.replace(/\/\d+\.png/, '/8.png'); } });
  document.querySelectorAll('[data-testid=ticket-details] span').forEach((e) => { if (/^Section \d+, Row \w+$/.test(e.textContent.trim())) e.textContent = 'Section 108, Row K'; });
  const inp = document.querySelector('[data-testid="email"]') || document.getElementById('guestUserEmailInput');
  if (!inp) return 'no input';
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(inp, email || ''); inp.dispatchEvent(new Event('input', { bubbles: true }));
};
// when the quote POST is aborted the checkout page bounces back to the event page after a few seconds: abort that bounce
await page.route(/\/production\/6912149(\?|$)/, (r) => r.abort());
const stageCo = async (email) => { try { const r = await page.evaluate(STAGE_CO, email); if (r) console.log('co stage', r); } catch (e) { console.log('co stage err', e.message.slice(0, 80)); } };
await page.waitForTimeout(500); await stageCo(''); await page.waitForTimeout(700); await stageCo('');
const coImgs = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.src.replace(/^.*\/hero\//, '').slice(0, 80) + ' ' + i.naturalWidth));
console.log('checkout imgs', coImgs.join(' | '));
const cot = { email: (await rect('[data-testid="email"]')).slice(0, 2), continue: (await rect('[data-testid=guest-login-submit]')).slice(0, 2) };
await shot('checkout', 200);
const coTitle = await page.title();
const coPath = (coUrl.pathname + coUrl.search).replace(/dealScore=[\d.]+/, 'dealScore=9.8');
// typed field: the same page with the made-up email filled in
const EMAIL = 'jordan@quillnote.app';
await stageCo(EMAIL);
const fld = await page.evaluate(async (email) => {
  document.querySelectorAll('img').forEach((i) => { if (/\/event\/concerts\//.test(i.src)) { i.removeAttribute('srcset'); i.src = 'https://media.vsstatic.com/image/upload/f_auto,q_auto:best,h_80,w_100,c_fit/hero/3ddv/14509_TMobileArena/10946_EndStage/20240816/fullscreen/Section8_8.jpeg'; i.style.objectFit = 'cover'; } if (/section-highlight-images\/\d+\/\d+\.png/.test(i.src)) { i.removeAttribute('srcset'); i.src = i.src.replace(/\/\d+\.png/, '/8.png'); } });
  const inp = document.querySelector('[data-testid="email"]') || document.getElementById('guestUserEmailInput');
  if (!inp) return 'no input'; const cs = getComputedStyle(inp); const r = inp.getBoundingClientRect();
  const left = r.x + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft);
  const cv = document.createElement('canvas').getContext('2d'); cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const stops = [...email].map((_, i) => Math.round((left + cv.measureText(email.slice(0, i + 1)).width) * 10) / 10);
  const h = parseFloat(cs.fontSize) * 1.3;
  return { box: [Math.round(left * 10) / 10, Math.round((r.y + r.height / 2 - h / 2) * 10) / 10, Math.round((cv.measureText(email).width) * 10) / 10, Math.round(h * 10) / 10], stops, value: inp.value };
}, EMAIL);
console.log('field', JSON.stringify(fld));
await shot('checkout-filled', 200);
rec('checkout', { title: coTitle, path: coPath.replace(/uuid=[^&]+/, 'uuid=' + coUrl.searchParams.get('uuid')), targets: cot, field: { box: fld.box, text: EMAIL, stops: fld.stops, filled: 'checkout-filled' } });
rec('checkout-filled', { title: coTitle, path: coPath, targets: cot });
console.log('BLOCKED non-GETs:', blocked.length, blocked.slice(0, 3));
await browser.close();

writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify({ chat: 'tickets', pages }, null, 1));
console.log('pages.json written');
