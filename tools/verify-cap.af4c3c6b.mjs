// Frozen-frame captures of the breakthroughs variant plus a DOM audit: one user prompt, the bot messages in order,
// no icon element anywhere in the activity tab, no console errors.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.argv[2];
const OUT = process.argv[3];
const TIMES = (process.argv[4] || '2,12,20,33,45,58,64').split(',').map(Number);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
const report = { frames: [] };
for (const t of TIMES) {
  await page.goto(`${BASE}?t=${t}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
  const path = `${OUT}/t${String(t).replace('.', '_')}.png`;
  await page.screenshot({ path });
  const audit = await page.evaluate(() => {
    const vis = (n) => Number(getComputedStyle(n).opacity) > 0.01;
    return {
      users: [...document.querySelectorAll('.cm-u')].length,
      usersShown: [...document.querySelectorAll('.cm-u')].filter(vis).length,
      bots: [...document.querySelectorAll('.cm-b')].filter(vis).map((n) => n.querySelector('.cm-say').textContent + (n.querySelector('.cm-card b') ? ` [${n.querySelector('.cm-card b').textContent} ${n.querySelector('.cm-card-p b').textContent}]` : '')),
      whoLines: document.querySelectorAll('.cm-who').length,
      actIcons: document.querySelectorAll('.ac svg, .ac img, .ac .sb-tile, .ac-ic').length,
      actRows: [...document.querySelectorAll('.ac-row')].filter(vis).map((n) => (n.classList.contains('ac-win') ? '* ' : '  ') + n.textContent),
    };
  });
  report.frames.push({ t, path, ...audit });
}
const L = await page.evaluate(async () => (await import('./schedule.af4c3c6b.js')).buildSchedule().L);
report.L = L;
report.errors = errors;
console.log(JSON.stringify(report, null, 1));
await browser.close();
