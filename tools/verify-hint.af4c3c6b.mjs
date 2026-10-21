// Samples the composer placeholder across the loop: its text and opacity at each time, so the rotation's order, hold and
// transitions can be checked without watching the whole spot.
import { createRequire } from 'node:module';
const require = createRequire('/Users/adrianagne/Documents/cosmos/projects/quick-chats/superbot-ad-gallery/package.json');
const { chromium } = require('playwright');

const BASE = process.argv[2];
const SHOT = process.argv[3];
const TIMES = [0.2, 2.6, 2.7, 3.0, 5.0, 6.6, 6.75, 6.9, 7.2, 10.5, 15, 20, 35, 64];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const rows = [];
for (const t of TIMES) {
  await page.goto(`${BASE}?t=${t}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
  const h = await page.evaluate(() => {
    const n = document.querySelector('.rc-hint');
    const cs = getComputedStyle(n);
    return { text: n.textContent, opacity: Number(cs.opacity).toFixed(2), display: cs.display, transform: cs.transform };
  });
  rows.push({ t, ...h });
  if (t === 7.2 && SHOT) await page.screenshot({ path: SHOT, clip: { x: 0, y: 1080 - 260, width: 1000, height: 260 } });
}
console.log(JSON.stringify({ rows, errors }, null, 1));
await browser.close();
