// "Order me a surprise lunch every Friday": each Friday at 11:30 superbot searches Uber Eats for lunch near the
// office, opens a place Jordan has never ordered from, opens the dish to read what is in it (no peanuts), adds it and
// goes to checkout, and finds Uber Eats' receipt with the delivery time in Gmail; the third Friday's poke bowl is the
// favorite, and the next Friday's place is picked (plays/lunch/: pages.json and pages.carts.json for Uber Eats,
// pages.mail.json for Gmail; CREDITS*.txt there).
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

export default {
  transcript: TRANSCRIPTS.lunch,
  pages: ['./plays/lunch/pages.json', './plays/lunch/pages.carts.json', './plays/lunch/pages.mail.json'],
  script(p) {
    p.post().wait(0.3).post();
    p.wait(0.4).control().step().wait(0.5).open('search', 'ubereats.com/search?q=lunch');
    // Friday, Oct 2: the dish read, ordered, and its receipt
    p.wait(0.3).point('store:menya').step().press('store:menya').load('store-menya');
    p.wait(0.3).press('dish').show('item-menya');
    p.wait(0.3).point('desc').step();
    p.wait(0.5).press('add').show('cart-menya');
    p.wait(0.4).press('checkout').wait(0.4).step();
    p.wait(1.0).newTab('receipt-menya', 'mail.google.com');
    p.wait(0.3).point('receipt').step().post();
    // Friday, Oct 9
    p.wait(1.2).tab(0).wait(0.3).back('search');
    p.wait(0.3).point('store:esquina').step().press('store:esquina').load('store-esquina');
    p.wait(0.3).press('dish').show('item-esquina');
    p.wait(0.4).point('desc').wait(0.3).press('add').show('cart-esquina');
    p.wait(0.4).press('checkout').wait(0.4).step();
    p.wait(1.0).tab(1).wait(0.3).reload('receipt-esquina');
    p.wait(0.3).point('receipt').step().post();
    // Friday, Oct 16
    p.wait(1.2).tab(0).wait(0.3).back('search');
    p.wait(0.3).point('store:poke').step().press('store:poke').load('store-poke');
    p.wait(0.3).press('dish').show('item-poke');
    p.wait(0.6).press('add').show('cart-poke');
    p.wait(0.5).press('checkout').wait(0.4).step();
    p.wait(1.2).step().post();
    // next Friday's place
    p.wait(2.2).back('search');
    p.wait(0.3).point('store:cedar').step().post();
  },
};
