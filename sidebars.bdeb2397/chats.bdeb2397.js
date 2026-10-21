// What every sidebar variant shows: the nav, the account and the chats. The open chat is the creative's own ("Keep
// improving my Roblox thumbnails"); the rest are the same owner's other superbot chats. Icons are Fluent Emoji 3D:
// ../img/fx is the creative's set, ./fx the ones added for the sidebar (fx/CREDITS.txt).

export const FX = {
  picture: '../img/fx/framed_picture.png',
  palette: '../img/fx/artist_palette.png',
  globe: '../img/fx/globe_with_meridians.png',
  laptop: '../img/fx/laptop.png',
  bars: '../img/fx/bar_chart.png',
  loop: '../img/fx/counterclockwise_arrows_button.png',
  camera: './fx/movie_camera.png',
  chartUp: './fx/chart_increasing.png',
  memo: './fx/memo.png',
  money: './fx/money_bag.png',
  notes: './fx/musical_notes.png',
  megaphone: './fx/megaphone.png',
  pencil: './fx/pencil.png',
};

export const NAV = [
  { label: 'New chat', fx: 'pencil' },
  { label: 'Automations', fx: 'loop' },
];

// short enough to sit whole beside the footer's two buttons at the sidebar's 180px
export const ACCOUNT = { name: 'ROB IT', avatar: '../rbx/assets/a3def5f381990d.webp' };

// newest first; `bucket` is the day group the date variants use
export const CHATS = [
  { id: 'thumbs', title: 'Keep improving my Roblox thumbnails', fx: 'picture', time: 'Now', bucket: 'Today', pinned: true, active: true },
  { id: 'icon', title: 'Make a new game icon for ROB IT', fx: 'palette', time: '12m', bucket: 'Today', pinned: true, unread: true },
  { id: 'trailer', title: 'Cut a 30-second trailer from gameplay', fx: 'camera', time: '1h', bucket: 'Today' },
  { id: 'players', title: 'Tell me what changed each morning', fx: 'chartUp', time: '8:00 AM', bucket: 'Today', pinned: true },
  { id: 'updatelog', title: 'Write the vault update log', fx: 'memo', time: 'Yesterday', bucket: 'Yesterday' },
  { id: 'translate', title: 'Translate my game page to Spanish', fx: 'globe', time: 'Yesterday', bucket: 'Yesterday' },
  { id: 'gamepass', title: 'Price the VIP game pass', fx: 'money', time: 'Mon', bucket: 'Earlier' },
  { id: 'lag', title: 'Fix the lag spike on the museum map', fx: 'laptop', time: 'Sun', bucket: 'Earlier' },
  { id: 'creators', title: 'Find YouTubers who cover heist games', fx: 'megaphone', time: 'Oct 15', bucket: 'Earlier' },
  { id: 'trends', title: 'Find heist games growing this month', fx: 'bars', time: 'Oct 14', bucket: 'Earlier' },
  { id: 'sounds', title: 'Find alarm sounds for the prototype', fx: 'notes', time: 'Oct 12', bucket: 'Earlier' },
];
