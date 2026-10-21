// Renders every sidebar variant headlessly: the full frame beside the creative frozen at T, the sidebar alone, and the
// contact sheet; fails on any console error, broken image or a row whose title overflows its row.
// node sidebars.bdeb2397/tools/render.bdeb2397.mjs http://localhost:5297/sidebars.bdeb2397/ [T] [outDir]
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [BASE, T = '40', OUT = fileURLToPath(new URL('../renders/', import.meta.url))] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];

async function audit(page) {
  return page.evaluate(() => {
    const broken = [...document.querySelectorAll('.sb img')].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.getAttribute('src'));
    const overflow = [...document.querySelectorAll('.sb-row, .sb-tile, .sb-live')].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.trim().slice(0, 40));
    return { broken, overflow };
  });
}

async function open(url, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__sidebarReady === true, null, { timeout: 15000 });
  return { page, errors };
}

for (let v = 1; v <= 10; v++) {
  try {
    const { page, errors } = await open(`${BASE}view.html?v=${v}&t=${T}`, { width: 1456, height: 675 });
    const app = page.frameLocator('#app');
    await app.locator('body').waitFor();
    await page.frames()[1].waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
    const id = String(v).padStart(2, '0');
    await page.screenshot({ path: `${OUT}v${id}-full.png` });
    await page.locator('.sb').screenshot({ path: `${OUT}v${id}-sidebar.png` });
    report.push({ v, errors, ...(await audit(page)) });
    await page.close();
  } catch (e) {
    console.error(e);
    report.push({ v, errors: [String(e)] });
  }
}

for (const state of ['loading', 'empty']) {
  const { page, errors } = await open(`${BASE}view.html?v=1&t=${T}&state=${state}`, { width: 1456, height: 675 });
  await page.locator('.sb').screenshot({ path: `${OUT}state-${state}.png` });
  report.push({ state, errors });
  await page.close();
}

const { page, errors } = await open(BASE, { width: 1520, height: 900 });
await page.screenshot({ path: `${OUT}sheet.png`, fullPage: true });
report.push({ sheet: true, errors, ...(await audit(page)) });
await browser.close();

writeFileSync(`${OUT}render_report.json`, JSON.stringify(report, null, 1));
const bad = report.filter((r) => r.errors?.length || r.broken?.length || r.overflow?.length);
console.log(JSON.stringify(bad.length ? bad : 'all clean', null, 1));
process.exit(bad.length ? 1 : 0);
