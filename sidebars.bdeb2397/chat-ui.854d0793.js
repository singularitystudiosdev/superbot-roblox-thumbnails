// Every control on the page working, as the app would have it, with nothing ever answering: an open chat's composer
// sends what you write (the chat stops its run and shows as it stands, your message at its foot), Stop on its computer
// view stops superbot and Resume plays it again, the top bar's Share gives the chat's link and its close button folds
// the computer view away. New chat (newchat.854d0793.js), the sidebar's own buttons (sidebar-tools.854d0793.js) and
// Settings (settings.854d0793.js) hang off it too, and the live chat (live.e61b4e86.js): the creative itself, playing,
// its composer and Stop working the same way. It talks to the chat view (chatview.bdeb2397.js) through its page's
// events: cv-open and cv-render as a chat opens and draws, cv-still to have it show its chat as it stands.
import { CHATS, FX } from './chats.bdeb2397.js';
import { esc, asset, fx } from './parts.bdeb2397.js';
import { state, save, sentOf, addSent, notifies, setNotifies } from './store.854d0793.js';
import { wireComposer } from './composer.854d0793.js';
import { userBubble } from './bubble.854d0793.js';
import { mountNewChat } from './newchat.854d0793.js';
import { mountLive } from './live.e61b4e86.js';
import { mountSidebarTools } from './sidebar-tools.854d0793.js';
import { openSettings as settingsAt } from './settings.854d0793.js';
import { makePopover } from './popover.854d0793.js';
import { ic } from './icons.854d0793.js';

const app = document.querySelector('.app'), sb = app?.querySelector('.sb'), page = app?.querySelector('.cv');
if (!page) throw new Error('no chat view to wire: load main.bdeb2397.js before chat-ui.854d0793.js');
const LIVE = CHATS.find((c) => c.live).id;
// the keys main.bdeb2397.js and a chat's run turn into playback; on a button or in a field they are its own
const SPOT_KEYS = new Set([' ', 'r', 'R', 'ArrowLeft', 'ArrowRight']);
const COPY_KEY = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘C' : 'Ctrl+C';
const fromHTML = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

const openSettings = (section, opts) => settingsAt(sb, section, opts);
const actions = {
  automations: () => sb.querySelector('a[href="#automations"]')?.click(),
};

// ---------- an open chat ----------
const feed = page.querySelector('.cv-feed'), feedIn = page.querySelector('.cv-in'), acts = page.querySelector('.cv-acts');
const screen = page.querySelector('.cv-screen');
const drafts = new Map(), stopped = new Set();
let openId = null;
const playing = () => page.classList.contains('is-play');
const rowOf = (id) => sb.querySelector(`.sb-scroll a.sb-row[href="#${CSS.escape(id)}"]`);
// the chat shown as it stands, its run's clock stopped: what the viewer takes over by writing in it
const hold = () => { if (openId && playing()) page.dispatchEvent(new Event('cv-still')); };
// a chat at work (chats.bdeb2397.js, or an automation started, newchat.854d0793.js) has its icon turning in the sidebar
// (spin.4bc2a2d5.js) until it is stopped
const working = (id) => !!(CHATS.find((c) => c.id === id)?.working || state.made.find((c) => c.id === id)?.ask);
const paintWorking = (id) => rowOf(id)?.closest('li.sb-item')?.classList.toggle('is-working', working(id) && !stopped.has(id));
const stopRow = `<div class="ac-row cv-stopped"><img class="ac-ic" src="${asset(FX.hourglass)}" alt="" width="15" height="15"><span>Stopped by you. Nothing more happens until you resume.</span></div>`;

const box = wireComposer(page.querySelector('.composer'), {
  actions,
  chat: () => openId && { id: openId, title: CHATS.find((c) => c.id === openId)?.title },
  onEngage: hold,
  onSend(msg) {
    addSent(openId, msg);
    if (playing()) hold(); else feedIn.insertAdjacentHTML('beforeend', userBubble(msg));
    feed.scrollTop = feed.scrollHeight;
  },
});
new MutationObserver(() => box.setPainted(playing())).observe(page, { attributes: true, attributeFilter: ['class'] });
box.setPainted(playing());

// what a chat adds to its chat as it stands: the messages sent in it, and a line in its Activity once it is stopped
function dress(id) {
  feedIn.insertAdjacentHTML('beforeend', sentOf(id).map(userBubble).join(''));
  if (stopped.has(id)) acts.querySelector('.ac-in').insertAdjacentHTML('beforeend', stopRow);
  box.setPlaceholder(page.querySelector('.composer .rc-hint').textContent);
}
page.addEventListener('cv-render', (e) => dress(e.detail.id));
function opened(id) {
  if (openId) drafts.set(openId, box.draft());
  openId = id;
  if (!id) return;
  box.reset(drafts.get(id) ?? '');
  page.classList.toggle('is-stopped', stopped.has(id));
  // a chat written in, or stopped, opens as it stands
  if (sentOf(id).length || stopped.has(id)) hold();
}
page.addEventListener('cv-open', (e) => opened(e.detail.live ? null : e.detail.id));

// the computer view is one picture to a screen reader, and Stop a button beside it: the chat view labels the whole
// screen, so the label moves onto the picture and Stop becomes a real button, each time the screen is drawn
let screenLabel = 'Your computer';
function tidyScreen() {
  if (screen.hasAttribute('aria-label')) { screenLabel = screen.getAttribute('aria-label'); screen.removeAttribute('aria-label'); }
  if (screen.hasAttribute('role')) screen.removeAttribute('role');
  const view = screen.querySelector('.cv-view');
  if (view && view.getAttribute('aria-label') !== screenLabel) { view.setAttribute('role', 'img'); view.setAttribute('aria-label', screenLabel); }
  const span = screen.querySelector('span.cc-stop');
  if (span) span.replaceWith(Object.assign(document.createElement('button'), { type: 'button', className: 'cc-stop' }));
  paintStop();
}
function paintStop() {
  const b = screen.querySelector('button.cc-stop'), on = stopped.has(openId);
  if (!b || b.dataset.on === String(on)) return;
  b.dataset.on = String(on);
  b.innerHTML = on ? `${ic('play', 'cc-stop-ic')}Resume` : '<i></i>Stop';
  b.setAttribute('aria-label', on ? 'Resume ouroboro' : 'Stop ouroboro');
}
new MutationObserver(tidyScreen).observe(screen, { childList: true, subtree: true, attributes: true, attributeFilter: ['role', 'aria-label'] });
screen.addEventListener('click', (e) => {
  const b = e.target.closest('.cc-stop');
  if (!b || !openId) return;
  if (stopped.delete(openId)) {
    // resumed: the chat opens again as a click on its row opens it, its run from the start
    page.classList.remove('is-stopped');
    paintWorking(openId);
    rowOf(openId)?.click();
    screen.querySelector('button.cc-stop')?.focus();
    return;
  }
  stopped.add(openId);
  page.classList.add('is-stopped');
  paintWorking(openId);
  if (playing()) hold(); else acts.querySelector('.ac-in').insertAdjacentHTML('beforeend', stopRow);
  acts.scrollTop = acts.scrollHeight;
  paintStop();
  screen.querySelector('button.cc-stop')?.focus();
});

// ---------- the top bar: Share and folding the computer view away ----------
// under the link, Manus's offer for posting it: each place opens its own share page in a new tab, the link filled in;
// Discord has none, so its button copies the link and opens Discord to paste it. The credits are Manus's 300 ($3 at
// its $39 for 3,900) on this app's scale, $1 per 1,000,000 (settings-data.bdeb2397.js)
const SOCIALS = [
  { id: 'x', label: 'Share on X', href: (link, text) => `https://x.com/intent/post?url=${link}&text=${text}` },
  { id: 'discord', label: 'Copy the link and open Discord', href: () => 'https://discord.com/channels/@me', copies: true },
  { id: 'facebook', label: 'Share on Facebook', href: (link) => `https://www.facebook.com/sharer/sharer.php?u=${link}` },
  { id: 'reddit', label: 'Share on Reddit', href: (link, text) => `https://www.reddit.com/submit?url=${link}&title=${text}` },
];
const SHARE_CREDITS = (3_000_000).toLocaleString('en-US');
const COPIED_MS = 2000; // Copy reads Copied this long, then Copy link again
const share = makePopover({ cls: 'pm-share', role: 'dialog', label: 'Share chat' });
let copiedTimer = 0;
function openShare(btn, id) {
  const url = new URL(location.href);
  for (const k of ['t', 'tab', 'controls']) url.searchParams.delete(k);
  if (id === LIVE) url.searchParams.delete('chat'); else url.searchParams.set('chat', id);
  const link = encodeURIComponent(url.href);
  const text = encodeURIComponent(CHATS.find((c) => c.id === id)?.title ?? state.made.find((c) => c.id === id)?.title ?? '');
  clearTimeout(copiedTimer);
  share.el.innerHTML = `<p class="pm-h">Share this chat</p><p class="pm-sub">Anyone with the link sees this chat as it stands.</p>
    <div class="pm-link"><input readonly aria-label="Link to this chat" value="${esc(url.href)}"><button class="sb-btn-primary pm-copy" type="button"><span class="pm-copy-l">${ic('link')}Copy link</span><span class="pm-copy-l"></span></button><span class="pm-said sb-vh" role="status"></span></div>
    <section class="pm-earn" aria-labelledby="pm-earn-h">
      <div class="pm-earn-top">${fx('gift', 'pm-earn-ic')}<div><p class="pm-earn-h" id="pm-earn-h">Share your work, get ${SHARE_CREDITS} credits</p>
        <p class="pm-earn-sub">Post publicly to claim<button class="pm-why" type="button" aria-expanded="false" aria-controls="pm-why-t" aria-label="How to claim">${ic('circleHelp')}</button></p></div></div>
      <p class="pm-why-t" id="pm-why-t" hidden>Post the link where anyone can see it: on X, Facebook or Reddit, or in a public Discord server. The credits are added once the post is checked, one claim per account.</p>
      <div class="pm-socials">${SOCIALS.map((s) => `<a class="pm-social" href="${esc(s.href(link, text))}" target="_blank" rel="noopener noreferrer" aria-label="${s.label}"${s.copies ? ' data-copies' : ''}>${fx(s.id, 'pm-social-ic')}</a>`).join('')}</div>
    </section>`;
  share.open(btn, 'below-end', { focus: '.pm-copy' });
}
// Copy shows what it did in its own place for a moment: Copied with a check, or the key to press when the browser
// would not copy (the link selected for it)
function flipCopy(label) {
  const copy = share.el.querySelector('.pm-copy');
  copy.lastElementChild.innerHTML = label;
  copy.classList.add('is-copied');
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => copy.classList.remove('is-copied'), COPIED_MS);
}
async function copyLink() {
  const input = share.el.querySelector('input'), said = share.el.querySelector('.pm-said');
  said.textContent = '';
  try {
    await navigator.clipboard.writeText(input.value);
    flipCopy(`${ic('check')}Copied`);
    said.textContent = 'Copied';
  } catch (err) {
    console.error(new Error('the link was not copied to the clipboard', { cause: err }));
    input.select();
    flipCopy(`Press ${COPY_KEY}`);
    said.textContent = `Press ${COPY_KEY} to copy it.`;
  }
}
share.el.addEventListener('click', (e) => {
  // Discord's tile copies as Copy does, and its link still opens Discord
  if (e.target.closest('.pm-copy, .pm-social[data-copies]')) { copyLink(); return; }
  const why = e.target.closest('.pm-why');
  if (!why) return;
  const open = why.getAttribute('aria-expanded') !== 'true';
  why.setAttribute('aria-expanded', String(open));
  share.el.querySelector('.pm-why-t').hidden = !open;
  share.position();
});
// the chat view copies the live view's top bar as a picture; here its buttons work
const cvTop = page.querySelector('.cc-top');
cvTop.removeAttribute('aria-hidden');
for (const b of cvTop.querySelectorAll('button')) b.removeAttribute('tabindex');
const shareBtn = (root) => root.querySelector('.cc-top-btn[aria-label="Share"]');
shareBtn(page).addEventListener('click', (e) => openShare(e.currentTarget, openId));
// the live view shares the chat it is playing: the live one, or an automation started in it (newchat.854d0793.js)
shareBtn(app.querySelector('.app > .cc')).addEventListener('click', (e) => openShare(e.currentTarget, sb.querySelector('.sb-scroll a.sb-row[aria-current]')?.getAttribute('href').slice(1) ?? LIVE));

const sideOpen = fromHTML(`<button class="ch-open cv-side-open" type="button" aria-label="Show your computer" hidden>${app.querySelector('.ch-open svg').outerHTML}</button>`);
page.querySelector('.cv-chat').prepend(sideOpen);
function setSide(shut, focus) {
  state.sideShut = shut;
  save('sideShut');
  page.classList.toggle('is-side-shut', shut);
  sideOpen.hidden = !shut;
  if (focus) (shut ? sideOpen : page.querySelector('.cc-close')).focus();
}
page.querySelector('.cc-close').addEventListener('click', () => setSide(true, true));
sideOpen.addEventListener('click', () => setSide(false, true));
if (state.sideShut) setSide(true, false);

// ---------- the rest of the page ----------
app.addEventListener('keydown', (e) => { if (SPOT_KEYS.has(e.key) && e.target.closest?.('button, input, textarea, select')) e.stopPropagation(); });
sb.addEventListener('sb-delete', (e) => {
  const { id } = e.detail;
  if (state.sent[id]) { delete state.sent[id]; save('sent'); }
  if (!notifies(id)) setNotifies(id, true);
  stopped.delete(id);
});

// before New chat, which plays a chat started from the Automations tab at load (?chat=) in the live view
mountLive({ app, sb, actions, stopped, paintWorking, stopRow });
mountNewChat({ app, sb, actions });
mountSidebarTools({ app, sb, openSettings });

// the chat the page opened with (?chat=) was drawn before this was here to dress it
tidyScreen();
if (!page.hidden) {
  const id = sb.querySelector('.sb-scroll a.sb-row[aria-current]')?.getAttribute('href').slice(1);
  if (id && id !== LIVE) {
    if (!playing()) dress(id);
    opened(id);
  }
}
window.__chatUiReady = true;
