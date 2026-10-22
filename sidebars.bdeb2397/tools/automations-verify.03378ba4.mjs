// Drives the Automations tab headlessly and fails on anything off: the sidebar's Automations row opens it over the chat
// and the live view with the creative's own two automations, the Roblox Thumbnail and Icon Optimizers; the search
// narrows the grid (a space is typed, not taken as the spot's pause) and the app categories to what it reaches ("game
// design" offers Roblox); picking a category narrows the grid to its app and keeps it in sight when a search no longer
// reaches it; an unmatched query shows the empty state, whose Prompt your own! opens the live chat as New chat does, and
// the field's clear button brings every card back; a press on a card opens it in full (automation-detail.71c311e9.js)
// over the tab and Escape closes it, focus back on the card, every automation's ratings by star coming to its card's
// rating and to one per 25 uses; Try Me! returns to the chat with the open chat current again; ?tab=automations opens it at load; ?state=loading shows skeleton cards and
// categories. Also fails on a console error, a broken image, a card whose title row or footer overflows, a label in its
// own fill's color, or a thumbnail used twice. Screenshots and a report go to ../renders/.
// node sidebars.bdeb2397/tools/automations-verify.03378ba4.mjs http://localhost:5297/ [view.03378ba4.html | view.html]
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [BASE = 'http://localhost:5297/', VIEW = 'view.03378ba4.html'] = process.argv.slice(2);
const OUT = fileURLToPath(new URL('../renders/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const PAGE = `${BASE}sidebars.bdeb2397/${VIEW}`;
const browser = await chromium.launch({ headless: true });
const report = [];

function check(name, ok, detail = {}) {
  report.push({ name, ok: Boolean(ok), ...detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${Object.keys(detail).length ? ` ${JSON.stringify(detail)}` : ''}`);
}

async function open(query) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${PAGE}${query}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  return { page, errors };
}

const state = (page) => page.evaluate(() => {
  const tab = document.querySelector('.am');
  const cards = [...document.querySelectorAll('.am-card[data-id]')];
  return {
    open: !tab.hidden && getComputedStyle(tab).display !== 'none',
    shown: cards.filter((c) => !c.hidden).map((c) => c.dataset.id),
    count: document.querySelector('.am-count').textContent,
    empty: !document.querySelector('.am-empty').hidden,
    titles: cards.map((c) => c.querySelector('.am-title').textContent),
    current: document.querySelector('.sb [aria-current="page"]')?.getAttribute('href'),
    value: document.querySelector('.am-search input').value,
    // the categories on offer and the ones picked, by app id ("" is All)
    chips: [...document.querySelectorAll('.am-cats button.am-chip')].map((c) => c.dataset.app).filter(Boolean),
    picked: [...document.querySelectorAll('.am-cats button.am-chip[aria-pressed="true"]')].map((c) => c.dataset.app).filter(Boolean),
    allApps: document.querySelector('.am-cats button.am-chip[data-app=""]')?.getAttribute('aria-pressed') === 'true',
  };
});

const audit = (page) => page.evaluate(() => {
  const thumbs = [...document.querySelectorAll('.am-thumb')].map((img) => img.getAttribute('src'));
  return {
    broken: [...document.querySelectorAll('.am img')].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.getAttribute('src')),
    overflow: [...document.querySelectorAll('.am-card:not([hidden]) .am-head, .am-card:not([hidden]) .am-foot, .am-search')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.closest('.am-card')?.dataset.id ?? 'search'),
    // a title shown whole, never cut off at its two lines
    cutTitles: [...document.querySelectorAll('.am-card:not([hidden]) .am-title')].filter((el) => el.scrollHeight > el.clientHeight + 1).map((el) => el.textContent),
    // a label drawn in its own fill's color cannot be read
    unreadable: [...document.querySelectorAll('.am-try, .am-btn, .am-chip')].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.color === cs.backgroundColor;
    }).map((el) => el.textContent),
    // every automation shows its own picture
    repeatedThumbs: thumbs.filter((src, i) => thumbs.indexOf(src) !== i),
  };
});

// the catalogue, in its order: only the creative's own two, both in Roblox
const OWN = { thumbs: 'Roblox Thumbnail Optimizer', icon: 'Roblox Icon Optimizer' };
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const { APPS, AUTOMATIONS } = await import(new URL('../automations.03378ba4.js', import.meta.url).href);
const N = AUTOMATIONS.length, N_APPS = Object.keys(APPS).length;
const chipOf = (page, app) => page.locator(`.am-cats button.am-chip[data-app="${app}"]`);
// the categories as laid out: how many lines the ones in sight take, and whether they are the first ones on offer
const chipLines = (page) => page.evaluate(() => {
  const chips = [...document.querySelectorAll('.am-cats .am-chip')], seen = chips.filter((c) => c.getClientRects().length);
  return { lines: new Set(seen.map((c) => Math.round(c.getBoundingClientRect().top))).size, seen: seen.length, all: chips.length, first: seen.every((c, i) => c === chips[i]), firstSeen: seen[0]?.dataset.app, secondSeen: seen[1]?.dataset.app };
});

try {
  // every automation runs again and again (a schedule, each new event, or a loop that keeps testing), none once
  const once = AUTOMATIONS.filter((a) => !['schedule', 'event', 'loop'].includes(a.trigger?.type) || !a.trigger.when);
  check('every automation recurs: a schedule, an event or a loop, none a one-off task', !once.length, { once: once.map((a) => a.id) });
  check('the catalogue is the creative\'s own two, in Roblox', same(AUTOMATIONS.map((x) => x.id), Object.keys(OWN)) && Object.keys(APPS).join() === 'roblox', { ids: AUTOMATIONS.map((x) => x.id), apps: Object.keys(APPS) });
  const { DETAILS, PUBLISHERS } = await import(new URL('../automation-details.71c311e9.js', import.meta.url).href);
  const unbacked = AUTOMATIONS.filter((x) => {
    const d = DETAILS[x.id];
    // published by someone with a picture, its reviews anonymous
    if (!d?.reviews?.length || !d.about?.length || !PUBLISHERS[d.publisher]?.avatar || d.reviews.some((r) => 'by' in r)) return true;
    const n = d.stars.reduce((sum, c) => sum + c, 0), mean = d.stars.reduce((sum, c, i) => sum + c * (5 - i), 0) / n;
    return n !== Math.round(x.uses / 25) || mean.toFixed(1) !== x.rating.toFixed(1);
  });
  check('every automation has its detail and a publisher, its reviews anonymous, its ratings by star coming to its rating and one per 25 uses', !unbacked.length, { unbacked: unbacked.map((x) => x.id) });

  // the spot, then the sidebar's Automations row
  const { page, errors } = await open('?v=1');
  check('starts on the chat', !(await state(page)).open);
  await page.locator('.sb a[href="#automations"]').click();
  let s = await state(page);
  check(`the Automations row opens the tab with all ${N}`, s.open && s.shown.length === N && s.count === `${N} automations` && s.current === '#automations', s);
  check('the cards are titled Roblox Thumbnail Optimizer and Roblox Icon Optimizer', s.titles.join() === Object.values(OWN).join(), { titles: s.titles });
  check('every app is a category before a search, All on', s.chips.length === N_APPS && !s.picked.length && s.allApps, { chips: s.chips });
  // the count is only read out: drawn 1px wide in the app's px, whatever scale the frame draws the app at
  const top = await page.evaluate(() => {
    const count = document.querySelector('.am-count');
    return { header: Boolean(document.querySelector('.am-h, .am-bar')), countWidth: count.offsetWidth, all: document.querySelector('.am-cats button.am-chip[data-app=""]')?.textContent };
  });
  check('no title or count row over the search field, the first category reads All', !top.header && top.countWidth <= 1 && top.all === 'All', top);
  check('the search field has focus', await page.evaluate(() => document.activeElement?.matches('.am-search input')));
  // two lines of categories at most, the first ones; a chip past them would be out of sight (display none)
  const lines = await chipLines(page);
  check('the categories take two lines at most, the first ones', lines.lines <= 2 && lines.first, lines);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}automations-grid.png` });
  const a = await audit(page);
  check('no broken image, nothing overflows, no title cut off, every label readable, no thumbnail repeated', !a.broken.length && !a.overflow.length && !a.cutTitles.length && !a.unreadable.length && !a.repeatedThumbs.length, a);

  // a press on a card opens it in full over the tab, not a chat; Escape closes it, focus back on the card
  await page.locator('.am-card[data-id="icon"]').click({ position: { x: 80, y: 60 } });
  await page.waitForTimeout(300);
  const full = await page.evaluate(() => {
    const d = document.querySelector('dialog.amd'), t = d?.querySelector('.amd-try');
    return { open: d?.open, title: d?.querySelector('.amd-title')?.textContent, reviews: d?.querySelectorAll('.amd-review').length, broken: [...(d?.querySelectorAll('img') ?? [])].filter((img) => !img.complete || !img.naturalWidth).length, tryReadable: t && getComputedStyle(t).color !== getComputedStyle(t).backgroundColor };
  });
  s = await state(page);
  check('a press on a card opens it in full over the tab, not a chat', full.open && full.title === OWN.icon && full.reviews > 0 && !full.broken && full.tryReadable && s.open && s.current === '#automations', { full, current: s.current });
  await page.screenshot({ path: `${OUT}automations-detail.png` });
  await page.keyboard.press('Escape');
  check('Escape closes it, focus back on its card', await page.evaluate(() => !document.querySelector('dialog.amd').open && document.activeElement?.closest('.am-card')?.dataset.id === 'icon'));
  await page.locator('.am-search input').focus();

  await page.keyboard.type('icon');
  s = await state(page);
  check('"icon" narrows to the Icon Optimizer and offers Roblox', s.shown.join() === 'icon' && s.count === `1 of ${N}` && s.chips.join() === 'roblox', s);
  await page.fill('.am-search input', 'thumbnails');
  s = await state(page);
  check('"thumbnails" narrows to the Thumbnail Optimizer', s.shown.join() === 'thumbs' && s.count === `1 of ${N}`, s);

  await page.fill('.am-search input', 'game design');
  s = await state(page);
  check('"game design" offers Roblox, both shown', s.chips.join() === 'roblox' && same(s.shown, Object.keys(OWN)), s);
  await page.screenshot({ path: `${OUT}automations-categories.png` });
  await chipOf(page, 'roblox').click();
  s = await state(page);
  check('picking Roblox shows its automations', same(s.shown, Object.keys(OWN)) && s.picked.join() === 'roblox' && !s.allApps, s);
  // one highlight on a clicked, picked chip: its fill, with no ring of its own and no keyboard focus ring after a click
  // (read once its 150ms fill and edge transition has run)
  await page.waitForTimeout(250);
  const ring = await page.evaluate(() => {
    const c = document.activeElement, cs = getComputedStyle(c);
    return { focused: c.dataset.app, focusVisible: c.matches(':focus-visible'), boxShadow: cs.boxShadow, border: cs.borderTopColor, fill: cs.backgroundColor };
  });
  check('a clicked chip shows its fill only, no double ring', ring.focused === 'roblox' && !ring.focusVisible && ring.boxShadow === 'none' && ring.border === 'rgba(0, 0, 0, 0)', ring);
  await page.screenshot({ path: `${OUT}automations-picked.png` });
  // a search that no longer reaches the picked app keeps it in sight, leading the categories, so it can be unpicked
  await page.fill('.am-search input', 'zzzz');
  const led = await chipLines(page);
  s = await state(page);
  check('a picked app leads the categories after a search that misses it, in sight', led.firstSeen === '' && led.secondSeen === 'roblox' && s.picked.join() === 'roblox' && s.empty, { led, s });
  await chipOf(page, '').click();
  s = await state(page);
  check('All unpicks every category', !s.picked.length && s.allApps, { picked: s.picked });

  await page.fill('.am-search input', '');
  await page.locator('.am-search input').focus();
  await page.keyboard.type('icon options');
  s = await state(page);
  check('a space types into the field, every word must match', s.value === 'icon options' && s.shown.join() === 'icon', s);

  await page.fill('.am-search input', 'zzzz');
  s = await state(page);
  const emptyCopy = await page.evaluate(() => [...document.querySelectorAll('.am-empty-t, .am-empty .am-new')].map((el) => el.textContent));
  check('no match shows the empty state: No automations existing for this yet!, Prompt your own!', s.empty && s.shown.length === 0 && s.count === `0 of ${N}` && !s.chips.length && emptyCopy.join('|') === 'No automations existing for this yet!|Prompt your own!', { ...s, emptyCopy });
  await page.screenshot({ path: `${OUT}automations-empty.png` });
  await page.locator('.am-clear').click();
  s = await state(page);
  check('the field\'s clear button brings every card back', !s.empty && s.shown.length === N && s.value === '' && s.chips.length === N_APPS, s);

  await page.locator('.am-card[data-id="thumbs"] .am-try').click();
  s = await state(page);
  check('Try Me! returns to the chat, its row current again', !s.open && s.current === '#thumbs', s);
  check('no console errors on the spot', !errors.length, { errors });
  await page.close();

  // straight to the tab
  const deep = await open('?v=1&tab=automations');
  s = await state(deep.page);
  check('?tab=automations opens at load', s.open && s.current === '#automations', s);
  await deep.page.screenshot({ path: `${OUT}automations-deeplink.png` });
  check('no console errors on the deep link', !deep.errors.length, { errors: deep.errors });
  await deep.page.close();

  // Prompt your own! is New chat: from another chat, the tab closes on the live chat, not the one open before
  const fresh = await open('?v=1&chat=tickets&tab=automations');
  await fresh.page.fill('.am-search input', 'zzzz');
  await fresh.page.locator('.am-empty .am-new').click();
  s = await state(fresh.page);
  check('Prompt your own! opens a new chat: the live one, not the chat open before', !s.open && s.current === '#thumbs', s);
  await fresh.page.waitForTimeout(600);
  await fresh.page.screenshot({ path: `${OUT}automations-prompt-own.png` });
  check('no console errors on Prompt your own!', !fresh.errors.length, { errors: fresh.errors });
  await fresh.page.close();

  // nothing of the spot shows through: at 48s its live view is docked with Stop on screen, under the tab
  const under = await open('?v=1&tab=automations&t=48');
  // (one not laid out at all, as in a closed chat's copy of the live view's top bar, has nothing to show)
  const through = await under.page.evaluate(() => [...document.querySelectorAll('.cc-stop, .cc-top-btn, .ch-open, .cc-view')].filter((el) => el.getClientRects().length).map((el) => {
    const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { el: el.className, visibility: getComputedStyle(el).visibility, hit: hit?.closest('.am') ? 'tab' : hit?.className ?? null };
  }).filter((x) => x.visibility !== 'hidden' || x.hit !== 'tab'));
  check('the spot (Stop, its buttons, the live view) never shows through the tab', !through.length, { through });
  await under.page.close();

  // loading
  const loading = await open('?v=1&tab=automations&state=loading');
  const skel = await loading.page.locator('.am-skel').count(), skelChips = await loading.page.locator('.am-skel-chip').count();
  check('?state=loading shows skeleton cards and categories', skel === 8 && skelChips === 6, { skel, skelChips });
  await loading.page.screenshot({ path: `${OUT}automations-loading.png` });
  await loading.page.close();
} finally {
  await browser.close();
}

writeFileSync(`${OUT}automations-verify_report.json`, JSON.stringify(report, null, 1));
const failed = report.filter((r) => !r.ok);
console.log(failed.length ? `${failed.length} failed` : 'all passed');
process.exit(failed.length ? 1 : 0);
