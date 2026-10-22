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
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  // Settings (settings.bdeb2397.js): its close button, the profile photo's change button
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  camera: '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>',
  // the profile photo's editor (photo-crop.9e39bc12.js): the zoom slider's ends and its quarter turn
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  rotateCwSquare: '<path d="M12 5H6a2 2 0 0 0-2 2v3"/><path d="m9 8 3-3-3-3"/><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>',
  // the credits row's Get more credits (sidebar-tools.854d0793.js)
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  // Billing's Add payment method (settings-pay.8a3994ee.js): its Card tile and the security code's field
  creditCard: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
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

// the ouroboro mark: the logos' Impossible infinity in grey (../logos.4bc2a2d5), its poster frame until mark.901bc0c7.js
// sets it rolling
export const mark = () => `<sb-mark class="sb-mark"><img src="${asset('./fx/mark.901bc0c7.png')}" alt="" width="19" height="19" draggable="false"></sb-mark>`;

export const time = (chat) => `<span class="sb-time">${esc(chat.time)}</span>`;

// one chat: its row (icon, title, an optional trailing slot) and the row's "•••". The open chat is the current page; a
// chat at work is .is-working, its icon turning (spin.4bc2a2d5.js).
export function row(chat, { trail = '' } = {}) {
  const current = chat.active ? ' aria-current="page"' : '';
  const unread = chat.unread ? ' is-unread' : '';
  const working = chat.working ? ' is-working' : '';
  return `<li class="sb-item${working}"><a class="sb-row${unread}" href="#${chat.id}" draggable="false"${current}>${fx(chat.fx)}<span class="sb-t">${title(chat.title)}</span>${trail}</a>${moreButton(`More options for ${chat.title}`)}</li>`;
}

// a group of chats: a row that folds its list (the folder opens with it), a count, its own "•••", then the list
let groupCount = 0;
export function group(name) {
  const id = `sb-group-${++groupCount}`;
  return `<li class="sb-group"><div class="sb-item sb-ghead"><button class="sb-row sb-group-row" type="button" aria-expanded="true" aria-controls="${id}">${fx('folderOpen', 'sb-ic sb-ic-open')}${fx('folder', 'sb-ic sb-ic-shut')}<span class="sb-t">${title(name)}</span><span class="sb-count">0</span></button>${moreButton(`More options for the group ${name}`)}</div><ul class="sb-list sb-group-list" id="${id}" aria-label="${esc(name)}"></ul></li>`;
}

export const list = (rows) => `<ul class="sb-list">${rows}</ul>`;

export const section = (title_, inner) => `<section class="sb-sec"><h2 class="sb-head">${esc(title_)}</h2>${inner}</section>`;
