// The gallery thumbnail (1280x720, a frozen frame) and a live-playback check: the unfrozen page runs its clock, and
// after a few seconds the composer has typed or sent the prompt with no console errors.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [BASE, THUMB, T, LIVE_SHOT] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true });
const errors = [];
const thumbPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
thumbPage.on('pageerror', (e) => errors.push(String(e)));
await thumbPage.goto(`${BASE}?t=${T}`, { waitUntil: 'load' });
await thumbPage.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
await thumbPage.screenshot({ path: THUMB });

const live = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
live.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
live.on('pageerror', (e) => errors.push(String(e)));
await live.goto(BASE, { waitUntil: 'load' });
await live.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
await live.waitForTimeout(12000);
await live.screenshot({ path: LIVE_SHOT });
const state = await live.evaluate(() => ({
  userShown: Number(getComputedStyle(document.querySelector('.cm-u')).opacity),
  cardsShown: [...document.querySelectorAll('.cm-card')].filter((n) => Number(getComputedStyle(n).opacity) > 0.5).length,
  actIcons: document.querySelectorAll('.ac svg, .ac img, .ac .sb-tile').length,
}));
console.log(JSON.stringify({ thumb: THUMB, live: LIVE_SHOT, state, errors }));
await browser.close();
