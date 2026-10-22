// Settings, from the sidebar's gear or its name: Profile (photo, name, what superbot calls you, email), My Automations
// (my-automations.6c0fd59e.js), Notifications and Billing (settings-billing.bdeb2397.js), one section at a time beside a
// list of them.
// A modal dialog in the top layer, drawn at the sidebar's on-screen scale as its other dialog is (groups.bdeb2397.css
// .sb-dialog); Escape, the close button or a press outside closes it. Everything is kept in this tab only
// (store.854d0793.js): no email is sent, no payment taken.
import { esc, lu, fx } from './parts.bdeb2397.js';
import { ACCOUNT } from './chats.bdeb2397.js';
import { NOTIFICATIONS } from './settings-data.bdeb2397.js';
import { billingHTML, wireBilling } from './settings-billing.bdeb2397.js';
import { myAutomationsHTML, wireMyAutomations } from './my-automations.6c0fd59e.js';
import { state, save, onChange } from './store.854d0793.js';
import { scaleOf } from './popover.854d0793.js';
import { photoURL } from './sidebar-tools.854d0793.js';
import { photoCropHTML, wirePhotoCrop } from './photo-crop.9e39bc12.js';
import { BIT_COLORS, BURST_LIFE, DRAG, GRAV } from './feed.bdeb2397.js';
import { seg, REDUCED } from '../lib.af4c3c6b.js';

// each section wears a Fluent 3D icon (FX, chats.bdeb2397.js), as the sidebar's rows do
const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: 'bust_in_silhouette' },
  { id: 'automations', label: 'My Automations', icon: 'rocket' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'billing', label: 'Billing', icon: 'card' },
];
const PHOTO = 256; // px: a new photo is cropped square in its editor (photo-crop.9e39bc12.js) and kept at this size
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fromHTML = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const switchHTML = (id, label, desc, key, icon = '') => `<div class="st-setting">${icon}<div class="st-grow"><p class="st-label" id="st-${id}-l">${esc(label)}</p><p class="st-hint" id="st-${id}-d">${esc(desc)}</p></div><button class="st-switch-btn" type="button" role="switch" aria-labelledby="st-${id}-l" aria-describedby="st-${id}-d" ${key}><i></i></button></div>`;

// a save that lands reads Saved on its button for a beat and fires the Activity tab's breakthrough confetti
// (feed.bdeb2397.js) off the button's top edge: its colors and bits, flung up and out, slowed by its drag, pulled down
// by its gravity and fading at its end, in the dialog's --ref px
const SAVED_HOLD = 1800; // ms the button reads Saved before it settles back to Save
const SAVE_BITS = 18;
let burstFrame = 0;
function confetti(fx) {
  cancelAnimationFrame(burstFrame);
  fx.replaceChildren();
  if (REDUCED) return;
  const ref = parseFloat(getComputedStyle(fx).getPropertyValue('--ref')) || 1;
  const bits = Array.from({ length: SAVE_BITS }, (_, j) => {
    const a = ((-160 + 140 * Math.random()) * Math.PI) / 180, v = (80 + 90 * Math.random()) * ref;
    const el = document.createElement('i');
    el.className = j % 3 === 0 ? 'st-bit st-dot' : 'st-bit';
    el.style.background = BIT_COLORS[j % BIT_COLORS.length];
    el.style.left = `${(15 + 70 * Math.random()).toFixed(1)}%`;
    fx.append(el);
    return { el, vx: v * Math.cos(a), vy: v * Math.sin(a), spin: (Math.random() - 0.5) * 900 };
  });
  const t0 = performance.now();
  const paint = (now) => {
    const bt = (now - t0) / 1000;
    if (bt >= BURST_LIFE) { fx.replaceChildren(); return; }
    const e = (1 - Math.exp(-DRAG * bt)) / DRAG, fall = 0.5 * GRAV * ref * bt * bt;
    for (const b of bits) {
      b.el.style.opacity = (1 - seg(bt, 0.55, BURST_LIFE)).toFixed(3);
      b.el.style.transform = `translate(${(b.vx * e).toFixed(2)}px, ${(b.vy * e + fall).toFixed(2)}px) rotate(${(b.spin * bt).toFixed(1)}deg)`;
    }
    burstFrame = requestAnimationFrame(paint);
  };
  burstFrame = requestAnimationFrame(paint);
}

const profileHTML = () => `<h3 class="st-title" id="st-profile-h">Profile</h3>
  <form class="st-profile" novalidate>
    <div class="st-photo">
      <img class="st-avatar" src="" alt="Your profile photo" width="56" height="56">
      <div class="st-grow">
        <div class="st-photo-acts"><button class="sb-btn-ghost st-photo-pick" type="button">${lu('camera', 'sb-lu')}Change photo</button><button class="st-link st-photo-reset" type="button" hidden>Use the original</button></div>
        <p class="st-hint">A JPG, PNG or WebP. You can move and zoom it to fit the circle.</p>
      </div>
      <input class="st-photo-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
    </div>
    <label class="st-field"><span>Username</span><input name="name" autocomplete="username" maxlength="40"></label>
    <label class="st-field"><span>What should ouroboro call you?</span><input name="callMe" autocomplete="nickname" maxlength="30"></label>
    <label class="st-field st-wide"><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="80"></label>
    <p class="st-error st-wide" role="alert" hidden></p>
    <div class="st-actions st-wide"><button class="sb-btn-ghost st-revert" type="button" disabled>Cancel</button><button class="sb-btn-primary st-save" type="submit" disabled><span class="st-save-l"><span>Save</span><span aria-hidden="true">Saved</span></span><span class="st-fx" aria-hidden="true"></span></button></div>
  </form>
  <p class="st-vh" role="status"></p>
  ${photoCropHTML()}`;

function wireProfile(panel) {
  const form = panel.querySelector('form'), img = panel.querySelector('.st-avatar'), file = panel.querySelector('.st-photo-file');
  const error = panel.querySelector('.st-error'), status = panel.querySelector('[role="status"]');
  const reset = panel.querySelector('.st-photo-reset');
  const saveBtn = panel.querySelector('.st-save'), fx = panel.querySelector('.st-fx');
  const crop = wirePhotoCrop(panel.querySelector('.st-crop'), PHOTO);
  let photo = state.profile.photo, savedTimer = 0;
  const fields = ['name', 'callMe', 'email'];
  const dirty = () => photo !== state.profile.photo || fields.some((f) => form.elements[f].value.trim() !== state.profile[f]);
  const unsave = () => { clearTimeout(savedTimer); saveBtn.classList.remove('is-saved'); };
  // an edit after a save takes the button straight back to Save
  const paintDirty = () => { const d = dirty(); if (d) unsave(); saveBtn.disabled = !d; panel.querySelector('.st-revert').disabled = !d; };
  function paintPhoto() { img.src = photoURL(photo); reset.hidden = photo === ACCOUNT.avatar; paintDirty(); }
  function fill() {
    for (const f of fields) form.elements[f].value = state.profile[f];
    photo = state.profile.photo;
    error.hidden = true;
    paintPhoto();
  }
  const fail = (text, field) => { error.textContent = text; error.hidden = false; form.elements[field].focus(); };

  panel.querySelector('.st-photo-pick').addEventListener('click', () => file.click());
  // a picked photo opens in its editor; closed without Apply, the photo stays as it was
  file.addEventListener('change', async () => {
    const f = file.files[0];
    file.value = '';
    if (!f) return;
    let cropped;
    try {
      cropped = await crop.edit(f, panel.querySelector('.st-photo-pick'));
    } catch (e) {
      console.error(new Error(`the photo ${f.name} could not be read`, { cause: e }));
      error.textContent = 'That file could not be read as a photo. Try a JPG or PNG.';
      error.hidden = false;
      return;
    }
    if (!cropped) return;
    photo = cropped;
    error.hidden = true;
    paintPhoto();
    status.textContent = 'New photo ready. Save to use it.';
  });
  reset.addEventListener('click', () => { photo = ACCOUNT.avatar; paintPhoto(); panel.querySelector('.st-photo-pick').focus(); });
  form.addEventListener('input', paintDirty);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = Object.fromEntries(fields.map((f) => [f, form.elements[f].value.trim()]));
    if (!v.name) return fail('Enter your name. It shows in the sidebar.', 'name');
    if (!EMAIL.test(v.email)) return fail('Enter an email address like you@example.com.', 'email');
    error.hidden = true;
    Object.assign(state.profile, v, { photo });
    save('profile');
    fill();
    unsave();
    saveBtn.classList.add('is-saved');
    savedTimer = setTimeout(unsave, SAVED_HOLD);
    confetti(fx);
    status.textContent = 'Saved.';
  });
  panel.querySelector('.st-revert').addEventListener('click', () => { fill(); status.textContent = 'Changes discarded.'; });
  fill();
  return { reset: () => { fill(); unsave(); cancelAnimationFrame(burstFrame); fx.replaceChildren(); status.textContent = ''; } };
}

const notifyHTML = () => `<h3 class="st-title" id="st-notifications-h">Notifications</h3>
  <p class="st-hint st-lead">Each chat has a bell beside its message box: on, that chat notifies you when it has news.</p>
  ${NOTIFICATIONS.map((n) => switchHTML(`n-${n.id}`, n.label, n.desc, `data-notify="${n.id}"`, fx(n.fx, 'st-ic'))).join('')}
  <p class="st-status" role="status"></p>`;

function wireNotify(panel) {
  const status = panel.querySelector('.st-status');
  const paint = () => { for (const b of panel.querySelectorAll('[data-notify]')) b.setAttribute('aria-checked', String(state.notify[b.dataset.notify])); };
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-notify]');
    if (!b) return;
    const n = NOTIFICATIONS.find((x) => x.id === b.dataset.notify);
    state.notify[n.id] = !state.notify[n.id];
    save('notify');
    paint();
    status.textContent = `${n.label} turned ${state.notify[n.id] ? 'on' : 'off'}.`;
  });
  paint();
  return { reset: () => { paint(); status.textContent = ''; } };
}

let dialog = null, parts = null;
function build(sb) {
  dialog = fromHTML(`<dialog class="st" aria-labelledby="st-h">
    <div class="st-shell">
      <nav class="st-nav" aria-label="Settings sections"><h2 class="st-h" id="st-h">Settings</h2>
        ${SECTIONS.map((s) => `<button class="st-tab" type="button" data-sec="${s.id}">${fx(s.icon)}<span>${s.label}</span></button>`).join('')}
      </nav>
      <div class="st-pane">
        <button class="st-close sb-tool" type="button" aria-label="Close settings">${lu('x')}</button>
        <section class="st-sec" data-sec="profile" aria-labelledby="st-profile-h">${profileHTML()}</section>
        <section class="st-sec" data-sec="automations" aria-labelledby="st-automations-h">${myAutomationsHTML()}</section>
        <section class="st-sec" data-sec="notifications" aria-labelledby="st-notifications-h">${notifyHTML()}</section>
        <section class="st-sec" data-sec="billing" aria-labelledby="st-billing-h">${billingHTML()}</section>
      </div>
    </div>
  </dialog>`);
  document.body.append(dialog);
  const sec = (id) => dialog.querySelector(`.st-sec[data-sec="${id}"]`);
  parts = {
    profile: wireProfile(sec('profile')),
    automations: wireMyAutomations(sec('automations'), sb),
    notifications: wireNotify(sec('notifications')),
    billing: wireBilling(sec('billing'), state.billing, () => save('billing')),
  };
  // credits spent while it is open (a chat at work) count down in Billing too
  onChange((part) => {
    if (part === 'billing') parts.billing.spent();
  });
  dialog.querySelector('.st-nav').addEventListener('click', (e) => { const t = e.target.closest('.st-tab'); if (t) show(t.dataset.sec); });
  dialog.querySelector('.st-close').addEventListener('click', () => dialog.close());
  // a press on the backdrop (the dialog itself, outside its shell) closes it
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  // its keys stay in it: space and R type into its fields rather than reaching the spot
  dialog.addEventListener('keydown', (e) => e.stopPropagation());
  dialog.addEventListener('close', () => { for (const p of Object.values(parts)) p.reset(); opener?.focus(); });
  dialog.style.setProperty('--k', scaleOf(sb));
}

let opener = null;
function show(id) {
  for (const t of dialog.querySelectorAll('.st-tab')) {
    if (t.dataset.sec === id) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  }
  for (const s of dialog.querySelectorAll('.st-sec')) s.hidden = s.dataset.sec !== id;
  dialog.querySelector('.st-pane').scrollTop = 0;
}

// `sb` sets the scale it is drawn at; `section` the one it opens on (the last one open, Profile at first); `buy` opens
// Billing with Buy credits out (the credits row's Get more credits, sidebar-tools.854d0793.js)
let last = 'profile';
export function openSettings(sb, section = last, { buy = false } = {}) {
  if (!dialog) build(sb);
  last = section;
  opener = document.activeElement;
  dialog.style.setProperty('--k', scaleOf(sb));
  show(section);
  dialog.showModal();
  const first = dialog.querySelector(`.st-sec[data-sec="${section}"] input, .st-sec[data-sec="${section}"] button`);
  (section === 'profile' ? dialog.querySelector('[name="name"]') : first)?.focus();
  if (buy && section === 'billing') parts.billing.buy();
  dialog.addEventListener('close', () => { last = dialog.querySelector('.st-tab[aria-current]').dataset.sec; }, { once: true });
}
