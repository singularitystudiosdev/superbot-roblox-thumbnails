// Headless checks of the sidebar against the owner's ask: Claude's sizes 1:1 in a 1456x815 window (242px wide, 28px
// rows, 9px capitals), a chat dragged two places down lands there and does not navigate, Alt+ArrowUp moves the focused
// chat and announces it, and hovering a cut-off title scrolls it and lets it go home on leave. Run in the creative
// (scaled stage) and on the contact sheet (scaled wrapper), so the pointer maths is checked under both transforms.
// node sidebars.bdeb2397/tools/interact.bdeb2397.mjs http://localhost:5297/sidebars.bdeb2397/
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [BASE] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true });
const fails = [];
const check = (where, ok, what, got) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${where}: ${what}${ok ? '' : ` (got ${JSON.stringify(got)})`}`); if (!ok) fails.push(`${where}: ${what}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

async function run(where, url, root) {
  const page = await browser.newPage({ viewport: { width: 1456, height: 815 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__sidebarReady === true, null, { timeout: 30000 });
  const sb = page.locator(root).first();
  const rows = sb.locator('.sb-scroll .sb-list > li');
  const order = () => rows.evaluateAll((lis) => lis.map((li) => li.querySelector('.sb-title-in').textContent));

  // sizes on screen
  const m = await sb.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const lis = [...el.querySelectorAll('.sb-scroll .sb-list > li')].map((li) => li.getBoundingClientRect());
    const ic = el.querySelector('.sb-scroll .sb-ic').getBoundingClientRect();
    const t = el.querySelector('.sb-scroll .sb-title').getBoundingClientRect();
    return { w: r.width, pitch: lis[1].top - lis[0].top, ic: ic.width, icLeft: ic.left - r.left, textLeft: t.left - r.left };
  });
  check(where, near(m.w, 242, 1), 'sidebar 242px wide on screen', m.w);
  check(where, near(m.pitch, 28, 0.6), 'chat rows 28px apart on screen', m.pitch);
  check(where, near(m.ic, 13, 0.6) && near(m.icLeft, 13, 1), 'icons 13px, 13px from the edge', m);
  check(where, near(m.textLeft, 39, 1), 'text starts 39px from the edge', m.textLeft);

  // drag the second chat two places down
  const before = await order();
  const second = rows.nth(1).locator('.sb-row');
  const box = await second.boundingBox();
  const startUrl = page.url();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + (m.pitch * 2.1 * i) / 10);
  await page.mouse.up();
  await page.waitForTimeout(400);
  const afterDrag = await order();
  const expected = [before[0], before[2], before[3], before[1], ...before.slice(4)];
  check(where, JSON.stringify(afterDrag) === JSON.stringify(expected), `drag puts "${before[1]}" fourth`, afterDrag.slice(0, 5));
  check(where, page.url() === startUrl, 'the drop does not follow the link', page.url());
  check(where, await sb.locator('.sb-list.is-sorting, li.is-dragging').count() === 0, 'drag state cleared', null);

  // keyboard: Alt+ArrowUp moves it back up one
  await sb.locator('.sb-scroll .sb-list > li').nth(3).locator('.sb-row').focus();
  await page.keyboard.press('Alt+ArrowUp');
  const afterKey = await order();
  check(where, afterKey[2] === before[1], 'Alt+ArrowUp moves the focused chat up one', afterKey.slice(0, 5));
  const said = await sb.locator('[aria-live]').textContent();
  check(where, /moved to position 3 of/.test(said), 'the move is announced', said);
  check(where, await page.evaluate(() => document.activeElement?.classList.contains('sb-row')), 'focus stays on the moved chat', null);

  // marquee: hover the first (cut-off) title
  await page.mouse.move(0, 0);
  const first = rows.nth(0).locator('.sb-row');
  const fb = await first.boundingBox();
  await page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2);
  const sample = () => rows.nth(0).locator('.sb-title').evaluate((el) => ({
    tx: new DOMMatrix(getComputedStyle(el.firstElementChild).transform).m41,
    l: parseFloat(el.style.getPropertyValue('--fade-l')) || 0, r: parseFloat(el.style.getPropertyValue('--fade-r')) || 0,
    at: performance.now(),
  }));
  await page.waitForTimeout(450);
  const s0 = await sample();
  // the left fade is only as wide as the text that has slid out past the left edge, so the first letter starts crisp
  check(where, s0.r > 5 && near(s0.l, Math.min(s0.r, -s0.tx), 0.05), 'near the start the left fade equals the distance moved', s0);
  await page.waitForTimeout(500);
  const s1 = await sample();
  await page.waitForTimeout(400);
  const s2 = await sample();
  const tx = s2.tx;
  check(where, tx < -5, 'a hovered cut-off title scrolls left', tx);
  check(where, s2.l > 5 && s2.r > 5, 'mid-scroll both edges fade', s2);
  // linear at 32 px/s in the list's own units: two samples mid-travel give the same speed
  const v1 = (s1.tx - s0.tx) / ((s1.at - s0.at) / 1000), v2 = (s2.tx - s1.tx) / ((s2.at - s1.at) / 1000);
  check(where, near(v1, -32, 5) && near(v2, -32, 5), 'it moves at a steady 32px/s', { v1, v2 });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(450);
  const home = await rows.nth(0).locator('.sb-title').evaluate((el) => ({ on: el.classList.contains('is-marquee'), tx: new DOMMatrix(getComputedStyle(el.firstElementChild).transform).m41 }));
  check(where, !home.on && home.tx === 0, 'on leave it eases home and the ellipsis returns', home);

  check(where, errors.length === 0, 'no console errors', errors);
  await page.close();
}

await run('creative', `${BASE}view.html?v=1&t=40`, '.app > .sb');
await run('sheet', BASE, '.sheet .sb');
await browser.close();
console.log(fails.length ? `${fails.length} failed` : 'all passed');
process.exit(fails.length ? 1 : 0);
