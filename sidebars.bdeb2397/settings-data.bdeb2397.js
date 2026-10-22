// What Settings (settings.bdeb2397.js) starts from: the account's profile, its credits, auto-reload, its card and
// invoices, its notification choices and the apps superbot works in for it. There are no plans: credits are bought
// outright, at one flat price. The account, its card, its invoices and its usage are made up, as the creative's
// figures are.
import { ACCOUNT } from './chats.bdeb2397.js';

export const PROFILE = { name: ACCOUNT.name, callMe: 'Rob', email: 'hello@robitgames.com', photo: ACCOUNT.avatar };

// the automations the account has published to the Automations tab (published.6c0fd59e.js, Settings' My
// Automations): its prompt with a {{slot}} for each question whoever starts it answers, and the apps it needs
// connected. Its uses, ratings and the credits it made are made up, as the catalogue's are; its thumbnail is ROB IT's
// own (rbx/assets, img/CREDITS.txt)
export const PUBLISHED = [
  {
    id: 'pub-updatelog',
    title: 'Roblox Update Log Poster',
    desc: 'Writes the update log each time you publish a new version of your game and posts it to your Discord.',
    prompt: 'Every time I publish an update to {{game}}, read what changed since the last version, write a short update log players will enjoy reading and post it in {{channel}}.',
    thumb: '../rbx/assets/841bdbf6b2bd6b.webp',
    app: 'roblox',
    apps: ['roblox', 'discord'],
    questions: [
      { key: 'game', q: 'Which game should I post update logs for?' },
      { key: 'channel', q: 'Which Discord channel should I post them in?' },
    ],
    uses: 2140,
    credits: 42_800_000,
    stars: [64, 15, 4, 1, 1],
    at: 'Sep 9, 2026',
  },
];

// the one price of a credit: every pack, any amount bought and every auto-reload cost this per 1,000,000, with no
// discount at any size (Billing, settings-billing.bdeb2397.js; auto-reload, sidebar-tools.854d0793.js)
export const MILLION = 1_000_000;
export const PER_MILLION = 1; // US dollars
export const priceOf = (credits) => (credits / MILLION) * PER_MILLION;
export const creditsFor = (dollars) => (dollars / PER_MILLION) * MILLION;
const cents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const whole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
// "$20.00" for what is charged; `short` drops the cents of a whole-dollar price ("$20") where it is only quoted
export const usd = (dollars, { short = false } = {}) => (short && Number.isInteger(dollars) ? whole : cents).format(dollars);
// what Buy credits and auto-reload's fields take, in whole dollars
export const BUY = { min: 1, max: 1000 };

const count = new Intl.NumberFormat('en-US');
const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
// credits bought (a pack, an amount, an auto-reload): added to what is left, their invoice on top at the one price
export function addCredits(billing, credits, why = '') {
  billing.left += credits;
  billing.invoices.unshift({ date: today(), what: `${count.format(credits)} credits${why ? `, ${why}` : ''}`, amount: usd(priceOf(credits)) });
}

// a payment method as Billing names it ("Visa ending 4242", "Google Pay"), and the default one, what is charged
export const methodName = (m) => (m.kind === 'gpay' ? 'Google Pay' : `${m.brand} ending ${m.last4}`);
export const primaryOf = (billing) => billing.methods.find((m) => m.id === billing.primary);

// the packs, each a coin of its own metal, silver, gold and rainbow (chats.bdeb2397.js FX, tools/coin-fx.0ecb8f7c.mjs),
// the rainbow one the silver coin with a rainbow flowing across it (`flow`, settings.854d0793.css .st-flow); priced by
// priceOf
export const PACKS = [
  { credits: 5_000_000, coin: 'coin' },
  { credits: 20_000_000, coin: 'coinGold' },
  { credits: 100_000_000, coin: 'coin', flow: true },
];

export const BILLING = {
  left: 12_483_920,
  // the address on the account's invoices and what a new card is billed to (settings-pay.8a3994ee.js): none until the
  // viewer adds one ({ name, country, line1, line2, city, region, postal })
  address: null,
  // the payment methods on file: cards (`card`, kept as brand, last four and expiry) and Google Pay (`gpay`, the Google
  // account it pays from); `primary` is the default one, what Buy credits, the packs and auto-reload charge
  methods: [{ id: 'pm-visa', kind: 'card', brand: 'Visa', last4: '4242', exp: '08/28' }],
  primary: 'pm-visa',
  // off, so Billing offers Set up auto-reload; once on, reaching `below` buys what brings the balance back to `upTo`
  autoReload: false,
  reload: { below: 5_000_000, upTo: 15_000_000 },
  invoices: [
    { date: 'Oct 14, 2026', what: '20,000,000 credits', amount: '$20.00' },
    { date: 'Sep 18, 2026', what: '10,000,000 credits, auto-reload', amount: '$10.00' },
    { date: 'Sep 3, 2026', what: '20,000,000 credits', amount: '$20.00' },
    { date: 'Aug 3, 2026', what: '5,000,000 credits', amount: '$5.00' },
  ],
};

// `fx` is the row's Fluent 3D icon (FX, chats.bdeb2397.js): the trophy a chat's breakthrough wears, the hourglass of its waits
export const NOTIFICATIONS = [
  { id: 'wins', label: 'New bests', desc: 'When a chat beats its best result, like a thumbnail that gets more plays.', fx: 'trophy', on: true },
  { id: 'waiting', label: 'Chats waiting on you', desc: 'When ouroboro needs an answer before it can go on.', fx: 'hourglass', on: true },
];

// marks are each app's own (img/fav, screens/fav, automations/apps and their CREDITS.txt)
export const CONNECTIONS = [
  { id: 'roblox', name: 'Roblox', mark: '../img/fav/roblox.png', account: 'ROB IT', on: true },
  { id: 'gmail', name: 'Gmail', mark: './screens/fav/gmail.png', account: 'hello@robitgames.com', on: true },
  { id: 'calendar', name: 'Google Calendar', mark: './screens/fav/google-calendar.png', account: 'hello@robitgames.com', on: true },
  { id: 'youtube', name: 'YouTube', mark: './automations/apps/youtube.png', account: 'ROB IT Games', on: true },
  { id: 'discord', name: 'Discord', mark: './automations/apps/discord.png', account: '', on: false },
];
