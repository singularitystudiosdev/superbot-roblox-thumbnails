// Generates the pictures the sidebar's chats show in their cards (chatview.bdeb2397.js): a cooking channel's YouTube
// thumbnails for the thumbnail-testing chat (and its other videos, for its Studio screen) and three office lunches for
// the Friday-lunch chat. fal-ai/nano-banana-pro,
// text to image, 16:9 at 1K, saved as 768x432 WebP (the creative's own thumbnail size) to ../chats/; every prompt and
// fal request id goes to ../chats/prompts.bdeb2397.json. The fal key is read from the keychain (service fal-key).
// node sidebars.bdeb2397/tools/chat-images.bdeb2397.mjs [all | id ...]   (no ids: only the ones not on disk)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../chats/', import.meta.url));
const LOG = join(OUT, 'prompts.bdeb2397.json');
const TMP = mkdtempSync(join(tmpdir(), 'chat-images-'));
const MODEL = 'fal-ai/nano-banana-pro', PRICE = 0.15; // USD per image (the Automations tab's tool, fal's pricing API)
const W = 768, H = 432;
const NO_MARKS = 'No logos, brand marks or watermarks.';
const FOOD = `Appetizing, natural window light, shallow depth of field, shot for a food delivery app. No text, no packaging print. ${NO_MARKS}`;

const PROMPTS = {
  'yt-gnocchi-0': `A YouTube cooking video thumbnail that gets few clicks: a flat, dim overhead phone photo of roasted potato gnocchi with peppers and onions on a sheet pan on a cluttered kitchen counter, muted colors, no person, only a small thin white caption reading "Sheet Pan Gnocchi" in a corner. ${NO_MARKS}`,
  'yt-gnocchi-1': `A YouTube cooking video thumbnail: an extreme close-up of crispy golden roasted gnocchi on a sheet pan with melted mozzarella stretching, glossy and steaming, saturated warm colors, bold yellow text "20 MIN" with a thick black outline in the top left. ${NO_MARKS}`,
  'yt-gnocchi-2': `A YouTube cooking video thumbnail: a cheerful home cook in her thirties in a bright kitchen holding a sheet pan of crispy golden gnocchi toward the camera, excited expression, shallow depth of field, bold white text "ONE PAN!" with a dark outline on the left side, vivid and high contrast. ${NO_MARKS}`,
  'yt-gnocchi-3': `A YouTube cooking video thumbnail split down the middle: on the left pale soggy gnocchi under a red X, on the right crispy golden gnocchi under a green check mark, bold black text "CRISPY?" across the top on a white band, bright and clean. ${NO_MARKS}`,
  // the same channel's other videos, as its Studio content list shows them (../screens/youtube.webp)
  'yt-ramen': `A YouTube cooking video thumbnail: a steaming bowl of miso ramen with a jammy soft-boiled egg and chili oil, close and glossy, dark slate background, bold white text "30 MIN RAMEN" with a thick black outline on the left, vivid and high contrast. ${NO_MARKS}`,
  'yt-tacos': `A YouTube cooking video thumbnail: a sheet pan of charred pork al pastor with pineapple and a stack of street tacos in front, bright saturated colors, bold yellow text "SHEET PAN TACOS" with a black outline across the top. ${NO_MARKS}`,
  'yt-curry': `A YouTube cooking video thumbnail: a skillet of creamy chickpea coconut curry with rice and naan, overhead, warm colors, bold white text "15 MIN CURRY" on an orange band at the bottom. ${NO_MARKS}`,
  'yt-pasta': `A YouTube cooking video thumbnail: a wooden spoon lifting creamy lemon orzo from a single pot, steam rising, bright kitchen light, bold black text "ONE POT" on a white band on the right, clean and high contrast. ${NO_MARKS}`,
  'yt-salmon': `A YouTube cooking video thumbnail: a crispy-skin salmon fillet on roasted broccoli on a sheet pan with lemon halves, glossy and fresh, bold white text "5 INGREDIENTS" with a dark outline at the top. ${NO_MARKS}`,
  'yt-chili': `A YouTube cooking video thumbnail: a heavy pot of thick beef and bean chili topped with sour cream, cheddar and scallions, dark moody background, bold red text "BEST CHILI?" with a white outline on the left. ${NO_MARKS}`,
  'lunch-ramen': `Overhead photo of a takeout bowl of spicy miso ramen with chashu pork, a soft-boiled egg, scallions and chili oil on a light wooden office desk, chopsticks beside it and the edge of a laptop in frame. ${FOOD}`,
  'lunch-tacos': `Photo of three tacos al pastor with pineapple, onion and cilantro in an open paper takeout box with lime wedges and two small salsa cups on an office desk. ${FOOD}`,
  'lunch-poke': `Overhead photo of a salmon poke bowl with rice, avocado, edamame, cucumber, seaweed salad and sesame seeds in a takeout bowl on a light desk. ${FOOD}`,
};

const magick = (...args) => execFileSync('magick', args.flat(Infinity), { stdio: ['ignore', 'ignore', 'inherit'] });
const fill = (from, to) => magick(from, '-resize', `${W}x${H}^`, '-gravity', 'center', '-extent', `${W}x${H}`, '-strip', '-quality', '82', to);

function falKey() {
  const key = execFileSync('security', ['find-generic-password', '-s', 'fal-key', '-w'], { encoding: 'utf8' }).trim();
  if (!key) throw new Error('no fal key in the keychain (service fal-key)');
  return key;
}

async function generate(id, key) {
  const input = { prompt: PROMPTS[id], aspect_ratio: '16:9', resolution: '1K', output_format: 'png', num_images: 1 };
  const res = await fetch(`https://fal.run/${MODEL}`, { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(300000) });
  if (!res.ok) throw new Error(`${id}: ${MODEL} answered ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const url = json.images?.[0]?.url;
  if (!url) throw new Error(`${id}: ${MODEL} returned no image: ${JSON.stringify(json).slice(0, 400)}`);
  const img = await fetch(url);
  if (!img.ok) throw new Error(`${id}: the image at ${url} answered ${img.status}`);
  const raw = join(TMP, `${id}.png`);
  writeFileSync(raw, Buffer.from(await img.arrayBuffer()));
  fill(raw, join(OUT, `${id}.webp`));
  return { id, model: MODEL, prompt: PROMPTS[id], request_id: res.headers.get('x-fal-request-id') ?? json.request_id ?? null, at: new Date().toISOString() };
}

mkdirSync(OUT, { recursive: true });
const ask = process.argv.slice(2);
const want = Object.keys(PROMPTS).filter((id) => ask.includes('all') || ask.includes(id) || (!ask.length && !existsSync(join(OUT, `${id}.webp`))));
if (!want.length) { console.log('all chat images on disk'); process.exit(0); }
const key = falKey();
const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : {};
const results = await Promise.allSettled(want.map((id) => generate(id, key)));
const failed = [];
results.forEach((r, i) => {
  if (r.status === 'fulfilled') { log[r.value.id] = r.value; console.log(`made ${r.value.id}`); }
  else { console.error(r.reason); failed.push(want[i]); }
});
writeFileSync(LOG, `${JSON.stringify(log, null, 2)}\n`);
const made = want.length - failed.length;
console.log(`${made} made, ${failed.length} failed, about $${(made * PRICE).toFixed(2)} at $${PRICE} each`);
process.exit(failed.length ? 1 : 0);
