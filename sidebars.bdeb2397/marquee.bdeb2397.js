// A row's title never ends in "…": a title longer than its row fades out at the right edge (`is-overflow`), and while
// the row is hovered or focused it slides once, at a constant speed, to its end and rests there; leaving eases it home.
// A small fade sits on each edge only while text is hidden past it, so the first and last letters are crisp when they
// are fully in view: the left fade grows as the line leaves its start, the right one shrinks as its end arrives.
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MARQUEE = { delay: 350, speed: 32, back: 200 }; // ms before it starts, px per s (linear), ms home on leave

// `host` holds the row and its "•••" (a chat's li, a group's head), so moving onto the button keeps the title going
export function marquee(host) {
  const box = host.querySelector('.sb-title'), text = box?.querySelector('.sb-title-in');
  if (!text) return;
  let timer = 0, raf = 0, on = false, tx = 0, dist = 0, fade = 0;

  const overflowing = () => box.scrollWidth > box.clientWidth + 0.5;
  // the row's width changes as its "•••" shows, the fonts land, or the title is renamed
  new ResizeObserver(() => box.classList.toggle('is-overflow', overflowing())).observe(box);

  function paint() {
    text.style.transform = tx ? `translateX(${tx.toFixed(2)}px)` : '';
    box.style.setProperty('--fade-l', `${Math.min(fade, -tx).toFixed(2)}px`);
    box.style.setProperty('--fade-r', `${Math.min(fade, dist + tx).toFixed(2)}px`);
  }

  function run() {
    const travel = (dist / MARQUEE.speed) * 1000;
    const t0 = performance.now();
    const step = (now) => {
      // one linear pass to the end, then it rests there
      const k = Math.min(1, (now - t0) / travel);
      tx = -dist * k;
      paint();
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function start() {
    on = true;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    if (REDUCED) return;
    timer = setTimeout(() => {
      if (!on || !overflowing()) return;
      box.classList.add('is-marquee');
      fade = parseFloat(getComputedStyle(box.closest('.sb-row')).columnGap) || 0;
      dist = text.offsetWidth - box.clientWidth;
      if (dist <= 1) { box.classList.remove('is-marquee'); return; }
      paint();
      run();
    }, MARQUEE.delay);
  }

  function stop() {
    on = false;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    if (!box.classList.contains('is-marquee')) return;
    // home from wherever it is, easing out
    const from = tx, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / MARQUEE.back);
      tx = from * (1 - k) ** 3;
      paint();
      if (k < 1) { raf = requestAnimationFrame(step); return; }
      tx = 0;
      text.style.transform = '';
      box.style.removeProperty('--fade-l');
      box.style.removeProperty('--fade-r');
      box.classList.remove('is-marquee');
    };
    raf = requestAnimationFrame(step);
  }

  host.addEventListener('pointerenter', start);
  host.addEventListener('pointerleave', stop);
  host.addEventListener('focusin', (e) => { if (!host.contains(e.relatedTarget)) start(); });
  host.addEventListener('focusout', (e) => { if (!host.contains(e.relatedTarget)) stop(); });
  host.addEventListener('sb-dragstart', stop);
  // with reduced motion the whole title is one hover away as a tooltip instead
  if (REDUCED) host.querySelector('.sb-row').title = text.textContent;
}
