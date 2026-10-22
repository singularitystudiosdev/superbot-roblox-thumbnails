// Headless checks of the Automations page in view.html against the owner's ask: the sidebar's Automations row opens it;
// a search bar on top; the chips under it follow the search ("Game Design" brings Roblox, Unity, Blender, Steam...);
// chips pick and unpick, several at once, and the grid shows only the picked apps; every card has a thumbnail, its
// app's icon, a description, a rating, uses and Try Me!. Also: nothing matching shows one sentence and one way out,
// ?state=loading shows skeleton cards, "/" finds the search field, a chat row closes the page. Second round: no visible
// title or count line, no TikTok, the chip row scrolls only sideways (a wheel moves it left and right) and fades on
// whichever edge has chips past it.
// node sidebars.bdeb2397/tools/automations.6f6580a5.mjs http://localhost:5297/sidebars.bdeb2397/view.html?v=1
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [URL_] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true });
const fails = [];
const check = (what, ok, got) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${what}${ok ? '' : ` (got ${JSON.stringify(got)})`}`); if (!ok) fails.push(what); };

async function open(url, opts = {}) {
  const page = await browser.newPage({ viewport: { width: 1456, height: 815 }, ...opts });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__sidebarReady === true, null, { timeout: 30000 });
  return { page, errors };
}
const apps = (page) => page.locator('.au-card .au-app').allTextContents();
const chips = (page) => page.locator('.au-chip[data-app]:not([data-app=""])').evaluateAll((els) => els.map((e) => e.firstChild?.nextSibling?.textContent ?? e.textContent));
const pressed = (page) => page.locator('.au-chip[aria-pressed="true"]').evaluateAll((els) => els.map((e) => e.dataset.app));

const { page, errors } = await open(URL_);
check('the page starts hidden behind the chat', await page.locator('.au').isHidden());
await page.locator('.sb-nav a[href="#automations"]').click();
check('the sidebar row opens the page', await page.locator('.au').isVisible());
check('the Automations row becomes the current row', (await page.locator('.sb-nav a[href="#automations"]').getAttribute('aria-current')) === 'page');
check('the URL remembers the open page', new URL(page.url()).searchParams.get('tab') === 'automations', page.url());
const all = await page.locator('.au-card').count();
check('a large catalogue: at least 80 automations', all >= 80, all);
check('All is the only pressed chip at first', JSON.stringify(await pressed(page)) === '[""]', await pressed(page));

await page.waitForFunction(() => [...document.querySelectorAll('.au-thumb img')].every((img) => img.complete), null, { timeout: 20000 });
// each card's missing slots, by title; empty when every card has them all. The thumbnail is a preview of what the
// automation makes: it must have drawn something, and every image in it must have loaded
const missing = await page.locator('.au-card').evaluateAll((cards) => cards.map((c) => {
  const lacks = [];
  const sh = c.querySelector('.au-thumb > .sh[data-t]');
  if (!sh || sh.getBoundingClientRect().height < 20 || !(sh.textContent.trim() || sh.querySelector('img'))) lacks.push('thumbnail preview');
  if ([...(sh?.querySelectorAll('img') ?? [])].some((img) => !img.naturalWidth)) lacks.push('a thumbnail image');
  if (!c.querySelector('.au-app .au-logo svg path') || !c.querySelector('.au-app').textContent) lacks.push('app icon');
  if (!(c.querySelector('.au-desc')?.textContent.length > 20)) lacks.push('description');
  if (!/^Rated \d\.\d out of 5 from [\d.]+k? ratings$/.test(c.querySelector('.au-rating')?.textContent ?? '')) lacks.push('rating');
  if (!/^[\d.]+k? uses$/.test(c.querySelector('.au-uses')?.textContent ?? '')) lacks.push('uses');
  if (c.querySelector('.au-try')?.textContent !== 'Try Me!') lacks.push('Try Me!');
  return lacks.length ? `${c.querySelector('.au-name')?.textContent}: ${lacks.join(', ')}` : '';
}).filter(Boolean));
check('every card: a preview thumbnail with its images loaded, app icon, description, rating, uses, Try Me!', missing.length === 0, missing);
const kinds = await page.locator('.au-thumb > .sh').evaluateAll((els) => new Set(els.map((e) => e.dataset.t)).size);
check('thumbnails show different kinds of output (lists, charts, messages, media...), at least 12', kinds >= 12, kinds);
const ab = await page.locator('.au-card').filter({ hasText: 'Thumbnail A/B tester' }).locator('.sh').evaluate((sh) => ({ t: sh.dataset.t, imgs: sh.querySelectorAll('img').length, win: Boolean(sh.querySelector('.is-win')) }));
check('the A/B tester\'s thumbnail is an A/B test of two real thumbnails with a winner', ab.t === 'pair' && ab.imgs >= 2 && ab.win, ab);
const chipFont = await page.locator('.au-chip').first().evaluate((e) => getComputedStyle(e).fontSize);
check('chips take the page\'s meta size, not the browser default', chipFont === '11px', chipFont);

// round two: the title, its line and the count line are gone from sight; TikTok is gone everywhere
// text between the page's top and the grid that a sighted person sees (.au-vh is for screen readers only)
const shown = await page.locator('.au').evaluate((au) => ({
  visibleText: [...au.querySelectorAll('.au-head h1, .au-head p, .au-scroll > p')].filter((e) => !e.classList.contains('au-vh') && !e.closest('[hidden]')).map((e) => e.textContent),
  tiktok: /tiktok/i.test(au.textContent),
}));
check('no visible title, subtitle or count line above the grid', shown.visibleText.length === 0, shown.visibleText);
check('no TikTok chip or card', !shown.tiktok);
await page.locator('.au-search input').fill('tiktok');
check('searching TikTok finds nothing', (await page.locator('.au-card').count()) === 0);
await page.locator('.au-search input').fill('');

// the chip row: sideways only, and a fade on each edge with chips past it
const cats = page.locator('.au-cats');
const row = () => cats.evaluate((c) => ({ x: c.scrollLeft, y: c.scrollTop, room: c.scrollWidth - c.clientWidth, overflowY: getComputedStyle(c).overflowY, l: Number(c.style.getPropertyValue('--fade-l')), r: Number(c.style.getPropertyValue('--fade-r')) }));
const atStart = await row();
check('the chip row cannot scroll up or down', atStart.overflowY === 'hidden', atStart);
check('at its start the row fades only on the right', atStart.room > 0 && atStart.l === 0 && atStart.r === 1, atStart);
const pageTop = await page.locator('.au-scroll').evaluate((e) => e.scrollTop);
await cats.hover();
await page.mouse.wheel(0, 240);
await page.waitForTimeout(150);
const wheeled = await row();
check('a mouse wheel over the row moves it sideways, not the page', wheeled.x > 0 && wheeled.y === 0 && (await page.locator('.au-scroll').evaluate((e) => e.scrollTop)) === pageTop, wheeled);
check('scrolled into the middle, both edges fade', wheeled.l > 0 && wheeled.r > 0, wheeled);
await cats.evaluate((c) => { c.scrollLeft = c.scrollWidth; });
await page.waitForTimeout(100);
const atEnd = await row();
check('at its end the row fades only on the left', atEnd.l === 1 && atEnd.r === 0, atEnd);
await cats.evaluate((c) => { c.scrollLeft = 0; });

await page.locator('.au-search input').fill('Game Design');
const gd = await chips(page);
check('"Game Design" leads with its apps: Roblox, Unity, Unreal Engine, Godot, Blender, Steam, itch.io, Aseprite', gd.slice(0, 8).join(',') === 'Roblox,Unity,Unreal Engine,Godot,Blender,Steam,itch.io,Aseprite', gd);
check('a screen reader still hears the count, naming the topic', /^\d+ automations in Game Design$/.test(await page.locator('.au-say').textContent()), await page.locator('.au-say').textContent());
const gdCards = await page.locator('.au-card').count();

await page.locator('.au-chip[data-app="roblox"]').click();
check('a chip shows only its app', (await apps(page)).every((a) => a === 'Roblox') && (await apps(page)).length === 10, await apps(page));
await page.locator('.au-chip[data-app="blender"]').click();
const two = await apps(page);
check('a second chip adds its app', two.length === 14 && new Set(two).size === 2, two);
check('both chips read as pressed, All does not', JSON.stringify((await pressed(page)).sort()) === '["blender","roblox"]', await pressed(page));
await page.locator('.au-chip[data-app="roblox"]').click();
check('pressing a picked chip unpicks it', (await apps(page)).every((a) => a === 'Blender'), await apps(page));
await page.locator('.au-chip[data-app=""]').click();
check('All clears the picks', (await page.locator('.au-card').count()) === gdCards && JSON.stringify(await pressed(page)) === '[""]');

await page.locator('.au-search input').fill('zzzz');
check('nothing matching: one sentence and one button', await page.locator('.au-empty').isVisible() && (await page.locator('.au-empty p').count()) === 1 && (await page.locator('.au-empty button').count()) === 1);
await page.locator('.au-reset').click();
check('the way out clears the search and shows everything', (await page.locator('.au-card').count()) === all && (await page.locator('.au-search input').inputValue()) === '');

const tryBtn = page.locator('.au-try').first();
await tryBtn.click();
check('Try Me! starts the automation', (await tryBtn.getAttribute('data-state')) === 'starting');
await page.waitForTimeout(1100);
check('then shows it running', (await tryBtn.getAttribute('data-state')) === 'on' && /Running/.test(await tryBtn.textContent()));
await tryBtn.click();
check('pressing it again stops it', (await tryBtn.textContent()) === 'Try Me!');

await page.locator('.au-desc').first().click();
await page.keyboard.press('/');
check('"/" puts the cursor in the search field', await page.locator('.au-search input').evaluate((e) => e === document.activeElement));
await page.keyboard.type('r ');
check('typing R and space there stays typing', (await page.locator('.au-search input').inputValue()) === 'r ');

await page.locator('.sb-scroll a.sb-row').first().click();
check('a chat row closes the page', await page.locator('.au').isHidden());
check('the open chat is current again', (await page.locator('.sb-scroll a.sb-row').first().getAttribute('aria-current')) === 'page');
check('the URL forgets the page', !new URL(page.url()).searchParams.has('tab'), page.url());
check('no console errors', errors.length === 0, errors);

const deep = await open(`${URL_}&tab=automations&q=game%20design&apps=roblox,blender`);
check('a link with ?q= and ?apps= lands on the same view', (await apps(deep.page)).length === 14 && (await deep.page.locator('.au-search input').inputValue()) === 'game design');

const loading = await open(`${URL_}&tab=automations&state=loading`);
check('?state=loading shows skeleton cards in the card\'s shape', (await loading.page.locator('.au-card.au-skel .au-thumb').count()) === 8);

const calm = await open(`${URL_}&tab=automations`, { reducedMotion: 'reduce' });
await calm.page.locator('.au-try').first().click();
check('reduced motion: the Starting spinner does not spin', (await calm.page.locator('.au-spin').evaluate((e) => getComputedStyle(e).animationName)) === 'none');

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : '\nall passed');
process.exit(fails.length ? 1 : 0);
