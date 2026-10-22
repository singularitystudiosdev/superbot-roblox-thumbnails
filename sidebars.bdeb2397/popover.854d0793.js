// A popover anchored to the button that opened it, for the composer's menus, the bell's panel and the share box: the
// sidebar's own .sb-menu surface (groups.bdeb2397.css) in the top layer, drawn at the app's on-screen scale. A press on
// its button while it is open closes it, Escape closes it and gives focus back, and the arrows move through its items.
// The spot's own keys (space, R, the arrows) never reach past it.

export const scaleOf = (node) => node.getBoundingClientRect().height / node.offsetHeight || 1;
const fromHTML = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const GAP = 6; // px on screen between the button and the popover
const EDGE = 8; // px it keeps from the window's edges

// `role` is the popover's own (menu, dialog); `scale` the node whose on-screen scale it is drawn at
export function makePopover({ cls = '', role = 'menu', label = '', scale = document.querySelector('.app') } = {}) {
  const el = fromHTML(`<div class="sb-menu ${cls}" popover="auto" role="${role}"${label ? ` aria-label="${label}"` : ''}></div>`);
  document.body.append(el);
  let opener = null, place = 'above-start', ring = 0, pressedOpen = false;
  const closed = new Set();

  el.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
    if (e.key === 'Tab' && role === 'menu') { close(false); return; }
    const items = [...el.querySelectorAll('.sb-menu-item:not([hidden])')];
    const at = items.indexOf(document.activeElement);
    const go = { ArrowDown: at + 1, ArrowUp: at < 0 ? items.length - 1 : at - 1, Home: 0, End: items.length - 1 }[e.key];
    if (go !== undefined && items.length && (role === 'menu' || at >= 0 || e.key === 'ArrowDown')) { e.preventDefault(); items[(go + items.length) % items.length].focus(); }
  });
  el.addEventListener('beforetoggle', (e) => {
    if (e.newState !== 'closed') return;
    opener?.setAttribute('aria-expanded', 'false');
    for (const fn of closed) fn();
  });
  // the popover light-dismisses itself before its button's click lands: note at pointerdown whether this button's
  // popover was the open one, so that click closes rather than opens it again
  addEventListener('pointerdown', (e) => { pressedOpen = !!opener && opener.contains(e.target) && el.matches(':popover-open'); }, true);

  // `place` is above or below, then start, center or end: the button's edge (or middle) the popover lines up with
  function position() {
    const k = scaleOf(scale), r = opener.getBoundingClientRect(), gap = GAP + ring * k;
    const w = el.offsetWidth * k, h = el.offsetHeight * k;
    const [v, hz] = place.split('-');
    let up = v === 'above', top = up ? r.top - gap - h : r.bottom + gap;
    if (up && top < EDGE) { up = false; top = r.bottom + gap; }
    else if (!up && top + h > innerHeight - EDGE) { up = true; top = Math.max(EDGE, r.top - gap - h); }
    const left = hz === 'end' ? r.right - w : hz === 'center' ? r.left + (r.width - w) / 2 : r.left;
    const x = Math.max(EDGE, Math.min(left, innerWidth - w - EDGE)), y = Math.max(EDGE, Math.min(top, innerHeight - h - EDGE));
    // it grows out of its button: the origin is the button's middle on the popover's edge facing it, in the popover's own
    // px; scale(--k) about it moves the box by origin * (1 - k), so left and top take that back
    const ox = Math.max(0, Math.min(el.offsetWidth, (r.left + r.width / 2 - x) / k)), oy = up ? el.offsetHeight : 0;
    el.style.transformOrigin = `${ox}px ${oy}px`;
    el.style.setProperty('--dy', up ? 1 : -1);
    el.style.left = `${x - ox * (1 - k)}px`;
    el.style.top = `${y - oy * (1 - k)}px`;
  }

  // `focus` is what takes focus once it is open: the first item by default; `ring` how far the button's own fill reaches
  // past its box, in the app's px, so the gap is from what is seen
  function open(btn, where = place, { focus = '.sb-menu-item', ring: outset = 0 } = {}) {
    if (pressedOpen && btn === opener) { pressedOpen = false; return false; }
    opener = btn;
    place = where;
    ring = outset;
    el.style.setProperty('--k', scaleOf(scale));
    // a fresh opening lands on its button: the last one's place goes first, or a popover that tweens `left` while open
    // (the effort picker's glide) slides in from wherever it last was; from auto nothing tweens
    if (!el.matches(':popover-open')) { el.style.left = el.style.top = ''; el.showPopover(); }
    position();
    btn.setAttribute('aria-expanded', 'true');
    (focus && el.querySelector(focus))?.focus();
    return true;
  }
  function close(refocus) {
    if (el.matches(':popover-open')) el.hidePopover();
    if (refocus) opener?.focus();
  }
  return { el, open, close, position, isOpen: () => el.matches(':popover-open'), onClose: (fn) => closed.add(fn) };
}

// a menu's row: its lucide icon, its label, an optional line under it and an optional trailing slot
export const itemHTML = ({ icon = '', label, sub = '', trail = '', role = 'menuitem', checked, data = '' }) =>
  `<button class="sb-menu-item${sub ? ' has-sub' : ''}" type="button" role="${role}" tabindex="-1"${checked === undefined ? '' : ` aria-checked="${checked}"`} ${data}>${icon}<span class="pm-t"><span>${label}</span>${sub ? `<small>${sub}</small>` : ''}</span>${trail}</button>`;
