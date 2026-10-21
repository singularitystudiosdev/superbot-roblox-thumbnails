// Dragging a chat to a new place: anywhere in the list, into a group (let go over the group's row, or in its open list)
// or back out of one. The chat lifts into a ghost under the pointer, a gap opens where it would land and the rows
// around it slide to make room; letting go settles it into the gap, Escape puts it back. Works inside a scaled stage:
// every distance written to the page is in the sidebar's own units.
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DRAG_FROM = 4; // px of travel, in the sidebar's units, before a press becomes a drag
const SLIDE = 150; // ms, tokens --d-hover
const EASE = 'cubic-bezier(0.2, 0, 0, 1)'; // tokens --ease-std
const HEAD_EDGE = 0.25; // the top quarter of a group's row drops above the group, the rest into it

const scaleOf = (node) => node.getBoundingClientRect().height / node.offsetHeight || 1;
const shown = (node) => node.offsetParent !== null;

// `moved(li, from)` runs after a drop that changed where the chat is (from: its old list)
export function enableDrag(sb, moved) {
  const scroll = sb.querySelector('.sb-scroll');
  let d = null;
  let droppedAt = -Infinity;

  const chats = () => [...scroll.querySelectorAll('li.sb-item')].filter((li) => li !== d.li && shown(li));
  const heads = () => [...scroll.querySelectorAll('.sb-ghead')].filter(shown);
  const topLists = () => [...scroll.querySelectorAll('.sb-sec > .sb-list')];

  function begin() {
    const k = scaleOf(sb), sbr = sb.getBoundingClientRect(), r = d.li.getBoundingClientRect();
    Object.assign(d, { moved: true, k, sbr, grab: (d.y - r.top) / k, home: d.li.parentElement });
    // the ghost: a copy of the row in a list of its own, over everything, following the pointer
    const wrap = document.createElement('ul');
    wrap.className = 'sb-list sb-ghost';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.append(d.li.cloneNode(true));
    Object.assign(wrap.style, { left: `${(r.left - sbr.left) / k}px`, top: `${(r.top - sbr.top) / k}px`, width: `${d.li.offsetWidth}px` });
    sb.append(wrap);
    d.wrap = wrap;
    // the gap holds the row's place; the row itself waits, hidden, until it is let go
    const gap = document.createElement('li');
    gap.className = 'sb-gap';
    gap.setAttribute('aria-hidden', 'true');
    gap.style.height = `${d.li.offsetHeight}px`;
    d.li.before(gap);
    d.gap = gap;
    d.li.hidden = true;
    sb.setPointerCapture(d.id);
    sb.classList.add('is-dragging');
    d.li.dispatchEvent(new Event('sb-dragstart', { bubbles: true }));
  }

  function mark(group) {
    for (const h of scroll.querySelectorAll('.sb-ghead.is-drop')) if (h.closest('.sb-group') !== group) h.classList.remove('is-drop');
    group?.querySelector('.sb-ghead').classList.add('is-drop');
    d.into = group;
  }

  // where the gap goes for a pointer at screen y: { list, before } (before null = the list's end), plus the group it
  // drops into, if any
  function slotAt(y) {
    // above the list's first row (over its label, the nav, the top bar): the very top of the list, in no group
    const first = topLists()[0];
    const lead = [...first.children].find((n) => n !== d.li && shown(n));
    if (lead && y < lead.getBoundingClientRect().top) return { list: first, before: lead, into: null };
    for (const h of heads()) {
      const r = h.getBoundingClientRect(), g = h.closest('.sb-group');
      if (y >= r.top && y < r.top + r.height * HEAD_EDGE) return { list: g.parentElement, before: g, into: null };
      if (y >= r.top && y <= r.bottom) return { list: g.querySelector('.sb-group-list'), before: null, into: g };
      // an open group with nothing in it yet: its drop hint takes the chat too
      const gl = g.querySelector('.sb-group-list');
      if (shown(gl) && !gl.querySelector('li.sb-item')) {
        const lr = gl.getBoundingClientRect();
        if (y > r.bottom && y <= lr.bottom) return { list: gl, before: null, into: g };
      }
    }
    const items = chats();
    for (const li of items) {
      const r = li.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) {
        const before = y < r.top + r.height / 2 ? li : li.nextElementSibling;
        return { list: li.parentElement, before, into: li.parentElement.closest('.sb-group') };
      }
    }
    const gr = d.gap.isConnected && shown(d.gap) ? d.gap.getBoundingClientRect() : null;
    if (gr && y >= gr.top && y <= gr.bottom) return null;
    // below everything: the end of the list, in no group
    return { list: topLists().at(-1), before: null, into: null };
  }

  function place(y) {
    const slot = slotAt(y);
    if (!slot) return;
    mark(slot.into);
    const { list, before } = slot;
    if (before === d.gap || (d.gap.parentElement === list && d.gap.nextElementSibling === before)) return;
    // FLIP: note where everything is, move the gap, then slide each row from its old place to its new one
    const rows = [...scroll.querySelectorAll('li.sb-item, .sb-ghead, .sb-sec > .sb-head')].filter((n) => n !== d.li && shown(n));
    const was = new Map(rows.map((n) => [n, n.getBoundingClientRect().top]));
    list.insertBefore(d.gap, before);
    if (REDUCED) return;
    for (const n of rows) {
      const dy = (was.get(n) - n.getBoundingClientRect().top) / d.k;
      if (Math.abs(dy) > 0.5) n.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: SLIDE, easing: EASE });
    }
  }

  function end(commit) {
    const { li, gap, wrap, home } = d;
    const ghostTop = wrap.getBoundingClientRect().top;
    if (commit) gap.replaceWith(li); else gap.remove();
    li.hidden = false;
    wrap.remove();
    mark(null);
    sb.classList.remove('is-dragging');
    if (!REDUCED && shown(li)) {
      const dy = (ghostTop - li.getBoundingClientRect().top) / d.k;
      if (Math.abs(dy) > 0.5) li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: SLIDE, easing: EASE });
    }
    const changed = commit && (li.parentElement !== home || d.next !== li.nextElementSibling);
    droppedAt = performance.now();
    d = null;
    if (changed) moved(li, home);
  }

  sb.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || d || e.target.closest('.sb-more, .sb-ghead')) return;
    const li = e.target.closest('.sb-scroll li.sb-item');
    if (!li) return;
    d = { li, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, next: li.nextElementSibling };
  });
  sb.addEventListener('pointermove', (e) => {
    if (!d || e.pointerId !== d.id) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) / scaleOf(sb) < DRAG_FROM) return;
      begin();
    }
    d.wrap.style.top = `${(e.clientY - d.sbr.top) / d.k - d.grab}px`;
    place(e.clientY);
  });
  sb.addEventListener('pointerup', (e) => {
    if (!d || e.pointerId !== d.id) return;
    if (d.moved) end(true); else d = null;
  });
  sb.addEventListener('pointercancel', () => { if (d?.moved) end(false); else d = null; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && d?.moved) end(false); });
  // the click that ends a drag is not a visit to the chat
  sb.addEventListener('click', (e) => { if (performance.now() - droppedAt < 300) { e.preventDefault(); e.stopPropagation(); } }, true);
}
