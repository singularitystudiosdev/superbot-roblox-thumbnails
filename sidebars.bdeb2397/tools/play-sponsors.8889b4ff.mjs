// The sponsors play's page "yt-search": YouTube's real search results for "productivity app review" (public, signed out,
// headless Chromium), staged with the chat's made-up channels and generated thumbnails (plays/sponsors/thumb-*.webp from
// play-sponsors-thumbs.8889b4ff.mjs, avatars chats/parts/ch-*.webp). Staging = DOM edits only (text, src swaps); the
// Shorts shelf, chapters rows and verified/other badges are removed. Writes plays/sponsors/yt-search.webp, fav-youtube.png
// and the "yt-search" entry of plays/sponsors/pages.json (other pages' entries are kept).
//   node sidebars.bdeb2397/tools/play-sponsors.8889b4ff.mjs
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

// [channel, avatar, thumb, title, duration, views, age, snippet [text, bold?][]]
const VIDEOS = [
  ['Desk Setup Daily', 'ch-desk-setup-daily', 'desk-setup-daily', '7 Productivity Apps I Actually Use at My Desk (Honest Review)', '12:04', '96K', '5 days ago',
    [['A desk setup tour and an honest ', 0], ['productivity app review', 1], [': the 7 ', 0], ['apps', 1], [' that stay open on my screens all day, what I pay for and what I dropped.', 0]]],
  ['Calm Code', 'ch-calm-code', 'calm-code', 'Best Focus Apps for Developers, Tested for a Week', '14:31', '61K', '2 weeks ago',
    [['I tried five focus ', 0], ['apps', 1], [' while shipping a side project. Timers, blockers and notes: a ', 0], ['review', 1], [' of what actually helped.', 0]]],
  ['Tidy Tabs', 'ch-tidy-tabs', 'tidy-tabs', 'This Productivity App Replaced My 40 Browser Tabs', '8:19', '38K', '3 weeks ago',
    [['How I went from forty open tabs to three, with one ', 0], ['productivity app', 1], [' and a simple weekly reset. Full ', 0], ['review', 1], [' inside.', 0]]],
  ['Focus Friday', 'ch-focus-friday', 'focus-friday', 'Productivity App Review: Is Deep Work Mode Worth It?', '9:42', '27K', '1 month ago',
    [['Four weeks of Friday deep work sessions with a focus timer ', 0], ['app', 1], ['. My honest ', 0], ['review', 1], [' and settings.', 0]]],
  ['Workflow Weekly', 'ch-workflow-weekly', 'workflow-weekly', 'I Automated My Whole Week: 5 Workflow Apps Reviewed', '15:08', '74K', '2 months ago',
    [['Five ', 0], ['apps', 1], [' that connect your tools and remove repetitive work. Setup walkthroughs and a ', 0], ['review', 1], [' of each.', 0]]],
  ['Keyboard & Coffee', 'ch-keyboard-coffee', 'keyboard-coffee', 'My Morning Setup: Keyboard, Coffee and 3 Productivity Apps', '10:26', '19K', '4 months ago',
    [['Slow mornings, a good keyboard and three ', 0], ['productivity apps', 1], [' I open first. A relaxed ', 0], ['review', 1], [' and my coffee routine.', 0]]],
].map(([ch, av, th, title, dur, views, age, snip]) => ({ ch, title, dur, views, age, snip, avatar: b64(`${PARTS}/${av}.webp`), thumb: b64(`${OUT}/thumb-${th}.webp`), slug: ch.toLowerCase().replace(/[^a-z]+/g, '') }));

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1470, height: 837 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Los_Angeles' });
const page = await ctx.newPage();
await page.goto('https://www.youtube.com/results?search_query=productivity+app+review', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelectorAll('ytd-video-renderer').length >= 6 && document.querySelector('ytd-video-renderer img'), null, { timeout: 40000 });
await page.waitForTimeout(3000);
// lazy rows load their own images when scrolled near: scroll through once so none is replaced after staging
for (const y of [600, 1200, 1800, 2400, 0]) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(1200); }
await page.waitForTimeout(1500);

const info = await page.evaluate((videos) => {
  const sec = document.querySelector("ytd-search ytd-section-list-renderer > #contents > ytd-item-section-renderer > #contents");
  // keep only video rows, drop the Shorts shelf and anything else (ads, people also watched ...)
  [...sec.children].forEach((c) => { if (c.tagName !== 'YTD-VIDEO-RENDERER') c.remove(); });
  [...sec.children].slice(videos.length).forEach((c) => c.remove());
  document.querySelectorAll("ytd-search ytd-section-list-renderer > #contents > *:not(ytd-item-section-renderer)").forEach((c) => c.remove());
  const rows = [...sec.children];
  const seconds = (d) => { const [m, s] = d.split(':').map(Number); return `${m} minute${m === 1 ? '' : 's'}, ${s} second${s === 1 ? '' : 's'}`; };
  rows.forEach((row, i) => {
    const v = videos[i];
    const href = `/watch?v=${v.slug}-${i}`;
    // thumbnail
    const th = row.querySelector('ytd-thumbnail');
    th.querySelectorAll('img').forEach((im) => { im.src = v.thumb; im.removeAttribute('srcset'); im.alt = ''; });
    th.querySelectorAll('a').forEach((a) => a.setAttribute('href', href));
    th.querySelectorAll('.ytBadgeShapeText').forEach((t) => (t.textContent = v.dur));
    th.querySelectorAll('badge-shape[aria-label]').forEach((t) => t.setAttribute('aria-label', seconds(v.dur)));
    th.querySelectorAll('#time-status #text').forEach((t) => { t.textContent = v.dur; t.setAttribute('aria-label', seconds(v.dur)); });
    // title
    const a = row.querySelector('a#video-title');
    a.setAttribute('title', v.title); a.setAttribute('href', href); a.setAttribute('aria-label', `${v.title} ${seconds(v.dur)}`);
    const yfs = a.querySelector('yt-formatted-string'); yfs.textContent = v.title; yfs.setAttribute('aria-label', `${v.title} ${seconds(v.dur)}`);
    // views + age
    const items = row.querySelectorAll('#metadata-line .inline-metadata-item');
    items[0].textContent = v.views; items[1].textContent = v.age.replace(/ days?/, 'd').replace(/ weeks?/, 'w').replace(/ months?/, 'mo');
    row.querySelectorAll('#metadata-line .inline-metadata-item').forEach((e, k) => { if (k > 1) e.remove(); });
    row.querySelectorAll('#additional-metadata-line, ytd-video-meta-block .inline-metadata-badge').forEach((e) => e.replaceChildren());
    // channel (avatar, name, no verified badge)
    const ci = row.querySelector('#channel-info');
    ci.querySelector('#channel-thumbnail').setAttribute('href', `/@${v.slug}`);
    ci.querySelector('#channel-thumbnail').setAttribute('aria-label', `Go to channel ${v.ch}`);
    const av = ci.querySelector('#channel-thumbnail img'); av.src = v.avatar; av.removeAttribute('srcset');
    const nameA = ci.querySelector('#channel-name a'); nameA.textContent = v.ch; nameA.setAttribute('href', `/@${v.slug}`);
    ci.querySelectorAll('#channel-name #tooltip').forEach((t) => (t.textContent = v.ch));
    ci.querySelectorAll('#channel-name yt-formatted-string').forEach((t) => t.setAttribute('title', ''));
    ci.querySelectorAll('ytd-badge-supported-renderer').forEach((e) => e.replaceChildren());
    row.querySelectorAll('ytd-video-meta-block #channel-name').forEach((e) => e.replaceChildren());
    // description snippet
    row.querySelectorAll('.metadata-snippet-text, .metadata-snippet-text-navigation').forEach((el) => {
      el.replaceChildren(...v.snip.map(([t, bold]) => Object.assign(document.createElement('span'), { className: 'style-scope yt-formatted-string' + (bold ? ' bold' : ''), textContent: t })));
      el.querySelectorAll('.bold').forEach((s) => s.setAttribute('style-target', 'bold'));
    });
    // no chapters, no 4K/CC, no product badges
    row.querySelector('#expandable-metadata')?.replaceChildren();
    row.querySelector('#badges')?.replaceChildren();
    row.querySelectorAll('ytd-menu-renderer').forEach(() => {});
  });
  // YouTube's inline hover preview (a real video playing in a row) must not be in the capture
  document.querySelectorAll("ytd-video-preview, ytd-thumbnail-overlay-toggle-button-renderer, video").forEach((e) => { try { e.pause?.(); } catch {} e.remove(); });
  rows.forEach((r) => r.querySelectorAll("ytd-thumbnail").forEach((t) => { t.removeAttribute("is-preview-loading"); t.querySelector("#hover-overlays")?.replaceChildren(); }));
  document.activeElement?.blur?.();
  window.scrollTo(0, 0);
  return rows.length;
}, VIDEOS);
await page.mouse.move(1440, 800);
await page.waitForTimeout(1500);

// Safety + verification: nothing of the real results may remain; staging still in place
const check = await page.evaluate((videos) => {
  const imgs = [...document.querySelectorAll('img')].filter((i) => i.getBoundingClientRect().width > 0).map((i) => i.src.slice(0, 40));
  const foreign = [...document.querySelectorAll("img")].filter((i) => i.getBoundingClientRect().width > 0 && !i.src.startsWith("data:image/webp")).map((i) => { const r = i.getBoundingClientRect(); const chain = []; for (let e = i; e && chain.length < 5; e = e.parentElement) chain.push(e.tagName.toLowerCase() + (e.id ? "#" + e.id : "")); return chain.join("<") + " " + [r.x, r.y, r.width, r.height].map(Math.round); }); const _unused = imgs.filter((s) => !s.startsWith('data:image/webp'));
  const rows = [...document.querySelectorAll('ytd-video-renderer')];
  const titles = rows.map((r) => r.querySelector('#video-title').textContent.trim());
  return { n: rows.length, foreign, titlesOk: videos.every((v, i) => titles[i] === v.title), shorts: document.querySelectorAll("grid-shelf-view-model, ytd-reel-shelf-renderer, ytd-video-preview, video").length };
}, VIDEOS);
console.log(check);
if (check.foreign.length || !check.titlesOk || check.shorts) throw new Error('staging check failed: ' + JSON.stringify(check));

// measure
const m = await page.evaluate(() => {
  const c = (e) => { const r = e.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * 10) / 10, Math.round((r.y + r.height / 2) * 10) / 10]; };
  const row = document.querySelector('ytd-video-renderer');
  return { video1: c(row.querySelector('ytd-thumbnail')), video1Title: c(row.querySelector('a#video-title yt-formatted-string')), channel1: c(row.querySelector('#channel-info #channel-name a')), channel1Avatar: c(row.querySelector('#channel-thumbnail')),
    title: document.title, host: location.host.replace(/^www\./, ''), path: location.pathname + location.search };
});
console.log(m);

const tmp = mkdtempSync(join(tmpdir(), 'play-sponsors-'));
const png = join(tmp, 'yt.png');
await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 1470, height: 837 } });
execFileSync('cwebp', ['-q', '80', '-m', '6', png, '-o', join(OUT, 'yt-search.webp')], { stdio: 'ignore' });

// trace check: staged page text + attributes carry none of the real results' names (public page, no account)
// favicon: the site's own largest png icon
const icon = await page.evaluate(() => [...document.querySelectorAll('link[rel~="icon"]')].map((l) => ({ href: l.href, sizes: l.sizes?.toString() })));
const pick = icon.filter((i) => /png/.test(i.href) || i.sizes).sort((a, z) => parseInt(z.sizes) - parseInt(a.sizes))[0] ?? icon[0];
const res = await ctx.request.get(pick.href);
const raw = join(tmp, 'fav.' + (pick.href.includes('.ico') ? 'ico' : 'png'));
writeFileSync(raw, await res.body());
execFileSync('sips', ['-s', 'format', 'png', '-z', '64', '64', raw, '--out', join(OUT, 'fav-youtube.png')], { stdio: 'ignore' });
console.log('favicon from', pick.href);

const pf = join(OUT, 'pages.json');
const pages = existsSync(pf) ? JSON.parse(readFileSync(pf, 'utf8')) : { chat: 'sponsors', pages: {} };
pages.pages['yt-search'] = { img: 'yt-search.webp', title: m.title, host: m.host, path: m.path, fav: 'fav-youtube.png', targets: { video1: m.video1, channel1: m.channel1, 'video1-title': m.video1Title, 'channel1-avatar': m.channel1Avatar }, scroll: null, field: null };
writeFileSync(pf, JSON.stringify(pages, null, 2) + '\n');
rmSync(tmp, { recursive: true, force: true });
await browser.close();
console.log('done');
