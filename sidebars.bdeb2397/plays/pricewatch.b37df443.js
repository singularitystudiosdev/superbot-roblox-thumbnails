// "Buy tickets for Neon Harbor anytime they drop below $150": superbot finds the show from Vivid Seats' home page (the
// search typed, the site's own suggestions, the Portland date, 2 tickets picked in its quantity picker), reads the
// cheapest pair ($238) and the same show on Gametime, TicketSmarter and TicketNetwork, then checks them every 10 minutes:
// still $238 at 7:10, a second date announced in Gmail at 7:42, $171 at 7:50, TicketNetwork still higher, and the next
// morning a pair in Section 108 at $142. It opens that pair, looks over the seats, checks out with the saved card, finds
// Vivid Seats' order email in Gmail and puts the show on Sat Nov 14 in Google Calendar, then goes back to the watch, which
// never ends: the pair bought is gone and the cheapest left is $159. Pages: plays/pricewatch/ (the home page, the search,
// the quantity picker and the page after the purchase, tools/play-pricewatch.b37df443.mjs) and every other page the "tickets"
// chat's (plays/tickets/); CREDITS*.txt in both. The checkout's payment step is not captured (it only exists once the
// site holds the seats), so the purchase shows as the order email.
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

export default {
  transcript: TRANSCRIPTS.pricewatch,
  pages: ['./plays/pricewatch/pages.json', './plays/tickets/pages.json', './plays/tickets/pages.sites.json', './plays/tickets/pages.gmail.json', './plays/tickets/pages.calendar.json'],
  // the listing panel's seat view and its section heading, measured off plays/tickets/listing-108.webp
  targets: { 'listing-108': { seats: [257, 272], heading: [66, 461] } },
  script(p) {
    // the ask, and the plan
    p.post().wait(0.3).post();
    // the show, found from Vivid Seats' home page
    p.wait(0.4).control().wait(0.5).open('home', 'vividseats.com');
    p.wait(0.4).press('search').show('home-focus').wait(0.15).type().step();
    p.wait(0.5).press('suggest').load('event-qty', 0.7);
    p.wait(0.6).press('qty2').show('event-238').step();
    p.wait(0.4).point('sort').wait(0.4).point('row1').wait(0.25).point('price1').step();
    // the same show on three more resale sites
    p.wait(0.5).newTab('site-gametime');
    p.wait(0.3).point('row1').wait(0.25).point('price1');
    p.wait(0.4).open('site-ticketsmarter');
    p.wait(0.3).point('price1');
    p.wait(0.4).open('site-ticketnetwork');
    p.wait(0.3).point('price1').step().post();
    // the watch: every 10 minutes, each site reloaded
    p.wait(0.8).tab(0).step();
    p.wait(1.2).reload('event-238').wait(0.3).point('price1').step();
    p.wait(0.8).newTab('announce', 'mail.google.com');
    p.wait(0.3).point('announce').step();
    p.wait(0.8).tab(0).wait(0.3).reload('event-171');
    p.wait(0.3).point('row1').wait(0.25).point('price1').step().post();
    p.wait(1.4).tab(1).wait(0.3).reload('site-ticketnetwork').wait(0.3).point('price1');
    p.wait(0.5).tab(0).step();
    // the next morning, a pair under the limit: looked over, then bought
    p.wait(1.6).reload('event-142').wait(0.3).point('row1').wait(0.25).point('price1').step();
    p.wait(0.5).press('row1').show('listing-108');
    p.wait(0.4).point('seats').wait(0.5).point('heading').step();
    p.wait(0.5).press('checkout').load('checkout');
    p.wait(0.4).press('email').type();
    p.wait(0.3).press('continue').wait(0.6).step();
    p.wait(0.8).tab(2).wait(0.3).reload('order').wait(0.3).point('order').step();
    p.wait(0.8).newTab('calendar', 'calendar.google.com');
    p.wait(0.4).press('slot').show('calendar-added').wait(0.3).step().post();
    // and back to the watch, which never ends: the pair bought is gone, the cheapest left still over the limit
    p.wait(2.6).tab(0).step();
    p.wait(0.4).open('event-159').wait(0.3).point('row1').wait(0.25).point('price1').step().post();
  },
};
