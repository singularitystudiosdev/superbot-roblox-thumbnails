// Exports every logo's loop as files: frames drawn by capture.html at exact times (a whole number of frames per loop, so
// the last frame leads straight back into the first), then encoded with ffmpeg: out/<id>.webm (VP9 with alpha, 512px,
// 30fps), out/<id>.mp4 (H.264 on white, 512px, 30fps) and out/<id>.gif (on white, 360px, 25fps), plus out/<id>.png, the
// figure's poster frame (figures.4bc2a2d5.js `poster`). Needs the project served on PORT (npx http-server -p 8642 -c-1 .).
// node logos.4bc2a2d5/export.4bc2a2d5.mjs [id ...]   (no ids: all of them)
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./out/', import.meta.url));
const PORT = process.env.PORT ?? 8642;
const RENDER = 1024, VIDEO = 512, GIF = 360;
const ALL = ['pentagon-rainbow-cycle', 'pentagon-rainbow-flow', 'pentagon-rainbow-faces', 'pentagon-rainbow-spin', 'pentagon-rainbow-sweep', 'pentagon-roll', 'penrose-wave', 'penrose-reveal', 'penrose-band', 'hexagon-build', 'hexagon-band', 'bowtie-wave', 'ring-roll', 'triangle-roll', 'diamond-roll', 'infinity-roll'];
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

const ffmpeg = (...args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
const onWhite = (fps, size) => `color=c=white:s=${RENDER}x${RENDER}:r=${fps}[bg];[bg][0:v]overlay=shortest=1,scale=${size}:${size}:flags=lanczos`;

async function frames(page, id, fps, dir) {
  await page.goto(`http://localhost:${PORT}/logos.4bc2a2d5/capture.html?id=${id}&size=${RENDER}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.ready === true, null, { timeout: 20000 });
  const period = await page.evaluate(() => window.period);
  const n = Math.round(period * fps);
  if (Math.abs(n - period * fps) > 1e-6) throw new Error(`${id}: a ${period}s loop is not a whole number of frames at ${fps}fps`);
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < n; i++) {
    const url = await page.evaluate((t) => window.frameAt(t), (i * period) / n);
    writeFileSync(join(dir, `${String(i).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  return { n, poster: await page.evaluate(() => window.poster) };
}

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const report = [];
try {
  mkdirSync(OUT, { recursive: true });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('page error:', e));
  for (const id of ids) {
    const tmp = mkdtempSync(join(tmpdir(), `logo-${id}-`));
    try {
      const t0 = Date.now();
      const { n: n30, poster } = await frames(page, id, 30, join(tmp, 'f30'));
      const { n: n25 } = await frames(page, id, 25, join(tmp, 'f25'));
      const f30 = join(tmp, 'f30', '%04d.png'), f25 = join(tmp, 'f25', '%04d.png');
      ffmpeg('-framerate', '30', '-i', f30, '-vf', `scale=${VIDEO}:${VIDEO}:flags=lanczos`, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '26', '-row-mt', '1', '-an', join(OUT, `${id}.webm`));
      ffmpeg('-framerate', '30', '-i', f30, '-filter_complex', `${onWhite(30, VIDEO)},format=yuv420p`, '-c:v', 'libx264', '-crf', '18', '-movflags', '+faststart', '-an', join(OUT, `${id}.mp4`));
      ffmpeg('-framerate', '25', '-i', f25, '-filter_complex', `${onWhite(25, GIF)},split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, '-loop', '0', join(OUT, `${id}.gif`));
      execFileSync('magick', [join(tmp, 'f30', `${String(Math.round(poster * n30) % n30).padStart(4, '0')}.png`), '-filter', 'Lanczos', '-resize', `${VIDEO}x${VIDEO}`, join(OUT, `${id}.png`)]);
      report.push({ id, frames30: n30, frames25: n25, seconds: (Date.now() - t0) / 1000, ok: true });
      console.log(`${id}: ${n30} frames at 30fps, ${n25} at 25fps`);
    } catch (err) {
      console.error(`${id} failed:`, err);
      report.push({ id, ok: false, error: String(err) });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
} finally {
  await browser.close();
  // merged by id with earlier runs, so exporting a few logos keeps the others' entries
  const path = join(OUT, 'export_report.json');
  const earlier = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')).filter((r) => !ids.includes(r.id)) : [];
  writeFileSync(path, `${JSON.stringify([...earlier, ...report].sort((a, b) => ALL.indexOf(a.id) - ALL.indexOf(b.id)), null, 2)}\n`);
}
if (report.some((r) => !r.ok)) process.exitCode = 1;
