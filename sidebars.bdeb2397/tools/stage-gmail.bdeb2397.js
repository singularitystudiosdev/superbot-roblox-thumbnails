// Run in a signed-in Gmail list tab (browser-control evaluate) to stage it for a chat's computer view: the list becomes
// the chat's made-up emails, and the account's own name, address and photo are replaced everywhere on the page (text and
// attributes alike) by a made-up identity, read from the page itself so they never leave it. The account's own counts
// (messages, new promotions, storage) become the chat's. Nothing is opened, sent, archived or saved; a reload undoes all
// of it. Answers only counts: rows staged, and any trace of the real identity still on the page (must be 0 before a
// capture is kept). STAGE is set per chat before this runs.
(() => {
  const S = window.STAGE;
  const acct = document.querySelector('a[aria-label^="Google Account"]');
  const label = acct?.getAttribute('aria-label') ?? '';
  const realEmail = (label.match(/[\w.+-]+@[\w.-]+\.\w+/) || [''])[0];
  const realName = label.replace(/^Google Account:\s*/, '').replace(/\(?[\w.+-]+@[\w.-]+\.\w+\)?/, '').trim();
  // kept on the page (never returned) so a later check can look for it after this run has replaced it
  const real = window.__real ??= [realEmail, realName, realEmail.split('@')[0], realName.split(/\s+/)[0]].filter((s) => s && s.length > 3);
  const stand = (r) => (r === realEmail ? S.account.email : r === real[3] ? S.account.name.split(' ')[0] : S.account.name);
  const swap = (s) => real.reduce((out, r) => out.split(r).join(stand(r)), s);
  const el = (tag, cls, text, attrs = {}) => Object.assign(Object.assign(document.createElement(tag), { className: cls, textContent: text }), attrs);

  // the list: the chat's rows over the first ones, the rest removed
  const rows = [...document.querySelectorAll('tr.zA')];
  rows.forEach((r, i) => {
    const d = S.rows[i];
    if (!d) { r.remove(); return; }
    r.classList.toggle('zE', !!d.unread);
    r.classList.toggle('yO', !d.unread);
    // the sender cell rebuilt whole: a thread or a reply nudge lays it out differently, so nothing of Gmail's is kept
    const who = el('span', d.unread ? 'zF' : 'yP', d.from);
    who.setAttribute('translate', 'no');
    who.setAttribute('email', d.email);
    who.setAttribute('name', d.from);
    const wrap = el('span', 'bA4', '');
    wrap.append(who);
    for (const cell of r.querySelectorAll('td.yX div.yW')) cell.replaceChildren(wrap.cloneNode(true), ...(d.count ? [' ', el('span', 'bx0', String(d.count))] : []));
    // the row's screen-reader line, which Gmail keeps beside the visible cells
    for (const a of r.querySelectorAll('td.yX div.afn')) a.textContent = `${d.unread ? 'unread, ' : ''}${d.from}, ${d.subject}, ${d.date}, ${d.snippet}`;
    r.querySelector('span.bog').textContent = d.subject;
    const sn = r.querySelector('span.y2');
    sn.replaceChildren(el('span', 'Zt', ' - '), document.createTextNode(d.snippet));
    const date = r.querySelector('td.xW span span') ?? r.querySelector('td.xW span');
    date.textContent = d.date;
    // an unread row's date is bold, a read one's plain
    date.classList.toggle('bq3', !!d.unread);
    date.parentElement?.setAttribute('title', d.date);
    date.parentElement?.setAttribute('aria-label', d.date);
    // Gmail's "Received 2 days ago. Reply?" nudge, attachment and invite chips, label chips: the made-up mail has none
    for (const c of r.querySelectorAll('td.byZ')) c.replaceChildren();
    for (const c of r.querySelectorAll('span.aKS, .ar.as, .at, .brd, .brc, .aOe')) c.remove();
    const star = r.querySelector('td.apU span');
    if (star) {
      star.setAttribute('aria-label', d.starred ? 'Starred' : 'Not starred');
      star.classList.toggle('T-KT-Jp', !!d.starred);
    }
  });

  // the category tabs keep their names (.aKz); a "N new" badge (.aDG, laid out before the name) is the chat's, and any
  // other preview text goes
  for (const tab of document.querySelectorAll('[role=tab].aAy')) {
    const name = tab.querySelector('.aKz')?.textContent.trim() ?? '';
    for (const b of tab.querySelectorAll('.aDG, .aDJ')) {
      if (S.newIn?.[name]) b.textContent = `${S.newIn[name]} new`;
      else b.remove();
    }
    const walker = document.createTreeWalker(tab, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) { const t = walker.currentNode; if (!t.parentElement.closest('.aKz, .aDG, .aDJ')) t.data = ''; }
    tab.setAttribute('aria-label', name);
  }
  // a tab with a badge carries .aE2, which raises its label to make room: gone with the badge
  for (const tab of document.querySelectorAll('[role=tab].aAy.aE2')) if (!tab.querySelector('.aDG, .aDJ')) tab.classList.remove('aE2');
  // the left nav: only the counts the chat gives
  for (const n of document.querySelectorAll('.aim .bsU')) n.textContent = '';
  for (const [hash, count] of Object.entries(S.navCounts ?? {})) {
    const n = document.querySelector(`.aim a[href$="#${hash}"]`)?.closest('.aim')?.querySelector('.bsU');
    if (n) n.textContent = count;
  }
  // "1-50 of 3,656": the chat's count
  const page = [...document.querySelectorAll('.Dj')].find((p) => p.offsetParent !== null) ?? document.querySelector('.Dj');
  const ts = page?.querySelectorAll('.ts');
  if (ts?.length === 3) { ts[0].textContent = '1'; ts[1].textContent = String(S.rows.length); ts[2].textContent = S.total ?? String(S.rows.length); }
  // storage used (its percentage is a text node of its own) and its bar, and the footer's account activity
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) {
    const t = walk.currentNode;
    if (/\d+%/.test(t.data) && /GB used/.test(t.parentElement?.parentElement?.textContent ?? '')) t.data = t.data.replace(/\d+%/, S.storage ?? '2%');
    if (/Last account activity:/.test(t.data)) t.data = 'Last account activity: 12 minutes ago';
  }
  for (const bar of document.querySelectorAll('.aiC .aiA')) bar.style.width = S.storage ?? '2%';
  // the search field shows the chat's query
  const q = document.querySelector('input[name=q]');
  if (q) { q.value = S.search ?? ''; q.setAttribute('value', S.search ?? ''); }
  // the account: a plain initial in place of the photo
  const photo = acct?.querySelector('img');
  if (photo) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="32" fill="#5f6368"/><text x="32" y="42" font-family="Arial" font-size="30" fill="#fff" text-anchor="middle">${S.account.initial}</text></svg>`;
    photo.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    photo.removeAttribute('srcset');
  }
  document.title = S.title;

  // the real identity, wherever else it shows: text and every attribute
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const t = walker.currentNode; const v = swap(t.data); if (v !== t.data) t.data = v; }
  for (const node of document.querySelectorAll('*')) for (const a of [...node.attributes]) { const v = swap(a.value); if (v !== a.value) node.setAttribute(a.name, v); }
  // what is left of it (must be 0), and whether what shows is the staged list (no thread open, every visible row ours)
  const html = document.body.innerHTML + document.title;
  const left = real.reduce((n, r) => n + html.split(r).length - 1, 0);
  const subjects = new Set(S.rows.map((r) => r.subject));
  const visible = [...document.querySelectorAll('tr.zA')].filter((r) => r.offsetParent !== null);
  const thread = document.querySelector('h2.hP');
  return { staged: Math.min(rows.length, S.rows.length), visibleRows: visible.length, allStaged: visible.length > 0 && visible.every((r) => subjects.has(r.querySelector('span.bog')?.textContent)), threadOpen: !!thread && thread.offsetParent !== null, identityFound: real.length, identityLeft: left };
})()
