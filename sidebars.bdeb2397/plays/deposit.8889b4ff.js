// "Get my security deposit back": superbot writes the request to the landlord in Gmail with the 24 move-out photos,
// sends it and finds it in Sent Mail, mails the same letter by USPS Certified Mail through Mailform (the letter uploaded,
// the landlord's address, Certified Mail ticked), waits, and later finds the $1,800 transfer and the landlord's reply
// (plays/deposit/: pages.json and pages.mail.json for Gmail, pages.certified.json for Mailform; CREDITS*.txt there).
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

// Gmail's own Inbox and Sent links, where every capture of it draws them
const INBOX = [79.5, 141.5], SENT = [79.5, 237.8];

export default {
  transcript: TRANSCRIPTS.deposit,
  pages: ['./plays/deposit/pages.json', './plays/deposit/pages.mail.json', './plays/deposit/pages.certified.json'],
  targets: { compose: { sent: SENT }, sent: { inbox: INBOX } },
  script(p) {
    p.post().wait(0.3).post();
    p.wait(0.4).control().wait(0.5).open('compose', 'mail.google.com/mail/u/0/#inbox?compose=new');
    p.step().wait(1.0).step();
    p.wait(0.9).press('send');
    p.wait(0.4).press('sent').load('sent');
    p.wait(0.3).point('request').step().post();
    // the same letter by certified mail
    p.wait(1.0).newTab('certified-upload', 'mailform.io');
    p.wait(0.4).press('next').load('certified');
    p.wait(0.3).point('upload').wait(0.3).point('certified').wait(0.3).press('send').wait(0.3).step();
    p.wait(1.0).tab(0).wait(0.3).point('request').step();
    // the transfer and the landlord's reply
    p.wait(1.6).press('inbox').load('inbox-paid');
    p.wait(0.3).point('bank').step().post();
    p.wait(2.4).open('search');
    p.wait(0.3).point('reply').wait(0.6).point('transfer');
  },
};
