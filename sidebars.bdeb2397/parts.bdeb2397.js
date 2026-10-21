// The pieces every sidebar variant is assembled from: a chat row, a group, a section under a muted head and the icons.
// A variant only decides which of these it uses and in what order (variants.bdeb2397.js).
import { FX } from './chats.bdeb2397.js';

export const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// lucide (https://lucide.dev, ISC), for the sidebar's buttons and menus only; every list item wears a Fluent 3D icon
const LUCIDE = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  folderPlus: '<path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  folderMinus: '<path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  folderInput: '<path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"/><path d="M2 13h10"/><path d="m9 16 3-3-3-3"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
};
export const lu = (name, cls = 'sb-lu') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${LUCIDE[name]}</svg>`;

// asset paths in chats.bdeb2397.js are relative to this folder; resolved here, so a page anywhere (the sheet here, the
// spot at the root) loads the same files
export const asset = (path) => new URL(path, import.meta.url).href;

// a Fluent 3D icon; decorative wherever the row's text already names the thing
export const fx = (name, cls = 'sb-ic') => `<img class="${cls}" src="${asset(FX[name])}" alt="" width="16" height="16" draggable="false">`;

// a row's title: no ellipsis, a long one fades out at the right edge; the inner span is what scrolls on hover
// (marquee.bdeb2397.js)
export const title = (text) => `<span class="sb-title"><span class="sb-title-in">${esc(text)}</span></span>`;

// the "•••" a row shows on hover or focus; it opens the row's menu (groups.bdeb2397.js)
export const moreButton = (label) => `<button class="sb-more" type="button" aria-label="${esc(label)}" aria-haspopup="menu" aria-expanded="false">${lu('ellipsis')}</button>`;

// the superbot mark, static: the mask geometry of beta.superbot.gg's mascot (superbot-ad-gallery/assets/sb-mark-live.html),
// its single ink layer, eyes cut out. Each copy needs its own mask id.
let markCount = 0;
export function mark() {
  const id = `sb-mark-${++markCount}`;
  return `<svg class="sb-mark" viewBox="10 13 80 80" aria-hidden="true"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><g fill="white"><rect x="14" y="32" width="72" height="54" rx="15"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="black"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></mask></defs><rect width="100" height="100" fill="currentColor" mask="url(#${id})"/></svg>`;
}

export const time = (chat) => `<span class="sb-time">${esc(chat.time)}</span>`;

// one chat: its row (icon, title, an optional trailing slot) and the row's "•••". The open chat is the current page.
export function row(chat, { trail = '' } = {}) {
  const current = chat.active ? ' aria-current="page"' : '';
  const unread = chat.unread ? ' is-unread' : '';
  return `<li class="sb-item"><a class="sb-row${unread}" href="#${chat.id}" draggable="false"${current}>${fx(chat.fx)}<span class="sb-t">${title(chat.title)}</span>${trail}</a>${moreButton(`More options for ${chat.title}`)}</li>`;
}

// a group of chats: a row that folds its list (the folder opens with it), a count, its own "•••", then the list
let groupCount = 0;
export function group(name) {
  const id = `sb-group-${++groupCount}`;
  return `<li class="sb-group"><div class="sb-item sb-ghead"><button class="sb-row sb-group-row" type="button" aria-expanded="true" aria-controls="${id}">${fx('folderOpen', 'sb-ic sb-ic-open')}${fx('folder', 'sb-ic sb-ic-shut')}<span class="sb-t">${title(name)}</span><span class="sb-count">0</span></button>${moreButton(`More options for the group ${name}`)}</div><ul class="sb-list sb-group-list" id="${id}" aria-label="${esc(name)}"></ul></li>`;
}

export const list = (rows) => `<ul class="sb-list">${rows}</ul>`;

export const section = (title_, inner) => `<section class="sb-sec"><h2 class="sb-head">${esc(title_)}</h2>${inner}</section>`;
