// Every chat but the live one, as it stands: the prompt, superbot's replies with their result cards, the composer's
// follow-up suggestion, and the Activity tab's steps. Written in the creative's own format (feed.bdeb2397.js): a card
// is a picture (or a 3D icon) with a title, two lines and a figure; a breakthrough's figure carries the party popper,
// and its Activity line is bold. Names of people, shops, products and channels are made up; figures are illustrative,
// as the creative's are. Pictures: chats/CREDITS.txt; icons: chats.bdeb2397.js FX.
//
// a message: { u: text } from the user, or { b: text, card?, after? } from superbot
// a card: { img | fx, title, sub, line, value, unit, win? }, or { strip: [{ img | fx, name }] }
// an Activity step: [icon, text] or [icon, text, true] for a win

export const TRANSCRIPTS = {
  sponsors: {
    hint: 'Ask the next 20 channels on the list...',
    messages: [
      { u: 'We just launched Quillnote, an AI meeting notes app for small teams. Find YouTubers who review productivity apps and email them about a paid sponsorship. Budget is $500 to $2,000 a video.' },
      { b: "On it. I'll find productivity reviewers with 20k to 300k subscribers who posted in the last month, write each one a personal email that mentions a recent video of theirs, and follow up once. I'll post every yes here." },
      { b: 'Found 46 channels that fit, and wrote to each one from your Gmail:', card: { fx: 'outbox', title: 'Outreach sent', sub: '46 personal emails, one per channel', line: 'Sent Oct 18 at 9:00 AM', value: '46', unit: 'emails' } },
      { b: 'First yes. Desk Setup Daily will do a 60-second integration:', card: { fx: 'handshake', title: 'Desk Setup Daily', sub: '88k subscribers, productivity reviews', line: '60-second integration, live Oct 28', value: '$900', unit: 'per video', win: true } },
      { b: "I followed up with the 21 who hadn't replied. Calm Code said yes to a full video:", card: { fx: 'handshake', title: 'Calm Code', sub: '142k subscribers, dev tools and focus', line: 'Dedicated review, live Nov 4', value: '$1,600', unit: 'per video', win: true }, after: 'Tidy Tabs said yes too: a 45-second mention for $650, live Nov 9.' },
      { b: '3 sponsorships booked. Each has the brief, a tracking link and a 20% off code, and all three are in your sponsorship sheet.', card: { fx: 'chartUp', title: 'Sponsorships booked', sub: 'Desk Setup Daily, Calm Code, Tidy Tabs', line: '17 of 46 replied, a 37% reply rate', value: '$3,150', unit: 'for 3 videos' } },
    ],
    acts: [
      ['search', 'Searched YouTube for productivity app reviews'],
      ['bars', 'Kept 46 channels with 20k to 300k subscribers'],
      ['memo', "Read each channel's latest video"],
      ['envelope', 'Wrote 46 personal emails'],
      ['outbox', 'Sent them from your Gmail'],
      ['hourglass', 'Waiting for replies'],
      ['handshake', 'Desk Setup Daily said yes at $900', true],
      ['memo', 'Sent the brief and tracking link'],
      ['loop', "Followed up with 21 who hadn't replied"],
      ['handshake', 'Calm Code said yes at $1,600', true],
      ['handshake', 'Tidy Tabs said yes at $650', true],
      ['floppy', 'Added all 3 to your sponsorship sheet'],
    ],
  },

  tickets: {
    hint: 'Find parking near the arena too...',
    messages: [
      { u: "Get me 2 tickets together for Neon Harbor at Riverside Arena on Nov 14. Don't pay more than $150 each. Watch the prices and buy when they drop." },
      { b: "On it. I'll watch every resale listing for 2 seats together and buy the moment a pair drops to $150 each or less, fees included. Face value was $129, and resale pairs start at $238 right now." },
      { b: 'Cheapest pair this morning:', card: { fx: 'tickets', title: 'Section 214, Row C', sub: '2 seats together, upper level', line: 'Checked 4 resale sites at 6:00 AM', value: '$238', unit: 'each, with fees' } },
      { b: 'Prices started falling once a second date was announced:', card: { fx: 'chartDown', title: 'Section 120, Row R', sub: '2 seats together, lower level', line: 'Down $67 since yesterday', value: '$171', unit: 'each, with fees' } },
      { b: 'Bought. 2 seats together, $8 under your limit:', card: { fx: 'tickets', title: 'Section 108, Row K, seats 11 and 12', sub: 'Lower level, side stage', line: 'Paid with your saved card', value: '$142', unit: 'each, with fees', win: true }, after: 'The tickets are in your account, and Nov 14 is on your calendar.' },
    ],
    acts: [
      ['search', 'Checked 4 resale sites for pairs together'],
      ['tickets', 'Cheapest pair: $238 each'],
      ['hourglass', 'Watching prices every 10 minutes'],
      ['bell', 'A second date was announced'],
      ['chartDown', 'Cheapest pair fell to $171 each'],
      ['hourglass', 'Still watching'],
      ['tickets', 'Found 2 together in Section 108 at $142 each'],
      ['card', 'Bought them with your saved card', true],
      ['calendar', 'Added Nov 14 to your calendar'],
    ],
  },

  lunch: {
    hint: "Skip next Friday, I'm out...",
    messages: [
      { u: 'Every Friday, order me a surprise lunch to the office for noon. Something new each week, under $25, and nothing with peanuts.' },
      { b: "Done. Every Friday at 11:30 I'll pick a place you've never ordered from, rated 4.5 or higher, under $25 with delivery and tip, and check the dish for peanuts. I'll post each one here." },
      { b: 'Friday, Oct 2:', card: { img: './chats/lunch-ramen.webp', title: 'Spicy miso ramen', sub: 'Menya Sora, new to you', line: 'Arrived 11:58, you gave it 5 stars', value: '$19.80', unit: 'with delivery' } },
      { b: 'Friday, Oct 9:', card: { img: './chats/lunch-tacos.webp', title: 'Tacos al pastor, three', sub: 'La Esquina, new to you', line: 'Arrived 12:03, you gave it 4 stars', value: '$16.50', unit: 'with delivery' } },
      { b: 'Friday, Oct 16, and your favorite so far:', card: { img: './chats/lunch-poke.webp', title: 'Salmon poke bowl', sub: 'Poke Lab, new to you', line: 'Arrived 11:55, you gave it 5 stars', value: '$22.40', unit: 'with delivery', win: true } },
      { b: 'Your Fridays so far:', card: { strip: [{ img: './chats/lunch-ramen.webp', name: 'Oct 2, ramen' }, { img: './chats/lunch-tacos.webp', name: 'Oct 9, tacos' }, { img: './chats/lunch-poke.webp', name: 'Oct 16, poke' }] }, after: "This Friday it's Lebanese: a chicken shawarma plate from Cedar House, $18.90." },
    ],
    acts: [
      ['calendar', 'Every Friday at 11:30'],
      ['search', 'Picked Menya Sora, rated 4.7'],
      ['check', 'No peanuts in the dish'],
      ['takeout', 'Ordered spicy miso ramen, $19.80'],
      ['check', 'Delivered at 11:58'],
      ['search', 'Picked La Esquina, rated 4.6'],
      ['takeout', 'Ordered tacos al pastor, $16.50'],
      ['check', 'Delivered at 12:03'],
      ['search', 'Picked Poke Lab, rated 4.8'],
      ['takeout', 'Ordered a salmon poke bowl, $22.40'],
      ['trophy', 'New favorite: the poke bowl, 5 stars', true],
      ['calendar', 'Next: Cedar House on Oct 23'],
    ],
  },

  youtube: {
    hint: 'Try the same on my Shorts...',
    messages: [
      { u: 'This is my channel youtube.com/@weeknightkitchen. Test new thumbnails on my older videos and keep whichever gets more clicks.' },
      { b: "On it. I'll start with your 10 videos with the lowest click-through rate, make 3 new thumbnails for each, run them in YouTube's Test & Compare and keep the winner." },
      { b: 'Your lowest is Sheet Pan Gnocchi at 2.1% click-through. Your channel averages 4.8%.', card: { img: './chats/yt-gnocchi-0.webp', title: 'Lowest performer', sub: 'Sheet Pan Gnocchi', line: '61,400 impressions in 28 days', value: '2.1%', unit: 'click-through' } },
      { b: 'Made 3 versions to test against it:', card: { strip: [{ img: './chats/yt-gnocchi-1.webp', name: 'Version 1' }, { img: './chats/yt-gnocchi-2.webp', name: 'Version 2' }, { img: './chats/yt-gnocchi-3.webp', name: 'Version 3' }] } },
      { b: 'New best. Version 2 won the test, more than 3 times the old click-through:', card: { img: './chats/yt-gnocchi-2.webp', title: 'Version 2', sub: 'You holding the pan, big text', line: 'Won Test & Compare after 7 days', value: '6.8%', unit: 'click-through', win: true } },
      { b: 'I did the same on 9 more videos and kept each winner:', card: { fx: 'chartUp', title: '10 videos updated', sub: 'Average click-through was 2.9%', line: 'Views on them up 71% this week', value: '5.6%', unit: 'click-through', win: true } },
    ],
    acts: [
      ['laptop', 'Opened YouTube Studio'],
      ['bars', 'Sorted your videos by click-through rate'],
      ['chartDown', 'Lowest: Sheet Pan Gnocchi at 2.1%'],
      ['palette', 'Made 3 new thumbnails'],
      ['outbox', 'Started Test & Compare'],
      ['hourglass', 'Waiting 7 days for results'],
      ['trophy', 'Version 2 won at 6.8%', true],
      ['floppy', 'Kept version 2 on the video'],
      ['loop', 'Ran the same test on 9 more videos'],
      ['chartUp', 'Average click-through now 5.6%', true],
    ],
  },

  subscriptions: {
    hint: 'Yes, cancel the gym too...',
    messages: [
      { u: "Go through my card statements and cancel the subscriptions I don't use." },
      { b: "On it. I'll list every recurring charge from the last 3 months, check when you last used each one, and cancel anything you haven't touched in 90 days. I'll ask before cancelling anything you used more recently." },
      { b: 'Found 14 subscriptions:', card: { fx: 'card', title: '14 subscriptions', sub: 'From your last 3 statements', line: '4 unused for over 90 days', value: '$211', unit: 'a month' } },
      { b: 'Cancelled the 4 you never use:', card: { fx: 'scissors', title: '4 cancelled', sub: '2 streaming apps, a meal kit, a cloud backup', line: 'Confirmations saved to a folder', value: '$64', unit: 'saved a month', win: true }, after: 'Your gym is $39 a month and you last went in August. Want me to cancel it too?' },
    ],
    acts: [
      ['card', 'Read 3 months of card statements'],
      ['search', 'Found 14 recurring charges'],
      ['bars', 'Checked when you last used each one'],
      ['scissors', 'Cancelled 2 streaming apps'],
      ['scissors', 'Cancelled a meal kit'],
      ['scissors', 'Cancelled a cloud backup'],
      ['money', 'Saving you $64 a month', true],
      ['bell', 'Asked about your gym membership'],
    ],
  },

  flights: {
    hint: 'Find a hotel near Shibuya too...',
    messages: [
      { u: 'Watch flights from SFO to Tokyo for March 8 to 22 and book when a round trip drops under $700.' },
      { b: "On it. I'll check prices every few hours across airlines and booking sites, economy with at most 1 stop, and book the first round trip under $700." },
      { b: 'Cheapest today:', card: { fx: 'plane', title: 'SFO to Haneda, 1 stop', sub: 'Mar 8 to Mar 22, economy', line: 'Checked 6 sites', value: '$894', unit: 'round trip' } },
      { b: 'Booked. Nonstop, $88 under your limit:', card: { fx: 'plane', title: 'SFO to Narita, nonstop', sub: 'Out Mar 8, 11:35 AM, back Mar 22', line: 'Seat 34A, 1 checked bag', value: '$612', unit: 'round trip', win: true }, after: 'Your confirmation is in your inbox, and both flights are on your calendar.' },
    ],
    acts: [
      ['search', 'Checked 6 sites for Mar 8 to Mar 22'],
      ['plane', 'Cheapest: $894 round trip'],
      ['hourglass', 'Checking every 4 hours'],
      ['chartDown', 'Fell to $731 with 1 stop'],
      ['chartDown', 'Nonstop fell to $612'],
      ['check', 'Booked the nonstop for $612', true],
      ['calendar', 'Added both flights to your calendar'],
    ],
  },

  haircut: {
    hint: 'Ask Sam about a beard trim next time...',
    messages: [
      { u: 'Book me a haircut with Sam every 4 weeks, weekday evenings only.' },
      { b: "Done. 4 weeks after each cut I'll book Sam's first open weekday slot after 5 PM, and move it if something else lands on your calendar." },
      { b: 'The next one is booked:', card: { fx: 'barber', title: 'Haircut with Sam', sub: 'Fade Room, Valencia St', line: 'Confirmation in your email', value: 'Nov 18', unit: 'Wed, 6:15 PM' } },
      { b: 'A team dinner just landed on Nov 18, so I moved your cut to the next evening Sam had open:', card: { fx: 'calendar', title: 'Moved, and Sam confirmed', sub: 'Fade Room, Valencia St', line: 'Your calendar is updated', value: 'Nov 19', unit: 'Thu, 5:45 PM', win: true } },
    ],
    acts: [
      ['calendar', 'Checked your weekday evenings'],
      ['barber', 'Booked Wed Nov 18 at 6:15 PM'],
      ['bell', 'A team dinner landed on Nov 18'],
      ['loop', 'Moved the haircut to Thu Nov 19, 5:45 PM'],
      ['check', 'Sam confirmed the new time', true],
    ],
  },

  inbox: {
    hint: 'Unsubscribe me from the ones I never open...',
    messages: [
      { u: "Keep my inbox at zero. Archive what doesn't need me, reply to the easy ones, and flag the rest." },
      { b: "On it. Every morning at 8 I'll sort what came in overnight. I'll only send replies that confirm a time or say thanks, and flag anything that needs a real answer from you." },
      { b: 'Monday morning:', card: { fx: 'inbox', title: '88 emails sorted', sub: 'Archived 71, replied to 6, flagged 11', line: 'Done by 8:04 AM', value: '0', unit: 'left unread' } },
      { b: 'Your first full week:', card: { fx: 'trophy', title: 'Inbox at zero, 5 days running', sub: '412 emails sorted', line: 'Archived 361, replied to 34, flagged 17', value: '5', unit: 'days at zero', win: true } },
    ],
    acts: [
      ['inbox', 'Sorted 88 emails from overnight'],
      ['check', 'Archived 71 newsletters and receipts'],
      ['envelope', 'Replied to 6 scheduling emails'],
      ['bell', 'Flagged 11 that need you'],
      ['inbox', 'Sorted 79 emails on Tuesday'],
      ['inbox', 'Sorted 92 emails on Wednesday'],
      ['trophy', 'Inbox at zero 5 days running', true],
    ],
  },

  bike: {
    hint: 'Look for a helmet in my size too...',
    messages: [
      { u: 'Find me a used road bike under $600. 56cm frame, carbon or aluminum, pickup within 20 miles.' },
      { b: "On it. I'll check local listings every hour, skip anything with frame damage in the photos, and ask sellers about mileage and wear before I show you anything." },
      { b: 'Best one so far:', card: { fx: 'bike', title: 'Aluminum road bike, 56cm', sub: '11 miles away, new chain and tires', line: 'About 1,500 miles on it, the seller says', value: '$540', unit: 'asking' } },
      { b: 'The seller took $480, and can meet Saturday at 10 AM:', card: { fx: 'handshake', title: 'Deal agreed', sub: 'Pickup in Oakland, Saturday 10 AM', line: 'On your calendar, with the address', value: '$480', unit: 'agreed', win: true } },
    ],
    acts: [
      ['search', 'Checked 3 local listing sites'],
      ['bike', 'Found 9 bikes in your size'],
      ['check', 'Skipped 4 with damage in the photos'],
      ['envelope', 'Asked 5 sellers about mileage'],
      ['bike', 'Best: aluminum, 56cm, $540'],
      ['handshake', 'Seller agreed to $480', true],
      ['calendar', 'Pickup Saturday at 10 AM'],
    ],
  },

  lisbon: {
    hint: 'Book a fado show for Friday night...',
    messages: [
      { u: 'Plan a 3-day trip to Lisbon for Nov 20 to 23. A mid-range hotel near the center, good food, and one day trip.' },
      { b: "On it. I'll book a hotel you can walk the center from, two dinner reservations, and a day trip to Sintra, then send you the plan day by day." },
      { b: 'Hotel booked:', card: { fx: 'luggage', title: 'Hotel in Chiado', sub: '3 nights, rated 4.6', line: 'Free cancellation until Nov 17', value: '$612', unit: '3 nights' } },
      { b: 'Everything is booked. Your plan is in your email and on your calendar:', card: { fx: 'map', title: '3 days in Lisbon', sub: 'Hotel, 2 dinners, Sintra on Nov 22', line: 'Train tickets and entry times included', value: '$1,140', unit: 'all in', win: true } },
    ],
    acts: [
      ['search', 'Compared 40 hotels near the center'],
      ['luggage', 'Booked a hotel in Chiado, $612'],
      ['memo', 'Reserved dinner for Nov 20 and Nov 21'],
      ['plane', 'Booked the Sintra train for Nov 22'],
      ['calendar', 'Put every booking on your calendar'],
      ['check', 'Sent you the plan, day by day', true],
    ],
  },

  deposit: {
    hint: 'Thank them and close this out...',
    messages: [
      { u: 'My landlord is keeping my $1,800 deposit. I moved out Sept 30 and left the place clean. Help me get it back.' },
      { b: "On it. I'll write a formal request with your move-out photos and the 21-day deadline your state sets for returning deposits, send it by email and certified mail, and follow up." },
      { b: 'Letter sent:', card: { fx: 'memo', title: 'Deposit request', sub: 'With 24 move-out photos', line: 'Email and certified mail, Oct 8', value: '$1,800', unit: 'requested' } },
      { b: 'Your landlord paid it back in full:', card: { fx: 'money', title: 'Deposit returned', sub: 'By bank transfer', line: 'Arrived Oct 16', value: '$1,800', unit: 'returned', win: true } },
    ],
    acts: [
      ['memo', 'Wrote the deposit request letter'],
      ['folder', 'Attached 24 move-out photos'],
      ['envelope', 'Emailed it to your landlord'],
      ['outbox', 'Sent it by certified mail'],
      ['hourglass', 'Waiting for a reply'],
      ['money', 'Deposit returned in full: $1,800', true],
    ],
  },
};
