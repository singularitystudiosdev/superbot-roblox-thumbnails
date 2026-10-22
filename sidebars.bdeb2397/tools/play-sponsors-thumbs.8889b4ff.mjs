// Generates the 6 video thumbnails of the sponsors play's yt-search page (YouTube results for "productivity app review"),
// the same way as chats/yt-*.webp (fal-ai/nano-banana-pro, 16:9 1K, 768x432 WebP). Desk / app-review style, no people, no
// real brands. Writes plays/sponsors/thumb-<id>.webp and logs every prompt + fal request id to
// plays/sponsors/prompts.8889b4ff.json.
//   node sidebars.bdeb2397/tools/play-sponsors-thumbs.8889b4ff.mjs [--force] [id ...]
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../plays/sponsors/', import.meta.url));
const LOG = join(OUT, 'prompts.8889b4ff.json');
const MODEL = 'fal-ai/nano-banana-pro';
const NO = 'No people, no faces, no hands, no logos, no real brand marks, no watermarks.';
const STYLE = `A YouTube video thumbnail for a productivity app review channel, bright and high contrast, crisp, saturated colors, bold sans-serif text with a thick outline. ${NO}`;
const PROMPTS = {
  'desk-setup-daily': `${STYLE} A tidy wooden desk seen from slightly above: an ultrawide monitor and a laptop both showing a clean made-up notes app with colorful abstract blocks, a small desk lamp, a ceramic mug and a plant. The monitor and laptop have plain blank bezels and chins with no logo, badge or lettering at all, and a generic unbranded laptop. Bold yellow text reading exactly "7 APPS" (the word APPS has exactly two P letters: A, P, P, S) on the left.`,
  'calm-code': `${STYLE} A dark developer desk at night: a laptop with a code editor in dark theme next to a second screen showing a calm focus timer app with a green leaf, soft teal ambient light. Bold white text "FOCUS APPS" at the top.`,
  'tidy-tabs': `${STYLE} A laptop screen full of dozens of tiny crowded browser tabs on the left half, and on the right half the same screen with just three neat violet tabs, a clean split composition. Bold white text "40 TABS?" with a violet outline.`,
  'focus-friday': `${STYLE} An overhead shot of a minimal desk with a phone showing a bullseye focus timer app, a notebook, a pencil and a small hourglass, coral red and cream colors. Bold white text "DEEP WORK" on a coral band.`,
  'workflow-weekly': `${STYLE} A laptop showing a made-up automation app: a blue canvas of connected rounded boxes with flow arrows, on a clean white desk with a coffee cup. Bold white text "AUTOMATE IT" on a royal blue band at the bottom.`,
  'keyboard-coffee': `${STYLE} A cozy morning desk: a mechanical keyboard with warm beige keycaps in the foreground, a latte in a cup, a laptop with a to-do list app softly blurred behind, golden morning light. Bold cream text "MORNING SETUP" at the top.`,
};
mkdirSync(OUT, { recursive: true });
const key = execFileSync('security', ['find-generic-password', '-s', 'fal-key', '-w'], { encoding: 'utf8' }).trim();
const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : {};
const tmp = mkdtempSync(join(tmpdir(), 'play-sponsors-'));
await Promise.all(Object.entries(PROMPTS).filter(([id]) => !process.argv.slice(2).some((a) => !a.startsWith("--")) || process.argv.includes(id)).map(async ([id, prompt]) => {
  const dest = join(OUT, `thumb-${id}.webp`);
  if (existsSync(dest) && !process.argv.includes('--force')) { console.log('on disk', id); return; }
  const res = await fetch(`https://fal.run/${MODEL}`, { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, aspect_ratio: '16:9', resolution: '1K', output_format: 'png', num_images: 1 }), signal: AbortSignal.timeout(300000) });
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const img = await fetch(json.images[0].url);
  const raw = join(tmp, id + '.png');
  writeFileSync(raw, Buffer.from(await img.arrayBuffer()));
  execFileSync('magick', [raw, '-resize', '768x432^', '-gravity', 'center', '-extent', '768x432', '-strip', '-quality', '82', dest]);
  log[`thumb-${id}`] = { id: `thumb-${id}`, model: MODEL, prompt, request_id: res.headers.get('x-fal-request-id') ?? json.request_id ?? null, at: new Date().toISOString() };
  console.log('made', dest);
}));
writeFileSync(LOG, JSON.stringify(log, null, 2) + '\n');
