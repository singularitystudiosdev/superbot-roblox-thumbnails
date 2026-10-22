// "Keep my inbox at zero": the Gmail pages of the inbox chat's live computer view. Evaluate this in a signed-in Gmail inbox
// tab (browser-control evaluate, tab sized 1470x837 at 2x), then
//   window.STAGE = window.PLAY_INBOX('inbox-88'); <run stage-gmail.bdeb2397.js>
// (ids: inbox-88, inbox-selected [= inbox-88, then run PLAY_INBOX_SELECT() and press the real checkboxes], inbox-17,
// inbox-zero). Reload the tab between pages (Gmail's rows are the real ones to restage). Nothing is archived or sent.
// The 11 that need Jordan and the 6 scheduling emails are the same in every page; their dates are those of
// ../screens/inbox.webp.
// Run stage-gmail.bdeb2397.js as window.__sg = () => (<that IIFE>) with one change for search pages (where Gmail keeps hidden
// views' rows in the DOM): its `rows` is [...document.querySelectorAll('tr.zA')].filter((r) => r.offsetParent).
// Selecting rows (inbox-selected): for each visible newsletter/receipt row, dispatch mousedown, mouseup, click on its
// div[role=checkbox] (Gmail's own local selection; never press Archive). Targets are measured with getBoundingClientRect.
window.PLAY_INBOX = (id) => {
  const need = [
    ['Priya Nair', 'priya.nair@quillnote.app', 'Q4 budget: need your sign-off by Thursday', 'Two options attached. The second moves $8k from events to paid video. I need your pick before the board pre-read goes out.', '7:52 AM'],
    ['Legal at Brightline', 'legal@brightline.example', 'Reseller agreement, redlines back', 'We accepted most of your changes. Clause 9 (liability cap) still needs a decision from you before we can send the final copy.', '7:31 AM'],
    ['Dan Okafor', 'dan.okafor@quillnote.app', 'Designer candidates: final two', 'Both did great on the take-home. I lean toward Ines, but it is your call.', '7:05 AM', 4],
    ['Harbor Dental', 'frontdesk@harbordental.example', 'Your insurance needs updating before Nov 3', 'Please call us or reply with your new member ID so we can keep your cleaning on the books.', '6:48 AM'],
    ['Westlake Property', 'leasing@westlakeprop.example', 'Lease renewal options for unit 4B', 'A 12-month renewal at the current rate, or 18 months with one month free. Let us know which you prefer by Friday.', '6:12 AM'],
    ['Sofia Ramos', 'sofia@pinecrest.example', 'Intro: Sofia (Pinecrest Ventures) and you', 'Would love 30 minutes to hear how Quillnote is going. Next Tuesday or Wednesday?', '5:40 AM'],
    ['Mom', 'mom.lee@homemail.example', 'Thanksgiving plans', 'Are you flying in Wednesday or Thursday? Your aunt wants to know about the guest room.', '12:18 AM'],
    ['Stripe', 'notifications@stripe.example', 'Action needed: verify your business details', 'Payouts will pause on Nov 5 unless the business details for Quillnote are confirmed in your dashboard.', 'Oct 20'],
    ['Marcus Webb', 'marcus.webb@fernhill.example', 'Re: Quillnote for 40 seats?', 'Our team liked the trial. Can you do annual billing at the 40-seat tier? Need an answer for our finance review.', 'Oct 20', 3],
    ['City of Oakland', 'taxoffice@oaklandca.example', 'Business license renewal due', 'Your license expires Nov 30. Renew online or contact the business tax office.', 'Oct 20'],
    ['Elena Park', 'elena@quillnote.app', 'Podcast invite: Tools for Teams', 'They want you on Nov 12 at 2 PM. Should I say yes?', 'Oct 19'],
  ];
  const sched = [
    ['Maya Chen', 'maya.chen@lumenworks.example', "Can we move Thursday's call?", "Something came up on my side. Could we do Friday at 10 or 11 instead?", '7:38 AM'],
    ['Theo Brandt', 'theo@northgate.example', 'Does Tuesday at 2 work for the demo?', "We'd like to bring two more people from our team. Tuesday at 2 PM Pacific works best for us.", '6:57 AM'],
    ['Nadia Rahman', 'nadia.rahman@quillnote.app', 'Reschedule our 1:1 to Friday?', 'I have a conflict Thursday afternoon. Would Friday morning work for you?', '6:31 AM'],
    ['Owen Park', 'owen.park@tallmast.example', 'Can we do Wednesday at 10 instead?', 'Sorry for the late change, the original slot clashes with a customer call.', '4:47 AM'],
    ['Lena Fischer', 'lena@orbitlabs.example', 'Intro call next week?', "Happy to chat about the integration whenever is easiest. I'm free Monday through Wednesday afternoon.", 'Oct 20'],
    ['Diego Alvarez', 'diego.alvarez@mailbox.example', 'Rescheduling our interview slot', 'Could we shift to Thursday at 3 PM? Same video link as before.', 'Oct 20'],
  ];
  // newsletters and receipts (the 71 archived; 33 fit on the first page of 50)
  const junk = [
    ['The Daily Brief', 'hello@dailybrief.example', 'Your Monday briefing: markets, a merger and the week ahead', "Good morning. Here is what to know before the week begins, in five minutes.", '7:59 AM'],
    ['Tidewater Coffee', 'receipts@tidewatercoffee.example', 'Your receipt from Tidewater Coffee', 'Order #3318: oat latte, almond croissant. Total $9.40. Thanks for stopping by.', '7:47 AM'],
    ['Founder Digest', 'issue@founderdigest.example', '7 pricing mistakes we see every week', 'This issue: why annual plans win, when to raise prices, and a teardown of three pricing pages.', '7:33 AM'],
    ['Hail Rides', 'receipts@hailrides.example', 'Your Sunday evening trip with Hail', 'Thanks for riding, Jordan. Total $18.25, charged to your card ending 4417.', '7:26 AM'],
    ['Launchpad Weekly', 'weekly@launchpad.example', 'The 12 best launches of the week', 'From a calendar that plans your focus time to a notes app that writes back.', '7:15 AM'],
    ['Northwind Cloud', 'billing@northwindcloud.example', 'Invoice available: October usage', 'Your invoice for October is ready. Amount due: $42.80, charged automatically on Nov 1.', '7:02 AM'],
    ['Slateboard', 'news@slateboard.example', "What's new at Slateboard this month", 'New templates, faster boards, and a redesigned mobile app. See everything that shipped.', '6:44 AM'],
    ['Pixel & Co', 'orders@pixelandco.example', 'Receipt for your payment #4412', 'Thank you for your purchase. Reference 4412, $29.00 USD. This is not a bill.', '6:36 AM'],
    ['Money Notes', 'editor@moneynotes.example', 'Is your cash earning anything?', 'This week: high-yield accounts, I bonds, and what to do with a few thousand sitting idle.', '6:20 AM'],
    ['Maple Grocery', 'receipts@maplegrocery.example', 'Your order receipt: 14 items', 'Thanks for shopping with Maple. Your total was $63.17. Rate your shopper.', '6:03 AM'],
    ['Design Tidbits', 'issue@designtidbits.example', 'Issue 214: spacing that feels right', 'A short guide to padding, plus six interfaces worth studying this week.', '5:51 AM'],
    ['The Growth Letter', 'letter@growthletter.example', 'How 3 teams cut churn by a third', 'Retention is a product problem, not a support problem. Here is what they changed.', '5:15 AM'],
    ['Skyline Parking', 'receipts@skylineparking.example', 'Your parking receipt', 'Garage 7, 2 hours, $14.00. Thanks for parking with Skyline.', '4:20 AM'],
    ['Weekend Reads', 'reads@weekendreads.example', 'The best long reads you missed', 'Seven stories worth your Sunday, in under ten minutes each.', '3:48 AM'],
    ['Bright Utilities', 'billing@brightutilities.example', 'Your October bill is ready', 'Amount due $86.12 by Nov 6. View your usage on the customer portal.', '2:30 AM'],
    ['Indie Makers Daily', 'daily@indiemakers.example', "A solo founder's first 1,000 users", 'Plus: a template for your launch week email sequence.', '1:12 AM'],
    ['CityFiber', 'payments@cityfiber.example', 'Autopay receipt', 'We received your payment of $65.00. Thank you for being a customer.', '12:41 AM'],
    ['Frontend Focus', 'issue@frontendfocus.example', 'Issue 612: the week in web', 'Container queries in the wild, new bundler benchmarks, and a CSS trick worth stealing.', 'Oct 20'],
    ['Hail Rides', 'receipts@hailrides.example', 'Your Tuesday trip with Hail', 'Thanks for riding, Jordan. Total $12.60, charged to your card ending 4417.', 'Oct 20'],
    ['Slateboard', 'billing@slateboard.example', 'Your receipt from Slateboard', 'Team plan, 5 seats, $60.00. Your next invoice will be on Nov 20.', 'Oct 20'],
    ['Tidewater Coffee', 'news@tidewatercoffee.example', 'Pumpkin cold brew is back', 'Seasonal menu is live in every shop, plus double points through Sunday.', 'Oct 20'],
    ['Product Notes', 'notes@productnotes.example', 'The one metric your roadmap ignores', 'Time to first value, and how to measure it without a data team.', 'Oct 20'],
    ['Maple Grocery', 'offers@maplegrocery.example', 'Your weekly savings are inside', '40 deals picked from the items you buy most. Clip them before Sunday.', 'Oct 20'],
    ['Northwind Cloud', 'news@northwindcloud.example', 'New regions and lower egress prices', 'Three new regions are live, and data transfer out is now 20% cheaper.', 'Oct 20'],
    ['Launchpad Weekly', 'digest@launchpad.example', 'Weekend project: ship a tiny app', 'A step-by-step for going from idea to a live link in two days.', 'Oct 19'],
    ['Pixel & Co', 'news@pixelandco.example', 'Autumn sale: 20% off everything', 'Three days only. Free shipping on orders over $40.', 'Oct 19'],
    ['Skyline Parking', 'billing@skylineparking.example', 'Your monthly parking summary', 'You parked 6 times in September. Total $71.00.', 'Oct 19'],
    ['Money Notes', 'editor@moneynotes.example', 'What the rate cut means for you', 'A plain-English read on what changes for loans, savings and your card.', 'Oct 19'],
    ['Design Tidbits', 'issue@designtidbits.example', 'Issue 213: color you can live with', 'Palettes from six shipped products, and the contrast checks behind them.', 'Oct 19'],
    ['The Daily Brief', 'hello@dailybrief.example', 'Your Sunday edition: the week in review', 'The seven stories that mattered, and one that should have.', 'Oct 19'],
    ['Bright Utilities', 'news@brightutilities.example', 'Save on winter heating', 'Five small changes that lower the bill, and a rebate on smart thermostats.', 'Oct 19'],
    ['CityFiber', 'news@cityfiber.example', 'Faster internet is coming to your block', 'Upgrade to the 2 Gig plan at no extra cost until January.', 'Oct 19'],
    ['Founder Digest', 'issue@founderdigest.example', 'The hiring mistake that costs 6 months', 'Hiring for seniority when you need speed, and how to spot it in an interview.', 'Oct 18'],
  ];
  const toRow = (r, kind) => ({ from: r[0], email: r[1], subject: r[2], snippet: r[3], date: r[4], count: r[5], kind });
  const key = (d) => (/AM|PM/.test(d) ? 10000 + (parseInt(d, 10) % 12) * 60 + parseInt(d.split(':')[1], 10) + (/PM/.test(d) ? 720 : 0) : { 'Oct 20': 5000, 'Oct 19': 4000, 'Oct 18': 3000 }[d]);
  const all = [...need.map((r) => toRow(r, 'need')), ...sched.map((r) => toRow(r, 'sched')), ...junk.map((r) => toRow(r, 'junk'))];
  const sorted = (rows) => rows.map((r, i) => [r, i]).sort((a, b) => key(b[0].date) - key(a[0].date) || a[1] - b[1]).map((x) => x[0]);
  const account = { name: 'Jordan Lee', email: 'jordan@quillnote.app', initial: 'J' };
  const base = { account, storage: '6%', search: '', newIn: {} };
  if (id === 'inbox-88' || id === 'inbox-selected') {
    return { ...base, title: 'Inbox (88) - jordan@quillnote.app - Gmail', navCounts: { inbox: '88' }, total: '88', rows: sorted(all).slice(0, 50).map((r) => ({ ...r, unread: true, starred: false })) };
  }
  if (id === 'inbox-17') {
    return { ...base, title: 'Inbox (17) - jordan@quillnote.app - Gmail', navCounts: { inbox: '17' }, total: '17', rows: sorted(all.filter((r) => r.kind !== 'junk')).map((r) => ({ ...r, unread: true, starred: false })) };
  }
  // inbox-zero: the 11 starred, nothing unread (the state ../screens/inbox.webp shows)
  return { ...base, title: 'Inbox - jordan@quillnote.app - Gmail', navCounts: {}, total: '11', rows: sorted(all.filter((r) => r.kind === 'need')).map((r) => ({ ...r, unread: false, starred: true })) };
};
