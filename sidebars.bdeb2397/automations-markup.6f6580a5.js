// The Automations page's markup, as strings: the page shell, a card, a category chip, their skeletons, and the line
// a screen reader hears for what the grid is showing. No state and no listeners (automations.6f6580a5.js owns those).
import { APPS } from './apps.6f6580a5.js';
import { logo, shot } from './automations-shots.6f6580a5.js';
import { esc } from './parts.bdeb2397.js';

const SKELETON_CARDS = 8;
const SKELETON_CHIPS = 6;

// lucide (https://lucide.dev, ISC)
const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
};
const icon = (name, cls) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));
// illustrative: about one rating per 25 uses
const ratingsOf = (a) => compact(Math.round(a.uses / 25));

// Try Me!, then Starting while it spins up, then Running (pressing it again stops it)
export function tryLabel(state) {
  if (state === 'starting') return `${icon('loader', 'au-spin')}Starting`;
  if (state === 'on') return `${icon('check', 'au-ic')}Running`;
  return 'Try Me!';
}

export function card(a, state) {
  const app = APPS[a.app];
  return `<li class="au-card">
  <div class="au-thumb" data-kind="${a.kind}">${shot(a)}<span class="au-app">${logo(a.app)}${esc(app.name)}</span></div>
  <div class="au-body">
    <h3 class="au-name" title="${esc(a.title)}">${esc(a.title)}</h3>
    <p class="au-desc">${esc(a.desc)}</p>
    <div class="au-meta">
      <span class="au-rating" title="${ratingsOf(a)} ratings"><span class="au-vh">Rated </span>${icon('star', 'au-star')}${a.rating.toFixed(1)}<span class="au-vh"> out of 5 from ${ratingsOf(a)} ratings</span></span>
      <span class="au-uses">${compact(a.uses)} uses</span>
      <button class="au-try" type="button" data-id="${a.id}" data-state="${state}"${state === 'starting' ? ' aria-disabled="true"' : ''}>${tryLabel(state)}</button>
    </div>
  </div>
</li>`;
}

// `id` '' is the All chip, which clears every pick
export function chip({ id, label, count, pressed }) {
  const n = count === undefined ? '' : `<span class="au-n">${count}</span>`;
  return `<button class="au-chip" type="button" data-app="${id}" aria-pressed="${pressed}">${id ? logo(id) : ''}${esc(label)}${n}</button>`;
}

export const cardSkeletons = () => Array.from({ length: SKELETON_CARDS }, () => '<li class="au-card au-skel" aria-hidden="true"><div class="au-thumb"></div><div class="au-body"><b></b><i></i><i></i></div></li>').join('');
export const chipSkeletons = () => Array.from({ length: SKELETON_CHIPS }, () => '<span class="au-chip au-skel" aria-hidden="true"></span>').join('');

const andList = (names) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);

// "34 automations in Game Design", "14 automations for Roblox and Blender", "2 automations matching “thumb”"
export function summary(n, query, topics, picked) {
  const what = `${n} automation${n === 1 ? '' : 's'}`;
  if (picked.length) return `${what} for ${andList(picked.map((id) => APPS[id].name))}`;
  if (topics.length) return `${what} in ${andList(topics)}`;
  if (query.trim()) return `${what} matching “${query.trim()}”`;
  return `${what}, most used first`;
}

export const PAGE = `<section class="au" aria-labelledby="au-h" hidden>
  <div class="au-scroll">
    <header class="au-head">
      <h1 class="au-vh" id="au-h">Automations</h1>
      <label class="au-search">${icon('search', 'au-ic')}<input type="search" placeholder="Search automations, apps or topics like Game Design" aria-label="Search automations" autocomplete="off" spellcheck="false" aria-keyshortcuts="/"><kbd class="au-kbd" aria-hidden="true">/</kbd><button class="au-clear" type="button" aria-label="Clear search" hidden>${icon('x', 'au-ic')}</button></label>
      <div class="au-cats" role="group" aria-label="Categories"></div>
    </header>
    <ul class="au-grid" aria-label="Automations"></ul>
    <div class="au-empty" hidden><p></p><button class="au-reset" type="button">Clear search and categories</button></div>
  </div>
  <p class="au-vh au-say" aria-live="polite"></p>
</section>`;
