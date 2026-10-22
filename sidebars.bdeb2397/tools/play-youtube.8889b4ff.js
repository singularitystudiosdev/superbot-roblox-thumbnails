// Play pages for the thumbnail chat ("youtube"): YouTube Studio, signed in, in the owner's Chrome (browser-control),
// staged like stage-studio.bdeb2397.js. Run in a Studio tab opened by us, sized 1470x837 at 2x (Emulation.setDeviceMetricsOverride),
// Page.setBypassCSP on, a hidden <input type=file id=cv-files multiple> filled (DOM.setFileInputFiles) with
// ../chats/yt-{curry,salmon,gnocchi-0,gnocchi-1,gnocchi-2,gnocchi-3,ramen,tacos,pasta,chili}.webp. Studio is a single-page app:
// move between its pages by clicking its own links so the file input and the made-up channel survive.
// Nothing is saved, uploaded, started or changed; a reload of the tab undoes all of it.
//
// Usage: set window.PLAY = { page: 'content' | 'details' | 'test' | 'analytics', gnocchi: 'yt-gnocchi-0' | 'yt-gnocchi-2' } and evaluate this
// file in the right place (content: Content > Videos; details: click the gnocchi row's title, wait, run; test: on details click the
// thumbnail 'A/B Testing' tile (ytcp-thumbnails-experiment-editor #select-button), wait, run with page 'test'; analytics: open the
// explore URL recorded in pages.json (real channel id) with o_column=VIDEO_THUMBNAIL_IMPRESSIONS_VTR&o_direction=ANALYTICS_ORDER_DIRECTION_ASC,
// switch 'Show chart' off, run). Tabs opened by us only: set Emulation + Page.setBypassCSP, then location.href/reload once so the
// bypass applies (else 'TrustedHTML' errors), add the file input, fill it, run. Targets come back from each page.
// Figures/ids are made up: video id kQ4mZ8vNx2c, channel id UCwk7nQx2LmPzR4vYt9HfE1A.
(() => {
  const P = window.PLAY ?? {};
  const files = Object.fromEntries([...document.getElementById('cv-files').files].map((f) => [f.name.replace('.webp', ''), (window.__cvUrls ??= {})[f.name] ??= URL.createObjectURL(f)]));
  const CHANNEL = 'Weeknight Kitchen';
  const cover = (host, src, cls, extra = {}) => {
    host.querySelector(`:scope > .${cls}`)?.remove();
    host.style.position = 'relative';
    const im = Object.assign(document.createElement('img'), { className: cls, src, alt: '' });
    Object.assign(im.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', zIndex: '1' }, extra);
    host.append(im);
    return im;
  };
  const face = { objectPosition: '64% 12%', borderRadius: '50%' };
  const GN = 'Sheet Pan Gnocchi in 20 Minutes (One Pan!)';
  const channel = () => {
    const real = window.__realChannel ??= [document.querySelector('#entity-name')?.firstChild?.data.trim()].filter((s) => s && s.length > 2);
    const name = document.querySelector('#entity-name');
    if (name?.firstChild) name.firstChild.data = ` ${CHANNEL} `;
    for (const im of document.querySelectorAll('ytcp-navigation-drawer img.image-thumbnail')) cover(im.parentElement, files['yt-gnocchi-2'], 'cv-av', face);
    const account = document.querySelector('#avatar-btn yt-img-shadow');
    if (account) cover(account, files['yt-gnocchi-2'], 'cv-av', face);
    const swap = (s) => real.reduce((out, r) => out.split(r).join(CHANNEL), s);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) { const t = walker.currentNode; const v = swap(t.data); if (v !== t.data) t.data = v; }
    for (const node of document.querySelectorAll('*')) for (const a of [...node.attributes]) { const v = swap(a.value); if (v !== a.value) node.setAttribute(a.name, v); }
    const html = document.body.innerHTML + document.title;
    return { channelFound: real.length, channelLeft: real.reduce((n, r) => n + html.split(r).length - 1, 0) };
  };

  const content = () => {
    const V = [
      { img: 'yt-curry', t: '15-Minute Chickpea Curry (Pantry Dinner)', d: 'Coconut milk, a can of chickpeas and the spices you already have. On the table in 15 minutes.', len: '9:12', date: 'Oct 16, 2026', views: '8,412', com: '96' },
      { img: 'yt-salmon', t: 'Crispy Salmon with 5 Ingredients', d: 'Crackly skin every time, roasted broccoli on the same pan, and a lemon butter you can make while it cooks.', len: '8:47', date: 'Oct 2, 2026', views: '21,907', com: '143' },
      { img: P.gnocchi ?? 'yt-gnocchi-0', t: GN, d: 'Crispy gnocchi, peppers and sausage roasted together on one sheet pan. Almost no dishes.', len: '12:41', date: 'Sep 18, 2026', views: '34,118', com: '288' },
      { img: 'yt-ramen', t: '30-Minute Miso Ramen at Home', d: 'A rich miso broth without the all-day simmer, jammy eggs and a quick chili oil.', len: '14:05', date: 'Sep 4, 2026', views: '52,630', com: '410' },
      { img: 'yt-tacos', t: 'Sheet Pan Tacos al Pastor', d: 'Pork, pineapple and onion charred under the broiler. Taco night for six with one pan.', len: '10:33', date: 'Aug 21, 2026', views: '29,045', com: '201' },
      { img: 'yt-pasta', t: 'One Pot Lemon Orzo', d: 'Creamy without cream. Orzo, broth, lemon and parmesan, all in one pot in 20 minutes.', len: '7:58', date: 'Aug 7, 2026', views: '18,776', com: '132' },
      { img: 'yt-chili', t: 'Is This the Best Weeknight Chili?', d: 'Thick, smoky beef and bean chili in under an hour, and the topping bar that makes it.', len: '16:20', date: 'Jul 24, 2026', views: '41,390', com: '517' },
    ];
    const rows = [...document.querySelectorAll('ytcp-video-row')];
    const ordinary = (r) => !!r.querySelector('#img-with-fallback') && /Public|Unlisted|Private/.test(r.querySelector('.tablecell-visibility')?.textContent ?? '') && !r.querySelector('.tablecell-failure');
    const keep = rows.filter(ordinary).slice(0, V.length);
    for (const r of rows) if (!keep.includes(r)) r.remove();
    keep.forEach((r, i) => {
      const v = V[i];
      cover(r.querySelector('ytcp-img-with-fallback .container') ?? r.querySelector('#img-with-fallback').parentElement, files[v.img], 'cv-thumb');
      const badge = r.querySelector('ytcp-badge.timestamp-badge');
      if (badge) badge.style.zIndex = '2';
      const walk = document.createTreeWalker(r.querySelector('ytcp-thumbnail') ?? r, NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) { const t = walk.currentNode; if (/^\s*\d+:\d\d(:\d\d)?\s*$/.test(t.data)) t.data = v.len; }
      for (const a of r.querySelectorAll('#video-title')) { a.textContent = v.t; a.setAttribute('title', v.t); a.setAttribute('aria-label', v.t); }
      for (const d of r.querySelectorAll('.description')) d.textContent = v.d;
      const vis = r.querySelector('.tablecell-visibility');
      vis.querySelector('.label-span').textContent = 'Public';
      const icon = vis.querySelector('.left-icon');
      if (icon) { icon.replaceChildren(); icon.className = icon.className.replace(/privacy-\w+-icon/, 'privacy-public-icon'); }
      const date = r.querySelector('.tablecell-date');
      const day = [...date.childNodes].find((n) => n.nodeType === 3 && n.data.trim());
      if (day) day.data = ` ${v.date} `;
      const sub = date.querySelector('.cell-description');
      if (sub) sub.textContent = ' Published ';
      r.querySelector('.tablecell-views').textContent = v.views;
      const views = getComputedStyle(r.querySelector('.tablecell-views')), com = r.querySelector('.tablecell-comments');
      com.textContent = v.com;
      for (const p of ['display', 'alignItems', 'justifyContent', 'textAlign', 'paddingTop', 'paddingBottom', 'lineHeight', 'fontSize', 'color']) com.style[p] = views[p];
    });
    const ch = channel();
    for (const n of document.querySelectorAll('tp-yt-paper-dialog, ytcp-dialog, ytcp-toast, tp-yt-paper-toast')) n.style.display = 'none';
    const gn = keep[2];
    const c = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)]; };
    return { staged: keep.length, ...ch, targets: gn ? { gnocchi: c(gn.querySelector('#video-title')), 'gnocchi-thumb': c(gn.querySelector('ytcp-thumbnail') ?? gn.querySelector('#img-with-fallback')) } : null };
  };


  const c = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)]; };
  const scrub = (extra = []) => {
    const REAL = [...(window.__realChannel ?? []), ...extra];
    const swap = (s) => REAL.reduce((o, [a, b]) => (a && o.includes(a) ? o.split(a).join(b) : o), s);
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const t = w.currentNode, v = swap(t.data); if (v !== t.data) t.data = v; }
    for (const n of document.querySelectorAll('*')) for (const a of [...n.attributes]) {
      if (a.name === 'src' && /ggpht/.test(a.value)) { n.setAttribute('src', files['yt-gnocchi-2']); continue; }
      if (a.name === 'src' && /ytimg/.test(a.value)) { n.setAttribute('src', files['yt-gnocchi-0']); continue; }
      const v = swap(a.value); if (v !== a.value) n.setAttribute(a.name, v);
    }
  };

  // Video details of the gnocchi video: the first real video's page, its text swapped for the made-up one.
  const details = () => {
    const boxes = [...document.querySelectorAll('#textbox')];
    const realTitle = boxes[0].textContent.trim(), realDesc = boxes[1].textContent.trim(), REAL_ID = location.pathname.split('/')[2];
    window.__realChannel ??= [];
    scrub([[realTitle, GN], [realDesc, 'Crispy gnocchi, peppers and sausage roasted together on one sheet pan. Almost no dishes.'], [REAL_ID, 'kQ4mZ8vNx2c'], ['Climbing Magic', CHANNEL]].concat(window.__realChannel.map((r) => [r, CHANNEL])));
    for (const im of document.querySelectorAll('img.cv-av')) if (!im.closest('#avatar-btn')) im.remove();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) if (/^\s*\d+:\d\d\s*$/.test(w.currentNode.data) && w.currentNode.parentElement.closest('ytcp-thumbnail')) w.currentNode.data = '12:41';
    for (const im of document.querySelectorAll('img#img-with-fallback')) if (im.getBoundingClientRect().width > 100 && im.getBoundingClientRect().y > 100) cover(im.parentElement, files[P.gnocchi ?? 'yt-gnocchi-0'], 'cv-thumb');
    const tile = document.querySelector('ytcp-thumbnails-experiment-editor #select-button');
    return { targets: { test: c(tile) } };
  };

  // The A/B Testing dialog (Thumbnail only): three slots show versions 1-3 (nothing uploaded, nothing set).
  const test = () => {
    const dlg = [...document.querySelectorAll('tp-yt-paper-dialog')].find((d) => /Test and compare/.test(d.innerText));
    const swap = (s) => s.split('Stuck Rope Nearly Sends Climber Into the Ledge - Near-Death Climbing Experience').join(GN);
    const w = document.createTreeWalker(dlg, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const t = w.currentNode, v = swap(t.data); if (v !== t.data) t.data = v; }
    [...dlg.querySelectorAll('ytcp-thumbnail-editor')].forEach((te, i) => {
      te.querySelector('.select').hidden = true;
      const p = te.querySelector('.preview'); p.hidden = false;
      p.querySelector('img').src = files['yt-gnocchi-' + (i + 1)];
      p.querySelector('ytcp-img-with-fallback').setAttribute('image-ready', '');
    });
    const btn = dlg.querySelector('#set-test-button');
    btn.removeAttribute('disabled'); btn.removeAttribute('aria-disabled'); btn.querySelector('button')?.removeAttribute('disabled');
    for (const e of document.querySelectorAll('.ytcpCreatorExperimentCreateDialogStatus')) e.textContent = '';
    return { targets: { done: c(btn) } };
  };

  // Advanced mode > Content: the made-up channel's seven videos, lowest click-through first.
  const analytics = () => {
    const REAL = window.__realChannelName ?? 'Kiltro Kills';
    const V = [
      { img: P.gnocchi ?? 'yt-gnocchi-0', t: GN, len: '12:41', imp: 61400, ctr: 2.1, views: 9870, wt: 612.4, subs: 14 },
      { img: 'yt-pasta', t: 'One Pot Lemon Orzo', len: '7:58', imp: 38200, ctr: 3.6, views: 6512, wt: 301.8, subs: 9 },
      { img: 'yt-tacos', t: 'Sheet Pan Tacos al Pastor', len: '10:33', imp: 52900, ctr: 4.3, views: 11204, wt: 640.3, subs: 22 },
      { img: 'yt-salmon', t: 'Crispy Salmon with 5 Ingredients', len: '8:47', imp: 71800, ctr: 5.2, views: 17960, wt: 1102.7, subs: 41 },
      { img: 'yt-chili', t: 'Is This the Best Weeknight Chili?', len: '16:20', imp: 66300, ctr: 5.7, views: 19402, wt: 1288.5, subs: 37 },
      { img: 'yt-ramen', t: '30-Minute Miso Ramen at Home', len: '14:05', imp: 83500, ctr: 6.0, views: 25840, wt: 1611.9, subs: 58 },
      { img: 'yt-curry', t: '15-Minute Chickpea Curry (Pantry Dinner)', len: '9:12', imp: 29100, ctr: 6.4, views: 9031, wt: 402.2, subs: 18 },
    ];
    const sum = (k) => V.reduce((a, v) => a + v[k], 0);
    const T = { imp: sum('imp'), views: sum('views'), wt: sum('wt'), subs: sum('subs') };
    T.ctr = V.reduce((a, v) => a + v.imp * v.ctr, 0) / T.imp;
    const n = (x, d = 0) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    const pct = (a, b) => (a / b * 100).toFixed(1) + '%';
    const rows = [...document.querySelectorAll('#row-container')];
    const data = rows.slice(1).filter((r) => /%/.test(r.children[4]?.innerText ?? ''));
    const keep = data.slice(0, V.length);
    for (const r of rows.slice(1)) if (!keep.includes(r)) r.remove();
    for (const wrap of document.querySelectorAll('yta-explore-table-row.breakdown-row')) if (!wrap.querySelector('#row-container')) wrap.remove();
    const set = (cell, main, share) => { cell.querySelector('.debug-metric-value').textContent = main; const p = cell.querySelector('.formatted-percentage'); if (p && share != null) p.textContent = share; };
    keep.forEach((r, i) => {
      const v = V[i];
      cover(r.querySelector('ytcp-img-with-fallback .container'), files[v.img], 'cv-thumb');
      const badge = r.querySelector('ytcp-badge.timestamp-badge'); if (badge) badge.style.zIndex = '2';
      r.querySelector('ytcp-badge .label').textContent = v.len;
      r.querySelector('#entity-title-value').textContent = ` ${v.t} `;
      for (const e of r.querySelectorAll('[aria-label]')) e.setAttribute('aria-label', e.getAttribute('aria-label').replace(/(Select row for ).*/, `$1${v.t}`));
      r.style.removeProperty('--yta-explore-table-row-color');
      const k = [...r.children].slice(2, 7);
      set(k[0], n(v.imp)); set(k[1], v.ctr.toFixed(1) + '%'); set(k[2], n(v.views), pct(v.views, T.views)); set(k[3], n(v.wt, 1), pct(v.wt, T.wt)); set(k[4], n(v.subs), pct(v.subs, T.subs));
    });
    const tk = [...rows[0].children].slice(2, 7);
    set(tk[0], n(T.imp)); set(tk[1], T.ctr.toFixed(1) + '%'); set(tk[2], n(T.views)); set(tk[3], n(T.wt, 1)); set(tk[4], n(T.subs));
    scrub([[REAL, CHANNEL], ['UC8qCs7E-QU8E0AcF1lFHj7w', 'UCwk7nQx2LmPzR4vYt9HfE1A']]);
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) if (/Climb|Rope|Near.Death|Near.Dead|Near Miss|Gravity|One Mistake|Seconds Before|Showing top 50/i.test(w.currentNode.data)) w.currentNode.data = '';
    for (const x of [...document.querySelectorAll('*')].filter((e) => /Showing top 50 results/.test(e.textContent) && ![...e.children].some((ch) => /Showing top 50/.test(ch.textContent)))) x.remove();
    for (const i of [...document.querySelectorAll('img')].filter((i) => /yt3\.ggpht/.test(i.src) || i.src.startsWith('blob:') === false && i.getBoundingClientRect().width > 0 && i.closest('yta-explore-app') && i.closest('ytcp-select, .controls, [class*=control]'))) cover(i.parentElement, files['yt-gnocchi-2'], 'cv-av', face);
    const hdr = [...document.querySelectorAll('#header-title')].find((e) => /click-through/i.test(e.textContent));
    return { T, targets: { 'ctr-header': c(hdr), row1: c(document.querySelectorAll('#row-container')[1].querySelector('#entity-title-value')) } };
  };

  const pages = { content, details, test, analytics };
  window.PLAY_PAGES = pages;
  return pages[P.page ?? 'content']();
})()
