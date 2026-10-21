// Variant 1 (the icon list the owner kept) and ten takes on it, numbered 11 to 20 so they never read as the retired
// 2 to 10. One registry: every variant shares the envelope (shell.bdeb2397.js) and supplies `body`, the scrolling
// middle; `cls` restyles the whole sidebar, `nav: 'button'` and `search: 'field'` swap a piece of the envelope.
import { CHATS } from './chats.bdeb2397.js';
import { row, list, section, time } from './parts.bdeb2397.js';

const BUCKETS = ['Today', 'Yesterday', 'Earlier'];
const rows = (chats, opts) => chats.map((c) => row(c, typeof opts === 'function' ? opts(c) : opts)).join('');
const iconList = () => section('Chats', list(rows(CHATS)));

export const VARIANTS = [
  { id: 1, name: 'Icon list', idea: 'The one you kept: a 3D icon and the title, nothing else on the row.', body: iconList },
  { id: 11, name: 'Roomy', idea: 'Variant 1 at the Manus screenshot\'s own scale, with bigger icons and taller rows.', cls: 'is-roomy', body: iconList },
  { id: 12, name: 'Icon tiles', idea: 'Each 3D icon sits on a small white tile, like an app icon.', cls: 'is-tiles', body: iconList },
  {
    id: 13, name: 'Quiet dates', idea: 'The same list split under Today, Yesterday and Earlier, with no counts or folds.',
    body: () => BUCKETS.map((b) => section(b, list(rows(CHATS.filter((c) => c.bucket === b))))).join(''),
  },
  {
    id: 14, name: 'With times', idea: 'Variant 1 plus when each chat last changed, in grey on the right.',
    body: () => section('Chats', list(rows(CHATS, (c) => ({ trail: time(c) })))),
  },
  { id: 15, name: 'Full titles', idea: 'Long titles wrap to a second line instead of being cut off.', cls: 'is-wrap', body: iconList },
  { id: 16, name: 'Compact', idea: 'Shorter rows and smaller icons, so every chat fits with room to spare.', cls: 'is-compact', body: iconList },
  { id: 17, name: 'White selection', idea: 'The open chat is a white row with a thin edge instead of a grey fill.', cls: 'is-white-sel', body: iconList },
  { id: 18, name: 'New chat button', idea: 'New chat becomes a full-width white button at the top. Automations stays a row.', nav: 'button', body: iconList },
  { id: 19, name: 'Search field', idea: 'A search field under the top bar, as in Claude, replaces the search button.', search: 'field', body: iconList },
  {
    id: 20, name: 'Pinned on top', idea: 'Pinned chats sit above the rest, under quiet Pinned and Recent labels.',
    body: () => section('Pinned', list(rows(CHATS.filter((c) => c.pinned)))) + section('Recent', list(rows(CHATS.filter((c) => !c.pinned)))),
  },
];
