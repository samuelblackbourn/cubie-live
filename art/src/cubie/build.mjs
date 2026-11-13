// Cubie's P2 placeholder clips (art-01 step 3): idle 4 and walk 8 × S, W, E, N,
// the face overlay sheets, the emissive layers and the clip JSON — all drawn from
// model O in model.mjs. PixelLab makes the canonical sheets in P3.
//
//   node art/src/cubie/build.mjs <out-dir>
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

// ── 2. the stride ───────────────────────────────────────────────────────────
// feet(f) → { dxA, dxB }: how far each foot moves along the facing (E/W only).
// At rest the near foot already stands 3 px ahead of the far one, so a mirrored
// stride is lopsided (pass 1 shuffled). `sep` is the near-minus-far distance per
// frame, split so both feet stay centred under the body.
const sep = [4, 6, 4, 0, -4, -6, -4, 0];
const feet = (f) => { const dxA = Math.ceil((sep[f] - 3) / 2); return { dxA, dxB: dxA - (sep[f] - 3) }; };

// ── 3. the clips ────────────────────────────────────────────────────────────
// walk: contact on f1 (foot A lands) and f5 (foot B lands); body dips the frame
// after each contact; the swinging foot lifts 1-2-1 through its passing frame;
// arms swing against the legs.
const WALK = Array.from({ length: 8 }, (_, f) => ({
  bob: [0, 0, 1, 0, 0, 0, 1, 0][f],
  ...feet(f),
  liftA: [1, 0, 0, 0, 0, 0, 1, 2][f], liftB: [0, 0, 1, 2, 1, 0, 0, 0][f],
  handA: [0, 0, 0, 0, 1, 1, 1, 0][f], handB: [1, 1, 1, 0, 0, 0, 0, 0][f],
  armDx: [-1, -1, -1, 0, 1, 1, 1, 0][f],
}));
const IDLE = [0, 1, 1, 0].map((bob) => ({ bob }));
const CLIPS = {
  idle: { poses: IDLE, fps: 4, loop: true, face: [null, null, null, 'blink'] },
  walk: { poses: WALK, fps: 10, loop: true, contact: [1, 5] },
};

fs.mkdirSync(out, { recursive: true });
for (const [clip, c] of Object.entries(CLIPS)) {
  const n = c.poses.length;
  const base = blank(W * n, H * DIRS.length); const em = blank(W * n, H * DIRS.length);
  const anchors = Object.fromEntries(DIRS.map((d) => [d, d === 'N' ? null : []]));
  DIRS.forEach((d, r) => c.poses.forEach((pose, f) => {
    const { rows, em: lit, screen } = draw(d, { pose, face: 'off' });
    paint(base, rows, f * W, r * H);
    paint(em, Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => lit.find((p) => p[0] === x && p[1] === y)?.[2] ?? null)), f * W, r * H);
    if (d !== 'N') anchors[d].push([screen.x, screen.y]);
  }));
  writePng(path.join(out, `${clip}.png`), base);
  writePng(path.join(out, `${clip}_emissive.png`), em);
  const json = { clip, frame: { w: W, h: H }, count: n, fps: c.fps, loop: c.loop, dirs: DIRS, ...(c.contact ? { contact: c.contact } : {}), ...(c.face ? { face: c.face } : {}), placeholder: true, anchors: { face: anchors } };
  fs.writeFileSync(path.join(out, `${clip}.json`), `${JSON.stringify(json, null, 1)}\n`);
  console.log(`${clip}: ${n} frames × ${DIRS.join(',')} @ ${c.fps} fps`);
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
