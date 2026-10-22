// "Book a flight to Tokyo under $700": superbot searches Google Flights and opens the cheapest fare's booking options
// across six sites ($894), rechecks as the fare falls to $731 and to a $612 nonstop, picks it and its return, goes on to
// book it with the airline, finds the airline's e-ticket in Gmail, and puts both flights in Google Calendar, the week
// out and the week back (plays/flights/: pages.json and pages.options.json for Google Flights, pages.mail.json for
// Gmail and Calendar; CREDITS*.txt there). The airline's own checkout is not captured (its site walls every capture).
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

export default {
  transcript: TRANSCRIPTS.flights,
  pages: ['./plays/flights/pages.json', './plays/flights/pages.options.json', './plays/flights/pages.mail.json'],
  // Calendar's own next-week arrow, beside the month in its top bar
  targets: { 'calendar-out': { next: [411, 31] } },
  script(p) {
    p.post().wait(0.3).post();
    p.wait(0.4).control().wait(0.5).open('results-894');
    p.wait(0.3).point('row1').wait(0.25).press('price1').load('options-894', 0.6);
    p.wait(0.3).point('site6').wait(0.3).point('site1').step();
    p.wait(0.4).step().post();
    p.wait(1.2).back('results-894');
    p.wait(0.4).step().wait(1.0).reload('results-731');
    p.wait(0.3).point('price1').step();
    p.wait(1.4).reload('results-612');
    p.wait(0.3).point('price1').step();
    p.wait(0.6).press('row1').load('returning', 0.6);
    p.wait(0.6).press('row1').load('booking', 0.7);
    p.wait(0.7).press('continue');
    // the airline's e-ticket, then both flights on the calendar
    p.wait(1.2).newTab('eticket', 'mail.google.com');
    p.wait(0.3).point('eticket').step().post();
    p.wait(1.4).newTab('calendar-out', 'calendar.google.com/calendar/u/0/r/week/2027/3/8');
    p.wait(0.3).point('out').wait(0.5).press('next').wait(0.25).press('next').load('calendar-back', 0.35);
    p.wait(0.3).point('back').step();
  },
};
