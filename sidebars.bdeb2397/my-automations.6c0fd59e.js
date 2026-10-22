// Settings' My Automations (settings.854d0793.js): the automations the viewer published to the Automations tab
// (published.6c0fd59e.js), each drawn as its card is in the tab with its rating, how many times it was started and the
// credits it made where Try Me! is. Once published it is not edited: its bin unpublishes it, with an undo. Publish, for
// a new one (publish.6c0fd59e.js, over Settings), sits beside the title, the totals over the cards; what was just done
// rises from the foot as a toast. The cards rise in as the section opens.
import { esc, fx, lu, asset } from './parts.bdeb2397.js';
import { ALL_APPS, iconOf, thumbOf } from './automations.03378ba4.js';
import { onChange } from './store.854d0793.js';
import { catalogue, unpublish, restore } from './published.6c0fd59e.js';
import { openPublish, UNDO } from './publish.6c0fd59e.js';

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const num = new Intl.NumberFormat('en-US');
const plural = (n, one) => `${num.format(n)} ${one}${n === 1 ? '' : 's'}`;
const UNDO_MS = 6000; // an undo is offered this long
const LEAVE_MS = 180; // a card unpublished folds away this long
const ENTER_MS = 700; // the cards rising in as the section opens, the last one's delay with it
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const mine = () => catalogue().filter((a) => a.mine);

export const myAutomationsHTML = () => `<div class="ma-top">
    <div class="ma-top-t"><h3 class="st-title" id="st-automations-h">My Automations</h3>
    <p class="st-hint st-lead">What you published to the Automations tab. Each time someone starts one, it counts a use and makes you credits.</p></div>
    <button class="sb-btn-primary ma-publish" type="button" aria-haspopup="dialog">${fx('rocket', 'ma-btn-ic')}Publish</button>
  </div>
  <ul class="ma-totals" aria-label="All your automations"></ul>
  <ul class="ma-grid"></ul>
  <div class="ma-empty" hidden>${fx('rocket', 'ma-empty-ic')}<p class="st-label">Nothing published yet</p><p class="st-hint">Publish a prompt you run, and anyone can start it from the Automations tab.</p></div>
  <p class="ma-undo" aria-live="polite"><span class="ma-undo-t"></span><button class="ma-undo-go" type="button" hidden>${UNDO}Undo</button></p>`;

const totalsHTML = (list) => {
  const uses = list.reduce((sum, a) => sum + a.uses, 0), credits = list.reduce((sum, a) => sum + a.credits, 0);
  const total = (icon, n, what, title) => `<li title="${title}">${fx(icon, 'ma-tot-ic')}<span class="ma-tot-t"><b>${n}</b><span>${what}</span></span></li>`;
  return total('rocket', list.length, 'published', plural(list.length, 'automation'))
    + total('busts_in_silhouette', compact.format(uses), 'uses', plural(uses, 'use'))
    + total('coin', compact.format(credits), 'credits made', `${num.format(credits)} credits made`);
};

// a card as the tab draws it (automations-view.03378ba4.js): its rating, uses and the credits it made along its foot
function cardHTML(a, i) {
  const rating = a.rating
    ? `<span class="ma-stat" role="img" aria-label="Rated ${a.rating} out of 5"><img class="ma-star" src="${asset('./automations/star.png')}" alt="" width="12" height="12" draggable="false"><span aria-hidden="true">${a.rating.toFixed(1)}</span></span>`
    : `<span class="ma-stat">${fx('sparkles', 'ma-stat-ic')}New</span>`;
  return `<li class="ma-card" data-id="${a.id}" style="--i: ${i}">
  <div class="ma-media"><img class="ma-thumb" src="${asset(thumbOf(a))}" alt="" width="768" height="432" decoding="async" draggable="false">
    <div class="ma-tools"><button class="ma-tool ma-del" type="button" aria-label="Unpublish ${esc(a.title)}" title="Unpublish">${lu('trash', 'ma-lu')}</button></div></div>
  <div class="ma-head"><img class="ma-app" src="${asset(iconOf(a.app))}" alt="" width="20" height="20" draggable="false"><div class="ma-name"><h4 class="ma-title">${esc(a.title)}</h4><span class="ma-sub">${esc(ALL_APPS[a.app].name)} · ${esc(a.at)}</span></div></div>
  <p class="ma-desc">${esc(a.desc)}</p>
  <div class="ma-stats">${rating}<span class="ma-stat" title="${plural(a.uses, 'use')}">${fx('busts_in_silhouette', 'ma-stat-ic')}${compact.format(a.uses)} uses</span><span class="ma-stat ma-made" title="${num.format(a.credits)} credits made">${fx('coin', 'ma-stat-ic')}${compact.format(a.credits)}<span class="st-vh"> credits</span> made</span></div>
</li>`;
}

export function wireMyAutomations(panel, sb) {
  const totals = panel.querySelector('.ma-totals'), grid = panel.querySelector('.ma-grid'), empty = panel.querySelector('.ma-empty');
  const undo = panel.querySelector('.ma-undo'), undoT = panel.querySelector('.ma-undo-t'), undoGo = panel.querySelector('.ma-undo-go');
  let undoTimer = 0, undoFn = null, fresh = null;

  // `fresh` is a card just published or saved: it glows once
  function paint() {
    const list = mine();
    totals.innerHTML = totalsHTML(list);
    grid.innerHTML = list.map(cardHTML).join('');
    empty.hidden = list.length > 0;
    if (fresh) grid.querySelector(`.ma-card[data-id="${CSS.escape(fresh)}"]`)?.classList.add('is-fresh');
    fresh = null;
  }
  const cardOf = (id) => grid.querySelector(`.ma-card[data-id="${CSS.escape(id)}"]`);
  // said in the foot, beside Publish, with an undo when there is one to take back
  function say(text, fn = null) {
    clearTimeout(undoTimer);
    undoFn = fn;
    undoT.textContent = text;
    undoGo.hidden = !fn;
    undo.classList.add('is-on');
    undoTimer = setTimeout(() => { undo.classList.remove('is-on'); undoFn = null; }, UNDO_MS);
  }
  panel.querySelector('.ma-publish').addEventListener('click', () => openPublish({
    sb,
    onDone: (a) => { fresh = a.id; paint(); say(`${a.title} is published. Anyone can start it from the Automations tab.`); },
  }));
  // unpublished: the card folds away, and an undo puts it back where it was
  grid.addEventListener('click', (e) => {
    const li = e.target.closest('.ma-card');
    if (!li || !e.target.closest('.ma-del')) return;
    const { id } = li.dataset, title = li.querySelector('.ma-title').textContent;
    li.classList.add('is-leaving');
    setTimeout(() => {
      const gone = unpublish(id);
      (grid.querySelector('.ma-del') ?? panel.querySelector('.ma-publish')).focus();
      say(`${title} is unpublished.`, () => { fresh = id; restore(gone); cardOf(id)?.querySelector('.ma-del').focus(); });
    }, REDUCED.matches ? 0 : LEAVE_MS);
  });
  undoGo.addEventListener('click', () => {
    const fn = undoFn;
    clearTimeout(undoTimer);
    undo.classList.remove('is-on');
    undoFn = null;
    fn?.();
  });
  // the cards rise in each time the section is opened, not each time they are drawn again
  new MutationObserver(() => {
    if (panel.hidden) return;
    grid.classList.add('is-entering');
    setTimeout(() => grid.classList.remove('is-entering'), ENTER_MS);
  }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  // what changes it: a publish, an edit, an unpublish or its undo, a start counting a use, the viewer's own rating
  onChange((part) => { if (part === 'published' || part === 'rated') paint(); });
  paint();
  return { reset: () => { paint(); clearTimeout(undoTimer); undo.classList.remove('is-on'); undoFn = null; } };
}
