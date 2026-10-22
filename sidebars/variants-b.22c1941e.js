// Chat-list variants 6 to 10: by status, with each chat's latest output, searchable with pinned chats, a dense
// keyboard list, and an inset panel. Each returns the inside of its <aside>; `base` is the path to the spot's root.
import { CHATS } from './data.22c1941e.js';
import { ln, gl, RING, mark, title, when, kbd, tool, step, brand, item, sec, search, newChat, foot, chatRow, twoLine } from './parts.22c1941e.js';

const byStatus = (s) => CHATS.filter((c) => c.status === s);

// 6. Running, Scheduled, Done: what superbot is doing now sits on top, with its current step under it
function status(base) {
  const scheduled = byStatus('scheduled');
  return `${brand(base, tool('search') + tool('panel'))}
    ${item(ln('pen'), 'New chat', '', ' data-new')}
    ${sec('Running', '<span class="sb-count" data-count>0</span>')}
    <div class="sb-grow" data-empty><div><p class="sb-empty">Nothing running yet. <span class="sb-link">Start a chat</span></p></div></div>
    ${byStatus('running').map((c) => twoLine(c, RING)).join('')}
    ${sec('Scheduled', `<span class="sb-count">${scheduled.length}</span>`)}
    ${scheduled.map((c) => chatRow(c, `${mark(c)}${title(c)}${when(c.next)}`)).join('')}
    ${sec('Done')}
    <div class="sb-list">${byStatus('done').map((c) => chatRow(c, `${mark(c)}${title(c)}${when(c.when)}`)).join('')}</div>
    ${foot(tool('settings'))}`;
}

// 7. Each chat led by what it last made; the live chat's picture is its newest winning thumbnail
function outputs(base) {
  const media = (c) => (c.thumb
    ? `<img class="sb-th" src="${base}${c.thumb}" width="56" height="32" alt=""${c.live ? ' data-thumb' : ''}>`
    : `<span class="sb-th sb-th-gl">${gl(c.glyph)}</span>`);
  const row = (c) => twoLine(c, media(c), '', `<span class="sb-t">${c.project}</span>${when(c.when)}`, RING + step);
  return `${brand(base, tool('pen') + tool('panel'))}
    ${search('⌘K')}
    ${sec('Recent')}
    <div class="sb-list">${CHATS.map(row).join('')}</div>
    ${foot(tool('settings'))}`;
}

// 8. Search first, a status filter under it, pinned chats above the rest
function pinned(base) {
  const chips = ['All', 'Running', 'Scheduled'].map((s, i) => `<span class="sb-chip${i ? '' : ' is-on'}">${s}</span>`).join('');
  return `${brand(base, tool('pen') + tool('panel'))}
    ${search('⌘K')}
    <div class="sb-chips">${chips}</div>
    ${sec('Pinned', ln('pin'))}
    ${CHATS.filter((c) => c.pinned).map((c) => chatRow(c)).join('')}
    ${sec('Recent')}
    <div class="sb-list">${CHATS.filter((c) => !c.pinned).map((c) => chatRow(c)).join('')}</div>
    ${foot(tool('devices') + tool('bell'))}`;
}

// 9. Dense: short rows, an age on every chat, accelerators beside the places
function compact(base) {
  return `${brand(base, tool('panel'))}
    ${item(ln('pen'), 'New chat', kbd('⌘N'), ' data-new')}
    ${item(ln('search'), 'Search', kbd('⌘K'))}
    ${item(ln('scheduled'), 'Scheduled', kbd('⌘J'))}
    ${sec('Chats')}
    <div class="sb-list">${CHATS.map((c) => chatRow(c, `${mark(c)}${title(c)}${when(c.when)}`)).join('')}</div>
    ${foot(tool('settings'))}`;
}

// 10. The list on an inset panel over the grey ground; the live chat raised to a two-line row with its current step
function inset(base) {
  const today = CHATS.filter((c) => c.group === 'Today'), earlier = CHATS.filter((c) => c.group !== 'Today');
  const row = (c) => (c.live ? twoLine(c, RING) : chatRow(c, `${mark(c)}${title(c)}${when(c.when)}`));
  return `<div class="sb-panel">
      ${brand(base, tool('panel'))}
      ${newChat('⌘N')}
      ${sec('Today')}${today.map(row).join('')}
      ${sec('Earlier')}
      <div class="sb-list">${earlier.map(row).join('')}</div>
      ${foot(ln('down'), 'Pro plan')}
    </div>`;
}

export const VARIANTS_B = [
  { name: 'By status', html: status },
  { name: 'Latest output', html: outputs },
  { name: 'Search and pins', html: pinned },
  { name: 'Compact', html: compact },
  { name: 'Inset panel', html: inset },
];
