// The Automations page's catalogue: example automations superbot runs for you, each tied to one app (apps.6f6580a5.js).
// Its thumbnail previews what it makes (automations-shot-specs.6f6580a5.js); `kind` picks the thumbnail's tint
// (what the automation does: makes, watches, grows, sells, fixes or organizes). `tags` are extra search words.
// Ratings and uses are illustrative.

export const AUTOMATIONS = [
  // ---------- Roblox ----------
  { id: 'rbx-thumb-ab', app: 'roblox', kind: 'make', rating: 4.9, uses: 48200, title: 'Thumbnail A/B tester', desc: 'Makes new thumbnails, tests them on your game and keeps the winner.', tags: 'thumbnails ctr play-through iterations' },
  { id: 'rbx-icon', app: 'roblox', kind: 'make', rating: 4.8, uses: 21900, title: 'Game icon maker', desc: "Draws icon options in your game's style and uploads the one you pick.", tags: 'icon art logo' },
  { id: 'rbx-daily', app: 'roblox', kind: 'watch', rating: 4.7, uses: 33100, title: 'Morning player report', desc: 'Players, play-through and Robux every morning, and what changed overnight.', tags: 'analytics stats ccu revenue robux' },
  { id: 'rbx-pass', app: 'roblox', kind: 'sell', rating: 4.6, uses: 12800, title: 'Game pass pricer', desc: 'Compares passes in games like yours and suggests a price for each of yours.', tags: 'monetization robux vip pricing' },
  { id: 'rbx-log', app: 'roblox', kind: 'grow', rating: 4.5, uses: 9400, title: 'Update log writer', desc: 'Turns a week of changes into an update log your players will actually read.', tags: 'patch notes changelog writing' },
  { id: 'rbx-lag', app: 'roblox', kind: 'fix', rating: 4.6, uses: 7300, title: 'Lag spike finder', desc: 'Watches server stats and points to the script behind each lag spike.', tags: 'performance scripts luau debug' },
  { id: 'rbx-trends', app: 'roblox', kind: 'watch', rating: 4.7, uses: 15600, title: 'Trending games watch', desc: 'Finds games in your genre growing this week and what they changed.', tags: 'research competitors discover' },
  { id: 'rbx-badges', app: 'roblox', kind: 'make', rating: 4.4, uses: 6100, title: 'Badge set designer', desc: "Makes a matching set of badge icons for every milestone in your game.", tags: 'badges art achievements' },
  { id: 'rbx-event', app: 'roblox', kind: 'grow', rating: 4.5, uses: 5200, title: 'Weekend event planner', desc: 'Plans a limited-time event, writes its rewards and schedules the announcement.', tags: 'live ops events retention' },
  { id: 'rbx-ugc', app: 'roblox', kind: 'sell', rating: 4.3, uses: 4800, title: 'UGC item launcher', desc: "Turns your game's art into UGC accessories and lists them in the catalog.", tags: 'ugc avatar items marketplace' },

  // ---------- Unity ----------
  { id: 'uni-build', app: 'unity', kind: 'fix', rating: 4.7, uses: 9800, title: 'Build and ship to Steam', desc: 'Builds every platform on each commit and uploads it to your Steam branch.', tags: 'ci builds deploy release' },
  { id: 'uni-crash', app: 'unity', kind: 'fix', rating: 4.6, uses: 7700, title: 'Crash log triage', desc: 'Groups player crash logs by cause and opens an issue for each new one.', tags: 'bugs crashes errors' },
  { id: 'uni-assets', app: 'unity', kind: 'watch', rating: 4.2, uses: 3900, title: 'Asset Store scout', desc: 'Finds Asset Store packs that fit your game and tells you when they go on sale.', tags: 'assets deals plugins' },
  { id: 'uni-playtest', app: 'unity', kind: 'organize', rating: 4.5, uses: 5400, title: 'Playtest notes to tasks', desc: 'Watches playtest recordings and turns what testers say into tasks.', tags: 'feedback qa testing' },

  // ---------- Unreal Engine ----------
  { id: 'ue-light', app: 'unrealengine', kind: 'organize', rating: 4.3, uses: 3300, title: 'Lighting build watcher', desc: "Rebuilds lighting when a map changes and pings you when it's done.", tags: 'lighting maps builds' },
  { id: 'ue-tidy', app: 'unrealengine', kind: 'fix', rating: 4.4, uses: 2900, title: 'Unused asset sweeper', desc: 'Finds Blueprints and assets nothing references and lists what is safe to cut.', tags: 'cleanup blueprints size' },
  { id: 'ue-shots', app: 'unrealengine', kind: 'make', rating: 4.5, uses: 4100, title: 'Cinematic shot list', desc: 'Turns a script into a Sequencer shot list with camera notes per shot.', tags: 'cinematics sequencer trailer' },

  // ---------- Godot ----------
  { id: 'gd-jam', app: 'godotengine', kind: 'make', rating: 4.7, uses: 6800, title: 'Game jam starter', desc: 'Sets up a Godot project with menus, saves and input before the jam starts.', tags: 'template jam prototype gdscript' },
  { id: 'gd-export', app: 'godotengine', kind: 'fix', rating: 4.5, uses: 3700, title: 'Export to every platform', desc: 'Exports web, Windows, Mac and Linux builds and uploads them to itch.io.', tags: 'builds release deploy' },
  { id: 'gd-shader', app: 'godotengine', kind: 'make', rating: 4.4, uses: 2600, title: 'Shader from a reference', desc: 'Writes a shader that matches a screenshot or clip you point it at.', tags: 'shaders vfx effects' },

  // ---------- Blender ----------
  { id: 'bl-lowpoly', app: 'blender', kind: 'make', rating: 4.6, uses: 11200, title: 'Low-poly prop batch', desc: 'Turns a list of props into low-poly models ready for Roblox or Unity.', tags: '3d modeling assets props' },
  { id: 'bl-render', app: 'blender', kind: 'organize', rating: 4.5, uses: 8900, title: 'Overnight render queue', desc: 'Queues your scenes, renders them overnight and posts the stills by 8 AM.', tags: 'rendering cycles eevee' },
  { id: 'bl-uv', app: 'blender', kind: 'fix', rating: 4.3, uses: 4700, title: 'UV and export cleanup', desc: 'Unwraps, packs and exports every model in a folder as FBX.', tags: 'uv export fbx 3d' },
  { id: 'bl-turntable', app: 'blender', kind: 'make', rating: 4.6, uses: 6600, title: 'Turntable video maker', desc: 'Renders a 360 turntable of any model for your portfolio or store page.', tags: 'portfolio video 3d' },

  // ---------- Steam ----------
  { id: 'st-wish', app: 'steam', kind: 'watch', rating: 4.8, uses: 14300, title: 'Wishlist tracker', desc: 'Tracks wishlists daily and tells you which post or festival moved them.', tags: 'wishlists analytics launch' },
  { id: 'st-page', app: 'steam', kind: 'grow', rating: 4.5, uses: 8100, title: 'Store page writer', desc: 'Writes your short and long descriptions and picks tags from your trailer.', tags: 'store page copy seo' },
  { id: 'st-reviews', app: 'steam', kind: 'grow', rating: 4.6, uses: 10400, title: 'Review responder', desc: 'Drafts replies to new Steam reviews in your voice, for you to approve.', tags: 'reviews community support' },
  { id: 'st-sale', app: 'steam', kind: 'sell', rating: 4.4, uses: 5100, title: 'Seasonal sale planner', desc: 'Picks a discount for each seasonal sale from how similar games priced theirs.', tags: 'discounts pricing sales' },

  // ---------- itch.io ----------
  { id: 'itch-devlog', app: 'itchdotio', kind: 'grow', rating: 4.4, uses: 3200, title: 'Devlog poster', desc: 'Writes a devlog from your commits and posts it with fresh screenshots.', tags: 'devlog blog updates' },
  { id: 'itch-jams', app: 'itchdotio', kind: 'organize', rating: 4.6, uses: 4500, title: 'Game jam finder', desc: 'Lists upcoming jams that fit your skills and adds them to your calendar.', tags: 'jams events calendar' },

  // ---------- Aseprite ----------
  { id: 'ase-sheets', app: 'aseprite', kind: 'organize', rating: 4.6, uses: 5100, title: 'Sprite sheet packer', desc: 'Packs every animation into sprite sheets with frame data for your engine.', tags: 'pixel art sprites animation 2d' },
  { id: 'ase-palette', app: 'aseprite', kind: 'make', rating: 4.5, uses: 3400, title: 'Palette swap variants', desc: 'Makes color variants of each sprite for skins, teams or enemy tiers.', tags: 'pixel art colors skins 2d' },

  // ---------- YouTube ----------
  { id: 'yt-shorts', app: 'youtube', kind: 'make', rating: 4.8, uses: 52300, title: 'Shorts from long videos', desc: 'Cuts your best moments into Shorts with captions and posts them for you.', tags: 'shorts clips editing captions' },
  { id: 'yt-titles', app: 'youtube', kind: 'grow', rating: 4.7, uses: 31800, title: 'Title and thumbnail tester', desc: 'Tests titles and thumbnails on each upload and keeps the one with more views.', tags: 'thumbnails ctr titles' },
  { id: 'yt-comments', app: 'youtube', kind: 'watch', rating: 4.5, uses: 18700, title: 'Comment digest', desc: 'Sums up new comments each day: questions, video ideas and complaints.', tags: 'comments community feedback' },
  { id: 'yt-chapters', app: 'youtube', kind: 'organize', rating: 4.6, uses: 22400, title: 'Chapters and description', desc: 'Adds chapters, links and tags to every upload from its transcript.', tags: 'seo chapters description' },
  { id: 'yt-creators', app: 'youtube', kind: 'grow', rating: 4.5, uses: 9600, title: 'Creator finder', desc: 'Finds YouTubers who cover games like yours, with their business emails.', tags: 'influencers outreach marketing' },

  // ---------- Twitch ----------
  { id: 'tw-clips', app: 'twitch', kind: 'make', rating: 4.6, uses: 13900, title: 'Stream highlight reel', desc: 'Saves the best clips of every stream and stitches them into a highlight reel.', tags: 'clips highlights vods' },
  { id: 'tw-schedule', app: 'twitch', kind: 'organize', rating: 4.4, uses: 6200, title: 'Schedule poster', desc: 'Posts your stream schedule to Discord and X every Monday morning.', tags: 'schedule announcements' },
  { id: 'tw-mod', app: 'twitch', kind: 'fix', rating: 4.5, uses: 8700, title: 'Chat mod helper', desc: 'Flags spam and slurs in chat and keeps a log your mods can review.', tags: 'moderation chat safety' },

  // ---------- Kick ----------
  { id: 'kick-multi', app: 'kick', kind: 'grow', rating: 4.2, uses: 3100, title: 'Go-live everywhere', desc: 'Tells your Discord and X followers the moment you go live on Kick.', tags: 'live alerts notifications' },

  // ---------- OBS Studio ----------
  { id: 'obs-scenes', app: 'obsstudio', kind: 'organize', rating: 4.3, uses: 4800, title: 'Auto scene switcher', desc: 'Switches scenes when your game, mic or camera changes.', tags: 'scenes streaming setup' },
  { id: 'obs-rec', app: 'obsstudio', kind: 'make', rating: 4.4, uses: 3600, title: 'Auto recorder', desc: 'Starts recording when your game launches and names each file by session.', tags: 'recording gameplay capture' },

  // ---------- DaVinci Resolve ----------
  { id: 'dv-rough', app: 'davinciresolve', kind: 'make', rating: 4.6, uses: 7200, title: 'Rough cut assembler', desc: 'Lines your takes up on a timeline and cuts the silences between them.', tags: 'editing timeline video' },
  { id: 'dv-color', app: 'davinciresolve', kind: 'fix', rating: 4.2, uses: 2800, title: 'Color match across cameras', desc: 'Matches color across clips shot on different cameras and phones.', tags: 'color grading editing' },

  // ---------- Instagram ----------
  { id: 'ig-carousel', app: 'instagram', kind: 'make', rating: 4.5, uses: 11300, title: 'Carousel maker', desc: 'Turns a blog post or update log into a 7-slide carousel.', tags: 'carousel posts graphics' },
  { id: 'ig-dms', app: 'instagram', kind: 'grow', rating: 4.3, uses: 7900, title: 'DM auto-replies', desc: 'Answers common DMs in your voice and hands the rest to you.', tags: 'dms messages support' },

  // ---------- X ----------
  { id: 'x-thread', app: 'x', kind: 'grow', rating: 4.4, uses: 9100, title: 'Thread writer', desc: 'Turns your update log into a thread with the clips attached.', tags: 'twitter threads posts' },
  { id: 'x-mentions', app: 'x', kind: 'watch', rating: 4.6, uses: 12700, title: 'Mention watch', desc: 'Alerts you when someone posts about your game, with a link to the post.', tags: 'twitter mentions alerts' },

  // ---------- Threads ----------
  { id: 'th-cross', app: 'threads', kind: 'grow', rating: 4.1, uses: 2400, title: 'Cross-poster', desc: 'Reposts your X posts to Threads, reformatted to fit.', tags: 'crosspost social' },

  // ---------- Reddit ----------
  { id: 'rd-subs', app: 'reddit', kind: 'grow', rating: 4.5, uses: 8400, title: 'Subreddit finder', desc: 'Finds subreddits where your players hang out, with each one\'s posting rules.', tags: 'communities marketing research' },
  { id: 'rd-feedback', app: 'reddit', kind: 'watch', rating: 4.6, uses: 6900, title: 'Feedback miner', desc: 'Collects what players say about your game across Reddit every week.', tags: 'feedback sentiment research' },

  // ---------- Discord ----------
  { id: 'dc-welcome', app: 'discord', kind: 'organize', rating: 4.7, uses: 17600, title: 'Welcome and roles', desc: 'Greets new members, asks what they play and gives them the right roles.', tags: 'onboarding roles bot community' },
  { id: 'dc-patch', app: 'discord', kind: 'grow', rating: 4.6, uses: 13200, title: 'Patch notes poster', desc: 'Posts each update to your announcements channel with images.', tags: 'announcements updates' },
  { id: 'dc-bugs', app: 'discord', kind: 'fix', rating: 4.5, uses: 9300, title: 'Bug report sorter', desc: 'Turns bug reports posted in a channel into tracked, deduplicated issues.', tags: 'bugs support qa' },
  { id: 'dc-giveaway', app: 'discord', kind: 'grow', rating: 4.4, uses: 7400, title: 'Giveaway runner', desc: 'Runs a giveaway, picks winners fairly and messages each of them.', tags: 'giveaway community events' },

  // ---------- Telegram ----------
  { id: 'tg-alerts', app: 'telegram', kind: 'watch', rating: 4.3, uses: 6600, title: 'Alert router', desc: 'Sends errors, sales and new reviews to your phone as they happen.', tags: 'alerts notifications mobile' },

  // ---------- Figma ----------
  { id: 'fg-ui', app: 'figma', kind: 'make', rating: 4.5, uses: 5900, title: 'Frames to Roblox UI', desc: 'Exports your frames as Roblox UI with the right sizes and anchors.', tags: 'ui design roblox gui' },
  { id: 'fg-mockups', app: 'figma', kind: 'make', rating: 4.4, uses: 4300, title: 'Screenshot mockups', desc: 'Places your game screenshots into store and device mockups.', tags: 'mockups marketing screenshots' },
  { id: 'fg-qa', app: 'figma', kind: 'fix', rating: 4.3, uses: 3100, title: 'Design QA pass', desc: 'Checks frames for off-grid spacing, missing styles and low contrast.', tags: 'qa accessibility review' },

  // ---------- Krita ----------
  { id: 'kr-concept', app: 'krita', kind: 'make', rating: 4.4, uses: 2900, title: 'Concept art board', desc: 'Collects references for a scene and lays them out on one canvas to paint from.', tags: 'concept art references painting' },

  // ---------- Photopea ----------
  { id: 'pp-resize', app: 'photopea', kind: 'fix', rating: 4.4, uses: 6300, title: 'Every-size resizer', desc: 'Resizes one image for every store, social and ad size you need.', tags: 'resize images banners' },

  // ---------- Spotify ----------
  { id: 'sp-pitch', app: 'spotify', kind: 'grow', rating: 4.4, uses: 5600, title: 'Playlist pitcher', desc: 'Finds playlists that fit your track and drafts a pitch to each curator.', tags: 'playlists promotion music' },
  { id: 'sp-release', app: 'spotify', kind: 'watch', rating: 4.3, uses: 4200, title: 'Release day tracker', desc: 'Tracks streams and saves for a new release, day by day.', tags: 'streams analytics music' },

  // ---------- SoundCloud ----------
  { id: 'sc-upload', app: 'soundcloud', kind: 'organize', rating: 4.2, uses: 2700, title: 'Track uploader', desc: 'Uploads finished mixes with artwork, tags and a description.', tags: 'upload music publishing' },

  // ---------- Bandcamp ----------
  { id: 'bc-ost', app: 'bandcamp', kind: 'sell', rating: 4.5, uses: 2300, title: 'Soundtrack store', desc: "Puts your game's soundtrack up for sale with art and track notes.", tags: 'ost soundtrack sell music' },

  // ---------- Audacity ----------
  { id: 'au-loops', app: 'audacity', kind: 'make', rating: 4.6, uses: 4900, title: 'Seamless loop cutter', desc: 'Cuts your tracks into seamless loops for menus and levels.', tags: 'loops music game audio' },
  { id: 'au-voice', app: 'audacity', kind: 'fix', rating: 4.5, uses: 3800, title: 'Voice line cleanup', desc: 'Removes noise, levels volume and names every voice line file.', tags: 'voice dialogue audio sfx' },

  // ---------- GitHub ----------
  { id: 'gh-review', app: 'github', kind: 'fix', rating: 4.8, uses: 28700, title: 'Pull request reviewer', desc: 'Reviews each pull request and comments on bugs before you merge.', tags: 'code review pr bugs' },
  { id: 'gh-notes', app: 'github', kind: 'make', rating: 4.6, uses: 15200, title: 'Release notes writer', desc: 'Writes release notes from merged pull requests and tags the release.', tags: 'release changelog' },
  { id: 'gh-labels', app: 'github', kind: 'organize', rating: 4.5, uses: 11800, title: 'Issue labeler', desc: 'Labels and assigns new issues and closes the duplicates.', tags: 'issues triage' },

  // ---------- Vercel ----------
  { id: 'vc-deploy', app: 'vercel', kind: 'watch', rating: 4.6, uses: 7600, title: 'Deploy watcher', desc: 'Checks every deploy and rolls back when the site starts erroring.', tags: 'deploys website uptime' },

  // ---------- Linear ----------
  { id: 'ln-standup', app: 'linear', kind: 'organize', rating: 4.5, uses: 8300, title: 'Async standup', desc: 'Posts what moved in Linear each morning, grouped by teammate.', tags: 'standup team sprint' },
  { id: 'ln-roadmap', app: 'linear', kind: 'organize', rating: 4.4, uses: 4600, title: 'Feedback to roadmap', desc: 'Turns player feedback into ranked issues on your roadmap.', tags: 'roadmap feedback planning' },

  // ---------- Shopify ----------
  { id: 'sh-merch', app: 'shopify', kind: 'sell', rating: 4.5, uses: 6700, title: 'Merch store launcher', desc: "Sets up a merch store with your game's art on shirts, mugs and stickers.", tags: 'merch store print on demand' },
  { id: 'sh-stock', app: 'shopify', kind: 'watch', rating: 4.4, uses: 5300, title: 'Low stock alerts', desc: 'Warns you before a product runs out and drafts the reorder.', tags: 'inventory stock' },
  { id: 'sh-cart', app: 'shopify', kind: 'sell', rating: 4.6, uses: 9900, title: 'Abandoned cart emails', desc: 'Sends a reminder when a buyer leaves items sitting in their cart.', tags: 'email recovery checkout' },

  // ---------- Stripe ----------
  { id: 'str-digest', app: 'stripe', kind: 'watch', rating: 4.7, uses: 10500, title: 'Revenue digest', desc: 'A weekly summary of sales, refunds and new customers.', tags: 'revenue payments finance' },
  { id: 'str-dunning', app: 'stripe', kind: 'sell', rating: 4.5, uses: 6100, title: 'Failed payment chaser', desc: 'Retries failed payments and asks customers to update their card.', tags: 'payments subscriptions churn' },

  // ---------- Etsy ----------
  { id: 'et-listings', app: 'etsy', kind: 'sell', rating: 4.3, uses: 4400, title: 'Listing writer', desc: 'Writes titles, tags and descriptions for new listings from your photos.', tags: 'listings seo shop' },

  // ---------- Gumroad ----------
  { id: 'gr-packs', app: 'gumroad', kind: 'sell', rating: 4.5, uses: 3500, title: 'Asset pack seller', desc: 'Packages your models and sprites and lists them for sale.', tags: 'assets sell packs' },

  // ---------- Patreon ----------
  { id: 'pt-posts', app: 'patreon', kind: 'sell', rating: 4.4, uses: 3900, title: 'Supporter early access', desc: 'Posts each new build to your Patreon tiers a week before the public.', tags: 'supporters membership early access' },

  // ---------- Notion ----------
  { id: 'no-gdd', app: 'notion', kind: 'organize', rating: 4.7, uses: 16900, title: 'Game design doc builder', desc: 'Turns scattered notes into a design doc with loops, mechanics and economy.', tags: 'gdd game design docs planning' },
  { id: 'no-meetings', app: 'notion', kind: 'organize', rating: 4.5, uses: 13400, title: 'Meeting notes to tasks', desc: 'Turns meeting notes into tasks with an owner and a due date each.', tags: 'meetings tasks notes' },
  { id: 'no-content', app: 'notion', kind: 'organize', rating: 4.6, uses: 12100, title: 'Content calendar', desc: 'Plans a month of posts across your channels on one board.', tags: 'content planning social' },

  // ---------- Gmail ----------
  { id: 'gm-triage', app: 'gmail', kind: 'organize', rating: 4.6, uses: 26300, title: 'Inbox triage', desc: 'Sorts mail into reply, read later and ignore, and drafts the replies.', tags: 'email inbox' },
  { id: 'gm-sponsors', app: 'gmail', kind: 'sell', rating: 4.4, uses: 7100, title: 'Sponsor reply drafts', desc: 'Drafts replies to brand deal emails with your rates attached.', tags: 'sponsors brand deals email' },

  // ---------- Google Sheets ----------
  { id: 'gs-stats', app: 'googlesheets', kind: 'watch', rating: 4.5, uses: 8200, title: 'Game stats to a sheet', desc: "Copies your game's daily stats into a sheet with charts that update.", tags: 'spreadsheet analytics data' },
  { id: 'gs-economy', app: 'googlesheets', kind: 'fix', rating: 4.6, uses: 5800, title: 'Economy balancer', desc: "Simulates your game's currency and flags the prices that break it.", tags: 'economy balancing game design' },

  // ---------- Google Calendar ----------
  { id: 'gc-focus', app: 'googlecalendar', kind: 'organize', rating: 4.3, uses: 7400, title: 'Focus time blocker', desc: 'Blocks focus time around your meetings so you can build.', tags: 'calendar schedule focus' },

  // ---------- Trello ----------
  { id: 'tr-board', app: 'trello', kind: 'organize', rating: 4.4, uses: 5200, title: 'Sprint board from a brief', desc: 'Turns a feature brief into a board of cards with checklists.', tags: 'tasks board planning sprint' },

  // ---------- Mailchimp ----------
  { id: 'mc-news', app: 'mailchimp', kind: 'grow', rating: 4.5, uses: 8800, title: 'Newsletter from updates', desc: 'Writes a newsletter from your recent updates and sends it to players.', tags: 'newsletter email marketing' },
  { id: 'mc-winback', app: 'mailchimp', kind: 'grow', rating: 4.4, uses: 5000, title: 'Win-back campaign', desc: "Emails players who stopped playing with what's new since they left.", tags: 'retention email churn' },

  // ---------- Substack ----------
  { id: 'ss-digest', app: 'substack', kind: 'grow', rating: 4.3, uses: 3300, title: 'Monthly dev digest', desc: 'Writes a monthly post from your devlogs, commits and stats.', tags: 'newsletter blog writing' },

  // ---------- Google Analytics ----------
  { id: 'ga-anomaly', app: 'googleanalytics', kind: 'watch', rating: 4.5, uses: 9200, title: 'Traffic drop alerts', desc: 'Alerts you when traffic spikes or drops and says which source moved.', tags: 'traffic analytics alerts' },
  { id: 'ga-weekly', app: 'googleanalytics', kind: 'watch', rating: 4.4, uses: 7000, title: 'Weekly site report', desc: 'A plain-English summary of visits, sources and sign-ups every Monday.', tags: 'report analytics website' },
];
