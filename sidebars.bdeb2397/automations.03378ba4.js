// What the Automations tab offers: superbot automations a game creator can start in one click, each working in one app.
// The first is the creative's own (its chat is "Keep improving my Roblox thumbnails"). Every app carries the topics it
// serves, so a search for a topic ("game design") finds every app that serves it, and the tab offers those apps as
// categories to pick from. Thumbnails and app icons: automations/CREDITS.txt. Ratings and use counts are illustrative,
// as the creative's figures are.

const ALL_APPS = {
  roblox: { name: 'Roblox', icon: 'roblox.png', topics: ['Game design', 'Marketing', 'Monetization'], keywords: 'roblox studio experience obby' },
  creatorhub: { name: 'Creator Hub', icon: 'creatorhub.png', topics: ['Analytics'], keywords: 'roblox dashboard stats' },
  unity: { name: 'Unity', icon: 'unity.png', topics: ['Game design', 'Development'], keywords: 'game engine c# level' },
  steam: { name: 'Steam', icon: 'steam.png', topics: ['Game design', 'Marketing'], keywords: 'pc store valve launch' },
  itch: { name: 'itch.io', icon: 'itch.png', topics: ['Game design', 'Community'], keywords: 'indie jam' },
  youtube: { name: 'YouTube', icon: 'youtube.png', topics: ['Video', 'Marketing'], keywords: 'video channel creator' },
  twitch: { name: 'Twitch', icon: 'twitch.png', topics: ['Streaming', 'Video'], keywords: 'livestream live stream' },
  discord: { name: 'Discord', icon: 'discord.png', topics: ['Community'], keywords: 'server chat' },
  reddit: { name: 'Reddit', icon: 'reddit.png', topics: ['Community', 'Marketing'], keywords: 'subreddit forum post' },
  sheets: { name: 'Google Sheets', icon: 'sheets.png', topics: ['Analytics', 'Productivity'], keywords: 'spreadsheet google' },
  notion: { name: 'Notion', icon: 'notion.png', topics: ['Productivity'], keywords: 'docs wiki notes' },
  gmail: { name: 'Gmail', icon: 'gmail.png', topics: ['Marketing', 'Productivity'], keywords: 'email mail google outreach' },
  shopify: { name: 'Shopify', icon: 'shopify.png', topics: ['Monetization', 'Marketing'], keywords: 'store shop merch ecommerce' },
};

// Every automation runs again and again, never once: on a schedule, on each new event, or as a loop that keeps testing
// (its `trigger`). One without such a trigger, a one-off task, is left out of the catalogue.
const RECURRING = new Set(['schedule', 'event', 'loop']);

export const AUTOMATIONS = [
  { id: 'thumbs', title: 'Thumbnail tester', app: 'roblox', topics: ['Analytics'], rating: 4.9, uses: 18200, desc: 'Makes new thumbnails for your game, tests them against your live ones and keeps whichever gets more plays.', trigger: { type: 'loop', when: 'a new test as soon as the last one has a winner' } },
  { id: 'report', title: 'Morning report', app: 'creatorhub', topics: [], rating: 4.7, uses: 12900, desc: 'Every morning, tells you what changed in your plays, playtime and Robux, and why.', trigger: { type: 'schedule', when: 'every morning at 8:00' } },
  { id: 'playtest', title: 'Playtest bot', app: 'unity', topics: ['Testing'], rating: 4.6, uses: 6100, desc: 'Plays each new build of your level hundreds of times and maps where players get stuck or die.', trigger: { type: 'event', when: 'each new build of your level' } },
  { id: 'icon', title: 'Game icon maker', app: 'roblox', topics: [], rating: 4.8, uses: 9600, desc: "Draws icon options from your game's art and keeps the one more players click.", trigger: { type: 'loop', when: 'a new round of icons each time a test ends' } },
  { id: 'updatelog', title: 'Update log writer', app: 'discord', topics: ['Marketing'], rating: 4.8, uses: 6300, desc: 'Writes the notes for each update and posts them in your announcements channel.', trigger: { type: 'event', when: 'each update you publish' } },
  { id: 'reviews', title: 'Review digest', app: 'steam', topics: ['Analytics', 'Community'], rating: 4.8, uses: 6800, desc: 'Reads your new reviews each week and sums up what players love and hate.', trigger: { type: 'schedule', when: 'every Monday at 9:00' } },
  { id: 'revenue', title: 'Revenue sheet', app: 'sheets', topics: ['Monetization'], rating: 4.6, uses: 5600, desc: 'Pulls sales from every store into one sheet and charts them by week.', trigger: { type: 'schedule', when: 'every Monday at 7:00' } },
  { id: 'wishlist', title: 'Wishlist tracker', app: 'steam', topics: ['Analytics'], rating: 4.6, uses: 5200, desc: 'Charts your wishlists every day and tells you which post or festival moved them.', trigger: { type: 'schedule', when: 'every day at 6:00' } },
  { id: 'welcome', title: 'Welcome and roles', app: 'discord', topics: [], rating: 4.5, uses: 4100, desc: 'Greets new members and lets them pick roles for the games and topics they follow.', trigger: { type: 'event', when: 'each new member who joins your server' } },
  { id: 'gamepass', title: 'Game pass pricer', app: 'roblox', topics: [], rating: 4.6, uses: 4200, desc: 'Tries prices on your game passes and keeps the one that earns the most Robux.', trigger: { type: 'loop', when: 'a new price to try every 3 days' } },
  { id: 'builds', title: 'Nightly builds', app: 'unity', topics: ['Testing'], rating: 4.4, uses: 3500, desc: 'Builds your game for PC, phone and console every night and flags what broke.', trigger: { type: 'schedule', when: 'every night at 2:00' } },
  { id: 'gdd', title: 'Design doc keeper', app: 'notion', topics: ['Game design'], rating: 4.5, uses: 3400, desc: 'Keeps your game design doc up to date with every change you make in chat.', trigger: { type: 'event', when: 'each change you make in chat' } },
  { id: 'bugs', title: 'Bug triage', app: 'discord', topics: ['Testing'], rating: 4.4, uses: 3300, desc: 'Collects bug reports from your server and sorts them by how many players hit them.', trigger: { type: 'event', when: 'each new bug report in your server' } },
  { id: 'trends', title: 'Trend scout', app: 'roblox', topics: ['Analytics'], rating: 4.5, uses: 6000, desc: 'Finds games in your genre that grew this month and what they changed.', trigger: { type: 'schedule', when: 'the 1st of every month' } },
  { id: 'devlog', title: 'Devlog poster', app: 'reddit', topics: [], rating: 4.3, uses: 2800, desc: 'Posts your weekly devlog to the right subreddits when they are most active.', trigger: { type: 'schedule', when: 'every Friday when your subreddits are busiest' } },
  { id: 'jam', title: 'Game jam scout', app: 'itch', topics: [], rating: 4.4, uses: 2300, desc: 'Finds upcoming game jams that fit your skills and tracks each deadline.', trigger: { type: 'schedule', when: 'every Monday at 9:00' } },
  { id: 'schedule', title: 'Stream scheduler', app: 'twitch', topics: ['Community'], rating: 4.3, uses: 2100, desc: 'Posts your weekly stream schedule and reminds followers before you go live.', trigger: { type: 'schedule', when: 'every Sunday at 18:00' } },
].filter((a) => RECURRING.has(a.trigger?.type));

// the apps on offer: the ones an automation works in
export const APPS = Object.fromEntries(Object.entries(ALL_APPS).filter(([id]) => AUTOMATIONS.some((a) => a.app === id)));

// each automation's thumbnail and each app's icon, relative to this folder
export const thumbOf = (automation) => `./automations/${automation.id}.webp`;
export const iconOf = (appId) => `./automations/apps/${APPS[appId].icon}`;
