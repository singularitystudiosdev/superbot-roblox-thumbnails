// What the Automations tab offers: superbot automations a game creator can start in one click, each working in one app.
// Only the creative's own two are on offer (its chat is "Keep improving my Roblox thumbnails"): the thumbnail and the
// icon optimizers. Every app carries the topics it serves, so a search for a topic ("game design") finds every app that
// serves it, and the tab offers those apps as categories to pick from. Thumbnails and app icons:
// automations/CREDITS.txt. Ratings and use counts are illustrative, as the creative's figures are. The automations the
// swarms ship (automations-swarm.f2db18c1.js) are no longer shown; tools/automations-swarm.f2db18c1.mjs still checks
// their apps against ALL_APPS.

export const ALL_APPS = {
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
  calendar: { name: 'Google Calendar', icon: 'calendar.png', topics: ['Productivity'], keywords: 'schedule events meetings google' },
  shopify: { name: 'Shopify', icon: 'shopify.png', topics: ['Monetization', 'Marketing'], keywords: 'store shop merch ecommerce' },
};

// Every automation runs again and again, never once: on a schedule, on each new event, or as a loop that keeps testing
// (its `trigger`). One without such a trigger, a one-off task, is left out of the catalogue.
const RECURRING = new Set(['schedule', 'event', 'loop']);

export const AUTOMATIONS = [
  { id: 'thumbs', title: 'Roblox Thumbnail Optimizer', app: 'roblox', topics: ['Analytics'], rating: 4.9, uses: 18200, desc: 'Makes new thumbnails for your game, tests them against your live ones and keeps whichever gets more plays.', trigger: { type: 'loop', when: 'a new test as soon as the last one has a winner' } },
  { id: 'icon', title: 'Roblox Icon Optimizer', app: 'roblox', topics: [], rating: 4.8, uses: 9600, desc: "Draws icon options from your game's art and keeps the one more players click.", trigger: { type: 'loop', when: 'a new round of icons each time a test ends' } },
].filter((a) => RECURRING.has(a.trigger?.type));

// the apps on offer: the ones an automation works in
export const APPS = Object.fromEntries(Object.entries(ALL_APPS).filter(([id]) => AUTOMATIONS.some((a) => a.app === id)));

// each automation's thumbnail and each app's icon, relative to this folder: one the viewer published brings its own
// (published.6c0fd59e.js), and works in any app
export const thumbOf = (automation) => automation.thumb ?? `./automations/${automation.id}.webp`;
export const iconOf = (appId) => `./automations/apps/${ALL_APPS[appId].icon}`;
