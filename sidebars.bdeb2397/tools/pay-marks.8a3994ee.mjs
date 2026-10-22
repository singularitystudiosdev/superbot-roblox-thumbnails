// Billing's payment marks (settings-pay.8a3994ee.js): the card brands' logos and Google Pay's, fetched from Iconify's
// "SVG Logos" set (logos:*, CC0-1.0, github.com/gilbarbara/logos) and set on the badges a card field wears, each brand's
// logo on its own colour as card forms show them. Nothing is drawn: each badge is the brand's own logo, recoloured
// (Visa's white) or cropped (Mastercard's circles, without its wordmark) and centred on a rounded rectangle.
// node sidebars.bdeb2397/tools/pay-marks.8a3994ee.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../pay/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const NAMES = ['visa', 'mastercard', 'amex', 'discover', 'google-pay', 'google-pay-icon'];
const res = await fetch(`https://api.iconify.design/logos.json?icons=${NAMES.join(',')}`);
if (!res.ok) throw new Error(`Iconify answered ${res.status}`);
const set = await res.json();
const icon = (name) => {
  const i = set.icons[name];
  if (!i) throw new Error(`logos:${name} is missing from Iconify's answer`);
  return { body: i.body, w: i.width ?? set.width, h: i.height ?? set.height };
};

// a 40x26 badge: the brand's colour, its logo `w` wide centred on it
const W = 40, H = 26;
function badge(fill, { body, w: vw, h: vh }, w, stroke = '') {
  const h = (w * vh) / vw;
  const edge = stroke ? ` stroke="${stroke}" stroke-width="1"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="3" fill="${fill}"${edge}/><svg x="${(W - w) / 2}" y="${((H - h) / 2).toFixed(3)}" width="${w}" height="${h.toFixed(3)}" viewBox="0 0 ${vw} ${vh}">${body}</svg></svg>\n`;
}

const visa = icon('visa');
// Visa's wordmark in white on Visa Blue (#1434CB, its brand guidelines' primary blue): the gradient fill dropped
const visaWhite = { ...visa, body: visa.body.replace(/<defs>.*<\/defs>/, '').replace(/fill="url\([^)]*\)"/, 'fill="#fff"') };
const mc = icon('mastercard');
// the interlocking circles only: the first path is the wordmark under them, the circles stand 158.06 tall
const mcCircles = { body: mc.body.replace(/^<path d="[^"]*"\/>/, ''), w: mc.w, h: 158.06 };
const amex = icon('amex');
const files = {
  'visa.svg': badge('#1434CB', visaWhite, 28),
  'mastercard.svg': badge('#252525', mcCircles, 22),
  // its logo is already the blue box: set on the same blue, full height
  'amex.svg': badge('#006FCF', amex, 26),
  'discover.svg': badge('#fff', icon('discover'), 30, '#e5e5ea'),
};
for (const name of ['google-pay', 'google-pay-icon']) {
  const { body, w, h } = icon(name);
  files[`${name}.svg`] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>\n`;
}
for (const [file, svg] of Object.entries(files)) {
  if (file === 'mastercard.svg' && (svg.match(/<path/g) ?? []).length !== 3) throw new Error('Mastercard: expected its three circle paths');
  writeFileSync(`${OUT}${file}`, svg);
  console.log(`wrote pay/${file} (${svg.length} bytes)`);
}
