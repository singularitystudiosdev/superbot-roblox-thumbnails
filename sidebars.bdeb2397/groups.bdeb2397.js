// Groups of chats, and the "•••" menus that manage them. A chat's menu: New group (inside the group the chat is in, if
// any), Move to group (a picker you search by name), Remove from group, and Delete chat. A group's menu: Rename group, Ungroup. One dialog names a group or
// confirms a delete; a group's row folds its list. The menu and the dialog live in the top layer, drawn at the
// sidebar's on-screen scale so they read as part of it; the spot's own keys (space, R, the arrows) never reach them.
import { esc, lu, group as groupHTML } from './parts.bdeb2397.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLLAPSE = 150; // ms, tokens --d-hover: a deleted chat's row folding away

const scaleOf = (node) => node.getBoundingClientRect().height / node.offsetHeight || 1;
const nameOf = (g) => g.querySelector('.sb-ghead .sb-title-in').textContent;
const titleOf = (li) => li.querySelector('.sb-title-in').textContent;
const fromHTML = (html) => { const t = document.createElement('template'); t.innerHTML = html; return t.content.firstElementChild; };

// one dialog for the page: a heading, an optional line of text, an optional name field, Cancel and the action (red
// for a delete). Resolves with the name (a field), true (no field), or null if dismissed. Cancel is a plain button,
// so Enter always means the action.
let dialog = null;
function theDialog() {
  if (dialog) return dialog;
  dialog = fromHTML(`<dialog class="sb-dialog" aria-labelledby="sb-dialog-title" aria-describedby="sb-dialog-body">
    <form method="dialog" class="sb-dialog-form">
      <h2 class="sb-dialog-title" id="sb-dialog-title"></h2>
      <p class="sb-dialog-body" id="sb-dialog-body"></p>
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

function ask({ heading, body = '', field = false, value = '', action, danger = false, k }) {
  const dlg = theDialog();
  dlg.querySelector('.sb-dialog-title').textContent = heading;
  const p = dlg.querySelector('.sb-dialog-body');
  p.textContent = body;
  p.hidden = !body;
  const label = dlg.querySelector('.sb-field'), input = label.querySelector('input'), go = dlg.querySelector('.sb-btn-primary');
  label.hidden = !field;
  input.disabled = !field;
  input.value = value;
  go.textContent = action;
  go.classList.toggle('is-danger', danger);
  dlg.style.setProperty('--k', k);
  dlg.returnValue = '';
  dlg.showModal();
  if (field) input.select(); else go.focus();
  return new Promise((resolve) => {
    dlg.addEventListener('close', () => {
      if (dlg.returnValue !== 'ok') resolve(null);
      else resolve(field ? input.value.trim() || input.placeholder : true);
    }, { once: true });
  });
}

// `say` announces to screen readers; `init(host)` gives a new group's row the title fade and scroll; `changed()` runs
// after any change to what is in which group
export function setupGroups(sb, { say, init, changed }) {
  const menu = fromHTML('<div class="sb-menu" popover="auto" role="menu"></div>');
  menu.addEventListener('keydown', (e) => e.stopPropagation());
  document.body.append(menu);
  let opener = null, actions = [], pressedOpen = false;

  const close = (refocus) => { if (menu.matches(':popover-open')) menu.hidePopover(); if (refocus) opener?.focus(); };
  menu.addEventListener('beforetoggle', (e) => { if (e.newState === 'closed') opener?.setAttribute('aria-expanded', 'false'); });
  // a press on the "•••" whose menu is open is a close: the menu light-dismisses itself on pointerup, so note at
  // pointerdown, before that, whether this button's menu was the open one, and let the click that follows do nothing
  addEventListener('pointerdown', (e) => {
    const more = e.target.closest?.('.sb-more');
    pressedOpen = !!more && more === opener && menu.matches(':popover-open');
  }, true);

  // under the button, kept on screen; above it when there is no room below. Run again when the menu changes size.
  function place() {
    const k = scaleOf(sb), r = opener.getBoundingClientRect();
    const w = menu.offsetWidth * k, h = menu.offsetHeight * k, gap = 4 * k;
    menu.style.left = `${Math.max(8, Math.min(r.left, innerWidth - w - 8))}px`;
    menu.style.top = `${r.bottom + gap + h > innerHeight ? Math.max(8, r.top - gap - h) : r.bottom + gap}px`;
  }

  const itemHTML = (a, i, role = 'menuitem') => `${a.sep ? '<hr class="sb-menu-sep" role="separator">' : ''}<button class="sb-menu-item${a.danger ? ' is-danger' : ''}" type="button"${role ? ` role="${role}"` : ''} tabindex="-1" data-i="${i}">${lu(a.icon)}<span>${esc(a.label)}</span>${a.count === undefined ? '' : `<span class="sb-menu-count">${a.count}</span>`}</button>`;

  function openMenu(btn) {
    opener = btn;
    const host = btn.closest('.sb-item');
    const g = host.classList.contains('sb-ghead') ? host.closest('.sb-group') : null;
    actions = g ? groupActions(g) : chatActions(host);
    menu.setAttribute('role', 'menu');
    menu.removeAttribute('aria-label');
    menu.innerHTML = actions.map((a, i) => itemHTML(a, i)).join('');
    menu.style.setProperty('--k', scaleOf(sb));
    menu.showPopover();
    place();
    btn.setAttribute('aria-expanded', 'true');
    menu.querySelector('.sb-menu-item').focus();
  }

  // Move to group: the menu turns into a picker, a search field over the groups this chat could join
  function openPicker(li) {
    const mine = li.closest('.sb-group');
    const groups = [...sb.querySelectorAll('.sb-group')].filter((g) => g !== mine);
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'Move to group');
    menu.innerHTML = `<label class="sb-menu-search">${lu('search')}<input type="search" placeholder="Search groups" aria-label="Search groups" autocomplete="off"></label><div class="sb-menu-list"></div><p class="sb-menu-empty" hidden>No group by that name.</p>`;
    const input = menu.querySelector('input'), list = menu.querySelector('.sb-menu-list'), empty = menu.querySelector('.sb-menu-empty');
    const draw = () => {
      const q = input.value.trim();
      const hits = groups.filter((g) => nameOf(g).toLowerCase().includes(q.toLowerCase()));
      actions = hits.map((g) => ({ label: nameOf(g), icon: 'folder', count: g.querySelectorAll('.sb-group-list > li.sb-item').length, run: () => moveInto(li, g) }));
      // nothing matches: one sentence, and one way on, a new group by the name typed
      if (!hits.length && q) actions.push({ label: `New group “${q}”`, icon: 'folderPlus', run: () => newGroup(li, q) });
      list.innerHTML = actions.map((a, i) => itemHTML(a, i, '')).join('');
      empty.hidden = hits.length > 0;
    };
    input.addEventListener('input', () => { draw(); place(); });
    draw();
    place();
    input.focus();
  }

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.sb-menu-item');
    if (!item) return;
    const a = actions[Number(item.dataset.i)];
    if (!a.keep) close(false);
    a.run();
  });
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll('.sb-menu-item')];
    const search = menu.querySelector('.sb-menu-search input');
    const at = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
    if (e.key === 'Tab') { close(false); return; }
    if (document.activeElement === search) {
      // the field: down into the list, Enter takes the first match
      if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); items[0].focus(); }
      if (e.key === 'Enter' && items.length) { e.preventDefault(); items[0].click(); }
      return;
    }
    if (search && e.key === 'ArrowUp' && at === 0) { e.preventDefault(); search.focus(); return; }
    const go = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 }[e.key];
    if (go !== undefined && items.length) { e.preventDefault(); items[(go + items.length) % items.length].focus(); }
  });

  function chatActions(li) {
    const mine = li.closest('.sb-group');
    const others = [...sb.querySelectorAll('.sb-group')].some((g) => g !== mine);
    return [
      { label: 'New group', icon: 'folderPlus', run: () => newGroup(li) },
      ...(others ? [{ label: 'Move to group', icon: 'folderInput', keep: true, run: () => openPicker(li) }] : []),
      ...(mine ? [{ label: 'Remove from group', icon: 'folderMinus', run: () => removeFrom(li) }] : []),
      { label: 'Delete chat', icon: 'trash', danger: true, sep: true, run: () => deleteChat(li) },
    ];
  }
  const groupActions = (g) => [
    { label: 'Rename group', icon: 'pencil', run: () => rename(g) },
    { label: 'Ungroup', icon: 'folderMinus', run: () => ungroup(g) },
  ];

  async function newGroup(li, preset = null) {
    const name = preset ?? await ask({ heading: 'New group', field: true, action: 'Create group', k: scaleOf(sb) });
    if (name === null) { opener?.focus(); return; }
    const g = fromHTML(groupHTML(name));
    // the group takes the chat's place, so a chat already in a group starts the new one inside that group
    li.before(g);
    g.querySelector('.sb-group-list').append(li);
    init(g.querySelector('.sb-ghead'));
    changed();
    say(`Created the group ${name} with ${titleOf(li)}`);
    g.querySelector('.sb-group-row').focus();
  }

  function moveInto(li, g) {
    g.querySelector('.sb-group-list').append(li);
    close(false);
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

  async function deleteChat(li) {
    const title = titleOf(li);
    const ok = await ask({ heading: 'Delete chat?', body: `“${title}” and everything in it will be deleted.`, action: 'Delete', danger: true, k: scaleOf(sb) });
    if (!ok) { opener?.focus(); return; }
    // focus goes to the chat that takes its place, or the one before it
    const next = (li.nextElementSibling ?? li.previousElementSibling)?.querySelector('.sb-row');
    // whoever shows the chat (chatview.bdeb2397.js) hears it is going before its row does
    sb.dispatchEvent(new CustomEvent('sb-delete', { detail: { id: li.querySelector('a.sb-row').getAttribute('href').slice(1) } }));
    const gone = () => { li.remove(); changed(); say(`Deleted ${title}`); next?.focus(); };
    if (REDUCED) { gone(); return; }
    li.style.overflow = 'hidden';
    li.animate([{ height: `${li.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: COLLAPSE, easing: 'cubic-bezier(0.2, 0, 0, 1)' }).onfinish = gone;
  }

  async function rename(g) {
    const name = await ask({ heading: 'Rename group', field: true, value: nameOf(g), action: 'Save', k: scaleOf(sb) });
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
      if (pressedOpen) { pressedOpen = false; close(false); return; }
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
