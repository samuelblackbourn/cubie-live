// One animated APNG for a group of clips: a row per clip, a column per direction
// (blank where the clip has no such direction), each clip playing at its own fps on
// a shared 20 fps timeline, composited like the renderer (face, strip, emissive).
//   node art/src/cubie/group-preview.mjs <clip-dir> <out.png> clip[,clip…] [--scale 3] [--seconds 3] [--night]
import fs from 'node:fs';
import path from 'node:path';
import { blank } from '../../../.claude/skills/cubie-pixel-art/scripts/png.mjs';
import { meadow, nightTint, over } from '../../../.claude/skills/cubie-pixel-art/scripts/lib.mjs';
import { composite, encodeApng } from '../../../.claude/skills/cubie-pixel-art/scripts/preview.mjs';

const a = process.argv.slice(2);
const opt = (f, d) => (a.includes(f) ? a[a.indexOf(f) + 1] : d);
const [dir, out, list] = a.filter((x, i) => !x.startsWith('--') && !['--scale', '--seconds'].includes(a[i - 1]));
const rows = list.split(',').map((r) => { const [c, ...show] = r.split('+'); return { c, show, label: r }; }); const clips = rows.map((r) => r.label); const k = Number(opt('--scale', 3)); const secs = Number(opt('--seconds', 3)); const TL = 20;
const DIRS = ['S', 'W', 'E', 'N']; const P = 4, cw = 32 + P * 2;
const J = Object.fromEntries(rows.map((r) => [r.label, JSON.parse(fs.readFileSync(path.join(dir, `${r.c}.json`), 'utf8'))])); const ROW = Object.fromEntries(rows.map((r) => [r.label, r]));
const FH = Math.max(...Object.values(J).map((j) => j.frame.h)); const ch = FH + P; // leg-kit clips are taller; everyone stands on the same ground row
const cache = new Map();
const cell = (c, d, f) => { const key = `${c}|${d}|${f}`; if (!cache.has(key)) { const R = ROW[c]; const held = R.show.find((x) => x.startsWith('held.'))?.slice(5) ?? null; const { body, glow } = composite(dir, R.c, d, f, { show: R.show, held }); const oy = P + FH - J[c].frame.h; const m = meadow(cw, ch); over(m, body, P, oy); if (a.includes('--night')) { const g = blank(cw, ch); over(g, glow, P, oy); nightTint(m, g); } cache.set(key, m); } return cache.get(key); };
const frames = [];
for (let t = 0; t < secs * TL; t++) {
  const img = blank(DIRS.length * cw * k, clips.length * ch * k);
  clips.forEach((c, r) => DIRS.forEach((d, col) => {
    const j = J[c]; if (!j.dirs.includes(d)) return;
    const n = Math.floor((t / TL) * j.fps); const f = j.loop ? n % j.count : Math.min(n % (j.count + Math.ceil(j.fps / 2)), j.count - 1); // one-shots hold their last frame a beat, then replay
    over(img, cell(c, d, f), col * cw * k, r * ch * k, k);
  }));
  frames.push(img);
}
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, encodeApng(frames, 1000 / TL));
console.log(`wrote ${out}: ${clips.join(', ')} — ${frames.length} frames`);
