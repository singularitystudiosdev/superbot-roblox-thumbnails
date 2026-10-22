// What the viewer changes in this page: the effort picked, the profile, notification and connection choices, billing,
// the messages they sent, the chats they started, the chats whose bell they turned off, the automations they rated and
// published, and the panes they folded. Kept in sessionStorage, so a reload keeps it and a new tab (or a headless capture) starts from
// the creative as made.
import { PROFILE, BILLING, NOTIFICATIONS, CONNECTIONS, PUBLISHED } from './settings-data.bdeb2397.js';

// .2: the credits went from thousands to millions; .3: the plans went (credits are bought outright, with auto-reload's
// own amounts); .4: the one card became payment methods with a billing address; .5: that address starts empty, so a tab
// saved before that starts fresh
const KEY = 'superbot-view.854d0793.5';

const fresh = () => ({
  effort: 'high',
  profile: { ...PROFILE },
  billing: structuredClone(BILLING),
  notify: Object.fromEntries(NOTIFICATIONS.map((n) => [n.id, n.on])),
  connections: Object.fromEntries(CONNECTIONS.map((c) => [c.id, { on: c.on, account: c.account }])),
  sent: {},
  made: [],
  muted: [],
  // the viewer's own rating of an automation and their review of it ({ body, date, edited }), by its id
  // (automation-detail.71c311e9.js, automation-review.71c311e9.js)
  rated: {},
  reviews: {},
  // the automations the viewer published, newest first (published.6c0fd59e.js), and what Publish holds unpublished: a
  // new one's draft under `new`, an edit's under its id (publish.6c0fd59e.js)
  published: structuredClone(PUBLISHED),
  drafts: {},
  sideShut: false,
  sbShut: false,
});

function load() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    return saved ? { ...fresh(), ...saved } : fresh();
  } catch (e) {
    console.error(new Error('the saved view state did not load; starting fresh', { cause: e }));
    return fresh();
  }
}

export const state = load();
const listeners = new Set();

// every change goes through here: saved, then whoever shows it hears which part changed
export function save(part) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // a full quota (a big photo) keeps the change in this page only
    console.error(new Error(`the view state was not saved (${part})`, { cause: e }));
  }
  for (const fn of listeners) fn(part);
}
export const onChange = (fn) => listeners.add(fn);

export const sentOf = (id) => state.sent[id] ?? [];
export function addSent(id, msg) {
  (state.sent[id] ??= []).push(msg);
  save('sent');
}

// a chat's bell (composer.854d0793.js): every chat notifies you, a new one too, until its bell is turned off
export const notifies = (id) => !state.muted.includes(id);
export function setNotifies(id, on) {
  state.muted = on ? state.muted.filter((m) => m !== id) : [...new Set([...state.muted, id])];
  save('muted');
}
