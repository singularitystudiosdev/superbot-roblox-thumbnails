// The credits coins: plain coins, no emblem, drawn as Fluent Emoji 3D icons so they sit with ../../img/fx and ../fx.
// Silver is the credits row's (sidebar-tools.854d0793.js) and Billing's balance and 5,000,000 pack; gold and rainbow are
// Billing's 20,000,000 and 100,000,000 packs (settings-billing.bdeb2397.js). Each metal is an effort tier mark's
// (../fx/tier-*.8e7c682e.png), and gold and rainbow take the silver coin's shape so the three are one coin.
// fal-ai/nano-banana-pro/edit draws a few drafts from those references on white (gold is graded from silver instead,
// see METALS); each is trimmed to its disc, graded
// (a sigmoidal curve: the drafts come out paler than the tier marks) and cut out with a round mask (a background
// cutter loses silver on white), then fitted to 96px square (the size of every other fx icon) in
// ../debug/coin-fx.0ecb8f7c/<metal>/. `recut` cuts the drafts on disk again, `pick` copies the chosen one to
// ../fx/coin-<metal>.0ecb8f7c.png and logs its prompt and fal request id to ../fx/prompts.0ecb8f7c.json. The fal key is
// read from the keychain (service fal-key). Asking for "chrome" or "charcoal" contrast in the prompt was refused by
// fal's content checker (422), so the grade does it.
// node sidebars.bdeb2397/tools/coin-fx.0ecb8f7c.mjs [draw <metal> [n] | recut <metal> | pick <metal> <n> | grade gold]
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const FX = fileURLToPath(new URL('../fx/', import.meta.url));
const DRAFTS = fileURLToPath(new URL('../debug/coin-fx.0ecb8f7c/', import.meta.url));
const LOG = join(FX, 'prompts.0ecb8f7c.json');
const TMP = mkdtempSync(join(tmpdir(), 'coin-fx-'));
const MODEL = 'fal-ai/nano-banana-pro/edit';
const SIZE = 96;

// the creative's Fluent Emoji 3D icons (as tools/app-fx.4bc2a2d5.mjs): two tiles, two objects
const STYLE = ['img/fx/counterclockwise_arrows_button.png', 'img/fx/check_mark_button.png', 'img/fx/trophy.png', 'img/fx/hourglass_not_done.png'];
const SILVER_COIN = 'sidebars.bdeb2397/fx/coin-silver.0ecb8f7c.png';

const LOOK = 'in exactly the 3D style of the Fluent Emoji icons: a soft, smooth, slightly glossy clay-like 3D render with a thick rounded bevelled raised rim, gentle gradients, soft light from the top left, a subtly darker lower edge and no outlines.';
const BLANK = 'The face inside the rim is plain, smooth and slightly recessed, completely blank. Centered, filling about 80% of the square, alone on a plain flat pure white background: no shadow on the background, no reflection, no other objects and no text.';

// per metal: its references (the tier mark first), what it is asked for and the grade its drafts take
// (-sigmoidal-contrast: the drafts' pale metal taken to the tier mark's highlights and dark edge)
const METALS = {
  silver: {
    refs: ['sidebars.bdeb2397/fx/tier-low.8e7c682e.png', ...STYLE],
    prompt: `The first image is a polished silver infinity sign; the other images are Microsoft Fluent Emoji 3D icons. Draw one new icon: a single round game token, a thick disc seen straight from the front, ${LOOK} Its material is the cool polished silver of the infinity sign: light silvery greys with soft white highlights and mid-grey shading, no gold, no yellow and no warm tint. ${BLANK}`,
    grade: '7,60%',
  },
  // fal's content checker refused every gold draft (422, model_moderated: asked as a gold coin, a yellow token and a
  // yellow round button, 2026-10-22), so gold is the silver coin graded through a gradient map (`grade gold`): its dark
  // edge, mid tones and highlights taken to the tier mark's deep brown, gold and pale yellow
  gold: { from: 'silver', map: ['#2e1700', '#c47f0a', '#ffcc33'] },
  rainbow: {
    refs: ['sidebars.bdeb2397/fx/tier-max.8e7c682e.png', SILVER_COIN, ...STYLE],
    prompt: `The first image is a glossy rainbow infinity sign; the second is a silver game token; the other images are Microsoft Fluent Emoji 3D icons. Draw one new icon: the same round game token as the second image, the same thick disc seen straight from the front with the same rim and proportions, ${LOOK} Its material is the glossy iridescent rainbow of the infinity sign: a smooth spectrum that flows around the rim and across the face, from red and orange through yellow and green to blue and violet, with soft white highlights. ${BLANK}`,
    grade: '3,50%',
  },
};

const magick = (...args) => execFileSync('magick', args, { stdio: ['ignore', 'ignore', 'inherit'] });
const metalOf = (name) => {
  if (!METALS[name]) throw new Error(`unknown metal ${name}: ${Object.keys(METALS).join(' | ')}`);
  return { ...METALS[name], name, dir: join(DRAFTS, name), out: join(FX, `coin-${name}.0ecb8f7c.png`) };
};
const cutOf = (m) => `trim on white, -sigmoidal-contrast ${m.grade}, round mask, ${SIZE}px`;

// a metal with no drafts of its own: the `from` coin's colour channels through a 256px gradient map, its alpha kept
function grade(m) {
  const map = join(TMP, 'map.png'), src = join(FX, `coin-${m.from}.0ecb8f7c.png`);
  const [dark, mid, light] = m.map;
  magick('-size', '1x128', `gradient:${dark}-${mid}`, '-size', '1x128', `gradient:${mid}-${light}`, '-append', '-rotate', '-90', map);
  magick(src, '-channel', 'RGB', map, '-clut', '+channel', '-strip', m.out);
  const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : {};
  log[m.name] = { from: `fx/coin-${m.from}.0ecb8f7c.png`, cut: `-clut through a gradient map ${m.map.join(' > ')}`, at: new Date().toISOString() };
  writeFileSync(LOG, `${JSON.stringify(log, null, 2)}\n`);
  console.log(`${m.name} graded from ${m.from}: ${m.out}`);
}

function falKey() {
  const key = execFileSync('security', ['find-generic-password', '-s', 'fal-key', '-w'], { encoding: 'utf8' }).trim();
  if (!key) throw new Error('no fal key in the keychain (service fal-key)');
  return key;
}

// a reference as a 512px JPEG data URI, its transparency flattened onto white, the background the coin is asked for
function dataUri(path) {
  const jpg = join(TMP, `ref-${path.replace(/\W/g, '_')}.jpg`);
  magick(join(ROOT, path), '-background', '#ffffff', '-alpha', 'remove', '-alpha', 'off', '-resize', '512x512', '-quality', '92', jpg);
  return `data:image/jpeg;base64,${readFileSync(jpg).toString('base64')}`;
}

async function fal(endpoint, input, key, label) {
  const res = await fetch(`https://fal.run/${endpoint}`, { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(300000) });
  if (!res.ok) throw new Error(`${label}: ${endpoint} answered ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const urls = (json.images ?? [json.image]).map((i) => i?.url).filter(Boolean);
  if (!urls.length) throw new Error(`${label}: ${endpoint} returned no image: ${JSON.stringify(json).slice(0, 400)}`);
  const images = await Promise.all(urls.map(async (url) => {
    const img = await fetch(url);
    if (!img.ok) throw new Error(`${label}: the image at ${url} answered ${img.status}`);
    return Buffer.from(await img.arrayBuffer());
  }));
  return { images, requestId: res.headers.get('x-fal-request-id') ?? json.request_id ?? null };
}

// trimmed to the disc on its white, graded, cut out round (the mask drawn at full size, so its edge is smooth once
// scaled) and fitted into the square with a 2px margin as the Fluent files are
function cut(m, n) {
  const disc = join(TMP, `disc-${n}.png`), mask = join(TMP, `mask-${n}.png`);
  magick(join(m.dir, `raw-${n}.png`), '-fuzz', '4%', '-trim', '+repage', disc);
  const [w, h] = execFileSync('magick', ['identify', '-format', '%w %h', disc], { encoding: 'utf8' }).split(' ').map(Number);
  const [cx, cy, r] = [Math.floor(w / 2), Math.floor(h / 2), Math.floor(Math.min(w, h) / 2) - 1];
  magick('-size', `${w}x${h}`, 'xc:black', '-fill', 'white', '-draw', `circle ${cx},${cy} ${cx},${cy - r}`, mask);
  // -compose goes back to over before -extent, which composes with it
  magick(disc, '-sigmoidal-contrast', m.grade, mask, '-alpha', 'off', '-compose', 'CopyOpacity', '-composite', '-compose', 'over',
    '-filter', 'Lanczos', '-resize', `${SIZE - 4}x${SIZE - 4}`, '-background', 'none', '-gravity', 'center', '-extent', `${SIZE}x${SIZE}`, '-strip', join(m.dir, `coin-${n}.png`));
}

// the drafts on the sidebar's grey, at full size over the row's size, to choose from
function sheet(m, count) {
  const tiles = Array.from({ length: count }, (_, i) => join(m.dir, `coin-${i + 1}.png`));
  const big = join(TMP, 'big.png'), small = join(TMP, 'small.png');
  magick(...tiles, '-background', '#f2f2f5', '-gravity', 'center', '-extent', '112x112', '+append', big);
  magick(...tiles, '-resize', '44x44', '-background', '#f2f2f5', '-gravity', 'center', '-extent', '112x60', '+append', small);
  magick(big, small, '-append', join(m.dir, 'sheet.png'));
}

const drafts = (m) => readdirSync(m.dir).filter((f) => /^raw-\d+\.png$/.test(f)).length;

async function draw(m, count) {
  mkdirSync(m.dir, { recursive: true });
  const drawn = await fal(MODEL, { prompt: m.prompt, image_urls: m.refs.map(dataUri), aspect_ratio: '1:1', resolution: '1K', output_format: 'png', num_images: count }, falKey(), `coin ${m.name}`);
  drawn.images.forEach((bytes, i) => writeFileSync(join(m.dir, `raw-${i + 1}.png`), bytes));
  writeFileSync(join(m.dir, 'run.json'), `${JSON.stringify({ model: MODEL, prompt: m.prompt, refs: m.refs, request_id: drawn.requestId, at: new Date().toISOString() }, null, 2)}\n`);
  recut(m, drawn.images.length);
}

function recut(m, count = drafts(m)) {
  for (let n = 1; n <= count; n++) cut(m, n);
  sheet(m, count);
  console.log(`${count} ${m.name} drafts cut in ${m.dir} (sheet.png); keep one with: pick ${m.name} <n>`);
}

function pick(m, n) {
  const draft = join(m.dir, `coin-${n}.png`), run = join(m.dir, 'run.json');
  if (!existsSync(draft) || !existsSync(run)) throw new Error(`no ${m.name} draft ${n} to pick: draw first`);
  copyFileSync(draft, m.out);
  const { model, prompt, refs, request_id, at } = JSON.parse(readFileSync(run, 'utf8'));
  const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : {};
  log[m.name] = { model, prompt, refs, request_id, at, picked: Number(n), cut: cutOf(m) };
  writeFileSync(LOG, `${JSON.stringify(log, null, 2)}\n`);
  console.log(`${m.name} draft ${n} is ${m.out}`);
}

const [verb = 'draw', metal = 'silver', arg] = process.argv.slice(2);
try {
  const m = metalOf(metal);
  if (m.from && verb !== 'grade') throw new Error(`${m.name} is graded from ${m.from}, not drawn: grade ${m.name}`);
  if (verb === 'grade') grade(m);
  else if (verb === 'pick') pick(m, arg);
  else if (verb === 'recut') recut(m);
  else if (verb === 'draw') await draw(m, Math.min(Math.max(Number(arg) || 3, 1), 4));
  else throw new Error(`unknown verb ${verb}: draw <metal> [n] | recut <metal> | pick <metal> <n> | grade gold`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
