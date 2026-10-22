// Generates the pictures the sidebar's chats show in their cards (chatview.bdeb2397.js): a cooking channel's YouTube
// thumbnails for the thumbnail-testing chat (and its other videos, for its Studio screen), three office lunches for
// the Friday-lunch chat, the bike, the barber; and the parts the other cards are put
// together from by chat-cards.b50586fe.mjs (the channels' and apps' icons, the move-out photos, the trip's stops).
// fal-ai/nano-banana-pro, text to image at 1K: a card's picture 16:9, saved as 768x432 WebP (the creative's own
// thumbnail size) to ../chats/; a part to ../chats/parts/, an icon square at 512x512. Every prompt and fal request id
// goes to ../chats/prompts.bdeb2397.json. The fal key is read from the keychain (service fal-key).
// node sidebars.bdeb2397/tools/chat-images.bdeb2397.mjs [all | id ...]   (no ids: only the ones not on disk)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../chats/', import.meta.url));
const PARTS = join(OUT, 'parts');
const LOG = join(OUT, 'prompts.bdeb2397.json');
const TMP = mkdtempSync(join(tmpdir(), 'chat-images-'));
const MODEL = 'fal-ai/nano-banana-pro', PRICE = 0.15; // USD per image (the Automations tab's tool, fal's pricing API)
const W = 768, H = 432, ICON = 512;
const NO_MARKS = 'No logos, brand marks or watermarks.';
const NO_TEXT = 'No logos, no brand marks, no watermarks, no captions or text in the image.';
const FOOD = `Appetizing, natural window light, shallow depth of field, shot for a food delivery app. No text, no packaging print. ${NO_MARKS}`;
const PHOTO = `Photorealistic, shot on a full-frame camera, natural soft window light, crisp focus, shallow depth of field, rich true colors, high dynamic range, looks like a premium editorial photograph. ${NO_TEXT}`;
// PHOTO's window light turns an arena into daytime; a scene with its own light takes LOOK
const LOOK = `Photorealistic, crisp focus, rich true colors, high dynamic range, looks like a premium editorial photograph. ${NO_TEXT}`;
const AVATAR = 'A YouTube channel profile picture for a made-up channel, square, to be shown cropped to a circle: one bold, simple emblem centered with a generous margin on a solid background color that fills the whole square edge to edge, clean modern logo design with a subtle soft gradient and gentle depth, legible at a very small size. No text, no letters, no words, no watermark.';
const APP = 'An app icon for a made-up app: full-bleed square artwork that fills the entire image edge to edge (no rounded corners, no border, no margin, no device, no shadow around it), one bold simple glyph centered on a vivid background, polished modern iOS app icon style with a soft gradient and gentle depth, legible at a very small size. No text, no letters, no words, no watermark.';
// an app icon in neutral grey, like a raised macOS button: no color, only the glyph's dark grey on pale grey
const KEY = 'An app icon for a made-up app: full-bleed square artwork that fills the entire image edge to edge (no rounded corners, no margin, no device, no drop shadow around it). The pale silver grey surface is the whole square and runs to all four edges and corners, with no tile, card, frame, border or button shape drawn inside it: a soft vertical gradient from near white at the top to light grey at the bottom, a thin bright highlight along the very top edge and a faint darker grey band along the very bottom edge, as if the square were slightly raised. One flat solid charcoal grey glyph centered with a generous margin, taking up about half the width, with softly rounded ends and no gradient, outline or shine on it. No color anywhere, only greys. Legible at a very small size. No text, no letters, no words, no watermark.';
const MOVE_OUT = `Bare and spotless, nothing left behind, bright daylight, slightly wide angle, honest and unstyled. Photorealistic. ${NO_TEXT}`;
// a part a card is put together from (../chats/parts/), and an icon, square
const part = (prompt) => ({ prompt, part: true });
const icon = (prompt) => ({ prompt, part: true, square: true });

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
  // the bike in its listing, and again once the seller took the offer
  'bike-listing': `A used silver aluminium road bike with drop handlebars, new black tires and a clean chain, leaning against a brick wall on a sunny street, seen side on. ${PHOTO}`,
  // the barber the haircut is with
  'haircut-sam': `Head-and-shoulders portrait of Sam, a friendly barber in his thirties with a neat fade haircut and a short beard, in a black barber apron, standing in a small neighbourhood barbershop with warm lamps and a vintage barber chair softly blurred behind him, looking at the camera with a warm smile, like a profile photo on a booking page. ${LOOK}`,
  // the channels written to (the sponsorship chat's inbox, ../screens/sponsors.webp)
  'ch-desk-setup-daily': icon(`${AVATAR} The channel reviews desk setups and productivity gear: a minimal white emblem of a desk with a monitor and a small desk lamp, on a warm orange background.`),
  'ch-calm-code': icon(`${AVATAR} The channel reviews developer tools and focus apps: white curly braces enclosing a small soft green leaf, on a deep teal background that runs to every edge of the square, with no white border, frame or inner tile.`),
  'ch-tidy-tabs': icon(`${AVATAR} The channel is about organising browser tabs: a white browser window seen from the front with three rounded tabs along its top edge, the first tab lilac, on a violet background that runs to every edge of the square, with no white border, frame or inner tile.`),
  'ch-workflow-weekly': icon(`${AVATAR} The channel posts weekly workflow and automation videos: three white dots linked by a looping flow arrow, on a royal blue background.`),
  'ch-focus-friday': icon(`${AVATAR} The channel is about focus and deep work: a white bullseye target with a single arrow in its centre, on a coral red background.`),
  'ch-keyboard-coffee': icon(`${AVATAR} The channel is about mechanical keyboards and cosy work setups: a cream keyboard keycap beside a small coffee cup, on a mocha brown background.`),
  // the subscriptions on the card statements: the 4 cancelled (../screens/subscriptions.webp), the gym, and 3 kept
  'app-streambox': icon(`${APP} A video streaming service: a white rounded play triangle inside a white outlined box, on a vivid red to crimson gradient that runs to every edge of the square, with no white border or frame.`),
  'app-reelhouse': icon(`${APP} A film and series streaming service: a golden film reel, on a deep navy blue background.`),
  'app-freshcrate': icon(`${APP} A weekly meal kit delivery service: a small wooden crate filled with fresh green vegetables and a red tomato, on a fresh lime green background.`),
  'app-cloudvault': icon(`${APP} A cloud backup service: a white cloud with a small vault dial in its centre, on a sky blue gradient.`),
  'app-ironworks-gym': icon(`${APP} A gym membership: a black iron kettlebell with an orange highlight, on a warm steel grey background.`),
  'app-music': icon(`${APP} A music streaming service: white sound wave bars, on a magenta to purple gradient.`),
  'app-news': icon(`${APP} A daily news subscription: a folded newspaper in white and grey, on a deep charcoal background.`),
  'app-meditation': icon(`${APP} A meditation app: a single white lotus flower, on a soft sage green background.`),
  // the deposit, from the landlord's property manager to the tenant's credit union (../screens/deposit.webp); the
  // property manager's icon a plain grey button with a dark glyph, as a utility app's is
  'logo-westlake-property': icon(`${KEY} A property management company's tenant portal: a house roofline with a small chimney above a gentle lake wave, drawn in thick rounded strokes.`),
  'logo-bay-federal': icon(`${APP} A credit union's banking app: a white suspension bridge arch over water, on a navy blue background.`),
  // the move-out photos sent with the deposit request
  'moveout-living': part(`A phone photo from a tenant's move-out inspection: the empty, freshly cleaned living room of a small apartment, swept hardwood floors, clean white walls, bare windows. ${MOVE_OUT}`),
  'moveout-kitchen': part(`A phone photo from a tenant's move-out inspection: the empty, freshly cleaned kitchen of a small apartment, wiped counters, a clean stove and an empty open fridge. ${MOVE_OUT}`),
  'moveout-bath': part(`A phone photo from a tenant's move-out inspection: the freshly cleaned bathroom of a small apartment, a spotless white tub, sink and mirror, white tiles. ${MOVE_OUT}`),
  'moveout-bedroom': part(`A phone photo from a tenant's move-out inspection: the empty, freshly cleaned bedroom of a small apartment, vacuumed carpet, an empty closet with its doors open. ${MOVE_OUT}`),
  // the Lisbon trip's other bookings, beside the hotel: the dinners, the day in Sintra
  'lisbon-dinner': part(`A dinner table at a cosy Lisbon tasca at night: grilled octopus with potatoes and olive oil, a plate of clams in garlic and coriander, two glasses of vinho verde, warm candlelight, blue and white azulejo tiles on the wall behind. ${LOOK}`),
  'lisbon-sintra': part(`Pena Palace in Sintra on its forested hilltop, its red and yellow towers bright against a clear blue sky on a November morning, seen from the park below. ${LOOK}`),
};
const spec = (id) => (typeof PROMPTS[id] === 'string' ? { prompt: PROMPTS[id] } : PROMPTS[id]);
const fileOf = (id) => join(spec(id).part ? PARTS : OUT, `${id}.webp`);

const magick = (...args) => execFileSync('magick', args.flat(Infinity), { stdio: ['ignore', 'ignore', 'inherit'] });
const fill = (from, to, w = W, h = H) => magick(from, '-resize', `${w}x${h}^`, '-gravity', 'center', '-extent', `${w}x${h}`, '-strip', '-quality', '82', to);

function falKey() {
  const key = execFileSync('security', ['find-generic-password', '-s', 'fal-key', '-w'], { encoding: 'utf8' }).trim();
  if (!key) throw new Error('no fal key in the keychain (service fal-key)');
  return key;
}

async function generate(id, key) {
  const { prompt, square } = spec(id);
  const input = { prompt, aspect_ratio: square ? '1:1' : '16:9', resolution: '1K', output_format: 'png', num_images: 1 };
  const res = await fetch(`https://fal.run/${MODEL}`, { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(300000) });
  if (!res.ok) throw new Error(`${id}: ${MODEL} answered ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const url = json.images?.[0]?.url;
  if (!url) throw new Error(`${id}: ${MODEL} returned no image: ${JSON.stringify(json).slice(0, 400)}`);
  const img = await fetch(url);
  if (!img.ok) throw new Error(`${id}: the image at ${url} answered ${img.status}`);
  const raw = join(TMP, `${id}.png`);
  writeFileSync(raw, Buffer.from(await img.arrayBuffer()));
  if (square) fill(raw, fileOf(id), ICON, ICON);
  else fill(raw, fileOf(id));
  return { id, model: MODEL, prompt, request_id: res.headers.get('x-fal-request-id') ?? json.request_id ?? null, at: new Date().toISOString() };
}

mkdirSync(PARTS, { recursive: true });
const ask = process.argv.slice(2);
const want = Object.keys(PROMPTS).filter((id) => ask.includes('all') || ask.includes(id) || (!ask.length && !existsSync(fileOf(id))));
if (!want.length) { console.log('all chat images on disk'); process.exit(0); }
const key = falKey();
// the log keeps only what is generated here still
const log = Object.fromEntries(Object.entries(existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : {}).filter(([id]) => id in PROMPTS));
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
