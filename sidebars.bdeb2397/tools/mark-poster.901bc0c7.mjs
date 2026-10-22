// The sidebar mark's poster (../mark.901bc0c7.js): the grey Impossible infinity at the start of its loop, the frame the live
// mark opens on, drawn by the logos' own capture page (../../logos.4bc2a2d5/capture.html, for its import map) and saved
// transparent at 96px, the size of every fx icon, to ../fx/mark.901bc0c7.png. Needs the project served on PORT
// (npx http-server -p 8642 -c-1 .).
// node sidebars.bdeb2397/tools/mark-poster.901bc0c7.mjs
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../fx/mark.901bc0c7.png', import.meta.url));
const PORT = process.env.PORT ?? 8642;
const SIZE = 96;

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));
  await page.goto(`http://localhost:${PORT}/logos.4bc2a2d5/capture.html?id=infinity-roll&size=${SIZE}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.ready === true, null, { timeout: 20000 });
  const url = await page.evaluate(async (size) => {
    const { FIGURES } = await import('./figures.4bc2a2d5.js');
    const { mount } = await import('./engine.4bc2a2d5.js');
    const { greyFigure } = await import('../sidebars.bdeb2397/mark.901bc0c7.js');
    const canvas = document.createElement('canvas');
    mount(canvas, greyFigure(FIGURES), { size, pixelRatio: 1, capture: true }).renderAt(0);
    return canvas.toDataURL('image/png');
  }, SIZE);
  if (errors.length) throw errors[0];
  writeFileSync(OUT, Buffer.from(url.split(',')[1], 'base64'));
  console.log(JSON.stringify({ out: OUT, size: SIZE, bytes: Buffer.from(url.split(',')[1], 'base64').length }));
} finally {
  await browser.close();
}
