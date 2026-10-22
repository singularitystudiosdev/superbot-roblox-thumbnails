// Steps through every chat's run headlessly (plays.8889b4ff.js, chatplay.8889b4ff.js): each chat held at N moments
// across one pass, its right side (computer view and Activity tab) and its chat shot, and fails on any console error,
// a page that never got ready, an image that did not load, or a cursor outside the screen. Writes one strip per chat and
// a JSON report to renders/plays/.
//   node sidebars.bdeb2397/tools/plays-verify.8889b4ff.mjs http://localhost:5297/sidebars.bdeb2397/ [chat,...] [frames]
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [BASE, only, N = '8'] = process.argv.slice(2);
const OUT = fileURLToPath(new URL('../renders/plays/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const { PLAYS } = await import(new URL('../plays.8889b4ff.js', import.meta.url)).catch(() => ({ PLAYS: null }));
const ids = only ? only.split(',') : ['sponsors', 'tickets', 'lunch', 'youtube', 'subscriptions', 'flights', 'haircut', 'inbox', 'bike', 'lisbon', 'deposit', 'pricewatch'];
if (PLAYS) for (const id of ids) if (!PLAYS[id]) throw new Error(`no run for ${id}`);

const browser = await chromium.launch({ headless: true });
const report = [];

async function hold(id, t) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${BASE}view.html?v=1&chat=${id}&t=${t}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__playReady === true, null, { timeout: 20000 }).catch(() => errors.push('never ready'));
  const state = await page.evaluate(() => {
    const cv = document.querySelector('.cv');
    const broken = [...cv.querySelectorAll('img')].filter((i) => i.getAttribute('src') && (!i.complete || i.naturalWidth === 0)).map((i) => i.getAttribute('src'));
    const view = cv.querySelector('.cv-view').getBoundingClientRect(), cur = cv.querySelector('.cc-cursor').getBoundingClientRect();
    const inside = cur.left >= view.left - 2 && cur.top >= view.top - 2 && cur.left <= view.right && cur.top <= view.bottom;
    return { L: window.__playLength, broken, inside };
  });
  return { page, errors, ...state };
}

for (const id of ids) {
  const first = await hold(id, 0);
  const L = first.L;
  await first.page.close();
  const frames = [];
  const n = Number(N);
  for (let k = 0; k < n; k++) {
    const t = +((L - 0.6) * (k + 1) / n).toFixed(2);
    const h = await hold(id, t);
    const file = `${OUT}${id}-${String(k).padStart(2, '0')}.png`;
    await h.page.screenshot({ path: file });
    frames.push({ t, file, errors: h.errors, broken: h.broken, cursorInside: h.inside });
    await h.page.close();
  }
  execFileSync('magick', [...frames.map((f) => f.file), '-resize', '800x', '+append', `${OUT}${id}-strip.png`]);
  const bad = frames.filter((f) => f.errors.length || f.broken.length || !f.cursorInside);
  report.push({ id, L, frames: frames.map(({ t, errors, broken, cursorInside }) => ({ t, errors, broken, cursorInside })), ok: !bad.length });
  console.log(id, `L=${L.toFixed(1)}s`, bad.length ? `FAIL ${JSON.stringify(bad.map((f) => ({ t: f.t, e: f.errors, b: f.broken, c: f.cursorInside })))}` : 'ok');
}
await browser.close();
writeFileSync(`${OUT}plays-verify_report.json`, JSON.stringify(report, null, 1));
if (report.some((r) => !r.ok)) process.exitCode = 1;
