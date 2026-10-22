// "Get 2 concert tickets under $150 each": superbot checks Neon Harbor's pairs on Vivid Seats and three more resale
// sites (Vivid Seats' $238 the cheapest), sees the second date announced in Gmail, reloads as the cheapest pair falls
// from $238 to $171 to $142, opens that pair and checks out, finds Vivid Seats' order email in Gmail and puts the show on
// Sat Nov 14 in Google Calendar (plays/tickets/: pages.json for Vivid Seats, pages.sites.json for the other sites,
// pages.gmail.json for Gmail, pages.calendar.json for Calendar; CREDITS*.txt there). The checkout's payment step is not
// captured (it only exists once the site holds the seats), so the purchase shows as the order email.
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

export default {
  transcript: TRANSCRIPTS.tickets,
  pages: ['./plays/tickets/pages.json', './plays/tickets/pages.sites.json', './plays/tickets/pages.gmail.json', './plays/tickets/pages.calendar.json'],
  script(p) {
    p.post().wait(0.3).post();
    p.wait(0.4).control().wait(0.5).open('event-238');
    p.wait(0.3).point('sort').wait(0.3).point('price1');
    p.wait(0.5).newTab('site-gametime');
    p.wait(0.3).point('price1');
    p.wait(0.4).open('site-ticketsmarter');
    p.wait(0.3).point('price1');
    p.wait(0.4).open('site-ticketnetwork');
    p.wait(0.3).point('price1').step();
    p.wait(0.5).tab(0).wait(0.3).point('row1').wait(0.25).point('price1');
    p.step().post();
    p.wait(1.6).step();
    p.wait(0.8).newTab('announce', 'mail.google.com');
    p.wait(0.3).point('announce').step();
    p.wait(0.8).tab(0).wait(0.3).reload('event-171');
    p.wait(0.3).point('price1').step().post();
    p.wait(1.8).step().wait(1.2).reload('event-142');
    p.wait(0.3).point('price1').step();
    p.wait(0.5).press('row1').show('listing-108');
    p.wait(0.6).press('checkout').load('checkout');
    p.wait(0.4).press('email').type();
    p.wait(0.3).press('continue');
    p.wait(1.0).tab(2).wait(0.3).reload('order').wait(0.3).point('order').step();
    p.wait(0.8).newTab('calendar', 'calendar.google.com');
    p.wait(0.4).press('slot').show('calendar-added').wait(0.3).step().post();
  },
};
