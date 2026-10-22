// Captures the play for the "lunch" chat (transcripts.bdeb2397.js, key `lunch`): superbot searches Uber Eats for lunch near
// 500 Howard St, opens a new place each Friday (Menya Sora, La Esquina, Poke Lab), opens the salmon poke bowl and puts it
// in the cart. One 2x capture per page state in plays/lunch/, plus plays/lunch/pages.json (title, host, path, cursor targets).
//
//   node sidebars.bdeb2397/tools/play-lunch-image.8889b4ff.mjs   # once: Cedar House's photo (plays/lunch/cedar-house.webp)
//   node sidebars.bdeb2397/tools/play-lunch.8889b4ff.mjs
//
// Extends capture-lunch.bdeb2397.mjs. Real site: ubereats.com in a throwaway headless Chromium, a guest, no login. The
// visitor's delivery address is typed into the home page's own address box (500 Howard St, San Francisco: a real address
// the site finds), then: the search for "lunch" (the site's own results page), a public store page (Bimi Poke, San
// Francisco: its page is the layout all three store pages share), its item dialog, and the guest cart drawer. The guest cart
// holds one item in this throwaway browser; nothing is checked out and "Go to checkout" is never pressed.
// Staged by DOM edits only (text, the site's own markup, image src swaps): store name, rating, tags, address, menu, prices,
// reviews; every food photo is a crop of the chat's picture (chats/lunch-ramen|tacos|poke.webp, plays/lunch/cedar-house.webp).
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, '..', 'package.json'));
const { chromium } = require('playwright');
const OUT = path.join(ROOT, 'plays', 'lunch');
const TMP = path.resolve(ROOT, '..', '.tmp', 'play-lunch');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const CATEGORY = 'https://www.ubereats.com/category/san-francisco-ca/poke';
const REAL_STORE = 'https://www.ubereats.com/store/bimi-poke-san-francisco/HpBdo0fCTF-FW_1BFjb_nw';
const FAV = '../../screens/fav/delivery-site.png';

const dataURL = async (f) => 'data:image/webp;base64,' + (await readFile(f)).toString('base64');
const PHOTOS = {
  ramen: await dataURL(path.join(ROOT, 'chats', 'lunch-ramen.webp')),
  tacos: await dataURL(path.join(ROOT, 'chats', 'lunch-tacos.webp')),
  poke: await dataURL(path.join(ROOT, 'chats', 'lunch-poke.webp')),
  cedar: await dataURL(path.join(OUT, 'cedar-house.webp')),
};
await mkdir(TMP, { recursive: true });

// photo crops: [centre x, centre y, height] as fractions of the 768x432 picture; the width follows the box's own aspect
const STORES = {
  menya: {
    name: 'Menya Sora', slug: 'menya-sora-san-francisco', id: 'Rk3vN8dQTx2HcLw5Yb1pMA', photo: 'ramen', rating: '4.7', count: '(860+)', eta: '20 min',
    tags: { Japanese: 'Japanese', 'Rice-bowls': 'Ramen', Sushi: 'Noodles', 'Group Friendly': 'Comfort Food', 'Eats XL': 'Soup', $: '$$' },
    address: '412 Folsom St, San Francisco, CA 94105', hours: '10:30 AM – 9:00 PM',
    banner: [0.62, 0.5, 0.46], first: [0.62, 0.5, 1],
    crops: [[0.62, 0.45, 0.7], [0.7, 0.35, 0.6], [0.58, 0.6, 0.6], [0.55, 0.5, 0.55], [0.68, 0.55, 0.8], [0.5, 0.4, 0.5], [0.72, 0.3, 0.5]],
    items: [['Spicy miso ramen', 15.5, '97%', 312], ['Tonkotsu ramen', 16.25, '95%', 244], ['Shoyu ramen', 14.95, '94%', 198], ['Tantanmen', 16.5, '93%', 121],
      ['Chashu rice bowl', 12.95, '92%', 88], ['Pork gyoza (6)', 7.5, '95%', 140], ['Edamame', 5.25, '91%', 54], ['Karaage', 9.5, '96%', 77],
      ['Vegetable ramen', 14.5, '90%', 41], ['Extra egg', 2.0, '94%', 33], ['Matcha ice cream', 4.95, '97%', 39], ['Iced barley tea', 3.5, '92%', 29]],
    sections: ['Lunch sets', 'Signature ramen', 'Build your bowl', 'Starters', 'Ramen', 'Rice bowls', 'Sides', 'Toppings', 'Extras', 'Drinks', 'Desserts'],
    quotes: ['Rich broth, perfect noodles.', 'Spicy miso with a soft egg. Worth it.', 'Best ramen near the office.', 'Arrived hot and on time.'],
  },
  esquina: {
    name: 'La Esquina', slug: 'la-esquina-san-francisco', id: 'Zt9fK4mXQe-uA7sVd0cJhw', photo: 'tacos', rating: '4.6', count: '(640+)', eta: '18 min',
    tags: { Japanese: 'Mexican', 'Rice-bowls': 'Tacos', Sushi: 'Latin American', 'Group Friendly': 'Casual', 'Eats XL': 'Fresh', $: '$$' },
    address: '1180 Mission St, San Francisco, CA 94103', hours: '10:30 AM – 9:30 PM',
    banner: [0.5, 0.6, 0.5], first: [0.45, 0.62, 0.8],
    crops: [[0.4, 0.62, 0.55], [0.5, 0.62, 0.55], [0.6, 0.6, 0.45], [0.35, 0.65, 0.5], [0.8, 0.5, 0.4], [0.55, 0.55, 0.7], [0.42, 0.58, 0.45]],
    items: [['Tacos al pastor (3)', 11.5, '96%', 405], ['Carne asada tacos (3)', 12.5, '94%', 261], ['Chicken tinga tacos (3)', 11.25, '93%', 176], ['Carnitas burrito', 13.5, '95%', 143],
      ['Chips and guacamole', 7.25, '92%', 95], ['Cheese quesadilla', 9.5, '91%', 64], ['Elote cup', 5.5, '94%', 58], ['Black beans and rice', 4.75, '90%', 37],
      ['Veggie tacos (3)', 10.5, '92%', 51], ['Salsa trio', 3.5, '95%', 46], ['Churros', 5.95, '97%', 39], ['Horchata', 3.95, '93%', 62]],
    sections: ['Lunch combos', 'Signature tacos', 'Build your own', 'Starters', 'Tacos', 'Burritos', 'Sides', 'Salsas', 'Extras', 'Drinks', 'Desserts'],
    quotes: ['Pastor is juicy and the pineapple is perfect.', 'Generous portions, great salsa.', 'My go-to for tacos at work.', 'Arrived early and still warm.'],
  },
  poke: {
    name: 'Poke Lab', slug: 'poke-lab-san-francisco', id: 'Qm7tR2xLS0eWv9KcPz4hJg', photo: 'poke', rating: '4.8', count: '(1,200+)', eta: '25 min',
    tags: { Japanese: 'Poke', 'Rice-bowls': 'Hawaiian', Sushi: 'Bowls', 'Group Friendly': 'Healthy', 'Eats XL': 'Fresh', $: '$$' },
    address: '230 Brannan St, San Francisco, CA 94107', hours: '10:30 AM – 9:00 PM',
    banner: [0.5, 0.5, 0.42], first: [0.5, 0.5, 1],
    crops: [[0.55, 0.5, 0.7], [0.4, 0.55, 0.7], [0.65, 0.4, 0.8], [0.45, 0.45, 0.6], [0.7, 0.6, 0.6], [0.35, 0.55, 0.55], [0.6, 0.3, 0.55]],
    items: [['Salmon poke bowl', 16.95, '97%', 212], ['Ahi tuna bowl', 17.5, '95%', 164], ['Spicy tuna crunch bowl', 15.95, '94%', 131], ['Shoyu tofu bowl', 14.5, '91%', 88],
      ['Yuzu citrus salmon', 16.25, '96%', 73], ['Lab create-your-own', 14.95, '93%', 305], ['Miso edamame', 5.25, '92%', 54], ['Mango sparkling lemonade', 4.5, '90%', 41],
      ['Sesame seaweed salad', 6.25, '94%', 62], ['Salmon poke burrito', 13.95, '95%', 97], ['Kimchi crab bowl', 15.5, '92%', 46], ['Matcha mochi', 4.95, '97%', 39]],
    sections: ['Lunch combos', 'Signature bowls', 'Build your own', 'Starters', 'Poke bowls', 'Poke burritos', 'Salads', 'Sides', 'Toppings', 'Drinks', 'Desserts'],
    quotes: ['Great portions, great options.', 'Fish tasted fresh and the rice was perfect.', 'Best salmon bowl near the office.', 'Packed well and ready on time.'],
  },
};
const people = ['Maya R.', 'Daniel K.', 'Priya S.', 'Tom W.'];
const SECTION_SRC = ['Save on Select Items', 'Super Bowl combo deal', 'Restaurant Note', 'Appetizer', 'Poke Bowl', 'Sushi Burrito', 'Curry rice bowl', 'Curry Udon (Noodle)', 'Regular sushi roll', 'Beverages', 'Dessert'];

// ---------------------------------------------------------------- in-page code
function installHelpers(photos) {
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  return (async () => {
    const imgs = {};
    for (const [k, v] of Object.entries(photos)) imgs[k] = await load(v);
    // crop of a picture as a JPEG data URL: spec = [centre x, centre y, height] (fractions); ow x oh output px; the width follows
    const crop = (key, spec, ow, oh, flip = false) => {
      const im = imgs[key]; const [cx, cy, fh] = spec;
      let sh = fh * im.height, sw = sh * ow / oh;
      if (sw > im.width) { sw = im.width; sh = sw * oh / ow; }
      const sx = Math.max(0, Math.min(im.width - sw, cx * im.width - sw / 2)), sy = Math.max(0, Math.min(im.height - sh, cy * im.height - sh / 2));
      const c = document.createElement('canvas'); c.width = ow; c.height = oh;
      const g = c.getContext('2d'); if (flip) { g.translate(ow, 0); g.scale(-1, 1); }
      g.drawImage(im, sx, sy, sw, sh, 0, 0, ow, oh);
      return c.toDataURL('image/jpeg', 0.92);
    };
    const setImg = (img, url) => {
      const pic = img.closest('picture');
      if (pic) pic.querySelectorAll('source').forEach((s) => s.remove());
      img.removeAttribute('srcset'); img.removeAttribute('sizes'); img.src = url; img.loading = 'eager';
    };
    // the picture of an <img> at its own box (x2), from a crop spec
    const fit = (img, key, spec, flip = false, fallback = [300, 200]) => {
      const r = img.getBoundingClientRect(); const w = r.width || fallback[0], h = r.height || fallback[1];
      setImg(img, crop(key, spec, Math.round(w * 2), Math.round(h * 2), flip));
    };
    const leafText = (root, from, to) => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) if (n.nodeValue.includes(from)) n.nodeValue = n.nodeValue.split(from).join(to);
    };
    window.__H = { crop, setImg, fit, leafText };
  })();
}

// the search results page: four of the first eight cards become the Fridays' places and Cedar House
function stageSearch({ cards }) {
  const { fit } = window.__H;
  // the page-bottom Uber One strip is a marketing pop-up: close it the way a visitor does
  const strip = [...document.querySelectorAll('div')].find((d) => d.children.length < 6 && /\$0 Delivery Fee with Uber One/.test(d.textContent) && getComputedStyle(d).position === 'fixed');
  if (strip) { const b = strip.querySelector('button'); if (b) b.click(); else strip.remove(); }
  const list = [...document.querySelectorAll('div[data-testid="store-card"]')];
  for (const c of cards) {
    const card = list[c.idx];
    const link = card.querySelector('a[data-testid="store-card"]');
    const h3 = link && link.querySelector('h3'); const old = (h3 ? h3.textContent : '').trim();
    if (link) { link.setAttribute('href', '/store/' + c.slug + '/' + c.id); if (h3) h3.textContent = c.name; }
    const img = card.querySelector('img'); fit(img, c.photo, c.spec); img.alt = ''; img.dataset.k = c.photo;
    // the name: the leaf that carries the old store name
    const w = document.createTreeWalker(card, NodeFilter.SHOW_TEXT); let n; const texts = [];
    while ((n = w.nextNode())) texts.push(n);
    const nameNode = texts.find((t) => t.nodeValue.trim() === old) || texts[0];
    nameNode.nodeValue = c.name;
    const rate = card.querySelector('[aria-label^="Rating"]');
    if (rate) {
      rate.setAttribute('aria-label', 'Rating: ' + c.rating + ' stars. ' + c.count.replace(/[()]/g, '') + ' reviews');
      const sp = rate.querySelectorAll('span'); sp[0].textContent = c.rating; sp[0].title = c.rating; sp[1].textContent = c.count; sp[1].title = c.count.replace(/[()]/g, '');
    }
    const eta = card.querySelector('[aria-label^="Estimated Time"]');
    if (eta) { eta.setAttribute('aria-label', 'Estimated Time of Departure: ' + c.eta); eta.querySelector('span').textContent = c.eta; }
    card.querySelectorAll('[data-baseweb="tag"]').forEach((t) => t.closest('div').remove()); // Great value / Buy 1 get 1 pills of the real stores
  }
  // a real photo further down that did not load would show a broken-image icon: give it one of the chat's pictures
  [...document.querySelectorAll('div[data-testid="store-card"] img')].forEach((i, k) => {
    const r = i.getBoundingClientRect();
    if (!i.dataset.k && r.top < innerHeight && r.height > 20 && !(i.complete && i.naturalWidth > 0)) fit(i, ['ramen', 'tacos', 'poke', 'cedar'][k % 4], [0.5, 0.55, 0.7]);
  });
  window.scrollTo(0, 0);
}

// a store page (Bimi Poke's layout) as one of the three places
function stageStore({ cfg, sectionSrc, people }) {
  const { fit, leafText } = window.__H;
  const photo = cfg.photo;
  // banner (the page stacks a low-res and a full-res copy: swap every copy)
  [...document.querySelectorAll('img')].filter((i) => i.alt && /bimi/i.test(i.alt) && i.getBoundingClientRect().width > 600).forEach((b) => fit(b, photo, cfg.banner));
  const h1 = document.querySelector('h1'); h1.textContent = cfg.name;
  const info = h1.parentElement.parentElement;
  const rich = [...info.querySelectorAll('[data-testid="rich-text"]')];
  const byText = (t) => rich.find((e) => e.textContent.trim() === t);
  const cnt = byText('(3,000+)'); if (cnt) cnt.textContent = ' ' + cfg.count;
  const rt = rich.find((e) => /^4\.\d$/.test(e.textContent.trim())); if (rt) rt.textContent = cfg.rating;
  for (const [k, v] of Object.entries(cfg.tags)) { const e = byText(k); if (e) e.textContent = v; }
  const addr = rich.find((e) => /San Francisco, CA/.test(e.textContent)); if (addr) addr.textContent = cfg.address;
  // the delivery strip's "Earliest arrival" minutes
  const wm = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let tm;
  while ((tm = wm.nextNode())) if (/^\d+ min$/.test(tm.nodeValue.trim()) && tm.parentElement.closest('[data-testid="store-loaded"]')) tm.nodeValue = cfg.eta;
  leafText(document.body, '10:00 AM – 8:30 PM', cfg.hours);
  document.querySelectorAll('input').forEach((i) => { if (i.placeholder) i.placeholder = i.placeholder.replace(/Bimi Poke \(San Francisco\)/g, cfg.name); });

  // menu cards: the first is the dish
  const cards = [...document.querySelectorAll('[data-testid^="store-item-"]')];
  cards.forEach((card, idx) => {
    const [nm, price, pct, count] = cfg.items[idx % cfg.items.length];
    const labels = card.querySelectorAll('[data-testid="item-thumbnail-label"]');
    if (labels[0]) { const s = labels[0].querySelector('[data-testid="rich-text"]'); if (s) s.textContent = nm; }
    if (labels[1]) {
      const sp = [...labels[1].querySelectorAll('[data-testid="rich-text"]')];
      if (sp[0]) sp[0].textContent = '$' + price.toFixed(2);
      const rest = sp.find((e) => /%/.test(e.textContent)); if (rest) rest.textContent = ' ' + pct + ' (' + count + ')';
    }
    const img = card.querySelector('[data-testid="item-image"] img');
    if (img) { fit(img, photo, idx === 0 ? cfg.first : cfg.crops[idx % cfg.crops.length], idx % 2 === 1 && idx > 0, [200, 188]); img.alt = nm; }
    card.querySelectorAll('[data-testid="rich-text"]').forEach((e) => { if (e.textContent.length > 60) e.textContent = cfg.name + ' favourite, made fresh to order'; });
  });
  document.querySelectorAll('img').forEach((i) => { if (i.alt && /bimi/i.test(i.alt)) i.alt = i.alt.replace(/Bimi Poke \(San Francisco\)/gi, cfg.name); });
  // any photo still from the real site becomes a crop of the chat's picture
  [...document.querySelectorAll('img')].forEach((i, k) => {
    let a = i, art = false; for (let d = 0; d < 4 && a; d++, a = a.parentElement) if (/Sign in to enjoy/.test(a.textContent) && !/Offers for you/.test(a.textContent)) art = true; // the site's own banner artwork stays
    if (!art && /cloudfront\.net|tb-static\.uber\.com/.test(i.src) && !i.src.startsWith('data:')) fit(i, photo, cfg.crops[k % cfg.crops.length], k % 2 === 1, [160, 160]);
  });
  // reviews: made-up names and quotes
  let qi = 0, pi = 0;
  const wq = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let tq;
  while ((tq = wq.nextNode())) if (/^[A-Z][a-z]+ [A-Z]\.$/.test(tq.nodeValue.trim())) tq.nodeValue = people[pi++ % people.length];
  for (const q of document.querySelectorAll('p')) if (q.children.length === 0 && /^["“']/.test(q.textContent.trim()) && q.textContent.length > 8) q.textContent = '"' + cfg.quotes[qi++ % cfg.quotes.length] + '"';
  // section names, side menu and page
  const sec = Object.fromEntries(sectionSrc.map((s, i) => [s, cfg.sections[i]]));
  document.querySelectorAll('a, button, h3, h2, span, div, p').forEach((e) => { if (e.children.length) return; const t = e.textContent.trim(); if (sec[t]) e.textContent = sec[t]; });
  replaceName(cfg.name);
  document.title = 'Order ' + cfg.name + ' Menu Delivery in San Francisco | ' + cfg.name + ' Prices | Uber Eats';

  function replaceName(name) {
    const ww = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t2;
    while ((t2 = ww.nextNode())) if (/Bimi/i.test(t2.nodeValue)) t2.nodeValue = t2.nodeValue.replace(/Bimi Poke \(San Francisco\)|Bimi Poke|Bimi/gi, name);
  }
  window.scrollTo(0, 0);
}

// the item dialog of the store's first card, as the Salmon poke bowl
function stageDialog({ cfg, d }) {
  const { fit, leafText } = window.__H;
  const dlg = document.querySelector('[role="dialog"]');
  const old = dlg.querySelector('[data-testid="menu-item-title"]').textContent;
  leafText(dlg, old, d.title);
  dlg.querySelector('[data-testid="menu-item-title"]').textContent = d.title;
  dlg.querySelector('[data-testid="menu-item-price"] [data-testid="rich-text"]').textContent = d.price;
  const desc = [...dlg.querySelectorAll('div')].find((e) => !e.children.length && /^The poke bowl comes with/.test(e.textContent)); if (desc) desc.textContent = d.desc;
  const pct = [...dlg.querySelectorAll('div')].find((e) => !e.children.length && /^\d+% \(\d+\)$/.test(e.textContent.trim())); if (pct) pct.textContent = d.pct;
  const add = dlg.querySelector('[data-testid="add-to-cart-button"]');
  const wa = document.createTreeWalker(add, NodeFilter.SHOW_TEXT); let ta;
  while ((ta = wa.nextNode())) if (/^\$\d/.test(ta.nodeValue.trim())) ta.nodeValue = d.price;
  leafText(dlg, 'Tuna poke', 'Salmon poke');
  dlg.querySelectorAll('[data-testid="menu-item-image-0"] img').forEach((i) => fit(i, cfg.photo, cfg.first, false, [492, 492]));
  dlg.querySelectorAll('img').forEach((i, k) => { if (!i.src.startsWith('data:')) fit(i, cfg.photo, cfg.crops[k % cfg.crops.length], k % 2 === 1, [120, 120]); });
}

// the guest cart drawer
function stageCart({ cfg, c }) {
  const { fit, leafText } = window.__H;
  const list = document.querySelector('[data-testid="cart-items-list"]');
  let root = list; while (root.parentElement && root.parentElement !== document.body && !(/Go to checkout/.test(root.textContent) && root.getBoundingClientRect().height > 600)) root = root.parentElement;
  leafText(root, 'Poke Bowl (create)', c.title);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const v = n.nodeValue.trim();
    if (v === '$15.50') n.nodeValue = c.price;
    else if (/^135 4th St/.test(v)) n.nodeValue = c.street;
    else if (v === 'Ahi lover bowl (spicy)') n.nodeValue = c.offerName;
    else if (v === '$13.56') n.nodeValue = c.offerNow;
    else if (v === '$16.95') n.nodeValue = c.offerWas;
  }
  const prot = [...root.querySelectorAll('*')].filter((e) => /^Choice of Protein:/.test(e.textContent.trim()) && ![...e.querySelectorAll('*')].some((d) => /^Choice of Protein:/.test(d.textContent.trim())));
  prot.forEach((e) => { e.textContent = c.protein; });
  [...root.querySelectorAll('*')].forEach((e) => { if (!e.children.length && /^Tofu Cake, Salmon Poke/.test(e.textContent.trim())) e.textContent = ''; }); // the rest of the real selection line
  // food photos only: the store's avatar, the item, the offer (not the site's own banner artwork)
  root.querySelectorAll('img').forEach((i, k) => {
    let a = i, banner = false; for (let d = 0; d < 4 && a; d++, a = a.parentElement) if (/Sign in to enjoy/.test(a.textContent) && !/Poke Lab|Salmon poke bowl/.test(a.textContent)) banner = true;
    if (!banner && !i.src.startsWith('data:')) fit(i, cfg.photo, k === 0 ? [0.5, 0.5, 0.55] : cfg.first, false, [60, 60]);
  });
  return !!root;
}

// ---------------------------------------------------------------- driver
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA });
const page = await ctx.newPage();
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null; // e.g. ONLY=cart: redo just that part, keeping the other pages
const pages = ONLY ? JSON.parse(await readFile(path.join(OUT, 'pages.json'), 'utf8')).pages : {};
const want = (n) => !ONLY || ONLY.includes(n);
const log = (...a) => console.log(...a);

async function settleImages() {
  await page.evaluate(() => Promise.all([...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }).map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 4000); }))));
  await page.waitForTimeout(1200);
}
async function setAddress() {
  await page.goto('https://www.ubereats.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const inp = page.locator('#location-typeahead-home-input, input[placeholder="Enter delivery address"]').first();
  await inp.click(); await inp.pressSequentially('500 Howard St, San Francisco', { delay: 60 });
  await page.waitForTimeout(2500);
  await inp.press('ArrowDown'); await inp.press('Enter');
  await page.waitForTimeout(5000);
}
async function dismiss() {
  for (const name of ['Got it', 'Opt out']) { const b = page.getByRole('button', { name, exact: true }); if (await b.count()) { await b.first().click().catch(() => {}); break; } }
  await page.waitForTimeout(600);
}
async function openStore() {
  for (let i = 0; i < 3; i++) {
    await page.goto(CATEGORY, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500);
    await page.goto(REAL_STORE, { waitUntil: 'domcontentloaded' });
    if (await page.waitForSelector('[data-testid="store-loaded"]', { timeout: 25000 }).then(() => true, () => false)) { await page.waitForTimeout(2500); await dismiss(); await page.waitForTimeout(500); return; }
    log('store did not render, retry', i + 1);
  }
  throw new Error('Uber Eats store page never rendered');
}
const helpers = () => page.evaluate(installHelpers, PHOTOS);
const center = (sel, nth = 0) => page.evaluate(([s, n]) => {
  const el = [...document.querySelectorAll(s)][n]; if (!el) return null; const r = el.getBoundingClientRect();
  return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10];
}, [sel, nth]);
async function shoot(id, meta) {
  await page.mouse.move(2, 2); await page.waitForTimeout(500);
  const png = path.join(TMP, id + '.png');
  await page.screenshot({ path: png, type: 'png' });
  execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', path.join(OUT, id + '.webp')], { stdio: 'ignore' });
  pages[id] = { img: id + '.webp', title: await page.title(), ...meta, fav: FAV, scroll: null, field: null };
  log('wrote', id, pages[id].title, JSON.stringify(meta.targets));
}
const storePath = (k) => '/store/' + STORES[k].slug + '/' + STORES[k].id + '?diningMode=DELIVERY';
const modctx = encodeURIComponent(encodeURIComponent(JSON.stringify({ storeUuid: '5d1c7a42-8b3e-4f0a-9c61-2e7b04d8a915', sectionUuid: 'c8a2f6e1-3d94-4b7a-a05e-91f2d6c37b48', subsectionUuid: '7e3b9d05-6a12-4c8f-b2d7-4f81a0e5c936', itemUuid: 'a41d8e27-5c60-4f93-8b1a-d2e07f593c64', showSeeDetailsCTA: true })));

await setAddress();

// ---- 1. search results for "lunch" at 500 Howard St
if (want('search')) {
  const place = [
    { idx: 1, k: 'menya', photo: 'ramen', spec: [0.62, 0.5, 0.66] },
    { idx: 3, k: 'esquina', photo: 'tacos', spec: [0.45, 0.6, 0.68] },
    { idx: 4, k: 'poke', photo: 'poke', spec: [0.5, 0.5, 0.62] },
    { idx: 6, k: 'cedar', photo: 'cedar', spec: [0.5, 0.55, 0.72] },
  ];
  const SR = { menya: ['Menya Sora', '4.7', '(860+)', '20 min'], esquina: ['La Esquina', '4.6', '(640+)', '18 min'], poke: ['Poke Lab', '4.8', '(1,200+)', '25 min'], cedar: ['Cedar House', '4.7', '(410+)', '22 min'] };
  const cards = place.map((p) => ({ idx: p.idx, photo: p.photo, spec: p.spec, name: SR[p.k][0], rating: SR[p.k][1], count: SR[p.k][2], eta: SR[p.k][3], slug: (STORES[p.k]?.slug) || 'cedar-house-san-francisco', id: (STORES[p.k]?.id) || 'Wd5hP1nCRr-YkE8xZs3bUQ' }));
  // the results list re-renders while it loads (cards move): stage, wait, and only keep a state where each staged card still holds its own name and photo
  let good = false;
  for (let attempt = 0; attempt < 5 && !good; attempt++) {
    await page.goto('https://www.ubereats.com/search?diningMode=DELIVERY&q=lunch&sc=SEARCH_BAR&searchType=GLOBAL_SEARCH&vertical=ALL', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('div[data-testid="store-card"]', { timeout: 30000 });
    await page.waitForTimeout(7000);
    await dismiss();
    await page.evaluate(() => window.scrollTo(0, 700)); await page.waitForTimeout(2500); await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(2500);
    await helpers();
    await page.evaluate(stageSearch, { cards });
    await settleImages();
    await page.waitForTimeout(4000);
    good = await page.evaluate((cards) => {
      const list = [...document.querySelectorAll('div[data-testid="store-card"]')];
      return cards.every((c) => { const card = list[c.idx]; const im = card.querySelector('img'); return card.innerText.includes(c.name) && im.src.startsWith('data:') && im.dataset.k === c.photo; })
        && list.slice(0, 8).filter((c) => cards.some((x) => c.innerText.includes(x.name))).length === cards.length;
    }, cards);
    log('search attempt', attempt + 1, good);
  }
  if (!good) throw new Error('search results kept re-rendering');
  const t = {};
  for (const p of place) t['store:' + p.k] = await center('div[data-testid="store-card"]', p.idx);
  await shoot('search', { host: 'ubereats.com', path: '/search?diningMode=DELIVERY&q=lunch', targets: t });
}

// ---- 2. the three store pages (the same real page, restaged)
for (const k of ['menya', 'esquina', 'poke']) {
  if (!want('store')) break;
  await openStore();
  await helpers();
  await page.evaluate(stageStore, { cfg: STORES[k], sectionSrc: SECTION_SRC, people });
  await settleImages();
  const t = { dish: await center('[data-testid^="store-item-"]', 0) };
  t.add = await page.evaluate(() => { const r = document.querySelector('[data-testid^="store-item-"] [data-testid="quick-add-button"]').getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10]; });
  await shoot('store-' + k, { host: 'ubereats.com', path: storePath(k), targets: t });
}

// ---- 3. the item dialog (Salmon poke bowl) and 4. the guest cart
const D = { title: 'Salmon poke bowl', price: '$16.95', pct: '97% (212)', desc: 'Fresh salmon over sushi rice with avocado, edamame, cucumber and seaweed salad, topped with sesame seeds and our shoyu-ginger poke sauce.' };
if (want('item')) {
  await openStore();
  await page.locator('[data-testid^="store-item-"]').nth(0).click();
  await page.waitForSelector('[role="dialog"] [data-testid="add-to-cart-button"]');
  await page.waitForTimeout(1500);
  await helpers();
  await page.evaluate(stageStore, { cfg: STORES.poke, sectionSrc: SECTION_SRC, people });
  await page.evaluate(stageDialog, { cfg: STORES.poke, d: D });
  await settleImages();
  await shoot('item-poke', { host: 'ubereats.com', path: storePath('poke') + '&mod=quickView&modctx=' + modctx, targets: { add: await center('[data-testid="add-to-cart-button"]') } });
}
if (want('cart')) {
  await openStore();
  await page.locator('[data-testid^="store-item-"]').nth(0).click();
  await page.waitForSelector('[role="dialog"] [data-testid="add-to-cart-button"]');
  await page.waitForTimeout(1500);
  // the guest picks the two required choices (a protein pair, utensils) the way the site asks; the cart is local to this throwaway browser
  const dlg = page.locator('[role="dialog"]');
  const incs = page.locator('[role="dialog"] [data-testid="quantity-increment-selection-button"]');
  await incs.nth(1).click(); await page.waitForTimeout(400); await incs.nth(2).click(); await page.waitForTimeout(400); // Tofu Cake, Salmon Poke
  await dlg.locator('[data-testid="customization-pick-one"]').first().click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /Add 1 to order/ }).click();
  await page.waitForTimeout(3500);
  await page.locator('[data-testid="view-carts-badge"]').click();
  await page.waitForSelector('[data-testid="cart-items-list"]', { timeout: 15000 });
  await page.waitForTimeout(2000);
  await helpers();
  await page.evaluate(stageStore, { cfg: STORES.poke, sectionSrc: SECTION_SRC, people });
  const ok = await page.evaluate(stageCart, { cfg: STORES.poke, c: { title: D.title, protein: 'Choice of Protein: Fresh Salmon, Salmon Poke', price: D.price, street: '230 Brannan St', offerName: 'Ahi tuna bowl', offerNow: '$14.00', offerWas: '$17.50' } });
  log('cart staged', ok);
  await settleImages();
  const chk = page.getByText('Go to checkout', { exact: true }).first();
  const bb = await chk.boundingBox();
  await shoot('cart-poke', { host: 'ubereats.com', path: storePath('poke'), targets: { checkout: [Math.round((bb.x + bb.width / 2) * 10) / 10, Math.round((bb.y + bb.height / 2) * 10) / 10] } });
}

// ---- checks: no real store name or peanuts left in the page that was kept last (text and attributes)
const leaks = await page.evaluate(() => { // visible text, alt/aria/title/placeholder/href attributes (script data is not on screen)
  const c = document.documentElement.cloneNode(true); c.querySelectorAll('script, style, noscript').forEach((e) => e.remove());
  const h = c.outerHTML.replace(/ (srcset|src|style|class|d|points)="[^"]*"/g, '');
  return { bimi: (h.match(/bimi/gi) || []).length, peanut: (h.match(/peanut/gi) || []).length, sample: (h.match(/.{30}bimi.{30}/gi) || []).slice(0, 4) }; });
log('last page leaks', JSON.stringify(leaks));
await writeFile(path.join(OUT, 'pages.json'), JSON.stringify({ chat: 'lunch', pages }, null, 2) + '\n');
log('wrote pages.json');
await browser.close();
