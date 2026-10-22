// What makes a swarm agent's automation fit for the Automations tab (automations.03378ba4.js), checked the same way by
// `check` before an agent spends a thumbnail and by `merge` before a record reaches the tab: the card's own fields
// within what a card shows without overflowing, a loop or a schedule, a KPI the loop moves, what it learns from one run
// to the next, evidence that people do the work by hand, and nothing the catalogue already holds.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const TRIGGERS = ['schedule', 'loop', 'event'];
export const DIRECTIONS = ['up', 'down'];
const NEAR_DUPLICATE = 0.5; // Jaccard over title and description content words
const DASHES = /[—–]|\s--\s/; // no em or en dashes in copy a person reads
const HYPE = /\b(seamless(ly)?|robust|cutting-edge|game-changing|revolutionary|elevate|unlock|empower|supercharge|effortless(ly)?|transformative|ultimate)\b/i;
const SEARCH_PAGE = /\/\/(www\.)?(google|bing|duckduckgo|search\.yahoo)\.[a-z.]+\/(search|html|\?)/i;
const STOP = new Set('a an and are as at be by each every for from has in into is it its more most new of on one or so that the their them they this to up with you your keeps makes finds tells'.split(' '));

const words = (text) => new Set(String(text).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)));
const normTitle = (title) => String(title).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function jaccard(a, b) {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / (a.size + b.size - shared || 1);
}

const isText = (v, min, max = Infinity) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
const isUrl = (v) => typeof v === 'string' && /^https:\/\/[^\s]+\.[^\s]+/.test(v) && !SEARCH_PAGE.test(v);

// a thumbnail is 768x432 like every other card's; its sidecar says which model drew it from which prompt
export function thumbProblems(root, rec) {
  const file = join(root, 'thumbs', `${rec.id}.webp`);
  if (!existsSync(file)) return [`thumb: no thumbs/${rec.id}.webp (run the thumb command first)`];
  if (!existsSync(join(root, 'thumbs', `${rec.id}.json`))) return [`thumb: no thumbs/${rec.id}.json provenance sidecar (make thumbnails with the thumb command only)`];
  const size = execFileSync('magick', ['identify', '-format', '%w %h %m', file], { encoding: 'utf8' }).trim();
  return size === '768 432 WEBP' ? [] : [`thumb: thumbs/${rec.id}.webp is ${size}, not 768 432 WEBP`];
}

// every reason a record cannot reach the tab, empty when it can
export function recordProblems(rec, { prefix, apps, newApps = {}, withThumb = false, root }) {
  const out = [];
  if (!new RegExp(`^${prefix}-[a-z0-9]+(-[a-z0-9]+)*$`).test(rec.id ?? '') || rec.id.length > 48) out.push(`id: "${rec.id}" must be ${prefix}-<lowercase-words-joined-by-dashes>, at most 48 characters`);
  if (!isText(rec.role, 2)) out.push('role: name your role in the archetype');
  if (!isText(rec.title, 3, 24)) out.push('title: 3 to 24 characters (the card title row fits no more)');
  else if (/[.!]$/.test(rec.title.trim())) out.push('title: no closing punctuation');
  if (!isText(rec.desc, 50, 140)) out.push('desc: one sentence of 50 to 140 characters');
  else {
    if (!/\.$/.test(rec.desc.trim())) out.push('desc: end with a period');
    if (DASHES.test(rec.desc) || DASHES.test(rec.title)) out.push('copy: no em dashes, en dashes or " -- "');
    if (HYPE.test(`${rec.title} ${rec.desc}`)) out.push(`copy: drop the hype word "${`${rec.title} ${rec.desc}`.match(HYPE)[0]}"`);
    if (/!/.test(rec.desc)) out.push('copy: no exclamation marks');
  }
  const appKey = rec.newApp?.key ?? rec.app;
  if (rec.newApp) {
    const n = rec.newApp;
    if (!/^[a-z0-9]{2,24}$/.test(n.key ?? '')) out.push('newApp.key: 2 to 24 lowercase letters or digits');
    if (rec.app !== n.key) out.push('app: must equal newApp.key when you declare a new app');
    if (apps[n.key]) out.push(`newApp: "${n.key}" already exists, use app: "${n.key}" without newApp`);
    if (!isText(n.name, 2, 24)) out.push('newApp.name: the app\'s own name, up to 24 characters');
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(n.domain ?? '')) out.push('newApp.domain: the app\'s bare domain, e.g. "lemonsqueezy.com"');
    if (!Array.isArray(n.topics) || !n.topics.length || !n.topics.every((t) => isText(t, 3, 20))) out.push('newApp.topics: 1 to 3 Title Case topics');
    if (!isText(n.keywords, 3, 80)) out.push('newApp.keywords: a few search words');
    if (n.iconUrl != null && !isUrl(n.iconUrl)) out.push('newApp.iconUrl: an https link to the app\'s own logo, or leave it out');
  } else if (!apps[appKey] && !newApps[appKey]) out.push(`app: "${rec.app}" is not in APPS; use an existing key or declare newApp`);
  if (!Array.isArray(rec.topics) || rec.topics.length > 3 || !rec.topics.every((t) => isText(t, 3, 20))) out.push('topics: 0 to 3 Title Case topics');
  if (!isText(rec.niche, 8, 160)) out.push('niche: who runs this, specifically');
  if (!TRIGGERS.includes(rec.trigger?.type) || !isText(rec.trigger?.when, 3, 80)) out.push(`trigger: {type: ${TRIGGERS.join('|')}, when: "every weekday 9:00" or "each new upload"}`);
  if (!isText(rec.kpi?.name, 3, 60) || !DIRECTIONS.includes(rec.kpi?.direction)) out.push('kpi: {name: "sponsor reply rate", direction: up|down}');
  if (!isText(rec.learns, 30, 400)) out.push('learns: what it keeps from each run and how that changes the next one (30+ characters)');
  if (!Array.isArray(rec.loop) || rec.loop.length < 2 || rec.loop.length > 6 || !rec.loop.every((s) => isText(s, 3, 120))) out.push('loop: 2 to 6 short steps, one cycle');
  if (!Array.isArray(rec.evidence) || !rec.evidence.length || !rec.evidence.every(isUrl)) out.push('evidence: 1+ https URLs of pages you fetched showing people do this by hand, never a search results page');
  if (!isText(rec.created, 20) || Number.isNaN(Date.parse(rec.created))) out.push('created: ISO time, e.g. 2026-10-21T19:00:00Z');
  if (withThumb) out.push(...thumbProblems(root, rec));
  return out;
}

// the catalogue entry this record repeats, or null
export function duplicateOf(rec, catalogue) {
  const mine = words(`${rec.title} ${rec.desc}`), title = normTitle(rec.title);
  for (const other of catalogue) {
    if (other.id === rec.id) continue;
    if (normTitle(other.title) === title) return { id: other.id, why: `same title as "${other.title}"` };
    const score = jaccard(mine, words(`${other.title} ${other.desc}`));
    if (score >= NEAR_DUPLICATE) return { id: other.id, why: `near-duplicate of "${other.title}" (${score.toFixed(2)} word overlap)` };
  }
  return null;
}

// a rating and a use count in the range the creative's own illustrative figures span, the same for an id every merge
export function illustrativeFigures(id) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return { rating: Math.round((4.2 + (h % 7) / 10) * 10) / 10, uses: 600 + Math.round(((h >>> 3) % 5400) / 100) * 100 };
}
