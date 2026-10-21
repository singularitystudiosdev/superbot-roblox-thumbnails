// What a rendered sidebar does under the pointer and keyboard: chats reorder by dragging (or Alt with the up or down
// arrow on a focused chat), and a title cut off by its row glides sideways on hover or focus to show the rest. It works
// inside a scaled stage: every pointer distance is divided by the list's on-screen scale.
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const DRAG_FROM = 4; // px of travel, in the list's own units, before a press becomes a drag
const SETTLE = 150; // ms, tokens --d-hover: the dropped row easing into its slot
const MARQUEE = { delay: 350, speed: 32, hold: 900, back: 200 }; // ms before it starts, px per s (linear), ms at each end, ms home

const scaleOf = (node) => node.getBoundingClientRect().height / node.offsetHeight || 1;
const titleOf = (li) => li.querySelector('.sb-title-in')?.textContent ?? '';

// one list's rows reorder; `say` announces each move to screen readers
function sortable(list, say) {
  let drag = null;
  let droppedAt = -Infinity;

  const shiftOthers = (target) => {
    drag.rows.forEach((r, i) => {
      if (r === drag.li) return;
      const by = i > drag.from && i <= target ? -drag.h : i < drag.from && i >= target ? drag.h : 0;
      r.style.transform = by ? `translateY(${by}px)` : '';
    });
  };

  function begin() {
    const rows = [...list.children];
    const from = rows.indexOf(drag.li);
    Object.assign(drag, { moved: true, rows, from, target: from, tops: rows.map((r) => r.offsetTop), hts: rows.map((r) => r.offsetHeight), h: drag.li.offsetHeight });
    list.setPointerCapture(drag.pointer);
    list.classList.add('is-sorting');
    drag.li.classList.add('is-dragging');
    drag.li.style.transition = 'none';
    drag.li.dispatchEvent(new Event('sb-dragstart', { bubbles: true }));
  }

  function move(dy) {
    const { rows, tops, hts, from, h } = drag;
    const last = rows.length - 1;
    drag.dy = Math.min(tops[last] + hts[last] - tops[from] - h, Math.max(tops[0] - tops[from], dy));
    drag.li.style.transform = `translateY(${drag.dy}px)`;
    // the new slot: past every row whose middle the dragged row's middle has crossed
    const mid = tops[from] + h / 2 + drag.dy;
    let target = from;
    rows.forEach((r, i) => {
      const m = tops[i] + hts[i] / 2;
      if (i > from && mid > m) target = Math.max(target, i);
      if (i < from && mid < m) target = Math.min(target, i);
    });
    if (target !== drag.target) { drag.target = target; shiftOthers(target); }
  }

  function finish(commit) {
    const { li, rows, from, target, tops, dy = 0 } = drag;
    const to = commit ? target : from;
    // the others are already drawn where the new order puts them: drop their offsets with no transition, reorder,
    // then ease only the dragged row from where it was let go into its slot
    list.classList.add('is-settling');
    rows.forEach((r) => { if (r !== li) r.style.transform = ''; });
    if (to !== from) {
      const others = rows.filter((r) => r !== li);
      list.insertBefore(li, others[to] ?? null);
    }
    const from_ = tops[from] + dy - li.offsetTop;
    li.style.transform = `translateY(${from_}px)`;
    void li.offsetHeight;
    list.classList.remove('is-settling');
    li.style.transition = '';
    li.style.transform = '';
    setTimeout(() => { list.classList.remove('is-sorting'); li.classList.remove('is-dragging'); }, REDUCED ? 0 : SETTLE + 30);
    if (to !== from) say(`${titleOf(li)} moved to position ${to + 1} of ${rows.length}`);
    droppedAt = performance.now();
    drag = null;
  }

  list.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || drag) return;
    const li = e.target.closest('li');
    if (!li || li.parentElement !== list || !li.querySelector('.sb-row')) return;
    drag = { li, pointer: e.pointerId, startY: e.clientY, k: scaleOf(list), moved: false };
  });
  list.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const dy = (e.clientY - drag.startY) / drag.k;
    if (!drag.moved) { if (Math.abs(dy) < DRAG_FROM) return; begin(); }
    move(dy);
  });
  list.addEventListener('pointerup', (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    if (drag.moved) finish(true); else drag = null;
  });
  list.addEventListener('pointercancel', () => { if (drag?.moved) finish(false); else drag = null; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drag?.moved) finish(false); });
  // the click that ends a drag is not a visit to the chat
  list.addEventListener('click', (e) => { if (performance.now() - droppedAt < 300) { e.preventDefault(); e.stopPropagation(); } }, true);

  // keyboard: Alt with the up or down arrow moves the focused chat one place
  list.addEventListener('keydown', (e) => {
    if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    const li = e.target.closest('li');
    if (!li || li.parentElement !== list) return;
    e.preventDefault();
    const other = e.key === 'ArrowUp' ? li.previousElementSibling : li.nextElementSibling;
    if (!other) return;
    if (e.key === 'ArrowUp') list.insertBefore(li, other); else list.insertBefore(other, li);
    li.querySelector('.sb-row').focus();
    say(`${titleOf(li)} moved to position ${[...list.children].indexOf(li) + 1} of ${list.children.length}`);
  });
}

// a cut-off title slides at a constant speed to its end and back while the row is hovered or focused, then eases home.
// A small fade sits on each edge only while text is hidden past it, so the first and last letters are crisp when they
// are fully in view: the left fade grows as the line leaves its start, the right one shrinks as its end arrives.
function marquee(row) {
  const box = row.querySelector('.sb-title'), text = box?.querySelector('.sb-title-in');
  if (!text) return;
  let timer = 0, raf = 0, on = false, tx = 0, dist = 0, fade = 0;

  function paint() {
    text.style.transform = tx ? `translateX(${tx.toFixed(2)}px)` : '';
    box.style.setProperty('--fade-l', `${Math.min(fade, -tx).toFixed(2)}px`);
    box.style.setProperty('--fade-r', `${Math.min(fade, dist + tx).toFixed(2)}px`);
  }

  function run() {
    const travel = (dist / MARQUEE.speed) * 1000, hold = MARQUEE.hold, period = 2 * (travel + hold);
    const t0 = performance.now();
    const step = (now) => {
      // out, hold at the end, back, hold at the start; linear between holds
      const t = (now - t0) % period;
      tx = t < travel ? -dist * (t / travel)
        : t < travel + hold ? -dist
          : t < 2 * travel + hold ? -dist * (1 - (t - travel - hold) / travel)
            : 0;
      paint();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function start() {
    on = true;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    if (REDUCED || box.scrollWidth <= box.clientWidth) return;
    timer = setTimeout(() => {
      if (!on) return;
      box.classList.add('is-marquee');
      fade = parseFloat(getComputedStyle(row).columnGap) || 0;
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

  row.addEventListener('pointerenter', start);
  row.addEventListener('pointerleave', stop);
  row.addEventListener('focus', start);
  row.addEventListener('blur', stop);
  row.addEventListener('sb-dragstart', stop);
  // with reduced motion the whole title is one hover away as a tooltip instead
  if (REDUCED && box.scrollWidth > box.clientWidth) row.title = text.textContent;
}

let hintCount = 0;

export function enhanceSidebar(sb) {
  const live = Object.assign(document.createElement('p'), { className: 'sb-vh' });
  live.setAttribute('aria-live', 'polite');
  const hint = Object.assign(document.createElement('p'), { className: 'sb-vh', id: `sb-sort-hint-${++hintCount}`, textContent: 'Drag to reorder, or press Alt with the up or down arrow.' });
  sb.append(live, hint);
  const say = (msg) => { live.textContent = msg; };
  for (const list of sb.querySelectorAll('.sb-scroll .sb-list')) {
    if (!list.querySelector('.sb-row')) continue;
    sortable(list, say);
    for (const a of list.querySelectorAll('.sb-row')) a.setAttribute('aria-describedby', hint.id);
  }
  for (const row of sb.querySelectorAll('.sb-row')) marquee(row);
}
