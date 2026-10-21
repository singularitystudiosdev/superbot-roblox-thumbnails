// Drives the Automations tab headlessly and fails on anything off: the sidebar's Automations row opens it over the chat
// and the live view; the search narrows the grid (a space is typed, not taken as the spot's pause) and the app
// categories to what it reaches ("game design" offers Roblox, Unity, Steam, itch.io...); picking categories, several or
// none, narrows the grid to those apps; an unmatched query shows the empty state and Clear search brings every card
// back; Try Me! returns to the chat with the open chat current again; ?tab=automations opens it at load;
// ?state=loading shows skeleton cards and categories. Also fails on a console error, a broken image, a card whose title
// row or footer overflows, a label in its own fill's color, or a thumbnail used twice. Screenshots and a report go to
// ../renders/.
// node sidebars.bdeb2397/tools/automations-verify.03378ba4.mjs http://localhost:5297/
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [BASE = 'http://localhost:5297/'] = process.argv.slice(2);
const OUT = fileURLToPath(new URL('../renders/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const PAGE = `${BASE}sidebars.bdeb2397/view.03378ba4.html`;
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
    current: document.querySelector('.sb [aria-current="page"]')?.getAttribute('href'),
    value: document.querySelector('.am-search input').value,
    // the categories on offer and the ones picked, by app id ("" is All apps)
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
    // a label drawn in its own fill's color cannot be read
    unreadable: [...document.querySelectorAll('.am-try, .am-btn, .am-chip')].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.color === cs.backgroundColor;
    }).map((el) => el.textContent),
    // every automation shows its own picture
    repeatedThumbs: thumbs.filter((src, i) => thumbs.indexOf(src) !== i),
  };
});

const GAME_DESIGN_APPS = ['roblox', 'unity', 'steam', 'itch'];
const STEAM = ['reviews', 'wishlist'], UNITY = ['playtest', 'builds'];
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
// the catalogue grows as the swarms ship: totals come from it, and the searches below are held to the creative's own
// automations, a swarm one (it names its swarm) being free to match a word too
const { APPS, AUTOMATIONS } = await import(new URL('../automations.03378ba4.js', import.meta.url).href);
const N = AUTOMATIONS.length, N_APPS = Object.keys(APPS).length;
const swarmIds = new Set(AUTOMATIONS.filter((a) => a.swarm).map((a) => a.id)), appOf = new Map(AUTOMATIONS.map((a) => [a.id, a.app]));
const own = (ids) => ids.filter((id) => !swarmIds.has(id));
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

  // the spot, then the sidebar's Automations row
  const { page, errors } = await open('?v=1');
  check('starts on the chat', !(await state(page)).open);
  await page.locator('.sb a[href="#automations"]').click();
  let s = await state(page);
  check(`the Automations row opens the tab with all ${N}`, s.open && s.shown.length === N && s.count === `${N} automations` && s.current === '#automations', s);
  check('every app is a category before a search, All apps on', s.chips.length === N_APPS && !s.picked.length && s.allApps, { chips: s.chips });
  check('the search field has focus', await page.evaluate(() => document.activeElement?.matches('.am-search input')));
  // two lines of categories at most, the first ones; a chip past them is out of sight (display none: out of the tab order)
  const lines = await chipLines(page);
  check('the categories take two lines at most, the first ones, the rest hidden', lines.lines === 2 && lines.seen < lines.all && lines.first, lines);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}automations-grid.png` });
  const a = await audit(page);
  check('no broken image, nothing overflows, every label readable, no thumbnail repeated', !a.broken.length && !a.overflow.length && !a.unreadable.length && !a.repeatedThumbs.length, a);

  await page.keyboard.type('discord');
  s = await state(page);
  check('"discord" narrows to the Discord automations and offers Discord first', own(s.shown).join() === 'updatelog,welcome,bugs' && s.count === `${s.shown.length} of ${N}` && s.chips[0] === 'discord' && s.shown.every((id) => appOf.get(id) === 'discord' || swarmIds.has(id)), s);

  await page.fill('.am-search input', 'game design');
  s = await state(page);
  check('"game design" offers the game design apps', GAME_DESIGN_APPS.every((id) => s.chips.includes(id)) && !own(s.shown).some((id) => ['discord', 'gmail'].includes(appOf.get(id))), { chips: s.chips, shown: s.shown.length });
  await page.screenshot({ path: `${OUT}automations-categories.png` });
  await chipOf(page, 'steam').click();
  s = await state(page);
  check('picking Steam shows only its automations', same(own(s.shown), STEAM) && s.shown.every((id) => appOf.get(id) === 'steam') && s.picked.join() === 'steam' && s.count === `${s.shown.length} of ${N}`, s);
  // one highlight on a clicked, picked chip: its fill, with no ring of its own and no keyboard focus ring after a click
  // (read once its 150ms fill and edge transition has run)
  await page.waitForTimeout(250);
  const ring = await page.evaluate(() => {
    const c = document.activeElement, cs = getComputedStyle(c);
    return { focused: c.dataset.app, focusVisible: c.matches(':focus-visible'), boxShadow: cs.boxShadow, border: cs.borderTopColor };
  });
  check('a clicked chip shows its fill only, no double ring', ring.focused === 'steam' && !ring.focusVisible && ring.boxShadow === 'none' && ring.border === 'rgba(0, 0, 0, 0)', ring);
  await chipOf(page, 'unity').click();
  s = await state(page);
  check('picking Unity as well shows both', same(own(s.shown), [...STEAM, ...UNITY]) && same(s.picked, ['steam', 'unity']), s);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}automations-picked.png` });
  await chipOf(page, 'steam').click();
  s = await state(page);
  check('unpicking Steam leaves Unity', same(own(s.shown), UNITY) && s.picked.join() === 'unity', s);
  check('the chip just pressed keeps focus', await page.evaluate(() => document.activeElement?.dataset.app === 'steam'));
  // a search that no longer reaches the picked app keeps it in sight, leading the categories, so it can be unpicked
  await page.fill('.am-search input', 'gmail');
  const led = await chipLines(page);
  s = await state(page);
  check('a picked app leads the categories after a search, in sight', led.secondSeen === 'unity' && led.lines <= 2 && s.picked.join() === 'unity', led);
  await page.fill('.am-search input', 'game design');
  await chipOf(page, '').click();
  s = await state(page);
  check('All apps unpicks every category', !s.picked.length && s.allApps && s.shown.length > UNITY.length, { picked: s.picked, shown: s.shown.length });

  await page.fill('.am-search input', '');
  await page.locator('.am-search input').focus();
  await page.keyboard.type('game pass');
  s = await state(page);
  check('a space types into the field, every word must match', s.value === 'game pass' && s.shown.includes('gamepass'), s);

  await page.fill('.am-search input', 'zzzz');
  s = await state(page);
  check('no match shows the empty state', s.empty && s.shown.length === 0 && s.count === `0 of ${N}` && !s.chips.length, s);
  await page.screenshot({ path: `${OUT}automations-empty.png` });
  await page.locator('.am-empty .am-btn').click();
  s = await state(page);
  check('Clear search brings every card back', !s.empty && s.shown.length === N && s.value === '' && s.chips.length === N_APPS, s);

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
