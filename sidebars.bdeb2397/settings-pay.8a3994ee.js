// Billing's payment method (settings-billing.bdeb2397.js), laid out as the Anthropic console's: its heading with Edit
// billing address and Add payment method at the end of its line, the billing address under it, then the payment
// methods, the default one first with Update (its card's form opening under it) and each other with Make default and
// Remove. Edit billing address and Add payment method are modals over Settings: the address's fields
// (address.8a3994ee.js), and a card (card.8a3994ee.js, its brand's badge picked as it is typed) or Google Pay. Nothing
// is charged or sent: a card number never leaves its field, only its brand, last four and expiry are kept.
import { esc, fx, lu, asset } from './parts.bdeb2397.js';
import { methodName, primaryOf } from './settings-data.bdeb2397.js';
import { addressHTML, wireAddress, addressLines } from './address.8a3994ee.js';
import { BRANDS, wireCardFields, cardComplete, readCard } from './card.8a3994ee.js';
import { modalHTML, wireShut, fail } from './settings-modal.8a3994ee.js';
import { state as view } from './store.854d0793.js';

const mark = (file) => asset(`./pay/${file}`);
// a method's icon: the card's Fluent 3D card, as the sidebar's rows wear, or Google Pay's own mark
const iconOf = (m) => (m.kind === 'gpay' ? `<img class="st-ic" src="${mark('google-pay-icon.svg')}" alt="" width="20" height="17" draggable="false">` : fx('card', 'st-ic'));
const hintOf = (m) => (m.kind === 'gpay' ? `Pays from ${m.account}` : `Expires ${m.exp}`);
const newId = () => `pm-${Date.now().toString(36)}`;

const cardHTML = () => `<div class="st-grid st-pay-card">
      <label class="st-field st-wide"><span class="st-field-l">Card number</span><span class="st-boxed"><input name="number" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234" maxlength="23"><span class="st-brands">${BRANDS.map((b) => `<img src="${mark(`${b.mark}.svg`)}" alt="${b.name}" width="24" height="16" data-brand="${b.mark}" draggable="false">`).join('')}</span></span></label>
      <label class="st-field"><span class="st-field-l">Expiration date</span><input name="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY" maxlength="7"></label>
      <label class="st-field"><span class="st-field-l">Security code</span><span class="st-boxed"><input name="cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="CVC" maxlength="4">${lu('creditCard', 'st-cvc-ic')}</span></label>
      <label class="st-check st-wide"><input type="checkbox" name="sameAddress" checked><span>Use existing billing address</span></label>
      <div class="st-wide st-new-addr" hidden>${addressHTML('st-addpay')}</div>
    </div>
    <div class="st-gpay" hidden><img src="${mark('google-pay.svg')}" alt="" width="50" height="20" draggable="false"><p class="st-hint st-gpay-d"></p></div>
    <label class="st-check"><input type="checkbox" name="makeDefault" checked><span>Set as default payment method</span></label>`;

export const paymentHTML = () => `<div class="st-pay-head">
    <div class="st-grow"><h4 class="st-label" id="st-pay-h">Payment method</h4><p class="st-hint">Buy credits, the packs and auto-reload charge your default payment method. Invoices go to your billing address.</p></div>
    <div class="st-pay-acts"><button class="sb-btn-ghost st-addr-btn" type="button" aria-haspopup="dialog">Edit billing address</button><button class="sb-btn-primary st-add-btn" type="button" aria-haspopup="dialog">Add payment method</button></div>
  </div>
  <div class="st-addr"><p class="st-hint">Billing address</p><p class="st-addr-lines"></p></div>
  <h5 class="st-hint st-methods-h" id="st-methods-h">Payment methods</h5>
  <div class="st-setting st-pay">
    <span class="st-pay-ic"></span>
    <div class="st-grow"><p class="st-label"><span class="st-card-name"></span><span class="st-tag" hidden>Default</span></p><p class="st-hint st-card-exp"></p></div>
    <button class="sb-btn-ghost st-update" type="button" aria-expanded="false" aria-controls="st-card-form">Update</button>
  </div>
  <form class="st-form st-card-form" id="st-card-form" hidden novalidate>
    <label class="st-field st-wide"><span>Card number</span><input name="number" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234" maxlength="23"></label>
    <label class="st-field"><span>Expires</span><input name="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY" maxlength="7"></label>
    <label class="st-field"><span>CVC</span><input name="cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></label>
    <p class="st-error st-wide" role="alert" hidden></p>
    <div class="st-actions st-wide"><button class="sb-btn-ghost st-card-cancel" type="button">Cancel</button><button class="sb-btn-primary" type="submit">Save card</button></div>
  </form>
  <ul class="st-methods" aria-labelledby="st-methods-h"></ul>
  ${modalHTML('address', '', addressHTML('st-address'), {
    title: 'Edit billing address',
    cls: 'st-modal-w',
    actions: '<div class="st-actions"><button class="sb-btn-ghost st-cancel" type="button">Cancel</button><button class="sb-btn-primary" type="submit">Save</button></div>',
  })}
  ${modalHTML('addpay', '', `<div class="st-tiles" role="radiogroup" aria-label="Payment method type">
      <label class="st-tile"><input class="st-vh" type="radio" name="kind" value="card" checked>${lu('creditCard', 'st-tile-ic')}<span>Card</span></label>
      <label class="st-tile"><input class="st-vh" type="radio" name="kind" value="gpay"><img class="st-tile-gpay" src="${mark('google-pay.svg')}" alt="" width="40" height="16" draggable="false"><span>Google Pay</span></label>
    </div>
    ${cardHTML()}`, {
    title: 'Add payment method',
    cls: 'st-modal-w',
    actions: '<div class="st-actions"><button class="sb-btn-ghost st-cancel" type="button">Cancel</button><button class="sb-btn-primary st-go" type="submit" disabled>Add</button></div>',
  })}`;

// `billing` is Settings' own state, `changed` keeps it, `say` puts a line in Billing's status
export function wirePayment(panel, billing, changed, say) {
  const $ = (s) => panel.querySelector(s);
  const keep = (text) => { changed(); paint(); say(text); };

  function paint() {
    const p = primaryOf(billing), others = billing.methods.filter((m) => m !== p);
    const lines = $('.st-addr-lines');
    lines.classList.toggle('is-none', !billing.address);
    lines.innerHTML = billing.address ? addressLines(billing.address).filter(Boolean).map(esc).join('<br>') : 'None added yet.';
    $('.st-pay-ic').innerHTML = iconOf(p);
    $('.st-card-name').textContent = methodName(p);
    $('.st-card-exp').textContent = hintOf(p);
    $('.st-tag').hidden = !others.length;
    // Google Pay keeps its cards with Google: there is nothing here to update
    update.hidden = p.kind !== 'card';
    if (update.hidden) showCard(false);
    $('.st-methods').innerHTML = others.map((m) => {
      const name = esc(methodName(m));
      return `<li class="st-setting">${iconOf(m)}<div class="st-grow"><p class="st-label">${name}</p><p class="st-hint">${esc(hintOf(m))}</p></div><button class="sb-btn-ghost" type="button" data-make="${m.id}" aria-label="Make ${name} the default">Make default</button><button class="sb-btn-ghost" type="button" data-remove="${m.id}" aria-label="Remove ${name}">Remove</button></li>`;
    }).join('');
  }

  // the default card's own form, opening under its row: its new number, expiry and code replace the old
  const form = $('.st-card-form'), update = $('.st-update');
  const showCard = (open) => {
    form.hidden = !open;
    form.querySelector('.st-error').hidden = true;
    update.setAttribute('aria-expanded', String(open));
  };
  wireCardFields(form);
  update.addEventListener('click', () => { if (!form.hidden) return showCard(false); showCard(true); form.elements.number.focus(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const r = readCard(form);
    if (r.error) return fail(form, r.error, r.field);
    Object.assign(primaryOf(billing), r.card);
    form.reset();
    showCard(false);
    keep(`Card saved: ${methodName(primaryOf(billing))}.`);
    update.focus();
  });
  form.querySelector('.st-card-cancel').addEventListener('click', () => { form.reset(); showCard(false); update.focus(); });

  // the other methods: made the default, or removed (the default is never removed: another is made default first)
  $('.st-methods').addEventListener('click', (e) => {
    const make = e.target.closest('[data-make]'), drop = e.target.closest('[data-remove]');
    const m = billing.methods.find((x) => x.id === (make ?? drop)?.dataset[make ? 'make' : 'remove']);
    if (!m) return;
    if (make) {
      billing.primary = m.id;
      keep(`${methodName(m)} is your default payment method.`);
      (update.hidden ? $('.st-add-btn') : update).focus();
    } else {
      billing.methods = billing.methods.filter((x) => x !== m);
      keep(`${methodName(m)} removed.`);
      $('.st-add-btn').focus();
    }
  });

  // Edit billing address
  const addrDlg = $('#st-address'), addrForm = addrDlg.querySelector('form');
  const addr = wireAddress(addrForm);
  wireShut(addrDlg, $('.st-addr-btn'));
  // none on file yet: every field empty but the country, the US
  $('.st-addr-btn').addEventListener('click', () => { addr.fill(billing.address ?? { country: 'US' }); addrDlg.showModal(); addrDlg.focus(); });
  addrForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const r = addr.read();
    if (r.error) return fail(addrForm, r.error, r.field);
    billing.address = r.address;
    keep('Billing address saved.');
    addrDlg.close();
  });

  // Add payment method: a card, or Google Pay; Add waits until what it needs is filled in
  const addDlg = $('#st-addpay'), addForm = addDlg.querySelector('form'), go = addForm.querySelector('.st-go');
  const newAddr = wireAddress(addForm.querySelector('.st-new-addr'));
  const badges = [...addForm.querySelectorAll('[data-brand]')];
  wireShut(addDlg, $('.st-add-btn'));
  wireCardFields(addForm, (b) => { for (const img of badges) img.hidden = !!b && img.dataset.brand !== b.mark; });
  const kind = () => addForm.elements.kind.value;
  const ownAddress = () => addForm.elements.sameAddress.checked;
  function paintAdd() {
    const gpay = kind() === 'gpay';
    addForm.querySelector('.st-pay-card').hidden = gpay;
    addForm.querySelector('.st-gpay').hidden = !gpay;
    addForm.querySelector('.st-new-addr').hidden = ownAddress();
    const filled = ownAddress() || ['fullName', 'line1', 'city'].every((n) => addForm.querySelector(`.st-new-addr [name="${n}"]`).value.trim());
    go.disabled = !gpay && !(cardComplete(addForm) && filled);
  }
  addForm.addEventListener('input', paintAdd);
  addForm.addEventListener('change', paintAdd);
  $('.st-add-btn').addEventListener('click', () => {
    addForm.reset();
    for (const img of badges) img.hidden = false;
    // with no billing address on file there is none to use: the card's own is asked for, empty but the country
    const same = addForm.elements.sameAddress;
    same.checked = !!billing.address;
    same.closest('.st-check').hidden = !billing.address;
    newAddr.fill({ country: billing.address?.country ?? 'US' });
    addForm.querySelector('.st-gpay-d').textContent = `Google Pay selected. It pays with a card saved in your Google account, ${view.profile.email}.`;
    paintAdd();
    addDlg.showModal();
    addDlg.focus();
  });
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let added;
    if (kind() === 'gpay') {
      if (billing.methods.some((m) => m.kind === 'gpay')) return fail(addForm, 'Google Pay is already one of your payment methods.', addForm.elements.kind[1]);
      added = { id: newId(), kind: 'gpay', account: view.profile.email };
    } else {
      const r = readCard(addForm);
      if (r.error) return fail(addForm, r.error, r.field);
      if (billing.methods.some((m) => m.kind === 'card' && m.brand === r.card.brand && m.last4 === r.card.last4 && m.exp === r.card.exp)) return fail(addForm, 'That card is already saved.', 'number');
      added = { id: newId(), ...r.card };
      if (!ownAddress()) {
        const a = newAddr.read();
        if (a.error) return fail(addForm, a.error, a.field);
        added.address = a.address;
        // the first address given becomes the account's billing address, as Stripe keeps a customer's
        billing.address ??= a.address;
      }
    }
    const makeDefault = addForm.elements.makeDefault.checked;
    billing.methods.push(added);
    if (makeDefault) billing.primary = added.id;
    keep(`${methodName(added)} added${makeDefault ? ' as your default payment method' : ''}.`);
    addForm.reset();
    addDlg.close();
  });

  paint();
  return {
    reset: () => { for (const d of [addrDlg, addDlg]) if (d.open) d.close(); form.reset(); showCard(false); paint(); },
  };
}
