// Headless checks of the sidebar against the owner's asks, in the creative (scaled stage) and on the contact sheet
// (scaled wrapper): Claude's sizes 1:1 in a 1456x815 window; titles fade instead of ending in "…"; the "•••" shows only
// on hover; drag and Alt+arrow reordering; the hover scroll (fades, steady 32px/s, one pass, home on leave); and groups:
// "•••" > New group > name it in the dialog (space and R typed into it never reach the spot's own keys), drag another
// chat onto the group, drag one back out, fold it, rename it.
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
  await page.waitForTimeout(200);
  const sb = page.locator(root).first();
  const top = sb.locator('.sb-scroll .sb-sec > .sb-list').first();
  const chats = top.locator(':scope > li.sb-item');
  // the list as text: a chat by its title, a group as [name: its chats]
  const order = () => top.evaluate((ul) => [...ul.children].map((li) => li.matches('.sb-group')
    ? `[${li.querySelector('.sb-ghead .sb-title-in').textContent}: ${[...li.querySelectorAll('.sb-group-list > li.sb-item .sb-title-in')].map((t) => t.textContent).join(' | ')}]`
    : li.querySelector('.sb-title-in').textContent));
  const centre = async (loc) => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  async function drag(from, toY) {
    const a = await centre(from);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(a.x, a.y + ((toY - a.y) * i) / 12);
    await page.waitForTimeout(60);
    await page.mouse.up();
    await page.waitForTimeout(300);
  }

  // the creative around the sidebar, from this folder's own copies (spot.bdeb2397.css, feed.bdeb2397.js), never the
  // creative's uncommitted edits: the live view's top buttons are styled, and at t=40 the chat is scrolled so its
  // newest message sits at the foot of the pane, no blank stretch under it
  if (await page.locator('.cc-top-btn').count()) {
    const spot = await page.evaluate(() => {
      const btn = document.querySelector('.cc-top-btn'), cs = getComputedStyle(btn), ic = btn.querySelector('svg').getBoundingClientRect();
      const feed = document.querySelector('.ch-feed').getBoundingClientRect();
      const shown = [...document.querySelectorAll('.ch-in > .cm')].filter((n) => parseFloat(getComputedStyle(n).opacity) > 0.5);
      const last = shown.at(-1).getBoundingClientRect();
      return { bg: cs.backgroundColor, border: cs.borderTopWidth, w: btn.getBoundingClientRect().width, icon: ic.width, gapUnder: feed.bottom - last.bottom, lastTop: last.top - feed.top, feedH: feed.height };
    });
    check(where, spot.bg === 'rgba(0, 0, 0, 0)' && spot.border === '0px' && spot.icon > 10, "the live view's top buttons are styled (transparent, borderless, icon drawn)", spot);
    check(where, spot.gapUnder >= 0 && spot.gapUnder < 40 && spot.lastTop > 0, 'at 40s the newest chat message sits at the foot of the chat', spot);
  }

  // sizes on screen
  const m = await sb.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const lis = [...el.querySelectorAll('.sb-scroll .sb-sec > .sb-list > li')].map((li) => li.getBoundingClientRect());
    const ic = el.querySelector('.sb-scroll .sb-ic').getBoundingClientRect();
    const t = el.querySelector('.sb-scroll .sb-title').getBoundingClientRect();
    return { w: r.width, pitch: lis[1].top - lis[0].top, ic: ic.width, icLeft: ic.left - r.left, textLeft: t.left - r.left };
  });
  check(where, near(m.w, 242, 1), 'sidebar 242px wide on screen', m.w);
  check(where, near(m.pitch, 28, 0.6), 'chat rows 28px apart on screen', m.pitch);
  check(where, near(m.ic, 13, 0.6) && near(m.icLeft, 13, 1), 'icons 13px, 13px from the edge', m);
  check(where, near(m.textLeft, 39, 1), 'text starts 39px from the edge', m.textLeft);

  // no "…": a long title is clipped under a right-edge fade
  const rest = await chats.nth(0).locator('.sb-title').evaluate((el) => ({ to: getComputedStyle(el).textOverflow, over: el.classList.contains('is-overflow'), mask: getComputedStyle(el).maskImage }));
  check(where, rest.to === 'clip' && rest.over && rest.mask.includes('gradient'), 'a long title fades at the edge, no ellipsis', rest);

  // the "•••" only on hover
  const more1 = chats.nth(1).locator('.sb-more');
  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  const hidden = await more1.evaluate((el) => getComputedStyle(el).opacity);
  await page.mouse.move(...Object.values(await centre(chats.nth(1).locator('.sb-row'))));
  await page.waitForTimeout(250);
  const shownOp = await more1.evaluate((el) => getComputedStyle(el).opacity);
  check(where, hidden === '0' && shownOp === '1', 'the ••• shows on hover only', { hidden, shownOp });

  // drag the second chat two places down
  const before = await order();
  const startUrl = page.url();
  const b1 = await chats.nth(1).boundingBox();
  await drag(chats.nth(1).locator('.sb-row'), b1.y + b1.height / 2 + m.pitch * 2.1);
  const afterDrag = await order();
  check(where, JSON.stringify(afterDrag.slice(0, 5)) === JSON.stringify([before[0], before[2], before[3], before[1], before[4]]), `drag puts "${before[1]}" fourth`, afterDrag.slice(0, 5));
  check(where, page.url() === startUrl, 'the drop does not follow the link', page.url());
  check(where, await sb.locator('.sb-ghost, .sb-gap, .sb.is-dragging').count() === 0 && !(await sb.evaluate((el) => el.classList.contains('is-dragging'))), 'drag state cleared', null);

  // keyboard: Alt+ArrowUp moves it back up one, announced, focus kept
  await chats.nth(3).locator('.sb-row').focus();
  await page.keyboard.press('Alt+ArrowUp');
  const afterKey = await order();
  check(where, afterKey[2] === before[1], 'Alt+ArrowUp moves the focused chat up one', afterKey.slice(0, 5));
  const said = await sb.locator('[aria-live]').textContent();
  check(where, /moved to position 3 of/.test(said), 'the move is announced', said);
  check(where, await page.evaluate(() => document.activeElement?.classList.contains('sb-row')), 'focus stays on the moved chat', null);

  // marquee: hover the first (cut-off) title
  await page.evaluate(() => document.activeElement?.blur());
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  const fc = await centre(chats.nth(0).locator('.sb-row'));
  await page.mouse.move(fc.x - 40, fc.y);
  const sample = () => chats.nth(0).locator('.sb-title').evaluate((el) => ({
    tx: new DOMMatrix(getComputedStyle(el.firstElementChild).transform).m41,
    l: parseFloat(el.style.getPropertyValue('--fade-l')) || 0, r: parseFloat(el.style.getPropertyValue('--fade-r')) || 0,
    at: performance.now(),
  }));
  await page.waitForTimeout(450);
  const s0 = await sample();
  check(where, s0.r > 5 && near(s0.l, Math.min(s0.r, -s0.tx), 0.05), 'near the start the left fade equals the distance moved', s0);
  await page.waitForTimeout(500);
  const s1 = await sample();
  await page.waitForTimeout(400);
  const s2 = await sample();
  check(where, s2.tx < -5 && s2.l > 5 && s2.r > 5, 'mid-scroll it has moved and both edges fade', s2);
  const v1 = (s1.tx - s0.tx) / ((s1.at - s0.at) / 1000), v2 = (s2.tx - s1.tx) / ((s2.at - s1.at) / 1000);
  check(where, near(v1, -32, 5) && near(v2, -32, 5), 'it moves at a steady 32px/s', { v1, v2 });
  const fullDist = await chats.nth(0).locator('.sb-title').evaluate((el) => el.firstElementChild.offsetWidth - el.clientWidth);
  await page.waitForTimeout(Math.max(0, (fullDist / 32) * 1000 + 600 - 1350));
  const e1 = await sample();
  await page.waitForTimeout(1200);
  const e2 = await sample();
  check(where, near(e1.tx, -fullDist, 0.5) && e2.tx === e1.tx && e2.r === 0 && e2.l > 5, 'it stops at the end and does not come back', { e1, e2, fullDist });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(450);
  const home = await chats.nth(0).locator('.sb-title').evaluate((el) => ({ on: el.classList.contains('is-marquee'), tx: new DOMMatrix(getComputedStyle(el.firstElementChild).transform).m41 }));
  check(where, !home.on && home.tx === 0, 'on leave it eases home', home);

  // groups: ••• > New group > name it
  const pick = chats.nth(2);
  const picked = await pick.locator('.sb-title-in').textContent();
  await page.mouse.move(...Object.values(await centre(pick.locator('.sb-row'))));
  await page.waitForTimeout(200);
  // the "•••" highlight sits 4px clear of the row on every side, and is 20px square on screen
  await pick.locator('.sb-more').hover();
  await page.waitForTimeout(250);
  const inset = await pick.evaluate((li) => {
    const r = li.querySelector('.sb-row').getBoundingClientRect(), b = li.querySelector('.sb-more').getBoundingClientRect();
    return { size: b.width, top: b.top - r.top, bottom: r.bottom - b.bottom, right: r.right - b.right, bg: getComputedStyle(li.querySelector('.sb-more')).backgroundColor };
  });
  check(where, near(inset.size, 20, 0.6) && near(inset.top, 4, 0.6) && near(inset.bottom, 4, 0.6) && near(inset.right, 4, 0.6) && inset.bg !== 'rgba(0, 0, 0, 0)', 'the ••• hover highlight is inset 4px all round', inset);
  await pick.locator('.sb-more').click();
  const menu = page.locator('.sb-menu:popover-open');
  const tweens = await page.locator('.sb-menu:popover-open').evaluate((m) => m.getAnimations().map((a) => a.transitionProperty));
  check(where, tweens.includes('opacity') && tweens.includes('transform'), 'the menu tweens in (opacity and transform)', tweens);
  check(where, await menu.count() === 1 && (await menu.locator('.sb-menu-item').first().textContent()) === 'New group', 'the ••• opens a menu with New group', await menu.count());
  // a second press on the same "•••" closes it
  await pick.locator('.sb-more').click();
  await page.waitForTimeout(200);
  check(where, await menu.count() === 0 && (await pick.locator('.sb-more').getAttribute('aria-expanded')) === 'false', 'pressing the ••• again closes the menu', await menu.count());
  await pick.locator('.sb-more').click();
  await page.waitForTimeout(200);
  await menu.locator('.sb-menu-item').first().click();
  const dlg = page.locator('dialog.sb-dialog[open]');
  check(where, await dlg.count() === 1, 'New group opens the name dialog', null);
  await page.keyboard.type('Launch day r');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  const typed = await dlg.locator('input').inputValue();
  check(where, typed === 'Launch day', 'spaces and R go into the field, not to the spot', typed);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  let now = await order();
  check(where, await dlg.count() === 0 && now.includes(`[Launch day: ${picked}]`), 'Enter creates the group with the chat in it', now);
  check(where, await page.evaluate(() => document.activeElement?.classList.contains('sb-group-row')), 'focus lands on the new group', null);
  const group = sb.locator('.sb-group').first();
  check(where, (await group.locator('.sb-count').textContent()) === '1', 'the group counts 1 chat', null);

  // drag another chat onto the group's row
  const mover = chats.nth(0);
  const moverTitle = await mover.locator('.sb-title-in').textContent();
  const head = await centre(group.locator('.sb-ghead'));
  await page.mouse.move(0, 0);
  await drag(mover.locator('.sb-row'), head.y + 2);
  now = await order();
  check(where, now.includes(`[Launch day: ${picked} | ${moverTitle}]`), 'a chat dropped on the group joins it', now);
  check(where, (await group.locator('.sb-count').textContent()) === '2', 'the group counts 2 chats', null);
  check(where, /in Launch day/.test(await sb.locator('[aria-live]').textContent()), 'the join is announced', await sb.locator('[aria-live]').textContent());

  // drag one back out, to the top of the list
  const inside = group.locator('.sb-group-list > li.sb-item').first();
  const firstTop = await top.locator(':scope > li').first().boundingBox();
  await drag(inside.locator('.sb-row'), firstTop.y + 2);
  now = await order();
  check(where, now[0] === picked && now.includes(`[Launch day: ${moverTitle}]`), 'a chat dragged out of the group leaves it', now.slice(0, 4));

  // fold it, then rename it
  await group.locator('.sb-group-row').click();
  const folded = await group.evaluate((g) => ({ exp: g.querySelector('.sb-group-row').getAttribute('aria-expanded'), hid: g.querySelector('.sb-group-list').hidden }));
  check(where, folded.exp === 'false' && folded.hid, 'the group row folds its list', folded);
  await page.mouse.move(...Object.values(await centre(group.locator('.sb-ghead'))));
  await page.waitForTimeout(200);
  await group.locator('.sb-ghead .sb-more').click();
  await page.locator('.sb-menu:popover-open .sb-menu-item', { hasText: 'Rename group' }).click();
  check(where, (await dlg.locator('input').inputValue()) === 'Launch day', 'Rename opens with the current name', await dlg.locator('input').inputValue());
  await dlg.locator('input').fill('Launch');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  check(where, (await group.locator('.sb-ghead .sb-title-in').textContent()) === 'Launch', 'the group is renamed', null);
  await group.locator('.sb-group-row').click(); // unfold it again

  const openMore = async (li) => {
    await page.mouse.move(...Object.values(await centre(li.locator('.sb-row'))));
    await page.waitForTimeout(200);
    await li.locator('.sb-more').click();
    await page.waitForTimeout(200);
  };
  const menuItems = () => page.locator('.sb-menu:popover-open .sb-menu-item').allTextContents();

  // a group made from the first chat sits first in the list
  const lead = chats.nth(0);
  const leadTitle = await lead.locator('.sb-title-in').textContent();
  await openMore(lead);
  await page.locator('.sb-menu:popover-open .sb-menu-item', { hasText: 'New group' }).click();
  await page.keyboard.type('Top');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  now = await order();
  check(where, now[0] === `[Top: ${leadTitle}]`, 'a group made from the first chat leads the list', now.slice(0, 3));

  // Move to group: one item, then a picker searched by name
  const mover2 = chats.nth(0);
  const mover2Title = await mover2.locator('.sb-title-in').textContent();
  await openMore(mover2);
  const items = await menuItems();
  check(where, items.includes('Move to group') && !items.some((t) => /^Move to (?!group$)/.test(t)), 'the menu has one Move to group, not one item per group', items);
  await page.locator('.sb-menu:popover-open .sb-menu-item', { hasText: 'Move to group' }).click();
  const picker = page.locator('.sb-menu:popover-open');
  check(where, await picker.locator('input[type="search"]').evaluate((el) => el === document.activeElement), 'the picker opens with its search field focused', null);
  await page.keyboard.type('lau');
  const found = await picker.locator('.sb-menu-item').allTextContents();
  check(where, found.length === 1 && found[0].startsWith('Launch'), 'typing filters the groups', found);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  now = await order();
  check(where, await picker.count() === 0 && now.some((t) => t.startsWith('[Launch:') && t.includes(mover2Title)), 'Enter moves the chat into the match', now);

  // no match: one line and one way on, nothing created on Escape
  await openMore(chats.nth(0));
  await page.locator('.sb-menu:popover-open .sb-menu-item', { hasText: 'Move to group' }).click();
  await page.keyboard.type('zzz');
  const none = { line: await picker.locator('.sb-menu-empty').isVisible(), items: await picker.locator('.sb-menu-item').allTextContents() };
  check(where, none.line && none.items.length === 1 && none.items[0] === 'New group “zzz”', 'no match says so and offers a group by that name', none);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  check(where, await picker.count() === 0 && !(await order()).some((t) => t.startsWith('[zzz')), 'Escape closes the picker without making anything', null);

  // drag a chat up out of the leading group, over the "Chats" label: it lands first in the list, in no group
  await page.mouse.move(0, 0);
  const topGroup = sb.locator('.sb-group').first();
  await openMore(chats.nth(0));
  await page.locator('.sb-menu:popover-open .sb-menu-item', { hasText: 'Move to group' }).click();
  await page.keyboard.type('Top');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const label = await sb.locator('.sb-scroll .sb-sec > .sb-head').first().boundingBox();
  const leaving = topGroup.locator('.sb-group-list > li.sb-item').last();
  const leavingTitle = await leaving.locator('.sb-title-in').textContent();
  await page.mouse.move(0, 0);
  await drag(leaving.locator('.sb-row'), label.y + label.height / 2);
  now = await order();
  check(where, now[0] === leavingTitle && now[1].startsWith('[Top:') && !now[1].includes(leavingTitle), 'dragged up past the group, it leaves the group for the top of the list', now.slice(0, 3));

  // Delete chat: last in the menu, red, set apart; confirm, and the chat is gone
  const doomed = chats.nth(1);
  const doomedTitle = await doomed.locator('.sb-title-in').textContent();
  const total = await sb.locator('.sb-scroll li.sb-item').count();
  await openMore(doomed);
  const del = page.locator('.sb-menu:popover-open .sb-menu-item').last();
  check(where, (await del.textContent()) === 'Delete chat' && await del.evaluate((el) => el.classList.contains('is-danger') && el.previousElementSibling?.matches('.sb-menu-sep')), 'Delete chat is last, red, under a divider', await del.textContent());
  await del.click();
  const confirm = page.locator('dialog.sb-dialog[open]');
  check(where, (await confirm.locator('.sb-dialog-title').textContent()) === 'Delete chat?' && (await confirm.locator('.sb-dialog-body').textContent()).includes(doomedTitle) && !(await confirm.locator('.sb-field').isVisible()), 'it asks to confirm, naming the chat, with no name field', null);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  check(where, await sb.locator('.sb-scroll li.sb-item').count() === total, 'Escape keeps the chat', null);
  await openMore(doomed);
  await page.locator('.sb-menu:popover-open .sb-menu-item').last().click();
  await page.locator('dialog.sb-dialog[open] .sb-btn-primary').click();
  await page.waitForTimeout(400);
  const titles = await sb.locator('.sb-scroll li.sb-item .sb-title-in').allTextContents();
  check(where, titles.length === total - 1 && !titles.includes(doomedTitle), 'Delete removes the chat', { before: total, after: titles.length });
  check(where, /Deleted/.test(await sb.locator('[aria-live]').textContent()) && await page.evaluate(() => document.activeElement?.classList.contains('sb-row')), 'the delete is announced and focus moves to a neighbour', null);

  // the Automations tab (automations-view.03378ba4.js), creative page only: its row opens it beside the sidebar, the
  // sidebar keeps working over it, and a chat row brings the chat back
  if (await page.locator('.am').count()) {
    await page.mouse.move(0, 0);
    await sb.locator('.sb-nav a[href="#automations"]').click();
    await page.waitForTimeout(200);
    const am = await page.evaluate(() => {
      const t = document.querySelector('.am'), s = document.querySelector('.app > .sb');
      return { open: !t.hidden, left: t.getBoundingClientRect().left, sbRight: s.getBoundingClientRect().right, current: s.querySelector('[aria-current="page"]')?.getAttribute('href') };
    });
    check(where, am.open && near(am.left, am.sbRight, 1) && am.current === '#automations', 'the Automations row opens the tab right of the sidebar', am);
    const anyChat = top.locator(':scope > li.sb-item').first();
    await openMore(anyChat);
    check(where, await page.locator('.sb-menu:popover-open').count() === 1, 'a chat menu still opens over the tab', null);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await anyChat.locator('.sb-row').click();
    await page.waitForTimeout(200);
    check(where, await page.locator('.am').evaluate((t) => t.hidden), 'a chat row closes the tab', null);
  }

  check(where, errors.length === 0, 'no console errors', errors);
  await page.close();
}

await run('creative', `${BASE}view.html?v=1&t=40`, '.app > .sb');
await run('sheet', BASE, '.sheet .sb');

// the takeover vignette's color follows the app on screen (tint.bdeb2397.js): superbot's orange on the opening New Tab
// page, Roblox's logo blue once roblox.com loads, still blue on the second New Tab page mid-task
for (const [t, app, first] of [[6, 'superbot', '#fd9e43'], [7, 'roblox', '#335fff'], [10, 'roblox', '#335fff'], [40, 'roblox', '#335fff']]) {
  const page = await browser.newPage({ viewport: { width: 1456, height: 815 } });
  await page.goto(`${BASE}view.html?v=1&t=${t}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  const got = await page.evaluate(() => { const e = document.querySelector('.cc-edge'); return { app: e.dataset.app, first: e.style.getPropertyValue('--tint-0'), band: getComputedStyle(document.querySelector('.cc-band')).backgroundImage }; });
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(first.slice(i, i + 2), 16));
  check('tint', got.app === app && got.first === first && got.band.includes(`rgb(${r}, ${g}, ${b})`), `at ${t}s the vignette is ${app} (${first})`, got);
  await page.close();
}
await browser.close();
console.log(fails.length ? `${fails.length} failed` : 'all passed');
process.exit(fails.length ? 1 : 0);
