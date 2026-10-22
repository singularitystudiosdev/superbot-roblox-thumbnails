// Live-run captures for the "subscriptions" chat: the REAL Stripe Customer Portal demo (https://billing.stripe.com/customer-portal-demo,
// Stripe's public demo business "Typographic"), walked through its real cancel flow once per made-up merchant (StreamBox, Reelhouse,
// FreshCrate, CloudVault) and staged by DOM edits only: business name (the logo image is hidden and the name text shown in its place),
// plan, price, dates, brand colours, customer email, card. Headless, public. The only non-GET allowed to billing.stripe.com is the
// demo's own test-mode "Cancel plan" request (a throw-away demo session, no money, no account); every other non-GET to it is aborted,
// nothing is bought, paid or saved, no payment form is opened. Stripe's own favicon (billing.stripe.com/favicon.ico) is the tab icon.
//   node sidebars.bdeb2397/tools/play-subscriptions-portal.4c8bc671.mjs
// Output: plays/subscriptions/portal-<m>{-home,,-confirm,-done,-cancelled}.webp (2940x1674) for m in streambox, reelhouse,
//         freshcrate, cloudvault + pages.portal.json + CREDITS.portal.txt + fav-stripe.png
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(ROOT + '/');
const { chromium } = require('playwright');
const OUT = path.join(ROOT, 'plays', 'subscriptions');
const TMP = path.join(tmpdir(), 'play-subscriptions-portal');
const DEMO = 'https://billing.stripe.com/customer-portal-demo';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true });

const EMAIL = 'jordan@quillnote.app';
// day = day of the month it renews; ord = its ordinal; offer = the demo's "10% off your next invoice" amount for that price
const M = {
  streambox: { name: 'StreamBox', plan: 'StreamBox Premium', price: '11.99', offer: '10.79', day: 6, ord: '6th', aside: [58, 40, 92], accent: [150, 118, 232], tok: 'sub_1QvK3dSbxPrm01aWpT7nLz2c', sec: 'test_YWNjdF8xUXZLM2RTYnhQcm0wMWFfVlRzYk14d1BsOWRRNHJaZThDdDJmS2o2QnU3WXhOMDBHaEhMNXpr0100aq3Dk8Uj' },
  reelhouse: { name: 'Reelhouse', plan: 'Reelhouse Standard', price: '15.49', offer: '13.94', day: 12, ord: '12th', aside: [112, 30, 46], accent: [240, 128, 116], tok: 'sub_1QvM8hRlhSt02bXqUe4oMy7d', sec: 'test_YWNjdF8xUXZNOGhSbGhTdDAyYlhfVWVyQ2p3OFpuM0t2SGVxTWw5Y1RkNEJvWXI2U2dQMDBiRmpYMHhz0100mL5Vc2Qe' },
  freshcrate: { name: 'FreshCrate', plan: 'Meal kit, 3 meals for 2', price: '26.99', offer: '24.29', day: 9, ord: '9th', aside: [38, 88, 62], accent: [124, 198, 122], tok: 'sub_1QvP2kFrcRt03cYrVf5pNz8e', sec: 'test_YWNjdF8xUXZQMmtGcmNSdDAzY1lfVmpFdTNHZDJzOEthWnlMbjdYcVBiQzlDd1RtMDBvSHRrNGJa0100vG8Wd4Rf' },
  cloudvault: { name: 'CloudVault', plan: '2 TB backup plan', price: '9.99', offer: '8.99', day: 3, ord: '3rd', aside: [28, 68, 118], accent: [106, 178, 238], tok: 'sub_1QvR6mCvlBk04dZsWg6qOa9f', sec: 'test_YWNjdF8xUXZSNm1DdmxCazA0ZFpfV2hIeDVMYzNuOVRwRXFZdThNZ0pyQjJkS2Y3QXdWMDBLcGRtNmpa0100zN2Xe6Sg' },
};
const IDS = Object.keys(M);

// every non-GET to billing.stripe.com except the demo's cancel request is aborted
const blocked = [], allowed = [];
const TITLE = (t, name) => (t ? t + ' | ' : '') + name + ' Billing';

// ---------- in-page staging (idempotent) ----------
const STAGE = ({ m, email }) => {
  const NOV = 'Nov ' + m.day + ', 2026', NOVL = 'November ' + m.day + ', 2026';
  const SUBS = [
    [/Nov 21 – Dec 21, 2026/g, 'Nov ' + m.day + ' – Dec ' + m.day + ', 2026'], [/Dec 21, 2026/g, 'Dec ' + m.day + ', 2026'],
    [/Nov 21, 2026/g, NOV], [/November 21, 2026/g, NOVL], [/Nov 21\b/g, 'Nov ' + m.day], [/the 21st/g, 'the ' + m.ord],
    [/Typographic Starter/g, m.plan], [/Typographic/g, m.name],
    [/\$10\.00/g, '$' + m.price], [/\$9\.00/g, '$' + m.offer],
    [/(•{4}|·{4}|[.]{4}) ?4242/g, '$1 4417'], [/\b4242\b/g, '4417'],
    [/No name provided/g, email], [/Hi, there/g, 'Hi, Jordan'],
  ];
  const sub = (s) => SUBS.reduce((a, [re, to]) => a.replace(re, to), s);
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { const t = sub(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; }
  document.querySelectorAll('[aria-label],[title],[alt]').forEach((e) => {
    for (const a of ['aria-label', 'title', 'alt']) { const v = e.getAttribute(a); if (v && sub(v) !== v) e.setAttribute(a, sub(v)); }
  });
  document.title = sub(document.title);
  // logo: Stripe shows the business name as text when no logo is set; hide the logo image, clone the nav label's classes for the name
  const label = document.querySelector('nav a span');
  document.querySelectorAll('img').forEach((im) => {
    if (!/^(Typographic|StreamBox|Reelhouse|FreshCrate|CloudVault)$/.test(im.alt) && !/Return to/.test(im.closest('a')?.getAttribute('aria-label') || '')) return;
    im.style.display = 'none'; im.removeAttribute('srcset');
    if (!im.parentElement.querySelector('[data-brand-name]')) {
      const s = document.createElement('span'); s.dataset.brandName = '1'; s.className = label.className; s.textContent = m.name;
      s.style.cssText = 'font-size:22px;font-weight:700;letter-spacing:-.2px;color:#fff;white-space:nowrap;display:inline-block;line-height:28px';
      im.parentElement.appendChild(s);
    }
    for (let p = im.parentElement, i = 0; p && i < 3; p = p.parentElement, i++) { p.style.width = 'auto'; p.style.maxWidth = 'none'; p.style.overflow = 'visible'; }
  });
  // brand colours (the merchant's sidebar + accent), replacing the demo's slate and pink
  const rgb = (a) => 'rgb(' + a.join(', ') + ')';
  const FROM = { 'rgb(83, 96, 126)': rgb(m.aside), 'rgb(192, 110, 196)': rgb(m.accent) };
  document.querySelectorAll('body *').forEach((e) => {
    const cs = getComputedStyle(e);
    if (FROM[cs.backgroundColor]) e.style.backgroundColor = FROM[cs.backgroundColor];
    if (/^linear-gradient\(rgb\(192, 110, 196\)/.test(cs.backgroundImage)) {
      // the plan's product tile: accent to a darker accent
      e.style.backgroundImage = 'linear-gradient(' + rgb(m.accent) + ', ' + rgb(m.accent.map((c) => Math.round(c * 0.8))) + ')';
    }
    // the active nav item: the sidebar colour lightened (the demo's is color(srgb 0.4267 0.47 0.57))
    if (/^color\(srgb 0\.42666/.test(cs.backgroundColor)) e.style.backgroundColor = rgb(m.aside.map((c) => Math.round(c + (255 - c) * 0.18)));
    if (FROM[cs.color]) e.style.color = FROM[cs.color];
    if (e instanceof SVGElement) for (const k of ['fill', 'stroke']) { const v = cs.getPropertyValue(k); if (FROM[v]) e.style.setProperty(k, FROM[v]); }
  });
};

const browser = await chromium.launch({ headless: true });
const results = {};
try {
  for (const id of IDS) {
    const m = M[id];
    const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Denver', userAgent: UA });
    const page = await ctx.newPage();
    await page.route('**/*', (route) => {
      const r = route.request();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method()) && /^https:\/\/billing\.stripe\.com\//.test(r.url())) {
        if (/\/subscription\/sub_[^/]+\/cancel|\/cancel/.test(r.url())) { allowed.push(r.method() + ' ' + r.url()); return route.continue(); }
        blocked.push(r.method() + ' ' + r.url()); return route.abort();
      }
      route.continue();
    });
    const settle = async () => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(2500); };
    const shot = async (key, ...targets) => {
      await page.mouse.move(5, 5);
      await page.evaluate(() => document.activeElement?.blur());
      await page.evaluate(STAGE, { m, email: EMAIL });
      await page.waitForTimeout(500);
      await page.evaluate(STAGE, { m, email: EMAIL });
      await page.evaluate(() => document.fonts.ready);
      const tgt = {};
      for (const [name, loc] of targets) {
        const b = await loc(page).first().boundingBox();
        if (!b) throw new Error(`${id}/${key}: target ${name} not found`);
        tgt[name] = [Math.round((b.x + b.width / 2) * 10) / 10, Math.round((b.y + b.height / 2) * 10) / 10];
      }
      const t = await page.title();
      const png = path.join(TMP, `${key}.png`);
      await page.screenshot({ path: png });
      execFileSync('cwebp', ['-q', '80', png, '-o', path.join(OUT, `${key}.webp`)], { stdio: 'pipe' });
      const u = new URL(page.url());
      results[key] = { img: `${key}.webp`, title: t, host: u.host, path: u.pathname + u.search, targets: tgt };
      console.log(key, JSON.stringify(results[key].targets), t);
    };
    try {
      // 1. walk the real flow, unstaged, to learn this session's URLs
      await page.goto(DEMO, { waitUntil: 'domcontentloaded' }); await settle();
      const homeUrl = page.url();
      await page.getByText('Typographic Starter').first().click(); await settle();
      const detailUrl = page.url();
      await page.getByText('Cancel plan').first().click(); await settle();
      const cancelUrl = page.url();
      if (!/\/cancel\?/.test(cancelUrl)) throw new Error('not on the cancel page: ' + cancelUrl);
      // made-up path: the demo's real shape with this merchant's made-up ids
      const fake = (u) => u.replace(/sub_[A-Za-z0-9]+/, m.tok).replace(/secret=[^&]+/, 'secret=' + m.sec);
      const reasonOpt = () => page.getByText('I no longer need it', { exact: true });
      const pick = async () => { await page.getByText('Choose an option').first().click(); await page.waitForTimeout(500); await reasonOpt().click(); await page.waitForTimeout(600); };
      const gofresh = async (u) => { await page.goto(u, { waitUntil: 'domcontentloaded' }); await settle(); };

      // 2. staged shots (every page loaded fresh from its real URL, so React never sees my edits mid-flow)
      await gofresh(homeUrl);
      await shot(`portal-${id}-home`, ['plan', (p) => p.getByText(m.plan, { exact: false }).first().or(p.getByText('Typographic Starter').first())]);
      await gofresh(detailUrl);
      await shot(`portal-${id}`, ['cancel', (p) => p.getByText('Cancel plan', { exact: true })], ['plan', (p) => p.locator('h1,h2').filter({ hasText: m.plan }).first()]);
      await gofresh(cancelUrl); await pick();
      await shot(`portal-${id}-confirm`, ['confirm', (p) => p.getByRole('button', { name: /^Cancel plan/ })], ['reason', (p) => p.getByText('I no longer need it', { exact: true }).first()]);
      // 3. really cancel in the demo session (unstaged), then shoot the pages it lands on
      await gofresh(cancelUrl); await pick();
      await page.getByRole('button', { name: /^Cancel plan/ }).click(); await settle();
      if (!/\/cancel\/confirmed/.test(page.url())) throw new Error('cancel did not land on /cancel/confirmed: ' + page.url());
      const doneUrl = page.url();
      await shot(`portal-${id}-done`, ['return', (p) => p.getByText('Return to Overview')], ['status', (p) => p.getByText('Access ends on')]);
      await gofresh(homeUrl);
      await shot(`portal-${id}-cancelled`, ['status', (p) => p.getByText(/^Cancels on /)], ['plan', (p) => p.getByText(m.plan).first()]);
      // address-bar paths: this session's real path shape, with the made-up ids
      for (const [k, u] of [[`portal-${id}-home`, homeUrl], [`portal-${id}`, detailUrl], [`portal-${id}-confirm`, cancelUrl], [`portal-${id}-done`, doneUrl], [`portal-${id}-cancelled`, homeUrl]]) {
        const f = new URL(fake(u)); results[k].path = f.pathname + f.search;
      }
    } catch (e) { console.error(`${id} FAILED`, e.stack); throw e; }
    finally { await ctx.close(); }
  }
} finally { await browser.close(); }

// ---------- favicon: Stripe's own (what the tab shows for a portal with no business icon) ----------
const ico = path.join(TMP, 'favicon.ico');
execFileSync('curl', ['-fsSL', 'https://billing.stripe.com/favicon.ico', '-o', ico]);
execFileSync('sips', ['-s', 'format', 'png', ico, '--out', path.join(OUT, 'fav-stripe.png')], { stdio: 'pipe' });

const pages = {};
for (const id of IDS) {
  const name = M[id].name;
  const T = { home: TITLE('', name), detail: TITLE('View subscription', name), confirm: TITLE('Cancel subscription', name), done: TITLE('Plan canceled', name) };
  const put = (key, title, extra) => { const r = results[key]; pages[key] = { img: r.img, title, host: r.host, path: r.path, fav: 'fav-stripe.png', targets: r.targets, scroll: null, field: null, ...extra }; };
  put(`portal-${id}`, T.detail);
  put(`portal-${id}-confirm`, T.confirm);
  put(`portal-${id}-cancelled`, T.home);
  put(`portal-${id}-home`, T.home);
  put(`portal-${id}-done`, T.done);
}
writeFileSync(path.join(OUT, 'pages.portal.json'), '{"chat":"subscriptions","pages":{\n' + Object.entries(pages).map(([k, v]) => JSON.stringify(k) + ':' + JSON.stringify(v)).join(',\n') + '\n}}\n');

const CREDITS = `Sources for the subscriptions chat's cancel-flow computer view pages (pages.portal.json). Never shown on screen.

Stripe Customer Portal demo (billing.stripe.com), https://billing.stripe.com/customer-portal-demo, Stripe's own public demo of its hosted
billing portal (demo business "Typographic", test mode), captured 2026-10-21 headless at 1470x837 CSS px, 2x, saved as WebP (cwebp -q 80)
by ../../tools/play-subscriptions-portal.4c8bc671.mjs. One fresh demo session per merchant (StreamBox, Reelhouse, FreshCrate, CloudVault),
walked through the portal's real flow: overview -> plan page -> "Cancel plan" -> review page (cancellation reason picked from the portal's own
list: "I no longer need it") -> "Cancel plan" -> "Plan canceled" -> overview showing the plan as Canceled. Each page was reloaded from its
real address, then staged in the page by DOM edits only:
  - business name: the logo image is hidden and the merchant's name shown as text in its place (Stripe shows the name when no logo is set);
    the sidebar and accent colours are set per merchant (the portal's own brand-colour slots)
  - plan name, price, billing day, renewal / cancel dates, the "10% off your next invoice" amounts on the review page (10% of the price)
  - customer: jordan@quillnote.app in the sidebar, "Hi, Jordan"; card Visa ending 4417 (the Harbor Card Services card)
  - the tab title uses the merchant name where Stripe shows the business name; the address-bar paths keep the portal's real shape
    (/p/session/subscriptions/sub_.../cancel?secret=...) with made-up ids and secrets
  - favicon: billing.stripe.com/favicon.ico (Stripe's own; the demo's per-business icon is the Typographic pilcrow, so it is not used)
Nothing was bought, paid, submitted or saved to anyone's account: the demo is a throw-away test-mode session, its one cancel request was
the only non-GET to billing.stripe.com allowed (every other one is aborted), no payment form was opened, and every browser context was closed after.
The four plans add up to the chat's "$64 saved a month" ($11.99 + $15.49 + $26.99 + $9.99 = $64.46).
  portal-<m>            the plan page: plan name, price, next bill date, Update plan / Cancel plan, upcoming payment, card
  portal-<m>-confirm    "Review your changes": plan stays active until the renewal date, reason selected, retention offer, Cancel plan
  portal-<m>-cancelled  the overview after cancelling: plan marked Canceled, "Cancels on <date>"
  portal-<m>-home       (extra) the overview before cancelling: plan card with price and next bill date
  portal-<m>-done       (extra) "Plan canceled" page the real flow shows between confirm and the overview
`;
writeFileSync(path.join(OUT, 'CREDITS.portal.txt'), CREDITS);
console.log('blocked:', blocked.length, blocked, '\nallowed:', allowed);
