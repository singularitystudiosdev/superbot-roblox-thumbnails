// "Find a used road bike under $600": superbot searches Craigslist, OfferUp and Facebook Marketplace, scans the 56cm
// bikes on Craigslist, opens the $540 aluminum one in Oakland and replies through Craigslist's email relay, finds its five
// questions to sellers in Sent Mail, the seller's yes to $480 in the inbox, and puts the Saturday pickup in Google
// Calendar (plays/bike/: pages.json for Craigslist, pages.sites.json for the other sites, pages.mail.json for Gmail and
// Calendar; CREDITS*.txt there).
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

export default {
  transcript: TRANSCRIPTS.bike,
  pages: ['./plays/bike/pages.json', './plays/bike/pages.sites.json', './plays/bike/pages.mail.json'],
  // the reply page is the listing with Craigslist's reply panel open: its photo where the listing has it
  targets: { reply: { photo: [554,316.9] } },
  script(p) {
    p.post().wait(0.3).post();
    p.wait(0.4).control().wait(0.5).open('search', 'sfbay.craigslist.org/search/bia?query=road%20bike%2056cm&max_price=600');
    p.wait(0.3).point('rowA').wait(0.2).point('rowB');
    // the other two local listing sites
    p.wait(0.5).newTab('site-offerup', 'offerup.com/search?q=road%20bike%2056cm&PRICE_MAX=600');
    p.wait(0.3).point('row1').wait(0.3).point('row2');
    p.wait(0.5).open('site-facebook', 'facebook.com/marketplace/oakland/search?query=road%20bike%2056cm');
    p.wait(0.3).point('row1').wait(0.3).point('row2').step();
    p.wait(0.6).tab(0).wait(0.3).point('rowC').step();
    p.wait(0.4).scroll(380, 0.9).wait(0.6).step();
    p.wait(0.5).scroll(0, 0.8).wait(0.2).press('row540').load('listing');
    p.wait(0.4).point('photo').wait(0.6).press('reply').show('reply');
    p.wait(0.4).press('email');
    // the questions to five sellers, through Craigslist's relay
    p.wait(0.8).newTab('sent-asks', 'mail.google.com/mail/u/0/#sent');
    p.wait(0.3).point('ask1').wait(0.3).point('ask5').step();
    p.wait(0.8).tab(0).wait(0.3).point('photo').step().post();
    // the seller's answer, then the pickup on the calendar
    p.wait(1.8).tab(2).wait(0.3).reload('agreed');
    p.wait(0.3).point('agreed').step().post();
    p.wait(1.4).newTab('calendar', 'calendar.google.com');
    p.wait(0.3).point('pickup').step();
  },
};
