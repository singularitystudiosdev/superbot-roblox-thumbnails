// Captures the Google Flights results page for the "flights" sidebar chat (SFO to Tokyo, Mar 8 to 22, 2027, 1 adult,
// economy, round trip) in headless Chromium at 1470x837 CSS px, DSF 2, then STAGES the DOM with the chat's own figures
// (top result: nonstop SFO to NRT, 11:35 AM, $612; then $731 and $894 with 1 stop) before the screenshot. Nothing is
// clicked or booked. Also saves the site's favicon. Run: node sidebars.bdeb2397/tools/capture-flights.bdeb2397.mjs
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const screens = join(here, '..', 'screens');
mkdirSync(join(screens, 'fav'), { recursive: true });
const tmp = join(tmpdir(), 'gf-capture');
mkdirSync(tmp, { recursive: true });
const png = join(tmp, 'flights.png');
const OUT = join(screens, 'flights.webp');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const Q = 'Flights to TYO from SFO on 2027-03-08 through 2027-03-22 round trip economy 1 adult';
const URL = 'https://www.google.com/travel/flights?hl=en&gl=US&curr=USD&q=' + encodeURIComponent(Q);

const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
const ctx = await browser.newContext({
  viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA,
});
await ctx.addCookies([{ name: 'SOCS', value: 'CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg', domain: '.google.com', path: '/' }]);
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded' });

// consent / cookie dialog, if one shows up
for (const name of [/Reject all/i, /Accept all/i]) {
  const btn = page.getByRole('button', { name }).first();
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) { await btn.click().catch(() => {}); break; }
}
await page.waitForSelector('li.pIav2d [data-gs]', { timeout: 30000 });
await page.waitForTimeout(6000);

// ---- staging: DOM edits only ----
const staged = await page.evaluate(() => {
  const rows = [
    { logo: 'JL', air: 'Japan Airlines', dep: '11:35 AM', arr: '3:45 PM', plus: '+1', dur: '11 hr 10 min', route: ['SFO', 'NRT'], stops: 'Nonstop', lay: '', co2: '533 kg CO2e', badge: '-15% emissions', price: '$612' },
    { logo: 'DL', air: 'Delta', dep: '8:50 AM', arr: '5:35 PM', plus: '+1', dur: '15 hr 45 min', route: ['SFO', 'NRT'], stops: '1 stop', lay: '1 hr 25 min SEA', co2: '742 kg CO2e', badge: '', price: '$731' },
    { logo: 'AA', air: 'American, Japan Airlines', dep: '7:05 AM', arr: '5:50 PM', plus: '+1', dur: '17 hr 45 min', route: ['SFO', 'HND'], stops: '1 stop', lay: '3 hr 10 min LAX', co2: '688 kg CO2e', badge: '', price: '$894' },
    { logo: 'NH', air: 'ANA', dep: '11:05 AM', arr: '3:25 PM', plus: '+1', dur: '11 hr 20 min', route: ['SFO', 'NRT'], stops: 'Nonstop', lay: '', co2: '597 kg CO2e', badge: '', price: '$1,109' },
  ];
  const items = [...document.querySelectorAll('li.pIav2d')].slice(0, 4);
  const setText = (el, t) => { if (el) el.textContent = t; };
  const log = [];
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
      if (spans[1]) { const sup = spans[1].querySelector('.bOzv6'); spans[1].firstChild.textContent = r.arr; if (sup) sup.textContent = r.plus; }
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
      if (r.badge) rio.querySelectorAll('.rRrlfc').forEach((b) => (b.textContent = r.badge));
      else rio.style.visibility = 'hidden';
    }
    // the CO2 savings banner ("Avoids as much CO2e as ...") with its info icon, under the first row
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
    if (jm) jm.setAttribute('aria-label', `From ${r.price.replace(/[$,]/g, '')} US dollars round trip total. ${r.stops} flight with ${r.air}. Leaves San Francisco International Airport at ${r.dep} on Monday, March 8. Select flight`);
    log.push(li.innerText.replace(/\s+/g, ' ').slice(0, 160));
  });
  // drop every row after the four we staged (they would carry unedited real prices)
  [...document.querySelectorAll('li.pIav2d')].slice(4).forEach((li) => li.remove());

  // "Cheapest from $865" tab
  document.querySelectorAll('[data-gs][class*="hXU5Ud"]').forEach((el) => { el.textContent = '$612'; el.setAttribute('aria-label', '612 US dollars'); });
  // no loading spinner next to the Cheapest price
  document.querySelectorAll('.bU1Yvc > :not([data-gs])').forEach((el) => (el.style.display = 'none'));
  // price insight banner
  document.querySelectorAll('.frOi8').forEach((h) => { const s = h.querySelector('.gOatQ'); if (s) s.textContent = 'low'; });
  document.querySelectorAll('.N6WNxd').forEach((ic) => {
    if (/ic_price_typical/.test(ic.getAttribute('style') || '')) {
      ic.style.setProperty('--travel-primitives-themeable-image-default', 'url(https://www.gstatic.com/flights/app/ic_price_low_32px.svg)');
      ic.style.setProperty('--travel-primitives-themeable-image-dark', 'url(https://www.gstatic.com/flights/app/ic_price_low_32px.svg)');
    }
  });
  return log;
});
console.log(staged.join('\n'));
await page.waitForTimeout(1500);

const leaks = await page.evaluate(() => (document.body.innerText.match(/Your location|Based on your|Update location|Mountain View|Denver|Boulder/g) || []));
if (leaks.length) console.log('location text present:', leaks);
await page.screenshot({ path: png });
const title = await page.title();
const finalUrl = page.url();

// favicon: the tab icon Chrome would show
const iconHref = await page.evaluate(() => {
  const l = [...document.querySelectorAll('link[rel~="icon"]')].map((e) => ({ href: e.href, sizes: e.getAttribute('sizes') || '' }));
  return l;
});
console.log('icons', JSON.stringify(iconHref));
const pick = iconHref.find((l) => l.sizes === '128x128') || iconHref[0];
let fav = pick?.href || 'https://www.google.com/favicon.ico';
const res = await ctx.request.get(fav);
const raw = join(tmp, 'fav.raw');
writeFileSync(raw, await res.body());
await browser.close();

const favOut = join(screens, 'fav', 'google-flights.png');
execFileSync('sips', ['-s', 'format', 'png', '-z', '64', '64', raw, '--out', favOut], { stdio: 'ignore' });
execFileSync('cwebp', ['-q', '80', '-quiet', png, '-o', OUT]);
console.log(JSON.stringify({ title, finalUrl, fav, out: OUT }));
rmSync(raw, { force: true });
