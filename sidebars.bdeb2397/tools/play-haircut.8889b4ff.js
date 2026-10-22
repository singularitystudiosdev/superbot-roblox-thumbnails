// Tested 2026-10-21 in the user's Chrome via browser-control: the haircut play's three Google Calendar states, from
// stage-calendar.bdeb2397.js with the same set-up (1470x837 tab at 2x, CSP bypassed, sessionStorage.cvChip holding one real
// timed chip's outerHTML). Set window.PLAY_MODE before running:
//   'free'      the chat's week without the team dinner and without the haircut (Wed and Thu evenings free)
//   'conflict'  the haircut with Sam Wed 6:15-7pm AND the team dinner Wed 6-8:30pm, side by side as Calendar draws overlaps
//   'moved'     the dinner Wed, the haircut Thu 5:45pm (what screens/haircut.webp shows)
// OVERLAP below is a guess at Calendar's inline left/width for two overlapping chips: before capturing 'conflict', read the
// left/width/z-index a real overlapping pair on the live page carries and set them here. Measure targets with
// getBoundingClientRect on [data-eventid^=staged]. Nothing is created or saved; reload the tab to undo. Answers counts only
// (chips staged, identity traces left: must be 0).
(() => {
  const ACC = { name: 'Jordan Lee', email: 'jordan@quillnote.app', initial: 'J' };
  const HOUR = 48; // px a grid hour
  const BLUE = 'rgb(3, 155, 229)', SAGE = 'rgb(51, 182, 121)', GRAPE = 'rgb(142, 36, 170)', TANGERINE = 'rgb(244, 81, 30)';
  // [column (0 is Sunday), from, to (hours), title, start as Calendar writes it, location, color]
  const MODE = window.PLAY_MODE || 'moved';
  // two overlapping events in separate columns, by Calendar's own formula left calc((100% - Kpx)*L + Kpx), width calc((100% - Kpx)*W), K 0
  const OVERLAP = window.OVERLAP || { first: { left: 'calc(0% + 0px)', width: 'calc(50% - 0px)' }, second: { left: 'calc(50% + 0px)', width: 'calc(50% - 0px)' } };
  const ALL = [
    [1, 9.5, 10, 'Team standup', '9:30am', 'Google Meet', BLUE], [1, 12, 13, 'Lunch with Priya', '12pm', 'Tartine Manufactory', BLUE], [1, 15, 16, 'Roadmap planning', '3pm', 'Office, 4th floor', BLUE],
    [2, 9.5, 10, 'Team standup', '9:30am', 'Google Meet', BLUE], [2, 14, 15, 'Quillnote design review', '2pm', 'Office, 4th floor', BLUE],
    [3, 9.5, 10, 'Team standup', '9:30am', 'Google Meet', BLUE], [3, 13, 14, '1:1 with Dan', '1pm', 'Google Meet', BLUE], [3, 18, 20.5, 'Team dinner', '6pm', 'Nopa, 560 Divisadero St', GRAPE],
    [4, 9.5, 10, 'Team standup', '9:30am', 'Google Meet', BLUE], [4, 11, 11.75, 'Pinecrest intro call', '11am', 'Zoom', BLUE], [4, 17.75, 18.5, 'Haircut with Sam', '5:45pm', 'Fade Room, Valencia St', SAGE],
    [5, 9.5, 10, 'Team standup', '9:30am', 'Google Meet', BLUE], [5, 15.67, 21, 'Flight to Lisbon (TP 238)', '3:40pm', 'SFO International Terminal', TANGERINE],
  ];
  const EVENTS = ALL.filter((e) => {
    if (e[3] === 'Team dinner' && MODE === 'free') return false;
    if (e[3] === 'Haircut with Sam') return MODE !== 'free';
    return true;
  }).map((e) => (e[3] === 'Haircut with Sam' && MODE === 'conflict' ? [3, 18.25, 19, e[3], '6:15pm', e[5], e[6]] : e));

  // the week: the account's own chips out, the chat's in, filled in their color with white text as Calendar draws them
  const tpl = document.createElement('template');
  tpl.innerHTML = sessionStorage.getItem('cvChip');
  const base = tpl.content.firstElementChild;
  for (const c of document.querySelectorAll('[role=gridcell][data-column-index] [data-eventid]')) c.remove();
  for (const [col, from, to, title, start, place, color] of EVENTS) {
    const cell = document.querySelector(`[role=gridcell][data-column-index="${col}"]`);
    const chip = base.cloneNode(true);
    chip.setAttribute('data-eventid', `staged${col}${from}`);
    chip.removeAttribute('jslog');
    if (MODE === 'conflict' && col === 3 && (title === 'Team dinner' || title === 'Haircut with Sam')) Object.assign(chip.style, title === 'Team dinner' ? OVERLAP.first : OVERLAP.second);
    Object.assign(chip.style, { top: `${Math.round(from * HOUR)}px`, height: `${Math.round((to - from) * HOUR) - 2}px`, borderColor: color, backgroundColor: color, color: '#fff' });
    chip.querySelector('.Jcb6qd').style.color = '#fff';
    chip.querySelector('.XuJrye').textContent = `${start}, ${title}, ${place}, ${ACC.name}, Accepted`;
    chip.querySelector('.I0UMhf').textContent = title;
    // the second line as Calendar writes it, "5:45pm, Fade Room": the space a non-breaking one, which it keeps
    chip.querySelector('.b0NTye').textContent = start;
    chip.querySelector('.pttLke').textContent = ',\u00a0';
    chip.querySelector('.k7JKz').textContent = place;
    (cell.querySelector('.feMFof') ?? cell).append(chip);
  }
  for (const h of document.querySelectorAll('[role=gridcell][data-column-index] h2.XuJrye')) h.textContent = h.textContent.replace(/^No events, /, '');

  // the account, and the calendar named after it in My calendars; the time zone a San Francisco one's in November
  const acct = document.querySelector('a[aria-label^="Google Account"]');
  const label = acct?.getAttribute('aria-label') ?? '';
  const realEmail = (label.match(/[\w.+-]+@[\w.-]+\.\w+/) || [''])[0];
  const realName = label.replace(/^Google Account:\s*/, '').replace(/\(?[\w.+-]+@[\w.-]+\.\w+\)?/, '').trim();
  const real = window.__real ??= [realEmail, realName, realEmail.split('@')[0], realName.split(/\s+/)[0]].filter((s) => s && s.length > 3);
  // the first calendar under My calendars is named after its owner, not always as the account is: any such name is set
  // in window.REAL_EXTRA by whoever runs this (read off the page, never saved), and scrubbed and counted with the rest
  const extra = (window.REAL_EXTRA ?? []).filter((n) => n.length > 3);
  const stand = (r) => (r === realEmail ? ACC.email : r === real[3] ? ACC.name.split(' ')[0] : ACC.name);
  const swap = (s) => extra.reduce((o, n) => o.split(n).join(ACC.name), real.reduce((out, r) => out.split(r).join(stand(r)), s));
  const photo = acct?.querySelector('img');
  if (photo) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="32" fill="#5f6368"/><text x="32" y="42" font-family="Arial" font-size="30" fill="#fff" text-anchor="middle">${ACC.initial}</text></svg>`;
    photo.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    photo.removeAttribute('srcset');
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode;
    let v = swap(t.data);
    if (/^\s*GMT[+-]\d\d\s*$/.test(v)) v = v.replace(/GMT[+-]\d\d/, 'GMT-08');
    if (v !== t.data) t.data = v;
  }
  for (const node of document.querySelectorAll('*')) for (const a of [...node.attributes]) { const v = swap(a.value); if (v !== a.value) node.setAttribute(a.name, v); }
  for (const n of document.querySelectorAll('[role=dialog], [role=alertdialog]')) if (n.offsetParent) n.style.display = 'none';
  // 7 AM at the top, as the creative's working day reads
  const grid = document.querySelector('.mDPmMe');
  if (grid) grid.scrollTop = 7 * HOUR;

  const html = document.body.innerHTML + document.title;
  return { staged: document.querySelectorAll('[data-eventid^=staged]').length, identityFound: real.length + extra.length, identityLeft: [...real, ...extra].reduce((n, r) => n + html.split(r).length - 1, 0) };
})()
// Notes: after setBypassCSP the tab must be reloaded before this runs; Calendar's own sync wipes the staged chips within seconds,
// so run it and take Page.captureScreenshot straight after (a late-loading calendar name is scrubbed by running the identity
// block again). Wrap the body in window.__stage = (MODE) => {...} to re-stage without reloading.
