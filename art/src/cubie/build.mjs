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
import { WEAR } from './wear.mjs';

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
  const overlays = { ...(c.overlays ?? {}), ...(c.wear === false ? {} : WEAR) };
  const dirs = c.dirs; const posesFor = (d) => (typeof c.poses === 'function' ? c.poses(d) : c.poses);
  const n = posesFor(dirs[0]).length;
  const base = blank(W * n, H * dirs.length); const em = blank(W * n, H * dirs.length);
  const ovs = Object.fromEntries(Object.keys(overlays).map((k) => [k, { base: blank(W * n, H * dirs.length), em: blank(W * n, H * dirs.length) }]));
  const anchors = Object.fromEntries(dirs.map((d) => [d, []]));
  const handAnchors = Object.fromEntries(dirs.map((d) => [d, []]));
  const frontArms = {};
  const grid = (list) => Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => list.find((p) => p[0] === x && p[1] === y)?.[2] ?? null));
  dirs.forEach((d, r) => posesFor(d).forEach((pose, f) => {
    let fr = draw(d, { pose, face: 'off' });
    if (pose.armsFront && d !== 'N') { // arms in front of the head go on the front.arms overlay, above the face
      const bare = draw(d, { pose: { ...pose, hideArms: true }, face: 'off' });
      const arms = []; fr.rows.forEach((row, y) => row.forEach((c, x) => { if (c && c !== bare.rows[y][x]) arms.push([x, y, c]); }));
      (frontArms[`${d}`] ??= [])[f] = arms;
      fr = { ...bare, hands: fr.hands };
    }
    paint(base, fr.rows, f * W, r * H);
    paint(em, grid(fr.em), f * W, r * H);
    // the face goes on whichever head the frame shows: [x, y] on its own facing's head,
    // [x, y, kind] on a turned head, null when the back of the head is turned to us
    anchors[d].push(fr.screen ? (fr.screen.kind && fr.screen.kind !== d ? [fr.screen.x, fr.screen.y, fr.screen.kind] : [fr.screen.x, fr.screen.y]) : null);
    // hand positions (A, and B where the facing shows it) for the renderer to hang things on
    handAnchors[d].push(Object.fromEntries(Object.entries(fr.hands ?? {}).map(([k, v]) => [k, [v.x, v.y]])));
    const drawn = Object.fromEntries(Object.entries(overlays).map(([k, fn]) => [k, fn({ ...fr, d, f, n, pose })]));
    // a status layer (wet) sits above held tools in the renderer's order, so it leaves out where one is
    const heldAt = new Set(Object.entries(drawn).filter(([k]) => k.startsWith('held.')).flatMap(([, px]) => px.map(([x, y]) => `${x},${y}`)));
    for (const k of Object.keys(overlays)) {
      let px = drawn[k];
      if (k.startsWith('status.')) px = px.filter(([x, y]) => !heldAt.has(`${x},${y}`));
      // back overlays sit behind him from the front and sides, in front of him from behind
      if (k.startsWith('back.') && d !== 'N') px = px.filter(([x, y, , , over]) => over || !fr.rows[y]?.[x]); // `over`: a strap across his front
      paint(ovs[k].base, grid(px), f * W, r * H);
      paint(ovs[k].em, grid(px.filter((p) => p[3] !== false)), f * W, r * H);
    }
  }));
  for (const d of dirs) if (anchors[d].every((a) => a === null)) anchors[d] = null;
  if (Object.keys(frontArms).length) {
    const o = blank(W * n, H * dirs.length);
    dirs.forEach((d, r) => (frontArms[d] ?? []).forEach((arms, f) => arms && paint(o, grid(arms), f * W, r * H)));
    writePng(path.join(out, `${clip}.front.arms.png`), o);
  }
  for (const [k, o] of Object.entries(ovs)) { writePng(path.join(out, `${clip}.${k}.png`), o.base); if (o.em.data.some((v, i) => i % 4 === 3 && v)) writePng(path.join(out, `${clip}.${k}_emissive.png`), o.em); }
  writePng(path.join(out, `${clip}.png`), base);
  writePng(path.join(out, `${clip}_emissive.png`), em);
  const json = { clip, frame: { w: W, h: H }, count: n, fps: c.fps, loop: c.loop, dirs, ...(c.contact ? { contact: c.contact } : {}), ...(c.face ? { face: c.face } : {}), ...(c.airborne ? { airborne: true } : {}), worn: [...(c.worn ?? []), ...(c.wear === false ? [] : Object.keys(WEAR))], anchors: { face: anchors, hands: handAnchors } };
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
