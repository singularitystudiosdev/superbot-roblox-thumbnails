// The pieces every sidebar variant is assembled from: a chat row, a section (plain or folding), the projects block,
// the status marks and the icons. A variant only decides which of these it uses and in what order
// (variants.bdeb2397.js).
import { FX, STATUS, PROJECTS, CHATS } from './chats.bdeb2397.js';

export const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// lucide (https://lucide.dev, ISC), for the sidebar's utility buttons and chevrons only; every list item wears a
// Fluent 3D icon
const LUCIDE = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  folderPlus: '<path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  trendUp: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
};
export const lu = (name, cls = 'sb-lu') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${LUCIDE[name]}</svg>`;

// a Fluent 3D icon; decorative wherever the row's text already names the thing
export const fx = (name, cls = 'sb-ic') => `<img class="${cls}" src="${FX[name]}" alt="" width="16" height="16">`;

// the superbot mark, static: the mask geometry of beta.superbot.gg's mascot (superbot-ad-gallery/assets/sb-mark-live.html),
// its single ink layer, eyes cut out. Each copy needs its own mask id.
let markCount = 0;
export function mark() {
  const id = `sb-mark-${++markCount}`;
  return `<svg class="sb-mark" viewBox="10 13 80 80" aria-hidden="true"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><g fill="white"><rect x="14" y="32" width="72" height="54" rx="15"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="black"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></mask></defs><rect width="100" height="100" fill="currentColor" mask="url(#${id})"/></svg>`;
}

const vh = (text) => `<span class="sb-vh">${esc(text)}</span>`;

// the trailing mark of a chat that is still going (the accent) or waiting on its owner (ink); done and scheduled
// chats carry none
export function statusDot(chat) {
  if (chat.status === 'running') return `<i class="sb-dot is-run" aria-hidden="true"></i>${vh(STATUS.running.label)}`;
  if (chat.status === 'needs') return `<i class="sb-dot is-needs" aria-hidden="true"></i>${vh(STATUS.needs.label)}`;
  return '';
}

export const time = (chat) => `<span class="sb-time">${esc(chat.time)}</span>`;

// one chat row: the lead (its icon unless a variant swaps it), the title and an optional second line, then a trailing
// slot. The open chat is the current page.
export function row(chat, { lead = fx(chat.fx), sub = '', trail = statusDot(chat), cls = '' } = {}) {
  const current = chat.active ? ' aria-current="page"' : '';
  const unread = chat.unread ? ' is-unread' : '';
  return `<li><a class="sb-row ${cls}${unread}" href="#${chat.id}"${current}>${lead}<span class="sb-t"><span class="sb-title">${esc(chat.title)}</span>${sub ? `<span class="sb-sub">${sub}</span>` : ''}</span>${trail}</a></li>`;
}

export const list = (rows, cls = '') => `<ul class="sb-list ${cls}">${rows}</ul>`;

// a section under a muted head. `fold` makes the head a disclosure (superbot desktop's bucket heads: a chevron, the
// label, a muted count); `icon` puts a Fluent icon before the label; `action` is a small button at the head's end.
export function section(title, inner, { count, fold = false, open = true, icon = '', action = '' } = {}) {
  const n = count === undefined ? '' : `<span class="sb-count">${count}</span>`;
  const lead = icon ? fx(icon, 'sb-ic sb-ic-head') : '';
  if (fold) {
    return `<details class="sb-sec"${open ? ' open' : ''}><summary class="sb-head is-fold">${lu('chevronDown', 'sb-lu sb-chev')}${lead}<span>${esc(title)}</span>${n}</summary>${inner}</details>`;
  }
  return `<section class="sb-sec"><h2 class="sb-head">${lead}<span>${esc(title)}</span>${n}${action}</h2>${inner}</section>`;
}

export const headAction = (label, icon) => `<button class="sb-act" type="button" aria-label="${esc(label)}">${lu(icon)}</button>`;

const chatsIn = (projectId) => CHATS.filter((c) => c.project === projectId);

// the projects block most variants share: the head's + makes a project, each project a row with its chat count
export function projectsSection(opts = {}) {
  const rows = PROJECTS.map((p) => `<li><a class="sb-row" href="#${p.id}">${fx(p.fx)}<span class="sb-t"><span class="sb-title">${esc(p.name)}</span></span><span class="sb-time">${chatsIn(p.id).length}</span></a></li>`).join('');
  return section('Projects', list(rows), { action: headAction('New project', 'folderPlus'), ...opts });
}

export { chatsIn };
