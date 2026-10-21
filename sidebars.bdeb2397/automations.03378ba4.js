// What the Automations tab offers: superbot automations a game creator can start in one click, each working in one app.
// The first is the creative's own (its chat is "Keep improving my Roblox thumbnails"). Every app carries the topics it
// serves, so a search for a topic ("game design") finds every app that serves it, and the tab offers those apps as
// categories to pick from. Thumbnails and app icons: automations/CREDITS.txt. Ratings and use counts are illustrative,
// as the creative's figures are.

export const APPS = {
  roblox: { name: 'Roblox', icon: 'roblox.png', topics: ['Game design', 'Marketing', 'Monetization'], keywords: 'roblox studio experience obby' },
  creatorhub: { name: 'Creator Hub', icon: 'creatorhub.png', topics: ['Analytics'], keywords: 'roblox dashboard stats' },
  blender: { name: 'Blender', icon: 'blender.png', topics: ['Game design', '3D art'], keywords: '3d modeling sculpt render mesh' },
  unity: { name: 'Unity', icon: 'unity.png', topics: ['Game design', 'Development'], keywords: 'game engine c# level' },
  unreal: { name: 'Unreal Engine', icon: 'unreal.png', topics: ['Game design', '3D art'], keywords: 'game engine level environment' },
  steam: { name: 'Steam', icon: 'steam.png', topics: ['Game design', 'Marketing'], keywords: 'pc store valve launch' },
  itch: { name: 'itch.io', icon: 'itch.png', topics: ['Game design', 'Community'], keywords: 'indie jam' },
  figma: { name: 'Figma', icon: 'figma.png', topics: ['Design', 'Game design'], keywords: 'ui ux mockup interface' },
  youtube: { name: 'YouTube', icon: 'youtube.png', topics: ['Video', 'Marketing'], keywords: 'video channel creator' },
  twitch: { name: 'Twitch', icon: 'twitch.png', topics: ['Streaming', 'Video'], keywords: 'livestream live stream' },
  discord: { name: 'Discord', icon: 'discord.png', topics: ['Community'], keywords: 'server chat' },
  reddit: { name: 'Reddit', icon: 'reddit.png', topics: ['Community', 'Marketing'], keywords: 'subreddit forum post' },
  sheets: { name: 'Google Sheets', icon: 'sheets.png', topics: ['Analytics', 'Productivity'], keywords: 'spreadsheet google' },
  notion: { name: 'Notion', icon: 'notion.png', topics: ['Productivity'], keywords: 'docs wiki notes' },
  gmail: { name: 'Gmail', icon: 'gmail.png', topics: ['Marketing', 'Productivity'], keywords: 'email mail google outreach' },
  shopify: { name: 'Shopify', icon: 'shopify.png', topics: ['Monetization', 'Marketing'], keywords: 'store shop merch ecommerce' },
};

export const AUTOMATIONS = [
  { id: 'thumbs', title: 'Thumbnail tester', app: 'roblox', topics: ['Analytics'], rating: 4.9, uses: 18200, desc: 'Makes new thumbnails for your game, tests them against your live ones and keeps whichever gets more plays.' },
  { id: 'report', title: 'Morning report', app: 'creatorhub', topics: [], rating: 4.7, uses: 12900, desc: 'Every morning, tells you what changed in your plays, playtime and Robux, and why.' },
  { id: 'storepage', title: 'Store page writer', app: 'steam', topics: [], rating: 4.7, uses: 7300, desc: 'Writes your store description, picks screenshots and sets tags that fit your genre.' },
  { id: 'retopo', title: 'Retopology cleanup', app: 'blender', topics: [], rating: 4.6, uses: 5400, desc: 'Turns a dense sculpt into a clean, game-ready mesh with even quads.' },
  { id: 'playtest', title: 'Playtest bot', app: 'unity', topics: ['Testing'], rating: 4.6, uses: 6100, desc: 'Plays your level hundreds of times and maps where players get stuck or die.' },
  { id: 'icon', title: 'Game icon maker', app: 'roblox', topics: [], rating: 4.8, uses: 9600, desc: "Draws icon options from your game's art and keeps the one more players click." },
  { id: 'trailer', title: 'Trailer cutter', app: 'youtube', topics: [], rating: 4.6, uses: 7400, desc: 'Cuts a 30-second trailer from your gameplay and uploads it to your channel.' },
  { id: 'updatelog', title: 'Update log writer', app: 'discord', topics: ['Marketing'], rating: 4.8, uses: 6300, desc: 'Writes the notes for each update and posts them in your announcements channel.' },
  { id: 'reviews', title: 'Review digest', app: 'steam', topics: ['Analytics', 'Community'], rating: 4.8, uses: 6800, desc: 'Reads your new reviews each week and sums up what players love and hate.' },
  { id: 'hud', title: 'HUD mockups', app: 'figma', topics: [], rating: 4.6, uses: 4400, desc: 'Lays out health bars, minimaps and menus for your game in a shared file.' },
  { id: 'lighting', title: 'Lighting pass', app: 'unreal', topics: [], rating: 4.5, uses: 3100, desc: 'Lights a scene several ways and renders each one for you to pick from.' },
  { id: 'translate', title: 'Page translator', app: 'roblox', topics: ['Localization'], rating: 4.7, uses: 8800, desc: "Translates your game's title and description for players in other countries." },
  { id: 'revenue', title: 'Revenue sheet', app: 'sheets', topics: ['Monetization'], rating: 4.6, uses: 5600, desc: 'Pulls sales from every store into one sheet and charts them by week.' },
  { id: 'turntable', title: 'Turntable renders', app: 'blender', topics: ['Marketing'], rating: 4.7, uses: 4800, desc: 'Renders a spinning showcase of any model for your store page or socials.' },
  { id: 'wishlist', title: 'Wishlist tracker', app: 'steam', topics: ['Analytics'], rating: 4.6, uses: 5200, desc: 'Charts your wishlists every day and tells you which post or festival moved them.' },
  { id: 'welcome', title: 'Welcome and roles', app: 'discord', topics: [], rating: 4.5, uses: 4100, desc: 'Greets new members and lets them pick roles for the games and topics they follow.' },
  { id: 'gamepass', title: 'Game pass pricer', app: 'roblox', topics: [], rating: 4.6, uses: 4200, desc: 'Tries prices on your game passes and keeps the one that earns the most Robux.' },
  { id: 'lods', title: 'LOD maker', app: 'blender', topics: [], rating: 4.5, uses: 3900, desc: 'Makes lower-detail copies of each model so your game runs smoother on phones.' },
  { id: 'youtubers', title: 'YouTuber finder', app: 'youtube', topics: [], rating: 4.4, uses: 3700, desc: 'Finds YouTubers who cover games like yours and writes each one a pitch.' },
  { id: 'builds', title: 'Nightly builds', app: 'unity', topics: ['Testing'], rating: 4.4, uses: 3500, desc: 'Builds your game for PC, phone and console every night and flags what broke.' },
  { id: 'gdd', title: 'Design doc keeper', app: 'notion', topics: ['Game design'], rating: 4.5, uses: 3400, desc: 'Keeps your game design doc up to date with every change you make in chat.' },
  { id: 'bugs', title: 'Bug triage', app: 'discord', topics: ['Testing'], rating: 4.4, uses: 3300, desc: 'Collects bug reports from your server and sorts them by how many players hit them.' },
  { id: 'trends', title: 'Trend scout', app: 'roblox', topics: ['Analytics'], rating: 4.5, uses: 6000, desc: 'Finds games in your genre that grew this month and what they changed.' },
  { id: 'icons', title: 'Icon exporter', app: 'figma', topics: [], rating: 4.5, uses: 3000, desc: 'Exports every icon in your file at the sizes each platform asks for.' },
  { id: 'event', title: 'Event planner', app: 'roblox', topics: [], rating: 4.3, uses: 2900, desc: 'Plans a seasonal event for your game, from the map changes to the badges.' },
  { id: 'devlog', title: 'Devlog poster', app: 'reddit', topics: [], rating: 4.3, uses: 2800, desc: 'Posts your weekly devlog to the right subreddits when they are most active.' },
  { id: 'assets', title: 'Asset organizer', app: 'unity', topics: ['3D art'], rating: 4.3, uses: 2700, desc: 'Sorts and renames imported models, textures and sounds into a tidy project.' },
  { id: 'foliage', title: 'Foliage painter', app: 'unreal', topics: [], rating: 4.4, uses: 2600, desc: 'Fills your terrain with trees, bushes and grass that suit each biome.' },
  { id: 'press', title: 'Press kit outreach', app: 'gmail', topics: [], rating: 4.4, uses: 2500, desc: 'Sends your press kit to writers who cover your genre and follows up once.' },
  { id: 'jam', title: 'Game jam scout', app: 'itch', topics: [], rating: 4.4, uses: 2300, desc: 'Finds upcoming game jams that fit your skills and tracks each deadline.' },
  { id: 'schedule', title: 'Stream scheduler', app: 'twitch', topics: ['Community'], rating: 4.3, uses: 2100, desc: 'Posts your weekly stream schedule and reminds followers before you go live.' },
  { id: 'merch', title: 'Merch drop', app: 'shopify', topics: [], rating: 4.3, uses: 1900, desc: "Puts your game's art on shirts, hoodies and mugs and opens a store for them." },
];

// each automation's thumbnail and each app's icon, relative to this folder
export const thumbOf = (automation) => `./automations/${automation.id}.webp`;
export const iconOf = (appId) => `./automations/apps/${APPS[appId].icon}`;
