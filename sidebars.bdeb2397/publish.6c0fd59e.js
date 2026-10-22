// Publish: one page that puts an automation in the Automations tab (published.6c0fd59e.js), filled in any order. Its
// thumbnail (any picture, cut to 16:9; without one its card shows its app's mark), title and description as its card
// shows them; its System Prompt beside its Questions: a question is typed in, and its answer is dragged into the prompt
// or clicked to land at the caret, where it shows as a chip with the question on it (an answer placed nowhere goes at
// the prompt's end); and its categories, the tab's apps it is filed under (nothing to connect: ouroboro works in them
// with computer control). Only a title and a prompt are needed to publish, and once
// published an automation is not edited. Everything is kept as a draft as it is written (store.854d0793.js `drafts`):
// closed and opened again, even after a reload, it is as it was left, until it is published or cleared (Clear, with an
// undo). Opened from the tab's Publish and from Settings' My Automations (over Settings), drawn at the sidebar's
// on-screen scale (--k) as Settings is.
import { esc, lu, fx, asset } from './parts.bdeb2397.js';
import { ic } from './icons.854d0793.js';
import { scaleOf } from './popover.854d0793.js';
import { ALL_APPS, iconOf } from './automations.03378ba4.js';
import { state, save } from './store.854d0793.js';
import { SLOT, publish, appFor, inOrder } from './published.6c0fd59e.js';

const THUMB_W = 768, THUMB_H = 432; // px: a thumbnail is kept at the size the catalogue's are made at
const LIMITS = { title: 60, desc: 200, q: 140 };
const KEEP_MS = 400; // a draft is kept this long after the last change
const UNDO_MS = 6000; // an undo is offered this long
const REF_CHARS = 32; // a chip in the prompt shows this much of its question
const DRAFT = 'new'; // the key the draft is kept under
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
// lucide (https://lucide.dev, ISC): grip-vertical, the handle an answer is dragged by, and undo-2
const GRIP = '<svg class="pb-lu pb-grip" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>';
export const UNDO = '<svg class="pb-lu" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>';
const fromHTML = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const blank = () => ({ thumb: '', title: '', desc: '', prompt: '', questions: [], apps: [] });
const label = (q, i) => (q.q.trim() || `Question ${i + 1}`);
const short = (text) => (text.length > REF_CHARS ? `${text.slice(0, REF_CHARS - 1).trimEnd()}…` : text);

async function cutThumb(file) {
  const bmp = await createImageBitmap(file);
  const k = Math.max(THUMB_W / bmp.width, THUMB_H / bmp.height), sw = THUMB_W / k, sh = THUMB_H / k;
  const canvas = Object.assign(document.createElement('canvas'), { width: THUMB_W, height: THUMB_H });
  canvas.getContext('2d').drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, THUMB_W, THUMB_H);
  bmp.close();
  return canvas.toDataURL('image/jpeg', 0.86);
}
// published without a picture: its app's own mark in the middle of the ground, as a thumbnail
async function markThumb(app) {
  const img = new Image();
  img.src = asset(iconOf(app));
  await img.decode();
  const canvas = Object.assign(document.createElement('canvas'), { width: THUMB_W, height: THUMB_H });
  const g = canvas.getContext('2d'), side = 112;
  g.fillStyle = getComputedStyle(document.body).getPropertyValue('--ground').trim() || '#f2f2f7';
  g.fillRect(0, 0, THUMB_W, THUMB_H);
  g.drawImage(img, (THUMB_W - side) / 2, (THUMB_H - side) / 2, side, side);
  return canvas.toDataURL('image/jpeg', 0.9);
}

const dialogHTML = () => `<dialog class="pb" aria-labelledby="pb-h">
  <header class="pb-top">
    ${fx('rocket', 'pb-top-ic')}<h2 class="pb-h" id="pb-h">Publish an automation</h2>
    <span class="pb-saved" aria-hidden="true">${ic('check', 'pb-lu')}Draft saved</span>
    <button class="pb-x" type="button" aria-label="Close. Your draft is kept">${lu('x', 'pb-lu')}</button>
  </header>
  <div class="pb-body">
    <section class="pb-details" aria-label="Its card">
      <div class="pb-pic">
        <button class="pb-drop" type="button" aria-label="Thumbnail: upload a picture or drop one here" aria-describedby="pb-thumb-d"><img class="pb-thumb" alt="" width="768" height="432" hidden><span class="pb-drop-t">${fx('framed_picture', 'pb-drop-ic')}<b>Add a thumbnail</b><small>or drop a picture</small></span><span class="pb-swap">${lu('camera', 'pb-lu')}Change</span></button>
        <button class="pb-unthumb" type="button" aria-label="Remove the thumbnail" hidden>${lu('trash', 'pb-lu')}</button>
        <p class="pb-vh" id="pb-thumb-d">Any picture, cut to 16:9. Without one its card shows its app.</p>
        <input class="pb-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
      </div>
      <div class="pb-meta">
        <label class="pb-field"><span class="pb-l">${fx('label', 'pb-ic')}Title</span><input name="title" maxlength="${LIMITS.title}" autocomplete="off" placeholder="Roblox Update Log Poster" aria-invalid="false"></label>
        <label class="pb-field pb-grow"><span class="pb-l">${fx('memo', 'pb-ic')}Description</span><textarea name="desc" maxlength="${LIMITS.desc}" placeholder="What it does for whoever starts it"></textarea></label>
      </div>
    </section>
    <div class="pb-work">
      <section class="pb-col pb-prompt" aria-labelledby="pb-prompt-l">
        <p class="pb-l" id="pb-prompt-l">${fx('robot', 'pb-ic')}System Prompt</p>
        <div class="pb-editor is-empty" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="pb-prompt-l" aria-describedby="pb-qs-d" aria-invalid="false" spellcheck="true" data-placeholder="Tell ouroboro what to do each time it runs, like: Every time I publish an update, write the update log and post it in my Discord."></div>
      </section>
      <section class="pb-col pb-ask" aria-labelledby="pb-qs-l">
        <p class="pb-l" id="pb-qs-l">${fx('red_question_mark','pb-ic')}Questions</p>
        <p class="pb-hint" id="pb-qs-d">Asked when someone starts it. Drag an answer into the prompt, or click it to put it at your cursor. One you don't place goes at the end.</p>
        <ol class="pb-qs"></ol>
        <div class="pb-add">
          <input class="pb-add-in" maxlength="${LIMITS.q}" autocomplete="off" placeholder="Type a question, like Which game?" aria-label="New question">
          <button class="pb-add-go" type="button" aria-label="Add the question" disabled>${lu('plus', 'pb-lu')}</button>
        </div>
      </section>
    </div>
    <section class="pb-conn" aria-labelledby="pb-apps-l">
      <p class="pb-l" id="pb-apps-l">${fx('card_index_dividers', 'pb-ic')}Categories<span class="pb-hint">Where it shows in the Automations tab. Its card wears the first.</span></p>
      <ul class="pb-apps">${Object.entries(ALL_APPS).map(([id, a]) => `<li><label class="pb-app"><input type="checkbox" name="apps" value="${id}"><img class="pb-mark" src="${asset(iconOf(id))}" alt="" width="20" height="20" draggable="false"><span class="pb-app-n">${esc(a.name)}</span><span class="pb-check" aria-hidden="true">${ic('check', 'pb-lu')}</span></label></li>`).join('')}</ul>
    </section>
  </div>
  <p class="pb-error" role="alert" hidden></p>
  <footer class="pb-foot">
    <button class="sb-btn-ghost pb-clear" type="button">${fx('wastebasket', 'pb-btn-ic')}<span>Clear</span></button>
    <p class="pb-undo" aria-live="polite"><span class="pb-undo-t"></span><button class="pb-undo-go" type="button" hidden>${UNDO}Undo</button></p>
    <button class="sb-btn-primary pb-go" type="button">${fx('rocket', 'pb-btn-ic')}<span>Publish</span></button>
  </footer>
</dialog>`;

const questionHTML = (q, i, used) => `<li class="pb-q${used ? ' is-used' : ''}" data-key="${q.key}">
  <button class="pb-ref-src" type="button" draggable="true" aria-label="Put the answer to question ${i + 1} at your cursor in the prompt" title="Drag into the prompt, or click to put it at your cursor">${GRIP}${fx('red_question_mark','pb-ref-ic')}<span>${used ? 'Placed' : 'Answer'}</span></button>
  <input class="pb-q-text" maxlength="${LIMITS.q}" autocomplete="off" value="${esc(q.q)}" placeholder="Write the question" aria-label="Question ${i + 1}">
  <button class="pb-q-del" type="button" aria-label="Remove question ${i + 1}">${lu('x', 'pb-lu')}</button>
</li>`;
const chipHTML = (q, i) => `<span class="pb-ref" contenteditable="false" draggable="true" data-key="${q.key}" title="${esc(label(q, i))}">${fx('red_question_mark','pb-ref-ic')}<span class="pb-ref-t">${esc(short(label(q, i)))}</span></span>`;

let dlg = null, ui = null;
// the draft on the page
let draft = blank(), opener = null, done = null;
let keepTimer = 0, undoTimer = 0, undoFn = null, lastRange = null, dragged = null;

// ---------- the prompt: text, line breaks and answer chips, kept as text with {{key}} where each chip is ----------
function promptText() {
  const walk = (node) => {
    let out = '';
    for (const n of node.childNodes) {
      if (n.nodeType === Node.TEXT_NODE) out += n.data;
      else if (n.classList?.contains('pb-ref')) out += `{{${n.dataset.key}}}`;
      else if (n.nodeName === 'BR') out += '\n';
      else if (n.nodeName === 'DIV' || n.nodeName === 'P') out += `${out && !out.endsWith('\n') ? '\n' : ''}${walk(n)}`;
      else out += walk(n);
    }
    return out;
  };
  // the editor's own last line break, there for the caret, is not the prompt's
  return walk(ui.ed).replace(/\n$/, '');
}
function renderPrompt(text) {
  const keys = new Map(draft.questions.map((q, i) => [q.key, i]));
  const html = [];
  let last = 0;
  const textHTML = (s) => esc(s).replace(/\n/g, '<br>');
  for (const m of text.matchAll(SLOT)) {
    if (!keys.has(m[1])) continue;
    html.push(textHTML(text.slice(last, m.index)), chipHTML(draft.questions[keys.get(m[1])], keys.get(m[1])));
    last = m.index + m[0].length;
  }
  html.push(textHTML(text.slice(last)));
  ui.ed.innerHTML = `${html.join('')}${text.endsWith('\n') ? '<br>' : ''}`;
  paintEmpty();
}
const paintEmpty = () => ui.ed.classList.toggle('is-empty', !ui.ed.textContent.trim() && !ui.ed.querySelector('.pb-ref'));
// where the caret would land under the pointer, inside the editor and never inside a chip
function rangeAt(x, y) {
  let r = null;
  if (document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(x, y);
    if (p) { r = document.createRange(); r.setStart(p.offsetNode, p.offset); }
  } else r = document.caretRangeFromPoint?.(x, y) ?? null;
  if (!r || !ui.ed.contains(r.startContainer)) return endRange();
  const chip = r.startContainer.parentElement?.closest('.pb-ref');
  if (chip) r.setStartAfter(chip);
  r.collapse(true);
  return r;
}
function endRange() {
  const r = document.createRange();
  r.selectNodeContents(ui.ed);
  // before the editor's own last line break, if it ends with one
  if (ui.ed.lastChild?.nodeName === 'BR') r.setEndBefore(ui.ed.lastChild);
  r.collapse(false);
  return r;
}
function place(r) {
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}
// an answer chip put where `r` is (replacing what it selects), a space either side where words would touch, the caret
// after it
function insertChip(k, r) {
  const i = draft.questions.findIndex((q) => q.key === k);
  if (i < 0) return;
  const chip = fromHTML(chipHTML(draft.questions[i], i));
  r.deleteContents();
  r.insertNode(chip);
  const before = chip.previousSibling, after = chip.nextSibling;
  if (before?.nodeType === Node.TEXT_NODE && /\S$/.test(before.data)) before.data += ' ';
  if (!(after?.nodeType === Node.TEXT_NODE && /^\s/.test(after.data))) chip.after(document.createTextNode(' '));
  const caret = document.createRange();
  caret.setStart(chip.nextSibling, 1);
  caret.collapse(true);
  ui.ed.focus({ preventScroll: true });
  place(caret);
  lastRange = caret.cloneRange();
  chip.classList.add('is-new');
  setTimeout(() => chip.classList.remove('is-new'), 400);
  changed();
}

// ---------- the questions ----------
function renderQuestions({ enter = null } = {}) {
  const used = new Set([...ui.ed.querySelectorAll('.pb-ref')].map((c) => c.dataset.key));
  // a question being written keeps its focus as the list is drawn again
  const at = document.activeElement?.closest?.('.pb-q');
  const keep = at && { key: at.dataset.key, cls: document.activeElement.classList[0] };
  ui.qs.innerHTML = draft.questions.map((q, i) => questionHTML(q, i, used.has(q.key))).join('');
  if (enter) ui.qs.querySelector(`[data-key="${enter}"]`)?.classList.add('is-entering');
  if (keep) ui.qs.querySelector(`[data-key="${keep.key}"] .${keep.cls}`)?.focus();
}
// which answers are placed, as chips come and go in the prompt
function paintUsed() {
  const used = new Set([...ui.ed.querySelectorAll('.pb-ref')].map((c) => c.dataset.key));
  for (const li of ui.qs.querySelectorAll('.pb-q')) {
    const on = used.has(li.dataset.key);
    li.classList.toggle('is-used', on);
    li.querySelector('.pb-ref-src span').textContent = on ? 'Placed' : 'Answer';
  }
}
const nextKey = () => { let n = 1; while (draft.questions.some((q) => q.key === `q${n}`)) n++; return `q${n}`; };

// ---------- keeping the draft ----------
function changed() {
  draft.prompt = promptText();
  paintEmpty();
  paintUsed();
  paintClear();
  clearTimeout(keepTimer);
  keepTimer = setTimeout(keep, KEEP_MS);
}
function keep() {
  clearTimeout(keepTimer);
  keepTimer = 0;
  state.drafts[DRAFT] = structuredClone(draft);
  save('drafts');
  const saved = dlg.querySelector('.pb-saved');
  saved.classList.remove('is-on');
  void saved.offsetWidth;
  saved.classList.add('is-on');
}
function paintClear() {
  ui.clear.disabled = !draft.thumb && !draft.title && !draft.desc && !draft.prompt.trim() && !draft.questions.length && !draft.apps.length;
}
function offerUndo(text, fn) {
  clearTimeout(undoTimer);
  undoFn = fn;
  ui.undoT.textContent = text;
  ui.undoGo.hidden = !fn;
  ui.undo.classList.add('is-on');
  undoTimer = setTimeout(() => { ui.undo.classList.remove('is-on'); undoFn = null; }, UNDO_MS);
}
// a step taken back: the draft as it was, kept again
function takeBack(was) {
  draft = was;
  fill();
  keep();
}

// ---------- drawing the whole draft ----------
function paintThumb() {
  ui.img.hidden = !draft.thumb;
  if (draft.thumb) ui.img.src = draft.thumb.startsWith('data:') ? draft.thumb : asset(draft.thumb);
  ui.drop.classList.toggle('has-thumb', !!draft.thumb);
  ui.unthumb.hidden = !draft.thumb;
}
function fill() {
  ui.title.value = draft.title;
  ui.desc.value = draft.desc;
  paintThumb();
  renderPrompt(draft.prompt);
  renderQuestions();
  for (const box of dlg.querySelectorAll('[name="apps"]')) box.checked = draft.apps.includes(box.value);
  fail('');
  paintClear();
}

const fail = (text, el) => {
  ui.err.textContent = text;
  ui.err.hidden = !text;
  for (const f of [ui.title, ui.ed]) f.setAttribute('aria-invalid', String(f === el));
  if (el) { el.scrollIntoView({ block: 'nearest', behavior: REDUCED.matches ? 'auto' : 'smooth' }); el.focus({ preventScroll: true }); }
};

function build() {
  dlg = fromHTML(dialogHTML());
  document.body.append(dlg);
  const $ = (s) => dlg.querySelector(s);
  ui = {
    drop: $('.pb-drop'), img: $('.pb-thumb'), file: $('.pb-file'), unthumb: $('.pb-unthumb'), title: $('[name="title"]'), desc: $('[name="desc"]'),
    ed: $('.pb-editor'), qs: $('.pb-qs'), addIn: $('.pb-add-in'), addGo: $('.pb-add-go'), err: $('.pb-error'), clear: $('.pb-clear'), go: $('.pb-go'),
    undo: $('.pb-undo'), undoT: $('.pb-undo-t'), undoGo: $('.pb-undo-go'),
  };

  // ---------- the card: thumbnail, title, description ----------
  async function takePicture(f) {
    if (!f) return;
    try {
      draft.thumb = await cutThumb(f);
      paintThumb();
      changed();
    } catch (e) {
      console.error(new Error(`the picture ${f.name} could not be read`, { cause: e }));
      fail('That file could not be read as a picture. Try a JPG or PNG.');
    }
  }
  ui.drop.addEventListener('click', () => ui.file.click());
  ui.file.addEventListener('change', () => { const f = ui.file.files[0]; ui.file.value = ''; takePicture(f); });
  ui.drop.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); ui.drop.classList.add('is-over'); } });
  ui.drop.addEventListener('dragleave', () => ui.drop.classList.remove('is-over'));
  ui.drop.addEventListener('drop', (e) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    ui.drop.classList.remove('is-over');
    takePicture([...e.dataTransfer.files].find((f) => f.type.startsWith('image/')));
  });
  ui.unthumb.addEventListener('click', () => {
    const was = structuredClone(draft);
    draft.thumb = '';
    paintThumb();
    changed();
    ui.drop.focus();
    offerUndo('Thumbnail removed.', () => takeBack(was));
  });
  for (const f of [ui.title, ui.desc]) f.addEventListener('input', () => { draft[f.name] = f.value; fail(''); changed(); });

  // ---------- the prompt ----------
  const ed = ui.ed;
  ed.addEventListener('input', () => { fail(''); changed(); });
  // a line break, not a new block, so the prompt stays plain text with line breaks
  ed.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); document.execCommand('insertLineBreak'); } });
  ed.addEventListener('paste', (e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); });
  // where an answer clicked in a question lands: the caret's last place in the prompt
  document.addEventListener('selectionchange', () => {
    const sel = getSelection();
    if (sel.rangeCount && ed.contains(sel.anchorNode)) lastRange = sel.getRangeAt(0).cloneRange();
  });
  // an answer dragged in from its question (or a chip moved within the prompt) lands where the caret shows under the
  // pointer
  const isRef = (e) => e.dataTransfer.types.includes('text/x-pb-ref');
  ed.addEventListener('dragover', (e) => {
    if (!isRef(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = dragged ? 'move' : 'copy';
    ed.classList.add('is-drop');
    ed.focus({ preventScroll: true });
    place(rangeAt(e.clientX, e.clientY));
  });
  ed.addEventListener('dragleave', (e) => { if (!ed.contains(e.relatedTarget)) ed.classList.remove('is-drop'); });
  ed.addEventListener('drop', (e) => {
    if (!isRef(e)) return;
    e.preventDefault();
    ed.classList.remove('is-drop');
    const r = rangeAt(e.clientX, e.clientY);
    dragged?.remove();
    insertChip(e.dataTransfer.getData('text/x-pb-ref'), r);
  });
  ed.addEventListener('dragstart', (e) => {
    const chip = e.target.closest?.('.pb-ref');
    if (!chip) return;
    dragged = chip;
    e.dataTransfer.setData('text/x-pb-ref', chip.dataset.key);
    e.dataTransfer.effectAllowed = 'move';
  });

  // ---------- the questions ----------
  const addQuestion = () => {
    const q = ui.addIn.value.trim();
    if (!q) return;
    const k = nextKey();
    draft.questions.push({ key: k, q });
    ui.addIn.value = '';
    ui.addGo.disabled = true;
    renderQuestions({ enter: k });
    changed();
  };
  ui.addIn.addEventListener('input', () => { ui.addGo.disabled = !ui.addIn.value.trim(); });
  ui.addIn.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); addQuestion(); } });
  ui.addGo.addEventListener('click', () => { addQuestion(); ui.addIn.focus(); });
  ui.qs.addEventListener('input', (e) => {
    const li = e.target.closest('.pb-q'), q = draft.questions.find((x) => x.key === li?.dataset.key);
    if (!q || !e.target.matches('.pb-q-text')) return;
    q.q = e.target.value;
    // its chips in the prompt read as it does
    const i = draft.questions.indexOf(q);
    for (const chip of ed.querySelectorAll(`.pb-ref[data-key="${q.key}"]`)) {
      chip.title = label(q, i);
      chip.querySelector('.pb-ref-t').textContent = short(label(q, i));
    }
    changed();
  });
  ui.qs.addEventListener('click', (e) => {
    const li = e.target.closest('.pb-q');
    if (!li) return;
    const k = li.dataset.key;
    if (e.target.closest('.pb-ref-src')) {
      insertChip(k, lastRange && ed.contains(lastRange.startContainer) ? lastRange : endRange());
      return;
    }
    if (!e.target.closest('.pb-q-del')) return;
    // a question removed takes its answer's chips out of the prompt with it, and can be taken back
    const was = structuredClone(draft);
    draft.questions = draft.questions.filter((q) => q.key !== k);
    for (const chip of ed.querySelectorAll(`.pb-ref[data-key="${k}"]`)) chip.remove();
    li.classList.add('is-leaving');
    setTimeout(() => { renderQuestions(); (ui.qs.querySelector('.pb-q-del') ?? ui.addIn).focus(); }, REDUCED.matches ? 0 : 160);
    changed();
    offerUndo('Question removed.', () => takeBack(was));
  });
  ui.qs.addEventListener('dragstart', (e) => {
    const src = e.target.closest?.('.pb-ref-src');
    if (!src) return;
    dragged = null;
    e.dataTransfer.setData('text/x-pb-ref', src.closest('.pb-q').dataset.key);
    e.dataTransfer.setData('text/plain', src.closest('.pb-q').querySelector('.pb-q-text').value);
    e.dataTransfer.effectAllowed = 'copyMove';
    ed.classList.add('is-target');
  });
  dlg.addEventListener('dragend', () => { dragged = null; ed.classList.remove('is-target', 'is-drop'); });

  // ---------- its categories ----------
  dlg.querySelector('.pb-apps').addEventListener('change', (e) => {
    const id = e.target.value;
    draft.apps = e.target.checked ? [...new Set([...draft.apps, id])] : draft.apps.filter((n) => n !== id);
    changed();
  });

  // ---------- clearing, publishing, closing ----------
  ui.clear.addEventListener('click', () => {
    const was = structuredClone(draft);
    clearTimeout(keepTimer);
    keepTimer = 0;
    delete state.drafts[DRAFT];
    save('drafts');
    draft = blank();
    fill();
    offerUndo('Draft cleared.', () => takeBack(was));
  });
  ui.undoGo.addEventListener('click', () => {
    const fn = undoFn;
    clearTimeout(undoTimer);
    ui.undo.classList.remove('is-on');
    undoFn = null;
    fn?.();
  });
  ui.go.addEventListener('click', async () => {
    draft.prompt = promptText();
    if (!draft.title.trim()) return fail('Give it a title. It is the name on its card.', ui.title);
    if (!draft.prompt.trim()) return fail('Write the system prompt ouroboro runs.', ui.ed);
    // a question left unwritten is dropped, its chips with it
    const asked = draft.questions.filter((q) => q.q.trim()), gone = new Set(draft.questions.filter((q) => !q.q.trim()).map((q) => q.key));
    const prompt = draft.prompt.replace(SLOT, (all, k) => (gone.has(k) ? '' : all)).replace(/[ \t]{2,}/g, ' ').trim();
    ui.go.disabled = true;
    try {
      const thumb = draft.thumb || await markThumb(appFor(inOrder(draft.apps)));
      const a = publish({ ...draft, title: draft.title.trim(), desc: draft.desc.trim(), prompt, questions: asked.map((q) => ({ key: q.key, q: q.q.trim() })), thumb });
      // published: the draft starts again from nothing
      clearTimeout(keepTimer);
      keepTimer = 0;
      delete state.drafts[DRAFT];
      save('drafts');
      dlg.close();
      done?.(a);
    } catch (e) {
      console.error(new Error('the automation was not published', { cause: e }));
      fail('It could not be published. Try again.');
    } finally {
      ui.go.disabled = false;
    }
  });
  dlg.querySelector('.pb-x').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  // its keys stay in it: space and R type into its fields rather than reaching the spot, Escape closes only it
  dlg.addEventListener('keydown', (e) => e.stopPropagation());
  // closed with a change not yet kept: kept now. The close event comes a beat after closing: a focus taken in between
  // (the published card's, by onDone) stays
  dlg.addEventListener('close', () => {
    if (keepTimer) keep();
    clearTimeout(undoTimer);
    ui.undo.classList.remove('is-on');
    const lost = document.activeElement === document.body || dlg.contains(document.activeElement);
    if (lost && opener?.isConnected) opener.focus();
  });
}

// `sb` sets the scale it is drawn at; `onDone(a)` hears what was published
export function openPublish({ sb, onDone = null } = {}) {
  if (!dlg) build();
  draft = structuredClone(state.drafts[DRAFT] ?? blank());
  // a draft kept when its apps were connections: they are its categories now
  draft.apps ??= draft.needs ?? [];
  delete draft.needs;
  done = onDone;
  opener = document.activeElement;
  lastRange = null;
  dlg.querySelector('.pb-saved').classList.remove('is-on');
  fill();
  dlg.style.setProperty('--k', scaleOf(sb));
  dlg.showModal();
  dlg.querySelector('.pb-body').scrollTop = 0;
  ui.title.focus();
}
