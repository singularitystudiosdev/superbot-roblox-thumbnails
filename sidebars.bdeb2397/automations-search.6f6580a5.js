// What the Automations page shows for a query and a set of picked apps, with no DOM: the category chips (apps) the query
// points at, and the automations to list. A query reaches an automation three ways: its own words (title, description,
// tags, app name), its app's name, or a topic whose apps include its app ("game design" brings Roblox, Unity, Blender,
// Steam...). Picked apps then narrow the list to those apps; with none picked, every match shows.
import { APPS } from './apps.6f6580a5.js';
import { AUTOMATIONS } from './automations-data.6f6580a5.js';

// a topic: its name, the other words that reach it, and its apps in the order their chips show
export const TOPICS = [
  { name: 'Game Design', words: 'game games gamedev gaming level design 3d modeling engine indie roblox', apps: ['roblox', 'unity', 'unrealengine', 'godotengine', 'blender', 'steam', 'itchdotio', 'aseprite'] },
  { name: 'Video and Streaming', words: 'video videos stream streaming streamer clips editing youtuber creator content', apps: ['youtube', 'twitch', 'kick', 'obsstudio', 'davinciresolve'] },
  { name: 'Social Media', words: 'social posts posting community followers', apps: ['instagram', 'x', 'threads', 'reddit', 'discord', 'telegram'] },
  { name: 'Art and Design', words: 'art design graphics ui ux pixel drawing painting illustration 3d', apps: ['figma', 'blender', 'aseprite', 'krita', 'photopea'] },
  { name: 'Music and Audio', words: 'music audio sound sounds soundtrack ost podcast voice', apps: ['spotify', 'soundcloud', 'bandcamp', 'audacity'] },
  { name: 'Coding', words: 'code coding developer development programming software scripts devops', apps: ['github', 'vercel', 'linear', 'unity', 'godotengine'] },
  { name: 'Selling', words: 'sell selling sales shop store ecommerce money revenue merch payments monetization', apps: ['shopify', 'stripe', 'etsy', 'gumroad', 'patreon', 'steam'] },
  { name: 'Productivity', words: 'productivity work tasks notes email docs team planning calendar', apps: ['notion', 'gmail', 'googlesheets', 'googlecalendar', 'trello', 'linear'] },
  { name: 'Marketing', words: 'marketing ads growth newsletter seo promotion audience analytics', apps: ['mailchimp', 'googleanalytics', 'substack', 'youtube', 'reddit', 'x', 'instagram'] },
];

const words = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
// every query word starts some word of the text: "thumb" finds "thumbnails", "game des" finds "Game Design"
const reaches = (tokens, haystack) => tokens.length > 0 && tokens.every((t) => haystack.some((w) => w.startsWith(t)));

const INDEX = AUTOMATIONS.map((a) => ({
  a,
  title: words(a.title),
  text: words(`${a.title} ${a.desc} ${a.tags} ${APPS[a.app].name}`),
}));
const APP_WORDS = Object.fromEntries(Object.entries(APPS).map(([id, app]) => [id, words(`${app.name} ${id}`)]));
const TOPIC_WORDS = TOPICS.map((t) => words(`${t.name} ${t.words}`));

const byUses = (x, y) => y.a.uses - x.a.uses;
const USES = AUTOMATIONS.reduce((m, a) => m.set(a.app, (m.get(a.app) ?? 0) + a.uses), new Map());
const BY_POPULARITY = [...USES.keys()].sort((x, y) => USES.get(y) - USES.get(x));

// -> { topics: names the query reached, apps: chip ids in order, counts: per-app matches, items: automations to list }
export function searchAutomations(query, picked = []) {
  const tokens = words(query);
  let hits;
  let chips;
  let topics = [];
  if (!tokens.length) {
    hits = [...INDEX].sort(byUses);
    chips = BY_POPULARITY;
  } else {
    const named = Object.keys(APPS).filter((id) => reaches(tokens, APP_WORDS[id]));
    const reached = TOPICS.filter((_, i) => reaches(tokens, TOPIC_WORDS[i]));
    topics = reached.map((t) => t.name);
    const topicApps = new Set(reached.flatMap((t) => t.apps));
    const scored = [];
    for (const row of INDEX) {
      const inTitle = reaches(tokens, row.title), inText = inTitle || reaches(tokens, row.text);
      const byApp = named.includes(row.a.app), byTopic = topicApps.has(row.a.app);
      if (!inText && !byApp && !byTopic) continue;
      scored.push({ ...row, score: (inTitle ? 4 : 0) + (byApp ? 3 : 0) + (inText ? 2 : 0) + (byTopic ? 1 : 0) });
    }
    hits = scored.sort((x, y) => y.score - x.score || byUses(x, y));
    // chips: apps named outright, then the topics' apps, then the apps of word matches, most matches first
    const fromText = new Map();
    for (const h of hits) if (!named.includes(h.a.app) && !topicApps.has(h.a.app)) fromText.set(h.a.app, (fromText.get(h.a.app) ?? 0) + 1);
    chips = [...new Set([...named, ...reached.flatMap((t) => t.apps), ...[...fromText.keys()].sort((x, y) => fromText.get(y) - fromText.get(x))])];
  }
  const counts = hits.reduce((m, h) => m.set(h.a.app, (m.get(h.a.app) ?? 0) + 1), new Map());
  // a picked app keeps its chip whatever the query, so it can always be unpicked
  const apps = [...picked.filter((id) => !chips.includes(id)), ...chips];
  const items = (picked.length ? hits.filter((h) => picked.includes(h.a.app)) : hits).map((h) => h.a);
  return { topics, apps, counts, items };
}
