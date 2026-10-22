// The sidebar's own buttons, working: Search chats opens a field over the nav that narrows the list as you type (the
// Search field variant's field narrows it too), Collapse folds the sidebar away and leaves a small rail to bring it
// back or start a chat, and the footer's name and Settings open Settings. The name and the photo in the footer are the
// profile's, as Settings changes them; the credits left, over them, open it on Billing, rise with what it buys and
// count down as the agent does its work. Notifications are each chat's own, on the bell in its composer.
import { lu, fx, asset } from './parts.bdeb2397.js';
import { state, save, onChange } from './store.854d0793.js';
import { ic } from './icons.854d0793.js';
import { addCredits } from './settings-data.bdeb2397.js';
import { odometer } from './odometer.0ecb8f7c.js';

const num = new Intl.NumberFormat('en-US');

const fromHTML = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const photoURL = (p) => (p.startsWith('data:') ? p : asset(p));
const titleOf = (li) => li.querySelector('.sb-title-in').textContent.toLowerCase();

function wireSearch(sb) {
  const button = sb.querySelector('.sb-tools [aria-label="Search chats"]');
  const nav = sb.querySelector('.sb-nav'), scroll = sb.querySelector('.sb-scroll');
  let box = sb.querySelector('.sb-search');
  const fixed = !!box; // the Search field variant draws its own, always there
  const none = fromHTML('<div class="sb-empty sb-noresult" hidden><p></p><button class="sb-btn" type="button">Clear search</button></div>');
  scroll.append(none);

  // every word typed must be in a chat's title; a group whose name matches shows all its chats
  function filter(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hit = (text) => terms.every((t) => text.includes(t));
    for (const li of scroll.querySelectorAll('li.sb-item')) li.hidden = terms.length > 0 && !hit(titleOf(li));
    // groups nest: every named group shows its chats first, then a group shows if it holds a shown chat or a named group
    const groups = [...scroll.querySelectorAll('li.sb-group')];
    const named = terms.length ? groups.filter((g) => hit(titleOf(g.querySelector('.sb-ghead')))) : [];
    for (const g of named) for (const li of g.querySelectorAll('li.sb-item')) li.hidden = false;
    for (const g of groups) g.hidden = terms.length > 0 && !named.some((n) => g.contains(n)) && !g.querySelector('li.sb-item:not([hidden])');
    for (const sec of scroll.querySelectorAll('.sb-sec')) sec.hidden = terms.length > 0 && !sec.querySelector('li.sb-item:not([hidden]), li.sb-group:not([hidden])');
    const any = !!scroll.querySelector('.sb-sec:not([hidden]) li.sb-item:not([hidden])');
    none.hidden = !terms.length || any;
    none.querySelector('p').textContent = `No chat has “${q.trim()}” in its title.`;
  }
  const input = () => box?.querySelector('input');
  function wire() {
    input().addEventListener('input', () => filter(input().value));
    input().addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (input().value) { input().value = ''; filter(''); } else if (!fixed) close(true);
    });
  }
  function open() {
    box = fromHTML(`<label class="sb-search" id="sb-search-box">${lu('search')}<input type="search" placeholder="Search chats" aria-label="Search chats" autocomplete="off"></label>`);
    nav.prepend(box);
    wire();
    button.setAttribute('aria-expanded', 'true');
    input().focus();
  }
  function close(refocus) {
    filter('');
    box?.remove();
    box = null;
    button.setAttribute('aria-expanded', 'false');
    if (refocus) button.focus();
  }
  if (fixed) wire();
  else {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'sb-search-box');
    button.addEventListener('click', () => (box ? close(true) : open()));
  }
  none.querySelector('button').addEventListener('click', () => { input().value = ''; filter(''); input().focus(); });
}

// folded away, the chat and the live view take its width (main.bdeb2397.js hears sb-collapse); a rail in the corner
// brings it back or starts a chat
function wireCollapse(app, sb) {
  const button = sb.querySelector('.sb-tools [aria-label="Collapse sidebar"]');
  const rail = fromHTML(`<div class="sb-rail" hidden><button class="sb-tool" type="button" aria-label="Open sidebar">${lu('panel')}</button><button class="sb-tool" type="button" aria-label="New chat">${ic('squarePen')}</button></div>`);
  app.append(rail);
  const [openBtn, newBtn] = rail.children;
  function set(shut, focus) {
    state.sbShut = shut;
    save('sbShut');
    app.classList.toggle('is-sb-shut', shut);
    rail.hidden = !shut;
    sb.dispatchEvent(new CustomEvent('sb-collapse', { detail: { shut } }));
    if (focus) (shut ? openBtn : button).focus();
  }
  button.addEventListener('click', () => set(true, true));
  openBtn.addEventListener('click', () => set(false, true));
  newBtn.addEventListener('click', () => sb.querySelector('a[href="#new-chat"]')?.click());
  rail.addEventListener('keydown', (e) => e.stopPropagation());
  if (state.sbShut) set(true, false);
}

// the name and photo become one button to the profile; Settings opens at its first section
function wireFooter(sb, openSettings) {
  const me = sb.querySelector('.sb-me'), name = me.querySelector('.sb-name');
  let avatar = me.querySelector('.sb-avatar');
  const meBtn = fromHTML('<button class="sb-me-btn" type="button" aria-haspopup="dialog"></button>');
  avatar.before(meBtn);
  meBtn.append(avatar, name);
  const paint = () => {
    name.textContent = state.profile.name;
    // a new photo is a new image: the spot may be decoding the old one as it starts (main.bdeb2397.js), and changing
    // the src under it would fail that
    const src = photoURL(state.profile.photo);
    if (avatar.src !== src) {
      const next = Object.assign(avatar.cloneNode(), { src });
      avatar.replaceWith(next);
      avatar = next;
    }
    meBtn.setAttribute('aria-label', `${state.profile.name}, profile settings`);
  };
  meBtn.addEventListener('click', () => openSettings('profile'));
  const gear = me.querySelector('[aria-label="Settings"]');
  gear.setAttribute('aria-haspopup', 'dialog');
  gear.addEventListener('click', () => openSettings());
  onChange((part) => { if (part === 'profile') paint(); });
  paint();
}

// what the agent's work costs, by what the run did (spot-work, main.bdeb2397.js): an Activity step the most, a reply
// less, a click on the computer view least; with auto-reload on, reaching its floor buys what brings the balance back
// up to its mark, at the one price (Billing, settings-billing.bdeb2397.js)
const COST = { steps: [600, 1800], clicks: [150, 450], replies: [300, 900] };
const costOf = ([lo, hi]) => lo + Math.floor(Math.random() * (hi - lo));

function spend(work) {
  const b = state.billing;
  let cost = 0;
  for (const [kind, n] of Object.entries(work)) for (let i = 0; i < n; i++) cost += costOf(COST[kind]);
  b.left = Math.max(0, b.left - cost);
  if (b.autoReload && b.left <= b.reload.below) addCredits(b, b.reload.upTo - b.left, 'auto-reload');
  save('billing');
}

// the credits left over the account row and laid out as it is: the coin and the figure one button to Billing, Get
// more credits (+) on the gear's column opening it with Buy credits out. Each piece of work the agent does takes its
// cost off, the figure rolling down like an odometer; between steps, and once a chat is stopped or written in, it holds.
function wireCredits(sb, openSettings) {
  const row = fromHTML(`<div class="sb-credits"><button class="sb-credits-btn" type="button" aria-haspopup="dialog">${fx('coin')}<b class="sb-credits-n"></b></button><button class="sb-tool" type="button" aria-label="Get more credits" aria-haspopup="dialog">${lu('plus')}</button></div>`);
  sb.querySelector('.sb-me').before(row);
  const button = row.querySelector('.sb-credits-btn');
  row.querySelector('.sb-tool').addEventListener('click', () => openSettings('billing', { buy: true }));
  const figure = odometer(button.querySelector('.sb-credits-n'));
  const paint = () => {
    const left = state.billing.left;
    figure.set(left);
    button.title = `${num.format(left)} credits left`;
    button.setAttribute('aria-label', `${num.format(left)} credits left, billing settings`);
  };
  button.addEventListener('click', () => openSettings('billing'));
  onChange((part) => { if (part === 'billing') paint(); });
  paint();
  sb.addEventListener('spot-work', (e) => spend(e.detail));
}

export function mountSidebarTools({ app, sb, openSettings }) {
  wireSearch(sb);
  wireCollapse(app, sb);
  wireFooter(sb, openSettings);
  wireCredits(sb, openSettings);
}
