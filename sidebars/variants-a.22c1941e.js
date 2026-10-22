// Chat-list variants 1 to 5: Manus's own layout, then four ways to order the same chats (by date, with previews, behind
// a labelled rail, in project folders). Each returns the inside of its <aside>; `base` is the path to the spot's root.
import { CHATS } from './data.22c1941e.js';
import { ln, mark, when, kbd, tool, avatar, brand, item, sec, search, newChat, foot, chatRow, twoLine } from './parts.22c1941e.js';

// 1. Manus, line for line: places, projects, the chat list, the invite card, the account
function manus(base) {
  const places = [['pen', 'New chat', ' data-new'], ['monitor', 'Computer'], ['scheduled', 'Scheduled'], ['library', 'Library'], ['apps', 'Apps'], ['more', 'More']]
    .map(([k, label, attrs = '']) => item(ln(k), label, '', attrs)).join('');
  return `${brand(base, tool('search') + tool('panel'))}
    ${places}
    ${sec('Projects')}${item(ln('folderPlus'), 'New project')}
    ${sec('Chats')}
    <div class="sb-list">${CHATS.map((c) => chatRow(c)).join('')}</div>
    <div class="sb-invite">${ln('gift')}<span class="sb-two"><b>Invite a friend</b><small>Share superbot with a link</small></span>${ln('right')}</div>
    ${foot(tool('devices') + tool('bell'))}`;
}

// 2. One New chat button, the chats under the day they were last touched
function byDate(base) {
  const days = [...new Set(CHATS.map((c) => c.group))];
  return `${brand(base, tool('panel'))}
    ${newChat('⌘N')}
    <div class="sb-list">${days.map((d) => sec(d) + CHATS.filter((c) => c.group === d).map((c) => chatRow(c)).join('')).join('')}</div>
    ${foot(tool('settings'))}`;
}

// 3. Two lines a chat: its kind in a tile, its title and age, then where it got to
function previews(base) {
  const row = (c) => twoLine(c, `<span class="sb-tile">${mark(c)}</span>`, when(c.when));
  return `${brand(base, tool('search') + tool('pen'))}
    ${sec('Chats', ln('filter'))}
    <div class="sb-list">${CHATS.map(row).join('')}</div>
    ${foot(tool('settings'), 'Pro plan')}`;
}

// 4. A labelled rail for the places, the chat list in a pane beside it
function rail(base) {
  const places = [['chats', 'Chats', ' is-on'], ['monitor', 'Computer'], ['scheduled', 'Scheduled'], ['library', 'Library'], ['apps', 'Apps']]
    .map(([k, label, on = '']) => `<div class="sb-rl${on}">${ln(k)}<span>${label}</span></div>`).join('');
  return `<div class="sb-rail"><img class="sb-mark" src="${base}sidebars/img/superbot-mark.svg" width="18" height="18" alt="">${places}${avatar}</div>
    <div class="sb-pane">
      <div class="sb-head"><b class="sb-h">Chats</b><span class="sb-tools">${tool('pen')}</span></div>
      ${search()}
      <div class="sb-list">${CHATS.map((c) => chatRow(c)).join('')}</div>
    </div>`;
}

// 5. Chats filed under their project, open folders showing their chats on a guide line
function folders(base) {
  const folder = (name, open) => {
    const kids = CHATS.filter((c) => c.project === name);
    const head = `<div class="sb-item sb-fold">${ln(open ? 'down' : 'right')}${ln(open ? 'folderOpen' : 'folder')}<span class="sb-t">${name}</span>${open ? '' : when(String(kids.length))}</div>`;
    return open ? `${head}<div class="sb-kids">${kids.map((c) => chatRow(c)).join('')}</div>` : head;
  };
  return `${brand(base, tool('search') + tool('panel'))}
    ${item(ln('pen'), 'New chat', kbd('⌘N'), ' data-new')}
    ${sec('Projects', ln('plus'))}
    <div class="sb-list">${folder('ROB IT', true)}${folder('Marketing', true)}${folder('Studio', false)}</div>
    ${foot(tool('devices') + tool('bell'))}`;
}

export const VARIANTS_A = [
  { name: 'Manus layout', html: manus },
  { name: 'Grouped by day', html: byDate },
  { name: 'Two-line previews', html: previews },
  { name: 'Labelled rail', html: rail },
  { name: 'Project folders', html: folders },
];
