// Captures the pages the "haircut" chat's superbot works in, as plays/haircut/*.webp + pages.json + fav-fresha.png
// (transcripts.bdeb2397.js, key `haircut`). Headless Playwright, public site, no account, DOM edits only: nothing is
// booked, confirmed, paid or sent (the script never presses Continue; it only picks a date and a time on the page, which
// is what a visitor browsing the slots does).
//
//   node sidebars.bdeb2397/tools/play-haircut.8889b4ff.mjs
//
// Real site: Fresha's online-booking flow for a public San Francisco barbershop (Latin America Barbershop): Select
// services > Select professional > "Select date and time" (the page the storyboard needs: a real date strip, a real list
// of 15-minute slots, the real shop card and a real Continue button). Restaged as the chat's made-up shop:
//   shop    "Fade Room", address "Valencia Street, Mission District, San Francisco, California"; the shop card's photo is
//           a crop of chats/haircut-sam.webp (the interior side of it) instead of the real shop's photo
//   barber  "Sam", the professional chip's avatar is a crop of chats/haircut-sam.webp (generated, see chats/CREDITS)
//   service "Haircut" 30 min $45; slot labels rewritten to evening slots (the list keeps the site's own rows, the ones
//           not needed are display:none); picked state's "6:15-6:45 PM" line rewritten the same way
// Pages (all 1470x837 CSS px at 2x):
//   booking-wed         Wed Nov 18 selected, nothing picked (Continue disabled, as the site draws it), 6:15 PM first
//   booking-wed-picked  the same, 6:15 PM picked (the site's own selected row, summary shows the time, Continue enabled)
//   booking-thu         Thu Nov 19 selected (same strip), nothing picked, 5:45 PM first
//   booking-thu-picked  the same, 5:45 PM picked
//   calendar-moved      a byte copy of screens/haircut.webp (the real Google Calendar capture the chat already has);
//                       its targets are measured on its pixels (see CREDITS), the signed-in Chrome was not available
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'plays', 'haircut');
const TMP = path.resolve(ROOT, '..', '.tmp', 'haircut');
const SAM = path.join(ROOT, 'chats', 'haircut-sam.webp');
const VENUE = 'https://www.fresha.com/a/latin-america-barbershop-san-francisco-3194-24th-street-qoc9oz68/booking?entryPoint=all_offer_book_individual_appointment&allOffer=true';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const SLUG = '/a/fade-room-san-francisco-valencia-street-x7k2m9q4/booking?allOffer=true&cartId=5e1b3c9a-2d47-4f6e-9a18-7c0d2b64e3f1';
const TITLE = 'Make an appointment at Fade Room - Valencia Street - San Francisco | Fresha';
// evening slot labels the rows get (six rows each, first row is the one superbot picks)
const SLOTS = {
  wed: ['6:15 PM', '6:30 PM', '6:45 PM', '7:00 PM', '7:30 PM', '7:45 PM'],
  thu: ['5:45 PM', '6:15 PM', '6:30 PM', '7:00 PM', '7:15 PM', '7:45 PM'],
};
const END = { '6:15 PM': '6:45', '5:45 PM': '6:15' }; // 30 min service

await mkdir(OUT, { recursive: true });
await mkdir(TMP, { recursive: true });
const samURL = 'data:image/webp;base64,' + (await readFile(SAM)).toString('base64');

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA });
const page = await ctx.newPage();

// ---- crops of the generated picture, drawn by Chromium's canvas (a crop, nothing is drawn) ----
const crops = await page.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode();
  const crop = (sx, sy, s) => { const c = document.createElement('canvas'); c.width = c.height = 128; c.getContext('2d').drawImage(img, sx, sy, s, s, 0, 0, 128, 128); return c.toDataURL('image/png'); };
  return { avatar: crop(185, 5, 250), venue: crop(478, 140, 290) };
}, samURL);

// ---- the real flow up to "Select date and time" ----
await page.goto(VENUE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
await page.getByText('Traditional Haircut', { exact: true }).first().click({ force: true });
await page.waitForTimeout(1000);
await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForTimeout(3000);
await page.getByText('Einstein', { exact: true }).first().click({ force: true }); await page.waitForTimeout(1000);
await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForTimeout(3500);

// the site's own favicon, 64px
{
  const links = await page.evaluate(() => [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')].map((e) => ({ href: e.href, sizes: e.getAttribute('sizes') || '', type: e.type || '' })));
  console.log('icons', JSON.stringify(links));
  const pick = links.find((h) => /32/.test(h.sizes) && /png/.test(h.type + h.href)) || links.find((h) => /png/.test(h.type + h.href)) || links[0];
  const res = await ctx.request.get(pick ? pick.href : 'https://www.fresha.com/favicon.ico');
  const ext = /\.ico/.test(pick?.href || '') ? 'ico' : /\.svg/.test(pick?.href || '') ? 'svg' : 'png';
  const raw = path.join(TMP, 'fresha-favicon-raw.' + ext);
  await writeFile(raw, await res.body());
  const fp = await ctx.newPage();
  await fp.setViewportSize({ width: 64, height: 64 });
  await fp.setContent(`<body style="margin:0;background:transparent"><img id=i style="width:64px;height:64px;display:block" src="data:${ext === 'ico' ? 'image/x-icon' : ext === 'svg' ? 'image/svg+xml' : 'image/png'};base64,${(await readFile(raw)).toString('base64')}"></body>`);
  await fp.waitForFunction(() => document.getElementById('i').complete);
  await fp.screenshot({ path: path.join(OUT, 'fav-fresha.png'), omitBackground: true, scale: 'css', clip: { x: 0, y: 0, width: 64, height: 64 } });
  await fp.close();
}

// ---- staging (text, attributes, image src and display of the site's own rows; nothing is added) ----
const stage = (args) => page.evaluate(({ slots, picked, crops, title }) => {
  const REPL = [['Latin America Barbershop', 'Fade Room'], ['3194 24th Street', 'Valencia Street'], ['Traditional Haircut', 'Haircut'], ['Einstein', 'Sam']];
  const swap = (s) => REPL.reduce((o, [a, b]) => o.split(a).join(b), s);
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const t = w.currentNode; const v = swap(t.data); if (v !== t.data) t.data = v; }
  for (const n of document.querySelectorAll('*')) for (const a of [...n.attributes]) {
    if (/^(src|srcset|href|class|id|style|d)$/.test(a.name)) continue;
    const v = swap(a.value); if (v !== a.value) n.setAttribute(a.name, v);
  }
  document.title = title;
  // pictures: the professional's avatar (chip) and the shop card's photo
  const setImg = (img, url) => { img.removeAttribute('srcset'); img.src = url; img.parentElement?.querySelectorAll('source').forEach((s) => s.remove()); };
  const chip = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Sam');
  const avatar = chip?.querySelector('img'); if (avatar) setImg(avatar, crops.avatar);
  const card = [...document.querySelectorAll('img')].find((i) => !chip?.contains(i) && /fresha\.com|data:/.test(i.src) && i.getBoundingClientRect().left > 800);
  if (card) setImg(card, crops.venue);
  // the slot rows: the site's own first rows relabelled, the rest hidden
  const times = [...document.querySelectorAll('p')].filter((e) => /^\d{1,2}:\d\d\s*[AP]M$/.test(e.textContent.trim()));
  let list = times[0]; while (list.parentElement && list.parentElement.children.length < 12) list = list.parentElement;
  const rows = [...list.parentElement.children];
  rows.forEach((r, i) => { r.style.display = i < slots.length ? '' : 'none'; });
  times.forEach((e, i) => { if (i < slots.length) { const sep = (e.textContent.match(/\d\s*(?=[AP]M)/) || [' '])[0].slice(1) || ' '; e.textContent = slots[i].replace(' ', sep); } });
  // the summary's time line once a slot is picked: "10:00-10:30 AM (30 min duration)"
  const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w2.nextNode()) {
    const t = w2.currentNode;
    const m = t.data.match(/^(\d{1,2}:\d\d)-(\d{1,2}:\d\d)(\s*)[AP]M(.*)$/);
    if (m) { const s = slots[0]; const end = { '6:15 PM': '6:45', '5:45 PM': '6:15' }[s]; t.data = `${s.split(' ')[0]}-${end}${m[3]}PM${m[4]}`; }
  }
  // what a viewer could read: text and attributes (links and image sources aside, they hold the real slug)
  let html = document.body.innerText + document.title;
  for (const n of document.querySelectorAll('body *')) for (const a of n.attributes) if (!/^(src|srcset|href|class|id|style|d)$/.test(a.name)) html += ' ' + a.value;
  return { left: ['Latin America', 'Einstein', '3194', '24th', 'Traditional'].map((k) => [k, html.split(k).length - 1]).filter(([, n]) => n), rows: rows.length };
}, args);

const rect = (loc) => loc.evaluate((e) => { const r = e.getBoundingClientRect(); return [Math.round((r.left + r.width / 2) * 10) / 10, Math.round((r.top + r.height / 2) * 10) / 10, r.width, r.height]; });
const measure = async () => {
  const row = await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].filter((e) => /^\d{1,2}:\d\d\s*[AP]M$/.test(e.textContent.trim()))[0];
    let n = p; while (n.parentElement && n.parentElement.children.length < 12) n = n.parentElement;
    const r = n.getBoundingClientRect(); return [(r.left + r.width / 2), (r.top + r.height / 2)];
  });
  const cont = await rect(page.getByRole('button', { name: 'Continue' }));
  const sel = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Select (Wed|Thu), Nov 1[89]/.test(x.getAttribute('aria-label') || '')).map((x) => ({ l: x.getAttribute('aria-label'), r: x.getBoundingClientRect() })); return b.filter((x) => x.r.left > 100 && x.r.right < 800).map((x) => [x.l, (x.r.left + x.r.width / 2), (x.r.top + x.r.height / 2)]); });
  const round = (v) => Math.round(v * 10) / 10;
  return { slot: [round(row[0]), round(row[1])], continue: [cont[0], cont[1]], dates: sel };
};

const pages = {};
const shot = async (id, key, picked) => {
  await page.mouse.move(4, 4);
  await page.waitForTimeout(600);
  const res = await stage({ slots: SLOTS[key], picked, crops, title: TITLE });
  await page.waitForTimeout(500);
  await page.mouse.move(4, 4);
  const png = path.join(TMP, id + '.png');
  await page.screenshot({ path: png, scale: 'device' });
  execFileSync('cwebp', ['-quiet', '-q', '80', png, '-o', path.join(OUT, id + '.webp')]);
  const t = await measure();
  console.log(id, JSON.stringify(res), JSON.stringify(t));
  pages[id] = {
    img: id + '.webp', title: TITLE, host: 'fresha.com', path: SLUG, fav: 'fav-fresha.png',
    targets: { slot: t.slot, continue: t.continue }, scroll: null, field: null,
  };
};
const pickDate = async (label) => {
  const b = page.getByRole('button', { name: `Select ${label}, 2026` });
  if (!(await b.evaluate((e) => { const r = e.getBoundingClientRect(); return r.left > 100 && r.right < 800; }))) { await b.click({ force: true }); await page.waitForTimeout(1500); }
  await b.click(); await page.waitForTimeout(2500);
};
const pickFirstSlot = async () => {
  const t = page.locator('p').filter({ hasText: /^\d{1,2}:\d\d\s*[AP]M$/ }).first();
  await t.click({ force: true }); await page.waitForTimeout(2500);
};

await pickDate('Wed, Nov 18');
await shot('booking-wed', 'wed', false);
await pickFirstSlot();
await shot('booking-wed-picked', 'wed', true);
await pickDate('Thu, Nov 19');
await shot('booking-thu', 'thu', false);
await pickFirstSlot();
await shot('booking-thu-picked', 'thu', true);
await browser.close();

// ---- calendar-moved: the existing real capture, targets measured on its pixels (the sage chip = Haircut with Sam) ----
await copyFile(path.join(ROOT, 'screens', 'haircut.webp'), path.join(OUT, 'calendar-moved.webp'));
const b2 = await chromium.launch({ headless: true });
const p2 = await (await b2.newContext({ viewport: { width: 400, height: 300 } })).newPage();
const url = 'data:image/webp;base64,' + (await readFile(path.join(OUT, 'calendar-moved.webp'))).toString('base64');
const box = await p2.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  // the haircut chip, ~ rgb(93,180,130) as drawn at 2x, inside Thursday's column (x 880..1100, y 640..725 css px)
  for (let y = 1280; y < 1450; y++) for (let x = 1760; x < 2200; x++) {
    const i = (y * c.width + x) * 4;
    if (Math.abs(d[i] - 93) < 12 && Math.abs(d[i + 1] - 180) < 12 && Math.abs(d[i + 2] - 130) < 12) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  return { w: img.width, h: img.height, x0, y0, x1, y1 };
}, url);
await b2.close();
console.log('calendar-moved sage chip', JSON.stringify(box));
pages['calendar-moved'] = {
  img: 'calendar-moved.webp', title: 'Google Calendar - Week of November 15, 2026', host: 'calendar.google.com', path: '/calendar/u/0/r/week/2026/11/15',
  fav: '../../screens/fav/google-calendar.png',
  targets: { haircut: [Math.round((box.x0 + box.x1) / 4 * 10) / 10, Math.round((box.y0 + box.y1) / 4 * 10) / 10] }, scroll: null, field: null,
};

await writeFile(path.join(OUT, 'pages.json'), JSON.stringify({ chat: 'haircut', pages }, null, 1) + '\n');
console.log('wrote pages.json');
