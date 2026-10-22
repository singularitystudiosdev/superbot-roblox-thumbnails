// The swarms' automations, checked and merged. Each swarm is a project (../swarm/sources.f2db18c1.json) whose agents
// append automations to their own data/<role>.jsonl, so no two agents ever write one file; this tool alone writes this
// side of it: ../automations-swarm.f2db18c1.js (which the Automations tab no longer shows: automations.03378ba4.js offers
// only the creative's own two), the swarm thumbnails and app icons under ../automations/, and ../swarm/report.f2db18c1.json,
// every record's verdict.
//   node sidebars.bdeb2397/tools/automations-swarm.f2db18c1.mjs check <project-root> <jsonl-file> <id>
//   node sidebars.bdeb2397/tools/automations-swarm.f2db18c1.mjs thumb <project-root> <id> "<what the picture shows>"
//   node sidebars.bdeb2397/tools/automations-swarm.f2db18c1.mjs merge
// A record is merged only with status "ship" and nothing recordProblems or duplicateOf objects to; within a
// file the last line for an id wins, across files the earliest `created` keeps a duplicated idea.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { duplicateOf, illustrativeFigures, recordProblems } from './automations-swarm-rules.f2db18c1.mjs';

const HERE = fileURLToPath(new URL('../', import.meta.url));
const SOURCES = join(HERE, 'swarm', 'sources.f2db18c1.json');
const MODULE = join(HERE, 'automations-swarm.f2db18c1.js');
const REPORT = join(HERE, 'swarm', 'report.f2db18c1.json');
const THUMBS = join(HERE, 'automations', 'swarm');
const ICONS = join(HERE, 'automations', 'apps');
const LOCK = join(HERE, 'swarm', '.merge.lock'), DIRTY = join(HERE, 'swarm', '.merge.dirty');
const LOCK_STALE_MS = 120000;
const W = 768, H = 432;
const MODEL = 'fal-ai/nano-banana-pro', PRICE = 0.15; // as automations-assets.03378ba4.mjs, USD per image
// automations-assets.03378ba4.mjs's STYLE, so a swarm card looks like the catalogue's own
const STYLE = 'One clear subject filling a 16:9 frame edge to edge, crisp, well lit, modern and polished, like the hero image on a software marketplace card. Absolutely no text, letters, numbers, words, captions, logos, brand marks or watermarks anywhere; any screen or interface shows only abstract shapes, bars and icons.';

const sources = () => JSON.parse(readFileSync(SOURCES, 'utf8')).swarms;
const sourceOf = (root) => {
  const found = sources().find((s) => resolve(s.root) === resolve(root));
  if (!found) throw new Error(`${root} is not a swarm in ${SOURCES}`);
  return found;
};
const writeAtomic = (file, text) => { writeFileSync(`${file}.tmp`, text); renameSync(`${file}.tmp`, file); };

// the creative's own catalogue, and every app a swarm automation may name without declaring it new
async function baseCatalogue() {
  const { ALL_APPS, AUTOMATIONS } = await import(`${new URL('../automations.03378ba4.js', import.meta.url).href}?t=${Date.now()}`);
  return { apps: ALL_APPS, automations: AUTOMATIONS };
}

// every record of one file, the last line per id winning; unreadable lines are reported, never dropped silently
function readRecords(file) {
  const byId = new Map(), bad = [];
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    try { const rec = JSON.parse(line); if (rec.id) byId.set(rec.id, rec); else bad.push(`line ${i + 1}: no id`); } catch (e) { bad.push(`line ${i + 1}: ${e.message}`); }
  });
  return { records: [...byId.values()], bad };
}

// ---------- check: one record, before its thumbnail is paid for ----------
async function check(root, file, id) {
  const swarm = sourceOf(root);
  const { records } = readRecords(resolve(root, file));
  const rec = records.find((r) => r.id === id);
  if (!rec) throw new Error(`no record with id ${id} in ${file}`);
  const { apps, automations } = await baseCatalogue();
  const { SWARM_APPS, SWARM_AUTOMATIONS } = await import(`${new URL('../automations-swarm.f2db18c1.js', import.meta.url).href}?t=${Date.now()}`);
  const problems = recordProblems(rec, { prefix: swarm.prefix, apps, newApps: SWARM_APPS, withThumb: rec.status === 'ship', root });
  const dup = duplicateOf(rec, [...automations, ...SWARM_AUTOMATIONS]);
  if (dup) problems.push(`duplicate: ${dup.why} (${dup.id}); pick a different idea`);
  console.log(problems.length ? `FAIL ${id}\n${problems.map((p) => `  - ${p}`).join('\n')}` : `PASS ${id}${rec.status === 'ship' ? '' : ' (thumbnail not checked: status is not ship)'}`);
  process.exitCode = problems.length ? 1 : 0;
}

// ---------- thumb: what the automation makes, drawn by the catalogue's own model ----------
async function thumb(root, id, scene) {
  sourceOf(root);
  if (!scene || scene.length < 40) throw new Error('describe the picture in a sentence or more: what this automation makes or watches, never a logo or words');
  const key = execFileSync('security', ['find-generic-password', '-s', 'fal-key', '-w'], { encoding: 'utf8' }).trim();
  const input = { prompt: `${scene} ${STYLE}`, aspect_ratio: '16:9', resolution: '1K', output_format: 'png', num_images: 1 };
  const res = await fetch(`https://fal.run/${MODEL}`, { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(300000) });
  if (!res.ok) throw new Error(`${MODEL} answered ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const url = json.images?.[0]?.url;
  if (!url) throw new Error(`${MODEL} returned no image: ${JSON.stringify(json).slice(0, 400)}`);
  const img = await fetch(url);
  if (!img.ok) throw new Error(`the image at ${url} answered ${img.status}`);
  const raw = join(mkdtempSync(join(tmpdir(), 'swarm-thumb-')), `${id}.png`);
  writeFileSync(raw, Buffer.from(await img.arrayBuffer()));
  mkdirSync(join(root, 'thumbs'), { recursive: true });
  execFileSync('magick', [raw, '-resize', `${W}x${H}^`, '-gravity', 'center', '-extent', `${W}x${H}`, '-strip', '-quality', '82', join(root, 'thumbs', `${id}.webp`)]);
  const meta = { id, model: MODEL, prompt: scene, request_id: res.headers.get('x-fal-request-id') ?? json.request_id ?? null, at: new Date().toISOString(), usd: PRICE };
  writeFileSync(join(root, 'thumbs', `${id}.json`), `${JSON.stringify(meta, null, 1)}\n`);
  console.log(`thumbs/${id}.webp made with ${MODEL} ($${PRICE})`);
}

// an app's own mark from its own site, as automations/CREDITS.txt sources the catalogue's: the record's iconUrl, else
// the favicon Google serves for the domain, else the site's apple-touch-icon; the first of 48px or more is kept.
// Returns [problem, url used].
async function fetchIcon(app) {
  const out = join(ICONS, `${app.key}.png`), from = join(ICONS, `${app.key}.source.txt`);
  if (existsSync(out)) return [null, existsSync(from) ? readFileSync(from, 'utf8').trim() : null];
  const tried = [];
  for (const url of [app.iconUrl, `https://www.google.com/s2/favicons?domain=${app.domain}&sz=128`, `https://${app.domain}/apple-touch-icon.png`].filter(Boolean)) {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) }).catch((e) => ({ ok: false, status: e.message }));
    if (!res.ok) { tried.push(`${url} answered ${res.status}`); continue; }
    const raw = join(mkdtempSync(join(tmpdir(), 'swarm-icon-')), 'icon');
    writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
    let width = 0;
    try { width = Number(execFileSync('magick', ['identify', '-format', '%w', `${raw}[0]`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()); } catch (e) { tried.push(`${url} is not an image (${e.message.split('\n')[0]})`); continue; }
    if (width < 48) { tried.push(`${url} is ${width}px`); continue; }
    execFileSync('magick', [`${raw}[0]`, '-resize', '64x64', '-strip', out]);
    writeFileSync(from, `${url}\n`);
    return [null, url];
  }
  return [`icon: no mark of 48px or more for ${app.domain} (${tried.join('; ')}); add newApp.iconUrl, an https link to the app's own logo or app icon on its site`, null];
}

// ---------- merge: every swarm's shipped records onto the tab ----------
async function mergeOnce() {
  mkdirSync(THUMBS, { recursive: true });
  const { apps, automations } = await baseCatalogue();
  const shipped = [], rejected = [];
  for (const swarm of sources()) {
    const dir = join(swarm.root, 'data');
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.jsonl'))) {
      const { records, bad } = readRecords(join(dir, f));
      for (const b of bad) rejected.push({ id: null, prefix: swarm.prefix, file: `data/${f}`, reasons: [b] });
      for (const rec of records) if (rec.status === 'ship') shipped.push({ rec, swarm, file: `data/${f}` });
    }
  }
  shipped.sort((a, b) => Date.parse(a.rec.created) - Date.parse(b.rec.created) || a.rec.id.localeCompare(b.rec.id));
  const newApps = {}, accepted = [], seen = new Set();
  for (const { rec, swarm, file } of shipped) {
    const reasons = recordProblems(rec, { prefix: swarm.prefix, apps, newApps, withThumb: true, root: swarm.root });
    if (seen.has(rec.id)) reasons.push('id: another file shipped this id first');
    const dup = duplicateOf(rec, [...automations, ...accepted]);
    if (dup) reasons.push(`duplicate: ${dup.why} (${dup.id})`);
    if (!reasons.length && rec.newApp && !newApps[rec.newApp.key]) {
      const [iconProblem, iconUrl] = await fetchIcon(rec.newApp);
      if (iconProblem) reasons.push(iconProblem);
      else newApps[rec.newApp.key] = { name: rec.newApp.name, icon: `${rec.newApp.key}.png`, topics: rec.newApp.topics.slice(0, 3), keywords: rec.newApp.keywords, domain: rec.newApp.domain, iconUrl };
    }
    if (reasons.length) { rejected.push({ id: rec.id, prefix: swarm.prefix, role: rec.role, file, reasons }); continue; }
    seen.add(rec.id);
    copyFileSync(join(swarm.root, 'thumbs', `${rec.id}.webp`), join(THUMBS, `${rec.id}.webp`));
    accepted.push({
      id: rec.id, title: rec.title.trim(), app: rec.app, topics: rec.topics, ...illustrativeFigures(rec.id), desc: rec.desc.trim(),
      thumb: `./automations/swarm/${rec.id}.webp`, trigger: rec.trigger, kpi: rec.kpi, swarm: swarm.prefix, role: rec.role, created: rec.created,
      _credit: JSON.parse(readFileSync(join(swarm.root, 'thumbs', `${rec.id}.json`), 'utf8')),
    });
  }
  const clean = accepted.map(({ _credit, ...a }) => a);
  writeAtomic(MODULE, `// Generated by tools/automations-swarm.f2db18c1.mjs merge, ${new Date().toISOString()}: the automations the swarms in
// swarm/sources.f2db18c1.json shipped, not shown on the Automations tab (automations.03378ba4.js). Never edit by hand; run the
// merge. Ratings and use counts are illustrative, as the creative's own are. Sources: automations/swarm/CREDITS.txt.
export const SWARM_APPS = ${JSON.stringify(newApps, null, 1)};
export const SWARM_AUTOMATIONS = ${JSON.stringify(clean, null, 1)};
`);
  const credits = accepted.map((a) => `  ${a.id}  ${a._credit.model}, ${a._credit.at}, request ${a._credit.request_id}: ${a._credit.prompt}`);
  const iconCredits = Object.entries(newApps).map(([k, v]) => `  ${k}  ${v.iconUrl ?? `no source recorded for ${v.domain}`}, scaled to 64px`);
  writeAtomic(join(THUMBS, 'CREDITS.txt'), `Sources for the swarm automations on the Automations tab. Never shown on screen.\nThumbnails (768x432), generated by the swarms' agents with tools/automations-swarm.f2db18c1.mjs thumb; no brand mark asked for:\n${credits.join('\n')}\nApp icons (../apps/), each app's own mark from its own site:\n${iconCredits.join('\n')}\nThe marks are their owners', used only to name the app an automation works in.\n`);
  const bySwarm = {};
  for (const s of sources()) bySwarm[s.prefix] = { archetype: s.archetype, accepted: 0, rejected: 0 };
  for (const a of clean) bySwarm[a.swarm].accepted++;
  for (const r of rejected) bySwarm[r.prefix].rejected++;
  writeAtomic(REPORT, `${JSON.stringify({ at: new Date().toISOString(), totals: { accepted: clean.length, rejected: rejected.length }, bySwarm, accepted: clean.map(({ id, title, app, swarm, role, created }) => ({ id, title, app, swarm, role, created })), rejected }, null, 1)}\n`);
  console.log(`merged: ${clean.length} on the tab, ${rejected.length} rejected (reasons in swarm/report.f2db18c1.json)`);
}

// one merge at a time: a merge asked for while another runs marks it dirty, and the running one goes round again
async function merge() {
  try { mkdirSync(LOCK); } catch (e) {
    if (e.code !== 'EEXIST') throw e;
    if (Date.now() - statSync(LOCK).mtimeMs < LOCK_STALE_MS) { writeFileSync(DIRTY, ''); return console.log('a merge is running; it will go round again and pick your records up'); }
    rmSync(LOCK, { recursive: true, force: true });
    mkdirSync(LOCK);
  }
  try {
    for (let pass = 0; pass < 5; pass++) {
      rmSync(DIRTY, { force: true });
      await mergeOnce();
      if (!existsSync(DIRTY)) break;
    }
  } finally {
    rmSync(LOCK, { recursive: true, force: true });
  }
}

// The owner stopped the swarms on 2026-10-21: the Automations tab shows only the creative's own two automations, so no
// command checks, pays for a thumbnail or merges any more. Set to null to let the swarms run again.
const STOPPED = 'the automation swarms are stopped by the owner (2026-10-21): the Automations tab no longer shows swarm automations. Stop your rounds: do not ship, generate thumbnails or merge, and do not route around this.';

const [cmd, ...rest] = process.argv.slice(2);
const commands = { check: () => check(...rest), thumb: () => thumb(rest[0], rest[1], rest.slice(2).join(' ')), merge };
if (!commands[cmd]) {
  console.error(`usage: node ${basename(fileURLToPath(import.meta.url))} check <project-root> <jsonl-file> <id> | thumb <project-root> <id> "<scene>" | merge`);
  process.exit(2);
}
if (STOPPED) {
  console.error(`STOPPED ${cmd}: ${STOPPED}`);
  process.exit(3);
}
await commands[cmd]();
