// "Keep my inbox at zero": Monday at 8 superbot opens Gmail with 88 unread, ticks the newsletters and receipts and
// archives them, answers the scheduling emails (its six replies in Sent Mail), and stars what needs Jordan; on Tuesday
// and Wednesday it ticks the night's mail and archives it back to zero (plays/inbox/: pages.json, pages.mail.json;
// CREDITS*.txt there).
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

export default {
  transcript: TRANSCRIPTS.inbox,
  pages: ['./plays/inbox/pages.json', './plays/inbox/pages.mail.json'],
  // Gmail's own Sent and Inbox links: this chat's first captures draw the nav 18px lower than the later ones
  targets: { 'inbox-17': { sent: [79.5, 255.5] }, 'sent-replies': { inbox: [79.5, 141.5] } },
  script(p) {
    p.post().wait(0.3).post();
    p.wait(0.4).control().wait(0.5).open('inbox-88', 'mail.google.com');
    p.step().wait(0.4).press('newsletter1').wait(0.25).press('newsletter2').show('inbox-selected');
    p.wait(0.5).press('archive').show('inbox-17').step();
    // the six scheduling emails answered: the replies in Sent Mail
    p.wait(0.5).point('scheduling1').wait(0.6).press('sent').load('sent-replies');
    p.wait(0.3).point('reply1').wait(0.3).point('reply6').step();
    p.wait(0.8).press('inbox').load('inbox-zero');
    p.wait(0.3).point('starred1').step().post();
    // Tuesday and Wednesday: the night's mail ticked and archived
    p.wait(2.0).reload('inbox-79');
    p.wait(0.3).press('select-all').show('inbox-79-selected');
    p.wait(0.4).press('archive').show('inbox-zero').wait(0.3).step();
    p.wait(1.2).reload('inbox-92');
    p.wait(0.3).press('select-all').show('inbox-92-selected');
    p.wait(0.4).press('archive').show('inbox-zero').wait(0.3).step();
    p.wait(1.0).step().post();
  },
};
