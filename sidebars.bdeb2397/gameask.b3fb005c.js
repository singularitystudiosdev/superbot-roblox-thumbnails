// What an automation started from the Automations tab asks once its prompt is sent. It docks above the live chat's
// composer, drawn as the composer is (style.af4c3c6b.css .rc) with its foot tucked under the composer's top edge: an
// app's logo and the question, then what answers it. A catalogue automation asks which game it runs on: the game on the
// Roblox account connected in Settings as one press, and a field for any other game's link. One the viewer published
// (published.6c0fd59e.js) asks its own questions one after another, each answered in a few words (a question about a
// game, from one filed under Roblox, offers the account's game too); the answers go into its prompt, and that prompt is
// the answer. Nothing is connected first: ouroboro works in the apps with computer control. The run waits at its
// question (S.gate, schedule.af4c3c6b.js) and says when it is there (spot-gate, main.bdeb2397.js); the answer goes back
// as spot-answer, and the run goes on with it as the user's next message. Only a Roblox game's link answers the
// catalogue's game question: its page (roblox.com/games/<id>, with or without its scheme, www or a language in the
// path) or its share link; anything else is named wrong under the field.
import { iconOf } from './automations.03378ba4.js';
import { ACCOUNT } from './chats.bdeb2397.js';
import { esc, asset } from './parts.bdeb2397.js';
import { state } from './store.854d0793.js';
import { automationById, questionsOf, appsOf, compose, GAME_LINK } from './published.6c0fd59e.js';

// the game on the connected Roblox account (settings-data.bdeb2397.js), the one the live chat works on
const OWN = { name: ACCOUNT.name, link: 'roblox.com/games/96168869671905/ROB-IT', img: ACCOUNT.avatar };
const NOT_A_GAME = `That isn't a Roblox game link. It looks like ${OWN.link}`;
const GAME_FIELD = 'Or paste a Roblox game link';
const SHUT_MS = 200; // the card folding away (.ga's transitions, automations.03378ba4.css)
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const fromHTML = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountGameAsk({ app, sb }) {
  const composer = app.querySelector(':scope > .ch > .composer');
  if (!composer) throw new Error("no live chat composer to dock the game question above: load main.bdeb2397.js first");
  const card = fromHTML(`<section class="ga" aria-labelledby="ga-q" hidden>
    <div class="ga-card"><div class="ga-in">
      <div class="ga-head"><img class="ga-logo" src="${asset(iconOf('roblox'))}" alt="" width="16" height="16" draggable="false"><h2 class="ga-q" id="ga-q"></h2><span class="ga-n" hidden></span></div>
      <button class="ga-opt ga-own" type="button"><img class="ga-thumb" src="${asset(OWN.img)}" alt="" width="768" height="432" draggable="false"><span class="ga-opt-t"><b>${esc(OWN.name)}</b><small>${esc(OWN.link)}</small></span></button>
      <form class="ga-form" novalidate>
        <input class="ga-field" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="${GAME_FIELD}" aria-label="Game link" aria-describedby="ga-err" aria-invalid="false">
        <button class="ga-go" type="submit" aria-label="Run it on this game" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg></button>
      </form>
      <p class="ga-err" id="ga-err" role="alert" hidden></p>
    </div></div>
  </section>`);
  composer.before(card);
  const [logo, question, count, own, form, field, go, err] = ['.ga-logo', '.ga-q', '.ga-n', '.ga-own', '.ga-form', '.ga-field', '.ga-go', '.ga-err'].map((s) => card.querySelector(s));
  let shutting = 0, back = null;
  // the automation asked about, its questions in order, the one on screen and the answers so far
  let current = null, asks = [], at = 0, answers = {};

  // a wrong answer is said under the field and marks it; typing clears it
  function say(text) {
    err.textContent = text;
    err.hidden = !text;
    field.setAttribute('aria-invalid', String(!!text));
  }
  function paintGo() {
    const on = !!field.value.trim();
    go.disabled = !on;
    go.classList.toggle('is-on', on);
  }

  function paintQuestion() {
    const q = asks[at], link = !!q.game;
    count.hidden = asks.length < 2;
    count.textContent = `${at + 1} of ${asks.length}`;
    say('');
    // the account's game is offered for the catalogue's game question, and for a published question about a game when
    // the automation is filed under Roblox, while its Roblox account is connected
    const offer = (link || (appsOf(current).includes('roblox') && /\bgames?\b/i.test(q.q))) && state.connections.roblox?.on;
    // a game question wears Roblox's logo; any other the app the automation's card wears
    logo.src = asset(iconOf(link || offer ? 'roblox' : current?.app ?? 'roblox'));
    question.textContent = q.q;
    own.hidden = !offer;
    field.type = link ? 'url' : 'text';
    field.inputMode = link ? 'url' : 'text';
    field.placeholder = link ? GAME_FIELD : offer ? 'Or type your answer' : 'Type your answer';
    field.setAttribute('aria-label', link ? 'Game link' : q.q);
    go.setAttribute('aria-label', at + 1 < asks.length ? 'Next question' : link && !current?.prompt ? 'Run it on this game' : 'Run it');
    field.value = '';
    paintGo();
  }

  function open(id) {
    current = automationById(id) ?? null;
    asks = questionsOf(current);
    at = 0;
    answers = {};
    // nothing to ask: its prompt goes as it is, once the frame that reached the question is drawn
    if (!asks.length) { queueMicrotask(answer); return; }
    paintQuestion();
    clearTimeout(shutting);
    card.hidden = false;
    void card.offsetHeight;
    card.classList.add('is-open');
    // it takes the focus when the viewer was on nothing else: the page, or the chat's row Try Me! focused
    const now = document.activeElement;
    if (!now || now === document.body || sb.contains(now)) {
      back = now;
      field.focus({ preventScroll: true });
    }
  }
  function close() {
    if (card.hidden) return;
    const had = card.contains(document.activeElement);
    card.classList.remove('is-open');
    clearTimeout(shutting);
    shutting = setTimeout(() => { card.hidden = true; }, REDUCED.matches ? 0 : SHUT_MS);
    if (had && back?.isConnected) back.focus({ preventScroll: true });
    back = null;
  }
  // the run goes on: a published automation's prompt with every answer in its place; a catalogue one's game
  function answer() {
    close();
    const text = current?.prompt ? compose(current, answers) : answers.game;
    sb.dispatchEvent(new CustomEvent('spot-answer', { detail: { game: text } }));
  }
  // a question answered: the next one, its field focused when the card had the focus (the option pressed may be gone)
  function next(value) {
    answers[asks[at].key] = value;
    if (++at >= asks.length) { answer(); return; }
    const had = card.contains(document.activeElement) || document.activeElement === document.body;
    paintQuestion();
    if (had) field.focus({ preventScroll: true });
  }

  own.addEventListener('click', () => next(OWN.link));
  field.addEventListener('input', () => { say(''); paintGo(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = field.value.trim(), q = asks[at];
    if (!value || !q) return;
    if (q.game && !GAME_LINK.test(value)) { say(NOT_A_GAME); field.focus(); return; }
    next(value);
  });
  // the spot's own keys (space, R, the arrows) are typing and pressing here
  card.addEventListener('keydown', (e) => e.stopPropagation());
  sb.addEventListener('spot-gate', (e) => { if (e.detail.open) open(e.detail.automation); else close(); });
}
