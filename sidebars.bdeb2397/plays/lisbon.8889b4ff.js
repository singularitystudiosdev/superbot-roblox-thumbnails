// "Plan a 3-day trip to Lisbon": superbot compares hotels in Chiado on Google Hotels and books Casa do Chiado, picks
// the two dinners' tables on the restaurants' SevenRooms pages and reserves them, finds the Sintra train for Nov 22 on
// Comboios de Portugal and books it, puts every booking in Google Calendar's 4-day view, and emails Jordan the plan, the
// bookings' confirmations under it (plays/lisbon/: pages.json, pages.dinner.json for SevenRooms, pages.mail.json for
// Calendar and Gmail; CREDITS*.txt there).
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

export default {
  transcript: TRANSCRIPTS.lisbon,
  pages: ['./plays/lisbon/pages.json', './plays/lisbon/pages.dinner.json', './plays/lisbon/pages.mail.json'],
  script(p) {
    p.post().wait(0.3).post();
    p.wait(0.4).control().wait(0.5).open('hotels-top', 'google.com/travel/search?q=hotels+in+Chiado+Lisbon');
    p.wait(0.3).point('hotel1').wait(0.3).show('hotels');
    p.wait(0.2).point('hotel2').wait(0.2).point('hotel3');
    p.wait(0.2).scroll(820, 1.0).wait(0.4).scroll(1500, 0.9).step();
    p.wait(0.5).scroll(0, 1.0).wait(0.2).press('prices1').load('hotel', 0.6);
    p.wait(0.5).press('book').wait(0.4).step().post();
    // the two dinners, each table picked and reserved
    p.wait(1.2).newTab('dinner-1', 'sevenrooms.com/explore/tabernadolargo/reservations');
    p.wait(0.3).point('slot').wait(0.3).press('reserve');
    p.wait(0.6).open('dinner-2', 'sevenrooms.com/explore/casadasgaivotas/reservations');
    p.wait(0.3).point('slot').wait(0.3).press('reserve').wait(0.3).step();
    // the Sintra train
    p.wait(0.8).open('train');
    p.wait(0.4).point('row').wait(0.4).press('detail').wait(0.3).step();
    // every booking on the calendar, then the plan by email
    p.wait(1.0).newTab('calendar', 'calendar.google.com');
    p.wait(0.3).point('hotel').wait(0.3).point('dinner1').wait(0.3).point('train').step();
    p.wait(1.0).newTab('plan', 'mail.google.com');
    p.wait(0.3).point('plan').step().post();
  },
};
