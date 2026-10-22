// "Cancel the subscriptions I don't use": the Gmail search pages of the subscriptions chat's live computer view. Evaluate this
// in a signed-in Gmail tab (browser-control evaluate, tab sized 1470x837 at 2x) that has a search with at least 14 results
// open (e.g. #search/is%3Aread; Gmail's own search, read-only), then
//   window.STAGE = window.PLAY_SUBS('statements' | 'receipts' | 'results'); <run stage-gmail.bdeb2397.js>
// Go back to #inbox and to the search again between pages so Gmail redraws its rows. Nothing is opened, sent or changed.
// 'results' is the state ../screens/subscriptions.webp shows.
// Run stage-gmail.bdeb2397.js as window.__sg = () => (<that IIFE>) with one change for search pages (where Gmail keeps hidden
// views' rows in the DOM): its `rows` is [...document.querySelectorAll('tr.zA')].filter((r) => r.offsetParent).
// Selecting rows (inbox-selected): for each visible newsletter/receipt row, dispatch mousedown, mouseup, click on its
// div[role=checkbox] (Gmail's own local selection; never press Archive). Targets are measured with getBoundingClientRect.
window.PLAY_SUBS = (id) => {
  const H = ['Harbor Card Services', 'statements@harborcard.example'];
  const row = (from, email, subject, snippet, date, unread = false) => ({ from, email, subject, snippet, date, unread, starred: false });
  const account = { name: 'Jordan Lee', email: 'jordan@quillnote.app', initial: 'J' };
  const base = { account, storage: '6%', navCounts: {}, newIn: {}, title: 'Search results - jordan@quillnote.app - Gmail' };
  if (id === 'statements') {
    const rows = [
      row(...H, 'Your October statement is ready', 'Statement balance $2,184.36. 14 recurring charges this period. Payment due Nov 18.', 'Oct 15'),
      row('Harbor Card Alerts', 'alerts@harborcard.example', 'Alert: $15.49 charged at Reelhouse', 'A recurring charge of $15.49 posted to your card ending 4417 on Oct 12.', 'Oct 12'),
      row(...H, 'Payment received, thank you', 'We received your payment of $1,962.10 on Oct 12. Your available credit has been updated.', 'Oct 12'),
      row('Harbor Card Alerts', 'alerts@harborcard.example', 'Alert: $11.99 charged at StreamBox', 'A recurring charge of $11.99 posted to your card ending 4417 on Oct 6.', 'Oct 6'),
      row('Harbor Card Alerts', 'alerts@harborcard.example', 'Alert: $39.00 charged at Ironworks Gym', 'A recurring charge of $39.00 posted to your card ending 4417 on Oct 1.', 'Oct 1'),
      row(...H, 'Your September statement is ready', 'Statement balance $1,962.10. Payment due Oct 18.', 'Sep 15'),
      row(...H, 'Payment received, thank you', 'We received your payment of $1,741.55 on Sep 12. Your available credit has been updated.', 'Sep 12'),
      row(...H, 'Your August statement is ready', 'Statement balance $1,741.55. 14 recurring charges this period. Payment due Sep 18.', 'Aug 15'),
    ];
    return { ...base, rows, total: String(rows.length), search: 'from:Harbor Card Services statement' };
  }
  if (id === 'receipts') {
    const rows = [
      row('Reelhouse', 'billing@reelhouse.example', 'Your Reelhouse receipt', 'Standard plan, $15.49, billed Oct 12. Thanks for being a member.', 'Oct 12'),
      row('FreshCrate', 'orders@freshcrate.example', 'Your FreshCrate receipt', 'Meal kit subscription, 3 meals for 2: $26.99. Delivered Oct 9.', 'Oct 9'),
      row('Waveline Music', 'billing@waveline.example', 'Your Waveline receipt', 'Premium plan, $10.99 a month, renewed Oct 8. Enjoy the music.', 'Oct 8'),
      row('StreamBox', 'billing@streambox.example', 'Your StreamBox Premium receipt', '$11.99 for Oct 6 to Nov 6. Thanks for watching.', 'Oct 6'),
      row('Daybreak News', 'accounts@daybreaknews.example', 'Your Daybreak News subscription renewed', 'Digital access, $9.99 a month. Your next renewal is Nov 5.', 'Oct 5'),
      row('CloudVault', 'billing@cloudvault.example', 'Receipt: 2 TB backup plan', '$9.99 for Oct 3 to Nov 3. Thank you for choosing CloudVault.', 'Oct 3'),
      row('Stillwater', 'hello@stillwater.example', 'Your Stillwater renewal receipt', 'Monthly plan, $12.99. Your next renewal is Nov 2.', 'Oct 2'),
      row('Ironworks Gym', 'members@ironworksgym.example', 'Your membership: $39.00 billed Oct 1', 'Thanks for being a member. Your last check-in was Aug 14. Manage or pause your membership any time in the app.', 'Oct 1'),
      row('Reelhouse', 'billing@reelhouse.example', 'Your Reelhouse receipt', 'Standard plan, $15.49, billed Sep 12. Thanks for being a member.', 'Sep 12'),
      row('FreshCrate', 'orders@freshcrate.example', 'Your FreshCrate receipt', 'Meal kit subscription, 3 meals for 2: $26.99. Delivered Sep 9.', 'Sep 9'),
      row('Waveline Music', 'billing@waveline.example', 'Your Waveline receipt', 'Premium plan, $10.99 a month, renewed Sep 8. Enjoy the music.', 'Sep 8'),
      row('StreamBox', 'billing@streambox.example', 'Your StreamBox Premium receipt', '$11.99 for Sep 6 to Oct 6. Thanks for watching.', 'Sep 6'),
      row('CloudVault', 'billing@cloudvault.example', 'Receipt: 2 TB backup plan', '$9.99 for Sep 3 to Oct 3. Thank you for choosing CloudVault.', 'Sep 3'),
      row('Ironworks Gym', 'members@ironworksgym.example', 'Your membership: $39.00 billed Sep 1', 'Thanks for being a member. Your last check-in was Aug 14. Manage or pause your membership any time in the app.', 'Sep 1'),
    ];
    return { ...base, rows, total: String(rows.length), search: 'receipt OR renewal OR subscription' };
  }
  // results: the state ../screens/subscriptions.webp shows
  const rows = [
    row('Ironworks Gym', 'members@ironworksgym.example', 'Your membership: $39.00 billed Oct 1', 'Thanks for being a member. Your last check-in was Aug 14. Manage or pause your membership any time in the app.', '10:18 AM', true),
    row('CloudVault', 'billing@cloudvault.example', 'Your 2 TB backup plan has been cancelled', 'You will keep access until Nov 3. After that, files over the free 5 GB will be read-only.', '10:06 AM'),
    row('FreshCrate', 'orders@freshcrate.example', 'Your meal kit subscription is cancelled', 'No more boxes will ship. Your last delivery was Oct 9. We hope to cook with you again.', '10:02 AM'),
    row('Reelhouse', 'billing@reelhouse.example', "You've cancelled your Reelhouse membership", 'Your Standard plan ($15.49 a month) ends on Nov 12. You can restart any time.', '9:57 AM'),
    row('StreamBox', 'billing@streambox.example', 'Cancellation confirmed: StreamBox Premium', 'Your subscription ($11.99 a month) will not renew. Watch until Nov 6.', '9:55 AM'),
    row(...H, 'Your October statement is ready', 'Statement balance $2,184.36. 14 recurring charges this period. Payment due Nov 18.', 'Oct 15'),
    row(...H, 'Your September statement is ready', 'Statement balance $1,962.10. Payment due Oct 18.', 'Sep 15'),
  ];
  return { ...base, rows, total: String(rows.length), search: 'subscription OR membership OR statement newer_than:3m' };
};
