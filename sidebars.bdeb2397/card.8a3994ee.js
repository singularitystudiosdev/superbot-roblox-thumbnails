// A card's fields as Billing has them (settings-pay.8a3994ee.js: Add payment method, and Update under the default
// card): the number spaced as its brand prints it, the brand read off its first digits, the expiry written MM / YY as it
// is typed, the security code as long as the brand's. Checked as Stripe's card form checks them, in its words. The
// number never leaves its field: only the brand, last four and expiry are kept.

// the brands by their first digits, with the lengths their numbers come in, their security code's and where the
// number's spaces go; `mark` is the brand's badge (pay/, pay/CREDITS.txt)
export const BRANDS = [
  { name: 'Visa', mark: 'visa', test: /^4/, len: [13, 16, 19], cvc: [3], gaps: [4, 8, 12] },
  { name: 'Mastercard', mark: 'mastercard', test: /^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/, len: [16], cvc: [3], gaps: [4, 8, 12] },
  { name: 'American Express', mark: 'amex', test: /^3[47]/, len: [15], cvc: [4], gaps: [4, 10] },
  { name: 'Discover', mark: 'discover', test: /^(6011|64[4-9]|65|622)/, len: [16, 19], cvc: [3], gaps: [4, 8, 12] },
];
// a number no brand here claims: any length a card number comes in
const OTHER = { name: 'Card', mark: '', len: [13, 14, 15, 16, 17, 18, 19], cvc: [3, 4], gaps: [4, 8, 12] };
export const brandOf = (digits) => BRANDS.find((b) => b.test.test(digits)) ?? OTHER;

const digitsOf = (input) => input.value.replace(/\D/g, '');
// the Luhn check every card number passes
const luhn = (digits) => [...digits].reverse().reduce((sum, ch, i) => {
  const n = Number(ch) * (i % 2 ? 2 : 1);
  return sum + (n > 9 ? n - 9 : n);
}, 0) % 10 === 0;
const spaced = (digits, gaps) => [...digits].map((ch, i) => (gaps.includes(i) ? ` ${ch}` : ch)).join('');
// "4" is April before a second digit comes, as Stripe reads it
const expiry = (d) => {
  const m = /^[2-9]/.test(d) ? `0${d}` : d;
  return m.length > 2 ? `${m.slice(0, 2)} / ${m.slice(2, 4)}` : m;
};

// rewrite a field as it is typed, the caret kept after the same digit
function reformat(input, format) {
  const before = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, '').length;
  input.value = format(digitsOf(input));
  let at = 0;
  for (let seen = 0; at < input.value.length && seen < before; at++) if (/\d/.test(input.value[at])) seen++;
  input.setSelectionRange(at, at);
}

// a form's number, exp and cvc fields: spaced and capped as they are typed; `onBrand` hears the brand as it changes
export function wireCardFields(form, onBrand) {
  const { number, exp, cvc } = form.elements;
  number.addEventListener('input', () => {
    const b = brandOf(digitsOf(number));
    reformat(number, (d) => spaced(d.slice(0, Math.max(...b.len)), b.gaps));
    cvc.maxLength = Math.max(...b.cvc);
    onBrand?.(digitsOf(number) ? b : null);
  });
  // the slash comes with the year's first digit, so deleting back to the month never leaves it behind
  exp.addEventListener('input', () => reformat(exp, (d) => expiry(d.slice(0, 4))));
  cvc.addEventListener('input', () => reformat(cvc, (d) => d.slice(0, cvc.maxLength)));
}

// every field filled as far as its brand needs: what lets Add be pressed
export function cardComplete(form) {
  const digits = digitsOf(form.elements.number), b = brandOf(digits);
  return b.len.includes(digits.length) && digitsOf(form.elements.exp).length === 4 && b.cvc.includes(digitsOf(form.elements.cvc).length);
}

// { card } when the number, expiry and code read right, else { error, field } naming the first that does not
export function readCard(form, now = new Date()) {
  const digits = digitsOf(form.elements.number), b = brandOf(digits), exp = digitsOf(form.elements.exp);
  const month = Number(exp.slice(0, 2)), year = 2000 + Number(exp.slice(2));
  if (!b.len.includes(digits.length)) return { error: 'Your card number is incomplete.', field: 'number' };
  if (!luhn(digits)) return { error: 'Your card number is invalid.', field: 'number' };
  if (exp.length !== 4) return { error: "Your card's expiration date is incomplete.", field: 'exp' };
  if (month < 1 || month > 12) return { error: "Your card's expiration month is invalid.", field: 'exp' };
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return { error: "Your card's expiration date is in the past.", field: 'exp' };
  if (year > now.getFullYear() + 20) return { error: "Your card's expiration year is invalid.", field: 'exp' };
  if (!b.cvc.includes(digitsOf(form.elements.cvc).length)) return { error: "Your card's security code is incomplete.", field: 'cvc' };
  return { card: { kind: 'card', brand: b.name, last4: digits.slice(-4), exp: `${exp.slice(0, 2)}/${exp.slice(2)}` } };
}
