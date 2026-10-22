// What each automation's thumbnail shows: a small preview of what that automation makes or does, by template
// (automations-shots.6f6580a5.js draws them). Images are ROB IT's own (IMG keys); `fx` names a Fluent 3D emoji;
// `app` an app's glyph. All names, numbers and text in the previews are illustrative.

export const SHOTS = {
  // ---------- Roblox ----------
  'rbx-thumb-ab': { t: 'pair', a: { img: 'goldVault', label: '0.58% play-through' }, b: { img: 'iter3', label: '1.12% play-through' }, win: 'b' },
  'rbx-icon': { t: 'gallery', shape: 'square', items: [{ img: 'icon' }, { img: 'iter5' }, { img: 'cashGrab' }, { img: 'iter6' }], pick: 1 },
  'rbx-daily': { t: 'chart', label: 'Players today', value: '3,266', delta: '+12% vs yesterday', trend: 'up', kind: 'line' },
  'rbx-pass': { t: 'list', lead: 'fx', title: 'Suggested prices', rows: [{ fx: 'crown', name: 'VIP pass', old: 'R$ 99', value: 'R$ 149' }, { fx: 'money_bag', name: '2x cash', old: 'R$ 199', value: 'R$ 249' }, { fx: 'rocket', name: 'Fast getaway', value: 'R$ 75' }] },
  'rbx-log': { t: 'doc', title: 'Update 1.4: The Museum Job', lines: ['New: a laser grid in the dino hall', 'Vault doors open 2x faster on mobile', 'Fixed: guards stuck on the stairs'] },
  'rbx-lag': { t: 'chart', label: 'Server frame time', value: '48 ms', delta: 'Cause: VaultDoor.lua:112', trend: 'spike', kind: 'line' },
  'rbx-trends': { t: 'list', lead: 'img', title: 'Growing this week', rows: [{ img: 'gDig', name: 'Digging sim', value: '+184%', tone: 'ok' }, { img: 'gPrison', name: 'Prison escape', value: '+92%', tone: 'ok' }, { img: 'gChase', name: 'Car chase', value: '+61%', tone: 'ok' }] },
  'rbx-badges': { t: 'gallery', shape: 'circle', items: [{ img: 'badge1' }, { img: 'badge5' }, { img: 'badge10' }] },
  'rbx-event': { t: 'cal', title: 'Halloween weekend', days: ['Fri', 'Sat', 'Sun'], ev: [[0, 'Pumpkins spawn 6 PM'], [1, 'Double loot'], [2, 'Haunted vault boss']] },
  'rbx-ugc': { t: 'list', lead: 'fx', title: 'Listed in the catalog', rows: [{ fx: 't-shirt', name: 'Striped heist tee', value: 'R$ 45' }, { fx: 'money_bag', name: 'Loot bag', value: 'R$ 60' }, { fx: 'crown', name: 'Vault crown', value: 'R$ 120' }] },

  // ---------- Unity ----------
  'uni-build': { t: 'list', lead: 'file', title: 'Build 214', rows: [{ name: 'Windows', value: 'Uploaded', tone: 'ok' }, { name: 'macOS', value: 'Uploaded', tone: 'ok' }, { name: 'Steam Deck', value: 'Uploading' }] },
  'uni-crash': { t: 'list', lead: 'fx', title: 'Crashes by cause', rows: [{ fx: 'lady_beetle', name: 'NullReference in VaultDoor', value: '212', tone: 'bad' }, { fx: 'lady_beetle', name: 'Out of memory on Switch', value: '48' }, { fx: 'lady_beetle', name: 'Shader compile hang', value: '9' }] },
  'uni-assets': { t: 'list', lead: 'fx', title: 'On sale and a fit', rows: [{ fx: 'brick', name: 'Low Poly Heist Pack', old: '$40', value: '$12', tone: 'ok' }, { fx: 'sparkles', name: 'Toon VFX', old: '$25', value: '$9', tone: 'ok' }, { fx: 'shield', name: 'Guard AI Kit', old: '$30', value: '$15', tone: 'ok' }] },
  'uni-playtest': { t: 'list', lead: 'check', title: 'From playtest 6', rows: [{ name: 'Vault timer feels too short', sub: 'Tester 3, 04:12' }, { name: 'Exit is hard to find', sub: 'Tester 1, 09:40' }, { name: 'Wants a sprint button', sub: 'Tester 5, 02:05' }] },

  // ---------- Unreal Engine ----------
  'ue-light': { t: 'list', lead: 'fx', title: 'Lighting builds', rows: [{ fx: 'light_bulb', name: 'Museum_Main', value: 'Built 4:12', tone: 'ok' }, { fx: 'light_bulb', name: 'Vault_B2', value: '62%' }, { fx: 'light_bulb', name: 'Rooftop', value: 'Queued' }] },
  'ue-tidy': { t: 'list', lead: 'file', title: 'Nothing uses these', rows: [{ name: 'BP_OldDoor', value: '0 refs' }, { name: 'T_Guard_4k', value: '64 MB' }, { name: 'SM_Crate_v1', value: '0 refs' }], foot: 'Safe to cut: 1.2 GB' },
  'ue-shots': { t: 'list', lead: 'img', title: 'Shot list', rows: [{ img: 'museum', name: '1. Wide', sub: 'Dolly in on the hall' }, { img: 'iter4', name: '2. Medium', sub: 'Thief grabs the bag' }, { img: 'iter6', name: '3. Close', sub: 'The diamond, lit' }] },

  // ---------- Godot ----------
  'gd-jam': { t: 'list', lead: 'file', title: 'jam_project/', rows: [{ name: 'main_menu.tscn', value: 'Ready', tone: 'ok' }, { name: 'save_system.gd', value: 'Ready', tone: 'ok' }, { name: 'input_map.tres', value: 'Ready', tone: 'ok' }] },
  'gd-export': { t: 'list', lead: 'file', title: 'Export: ROB IT 0.9', rows: [{ name: 'Web (HTML5)', value: 'On itch.io', tone: 'ok' }, { name: 'Windows, macOS', value: 'On itch.io', tone: 'ok' }, { name: 'Linux', value: 'On itch.io', tone: 'ok' }] },
  'gd-shader': { t: 'pair', a: { img: 'iter3', label: 'Reference' }, b: { img: 'iter3', label: 'Your shader', filter: 'saturate(1.9) contrast(1.35) hue-rotate(-18deg)' } },

  // ---------- Blender ----------
  'bl-lowpoly': { t: 'gallery', shape: 'square', items: [{ fx: 'package', cap: '96 tris' }, { fx: 'brick', cap: '120 tris' }, { fx: 'gem_stone', cap: '64 tris' }, { fx: 'trophy', cap: '210 tris' }] },
  'bl-render': { t: 'list', lead: 'img', title: 'Rendered overnight', rows: [{ img: 'vaultHeist', name: 'vault_wide.png', value: '2:14 AM' }, { img: 'museum', name: 'museum_hall.png', value: '3:40 AM' }, { img: 'goldVault', name: 'getaway.png', value: '5:02 AM' }] },
  'bl-uv': { t: 'list', lead: 'file', title: 'props/ to FBX', rows: [{ name: 'crate.fbx', value: 'UVs packed', tone: 'ok' }, { name: 'vault_door.fbx', value: 'UVs packed', tone: 'ok' }, { name: 'diamond.fbx', value: 'UVs packed', tone: 'ok' }] },
  'bl-turntable': { t: 'gallery', shape: 'square', label: '360°', items: [{ img: 'avatar' }, { img: 'avatar', style: 'transform:scaleX(.45)' }, { img: 'avatar', style: 'transform:scaleX(-1)' }, { img: 'avatar', style: 'transform:scaleX(-.45)' }] },

  // ---------- Steam ----------
  'st-wish': { t: 'chart', label: 'Wishlists', value: '12,480', delta: '+1,240 after Next Fest', trend: 'up', kind: 'bars' },
  'st-page': { t: 'doc', title: 'ROB IT', lines: ['Plan the heist, crack the vault and get out before the guards wake up.'], tags: ['Heist', 'Co-op', 'Stealth'] },
  'st-reviews': { t: 'msg', rows: [{ init: 'K', who: 'Recommended', text: 'Love the museum map. More vaults please!' }, { app: 'steam', who: 'Your reply', text: 'Two new vaults land in 1.5. Thank you!', me: true, tag: 'Draft' }] },
  'st-sale': { t: 'list', lead: 'fx', title: 'Discounts', rows: [{ fx: 'label', name: 'Autumn Sale', value: '-25%' }, { fx: 'label', name: 'Winter Sale', value: '-35%' }, { fx: 'label', name: 'Spring Sale', value: '-30%' }] },

  // ---------- itch.io ----------
  'itch-devlog': { t: 'doc', img: 'iter4', title: 'Devlog 12: the laser hall', lines: ['14 commits, 3 new screenshots'] },
  'itch-jams': { t: 'list', lead: 'fx', title: 'Jams that fit you', rows: [{ fx: 'spiral_calendar', name: 'GMTK Game Jam', sub: '48 hours', value: 'Added', tone: 'ok' }, { fx: 'spiral_calendar', name: 'Brackeys Jam', sub: '1 week', value: 'Added', tone: 'ok' }, { fx: 'spiral_calendar', name: 'Ludum Dare', sub: '72 hours', value: 'Added', tone: 'ok' }] },

  // ---------- Aseprite ----------
  'ase-sheets': { t: 'gallery', shape: 'sheet', label: '8 frames, 64 px', items: Array.from({ length: 8 }, (_, i) => ({ img: 'avatar', style: `transform:translateY(${[0, -6, -10, -6, 0, 4, 6, 4][i]}%)` })) },
  'ase-palette': { t: 'gallery', shape: 'square', items: [{ img: 'avatar' }, { img: 'avatar', style: 'filter:hue-rotate(110deg)' }, { img: 'avatar', style: 'filter:hue-rotate(200deg)' }, { img: 'avatar', style: 'filter:grayscale(1) contrast(1.2)' }] },

  // ---------- YouTube ----------
  'yt-shorts': { t: 'clips', img: 'vaultCrew', cap: 'They took the WHOLE vault' },
  'yt-titles': { t: 'pair', a: { img: 'cashGrab', title: 'I robbed a museum', label: '4.1% CTR' }, b: { img: 'diamondCash', title: 'The $9,413,241 heist', label: '7.9% CTR' }, win: 'b' },
  'yt-comments': { t: 'list', lead: 'fx', title: "Today's 212 comments", rows: [{ fx: 'thought_balloon', name: 'Questions', sub: '"Is it on mobile?"', value: '14' }, { fx: 'light_bulb', name: 'Video ideas', sub: '"Do a no-alarm run"', value: '9' }, { fx: 'fire', name: 'Complaints', sub: '"Audio too loud"', value: '3', tone: 'bad' }] },
  'yt-chapters': { t: 'doc', title: 'Chapters', lines: ['0:00 The plan', '1:42 Cracking the vault', '4:10 The getaway'] },
  'yt-creators': { t: 'list', lead: 'init', title: 'Cover heist games', rows: [{ init: 'H', name: 'HeistHub', sub: '410K subscribers', value: 'Email found', tone: 'ok' }, { init: 'B', name: 'BloxPlays', sub: '1.2M subscribers', value: 'Email found', tone: 'ok' }, { init: 'V', name: 'VaultRuns', sub: '88K subscribers', value: 'Email found', tone: 'ok' }] },

  // ---------- Twitch ----------
  'tw-clips': { t: 'timeline', label: 'Highlights, 2:40', imgs: ['iter2', 'vaultDial', 'diamondRope', 'iter4'] },
  'tw-schedule': { t: 'cal', title: 'This week', days: ['Mon', 'Wed', 'Fri'], ev: [[0, 'Heist runs 7 PM'], [1, 'Building vault 3, 7 PM'], [2, 'Viewer games 8 PM']] },
  'tw-mod': { t: 'msg', rows: [{ init: 'S', who: 'spam_bot', text: 'FREE ROBUX at bit.ly/...', tag: 'Removed', bad: true }, { init: 'H', who: 'heistfan', text: 'that vault run was so clean' }] },

  // ---------- Kick ----------
  'kick-multi': { t: 'alert', rows: [{ app: 'discord', title: 'ROB IT is live on Kick', text: 'Museum heist speedruns', time: 'now' }, { app: 'x', title: 'Live now on Kick', text: 'kick.com/robit', time: 'now' }] },

  // ---------- OBS Studio ----------
  'obs-scenes': { t: 'list', lead: 'fx', title: 'Scenes', rows: [{ fx: 'joystick', name: 'Gameplay', sub: 'ROB IT is focused', value: 'Live', tone: 'bad' }, { fx: 'video_camera', name: 'Just chatting', value: '' }, { fx: 'alarm_clock', name: 'Be right back', value: '' }] },
  'obs-rec': { t: 'list', lead: 'img', title: 'Recordings', rows: [{ img: 'iter2', name: 'ROBIT_session_14.mkv', value: '1h 12m' }, { img: 'vaultDial', name: 'ROBIT_session_13.mkv', value: '48m' }, { img: 'sleepGuard', name: 'ROBIT_session_12.mkv', value: '1h 30m' }] },

  // ---------- DaVinci Resolve ----------
  'dv-rough': { t: 'timeline', label: '42 silences cut', imgs: ['vaultHeist', 'iter1', 'museum', 'iter5'] },
  'dv-color': { t: 'pair', a: { img: 'sleepGuard', label: 'Phone', filter: 'sepia(.55) saturate(.7) brightness(1.08)' }, b: { img: 'sleepGuard', label: 'Matched to camera' } },

  // ---------- Instagram ----------
  'ig-carousel': { t: 'gallery', shape: 'portrait', label: '1 of 7', items: [{ img: 'iter4' }, { img: 'diamondRope' }, { img: 'halloween' }] },
  'ig-dms': { t: 'msg', rows: [{ init: 'B', who: '@bloxfan', text: 'is it on mobile??' }, { app: 'instagram', who: 'You', text: 'Yes! iPhone and Android.', me: true, tag: 'Sent for you' }] },

  // ---------- X ----------
  'x-thread': { t: 'msg', rows: [{ app: 'x', who: 'ROB IT', text: 'Update 1.4 is live. Here is what changed (1/5)', img: 'iter3' }] },
  'x-mentions': { t: 'alert', rows: [{ app: 'x', title: '@heistqueen posted about ROB IT', text: '"best heist game on roblox rn"', time: '2m' }, { app: 'x', title: '@bloxnews posted about ROB IT', text: '"ROB IT passes 3K players"', time: '1h' }] },

  // ---------- Threads ----------
  'th-cross': { t: 'msg', rows: [{ app: 'x', who: 'On X', text: 'Update 1.4 is live. Lasers!' }, { app: 'threads', who: 'On Threads', text: 'Update 1.4 is live. Lasers!', me: true, tag: 'Reposted' }] },

  // ---------- Reddit ----------
  'rd-subs': { t: 'list', lead: 'app', app: 'reddit', title: 'Where your players are', rows: [{ name: 'r/roblox', sub: '4.1M members', value: 'Promo on Sat' }, { name: 'r/RobloxDevelopers', sub: '96K members', value: 'Devlogs ok' }, { name: 'r/heistgames', sub: '22K members', value: 'No links' }] },
  'rd-feedback': { t: 'list', lead: 'fx', title: 'This week on Reddit', rows: [{ fx: 'thought_balloon', name: '"The museum map is so good"', value: '38', tone: 'ok' }, { fx: 'thought_balloon', name: '"Guards feel unfair"', value: '17', tone: 'bad' }, { fx: 'thought_balloon', name: '"Add co-op"', value: '11' }] },

  // ---------- Discord ----------
  'dc-welcome': { t: 'msg', rows: [{ app: 'discord', who: 'ouroboro', text: 'Welcome! What do you play?' }, { init: 'N', who: 'newbie', text: 'Mostly heists' }, { app: 'discord', who: 'ouroboro', text: 'Gave you the Heister role', tag: 'Role' }] },
  'dc-patch': { t: 'msg', rows: [{ app: 'discord', who: '#announcements', text: 'Update 1.4: The Museum Job', img: 'museum' }] },
  'dc-bugs': { t: 'list', lead: 'check', title: 'From #bug-reports', rows: [{ name: 'Fell through the vault floor', value: '#412' }, { name: 'Lasers invisible on mobile', value: '#413' }, { name: 'Same as #412', value: 'Closed', done: true }] },
  'dc-giveaway': { t: 'msg', rows: [{ app: 'discord', who: 'ouroboro', text: 'Giveaway: 1,000 Robux. React to enter!' }, { app: 'discord', who: 'ouroboro', text: 'Winners: @lucky7 and @vaultqueen', tag: '2 of 418' }] },

  // ---------- Telegram ----------
  'tg-alerts': { t: 'alert', rows: [{ fx: 'money_bag', title: 'New sale', text: 'VIP pass, R$ 149', time: 'now' }, { fx: 'bug', title: 'Error spike', text: 'VaultDoor.lua, 40 in 5 min', time: '4m' }] },

  // ---------- Figma ----------
  'fg-ui': { t: 'list', lead: 'fx', title: 'ShopGui, exported', rows: [{ fx: 'crown', name: 'VipButton', sub: 'Size 0.3, 0.1', value: 'Anchored', tone: 'ok' }, { fx: 'money_bag', name: 'CashButton', sub: 'Size 0.3, 0.1', value: 'Anchored', tone: 'ok' }] },
  'fg-mockups': { t: 'sizes', img: 'iter5', frames: [['16 / 9', 'Store'], ['3 / 4', 'Tablet'], ['9 / 16', 'Phone']] },
  'fg-qa': { t: 'list', lead: 'check', title: '3 issues in Shop', rows: [{ name: 'Button 13 px off the grid', value: 'Spacing' }, { name: 'Grey on grey, 2.9:1', value: 'Contrast', tone: 'bad' }, { name: 'Detached text style', value: 'Styles' }] },

  // ---------- Krita ----------
  'kr-concept': { t: 'gallery', shape: 'board', items: [{ img: 'museum' }, { img: 'halloween' }, { img: 'goldVault' }, { img: 'vaultDial' }] },

  // ---------- Photopea ----------
  'pp-resize': { t: 'sizes', img: 'diamondCash', frames: [['16 / 9', '1920x1080'], ['1 / 1', '1080x1080'], ['9 / 16', '1080x1920']] },

  // ---------- Spotify ----------
  'sp-pitch': { t: 'list', lead: 'fx', title: 'Pitched: Vault Theme', rows: [{ fx: 'headphone', name: 'Gaming Lo-Fi', sub: '82K saves', value: 'Sent', tone: 'ok' }, { fx: 'headphone', name: 'Heist Movie Vibes', sub: '31K saves', value: 'Sent', tone: 'ok' }, { fx: 'headphone', name: 'Focus Beats', sub: '140K saves', value: 'Sent', tone: 'ok' }] },
  'sp-release': { t: 'chart', label: 'Vault Theme, day 6', value: '18,204 streams', delta: '+31% saves', trend: 'up', kind: 'bars' },

  // ---------- SoundCloud ----------
  'sc-upload': { t: 'wave', title: 'Vault Theme (final mix)', meta: 'Uploaded with art and tags' },

  // ---------- Bandcamp ----------
  'bc-ost': { t: 'list', lead: 'fx', title: 'ROB IT (Original Soundtrack)', rows: [{ fx: 'musical_notes', name: '1. Casing the Joint', value: '2:41' }, { fx: 'musical_notes', name: '2. Laser Hall', value: '3:05' }, { fx: 'musical_notes', name: '3. Getaway', value: '2:18' }], foot: '$7 or more' },

  // ---------- Audacity ----------
  'au-loops': { t: 'wave', title: 'menu_theme.wav', meta: 'Loop 0:00 to 0:32, seamless', loop: true },
  'au-voice': { t: 'wave', title: 'guard_line_04.wav', meta: 'Noise removed, -16 LUFS', clean: true },

  // ---------- GitHub ----------
  'gh-review': { t: 'code', file: 'VaultDoor.lua', lines: ['RunService.Heartbeat:Connect(function()', '  for _, door in doors do', '    door:Refresh()', '  end'], hl: 2, note: 'Runs 60 times a second. Use a Changed event.' },
  'gh-notes': { t: 'doc', title: 'v1.4.0', lines: ['Laser grid in the museum (#88)', 'Mobile vault doors 2x faster (#91)', 'Fixed guards on stairs (#93)'] },
  'gh-labels': { t: 'list', lead: 'check', title: 'New issues', rows: [{ name: 'Guards clip through walls', value: 'bug', tone: 'bad' }, { name: 'Add a night map', value: 'idea' }, { name: 'Crash on join', value: 'duplicate', done: true }] },

  // ---------- Vercel ----------
  'vc-deploy': { t: 'list', lead: 'fx', title: 'robit.gg', rows: [{ fx: 'globe_with_meridians', name: 'Deploy 41c2', sub: '500 errors', value: 'Rolled back', tone: 'bad' }, { fx: 'globe_with_meridians', name: 'Deploy 3f9a', sub: 'Serving again', value: 'Ready', tone: 'ok' }] },

  // ---------- Linear ----------
  'ln-standup': { t: 'msg', rows: [{ init: 'M', who: 'Maria', text: 'Shipped the laser grid, now on vault UI' }, { init: 'S', who: 'Sam', text: 'Fixed 3 mobile bugs, 1 in review' }] },
  'ln-roadmap': { t: 'board', cols: [['Now', ['More vaults', 'Fair guards']], ['Next', ['Night map']], ['Later', ['Co-op heists']]] },

  // ---------- Shopify ----------
  'sh-merch': { t: 'gallery', shape: 'square', items: [{ img: 'iter1', cap: 'Tee $24' }, { img: 'iter6', cap: 'Mug $14' }, { img: 'icon', cap: 'Sticker $4' }] },
  'sh-stock': { t: 'alert', rows: [{ fx: 'package', title: 'Heist tee, size M', text: '4 left, about 3 days. Reorder drafted.', time: 'now' }] },
  'sh-cart': { t: 'doc', title: 'You left the heist tee in your cart', lines: ['It is still yours for 24 hours.'], cta: 'Finish checkout' },

  // ---------- Stripe ----------
  'str-digest': { t: 'chart', label: 'Sales this week', value: '$4,812', delta: '+18%, 86 new customers', trend: 'up', kind: 'bars' },
  'str-dunning': { t: 'list', lead: 'fx', title: 'Failed payments', rows: [{ fx: 'credit_card', name: 'Card declined', sub: 'Retry 2 of 3', value: '$9.99' }, { fx: 'credit_card', name: 'Card updated', sub: 'Recovered', value: '$9.99', tone: 'ok' }] },

  // ---------- Etsy ----------
  'et-listings': { t: 'doc', img: 'iter5', title: 'Heist Crew Sticker Pack', tags: ['roblox', 'heist', 'gamer gift'] },

  // ---------- Gumroad ----------
  'gr-packs': { t: 'list', lead: 'file', title: 'Heist Props Pack', rows: [{ name: 'vault_door.fbx' }, { name: 'diamond.fbx' }, { name: 'laser_grid.png' }], foot: '$12, 38 sold' },

  // ---------- Patreon ----------
  'pt-posts': { t: 'list', lead: 'fx', title: 'Build 1.5', rows: [{ fx: 'crown', name: 'Vault tier', value: 'Today', tone: 'ok' }, { fx: 'gem_stone', name: 'Diamond tier', value: 'Today', tone: 'ok' }, { fx: 'busts_in_silhouette', name: 'Everyone', value: 'In 7 days' }] },

  // ---------- Notion ----------
  'no-gdd': { t: 'doc', title: 'ROB IT: design doc', lines: ['Loop: case, crack, escape', 'Economy: cash buys tools and maps', 'Threats: lasers, guards, alarms'] },
  'no-meetings': { t: 'list', lead: 'check', title: 'From Monday sync', rows: [{ name: 'Draft vault 3 layout', value: 'Maria, Fri' }, { name: 'Price the VIP pass', value: 'Sam, Mon' }, { name: 'Record trailer VO', value: 'You, Tue' }] },
  'no-content': { t: 'cal', title: 'October posts', days: ['Mon', 'Wed', 'Fri'], ev: [[0, 'Short: vault run'], [1, 'Devlog 12'], [2, 'Update thread']] },

  // ---------- Gmail ----------
  'gm-triage': { t: 'list', lead: 'fx', title: 'Inbox, sorted', rows: [{ fx: 'envelope', name: 'Roblox Creator Fund', sub: 'Draft ready', value: 'Reply', tone: 'ok' }, { fx: 'envelope', name: 'GDC newsletter', value: 'Later' }, { fx: 'envelope', name: '50% off hosting', value: 'Ignore' }] },
  'gm-sponsors': { t: 'doc', title: 'Re: Sponsored video', lines: ['Thanks for reaching out! My rates:', 'Dedicated video $1,200', 'Integration $450'] },

  // ---------- Google Sheets ----------
  'gs-stats': { t: 'table', cols: ['Day', 'Players', 'Robux'], rows: [['Oct 19', '2,914', '18,240'], ['Oct 20', '3,102', '19,880'], ['Oct 21', '3,266', '21,410']] },
  'gs-economy': { t: 'table', cols: ['Item', 'Price', 'Hours'], rows: [['Lockpick', '500', '0.4'], ['Drill', '4,000', '3.1'], ['Laser cutter', '90,000', '71']], flag: 2 },

  // ---------- Google Calendar ----------
  'gc-focus': { t: 'cal', title: 'This week', days: ['Mon', 'Tue', 'Wed'], ev: [[0, 'Focus 9 to 12'], [1, 'Standup 10'], [1, 'Focus 1 to 4'], [2, 'Focus 9 to 12']] },

  // ---------- Trello ----------
  'tr-board': { t: 'board', cols: [['To do', ['Vault 3 layout', 'Alarm sounds']], ['Doing', ['Laser grid']], ['Done', ['Guard AI']]] },

  // ---------- Mailchimp ----------
  'mc-news': { t: 'doc', img: 'iter4', title: 'The Museum Job is live', lines: ['Lasers, a dino hall and a new vault.'], cta: 'Play now' },
  'mc-winback': { t: 'doc', img: 'iter6', title: 'We moved the vault', lines: ['3 new maps since you last played.'], cta: 'Come back' },

  // ---------- Substack ----------
  'ss-digest': { t: 'doc', title: 'October at ROB IT', lines: ['Players up 41%', '3 maps shipped', 'What we cut, and why'] },

  // ---------- Google Analytics ----------
  'ga-anomaly': { t: 'chart', label: 'Visits from Reddit', value: '-38%', delta: 'Dropped since 2 PM', trend: 'down', kind: 'line' },
  'ga-weekly': { t: 'doc', title: 'Week of Oct 13', lines: ['Visits 12,480, up 9%', 'Top source: YouTube', 'Sign-ups 412'] },
};
