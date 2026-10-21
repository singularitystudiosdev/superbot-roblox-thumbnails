// The pieces every sidebar variant is assembled from: a chat row, a section under a muted head and the icons. A
// variant only decides which of these it uses and in what order (variants.bdeb2397.js).
import { FX } from './chats.bdeb2397.js';

export const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// lucide (https://lucide.dev, ISC), for the sidebar's utility buttons only; every list item wears a Fluent 3D icon
const LUCIDE = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
};
export const lu = (name, cls = 'sb-lu') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${LUCIDE[name]}</svg>`;

// asset paths in chats.bdeb2397.js are relative to this folder; resolved here, so a page anywhere (the sheet here, the
// spot at the root) loads the same files
export const asset = (path) => new URL(path, import.meta.url).href;

// a Fluent 3D icon; decorative wherever the row's text already names the thing
export const fx = (name, cls = 'sb-ic') => `<img class="${cls}" src="${asset(FX[name])}" alt="" width="16" height="16">`;

// the superbot mark, static: the mask geometry of beta.superbot.gg's mascot (superbot-ad-gallery/assets/sb-mark-live.html),
// its single ink layer, eyes cut out. Each copy needs its own mask id.
let markCount = 0;
export function mark() {
  const id = `sb-mark-${++markCount}`;
  return `<svg class="sb-mark" viewBox="10 13 80 80" aria-hidden="true"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><g fill="white"><rect x="14" y="32" width="72" height="54" rx="15"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="black"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></mask></defs><rect width="100" height="100" fill="currentColor" mask="url(#${id})"/></svg>`;
}

export const time = (chat) => `<span class="sb-time">${esc(chat.time)}</span>`;

// one row: the chat's icon, its title, and an optional trailing slot. The open chat is the current page.
export function row(chat, { trail = '' } = {}) {
  const current = chat.active ? ' aria-current="page"' : '';
  const unread = chat.unread ? ' is-unread' : '';
  return `<li><a class="sb-row${unread}" href="#${chat.id}"${current}>${fx(chat.fx)}<span class="sb-t"><span class="sb-title">${esc(chat.title)}</span></span>${trail}</a></li>`;
}

export const list = (rows) => `<ul class="sb-list">${rows}</ul>`;

export const section = (title, inner) => `<section class="sb-sec"><h2 class="sb-head">${esc(title)}</h2>${inner}</section>`;
