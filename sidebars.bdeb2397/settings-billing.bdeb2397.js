// Settings' Billing section (settings.bdeb2397.js): the credits left beside the coin the sidebar's credits row wears,
// with Set up auto-reload and Buy credits on its line, each opening a modal over Settings; the three packs (silver,
// gold and a rainbow coin with its rainbow flowing across it), the payment method and the invoices. There are no plans: every
// credit costs the same, PER_MILLION dollars a million (settings-data.bdeb2397.js), so a pack costs what its credits
// would bought as an amount. The payment methods and billing address are settings-pay.8a3994ee.js's. Everything changes
// in this page only: no payment is taken.
import { esc, fx } from './parts.bdeb2397.js';
import { MILLION, PER_MILLION, PACKS, BUY, priceOf, creditsFor, usd, addCredits, methodName, primaryOf } from './settings-data.bdeb2397.js';
import { modalHTML, wireShut, fail } from './settings-modal.8a3994ee.js';
import { paymentHTML, wirePayment } from './settings-pay.8a3994ee.js';

const num = new Intl.NumberFormat('en-US');
const BUY_FIRST = 10; // dollars the Buy credits field starts at
// a dollar field: its label over the amount, a $ before it and the credits it buys after it
const moneyField = (name, label) => `<div class="st-field"><label class="st-field-l" for="st-${name}">${esc(label)}</label><span class="st-money"><i aria-hidden="true">$</i><input id="st-${name}" name="${name}" type="number" inputmode="numeric" min="${BUY.min}" max="${BUY.max}" step="1" aria-describedby="st-${name}-c"><small id="st-${name}-c"></small></span></div>`;
// a field's whole dollars, or null for anything else (empty, cents, out of range)
function dollarsOf(input) {
  const v = Number(input.value.trim());
  return input.value.trim() && Number.isInteger(v) && v >= BUY.min && v <= BUY.max ? v : null;
}
const RANGE = `whole dollars from ${usd(BUY.min, { short: true })} to ${usd(BUY.max, { short: true })}`;
// the rainbow coin (settings.854d0793.css .st-flow): the pack's coin with a rainbow flowing across it, and the same
// rainbow blurred behind it as its glow
const flowCoin = (coin) => `<span class="st-coin st-flow"><span class="st-flow-glow"><i></i></span>${fx(coin, 'st-flow-coin')}<span class="st-flow-tint"><i></i></span></span>`;

export function billingHTML() {
  return `<h3 class="st-title" id="st-billing-h">Billing</h3>
  <div class="st-balance">
    <div class="st-line">
      ${fx('coin', 'st-coin')}
      <p class="st-left"><span class="st-left-n"></span><span class="st-vh"> credits left</span></p>
      <button class="sb-btn-ghost st-reload-btn" type="button" aria-haspopup="dialog"></button>
      <button class="sb-btn-primary st-buy-btn" type="button" aria-haspopup="dialog">Buy credits</button>
    </div>
    <p class="st-hint st-reload-note"></p>
  </div>
  <h4 class="st-label st-packs-h" id="st-packs-h">Credit packs</h4>
  <ul class="st-packs" aria-labelledby="st-packs-h">${PACKS.map((p) => {
    const credits = num.format(p.credits), price = usd(priceOf(p.credits), { short: true });
    return `<li class="st-pack">${p.flow ? flowCoin(p.coin) : fx(p.coin, 'st-coin')}<p class="st-pack-n st-grow">${credits}</p><span class="st-price">${price}</span><button class="sb-btn-ghost" type="button" data-pack="${p.credits}" aria-label="Buy ${credits} credits for ${price}">Buy</button></li>`;
  }).join('')}</ul>
  ${paymentHTML()}
  <table class="st-table">
    <caption class="st-label">Invoices</caption>
    <thead><tr><th scope="col">Date</th><th scope="col">Description</th><th scope="col" class="st-num">Amount</th><th scope="col">Status</th></tr></thead>
    <tbody class="st-invoices"></tbody>
  </table>
  <p class="st-status" role="status"></p>
  ${modalHTML('reload', 'Keep your chats running: when your balance runs low, credits are bought for you to top it back up.', `
      ${moneyField('below', 'When credit balance reaches:')}
      ${moneyField('upTo', 'Bring credit balance back up to:')}
      <p class="st-hint st-fine"></p>
      <div class="st-actions"><button class="st-link st-reload-off" type="button">Turn off auto-reload</button><button class="sb-btn-ghost st-cancel" type="button">Cancel</button><button class="sb-btn-primary st-go" type="submit"></button></div>`)}
  ${modalHTML('buy', `Credits cost ${usd(PER_MILLION, { short: true })} per ${num.format(MILLION)}, whatever amount you buy.`, `
      ${moneyField('amount', 'Amount:')}
      <p class="st-hint st-fine"></p>
      <div class="st-actions"><button class="sb-btn-ghost st-cancel" type="button">Cancel</button><button class="sb-btn-primary st-go" type="submit"></button></div>`)}`;
}

// `state` is Settings' own (BILLING, copied); `changed` tells it to keep the new state
export function wireBilling(panel, state, changed) {
  const $ = (s) => panel.querySelector(s);
  const status = $('.st-status');
  const say = (text) => { status.textContent = text; };
  // what is charged: the default payment method
  const cardName = () => methodName(primaryOf(state));
  const credits = (n) => `${num.format(n)} credits`;

  // what spending changes (a chat at work, sidebar-tools.854d0793.js): the credits left and the invoices an auto-reload
  // adds; painted on its own so an open form keeps what is typed in it
  function paintCredits() {
    $('.st-left-n').textContent = num.format(state.left);
    $('.st-invoices').innerHTML = state.invoices.map((i) => `<tr><td>${esc(i.date)}</td><td>${esc(i.what)}</td><td class="st-num">${esc(i.amount)}</td><td>Paid</td></tr>`).join('');
  }

  function paint() {
    paintCredits();
    $('.st-reload-btn').textContent = state.autoReload ? 'Edit auto-reload' : 'Set up auto-reload';
    const note = $('.st-reload-note');
    note.hidden = !state.autoReload;
    note.textContent = `Auto-reload is on: at ${credits(state.reload.below)} it buys you back up to ${num.format(state.reload.upTo)}.`;
  }

  // a modal over Settings: opened by its button, closed by Cancel, its ×, Escape or a press on its backdrop, focus
  // back on the button; each dollar field shows the credits it stands for as it is typed
  function wireModal(id, opener, paintSums) {
    const dlg = $(`#st-${id}`), form = dlg.querySelector('form');
    wireShut(dlg, $(opener));
    const sums = () => {
      for (const input of form.querySelectorAll('input')) {
        const d = dollarsOf(input);
        dlg.querySelector(`#${input.id}-c`).textContent = d ? credits(creditsFor(d)) : '';
      }
      paintSums?.(form);
    };
    form.addEventListener('input', sums);
    // opened with nothing in it focused or selected: the dialog itself takes focus, so Tab reaches the first field
    return { dlg, form, sums, open: () => { dlg.showModal(); sums(); dlg.focus(); } };
  }

  // Buy credits: any whole number of dollars at the one price, its total on the button as it is typed
  const buy = wireModal('buy', '.st-buy-btn', (form) => {
    const d = dollarsOf(form.elements.amount);
    form.querySelector('.st-go').textContent = d ? `Buy for ${usd(d)}` : 'Buy';
  });
  function openBuy() {
    buy.dlg.querySelector('.st-modal-h').textContent = 'Buy credits';
    buy.dlg.querySelector('.st-fine').textContent = `Charged to your ${cardName()}.`;
    buy.form.elements.amount.value = BUY_FIRST;
    buy.open();
  }
  $('.st-buy-btn').addEventListener('click', openBuy);
  buy.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = dollarsOf(buy.form.elements.amount);
    if (!d) return fail(buy.form, `Enter ${RANGE}, like ${usd(BUY_FIRST, { short: true })}.`, 'amount');
    addCredits(state, creditsFor(d));
    changed();
    paint();
    say(`Bought ${credits(creditsFor(d))} for ${usd(d)} on your ${cardName()}.`);
    buy.dlg.close();
  });

  // the packs: bought outright at the same price
  $('.st-packs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pack]');
    if (!b) return;
    const p = PACKS.find((x) => x.credits === Number(b.dataset.pack));
    addCredits(state, p.credits);
    changed();
    paint();
    say(`Bought ${credits(p.credits)} for ${usd(priceOf(p.credits))} on your ${cardName()}.`);
  });

  // auto-reload: the balance it reloads at and the balance it tops back up to, in dollars at the one price
  const reload = wireModal('reload', '.st-reload-btn');
  function openReload() {
    const on = state.autoReload;
    reload.dlg.querySelector('.st-modal-h').textContent = on ? 'Edit auto-reload' : 'Turn on auto-reload';
    reload.dlg.querySelector('.st-fine').textContent = `Auto-reload charges your ${cardName()}, ${usd(PER_MILLION, { short: true })} for every ${num.format(MILLION)} credits it buys.`;
    reload.dlg.querySelector('.st-reload-off').hidden = !on;
    reload.dlg.querySelector('.st-go').textContent = on ? 'Save' : 'Turn on';
    reload.form.elements.below.value = priceOf(state.reload.below);
    reload.form.elements.upTo.value = priceOf(state.reload.upTo);
    reload.open();
  }
  $('.st-reload-btn').addEventListener('click', openReload);
  reload.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const below = dollarsOf(reload.form.elements.below), upTo = dollarsOf(reload.form.elements.upTo);
    if (!below || below >= BUY.max) return fail(reload.form, `Enter ${RANGE} to reload at, under ${usd(BUY.max, { short: true })}.`, 'below');
    if (!upTo || upTo <= below) return fail(reload.form, `Enter ${RANGE} to top up to, over the ${usd(below, { short: true })} it reloads at.`, 'upTo');
    const was = state.autoReload;
    state.autoReload = true;
    state.reload = { below: creditsFor(below), upTo: creditsFor(upTo) };
    changed();
    paint();
    say(was ? 'Auto-reload saved.' : 'Auto-reload is on.');
    reload.dlg.close();
  });
  reload.dlg.querySelector('.st-reload-off').addEventListener('click', () => {
    state.autoReload = false;
    changed();
    paint();
    say('Auto-reload is off.');
    reload.dlg.close();
  });

  // the payment methods and billing address
  const pay = wirePayment(panel, state, changed, say);

  paint();
  return {
    reset: () => { for (const m of [buy, reload]) if (m.dlg.open) m.dlg.close(); pay.reset(); say(''); paint(); },
    spent: paintCredits,
    // Buy credits open (the credits row's Get more credits)
    buy: openBuy,
  };
}
