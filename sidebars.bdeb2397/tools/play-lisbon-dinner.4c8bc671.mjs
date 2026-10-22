// "lisbon" play, dinner reservations: the REAL SevenRooms booking widget of two Lisbon restaurants (sevenrooms.com is the
// reservation engine many Lisbon restaurants embed; TheFork answers every non-browser-grade client with a DataDome 403, so it
// could not be captured). Headless Chromium, public pages, nobody signed in. Staged by DOM edits only so the chat's
// "Reserved dinner for Nov 20 and Nov 21" has a restaurant on screen: made-up names, addresses, phones and descriptions.
//
// Real clicks on the real page (only selections): the Time field -> "8:00 PM" / "8:30 PM", then that slot's button, which opens
// the widget's own slot dialog ("Fri 20 Nov . 8:00 PM", the table's photo, the venue's notes, the "Select" button that
// would hold the table and open the guest-details / confirm step). That last button is NEVER pressed.
// Nothing is booked, held or sent: every non-GET request except SevenRooms' anonymous token refresh is aborted (that includes
// POST /api-yoa/dining/hold/add, so no table is ever held, and every analytics beacon), nothing is typed, nobody logs in.
//
// Pages written to plays/lisbon/ (+ pages.dinner.json, CREDITS.dinner.txt, fav-sevenrooms.png):
//   dinner-1  Fri Nov 20 2026, 8:00 PM, 2 guests  "Taberna do Largo"   targets: slot, reserve
//   dinner-2  Sat Nov 21 2026, 8:30 PM, 2 guests  "Casa das Gaivotas"  targets: slot, reserve
// Not captured: dinner-1-confirm (the details/confirm step only opens after the hold POST above, which is never sent).
// Run from the project root:   node sidebars.bdeb2397/tools/play-lisbon-dinner.4c8bc671.mjs [dinner-1] [dinner-2]
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(HERE, '..', 'plays', 'lisbon');
const TMP = join(tmpdir(), 'play-lisbon-dinner');
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
const { chromium } = createRequire(ROOT + '/')('playwright');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const BASE = 'https://www.sevenrooms.com/explore';

// One entry per restaurant. `real` is the SevenRooms venue the page really belongs to; `name` etc. are what the page is staged to.
// text: [regex over a single text node (or aria/alt/title value), replacement], applied in order.
const DINNERS = [
  {
    id: 'dinner-1',
    real: 'pizzarialisboa', slug: 'tabernadolargo', date: '2026-11-20', dateLabel: 'Fri 20 Nov', time: '20:00', slotKey: 'reservation-timeslot-button-20:00',
    name: 'Taberna do Largo',
    text: [
      [/Pizzaria Lisboa/g, 'Taberna do Largo'],
      [/Rua Nova da Trindade, 18, Lisboa/, 'Rua da Misericórdia, 54, Lisboa'],
      [/^Rua Nova da Trindade, 18$/, 'Rua da Misericórdia, 54'],
      [/^1200-466$/, '1200-273'],
      [/^\+351 21 155 4945$/, '+351 21 555 0142'],
      [/A joyful and laid-back atmosphere\. An irresistible menu, perfect for sharing\./, 'Portuguese tavern cooking from a wood-fired oven, made for sharing. A cosy room in the heart of Chiado.'],
      [/Um ambiente alegre e descontra[ií]do\.[^\n]*/, 'Cozinha de taberna portuguesa, feita no forno a lenha e pensada para partilhar.'],
      [/Nas varandas do Bairro do Avillez, acesso é feito por escadas\./, 'A sala do primeiro andar tem acesso por escadas.'],
      [/Bairro do Avillez's balcony is accessible by stairs\./, 'The upstairs room is accessible by stairs.'],
      [/Sur les balcons du Bairro do Avillez, l'accès se fait par des escaliers\./, "La salle à l'étage est accessible par des escaliers."],
      [/En los balcones del Bairro do Avillez, el acceso es por escaleras\./, 'La sala del piso superior tiene acceso por escaleras.'],
      [/Aqui servimos exclusivamente a Carta da Taberna do Largo\./, 'Aqui servimos exclusivamente a carta da Taberna do Largo.'],
      [/Bairro do Avillez/g, 'Largo do Carmo'],
      [/Avillez/g, 'Largo'],
    ],
    note: [],
  },
  {
    id: 'dinner-2',
    real: 'attikolisbon', slug: 'casadasgaivotas', date: '2026-11-21', dateLabel: 'Sat 21 Nov', time: '20:30', slotKey: 'reservation-timeslot-button-20:30-Restaurant - 12th Floor',
    name: 'Casa das Gaivotas',
    text: [
      [/ATTIKO Lisbon Policies \| Pol[ií]ticas ATTIKO Lisbon/i, 'Casa das Gaivotas Policies | Políticas Casa das Gaivotas'],
      [/Attiko Lisbon/gi, 'Casa das Gaivotas'],
      [/\bATTIKO\b/gi, 'Casa das Gaivotas'],
      [/Avenida António Augusto de Aguiar 2, Floor 12, Lisbon/, 'Rua da Atalaia 48, Lisbon'],
      [/^Avenida António Augusto de Aguiar 2, Floor 12$/, 'Rua da Atalaia 48'],
      [/^1050-214$/, '1200-041'],
      [/^\+351 963 729 885$/, '+351 21 555 0178'],
      [/Restaurant - 12th Floor/g, 'Dining room'],
      [/Please note that we operate two floors[\s\S]*/, 'Please note that the dining room is closed on Sundays and Mondays.'],
      [/Perched atop ME Lisbon[\s\S]*/, 'A neighbourhood dining room in the heart of Bairro Alto, with a seasonal Portuguese menu built around the day\'s catch.'],
      [/In the heart of Lisbon, the restaurant on the 12th floor[\s\S]*/, 'Low light, a long bar and a short list of grilled fish, shellfish and Portuguese wines, a few steps from Largo do Camões.'],
      [/Children Policy:[^\n]*/, 'Children are welcome until 9:00 PM.'],
      [/Pol[ií]tica de Crian[cç]as:[^\n]*/, 'As crianças são bem-vindas até às 21h00.'],
      [/C[oó]digo de Vestu[aá]rio:[^\n]*/, 'Dress code: smart casual.'],
      [/Dress Code:[^\n]*/, 'Dress code: smart casual.'],
    ],
    note: [],
  },
];

const wanted = process.argv.slice(2);
const want = (id) => wanted.length === 0 || wanted.includes(id);
const webp = (png, out) => execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', out], { stdio: 'ignore' });
const hhmm12 = (t) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };

// ---------- staging (runs in the page, DOM edits only) ----------
function stage({ text, name, dateLabel }) {
  const log = [];
  const rules = text.map(([src, flags, rep]) => [new RegExp(src, flags), rep]);
  const fix = (s) => {
    let o = s;
    for (const [re, rep] of rules) o = o.replace(re, rep);
    // 24h -> 12h, as US-style SevenRooms venues show it
    o = o.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b(?!\s?[AP]M)/g, (m0, h, mi) => {
      const hh = Number(h);
      return `${((hh + 11) % 12) + 1}:${mi} ${hh < 12 ? 'AM' : 'PM'}`;
    });
    return o;
  };
  const hide = (el) => { if (el) el.style.setProperty('display', 'none', 'important'); };
  // the venue's own logo (header badge): a real brand, hidden
  for (const el of document.querySelectorAll('[data-test="logo-link"]')) hide(el);
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let t, n = 0;
  while ((t = tw.nextNode())) {
    const v = fix(t.textContent);
    if (v !== t.textContent) { t.textContent = v; n++; }
  }
  for (const el of document.querySelectorAll('[aria-label],[alt],[title]')) {
    for (const a of ['aria-label', 'alt', 'title']) {
      const v = el.getAttribute(a);
      if (v) { const w = fix(v); if (w !== v) { el.setAttribute(a, w); n++; } }
    }
  }
  document.title = fix(document.title);
  log.push('textEdits=' + n);
  const left = (document.body.innerText.match(/attiko|pizzaria lisboa|avillez|bairro do avillez/gi) || []);
  log.push('leftover=' + JSON.stringify(left));
  return log;
}

const centre = (box) => [Math.round((box.x + box.width / 2) * 10) / 10, Math.round((box.y + box.height / 2) * 10) / 10];

const browser = await chromium.launch({ headless: true });
const pages = {};
try {
  const ctx = await browser.newContext({
    viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'Europe/Lisbon', userAgent: UA,
  });
  // never write anything: SevenRooms' anonymous token refresh is the only POST the page needs to list slots
  const aborted = [];
  await ctx.route('**/*', (route) => {
    const q = route.request();
    if (q.method() !== 'GET' && !/\/auth\/token-refresh/.test(q.url())) {
      if (/sevenrooms\.com/.test(q.url())) aborted.push(q.method() + ' ' + new globalThis.URL(q.url()).pathname);
      return route.abort();
    }
    return route.continue();
  });

  for (const d of DINNERS) {
    if (!want(d.id)) continue;
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/${d.real}/reservations/create/search/?date=${d.date}&halo=2&lang=en`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForSelector('[data-test^="reservation-timeslot-button"]', { timeout: 30000 });
      await page.waitForTimeout(1500);
      // the real Time picker: choose the dinner time (a selection, nothing is booked)
      await page.getByText('All Times').first().click();
      await page.getByRole('option', { name: new RegExp('^' + d.time + '$') }).first().click();
      await page.waitForTimeout(2500);
      const slot = page.locator(`[data-test="${d.slotKey}"]`).first();
      await slot.waitFor({ timeout: 15000 });
      // the real slot button: opens the widget's slot dialog (a selection; its "Select" button is NOT pressed)
      await slot.click();
      await page.waitForSelector('[role=dialog] button', { timeout: 15000 });
      await page.waitForTimeout(2500);
      const url = page.url();
      const dialogText = await page.locator('[role=dialog]').first().innerText();
      const log = await page.evaluate(stage, { text: d.text.map(([re, rep]) => [re.source, re.flags, rep]), name: d.name, dateLabel: d.dateLabel });
      console.log(d.id, 'staged:', log.join(' '));
      console.log(d.id, 'dialog (real, before staging):', JSON.stringify(dialogText.slice(0, 600)));
      // weekday + date line: "Fri 20 Nov . 8:00 PM" already comes from the real dialog (24h -> 12h by stage)
      await page.mouse.move(735, 18); // park the cursor on empty header space
      await page.waitForTimeout(800);
      const shown = await page.evaluate(() => document.querySelector('[role=dialog]').innerText);
      console.log(d.id, 'dialog (staged):', JSON.stringify(shown));
      const png = join(TMP, d.id + '.png');
      await page.screenshot({ path: png });
      webp(png, join(OUT, d.id + '.webp'));
      // targets: the time line of the dialog, and the dialog's own "Select" button
      const t = await page.evaluate((time12) => {
        const dlg = document.querySelector('[role=dialog]');
        const el = [...dlg.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim() === time12)
          .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
        const btn = [...dlg.querySelectorAll('button')].find((b) => /^Select$/.test(b.textContent.trim()));
        const r = (e) => { const x = e.getBoundingClientRect(); return { x: x.x, y: x.y, width: x.width, height: x.height }; };
        return { slot: el ? r(el) : null, reserve: btn ? r(btn) : null, title: document.title };
      }, hhmm12(d.time));
      if (!t.slot || !t.reserve) throw new Error(`${d.id}: targets not found ${JSON.stringify(t)}`);
      pages[d.id] = {
        img: d.id + '.webp', title: t.title, host: 'sevenrooms.com',
        path: new globalThis.URL(url).pathname.replace(d.real, d.slug) + new globalThis.URL(url).search,
        fav: 'fav-sevenrooms.png',
        targets: { slot: centre(t.slot), reserve: centre(t.reserve) }, scroll: null, field: null,
      };
      console.log(d.id, JSON.stringify(pages[d.id]));
    } catch (e) {
      console.error(d.id, 'FAILED', e.stack);
      await page.screenshot({ path: join(TMP, d.id + '-fail.png') }).catch(() => {});
      throw e;
    } finally {
      await page.close();
    }
  }
  console.log('non-GET requests aborted on sevenrooms.com:', JSON.stringify([...new Set(aborted)]));

  // favicon: the site's own (SevenRoomsLogo.svg from <link rel=icon>), rasterised to 64px
  const svg = await (await ctx.request.get('https://www.sevenrooms.com/icons/SevenRoomsLogo.svg')).text();
  const fp = await ctx.newPage();
  await fp.setViewportSize({ width: 64, height: 64 });
  await fp.setContent(`<body style="margin:0;background:transparent"><img style="width:64px;height:64px" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body>`);
  await fp.waitForTimeout(500);
  await fp.screenshot({ path: join(OUT, 'fav-sevenrooms.png'), omitBackground: true, clip: { x: 0, y: 0, width: 64, height: 64 } });
  execFileSync('magick', [join(OUT, 'fav-sevenrooms.png'), '-resize', '64x64', join(OUT, 'fav-sevenrooms.png')]); // 2x capture -> 64px
  await fp.close();
  await ctx.close();

  if (Object.keys(pages).length) {
    let prev = { pages: {} };
    try { prev = JSON.parse(readFileSync(join(OUT, 'pages.dinner.json'), 'utf8')); } catch { /* first run */ }
    writeFileSync(join(OUT, 'pages.dinner.json'), JSON.stringify({ chat: 'lisbon', pages: { ...prev.pages, ...pages } }, null, 1));
  }
} catch (e) {
  console.error(e.stack);
  process.exitCode = 1;
  throw e;
} finally {
  await browser.close();
  if (!process.exitCode) rmSync(TMP, { recursive: true, force: true });
}
