// Small pure helpers for the Roblox thumbnails spot: every value on screen is a function of t, so a frozen frame (?t=)
// holds and the loop replays identically.
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const seg = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const lerp = (a, b, k) => a + (b - a) * k;
export const outCubic = (k) => 1 - (1 - k) ** 3;
export const inOutCubic = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
// a text caret: on for 0.53s, off for 0.53s
export const caretOn = (t) => Math.floor(Math.max(0, t) / 0.53) % 2 === 0;
// superbot's replies stream into the chat at this many characters a second; the user's prompt types in at TYPE_CPS
export const STREAM_CPS = 160;
export const TYPE_CPS = 52;
// how many characters of a typed or streamed string are out at t
export const countAt = (text, start, cps, t) => clamp(Math.floor((t - start) * cps), 0, text.length);
// the last entry of a time-sorted list whose `at` is at or before t
export function lastAt(list, t, key = 'at') {
  let hit = null;
  for (const e of list) { if (e[key] <= t) hit = e; else break; }
  return hit;
}
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}
