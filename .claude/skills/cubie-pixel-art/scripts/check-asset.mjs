#!/usr/bin/env node
/**
 * Check one sprite against its manifest row.
 *
 *   node check-asset.mjs <file.png> <id> [manifest.yaml]
 *   node check-asset.mjs <file.png> --row '{"id":"crate","layer":"structure","size":[1,1],…}'
 *
 * Checks: transparent background (alpha 0/255, clear corners); width ≤ footprint
 * × 32; height ≤ footprint + overhead_rows tiles and within the size class (art
 * system §7); stands on the bottom row (not decals, items, ui); no baked ground
 * shadow (a dark, flat band at the feet wider than the object); ramp membership;
 * the emissive split (`<name>_emissive.png` beside it: same size, glow colours
 * only, nothing floating), and glow colours baked into the base.
 *
 * The shadow test is a heuristic — it says "looks like", and a person decides.
 * Exits 1 on any error, 2 on bad usage. Reads only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { readPng } from './png.mjs';
import { EMISSIVE, STRIP_KEY, eachPixel, hsv, manifests, paletteSet, ramps, readManifest, repoRoot, rgbHex } from './lib.mjs';

const T = 32;
/** Max height in px by layer (art system §7). */
const CLASS_H = { decal: 16, vegetation: 64, node: 80, structure: 128, item: 32, ui: Infinity, ground: 32, character: 48, overlay: 48 };
const STANDS = new Set(['vegetation', 'node', 'structure', 'character', 'overlay']);

export function checkAsset(file, row) {
  const errors = [], warnings = [];
  const img = readPng(file); const { width: w, height: h } = img;
  const pal = paletteSet(); const glow = new Set([...EMISSIVE, STRIP_KEY]);
  let soft = 0, minY = h, maxY = -1, minX = w, maxX = -1, baked = 0; const off = new Set();
  const rowW = Array(h).fill(0);
  eachPixel(img, (x, y, r, g, b, a) => {
    if (a !== 255) soft++;
    const c = rgbHex(r, g, b); if (!pal.has(c)) off.add(c); if (glow.has(c)) baked++;
    rowW[y]++; minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  });
  if (maxY < 0) return { errors: ['the sprite is empty'], warnings };
  if (soft) errors.push(`${soft} half-transparent pixels (alpha must be 0 or 255)`);
  for (const [x, y] of [[0, 0], [w - 1, 0]]) if (img.data[(y * w + x) * 4 + 3]) errors.push(`corner ${x},${y} is opaque — background baked in?`);
  if (off.size) errors.push(`${off.size} colours off the ${ramps().source} ramps: ${[...off].slice(0, 8).join(' ')}`);

  const layer = row.layer;
  if (Array.isArray(row.size)) {
    const [fw, fh] = row.size; const over = row.overhead_rows ?? 0;
    if (w > fw * T) errors.push(`${w} px wide; footprint ${fw} tile(s) allows ${fw * T} (a wider sprite gains a blocked column)`);
    if (h > (fh + over) * T) errors.push(`${h} px tall; footprint ${fh} + overhead_rows ${over} allows ${(fh + over) * T} (overhang is upward only, and must be declared)`);
  }
  const art = maxY - minY + 1;
  if (CLASS_H[layer] !== undefined && art > CLASS_H[layer]) errors.push(`the art is ${art} px tall; the ${layer} class allows ${CLASS_H[layer]}`);
  if (STANDS.has(layer) && maxY !== h - 1) warnings.push(`lowest pixel on row ${maxY}, not ${h - 1} — it should stand on the bottom edge of its footprint`);

  // baked shadow: the bottom 1–3 rows are dark and wider than the body above them
  if (STANDS.has(layer) && maxY - minY > 6) {
    const body = Math.max(...rowW.slice(minY, maxY - 3));
    let dark = 0, n = 0;
    for (let y = maxY - 2; y <= maxY; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (!img.data[o + 3]) continue; n++; if (hsv(img.data[o], img.data[o + 1], img.data[o + 2]).v < 0.3) dark++; }
    if (rowW[maxY] > body * 1.15 && dark / Math.max(n, 1) > 0.6) warnings.push(`the bottom rows are dark and ${rowW[maxY]} px wide against a ${body} px body — looks like a baked ground shadow`);
  }

  const em = file.replace(/\.png$/, '_emissive.png');
  if (fs.existsSync(em)) {
    const e = readPng(em);
    if (e.width !== w || e.height !== h) errors.push(`${path.basename(em)} is ${e.width}×${e.height}, expected ${w}×${h}`);
    else {
      let floating = 0; const wrong = new Set();
      eachPixel(e, (x, y, r, g, b) => { if (!img.data[(y * w + x) * 4 + 3]) floating++; const c = rgbHex(r, g, b); if (!glow.has(c)) wrong.add(c); });
      if (floating) errors.push(`${path.basename(em)}: ${floating} glowing pixels with nothing under them`);
      if (wrong.size) warnings.push(`${path.basename(em)} has colours outside the emissive set: ${[...wrong].slice(0, 6).join(' ')}`);
    }
  } else if (row.emissive || row.light) errors.push(`row says emissive/light but ${path.basename(em)} is missing`);
  if (baked && layer !== 'ui') warnings.push(`${baked} glowing-colour pixels in the base sprite; draw the object "off" and put the glow on _emissive`);
  if (row.placeholder === undefined) warnings.push('row has no placeholder flag');
  return { errors, warnings };
}

function findRow(id, manifestFile) {
  const lists = manifestFile ? [{ rows: readManifest(manifestFile) }] : manifests(repoRoot() ?? process.cwd());
  for (const m of lists) { const r = m.rows.find((x) => String(x.id) === id); if (r) return r; }
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  const file = a[0];
  let row = null;
  if (a[1] === '--row') { try { row = JSON.parse(a[2]); } catch (e) { console.error(`--row is not JSON: ${e.message}`); process.exit(2); } }
  else if (a[1]) row = findRow(a[1], a[2]);
  if (!file || !row) { console.error(a[1] && !row ? `no manifest row "${a[1]}"` : 'usage: node check-asset.mjs <file.png> <id> [manifest.yaml] | <file.png> --row <json>'); process.exit(2); }
  const { errors, warnings } = checkAsset(file, row);
  for (const w of warnings) console.log(`WARN  ${w}`);
  for (const e of errors) console.log(`ERROR ${e}`);
  console.log(`${errors.length ? 'FAIL' : 'ok  '} ${file} as ${row.id} (${row.layer}): ${errors.length} errors, ${warnings.length} warnings`);
  process.exit(errors.length ? 1 : 0);
}
