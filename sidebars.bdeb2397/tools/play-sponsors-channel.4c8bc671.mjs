// Pages "channel", "sheet-before" and "sheet-after" of the sponsors play (plays/sponsors/pages.channel.json):
//  - channel: the REAL YouTube channel page (youtube.com/@<handle>/videos, public, signed out, headless Chromium) staged by DOM edits only
//    as the made-up channel "Desk Setup Daily" (@desksetupdaily, 88K subscribers). Its banner, avatar and video thumbnails are generated
//    (fal-ai/nano-banana-pro, the same way as play-sponsors-thumbs.8889b4ff.mjs: no people, no real brands) / reused from the play.
//  - sheet-before / sheet-after: the REAL Baserow public shared grid view (baserow.io/public/grid/<token>; Baserow is an open-source
//    Airtable/Sheets style database whose grid is plain DOM, unlike Google Sheets' canvas), staged as "Quillnote sponsorships": its own
//    header/row/column elements are cloned and re-labelled. Two states from one page load: header only, then three booked sponsors.
// Writes plays/sponsors/{channel,sheet-before,sheet-after}.webp, fav-sheet.png, thumb-desk-setup-daily-<n>.webp, banner-desk-setup-daily.webp,
// pages.channel.json and prompts.4c8bc671.json (every prompt + fal request id). Other files of the play are never touched. Nothing is signed in,
// followed, subscribed, edited or submitted: the only things pressed are none (pages are only loaded and screenshot; no write to either site).
//   node sidebars.bdeb2397/tools/play-sponsors-channel.4c8bc671.mjs [assets|channel|sheet|all] [--force]
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const { chromium } = createRequire(root + '/')('playwright');
const OUT = resolve(here, '../plays/sponsors');
const PARTS = resolve(here, '../chats/parts');
const b64 = (f) => 'data:image/webp;base64,' + readFileSync(f).toString('base64');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const stage = args.find((a) => !a.startsWith('--')) ?? 'all';
const tmp = mkdtempSync(join(tmpdir(), 'play-sponsors-channel-'));

// ---------- 1. generated art (only what is missing on disk) ----------
const MODEL = 'fal-ai/nano-banana-pro';
const NO = 'No people, no faces, no hands, no logos, no real brand marks, no watermarks.';
const STYLE = `A YouTube video thumbnail for a desk setup and productivity app review channel, bright and high contrast, crisp, saturated colors, bold sans-serif text with a thick outline. ${NO} Any monitor, laptop or keyboard has plain blank bezels with no logo, badge or lettering at all.`;
const THUMBS = {
  'desk-setup-daily-2': [`${STYLE} A freshly rebuilt minimal wooden desk, a dramatic before/after feel: a clean light-wood desk with one ultrawide monitor showing a calm made-up focus app, a warm desk lamp, a tidy keyboard, a mug and a small plant, bright warm light. Bold yellow text reading exactly "UNDER $300" at the top left.`],
  'desk-setup-daily-3': [`${STYLE} A laptop on a white desk showing five colorful made-up app icons as rounded squares in a row, a small plant and a notebook, mint green and cream colors. Bold white text reading exactly "5 FREE APPS" with a dark green outline.`],
  'desk-setup-daily-4': [`${STYLE} A tidy underside-of-desk view: neatly bundled black cables in a cable tray with velcro ties, a power strip and a few plain cable clips, cool blue light; the desk above shows only its underside and edge, no monitor or laptop in the frame. Bold white text reading exactly "NO MORE CABLES" on a dark navy band.`],
  'desk-setup-daily-5': [`${STYLE} A height-adjustable standing desk raised high with a laptop and a monitor on it, a small timer showing 30, an energetic orange and teal color scheme. Bold white text reading exactly "30 DAYS" with an orange outline.`],
  'desk-setup-daily-6': [`${STYLE} A side-by-side layout of three laptops and monitors each showing a different made-up notes app, purple, green and orange interfaces, on a clean desk, a small trophy-like gold star floating above the middle one. Bold white text reading exactly "NOTES APPS" at the top.`],
};
const BANNER = `A very wide, panoramic YouTube channel banner photo (21:9). A long light-wood desk runs across the whole width along the lower third of the picture, with plain pale warm wall above it. Left to right along the desk: a green plant in a pot, a small desk lamp, a mechanical keyboard with beige keys, a ceramic mug, a stack of notebooks, a small succulent, a pen cup. Nothing tall in the middle: all objects sit low, so a thin horizontal strip across the middle still shows desk items. Soft warm morning light, soft teal and yellow accents. ${NO} Absolutely no text, no letters, no numbers, no screens, no laptops and no monitors anywhere.`;

async function assets() {
  const LOG = join(OUT, 'prompts.4c8bc671.json');
  const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : {};
  const key = execFileSync('security', ['find-generic-password', '-s', 'fal-key', '-w'], { encoding: 'utf8' }).trim();
  const jobs = [
    ...Object.entries(THUMBS).map(([id, [prompt]]) => ({ id: `thumb-${id}`, dest: join(OUT, `thumb-${id}.webp`), prompt, aspect: '16:9', res: '1K', fit: ['-resize', '768x432^', '-gravity', 'center', '-extent', '768x432'] })),
    // YouTube shows the banner in a ~6.3:1 strip: generate 21:9 at 2K and crop the middle to 2140x340 (1070 CSS px @2x)
    { id: 'banner-desk-setup-daily', dest: join(OUT, 'banner-desk-setup-daily.webp'), prompt: BANNER, aspect: '21:9', res: '2K', fit: ['-resize', '2140x', '-gravity', 'South', '-crop', '2140x342+0+170', '+repage'] },
  ];
  await Promise.all(jobs.map(async (j) => {
    if (existsSync(j.dest) && !FORCE) { console.log('on disk', j.id); return; }
    const res = await fetch(`https://fal.run/${MODEL}`, { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: j.prompt, aspect_ratio: j.aspect, resolution: j.res, output_format: 'png', num_images: 1 }), signal: AbortSignal.timeout(300000) });
    if (!res.ok) throw new Error(`fal ${res.status} for ${j.id}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    const img = await fetch(json.images[0].url);
    const raw = join(tmp, j.id + '.png');
    writeFileSync(raw, Buffer.from(await img.arrayBuffer()));
    execFileSync('magick', [raw, ...j.fit, '-strip', '-quality', '84', j.dest]);
    log[j.id] = { id: j.id, model: MODEL, prompt: j.prompt, request_id: res.headers.get('x-fal-request-id') ?? json.request_id ?? null, at: new Date().toISOString() };
    console.log('made', j.dest);
  }));
  writeFileSync(LOG, JSON.stringify(log, null, 2) + '\n');
}

// ---------- pages file (merged, other entries kept) ----------
const PF = join(OUT, 'pages.channel.json');
function savePage(id, entry) {
  const pages = existsSync(PF) ? JSON.parse(readFileSync(PF, 'utf8')) : { chat: 'sponsors', pages: {} };
  pages.pages[id] = entry;
  writeFileSync(PF, JSON.stringify(pages, null, 2) + '\n');
}
const shot = async (page, id) => {
  const png = join(tmp, id + '.png');
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 1470, height: 837 } });
  execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', join(OUT, id + '.webp')], { stdio: 'ignore' });
};
const newCtx = (browser) => browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles', userAgent: UA });

// ---------- 2. YouTube channel page ----------
// [title, thumb, duration, views, age]
// the newest upload is the one the Gmail pitch quotes (plays/sponsors/compose.webp): "I Rebuilt My Desk for Focus (Under $300)"
const videos = () => [
  ['I Rebuilt My Desk for Focus (Under $300)', 'desk-setup-daily-2', '10:48', '41K', '2d ago'],
  ['7 Productivity Apps I Actually Use at My Desk (Honest Review)', 'desk-setup-daily', '12:04', '96K', '5d ago'],
  ['5 Free Apps That Changed How I Work', 'desk-setup-daily-3', '9:15', '54K', '3w ago'],
  ['Cable Management That Actually Lasts', 'desk-setup-daily-4', '7:48', '33K', '1mo ago'],
  ['I Tried the Standing Desk Routine for 30 Days', 'desk-setup-daily-5', '11:37', '41K', '1mo ago'],
  ['Notes Apps Compared: Which One Wins?', 'desk-setup-daily-6', '13:02', '62K', '2mo ago'],
].map(([title, th, dur, views, age], i) => ({ title, dur, views, age, thumb: b64(`${OUT}/thumb-${th}.webp`), href: `/watch?v=desksetupdaily-${i}` }));
const DESC = 'Desk setups and productivity app reviews. Honest takes on the apps, gear and habits that make a workday easier, tested on my own desk for weeks before I say a word. New video every week.';

async function channel(browser) {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  // any real channel with the standard header + video grid works as the donor; every visible string and image is replaced below
  await page.goto('https://www.youtube.com/@aliabdaal/videos', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('ytd-rich-item-renderer img').length >= 6, null, { timeout: 40000 });
  await page.waitForTimeout(3000);
  for (const y of [500, 1000, 0]) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(900); }
  const banner = b64(`${OUT}/banner-desk-setup-daily.webp`);
  const avatar = b64(`${PARTS}/ch-desk-setup-daily.webp`);
  const res = await page.evaluate(({ videos, desc, banner, avatar }) => {
    const seconds = (d) => { const [m, s] = d.split(':').map(Number); return `${m} minute${m === 1 ? '' : 's'}, ${s} second${s === 1 ? '' : 's'}`; };
    const hdr = document.querySelector('yt-page-header-view-model');
    // banner
    document.querySelectorAll('yt-image-banner-view-model img').forEach((im) => { im.src = banner; im.removeAttribute('srcset'); });
    // avatar
    hdr.querySelectorAll('yt-avatar-shape img').forEach((im) => { im.src = avatar; im.removeAttribute('srcset'); });
    // name (no verified tick)
    const h1 = hdr.querySelector('h1');
    h1.setAttribute('aria-label', 'Desk Setup Daily');
    const nameSpan = h1.querySelector('span[role="text"]');
    nameSpan.replaceChildren(document.createTextNode('Desk Setup Daily'));
    // handle, subscribers, videos
    const meta = [...hdr.querySelectorAll('yt-content-metadata-view-model span[role="text"]')];
    const set = (el, text, label) => { el.replaceChildren(document.createTextNode(text)); if (label) el.setAttribute('aria-label', label); };
    meta.find((e) => /^@/.test(e.textContent)).replaceChildren(document.createTextNode('@desksetupdaily'));
    const subs = meta.find((e) => /subscribers/.test(e.textContent)); set(subs, '88K subscribers', '88 thousand subscribers'); subs.setAttribute('data-staged', 'subs');
    set(meta.find((e) => /videos?$/.test(e.textContent.trim()) && !/subscribers/.test(e.textContent)), '212 videos');
    // description (visible + hidden copy), links line removed, button label
    hdr.querySelectorAll('truncated-text-content > span[role="text"]').forEach((s) => (s.textContent = desc + ' '));
    hdr.querySelector('.ytTruncatedTextAbsoluteButton')?.setAttribute('aria-label', 'Description. ' + desc.slice(0, 60) + '...tap for more.');
    hdr.querySelectorAll('yt-attribution-view-model').forEach((e) => e.remove());
    // tabs: only the ones a small channel has
    document.querySelectorAll('yt-tab-shape').forEach((t) => { if (/^(Shows|Podcasts|Store|Posts)$/.test(t.textContent.trim())) t.remove(); });
    // video grid: keep six plain upload rows (a duration badge, one metadata row)
    const grid = document.querySelector('ytd-rich-grid-renderer #contents');
    const items = [...grid.querySelectorAll(':scope > ytd-rich-item-renderer')];
    const plain = items.filter((it) => /^\d+:\d\d$/.test(it.querySelector('.ytBadgeShapeText')?.textContent.trim() ?? '') && it.querySelectorAll('.ytContentMetadataViewModelMetadataRow').length === 1 && it.querySelectorAll('.ytContentMetadataViewModelMetadataText').length === 2 && it.querySelectorAll('.ytContentMetadataViewModelMetadataRow svg').length === 1);
    if (plain.length < videos.length) throw new Error(`only ${plain.length} plain video items`);
    [...grid.children].forEach((c) => { if (!plain.slice(0, videos.length).includes(c)) c.remove(); });
    [...grid.children].forEach((it, i) => {
      const v = videos[i];
      it.querySelectorAll('a[href^="/watch"]').forEach((a) => a.setAttribute('href', v.href));
      it.querySelectorAll('img').forEach((im) => { im.src = v.thumb; im.removeAttribute('srcset'); im.alt = ''; });
      it.querySelectorAll('.ytBadgeShapeText').forEach((t) => (t.textContent = v.dur));
      it.querySelectorAll('badge-shape[aria-label]').forEach((t) => t.setAttribute('aria-label', seconds(v.dur)));
      it.querySelectorAll('h3').forEach((h) => { h.setAttribute('title', v.title); h.setAttribute('aria-label', v.title); });
      const ta = it.querySelector('a.ytLockupMetadataViewModelTitle');
      ta.setAttribute('aria-label', `${v.title} ${seconds(v.dur)}`); ta.firstElementChild.textContent = v.title;
      const txt = it.querySelectorAll('.ytContentMetadataViewModelMetadataText');
      txt[0].textContent = v.views; txt[0].setAttribute('aria-label', v.views.replace('K', ' thousand') + ' views');
      txt[1].textContent = v.age; txt[1].setAttribute('aria-label', v.age.replace('d ago', ' days ago').replace('w ago', ' weeks ago').replace('mo ago', ' months ago'));
      if (i === 0) it.setAttribute('data-staged', 'video1');
      it.querySelectorAll('yt-thumbnail-hover-overlay-toggle-activated-view-model, yt-thumbnail-overlay-badge-view-model').forEach((e) => e.remove());
    });
    document.querySelectorAll('ytd-video-preview, video').forEach((e) => { try { e.pause?.(); } catch {} e.remove(); });
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
    document.title = 'Desk Setup Daily - YouTube';
    // links that still carry the donor's handle (sign-in "next", Community) point at the staged channel
    document.querySelectorAll('a[href*="aliabdaal" i], a[href*="Abdaal" i]').forEach((a) => a.setAttribute('href', a.getAttribute('href').replace(/aliabdaal|Abdaal/gi, 'desksetupdaily')));
    return { items: grid.children.length };
  }, { videos: videos(), desc: DESC, banner, avatar });
  await page.mouse.move(1440, 800);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3500);
  // safety + verification: no foreign image survives, no donor name anywhere in the visible text or attributes
  const check = await page.evaluate(() => {
    const foreign = [...document.querySelectorAll('img')].filter((i) => i.getBoundingClientRect().width > 0 && !i.src.startsWith('data:image/webp')).map((i) => i.src.slice(0, 60));
    const rx = /ali abdaal|aliabdaal|superfocus|abdaal/i;
    const attrs = [...document.body.querySelectorAll('*')].flatMap((e) => ['aria-label', 'title', 'alt', 'href', 'placeholder'].map((n) => e.getAttribute(n)).filter((v) => v && rx.test(v)));
    const html = document.body.innerText + '\n' + attrs.join('\n');
    return { foreign, donor: [...html.matchAll(/.{60}(ali abdaal|aliabdaal|superfocus).{40}/gi)].map((m) => m[0]).slice(0, 8), title: document.title, vids: document.querySelectorAll('ytd-rich-item-renderer').length };
  });
  console.log(res, check);
  if (check.foreign.length || check.donor.length) throw new Error('staging check failed: ' + JSON.stringify(check));
  const m = await page.evaluate(() => {
    const c = (e) => { const r = e.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10]; };
    return { subs: c(document.querySelector('[data-staged="subs"]')), video1: c(document.querySelector('[data-staged="video1"] yt-thumbnail-view-model')), title: document.title, host: location.host.replace(/^www\./, ''), path: '/@desksetupdaily/videos' };
  });
  console.log(m);
  await shot(page, 'channel');
  savePage('channel', { img: 'channel.webp', title: m.title, host: m.host, path: m.path, fav: 'fav-youtube.png', targets: { subs: m.subs, video1: m.video1 }, scroll: null, field: null });
  await ctx.close();
}

// ---------- 3. Baserow public grid as the sponsorship sheet ----------
const SHEET_URL = 'https://baserow.io/public/grid/MYR9ueBXy422VcHaH3MHdDc4_Ylp1wL0YVC9TuHOYeU';
const SHEET_PATH = '/public/grid/q7Vn2kXe0uLmT4rBz9QhYcWd3sJf6AaGpR1oNiUxE8M'; // made-up share token for the address bar
// [label, width, kind]: kind text | number
const COLS = [['Channel', 232, 'text'], ['Subscribers', 130, 'number'], ['Format', 192, 'text'], ['Rate', 100, 'number'], ['Live date', 112, 'text'], ['Status', 112, 'text'], ['Tracking link', 232, 'text']];
const ROWS = [
  ['Desk Setup Daily', '88k', '60-second integration', '$900', 'Oct 28', 'Booked', 'quillnote.app/r/desksetup'],
  ['Calm Code', '142k', 'Dedicated review', '$1,600', 'Nov 4', 'Booked', 'quillnote.app/r/calmcode'],
  ['Tidy Tabs', '~60k', '45-second mention', '$650', 'Nov 9', 'Booked', 'quillnote.app/r/tidytabs'],
];

async function sheet(browser) {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await page.goto(SHEET_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.grid-view__right .grid-view__row', { timeout: 30000 });
  await page.waitForTimeout(2000);
  const setup = (rowsData) => page.evaluate(({ cols, rows, token }) => {
    const L = document.querySelector('.grid-view__left'), R = document.querySelector('.grid-view__right');
    const tpl = window.__tpl ??= {
      lhead: L.querySelector('.grid-view__head .grid-view__column:not(.grid-view__column--no-border-right)').cloneNode(true),
      rhead: [...R.querySelectorAll('.grid-view__head .grid-view__column')].find((e) => e.querySelector('.baserow-icon-hashtag') === null).cloneNode(true),
      rheadNum: [...R.querySelectorAll('.grid-view__head .grid-view__column')].find((e) => e.querySelector('.baserow-icon-hashtag')).cloneNode(true),
      lrow: L.querySelector('.grid-view__body .grid-view__row').cloneNode(true),
      rrow: R.querySelector('.grid-view__body .grid-view__row').cloneNode(true),
      lfoot: L.querySelector('.grid-view__foot .grid-view__foot-info').cloneNode(true),
    };
    const textCell = tpl.rrow.querySelector('.grid-field-text').closest('.grid-view__column').cloneNode(true);
    const numCell = tpl.rrow.querySelector('.grid-field-number').closest('.grid-view__column').cloneNode(true);
    const setHead = (col, label, w, icon) => {
      col.style.width = w + 'px'; col.classList.remove('grid-view__column--sorted');
      col.querySelector('.grid-view__description-name').title = label; col.querySelector('.grid-view__description-name span').textContent = label;
      col.querySelector('.grid-view__description-extra-icon')?.remove();
      return col;
    };
    // header
    const lh = L.querySelector('.grid-view__head'); const rh = R.querySelector('.grid-view__head');
    lh.querySelector('.grid-view__column:not(.grid-view__column--no-border-right)')?.remove();
    lh.appendChild(setHead(tpl.lhead.cloneNode(true), cols[0][0], cols[0][1]));
    rh.replaceChildren(...cols.slice(1).map(([label, w, kind]) => { const c = setHead((kind === 'number' ? tpl.rheadNum : tpl.rhead).cloneNode(true), label, w); return c; }));
    // body rows
    const lb = L.querySelector('.grid-view__body'), rb = R.querySelector('.grid-view__body');
    const place = (body, items) => {
      const inner = body.querySelector('.grid-view__body-inner') ?? body;
      const real = inner.querySelector('.grid-view__rows') ?? inner;
      [...real.querySelectorAll(':scope > .grid-view__row')].forEach((r) => r.remove());
      items.forEach((r) => real.appendChild(r));
      return real;
    };
    const lrows = rows.map((r, i) => { const row = tpl.lrow.cloneNode(true); row.querySelector('.grid-view__row-count').title = String(i + 1); row.querySelector('.grid-view__row-count-content').textContent = String(i + 1);
      const col = row.querySelector('.grid-view__cell').closest('.grid-view__column'); col.style.width = cols[0][1] + 'px'; col.querySelector('.grid-field-text').textContent = r[0]; return row; });
    const rrows = rows.map((r) => { const row = tpl.rrow.cloneNode(true); row.replaceChildren(...cols.slice(1).map(([, w, kind], k) => { const c = (kind === 'number' ? numCell : textCell).cloneNode(true); c.style.width = w + 'px'; c.querySelector('.grid-field-text, .grid-field-number').textContent = r[k + 1]; return c; })); return row; });
    place(lb, lrows); place(rb, rrows);
    // widths: left = row number col + primary, right = rest; placeholders + column dividers follow
    const lw = 72 + cols[0][1], rw = cols.slice(1).reduce((s, c) => s + c[1], 0);
    L.style.width = lw + 'px'; L.querySelectorAll('.grid-view__inner').forEach((e) => (e.style.minWidth = lw + 'px'));
    R.style.left = lw + 'px'; R.querySelectorAll('.grid-view__inner').forEach((e) => (e.style.minWidth = rw + 'px'));
    document.querySelectorAll('.grid-view__divider, .grid-view__freeze-handle, .scrollbars').forEach((e) => (e.style.left = lw + 'px'));
    document.querySelectorAll('.scrollbars').forEach((e) => e.remove());
    const rowH = 33;
    const ph = lb.querySelector('.grid-view__placeholder'), phr = rb.querySelector('.grid-view__placeholder');
    if (ph) { ph.style.height = rows.length * rowH + 'px'; ph.style.width = lw + 'px'; ph.querySelectorAll('.grid-view__placeholder-column').forEach((e) => e.remove()); }
    if (phr) { phr.style.height = rows.length * rowH + 'px'; phr.style.width = rw + 'px'; phr.replaceChildren(); let x = 0; cols.slice(1).forEach((c) => { x += c[1]; const d = document.createElement('div'); d.className = 'grid-view__placeholder-column'; d.style.left = (x - 1) + 'px'; phr.appendChild(d); }); }
    // foot: row count, aggregations
    L.querySelector('.grid-view__foot-info').textContent = rows.length === 1 ? '1 row' : `${rows.length} rows`;
    const lfoot = L.querySelector('.grid-view__foot > div:not(.grid-view__foot-info)'); if (lfoot) lfoot.style.width = cols[0][1] + 'px';
    const rf = R.querySelector('.grid-view__foot'); const unit = rf.firstElementChild;
    rf.replaceChildren(...cols.slice(1).map(([, w]) => { const d = unit.cloneNode(true); d.style.width = w + 'px'; return d; }));
    // toolbar: view name, no active sort
    const vn = document.querySelector('.header__filter-name--forced span'); if (vn) vn.textContent = 'Quillnote sponsorships';
    const sort = [...document.querySelectorAll('.header__filter-name')].find((e) => /Sort/.test(e.textContent)); if (sort) { sort.textContent = 'Sort'; sort.closest('a').classList.remove('active', 'active--warning'); }
    document.title = 'Quillnote sponsorships';
    history.replaceState(null, '', token);
    return { lrows: lrows.length, scrolled: document.querySelectorAll('.scrollbars').length, html: rb.innerHTML.slice(0, 400) };
  }, { cols: COLS, rows: rowsData, token: SHEET_PATH });
  console.log('before', await setup([['', '', '', '', '', '', '']])); // header + one empty row
  await page.mouse.move(1440, 820); await page.waitForTimeout(800);
  await shot(page, 'sheet-before');
  console.log('after', await setup(ROWS));
  await page.mouse.move(1440, 820); await page.waitForTimeout(800);
  const check = await page.evaluate(() => ({ text: document.body.innerText, rows: document.querySelectorAll('.grid-view__right .grid-view__body .grid-view__row').length }));
  console.log(check.rows, JSON.stringify(check.text.slice(0, 500)));
  if (check.rows !== ROWS.length || /Peter|Cynthia|Brandon|Agency|Team Number|Points/.test(check.text)) throw new Error('sheet staging check failed');
  const m = await page.evaluate(() => {
    const c = (e) => { const r = e.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10]; };
    const rows = [...document.querySelectorAll('.grid-view__left .grid-view__body .grid-view__row')];
    return { row1: c(rows[0].querySelector('.grid-view__cell')), row2: c(rows[1].querySelector('.grid-view__cell')), row3: c(rows[2].querySelector('.grid-view__cell')), head: c(document.querySelector('.grid-view__left .grid-view__description')), title: document.title };
  });
  console.log(m);
  await shot(page, 'sheet-after');
  // favicon: Baserow's own, scaled to 64px
  const res = await ctx.request.get('https://baserow.io/img/favicon_192.png');
  const raw = join(tmp, 'fav-sheet.png'); writeFileSync(raw, await res.body());
  execFileSync('sips', ['-s', 'format', 'png', '-z', '64', '64', raw, '--out', join(OUT, 'fav-sheet.png')], { stdio: 'ignore' });
  const common = { title: m.title, host: 'baserow.io', path: SHEET_PATH, fav: 'fav-sheet.png', scroll: null, field: null };
  savePage('sheet-before', { img: 'sheet-before.webp', ...common, targets: { head: m.head } });
  savePage('sheet-after', { img: 'sheet-after.webp', ...common, targets: { row1: m.row1, row2: m.row2, row3: m.row3 } });
  await ctx.close();
}

try {
  if (stage === 'assets' || stage === 'all') await assets();
  if (stage !== 'assets') {
    const browser = await chromium.launch({ headless: true });
    try {
      if (stage === 'channel' || stage === 'all') await channel(browser);
      if (stage === 'sheet' || stage === 'all') await sheet(browser);
    } finally { await browser.close(); }
  }
  console.log('done');
} catch (e) {
  console.error(e.stack ?? e);
  throw e;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
