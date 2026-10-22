// A modal over Settings (Billing's Buy credits and auto-reload, settings-billing.bdeb2397.js; its billing address and
// Add payment method, settings-pay.8a3994ee.js), drawn at Settings' scale (settings.854d0793.css .st-modal): its title,
// × and description over what it asks. Given `actions`, its error sits between the fields and them; `cls` sizes it.
import { esc, lu } from './parts.bdeb2397.js';

export const modalHTML = (id, desc, body, { title = '', actions = '', cls = '' } = {}) => `<dialog class="st-modal${cls ? ` ${cls}` : ''}" id="st-${id}" tabindex="-1" aria-labelledby="st-${id}-h"${desc ? ` aria-describedby="st-${id}-d"` : ''}>
    <form class="st-modal-form st-${id}" novalidate>
      <h3 class="st-modal-h" id="st-${id}-h">${esc(title)}</h3>
      <button class="st-close sb-tool st-modal-x" type="button" aria-label="Close">${lu('x')}</button>
      ${desc ? `<p class="st-hint st-modal-d" id="st-${id}-d">${esc(desc)}</p>` : ''}
      ${body}
      <p class="st-error" role="alert" hidden></p>
      ${actions}
    </form>
  </dialog>`;

// closed by Cancel, its ×, Escape or a press on its backdrop, its error cleared and focus back on `opener`
export function wireShut(dlg, opener) {
  const shut = () => dlg.close();
  dlg.querySelector('.st-modal-x').addEventListener('click', shut);
  dlg.querySelector('.st-cancel').addEventListener('click', shut);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) shut(); });
  dlg.addEventListener('close', () => { dlg.querySelector('.st-error').hidden = true; opener.focus(); });
}

// a modal's form says what is wrong and puts focus on the field to fix
export function fail(form, text, field) {
  const e = form.querySelector('.st-error');
  e.textContent = text;
  e.hidden = false;
  (typeof field === 'string' ? form.elements[field] : field).focus();
}
