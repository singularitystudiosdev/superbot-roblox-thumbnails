// Captures the item dialog and the guest cart for the first two Fridays of the "lunch" chat (transcripts.bdeb2397.js,
// key `lunch`): Menya Sora's spicy miso ramen (Oct 2, $19.80 with delivery) and La Esquina's tacos al pastor (Oct 9,
// $16.50 with delivery), the same way play-lunch.8889b4ff.mjs made item-poke / cart-poke for Poke Lab. Four 2x captures in
// plays/lunch/ (item-menya, cart-menya, item-esquina, cart-esquina), plus plays/lunch/pages.carts.json (title, host, path,
// cursor targets) and plays/lunch/CREDITS.carts.txt. plays/lunch/pages.json is not touched.
//
//   node sidebars.bdeb2397/tools/play-lunch-carts.4c8bc671.mjs              # all four
//   ONLY=menya node sidebars.bdeb2397/tools/play-lunch-carts.4c8bc671.mjs   # one place (menya | esquina); the other pages are kept
//
// Real site: ubereats.com in a throwaway headless Chromium, a guest, no login; the delivery address is typed into the
// home page's own address box (500 Howard St, San Francisco). Same real public store page as play-lunch (Bimi Poke, San
// Francisco), restaged by the same DOM edits (stageStore) as the place's store page, then its first menu item is opened
// (item dialog) and added to the guest cart (cart drawer). Item text, option names, prices and the cart lines are DOM text
// edits; the photos are crops of the chat's picture (chats/lunch-ramen.webp, lunch-tacos.webp). The guest cart holds one
// item in this throwaway browser. Never presses "Go to checkout", never signs in, pays, orders or submits anything: any
// non-GET request to an order-placing or payment endpoint is aborted.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, '..', 'package.json'));
const { chromium } = require('playwright');
const OUT = path.join(ROOT, 'plays', 'lunch');
const TMP = path.resolve(ROOT, '..', '.tmp', 'play-lunch-carts');
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

// what each place's item says; the real dialog (Bimi's first item, a poke bowl) is restaged text by text
const ITEMS = {
  menya: {
    title: 'Spicy miso ramen', price: '$15.50', pct: '97% (312)',
    desc: 'Pork chashu, soft egg, corn, scallion, bean sprouts, spicy miso broth. Contains wheat, egg, soy, sesame.',
    group: 'Choice of toppings', opts: ['Extra chashu', 'Soft egg', 'Menma'], picked: 'Choice of toppings: Soft egg, Menma',
    pop: ['Utensils, Spicy miso broth, Ramen noodles, Pork chashu, Soft egg, Corn, Scallion, Bean sprouts', 'No Utensils, Spicy miso broth, Ramen noodles, Pork chashu, Soft egg, Menma, Nori'],
    street: '412 Folsom St', offer: ['Tonkotsu ramen', '$13.00', '$16.25'],
  },
  esquina: {
    title: 'Tacos al pastor (3)', price: '$11.50', pct: '96% (405)',
    desc: 'Marinated pork, pineapple, onion, cilantro, corn tortillas, salsa verde. Contains no nuts.',
    group: 'Choice of salsa', opts: ['Salsa verde', 'Salsa roja', 'Pico de gallo'], picked: 'Choice of salsa: Salsa roja, Pico de gallo',
    pop: ['Utensils, Salsa verde, Corn tortillas, Pork al pastor, Pineapple, Onion, Cilantro', 'No Utensils, Salsa roja, Corn tortillas, Pork al pastor, Pineapple, Onion, Lime'],
    street: '1180 Mission St', offer: ['Carne asada tacos (3)', '$10.00', '$12.50'],
  },
};

// the item dialog of the store's first card, restaged as the place's dish (same edits as play-lunch's stageDialog)
function stageDialog({ cfg, d }) {
  const { fit, leafText } = window.__H;
  const dlg = document.querySelector('[role="dialog"]');
  const old = dlg.querySelector('[data-testid="menu-item-title"]').textContent;
  leafText(dlg, old, d.title);
  dlg.querySelector('[data-testid="menu-item-title"]').textContent = d.title;
  dlg.querySelector('[data-testid="menu-item-price"] [data-testid="rich-text"]').textContent = d.price;
  const desc = [...dlg.querySelectorAll('div')].find((e) => !e.children.length && /^The poke bowl comes with/.test(e.textContent)); desc.textContent = d.desc; desc.setAttribute('data-k', 'desc');
  const pct = [...dlg.querySelectorAll('div')].find((e) => !e.children.length && /^\d+% \(\d+\)$/.test(e.textContent.trim())); if (pct) pct.textContent = d.pct;
  const add = dlg.querySelector('[data-testid="add-to-cart-button"]');
  const wa = document.createTreeWalker(add, NodeFilter.SHOW_TEXT); let ta;
  while ((ta = wa.nextNode())) if (/^\$\d/.test(ta.nodeValue.trim())) ta.nodeValue = d.price;
  // "Most popular" order cards: the real ones list poke ingredients
  let pi = 0;
  dlg.querySelectorAll('[data-testid="rich-text"]').forEach((e) => { if (!e.children.length && /^(No )?Utensils, /.test(e.textContent)) e.textContent = d.pop[pi++ % d.pop.length]; });
  // the first option group (required, choose 2): its name and three options
  const leaves = [...dlg.querySelectorAll('div')].filter((e) => !e.children.length);
  const g = leaves.find((e) => e.textContent.trim() === 'Choice of Protein'); g.textContent = d.group;
  const map = { 'Fresh Salmon': d.opts[0], 'Tofu Cake': d.opts[1], 'Salmon Poke': d.opts[2] };
  const gi = leaves.indexOf(g);
  leaves.slice(gi, gi + 14).forEach((e) => { const t = e.textContent.trim(); if (map[t]) e.textContent = map[t]; });
  dlg.querySelectorAll('[data-testid="menu-item-image-0"] img').forEach((i) => fit(i, cfg.photo, cfg.first, false, [492, 492]));
  dlg.querySelectorAll('img').forEach((i, k) => { if (!i.src.startsWith('data:')) fit(i, cfg.photo, cfg.crops[k % cfg.crops.length], k % 2 === 1, [120, 120]); });
}

// the guest cart drawer (same edits as play-lunch's stageCart)
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
  [...root.querySelectorAll('*')].forEach((e) => { if (!e.children.length && /^Tofu Cake, Salmon Poke/.test(e.textContent.trim())) e.textContent = ''; });
  root.querySelectorAll('img').forEach((i, k) => {
    let a = i, banner = false; for (let d = 0; d < 4 && a; d++, a = a.parentElement) if (/Sign in to enjoy/.test(a.textContent) && !new RegExp(cfg.name + '|' + c.title.replace(/[()]/g, '.')).test(a.textContent)) banner = true;
    if (!banner && !i.src.startsWith('data:')) fit(i, cfg.photo, k === 0 ? [0.5, 0.5, 0.55] : cfg.first, false, [60, 60]);
  });
  return { ok: !!root, text: root.innerText };
}

// ---------------------------------------------------------------- driver
const browser = await chromium.launch({ headless: true });
// nothing is ordered, paid or submitted: a non-GET request to an order-placing / payment endpoint is aborted (the guest cart's own add-item calls go through)
const writes = [];
const newContext = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA });
  await ctx.route(/ubereats\.com\/.*(placeOrder|submitOrder|createOrder|completeOrder|processPayment|initiatePayment)/i, (r) => { if (r.request().method() !== 'GET') { writes.push(r.request().method() + ' ' + r.request().url()); return r.abort(); } return r.continue(); });
  return ctx;
};
let ctx = await newContext();
let page = await ctx.newPage();
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const PAGES_JSON = path.join(OUT, 'pages.carts.json');
let pages = {};
if (ONLY) { try { pages = JSON.parse(await readFile(PAGES_JSON, 'utf8')).pages; } catch (e) { console.error('no pages.carts.json to keep:', e.message); } }
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
  for (const name of ['Got it', 'Opt out']) { const b = page.getByRole('button', { name, exact: true }); if (await b.count()) { await b.first().click().catch((e) => log('dismiss', name, e.message)); break; } }
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
const box = (loc) => loc.evaluate((el) => { const r = el.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10]; });
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
const openDialog = async () => {
  await openStore();
  await page.locator('[data-testid^="store-item-"]').nth(0).click();
  await page.waitForSelector('[role="dialog"] [data-testid="add-to-cart-button"]');
  await page.waitForTimeout(1500);
};

try {
  const leakLog = [];
  for (const k of ['menya', 'esquina']) {
    if (ONLY && !ONLY.includes(k)) continue;
    const cfg = STORES[k], d = ITEMS[k];
    // each place gets a fresh browser context (a guest cart holds nothing yet, as in play-lunch)
    await ctx.close(); ctx = await newContext(); page = await ctx.newPage();
    await setAddress();
    // ---- item dialog
    await openDialog();
    await helpers();
    await page.evaluate(stageStore, { cfg, sectionSrc: SECTION_SRC, people });
    await page.evaluate(stageDialog, { cfg, d });
    await settleImages();
    const dlgText = await page.evaluate(() => document.querySelector('[role="dialog"]').innerText.slice(0, 600));
    log('dialog text:', JSON.stringify(dlgText));
    await shoot('item-' + k, { host: 'ubereats.com', path: storePath(k) + '&mod=quickView&modctx=' + modctx,
      targets: { desc: await box(page.locator('[role="dialog"] [data-k="desc"]')), add: await box(page.locator('[data-testid="add-to-cart-button"]').first()) } });
    // ---- cart: the guest picks the two required choices (a pair, utensils) the way the site asks; the cart is local to this throwaway browser
    await openDialog();
    const dlg = page.locator('[role="dialog"]');
    const incs = page.locator('[role="dialog"] [data-testid="quantity-increment-selection-button"]');
    await incs.nth(1).click(); await page.waitForTimeout(400); await incs.nth(2).click(); await page.waitForTimeout(400);
    await dlg.locator('[data-testid="customization-pick-one"]').first().click();
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /Add 1 to order/ }).click();
    await page.waitForTimeout(3500);
    await page.locator('[data-testid="view-carts-badge"]').click();
    await page.waitForSelector('[data-testid="cart-items-list"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await helpers();
    await page.evaluate(stageStore, { cfg, sectionSrc: SECTION_SRC, people });
    const r = await page.evaluate(stageCart, { cfg, c: { title: d.title, protein: d.picked, price: d.price, street: d.street, offerName: d.offer[0], offerNow: d.offer[1], offerWas: d.offer[2] } });
    log('cart staged', r.ok, JSON.stringify(r.text));
    await settleImages();
    const chk = page.getByText('Go to checkout', { exact: true }).first();
    await shoot('cart-' + k, { host: 'ubereats.com', path: storePath(k), targets: { checkout: await box(chk) } });
    // checks on the page just kept: no real store name or peanuts left (text and attributes; script data is not on screen)
    const leaks = await page.evaluate(() => {
      const c = document.documentElement.cloneNode(true); c.querySelectorAll('script, style, noscript').forEach((e) => e.remove());
      const h = c.outerHTML.replace(/ (srcset|src|href|style|class|d|points)="[^"]*"/g, '');
      return { bimi: (h.match(/bimi/gi) || []).length, peanut: (h.match(/peanut/gi) || []).length, sample: (h.match(/.{30}bimi.{30}/gi) || []).slice(0, 4) };
    });
    log(k, 'leaks', JSON.stringify(leaks));
  }
  log('non-GET order/payment requests aborted:', writes.length);
  await writeFile(PAGES_JSON, JSON.stringify({ chat: 'lunch', pages }, null, 2) + '\n');
  log('wrote pages.carts.json');
} catch (e) {
  console.error(e.stack || e);
  process.exitCode = 1;
  throw e;
} finally {
  await browser.close();
}
