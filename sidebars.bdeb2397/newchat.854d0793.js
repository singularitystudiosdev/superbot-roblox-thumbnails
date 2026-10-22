// New chat: the sidebar's New chat row opens an empty chat over the spot, a heading over the composer led by the ouroboro
// mark rolling (mark.901bc0c7.js), its field typing out one thing superbot can automate after another, and the most used
// automations to start from (a press puts its prompt in the field; sent as it is, it starts as its Try Me! does), then
// See more, which opens the Automations tab over it. The first message sent makes it a chat: its row joins the top of the sidebar's list, titled with that
// message, and is the current page. Nothing answers. A chat started here opens again from its row, ?chat=<id> opens
// it at load, and deleting its row deletes it. Drawn with the chat view's classes (chatview.bdeb2397.css .cv-*), with
// no computer view: superbot has not started on anything.
// An automation started from the Automations tab (am-start, automations-view.03378ba4.js) is a chat too, titled with its
// prompt and marked with its app: its row plays the live chat's run with that prompt typed in (spot-ask,
// main.bdeb2397.js), which asks which game it runs on until it is answered (gameask.b3fb005c.js) and keeps the answer,
// and the live chat's own row puts the spot's prompt back.
import { esc, asset, row as rowHTML, list, mark } from './parts.bdeb2397.js';
import './mark.901bc0c7.js';
import { FX, CHATS } from './chats.bdeb2397.js';
import { marquee } from './marquee.bdeb2397.js';
import { spin } from './spin.4bc2a2d5.js';
import { state, save, sentOf, addSent } from './store.854d0793.js';
import { wireComposer, cloneComposer } from './composer.854d0793.js';
import { userBubble } from './bubble.854d0793.js';
import { AUTOMATIONS, iconOf } from './automations.03378ba4.js';
import { mountLatest, park, land } from './latest.bfdfd5c2.js';

// the ideas to start from: the most used automations in the Automations tab's catalogue
const IDEAS = [...AUTOMATIONS].sort((x, y) => y.uses - x.uses).slice(0, 4);
// what an empty New chat's field types out, one after another, round and round
const EXAMPLES = [
  'Continually optimize thumbnails on my game...',
  'Send out calls collecting data for...',
  'Find me tickets <$100 for...',
  'Email YouTubers every week to sponsor...',
  'Reply to every new review on...',
  'Watch flights to Tokyo and book one under...',
  'Keep my inbox at zero by...',
  'Order me lunch every Friday from...',
];
const HINT = 'Tell ouroboro what to do'; // the field's placeholder once a chat is under way
// per letter typed and erased, an example held whole, the pause before the next
const TYPE_MS = 22, ERASE_MS = 15, HOLD_MS = 1800, GAP_MS = 400;
const STILL = matchMedia('(prefers-reduced-motion: reduce)');
const TITLE_MAX = 60; // characters of the first message a new chat's row keeps; the row fades the rest
const NEW_HREFS = new Set(['#new-chat', '#new']);
const LIVE = CHATS.find((c) => c.live).id;
const fromHTML = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

function titleOf(msg) {
  const line = (msg.u.split('\n')[0] || msg.files[0]?.name || 'New chat').trim();
  return line.length > TITLE_MAX ? `${line.slice(0, TITLE_MAX).replace(/\s+\S*$/, '')}` : line;
}

// types each example into the placeholder a letter at a time, holds it, erases it and types the next; with reduced
// motion each shows whole for a while instead. Stopped, it picks up where it left off.
function typeExamples(setText) {
  let timer = 0, n = 0, at = 0, erasing = false;
  const after = (ms) => { timer = setTimeout(tick, ms); };
  function tick() {
    const text = EXAMPLES[n];
    if (STILL.matches) {
      at = 0;
      erasing = false;
      setText(text);
      n = (n + 1) % EXAMPLES.length;
      after(HOLD_MS * 2);
      return;
    }
    at += erasing ? -1 : 1;
    setText(text.slice(0, at));
    if (!erasing && at === text.length) { erasing = true; after(HOLD_MS); } else if (erasing && at === 0) { erasing = false; n = (n + 1) % EXAMPLES.length; after(GAP_MS); } else after(erasing ? ERASE_MS : TYPE_MS);
  }
  return {
    start() { if (!timer) tick(); },
    stop() { clearTimeout(timer); timer = 0; },
  };
}

export function mountNewChat({ app, sb, actions }) {
  const page = fromHTML(`<section class="cv nc is-empty" aria-label="New chat" hidden>
    <div class="cv-chat">
      <div class="nc-hero">${mark()}<h1 class="nc-h">What can ouroboro automate for you?</h1></div>
      <div class="cv-feed" tabindex="0" role="region" aria-label="Messages"><div class="cv-in"></div></div>
      <ul class="nc-ideas" aria-label="Popular automations">${IDEAS.map((a) => `<li><button class="nc-idea" type="button" data-id="${esc(a.id)}"><img src="${asset(iconOf(a.app))}" alt="" width="16" height="16">${esc(a.title)}</button></li>`).join('')}<li><button class="nc-more" type="button" aria-label="See more automations">See more</button></li></ul>
    </div>
  </section>`);
  app.append(page);
  const feed = page.querySelector('.cv-feed'), feedIn = page.querySelector('.cv-in');
  const composer = cloneComposer(app);
  feed.after(composer);
  mountLatest(feed);
  const hintId = sb.querySelector('[id^="sb-sort-hint-"]')?.id;
  const made = (id) => state.made.some((c) => c.id === id);
  const askOf = (id) => state.made.find((c) => c.id === id)?.ask;
  const rowOf = (id) => sb.querySelector(`.sb-scroll a.sb-row[href="#${CSS.escape(id)}"]`);
  let openId = null;
  // the automation chat whose prompt the spot is playing (null: the spot's own), and one just started, which plays from
  // its start even if its prompt is the one playing
  let playing = null, fresh = null;
  // the popular automation whose prompt a press put in the field: sent unchanged, it starts that automation
  let picked = null;
  const askFor = (id) => `Use the ${AUTOMATIONS.find((a) => a.id === id).title} automation`;

  // a new chat joins the top of the main list: Recent where pinned chats sit above it, Today in the dated lists
  function targetList() {
    const secs = [...sb.querySelectorAll('.sb-scroll .sb-sec')];
    const sec = secs.find((s) => /^(Recent|Today)$/.test(s.querySelector('.sb-head')?.textContent)) ?? secs[0];
    if (!sec) throw new Error('the sidebar has no section to add a chat to');
    let ul = sec.querySelector(':scope > .sb-list');
    if (!ul) {
      // the list's empty state gives way to the list
      sec.querySelector('.sb-empty')?.remove();
      ul = fromHTML(list(''));
      sec.append(ul);
    }
    return ul;
  }
  // an automation chat is at work from the moment it starts, its tasks recurring with no end, so its icon turns as the
  // working chats' do (spin.4bc2a2d5.js); a chat started here waits, nothing having answered it
  function insertRow(c) {
    const li = fromHTML(rowHTML({ id: c.id, title: c.title, fx: c.fx ?? 'memo', working: !!c.ask }));
    targetList().prepend(li);
    marquee(li);
    spin(li);
    if (hintId) li.querySelector('a.sb-row').setAttribute('aria-describedby', hintId);
    return li;
  }
  function setCurrent(a) {
    for (const n of sb.querySelectorAll('a[aria-current]')) n.removeAttribute('aria-current');
    a?.setAttribute('aria-current', 'page');
  }

  function paint() {
    const msgs = openId ? sentOf(openId) : [];
    page.classList.toggle('is-empty', !msgs.length);
    feedIn.innerHTML = msgs.map(userBubble).join('');
    const title = state.made.find((c) => c.id === openId)?.title;
    page.setAttribute('aria-label', title ? `Chat: ${title}` : 'New chat');
    // an empty New chat types out what superbot can automate; a chat under way asks for the next thing
    if (msgs.length) { examples.stop(); box.setPlaceholder(HINT); } else examples.start();
  }

  const box = wireComposer(composer, {
    actions,
    chat: () => openId && { id: openId, title: state.made.find((c) => c.id === openId)?.title },
    onSend(msg) {
      // a popular automation's prompt sent as it was put in starts it as its Try Me! in the Automations tab does (am-try,
      // automations-view.03378ba4.js); a page without the tab makes it a chat like any other message
      const id = picked;
      picked = null;
      if (!openId && id && msg.u === askFor(id) && !msg.files.length && !sb.dispatchEvent(new CustomEvent('am-try', { cancelable: true, detail: { id } }))) return;
      if (!openId) {
        const c = { id: `new-${Date.now().toString(36)}`, title: titleOf(msg) };
        state.made.unshift(c);
        insertRow(c);
        openId = c.id;
        setCurrent(rowOf(c.id));
      }
      addSent(openId, msg);
      paint();
      feed.scrollTop = feed.scrollHeight;
    },
  });
  box.setPlaceholder(HINT);
  const examples = typeExamples((text) => box.setPlaceholder(text));

  // how far each chat started here was scrolled when the viewer left it: opened again it is back there, at its top the
  // first time (latest.bfdfd5c2.js)
  const places = new Map();
  const leave = () => { if (openId && !page.hidden) places.set(openId, feed.scrollTop); };
  function show(id) {
    leave();
    openId = id;
    picked = null;
    page.hidden = false;
    document.body.classList.add('cv-open');
    park(feed, places.get(id) ?? 0);
    paint();
    land(feed);
    setCurrent(id ? rowOf(id) : sb.querySelector('a[href="#new-chat"]'));
    box.reset();
    if (!id) box.focus();
    page.classList.remove('is-in');
    void page.offsetWidth;
    page.classList.add('is-in');
  }
  function hide() {
    leave();
    openId = null;
    page.hidden = true;
    examples.stop();
  }

  // the spot plays an automation chat's prompt (`id`), or its own (null); the chat's automation and the game it was
  // given, or none yet, decide whether the run asks for one
  function play(id, restart = false) {
    playing = id;
    const c = id ? state.made.find((m) => m.id === id) : null;
    sb.dispatchEvent(new CustomEvent('spot-ask', { detail: { ask: c?.ask ?? null, restart, id: id ?? LIVE, automation: c?.automation ?? null, game: c?.game ?? null } }));
  }
  // an automation chat opened: the live chat (chatview.bdeb2397.js has shown it) playing its prompt, its row the current
  function run(id) {
    hide();
    setCurrent(rowOf(id));
    play(id, fresh === id);
    fresh = null;
  }

  // after the chat view's own handler (chatview.bdeb2397.js), which opens the live chat for a row it has no chat for
  document.addEventListener('click', (e) => {
    // the Automations tab's Prompt your own! plays the live chat, its own prompt (chatview.bdeb2397.js)
    if (e.target.closest('.am-new')) { hide(); play(null); return; }
    const a = e.target.closest('a[href]');
    if (!a || !sb.contains(a)) return;
    const href = a.getAttribute('href'), id = href.slice(1), inList = !!a.closest('.sb-scroll');
    if (NEW_HREFS.has(href)) { e.preventDefault(); show(null); } else if (href === '#automations') { /* the tab opens over this */ } else if (inList && askOf(id)) run(id); else if (inList && made(id)) show(id); else {
      hide();
      if (id === LIVE) play(null);
    }
  });
  // an automation started: its chat joins the list and opens, playing from its start
  sb.addEventListener('am-start', (e) => {
    e.preventDefault();
    const { automation, ask } = e.detail;
    const c = { id: `auto-${Date.now().toString(36)}`, title: ask, ask, fx: FX[automation.app] ? automation.app : 'memo', automation: automation.id };
    state.made.unshift(c);
    save('made');
    const a = insertRow(c).querySelector('a.sb-row');
    fresh = c.id;
    a.click();
    a.focus();
  });
  // the game the playing automation chat was asked for: kept, so its row plays with the answer in
  sb.addEventListener('spot-answer', (e) => {
    const c = playing && state.made.find((m) => m.id === playing);
    if (!c?.automation) return;
    c.game = e.detail.game;
    save('made');
  });
  // a popular automation puts its prompt in the field, the caret after it, for the person to send or change; See more
  // opens the Automations tab, the whole catalogue, as the sidebar's Automations row does
  page.querySelector('.nc-ideas').addEventListener('click', (e) => {
    if (e.target.closest('.nc-more')) { actions.automations(); return; }
    const b = e.target.closest('.nc-idea');
    if (!b) return;
    box.fill(askFor(b.dataset.id));
    picked = b.dataset.id;
  });
  page.addEventListener('keydown', (e) => { if (e.target.closest('button')) e.stopPropagation(); });
  sb.addEventListener('sb-delete', (e) => {
    const i = state.made.findIndex((c) => c.id === e.detail.id);
    if (i < 0) return;
    state.made.splice(i, 1);
    delete state.sent[e.detail.id];
    save('made');
    if (openId === e.detail.id) hide();
    // the chat view opens the live chat in its place: the spot's own prompt again
    if (playing === e.detail.id) play(null);
  });
  // the chats started earlier in this tab, newest on top
  for (const c of [...state.made].reverse()) insertRow(c);
  const asked = new URLSearchParams(location.search).get('chat');
  if (asked && askOf(asked)) { fresh = asked; run(asked); } else if (asked && made(asked)) show(asked);
  return { show, hide, isOpen: () => !page.hidden };
}
