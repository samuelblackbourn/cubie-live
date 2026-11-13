#!/usr/bin/env node
/**
 * Look sheets: enlarge sprites so they can be judged, with a label on each.
 *
 *   node sheet.mjs --out look/all-assets.png [--scale 4] [--cols 6] files…
 *   node sheet.mjs --pairs pass1/assets pass2/assets --out look/before-after.png [--scale 5]
 *
 * The first form is a contact sheet of the files given. The second pairs every
 * PNG under the pass-2 folder with the PNG of the same asset folder and facing
 * under pass 1 (X.png pairs with X.png or X_FRONT.png; a file with no partner
 * is shown alone and marked NEW). Left = pass 1, right = pass 2.
 */
import fs from 'node:fs';
import path from 'node:path';
import { readPng, writePng, blank } from './png.mjs';

const a = process.argv.slice(2);
const opt = (f, d) => (a.includes(f) ? a[a.indexOf(f) + 1] : d);
const out = opt('--out', null);
const scale = Number(opt('--scale', 4));
const BG = [104, 112, 120, 255];
if (!out) { console.error('usage: sheet.mjs --out file.png [--scale n] [--cols n] files…  |  --pairs pass1dir pass2dir --out file.png'); process.exit(2); }

// 3×5 font, enough for asset ids
const GL = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '101111111111101', O: '010101101101010', P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100110101010', 7: '111001010010010', 8: '010101010101010', 9: '010101011001110', _: '000000000000111', '-': '000000111000000', '|': '010010010010010', ' ': '000000000000000' };
const text = (img, s, x, y, k = 2) => { let cx = x; for (const ch of s.toUpperCase()) { const g = GL[ch] ?? GL['-']; for (let i = 0; i < 15; i++) if (g[i] === '1') for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const X = cx + (i % 3) * k + dx, Y = y + Math.floor(i / 3) * k + dy; if (X < img.width && Y < img.height) img.data.set([236, 236, 228, 255], (Y * img.width + X) * 4); } cx += 4 * k; } };
const textW = (s, k = 2) => s.length * 4 * k;
const put = (img, src, x, y) => { for (let yy = 0; yy < src.height; yy++) for (let xx = 0; xx < src.width; xx++) { const o = (yy * src.width + xx) * 4; if (src.data[o + 3] < 128) continue; for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) { const X = x + xx * scale + dx, Y = y + yy * scale + dy; if (X < img.width && Y < img.height) img.data.set(src.data.subarray(o, o + 4), (Y * img.width + X) * 4); } } };
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.png') ? [path.join(d, e.name)] : []));

let cells = []; // { label, images: [png, …] }
if (a.includes('--pairs')) {
  const [p1, p2] = [a[a.indexOf('--pairs') + 1], a[a.indexOf('--pairs') + 2]];
  const first = new Map(walk(p1).map((f) => [path.basename(f, '.png'), f]));
  for (const f of walk(p2).sort()) {
    const id = path.basename(f, '.png');
    const before = first.get(id) ?? first.get(id.replace(/_FRONT$/, ''));
    cells.push(before ? { label: `${id}  1 | 2`, images: [readPng(before), readPng(f)] } : { label: `${id}  NEW`, images: [readPng(f)] });
  }
} else {
  const skip = new Set(['--out', '--scale', '--cols']);
  const files = a.filter((x, i) => !x.startsWith('--') && !skip.has(a[i - 1]));
  cells = files.map((f) => ({ label: path.basename(f, '.png'), images: [readPng(f)] }));
}
if (!cells.length) { console.error('nothing to show'); process.exit(2); }
const PAD = 12, LAB = 16, GAP = 6;
for (const c of cells) { c.w = Math.max(c.images.reduce((n, i) => n + i.width * scale + GAP, -GAP), textW(c.label)); c.h = Math.max(...c.images.map((i) => i.height * scale)) + LAB; }
const maxW = Number(opt('--cols', 0)) ? null : 1800;
const cols = Number(opt('--cols', 0));
const rows = [[]]; let x = PAD;
for (const c of cells) { const row = rows[rows.length - 1]; if (row.length && ((cols && row.length >= cols) || (maxW && x + c.w + PAD > maxW))) { rows.push([]); x = PAD; } rows[rows.length - 1].push(c); x += c.w + PAD; }
const W = Math.max(...rows.map((r) => r.reduce((n, c) => n + c.w + PAD, PAD)));
const H = rows.reduce((n, r) => n + Math.max(...r.map((c) => c.h)) + PAD, PAD);
const img = blank(W, H); for (let i = 0; i < img.data.length; i += 4) img.data.set(BG, i);
let y = PAD;
for (const r of rows) { let cx = PAD; const rh = Math.max(...r.map((c) => c.h)); for (const c of r) { text(img, c.label, cx, y); let ix = cx; for (const i of c.images) { put(img, i, ix, y + LAB + (rh - LAB - i.height * scale)); ix += i.width * scale + GAP; } cx += c.w + PAD; } y += rh + PAD; }
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
writePng(out, img);
console.log(`wrote ${out} (${W}×${H}), ${cells.length} ${a.includes('--pairs') ? 'pieces compared' : 'sprites'}`);
