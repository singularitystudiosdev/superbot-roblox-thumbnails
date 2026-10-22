// The live chat, working as every other chat does (chat-ui.854d0793.js): its composer, the creative's picture of one
// while the run types into it, takes what you write, its bell, effort, + and dictation working. Writing in it, or Stop
// on its computer view, hands the chat to you: the run holds where every message and step is in (spot-still,
// main.bdeb2397.js), the chat and its Activity scroll, your messages at its foot and, stopped, a line saying so; Resume
// plays it again from its start. The live view plays the live chat and every chat started from the Automations tab
// (spot-ask, newchat.854d0793.js, says which), each with its own messages, draft, bell and Stop.
import { CHATS } from './chats.bdeb2397.js';
import { state, sentOf, addSent } from './store.854d0793.js';
import { wireComposer } from './composer.854d0793.js';
import { userBubble } from './bubble.854d0793.js';
import { ic } from './icons.854d0793.js';

const LIVE = CHATS.find((c) => c.live).id;
const titleOf = (id) => (CHATS.find((c) => c.id === id) ?? state.made.find((c) => c.id === id))?.title;

// `stopped`, `paintWorking` and `stopRow` are the open chats' own (chat-ui.854d0793.js), so a chat stopped reads the
// same wherever it plays
export function mountLive({ app, sb, actions, stopped, paintWorking, stopRow }) {
  const chat = app.querySelector(':scope > .ch'), side = app.querySelector(':scope > .cc');
  const feed = chat.querySelector('.ch-feed'), feedIn = chat.querySelector('.ch-in');
  const acts = side.querySelector('.ac-list'), actsIn = side.querySelector('.ac-in');
  const drafts = new Map();
  let shown = LIVE, still = false, dressed = [];

  // what a held chat adds to the run as it stands: the messages sent in it, and its stop line
  const add = (parent, html) => { parent.insertAdjacentHTML('beforeend', html); dressed.push(parent.lastElementChild); };
  function undress() { for (const n of dressed) n.remove(); dressed = []; }
  function dress() {
    undress();
    for (const m of sentOf(shown)) add(feedIn, userBubble(m));
    if (stopped.has(shown)) add(actsIn, stopRow);
  }
  // the chat scrolls as the run plays (latest.bfdfd5c2.js), so it always takes focus, and held the Activity tab scrolls
  // and takes it too: the keyboard can scroll them
  Object.entries({ tabindex: '0', role: 'region', 'aria-label': 'Messages' }).forEach(([k, v]) => feed.setAttribute(k, v));
  function scrollable(on) {
    if (on) Object.entries({ tabindex: '0', role: 'region', 'aria-label': 'Activity' }).forEach(([k, v]) => acts.setAttribute(k, v));
    else ['tabindex', 'role', 'aria-label'].forEach((k) => acts.removeAttribute(k));
  }

  function hold() {
    dress();
    still = true;
    box.setPainted(false);
    scrollable(true);
    sb.dispatchEvent(new Event('spot-still'));
    // the suggestion the run had up is the field's
    box.setPlaceholder(chat.querySelector('.rc-hint').textContent);
  }
  function play() {
    undress();
    still = false;
    box.setPainted(true);
    scrollable(false);
    sb.dispatchEvent(new Event('spot-play'));
  }

  const box = wireComposer(chat.querySelector('.composer'), {
    actions,
    chat: () => ({ id: shown, title: titleOf(shown) }),
    onEngage: () => { if (!still) hold(); },
    onSend(msg) {
      addSent(shown, msg);
      // held, the chat stays where the viewer was (main.bdeb2397.js); what they send takes them to it at its foot
      if (!still) hold(); else add(feedIn, userBubble(msg));
      feed.scrollTop = feed.scrollHeight;
    },
  });
  box.setPainted(true);

  // Stop: a button where the creative drew one, superbot letting go of the chat until Resume
  const stop = Object.assign(document.createElement('button'), { type: 'button', className: 'cc-stop' });
  side.querySelector('.cc-frame span.cc-stop').replaceWith(stop);
  function paintStop() {
    const on = stopped.has(shown);
    stop.innerHTML = on ? `${ic('play', 'cc-stop-ic')}Resume` : '<i></i>Stop';
    stop.setAttribute('aria-label', on ? 'Resume ouroboro' : 'Stop ouroboro');
    app.classList.toggle('is-live-stopped', on);
  }
  stop.addEventListener('click', () => {
    if (stopped.delete(shown)) {
      // resumed: the run plays again from its start, unless it was written in, which opens as it stands
      if (sentOf(shown).length) hold(); else play();
    } else {
      stopped.add(shown);
      hold();
    }
    paintWorking(shown);
    paintStop();
    acts.scrollTop = acts.scrollHeight;
    stop.focus();
  });

  // another chat in the live view (main.bdeb2397.js has built its run, or kept the one playing): its draft, bell and
  // Stop, and as it stands if it was written in or stopped
  sb.addEventListener('spot-ask', (e) => {
    drafts.set(shown, box.draft());
    shown = e.detail.id ?? LIVE;
    box.reset(drafts.get(shown) ?? '');
    paintStop();
    if (sentOf(shown).length || stopped.has(shown)) hold();
    else if (still) play();
  });
  sb.addEventListener('sb-delete', (e) => drafts.delete(e.detail.id));

  paintStop();
  // the live chat written in before a reload opens as it stands
  if (sentOf(shown).length) hold();
}
