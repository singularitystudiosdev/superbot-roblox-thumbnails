// Live-run captures for the "bike" chat's "Checked 3 local listing sites": the same search ("road bike 56cm", under $600,
// near Oakland CA) on two OTHER real local listing sites, so the computer view is not Craigslist only.
//   plays/bike/site-offerup.webp    OfferUp's real search results (signed out), Oakland, 20 miles, $600 and under
//   plays/bike/site-facebook.webp   Facebook Marketplace's real search results (signed out), Oakland, $600 max; the site's own
//                                   "See more on Facebook" login modal and its scrim removed by DOM
//   plays/bike/fav-offerup.png, fav-facebook.png   each site's own favicon
//   plays/bike/pages.sites.json, plays/bike/CREDITS.sites.txt
// Staging is DOM edits on the real pages only: the real listings (real photos, real titles) are kept as they are, the ones that
// are not a complete road bike are removed (helmet, BMX, frameset, "Bike Lot", $1 placeholder ...), seller towns farther than
// ~20 miles from Oakland are swapped for nearby ones, and the sponsored ad strip / login modal / scrim are removed. No title is
// rewritten, so every photo still matches its title. No listing has a seller name on the results page.
// eBay was tried first and answers headless Chromium with "HTTP 403 Error Page | eBay"; Nextdoor redirects to its login page.
// Headless chromium only, public pages, no account. Nothing is clicked, saved, sent or posted; every non-GET request to an
// order / checkout / payment / message endpoint is aborted as a precaution (none is ever triggered).
// Run: node sidebars.bdeb2397/tools/play-bike-sites.4c8bc671.mjs
import { createRequire } from 'node:module';
const require = createRequire('/Users/adrianagne/Documents/cosmos/projects/superbot-roblox-thumbnails/');
const { chromium } = require('playwright');
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const OUT = join(root, 'plays', 'bike');
mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';
const OFFERUP_URL = 'https://offerup.com/search?q=road%20bike%2056cm&PRICE_MAX=600&radius=20';
const FB_URL = 'https://www.facebook.com/marketplace/oakland/search?query=road%20bike%2056cm&maxPrice=600&exact=false';
const r1 = (n) => Math.round(n * 10) / 10;
const tmp = (n) => join(tmpdir(), 'playbikesites-' + n);
const toWebp = (png, out) => { execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', out], { stdio: 'ignore' }); rmSync(png, { force: true }); };
const centre = (r) => [r1(r[0] + r[2] / 2), r1(r[1] + r[3] / 2)];

// ---- OfferUp: keep these result tiles (index in the real result order), with a nearby town where the real one is >20 mi away ----
// real order: 0 56cm Road Bike $400 Piedmont | 1 Cannondale R800 56cm $400 SF | 2 Motobecane 7005 AL ... 56cm $250 San Ramon |
// 3 56cm Celeste Bianchi Alloro $440 Union City | (4 Cannondale R800 Optimo 3 dropped: the same photo as 1) | 7 Vintage Trek Road Bike $300 Union City |
// 13 Vintage Bianchi $500 Daly City | 14 Cannondale Serie 3 56 CM $500 Oakland | 16, 17 Cannondale R800 Optimo 3 | 18 Gestalt 56cm DISC $399 SF |
// 19 Trek Road Bike $100 Albany | 22 Fuji Roubix 56cm $550 Fremont | 26 Jamis Ventura 56 Cm $250 Vallejo | 27 Vilano T20 56cm $250 San Jose
const OU_KEEP = { 0: null, 1: null, 2: 'Alameda, CA', 3: 'Hayward, CA', 7: 'San Leandro, CA', 13: null, 14: null, 16: null, 17: null, 18: null, 19: null, 22: 'Berkeley, CA', 26: 'Emeryville, CA', 27: 'Alameda, CA' };
// ---- Facebook Marketplace: keep these tiles (real order), nearby town where the real one is far ----
// 0 LeMond Tourmalet 54-56cm $300 Oakland | 1 TREK 1.1 $250 Hercules | 2 Trek Alpha 2.1 105 56cm $375 Redwood City | 3 Fuji Newest 1.0 56/58cm $150 Fairfax |
// 4 Diamondback Century 1 $550 Stanford | 5 Giant Contend 3 L $400 SF | 6 Motobecane Fixie $375 SF | 7 Bike Lot (removed) | 8 Tommaso gravel (removed) |
// 9 Road bike 14 speed $150 Discovery Bay | 10 Cannondale Synapse $500 SF | 11 Trek 2100 $300 Martinez | 12 vintage Schwinn $125 SF | 13 58cm Raleigh Capri $150 SF
const FB_KEEP = { 0: null, 1: 'Richmond, CA', 2: 'Alameda, CA', 3: 'Berkeley, CA', 4: 'San Leandro, CA', 5: null, 6: null, 9: 'Hayward, CA', 10: null, 11: 'Albany, CA', 12: null, 13: null };

const browser = await chromium.launch({ headless: true });
const stray = /(checkout|payment|purchase|\/orders?(\/|$)|\/cart|\/messag|\/chat|sendmessage|makeoffer)/i; // tested on the URL path only (the sites' own search POSTs go to .../graphql)
async function newPage(cookies) {
  const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA });
  if (cookies) await ctx.addCookies(cookies);
  await ctx.route('**/*', (route) => { const rq = route.request(); if (rq.method() !== 'GET' && rq.method() !== 'HEAD' && rq.method() !== 'OPTIONS' && stray.test(new URL(rq.url()).pathname)) return route.abort(); return route.continue(); });
  const page = await ctx.newPage();
  return { ctx, page };
}
async function favicon(ctx, url, out) {
  const res = await ctx.request.get(url);
  if (!res.ok()) throw new Error(`favicon ${url}: HTTP ${res.status()}`);
  const raw = tmp('fav.' + (url.split('?')[0].split('.').pop() || 'ico'));
  writeFileSync(raw, await res.body());
  // an .ico carries several sizes: take the largest one up to 64px, written as a 64x64-or-smaller PNG
  const ids = execFileSync('magick', ['identify', '-format', '%w %p\n', raw]).toString().trim().split('\n').map((l) => l.split(' ').map(Number)).filter((a) => a[0] <= 64).sort((a, b) => b[0] - a[0]);
  const frame = ids.length ? ids[0][1] : 0;
  execFileSync('magick', [`${raw}[${frame}]`, '-resize', '64x64>', out]);
  rmSync(raw, { force: true });
}
const pages = {};

try {
  // ============================== 1. OfferUp ==============================
  {
    const loc = encodeURIComponent(JSON.stringify({ city: 'Oakland', state: 'CA', zipCode: '94610', longitude: -122.2481, latitude: 37.8116, source: 'ip' }));
    // OfferUp takes the search area from its location cookie (it guesses from the IP: here a headless machine in Wisconsin); set Oakland.
    const { ctx, page } = await newPage(['ou.location', 'ou.location.jobs', 'ou.location.business.posting'].map((name) => ({ name, value: loc, domain: 'offerup.com', path: '/' })));
    const resp = await page.goto(OFFERUP_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (!resp || resp.status() !== 200) throw new Error(`offerup: HTTP ${resp && resp.status()}`);
    await page.waitForSelector('a[data-testid="UnifiedListingTile"]', { timeout: 30000 });
    await page.waitForTimeout(3000);
    // scroll once through the results so every tile's lazy photo is loaded
    for (let k = 0; k < 20; k++) {
      await page.evaluate(() => window.scrollBy(0, 600)); await page.waitForTimeout(600);
      if ((await page.locator('a[data-testid="UnifiedListingTile"]').count()) > Math.max(...Object.keys(OU_KEEP).map(Number)) + 3 && k > 6) break;
    }
    await page.waitForTimeout(1500);
    const title = await page.title();
    if (!/near Oakland, CA/.test(title)) throw new Error('offerup: location is not Oakland: ' + title);
    const n = await page.evaluate(([keep]) => {
      const tiles = [...document.querySelectorAll('a[data-testid="UnifiedListingTile"]')];
      tiles.forEach((a, i) => {
        let w = a; while (w.parentElement && w.parentElement.tagName !== 'UL') w = w.parentElement; // the grid cell (child of the UL)
        if (!(i in keep)) { w.remove(); return; }
        const where = keep[i];
        if (where) {
          const spans = [...a.querySelectorAll('span')].filter((s) => /, CA$/.test(s.textContent) && s.children.length === 0);
          spans.forEach((s) => { s.textContent = where; });
          a.setAttribute('aria-label', a.getAttribute('aria-label').replace(/in [^,]+, CA/, 'in ' + where));
        }
        a.setAttribute('href', '#');
      });
      // empty grid cells and the full-width sponsored cell of each grid
      document.querySelectorAll('ul > div').forEach((d) => { if (!d.querySelector('a[data-testid="UnifiedListingTile"]')) d.remove(); });
      // sponsored "Shop related products" ad strip (third-party shop ads) and any other sponsored tile
      document.querySelectorAll('*').forEach((e) => { if (e.children.length === 0 && /^Sponsored/.test(e.textContent.trim())) { let c = e; while (c.parentElement && !c.parentElement.querySelector('a[data-testid="UnifiedListingTile"]')) c = c.parentElement; c.remove(); } });
      document.querySelectorAll('[class*="cookie" i], [id*="onetrust" i], [class*="banner" i], [class*="app-banner" i]').forEach((b) => b.remove());
      document.activeElement?.blur?.();
      window.scrollTo(0, 0);
      return document.querySelectorAll('a[data-testid="UnifiedListingTile"]').length;
    }, [OU_KEEP]);
    if (n !== Object.keys(OU_KEEP).length) throw new Error(`offerup: kept ${n} tiles, wanted ${Object.keys(OU_KEEP).length}`);
    await page.waitForTimeout(1200);
    const bad = await page.evaluate(() => [...document.querySelectorAll('a[data-testid="UnifiedListingTile"] img')].slice(0, 12).filter((i) => !i.complete || !i.naturalWidth).length + document.body.innerText.split('Sponsored').length - 1);
    if (bad) throw new Error(`offerup: ${bad} unloaded photos or sponsored leftovers`);
    // the first listing and the third one (both in the first row of the 5-column grid), centre of their card; the price filter's "to" box
    const t = await page.evaluate(() => {
      const c = (e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width, r.height]; };
      const tiles = [...document.querySelectorAll('a[data-testid="UnifiedListingTile"]')];
      const price = [...document.querySelectorAll('input')].find((i) => i.value === '$600');
      return { row1: c(tiles[0]), row2: c(tiles[2]), filter: price ? c(price) : null, vis: tiles.map((a) => Math.round(a.getBoundingClientRect().bottom)) };
    });
    if (!t.filter) throw new Error('offerup: price filter box not found');
    if (t.row1[1] > 837 || t.row2[1] > 837) throw new Error('offerup: listings not in view ' + JSON.stringify(t));
    await page.screenshot({ path: tmp('offerup.png'), clip: { x: 0, y: 0, width: 1470, height: 837 } });
    toWebp(tmp('offerup.png'), join(OUT, 'site-offerup.webp'));
    const iconHref = await page.evaluate(() => [...document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]')].map((l) => l.href).filter((h) => /\.png|\.ico/.test(h)).sort((a, b) => (/32|48/.test(b) ? 1 : 0) - (/32|48/.test(a) ? 1 : 0))[0]);
    await favicon(ctx, iconHref || 'https://offerup.com/favicon.ico', join(OUT, 'fav-offerup.png'));
    pages['site-offerup'] = {
      img: 'site-offerup.webp', title, host: 'offerup.com', path: '/search?q=road%20bike%2056cm&PRICE_MAX=600&radius=20', fav: 'fav-offerup.png',
      targets: { row1: [r1(t.row1[0]), r1(t.row1[1])], row2: [r1(t.row2[0]), r1(t.row2[1])], filter: [r1(t.filter[0]), r1(t.filter[1])] },
      scroll: null, field: null,
    };
    console.log('offerup', JSON.stringify(pages['site-offerup']), 'tile bottoms', t.vis.join(','));
    await ctx.close();
  }

  // ============================== 2. Facebook Marketplace ==============================
  {
    const { ctx, page } = await newPage();
    const resp = await page.goto(FB_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (!resp || resp.status() !== 200) throw new Error(`facebook: HTTP ${resp && resp.status()}`);
    await page.waitForSelector('a[href*="/marketplace/item/"] img', { timeout: 30000 });
    await page.waitForTimeout(5000);
    const title = await page.title();
    const r = await page.evaluate(([keep]) => {
      // login modal + its grey scrim (both belong to the signed-out page; nothing is typed or pressed)
      document.querySelectorAll('[role="dialog"]').forEach((d) => d.remove());
      document.querySelectorAll('div').forEach((d) => { const cs = getComputedStyle(d); if (cs.position === 'fixed' && /rgba\(244, 244, 244/.test(cs.backgroundColor) && d.children.length === 0) d.remove(); });
      [...document.querySelectorAll('div')].filter((d) => d.children.length < 4 && /^See more on Facebook/.test(d.innerText || '') && d.innerText.length < 200).forEach((d) => d.remove());
      document.querySelectorAll('[aria-hidden="true"]').forEach((e) => { if (e.matches('body *') && e.querySelector('a[href*="/marketplace/item/"]')) e.removeAttribute('aria-hidden'); });
      document.documentElement.style.overflow = ''; document.body.style.overflow = '';
      const as = [...document.querySelectorAll('a[href*="/marketplace/item/"]')];
      const seen = [];
      as.forEach((a, i) => {
        // the tile = the child of the grid container (the first ancestor with >= 10 children)
        let w = a; while (w.parentElement && w.parentElement.children.length < 10) w = w.parentElement;
        if (!(i in keep)) { w.remove(); return; }
        const where = keep[i];
        a.setAttribute('href', '#');
        if (where) {
          [...a.querySelectorAll('span')].filter((s) => s.children.length === 0 && /, CA$/.test(s.textContent)).forEach((s) => { s.textContent = where; });
          a.setAttribute('aria-label', a.getAttribute('aria-label').replace(/, [^,]+, CA, listing/, ', ' + where + ', listing'));
          const im = a.querySelector('img'); if (im) im.setAttribute('alt', im.getAttribute('alt').replace(/ in [^,]+, CA$/, ' in ' + where));
        }
        seen.push(a.getAttribute('aria-label'));
      });
      // location filter: "Within 40 mi" -> "Within 20 mi" (the chat asks for pickup within 20 miles)
      let lf = false;
      for (const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); tw.nextNode();) { if (/Within 40 mi/.test(tw.currentNode.nodeValue)) { tw.currentNode.nodeValue = tw.currentNode.nodeValue.replace('40 mi', '20 mi'); lf = true; } }
      document.activeElement?.blur?.();
      window.scrollTo(0, 0);
      return { seen, lf, dialogs: document.querySelectorAll('[role="dialog"]').length };
    }, [FB_KEEP]);
    if (!r.lf) throw new Error('facebook: "Within 40 mi" label not found');
    if (r.seen.length !== Object.keys(FB_KEEP).length) throw new Error(`facebook: kept ${r.seen.length} tiles, wanted ${Object.keys(FB_KEEP).length}`);
    await page.waitForTimeout(1500);
    const t = await page.evaluate(() => {
      const c = (e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width, r.height]; };
      const tiles = [...document.querySelectorAll('a[href="#"]')].filter((a) => a.querySelector('img') && /listing \d+/.test(a.getAttribute('aria-label') || ''));
      const price = [...document.querySelectorAll('input')].find((i) => i.value === '$600' || i.placeholder === '$600') || [...document.querySelectorAll('input')].filter((i) => i.getBoundingClientRect().y > 0 && i.getBoundingClientRect().x < 360)[1];
      return { n: tiles.length, row1: c(tiles[0]), row2: c(tiles[5]), filter: price ? c(price) : null, bad: tiles.slice(0, 12).filter((a) => !a.querySelector('img').complete || !a.querySelector('img').naturalWidth).length, loginText: /See more on Facebook/.test(document.body.innerText) };
    });
    if (!t.filter) throw new Error('facebook: price filter box not found');
    if (t.bad || t.loginText) throw new Error('facebook: ' + JSON.stringify(t));
    await page.screenshot({ path: tmp('facebook.png'), clip: { x: 0, y: 0, width: 1470, height: 837 } });
    toWebp(tmp('facebook.png'), join(OUT, 'site-facebook.webp'));
    const iconHref = await page.evaluate(() => [...document.querySelectorAll('link[rel~="icon"]')].map((l) => l.href)[0]);
    await favicon(ctx, iconHref || 'https://www.facebook.com/favicon.ico', join(OUT, 'fav-facebook.png'));
    pages['site-facebook'] = {
      img: 'site-facebook.webp', title, host: 'facebook.com', path: '/marketplace/oakland/search?query=road%20bike%2056cm&maxPrice=600&exact=false', fav: 'fav-facebook.png',
      targets: { row1: [r1(t.row1[0]), r1(t.row1[1])], row2: [r1(t.row2[0]), r1(t.row2[1])], filter: [r1(t.filter[0]), r1(t.filter[1])] },
      scroll: null, field: null,
    };
    console.log('facebook', JSON.stringify(pages['site-facebook']), r.seen.join(' || '));
    await ctx.close();
  }
} catch (e) {
  console.error(e.stack || e);
  await browser.close();
  throw e;
}
await browser.close();

writeFileSync(join(OUT, 'pages.sites.json'), JSON.stringify({ chat: 'bike', pages }, null, 2) + '\n');
writeFileSync(join(OUT, 'CREDITS.sites.txt'), `Sources for the bike chat's extra listing-site pages ("Checked 3 local listing sites"). Never shown on screen. Made 2026-10-21 by
../../tools/play-bike-sites.4c8bc671.mjs (headless Chromium, 1470x837 at 2x, cwebp -q 80). Public pages, no account, nothing clicked, saved or sent.

site-offerup.webp     offerup.com's real search results for "road bike 56cm", $600 and under, Oakland CA, 20 miles
                      (${OFFERUP_URL}), signed out.
                      The site guessed the search area from the capture machine's IP (Ripon, WI), so the tool sets OfferUp's own
                      "ou.location" cookie to Oakland, 94610. Staged by DOM edits: the real listings (real photos, real titles, real
                      prices, all under $600) are kept but only complete road bikes (no helmet, BMX, frameset, $1 placeholder, "Trek"
                      with no detail, a repeat listing of the same bike), 14 tiles; seller towns farther than ~20 miles from Oakland (San Ramon, Union City, Fremont,
                      Vallejo, San Jose) replaced by nearby ones (Alameda, Hayward, San Leandro, Berkeley, Emeryville); tile links
                      set to "#". No title was rewritten, so every photo matches its title. Removed: the sponsored "Shop related
                      products" ad strip. Listing tiles carry no seller names.
site-facebook.webp    facebook.com's real Marketplace search results for "road bike 56cm", Oakland, max $600
                      (${FB_URL}), signed out.
                      Staged by DOM edits: the site's own "See more on Facebook" login modal and its grey scrim removed (nothing typed
                      or pressed); 12 real tiles kept (real photos, titles, prices, all under $600; a "Bike Lot" and a gravel bike
                      removed); seller towns farther than ~20 miles (Hercules, Redwood City, Fairfax, Stanford, Discovery Bay,
                      Martinez) replaced by nearby ones; the location filter's "Within 40 mi" set to "Within 20 mi". No title was
                      rewritten. The signed-out header (email / password / Log In, Forgot Account?) is Facebook's own. No seller
                      names appear on the results page.
Tried and not used:   eBay (ebay.com/sch/i.html?_nkw=road+bike+56cm&_udhi=600&LH_LocalPickup=1) answers headless Chromium with
                      HTTP 403, page title "Error Page | eBay". Nextdoor redirects to nextdoor.com/login/ (hard login wall).
Favicons: fav-offerup.png (offerup.com) and fav-facebook.png (facebook.com), each the site's own, from its <link rel="icon">.
`);
console.log('wrote pages.sites.json, CREDITS.sites.txt');
