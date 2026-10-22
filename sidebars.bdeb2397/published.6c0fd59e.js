// The automations the viewer publishes to the Automations tab, beside the catalogue's own (automations.03378ba4.js).
// Each is a thumbnail, a title, a description, a system prompt, the questions whoever starts it is asked (each one's
// answer goes wherever its {{key}} sits in the prompt, or at the prompt's end when it sits nowhere), and its categories:
// the apps of the Automations tab it is filed under (`apps`, ALL_APPS), its card wearing the first as its app. Nothing
// is connected to start one: ouroboro works in those apps with computer control. Publish (publish.6c0fd59e.js) makes
// them, and once published one is not edited; Settings' My Automations (my-automations.6c0fd59e.js) lists them with
// their uses and the credits they made, and a start asks its questions above the composer (gameask.b3fb005c.js), then
// sends the prompt with the answers in. Kept with the rest of what the viewer changes (store.854d0793.js `published`).
// Each start is a use and makes its publisher EARN_PER_USE credits, a tenth of what a round takes.
import { AUTOMATIONS, ALL_APPS } from './automations.03378ba4.js';
import { DETAILS, PUBLISHERS } from './automation-details.71c311e9.js';
import { state, save } from './store.854d0793.js';

export const CREDITS_A_ROUND = 200_000;
export const EARN_PER_USE = CREDITS_A_ROUND / 10;
// the publisher key of what the viewer published (automation-detail.71c311e9.js)
export const YOU = 'you';

// where an answer goes: {{q1}}, its key a lower case letter, then letters, digits or _
export const SLOT = /\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g;
export const slotsOf = (prompt) => [...new Set([...prompt.matchAll(SLOT)].map((m) => m[1]))];
// a Roblox game's page (roblox.com/games/<id>, with or without its scheme, www or a language in the path) or its share link
export const GAME_LINK = /^(?:https?:\/\/)?(?:(?:www|web|m)\.)?roblox\.com\/(?:(?:[a-z]{2}(?:-[a-z]{2})?\/)?games\/\d+|share\?\S*code=)\S*$/i;

// the prompt a start runs: every answer in its place, and any question placed nowhere asked and answered at its end
export function compose(a, answers) {
  const placed = new Set(slotsOf(a.prompt));
  const body = a.prompt.replace(SLOT, (all, key) => answers[key] ?? all);
  const extra = (a.questions ?? []).filter((q) => !placed.has(q.key) && answers[q.key]).map((q) => `${q.q} ${answers[q.key]}`);
  return extra.length ? `${body}\n\n${extra.join('\n')}` : body;
}

// its ratings by star, 5 down to 1, the viewer's own counted in
export function starsOf(p) {
  const counts = [...p.stars], mine = state.rated[p.id];
  if (mine) counts[5 - mine] += 1;
  return counts;
}
const totalOf = (counts) => counts.reduce((sum, n) => sum + n, 0);
const ratingOf = (p) => {
  const counts = starsOf(p), total = totalOf(counts);
  return total ? Math.round((counts.reduce((sum, n, i) => sum + n * (5 - i), 0) / total) * 10) / 10 : 0;
};

// everything the Automations tab offers: the catalogue's, then the viewer's, newest first, drawn as the catalogue's
// are (a rating of 0 until it has one)
export const catalogue = () => [...AUTOMATIONS, ...state.published.map((p) => ({ ...p, topics: [], rating: ratingOf(p), mine: true }))];
export const automationById = (id) => catalogue().find((a) => a.id === id);
export const publishedById = (id) => state.published.find((p) => p.id === id);

// what its full view says beyond its card (automation-detail.71c311e9.js): the catalogue's own, or for one the viewer
// published its description, a round's credits, its ratings and no reviews yet, by them
export function detailsOf(a) {
  if (DETAILS[a.id]) return DETAILS[a.id];
  const p = publishedById(a.id);
  return { about: [p.desc || p.title], publisher: YOU, credits: CREDITS_A_ROUND, stars: p.stars, reviews: [] };
}
export const publisherOf = (key) => (key === YOU
  ? { name: state.profile.name, avatar: state.profile.photo, about: 'Publishes automations for everyone in the Automations tab.' }
  : PUBLISHERS[key]);

// the questions a start asks: a published one's own; the catalogue's ask which game (a Roblox game's link only), the
// account's game offered
export const questionsOf = (a) => a?.questions ?? [{ key: 'game', q: `Which game should I run ${a?.title ?? 'this'} on?`, game: true }];
// the categories it is filed under: a published one's own (`needs` before they were categories), the catalogue's its
// one app
export const appsOf = (a) => a?.apps ?? a?.needs ?? (a?.app ? [a.app] : []);
// a new connection in Settings signs in as the account superbot already knows for you
export const accountFor = (id) => (id === 'discord' ? state.profile.name : state.profile.email);

// a start of one the viewer published: a use, and its publisher's share of the round
export function countUse(id) {
  const p = publishedById(id);
  if (!p) return;
  p.uses += 1;
  p.credits += EARN_PER_USE;
  save('published');
}

// its categories in the tab's order, and the app its card shows: the first of them, Roblox when it has none
export const inOrder = (apps) => Object.keys(ALL_APPS).filter((id) => apps.includes(id));
export const appFor = (apps) => apps.find((id) => ALL_APPS[id]) ?? 'roblox';
const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// `draft` is Publish's: { thumb, title, desc, prompt, questions, apps }. It leads the viewer's, and stays as published:
// there is no editing it, only unpublishing
export function publish(draft) {
  const apps = inOrder(draft.apps);
  state.published.unshift({
    id: `pub-${Date.now().toString(36)}`, title: draft.title, desc: draft.desc, prompt: draft.prompt, thumb: draft.thumb, apps, app: appFor(apps),
    questions: draft.questions.map(({ key, q }) => ({ key, q })), uses: 0, credits: 0, stars: [0, 0, 0, 0, 0], at: today(),
  });
  save('published');
  return state.published[0];
}
// unpublished, and put back where it was by an undo
export function unpublish(id) {
  const at = state.published.findIndex((p) => p.id === id);
  if (at < 0) return null;
  const [p] = state.published.splice(at, 1);
  save('published');
  return { p, at };
}
export function restore({ p, at }) {
  state.published.splice(Math.min(at, state.published.length), 0, p);
  save('published');
}
