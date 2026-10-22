// chats.5a028abd.html's own entry, loaded before main.af4c3c6b.js: it mounts the ?chats= variant before main lays the app
// out and measures it, then paints the list on the spot's clock. main keeps its clock to itself, so this one starts at
// the same instant (main sets window.__ready as its clock starts) and follows the same keys: space pauses, R restarts,
// the arrows step a second. A frozen frame (?t=) is painted at mount and again as main declares it ready.
import { buildSchedule } from './schedule.af4c3c6b.js';
import { mountChats } from './chats.5a028abd.js';

const S = buildSchedule();
const list = mountChats(S);
const params = new URLSearchParams(location.search);
const frozen = params.has('t') ? Number(params.get('t')) : null;
const wrap = (t) => ((t % S.L) + S.L) % S.L;

let origin = 0, started = false, paused = false, pausedAt = 0, ready = false;
const now = () => (paused ? pausedAt : (performance.now() - origin) / 1000);
const paint = () => list.paint(wrap(frozen ?? (started ? now() : 0)));

if (list) {
  Object.defineProperty(window, '__ready', {
    configurable: true,
    get: () => ready,
    set(v) {
      ready = v;
      if (v && !started) { origin = performance.now(); started = true; }
      paint();
    },
  });
  paint();
  const loop = () => { if (started && frozen === null) paint(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);

  addEventListener('keydown', (e) => {
    if (frozen !== null) return;
    if (e.key === ' ') {
      if (paused) { origin = performance.now() - pausedAt * 1000; paused = false; } else { pausedAt = now(); paused = true; }
    } else if (e.key === 'r' || e.key === 'R') {
      origin = performance.now(); pausedAt = 0;
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const d = e.key === 'ArrowRight' ? 1 : -1;
      if (paused) pausedAt = Math.max(0, pausedAt + d); else origin -= d * 1000;
    }
  });
}
