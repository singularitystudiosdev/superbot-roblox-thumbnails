// Page captures for the live "flights" run (SFO to Tokyo, Mon Mar 8 to Mon Mar 22 2027, 1 adult, economy, round trip).
// Headless Chromium at 1470x837 CSS px, DSF 2. Each page is Google Flights' REAL page, reached the way Google really
// flows (results -> click the departing flight -> "Returning flights" -> click the return flight -> "Booking options"),
// then STAGED with DOM edits only (text, the site's own classes/attributes/CSS variables); nothing is booked: the
// airline's "Continue" button is never pressed. Extends capture-flights.bdeb2397.mjs.
// Writes ../plays/flights/{results-894,results-731,results-612,returning,booking}.webp and ../plays/flights/pages.json.
// Run: node sidebars.bdeb2397/tools/play-flights.8889b4ff.mjs
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'plays', 'flights');
mkdirSync(OUT, { recursive: true });
const tmp = join(tmpdir(), 'gf-play');
mkdirSync(tmp, { recursive: true });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const Q = 'Flights to TYO from SFO on 2027-03-08 through 2027-03-22 round trip economy 1 adult';
const URL = 'https://www.google.com/travel/flights?hl=en&gl=US&curr=USD&q=' + encodeURIComponent(Q);

// ---- the staged flights (the chat's figures) ----
const F = {
  jal612: { logo: 'JL', air: 'Japan Airlines', dep: '11:35 AM', arr: '3:45 PM', plus: '+1', dur: '11 hr 10 min', route: ['SFO', 'NRT'], stops: 'Nonstop', lay: '', co2: '533 kg CO2e', badge: '-15% emissions', price: '$612' },
  dl731: { logo: 'DL', air: 'Delta', dep: '8:50 AM', arr: '5:35 PM', plus: '+1', dur: '15 hr 45 min', route: ['SFO', 'NRT'], stops: '1 stop', lay: '1 hr 25 min SEA', co2: '742 kg CO2e', badge: '', price: '$731' },
  aa894: { logo: 'AA', air: 'American, Japan Airlines', dep: '7:05 AM', arr: '5:50 PM', plus: '+1', dur: '17 hr 45 min', route: ['SFO', 'HND'], stops: '1 stop', lay: '3 hr 10 min LAX', co2: '688 kg CO2e', badge: '', price: '$894' },
  nh1109: { logo: 'NH', air: 'ANA', dep: '11:05 AM', arr: '3:25 PM', plus: '+1', dur: '11 hr 20 min', route: ['SFO', 'NRT'], stops: 'Nonstop', lay: '', co2: '597 kg CO2e', badge: '', price: '$1,109' },
  ua1144: { logo: 'UA', air: 'United', dep: '10:45 AM', arr: '3:05 PM', plus: '+1', dur: '11 hr 20 min', route: ['SFO', 'NRT'], stops: 'Nonstop', lay: '', co2: '538 kg CO2e', badge: '-14% emissions', price: '$1,144' },
  jl1168: { logo: 'JL', air: 'Japan Airlines', dep: '12:55 PM', arr: '5:20 PM', plus: '+1', dur: '11 hr 25 min', route: ['SFO', 'HND'], stops: 'Nonstop', lay: '', co2: '653 kg CO2e', badge: '', price: '$1,168' },
};
const RESULTS = {
  'results-894': { cheapest: '$894', insight: 'typical', rows: [F.aa894, F.nh1109, F.ua1144, F.jl1168] },
  'results-731': { cheapest: '$731', insight: 'typical', rows: [F.dl731, F.aa894, F.nh1109, F.ua1144] },
  'results-612': { cheapest: '$612', insight: 'low', rows: [F.jal612, F.dl731, F.aa894, F.nh1109] },
};
// returning flights (NRT to SFO, Mon Mar 22); price is the round-trip total with the $612 outbound
const RET = [
  { logo: 'JL', air: 'Japan Airlines', dep: '5:30 PM', arr: '10:45 AM', plus: '', dur: '9 hr 15 min', route: ['NRT', 'SFO'], stops: 'Nonstop', lay: '', co2: '402 kg CO2e', badge: '-22% emissions', price: '$612' },
  { logo: 'NH', air: 'ANA', dep: '5:55 PM', arr: '11:20 AM', plus: '', dur: '9 hr 25 min', route: ['NRT', 'SFO'], stops: 'Nonstop', lay: '', co2: '431 kg CO2e', badge: '-14% emissions', price: '$648' },
  { logo: 'UA', air: 'United', dep: '4:35 PM', arr: '10:05 AM', plus: '', dur: '9 hr 30 min', route: ['NRT', 'SFO'], stops: 'Nonstop', lay: '', co2: '448 kg CO2e', badge: '', price: '$683' },
];

const SHOT = {}; // id -> { title, url, targets }

// ---- in-page staging helpers (serialised into page.evaluate) ----
const STAGE_ROWS = ({ rows, o }) => {
  const setText = (el, t) => { if (el) el.textContent = t; };
  let items = [...document.querySelectorAll('li.pIav2d')];
  if (o.cloneTo) while (items.length < o.cloneTo) { const c = items[0].cloneNode(true); items[items.length - 1].after(c); items = [...document.querySelectorAll('li.pIav2d')]; }
  items.slice(rows.length).forEach((li) => li.remove());
  items = items.slice(0, rows.length);
  items.forEach((li, i) => {
    const r = rows[i];
    li.querySelectorAll('.EbY4Pc').forEach((el) => {
      el.style.setProperty('--travel-primitives-themeable-image-default', `url(https://www.gstatic.com/flights/airline_logos/70px/${r.logo}.png)`);
      el.style.setProperty('--travel-primitives-themeable-image-dark', `url(https://www.gstatic.com/flights/airline_logos/70px/dark/${r.logo}.png)`);
    });
    const main = li.querySelector('.OgQvJf') || li;
    const times = main.querySelector('.zxVSec');
    if (times) {
      const spans = times.querySelectorAll('span[role="text"]');
      if (spans[0]) spans[0].textContent = r.dep;
      if (spans[1]) {
        const sup = spans[1].querySelector('.bOzv6');
        spans[1].firstChild.textContent = r.arr;
        if (sup) { if (r.plus) sup.textContent = r.plus; else sup.remove(); } else if (r.plus) { const s = document.createElement('span'); s.className = 'bOzv6'; s.textContent = r.plus; spans[1].append(s); }
      }
    }
    setText(main.querySelector('.Ir0Voe > .sSHqwe'), r.air);
    setText(main.querySelector('.gvkrdb'), r.dur);
    const rs = main.querySelectorAll('.PTuQse .QylvBf span[aria-label=""]');
    if (rs[0]) rs[0].textContent = r.route[0];
    if (rs[1]) rs[1].textContent = r.route[1];
    setText(main.querySelector('.EfT7Ae span'), r.stops);
    const lay = main.querySelector('.BbR8Ec .sSHqwe');
    if (lay) lay.textContent = r.lay;
    setText(main.querySelector('.O7CXue div'), r.co2);
    const rio = main.querySelector('.RioxB');
    if (rio) {
      if (r.badge) { rio.style.visibility = ''; rio.querySelectorAll('.rRrlfc').forEach((b) => (b.textContent = r.badge)); }
      else rio.style.visibility = 'hidden';
      const info = rio.querySelector('[aria-label^="Carbon emissions estimate"]');
      if (info) info.setAttribute('aria-label', `Carbon emissions estimate: ${parseInt(r.co2)} kilograms. ${r.badge || 'Avg emissions'}. Learn more about this emissions estimate`);
    }
    // the CO2 savings banner ("Avoids as much CO2e as ...") under a row
    li.querySelectorAll('*').forEach((el) => {
      if (el.children.length === 0 && /^Avoids/.test(el.textContent.trim())) {
        let n = el;
        while (n.parentElement && n.parentElement !== li && n.parentElement.textContent.trim().length < 100) n = n.parentElement;
        n.style.display = 'none';
      }
    });
    const price = li.querySelector('[data-gs]');
    if (price) { price.textContent = r.price; price.setAttribute('aria-label', r.price.replace('$', '') + ' US dollars'); }
    const jm = li.querySelector('.JMc5Xc');
    if (jm) jm.setAttribute('aria-label', `From ${r.price.replace(/[$,]/g, '')} US dollars round trip total. ${r.stops} flight with ${r.air}. ${o.verb} ${o.from} at ${r.dep} on ${o.day}. Select flight`);
  });
  return items.map((li) => li.innerText.replace(/\s+/g, ' ').slice(0, 150));
};

const STAGE_INSIGHT = (word) => {
  const iconUrl = word === 'low' ? 'https://www.gstatic.com/flights/app/ic_price_low_32px.svg' : null;
  document.querySelectorAll('.frOi8').forEach((h) => { const s = h.querySelector('.gOatQ'); if (s) s.textContent = word; });
  if (iconUrl) document.querySelectorAll('.N6WNxd').forEach((ic) => {
    if (/ic_price_typical/.test(ic.getAttribute('style') || '')) {
      ic.style.setProperty('--travel-primitives-themeable-image-default', `url(${iconUrl})`);
      ic.style.setProperty('--travel-primitives-themeable-image-dark', `url(${iconUrl})`);
    }
  });
};

// ---- browser ----
const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
async function fresh() {
  const ctx = await browser.newContext({
    viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA,
  });
  await ctx.addCookies([{ name: 'SOCS', value: 'CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg', domain: '.google.com', path: '/' }]);
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  for (const name of [/Reject all/i, /Accept all/i]) {
    const btn = page.getByRole('button', { name }).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) { await btn.click().catch(() => {}); break; }
  }
  await page.waitForSelector('li.pIav2d [data-gs]', { timeout: 30000 });
  await page.waitForTimeout(6000);
  return { ctx, page };
}
const rect = (sel, idx = 0) => `(()=>{const e=document.querySelectorAll(${JSON.stringify(sel)})[${idx}];if(!e)return null;const r=e.getBoundingClientRect();return [Math.round((r.left+r.width/2)*10)/10,Math.round((r.top+r.height/2)*10)/10];})()`;

async function save(page, id, targets) {
  await page.waitForTimeout(1200);
  const png = join(tmp, id + '.png');
  await page.screenshot({ path: png });
  execFileSync('cwebp', ['-q', '80', '-quiet', png, '-o', join(OUT, id + '.webp')]);
  const u = new globalThis.URL(page.url());
  const t = {};
  for (const [k, expr] of Object.entries(targets)) t[k] = await page.evaluate(expr);
  const leaks = await page.evaluate(() => (document.body.innerText.match(/Your location|Based on your|Update location|Mountain View|Denver|Boulder/g) || []));
  SHOT[id] = { title: await page.title(), host: u.host.replace(/^www\./, ''), path: u.pathname + u.search, targets: t, leaks };
  console.log(id, JSON.stringify(SHOT[id]).slice(0, 400));
}

// ---- 1-3: the results page in three states ----
for (const [id, S] of Object.entries(RESULTS)) {
  const { ctx, page } = await fresh();
  const log = await page.evaluate(STAGE_ROWS, { rows: S.rows, o: { verb: 'Leaves', from: 'San Francisco International Airport', day: 'Monday, March 8' } });
  await page.evaluate((c) => {
    document.querySelectorAll('[data-gs][class*="hXU5Ud"]').forEach((el) => { el.textContent = c; el.setAttribute('aria-label', c.replace('$', '') + ' US dollars'); });
    document.querySelectorAll('.bU1Yvc > :not([data-gs])').forEach((el) => (el.style.display = 'none'));
  }, S.cheapest);
  await page.evaluate(STAGE_INSIGHT, S.insight);
  console.log(log.join('\n'));
  await save(page, id, { row1: rect('li.pIav2d'), price1: rect('li.pIav2d [data-gs]') });
  await ctx.close();
}

// ---- 4-5: returning flights and booking options, reached by really clicking (nothing is bought) ----
{
  const { ctx, page } = await fresh();
  await page.locator('li.pIav2d .yR1fYc').first().click({ force: true, timeout: 8000 });
  await page.waitForSelector('text=Returning flights', { timeout: 20000 });
  await page.waitForSelector('li.pIav2d [data-gs]', { timeout: 20000 });
  await page.waitForTimeout(5000);

  // real strings of the departing flight on the trip-summary chip are kept (only logo + tooltip are re-staged below)
  const out = F.jal612;
  await page.evaluate(({ rows, out }) => {
    // trip summary chip: departing flight now JAL
    const chip = document.querySelector('li.vg5jMc .t1Dekd');
    if (chip) {
      chip.style.setProperty('--travel-primitives-themeable-image-default', `url(https://www.gstatic.com/flights/airline_logos/70px/${out.logo}.png)`);
      chip.style.setProperty('--travel-primitives-themeable-image-dark', `url(https://www.gstatic.com/flights/airline_logos/70px/dark/${out.logo}.png)`);
    }
    const tip = document.querySelector('li.vg5jMc .nMn1kb'); if (tip) tip.firstChild.textContent = `${out.dep}–${out.arr}`;
    const tip2 = document.querySelector('li.vg5jMc .KryVnb'); if (tip2) tip2.firstChild.textContent = out.stops;
    const dur = tip2 && [...tip2.childNodes].filter((n) => n.nodeType === 3); if (dur) { dur[0].textContent = out.stops; if (dur[1]) dur[1].textContent = out.dur; if (dur[2]) dur[2].textContent = out.air; }
    document.querySelectorAll('.HeMQ4[aria-live]').forEach((e) => (e.textContent = `${rows.length} results returned.`));
  }, { rows: RET, out });
  const log = await page.evaluate(STAGE_ROWS, { rows: RET, o: { cloneTo: RET.length, verb: 'Leaves', from: 'Narita International Airport', day: 'Monday, March 22' } });
  console.log(log.join('\n'));
  await save(page, 'returning', { row1: rect('li.pIav2d') });

  // select the real first return row -> the real booking page
  await ctx.close();
}
{
  const { ctx, page } = await fresh();
  await page.locator('li.pIav2d .yR1fYc').first().click({ force: true, timeout: 8000 });
  await page.waitForSelector('text=Returning flights', { timeout: 20000 });
  await page.waitForSelector('li.pIav2d [data-gs]', { timeout: 20000 });
  await page.waitForTimeout(4000);
  await page.locator('li.pIav2d .yR1fYc').first().click({ force: true, timeout: 8000 });
  await page.waitForSelector('text=Booking options', { timeout: 25000 });
  await page.waitForSelector('button[aria-label^="Continue to book"]', { timeout: 20000 });
  await page.waitForTimeout(5000);

  const staged = await page.evaluate(({ OUT_, RET_ }) => {
    // 1) read the real strings of the two selected flights off the page
    const slices = [...document.querySelectorAll('.E2ZmUe')];
    const read = (s) => {
      const sp = s.querySelectorAll('.zxVSec span[role="text"]');
      const arr = sp[1] ? sp[1].cloneNode(true) : null; if (arr) arr.querySelectorAll('.bOzv6').forEach((x) => x.remove());
      const logo = (s.querySelector('.EbY4Pc').getAttribute('style').match(/70px\/([A-Z0-9]+)\.png/) || [])[1];
      return { dep: sp[0].textContent.trim(), arr: arr.textContent.trim(), air: s.querySelector('.Ir0Voe > .sSHqwe').textContent.trim(), dur: s.querySelector('.gvkrdb').textContent.trim(), co2: s.querySelector('.O7CXue div').textContent.trim(), badge: (s.querySelector('.rRrlfc') || {}).textContent, logo };
    };
    const real = [read(slices[0]), read(slices[1])];
    const realPrice = document.querySelector('.oPtD1').textContent.trim();
    const to = [OUT_, RET_];
    // 2) one pass text/attribute replacement (single regexp: no chaining between swaps)
    const map = new Map();
    const add = (a, b) => { if (a && b && a !== b) map.set(a, b); };
    for (let i = 0; i < 2; i++) {
      const r = real[i], t = to[i];
      add(r.dep, t.dep); add(r.arr, t.arr); add(r.air, t.air); add(r.dur, t.dur); add(r.co2, t.co2); add(r.badge, t.badge);
      add(parseInt(r.co2) + ' kilograms', parseInt(t.co2) + ' kilograms');
    }
    add(realPrice, '$612'); add(realPrice.replace(/[$,]/g, '') + ' US dollars', '612 US dollars');
    const keys = [...map.keys()].sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const re = new RegExp(keys.join('|'), 'g');
    const sub = (s) => s.replace(re, (m) => map.get(m));
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => { const v = n.nodeValue; if (re.test(v)) { re.lastIndex = 0; n.nodeValue = sub(v); } re.lastIndex = 0; });
    document.querySelectorAll('*').forEach((el) => {
      for (const a of ['aria-label', 'title']) { const v = el.getAttribute && el.getAttribute(a); if (v) { re.lastIndex = 0; if (re.test(v)) el.setAttribute(a, sub(v)); re.lastIndex = 0; } }
    });
    // 3) airline logos + return-flight time shift ("+1" belongs to the outbound only; the return row shows none)
    for (let i = 0; i < 2; i++) {
      slices[i].querySelectorAll('.EbY4Pc').forEach((el) => {
        el.style.setProperty('--travel-primitives-themeable-image-default', `url(https://www.gstatic.com/flights/airline_logos/70px/${to[i].logo}.png)`);
        el.style.setProperty('--travel-primitives-themeable-image-dark', `url(https://www.gstatic.com/flights/airline_logos/70px/dark/${to[i].logo}.png)`);
      });
    }
    document.querySelectorAll('.MnHIn, .wxoHzc').forEach((el) => {
      el.style.setProperty('--travel-primitives-themeable-image-default', `url(https://www.gstatic.com/flights/airline_logos/70px/${to[0].logo}.png)`);
      el.style.setProperty('--travel-primitives-themeable-image-dark', `url(https://www.gstatic.com/flights/airline_logos/70px/dark/${to[0].logo}.png)`);
    });
    // 4) price insight: $612 is low (marker in the green end of the bar)
    document.querySelectorAll('.frOi8 .gOatQ').forEach((s) => (s.textContent = 'low'));
    document.querySelectorAll('.pfRj6 strong').forEach((s) => (s.textContent = 'low'));
    document.querySelectorAll('.N6WNxd').forEach((ic) => {
      if (/ic_price_typical/.test(ic.getAttribute('style') || '')) {
        ic.style.setProperty('--travel-primitives-themeable-image-default', 'url(https://www.gstatic.com/flights/app/ic_price_low_32px.svg)');
        ic.style.setProperty('--travel-primitives-themeable-image-dark', 'url(https://www.gstatic.com/flights/app/ic_price_low_32px.svg)');
      }
    });
    const mk = document.querySelector('.pfRj6'); if (mk) { mk.style.left = '9%'; mk.className = 'pfRj6'; }
    return { real, realPrice, map: [...map.entries()] };
  }, { OUT_: F.jal612, RET_: RET[0] });
  console.log(JSON.stringify(staged));
  await save(page, 'booking', { continue: rect('button[aria-label^="Continue to book"]') });
  await ctx.close();
}

// favicon: reuses screens/fav/google-flights.png (made by capture-flights.bdeb2397.mjs)
const pages = {};
for (const [id, v] of Object.entries(SHOT)) {
  pages[id] = { img: id + '.webp', title: v.title, host: v.host, path: v.path, fav: '../../screens/fav/google-flights.png', targets: v.targets, scroll: null, field: null };
}
writeFileSync(join(OUT, 'pages.json'), JSON.stringify({ chat: 'flights', pages }, null, 1) + '\n');
await browser.close();
