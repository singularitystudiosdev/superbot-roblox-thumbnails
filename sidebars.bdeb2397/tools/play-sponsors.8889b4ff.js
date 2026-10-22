// Stage scripts for the sponsors chat's Gmail pages (plays/sponsors/pages.gmail.json), run in a signed-in Gmail tab opened
// for the capture (browser-control). Nothing is sent, saved, archived or changed; a reload undoes all of it.
//
// How the two pages were taken (viewport 1470x837 at 2x: cdp Emulation.setDeviceMetricsOverride, then Page.captureScreenshot,
// cwebp -q 80):
//  1. inbox:   open https://mail.google.com/mail/u/0/#inbox, set window.STAGE = STAGES.inbox (below), then run
//              stage-gmail.bdeb2397.js (it reads STAGE; its answer must show identityLeft 0). Remove Gmail's "Enable desktop
//              notifications" toast if it shows (the site's own pop-up). Row targets are measured with
//              getBoundingClientRect on tr.zA.
//  2. compose: on the staged inbox: cdp Network.emulateNetworkConditions {offline:true} first, so that Gmail cannot save
//              anything while the compose is open. Click Compose (dispatch mousedown/mouseup/click on .T-I.T-I-KE.L3), click
//              the "New Message" bar if it opened minimized, focus input[aria-label="To recipients"], set its value, press
//              Enter (cdp Input.dispatchKeyEvent) so Gmail makes the recipient chip itself, then run COMPOSE below for the
//              subject and the body (DOM edits; nothing typed in the editor). Then CLEAN. Capture. Click the compose's own
//              "Discard draft" button, go back online, reload and check that Drafts is as it was (18 before and after).
//              Never press Send.
window.STAGES = {
  inbox: {
    title: 'Inbox (4) - jordan@quillnote.app - Gmail',
    account: { name: 'Jordan Lee', email: 'jordan@quillnote.app', initial: 'J' },
    total: '1,284', storage: '6%', search: '', navCounts: { inbox: '4' },
    rows: [
      { from: 'Desk Setup Daily', email: 'hello@desksetupdaily.com', subject: 'Re: Paid sponsorship for Quillnote', snippet: "Hey Jordan, we'd love to. A 60-second integration works for us at $900, and Oct 28 is open for the live date.", date: '10:42 AM', unread: true },
      { from: 'Calm Code', email: 'partners@calmcode.dev', subject: 'Re: Quillnote x Calm Code', snippet: 'Thanks for following up. A dedicated review on Nov 4 at $1,600 sounds right. Contract attached.', date: '9:15 AM', unread: true, count: 3 },
      { from: 'Tidy Tabs', email: 'tidytabs@gmail.com', subject: 'Re: Sponsoring a Tidy Tabs video', snippet: 'Happy to! We can do a 45-second mention on Nov 9 for $650.', date: '8:03 AM', unread: true },
      { from: 'Workflow Weekly', email: 'team@workflowweekly.co', subject: 'Re: Quillnote on Workflow Weekly?', snippet: "Could you send a rate card and a test account? We're booked until December but it could work.", date: '7:48 AM', unread: true },
      { from: 'Focus Friday', email: 'hi@focusfriday.tv', subject: 'Re: A Quillnote sponsorship', snippet: 'Not taking sponsors this quarter, but keep us in mind for the new year.', date: 'Oct 20' },
      { from: 'Desk Setup Daily', email: 'hello@desksetupdaily.com', subject: 'Signed: Quillnote sponsorship agreement', snippet: 'Signed and returned. Looking forward to the launch video.', date: 'Oct 20', starred: true },
      { from: 'Maya Chen', email: 'maya@quillnote.app', subject: 'Launch week numbers', snippet: '1,240 signups since Monday, 18% of them from YouTube so far.', date: 'Oct 19' },
      { from: 'Keyboard & Coffee', email: 'collab@keyboardandcoffee.com', subject: 'Re: Quillnote and Keyboard & Coffee', snippet: 'What does the integration need to cover? Happy to chat this week.', date: 'Oct 19' },
    ],
  },
};

// the compose window's subject and body, once the recipient chip exists
window.COMPOSE = () => {
  const d = document.querySelector('div[role=dialog]');
  const set = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.setAttribute('value', v); };
  const T = 'Quillnote x Desk Setup Daily';
  set(d.querySelector('input[name=subjectbox]'), T);
  const hs = d.querySelector('input[name=subject]'); if (hs) set(hs, T);
  const body = d.querySelector('div[aria-label="Message Body"][contenteditable]');
  const lines = ['Hi Desk Setup Daily team,', '', 'I just watched your latest video, "I Rebuilt My Desk for Focus (Under $300)", and the way you test each tool before it earns a spot on the desk is exactly why I\'m writing.', '', 'I\'m Jordan, and I built Quillnote, an AI meeting notes app for small teams. I\'d love to sponsor a paid 60-second integration in one of your upcoming videos, and I\'m happy to send you a free account to try first.', '', 'Would you be open to it? I can send a short brief, a tracking link and a 20% off code for your viewers.', '', 'Thanks,', 'Jordan'];
  body.replaceChildren(...lines.map((l) => { const x = document.createElement('div'); if (l) x.textContent = l; else x.append(document.createElement('br')); return x; }));
};

// after the compose opens Gmail resets the title, draws its "Not connected" bar (offline) and a Drafts count: put back what
// the chat's account shows, then check the real identity is gone (must be all 0)
window.CLEAN = () => {
  const S = window.STAGES.inbox;
  for (const e of document.querySelectorAll('div,span')) {
    if (e.children.length <= 4 && /^Not connected\./.test(e.textContent.trim()) && e.textContent.length < 60) {
      let n = e; while (n.parentElement && n.parentElement !== document.body && /Not connected/.test(n.parentElement.textContent) && n.parentElement.textContent.length < 60) n = n.parentElement;
      n.style.display = 'none';
    }
  }
  for (const n of document.querySelectorAll('.aim .bsU')) n.textContent = '';
  const inb = document.querySelector('.aim a[href$="#inbox"]')?.closest('.aim')?.querySelector('.bsU'); if (inb) inb.textContent = '4';
  for (const a of document.querySelectorAll('.aim a[aria-label]')) a.setAttribute('aria-label', a.getAttribute('aria-label').replace(/\s*\d+\s*unread/i, ''));
  document.title = S.title;
  document.activeElement.blur();
  const real = window.__real;
  const html = document.body.innerHTML + [...document.body.querySelectorAll('input,textarea')].map((i) => i.value).join('\n')
    + [...document.body.querySelectorAll('*')].flatMap((n) => [...n.attributes].map((a) => a.value)).join('\n') + document.body.innerText + document.title;
  return real.map((r) => html.split(r).length - 1);
};
