// What every sidebar variant shows: the nav, the account and the chats. The first chat is the creative's own, live on
// the screen ("Keep improving my Roblox thumbnails"); chats started in the page (New chat, Automations) join it. Of the
// recorded chats (transcripts.bdeb2397.js, plays.8889b4ff.js) only the ticket price watch is on the list, opening its
// played run; the rest are off it, so no row or ?chat= opens them.
// Icons are Fluent Emoji 3D: ../img/fx is the creative's set, ./fx the ones added for the
// sidebar (fx/CREDITS.txt). A chat is marked with the app it is done in (screens.bdeb2397.js `app`), its logo redrawn
// in the same 3D style (./fx/app-*.png, tools/app-fx.4bc2a2d5.mjs). The fx pack (fx-pack.d3748edf.js) adds 864 more by
// their Fluent names, for any niche a chat is about; the keys below keep their own files.

import { PACK_FX } from './fx-pack.d3748edf.js';

export const FX = {
  ...PACK_FX,
  roblox: './fx/app-roblox.png',
  gmail: './fx/app-gmail.png',
  vividseats: './fx/app-vividseats.png',
  ubereats: './fx/app-ubereats.png',
  youtube: './fx/app-youtube.png',
  flights: './fx/app-flights.png',
  fresha: './fx/app-fresha.png',
  craigslist: './fx/app-craigslist.png',
  hotels: './fx/app-hotels.png',
  // the share box's places to post a chat's link (chat-ui.854d0793.js)
  x: './fx/app-x.png',
  discord: './fx/app-discord.png',
  facebook: './fx/app-facebook.png',
  reddit: './fx/app-reddit.png',
  palette: '../img/fx/artist_palette.png',
  globe: '../img/fx/globe_with_meridians.png',
  laptop: '../img/fx/laptop.png',
  bars: '../img/fx/bar_chart.png',
  loop: '../img/fx/counterclockwise_arrows_button.png',
  outbox: '../img/fx/outbox_tray.png',
  hourglass: '../img/fx/hourglass_not_done.png',
  check: '../img/fx/check_mark_button.png',
  trophy: '../img/fx/trophy.png',
  chartDown: '../img/fx/chart_decreasing.png',
  floppy: '../img/fx/floppy_disk.png',
  party: '../img/fx/party_popper.png',
  chartUp: './fx/chart_increasing.png',
  memo: './fx/memo.png',
  money: './fx/money_bag.png',
  pencil: './fx/pencil.png',
  folder: './fx/file_folder.png',
  folderOpen: './fx/open_file_folder.png',
  envelope: './fx/envelope_with_arrow.png',
  tickets: './fx/admission_tickets.png',
  takeout: './fx/takeout_box.png',
  card: './fx/credit_card.png',
  plane: './fx/airplane_departure.png',
  barber: './fx/barber_pole.png',
  inbox: './fx/inbox_tray.png',
  bike: './fx/bicycle.png',
  handshake: './fx/handshake.png',
  calendar: './fx/spiral_calendar.png',
  search: './fx/magnifying_glass_tilted_left.png',
  bell: './fx/bell.png',
  scissors: './fx/scissors.png',
  luggage: './fx/luggage.png',
  // the credits row's coin (sidebar-tools.854d0793.js) and Billing's packs, silver and gold (the rainbow pack is the
  // silver coin with a rainbow over it, settings-billing.bdeb2397.js), drawn in the same 3D style
  // (tools/coin-fx.0ecb8f7c.mjs)
  coin: './fx/coin-silver.0ecb8f7c.png',
  coinGold: './fx/coin-gold.0ecb8f7c.png',
  // the share box's offer (chat-ui.854d0793.js)
  gift: './fx/wrapped_gift.png',
};

export const NAV = [
  { label: 'New chat', fx: 'pencil' },
  { label: 'Automations', fx: 'loop' },
];

// short enough to sit whole beside the footer's two buttons at the sidebar's width
export const ACCOUNT = { name: 'ROB IT', avatar: '../rbx/assets/a3def5f381990d.webp' };

// newest first; `bucket` is the day group the date variants use; `live` is the creative's own chat; `working` chats are
// at it now, their tasks having no end, so their icons keep turning in the sidebar (spin.4bc2a2d5.js)
export const CHATS = [
  { id: 'thumbs', title: 'Keep improving my Roblox thumbnails', fx: 'roblox', time: 'Now', bucket: 'Today', pinned: true, active: true, live: true, working: true },
  { id: 'pricewatch', title: 'Buy tickets for Neon Harbor anytime they drop below $150', fx: 'vividseats', time: '1h', bucket: 'Today', working: true },
];
