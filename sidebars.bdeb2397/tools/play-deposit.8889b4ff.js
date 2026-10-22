// Stage scripts for the deposit chat's Gmail pages (plays/deposit/pages.json), run in a signed-in Gmail tab opened for the
// capture (browser-control). Nothing is sent, saved, uploaded, archived or changed; a reload undoes all of it.
//
// Viewport 1470x837 at 2x (cdp Emulation.setDeviceMetricsOverride), Page.captureScreenshot, cwebp -q 80. For each page:
// load a clean tab (location.reload), set window.STAGE = STAGES.<name>, then run stage-gmail.bdeb2397.js with ONE change:
// its `rows` are the VISIBLE tr.zA only (`[...document.querySelectorAll('tr.zA')].filter((r) => r.offsetParent !== null)`),
// because a search or a reloaded view keeps other lists' hidden rows in the page. Its answer must show identityLeft 0.
// Remove Gmail's "Enable desktop notifications" toast if it shows. Targets: getBoundingClientRect on the tr.zA row.
//  search:     open #search/security+deposit first (a search only reads), then stage.
//  inbox-paid: STAGES.paid on #inbox.
//  compose:    STAGES.inbox on #inbox, then cdp Network.emulateNetworkConditions {offline:true} BEFORE anything else, so that
//              Gmail cannot save, upload or send. Click Compose (mousedown/mouseup/click on .T-I.T-I-KE.L3); the window may
//              open expanded or minimized: if it is the "New Message" bar, click it (a real cdp Input.dispatchMouseEvent
//              does not always register, a dispatched pointer+mouse event sequence on the bar does). Focus
//              input[aria-label="To recipients"], set its value to the address, press Enter (cdp Input.dispatchKeyEvent) so
//              Gmail makes the chip itself. COMPOSE() sets subject and body; ATTACH() is run after one local file was picked
//              in the window's own input[name=Filedata] (cdp DOM.setFileInputFiles with the node's objectId; offline, so
//              Gmail shows its chip as failed). Then CLEAN(). Capture. Click the window's own "Discard draft" button, go
//              online, reload, check Drafts is as before (18, no new draft). Never press Send.
window.STAGES = {
  inbox: {
    title: 'Inbox (1) - jordan@quillnote.app - Gmail',
    account: { name: 'Jordan Lee', email: 'jordan@quillnote.app', initial: 'J' },
    total: '1,106', storage: '6%', search: '', navCounts: { inbox: '1' },
    rows: [
      { from: 'Bay Federal Credit Union', email: 'alerts@bayfederal.example', subject: 'Your September statement is ready', snippet: 'Your checking statement for September is ready to view in online banking.', date: 'Oct 7', unread: true },
      { from: 'Maya Chen', email: 'maya@quillnote.app', subject: 'Onboarding checklist for new signups', snippet: 'Can you look over the draft before Thursday? I moved the pricing questions to the end.', date: 'Oct 6' },
      { from: 'Rivera Moving Co.', email: 'hello@riveramoving.example', subject: 'Receipt for your Sept 30 move', snippet: 'Thank you for choosing Rivera Moving. Your receipt for 2 movers and 3 hours is attached.', date: 'Oct 2' },
      { from: 'Bay Utilities', email: 'billing@bayutilities.example', subject: 'Your final bill for 1428 Elm St, Apt 3', snippet: 'Your account is closed. The final balance of $41.18 was paid with your card on file.', date: 'Oct 1' },
      { from: 'Westlake Property', email: 'tenants@westlakepm.com', subject: 'Move-out inspection, Sept 30', snippet: 'Thanks for walking the unit with us. We will follow up about the deposit.', date: 'Sep 30' },
      { from: 'Westlake Property', email: 'tenants@westlakepm.com', subject: 'Your lease end and move-out checklist', snippet: 'Keys, garage remote and forwarding address are due by Sept 30 at 5 PM.', date: 'Sep 2' },
    ],
  },
  search: {
    title: 'Search results - jordan@quillnote.app - Gmail',
    account: { name: 'Jordan Lee', email: 'jordan@quillnote.app', initial: 'J' },
    total: '6', storage: '6%', search: 'security deposit', navCounts: {},
    rows: [
      { from: 'Westlake Property', email: 'tenants@westlakepm.com', subject: 'Re: Return of my security deposit, 1428 Elm St, Apt 3', snippet: 'Jordan, we sent the full $1,800 by bank transfer this morning. Apologies for the delay.', date: 'Oct 16', unread: true, count: 3 },
      { from: 'Bay Federal Credit Union', email: 'alerts@bayfederal.example', subject: 'Deposit received: $1,800.00', snippet: 'A transfer of $1,800.00 from WESTLAKE PROPERTY MGMT was deposited to your checking account.', date: 'Oct 16', unread: true },
      { from: 'Certified Mail Tracking', email: 'tracking@certifiedmail.example', subject: 'Delivered: your certified letter to Westlake Property', snippet: 'Your item was delivered and signed for at 11:42 AM on October 10 in the leasing office.', date: 'Oct 10' },
      { from: 'me', email: 'jordan@quillnote.app', subject: 'Return of my security deposit, 1428 Elm St, Apt 3', snippet: 'I moved out on September 30 and left the unit clean. Under California law you must return my deposit within 21 days.', date: 'Oct 8' },
      { from: 'Westlake Property', email: 'tenants@westlakepm.com', subject: 'Move-out inspection, Sept 30', snippet: 'Thanks for walking the unit with us. We will follow up about the deposit.', date: 'Sep 30' },
      { from: 'Westlake Property', email: 'tenants@westlakepm.com', subject: 'Your lease end and move-out checklist', snippet: 'Keys, garage remote and forwarding address are due by Sept 30 at 5 PM.', date: 'Sep 2' },
    ],
  },
  paid: {
    title: 'Inbox (2) - jordan@quillnote.app - Gmail',
    account: { name: 'Jordan Lee', email: 'jordan@quillnote.app', initial: 'J' },
    total: '1,108', storage: '6%', search: '', navCounts: { inbox: '2' },
    rows: [
      { from: 'Bay Federal Credit Union', email: 'alerts@bayfederal.example', subject: 'Deposit received: $1,800.00', snippet: 'A transfer of $1,800.00 from WESTLAKE PROPERTY MGMT was deposited to your checking account.', date: 'Oct 16', unread: true },
      { from: 'Westlake Property', email: 'tenants@westlakepm.com', subject: 'Re: Return of my security deposit, 1428 Elm St, Apt 3', snippet: 'Jordan, we sent the full $1,800 by bank transfer this morning. Apologies for the delay.', date: 'Oct 16', unread: true, count: 3 },
      { from: 'Maya Chen', email: 'maya@quillnote.app', subject: 'Onboarding checklist for new signups', snippet: 'Can you look over the draft before Thursday? I moved the pricing questions to the end.', date: 'Oct 14' },
      { from: 'Certified Mail Tracking', email: 'tracking@certifiedmail.example', subject: 'Delivered: your certified letter to Westlake Property', snippet: 'Your item was delivered and signed for at 11:42 AM on October 10 in the leasing office.', date: 'Oct 10' },
      { from: 'Bay Federal Credit Union', email: 'alerts@bayfederal.example', subject: 'Your September statement is ready', snippet: 'Your checking statement for September is ready to view in online banking.', date: 'Oct 7' },
      { from: 'Rivera Moving Co.', email: 'hello@riveramoving.example', subject: 'Receipt for your Sept 30 move', snippet: 'Thank you for choosing Rivera Moving. Your receipt for 2 movers and 3 hours is attached.', date: 'Oct 2' },
    ],
  },
};

window.COMPOSE = () => {
  const d = document.querySelector('div[role=dialog]');
  const set = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.setAttribute('value', v); };
  const T = 'Return of my security deposit, 1428 Elm St, Apt 3';
  set(d.querySelector('input[name=subjectbox]'), T);
  const hs = d.querySelector('input[name=subject]'); if (hs) set(hs, T);
  const body = d.querySelector('div[aria-label="Message Body"][contenteditable]');
  const lines = ['Dear Westlake Property Management,', '', 'I moved out of 1428 Elm St, Apt 3 on September 30 and left the unit clean. I returned the keys and the garage remote at the move-out inspection that day, and I have attached 24 move-out photos that show the condition of every room.', '', 'Under California Civil Code section 1950.5, you must return my security deposit, or send an itemized statement of any deductions, within 21 days of move-out. That deadline is October 21. My deposit was $1,800, and I am requesting the full $1,800 back.', '', 'Please send it by bank transfer or check, and reply to confirm that you received this letter. I am also sending a copy by certified mail. If the full amount has not arrived by October 21, I will file a claim in small claims court.', '', 'Sincerely,', 'Jordan Lee', 'jordan@quillnote.app'];
  body.replaceChildren(...lines.map((l) => { const x = document.createElement('div'); if (l) x.textContent = l; else x.append(document.createElement('br')); return x; }));
};

// after one local file was picked in the compose's own attach input: Gmail's chip (failed, offline) becomes 24 chips
window.ATTACH = () => {
  const d = document.querySelector('div[role=dialog]');
  const unit = d.querySelector('.dL').parentElement.parentElement;
  const host = unit.parentElement;
  const sizes = ['2.4M', '3.1M', '2.8M', '3.6M', '2.2M', '4.1M', '3.3M', '2.9M', '3.8M', '2.6M', '3.0M', '4.4M', '2.5M', '3.4M', '2.7M', '3.9M', '2.3M', '3.2M', '4.0M', '2.1M', '3.5M', '2.8M', '3.7M', '3.0M'];
  const units = Array.from({ length: 24 }, (_, i) => {
    const u = i === 0 ? unit : unit.cloneNode(true);
    u.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
    const n = `moveout-${String(i + 1).padStart(2, '0')}.jpg`;
    const dl = u.querySelector('.dL');
    dl.setAttribute('aria-label', `Attachment: ${n}`);
    dl.querySelector('.vI').textContent = n;
    dl.querySelector('.vJ').textContent = `(${sizes[i]})`;
    dl.querySelectorAll('.dN, a.dU, span.dU:not(.vq)').forEach((x) => x.remove());
    return u;
  });
  const rest = [...host.children].filter((k) => !k.querySelector('.dL'));
  host.replaceChildren(...units, ...rest);
  // the editor's min-height was Gmail's for an empty window: let it follow its text so the chips come after the letter
  d.querySelector('div[aria-label="Message Body"][contenteditable]').style.minHeight = '0px';
  d.querySelector('.qz').scrollTop = 170;
  window.dispatchEvent(new Event('resize'));
};

window.CLEAN = () => {
  const S = window.STAGES.inbox;
  for (const e of document.querySelectorAll('div,span')) {
    if (e.children.length <= 4 && /^Not connected\./.test(e.textContent.trim()) && e.textContent.length < 60) {
      let n = e; while (n.parentElement && n.parentElement !== document.body && /Not connected/.test(n.parentElement.textContent) && n.parentElement.textContent.length < 60) n = n.parentElement;
      n.style.display = 'none';
    }
  }
  for (const n of document.querySelectorAll('.aim .bsU')) n.textContent = '';
  const inb = document.querySelector('.aim a[href$="#inbox"]')?.closest('.aim')?.querySelector('.bsU'); if (inb) inb.textContent = '1';
  for (const a of document.querySelectorAll('.aim a[aria-label]')) a.setAttribute('aria-label', a.getAttribute('aria-label').replace(/\s*\d+\s*unread/i, ''));
  document.title = S.title;
  document.activeElement.blur();
  const real = window.__real;
  const html = document.body.innerHTML + [...document.body.querySelectorAll('input,textarea')].map((i) => i.value).join('\n')
    + [...document.body.querySelectorAll('*')].flatMap((n) => [...n.attributes].map((a) => a.value)).join('\n') + document.body.innerText + document.title;
  return real.map((r) => html.split(r).length - 1);
};
