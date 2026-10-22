// A chat's feed scrolls, and says how much is under the view. A run's chat (feed.bdeb2397.js) grows as its posts
// arrive and keeps its latest in view until the viewer scrolls up from it (the wheel, a finger, or the keys on the
// focused feed); back at its foot, it follows again. Scrolled up, a pill over the composer counts the updates under the
// view, its figure rolling (odometer.0ecb8f7c.js) as more arrive or come into sight, and a press glides the chat down to
// its latest. A chat switched to is never scrolled down for the viewer: it is parked where they left it (park), or at
// its top the first time, and what came in meanwhile waits under the view until they scroll to it. A chat out of sight
// (the live one under another chat) stops following, so it is where it was when they come back. Every chat's feed
// mounts one: the live chat's (main.bdeb2397.js), an open chat's (chatview.bdeb2397.js) and New chat's
// (newchat.854d0793.js).
import { outCubic } from '../lib.af4c3c6b.js';
import { odometer } from './odometer.0ecb8f7c.js';
import { ic } from './icons.854d0793.js';

const GLIDE_MS = 300; // the press's glide to the latest: design-motion's quick band, at its cap
const UNDER = 8; // px of an update under the view's foot before it counts as below
const PLACE_MS = 1000; // a parked place not yet reachable (its chat still being laid out) is dropped after this
const KEYS = { ArrowUp: -1, PageUp: -1, Home: -1, ArrowDown: 1, PageDown: 1, End: 1 };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const feeds = new WeakMap();

// whether a run's chat keeps its latest in view, called each frame once its thread is laid out: true unless the viewer
// has scrolled up from it, it was switched to, or it is out of sight; and always for one that has none of this. A place
// it was parked at is taken here as soon as the thread reaches it
export const following = (feed) => feeds.get(feed)?.following() ?? true;
// a chat switched to: back at `top` (where the viewer left it, 0 the first time), following only once they scroll down
// to its foot
export const park = (feed, top) => feeds.get(feed)?.park(top);
// a chat laid out as it stands (shown in full, or held): at the place it was parked at, at its latest if it was
// following, or left where it is
export function land(feed) {
  const c = feeds.get(feed);
  if (c) c.land(); else feed.scrollTop = feed.scrollHeight;
}

// `feed` is the scrolling pane, its thread its first child; the pill goes between it and the composer under it
export function mountLatest(feed) {
  const thread = feed.firstElementChild;
  const anchor = document.createElement('div');
  anchor.className = 'lt';
  anchor.innerHTML = `<button class="lt-pill" type="button" inert>${ic('arrowDown', 'sb-lu lt-ic')}<span class="lt-l"><span class="lt-n"></span><span class="lt-t"></span></span></button>`;
  feed.after(anchor);
  const pill = anchor.firstElementChild, figure = odometer(pill.querySelector('.lt-n')), words = pill.querySelector('.lt-t');

  // `parked`: switched to, so only the viewer scrolling down to the foot follows again; `place`: where it was parked,
  // until the thread reaches it; `dir`: the way the viewer last asked to scroll; `glide`: the press's glide under way
  let follow = true, parked = false, place = null, dir = 0, glide = 0, shown = false, queued = 0;
  const gap = () => feed.scrollHeight - feed.clientHeight - feed.scrollTop;
  const inSight = () => feed.checkVisibility?.({ visibilityProperty: true }) ?? true;
  function takePlace(clamp) {
    if (!place) return;
    if (performance.now() > place.until) { place = null; return; }
    if (!clamp && feed.scrollHeight - feed.clientHeight < place.top - 1) return;
    feed.scrollTop = place.top;
    place = null;
  }
  // the browser may have moved the feed before its wheel event reaches here, to its very top as easily as anywhere: up
  // on a feed with anything to scroll leaves the latest
  function intent(d) {
    if (!d) return;
    if (glide) { cancelAnimationFrame(glide); glide = 0; }
    dir = d;
    place = null;
    if (d < 0 && feed.scrollHeight - feed.clientHeight > 1) follow = false;
  }
  feed.addEventListener('wheel', (e) => intent(Math.sign(e.deltaY)), { passive: true });
  let touchY = null;
  feed.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  feed.addEventListener('touchmove', (e) => {
    const y = e.touches[0].clientY;
    if (touchY !== null) intent(Math.sign(touchY - y));
    touchY = y;
  }, { passive: true });
  feed.addEventListener('touchend', () => { touchY = null; }, { passive: true });
  feed.addEventListener('keydown', (e) => intent(KEYS[e.key] ?? 0));
  // at the foot it follows again: a parked chat only when the viewer scrolled it there
  feed.addEventListener('scroll', () => {
    if (!follow && !glide && (parked ? dir > 0 : dir >= 0) && gap() <= 1) { follow = true; parked = false; }
    schedule();
  }, { passive: true });

  // the updates under the view: those in (a run's not yet arrived are clear) whose foot is past the view's
  function below() {
    const box = feed.getBoundingClientRect();
    if (!box.height || gap() <= 1) return 0;
    const foot = box.bottom + UNDER * (box.height / feed.offsetHeight);
    let n = 0;
    for (const m of thread.children) {
      if (m.classList.contains('cm') && parseFloat(m.style.opacity || '1') > 0 && m.getBoundingClientRect().bottom > foot) n++;
    }
    return n;
  }
  // the pill keeps its last figure while it fades away
  function update() {
    queued = 0;
    const n = below(), on = n > 0;
    if (on) {
      figure.set(n);
      words.textContent = n === 1 ? 'update below' : 'updates below';
      pill.setAttribute('aria-label', `${n} ${words.textContent}, go to the latest`);
    }
    if (on === shown) return;
    shown = on;
    anchor.classList.toggle('is-on', on);
    pill.inert = !on;
  }
  function schedule() { if (!queued) queued = requestAnimationFrame(update); }
  // a run's thread grows as its posts arrive, a sent message joins a chat as it stands, a chat is drawn again
  new ResizeObserver(schedule).observe(thread);
  new ResizeObserver(schedule).observe(feed);
  new MutationObserver(schedule).observe(thread, { childList: true });

  // the glide chases the foot, which a playing run keeps moving down, and follows from there
  function toLatest() {
    cancelAnimationFrame(glide);
    dir = 1;
    place = null;
    parked = false;
    if (REDUCED.matches) { glide = 0; follow = true; feed.scrollTop = feed.scrollHeight; return; }
    const from = feed.scrollTop, start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / GLIDE_MS);
      feed.scrollTop = from + (feed.scrollHeight - feed.clientHeight - from) * outCubic(k);
      if (k < 1) { glide = requestAnimationFrame(step); return; }
      glide = 0;
      follow = true;
    };
    glide = requestAnimationFrame(step);
  }
  pill.addEventListener('click', () => {
    // the pill goes as the chat reaches its latest: a keyboard's focus stays in the chat
    if (document.activeElement === pill) feed.focus({ preventScroll: true });
    toLatest();
  });

  feeds.set(feed, {
    following() {
      takePlace(false);
      if (glide) return false;
      if (!follow && !parked && feed.scrollHeight - feed.clientHeight <= 1) follow = true;
      // out of sight it keeps its place: what comes in meanwhile is under the view when the viewer is back
      if (follow && !inSight()) follow = false;
      return follow;
    },
    park(top) {
      if (glide) { cancelAnimationFrame(glide); glide = 0; }
      follow = false;
      parked = true;
      dir = 0;
      place = { top, until: performance.now() + PLACE_MS };
    },
    land() {
      if (place) takePlace(true);
      else if (follow) feed.scrollTop = feed.scrollHeight;
      schedule();
    },
  });
}
