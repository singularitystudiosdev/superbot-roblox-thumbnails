// Puts together the card pictures that show what a card reports (chatview.bdeb2397.js draws them): the icons of the
// channels written to or booked, of the subscriptions found or cancelled, of the two banks a transfer went between;
// the airline of a fare; the photos a card counts (the move-out photos, a trip's stops, a channel's new thumbnails);
// and a crop of the app superbot had open (../screens/), so the card and the computer view beside it agree. Every
// piece is a picture already here: ../chats/parts/ (made by chat-images.bdeb2397.mjs), ../chats/, ../screens/.
// Each card is laid out in HTML, drawn by headless Chromium at 2x and saved as 768x432 WebP to ../chats/<id>.webp.
// node sidebars.bdeb2397/tools/chat-cards.b50586fe.mjs [id ...]   (no ids: every card)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CHATS = join(ROOT, 'chats'), PARTS = join(CHATS, 'parts'), SCREENS = join(ROOT, 'screens');
const TMP = mkdtempSync(join(tmpdir(), 'chat-cards-'));
const W = 768, H = 432;

const chat = (id) => join(CHATS, `${id}.webp`);
const part = (id) => join(PARTS, `${id}.webp`);
const channel = (id) => part(`ch-${id}`);
const app = (id) => part(`app-${id}`);
// a region of a capture, in the capture's own pixels (2940x1674)
function crop(screen, [x, y, w, h]) {
  const out = join(TMP, `${screen}-${x}-${y}.png`);
  execFileSync('magick', [join(SCREENS, `${screen}.webp`), '-crop', `${w}x${h}+${x}+${y}`, '+repage', out]);
  return out;
}

const CARDS = {
  // the 46 emails, one per channel: the channels in the inbox, then the one that said yes, then all 3 booked
  'sponsors-outreach': ['avatars', ['desk-setup-daily', 'calm-code', 'tidy-tabs', 'workflow-weekly', 'focus-friday', 'keyboard-coffee'].map(channel)],
  'sponsors-desk-setup': ['avatar', channel('desk-setup-daily')],
  'sponsors-calm-code': ['avatar', channel('calm-code')],
  'sponsors-booked': ['avatars', ['desk-setup-daily', 'calm-code', 'tidy-tabs'].map(channel)],
  // the 10 videos updated: the channel's winning thumbnails
  'yt-updated': ['photos', ['yt-gnocchi-2', 'yt-ramen', 'yt-curry', 'yt-salmon'].map(chat)],
  // the subscriptions on the statements, then the 4 cancelled: 2 streaming apps, a meal kit, a cloud backup
  'subs-found': ['apps', ['streambox', 'reelhouse', 'freshcrate', 'cloudvault', 'ironworks-gym', 'music', 'news', 'meditation'].map(app)],
  'subs-cancelled': ['apps', ['streambox', 'reelhouse', 'freshcrate', 'cloudvault'].map(app), { cancelled: true }],
  // each fare's airline, as its Google Flights row shows it: American (with Japan Airlines) via LAX, Japan Airlines nonstop
  'flights-cheapest': ['mark', () => crop('flights', [485, 1124, 90, 90])],
  'flights-booked': ['mark', () => crop('flights', [485, 822, 90, 90])],
  // the week on the calendar: the team dinner Wednesday, the haircut moved to Thursday
  'haircut-moved': ['shot', () => crop('haircut', [1550, 1225, 592, 333])],
  // the inbox after the sort: only the starred ones that need an answer, none unread; then the 5 days at zero
  'inbox-sorted': ['shot', () => crop('inbox', [537, 300, 900, 506])],
  'inbox-week': ['streak', ['M', 'T', 'W', 'T', 'F']],
  // the hotel's own photo in the results, then the trip: the hotel, the dinners, Sintra
  'lisbon-hotel': ['shot', () => crop('lisbon', [52, 620, 510, 287])],
  'lisbon-plan': ['photos', () => [chat('lisbon-hotel'), part('lisbon-dinner'), part('lisbon-sintra')]],
  // the move-out photos the request went with, then the deposit from the property manager to the credit union
  'deposit-letter': ['photos', ['living', 'kitchen', 'bath', 'bedroom'].map((room) => part(`moveout-${room}`))],
  'deposit-paid': ['transfer', [part('logo-westlake-property'), part('logo-bay-federal')]],
};

const src = (path) => `data:image/${path.endsWith('.png') ? 'png' : 'webp'};base64,${readFileSync(path).toString('base64')}`;
const img = (path, cls = '') => `<img class="${cls}" src="${src(path)}" alt="">`;
// lucide (ISC): check, x, arrow-right
const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const CHECK = svg('<path d="M20 6 9 17l-5-5"/>'), X = svg('<path d="M18 6 6 18M6 6l12 12"/>'), ARROW = svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>');

const tile = (path, badge = '') => `<span class="app">${img(path)}${badge}</span>`;
const LAYOUT = {
  // one channel: its icon on a blur of itself, as a channel's page shows its avatar over its colors
  avatar: (path) => `<div class="c">${img(path, 'blur')}${img(path, 'av one')}</div>`,
  avatars: (paths) => `<div class="c ground"><div class="set n${paths.length}">${paths.map((p) => img(p, 'av')).join('')}</div></div>`,
  apps: (paths, { cancelled } = {}) => `<div class="c ground"><div class="set apps n${paths.length}">${paths.map((p) => tile(p, cancelled ? `<i class="x">${X}</i>` : '')).join('')}</div></div>`,
  mark: (path) => `<div class="c white">${img(path, 'mark')}</div>`,
  photos: (paths) => `<div class="c photos n${paths.length}">${paths.map((p) => img(p)).join('')}</div>`,
  transfer: ([from, to]) => `<div class="c ground"><div class="set transfer">${tile(from)}<i class="arrow">${ARROW}</i>${tile(to)}</div></div>`,
  streak: (days) => `<div class="c white"><div class="streak">${days.map((d) => `<span><i>${CHECK}</i><b>${d}</b></span>`).join('')}</div></div>`,
  shot: (path) => `<div class="c">${img(path, 'cover')}</div>`,
};

const CSS = `
* { box-sizing: border-box; margin: 0; }
body { width: ${W}px; height: ${H}px; overflow: hidden; }
img { display: block; }
.c { position: relative; width: ${W}px; height: ${H}px; display: grid; place-items: center; overflow: hidden; }
.ground { background: linear-gradient(#f6f6f9, #e9e9ef); }
.white { background: #fff; }
.cover { width: 100%; height: 100%; object-fit: cover; }
.blur { position: absolute; inset: -12%; width: 124%; height: 124%; object-fit: cover; filter: blur(46px) saturate(1.25); }
.set { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 28px; }
.av { border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 1px rgba(0,0,0,.08), 0 6px 18px rgba(0,0,0,.14); }
.av.one { position: relative; width: 300px; height: 300px; box-shadow: 0 0 0 8px rgba(255,255,255,.92), 0 16px 44px rgba(0,0,0,.28); }
.n3 .av { width: 216px; height: 216px; }
.n6 { width: 580px; } .n6 .av { width: 172px; height: 172px; }
.app { position: relative; display: block; }
.app img { width: 100%; height: 100%; object-fit: cover; border-radius: 22.5%; box-shadow: 0 0 0 1px rgba(0,0,0,.06), 0 6px 16px rgba(0,0,0,.14); }
.apps.n8 { width: 690px; } .apps.n8 .app { width: 150px; height: 150px; }
.apps.n4 .app { width: 154px; height: 154px; }
.x { position: absolute; top: -16px; right: -16px; width: 60px; height: 60px; border-radius: 50%; display: grid; place-items: center; background: #ff3b30; box-shadow: 0 0 0 6px #efeff4; }
.x svg { width: 32px; height: 32px; fill: none; stroke: #fff; stroke-width: 3.6; stroke-linecap: round; }
.transfer { gap: 34px; } .transfer .app { width: 216px; height: 216px; }
.arrow svg { width: 92px; height: 92px; fill: none; stroke: #8e8e93; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.mark { width: 330px; height: 330px; object-fit: contain; }
.photos { display: grid; gap: 12px; background: #f9f9fb; place-items: stretch; }
.photos img { width: 100%; height: 100%; min-width: 0; min-height: 0; object-fit: cover; }
.photos.n4 { grid-template: repeat(2, minmax(0, 1fr)) / repeat(2, minmax(0, 1fr)); }
.photos.n3 { grid-template: minmax(0, 1fr) / repeat(3, minmax(0, 1fr)); }
.streak { display: flex; gap: 22px; }
.streak span { display: grid; justify-items: center; gap: 20px; }
.streak i { width: 120px; height: 120px; border-radius: 50%; display: grid; place-items: center; background: #34c759; box-shadow: 0 8px 20px rgba(52,199,89,.32); }
.streak svg { width: 62px; height: 62px; fill: none; stroke: #fff; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }
.streak b { font: 600 36px/1 -apple-system, system-ui, sans-serif; color: #8e8e93; }
`;

const ask = process.argv.slice(2);
const want = ask.length ? ask.filter((id) => id in CARDS) : Object.keys(CARDS);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const failed = [];
// in order: a card made from another card (the trip from the hotel's) comes after it
for (const id of want) {
  try {
    const [layout, given, opts] = CARDS[id];
    const pieces = typeof given === 'function' ? given() : given;
    // a streak's pieces are its days, not files
    const missing = [pieces].flat().filter((p) => p.startsWith('/') && !existsSync(p));
    if (missing.length) throw new Error(`missing ${missing.join(', ')} (run chat-images.bdeb2397.mjs first)`);
    await page.setContent(`<!doctype html><style>${CSS}</style>${LAYOUT[layout](pieces, opts)}`, { waitUntil: 'load' });
    const png = join(TMP, `${id}.png`);
    await page.screenshot({ path: png, clip: { x: 0, y: 0, width: W, height: H } });
    execFileSync('magick', [png, '-resize', `${W}x${H}`, '-strip', '-quality', '84', chat(id)]);
    console.log(`put together ${id}`);
  } catch (e) {
    console.error(`${id}:`, e);
    failed.push(id);
  }
}
await browser.close();
console.log(`${want.length - failed.length} cards, ${failed.length} failed${failed.length ? `: ${failed.join(', ')}` : ''}`);
process.exit(failed.length ? 1 : 0);
