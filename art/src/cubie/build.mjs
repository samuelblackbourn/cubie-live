// Cubie's P2 placeholder clips (art-01 step 3): idle 4 and walk 8 × S, W, E, N,
// the face overlay sheets, the emissive layers and the clip JSON — all drawn from
// model O in model.mjs. PixelLab makes the canonical sheets in P3.
//
//   node art/src/cubie/build.mjs <out-dir> [--only clip,clip]
//
// Before writing anything it checks that model.mjs, in 'approved' mode at rest,
// still reproduces art/reference/cubie/ byte for byte; if not, it stops (rerun
// turnaround.mjs after an approved change to the model).
// art/cubie/pass1 and pass2 are the look-and-fix passes of the first head, kept
// for the record; this script now builds only the current model.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { paint, sheet } from '../../../.claude/skills/cubie-pixel-art/scripts/pix.mjs';
import { blank, encodePng, writePng } from '../../../.claude/skills/cubie-pixel-art/scripts/png.mjs';
import { APPROVED_FACES, FACE_NAMES, PINK, TEAL, W, H, draw } from './model.mjs';
import { CLIPS } from './clips.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith('--'));
if (!out) { console.error('usage: node art/src/cubie/build.mjs <out-dir>'); process.exit(2); }

const DIRS = ['S', 'W', 'E', 'N'];
const toImg = (rows) => { const img = sheet(W, H); paint(img, rows); return img; };

// ── 1. same model as the approved turnaround ────────────────────────────────
{
  const ref = path.join(root, 'art/reference/cubie');
  const bad = [];
  for (const d of DIRS) if (!encodePng(toImg(draw(d, { mode: 'approved' }).rows)).equals(fs.readFileSync(path.join(ref, `cubie_${d}.png`)))) bad.push(`cubie_${d}`);
  for (const f of APPROVED_FACES) if (!encodePng(toImg(draw('S', { mode: 'approved', face: f }).rows)).equals(fs.readFileSync(path.join(ref, 'faces', `${f}.png`)))) bad.push(`faces/${f}`);
  if (bad.length) { console.error(`model.mjs no longer reproduces the approved reference: ${bad.join(', ')}`); process.exit(1); }
  console.log('model O reproduces art/reference/cubie/ byte for byte (4 facings, 7 faces)');
}

// ── 2. the clips (clips.mjs) ───────────────────────────────────────────────
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;

fs.mkdirSync(out, { recursive: true });
for (const [clip, c] of Object.entries(CLIPS)) {
  if (only && !only.includes(clip)) continue;
  const n = c.poses.length; const dirs = c.dirs;
  const base = blank(W * n, H * dirs.length); const em = blank(W * n, H * dirs.length);
  const anchors = Object.fromEntries(dirs.map((d) => [d, d === 'N' ? null : []]));
  dirs.forEach((d, r) => c.poses.forEach((pose, f) => {
    const { rows, em: lit, screen } = draw(d, { pose, face: 'off' });
    paint(base, rows, f * W, r * H);
    paint(em, Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => lit.find((p) => p[0] === x && p[1] === y)?.[2] ?? null)), f * W, r * H);
    if (d !== 'N') anchors[d].push([screen.x, screen.y]);
  }));
  writePng(path.join(out, `${clip}.png`), base);
  writePng(path.join(out, `${clip}_emissive.png`), em);
  const json = { clip, frame: { w: W, h: H }, count: n, fps: c.fps, loop: c.loop, dirs, ...(c.contact ? { contact: c.contact } : {}), ...(c.face ? { face: c.face } : {}), placeholder: true, anchors: { face: anchors } };
  fs.writeFileSync(path.join(out, `${clip}.json`), `${JSON.stringify(json, null, 1)}\n`);
  console.log(`${clip}: ${n} frames × ${dirs.join(',')} @ ${c.fps} fps`);
}

// ── 4. faces: front (S) 18×8 cells, side (E, W) wrap cells, and their glow ──
const GLOW = new Set([...TEAL, ...PINK]);
const cells = { S: 'faces.png', E: 'faces_E.png', W: 'faces_W.png' };
const sizes = {};
for (const [d, file] of Object.entries(cells)) {
  let img = null, eimg = null;
  FACE_NAMES.forEach((name, i) => {
    const { rows, screen } = draw(d, { face: name, drawFace: true });
    if (!img) { sizes[d] = [screen.w, screen.h]; img = blank(screen.w * FACE_NAMES.length, screen.h); eimg = blank(screen.w * FACE_NAMES.length, screen.h); }
    const cell = rows.slice(screen.y, screen.y + screen.h).map((row) => row.slice(screen.x, screen.x + screen.w));
    paint(img, cell, i * screen.w, 0);
    paint(eimg, cell.map((row) => row.map((px) => (px && GLOW.has(px) ? px : null))), i * screen.w, 0);
  });
  writePng(path.join(out, file), img); writePng(path.join(out, file.replace('.png', '_emissive.png')), eimg);
}
fs.writeFileSync(path.join(out, 'faces.json'), `${JSON.stringify({ size: sizes.S, names: FACE_NAMES, approved: APPROVED_FACES, placeholder: FACE_NAMES.filter((f) => !APPROVED_FACES.includes(f)), cells: Object.fromEntries(Object.entries(cells).map(([d, file]) => [d, { file, size: sizes[d] }])) }, null, 1)}\n`);
console.log(`faces: ${FACE_NAMES.length} × S ${sizes.S.join('×')}, E/W ${sizes.E.join('×')}`);
