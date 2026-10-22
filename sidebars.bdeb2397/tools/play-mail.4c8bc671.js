// The Gmail states the chats' computer views were missing, so each Activity line lands on what it says: the mail superbot
// sent (Sent Mail), the confirmations and replies it found (Inbox), and the searches it read. Every state is the real Gmail
// list in the owner's signed-in Chrome (browser-control), staged by stage-gmail.bdeb2397.js under the chats' made-up
// identity (Jordan Lee, jordan@quillnote.app) with the rows below; nothing is opened, sent, archived or saved, and a
// reload undoes all of it.
//
// How: the tab sized 1470x837 at 2x (cdp Emulation.setDeviceMetricsOverride), CSP bypassed for the tab (cdp
// Page.setBypassCSP, then a reload) so a script can be read in from a file input (DOM.setFileInputFiles with this file and
// stage-gmail.bdeb2397.js). Then `await window.__mail('<chat>/<id>')` per state: it opens the state's view (a label, or a
// broad read-only search such as is:read behind the staged query), waits for its rows, stages them (stage-gmail with its
// `rows` limited to the VISIBLE tr.zA, as a search keeps other views' rows in the page), hides Gmail's own pop-ups, and
// answers the staging counts (identityLeft must be 0) and the state's targets (getBoundingClientRect centres, CSS px).
// Then cdp Page.captureScreenshot, cwebp -q 80. A state whose view was just staged is reached through another view first,
// so Gmail draws its rows again.
(() => {
  const account = { name: 'Jordan Lee', email: 'jordan@quillnote.app', initial: 'J' };
  const row = (from, email, subject, snippet, date, more = {}) => ({ from, email, subject, snippet, date, unread: false, starred: false, ...more });
  const unread = { unread: true };
  // mail any of the chats' inboxes might hold, under the newest rows
  const OLDER = [
    row('Maya Chen', 'maya@quillnote.app', 'Launch week numbers', '1,240 signups since Monday, 18% of them from YouTube so far.', 'Oct 19'),
    row('Dan Okafor', 'dan.okafor@quillnote.app', 'Designer candidates: final two', 'Both did great on the take-home. I lean toward Ines, but it is your call.', 'Oct 19'),
    row('The Daily Brief', 'hello@dailybrief.example', 'Your Sunday edition: the week in review', 'The seven stories that mattered, and one that should have.', 'Oct 18'),
    row('Elena Park', 'elena@quillnote.app', 'Podcast invite: Tools for Teams', 'They want you on Nov 12 at 2 PM. Should I say yes?', 'Oct 17'),
    row('Bay Federal Credit Union', 'alerts@bayfederal.example', 'Your September statement is ready', 'Your checking statement for September is ready to view in online banking.', 'Oct 7'),
    row('Hail Rides', 'receipts@hailrides.example', 'Your Tuesday trip with Hail', 'Thanks for riding, Jordan. Total $12.60, charged to your card ending 4417.', 'Oct 6'),
    row('Priya Nair', 'priya.nair@quillnote.app', 'Q4 planning doc', 'Added the paid video line. Comments welcome before Friday.', 'Oct 5'),
    row('Mom', 'mom.lee@homemail.example', 'Thanksgiving plans', 'Are you flying in Wednesday or Thursday? Your aunt wants to know about the guest room.', 'Oct 3'),
    row('Tidewater Coffee', 'receipts@tidewatercoffee.example', 'Your receipt from Tidewater Coffee', 'Order #3318: oat latte, almond croissant. Total $9.40. Thanks for stopping by.', 'Oct 2'),
    row('Founder Digest', 'issue@founderdigest.example', '7 pricing mistakes we see every week', 'This issue: why annual plans win, when to raise prices, and a teardown of three pricing pages.', 'Oct 1'),
  ];
  const SENT_OLDER = [
    row('To: Priya Nair', 'priya.nair@quillnote.app', 'Re: Q4 planning doc', 'Looks good. One question on the events line, can we talk Thursday?', 'Oct 16'),
    row('To: Maya Chen', 'maya@quillnote.app', 'Re: Onboarding checklist for new signups', 'Moved two questions up and cut the last step. Ready to ship.', 'Oct 15'),
    row('To: Dan Okafor', 'dan.okafor@quillnote.app', 'Re: Designer candidates', 'Let us do final calls on Monday. I will send times.', 'Oct 14'),
    row('To: Elena Park', 'elena@quillnote.app', 'Re: Podcast invite', 'Yes to Nov 12, please confirm with them.', 'Oct 13'),
    row('To: Mom', 'mom.lee@homemail.example', 'Re: Thanksgiving plans', 'Flying in Wednesday night, landing around 9. Guest room is perfect.', 'Oct 12'),
    row('To: Sofia Ramos', 'sofia@pinecrest.example', 'Re: Intro', 'Tuesday works. Sending an invite for 30 minutes.', 'Oct 10'),
    row('To: Bay Utilities', 'billing@bayutilities.example', 'Closing my account at 1428 Elm St', 'I moved out on Sept 30. Please close the account and send the final bill to this address.', 'Sep 29'),
    row('To: Rivera Moving Co.', 'hello@riveramoving.example', 'Re: Moving day Sept 30', 'Confirmed for 8 AM. The elevator is reserved until noon.', 'Sep 27'),
    row('To: Westlake Property', 'tenants@westlakepm.com', 'Forwarding address', 'My forwarding address after Sept 30 is 77 Oak Grove Ave, Apt 2, Oakland, CA 94610.', 'Sep 25'),
    row('To: Lena Fischer', 'lena@orbitlabs.example', 'Re: Integration questions', 'Our API docs are linked below. Happy to walk you through them.', 'Sep 24'),
  ];
  const inbox = (n) => ({ view: '#inbox', title: n ? `Inbox (${n}) - ${account.email} - Gmail` : `Inbox - ${account.email} - Gmail`, navCounts: n ? { inbox: String(n) } : {}, search: '' });
  // Gmail opens its Sent label as the search in:sent, with that search's chips
  const sent = { view: '#sent', title: `Sent Mail - ${account.email} - Gmail`, navCounts: {}, search: 'in:sent' };
  const search = (q) => ({ view: '#search/is%3Aread', title: `Search results - ${account.email} - Gmail`, navCounts: {}, search: q });
  const rowTargets = (names) => Object.fromEntries(Object.entries(names).map(([k, i]) => [k, { row: i }]));

  // the sponsors chat's 46 channels (the six of its YouTube search first), each written to at 9:00 AM on Oct 18
  const CHANNELS = ['Desk Setup Daily', 'Calm Code', 'Tidy Tabs', 'Focus Friday', 'Workflow Weekly', 'Keyboard & Coffee', 'Deep Work Diaries', 'Tab Hoarders',
    'Remote Ready', 'Sprint & Sip', 'The Calendar Fix', 'Quiet Hours', 'Meeting Detox', 'Second Brain Lab', 'Ship It Sundays', 'Focus Mode Daily', 'Cozy Desk Club',
    'Plain Text Life', 'App Stack Weekly', 'Workday Wins', 'Small Team Tools', 'Kanban Corner', 'The Weekly Review', 'Hustle Free', 'Notes & Nodes', 'Startup Desk',
    'Minimal Mornings', 'Desk Notes', 'Tech Calmly', 'Better Standups', 'Open Tabs Show', 'Founder Workflow', 'Daily Planner TV', 'Flow State Lab', 'Remote Rituals',
    'Tool Tuesday', 'Lo-fi Productivity', 'Builders Desk', 'The Note Taker', 'Clear Calendar', 'Zero Inbox Club', 'Work Smarter Co', 'Async Hours', 'The Focus Desk',
    'Inbox Calm', 'Paper & Pixels'];
  const slug = (c) => c.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
  const pitch = (c, date) => row(`To: ${c}`, `hello@${slug(c)}.example`, `Quillnote x ${c}`,
    c === 'Desk Setup Daily'
      ? 'Hi Desk Setup Daily team, I just watched your latest video, "I Rebuilt My Desk for Focus (Under $300)", and the way you test each tool before it earns a spot is exactly why I am writing.'
      : `Hi ${c} team, I just watched your latest video, and the way you review tools for small teams is exactly why I am writing. I would love to sponsor a paid integration.`, date);
  // the 21 who had not replied by Oct 20, followed up once
  const QUIET = CHANNELS.filter((c, i) => i >= 6 && i % 2 === 0).slice(0, 21);
  const followUp = (c) => row(`To: ${c}`, `hello@${slug(c)}.example`, `Re: Quillnote x ${c}`, `Hi ${c} team, just bumping this in case it got buried. Happy to send a test account and our rate card.`, '9:00 AM');
  const briefRow = row('To: Desk Setup Daily', 'hello@desksetupdaily.com', 'Re: Paid sponsorship for Quillnote', 'Great, Oct 28 works. Here is the brief, your tracking link quillnote.app/r/desksetup and a 20% off code for your viewers, DESK20.', 'Oct 19', { count: 3 });
  const deskYes = row('Desk Setup Daily', 'hello@desksetupdaily.com', 'Re: Paid sponsorship for Quillnote', "Hey Jordan, we'd love to. A 60-second integration works for us at $900, and Oct 28 is open for the live date.", '4:12 PM', { ...unread, count: 2 });

  // Uber Eats receipts for the lunch chat's Fridays
  const uber = (place, dish, time, total, date) => row('Uber Eats', 'noreply@uber.example', 'Your Friday lunch order with Uber Eats', `Delivered at ${time}. ${place}: ${dish}. Total ${total}. Rate your order.`, date);

  // the bike chat's five sellers, through Craigslist's relay addresses
  const relay = ['b7e31f9a2c5d4e8f', '4c2a9e17d0b6f3a5', 'e91f0c6a8d2b47c3', '6d3b8a0f5e1c92a7', 'a05c7e2d9f4b16e8'];
  const ASKED = [
    ['Aluminum road bike 56cm - new chain and tires', 540],
    ['56cm carbon road bike, Shimano 105, clean', 590],
    ['Aluminum endurance road bike 56cm, 2x9 Tiagra', 575],
    ['Road bike, 56cm, aluminum frame, new bar tape', 495],
    ['Carbon road bike 56cm, Sora groupset, light use', 565],
  ];
  const ask = ([title, price], i) => row(`To: ${relay[i]}`, `${relay[i]}@sale.craigslist.org`, `${title} - $${price}`, 'Hi, is this still available? About how many miles are on it, and any wear on the chain or cassette? I can pick up this week near Oakland. Thanks, Jordan', '10:14 AM');

  const STATES = {
    // "Checked when you last used each one": the apps' own mail about when Jordan last used them
    'subscriptions/activity': {
      ...search('we miss you OR last watched OR last used OR streak'),
      rows: [
        row('Waveline Music', 'hello@waveline.example', 'Your week in music: 9 hours', 'You played 214 songs this week. Your top playlist: Focus Flow.', 'Oct 19'),
        row('Daybreak News', 'accounts@daybreaknews.example', 'You read 23 stories this week', 'Your reading streak is at 31 days. Here is what readers like you saved.', 'Oct 18'),
        row('Stillwater', 'hello@stillwater.example', '18 days in a row', 'You meditated 18 days in a row. Keep the streak going with a 5-minute session.', 'Oct 17'),
        row('StreamBox', 'hello@streambox.example', 'We miss you, Jordan', "You haven't watched anything since Jun 28. Here's what's new on StreamBox Premium this month.", 'Oct 14'),
        row('Reelhouse', 'hello@reelhouse.example', 'Your watchlist is waiting', "It's been 4 months since you last watched. 12 titles on your list are new this month.", 'Oct 10'),
        row('FreshCrate', 'orders@freshcrate.example', 'We picked your meals again', "You haven't chosen meals since Jun 12, so we picked this week's for you.", 'Oct 5'),
        row('CloudVault', 'alerts@cloudvault.example', "Your backup hasn't run in 112 days", 'No device has backed up to your 2 TB plan since Jun 30. Your plan renews Nov 3.', 'Oct 3'),
        row('Ironworks Gym', 'members@ironworksgym.example', "We haven't seen you since Aug 14", 'Your membership is still active at $39 a month. Book a class or pause your membership in the app.', 'Oct 1'),
      ],
      targets: rowTargets({ waveline: 0, streambox: 3, reelhouse: 4, freshcrate: 5, cloudvault: 6, gym: 7 }),
    },
    // "A second date was announced"
    'tickets/announce': {
      ...inbox(1),
      rows: [row('Riverside Arena', 'news@riversidearena.example', 'Just announced: Neon Harbor adds a second Portland show', 'Due to demand, Neon Harbor plays Riverside Arena again on Sun, Nov 15. Tickets go on sale Friday at 10 AM.', '7:42 AM', unread), ...OLDER],
      targets: rowTargets({ announce: 0 }),
    },
    // "Bought them with your saved card": the order's confirmation
    'tickets/order': {
      ...inbox(1),
      rows: [
        row('Vivid Seats', 'orders@vividseats.example', 'Order confirmed: Neon Harbor, Sat, Nov 14', 'Order #VS-48213907. Section 108, Row K, seats 11 and 12. 2 tickets, $284.00 total, paid with Visa ending 4417.', '9:18 AM', unread),
        row('Riverside Arena', 'news@riversidearena.example', 'Just announced: Neon Harbor adds a second Portland show', 'Due to demand, Neon Harbor plays Riverside Arena again on Sun, Nov 15. Tickets go on sale Friday at 10 AM.', 'Oct 20'),
        ...OLDER,
      ],
      targets: rowTargets({ order: 0 }),
    },
    // "Sent them from your Gmail": the 46 pitches
    'sponsors/sent': { ...sent, rows: CHANNELS.map((c) => pitch(c, '9:00 AM')), total: '46', targets: rowTargets({ first: 0, sixth: 5 }) },
    // "Desk Setup Daily said yes at $900": the first reply, the others still to come
    'sponsors/inbox-desk': { ...inbox(1), rows: [deskYes, ...OLDER.slice(0, 2), row('Maya Chen', 'maya@quillnote.app', 'Quillnote launch: press kit', 'Logo files, screenshots and the founder bio are in the shared folder.', 'Oct 17'), ...OLDER.slice(3)], targets: rowTargets({ 'desk-setup': 0 }) },
    // "Sent the brief and tracking link"
    'sponsors/sent-brief': { ...sent, rows: [{ ...briefRow, date: '4:30 PM' }, ...CHANNELS.map((c) => pitch(c, 'Oct 18'))], total: '47', targets: rowTargets({ brief: 0 }) },
    // "Followed up with 21 who hadn't replied"
    'sponsors/sent-followup': { ...sent, rows: [...QUIET.map(followUp), briefRow, ...CHANNELS.map((c) => pitch(c, 'Oct 18'))], total: '68', targets: rowTargets({ first: 0, sixth: 5, last: 12 }) },
    // "Delivered at 11:58" and "Delivered at 12:03"
    'lunch/receipt-menya': { ...inbox(1), rows: [{ ...uber('Menya Sora', 'Spicy miso ramen', '11:58 AM', '$19.80', '11:58 AM'), unread: true }, ...OLDER.slice(4)], targets: rowTargets({ receipt: 0 }) },
    'lunch/receipt-esquina': { ...inbox(1), rows: [{ ...uber('La Esquina', 'Tacos al pastor, three', '12:03 PM', '$16.50', '12:03 PM'), unread: true }, uber('Menya Sora', 'Spicy miso ramen', '11:58 AM', '$19.80', 'Oct 2'), ...OLDER.slice(5)], targets: rowTargets({ receipt: 0 }) },
    // "Booked the nonstop for $612": the airline's e-ticket
    'flights/eticket': {
      ...inbox(1),
      rows: [row('Japan Airlines', 'eticket@jal.example', 'Your e-ticket receipt: San Francisco to Tokyo (Narita)', 'Booking reference K7QX4M. Nonstop Mar 8, 11:35 AM, back Mar 22. Seat 34A, 1 checked bag. Total $612.00.', '2:14 PM', unread), ...OLDER],
      targets: rowTargets({ eticket: 0 }),
    },
    // "Replied to 6 scheduling emails": the six replies in Sent Mail
    'inbox/sent-replies': {
      ...sent,
      rows: [
        row('To: Diego Alvarez', 'diego.alvarez@mailbox.example', 'Re: Rescheduling our interview slot', 'Thursday at 3 PM works. Same link as before, talk then.', '8:04 AM'),
        row('To: Lena Fischer', 'lena@orbitlabs.example', 'Re: Intro call next week?', 'Tuesday at 3 PM works. I sent an invite with a video link.', '8:03 AM'),
        row('To: Owen Park', 'owen.park@tallmast.example', 'Re: Can we do Wednesday at 10 instead?', 'Wednesday at 10 is fine. I updated the invite.', '8:03 AM'),
        row('To: Nadia Rahman', 'nadia.rahman@quillnote.app', 'Re: Reschedule our 1:1 to Friday?', 'Friday at 9:30 works for me. Moved it on the calendar.', '8:03 AM'),
        row('To: Theo Brandt', 'theo@northgate.example', 'Re: Does Tuesday at 2 work for the demo?', 'Tuesday at 2 PM Pacific works. Bring the whole team, the invite has room for five.', '8:02 AM'),
        row('To: Maya Chen', 'maya.chen@lumenworks.example', "Re: Can we move Thursday's call?", 'Friday at 10 works. I moved the invite, see you then.', '8:02 AM'),
        ...SENT_OLDER,
      ],
      targets: rowTargets({ reply1: 0, reply6: 5 }),
    },
    // "Asked 5 sellers about mileage", through Craigslist's reply relay
    'bike/sent-asks': { ...sent, rows: [...ASKED.map(ask).reverse(), ...SENT_OLDER], targets: rowTargets({ ask1: 0, ask5: 4 }) },
    // "Seller agreed to $480"
    'bike/agreed': {
      ...inbox(3),
      rows: [
        row('Eli M.', `${relay[0]}@sale.craigslist.org`, 'Re: Aluminum road bike 56cm - new chain and tires - $540', '$480 works for me. About 1,500 miles on it, and the chain and tires are new. Saturday at 10 AM on College Ave in Rockridge?', '2:36 PM', { ...unread, count: 4 }),
        row('Craigslist seller', `${relay[1]}@sale.craigslist.org`, 'Re: 56cm carbon road bike, Shimano 105, clean - $590', 'Firm at $590. Around 4,000 miles, it was serviced in August.', '1:10 PM', unread),
        row('Craigslist seller', `${relay[2]}@sale.craigslist.org`, 'Re: Aluminum endurance road bike 56cm, 2x9 Tiagra - $575', 'Sorry, it sold this morning.', '12:22 PM', unread),
        ...OLDER.slice(2),
      ],
      targets: rowTargets({ agreed: 0 }),
    },
    // "Sent you the plan, day by day": the plan, over every booking's confirmation
    'lisbon/plan': {
      ...inbox(5),
      rows: [
        row('me', account.email, 'Your Lisbon plan, Nov 20 to 23, day by day', 'Fri: check in at Casa do Chiado Hotel, dinner at Taberna do Largo at 8. Sat: Alfama and Belém, Casa das Gaivotas at 8:30. Sun: Sintra, train 8:01 AM from Rossio.', '6:20 PM', unread),
        row('CP - Comboios de Portugal', 'bilheteira@cp.example', 'Your ticket: Lisboa Rossio > Sintra, Sun, Nov 22', 'Departs Lisboa Rossio 08:01, arrives Sintra 08:41. 2nd Class, 2 passengers, 10.20 EUR.', '6:12 PM', unread),
        row('Casa das Gaivotas', 'reservations@sevenrooms.example', 'Reservation confirmed: Sat, Nov 21 at 8:30 PM', 'Party of 2 at Casa das Gaivotas, Rua da Atalaia 48. Reply to this email to change your reservation.', '6:05 PM', unread),
        row('Taberna do Largo', 'reservations@sevenrooms.example', 'Reservation confirmed: Fri, Nov 20 at 8:00 PM', 'Party of 2 at Taberna do Largo, Rua da Misericórdia 54. Reply to this email to change your reservation.', '6:04 PM', unread),
        row('Expedia', 'travel@expedia.example', 'Booking confirmed: Casa do Chiado Hotel, Nov 20 to 23', 'Itinerary 7284 1093 5521. 3 nights, 2 adults. Total $612.00. Free cancellation until Nov 17.', '5:58 PM', unread),
        ...OLDER.slice(0, 6),
      ],
      targets: rowTargets({ plan: 0, train: 1, dinner2: 2, dinner1: 3, hotel: 4 }),
    },
    // "Emailed it to your landlord"
    'deposit/sent': {
      ...sent,
      rows: [row('To: Westlake Property', 'tenants@westlakepm.com', 'Return of my security deposit, 1428 Elm St, Apt 3', 'Dear Westlake Property Management, I moved out of 1428 Elm St, Apt 3 on September 30 and left the unit clean. 24 move-out photos attached.', '10:12 AM'), ...SENT_OLDER.slice(0, 2), ...SENT_OLDER.slice(5)],
      targets: rowTargets({ request: 0 }),
    },
  };
  // the inbox chat's Tuesday and Wednesday: the night's mail, all of it ticked, then archived (inbox-zero is its own page)
  const night = (n, day) => ({
    ...inbox(n),
    // Gmail pages 50 at a time: "1-50 of 79" over the night's mail
    total: String(n), shown: '50',
    rows: [
      row('The Daily Brief', 'hello@dailybrief.example', `Your ${day} briefing: rates, a recall and the day ahead`, 'Good morning. Here is what to know before the day begins, in five minutes.', '7:58 AM', unread),
      row('Hail Rides', 'receipts@hailrides.example', `Your ${day === 'Tuesday' ? 'Monday' : 'Tuesday'} evening trip with Hail`, 'Thanks for riding, Jordan. Total $16.80, charged to your card ending 4417.', '7:41 AM', unread),
      row('Priya Nair', 'priya.nair@quillnote.app', 'Board pre-read: last numbers?', 'Can you send the October signups before 11? I will drop them into slide 4.', '7:36 AM', unread),
      row('Launchpad Weekly', 'weekly@launchpad.example', 'The 12 best launches of the week', 'From a calendar that plans your focus time to a notes app that writes back.', '7:22 AM', unread),
      row('Theo Brandt', 'theo@northgate.example', 'Thanks for the demo invite', 'Got it, see you Tuesday. Two more people from our team will join.', '7:10 AM', unread),
      row('Northwind Cloud', 'billing@northwindcloud.example', 'Your usage alert: 80% of budget', 'Your project has used 80% of its monthly budget. Review your usage in the console.', '6:55 AM', unread),
      row('Founder Digest', 'issue@founderdigest.example', 'The onboarding email nobody reads', 'Why the welcome email fails, and the three-line one that gets replies.', '6:40 AM', unread),
      row('Maple Grocery', 'receipts@maplegrocery.example', 'Your order receipt: 9 items', 'Thanks for shopping with Maple. Your total was $41.06. Rate your shopper.', '6:21 AM', unread),
      row('Marcus Webb', 'marcus.webb@fernhill.example', 'Re: Quillnote for 40 seats?', 'Finance approved annual billing. Can you send the order form today?', '6:05 AM', unread),
      row('Design Tidbits', 'issue@designtidbits.example', 'Issue 215: empty states that help', 'Six empty states worth copying, and the one rule behind all of them.', '5:47 AM', unread),
      row('Skyline Parking', 'receipts@skylineparking.example', 'Your parking receipt', 'Garage 7, 3 hours, $21.00. Thanks for parking with Skyline.', '5:30 AM', unread),
      row('Money Notes', 'editor@moneynotes.example', 'Three accounts worth opening this month', 'High-yield savings, a no-fee brokerage and a card with no foreign fees.', '5:02 AM', unread),
      row('Owen Park', 'owen.park@tallmast.example', 'Thanks, Wednesday at 10 it is', 'Appreciate the quick reply. Talk then.', '4:44 AM', unread),
      row('Slateboard', 'news@slateboard.example', 'Your team used 14 boards last week', 'Here is a recap of what your team made, and two templates you might like.', '3:51 AM', unread),
      row('Weekend Reads', 'reads@weekendreads.example', 'Seven long reads for your commute', 'Stories worth your time, each under ten minutes.', '2:12 AM', unread),
      row('CityFiber', 'payments@cityfiber.example', 'Autopay receipt', 'We received your payment of $65.00. Thank you for being a customer.', '1:03 AM', unread),
      row('Indie Makers Daily', 'daily@indiemakers.example', 'How one founder priced a niche tool', 'Plus: a pricing page teardown and a template you can copy.', '12:30 AM', unread),
    ],
    targets: { 'select-all': { sel: '[gh="mtb"] span[role=checkbox]' }, archive: { sel: '[gh="mtb"] [aria-label="Archive"], [gh="mtb"] [data-tooltip="Archive"]' } },
  });
  STATES['inbox/inbox-79'] = night(79, 'Tuesday');
  STATES['inbox/inbox-92'] = night(92, 'Wednesday');
  window.PLAY_MAIL = (id) => {
    const s = STATES[id];
    if (!s) throw new Error(`no Gmail state named ${id}`);
    return { account, storage: '6%', newIn: {}, total: String(s.rows.length), ...s };
  };
  window.PLAY_MAIL_IDS = Object.keys(STATES);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = () => [...document.querySelectorAll('tr.zA')].filter((r) => r.offsetParent !== null);
  const centre = (el) => { const b = el.getBoundingClientRect(); return [+(b.x + b.width / 2).toFixed(1), +(b.y + b.height / 2).toFixed(1)]; };
  window.__mail = async (id, { select = false } = {}) => {
    const P = window.PLAY_MAIL(id);
    if (location.hash !== P.view) location.hash = P.view;
    const t0 = Date.now();
    await sleep(1200);
    while (visible().length < Math.min(P.rows.length, 10) && Date.now() - t0 < 12000) await sleep(250);
    await sleep(400);
    // Gmail keeps a view's list when it is opened again, rows an earlier staging removed included: its own last row is
    // cloned until the list has the rows that fit on screen, and stage-gmail restages every one
    const need = Math.min(P.rows.length, 18);
    while (visible().length && visible().length < need) { const last = visible().at(-1); last.after(last.cloneNode(true)); }
    window.STAGE = P;
    const src = window.__sgSrc.replace("const rows = [...document.querySelectorAll('tr.zA')];", "const rows = [...document.querySelectorAll('tr.zA')].filter((r) => r.offsetParent !== null);");
    if (src === window.__sgSrc) throw new Error('stage-gmail rows line not found');
    const staged = (0, eval)(src);
    if (P.shown) { const ts = [...document.querySelectorAll('.Dj')].find((p) => p.offsetParent)?.querySelectorAll('.ts'); if (ts?.length === 3) ts[1].textContent = P.shown; }
    // Gmail's own pop-ups (desktop notifications, tips) are not part of the state
    for (const n of document.querySelectorAll('[role=alertdialog], [role=dialog]')) if (n.offsetParent && !n.querySelector('tr.zA')) n.style.display = 'none';
    if (select) {
      // its banner counts the real mailbox: the chat's count instead
      // Gmail's own local selection: its select-all box, pressed as a person would (never a toolbar action)
      const box = [...document.querySelectorAll('[gh="mtb"] span[role=checkbox]')].find((b) => b.offsetParent);
      for (const type of ['mousedown', 'mouseup', 'click']) box.dispatchEvent(new MouseEvent(type, { bubbles: true, view: window }));
      await sleep(500);
      for (const host of [...document.querySelectorAll('span, div')].filter((e) => e.offsetParent && /Select all/.test(e.textContent) && /conversations/.test(e.textContent) && e.textContent.length < 160)) {
        const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
        while (walk.nextNode()) { const t = walk.currentNode; if (/\d{1,3}(,\d{3})+/.test(t.data)) t.data = t.data.replace(/\d{1,3}(,\d{3})+/, P.total); }
      }
    }
    document.activeElement?.blur();
    const rows = visible();
    const targets = {};
    for (const [name, spec] of Object.entries(P.targets ?? {})) {
      if (spec.row !== undefined) {
        const r = rows[spec.row];
        if (!r) { targets[name] = null; continue; }
        const [, y] = centre(r);
        const [x] = centre(r.querySelector('span.bog') ?? r);
        targets[name] = [x, y];
      } else {
        const el = [...document.querySelectorAll(spec.sel)].find((e) => e.offsetParent);
        targets[name] = el ? centre(el) : null;
      }
    }
    return { id, staged, rows: rows.length, targets, title: document.title };
  };
})();
