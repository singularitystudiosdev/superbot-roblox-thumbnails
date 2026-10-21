// The envelope every variant shares, in the Manus sidebar's order: the wordmark with search and collapse, the nav, the
// variant's scrolling middle, then the connection card and the account row. `state` shows the list's loading
// (skeleton rows) and empty states, which belong to the envelope rather than to any one variant.
import { NAV, ACCOUNT } from './chats.bdeb2397.js';
import { esc, fx, lu, mark, list, section } from './parts.bdeb2397.js';
import { VARIANTS } from './variants.bdeb2397.js';

const SKELETON_ROWS = 5;

const tool = (label, icon) => `<button class="sb-tool" type="button" aria-label="${label}">${lu(icon)}</button>`;
const slug = (label) => label.toLowerCase().replace(/ /g, '-');
const navRow = (n) => `<li><a class="sb-row" href="#${slug(n.label)}">${fx(n.fx)}<span class="sb-t"><span class="sb-title">${esc(n.label)}</span></span></a></li>`;

// the nav as rows, or (nav: 'button') with its first item, New chat, as a full-width button over the rest
function navArea(variant) {
  if (variant.nav !== 'button') return list(NAV.map(navRow).join(''));
  const [first, ...rest] = NAV;
  return `<a class="sb-new" href="#${slug(first.label)}">${fx(first.fx)}<span>${esc(first.label)}</span></a>${list(rest.map(navRow).join(''))}`;
}

const searchField = `<label class="sb-search">${lu('search')}<input type="search" placeholder="Search chats" aria-label="Search chats"></label>`;

function middle(variant, state) {
  if (state === 'loading') {
    const skel = Array.from({ length: SKELETON_ROWS }, () => '<li class="sb-skel" aria-hidden="true"><i></i><b></b></li>').join('');
    return section('Chats', `<p class="sb-vh">Loading chats</p>${list(skel)}`);
  }
  if (state === 'empty') {
    return section('Chats', '<div class="sb-empty"><p>Chats you start show up here.</p><a class="sb-btn" href="#new">New chat</a></div>');
  }
  return variant.body();
}

export const variantIndex = (id) => Math.max(0, VARIANTS.findIndex((v) => v.id === Number(id)));

// `labelSuffix` keeps landmark names unique when one page shows several sidebars (the contact sheet)
export function sidebarHTML(index, { state = 'ready', labelSuffix = '' } = {}) {
  const variant = VARIANTS[index];
  const fieldSearch = variant.search === 'field';
  return `<aside class="sb ${variant.cls ?? ''}" data-variant="${variant.id}" aria-label="superbot sidebar${labelSuffix}">
  <header class="sb-top"><span class="sb-brand">${mark()}superbot</span><span class="sb-tools">${fieldSearch ? '' : tool('Search chats', 'search')}${tool('Collapse sidebar', 'panel')}</span></header>
  <nav class="sb-nav" aria-label="Main${labelSuffix}">${navArea(variant)}${fieldSearch ? searchField : ''}</nav>
  <nav class="sb-scroll" aria-label="Chats${labelSuffix}">${middle(variant, state)}</nav>
  <footer class="sb-foot">
    <a class="sb-card" href="#creator-hub"><img class="sb-ic" src="../img/fav/roblox.png" alt="" width="16" height="16"><span class="sb-t"><span class="sb-title">Roblox Creator Hub</span><span class="sb-sub">Connected, 2 experiences</span></span>${lu('chevronRight')}</a>
    <div class="sb-me"><img class="sb-avatar" src="${ACCOUNT.avatar}" alt="" width="24" height="24"><span class="sb-name">${esc(ACCOUNT.name)}</span>${tool('Settings', 'settings')}${tool('Notifications', 'bell')}</div>
  </footer>
</aside>`;
}

export { VARIANTS };
