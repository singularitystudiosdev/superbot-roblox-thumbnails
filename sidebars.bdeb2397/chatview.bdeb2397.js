// Moving between chats: a chat row in the sidebar opens that chat. The live one is the creative itself, playing; every
// other one opens over it, laid out as the creative is once docked (the chat on the left, the Activity tab where the
// live view sits) and drawn with the creative's own classes (.cm, .cm-card, .ac-row from style.af4c3c6b.css), so a
// result card or a win reads exactly as it does in the live chat. ?chat=<id> opens one at load.
//
// The click is handled on the document, after the sidebar's own listeners (the Automations tab's among them, which
// hands the current mark back to the live chat as it closes), so the chat clicked always ends up the current one.
import { CHATS, FX } from './chats.bdeb2397.js';
import { TRANSCRIPTS } from './transcripts.bdeb2397.js';
import { esc, asset } from './parts.bdeb2397.js';

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
  return `<div class="cm-card">${art}<span class="cm-card-t"><b>${esc(c.title)}</b><small>${esc(c.sub)}</small><small>${esc(c.line)}</small></span><span class="cm-card-p"><b>${c.win ? popper() : ''}${esc(c.value)}</b><small>${esc(c.unit)}</small></span></div>`;
}

// a sent message shows a web address in it as a link, as the live chat renders one
const linkify = (html) => html.replace(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|gg|io|net|org)(?:\/[^\s<]*[^\s<.,;:!?)])?/gi, (url) => `<a class="cm-link">${url}</a>`);

function message(m) {
  if (m.u) return `<div class="cm cm-u"><span>${linkify(esc(m.u))}</span></div>`;
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
  // both panes scroll, so both take focus: the keyboard can scroll them too
  page.innerHTML = `<div class="cv-chat"><div class="cv-feed" tabindex="0" role="region" aria-label="Messages"><div class="cv-in"></div></div></div>
    <div class="cv-side"><div class="cc-stack"><div class="cc-top cv-top"><h2 class="cv-acts-h" id="cv-acts-h">Activity</h2></div><div class="ac"><div class="ac-list cv-acts" tabindex="0" role="region" aria-labelledby="cv-acts-h"><div class="ac-in"></div></div></div></div></div>`;
  page.querySelector('.cv-chat').append(composer);
  app.append(page);
  const feed = page.querySelector('.cv-feed'), feedIn = page.querySelector('.cv-in');
  const acts = page.querySelector('.cv-acts'), actsIn = acts.querySelector('.ac-in'), hint = composer.querySelector('.rc-hint');

  function render(id) {
    const t = TRANSCRIPTS[id], title = CHATS.find((c) => c.id === id)?.title ?? '';
    page.setAttribute('aria-label', `Chat: ${title}`);
    feedIn.innerHTML = t.messages.map(message).join('');
    actsIn.innerHTML = t.acts.map(step).join('');
    hint.textContent = t.hint;
  }

  function open(id) {
    const live = id === LIVE || !TRANSCRIPTS[id];
    if (!live) render(id);
    page.hidden = live;
    document.body.classList.toggle('cv-open', !live);
    if (!live) {
      // a chat opens at its latest, as the live one reads: scrolled once it is laid out, not while hidden
      feed.scrollTop = feed.scrollHeight;
      acts.scrollTop = acts.scrollHeight;
      page.classList.remove('is-in');
      void page.offsetWidth;
      page.classList.add('is-in');
    }
    for (const a of sb.querySelectorAll('a.sb-row[aria-current]')) a.removeAttribute('aria-current');
    sb.querySelector(`.sb-scroll a.sb-row[href="#${live ? LIVE : id}"]`)?.setAttribute('aria-current', 'page');
  }

  document.addEventListener('click', (e) => {
    // Try Me! in the Automations tab plays the live chat from its start
    if (e.target.closest('.am-try')) { open(LIVE); return; }
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
  if (asked && TRANSCRIPTS[asked]) open(asked);
  return { open };
}
