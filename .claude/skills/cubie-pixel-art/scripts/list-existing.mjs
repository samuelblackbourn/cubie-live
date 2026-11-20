#!/usr/bin/env node
/**
 * What does the island already have? Run before planning a single new asset.
 *
 *   node list-existing.mjs [--grep word[,word…]] [--sets] [--json]
 *
 * Lists every row in art/manifests/*.yaml and art/<folder>/manifest.yaml: id,
 * layer, size in tiles, states, variants, the PNGs that belong to it, and the
 * placeholder / deferred flags. With --sets it also lists the art sets pinned in
 * content/sets.json and whether each is pulled locally (tools/pull-set.sh <set>),
 * with the asset ids in each pulled set's manifest.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { manifests, repoRoot } from './lib.mjs';

const a = process.argv.slice(2);
const grep = a.includes('--grep') ? a[a.indexOf('--grep') + 1].toLowerCase().split(',') : null;
const root = repoRoot();
if (!root) { console.error('Run inside the cubie-live checkout.'); process.exit(2); }

const belongs = (id, f) => { const b = f.replace(/\.png$/, ''); return b === id || b.startsWith(`${id}_`) || b.startsWith(`${id}.`); };
const rows = [];
for (const m of manifests(root)) {
  const pngs = fs.existsSync(m.folder) ? fs.readdirSync(m.folder).filter((f) => f.endsWith('.png')) : [];
  for (const r of m.rows) rows.push({ ...r, manifest: path.relative(root, m.file), files: pngs.filter((f) => belongs(String(r.id), f)) });
}
const sets = [];
if (a.includes('--sets')) {
  const sj = path.join(root, 'content/sets.json');
  const pins = fs.existsSync(sj) ? JSON.parse(fs.readFileSync(sj, 'utf8')) : {};
  for (const [name, pin] of Object.entries(pins.sets ?? pins)) {
    const version = typeof pin === 'string' ? pin : pin.version;
    const local = path.join(root, 'content', name, String(version), 'manifest.json');
    const pulled = fs.existsSync(local);
    const assets = pulled ? (JSON.parse(fs.readFileSync(local, 'utf8')).assets ?? []).map((x) => x.id ?? x) : [];
    sets.push({ name, version, pulled, assets });
  }
}
const hit = (r) => !grep || grep.some((g) => JSON.stringify(r).toLowerCase().includes(g));
const out = rows.filter(hit).sort((p, q) => String(p.id).localeCompare(String(q.id)));
if (a.includes('--json')) { console.log(JSON.stringify({ rows: out, sets }, null, 2)); process.exit(0); }
for (const r of out) {
  const flags = [r.placeholder && 'placeholder', r.deferred && 'deferred', r.reuse && 'reuse'].filter(Boolean).join(' ');
  console.log(`${String(r.id).padEnd(24)} ${String(r.layer ?? '?').padEnd(11)} ${Array.isArray(r.size) ? `${r.size.join('×')}t` : '   '}  states:${(r.states ?? []).join(',') || '-'}  variants:${(r.variants ?? []).join(',') || '-'}${flags ? `  [${flags}]` : ''}\n${' '.repeat(24)} ${r.files.length} png — ${r.manifest}`);
}
console.log(`${out.length} of ${rows.length} manifest rows`);
for (const s of sets) {
  const hits = grep ? s.assets.filter((x) => grep.some((g) => String(x).toLowerCase().includes(g))) : s.assets;
  console.log(`set ${s.name}@${s.version}: ${s.pulled ? `pulled, ${s.assets.length} assets${grep ? `, ${hits.length} match: ${hits.join(', ')}` : ''}` : 'NOT pulled — run tools/pull-set.sh ' + s.name}`);
}
if (a.includes('--sets') && !sets.length) console.log('no sets pinned in content/sets.json');
