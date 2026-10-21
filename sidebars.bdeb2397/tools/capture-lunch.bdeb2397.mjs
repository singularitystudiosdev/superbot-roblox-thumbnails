// Captures the Uber Eats store page the "lunch" chat's superbot is working in (transcripts.bdeb2397.js, key `lunch`),
// staged with that chat's made-up content by DOM edits only: nothing is added to a cart or ordered, nothing is typed
// into the site. Writes screens/lunch.webp (2940x1674, the 2x capture as is) and screens/fav/delivery-site.png.
//
//   node sidebars.bdeb2397/tools/capture-lunch.bdeb2397.mjs
//
// Real site: ubereats.com's public store page for Bimi Poke (San Francisco), no login. A store URL opened cold hits Uber's
// "One more step" security check, so the script first opens a public category page (as a visitor browsing would) and then
// the store, which renders in plain headless Chromium. Staged: name Poke Lab, 4.8, a made-up review count, delivery in
// 25 min, a made-up address (500 Howard St), the banner and every food photo replaced by chats/lunch-poke.webp (cropped
// differently per item), made-up poke-shop menu names and prices. No photo of the real restaurant's food is kept.
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'screens', 'lunch.webp');
const FAV = path.join(ROOT, 'screens', 'fav', 'delivery-site.png');
const TMP = path.resolve(ROOT, '..', '.tmp', 'lunch');
const POKE = path.join(ROOT, 'chats', 'lunch-poke.webp');
const CATEGORY = 'https://www.ubereats.com/category/san-francisco-ca/poke';
const STORE = 'https://www.ubereats.com/store/bimi-poke-san-francisco/HpBdo0fCTF-FW_1BFjb_nw';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

const pokeURL = 'data:image/webp;base64,' + (await readFile(POKE)).toString('base64');
await mkdir(TMP, { recursive: true });
await mkdir(path.dirname(FAV), { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA,
});
const page = await ctx.newPage();

// open the store the way a visitor does; retry if the security check answers
let ok = false;
for (let i = 0; i < 3 && !ok; i++) {
  await page.goto(CATEGORY, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.goto(STORE, { waitUntil: 'domcontentloaded' });
  ok = await page.waitForSelector('[data-testid="store-loaded"]', { timeout: 25000 }).then(() => true, () => false);
  if (!ok) console.log('store did not render (try ' + (i + 1) + '):', (await page.title()).slice(0, 80));
}
if (!ok) throw new Error('Uber Eats store page never rendered');
await page.waitForTimeout(2500);

// the real favicon, from the page's own <link rel="icon">
{
  const href = await page.evaluate(() => {
    const l = [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')];
    return l.map((e) => ({ href: e.href, sizes: e.getAttribute('sizes') || '', type: e.type || '' }));
  });
  console.log('icons', JSON.stringify(href));
  const pick = href.find((h) => /32/.test(h.sizes) && /png/.test(h.type + h.href)) || href.find((h) => /png/.test(h.type + h.href)) || href[0];
  const res = await ctx.request.get(pick ? pick.href : 'https://www.ubereats.com/favicon.ico');
  const ext = /\.ico/.test(pick?.href || '') ? 'ico' : /\.svg/.test(pick?.href || '') ? 'svg' : 'png';
  const raw = path.join(TMP, 'favicon-raw.' + ext);
  await writeFile(raw, await res.body());
  // render it at 64px through Chromium so any format (ico, svg, png) ends as a 64px PNG
  const fp = await ctx.newPage();
  await fp.setViewportSize({ width: 64, height: 64 });
  await fp.setContent(`<body style="margin:0;background:transparent"><img id=i style="width:64px;height:64px;display:block" src="data:${ext === 'ico' ? 'image/x-icon' : ext === 'svg' ? 'image/svg+xml' : 'image/png'};base64,${(await readFile(raw)).toString('base64')}"></body>`);
  await fp.waitForFunction(() => document.getElementById('i').complete);
  await fp.screenshot({ path: FAV, omitBackground: true, scale: 'css', clip: { x: 0, y: 0, width: 64, height: 64 } });
  await fp.close();
}

// dialogs: cookie banner, the "No address needed for pickup" tip
for (const name of ['Got it', 'Opt out']) {
  const b = page.getByRole('button', { name, exact: true });
  if (await b.count()) { await b.first().click().catch(() => {}); break; }
}
await page.getByText('No address needed for pickup').first().evaluate((el) => {
  let n = el; for (let i = 0; i < 5 && n; i++, n = n.parentElement) { const x = n.querySelector('button'); if (x) { x.click(); return; } }
}).catch(() => {});
await page.waitForTimeout(800);

// ---- staging (DOM edits only) ----
await page.evaluate(async (pokeURL) => {
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const poke = await load(pokeURL);
  // a crop of the poke picture as a data URL: sx, sy, sw (source box, fraction of width/height), output size
  const crop = (fx, fy, fw, fh, ow, oh, flip = false) => {
    const c = document.createElement('canvas'); c.width = ow; c.height = oh;
    const g = c.getContext('2d'); if (flip) { g.translate(ow, 0); g.scale(-1, 1); }
    g.drawImage(poke, fx * poke.width, fy * poke.height, fw * poke.width, fh * poke.height, 0, 0, ow, oh);
    return c.toDataURL('image/jpeg', 0.92);
  };
  const setImg = (img, url) => {
    const pic = img.closest('picture');
    if (pic) pic.querySelectorAll('source').forEach((s) => s.remove());
    img.removeAttribute('srcset'); img.removeAttribute('sizes'); img.src = url; img.loading = 'eager';
  };
  const leafText = (el, from, to) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (n.nodeValue.includes(from)) n.nodeValue = n.nodeValue.replace(from, to);
  };

  // banner: the wide image beside the store name, same pixel box
  // (the page stacks a low-res and a full-res copy: swap every copy)
  [...document.querySelectorAll('img')].filter((i) => i.alt && /bimi/i.test(i.alt) && i.getBoundingClientRect().width > 600).forEach((banner) => {
    const r = banner.getBoundingClientRect();
    setImg(banner, crop(0, 0.28, 1, (poke.width * r.height / r.width) / poke.height, 1816, Math.round(1816 * r.height / r.width)));
  });

  // name, rating line, delivery line, address
  const h1 = document.querySelector('h1'); h1.textContent = 'Poke Lab';
  const info = h1.parentElement.parentElement;
  const rich = [...info.querySelectorAll('[data-testid="rich-text"]')];
  const byText = (t) => rich.find((e) => e.textContent.trim() === t);
  const want = { '(3,000+)': ' (1,200+)', Japanese: 'Poke', 'Rice-bowls': 'Hawaiian', Sushi: 'Bowls', 'Group Friendly': 'Healthy', 'Eats XL': 'Fresh', $: '$$' };
  for (const [k, v] of Object.entries(want)) { const e = byText(k); if (e) e.textContent = v; }
  const delivery = rich.find((e) => /Delivery unavailable/.test(e.textContent));
  if (delivery) {
    delivery.textContent = ' $0 Delivery Fee • 25 min';
    const icon = delivery.previousElementSibling;
    if (icon && icon.querySelector('svg')) icon.querySelector('svg').innerHTML = '<g fill="currentColor"><path d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21Zm0 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"/><path d="M11 6.5h2v5.6l3.3 1.9-1 1.7-4.3-2.5V6.5Z"/></g>';
  }
  const addr = rich.find((e) => /San Francisco, CA/.test(e.textContent)); if (addr) addr.textContent = '500 Howard St, San Francisco, CA 94105';

  // delivery address in the header
  const w = document.createTreeWalker(document.querySelector('[data-testid="header-v2-wrapper"]'), NodeFilter.SHOW_TEXT); let tn;
  while ((tn = w.nextNode())) if (tn.nodeValue.includes('Enter delivery address')) tn.nodeValue = '500 Howard St';

  // menu hours, search box
  leafText(document.body, '10:00 AM – 8:30 PM', '10:30 AM – 9:00 PM');
  document.querySelectorAll('input').forEach((i) => { if (i.placeholder) i.placeholder = i.placeholder.replace(/Bimi Poke \(San Francisco\)/g, 'Poke Lab'); });

  // menu items: every card gets a poke-shop name, price and a different crop of the one poke picture
  const names = [
    ['Salmon poke bowl', 16.95, '97%', 212], ['Ahi tuna bowl', 17.50, '95%', 164], ['Spicy tuna crunch bowl', 15.95, '94%', 131],
    ['Shoyu tofu bowl', 14.50, '91%', 88], ['Yuzu citrus salmon', 16.25, '96%', 73], ['Lab create-your-own', 14.95, '93%', 305],
    ['Miso edamame', 5.25, '92%', 54], ['Mango sparkling lemonade', 4.50, '90%', 41], ['Sesame seaweed salad', 6.25, '94%', 62],
    ['Salmon poke burrito', 13.95, '95%', 97], ['Kimchi crab bowl', 15.50, '92%', 46], ['Matcha mochi', 4.95, '97%', 39],
  ];
  const crops = [
    [0.00, 0.00, 1.00, 1.00], [0.30, 0.20, 0.50, 0.70], [0.05, 0.25, 0.50, 0.70], [0.45, 0.05, 0.55, 0.95], [0.15, 0.10, 0.60, 0.85],
    [0.55, 0.30, 0.40, 0.65], [0.25, 0.35, 0.40, 0.60], [0.60, 0.00, 0.40, 0.70],
  ];
  const cards = [...document.querySelectorAll('[data-testid^="store-item-"]')];
  // the first card is the featured #1; the Salmon poke bowl must lead the row
  cards.forEach((card, idx) => {
    const [nm, price, pct, count] = names[idx % names.length];
    const labels = card.querySelectorAll('[data-testid="item-thumbnail-label"]');
    if (labels[0]) { const s = labels[0].querySelector('[data-testid="rich-text"]'); if (s) s.textContent = nm; }
    if (labels[1]) {
      const sp = [...labels[1].querySelectorAll('[data-testid="rich-text"]')];
      if (sp[0]) sp[0].textContent = '$' + price.toFixed(2);
      const rest = sp.find((e) => /%/.test(e.textContent)); if (rest) rest.textContent = ' ' + pct + ' (' + count + ')';
    }
    const img = card.querySelector('[data-testid="item-image"] img');
    if (img) {
      const c = idx === 0 ? [0.20, 0.00, 0.60, 1.00] : crops[idx % crops.length];
      const r = img.getBoundingClientRect(); const s = Math.max(r.width, r.height, 150) * 2;
      setImg(img, crop(c[0], c[1], c[2], c[3], s, s, idx % 2 === 1));
      img.alt = nm;
    }
    // list rows (below the featured row) carry a text description of the real restaurant's dish: drop it
    card.querySelectorAll('[data-testid="rich-text"]').forEach((e) => { if (e.textContent.length > 60) e.textContent = 'Fresh fish, sushi rice, crunchy toppings'; });
  });
  // keep the featured row's #1 item as the salmon poke bowl whatever the real order was
  document.querySelectorAll('img').forEach((i) => { if (i.alt && /bimi/i.test(i.alt)) i.alt = i.alt.replace(/Bimi Poke \(San Francisco\)/gi, 'Poke Lab'); });

  // any photo still from the real site (lazy rows, avatars) becomes a crop of the poke picture too
  [...document.querySelectorAll('img')].forEach((i, k) => {
    if (/cloudfront\.net|tb-static\.uber\.com/.test(i.src) && !i.src.startsWith('data:')) { const r = i.getBoundingClientRect(); const z = Math.max(r.width, r.height, 80) * 2; setImg(i, crop(...crops[k % crops.length], z, z, k % 2 === 1)); }
  });
  // reviews: made-up quotes and names (the real ones are other people's)
  const quotes = ['Great portions, great options.', 'Fish tasted fresh and the rice was perfect.', 'Best salmon bowl near the office.', 'Came early and still hot. Will order again.'];
  const people = ['Maya R.', 'Daniel K.', 'Priya S.', 'Tom W.'];
  let qi = 0, pi = 0;
  const wq = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let tq;
  while ((tq = wq.nextNode())) {
    const v = tq.nodeValue.trim();
    if (/^[A-Z][a-z]+ [A-Z]\.$/.test(v)) tq.nodeValue = people[pi++ % people.length];
  }
  // the quote itself sits in a <p> of several text nodes: rewrite the whole paragraph
  for (const q of document.querySelectorAll('p')) {
    if (q.children.length === 0 && /^["\u201c']/.test(q.textContent.trim()) && q.textContent.length > 8) q.textContent = '"' + quotes[qi++ % quotes.length] + '"';
  }

  // section names in the side menu and in the page
  const sec = {
    'Save on Select Items': 'Lunch combos', 'Super Bowl combo deal': 'Signature bowls', 'Restaurant Note': 'Build your own', Appetizer: 'Starters',
    'Poke Bowl': 'Poke bowls', 'Sushi Burrito': 'Poke burritos', 'Curry rice bowl': 'Salads', 'Curry Udon (Noodle)': 'Sides',
    'Regular sushi roll': 'Toppings', Beverages: 'Drinks', Dessert: 'Desserts',
  };
  document.querySelectorAll('a, button, h3, h2, span, div, p').forEach((e) => {
    if (e.children.length) return; const t = e.textContent.trim(); if (sec[t]) e.textContent = sec[t];
  });
  // every remaining mention of the real name
  const ww = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t2;
  while ((t2 = ww.nextNode())) if (/Bimi/i.test(t2.nodeValue)) t2.nodeValue = t2.nodeValue.replace(/Bimi Poke \(San Francisco\)|Bimi Poke|Bimi/gi, 'Poke Lab');
  document.title = 'Order Poke Lab - Menu & Prices - San Francisco Delivery | Uber Eats';
  window.scrollTo(0, 0);
}, pokeURL);
await page.waitForTimeout(1500);

const png = path.join(TMP, 'lunch.png');
await page.screenshot({ path: png, type: 'png' });
execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', OUT], { stdio: 'ignore' });
execFileSync('sips', ['--resampleWidth', '1470', png, '--out', path.join(TMP, 'lunch-1470.png')], { stdio: 'ignore' });
console.log('title:', await page.title());
console.log('wrote', OUT);
await browser.close();
