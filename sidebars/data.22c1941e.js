// What every chat-list variant draws from: the user's chats, newest first, and the two icon sets Manus's sidebar pairs
// (line icons for navigation, filled glyphs for a chat's kind). The first chat is the one this spot plays: it is not in
// the list until the prompt is sent (sidebar.22c1941e.js grows it in), and it carries the running ring while it works.

// lucide (https://lucide.dev, ISC), 24px grid, drawn as strokes by .sb-ln
export const LINE = {
  pen: '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>',
  search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  scheduled: '<path d="M16 14v2.2l1.6 1M16 2v3m5 2.338V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2.338M3 9h5.859M8 2v3"/><circle cx="16" cy="16" r="6"/>',
  library: '<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>',
  apps: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  chats: '<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>',
  folderPlus: '<path d="M12 10v6m-3-3h6m5 7a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  folderOpen: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M5 12h14m-7-7v14"/>',
  filter: '<path d="M2 5h20M6 12h12m-9 7h6"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0m-10.47-5.674A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  devices: '<path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8m-2 4v-3.96v3.15M7 19h5"/><rect width="6" height="10" x="16" y="12" rx="2"/>',
  settings: '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
  gift: '<path d="M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95M2 15l6 6"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91"/>',
  pin: '<path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
};

// Phosphor fill (https://phosphoricons.com, MIT), 256px grid, painted in the muted grey by .sb-gl
export const GLYPH = {
  image: '<path d="M216 40H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16m-60 48a12 12 0 1 1-12 12 12 12 0 0 1 12-12m60 112H40v-39.31l46.34-46.35a8 8 0 0 1 11.32 0L165 181.66a8 8 0 0 0 11.32-11.32l-17.66-17.65L173 138.34a8 8 0 0 1 11.31 0L216 170.07z"/>',
  controller: '<path d="M247.44 173.75a.7.7 0 0 0 0-.14l-16.39-84.17v-.18A60.08 60.08 0 0 0 172 40H83.89a59.88 59.88 0 0 0-59 49.52L8.58 173.61a.7.7 0 0 0 0 .14 36 36 0 0 0 60.9 31.71l.35-.37L109.52 160h37l39.71 45.09c.11.13.23.25.35.37A36.08 36.08 0 0 0 212 216a36 36 0 0 0 35.43-42.25ZM104 112h-8v8a8 8 0 0 1-16 0v-8h-8a8 8 0 0 1 0-16h8v-8a8 8 0 0 1 16 0v8h8a8 8 0 0 1 0 16m40-8a8 8 0 0 1 8-8h24a8 8 0 0 1 0 16h-24a8 8 0 0 1-8-8m84.37 87.47a19.84 19.84 0 0 1-12.9 8.23 20.09 20.09 0 0 1-17.47-5.39L167.8 160h4.2a60 60 0 0 0 51-28.38l8.74 45a19.82 19.82 0 0 1-3.37 14.85"/>',
  calendar: '<path d="M208 32h-24v-8a8 8 0 0 0-16 0v8H88v-8a8 8 0 0 0-16 0v8H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16M84 184a12 12 0 1 1 12-12 12 12 0 0 1-12 12m44 0a12 12 0 1 1 12-12 12 12 0 0 1-12 12m0-40a12 12 0 1 1 12-12 12 12 0 0 1-12 12m44 40a12 12 0 1 1 12-12 12 12 0 0 1-12 12m0-40a12 12 0 1 1 12-12 12 12 0 0 1-12 12m36-64H48V48h24v8a8 8 0 0 0 16 0v-8h80v8a8 8 0 0 0 16 0v-8h24Z"/>',
  chat: '<path d="M128 24a104 104 0 0 0-91.82 152.88l-11.35 34.05a16 16 0 0 0 20.24 20.24l34.05-11.35A104 104 0 1 0 128 24M84 140a12 12 0 1 1 12-12 12 12 0 0 1-12 12m44 0a12 12 0 1 1 12-12 12 12 0 0 1-12 12m44 0a12 12 0 1 1 12-12 12 12 0 0 1-12 12"/>',
  film: '<path d="M216 104H102.09L210 75.51a8 8 0 0 0 5.68-9.84l-8.16-30a15.93 15.93 0 0 0-19.42-11.13L35.81 64.74a15.75 15.75 0 0 0-9.7 7.4 15.5 15.5 0 0 0-1.55 12L32 111.56V200a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16v-88a8 8 0 0 0-8-8m-23.84-64 6 22.07L164.57 71l-28.13-16.28ZM77.55 70.27l28.12 16.24-59.6 15.73-6-22.08Z"/>',
  chart: '<path d="M232 208a8 8 0 0 1-8 8H32a8 8 0 0 1 0-16h8v-64a8 8 0 0 1 8-8h24a8 8 0 0 1 8 8v64h16V88a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v112h16V40a8 8 0 0 1 8-8h40a8 8 0 0 1 8 8v160h8a8 8 0 0 1 8 8"/>',
  code: '<path d="M216 40H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16M92.8 145.6a8 8 0 1 1-9.6 12.8l-32-24a8 8 0 0 1 0-12.8l32-24a8 8 0 0 1 9.6 12.8L69.33 128Zm58.89-71.4-32 112a8 8 0 1 1-15.38-4.4l32-112a8 8 0 0 1 15.38 4.4m53.11 60.2-32 24a8 8 0 0 1-9.6-12.8l23.47-17.6-23.47-17.6a8 8 0 1 1 9.6-12.8l32 24a8 8 0 0 1 0 12.8"/>',
  megaphone: '<path d="M200 72h-39.8c-2.91-.17-53.62-3.74-101.91-44.24A16 16 0 0 0 32 40v160a16 16 0 0 0 26.29 12.25c37.77-31.68 77-40.76 93.71-43.3v31.72a16 16 0 0 0 7.12 13.33l11 7.33A16 16 0 0 0 194.5 212l11.77-44.36A48 48 0 0 0 200 72m-21 135.89v.11l-11-7.33V168h21.6ZM200 152h-32V88h32a32 32 0 1 1 0 64"/>',
  store: '<path d="M231.69 93.81 217.35 43.6A16.07 16.07 0 0 0 202 32H54a16.07 16.07 0 0 0-15.35 11.6L24.31 93.81A8 8 0 0 0 24 96v16a40 40 0 0 0 16 32v72a8 8 0 0 0 8 8h160a8 8 0 0 0 8-8v-72a40 40 0 0 0 16-32V96a8 8 0 0 0-.31-2.19M88 112a24 24 0 0 1-35.12 21.26 8 8 0 0 0-1.82-1.06A24 24 0 0 1 40 112v-8h48Zm64 0a24 24 0 0 1-48 0v-8h48Zm64 0a24 24 0 0 1-11.07 20.2 8 8 0 0 0-1.8 1.05A24 24 0 0 1 168 112v-8h48Z"/>',
  check: '<path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m45.66 85.66-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32"/>',
};

// `thumb` is a path from the spot's root; the live chat's thumbnail follows its newest winning iteration
export const CHATS = [
  { live: true, title: 'Improve my ROB IT thumbnails', glyph: 'image', project: 'ROB IT', when: 'Now', group: 'Today', status: 'running', preview: 'Reading your thumbnails', thumb: 'rbx/assets/a3def5f381990d.webp' },
  { title: 'Make a new game icon for ROB IT', glyph: 'controller', project: 'ROB IT', when: '2h', group: 'Today', status: 'done', preview: '4 icon drafts to pick from', thumb: 'img/iter/iter-2.webp' },
  { title: 'Post the update log to Discord every Friday', glyph: 'calendar', project: 'ROB IT', when: 'Fri', next: 'Fri 5:00 PM', group: 'Today', status: 'scheduled', preview: 'Next run Friday at 5:00 PM', pinned: true },
  { title: 'Sort the Discord bug reports', glyph: 'chat', project: 'ROB IT', when: 'Yesterday', group: 'Yesterday', status: 'done', preview: 'Grouped into 6 bugs, 2 already fixed' },
  { title: 'Cut a 30-second TikTok trailer', glyph: 'film', project: 'Marketing', when: 'Mon', group: 'Previous 7 days', status: 'done', preview: 'Draft 2 is ready at 1080x1920', thumb: 'img/iter/iter-1.webp' },
  { title: 'Weekly Robux earnings report', glyph: 'chart', project: 'Studio', when: 'Sun', next: 'Sun 9:00 AM', group: 'Previous 7 days', status: 'scheduled', preview: 'Next run Sunday at 9:00 AM', pinned: true },
  { title: 'Fix the leaderboard script', glyph: 'code', project: 'Studio', when: 'Oct 14', group: 'Previous 30 days', status: 'done', preview: 'Patched the DataStore retries' },
  { title: 'Find YouTubers who play heist games', glyph: 'megaphone', project: 'Marketing', when: 'Oct 11', group: 'Previous 30 days', status: 'done', preview: '24 channels with a contact email' },
  { title: 'Rewrite the ROB IT store description', glyph: 'store', project: 'ROB IT', when: 'Oct 6', group: 'Previous 30 days', status: 'done', preview: '3 versions to choose from' },
];

export const USER = { name: 'ROB IT Studio', initial: 'R', plan: 'Pro plan' };
