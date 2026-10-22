// An automation opened from its card in the Automations tab (automations-view.03378ba4.js): a modal whose top row, kept
// in place while the rest scrolls, holds its app, its name, Try Me! and the close button; under it its thumbnail, its
// rating, uses and the credits a round takes, who published it, the full description, its ratings by star with the
// viewer's own (kept in store.854d0793.js), its reviews (automation-review.71c311e9.js), and more by its publisher. Its
// publisher opens in its place: their picture, what they do, their figures and every automation they published, with
// a way back. Drawn at the sidebar's on-screen scale (--k), as Settings is. What it says beyond the card:
// automation-details.71c311e9.js, or for one the viewer published, what they wrote (published.6c0fd59e.js).
import { ALL_APPS, thumbOf, iconOf } from './automations.03378ba4.js';
import { reviewsHTML, wireReviews } from './automation-review.71c311e9.js';
import { esc, asset } from './parts.bdeb2397.js';
import { state, save } from './store.854d0793.js';
import { catalogue, automationById, detailsOf, publisherOf } from './published.6c0fd59e.js';

const scaleOf = (node) => node.getBoundingClientRect().height / node.offsetHeight || 1;
const fromHTML = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const num = new Intl.NumberFormat('en-US');
const STAR = './automations/star.png';
// lucide (https://lucide.dev, ISC): x, arrow-left, chevron-right
const X_ICON = '<svg class="am-lu" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const BACK_ICON = '<svg class="am-lu" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>';
const NEXT_ICON = '<svg class="am-lu amd-pub-go" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
const byId = automationById;
const publishedBy = (pub) => catalogue().filter((a) => detailsOf(a).publisher === pub);
const plural = (n, one) => `${num.format(n)} ${one}${n === 1 ? '' : 's'}`;
// a key that moves the focus or presses something: Tab with whatever is held (Safari reaches buttons with Option+Tab),
// otherwise not a modifier on its own, nor a shortcut such as Cmd+Shift+4 for a screenshot, which says nothing about
// the keyboard being used in it
const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock', 'Fn', 'FnLock']);
const usesKeys = (e) => e.key === 'Tab' || (!MODIFIERS.has(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey);

// its ratings by star, 5 down to 1, the viewer's own counted in
function countsOf(id) {
  const counts = [...detailsOf(byId(id)).stars], mine = state.rated[id];
  if (mine) counts[5 - mine] += 1;
  return counts;
}
const totalOf = (counts) => counts.reduce((sum, n) => sum + n, 0);
// one just published has no ratings: its average is 0 until it has one
const meanOf = (counts) => (totalOf(counts) ? counts.reduce((sum, n, i) => sum + n * (5 - i), 0) / totalOf(counts) : 0);

const star = (cls) => `<img class="${cls}" src="${asset(STAR)}" alt="" width="12" height="12" draggable="false">`;
const pfp = (p, cls) => `<img class="amd-pfp ${cls}" src="${asset(p.avatar)}" alt="" width="96" height="96" draggable="false">`;

// another automation, opening in this one's place: its picture, name, app and rating
const other = (a) => `<li><button class="amd-more" type="button" data-id="${a.id}"><img class="amd-more-thumb" src="${asset(thumbOf(a))}" alt="" width="768" height="432" decoding="async" draggable="false"><span class="amd-more-t"><b>${esc(a.title)}</b><small>${esc(ALL_APPS[a.app].name)}</small></span>${a.rating ? `<span class="amd-more-rate" role="img" aria-label="Rated ${a.rating} out of 5">${star('amd-star')}<span aria-hidden="true">${a.rating.toFixed(1)}</span></span>` : '<span class="amd-more-rate">New</span>'}</button></li>`;

// ---------- an automation ----------
// the top row's part that changes; the close button after it stays
const headHTML = (a) => `<img class="amd-app" src="${asset(iconOf(a.app))}" alt="" width="40" height="40" draggable="false">
  <div class="amd-name"><h2 class="amd-title" id="amd-title" tabindex="-1">${esc(a.title)}</h2><p class="amd-sub">${esc(ALL_APPS[a.app].name)}</p></div>
  <button class="am-try amd-try" type="button">Try Me!</button>`;

function bodyHTML(a) {
  const d = detailsOf(a), pub = publisherOf(d.publisher);
  const more = publishedBy(d.publisher).filter((o) => o.id !== a.id);
  return `<img class="amd-thumb" src="${asset(thumbOf(a))}" alt="" width="768" height="432" decoding="async" draggable="false">
  <ul class="amd-stats">
    <li><b><span class="amd-score">0</span>${star('amd-star')}</b><span class="amd-count"></span></li>
    <li><b>${compact.format(a.uses)}</b><span>uses</span></li>
    <li><b>~${num.format(d.credits)}</b><span>credits a round</span></li>
  </ul>
  <button class="amd-pub" type="button" data-pub="${d.publisher}">${pfp(pub, 'amd-pfp-sm')}<span class="amd-pub-t"><b>${esc(pub.name)}</b><small>Publisher, ${plural(publishedBy(d.publisher).length, 'automation')}</small></span>${NEXT_ICON}</button>
  <section class="amd-sec" aria-labelledby="amd-h-about"><h3 class="amd-h" id="amd-h-about">About</h3>${d.about.map((p) => `<p class="amd-p">${esc(p)}</p>`).join('')}</section>
  <section class="amd-sec" aria-labelledby="amd-h-ratings"><h3 class="amd-h" id="amd-h-ratings">Ratings and reviews</h3>
    <div class="amd-ratings">
      <p class="amd-big"><b class="amd-score">0</b><span>out of 5</span><span class="amd-count"></span></p>
      <ul class="amd-bars">${[5, 4, 3, 2, 1].map((n) => `<li><span aria-hidden="true">${n}</span><span class="amd-bar" role="img"><i></i></span></li>`).join('')}</ul>
    </div>
    <fieldset class="amd-rate"><legend class="amd-rate-l">Your rating</legend><span class="amd-rate-stars">${[1, 2, 3, 4, 5].map((n) => `<input class="amd-vh" type="radio" name="amd-rate" id="amd-rate-${n}" value="${n}"><label for="amd-rate-${n}">${star('amd-rate-star')}<span class="amd-vh">${n} out of 5</span></label>`).join('')}</span><span class="amd-rated" role="status"></span></fieldset>
    ${reviewsHTML(d.reviews)}
  </section>
  ${more.length ? `<section class="amd-sec" aria-labelledby="amd-h-more"><h3 class="amd-h" id="amd-h-more">More by ${esc(pub.name)}</h3><ul class="amd-more-list">${more.map(other).join('')}</ul></section>` : ''}`;
}

// ---------- a publisher ----------
// `back` is the automation it was opened from, the top row's way back to it
const pubHeadHTML = (pub, back) => `${back ? `<button class="amd-back" type="button" data-id="${back.id}" aria-label="Back to ${esc(back.title)}">${BACK_ICON}</button>` : ''}${pfp(pub, 'amd-pfp-md')}
  <div class="amd-name"><h2 class="amd-title" id="amd-title" tabindex="-1">${esc(pub.name)}</h2><p class="amd-sub">Publisher</p></div>`;

function pubBodyHTML(id) {
  const pub = publisherOf(id), list = publishedBy(id);
  const counts = list.map((a) => countsOf(a.id)).reduce((all, c) => all.map((n, i) => n + c[i]));
  return `<p class="amd-p">${esc(pub.about)}</p>
  <ul class="amd-stats">
    <li><b>${list.length}</b><span>${list.length === 1 ? 'automation' : 'automations'}</span></li>
    <li><b>${compact.format(list.reduce((sum, a) => sum + a.uses, 0))}</b><span>uses</span></li>
    <li><b>${meanOf(counts).toFixed(1)}${star('amd-star')}</b><span>${num.format(totalOf(counts))} ratings</span></li>
  </ul>
  <section class="amd-sec" aria-labelledby="amd-h-pub"><h3 class="amd-h" id="amd-h-pub">Automations by ${esc(pub.name)}</h3><ul class="amd-more-list">${list.map(other).join('')}</ul></section>`;
}

export function mountDetail({ sb, start }) {
  // the close button takes the focus as it opens, never Try Me! beside it
  const dialog = fromHTML(`<dialog class="amd" aria-labelledby="amd-title"><header class="amd-top"><div class="amd-head"></div><button class="amd-close" type="button" aria-label="Close" autofocus>${X_ICON}</button></header><div class="amd-scroll"></div></dialog>`);
  document.body.append(dialog);
  const head = dialog.querySelector('.amd-head'), scroll = dialog.querySelector('.amd-scroll');
  let current = null, reviews = null, opener = null, starting = false;

  // the average, the count and the bars with the viewer's rating in them; `said` tells them it was kept
  function paintRatings(said) {
    const counts = countsOf(current.id), total = totalOf(counts), mine = state.rated[current.id];
    for (const el of scroll.querySelectorAll('.amd-score')) el.textContent = meanOf(counts).toFixed(1);
    for (const el of scroll.querySelectorAll('.amd-count')) el.textContent = `${num.format(total)} ratings`;
    scroll.querySelectorAll('.amd-bar').forEach((bar, i) => {
      bar.firstElementChild.style.width = `${total ? ((counts[i] / total) * 100).toFixed(1) : 0}%`;
      bar.setAttribute('aria-label', `${5 - i} stars: ${num.format(counts[i])} ratings`);
    });
    scroll.querySelectorAll('.amd-rate input').forEach((input, i) => {
      input.checked = i + 1 === mine;
      input.nextElementSibling.classList.toggle('is-on', i < (mine ?? 0));
    });
    scroll.querySelector('.amd-rated').textContent = mine ? `${said ? 'Saved: you' : 'You'} rated it ${mine} out of 5.` : '';
  }

  function show(a) {
    current = a;
    dialog.dataset.view = 'automation';
    head.innerHTML = headHTML(a);
    scroll.innerHTML = bodyHTML(a);
    scroll.scrollTop = 0;
    paintRatings(false);
    reviews = wireReviews(scroll, a.id);
  }

  function showPublisher(id) {
    const back = current;
    current = null;
    reviews = null;
    dialog.dataset.view = 'publisher';
    head.innerHTML = pubHeadHTML(publisherOf(id), back);
    scroll.innerHTML = pubBodyHTML(id);
    scroll.scrollTop = 0;
  }

  // `from` is the control focus goes back to when it closes (the card's own button). The close button takes the focus
  // either way, but the browser rings a focus it gave on opening even after a click, so `keyboard` (opened with a key)
  // decides whether a ring shows before a key is pressed in it (.is-pointer, automations.03378ba4.css). It opens at its
  // top: a closed dialog lays nothing out, so show() cannot scroll it, and the browser would bring back where the last
  // one was scrolled to
  function open(id, from, { keyboard = false } = {}) {
    const a = byId(id);
    if (!a) return;
    opener = from ?? document.activeElement;
    dialog.style.setProperty('--k', scaleOf(sb));
    dialog.classList.toggle('is-pointer', !keyboard);
    show(a);
    if (!dialog.open) dialog.showModal();
    scroll.scrollTop = 0;
  }

  dialog.addEventListener('click', (e) => {
    // a press on the backdrop (the dialog itself, outside what it holds) closes it
    if (e.target === dialog || e.target.closest('.amd-close')) return dialog.close();
    if (e.target.closest('.amd-try')) {
      starting = true;
      dialog.close();
      start(current);
      return;
    }
    // another automation, its publisher, or back from the publisher: each in this one's place, the focus on its name
    const to = e.target.closest('.amd-more, .amd-back, .amd-pub');
    if (!to) return;
    if (to.matches('.amd-pub')) showPublisher(to.dataset.pub);
    else show(byId(to.dataset.id));
    head.querySelector('.amd-title').focus();
  });
  scroll.addEventListener('change', (e) => {
    if (e.target.name !== 'amd-rate') return;
    state.rated[current.id] = Number(e.target.value);
    save('rated');
    paintRatings(true);
    reviews.paint();
  });
  // its keys stay in it: space presses its buttons rather than pausing the spot, "/" stays out of the tab's search. A key
  // pressed in it (usesKeys) means the keyboard is in use, so focus rings show from then on, until the pointer is
  // pressed in it again
  dialog.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (usesKeys(e)) dialog.classList.remove('is-pointer');
  });
  dialog.addEventListener('pointerdown', () => dialog.classList.add('is-pointer'));
  // Try Me! leaves the tab for the chat it starts, so focus goes back to the card only when it was simply closed. The
  // close event comes a beat after closing: a focus taken in between (a press on the search field) is left where it is
  dialog.addEventListener('close', () => {
    const lost = document.activeElement === document.body || dialog.contains(document.activeElement);
    if (!starting && lost) opener?.focus();
    starting = false;
  });
  return { open };
}
