// Frames of one new low's popper and confetti: the Activity rows around that line, at 2x, at set offsets after it lands.
import { createRequire } from 'node:module';
const require = createRequire('/Users/adrianagne/Documents/cosmos/projects/quick-chats/superbot-ad-gallery/package.json');
const { chromium } = require('playwright');

const [BASE, OUT, WHICH = '0'] = process.argv.slice(2);
const OFFS = [0.05, 0.18, 0.3, 0.45, 0.7, 1.3];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${BASE}?t=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__ready === true);
const wins = await page.evaluate(async () => (await import('./schedule.af4c3c6b.js')).buildSchedule().acts.filter((a) => a.win).map((a) => a.at));
const at = wins[Number(WHICH)];
const shots = [];
for (const off of OFFS) {
  await page.goto(`${BASE}?t=${(at + off).toFixed(3)}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true);
  const box = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.ac-row.ac-win')].filter((n) => Number(getComputedStyle(n).opacity) > 0);
    const r = rows[rows.length - 1].getBoundingClientRect();
    return { x: r.left, y: r.top - 70, w: 620, h: r.height + 90 };
  });
  const path = `${OUT}/pop-${WHICH}-${String(off).replace('.', '_')}.png`;
  await page.screenshot({ path, clip: { x: box.x, y: Math.max(0, box.y), width: box.w, height: box.h } });
  shots.push(path);
}
console.log(JSON.stringify({ at, shots, errors }));
await browser.close();
