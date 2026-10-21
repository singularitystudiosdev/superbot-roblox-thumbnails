// Everything a rendered sidebar does under the pointer and keyboard, wired in one place: titles fade and scroll
// (marquee.bdeb2397.js), chats drag to a new place or into a group (drag.bdeb2397.js), the "•••" menus and group
// dialog (groups.bdeb2397.js), and Alt with the up or down arrow moving the focused chat one place. Every change is
// announced in a live region.
import { marquee } from './marquee.bdeb2397.js';
import { enableDrag } from './drag.bdeb2397.js';
import { setupGroups } from './groups.bdeb2397.js';

const titleOf = (li) => li.querySelector('.sb-title-in').textContent;

let hintCount = 0;

export function enhanceSidebar(sb) {
  const live = Object.assign(document.createElement('p'), { className: 'sb-vh' });
  live.setAttribute('aria-live', 'polite');
  const hint = Object.assign(document.createElement('p'), { className: 'sb-vh', id: `sb-sort-hint-${++hintCount}`, textContent: 'Drag to reorder or into a group, or press Alt with the up or down arrow.' });
  sb.append(live, hint);
  const say = (msg) => { live.textContent = msg; };

  // where a chat now sits, in words
  const where = (li) => {
    const g = li.closest('.sb-group');
    const peers = [...li.parentElement.children].filter((n) => n.matches('li.sb-item, li.sb-group'));
    return `${titleOf(li)} moved to position ${peers.indexOf(li) + 1} of ${peers.length}${g ? ` in ${g.querySelector('.sb-ghead .sb-title-in').textContent}` : ''}`;
  };
  const counts = () => {
    for (const g of sb.querySelectorAll('.sb-group')) g.querySelector('.sb-count').textContent = g.querySelectorAll('.sb-group-list > li.sb-item').length;
  };
  const init = (host) => {
    marquee(host);
    host.querySelector('a.sb-row')?.setAttribute('aria-describedby', hint.id);
  };

  for (const host of sb.querySelectorAll('.sb-scroll .sb-item')) init(host);
  enableDrag(sb, (li) => { counts(); say(where(li)); });
  setupGroups(sb, { say, init, changed: counts });

  // keyboard: Alt with the up or down arrow moves the focused chat one place in its list
  sb.addEventListener('keydown', (e) => {
    if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    const li = e.target.closest('.sb-scroll li.sb-item');
    if (!li) return;
    e.preventDefault();
    const other = e.key === 'ArrowUp' ? li.previousElementSibling : li.nextElementSibling;
    if (!other) return;
    if (e.key === 'ArrowUp') other.before(li); else other.after(li);
    li.querySelector('.sb-row').focus();
    say(where(li));
  });
}
