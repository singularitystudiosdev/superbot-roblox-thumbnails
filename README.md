# superbot-roblox-thumbnails

Standalone copy of the `superbot-roblox-thumbnails-af4c3c6b` creative from
`singularitystudiosdev/superbot-ad-gallery` (commit 1c52693 plus the
uncommitted working-tree edits served on 2026-10-21).

Static site: serve the folder (`npm run serve`, then http://localhost:5281/). The root
redirects to `sidebars.bdeb2397/view.html`, the app with its chat sidebar (query and hash carry over). The ten
chat-list variants sit side by side at http://localhost:5281/sidebars/. Verify scripts in `tools/` need
`npm install` (Playwright).

A second set of ten chat lists, each chat marked with a Fluent 3D emoji like the Activity tab's steps, plays at
`chats.5a028abd.html?chats=1..10` (its own page, loading the same modules; all ten side by side at
http://localhost:5281/chats-sheet.5a028abd.html).
