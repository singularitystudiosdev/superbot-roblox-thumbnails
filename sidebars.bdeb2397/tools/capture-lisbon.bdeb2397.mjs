// Captures a real Google Hotels results page (hotels in Chiado, Lisbon, Nov 20 to 23 2026, 2 adults) in headless
// Chromium, then STAGES it with DOM edits only (nothing is ever booked) so it matches the
// "lisbon" chat in transcripts.bdeb2397.js: first result is a made-up "Casa do Chiado Hotel",
// 4.6 rating, free cancellation, $612 for 3 nights. Other results get made-up central Lisbon
// hotels. Output: screens/lisbon.webp (2940x1674) and screens/fav/hotels-site.png (64px).
//
// Run from the project root:  node sidebars.bdeb2397/tools/capture-lisbon.bdeb2397.mjs
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCREENS = join(HERE, '..', 'screens');
const OUT_WEBP = join(SCREENS, 'lisbon.webp');
const OUT_FAV = join(SCREENS, 'fav', 'hotels-site.png');
mkdirSync(join(SCREENS, 'fav'), { recursive: true });
const TMP = join(tmpdir(), 'lisbon-capture');
mkdirSync(TMP, { recursive: true });

// `ts` pins the place (Chiado, Lisbon), dates (2026-11-20 to 2026-11-23), 2 adults and USD, so the
// result is not at the mercy of Google's free-text geocoding (which once resolved to Laramie, WY).
const TS =
  'CAESCgoCCAMKAggDEAAaUAoyEi4yJDB4ZDE5MzQ3ZjAyYTYzOTBmOjB4ZTAwNTFjNTY2ZmRjMWU5NzoGQ2hpYWRvGgASGhIUCgcI6g8QCxgUEgcI6g8QCxgXGAMyAggBKgkKBToDVVNEGgA';
const URL = `https://www.google.com/travel/search?q=hotels%20in%20Chiado%20Lisbon&hl=en&gl=us&curr=USD&ts=${TS}`;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Made-up hotels, in list order. nightly x 3 = total. The first one is the booked hotel.
const HOTELS = [
  { name: 'Casa do Chiado Hotel', area: 'Chiado', nightly: 204, rating: '4.6', count: '(418)', stars: '4-star hotel', first: true },
  { name: 'Palacete da Baixa', area: 'Baixa', nightly: 187, rating: '4.4', count: '(912)', stars: '4-star hotel' },
  { name: 'Alfama Terraco Hotel', area: 'Alfama', nightly: 238, rating: '4.5', count: '(356)', stars: '4-star hotel' },
  { name: 'Casa Azul Bairro Alto', area: 'Bairro Alto', nightly: 163, rating: '4.3', count: '(642)', stars: '3-star hotel' },
  { name: 'Principe Real Suites', area: 'Principe Real', nightly: 276, rating: '4.7', count: '(203)', stars: '5-star hotel' },
  { name: 'Rua Augusta Boutique', area: 'Baixa', nightly: 219, rating: '4.4', count: '(527)', stars: '4-star hotel' },
  { name: 'Miradouro Alfama Residence', area: 'Alfama', nightly: 152, rating: '4.2', count: '(289)', stars: '3-star hotel' },
  { name: 'Largo do Carmo Hotel', area: 'Chiado', nightly: 311, rating: '4.6', count: '(774)', stars: '5-star hotel' },
  { name: 'Jardim do Principe', area: 'Principe Real', nightly: 198, rating: '4.5', count: '(331)', stars: '4-star hotel' },
  { name: 'Baixa Pombalina Inn', area: 'Baixa', nightly: 171, rating: '4.3', count: '(468)', stars: '3-star hotel' },
];

const browser = await chromium.launch({ headless: true });
try {
  const ctx = await browser.newContext({
    viewport: { width: 1470, height: 837 },
    deviceScaleFactor: 2,
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    userAgent: UA,
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Consent / cookie wall (not shown for en-US, but handle it if it is).
  for (const name of [/Reject all/i, /Accept all/i]) {
    const btn = page.getByRole('button', { name }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(2000);
      break;
    }
  }

  // Dates: the ts param sets Nov 20 to Nov 23; if the fields disagree, use the real date picker.
  const dates = async () =>
    (await page.getByRole('textbox', { name: /Check-in/i }).first().inputValue()) +
    '|' +
    (await page.getByRole('textbox', { name: /Check-out/i }).first().inputValue());
  if (!/Nov 20\|.*Nov 23/.test(await dates())) {
    await page.getByRole('textbox', { name: /Check-in/i }).first().click();
    await page.waitForTimeout(1000);
    await page.locator('[data-iso="2026-11-20"] [role=button]').first().click();
    await page.locator('[data-iso="2026-11-23"] [role=button]').first().click();
    await page.waitForTimeout(500);
    await page.locator('text=Done').first().click({ timeout: 3000 }).catch(() => {});
  }
  if (!/Nov 20\|.*Nov 23/.test(await dates())) throw new Error('dates not set: ' + (await dates()));
  await page.waitForSelector('.uaTTDe h2', { timeout: 30000 });
  await page.waitForTimeout(5000);

  // The Chiado query frames the map on Chiado / Baixa / Bairro Alto by itself.
  await page.mouse.move(300, 20);

  // ---- Staging: DOM edits only ----
  const staged = await page.evaluate((HOTELS) => {
    const log = [];
    const setText = (el, t) => { if (el) el.textContent = t; };
    const hide = (el) => { if (el) el.style.setProperty('display', 'none', 'important'); };

    // Sponsored carousel off, so the staged list sits at the top.
    const spon = [...document.querySelectorAll('span,div,h2')].find(
      (e) => e.children.length < 3 && /^Sponsored/.test(e.textContent.trim()) && e.textContent.length < 40,
    );
    let n = spon;
    for (let i = 0; i < 3 && n; i++) n = n.parentElement;
    if (n && n.tagName === 'C-WIZ' && !n.querySelector('.uaTTDe')) hide(n);

    // Results count heading.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let t;
    while ((t = walker.nextNode())) {
      if (/^(Chiado|Lisbon)\s·\s[\d,.K]+\sresults$/.test(t.textContent.trim())) { t.textContent = 'Chiado · 40 results'; log.push('heading'); }
    }

    // Hotel cards.
    // Vacation rentals are dropped so the list is hotels only.
    const all = [...document.querySelectorAll('.uaTTDe')].filter((c) => c.querySelector('h2.BgYkof'));
    const cards = [];
    for (const c of all) {
      const isHotel = [...c.querySelectorAll('.UqrZme')].some((e) => /star hotel/.test(e.textContent));
      if (isHotel) cards.push(c);
      else hide(c.parentElement && c.parentElement.tagName === 'C-WIZ' ? c.parentElement : c);
    }
    cards.forEach((card, i) => {
      const h = HOTELS[i % HOTELS.length];
      const total = h.nightly * 3;
      setText(card.querySelector('h2.BgYkof'), h.name);
      // Every "$nnn" text in the price column becomes the staged nightly price (deal or plain layout).
      const pw = card.querySelector('.PwV1Ac');
      const tw = document.createTreeWalker(pw, NodeFilter.SHOW_TEXT);
      let tn;
      while ((tn = tw.nextNode())) {
        const s = tn.textContent.trim();
        if (/^\$[\d,]+$/.test(s)) {
          tn.textContent = '$' + h.nightly;
          if (tn.parentElement) tn.parentElement.style.setProperty('color', '#202124', 'important');
        } else if (/^\$[\d,]+ nightly$/.test(s)) tn.textContent = `$${h.nightly} nightly`;
        else if (/^\$[\d,]+ total$/.test(s)) tn.textContent = `$${total} total`;
      }
      // Deal chips (on the photo and in the price column) go; the second price line becomes the total.
      for (const el of card.querySelectorAll('span,div')) {
        if (el.children.length === 0 && /^(GREAT )?DEAL$/.test(el.textContent.trim())) hide(el);
      }
      const sub = card.querySelector('.SZI0S');
      let hasTotal = false;
      const seen = (e) => !!e && e.getBoundingClientRect().height > 0;
      if (seen(sub)) {
        hasTotal = true;
        sub.textContent = `$${total} total`;
        sub.style.setProperty('color', '#5f6368', 'important');
      } else if (seen(pw.querySelector('.DPNIGe'))) {
        hasTotal = true;
        const d = pw.querySelector('.DPNIGe');
        const tl = document.createElement('div');
        tl.className = d.className;
        tl.textContent = `$${total} total`;
        d.parentElement.insertBefore(tl, d);
      }
      const jga = pw.querySelector('.JGa7fd') || pw;
      if (!hasTotal) {
        const tl = document.createElement('div');
        tl.className = 'fc-total';
        tl.textContent = `$${total} total`;
        tl.style.cssText = `font-size:12px;line-height:16px;text-align:right;color:${h.first ? '#202124' : '#5f6368'};font-weight:${h.first ? 500 : 400}`;
        jga.appendChild(tl);
      }
      if (h.first) {
        const host = jga;
        const f = document.createElement('div');
        f.textContent = 'Free cancellation';
        f.style.cssText = 'color:#188038;font-size:12px;line-height:16px;margin-top:2px;text-align:right;font-weight:500';
        host.appendChild(f);
        if (seen(sub)) { sub.style.setProperty('color', '#202124', 'important'); sub.style.fontWeight = '500'; }
      }
      setText(card.querySelector('.KFi5wf'), h.rating);
      setText(card.querySelector('.jdzyld'), ' ' + h.count);
      const loc = card.querySelector('.uTUoTb.pWBec');
      if (loc) loc.textContent = `${h.area} · Excellent location`;
      else {
        const slot = card.querySelector('.nlwZxb.ka7rWc');
        if (slot) {
          slot.textContent = `${h.area} · Excellent location`;
          slot.style.cssText = 'color:#1a73e8;font-size:12px';
        }
      }
      setText(card.querySelector('.UqrZme'), h.stars);
      const am = [...card.querySelectorAll('li .LtjZ2d')];
      if (h.first) {
        const first = ['Free cancellation', 'Free Wi-Fi', 'Breakfast ($)', 'Air conditioning', 'Bar', 'Restaurant', 'Pet-friendly', 'Fitness center'];
        am.forEach((el, j) => { el.textContent = first[j] || ''; });
      }
      for (const a of card.querySelectorAll('[aria-label]')) {
        const l = a.getAttribute('aria-label');
        if (l && /Brown|Avenue|Hotel|Prices starting/i.test(l) && !/Photo|Next|Previous/.test(l)) a.removeAttribute('aria-label');
      }
    });
    log.push('cards=' + cards.length);

    // Map pins: plausible central-Lisbon nightly prices, no stray popover or Update list chip.
    let k = 0;
    for (const pin of document.querySelectorAll('a.Kz2OTe')) {
      const price = pin.querySelector('.GIPbOc > div:last-child');
      if (price && /^\$\d/.test(price.textContent)) {
        price.textContent = '$' + (150 + ((k * 37 + 11) % 171));
        k++;
      }
    }
    log.push('pins=' + k);
    for (const el of document.querySelectorAll('button,span,div')) {
      if (el.children.length < 3 && /^Update list$/.test(el.textContent.trim())) {
        const box = el.closest('button') || el;
        hide(box.parentElement && box.parentElement.children.length === 1 ? box.parentElement : box);
      }
    }
    // Stage the first pin as the booked hotel price.
    return log;
  }, HOTELS);
  console.log('staged:', staged.join(' '));

  await page.waitForTimeout(800);
  const png = join(TMP, 'lisbon.png');
  await page.screenshot({ path: png, type: 'png' });
  execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', OUT_WEBP], { stdio: 'ignore' });
  console.log('wrote', OUT_WEBP);

  // Favicon: the site's own icon, 32px PNG from the page's <link rel=icon>.
  const favUrl = await page.evaluate(
    () => [...document.querySelectorAll('link[rel=icon]')].find((l) => l.sizes.value === '32x32')?.href,
  );
  const res = await ctx.request.get(favUrl || 'https://www.gstatic.com/travel-trips-fe/travel_logo_32.png');
  if (!res.ok()) throw new Error('favicon fetch failed: ' + res.status());
  writeFileSync(OUT_FAV, await res.body());
  console.log('wrote', OUT_FAV, favUrl);
} finally {
  await browser.close();
  rmSync(TMP, { recursive: true, force: true });
}
