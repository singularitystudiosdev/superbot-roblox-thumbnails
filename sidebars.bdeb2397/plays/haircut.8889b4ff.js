// "Book a haircut every 4 weeks": superbot checks Jordan's weekday evenings in Google Calendar, books Sam's 6:15 PM on
// Wednesday on Fade Room's Fresha page, sees a team dinner land on top of it, and moves the cut to Thursday at 5:45 PM
// (plays/haircut/, CREDITS.txt there).
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

export default {
  transcript: TRANSCRIPTS.haircut,
  pages: './plays/haircut/pages.json',
  // the date strip's Thu 19, read off booking-wed-picked.webp (its box spans 222-284 x 279-371 CSS px)
  targets: { 'booking-wed-picked': { thu: [253, 325] } },
  script(p) {
    p.post().wait(0.3).post();
    p.wait(0.4).control().wait(0.5).open('calendar-free', 'calendar.google.com');
    p.wait(0.3).point('wed-evening').wait(0.3).point('thu-evening').step();
    p.wait(0.6).newTab('booking-wed', 'fresha.com/a/fade-room-san-francisco-valencia-street-x7k2m9q4/booking');
    p.wait(0.4).press('slot').show('booking-wed-picked');
    p.wait(0.4).press('continue').step().post();
    p.wait(2.0).tab(0).wait(0.3).reload('calendar-conflict');
    p.wait(0.3).point('dinner').step().wait(0.4).point('haircut');
    p.wait(0.8).tab(1).wait(0.3).press('thu').load('booking-thu', 0.35);
    p.wait(0.4).press('slot').show('booking-thu-picked');
    p.wait(0.4).press('continue').step();
    p.wait(0.8).tab(0).wait(0.3).reload('calendar-moved');
    p.wait(0.3).point('haircut').step().post();
  },
};
