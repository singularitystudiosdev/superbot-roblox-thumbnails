// The chat list down the app's left edge, ten ways (?chats=1..10; chats.5a028abd.js mounts one). Each variant is its
// markup alone: every chat is marked with a Fluent 3D emoji from img/fx/, as the Activity tab marks a step, and the open
// chat's moving parts are [data-live] slots the envelope paints from t (its icon, title, short name, last message,
// current step and working dot).
import { esc } from './lib.af4c3c6b.js';

const FX = 'img/fx/';

// the open chat: a new chat until the prompt is sent, then the game's thumbnails
export const LIVE = {
  title: 'ROB IT thumbnails', short: 'Thumbnails', draft: 'New chat', hint: 'How can superbot help you today?',
  idle: 'Waiting for your message', reading: 'Reading your message',
};

// the account's other chats, newest first: the game's own work, then a second game and the group's admin
const PROJECTS = ['ROB IT', 'Vault Obby', 'Group admin'];
const DAYS = ['Today', 'Yesterday', 'This week', 'Earlier'];
const CHATS = [
  { icon: 'jack-o-lantern', title: 'Halloween event for ROB IT', short: 'Halloween', preview: 'The pumpkin heist event plan is ready for you to read.', when: '2h', clock: '9:12 AM', day: 0, project: 0, unread: 2 },
  { icon: 'money_bag', title: 'VIP game pass price', short: 'VIP pass', preview: 'Which price should I test first, 149 or 199 Robux?', when: '5h', clock: '6:40 AM', day: 0, project: 0, unread: 1, needs: true, pinned: true },
  { icon: 'hammer_and_wrench', title: 'Guards stuck on the vault stairs', short: 'Guards', preview: 'Fixed. Guards walk up the vault stairs again.', when: '1d', clock: '4:05 PM', day: 1, project: 0, pinned: true },
  { icon: 'memo', title: 'Update log for v1.4', short: 'v1.4 log', preview: 'Posted the v1.4 update log to your group.', when: '1d', clock: '11:20 AM', day: 1, project: 0 },
  { icon: 'megaphone', title: 'Sponsor the vault update', short: 'Sponsor', preview: 'Your sponsored ad for the vault update is live.', when: 'Mon', clock: 'Mon', day: 2, project: 0, pinned: true },
  { icon: 'sports_medal', title: 'Badge ideas', short: 'Badges', preview: 'Here are 12 badge ideas, rarest first.', when: 'Sun', clock: 'Sun', day: 2, project: 1 },
  { icon: 'gem_stone', title: 'Gem drop rates', short: 'Gems', preview: 'Rare gems now drop half as often.', when: 'Oct 14', clock: 'Oct 14', day: 3, project: 1 },
  { icon: 'bell', title: 'Group shout every Friday', short: 'Shouts', preview: "I'll post a group shout every Friday at 5 PM.", when: 'Oct 12', clock: 'Oct 12', day: 3, project: 2 },
];

// lucide (ISC): square-pen, search, plus, x
const LU = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const PEN = '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>';
const SEARCH = '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>';
const PLUS = '<path d="M5 12h14M12 5v14"/>';
const X = '<path d="M18 6 6 18M6 6l12 12"/>';

const ic = (name, size) => `<img class="cl-ic" src="${FX}${name}.png" alt="" width="${size}" height="${size}">`;
const slotIc = (kind, size) => `<img class="cl-ic" data-live="${kind}" src="${FX}speech_balloon.png" alt="" width="${size}" height="${size}">`;
const live = {
  icon: (size) => slotIc('icon', size),
  stepIcon: (size) => slotIc('step-icon', size),
  title: `<span class="cl-t" data-live="title">${LIVE.draft}</span>`,
  short: `<small data-live="short">${LIVE.draft}</small>`,
  preview: `<span class="cl-p" data-live="preview">${LIVE.hint}</span>`,
  step: `<span class="cl-p" data-live="step">${LIVE.idle}</span>`,
  work: '<span class="cl-work" data-live="work"><i></i>Working</span>',
  dot: '<i class="cl-dot" data-live="work"></i>',
};

const NEW_CHAT = `<div class="cl-top"><span class="cl-new">${LU(PEN)}New chat</span><span class="cl-ib" aria-hidden="true">${LU(SEARCH)}</span></div>`;
const SEARCH_BAR = (pen = true) => `<div class="cl-top"><span class="cl-search">${LU(SEARCH)}Search chats</span>${pen ? `<span class="cl-ib" aria-hidden="true">${LU(PEN)}</span>` : ''}</div>`;
const head = (text, n) => `<p class="cl-h">${text}${n == null ? '' : `<span class="cl-n">${n}</span>`}</p>`;
const sec = (inner) => `<div class="cl-sec">${inner}</div>`;
const each = (list, fn) => list.map(fn).join('');
const by = (key, v) => CHATS.filter((c) => c[key] === v);

// one line: [icon] title ... stamp
const row = (c, stamp = c.when) => `<div class="cl-row">${ic(c.icon, 16)}<span class="cl-t">${esc(c.title)}</span><em class="cl-s">${esc(stamp)}</em></div>`;
const LIVE_ROW = `<div class="cl-row is-sel">${live.icon(16)}${live.title}${live.work}</div>`;
// two lines: [icon] title ... stamp, then the last message
const row2 = (c, size) => `<div class="cl-row2${c.unread ? ' cl-unread' : ''}">${ic(c.icon, size)}<span class="cl-tx"><span class="cl-l1"><span class="cl-t">${esc(c.title)}</span><em class="cl-s">${esc(c.when)}</em></span><span class="cl-p">${esc(c.preview)}</span></span></div>`;
const count = (i) => by('project', i).length + (i === 0 ? 1 : 0);
const proj = (i, open = false) => `<div class="cl-proj">${ic(open ? 'open_file_folder' : 'file_folder', 18)}<span class="cl-t">${PROJECTS[i]}</span><span class="cl-pill">${count(i)}</span></div>`;

export const VARIANTS = [
  {
    id: 'recent', name: 'Recent list', width: 232,
    note: "The hub's own sidebar: one line per chat, newest first.",
    html: () => NEW_CHAT + sec(head('Recent') + LIVE_ROW + each(CHATS, (c) => row(c))),
  },
  {
    id: 'previews', name: 'Previews', width: 272,
    note: "Two lines per chat: the title and its last message, which updates as superbot replies.",
    html: () => SEARCH_BAR() + sec(`<div class="cl-row2 is-sel">${live.icon(28)}<span class="cl-tx"><span class="cl-l1">${live.title}${live.work}</span>${live.preview}</span></div>` + each(CHATS, (c) => row2(c, 28))),
  },
  {
    id: 'rail', name: 'Labeled rail', width: 72,
    note: 'Each chat is a 3D icon with a one-word label. The rail takes the least room.',
    html: () => `<span class="cl-tile"><span class="cl-box">${LU(PEN)}</span><small>New</small></span><hr class="cl-div">`
      + `<span class="cl-tile is-sel"><span class="cl-box">${live.icon(24)}${live.dot}</span>${live.short}</span>`
      + each(CHATS.slice(0, 7), (c) => `<span class="cl-tile"><span class="cl-box">${ic(c.icon, 24)}</span><small>${esc(c.short)}</small></span>`),
  },
  {
    id: 'days', name: 'By day', width: 232,
    note: 'Chats grouped under Today, Yesterday, This week and Earlier.',
    html: () => NEW_CHAT + each(DAYS, (d, i) => sec(head(d) + (i === 0 ? LIVE_ROW : '') + each(by('day', i), (c) => row(c, c.clock)))),
  },
  {
    id: 'projects', name: 'Projects', width: 240,
    note: "Chats filed under each game. ROB IT is open, so its chats are listed under it.",
    html: () => NEW_CHAT + sec(head('Projects') + proj(0, true) + `<div class="cl-nest">${LIVE_ROW}${each(by('project', 0), (c) => row(c))}</div>` + proj(1) + proj(2)),
  },
  {
    id: 'pinned', name: 'Pinned and recent', width: 240,
    note: 'Pinned chats as large icons on top, recent chats listed below.',
    html: () => NEW_CHAT
      + sec(head('Pinned') + `<div class="cl-pins">${each(by('pinned', true), (c) => `<span class="cl-pin">${ic(c.icon, 24)}<small>${esc(c.short)}</small></span>`)}</div>`)
      + sec(head('Recent') + LIVE_ROW + each(CHATS.filter((c) => !c.pinned), (c) => row(c))),
  },
  {
    id: 'status', name: 'Status board', width: 272,
    note: "Chats grouped by state. The working chat shows superbot's current step and its icon.",
    html: () => NEW_CHAT
      + sec(head('Working', 1) + `<div class="cl-row2 is-sel">${live.stepIcon(24)}<span class="cl-tx"><span class="cl-l1">${live.title}${live.dot}</span>${live.step}</span></div>`)
      + sec(head('Needs you', 1) + each(by('needs', true), (c) => row2({ ...c, unread: 0 }, 24)))
      + sec(head('Done', CHATS.length - 1) + each(CHATS.filter((c) => !c.needs), (c) => row(c))),
  },
  {
    id: 'timeline', name: 'Timeline', width: 240,
    note: 'Each chat icon sits on one vertical line, with day labels along it.',
    html: () => NEW_CHAT + `<div class="cl-tl">${each(DAYS, (d, i) => `<p class="cl-tl-day">${d}</p>`
      + (i === 0 ? `<div class="cl-tl-row is-sel"><span class="cl-node">${live.icon(18)}</span><span class="cl-tx">${live.title}${live.work}</span></div>` : '')
      + each(by('day', i), (c) => `<div class="cl-tl-row"><span class="cl-node">${ic(c.icon, 18)}</span><span class="cl-tx"><span class="cl-t">${esc(c.title)}</span><span class="cl-p">${esc(c.clock)}</span></span></div>`))}</div>`,
  },
  {
    id: 'tabs', name: 'Vertical tabs', width: 232,
    note: 'Browser-style tabs: pinned chats above the divider, the open chat as the raised tab.',
    html: () => SEARCH_BAR(false)
      + sec(head('Pinned') + each(by('pinned', true), (c) => `<div class="cl-tab">${ic(c.icon, 16)}<span class="cl-t">${esc(c.title)}</span></div>`))
      + '<hr class="cl-div">'
      + sec(`<div class="cl-tab cl-tab-new">${LU(PLUS)}<span class="cl-t">New chat</span></div>`
        + `<div class="cl-tab is-sel">${live.icon(16)}${live.title}${live.dot}<span class="cl-x">${LU(X)}</span></div>`
        + each(CHATS.filter((c) => !c.pinned), (c) => `<div class="cl-tab">${ic(c.icon, 16)}<span class="cl-t">${esc(c.title)}</span></div>`)),
  },
  {
    id: 'grid', name: 'Icon grid', width: 248,
    note: 'Chats laid out like apps on a home screen, with unread counts as badges.',
    html: () => NEW_CHAT + sec(head('Chats') + `<div class="cl-apps"><span class="cl-app is-sel"><span class="cl-appic">${live.icon(32)}${live.dot}</span>${live.short}</span>`
      + each(CHATS, (c) => `<span class="cl-app"><span class="cl-appic">${ic(c.icon, 32)}${c.unread ? `<b class="cl-badge">${c.unread}</b>` : ''}</span><small>${esc(c.short)}</small></span>`) + '</div>'),
  },
];
