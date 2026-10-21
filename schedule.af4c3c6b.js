// The spot's script as data: the one prompt the user sends, what superbot does on the screen, the one-line activity it
// logs for each step, and what it posts to the chat. One pass is L seconds; the clock (main.af4c3c6b.js) loops it.
// superbot opens ROB IT on roblox.com, then the game's Thumbnails page in Creator Hub, reads every thumbnail's qualified
// play-through rate in the full table, uploads iterations, swaps one in for the lowest performer and saves, waits for
// the next data update, reloads and reads again. Every iteration that beats the one it replaced is a breakthrough.
import { THUMBS, START_ORDER, START_ACTIVE, PERIODS, rateOf, figures, averageRate } from './rbx.af4c3c6b.js';
import { TABS } from './screen.af4c3c6b.js';
import { STREAM_CPS, TYPE_CPS } from './lib.af4c3c6b.js';

const ASK = 'This is my game roblox.com/games/96168869671905/ROB-IT. Continually make iterations on my existing thumbnails and replace my lowest performer';
const URL_CPS = 34; // superbot's typing in Chrome's address bar
const LONG_URL_CPS = 80; // a long address, typed fast
const POST = 0.25; // a chat post lands this long after the activity line it belongs to
const HOLD = 3.4; // the last card stays up this long once it is fully out, before the loop comes round
const S_READ = 400; // the edit view scrolled to show its header and the first six rows
const ROW_H = 89;
const PAGE_ROOM = 765; // the Thumbnails page's scrolling column
const EDIT_FULL = 1630; // its height with the ten rows it lists today

const pct = (v) => `${v.toFixed(2)}%`;

export function buildSchedule() {
  const S = { chat: [], typing: [], acts: [], moves: [], clicks: [], tabs: [{ openAt: -1 }], views: [[{ at: -1, v: 'ntp' }], []], active: [{ at: -1, tab: 0 }],
    omni: [{ at: -1, mode: 'ph' }], scrolls: { hub: [], edit: [], game: [] }, hero: [], table: [], control: 0, panel: 0, L: 0 };
  // one activity line: when it lands, its icon (img/fx/<icon>.png), its text, and whether it is a breakthrough
  const act = (at, icon, text, win = false) => S.acts.push({ at, icon, text, win });
  const move = (t0, t1, to) => S.moves.push({ t0, t1, to });
  const view = (i, at, v) => S.views[i].push({ at, ...v });
  const scroll = (k, t0, t1, from, to) => S.scrolls[k].push({ t0, t1, from, to });
  const say = (at, text) => { S.typing.push({ start: at, text, send: at + text.length / TYPE_CPS + 0.18 }); S.chat.push({ at: at + text.length / TYPE_CPS + 0.18, kind: 'user', text }); };
  const bot = (at, text, card, after) => { const c = { at, kind: 'bot', text, card, after }; S.chat.push(c); return c; };
  // the cursor travels to a target, then presses it
  const press = (t0, to) => { move(t0, t0 + 0.45, to); S.clicks.push({ at: t0 + 0.5 }); return t0 + 0.5; };

  // the table as it stands; each change is a new state from its time on
  let table = { period: 0, order: [...START_ORDER], active: [...START_ACTIVE], fresh: {} };
  const setTable = (at, patch) => { table = { ...table, ...patch }; S.table.push({ at, ...table }); };
  setTable(-1, {});
  const row = (id) => table.order.indexOf(id);
  const lowest = () => table.active.reduce((lo, id) => (rateOf(table.period, id) < rateOf(table.period, lo) ? id : lo));
  const editMax = () => EDIT_FULL + ROW_H * (table.order.length - 10) - PAGE_ROOM;
  let editAt = 0; // where the edit view is scrolled
  const scrollEdit = (t0, to, dur = 0.7) => { scroll('edit', t0, t0 + dur, editAt, to); editAt = to; return t0 + dur; };

  // the one ask; the sidebar slides in once it is sent, superbot takes control, and the user only watches
  say(0.5, ASK);
  const send = S.typing[0].send;
  S.panel = send + 0.1;
  S.control = send + 0.6;
  bot(send + 0.35, "On it. I'll read how every ROB IT thumbnail performs, make iterations on your thumbnails, and swap one in for your lowest performer each round. I'll post every win here.");
  act(S.control + 0.1, 'laptop', 'Took control of your computer');

  // the game page
  let c = S.control + 0.5;
  move(c, c + 0.5, 'omni');
  const gUrl = TABS[0].host + TABS[0].path;
  let ty = c + 0.65;
  S.omni.push({ at: ty, mode: 'type', text: gUrl, start: ty, cps: URL_CPS });
  let enter = ty + gUrl.length / URL_CPS + 0.12;
  view(0, enter, { v: 'load' });
  S.omni.push({ at: enter, mode: 'url', tab: 0 });
  let shown = enter + 0.45;
  view(0, shown, { v: 'page', page: 'game' });
  act(shown + 0.05, 'globe_with_meridians', 'Opened ROB IT on roblox.com');
  // the page's carousel turns through ROB IT's thumbnails, a slide at a time, while superbot looks at them
  move(shown + 0.15, shown + 0.6, 'game:hero');
  for (let k = 1; k <= 3; k++) S.hero.push({ at: shown + 0.35 + k * 0.5, step: k });
  act(shown + 0.9, 'framed_picture', 'Checked the thumbnails players see');

  // Creator Hub's Thumbnails page, in a new tab
  c = shown + 2.0;
  move(c, c + 0.5, 'plus:1');
  S.tabs.push({ openAt: c + 0.55 });
  view(1, c + 0.55, { v: 'ntp' });
  S.active.push({ at: c + 0.55, tab: 1 });
  S.omni.push({ at: c + 0.55, mode: 'ph' });
  const hUrl = TABS[1].host + TABS[1].path;
  ty = c + 0.75;
  S.omni.push({ at: ty, mode: 'type', text: hUrl, start: ty, cps: LONG_URL_CPS });
  enter = ty + hUrl.length / LONG_URL_CPS + 0.12;
  view(1, enter, { v: 'load' });
  S.omni.push({ at: enter, mode: 'url', tab: 1 });
  shown = enter + 0.5;
  view(1, shown, { v: 'page', page: 'hub' });
  act(shown + 0.05, 'globe_with_meridians', 'Opened Thumbnails in Creator Hub');

  // the full table, every rate in it, is the edit view
  const openEdit = (t0) => {
    const at = press(t0, 'hub:edit');
    view(1, at, { v: 'page', page: 'edit' });
    scroll('edit', at, at, 0, 0);
    editAt = 0;
    return at;
  };
  // tick or untick a row's Active box, scrolling it into view first
  const toggle = (t0, id, s) => {
    let at = t0;
    if (editAt !== s) at = scrollEdit(at, s) + 0.05;
    at = press(at, `check:${row(id)}@${s}`);
    const on = table.active.includes(id);
    setTable(at, { active: on ? table.active.filter((a) => a !== id) : [...table.active, id] });
    return at;
  };
  const save = (t0, id, swapped) => {
    let at = scrollEdit(t0, 0) + 0.05;
    at = press(at, 'edit:save');
    view(1, at, { v: 'page', page: 'hub' });
    act(at + 0.05, 'floppy_disk', `Saved. ${THUMBS[id].name} is live in place of the ${THUMBS[swapped].name} one`);
    return at;
  };
  const upload = (t0, ids) => {
    let at = scrollEdit(t0, 0) + 0.05;
    at = press(at, 'edit:upload');
    const born = at + 0.6;
    setTable(born, { order: [...table.order, ...ids], fresh: Object.fromEntries(ids.map((id, k) => [id, born + k * 0.12])) });
    act(born + 0.1, 'outbox_tray', `Uploaded ${ids.length} iterations`);
    return born + 0.4;
  };
  // the wait for Roblox's next data update, then a reload that brings it in
  const recheck = (t0) => {
    act(t0, 'hourglass_not_done', 'Waiting for the next data update');
    const at = press(t0 + 0.9, 'reload');
    view(1, at, { v: 'load' });
    setTable(at + 0.2, { period: table.period + 1, fresh: {} });
    view(1, at + 0.45, { v: 'page', page: 'hub' });
    act(at + 0.5, 'counterclockwise_arrows_button', `Rechecking: data updated ${PERIODS[table.period].date}`);
    return at + 0.5;
  };
  // read an iteration's new rate off the table and post it
  const verdict = (t0, id, replaced, oldRate, text, card) => {
    const s = editMax();
    let at = openEdit(t0);
    at = scrollEdit(at + 0.1, s, 0.8);
    move(at + 0.05, at + 0.5, `ptr:${row(id)}@${s}`);
    const r = rateOf(table.period, id);
    act(at + 0.55, 'trophy', text(r), true);
    return bot(at + 0.55 + POST, card.say(r), { img: THUMBS[id].img, title: THUMBS[id].name, sub: card.sub, line: `Replaced the ${THUMBS[replaced].name} one (${pct(oldRate)})`, value: pct(r), unit: 'play-through', win: true }, card.after);
  };

  // round one: read the table, find the lowest performer, make and upload iterations, swap one in
  c = openEdit(shown + 0.6);
  scrollEdit(c + 0.1, S_READ, 0.8);
  act(c + 0.2, 'bar_chart', `Reading ${table.active.length} thumbnails' play-through rates`);
  let lo = lowest();
  let loRate = rateOf(0, lo);
  move(c + 1.0, c + 1.45, `ptr:${row(lo)}@${S_READ}`);
  act(c + 1.5, 'chart_decreasing', `Lowest performer: the ${THUMBS[lo].name} one at ${pct(loRate)}`);
  const best = table.active.reduce((b, id) => (rateOf(0, id) > rateOf(0, b) ? id : b));
  bot(c + 1.5 + POST, `Your lowest performer is the ${THUMBS[lo].name} thumbnail at ${pct(loRate)} qualified play-through. Your best is the ${THUMBS[best].name} one at ${pct(rateOf(0, best))}.`,
    { img: THUMBS[lo].img, title: 'Lowest performer', sub: `${THUMBS[lo].name[0].toUpperCase()}${THUMBS[lo].name.slice(1)} thumbnail`, line: `${figures(0, lo).imp.toLocaleString('en-US')} impressions, ${PERIODS[0].range}`, value: pct(loRate), unit: 'play-through' });
  act(c + 2.0, 'artist_palette', 'Making 3 iterations on your museum and diamond thumbnails');
  bot(c + 3.6, 'Made 3 iterations to test against it:', { strip: ['it1', 'it2', 'it3'] });
  c = upload(c + 3.8, ['it1', 'it2', 'it3']);
  // Creator Hub allows five active: the lowest performer's box comes off first, then the iteration's goes on
  c = toggle(c + 0.2, lo, S_READ);
  c = toggle(c + 0.25, 'it1', editMax());
  act(c + 0.05, 'check_mark_button', `Swapped the ${THUMBS[lo].name} one for iteration 1`);
  c = save(c + 0.3, 'it1', lo);
  c = recheck(c + 0.5);
  verdict(c + 0.3, 'it1', lo, loRate, (r) => `New best: iteration 1 at ${pct(r)} play-through`,
    { say: (r) => `New best thumbnail. Iteration 1 is at ${pct(r)} qualified play-through, up from ${pct(loRate)} on the ${THUMBS[lo].name} one it replaced:`, sub: 'Guard spots the robber, museum' });
  c = S.chat[S.chat.length - 1].at + 0.5;

  // round two: the next lowest makes way for iteration 2
  lo = lowest();
  loRate = rateOf(table.period, lo);
  act(c, 'chart_decreasing', `Lowest now: the ${THUMBS[lo].name} one at ${pct(loRate)}`);
  c = toggle(c + 0.3, lo, S_READ);
  c = toggle(c + 0.25, 'it2', editMax());
  act(c + 0.05, 'check_mark_button', `Swapped the ${THUMBS[lo].name} one for iteration 2`);
  c = save(c + 0.3, 'it2', lo);
  c = recheck(c + 0.5);
  verdict(c + 0.3, 'it2', lo, loRate, (r) => `Iteration 2 at ${pct(r)}, up from ${pct(loRate)}`,
    { say: (r) => `Iteration 2 took the ${THUMBS[lo].name} one's spot and is at ${pct(r)}, up from ${pct(loRate)}:`, sub: 'Mid-escape with the loot, museum' });
  c = S.chat[S.chat.length - 1].at + 0.5;

  // round three: two more iterations, on the bedroom thumbnails, and the best of them goes in
  act(c, 'artist_palette', 'Making 2 more iterations on your bedroom thumbnails');
  bot(c + 1.6, 'Made 2 more, on your bedroom thumbnails:', { strip: ['it4', 'it5'] });
  c = upload(c + 1.8, ['it4', 'it5']);
  lo = lowest();
  loRate = rateOf(table.period, lo);
  c = toggle(c + 0.2, lo, S_READ);
  c = toggle(c + 0.25, 'it4', editMax());
  act(c + 0.05, 'check_mark_button', `Swapped the ${THUMBS[lo].name} one for iteration 4`);
  c = save(c + 0.3, 'it4', lo);
  c = recheck(c + 0.5);
  const startAvg = averageRate(0, START_ACTIVE);
  const last = verdict(c + 0.3, 'it4', lo, loRate, (r) => `New best: iteration 4 at ${pct(r)} play-through`,
    { say: (r) => `New best again. Iteration 4 hit ${pct(r)}, beating iteration 1:`, sub: 'Robber holding the diamond, bedroom' });
  last.after = `Your active thumbnails now average ${pct(averageRate(table.period, table.active))}, up from ${pct(startAvg)}. Still testing.`;
  S.L = last.at + 0.08 + last.text.length / STREAM_CPS + 0.15 + 0.35 + last.after.length / STREAM_CPS + HOLD;

  for (const list of [S.chat, S.acts, S.moves, S.active, S.omni, S.typing, S.table, S.clicks]) list.sort((a, b) => (a.at ?? a.t0 ?? a.start) - (b.at ?? b.t0 ?? b.start));
  for (const v of S.views) v.sort((a, b) => a.at - b.at);
  for (const k of Object.keys(S.scrolls)) S.scrolls[k].sort((a, b) => a.t0 - b.t0);
  // moves must follow one another: two that overlap would make the cursor jump
  for (let k = 1; k < S.moves.length; k++) if (S.moves[k].t0 < S.moves[k - 1].t1 - 1e-6) throw new Error(`cursor moves overlap at ${S.moves[k].t0.toFixed(2)}s`);
  return S;
}
