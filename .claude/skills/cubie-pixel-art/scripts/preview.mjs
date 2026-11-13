#!/usr/bin/env node
/**
 * Animated preview of a Cubie clip on the meadow, as an APNG (plays in any
 * browser), so a walk can be judged in motion.
 *
 *   node preview.mjs <clip-dir> <clip> --out look/walk.png [--scales 1,4] [--face idle] [--night] [--strip #27d4c9]
 *
 * Each frame shows the four directions side by side, at every scale given,
 * composited the way the renderer will: body, then the face overlay at the
 * clip's anchor (faces.png / faces.json), then the chest strip tinted from its
 * #ff00ff key, then the _emissive layer. Timing is the clip's fps. Also exports
 * composite(), which the build scripts use for their own look sheets.
 */
import fs from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { blank, readPng } from './png.mjs';
import { STRIP_KEY, crop, hexRgb, meadow, nightTint, over } from './lib.mjs';

/** One finished frame (body + face + strip tint + emissive) and its glow mask. */
export function composite(dir, clip, d, f, { face = 'idle', strip = '#27d4c9' } = {}) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, `${clip}.json`), 'utf8'));
  const r = (j.dirs ?? ['S', 'W', 'E', 'N']).indexOf(d); const { w, h } = j.frame;
  const body = crop(readPng(path.join(dir, `${clip}.png`)), f * w, r * h, w, h);
  const glow = blank(w, h);
  const ef = path.join(dir, `${clip}_emissive.png`);
  if (fs.existsSync(ef)) over(glow, crop(readPng(ef), f * w, r * h, w, h), 0, 0);
  const [kr, kg, kb] = hexRgb(STRIP_KEY); const tint = hexRgb(strip);
  for (let i = 0; i < w * h; i++) { const o = i * 4; if (body.data[o + 3] && body.data[o] === kr && body.data[o + 1] === kg && body.data[o + 2] === kb) { body.data.set(tint, o); glow.data.set([...tint, 255], o); } }
  const anchor = j.anchors?.face?.[d]?.[f];
  if (anchor && fs.existsSync(path.join(dir, 'faces.json'))) {
    const fj = JSON.parse(fs.readFileSync(path.join(dir, 'faces.json'), 'utf8'));
    const kind = anchor[2] ?? d;
    const cell = fj.cells?.[kind] ?? (kind === 'S' || !fj.cells ? { file: 'faces.png', size: fj.size } : null);
    const k = fj.names.indexOf(j.face?.[f] ?? face);
    if (cell && k >= 0) {
      const [cw, ch] = cell.size;
      over(body, crop(readPng(path.join(dir, cell.file)), k * cw, 0, cw, ch), anchor[0], anchor[1]);
      const ef = path.join(dir, cell.file.replace(/\.png$/, '_emissive.png'));
      if (fs.existsSync(ef)) over(glow, crop(readPng(ef), k * cw, 0, cw, ch), anchor[0], anchor[1]);
    }
  }
  // overlays (<clip>.held|back|status.<name>.png): occlusion is baked in, so they go on top
  const ovRe = new RegExp(`^${clip.replace(/\./g, '\\.')}\\.(back|held|status|front)\\.[a-z0-9_]+\\.png$`);
  const order = { back: 0, held: 1, status: 2, front: 3 };
  for (const f2 of fs.readdirSync(dir).filter((x) => ovRe.test(x)).sort((p, q) => order[p.split('.').at(-3)] - order[q.split('.').at(-3)])) {
    over(body, crop(readPng(path.join(dir, f2)), f * w, r * h, w, h), 0, 0);
    const e2 = path.join(dir, f2.replace(/\.png$/, '_emissive.png'));
    if (fs.existsSync(e2)) over(glow, crop(readPng(e2), f * w, r * h, w, h), 0, 0);
  }
  over(body, glow, 0, 0);
  return { body, glow, j };
}

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, body) => { const len = Buffer.alloc(4); len.writeUInt32BE(body.length); const tb = Buffer.concat([Buffer.from(type, 'latin1'), body]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(tb)); return Buffer.concat([len, tb, c]); };
const raw = (img) => { const rows = []; for (let y = 0; y < img.height; y++) rows.push(Buffer.from([0]), img.data.subarray(y * img.width * 4, (y + 1) * img.width * 4)); return deflateSync(Buffer.concat(rows)); };

/** frames: RGBA images of equal size; delay in ms. */
export function encodeApng(frames, delay) {
  const { width, height } = frames[0]; const u32 = (...v) => { const b = Buffer.alloc(4 * v.length); v.forEach((x, i) => b.writeUInt32BE(x, i * 4)); return b; };
  const parts = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', Buffer.concat([u32(width, height), Buffer.from([8, 6, 0, 0, 0])])), chunk('acTL', u32(frames.length, 0))];
  let seq = 0;
  frames.forEach((f, i) => {
    const fc = Buffer.concat([u32(seq++, width, height, 0, 0), Buffer.from([delay >> 8, delay & 0xff, 0x03, 0xe8, 0, 0])]);
    parts.push(chunk('fcTL', fc));
    parts.push(i === 0 ? chunk('IDAT', raw(f)) : chunk('fdAT', Buffer.concat([u32(seq++), raw(f)])));
  });
  parts.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  const opt = (f, d) => (a.includes(f) ? a[a.indexOf(f) + 1] : d);
  const [dir, clip] = a.filter((x, i) => !x.startsWith('--') && !['--out', '--scales', '--face', '--strip'].includes(a[i - 1]));
  const out = opt('--out', null);
  if (!dir || !clip || !out) { console.error('usage: node preview.mjs <clip-dir> <clip> --out file.png [--scales 1,4] [--face idle] [--night] [--strip #27d4c9]'); process.exit(2); }
  const scales = opt('--scales', '1,4').split(',').map(Number); const face = opt('--face', 'idle'); const strip = opt('--strip', '#27d4c9');
  const j = JSON.parse(fs.readFileSync(path.join(dir, `${clip}.json`), 'utf8')); const dirs = j.dirs ?? ['S', 'W', 'E', 'N'];
  const PAD = 8, cw = j.frame.w + PAD * 2, ch = j.frame.h + PAD * 2, GAP = 8;
  const W = scales.reduce((n, s) => n + dirs.length * cw * s + GAP, -GAP); const H = Math.max(...scales.map((s) => ch * s));
  const frames = [];
  for (let f = 0; f < j.count; f++) {
    const img = blank(W, H); let x = 0;
    for (const s of scales) for (const d of dirs) {
      const { body, glow } = composite(dir, clip, d, f, { face, strip });
      const cell = meadow(cw, ch); over(cell, body, PAD, PAD);
      if (a.includes('--night')) { const g = blank(cw, ch); over(g, glow, PAD, PAD); nightTint(cell, g); }
      over(img, cell, x, H - ch * s, s); x += cw * s + (d === dirs[dirs.length - 1] ? GAP : 0);
    }
    frames.push(img);
  }
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, encodeApng(frames, Math.round(1000 / j.fps)));
  console.log(`wrote ${out} (${W}×${H}), ${j.count} frames at ${j.fps} fps, ${dirs.join(',')} at ${scales.join('×, ')}×`);
}
