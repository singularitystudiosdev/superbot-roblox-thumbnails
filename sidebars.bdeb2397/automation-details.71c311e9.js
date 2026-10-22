// What an automation's detail view (automation-detail.71c311e9.js) says about it beyond its card: the full description,
// the credits a round takes (at Billing's one price, settings-data.bdeb2397.js: $1 buys 1,000,000), its ratings
// by star (5 down to 1), its reviews (anonymous: no reviewer's name is kept) and who published it. Made up, as the
// catalogue's ratings and uses are (automations.03378ba4.js): the ratings by star come to its card's rating and to one
// rating per 25 uses, which tools/automations-verify.03378ba4.mjs checks.

// who publishes automations, each with a picture: ouroboro publishes its own two, its picture the ouroboro mark's
// poster (fx/mark.901bc0c7.png, fx/CREDITS.txt)
export const PUBLISHERS = {
  ouroboro: { name: 'ouroboro', avatar: './fx/mark.901bc0c7.png', about: 'Makes ouroboro, and the automations it comes with. Each one keeps running on its own and writes up every round in its chat.' },
};

export const DETAILS = {
  thumbs: {
    about: [
      'Your thumbnails are the first thing a player sees in Discover and in search, and most of what decides whether they click. This automation makes new ones from your game\'s own screenshots and art, puts them up against the ones you have live, and keeps whichever brings in more plays.',
      'When a test has a winner it starts the next one, so your thumbnails keep getting better while you work on the game. Each round is written up in its chat: what it tried, how each thumbnail did and which one it kept.',
    ],
    publisher: 'ouroboro',
    credits: 300_000,
    stars: [663, 51, 7, 4, 3],
    reviews: [
      { stars: 5, title: 'Beat the thumbnail I made myself', body: 'Ran it on my tycoon for two weeks. It tried six thumbnails and the one it kept got more plays than my old set. I would not have picked that one myself.', date: 'Oct 12, 2026' },
      { stars: 5, title: 'Set it up once', body: 'I connected Roblox once and it has been testing ever since. The write-up after each round is the best part: I can see why a thumbnail lost.', date: 'Oct 3, 2026' },
      { stars: 4, title: 'Let me pin one', body: 'Works well. I would like a way to keep my event thumbnail in the set while it tests the others around it.', date: 'Sep 22, 2026' },
    ],
  },
  icon: {
    about: [
      'Your icon sits next to every other game on the Roblox home page, so it has to read at a glance. This automation draws icon options from your game\'s own art, tests them against the icon you have live, and keeps the one more players click.',
      'Each time a test ends it draws a new round, so the icon keeps up with your updates and events. Each round is written up in its chat with every option it drew and how each one did.',
    ],
    publisher: 'ouroboro',
    credits: 200_000,
    stars: [322, 47, 10, 3, 2],
    reviews: [
      { stars: 5, title: 'An icon that stands out', body: 'It pulled the vault door from our art and put a robber behind it. That icon got far more clicks than the one we had.', date: 'Oct 16, 2026' },
      { stars: 5, title: 'Saves me hours', body: 'I used to redo our icon by hand every update. Now it draws four, tests them and tells me which one won.', date: 'Oct 5, 2026' },
      { stars: 3, title: 'Good picks, slow rounds', body: 'The icons are good, but on a small game a round takes a few days before there is a winner.', date: 'Sep 28, 2026' },
    ],
  },
};
