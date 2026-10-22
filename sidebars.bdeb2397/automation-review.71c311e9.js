// An automation's reviews in its full view (automation-detail.71c311e9.js): everyone's, without a name, and the
// viewer's own. Once they have rated it, a field to review it opens under the stars; posted, their review leads the list
// with Edit and Delete. Kept in store.854d0793.js (rated, reviews) and drawn with the rating it was given; what they
// were typing is kept while the page is open. No name is ever shown, theirs included.
import { esc, asset } from './parts.bdeb2397.js';
import { state, save } from './store.854d0793.js';

const STAR = './automations/star.png';
const MAX = 600;
const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const drafts = new Map();

const star = (on) => `<img class="amd-rv-star${on ? '' : ' is-off'}" src="${asset(STAR)}" alt="" width="12" height="12" draggable="false">`;
const stars = (n) => `<span class="amd-rv-stars" role="img" aria-label="Rated ${n} out of 5">${Array.from({ length: 5 }, (_, i) => star(i < n)).join('')}</span>`;

const review = (r) => `<li class="amd-review">
  <p class="amd-rv-top">${stars(r.stars)}<b class="amd-rv-t">${esc(r.title)}</b></p>
  <p class="amd-p">${esc(r.body)}</p>
  <p class="amd-rv-by">${esc(r.date)}</p>
</li>`;

// the field, the line that says what happened, and the list (the viewer's own review is put at its head when painted)
export const reviewsHTML = (reviews) => `<form class="amd-write" hidden>
  <label class="amd-write-l" for="amd-write-t">Write a review</label>
  <textarea class="amd-write-t" id="amd-write-t" rows="3" maxlength="${MAX}" placeholder="What did it do for your game?"></textarea>
  <div class="amd-write-row"><span class="amd-write-hint">Reviews are posted without your name.</span><button class="am-btn amd-write-cancel" type="button" hidden>Cancel</button><button class="am-try amd-write-post" type="submit" disabled>Post review</button></div>
</form>
<p class="amd-rv-status" role="status"></p>
<ul class="amd-reviews"><li class="amd-review is-mine" hidden></li>${reviews.map(review).join('')}</ul>`;

// wires the field and the viewer's review in `root` (re-drawn for each automation); `paint` follows a new rating
export function wireReviews(root, id) {
  const form = root.querySelector('.amd-write'), field = form.querySelector('.amd-write-t');
  const post = form.querySelector('.amd-write-post'), cancel = form.querySelector('.amd-write-cancel');
  const mineItem = root.querySelector('.amd-review.is-mine'), status = root.querySelector('.amd-rv-status');
  let editing = false;

  function paint() {
    const rated = state.rated[id], mine = state.reviews[id];
    const writing = Boolean(rated) && (!mine || editing);
    if (form.hidden === writing) field.value = editing ? mine.body : drafts.get(id) ?? '';
    form.hidden = !writing;
    post.textContent = editing ? 'Save review' : 'Post review';
    post.disabled = !field.value.trim();
    cancel.hidden = !editing;
    mineItem.hidden = !mine || editing;
    if (mine) {
      mineItem.innerHTML = `<p class="amd-rv-top">${stars(rated ?? 0)}<b class="amd-rv-t">Your review</b></p>
  <p class="amd-p">${esc(mine.body)}</p>
  <p class="amd-rv-by">${esc(mine.date)}${mine.edited ? ', edited' : ''}</p>
  <p class="amd-rv-acts"><button class="amd-link amd-rv-edit" type="button">Edit</button><button class="amd-link amd-rv-del" type="button">Delete</button></p>`;
    }
  }
  const say = (text) => { status.textContent = text; };

  field.addEventListener('input', () => {
    if (!editing) drafts.set(id, field.value);
    post.disabled = !field.value.trim();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const body = field.value.trim();
    if (!body) return;
    const was = state.reviews[id];
    state.reviews[id] = was ? { ...was, body, edited: true } : { body, date: today() };
    save('reviews');
    drafts.delete(id);
    editing = false;
    paint();
    say(was ? 'Review saved.' : 'Review posted.');
    mineItem.querySelector('.amd-rv-edit').focus();
  });
  cancel.addEventListener('click', () => {
    editing = false;
    paint();
    mineItem.querySelector('.amd-rv-edit').focus();
  });
  mineItem.addEventListener('click', (e) => {
    if (e.target.closest('.amd-rv-edit')) {
      editing = true;
      paint();
      say('');
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    } else if (e.target.closest('.amd-rv-del')) {
      delete state.reviews[id];
      save('reviews');
      paint();
      say('Review deleted.');
      field.focus();
    }
  });

  paint();
  return { paint };
}
