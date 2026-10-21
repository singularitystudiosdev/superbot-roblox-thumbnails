// What every sidebar variant shows: the nav, the account and the chats. The first chat is the creative's own, live on
// the screen ("Keep improving my Roblox thumbnails"); every other one is a finished or ongoing superbot chat whose
// conversation and activity are in transcripts.bdeb2397.js, opened by clicking its row (chatview.bdeb2397.js). No two
// chats do the same job. Icons are Fluent Emoji 3D: ../img/fx is the creative's set, ./fx the ones added for the
// sidebar (fx/CREDITS.txt).

export const FX = {
  picture: '../img/fx/framed_picture.png',
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
  film: './fx/film_frames.png',
  card: './fx/credit_card.png',
  plane: './fx/airplane_departure.png',
  barber: './fx/barber_pole.png',
  inbox: './fx/inbox_tray.png',
  bike: './fx/bicycle.png',
  map: './fx/world_map.png',
  house: './fx/house.png',
  handshake: './fx/handshake.png',
  calendar: './fx/spiral_calendar.png',
  search: './fx/magnifying_glass_tilted_left.png',
  bell: './fx/bell.png',
  scissors: './fx/scissors.png',
  luggage: './fx/luggage.png',
};

export const NAV = [
  { label: 'New chat', fx: 'pencil' },
  { label: 'Automations', fx: 'loop' },
];

// short enough to sit whole beside the footer's two buttons at the sidebar's width
export const ACCOUNT = { name: 'ROB IT', avatar: '../rbx/assets/a3def5f381990d.webp' };

// newest first; `bucket` is the day group the date variants use; `live` is the creative's own chat
export const CHATS = [
  { id: 'thumbs', title: 'Keep improving my Roblox thumbnails', fx: 'picture', time: 'Now', bucket: 'Today', pinned: true, active: true, live: true },
  { id: 'sponsors', title: 'Email YouTubers to sponsor my SaaS', fx: 'envelope', time: '25m', bucket: 'Today', pinned: true, unread: true },
  { id: 'tickets', title: 'Get 2 concert tickets under $150 each', fx: 'tickets', time: '1h', bucket: 'Today' },
  { id: 'lunch', title: 'Order me a surprise lunch every Friday', fx: 'takeout', time: '2h', bucket: 'Today', pinned: true },
  { id: 'youtube', title: 'Optimize my YouTube thumbnails', fx: 'film', time: '4h', bucket: 'Today' },
  { id: 'subscriptions', title: "Cancel the subscriptions I don't use", fx: 'card', time: 'Yesterday', bucket: 'Yesterday' },
  { id: 'flights', title: 'Book a flight to Tokyo under $700', fx: 'plane', time: 'Yesterday', bucket: 'Yesterday' },
  { id: 'haircut', title: 'Book a haircut every 4 weeks', fx: 'barber', time: 'Mon', bucket: 'Earlier' },
  { id: 'inbox', title: 'Keep my inbox at zero', fx: 'inbox', time: 'Sun', bucket: 'Earlier' },
  { id: 'bike', title: 'Find a used road bike under $600', fx: 'bike', time: 'Oct 15', bucket: 'Earlier' },
  { id: 'lisbon', title: 'Plan a 3-day trip to Lisbon', fx: 'map', time: 'Oct 14', bucket: 'Earlier' },
  { id: 'deposit', title: 'Get my security deposit back', fx: 'house', time: 'Oct 12', bucket: 'Earlier' },
];
