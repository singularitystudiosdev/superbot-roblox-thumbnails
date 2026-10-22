// Moving between chats: a chat row in the sidebar opens that chat. The live one is the creative itself, playing; every
// other one opens over it, laid out as the live one is: the chat on the left, and on the right the live view's top bar,
// the computer view on the app superbot is working in and the Activity tab under it. Each plays its own run from its
// start as the live one plays (chatplay.8889b4ff.js); one whose run cannot start shows as it stands (screenview.bdeb2397.js,
// screens.bdeb2397.js). Drawn with the creative's own classes (.cm, .cm-card, .ac-row, .cc-* from style.af4c3c6b.css),
// so a result card, a win or the screen reads exactly as it does in the live chat. ?chat=<id> opens one at load.
//
// The click is handled on the document, after the sidebar's own listeners (the Automations tab's among them, which
// hands the current mark back to the live chat as it closes), so the chat clicked always ends up the current one.
import { CHATS, FX } from './chats.bdeb2397.js';
import { TRANSCRIPTS } from './transcripts.bdeb2397.js';
import { SCREENS } from './screens.bdeb2397.js';
import { screenHTML, fitScreens } from './screenview.bdeb2397.js';
import { esc, asset } from './parts.bdeb2397.js';
import { hasPlay, startPlay } from './chatplay.8889b4ff.js';
import { linkRefs } from './automation-refs.3c255b31.js';
import { mountLatest, park, land } from './latest.bfdfd5c2.js';

const LIVE = CHATS.find((c) => c.live).id;
const idOf = (a) => a.getAttribute('href').slice(1);

const popper = () => `<span class="ac-fx" aria-hidden="true"><img class="ac-pop" src="${asset(FX.party)}" alt="" width="15" height="15"></span>`;
const icon = (name, cls) => `<img class="${cls}" src="${asset(FX[name])}" alt="" width="96" height="96">`;

// a card as the live chat draws one: a picture (or the 3D icon on a tile) with its title and lines and its figure, or a
// strip of pictures with captions
function card(c) {
  if (c.strip) {
    const fig = (s) => (s.img
      ? `<figure><img src="${asset(s.img)}" alt="" width="768" height="432"><figcaption>${esc(s.name)}</figcaption></figure>`
      : `<figure><span class="cv-tile">${icon(s.fx, 'cv-tile-ic')}</span><figcaption>${esc(s.name)}</figcaption></figure>`);
    return `<div class="cm-card cm-strip">${c.strip.map(fig).join('')}</div>`;
  }
  const art = c.img ? `<span class="cm-thumb"><img src="${asset(c.img)}" alt="" width="768" height="432"></span>` : `<span class="cm-thumb cv-tile">${icon(c.fx, 'cv-tile-ic')}</span>`;
  return `<div class="cm-card">${art}<span class="cm-card-t"><b>${esc(c.title)}</b><small>${esc(c.sub)}</small><small>${esc(c.line)}</small></span><span class="cm-card-p"><b>${c.win || c.find ? popper() : ''}${esc(c.value)}</b><small>${esc(c.unit)}</small></span></div>`;
}

// a sent message shows a web address in it as a link, as the live chat renders one, opening in a new tab, and a library
// automation it names as a link to it (automation-refs.3c255b31.js)
const linkify = (html) => html.replace(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|gg|io|net|org)(?:\/[^\s<]*[^\s<.,;:!?)])?/gi, (url) => `<a class="cm-link" href="${/^https?:\/\//i.test(url) ? url : `https://${url}`}" target="_blank" rel="noopener noreferrer">${url}</a>`);

function message(m) {
  if (m.u) return `<div class="cm cm-u"><span>${linkRefs(linkify(esc(m.u)))}</span></div>`;
  const after = m.after ? `<p class="cm-say cm-after">${esc(m.after)}</p>` : '';
  return `<div class="cm cm-b"><p class="cm-say">${esc(m.b)}</p>${m.card ? card(m.card) : ''}${after}</div>`;
}

const step = ([fx, text, win]) => `<div class="ac-row${win ? ' ac-win' : ''}"><img class="ac-ic" src="${asset(FX[fx])}" alt="" width="15" height="15"><span>${esc(text)}</span>${win ? popper() : ''}</div>`;

// `app` is the creative's .app, `sb` the sidebar main.bdeb2397.js mounted in it
export function mountChats({ app, sb }) {
  const page = document.createElement('section');
  page.className = 'cv';
  page.hidden = true;
  // the composer is the live chat's own, copied, so it reads the same; it only shows a suggestion here
  const composer = app.querySelector('.ch .composer').cloneNode(true);
  composer.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
  composer.querySelector('.rc-typed').textContent = '';
  // the creative's own rule shows the caret whatever `hidden` says
  composer.querySelector('.rc-caret').style.display = 'none';
  composer.querySelector('.rc-send').classList.remove('is-on');
  // the live view's top bar, copied as the composer is: it reads the same, and its buttons only work in the live chat
  const top = app.querySelector('.cc .cc-top').cloneNode(true);
  top.setAttribute('aria-hidden', 'true');
  top.querySelectorAll('button').forEach((b) => b.setAttribute('tabindex', '-1'));
  // both panes scroll, so both take focus: the keyboard can scroll them too
  page.innerHTML = `<div class="cv-chat"><div class="cv-feed" tabindex="0" role="region" aria-label="Messages"><div class="cv-in"></div></div></div>
    <div class="cv-side"><div class="cc-stack"><div class="cv-screen" role="img"></div><div class="ac"><div class="ac-list cv-acts" tabindex="0" role="region" aria-label="Activity"><div class="ac-in"></div><p class="ac-empty">Ouroboro's steps show up here as it works.</p></div></div></div></div>
    <div class="cv-dip"></div>`;
  page.querySelector('.cv-chat').append(composer);
  page.querySelector('.cc-stack').prepend(top);
  app.append(page);
  const feed = page.querySelector('.cv-feed'), feedIn = page.querySelector('.cv-in');
  mountLatest(feed);
  const acts = page.querySelector('.cv-acts'), actsIn = acts.querySelector('.ac-in'), hint = composer.querySelector('.rc-hint');
  const screen = page.querySelector('.cv-screen');
  const fit = fitScreens(page);

  function render(id) {
    const t = TRANSCRIPTS[id], s = SCREENS[id];
    // whatever a run painted inline is cleared, so the chat reads as it stands
    for (const n of [feedIn, actsIn, hint]) n.removeAttribute('style');
    feedIn.innerHTML = t.messages.map(message).join('');
    actsIn.innerHTML = t.acts.map(step).join('');
    hint.textContent = t.hint;
    // the screen is one picture to a screen reader: what superbot has open
    screen.innerHTML = s ? screenHTML(s) : '';
    screen.setAttribute('aria-label', s ? `Your computer: ${s.alt}` : 'Your computer');
    // whatever adds to a chat as it stands (chat-ui.854d0793.js: the messages sent in it) adds it here
    page.dispatchEvent(new CustomEvent('cv-render', { detail: { id } }));
  }

  // a chat as it stands: every message and step in full, the computer view on the app it worked in
  function still(id) {
    page.classList.remove('is-play');
    feed.classList.remove('ch-feed');
    feedIn.classList.remove('ch-in');
    render(id);
    fit();
    // once it is laid out, not while hidden: the chat where the viewer left it, at its top the first time, or at its
    // latest if they were following its run (latest.bfdfd5c2.js); the Activity tab at its latest
    land(feed);
    acts.scrollTop = acts.scrollHeight;
  }

  // a chat with a run (chatplay.8889b4ff.js) plays it from its start, the chat and the Activity tab painted as the live
  // chat's are (the creative's .ch-feed and .ch-in, laid out once; the chat scrolls as its posts arrive, the Activity tab
  // moves); a run that cannot start (its
  // pages did not load) leaves the chat as it stands, the error logged
  let run = null, opened = 0;
  function play(id, at) {
    const mine = opened;
    page.classList.add('is-play');
    feed.classList.add('ch-feed');
    feedIn.classList.add('ch-in');
    screen.setAttribute('aria-label', 'Your computer: ouroboro at work');
    startPlay(page, id, fit, () => mine === opened, { at }).then((r) => { if (mine === opened) run = r; else r.stop(); }).catch((e) => {
      console.error(new Error(`the ${id} chat's run did not start; showing the chat as it stands`, { cause: e }));
      if (mine === opened) still(id);
    });
  }

  // cv-still: the open chat shown as it stands, its run stopped (chat-ui.854d0793.js, once the viewer writes in it)
  let current = LIVE;
  page.addEventListener('cv-still', () => {
    if (current === LIVE) return;
    run?.stop();
    run = null;
    opened++;
    still(current);
  });

  // where each chat was left: how far its chat was scrolled and, for a run, its clock and when. Opened again it is back
  // there, its run going on as if it had played all along and what came in meanwhile under the view; the first time,
  // its run from the start and its chat at the top
  const places = new Map();
  function leave() {
    if (current === LIVE || page.hidden) return;
    places.set(current, { top: feed.scrollTop, at: run?.now() ?? null, when: performance.now() });
  }

  function open(id) {
    const live = id === LIVE || !TRANSCRIPTS[id];
    leave();
    run?.stop();
    run = null;
    opened++;
    page.setAttribute('aria-label', `Chat: ${CHATS.find((c) => c.id === id)?.title ?? ''}`);
    page.hidden = live;
    document.body.classList.toggle('cv-open', !live);
    if (!live) {
      const p = places.get(id);
      park(feed, p?.top ?? 0);
      if (hasPlay(id)) play(id, p?.at == null ? 0 : p.at + (performance.now() - p.when) / 1000);
      else still(id);
      page.classList.remove('is-in');
      void page.offsetWidth;
      page.classList.add('is-in');
    }
    for (const a of sb.querySelectorAll('a.sb-row[aria-current]')) a.removeAttribute('aria-current');
    sb.querySelector(`.sb-scroll a.sb-row[href="#${live ? LIVE : id}"]`)?.setAttribute('aria-current', 'page');
    current = live ? LIVE : id;
    page.dispatchEvent(new CustomEvent('cv-open', { detail: { id: current, live } }));
  }

  document.addEventListener('click', (e) => {
    // Prompt your own! in the Automations tab plays the live chat from its start (an automation's Try Me! opens its own
    // chat's row, whose run asks for its game: automations-view.03378ba4.js)
    if (e.target.closest('.am-new')) { open(LIVE); return; }
    const a = e.target.closest('a.sb-row');
    if (!a || !sb.contains(a)) return;
    if (a.closest('.sb-scroll')) open(idOf(a));
    // a nav row other than Automations (New chat) shows the live chat again
    else if (a.getAttribute('href') !== '#automations') open(LIVE);
  });

  // the open chat deleted: back to the live one, or the first chat left if the live one is gone
  sb.addEventListener('sb-delete', (e) => {
    const open_ = sb.querySelector('.sb-scroll a.sb-row[aria-current]');
    if (!open_ || idOf(open_) !== e.detail.id) return;
    const next = e.detail.id === LIVE ? [...sb.querySelectorAll('.sb-scroll a.sb-row')].map(idOf).find((id) => id !== LIVE) : LIVE;
    queueMicrotask(() => next && open(next));
  });

  const asked = new URLSearchParams(location.search).get('chat');
  if (asked && TRANSCRIPTS[asked] && CHATS.some((c) => c.id === asked)) open(asked);
  return { open };
}
