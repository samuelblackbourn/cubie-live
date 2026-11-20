#!/usr/bin/env node
/**
 * Render a Tiled JSON chunk (.tmj) to a PNG so it can be looked at.
 *
 *   node render-chunk.mjs <chunk.tmj> [--out file.png] [--scale 3] [--grid] [--night]
 *
 * Supports what the island's chunks use: orthogonal maps, 32 px tiles, tile
 * layers stored as plain arrays (no base64/compression), object layers with
 * tile objects (gid; drawn standing on their x,y like Tiled does), and tilesets
 * that are embedded or external .tsj, as one image or a collection of images.
 * Flip bits are ignored (the island does not flip tiles). Layers draw in file
 * order; hidden layers are skipped. --night applies the placeholder night tint
 * and leaves any <image>_emissive.png pixels untinted. Never contains Cubie:
 * a chunk is a place, he is drawn by the renderer.
 */
import fs from 'node:fs';
import path from 'node:path';
import { blank, blit, readPng, writePng } from './png.mjs';
import { nightTint, over, scaleUp } from './lib.mjs';

const a = process.argv.slice(2);
const opt = (f, d) => (a.includes(f) ? a[a.indexOf(f) + 1] : d);
const file = a.find((x, i) => !x.startsWith('--') && !['--out', '--scale'].includes(a[i - 1]));
if (!file) { console.error('usage: node render-chunk.mjs <chunk.tmj> [--out file.png] [--scale 3] [--grid] [--night]'); process.exit(2); }
const scale = Number(opt('--scale', 3)); const outFile = opt('--out', file.replace(/\.tmj$|\.json$/, '') + '.png');
const map = JSON.parse(fs.readFileSync(file, 'utf8')); const dir = path.dirname(file);
if (map.orientation && map.orientation !== 'orthogonal') { console.error(`only orthogonal maps (got ${map.orientation})`); process.exit(2); }

const FLIP = 0x1fffffff; const gids = []; // gid → { img, x, y, w, h, emissive? }
for (const ts0 of map.tilesets ?? []) {
  let ts = ts0; let tdir = dir;
  if (ts0.source) { const p = path.join(dir, ts0.source); if (!p.endsWith('.tsj') && !p.endsWith('.json')) { console.error(`external tileset ${ts0.source}: export it as .tsj (JSON)`); process.exit(2); } ts = { ...JSON.parse(fs.readFileSync(p, 'utf8')), firstgid: ts0.firstgid }; tdir = path.dirname(p); }
  const load = (rel) => { const p = path.join(tdir, rel); const em = p.replace(/\.png$/, '_emissive.png'); return { img: readPng(p), em: fs.existsSync(em) ? readPng(em) : null }; };
  if (ts.image) {
    const { img, em } = load(ts.image); const tw = ts.tilewidth, th = ts.tileheight; const cols = ts.columns || Math.floor(img.width / tw); const n = ts.tilecount || cols * Math.floor(img.height / th);
    for (let i = 0; i < n; i++) gids[ts.firstgid + i] = { img, em, x: (i % cols) * (tw + (ts.spacing ?? 0)) + (ts.margin ?? 0), y: Math.floor(i / cols) * (th + (ts.spacing ?? 0)) + (ts.margin ?? 0), w: tw, h: th };
  }
  for (const t of ts.tiles ?? []) if (t.image) { const { img, em } = load(t.image); gids[ts.firstgid + t.id] = { img, em, x: 0, y: 0, w: img.width, h: img.height }; }
}
const piece = (g) => { const p = blank(g.w, g.h); blit(g.img, g.x, g.y, g.w, g.h, p, 0, 0); let e = null; if (g.em) { e = blank(g.w, g.h); blit(g.em, g.x, g.y, g.w, g.h, e, 0, 0); } return { p, e }; };

const W = map.width * map.tilewidth, H = map.height * map.tileheight;
const base = blank(W, H), glow = blank(W, H); let missing = 0;
const draw = (gid, x, y) => { const g = gids[gid & FLIP]; if (!g) { missing++; return; } const { p, e } = piece(g); over(base, p, x, y); if (e) over(glow, e, x, y); };
const layers = (ls) => { for (const l of ls) {
  if (l.visible === false) continue;
  if (l.type === 'group') layers(l.layers ?? []);
  else if (l.type === 'tilelayer') { if (!Array.isArray(l.data)) { console.error(`layer ${l.name}: store tile data as a plain array (no base64/compression)`); process.exit(2); } l.data.forEach((gid, i) => { if (gid) draw(gid, (i % l.width) * map.tilewidth + (l.x ?? 0), Math.floor(i / l.width) * map.tileheight + (l.y ?? 0)); }); }
  else if (l.type === 'objectgroup') for (const o of [...(l.objects ?? [])].sort((p, q) => p.y - q.y)) { if (o.gid && o.visible !== false) { const g = gids[o.gid & FLIP]; draw(o.gid, Math.round(o.x), Math.round(o.y - (g?.h ?? 0))); } }
} };
layers(map.layers ?? []);
if (a.includes('--night')) nightTint(base, glow);
let img = scaleUp(base, scale);
if (a.includes('--grid')) for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) if (x % (map.tilewidth * scale) === 0 || y % (map.tileheight * scale) === 0) { const o = (y * img.width + x) * 4; for (let c = 0; c < 3; c++) img.data[o + c] = Math.round(img.data[o + c] * 0.7 + 255 * 0.3 * (c === 2 ? 1 : 0.8)); img.data[o + 3] = 255; }
writePng(outFile, img);
console.log(`wrote ${outFile} (${img.width}×${img.height}) from ${map.width}×${map.height} tiles${missing ? `; ${missing} tiles had no tileset gid` : ''}`);
process.exit(missing ? 1 : 0);
