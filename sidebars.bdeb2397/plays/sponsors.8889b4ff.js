// "Email YouTubers to sponsor my SaaS": superbot searches YouTube for productivity app reviews, opens a channel to check
// its subscribers and latest video, writes to each channel from Gmail and finds the 46 in Sent Mail, then checks back as
// the replies come in: the first yes, the brief it sends, its follow-ups, the next two yeses, and the three deals in the
// sponsorship sheet (plays/sponsors/: pages.json and pages.channel.json for YouTube and the sheet, pages.gmail.json and
// pages.mail.json for Gmail; CREDITS*.txt there).
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

// Gmail's own Inbox and Sent links, where every capture of it draws them
const INBOX = [79.5, 141.5], SENT = [79.5, 237.8];

export default {
  transcript: TRANSCRIPTS.sponsors,
  pages: ['./plays/sponsors/pages.json', './plays/sponsors/pages.channel.json', './plays/sponsors/pages.gmail.json', './plays/sponsors/pages.mail.json'],
  targets: { compose: { sent: SENT }, sent: { inbox: INBOX }, 'inbox-desk': { sent: SENT }, 'sent-followup': { inbox: INBOX } },
  script(p) {
    p.post().wait(0.3).post();
    p.wait(0.4).control().wait(0.5).open('yt-search');
    p.step().wait(0.3).point('video1-title').wait(0.3).point('channel1');
    // a channel: its subscribers, then its latest video
    p.wait(0.3).press('channel1').load('channel');
    p.wait(0.3).point('subs').step();
    p.wait(0.4).point('video1').step();
    p.wait(0.8).newTab('compose', 'mail.google.com/mail/u/0/#inbox?compose=new');
    p.wait(0.3).step().wait(0.9).press('send');
    p.wait(0.4).press('sent').load('sent');
    p.wait(0.3).point('first').wait(0.3).point('sixth').step().post();
    p.wait(1.8).step();
    // the first yes, and the brief that answers it
    p.wait(1.0).press('inbox').load('inbox-desk');
    p.wait(0.3).point('desk-setup').step().post();
    p.wait(1.6).press('sent').load('sent-brief');
    p.wait(0.3).point('brief').step();
    // the follow-ups to the 21 who had not replied
    p.wait(1.2).reload('sent-followup');
    p.wait(0.3).point('first').wait(0.3).point('last').step();
    p.wait(1.0).press('inbox').load('inbox');
    p.wait(0.3).point('calm-code').step().post();
    p.wait(1.6).point('tidy-tabs').step();
    // the three deals in the sponsorship sheet
    p.wait(0.8).newTab('sheet-before', 'baserow.io/public/grid/q7Vn2kXe0uLmT4rBz9QhYcWd3sJf6AaGpR1oNiUxE8M');
    p.wait(0.3).point('head').wait(0.4).show('sheet-after');
    p.wait(0.3).point('row1').wait(0.3).point('row3').step().post();
  },
};
