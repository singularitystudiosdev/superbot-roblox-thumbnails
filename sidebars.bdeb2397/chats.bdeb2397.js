// What every sidebar variant shows: the nav, the projects, the account and the chats. The open chat is the creative's
// own ("Keep improving my Roblox thumbnails"); the rest are the same owner's other superbot chats. Figures are
// illustrative, as the creative's are (img/CREDITS.txt). Icons are Fluent Emoji 3D: ../img/fx is the creative's set,
// ./fx the ones added for the sidebar (fx/CREDITS.txt).

export const FX = {
  picture: '../img/fx/framed_picture.png',
  palette: '../img/fx/artist_palette.png',
  globe: '../img/fx/globe_with_meridians.png',
  laptop: '../img/fx/laptop.png',
  bars: '../img/fx/bar_chart.png',
  loop: '../img/fx/counterclockwise_arrows_button.png',
  hourglass: '../img/fx/hourglass_not_done.png',
  check: '../img/fx/check_mark_button.png',
  trophy: '../img/fx/trophy.png',
  camera: './fx/movie_camera.png',
  chartUp: './fx/chart_increasing.png',
  memo: './fx/memo.png',
  money: './fx/money_bag.png',
  notes: './fx/musical_notes.png',
  megaphone: './fx/megaphone.png',
  pencil: './fx/pencil.png',
  computer: './fx/desktop_computer.png',
  robot: './fx/robot.png',
  books: './fx/books.png',
  gem: './fx/gem_stone.png',
  folder: './fx/file_folder.png',
  pin: './fx/pushpin.png',
  bell: './fx/bell.png',
  clock: './fx/alarm_clock.png',
};

// the status a chat can be in, the icon a status-led variant shows for it, and its words
export const STATUS = {
  running: { fx: 'hourglass', label: 'Working' },
  needs: { fx: 'bell', label: 'Needs you' },
  scheduled: { fx: 'clock', label: 'Scheduled' },
  done: { fx: 'check', label: 'Done' },
};

export const NAV = [
  { label: 'New chat', fx: 'pencil' },
  { label: 'Computers', fx: 'computer' },
  { label: 'Agents', fx: 'robot' },
  { label: 'Library', fx: 'books' },
  { label: 'Automations', fx: 'loop' },
];

export const PROJECTS = [
  { id: 'robit', name: 'ROB IT', fx: 'gem' },
  { id: 'next', name: 'Next game', fx: 'folder' },
];

export const ACCOUNT = { name: 'ROB IT studio', avatar: '../rbx/assets/a3def5f381990d.webp' };

// newest first; `bucket` is the superbot desktop's fold (Today / Yesterday / Earlier)
export const CHATS = [
  { id: 'thumbs', title: 'Keep improving my Roblox thumbnails', fx: 'picture', status: 'running', project: 'robit', time: 'Now', bucket: 'Today', pinned: true, active: true,
    preview: 'Iteration 4 hit 1.46%, a new best', metric: '1.46%', thumb: '../img/iter/iter-6.webp' },
  { id: 'icon', title: 'Make a new game icon for ROB IT', fx: 'palette', status: 'needs', project: 'robit', time: '12m', bucket: 'Today', pinned: true, unread: true,
    preview: '3 icons ready. Pick one to test' },
  { id: 'trailer', title: 'Cut a 30-second trailer from gameplay', fx: 'camera', status: 'running', project: 'robit', time: '1h', bucket: 'Today',
    preview: 'Rendering the police chase shot', thumb: '../rbx/assets/7d845c7485b985.webp' },
  { id: 'players', title: 'Tell me what changed each morning', fx: 'chartUp', status: 'scheduled', project: 'robit', time: '8:00 AM', bucket: 'Today', pinned: true,
    preview: 'Daily players up 18% since the museum update', metric: '+18%' },
  { id: 'updatelog', title: 'Write the vault update log', fx: 'memo', status: 'done', project: 'robit', time: 'Yesterday', bucket: 'Yesterday',
    preview: 'Posted to the game page and Discord', thumb: '../rbx/assets/11c779beff20d2.webp' },
  { id: 'translate', title: 'Translate my game page to Spanish', fx: 'globe', status: 'done', project: 'robit', time: 'Yesterday', bucket: 'Yesterday',
    preview: 'The Spanish page is live' },
  { id: 'gamepass', title: 'Price the VIP game pass', fx: 'money', status: 'done', project: 'robit', time: 'Mon', bucket: 'Earlier',
    preview: 'Set to 149 Robux after a 2-week test', metric: '+12%' },
  { id: 'lag', title: 'Fix the lag spike on the museum map', fx: 'laptop', status: 'done', project: 'robit', time: 'Sun', bucket: 'Earlier',
    preview: 'Part count down 31%, frame time steady', thumb: '../rbx/assets/cd3cce6d08bc20.webp' },
  { id: 'creators', title: 'Find YouTubers who cover heist games', fx: 'megaphone', status: 'done', project: 'robit', time: 'Oct 15', bucket: 'Earlier',
    preview: 'Found 24 channels, drafted 8 emails' },
  { id: 'trends', title: 'Find heist games growing this month', fx: 'bars', status: 'done', project: 'next', time: 'Oct 14', bucket: 'Earlier',
    preview: '8 games, sorted by 30-day growth' },
  { id: 'sounds', title: 'Find alarm sounds for the prototype', fx: 'notes', status: 'done', project: 'next', time: 'Oct 12', bucket: 'Earlier',
    preview: '12 free-to-use alarms in one folder' },
];

// the open chat's live state, for the variant that expands it (the creative's activity tab, img and figures)
export const LIVE = {
  step: 'Waiting for the next data update',
  best: 'Best: iteration 4 at 1.46%',
  strip: ['../img/iter/iter-6.webp', '../img/iter/iter-1.webp', '../img/iter/iter-3.webp'],
};
