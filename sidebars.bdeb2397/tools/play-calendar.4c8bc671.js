// The Google Calendar states the chats' computer views were missing ("Added Nov 14 to your calendar", "Added both
// flights to your calendar", "Pickup Saturday at 10 AM", "Put every booking on your calendar"): the real week (or
// 4-day) view in the owner's signed-in Chrome (browser-control), staged by stage-calendar.bdeb2397.js with each state's
// events in place of its hard-coded week. No event is created, moved or saved; a reload undoes all of it.
//
// How: the tab sized 1470x837 at 2x; this file and stage-calendar.bdeb2397.js read in from a file input
// (DOM.setFileInputFiles), evaluated through a Trusted Types policy (window.__ttEval). Then `await window.__cal('<id>')`:
// it opens the state's week through Calendar's own router (the address the app keeps, then its popstate), waits for the
// grid's first day to be the state's, keeps one real timed chip as the template every staged chip is cloned from, runs
// stage-calendar with EVENTS = the state's and its time zone label, and answers its counts (identityLeft must be 0) and
// the targets (each a staged chip's centre, CSS px). Then cdp Page.captureScreenshot, cwebp -q 80.
(() => {
  const BLUE = 'rgb(3, 155, 229)', SAGE = 'rgb(51, 182, 121)', GRAPE = 'rgb(142, 36, 170)', TANGERINE = 'rgb(244, 81, 30)', FLAMINGO = 'rgb(230, 124, 115)', BANANA = 'rgb(246, 191, 38)';
  // a working week as the chats' Jordan Lee has it: [column, from, to (hours), title, start as Calendar writes it, place, color]
  const workweek = (skip = []) => [
    [1, 9.5, 10, 'Team standup', '9:30am', 'Google Meet', BLUE], [2, 9.5, 10, 'Team standup', '9:30am', 'Google Meet', BLUE], [3, 9.5, 10, 'Team standup', '9:30am', 'Google Meet', BLUE],
    [4, 9.5, 10, 'Team standup', '9:30am', 'Google Meet', BLUE], [5, 9.5, 10, 'Team standup', '9:30am', 'Google Meet', BLUE],
    [1, 13, 14, 'Roadmap planning', '1pm', 'Office, 4th floor', BLUE], [2, 14, 15, 'Quillnote design review', '2pm', 'Office, 4th floor', BLUE],
    [3, 12, 13, 'Lunch with Priya', '12pm', 'Tartine Manufactory', BLUE], [4, 15, 15.5, '1:1 with Dan', '3pm', 'Google Meet', BLUE],
  ].filter((e) => !skip.includes(e[0]));
  const STATES = {
    // Sat, Nov 14, 2026: the concert
    'tickets/calendar': {
      path: '/calendar/u/0/r/week/2026/11/14', first: '8', top: 9,
      events: [...workweek(), [6, 19.5, 22.5, 'Neon Harbor', '7:30pm', 'Riverside Arena, Portland', GRAPE], [6, 17.5, 18.5, 'Dinner before the show', '5:30pm', 'Near Riverside Arena', BLUE]],
      targets: { concert: [6, 19.5] },
    },
    // Mon, Mar 8, 2027 out, and Mon, Mar 22, 2027 back (the return leaves Narita on the 22nd and lands at SFO the same morning)
    'flights/calendar-out': {
      path: '/calendar/u/0/r/week/2027/3/8', first: '7', top: 8,
      events: [...workweek([1]), [1, 9, 10.5, 'Leave for SFO', '9am', 'Home', BLUE], [1, 11.58, 23.5, 'Flight to Tokyo (Narita), nonstop', '11:35am', 'SFO International Terminal', TANGERINE]],
      targets: { out: [1, 11.58] },
    },
    'flights/calendar-back': {
      path: '/calendar/u/0/r/week/2027/3/22', first: '21', top: 0,
      events: [...workweek([1]), [1, 0.5, 10.67, 'Flight home from Tokyo (Narita), nonstop', '12:30am', 'Narita International Airport, Terminal 2', TANGERINE]],
      targets: { back: [1, 0.5] },
    },
    // Sat, Oct 24, 2026: the bike's pickup
    'bike/calendar': {
      path: '/calendar/u/0/r/week/2026/10/24', first: '18', top: 7,
      events: [...workweek(), [6, 10, 10.75, 'Pick up road bike ($480, cash)', '10am', 'College Ave and Alcatraz Ave, Oakland', SAGE]],
      targets: { pickup: [6, 10] },
    },
    // Fri, Nov 20 to Mon, Nov 23, 2026, on Lisbon time (Calendar's 4-day view)
    'lisbon/calendar': {
      path: '/calendar/u/0/r/customday/2026/11/20', first: '20', tz: 'GMT+00', top: 7.5,
      events: [
        [0, 15, 16, 'Check in: Casa do Chiado Hotel', '3pm', 'Rua Nova da Trindade, Chiado', SAGE], [0, 20, 22, 'Dinner: Taberna do Largo', '8pm', 'Rua da Misericórdia 54', FLAMINGO],
        [1, 10, 13, 'Alfama and Belém', '10am', 'Tram 28 from Martim Moniz', BANANA], [1, 20.5, 22.5, 'Dinner: Casa das Gaivotas', '8:30pm', 'Rua da Atalaia 48', FLAMINGO],
        [2, 8.02, 8.68, 'Train to Sintra', '8:01am', 'Lisboa Rossio', TANGERINE], [2, 10, 12, 'Pena Palace, entry 10:00', '10am', 'Sintra', BANANA], [2, 17.33, 18, 'Train back to Lisbon', '5:20pm', 'Sintra station', TANGERINE],
        [3, 11, 11.5, 'Check out: Casa do Chiado Hotel', '11am', 'Rua Nova da Trindade, Chiado', SAGE],
      ],
      targets: { train: [2, 8.02], dinner1: [0, 20], dinner2: [1, 20.5], hotel: [0, 15] },
    },
  };
  window.PLAY_CAL_IDS = Object.keys(STATES);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const firstDay = () => document.querySelector('[role=columnheader] h2, [role=columnheader]')?.textContent.replace(/\D+/g, ' ').trim().split(' ').pop();
  window.__cal = async (id) => {
    const S = STATES[id];
    if (!S) throw new Error(`no Calendar state named ${id}`);
    if (location.pathname !== S.path) {
      history.pushState({}, '', S.path);
      dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }
    const t0 = Date.now();
    await sleep(600);
    while (Date.now() - t0 < 12000) {
      const cols = [...document.querySelectorAll('[role=columnheader]')].filter((h) => h.offsetParent);
      if (cols.length && (cols[0].textContent.match(/\d+/g) ?? []).includes(S.first)) break;
      await sleep(250);
    }
    await sleep(800);
    // the template: one real timed chip (any week's), kept before staging removes them
    window.__chipBase ??= document.querySelector('[role=gridcell][data-column-index] [data-eventid]')?.cloneNode(true);
    if (!window.__chipBase) throw new Error('no real timed chip on this view to stage from');
    window.CAL_EVENTS = S.events;
    // the first calendar under My calendars carries its owner's own name: read off the page (never kept anywhere else)
    // and scrubbed with the account's, as stage-calendar's REAL_EXTRA asks
    if (!window.REAL_EXTRA?.length) {
      const texts = [];
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      // an icon's ligature (its text is the icon's name) is not a calendar's name
      while (walk.nextNode()) { const p = walk.currentNode.parentElement, v = walk.currentNode.data.trim(); if (v && p?.offsetParent && !p.closest('i, .google-material-icons')) texts.push(v); }
      const from = texts.indexOf('My calendars'), to = texts.indexOf('Other calendars', from);
      window.REAL_EXTRA = texts.slice(from + 1, to < 0 ? from + 4 : to).filter((v) => !['Birthdays', 'Tasks', 'Jordan Lee'].includes(v)).slice(0, 1);
    }
    let src = window.__calSrc
      .replace(/const ALL = \[[\s\S]*?\n {2}\];\n {2}const EVENTS = [\s\S]*?;\n/, 'const EVENTS = window.CAL_EVENTS;\n')
      .replace(/const EVENTS = \[[\s\S]*?\n {2}\];\n/, 'const EVENTS = window.CAL_EVENTS;\n')
      .replace(/const tpl = document\.createElement\('template'\);\s*tpl\.innerHTML = sessionStorage\.getItem\('cvChip'\);\s*const base = tpl\.content\.firstElementChild;/, 'const base = window.__chipBase;')
      .replace("'GMT-08'", `'${S.tz ?? 'GMT-08'}'`);
    if (!src.includes('window.CAL_EVENTS') || !src.includes('window.__chipBase')) throw new Error('stage-calendar did not take the state');
    // Calendar draws a week it has just opened again once its events arrive, which takes staged chips with it: staged
    // again until they stay put
    let staged;
    for (let k = 0; k < 4; k++) {
      staged = (0, eval)(src);
      await sleep(1800);
      if (document.querySelectorAll('[data-eventid^=staged]').length === S.events.length) break;
    }
    // the state's own hours at the top of the grid (stage-calendar puts 7 AM there)
    const grid = document.querySelector('.mDPmMe');
    if (grid && S.top !== undefined) grid.scrollTop = S.top * 48;
    await sleep(300);
    const cols = [...document.querySelectorAll('[role=columnheader]')].filter((h) => h.offsetParent).map((h) => h.textContent.trim());
    const targets = {};
    for (const [name, [col, from]] of Object.entries(S.targets)) {
      const chip = document.querySelector(`[data-eventid="staged${col}${from}"]`);
      const b = chip?.getBoundingClientRect();
      targets[name] = b ? [+(b.x + Math.min(b.width / 2, 60)).toFixed(1), +(b.y + Math.min(b.height / 2, 14)).toFixed(1)] : null;
    }
    return { id, staged, cols, targets, title: document.title, path: location.pathname };
  };
})();
