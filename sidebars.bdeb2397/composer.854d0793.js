// The composer, working: a field that grows as you write (Enter sends, Shift+Enter breaks the line), files and photos
// attached under +, the effort picker (a slider dragged or pressed to one of four stops), the chat's bell (its
// notifications, on until turned off; the browser is asked for permission when it is turned on, or at the first message
// sent in a chat it is on in; switching it says nothing unless the browser stands in the way), dictation on the mic and
// the send button, lit while there is something to send.
// It drives the creative's own composer markup (view.html .composer, style.af4c3c6b.css .rc-*): while a chat's run
// types into it (`setPainted`), the field lies over the run's lettering, and touching it hands the chat to the viewer
// (`onEngage`). Nothing is answered: a sent message is handed to `onSend`, and that is all.
import { esc, fx } from './parts.bdeb2397.js';
import { state, save, onChange, notifies, setNotifies } from './store.854d0793.js';
import { makePopover, itemHTML } from './popover.854d0793.js';
import { ic } from './icons.854d0793.js';
import { tierHTML } from './tier.8e7c682e.js';
import { mirrorRefs } from './automation-refs.3c255b31.js';

export const EFFORTS = [
  { id: 'low', label: 'Low', sub: 'Quick automations, fewest credits' },
  { id: 'medium', label: 'Medium', sub: 'Most everyday automations' },
  { id: 'high', label: 'High', sub: 'Harder automations, takes longer' },
  { id: 'max', label: 'Max', sub: 'The hardest automations, most credits' },
];
const effortOf = (id) => EFFORTS.find((e) => e.id === id) ?? EFFORTS[2];
const MAX_H = 160; // px the field grows to before it scrolls, in the app's px
const THUMB = 240; // px: the longer side a sent photo is kept at
const SAY_FOR = 5000; // ms a status line stays
const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
const fromHTML = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const sizeText = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`);

// a clean copy of the live chat's composer, for a chat view: no run's lettering, no caret, send off, and none of what
// wiring the live one (live.e61b4e86.js) added to it
export function cloneComposer(app) {
  const c = app.querySelector('.ch .composer').cloneNode(true);
  c.querySelectorAll('.rc-field, .rc-files, .rc-picker, .rc-status').forEach((n) => n.remove());
  c.classList.remove('is-working', 'is-painted');
  c.querySelector('.rc-send').disabled = false;
  c.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
  c.querySelector('.rc-typed').textContent = '';
  c.querySelector('.rc-caret').style.display = 'none';
  c.querySelector('.rc-send').classList.remove('is-on');
  return c;
}

// a photo kept small enough to save: its longer side THUMB px, as a JPEG
async function thumbOf(file) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, THUMB / Math.max(bmp.width, bmp.height));
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * k), height: Math.round(bmp.height * k) });
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

// ---------- the two popovers every composer shares ----------
const composers = new Set();
let effortMenu = null, effortSlider = null, plusMenu = null, current = null;
onChange((part) => {
  if (part === 'effort') { for (const c of composers) c.paintEffort(); effortSlider?.paint(); }
  if (part === 'muted') for (const c of composers) c.paintBell();
});

function menus(actions) {
  if (effortMenu) return;
  effortMenu = makePopover({ cls: 'pm-effort', role: 'dialog', label: 'Effort' });
  effortSlider = wireEffortSlider(effortMenu);
  plusMenu = makePopover({ cls: 'pm-plus', label: 'Add to your message' });
  // each in the sidebar's 3D icons (chats.bdeb2397.js FX), automations in the Automations row's own; files as a picture,
  // the 3D paperclip being a pale silver that reads as the grey line icons
  plusMenu.el.innerHTML = [
    itemHTML({ icon: fx('framed_picture'), label: 'Add photos and files', data: 'data-act="files"' }),
    itemHTML({ icon: fx('loop'), label: 'Start from an automation', data: 'data-act="automations"' }),
  ].join('');
  plusMenu.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    plusMenu.close(false);
    if (b.dataset.act === 'files') current.pickFiles();
    else actions[b.dataset.act]();
  });
}
// ---------- the effort picker: ChatGPT's thinking-effort slider, its thumb dragged or its track pressed to one of the
// four stops; the effort's name over it opens a row on each, picked with a press as in the menu it was ----------
const LAST = EFFORTS.length - 1;
const indexOf = (id) => EFFORTS.indexOf(effortOf(id));
// a small tick each time the effort moves a stop, from the vibration motor where the browser has one (Android). iOS
// Safari has none, but its switch (<input type="checkbox" switch>, Safari 17.4+) ticks when a tap toggles it, and since
// iOS 26.5 only a real tap does: there a clear label over the track and each row hands the tap on to a hidden switch,
// as tijnjh/ios-haptics does. A Mac's browsers have neither (Safari ticks the trackpad only while its own switch is dragged)
const TICK = 10; // ms
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
function tapTicks(el) {
  if (!IOS) return;
  const label = fromHTML('<label class="tap-tick" aria-hidden="true"><input type="checkbox" switch tabindex="-1"></label>');
  // the label's click goes on as the switch's own; that copy stops at the switch
  label.firstElementChild.addEventListener('click', (e) => e.stopPropagation());
  el.append(label);
}
function pickEffort(i) {
  const id = EFFORTS[Math.min(LAST, Math.max(0, i))].id;
  if (id === state.effort) return;
  state.effort = id;
  save('effort');
  navigator.vibrate?.(TICK);
}
const effortRows = () => EFFORTS.map((e) => itemHTML({ role: 'radio', checked: e.id === state.effort, label: esc(e.label), sub: esc(e.sub), trail: ic('check', 'sb-lu pm-check'), data: `data-effort="${e.id}"` })).join('');

function wireEffortSlider(menu) {
  menu.el.innerHTML = `<button class="pm-ef-head" type="button" aria-expanded="false"><span class="pm-ef-name"></span>${ic('chevronRight', 'sb-lu pm-ef-chev')}</button>
    <div class="pm-ef-track"><span class="pm-ef-fill"></span>${EFFORTS.map((e, i) => `<i class="pm-ef-stop" style="--i: ${i / LAST}"></i>`).join('')}<span class="pm-ef-thumb" role="slider" tabindex="0" aria-label="Effort" aria-valuemin="0" aria-valuemax="${LAST}"></span></div>
    <div class="pm-ef-list" role="radiogroup" aria-label="Efforts" hidden></div>`;
  const [head, name, track, thumb, list] = ['.pm-ef-head', '.pm-ef-name', '.pm-ef-track', '.pm-ef-thumb', '.pm-ef-list'].map((s) => menu.el.querySelector(s));
  const stops = [...track.querySelectorAll('.pm-ef-stop')];
  let dragging = null; // the pointer dragging the thumb, while one is
  tapTicks(track);

  // the thumb's centre `at` (0 to 1) along the track; the stops under the fill light up
  function place(at) {
    track.style.setProperty('--at', at);
    stops.forEach((s, i) => s.classList.toggle('is-in', i / LAST <= at + 1e-6));
  }
  // where along the track a pointer is: the thumb's centre runs from a radius in at one end to a radius in at the other
  function atOf(x) {
    const r = track.getBoundingClientRect(), half = thumb.getBoundingClientRect().width / 2;
    return Math.min(1, Math.max(0, (x - r.left - half) / (r.width - 2 * half)));
  }
  function drawRows() {
    list.innerHTML = effortRows();
    list.querySelectorAll('[data-effort]').forEach(tapTicks);
  }
  function paint() {
    const i = indexOf(state.effort), e = EFFORTS[i];
    name.textContent = e.label;
    thumb.setAttribute('aria-valuenow', String(i));
    thumb.setAttribute('aria-valuetext', `${e.label}: ${e.sub}`);
    // the rows kept, their check moved: a row's label must still be in the page when it hands on the tap that picked it
    if (!list.hidden) list.querySelectorAll('[data-effort]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.effort === state.effort)));
    if (dragging !== null) return;
    place(i / LAST);
    // the chip's name took its width with it: centred over the chip again, though never under a dragging pointer
    if (menu.isOpen()) menu.position();
  }
  function showList(on) {
    head.setAttribute('aria-expanded', String(on));
    list.hidden = !on;
    if (on) drawRows();
    else list.innerHTML = '';
  }

  // the thumb follows the pointer and the effort is the stop it is nearest; let go, it settles on that stop
  const follow = (e) => { const at = atOf(e.clientX); place(at); pickEffort(Math.round(at * LAST)); };
  track.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging = e.pointerId;
    // held by what was pressed, so the click after it lands there too (on iOS the label, handing the tap to its switch)
    e.target.setPointerCapture(e.pointerId);
    track.classList.add('is-dragging');
    thumb.focus();
    follow(e);
  });
  track.addEventListener('pointermove', (e) => { if (e.pointerId === dragging) follow(e); });
  const drop = (e) => { if (e.pointerId !== dragging) return; dragging = null; track.classList.remove('is-dragging'); paint(); };
  track.addEventListener('pointerup', drop);
  track.addEventListener('pointercancel', drop);
  thumb.addEventListener('keydown', (e) => {
    const i = indexOf(state.effort);
    const to = { ArrowLeft: i - 1, ArrowDown: i - 1, PageDown: i - 1, ArrowRight: i + 1, ArrowUp: i + 1, PageUp: i + 1, Home: 0, End: LAST }[e.key];
    if (to === undefined) return;
    // the popover's arrows move between its rows; on the slider they move the effort
    e.preventDefault();
    e.stopPropagation();
    pickEffort(to);
  });
  head.addEventListener('click', () => { showList(list.hidden); menu.position(); });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-effort]');
    if (!b) return;
    pickEffort(indexOf(b.dataset.effort));
    menu.close(true);
  });

  paint();
  // each time it opens: the slider alone, on the effort in force
  return { paint, reset: () => { showList(false); paint(); } };
}

// ---------- the bell's permission: the browser asks only on a press, and a send asks once a page; only a browser
// standing in the way is said ----------
const canAsk = () => 'Notification' in window && Notification.permission === 'default';
let askedOnSend = false;
const PERMISSION_SAY = {
  denied: 'Your browser blocks notifications here. Allow them in its site settings.',
  unsupported: 'This browser cannot show notifications.',
  failed: 'Your browser did not ask. Allow notifications in its site settings.',
};
async function askToNotify(title) {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    const perm = await Notification.requestPermission();
    // the first one, so the viewer sees what one looks like the moment they allow them
    if (perm === 'granted') new Notification('ouroboro', { body: `Notifications are on for ${title ? `“${title}”` : 'this chat'}.` });
    return perm;
  } catch (e) {
    console.error(new Error('the notification permission request failed', { cause: e }));
    return 'failed';
  }
}

// `actions` opens the Automations tab and Settings' Connections for the + menu; `chat` is the chat it writes in
// ({ id, title }), or nothing while a new chat has no message yet
export function wireComposer(root, { onSend, onEngage = () => {}, actions, chat = () => null }) {
  menus(actions);
  root.removeAttribute('inert');
  root.removeAttribute('aria-hidden');
  root.classList.add('is-working');
  const rc = root.querySelector('.rc'), ph = rc.querySelector('.rc-ph');
  const [plus, effort, bell, mic, send] = ['.rc-plus', '.rc-effort', '.rc-bell', '.rc-mic', '.rc-send'].map((s) => rc.querySelector(s));
  // the run's lettering is a picture of typing; the field is what a screen reader and the keyboard use
  ph.setAttribute('aria-hidden', 'true');
  const field = fromHTML('<textarea class="rc-input" rows="1" aria-label="Message ouroboro" autocomplete="off"></textarea>');
  // the field in a cell of its own, shared with the copy that draws a library automation's name in it as a link
  const cell = fromHTML('<div class="rc-field"></div>');
  cell.append(field);
  const refs = mirrorRefs(field);
  const files = fromHTML('<ul class="rc-files" aria-label="Attached files" hidden></ul>');
  const picker = fromHTML('<input class="rc-picker" type="file" multiple hidden>');
  const status = fromHTML('<p class="rc-status" role="status"></p>');
  // the effort's tier in place of the creative's gauge (tier.8e7c682e.js), new each time, as a chat view's composer is a
  // copy of the live chat's
  const tier = fromHTML(tierHTML(state.effort, 'rc-effort-ic'));
  effort.querySelector('.rc-effort-ic').replaceWith(tier);
  ph.after(cell);
  rc.prepend(files);
  rc.append(picker);
  root.append(status);

  let pending = [], rec = null, sayTimer = 0;
  const say = (text) => { clearTimeout(sayTimer); status.textContent = text; if (text) sayTimer = setTimeout(() => { status.textContent = ''; }, SAY_FOR); };
  const canSend = () => !!field.value.trim() || pending.length > 0;
  const paintSend = () => { const on = canSend(); send.classList.toggle('is-on', on); send.disabled = !on; };
  // every change to the field's text comes through here: its height, and the automation names in it drawn as links
  const grow = () => { field.style.height = 'auto'; field.style.height = `${Math.min(field.scrollHeight, MAX_H)}px`; refs.paint(); };
  function paintFiles() {
    files.hidden = !pending.length;
    files.innerHTML = pending.map((f, i) => `<li class="rc-file">${f.thumb ? `<img src="${f.thumb}" alt="" width="28" height="28">` : ic('file', 'sb-lu rc-file-ic')}<span class="rc-file-t"><b>${esc(f.name)}</b><small>${esc(sizeText(f.size))}</small></span><button class="rc-file-x" type="button" data-i="${i}" aria-label="Remove ${esc(f.name)}">${ic('x')}</button></li>`).join('');
    paintSend();
  }
  function paintEffort() {
    const e = effortOf(state.effort);
    tier.setAttribute('tier', e.id);
    effort.querySelector('.rc-effort-t').textContent = e.label;
    effort.setAttribute('aria-label', `Effort: ${e.label}`);
  }

  // a chat with no message yet keeps its bell here until the first message makes it a chat
  let freshOn = true;
  const chatId = () => chat()?.id ?? null;
  const notifyOn = () => (chatId() ? notifies(chatId()) : freshOn);
  function paintBell() {
    const on = notifyOn();
    bell.classList.toggle('is-off', !on);
    bell.setAttribute('aria-pressed', String(on));
    bell.innerHTML = ic(on ? 'bell' : 'bellOff', 'rc-bell-ic');
  }
  const sayPermission = (perm) => { if (PERMISSION_SAY[perm]) say(PERMISSION_SAY[perm]); };
  async function toggleBell() {
    const on = !notifyOn();
    if (chatId()) setNotifies(chatId(), on);
    else { freshOn = on; paintBell(); }
    say('');
    if (on) sayPermission(await askToNotify(chat()?.title));
  }

  function submit() {
    if (!canSend()) return;
    rec?.stop();
    const msg = { u: field.value.trim(), files: pending, at: Date.now() };
    const wasFresh = !chatId();
    pending = [];
    field.value = '';
    grow();
    paintFiles();
    onSend(msg);
    // the message made it a chat: a bell turned off before then stays off
    if (wasFresh && chatId() && !freshOn) setNotifies(chatId(), false);
    if (notifyOn() && canAsk() && !askedOnSend) {
      askedOnSend = true;
      askToNotify(chat()?.title).then(sayPermission);
    }
    field.focus();
  }

  async function addFiles(list) {
    onEngage();
    for (const file of list) {
      let thumb = '';
      if (file.type.startsWith('image/')) {
        try { thumb = await thumbOf(file); } catch (e) { console.error(new Error(`no preview for ${file.name}`, { cause: e })); }
      }
      pending.push({ name: file.name, size: file.size, type: file.type, thumb });
    }
    paintFiles();
    say(`${list.length} ${list.length === 1 ? 'file' : 'files'} attached.`);
    field.focus();
  }

  function dictate() {
    if (rec) { rec.stop(); return; }
    if (!Recognition) { say('Dictation needs a browser with speech input, like Chrome or Safari.'); return; }
    onEngage();
    const base = field.value.trim() ? `${field.value.trimEnd()} ` : '';
    rec = new Recognition();
    Object.assign(rec, { continuous: true, interimResults: true, lang: navigator.language || 'en-US' });
    rec.onresult = (e) => { field.value = base + [...e.results].map((r) => r[0].transcript).join(''); grow(); paintSend(); };
    rec.onerror = (e) => {
      console.error(new Error(`dictation stopped: ${e.error}`));
      say(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Allow the microphone for this page to dictate.' : 'Dictation stopped. Press the mic to try again.');
    };
    rec.onend = () => { rec = null; mic.classList.remove('is-rec'); mic.setAttribute('aria-pressed', 'false'); mic.setAttribute('aria-label', 'Dictate'); };
    try {
      rec.start();
    } catch (e) {
      console.error(new Error('dictation did not start', { cause: e }));
      rec = null;
      say('Dictation did not start. Press the mic to try again.');
      return;
    }
    mic.classList.add('is-rec');
    mic.setAttribute('aria-pressed', 'true');
    mic.setAttribute('aria-label', 'Stop dictating');
    say('Listening. Press the mic again to stop.');
    field.focus();
  }

  const api = {
    root, say, paintEffort, paintBell,
    pickFiles: () => picker.click(),
    focus: () => field.focus(),
    // while a run types into the composer, its lettering shows and the field lies over it, clear
    setPainted(on) { root.classList.toggle('is-painted', on); if (!on) paintSend(); },
    setPlaceholder(text) { field.placeholder = text; },
    // a chat's own draft back when it opens again; its files stay with the chat they were picked in
    draft: () => field.value,
    reset(text = '') { rec?.stop(); field.value = text; pending = []; freshOn = true; grow(); paintFiles(); paintBell(); say(''); },
    fill(text) { field.value = text; grow(); paintSend(); field.focus(); field.setSelectionRange(text.length, text.length); },
  };

  field.addEventListener('focus', () => onEngage());
  field.addEventListener('input', () => { grow(); paintSend(); });
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
  });
  send.addEventListener('click', submit);
  bell.addEventListener('click', toggleBell);
  mic.addEventListener('click', dictate);
  picker.addEventListener('change', () => { const list = [...picker.files]; picker.value = ''; if (list.length) addFiles(list); });
  files.addEventListener('click', (e) => {
    const x = e.target.closest('.rc-file-x');
    if (!x) return;
    const [gone] = pending.splice(Number(x.dataset.i), 1);
    paintFiles();
    say(`Removed ${gone.name}.`);
    field.focus();
  });
  // right above the chip, centred on it, clear of the fill round it (chat-ui.854d0793.css .rc-effort, --sp-4)
  effort.addEventListener('click', () => { if (effortMenu.open(effort, 'above-center', { focus: '.pm-ef-thumb', ring: 4 })) { effortSlider.reset(); effortMenu.position(); } });
  plus.addEventListener('click', () => { current = api; plusMenu.open(plus, 'above-start'); });
  // a press on the field's row (not a button or a link) puts the caret in the field, as the box reads as one field
  rc.addEventListener('pointerdown', (e) => { if (!e.target.closest('button, a, textarea, .rc-files')) { e.preventDefault(); field.focus(); } });
  // the spot's keys (space, R, the arrows) are typing and button presses here, never the spot's
  root.addEventListener('keydown', (e) => e.stopPropagation());

  paintEffort();
  paintBell();
  paintFiles();
  composers.add(api);
  return api;
}
