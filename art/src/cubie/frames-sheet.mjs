// Look sheet for a clip: every frame (columns) × every direction (rows), composited
// the way the renderer will (face overlay, tinted strip, emissive), on the meadow.
//   node art/src/cubie/frames-sheet.mjs <clip-dir> <clip> <out.png> [--scale 5] [--night]
import fs from 'node:fs';
import path from 'node:path';
import { blank, writePng } from '../../../.claude/skills/cubie-pixel-art/scripts/png.mjs';
import { meadow, nightTint, over } from '../../../.claude/skills/cubie-pixel-art/scripts/lib.mjs';
import { composite } from '../../../.claude/skills/cubie-pixel-art/scripts/preview.mjs';

const a = process.argv.slice(2);
const [dir, clip, out] = a.filter((x, i) => !x.startsWith('--') && a[i - 1] !== '--scale');
const scale = Number(a.includes('--scale') ? a[a.indexOf('--scale') + 1] : 5);
const j = JSON.parse(fs.readFileSync(path.join(dir, `${clip}.json`), 'utf8'));
const dirs = j.dirs; const P = 4, cw = j.frame.w + P * 2, ch = j.frame.h + P;
const img = blank(cw * j.count * scale, ch * dirs.length * scale);
dirs.forEach((d, r) => { for (let f = 0; f < j.count; f++) {
  const { body, glow } = composite(dir, clip, d, f); const cell = meadow(cw, ch); over(cell, body, P, P);
  if (a.includes('--night')) { const g = blank(cw, ch); over(g, glow, P, P); nightTint(cell, g); }
  // a 1-px guide line on row 47 (the ground) every frame, so foot contact and bob read
  for (let x = 0; x < cw; x++) if (!cell.data[((P + 47) * cw + x) * 4 + 3] || x < P || x >= cw - P) { /* keep */ }
  over(img, cell, f * cw * scale, r * ch * scale, scale);
  for (let y = 0; y < ch * scale; y++) img.data.set([30, 34, 40, 255], ((r * ch * scale + y) * img.width + f * cw * scale) * 4);
} });
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
writePng(out, img);
console.log(`wrote ${out}: ${clip} ${j.count} frames × ${dirs.join(',')}`);
