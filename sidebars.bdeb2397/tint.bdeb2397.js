// The takeover vignette wears the color of the app superbot is working in: superbot's own orange until it opens one,
// Roblox's logo blue once a Roblox page is loading or showing. A New Tab page is no app, so it keeps the color of the
// last one (a second tab opened mid-task never flickers back to orange). The app is read from the spot's schedule like
// everything else it paints (the active tab, what that tab shows, that tab's host), so a frozen frame and a playing one
// agree; when the app changes, the vignette's four stops blend to the new palette over SHIFT seconds.
import { TABS } from '../screen.af4c3c6b.js';
import { lastAt, seg, outCubic } from '../lib.af4c3c6b.js';

const SHIFT = 0.6; // s

// each palette: the base, a lighter, a deeper and a lightest shade, the order the conic band runs through them
const PALETTES = {
  // the creative's own (style.af4c3c6b.css .cc-band, from computer.ba3976b6.css)
  superbot: ['#fd9e43', '#ffb769', '#f68a2c', '#ffc185'],
  // Roblox's logo blue, read off its favicon (img/fav/roblox.png, #335fff), with shades built the way the orange's are
  roblox: ['#335fff', '#6f8dff', '#2149e8', '#a3b6ff'],
};
// which app a host belongs to; anything else keeps superbot's orange
const APPS = [{ app: 'roblox', host: /(^|\.)roblox\.com$/ }];
const appOfHost = (host) => APPS.find((a) => a.host.test(host))?.app ?? 'superbot';

// the app on screen at t, or null on a New Tab page
function appAt(S, t) {
  const tab = lastAt(S.active, t).tab;
  const shown = lastAt(S.views[tab], t);
  return !shown || shown.v === 'ntp' ? null : appOfHost(TABS[tab].host);
}

// every moment the vignette's app changes, worked out once from the schedule; a New Tab page carries the last app on
const OPENING = { at: -Infinity, app: 'superbot' };
function changes(S) {
  const times = [...new Set([...S.active.map((e) => e.at), ...S.views.flat().map((e) => e.at)])].sort((a, b) => a - b);
  const out = [OPENING];
  for (const at of times) {
    const app = appAt(S, at);
    if (app && out.at(-1).app !== app) out.push({ at, app });
  }
  return out;
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, k) => `rgb(${rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * k)).join(' ')})`;

// paints the vignette's four stops onto `edge` (the live view's .cc-edge) for time t
export function tinter(S) {
  const steps = changes(S);
  let shown = '';
  return (edge, t) => {
    const i = steps.findLastIndex((s) => s.at <= t);
    const now = steps[i], before = steps[Math.max(0, i - 1)];
    const k = i > 0 ? outCubic(seg(t, now.at, now.at + SHIFT)) : 1;
    const from = PALETTES[before.app], to = PALETTES[now.app];
    const stops = to.map((c, j) => (k >= 1 ? c : mix(from[j], c, k)));
    const key = stops.join();
    if (key === shown) return;
    shown = key;
    stops.forEach((c, j) => edge.style.setProperty(`--tint-${j}`, c));
    edge.dataset.app = now.app;
  };
}
