// Renders every sidebar variant headlessly: the spot with the sidebar inside it, frozen at T, the sidebar alone, and
// the contact sheet; fails on any console error, broken image, a row whose title overflows its row, a letterboxed
// stage in a 16:9 window, or a chat that overlaps the sidebar.
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
    // chat titles cut off on purpose; the header, the account name and every control must fit whole
    const overflow = [...document.querySelectorAll('.sb-top, .sb-brand, .sb-me, .sb-name, .sb-row, .sb-new, .sb-search')].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.trim().slice(0, 40));
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

// the sidebar inside the spot: in a 16:9 window the stage must fill it edge to edge (no letterbox), and the chat must
// start where the sidebar ends
async function layout(page) {
  return page.evaluate(() => {
    const r = (sel) => document.querySelector(sel).getBoundingClientRect();
    const stage = r('#stage'), sb = r('.sb'), ch = r('.ch');
    const gaps = { left: stage.left, top: stage.top, right: innerWidth - stage.right, bottom: innerHeight - stage.bottom };
    const letterbox = Object.values(gaps).some((g) => Math.abs(g) > 1);
    const overlap = ch.left < sb.right - 1;
    return { letterbox: letterbox ? gaps : null, overlap: overlap ? { sbRight: sb.right, chLeft: ch.left } : null };
  });
}

// the variant numbers come from the registry itself (plain strings, no DOM), so the render never drifts from it
const { VARIANTS } = await import(new URL('../variants.bdeb2397.js', import.meta.url));
const WINDOW = { width: 1600, height: 900 };
for (const { id: v } of VARIANTS) {
  try {
    const { page, errors } = await open(`${BASE}view.html?v=${v}&t=${T}`, WINDOW);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
    const id = String(v).padStart(2, '0');
    await page.screenshot({ path: `${OUT}v${id}-full.png` });
    await page.locator('.sb').screenshot({ path: `${OUT}v${id}-sidebar.png` });
    const { letterbox, overlap } = await layout(page);
    report.push({ v, errors, ...(await audit(page)), ...(letterbox && { letterbox }), ...(overlap && { overlap }) });
    await page.close();
  } catch (e) {
    console.error(e);
    report.push({ v, errors: [String(e)] });
  }
}

for (const state of ['loading', 'empty']) {
  const { page, errors } = await open(`${BASE}view.html?v=1&t=${T}&state=${state}`, WINDOW);
  await page.locator('.sb').screenshot({ path: `${OUT}state-${state}.png` });
  report.push({ state, errors });
  await page.close();
}

const { page, errors } = await open(BASE, { width: 1520, height: 900 });
await page.screenshot({ path: `${OUT}sheet.png`, fullPage: true });
report.push({ sheet: true, errors, ...(await audit(page)) });
await browser.close();

writeFileSync(`${OUT}render_report.json`, JSON.stringify(report, null, 1));
const bad = report.filter((r) => r.errors?.length || r.broken?.length || r.overflow?.length || r.letterbox || r.overlap);
console.log(JSON.stringify(bad.length ? bad : 'all clean', null, 1));
process.exit(bad.length ? 1 : 0);
