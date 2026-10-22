// Live-run captures for the "deposit" chat's certified-mail step: the REAL Mailform (mailform.io) send flow, which mails a
// PDF you upload by USPS Certified Mail with no account. Two pages, both staged by DOM edits only:
//   certified-upload  the home page after the letter PDF (plays/deposit/letter.pdf, made locally from the Gmail compose's letter
//                     text) was picked in the site's own upload input: its "Your Uploads" chip and the "Next" button
//   certified         the site's own "Confirm Your Order" page, reached by Next > the destination address form (Westlake
//                     Property Management) > the return address form (Jordan Lee) > Confirm, with "USPS Certified Mail" ticked
// Headless, public, no login. Nothing is paid, sent or saved to an account: the "Send Mail" button is never pressed, the site's
// POSTs to /app/account, /app/api (address autocomplete) and any pay/order/checkout path are aborted; the only POSTs let through
// are the anonymous session ones the flow needs to reach the confirm page (/app/upload of the made-up letter, /app/address/to,
// /app/address/from, /app/apply/certified = the site's option toggle that re-prices the order). letter.pdf is generated here if missing (Playwright page.pdf of the letter text).
//   node sidebars.bdeb2397/tools/play-deposit-certified.4c8bc671.mjs
// Output: plays/deposit/{certified-upload,certified}.webp (2940x1674) + pages.certified.json + CREDITS.certified.txt +
//         plays/deposit/fav-mail-mailform.png (+ letter.pdf)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('/Users/adrianagne/Documents/cosmos/projects/superbot-roblox-thumbnails/');
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'plays', 'deposit');
const TMP = path.join(tmpdir(), 'play-deposit-certified');
const PDF = path.join(OUT, 'letter.pdf');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true });

// the letter of tools/play-deposit.8889b4ff.js COMPOSE(); the street addresses are made up (the script has none for Westlake)
const WEST = { name: 'Westlake Property Management', street: '2250 Van Ness Ave', unit: 'Suite 210', city: 'San Francisco', state: 'CA', zip: '94109' };
const JORDAN = { name: 'Jordan Lee', street: '1428 Elm St', unit: 'Apt 3', city: 'San Francisco', state: 'CA', zip: '94117' };
const LETTER = `Jordan Lee
1428 Elm St, Apt 3
San Francisco, CA 94117
jordan@quillnote.app

October 8, 2026

Westlake Property Management
2250 Van Ness Ave, Suite 210
San Francisco, CA 94109

<b>Re: Return of my security deposit, 1428 Elm St, Apt 3</b>

Dear Westlake Property Management,

I moved out of 1428 Elm St, Apt 3 on September 30 and left the unit clean. I returned the keys and the garage remote at the move-out inspection that day, and I have attached 24 move-out photos that show the condition of every room.

Under California Civil Code section 1950.5, you must return my security deposit, or send an itemized statement of any deductions, within 21 days of move-out. That deadline is October 21. My deposit was $1,800, and I am requesting the full $1,800 back.

Please send it by bank transfer or check, and reply to confirm that you received this letter. I am also sending a copy by certified mail. If the full amount has not arrived by October 21, I will file a claim in small claims court.

Sincerely,
Jordan Lee
jordan@quillnote.app`;

const browser = await chromium.launch({ headless: true });
try {
  if (!existsSync(PDF)) {
    const p = await browser.newPage();
    await p.setContent(`<html><body style="font:12pt/1.5 Georgia,'Times New Roman',serif;margin:0;color:#111"><div style="white-space:pre-line">${LETTER}</div></body></html>`);
    await p.pdf({ path: PDF, format: 'Letter', margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' } });
    await p.close();
  }
  const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA });
  const page = await ctx.newPage();
  const blocked = [], allowed = [];
  await page.route('**/*', (route) => {
    const r = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) {
      const u = r.url();
      if (/mailform\.io\/app\/(upload|address\/to|address\/from|apply\/certified)(\?|$)/.test(u)) allowed.push(r.method() + ' ' + u);
      else if (/mailform\.io\//.test(u)) { blocked.push(r.method() + ' ' + u); return route.abort(); }
    }
    route.continue();
  });
  page.on('pageerror', (e) => console.log('pageerror', e.message));

  const cwebp = (name) => {
    const png = path.join(TMP, name + '.png');
    execFileSync('cwebp', ['-q', '80', '-quiet', png, '-o', path.join(OUT, name + '.webp')]);
  };
  const shot = (name) => page.screenshot({ path: path.join(TMP, name + '.png') });
  // promo banner, "Verifying addresses..." toast, cookie/chat widgets: removed
  const CLEAN = () => page.evaluate(() => {
    for (const e of document.querySelectorAll('[class*=announcement],[class*=banner],[class*=toast],[id*=intercom],[id*=hubspot],[id*=cookie],[class*=cookie]')) e.remove();
    // the green promo bar and the dark "Verifying addresses..." bar above the nav
    for (const e of document.querySelectorAll('body *')) {
      const t = (e.innerText || '').trim();
      if (e.children.length <= 4 && /^(×\s*)?(Send W2's with Mailform|Verifying addresses)/.test(t) && e.getBoundingClientRect().top < 5 && e.getBoundingClientRect().height < 130) {
        let n = e; while (n.parentElement && n.parentElement !== document.body && n.parentElement.getBoundingClientRect().height < 130 && n.parentElement.getBoundingClientRect().top < 5) n = n.parentElement;
        n.remove();
      }
    }
    document.activeElement && document.activeElement.blur();
  });
  const center = async (loc) => { const b = await loc.boundingBox(); return [Math.round((b.x + b.width / 2) * 10) / 10, Math.round((b.y + b.height / 2) * 10) / 10]; };
  const pages = {};

  // ---------- 1: home + upload ----------
  await page.goto('https://www.mailform.io/', { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file][ngf-multiple="true"]', PDF);
  await page.waitForSelector('text=Your file has successfully uploaded', { timeout: 20000 });
  await page.waitForTimeout(1500);
  await CLEAN();
  await page.waitForTimeout(500);
  const next1 = page.locator('#streetaddress');
  await shot('certified-upload');
  pages['certified-upload'] = { img: 'certified-upload.webp', title: await page.title(), host: 'www.mailform.io', path: '/', fav: 'fav-mail-mailform.png', targets: { next: await center(next1) }, scroll: null, field: null };
  cwebp('certified-upload');

  // ---------- 2: destination address, return address, confirm ----------
  await next1.click(); await page.waitForURL(/mailingaddress/); await page.waitForTimeout(2000);
  await page.fill('#recipient', WEST.name); await page.fill('#address1', WEST.street); await page.fill('#address2', WEST.unit);
  await page.fill('#city', WEST.city); await page.selectOption('#state', { label: 'CALIFORNIA' }); await page.fill('#zip', WEST.zip);
  await page.locator('button,a').filter({ hasText: /^\s*next/i }).first().click();
  await page.waitForURL(/returnaddress/); await page.waitForTimeout(3000);
  await page.fill('#sender', JORDAN.name); await page.fill('input[name=address1]', JORDAN.street); await page.fill('input[name=address2]', JORDAN.unit);
  await page.fill('input[name=city]', JORDAN.city); await page.selectOption('select[name=state]', { label: 'CALIFORNIA' }); await page.fill('input[name=zip]', JORDAN.zip);
  await page.locator('button,a').filter({ hasText: /^\s*confirm/i }).first().click();
  await page.waitForURL(/confirmation/); await page.waitForTimeout(5000);
  const cert = page.locator('input[ng-model="context.certified"]:visible').first();
  await cert.check({ force: true });
  await page.waitForTimeout(2500);
  await CLEAN();
  // tighten the two red section headings' margins (10/20px -> 0/6px) so the file name and the options all fit in 837px
  await page.evaluate(() => { for (const h of document.querySelectorAll('h5.redcopy')) { h.style.marginTop = '0px'; h.style.marginBottom = '6px'; } });
  await page.waitForTimeout(500);
  const stage = await page.evaluate(() => ({ sy: scrollY, h: document.documentElement.scrollHeight }));
  console.log('confirm page', stage);
  await page.screenshot({ path: path.join(TMP, 'certified-full.png'), fullPage: true });
  await shot('certified');
  const certBox = page.locator('input[ng-model="context.certified"]:visible').first();
  const upload = page.getByText('letter.pdf', { exact: true }).first();
  const send = page.locator('button:visible').filter({ hasText: /^\s*send mail\s*$/i }).first();
  pages.certified = { img: 'certified.webp', title: await page.title(), host: 'www.mailform.io', path: new URL(page.url()).pathname, fav: 'fav-mail-mailform.png',
    targets: { upload: await center(upload), certified: await center(certBox), send: await center(send) }, scroll: null, field: null };
  cwebp('certified');
  console.log('checked certified:', await certBox.isChecked(), 'BLOCKED:', blocked, 'ALLOWED:', allowed);

  // favicon: the site's own, 32px
  const ico = await ctx.request.get('https://www.mailform.io/favicon-32x32.png');
  writeFileSync(path.join(OUT, 'fav-mail-mailform.png'), await ico.body());

  writeFileSync(path.join(OUT, 'pages.certified.json'), JSON.stringify({ chat: 'deposit', pages }, null, 1));

  writeFileSync(path.join(OUT, 'CREDITS.certified.txt'), `Certified-mail pages of the deposit chat (pages.certified.json: certified-upload, certified). Taken 2026-10-21 from the REAL
Mailform send flow (https://www.mailform.io/, no account, no sign-in), headless Chrome (Playwright), 1470x837 CSS px at 2x,
saved as WebP (cwebp -q 80), by ../../tools/play-deposit-certified.4c8bc671.mjs. Favicon fav-mail-mailform.png is the site's own
favicon-32x32.png.
certified-upload.webp: https://www.mailform.io/ after plays/deposit/letter.pdf was picked in the site's own upload input (its
"Your uploads" chip letter.pdf and the Next button are the site's). letter.pdf is the Gmail compose's letter (tools/play-deposit.8889b4ff.js
COMPOSE, same body, from Jordan Lee to Westlake Property Management, dated October 8, 2026), made locally with Playwright page.pdf;
the street addresses are made up, the script having none: Westlake Property Management, 2250 Van Ness Ave, Suite 210, San
Francisco, CA 94109; Jordan Lee, 1428 Elm St, Apt 3, San Francisco, CA 94117 (the chat's own address line).
certified.webp: https://www.mailform.io/confirmation.html ("Confirm Your Order"), reached with the site's own Next > destination
address form (Westlake Property Management) > return address form (Jordan Lee) > Confirm, the forms filled by typing into the real
fields; then "USPS Certified Mail (via First Class)" ticked with its own checkbox (the site itself unticked First Class and priced
the order: Certified $8.99, total $11.98, below the screenshot). Staged by DOM edits only: the page's green promo bar and its dark
"Verifying addresses..." bar were removed, and the margins of the two red section headings (10/20px) were set to 0/6px so the file
name fits in the first screen. Send Mail (and everything that pays, creates an account or saves to one) was never pressed; the
site's POSTs to /app/account (address book save) and /app/api (address autocomplete) were aborted; only the anonymous session ones
the flow needs went through: /app/upload (the made-up letter), /app/address/to, /app/address/from, /app/apply/certified (the
option toggle). No payment page was opened. The browser context was discarded afterwards.
`);
  console.log(JSON.stringify(pages, null, 1));
  await ctx.close();
} catch (e) {
  console.error(e.stack);
  throw e;
} finally {
  await browser.close();
}
