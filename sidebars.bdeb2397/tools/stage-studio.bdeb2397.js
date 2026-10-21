// Run in a signed-in YouTube Studio tab on Content > Videos (browser-control evaluate) to stage it for the thumbnail
// chat's computer view (screens/youtube.webp): the channel becomes the made-up Weeknight Kitchen and its list the
// channel's seven videos. Before it runs: the tab sized to 1470x837 at 2x (Emulation.setDeviceMetricsOverride), and a
// hidden <input type=file id=cv-files> given ../chats/yt-{curry,salmon,gnocchi-2,ramen,tacos,pasta,chili}.webp with
// DOM.setFileInputFiles, since Chrome keeps a public site from loading images off localhost. The page reads them
// locally; nothing is uploaded, saved or changed on the channel, and a reload undoes all of it. Studio re-binds its own
// <img>s, so each picture is laid over its frame instead. Answers counts only: rows staged, and any trace of the real
// channel name left on the page (must be 0 before a capture is kept).
(() => {
  const V = [
    { img: 'yt-curry', t: '15-Minute Chickpea Curry (Pantry Dinner)', d: 'Coconut milk, a can of chickpeas and the spices you already have. On the table in 15 minutes.', len: '9:12', date: 'Oct 16, 2026', views: '8,412', com: '96' },
    { img: 'yt-salmon', t: 'Crispy Salmon with 5 Ingredients', d: 'Crackly skin every time, roasted broccoli on the same pan, and a lemon butter you can make while it cooks.', len: '8:47', date: 'Oct 2, 2026', views: '21,907', com: '143' },
    { img: 'yt-gnocchi-2', t: 'Sheet Pan Gnocchi in 20 Minutes (One Pan!)', d: 'Crispy gnocchi, peppers and sausage roasted together on one sheet pan. Almost no dishes.', len: '12:41', date: 'Sep 18, 2026', views: '34,118', com: '288' },
    { img: 'yt-ramen', t: '30-Minute Miso Ramen at Home', d: 'A rich miso broth without the all-day simmer, jammy eggs and a quick chili oil.', len: '14:05', date: 'Sep 4, 2026', views: '52,630', com: '410' },
    { img: 'yt-tacos', t: 'Sheet Pan Tacos al Pastor', d: 'Pork, pineapple and onion charred under the broiler. Taco night for six with one pan.', len: '10:33', date: 'Aug 21, 2026', views: '29,045', com: '201' },
    { img: 'yt-pasta', t: 'One Pot Lemon Orzo', d: 'Creamy without cream. Orzo, broth, lemon and parmesan, all in one pot in 20 minutes.', len: '7:58', date: 'Aug 7, 2026', views: '18,776', com: '132' },
    { img: 'yt-chili', t: 'Is This the Best Weeknight Chili?', d: 'Thick, smoky beef and bean chili in under an hour, and the topping bar that makes it.', len: '16:20', date: 'Jul 24, 2026', views: '41,390', com: '517' },
  ];
  const CHANNEL = 'Weeknight Kitchen';
  const files = Object.fromEntries([...document.getElementById('cv-files').files].map((f) => [f.name.replace('.webp', ''), URL.createObjectURL(f)]));
  // a picture laid over a frame Studio keeps redrawing; the avatar crops to the cook's face
  const cover = (host, src, cls, extra = {}) => {
    host.querySelector(`.${cls}`)?.remove();
    host.style.position = 'relative';
    const im = Object.assign(document.createElement('img'), { className: cls, src, alt: '' });
    Object.assign(im.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', zIndex: '1' }, extra);
    host.append(im);
  };
  const face = { objectPosition: '64% 12%', borderRadius: '50%' };

  // the list: the first ordinary rows (a row whose processing failed is laid out differently) become the channel's videos
  const rows = [...document.querySelectorAll('ytcp-video-row')];
  const ordinary = (r) => !!r.querySelector('#img-with-fallback') && /Public|Unlisted|Private/.test(r.querySelector('.tablecell-visibility')?.textContent ?? '') && !r.querySelector('.tablecell-failure');
  const publicIcon = rows.find((r) => /Public/.test(r.querySelector('.tablecell-visibility')?.textContent ?? ''))?.querySelector('.tablecell-visibility .left-icon')?.innerHTML;
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
    if (icon && publicIcon) { icon.innerHTML = publicIcon; icon.className = icon.className.replace(/privacy-\w+-icon/, 'privacy-public-icon'); }
    const date = r.querySelector('.tablecell-date');
    const day = [...date.childNodes].find((n) => n.nodeType === 3 && n.data.trim());
    if (day) day.data = ` ${v.date} `;
    const sub = date.querySelector('.cell-description');
    if (sub) sub.textContent = ' Published ';
    r.querySelector('.tablecell-views').textContent = v.views;
    // the comments cell loses its own wrapper when its text is set: laid out as the views cell beside it
    const views = getComputedStyle(r.querySelector('.tablecell-views')), com = r.querySelector('.tablecell-comments');
    com.textContent = v.com;
    for (const p of ['display', 'alignItems', 'justifyContent', 'textAlign', 'paddingTop', 'paddingBottom', 'lineHeight', 'fontSize', 'color']) com.style[p] = views[p];
    for (const a of r.querySelectorAll('[href*="/video/"]')) a.setAttribute('href', '/video/edit');
  });

  // the channel: its name in the drawer, its avatar there and on the top bar's account button
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
  for (const n of document.querySelectorAll('tp-yt-paper-dialog, ytcp-dialog, ytcp-toast, tp-yt-paper-toast')) n.style.display = 'none';

  const html = document.body.innerHTML + document.title;
  return { staged: keep.length, pictures: document.querySelectorAll('.cv-thumb').length, channelFound: real.length, channelLeft: real.reduce((n, r) => n + html.split(r).length - 1, 0) };
})()
