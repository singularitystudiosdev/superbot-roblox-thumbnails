// Generates the one new picture the lunch play needs: Cedar House's chicken shawarma plate, the same way as
// chats/lunch-*.webp (fal-ai/nano-banana-pro, 16:9 1K, 768x432 WebP, FOOD style of chat-images.bdeb2397.mjs).
// Writes plays/lunch/cedar-house.webp and logs the prompt + fal request id to plays/lunch/prompts.8889b4ff.json.
//   node sidebars.bdeb2397/tools/play-lunch-image.8889b4ff.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../plays/lunch/', import.meta.url));
const LOG = join(OUT, 'prompts.8889b4ff.json');
const MODEL = 'fal-ai/nano-banana-pro';
const NO_MARKS = 'No logos, brand marks or watermarks.';
const FOOD = `Appetizing, natural window light, shallow depth of field, shot for a food delivery app. No text, no packaging print. ${NO_MARKS}`;
const id = 'cedar-house';
const prompt = `Photo of a chicken shawarma plate in an open takeout container on an office desk: sliced marinated chicken, rice, hummus, pickled turnips, tomato and cucumber salad, a warm pita and a small cup of garlic sauce. ${FOOD}`;
mkdirSync(OUT, { recursive: true });
const dest = join(OUT, id + '.webp');
if (existsSync(dest) && !process.argv.includes('--force')) { console.log('on disk'); process.exit(0); }
const key = execFileSync('security', ['find-generic-password', '-s', 'fal-key', '-w'], { encoding: 'utf8' }).trim();
const res = await fetch(`https://fal.run/${MODEL}`, { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, aspect_ratio: '16:9', resolution: '1K', output_format: 'png', num_images: 1 }), signal: AbortSignal.timeout(300000) });
if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
const json = await res.json();
const img = await fetch(json.images[0].url);
const raw = join(mkdtempSync(join(tmpdir(), 'play-lunch-')), id + '.png');
writeFileSync(raw, Buffer.from(await img.arrayBuffer()));
execFileSync('magick', [raw, '-resize', '768x432^', '-gravity', 'center', '-extent', '768x432', '-strip', '-quality', '82', dest]);
const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : {};
log[id] = { id, model: MODEL, prompt, request_id: res.headers.get('x-fal-request-id') ?? json.request_id ?? null, at: new Date().toISOString() };
writeFileSync(LOG, JSON.stringify(log, null, 2) + '\n');
console.log('made', dest);
