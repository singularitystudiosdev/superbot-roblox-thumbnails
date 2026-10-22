// Fetches the fx pack (../fx-pack.d3748edf.js) into ../fx/pack: each icon's Fluent Emoji 3D PNG (256px) from
// microsoft/fluentui-emoji at the head of main, scaled to 96px with sips as fx/*.png and ../img/fx were. Icons already
// on disk are kept unless --force. Writes ../debug/fx-pack.d3748edf/run.json, one entry per icon.
//   node tools/fx-pack.d3748edf.mjs [--force] [--only key,key]
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { PACK_FX, packSlug } from '../fx-pack.d3748edf.js';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'fx/pack');
const REPORT = join(ROOT, 'debug/fx-pack.d3748edf/run.json');
const REPO = 'microsoft/fluentui-emoji';
const SIZE = 96;
const PARALLEL = 12;

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;

const getJson = async (url) => {
  const res = await fetch(url, { headers: { accept: 'application/vnd.github+json', 'user-agent': 'fx-pack' } });
  if (!res.ok) throw new Error(`${url}: ${res.status} ${await res.text()}`);
  return res.json();
};

// every emoji's 3D picture by slug; a person's is its Default (yellow) tone, as the creative's are
const fluentPaths = (tree) => {
  const paths = new Map();
  for (const { path } of tree) {
    const plain = path.match(/^assets\/[^/]+\/3D\/(.+)_3d\.png$/);
    const tone = path.match(/^assets\/[^/]+\/Default\/3D\/(.+)_3d_default\.png$/);
    const name = plain?.[1] ?? tone?.[1];
    if (name && !(tone && paths.has(packSlug(name)))) paths.set(packSlug(name), path);
  }
  return paths;
};

const exists = (file) => stat(file).then(() => true, () => false);

async function fetchIcon(key, path, sha, scratch) {
  const started = Date.now();
  const file = join(OUT, `${key}.png`);
  const entry = { key, source: path, file: `fx/pack/${key}.png` };
  if (!force && (await exists(file))) return { ...entry, status: 'kept' };
  const url = `https://raw.githubusercontent.com/${REPO}/${sha}/${path.split('/').map(encodeURIComponent).join('/')}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const raw = join(scratch, `${key}.png`);
    await writeFile(raw, Buffer.from(await res.arrayBuffer()));
    await run('sips', ['-Z', String(SIZE), raw, '--out', file]);
    const size = async () => [...(await run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file])).stdout.matchAll(/pixel(?:Width|Height): (\d+)/g)].map((m) => Number(m[1]));
    let [w, h] = await size();
    // a few sources are not square (keycap_5, ringed_planet): centred on a transparent 96px square like the rest
    if (w !== SIZE || h !== SIZE) {
      await run('sips', ['--padToHeightWidth', String(SIZE), String(SIZE), file]);
      [w, h] = await size();
    }
    return { ...entry, status: 'fetched', width: w, height: h, bytes: (await stat(file)).size, ms: Date.now() - started };
  } catch (err) {
    console.error(`${key}:`, err.stack ?? err);
    return { ...entry, status: 'failed', error: String(err.message ?? err), ms: Date.now() - started };
  }
}

async function main() {
  const { sha } = await getJson(`https://api.github.com/repos/${REPO}/commits/main`);
  const { tree, truncated } = await getJson(`https://api.github.com/repos/${REPO}/git/trees/${sha}?recursive=1`);
  if (truncated) throw new Error('the repo tree came back truncated');
  const paths = fluentPaths(tree);
  const keys = Object.keys(PACK_FX).filter((key) => !only || only.has(key));
  const missing = keys.filter((key) => !paths.has(key));
  if (missing.length) throw new Error(`not in ${REPO}@${sha}: ${missing.join(' ')}`);

  await mkdir(OUT, { recursive: true });
  await mkdir(dirname(REPORT), { recursive: true });
  const scratch = await mkdtemp(join(tmpdir(), 'fx-pack-'));
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < keys.length) {
      const key = keys[next++];
      results.push(await fetchIcon(key, paths.get(key), sha, scratch));
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  await rm(scratch, { recursive: true, force: true });

  results.sort((a, b) => a.key.localeCompare(b.key));
  const count = (status) => results.filter((r) => r.status === status).length;
  const wrongSize = results.filter((r) => r.status === 'fetched' && (r.width !== SIZE || r.height !== SIZE));
  const summary = { repo: REPO, commit: sha, at: new Date().toISOString(), icons: keys.length, fetched: count('fetched'), kept: count('kept'), failed: count('failed'), wrongSize: wrongSize.map((r) => r.key) };
  await writeFile(REPORT, `${JSON.stringify({ ...summary, results }, null, 2)}\n`);
  console.log(JSON.stringify(summary));
  if (summary.failed || wrongSize.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});
