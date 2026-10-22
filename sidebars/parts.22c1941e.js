// The pieces every chat-list variant is assembled from, as HTML strings. Hooks the paint reads (sidebar.22c1941e.js):
// data-grow wraps the live chat (absent until the prompt is sent), data-live marks it current once it is in,
// data-new marks "New chat" current before that, data-step and data-thumb follow what superbot is doing.
import { LINE, GLYPH, USER } from './data.22c1941e.js';
import { esc } from '../lib.af4c3c6b.js';

export const ln = (k) => `<svg class="sb-ln" viewBox="0 0 24 24">${LINE[k]}</svg>`;
export const gl = (k) => `<svg class="sb-gl" viewBox="0 0 256 256">${GLYPH[k]}</svg>`;
// Manus's running mark: a dashed ring in the accent, turned from t
export const RING = '<svg class="sb-ring" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/></svg>';
export const mark = (c) => (c.status === 'running' ? RING : gl(c.glyph));
export const title = (c) => `<span class="sb-t">${esc(c.title)}</span>`;
export const when = (s) => `<small class="sb-when">${esc(s)}</small>`;
export const kbd = (s) => `<kbd class="sb-kbd">${s}</kbd>`;
export const tool = (k) => `<span class="sb-tool">${ln(k)}</span>`;
export const step = '<span class="sb-step" data-step></span>';
export const avatar = `<span class="sb-av">${esc(USER.initial)}</span>`;

export const brand = (base, tools = '') =>
  `<div class="sb-head"><span class="sb-brand"><img class="sb-mark" src="${base}sidebars/img/superbot-mark.svg" width="18" height="18" alt="">superbot</span><span class="sb-tools">${tools}</span></div>`;
export const item = (icon, label, extra = '', attrs = '') => `<div class="sb-item"${attrs}>${icon}<span class="sb-t">${label}</span>${extra}</div>`;
export const sec = (label, extra = '') => `<div class="sb-sec"><span>${label}</span>${extra}</div>`;
export const search = (hint = '') => `<div class="sb-search">${ln('search')}<span class="sb-t">Search chats</span>${hint ? kbd(hint) : ''}</div>`;
export const newChat = (hint = '') => `<div class="sb-new">${ln('pen')}<span class="sb-t">New chat</span>${hint ? kbd(hint) : ''}</div>`;
export const foot = (tools, sub = '') =>
  `<div class="sb-foot">${avatar}${sub ? `<span class="sb-two"><b>${esc(USER.name)}</b><small>${esc(sub)}</small></span>` : `<span class="sb-t">${esc(USER.name)}</span>`}<span class="sb-tools">${tools}</span></div>`;

// one chat's row; the live chat's is wrapped so it can grow in
export function chatRow(c, inner = `${mark(c)}${title(c)}`, cls = 'sb-item') {
  const row = `<div class="${cls}"${c.live ? ' data-live' : ''}>${inner}</div>`;
  return c.live ? `<div class="sb-grow" data-grow><div>${row}</div></div>` : row;
}
// a two-line row: title (and an optional right-hand slot), and a muted second line; the live chat's second line is what
// superbot is doing right now
export const twoLine = (c, lead, right = '', second = esc(c.preview), liveSecond = step) =>
  chatRow(c, `${lead}<span class="sb-two"><span class="sb-l1">${title(c)}${right}</span><span class="sb-l2">${c.live ? liveSecond : second}</span></span>`, 'sb-item sb-item2');
