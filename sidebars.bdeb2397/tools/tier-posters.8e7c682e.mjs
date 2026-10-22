// The effort tiers' posters (../tier.8e7c682e.js): the Impossible infinity at the start of its loop in each tier's clay
// (silver, gold, diamond, and Max's Rainbow flow), drawn by the logos' own capture page (../../logos.4bc2a2d5/capture.html,
// for its import map) and saved transparent at 96px, the size of every fx icon, to ../fx/tier-<id>.8e7c682e.png. Needs
// the project served on PORT (npx http-server -p 5297 -c-1 .).
// node sidebars.bdeb2397/tools/tier-posters.8e7c682e.mjs
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT ?? 5297;
const SIZE = 96;

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));
  await page.goto(`http://localhost:${PORT}/logos.4bc2a2d5/capture.html?id=infinity-roll&size=${SIZE}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.ready === true, null, { timeout: 20000 });
  const urls = await page.evaluate(async (size) => {
    const { FIGURES } = await import('./figures.4bc2a2d5.js');
    const engine = await import('./engine.4bc2a2d5.js');
    const { TIERS, tierFigure } = await import('../sidebars.bdeb2397/tier.8e7c682e.js');
    return Object.fromEntries(Object.keys(TIERS).map((id) => {
      const canvas = document.createElement('canvas');
      engine.mount(canvas, tierFigure(FIGURES, engine, id), { size, pixelRatio: 1, capture: true }).renderAt(0);
      return [id, canvas.toDataURL('image/png')];
    }));
  }, SIZE);
  if (errors.length) throw errors[0];
  for (const [id, url] of Object.entries(urls)) {
    const out = fileURLToPath(new URL(`../fx/tier-${id}.8e7c682e.png`, import.meta.url));
    const png = Buffer.from(url.split(',')[1], 'base64');
    writeFileSync(out, png);
    console.log(JSON.stringify({ out, size: SIZE, bytes: png.length }));
  }
} finally {
  await browser.close();
}
