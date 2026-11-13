#!/usr/bin/env node
/**
 * Check a folder of Cubie clips (art/cubie/ or a pass folder) against skill §4.
 *
 *   node check-pack.mjs <clip-dir> [--only <clip>] [--json]
 *
 * The folder holds, per clip:
 *   <clip>.png            horizontal strip; frames left→right, one row per direction
 *   <clip>.json           { clip, frame: {w, h}, count, fps, loop, dirs: ["S","W","E","N"],
 *                           contact?: [frame…], placeholder?: bool,
 *                           anchors: { face: { S: [[x,y]…count], W: …, E: …, N: null } } }
 *   <clip>_emissive.png   optional; same size; only glowing pixels (eyes and mouth
 *                         live on the face overlay, so here: strip, antenna, charge LED)
 *   <clip>.<layer>.<name>.png  optional overlays, layer = held | back | status | front (held.axe,
 *                         back.battery_pack, status.wet, front.arms = arms passing in front of
 *                         the face, drawn above it); same size and frames as the clip,
 *                         drawn above the body with occlusion already baked in. Draw order:
 *                         body, its _emissive, face (+ glow), then each overlay in the
 *                         order back, held, status, front — an overlay hides the glow
 *                         under it and adds its own _emissive
 * and once for the folder:
 *   faces.json            { size: [w, h], names: [...], cells?: { S: {file, size}, E: …, W: … } }
 *                         one sheet per direction that shows a face, one face per cell
 *                         left→right, each with a <sheet>_emissive.png (eyes, mouth)
 *   <clip>.json may also carry face: [null | name, …] — a face forced on that frame (the blink)
 *   anchors.face[dir][frame] is [x, y] (the face on that facing's own head), [x, y, kind]
 *   (on a head turned to `kind`, e.g. a side head on a front body), or null (back of the head)
 *
 * Errors (would break the renderer): bad JSON, wrong sheet size, empty frames,
 * half-transparent pixels, off-palette colours, emissive pixels with no body
 * under them, a face anchor that puts the face outside the frame or off the
 * screen, overlay sizes that do not match. Warnings (a viewer will notice): feet
 * not on the bottom row, more than 2 px of height change in a direction, frame
 * counts that differ from docs/design/06-animations.md, an unkeyed chest strip,
 * glowing colours baked into the base.
 *
 * Exits 1 on any error, 2 on bad usage. Reads only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { inspect, readPng } from './png.mjs';
import { EMISSIVE, STRIP_KEY, crop, eachPixel, paletteSet, rgbHex } from './lib.mjs';

/** Frame budgets from docs/design/06-animations.md §2 (the clips placeholders exist for). */
export const BUDGET = {
  idle: { count: 4, fps: 4, loop: true },
  walk: { count: 8, fps: 10, loop: true, contact: [1, 5] },
  'walk.carry': { count: 8, fps: 9, loop: true }, 'walk.tired': { count: 8, fps: 7, loop: true },
  shuffle: { count: 6, fps: 4, loop: true }, 'idle.look_around': { count: 6, fps: 5, loop: false },
  'idle.fidget': { count: 6, fps: 6, loop: false }, sit: { count: 2, fps: 2, loop: true },
  recharge: { count: 4, fps: 3, loop: true }, dance: { count: 8, fps: 8, loop: true },
};
const DIRS = ['S', 'W', 'E', 'N'];
const AIRBORNE = /^(celebrate|knockback|vault|slide|dance)/;
const FRAME = { w: 32, h: 48 };

export function checkPack(dir, { only } = {}) {
  const errors = [], warnings = [], summary = [];
  if (!fs.existsSync(dir)) return { errors: [`${dir} does not exist`], warnings, summary };
  const pal = paletteSet(); const glow = new Set(EMISSIVE);
  const files = fs.readdirSync(dir);
  const clips = files.filter((f) => f.endsWith('.json') && f !== 'faces.json').map((f) => f.slice(0, -5)).filter((c) => !only || c === only);
  if (!clips.length) errors.push(`no <clip>.json in ${dir}`);

  // faces: one sheet per direction that shows a face (faces.json → cells), each with its _emissive
  let faces = null;
  if (files.includes('faces.json')) {
    try {
      faces = JSON.parse(fs.readFileSync(path.join(dir, 'faces.json'), 'utf8'));
      const cells = faces.cells ?? { S: { file: 'faces.png', size: faces.size } };
      for (const [d, c] of Object.entries(cells)) {
        if (!files.includes(c.file)) { errors.push(`faces.json names ${c.file}, which is missing`); continue; }
        const fp = readPng(path.join(dir, c.file));
        if (fp.width !== c.size[0] * faces.names.length || fp.height !== c.size[1]) { errors.push(`${c.file} is ${fp.width}×${fp.height}, expected ${c.size[0] * faces.names.length}×${c.size[1]} (${faces.names.length} faces of ${c.size.join('×')})`); continue; }
        faces.names.forEach((n, i) => { if (!inspect(fp, i * c.size[0], 0, c.size[0], c.size[1]).box) errors.push(`${c.file}: face ${n} is empty`); });
        const ef = c.file.replace(/\.png$/, '_emissive.png');
        if (files.includes(ef)) {
          const e = readPng(path.join(dir, ef)); let floating = 0;
          if (e.width !== fp.width || e.height !== fp.height) errors.push(`${ef} is ${e.width}×${e.height}, expected ${fp.width}×${fp.height}`);
          else eachPixel(e, (x, y) => { if (!fp.data[(y * fp.width + x) * 4 + 3]) floating++; });
          if (floating) errors.push(`${ef}: ${floating} glowing pixels with no face under them`);
        } else warnings.push(`no ${ef} (eyes and mouth glow from it)`);
      }
      summary.push(`faces: ${faces.names.join(', ')} — ${Object.entries(cells).map(([d, c]) => `${d} ${c.size.join('×')}`).join(', ')}${faces.placeholder?.length ? `; placeholder: ${faces.placeholder.join(', ')}` : ''}`);
    } catch (e) { errors.push(`faces.json: ${e.message}`); }
  }
  const faceSize = (d) => faces?.cells?.[d]?.size ?? faces?.size ?? [18, 8];

  for (const clip of clips) {
    const E = (m) => errors.push(`${clip}: ${m}`); const Wn = (m) => warnings.push(`${clip}: ${m}`);
    let j;
    try { j = JSON.parse(fs.readFileSync(path.join(dir, `${clip}.json`), 'utf8')); } catch (e) { E(`${clip}.json is not valid JSON — ${e.message}`); continue; }
    const fw = j.frame?.w, fh = j.frame?.h;
    if (fw !== FRAME.w || fh !== FRAME.h) E(`frame must be ${FRAME.w}×${FRAME.h}, is ${fw}×${fh}`);
    if (!Number.isInteger(j.count) || j.count < 1) { E('count must be a positive integer'); continue; }
    if (!(j.fps > 0)) E('fps must be > 0');
    if (typeof j.loop !== 'boolean') E('loop must be true or false');
    const dirs = j.dirs ?? DIRS;
    if (!(JSON.stringify(dirs) === JSON.stringify(DIRS) || JSON.stringify(dirs) === '["S","N"]' || JSON.stringify(dirs) === '["S"]')) E(`dirs must be S,W,E,N (or S,N / S for static clips), is ${dirs}`);
    for (const c of j.contact ?? []) if (!(c >= 0 && c < j.count)) E(`contact frame ${c} is outside 0–${j.count - 1}`);
    const b = BUDGET[j.clip ?? clip];
    if (b) {
      if (b.count !== j.count) Wn(`${j.count} frames; the animations note budgets ${b.count}`);
      if (b.fps !== j.fps) Wn(`${j.fps} fps; the animations note says ${b.fps}`);
      if (b.loop !== j.loop) Wn(`loop ${j.loop}; the animations note says ${b.loop}`);
    }
    const sheetFile = path.join(dir, `${clip}.png`);
    if (!fs.existsSync(sheetFile)) { E(`${clip}.png is missing`); continue; }
    const img = readPng(sheetFile);
    if (img.width !== j.count * FRAME.w || img.height !== dirs.length * FRAME.h) { E(`${clip}.png is ${img.width}×${img.height}, expected ${j.count * FRAME.w}×${dirs.length * FRAME.h}`); continue; }

    // whole-sheet colour facts
    let soft = 0, keyed = 0, baked = 0; const off = new Set();
    eachPixel(img, (x, y, r, g, bb, a) => { const h = rgbHex(r, g, bb); if (a !== 255) soft++; if (!pal.has(h)) off.add(h); if (h === STRIP_KEY) keyed++; else if (glow.has(h)) baked++; });
    if (soft) E(`${soft} half-transparent pixels`);
    if (off.size) E(`${off.size} colours off the palette: ${[...off].slice(0, 6).join(' ')}`);
    if (!keyed && dirs.includes('S')) Wn(`no ${STRIP_KEY} pixels — the chest strip is not keyed for the renderer`);
    if (baked) Wn(`${baked} glowing-colour pixels in the base; glow belongs on ${clip}_emissive.png (or the face overlay)`);

    // per frame
    const faceAnch = j.anchors?.face;
    if (faces && !faceAnch) E('faces.json exists but the clip has no anchors.face');
    if (j.face !== undefined) {
      if (!Array.isArray(j.face) || j.face.length !== j.count) E(`face must be a list of ${j.count} entries (null or a face name)`);
      else for (const n of j.face) if (n !== null && faces && !faces.names.includes(n)) E(`face override "${n}" is not in faces.json`);
    }
    dirs.forEach((d, row) => {
      const heights = [];
      for (let f = 0; f < j.count; f++) {
        const cell = inspect(img, f * FRAME.w, row * FRAME.h, FRAME.w, FRAME.h); const where = `${d} f${f}`;
        if (!cell.box) { E(`${where} is empty`); continue; }
        heights.push(cell.box.maxY - cell.box.minY + 1);
        if (cell.box.maxY !== FRAME.h - 1 && !AIRBORNE.test(clip) && !j.airborne) Wn(`${where}: lowest pixel on row ${cell.box.maxY}, not ${FRAME.h - 1} — he will hover`);
        const cx = (cell.box.minX + cell.box.maxX) / 2; if (Math.abs(cx - 15.5) > 3) Wn(`${where}: body centred on x=${cx}, more than 3 px off 15.5`);
        const a = faceAnch?.[d];
        if (faceAnch && a !== null && a !== undefined) {
          const p = a[f];
          if (p === null) continue; // the back of the head is turned to us on this frame
          if (!Array.isArray(p)) { E(`${where}: no face anchor`); continue; }
          const [fx, fy, kind] = p; const [w, h] = faceSize(kind ?? d);
          if (kind && faces && !(faces.cells ?? {})[kind]) E(`${where}: face anchor names head ${kind}, which faces.json has no cells for`);
          if (fx < 0 || fy < 0 || fx + w > FRAME.w || fy + h > FRAME.h) E(`${where}: face at ${fx},${fy} (${w}×${h}) leaves the frame`);
          else {
            const box = crop(img, f * FRAME.w + fx, row * FRAME.h + fy, w, h); let holes = 0;
            for (let i = 3; i < box.data.length; i += 4) if (!box.data[i]) holes++;
            if (holes) E(`${where}: ${holes} of the face's ${w * h} pixels have no body under them — anchor is off the screen`);
          }
        }
      }
      if (faceAnch && Array.isArray(faceAnch[d]) && faceAnch[d].length !== j.count) E(`${d}: ${faceAnch[d].length} face anchors for ${j.count} frames`);
      if (heights.length && j.loop) { const s = Math.max(...heights) - Math.min(...heights); if (s > 2) Wn(`${d}: height varies by ${s} px across frames in a loop (bob is 1 px)`); }
    });

    // emissive and overlays
    const em = path.join(dir, `${clip}_emissive.png`);
    if (fs.existsSync(em)) {
      const e = readPng(em);
      if (e.width !== img.width || e.height !== img.height) E(`${clip}_emissive.png is ${e.width}×${e.height}, expected ${img.width}×${img.height}`);
      else {
        let floating = 0, wrong = new Set(), n = 0;
        eachPixel(e, (x, y, r, g, bb) => { n++; if (!img.data[(y * img.width + x) * 4 + 3]) floating++; const h = rgbHex(r, g, bb); if (!glow.has(h) && h !== STRIP_KEY) wrong.add(h); });
        if (floating) E(`${clip}_emissive.png: ${floating} pixels float with no body under them`);
        if (wrong.size) E(`${clip}_emissive.png has non-glow colours: ${[...wrong].slice(0, 6).join(' ')}`);
        summary.push(`${clip}: emissive ${n} px`);
      }
    } else Wn(`no ${clip}_emissive.png (strip, antenna bobble and charge LED glow from it)`);
    const overlayRe = new RegExp(`^${clip.replace(/\./g, '\\.')}\\.(held|back|status|front)\\.[a-z0-9_]+(_emissive)?\\.png$`);
    for (const f of files.filter((x) => overlayRe.test(x))) {
      const o = readPng(path.join(dir, f));
      if (o.width !== img.width || o.height !== img.height) E(`overlay ${f} is ${o.width}×${o.height}, expected ${img.width}×${img.height}`);
      else summary.push(`${clip}: overlay ${f}`);
    }
    summary.push(`${clip}: ${j.count} frames × ${dirs.join(',')} @ ${j.fps} fps, ${j.loop ? 'loop' : 'once'}${j.contact ? `, contact ${j.contact.join(',')}` : ''}${j.placeholder ? ', placeholder' : ''}`);
  }
  return { errors, warnings, summary };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2); const dir = a.find((x, i) => !x.startsWith('--') && a[i - 1] !== '--only');
  if (!dir) { console.error('usage: node check-pack.mjs <clip-dir> [--only <clip>] [--json]'); process.exit(2); }
  const r = checkPack(dir, { only: a.includes('--only') ? a[a.indexOf('--only') + 1] : undefined });
  if (a.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else {
    for (const s of r.summary) console.log(`  ${s}`);
    for (const w of r.warnings) console.log(`WARN  ${w}`);
    for (const e of r.errors) console.log(`ERROR ${e}`);
    console.log(`${r.errors.length} errors, ${r.warnings.length} warnings`);
  }
  process.exit(r.errors.length ? 1 : 0);
}
