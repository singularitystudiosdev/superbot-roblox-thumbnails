// Turns the serialized Roblox pages (raw/*.json, from serialize.af4c3c6b.js run in the user's signed-in Chrome) into
// self-contained static pages for the ad: the cross-origin stylesheets fetched in, every image and font downloaded to
// one shared assets folder, then each page loaded headlessly to scrub what must not be published (the thumbnail table's
// real analytics, the Robux balance) and written back as a standards-mode document. Prints a JSON report.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [RAW, OUT] = process.argv.slice(2);
if (!RAW || !OUT) throw new Error('usage: rbx-build <rawDir> <outDir>');
const PAGES = ['game', 'thumbs', 'thumbs-edit'];
const ASSETS = path.join(OUT, 'assets');
fs.mkdirSync(ASSETS, { recursive: true });

const abs = (u, base) => { try { return new URL(u, base).href; } catch { return u; } };
const fixUrls = (text, base) => text.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => (u.startsWith('data:') ? m : `url("${abs(u, base)}")`));
const EXT = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'font/woff2': 'woff2', 'font/woff': 'woff', 'application/font-woff': 'woff', 'font/ttf': 'ttf', 'application/x-font-ttf': 'ttf' };
const ASSET_RE = /\.(woff2?|ttf|otf|png|jpe?g|webp|gif|svg)(\?|#|$)|tr\.rbxcdn\.com\//i;

const report = { pages: {}, assets: 0, bytes: 0, failed: [] };
const cache = new Map(); // url -> local file name

async function fetchText(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}
async function download(url) {
  if (cache.has(url)) return cache.get(url);
  const p = (async () => {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 Chrome/141.0' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const type = (r.headers.get('content-type') || '').split(';')[0].trim();
      const fromUrl = (url.match(/\.(woff2?|ttf|otf|png|jpe?g|webp|gif|svg)(\?|#|$)/i) || [])[1];
      const buf = Buffer.from(await r.arrayBuffer());
      // the bytes say what a file is when the CDN's content type does not (tr.rbxcdn.com serves some as octet-stream)
      const head = buf.subarray(0, 16).toString('latin1');
      const sniffed = head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP' ? 'webp' : head.startsWith('\x89PNG') ? 'png'
        : head.startsWith('\xff\xd8') ? 'jpg' : head.startsWith('GIF8') ? 'gif' : head.startsWith('wOF2') ? 'woff2' : head.startsWith('wOFF') ? 'woff'
        : /^\s*(<\?xml|<svg)/.test(buf.subarray(0, 200).toString('utf8')) ? 'svg' : null;
      const ext = sniffed || EXT[type] || (fromUrl && fromUrl.toLowerCase().replace('jpeg', 'jpg')) || 'bin';
      const name = `${crypto.createHash('sha1').update(url).digest('hex').slice(0, 14)}.${ext}`;
      fs.writeFileSync(path.join(ASSETS, name), buf);
      report.assets += 1; report.bytes += buf.length;
      return name;
    } catch (e) {
      report.failed.push(`${url} :: ${e.message}`);
      return null;
    }
  })();
  cache.set(url, p);
  return p;
}
async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

for (const name of PAGES) {
  const j = JSON.parse(fs.readFileSync(path.join(RAW, `${name}.json`), 'utf8'));
  // the stylesheets the page could not read back come first: they are the <link>ed files, ahead of runtime styles
  const linked = await pool(j.blocked, 6, async (href) => {
    try { return fixUrls(await fetchText(href), href); } catch (e) { report.failed.push(`css ${href} :: ${e.message}`); return ''; }
  });
  let css = `${linked.join('\n')}\n${j.css}`;
  let html = j.html;
  const urls = new Set();
  for (const m of css.matchAll(/url\("(https?:\/\/[^"]+)"\)/g)) if (ASSET_RE.test(m[1])) urls.add(m[1]);
  for (const m of html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)) if (ASSET_RE.test(m[1])) urls.add(m[1].replace(/&amp;/g, '&'));
  for (const m of html.matchAll(/url\(&quot;(https?:\/\/[^&]+(?:&amp;[^&]+)*)&quot;\)/g)) if (ASSET_RE.test(m[1])) urls.add(m[1].replace(/&amp;/g, '&'));
  const list = [...urls];
  const files = await pool(list, 8, download);
  // a function replacement: a "$" in a URL or a file name must stay literal
  list.forEach((u, k) => {
    if (!files[k]) return;
    const local = `../assets/${files[k]}`;
    css = css.split(u).join(local);
    html = html.split(u).join(local).split(u.replace(/&/g, '&amp;')).join(local);
  });
  // a blob: source (the carousel's video preview) only ever existed in the live tab
  html = html.replace(/\ssrc="blob:[^"]*"/g, '');
  // static, standards-mode, and nothing reaches the network again
  html = html.replace(/<head([^>]*)>/i, (m) => `${m}<meta charset="utf-8"><meta name="robots" content="noindex">`)
    .replace(/<\/head>/i, () => `<style>${css}</style></head>`);
  const dir = path.join(OUT, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), `<!DOCTYPE html>\n${html}`);
  report.pages[name] = { url: j.url, title: j.title, css: css.length, html: html.length, assets: list.length };
}

// scrub what must not be published, in a real DOM, and save the result back
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1470, height: 837 } });
for (const name of PAGES) {
  const file = path.join(OUT, name, 'index.html');
  await page.goto(`file://${file}`, { waitUntil: 'load' });
  const scrubbed = await page.evaluate((name) => {
    const n = { cells: 0, robux: 0, alerts: 0 };
    if (name.startsWith('thumbs')) {
      const keys = ['ThumbnailImpressions', 'ThumbnailQualifiedPlays', 'ThumbnailAVGPlayTime', 'ThumbnailQualifiedPTR', 'ThumbnailWinningSegments'];
      // data cells only: a header cell carries the same column key, and its label stays
      for (const td of document.querySelectorAll('tbody td, thead td')) {
        const key = td.getAttribute('data-table-column-key');
        const t = td.textContent.trim();
        if ((key && keys.includes(key) && !td.querySelector('svg, button')) || (/^[\d,.]+(\s?min|%)?$/.test(t) && td.children.length === 0)) { td.textContent = ''; n.cells += 1; }
      }
      // the Total row is header cells: clear its figures, keep its label
      for (const th of document.querySelectorAll('th')) {
        if (th.children.length === 0 && /^[\d,.]+(\s?min|%)?$|^N\/A$/.test(th.textContent.trim())) { th.textContent = ''; n.cells += 1; }
      }
      // the analytics cards under the table (summary tiles and charts drawn from the real data) go whole
      const tile = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === 'Total over selected period');
      const charts = tile && [...(function* up(e) { while (e) { yield e; e = e.parentElement; } })(tile)].find((e) => /Grid-root-cha/.test(String(e.className)));
      if (charts) { charts.remove(); n.charts = 1; }
      // the account's current warning about one thumbnail is live state, not part of the page's layout
      for (const el of document.querySelectorAll('div, p')) {
        if (el.children.length < 6 && /removed from personalization/.test(el.textContent) && el.textContent.length < 260) {
          const alert = el.closest('[role=alert], .MuiAlert-root') || el;
          alert.remove(); n.alerts += 1; break;
        }
      }
    } else {
      // the Robux balance: blurred on screen, and its digits zeroed in the text, the button's label and the page's data
      for (const el of document.querySelectorAll('#nav-robux-amount, [id*=robux-amount], .rbx-text-navbar-right')) {
        if (/\d/.test(el.textContent)) { el.style.filter = 'blur(5px)'; el.textContent = el.textContent.replace(/\d/g, '0'); n.robux += 1; }
      }
      for (const el of document.querySelectorAll('[aria-label^="Robux:"]')) el.setAttribute('aria-label', 'Robux');
    }
    // the session's own data: every <meta> but the ones a static page needs (user data, the CSRF token, auth flags),
    // and any attribute carrying a token, a balance or the signed-in user
    for (const m of document.querySelectorAll('meta')) {
      if (!m.hasAttribute('charset') && !['viewport', 'robots'].includes(m.getAttribute('name'))) { m.remove(); n.meta = (n.meta || 0) + 1; }
    }
    for (const el of document.querySelectorAll('*')) {
      for (const a of [...el.attributes]) {
        if (/^data-(token|.*csrf.*|.*balance.*|user-?id|userid|authenticated.*|.*user-bc)$/i.test(a.name)) { el.removeAttribute(a.name); n.attrs = (n.attrs || 0) + 1; }
      }
    }
    return n;
  }, name);
  const out = await page.content();
  fs.writeFileSync(file, out.startsWith('<!DOCTYPE') ? out : `<!DOCTYPE html>\n${out}`);
  report.pages[name].scrubbed = scrubbed;
}
await browser.close();
report.mb = +(report.bytes / 1048576).toFixed(2);
console.log(JSON.stringify(report, null, 1));
