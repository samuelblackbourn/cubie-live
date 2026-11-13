#!/usr/bin/env node
/**
 * Look sheets on the island's ground. sheet.mjs (unchanged from the office) puts
 * sprites on a flat grey; this puts them on the placeholder meadow, and with
 * --night shows each one twice — day, then under the night tint with its
 * _emissive layer left untinted — because night is the second test.
 *
 *   node look.mjs --out look/all.png [--scale 4] [--night] [--cols 8] files…
 *
 * A clip strip (with <clip>.json beside it) is shown composited like the
 * renderer will (face overlay, tinted strip, emissive) at --frame n (default 0),
 * one cell per direction; use preview.mjs to see it move. Files are drawn in the order given,
 * left to right, and listed on stdout with their cell numbers.
 */
import fs from 'node:fs';
import path from 'node:path';
import { blank, readPng, writePng } from './png.mjs';
import { crop, meadow, nightTint, over } from './lib.mjs';
import { composite } from './preview.mjs';

const a = process.argv.slice(2);
const opt = (f, d) => (a.includes(f) ? a[a.indexOf(f) + 1] : d);
const out = opt('--out', null); const scale = Number(opt('--scale', 4)); const cols = Number(opt('--cols', 8)); const night = a.includes('--night');
const files = a.filter((x, i) => !x.startsWith('--') && !['--out', '--scale', '--cols', '--frame'].includes(a[i - 1]));
if (!out || !files.length) { console.error('usage: node look.mjs --out file.png [--scale 4] [--night] [--cols 8] files…'); process.exit(2); }

const sprites = [];
for (const f of files) {
  const img = readPng(f); const em = f.replace(/\.png$/, '_emissive.png'); const e = fs.existsSync(em) ? readPng(em) : null;
  const jf = f.replace(/(_emissive)?\.png$/, '.json');
  if (fs.existsSync(jf)) {
    const j = JSON.parse(fs.readFileSync(jf, 'utf8'));
    const frame = Number(opt('--frame', 0));
    (j.dirs ?? ['S', 'W', 'E', 'N']).forEach((d) => { const { body, glow } = composite(path.dirname(f), path.basename(jf, '.json'), d, frame); sprites.push({ label: `${path.basename(f, '.png')} ${d}`, img: body, em: glow }); });
  } else sprites.push({ label: path.basename(f, '.png'), img, em: e });
}
const PAD = 8; const cw = Math.max(...sprites.map((s) => s.img.width)) + PAD * 2; const ch = Math.max(...sprites.map((s) => s.img.height)) + PAD * 2;
const per = night ? 2 : 1; const nc = Math.min(cols, sprites.length); const nr = Math.ceil(sprites.length / nc);
const sheet = blank(nc * cw * per * scale + (nc - 1) * scale * 2, nr * ch * scale + (nr - 1) * scale * 2);
sprites.forEach((s, i) => {
  const x0 = (i % nc) * (cw * per * scale + scale * 2); const y0 = Math.floor(i / nc) * (ch * scale + scale * 2);
  for (let k = 0; k < per; k++) {
    const cell = meadow(cw, ch); over(cell, s.img, Math.floor((cw - s.img.width) / 2), ch - PAD - s.img.height);
    if (k === 1) { const e = blank(cw, ch); if (s.em) over(e, s.em, Math.floor((cw - s.img.width) / 2), ch - PAD - s.img.height); nightTint(cell, e); }
    over(sheet, cell, x0 + k * cw * scale, y0, scale);
  }
  console.log(`${String(i + 1).padStart(3)}  ${s.label}`);
});
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
writePng(out, sheet);
console.log(`wrote ${out} (${sheet.width}×${sheet.height}), ${sprites.length} sprites${night ? ', day | night' : ''}`);
