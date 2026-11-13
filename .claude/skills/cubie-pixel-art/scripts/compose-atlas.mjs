#!/usr/bin/env node
/**
 * Pack an art folder into a Phaser 3 atlas plus animations.json.
 *
 *   node compose-atlas.mjs <art-dir> --out <dir> [--name atlas] [--max 2048]
 *
 * Every PNG under <art-dir> becomes one frame named by its path without ".png"
 * (crates/crate_open). A PNG with a <clip>.json beside it is a clip strip: it is
 * cut into frames named <folder>/<clip>/<dir>/<n> and gets an animation
 * <folder>.<clip>.<dir> (frameRate = fps, repeat -1 when loop). Its
 * <clip>_emissive.png is cut the same way under <folder>/<clip>_emissive/…, and
 * so are overlays (<clip>.<overlay>.png). Skipped: the reference, src, manifests,
 * look and passN folders, and any id whose manifest row says `deferred: true`.
 *
 * Writes <out>/<name>.png (power-of-two, shelf-packed, 1 px gap), <out>/<name>.json
 * (Phaser JSON-hash) and <out>/animations.json. Never hand-edit these; rerun.
 * Exits 1 when the art does not fit in --max.
 */
import fs from 'node:fs';
import path from 'node:path';
import { blank, blit, readPng, writePng } from './png.mjs';
import { manifests, repoRoot } from './lib.mjs';

const a = process.argv.slice(2);
const opt = (f, d) => (a.includes(f) ? a[a.indexOf(f) + 1] : d);
const src = a.find((x, i) => !x.startsWith('--') && !['--out', '--name', '--max'].includes(a[i - 1]));
const out = opt('--out', null); const name = opt('--name', 'atlas'); const MAX = Number(opt('--max', 2048));
if (!src || !out) { console.error('usage: node compose-atlas.mjs <art-dir> --out <dir> [--name atlas] [--max 2048]'); process.exit(2); }

const SKIP = /^(reference|src|manifests|look|pass\d*)$/;
const deferred = new Set();
try { for (const m of manifests(repoRoot(src) ?? repoRoot())) for (const r of m.rows) if (r.deferred) deferred.add(String(r.id)); } catch { /* no manifests yet */ }

const pieces = []; const anims = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((p, q) => p.name.localeCompare(q.name))) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!SKIP.test(e.name)) walk(p); continue; }
    if (!e.name.endsWith('.png')) continue;
    const rel = path.relative(src, p).replace(/\\/g, '/').replace(/\.png$/, '');
    const base = path.basename(rel); const folder = path.dirname(rel) === '.' ? '' : `${path.dirname(rel)}/`;
    const clipName = base.replace(/_emissive$/, '').replace(/\..*$/, '');
    if (deferred.has(clipName) || deferred.has(base)) continue;
    const jf = path.join(d, `${clipName}.json`);
    const img = readPng(p);
    if (fs.existsSync(jf) && clipName !== 'faces') {
      const j = JSON.parse(fs.readFileSync(jf, 'utf8')); const dirs = j.dirs ?? ['S', 'W', 'E', 'N'];
      dirs.forEach((dir, r) => {
        const frames = [];
        for (let f = 0; f < j.count; f++) {
          const fr = `${folder}${base}/${dir}/${f}`; const cell = blank(j.frame.w, j.frame.h);
          blit(img, f * j.frame.w, r * j.frame.h, j.frame.w, j.frame.h, cell, 0, 0);
          pieces.push({ name: fr, img: cell }); frames.push({ key: name, frame: fr });
        }
        if (base === clipName) anims.push({ key: `${folder.replace(/\//g, '.')}${clipName}.${dir}`, frames, frameRate: j.fps, repeat: j.loop ? -1 : 0, ...(j.contact ? { contact: j.contact } : {}) });
      });
    } else if (fs.existsSync(path.join(d, 'faces.json')) && base === 'faces') {
      const fj = JSON.parse(fs.readFileSync(path.join(d, 'faces.json'), 'utf8'));
      fj.names.forEach((n, i) => { const cell = blank(fj.size[0], fj.size[1]); blit(img, i * fj.size[0], 0, fj.size[0], fj.size[1], cell, 0, 0); pieces.push({ name: `${folder}faces/${n}`, img: cell }); });
    } else pieces.push({ name: rel, img });
  }
};
walk(src);
if (!pieces.length) { console.error(`no PNGs under ${src}`); process.exit(1); }

// shelf packing, tallest first, growing a power-of-two square then doubling width
const order = [...pieces].sort((p, q) => q.img.height - p.img.height || q.img.width - p.img.width);
const pack = (W, H) => { let x = 0, y = 0, shelf = 0; const at = new Map(); for (const p of order) { if (x + p.img.width > W) { x = 0; y += shelf + 1; shelf = 0; } if (p.img.width > W || y + p.img.height > H) return null; at.set(p, [x, y]); x += p.img.width + 1; shelf = Math.max(shelf, p.img.height); } return at; };
let W = 64, H = 64, at = null;
while (!(at = pack(W, H))) { if (W > H) H *= 2; else W *= 2; if (W > MAX || H > MAX) { console.error(`does not fit in ${MAX}×${MAX}; split the folder or raise --max`); process.exit(1); } }
const sheet = blank(W, H); const frames = {};
for (const p of pieces) { const [x, y] = at.get(p); blit(p.img, 0, 0, p.img.width, p.img.height, sheet, x, y); frames[p.name] = { frame: { x, y, w: p.img.width, h: p.img.height }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: p.img.width, h: p.img.height }, sourceSize: { w: p.img.width, h: p.img.height } }; }
fs.mkdirSync(out, { recursive: true });
writePng(path.join(out, `${name}.png`), sheet);
fs.writeFileSync(path.join(out, `${name}.json`), `${JSON.stringify({ frames, meta: { app: 'cubie-pixel-art compose-atlas', image: `${name}.png`, format: 'RGBA8888', size: { w: W, h: H }, scale: '1' } }, null, 1)}\n`);
fs.writeFileSync(path.join(out, 'animations.json'), `${JSON.stringify({ anims }, null, 1)}\n`);
console.log(`wrote ${path.join(out, name)}.png ${W}×${H}: ${pieces.length} frames, ${anims.length} animations${deferred.size ? `; skipped deferred: ${[...deferred].join(', ')}` : ''}`);
