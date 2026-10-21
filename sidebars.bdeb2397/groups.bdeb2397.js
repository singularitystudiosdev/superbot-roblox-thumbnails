// Groups of chats: a row's "•••" opens its menu (New group, Move to a group, Remove from group; on a group: Rename,
// Ungroup), a dialog names a new group or renames one, and a group's row folds its list. The menu and the dialog live
// in the top layer, drawn at the sidebar's on-screen scale so they read as part of it; the spot's own keys (space, R,
// the arrows) never reach them.
import { esc, lu, group as groupHTML } from './parts.bdeb2397.js';

const scaleOf = (node) => node.getBoundingClientRect().height / node.offsetHeight || 1;
const nameOf = (g) => g.querySelector('.sb-ghead .sb-title-in').textContent;
const titleOf = (li) => li.querySelector('.sb-title-in').textContent;
const fromHTML = (html) => { const t = document.createElement('template'); t.innerHTML = html; return t.content.firstElementChild; };

// one dialog for the page: a heading, a name field, Cancel and the action. Resolves with the name, or null if
// dismissed. Cancel is a plain button so Enter in the field always means the action.
let dialog = null;
function nameDialog() {
  if (dialog) return dialog;
  dialog = fromHTML(`<dialog class="sb-dialog" aria-labelledby="sb-dialog-title">
    <form method="dialog" class="sb-dialog-form">
      <h2 class="sb-dialog-title" id="sb-dialog-title"></h2>
      <label class="sb-field"><span>Name</span><input name="name" autocomplete="off" maxlength="60" placeholder="New group"></label>
      <div class="sb-dialog-actions"><button class="sb-btn-ghost" type="button">Cancel</button><button class="sb-btn-primary" value="ok"></button></div>
    </form>
  </dialog>`);
  dialog.querySelector('.sb-btn-ghost').addEventListener('click', () => dialog.close(''));
  // a press on the backdrop (the dialog element itself, outside its form) dismisses it
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(''); });
  dialog.addEventListener('keydown', (e) => e.stopPropagation());
  document.body.append(dialog);
  return dialog;
}

function askName({ heading, action, value = '', k }) {
  const dlg = nameDialog();
  dlg.querySelector('.sb-dialog-title').textContent = heading;
  dlg.querySelector('.sb-btn-primary').textContent = action;
  const input = dlg.querySelector('input');
  input.value = value;
  dlg.style.setProperty('--k', k);
  dlg.returnValue = '';
  dlg.showModal();
  input.select();
  return new Promise((resolve) => {
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok' ? input.value.trim() || input.placeholder : null), { once: true });
  });
}

// `say` announces to screen readers; `init(host)` gives a new group's row the title fade and scroll; `changed()` runs
// after any change to what is in which group
export function setupGroups(sb, { say, init, changed }) {
  const menu = fromHTML('<div class="sb-menu" popover="auto" role="menu"></div>');
  menu.addEventListener('keydown', (e) => e.stopPropagation());
  document.body.append(menu);
  let opener = null, actions = [], closed = { at: -Infinity, by: null };

  const close = (refocus) => { if (menu.matches(':popover-open')) menu.hidePopover(); if (refocus) opener?.focus(); };
  menu.addEventListener('toggle', (e) => {
    if (e.newState !== 'closed') return;
    opener?.setAttribute('aria-expanded', 'false');
    closed = { at: performance.now(), by: opener };
  });

  function openMenu(btn) {
    opener = btn;
    const host = btn.closest('.sb-item');
    const g = host.classList.contains('sb-ghead') ? host.closest('.sb-group') : null;
    actions = g ? groupActions(g) : chatActions(host);
    menu.innerHTML = actions.map((a, i) => `<button class="sb-menu-item" type="button" role="menuitem" tabindex="-1" data-i="${i}">${lu(a.icon)}<span>${esc(a.label)}</span></button>`).join('');
    const k = scaleOf(sb), r = btn.getBoundingClientRect();
    menu.style.setProperty('--k', k);
    menu.showPopover();
    // under the button, kept on screen; above it when there is no room below
    const w = menu.offsetWidth * k, h = menu.offsetHeight * k, gap = 4 * k;
    menu.style.left = `${Math.max(8, Math.min(r.left, innerWidth - w - 8))}px`;
    menu.style.top = `${r.bottom + gap + h > innerHeight ? r.top - gap - h : r.bottom + gap}px`;
    btn.setAttribute('aria-expanded', 'true');
    menu.querySelector('.sb-menu-item').focus();
  }

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.sb-menu-item');
    if (!item) return;
    const run = actions[Number(item.dataset.i)].run;
    close(false);
    run();
  });
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll('.sb-menu-item')];
    const at = items.indexOf(document.activeElement);
    const go = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 }[e.key];
    if (go !== undefined) { e.preventDefault(); items[(go + items.length) % items.length].focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close(false);
  });

  function chatActions(li) {
    const mine = li.closest('.sb-group');
    return [
      { label: 'New group', icon: 'folderPlus', run: () => newGroup(li) },
      ...[...sb.querySelectorAll('.sb-group')].filter((g) => g !== mine).map((g) => ({ label: `Move to ${nameOf(g)}`, icon: 'folderInput', run: () => moveInto(li, g) })),
      ...(mine ? [{ label: 'Remove from group', icon: 'folderMinus', run: () => removeFrom(li) }] : []),
    ];
  }
  const groupActions = (g) => [
    { label: 'Rename group', icon: 'pencil', run: () => rename(g) },
    { label: 'Ungroup', icon: 'folderMinus', run: () => ungroup(g) },
  ];

  async function newGroup(li) {
    const name = await askName({ heading: 'New group', action: 'Create group', k: scaleOf(sb) });
    if (name === null) { opener?.focus(); return; }
    const g = fromHTML(groupHTML(name));
    const mine = li.closest('.sb-group');
    // the group takes the chat's place; a chat already in a group starts the new one just under that group
    if (mine) mine.after(g); else li.before(g);
    g.querySelector('.sb-group-list').append(li);
    init(g.querySelector('.sb-ghead'));
    changed();
    say(`Created the group ${name} with ${titleOf(li)}`);
    g.querySelector('.sb-group-row').focus();
  }

  function moveInto(li, g) {
    g.querySelector('.sb-group-list').append(li);
    changed();
    say(`${titleOf(li)} moved to ${nameOf(g)}`);
    opener?.focus();
  }

  function removeFrom(li) {
    const g = li.closest('.sb-group');
    g.after(li);
    changed();
    say(`${titleOf(li)} removed from ${nameOf(g)}`);
    li.querySelector('.sb-row').focus();
  }

  async function rename(g) {
    const name = await askName({ heading: 'Rename group', action: 'Save', value: nameOf(g), k: scaleOf(sb) });
    if (name !== null) {
      g.querySelector('.sb-ghead .sb-title-in').textContent = name;
      g.querySelector('.sb-group-list').setAttribute('aria-label', name);
      g.querySelector('.sb-ghead .sb-more').setAttribute('aria-label', `More options for the group ${name}`);
      say(`Group renamed to ${name}`);
    }
    opener?.focus();
  }

  function ungroup(g) {
    const name = nameOf(g), first = g.querySelector('.sb-group-list > li.sb-item');
    g.before(...g.querySelector('.sb-group-list').children);
    g.remove();
    changed();
    say(`Ungrouped ${name}`);
    first?.querySelector('.sb-row').focus();
  }

  sb.addEventListener('click', (e) => {
    const more = e.target.closest('.sb-more');
    if (more) {
      e.preventDefault();
      // a second press on the same "•••" closes its menu: the press itself already light-dismissed it
      if (closed.by === more && performance.now() - closed.at < 300) return;
      openMenu(more);
      return;
    }
    // a group's row folds and unfolds its list
    const head = e.target.closest('.sb-group-row');
    if (head) {
      const open = head.getAttribute('aria-expanded') !== 'true';
      head.setAttribute('aria-expanded', String(open));
      document.getElementById(head.getAttribute('aria-controls')).hidden = !open;
    }
  });
}
