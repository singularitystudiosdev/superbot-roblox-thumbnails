// "Cancel the subscriptions I don't use": superbot reads the card statements in Gmail, searches the receipts for every
// recurring charge and the apps' own mail for when Jordan last used each, then cancels the four unused ones one by one in
// their billing portals (Stripe's real customer portal: the plan, Cancel plan, the reason, the confirmation, the plan
// shown as cancelled), and back in Gmail finds the four cancellation confirmations and asks about the gym
// (plays/subscriptions/: pages.json and pages.mail.json for Gmail, pages.portal.json for the portals; CREDITS*.txt there).
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

export default {
  transcript: TRANSCRIPTS.subscriptions,
  pages: ['./plays/subscriptions/pages.json', './plays/subscriptions/pages.mail.json', './plays/subscriptions/pages.portal.json'],
  script(p) {
    p.post().wait(0.3).post();
    p.wait(0.4).control().wait(0.5).open('statements');
    p.wait(0.3).point('statement1').step();
    p.wait(0.9).open('receipts');
    p.wait(0.2).step().post();
    p.wait(0.6).point('row1').wait(0.4).point('row2');
    // when each was last used: the apps' own "we miss you" mail
    p.wait(0.5).open('activity', 'mail.google.com/mail/u/0/#search/we+miss+you+OR+last+watched');
    p.wait(0.3).point('streambox').wait(0.25).point('reelhouse').wait(0.25).point('freshcrate').wait(0.25).point('cloudvault').wait(0.25).point('gym').step();
    // the two streaming apps, each in its own billing portal: the plan, Cancel plan, a reason, confirm, cancelled
    p.wait(0.6).newTab('portal-streambox-home', 'billing.stripe.com/p/login/streambox');
    p.wait(0.3).press('plan').load('portal-streambox');
    p.wait(0.3).press('cancel').load('portal-streambox-confirm');
    p.wait(0.3).point('reason').wait(0.3).press('confirm').load('portal-streambox-done');
    p.wait(0.4).point('status').wait(0.3).press('return').load('portal-streambox-cancelled');
    p.wait(0.3).point('status');
    p.wait(0.5).open('portal-reelhouse', 'billing.stripe.com/p/login/reelhouse');
    p.wait(0.3).press('cancel').load('portal-reelhouse-confirm');
    p.wait(0.3).point('reason').wait(0.3).press('confirm').load('portal-reelhouse-done');
    p.wait(0.4).point('status').step();
    // the meal kit, then the cloud backup
    p.wait(0.6).open('portal-freshcrate', 'billing.stripe.com/p/login/freshcrate');
    p.wait(0.3).press('cancel').load('portal-freshcrate-confirm');
    p.wait(0.3).point('reason').wait(0.3).press('confirm').load('portal-freshcrate-done');
    p.wait(0.4).point('status').step();
    p.wait(0.6).open('portal-cloudvault', 'billing.stripe.com/p/login/cloudvault');
    p.wait(0.3).press('cancel').load('portal-cloudvault-confirm');
    p.wait(0.3).point('reason').wait(0.3).press('confirm').load('portal-cloudvault-done');
    p.wait(0.4).point('status').wait(0.3).press('return').load('portal-cloudvault-cancelled');
    p.wait(0.3).point('status').step();
    // back in Gmail: the four confirmations, and the gym still billing
    p.wait(0.6).tab(0).wait(0.3).open('results');
    p.wait(0.3).point('cancel1').step().post();
    p.wait(2.6).point('gym').step();
  },
};
