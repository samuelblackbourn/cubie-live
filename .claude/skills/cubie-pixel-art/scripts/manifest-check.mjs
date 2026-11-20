#!/usr/bin/env node
/**
 * Check art manifests: schema, unique ids, every PNG has a row, every row a PNG.
 *
 *   node manifest-check.mjs [manifest.yaml …]     (default: every manifest under art/)
 *
 * Row shape (skill §5):
 *   id, layer (ground|decal|vegetation|node|structure|item|ui|character|overlay),
 *   biomes[], size [w,h] in tiles, states[], variants[], block, overhead_rows,
 *   light? {radius, colour}, emissive?, placeholder, deferred?, licence "original",
 *   author "the creator"
 * `character` and `overlay` rows (Cubie's clips, held tools) may leave size,
 * biomes and block out. A PNG belongs to a row when its name is the id, or the
 * id followed by "_" or "." (birch_ripe.png, walk_emissive.png, walk.axe.png).
 * Folder: art/manifests/<name>.yaml describes art/<name>/; a manifest.yaml
 * describes its own folder.
 *
 * Exits 1 on any error, 2 on bad usage. Reads only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { manifests, readManifest, repoRoot } from './lib.mjs';

export const LAYERS = ['ground', 'decal', 'vegetation', 'node', 'structure', 'item', 'ui', 'character', 'overlay'];
const LOOSE = new Set(['character', 'overlay', 'ui', 'item']);

export function checkRows(rows, folder, where) {
  const errors = [], warnings = [];
  const E = (id, m) => errors.push(`${where}${id ? ` [${id}]` : ''}: ${m}`);
  const seen = new Set();
  for (const r of rows) {
    const id = r.id;
    if (!id) { E(null, 'row without id'); continue; }
    if (seen.has(id)) E(id, 'duplicate id'); seen.add(id);
    if (!/^[a-z0-9][a-z0-9_.-]*(@[a-z0-9_]+)?$/.test(String(id))) E(id, 'id must be lower-case letters, digits, _ . - (plus @<kit> for a leg-kit variant)');
    if (!LAYERS.includes(r.layer)) E(id, `layer "${r.layer}" is not one of ${LAYERS.join('|')}`);
    if (!LOOSE.has(r.layer)) {
      if (!Array.isArray(r.size) || r.size.length !== 2 || !r.size.every((n) => Number.isInteger(n) && n > 0)) E(id, 'size must be [w, h] in whole tiles');
      if (!Array.isArray(r.biomes) || !r.biomes.length) E(id, 'biomes must be a non-empty list');
      if (typeof r.block !== 'boolean') E(id, 'block must be true or false');
    }
    for (const k of ['states', 'variants']) if (r[k] !== undefined && !Array.isArray(r[k])) E(id, `${k} must be a list`);
    if (r.overhead_rows !== undefined && !(Number.isInteger(r.overhead_rows) && r.overhead_rows >= 0)) E(id, 'overhead_rows must be a whole number ≥ 0');
    if (r.light !== undefined && !(r.light && r.light.radius > 0 && /^#[0-9a-f]{6}$/i.test(r.light.colour ?? ''))) E(id, 'light must be { radius: n, colour: "#rrggbb" }');
    if (typeof r.placeholder !== 'boolean') E(id, 'placeholder must be true or false');
    if (r.licence !== 'original') E(id, 'licence must be "original"');
    if (r.author !== 'the creator') E(id, 'author must be "the creator" (CLAUDE.md rule 5: no names)');
    if (['node', 'structure'].includes(r.layer) && r.interactive !== false && !(r.states ?? []).length) warnings.push(`${where} [${id}]: interactive ${r.layer} without states (bare/ripe, intact/mined, under-construction/built)`);
  }
  // files
  const belongs = (id, f) => { const b = f.replace(/\.(png|json)$/, ''); return b === id || b.startsWith(`${id}_`) || b.startsWith(`${id}.`); };
  if (fs.existsSync(folder)) {
    const pngs = fs.readdirSync(folder).filter((f) => f.endsWith('.png'));
    const ids = rows.map((r) => String(r.id)).sort((p, q) => q.length - p.length);
    for (const f of pngs) if (!ids.some((id) => belongs(id, f))) E(null, `${f} has no manifest row`);
    for (const r of rows) if (r.id && !pngs.some((f) => belongs(String(r.id), f))) E(r.id, `no PNG in ${folder}`);
  } else if (rows.length) E(null, `folder ${folder} does not exist`);
  return { errors, warnings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = repoRoot();
  const given = process.argv.slice(2);
  const list = given.length
    ? given.map((f) => { const p = path.resolve(f); const inManifests = path.basename(path.dirname(p)) === 'manifests'; return { file: p, folder: inManifests ? path.join(path.dirname(path.dirname(p)), path.basename(p).replace(/\.ya?ml$/, '')) : path.dirname(p), rows: readManifest(p) }; })
    : root ? manifests(root) : [];
  if (!list.length) { console.log('no manifests found'); process.exit(0); }
  let errs = 0; const allIds = new Map();
  for (const m of list) {
    const where = root ? path.relative(root, m.file) : m.file;
    const { errors, warnings } = checkRows(m.rows, m.folder, where);
    for (const r of m.rows) { if (allIds.has(r.id)) errors.push(`${where} [${r.id}]: id also used in ${allIds.get(r.id)}`); else allIds.set(r.id, where); }
    for (const w of warnings) console.log(`WARN  ${w}`);
    for (const e of errors) console.log(`ERROR ${e}`);
    console.log(`${errors.length ? 'FAIL' : 'ok  '} ${where}: ${m.rows.length} rows`);
    errs += errors.length;
  }
  process.exit(errs ? 1 : 0);
}
