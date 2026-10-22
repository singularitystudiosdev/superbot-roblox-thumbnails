// The sidebar's chat icons, one per app a chat is done in (screens.bdeb2397.js `app`; Roblox for the creative's own
// chat), and the share box's places to post a link: the app's real logo redrawn as a Fluent Emoji 3D icon, so it sits with ../../img/fx and ../fx. fal-ai/nano-banana-pro
// /edit is given the logo and four of the creative's Fluent icons as the style, fal-ai/birefnet/v2 cuts the background
// away, and the icon is trimmed and saved 96px square (the size of every other fx icon) to ../fx/app-<app>.png. Every
// prompt and fal request id goes to ../fx/prompts.4bc2a2d5.json. The fal key is read from the keychain (service fal-key).
// node sidebars.bdeb2397/tools/app-fx.4bc2a2d5.mjs [all | app ...]   (no apps: only the ones not on disk)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../fx/', import.meta.url));
const LOG = join(OUT, 'prompts.4bc2a2d5.json');
const TMP = mkdtempSync(join(tmpdir(), 'app-fx-'));
const MODEL = 'fal-ai/nano-banana-pro/edit', CUTOUT = 'fal-ai/birefnet/v2';
const SIZE = 96;
const REGEN = process.argv.slice(2);

// the creative's Fluent Emoji 3D icons the new ones are drawn like: two tiles, two objects
const STYLE_REFS = ['img/fx/counterclockwise_arrows_button.png', 'img/fx/check_mark_button.png', 'img/fx/trophy.png', 'img/fx/hourglass_not_done.png'];

// each app's logo as the site or store serves it (the files' sources: ../screens/CREDITS.txt, ../automations/apps/)
const APPS = {
  roblox: { logo: 'img/fav/roblox.png', what: 'Roblox logo: a white square tilted about 15 degrees with a small square hole in its centre, on a blue rounded square tile' },
  gmail: { logo: 'sidebars.bdeb2397/automations/apps/gmail.png', what: "Gmail logo: the M-shaped envelope in Google's red, blue, green and yellow" },
  vividseats: { logo: 'sidebars.bdeb2397/screens/fav/tickets-site.png', what: 'Vivid Seats logo: a downward pointing triangle made of diagonal bands of magenta, purple, blue and teal' },
  ubereats: { logo: 'sidebars.bdeb2397/automations/apps/ubereats.png', what: 'Uber Eats app icon: the words "Uber Eats" on two lines in black on a green rounded square tile' },
  youtube: { logo: 'sidebars.bdeb2397/automations/apps/youtube.png', what: 'YouTube logo: a white play triangle on a red rounded rectangle' },
  // the default cutout keeps only the white plane and drops its blue circle; the Dynamic model keeps both
  flights: { logo: 'sidebars.bdeb2397/screens/fav/google-flights.png', what: 'Google Flights logo: a white airplane on a blue circle', cutout: 'General Use (Dynamic)' },
  fresha: { logo: 'sidebars.bdeb2397/plays/haircut/fav-fresha.png', what: 'Fresha app icon: the lowercase letters "fr" in white on a violet rounded square tile' },
  craigslist: { logo: 'sidebars.bdeb2397/automations/apps/craigslist.png', what: 'craigslist app icon: a white peace sign on a purple rounded square tile' },
  hotels: { logo: 'sidebars.bdeb2397/screens/fav/hotels-site.png', what: "Google Hotels logo: a rolling suitcase in Google's blue, red, yellow and green with a white G on its front" },
  // the share box's places to post a chat's link (chat-ui.854d0793.js), from their App Store icons (../fx/share-logos)
  // the default cutout takes the black tile for background and keeps only the X; the Dynamic model keeps both
  x: { logo: 'sidebars.bdeb2397/fx/share-logos/x.png', what: 'X app icon: a white X letterform, one thick and one thin diagonal stroke, on a black rounded square tile', cutout: 'General Use (Dynamic)' },
  discord: { logo: 'sidebars.bdeb2397/fx/share-logos/discord.png', what: 'Discord app icon: the white Discord mascot, a rounded game-controller-shaped face with two eyes, on a blurple rounded square tile' },
  facebook: { logo: 'sidebars.bdeb2397/fx/share-logos/facebook.png', what: 'Facebook app icon: a white lowercase letter f on a bright blue rounded square tile' },
  reddit: { logo: 'sidebars.bdeb2397/fx/share-logos/reddit.png', what: 'Reddit app icon: Snoo, the white alien head with orange eyes, a smile and an antenna ending in a ball, on an orange-red rounded square tile' },
};

const prompt = (what) => `The first image is the ${what}. Redraw it as one icon in exactly the 3D style of the other images, which are Microsoft Fluent Emoji 3D icons: a soft, smooth, slightly glossy clay-like 3D render with rounded bevelled edges, gentle color gradients, soft light from the top left, a subtly darker underside and no outlines. Keep the logo's own shape, proportions and colors so it is recognisable at a glance. Seen straight from the front, centered, filling about 80% of the square, alone on a plain flat light grey background: no shadow on the background, no reflection, no other objects and no text beyond the logo's own.`;

const magick = (...args) => execFileSync('magick', args, { stdio: ['ignore', 'ignore', 'inherit'] });

function falKey() {
  const key = execFileSync('security', ['find-generic-password', '-s', 'fal-key', '-w'], { encoding: 'utf8' }).trim();
  if (!key) throw new Error('no fal key in the keychain (service fal-key)');
  return key;
}

// a reference as a 512px JPEG data URI, its transparency flattened onto the light grey the icon is asked to stand on
function dataUri(path) {
  const jpg = join(TMP, `ref-${path.replace(/\W/g, '_')}.jpg`);
  magick(join(ROOT, path), '-background', '#e6e6e6', '-alpha', 'remove', '-alpha', 'off', '-resize', '512x512', '-quality', '92', jpg);
  return `data:image/jpeg;base64,${readFileSync(jpg).toString('base64')}`;
}

async function fal(endpoint, input, key, label) {
  const res = await fetch(`https://fal.run/${endpoint}`, { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(300000) });
  if (!res.ok) throw new Error(`${label}: ${endpoint} answered ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const url = json.images?.[0]?.url ?? json.image?.url;
  if (!url) throw new Error(`${label}: ${endpoint} returned no image: ${JSON.stringify(json).slice(0, 400)}`);
  const img = await fetch(url);
  if (!img.ok) throw new Error(`${label}: the image at ${url} answered ${img.status}`);
  return { bytes: Buffer.from(await img.arrayBuffer()), requestId: res.headers.get('x-fal-request-id') ?? json.request_id ?? null };
}

async function generate(app, { logo, what, cutout }, key) {
  const text = prompt(what);
  const refs = [logo, ...STYLE_REFS];
  const drawn = await fal(MODEL, { prompt: text, image_urls: refs.map(dataUri), aspect_ratio: '1:1', resolution: '1K', output_format: 'png', num_images: 1 }, key, app);
  const raw = join(TMP, `${app}.png`);
  writeFileSync(raw, drawn.bytes);
  const cut = await fal(CUTOUT, { image_url: `data:image/png;base64,${drawn.bytes.toString('base64')}`, ...(cutout && { model: cutout }) }, key, `${app} cutout`);
  const alpha = join(TMP, `${app}-cut.png`);
  writeFileSync(alpha, cut.bytes);
  // trimmed to the icon, then fitted into the square with a 2px margin as the Fluent files are
  magick(alpha, '-trim', '+repage', '-filter', 'Lanczos', '-resize', `${SIZE - 4}x${SIZE - 4}`, '-background', 'none', '-gravity', 'center', '-extent', `${SIZE}x${SIZE}`, '-strip', join(OUT, `app-${app}.png`));
  console.log(`app-${app}.png  (raw ${raw})`);
  return { app, model: MODEL, cutout: CUTOUT, cutout_model: cutout ?? 'default', prompt: text, refs, request_id: drawn.requestId, cutout_request_id: cut.requestId, at: new Date().toISOString() };
}

async function main() {
  const want = Object.keys(APPS).filter((app) => REGEN.includes('all') || REGEN.includes(app) || (!REGEN.length && !existsSync(join(OUT, `app-${app}.png`))));
  if (!want.length) return console.log('every app icon is on disk (pass `all` or app names to redraw)');
  const key = falKey();
  const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : {};
  const results = await Promise.allSettled(want.map((app) => generate(app, APPS[app], key)));
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') log[r.value.app] = r.value;
    else console.error(`${want[i]} failed:`, r.reason);
  });
  writeFileSync(LOG, `${JSON.stringify(log, null, 2)}\n`);
  if (results.some((r) => r.status === 'rejected')) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
