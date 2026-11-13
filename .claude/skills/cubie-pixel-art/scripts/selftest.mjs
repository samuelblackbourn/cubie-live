#!/usr/bin/env node
/**
 * Smoke test for the cubie-pixel-art scripts: builds small fixtures in a temp
 * folder and checks each script passes good art and catches bad art. If the
 * approved turnaround is in the checkout, it also rebuilds it and compares it
 * byte for byte with art/reference/cubie/.
 *
 *   node .claude/skills/cubie-pixel-art/scripts/selftest.mjs
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blank, readPng, writePng } from './png.mjs';
import { hexRgb, repoRoot } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cubie-art-'));
let fails = 0;
const run = (script, args, cwd = tmp) => spawnSync(process.execPath, [path.join(here, script), ...args], { cwd, encoding: 'utf8' });
const expect = (what, r, code) => { const ok = r.status === code; if (!ok) fails++; console.log(`${ok ? 'pass' : 'FAIL'}  ${what}${ok ? '' : ` — exit ${r.status}, wanted ${code}\n${r.stdout}${r.stderr}`}`); };
const px = (img, x, y, hex) => img.data.set([...hexRgb(hex), 255], (y * img.width + x) * 4);

// a fake repo root so the scripts find art/ and the draft palette
fs.writeFileSync(path.join(tmp, 'CLAUDE.md'), 'fixture\n'); fs.mkdirSync(path.join(tmp, 'docs/design'), { recursive: true });

// ── a 32×48 "Cubie" clip: metal block body, strip key, 1-px bob ──
const clipDir = path.join(tmp, 'art/cubie'); fs.mkdirSync(clipDir, { recursive: true });
const dirs = ['S', 'W', 'E', 'N']; const count = 4;
const sheet = blank(32 * count, 48 * 4); const em = blank(32 * count, 48 * 4);
for (let r = 0; r < 4; r++) for (let f = 0; f < count; f++) {
  const bob = f % 2; const ox = f * 32, oy = r * 48;
  for (let y = 10 + bob; y < 48; y++) for (let x = 9; x < 23; x++) px(sheet, ox + x, oy + y, y < 24 + bob ? '#e6eaf0' : '#9aa3b1');
  if (r === 0) { for (let x = 13; x < 19; x++) px(sheet, ox + x, oy + 30, '#ff00ff'); px(em, ox + 15, oy + 30, '#27d4c9'); }
}
writePng(path.join(clipDir, 'idle.png'), sheet); writePng(path.join(clipDir, 'idle_emissive.png'), em);
const anchors = Object.fromEntries(dirs.map((d) => [d, d === 'N' ? null : Array.from({ length: count }, (_, f) => [10, 13 + (f % 2)])]));
fs.writeFileSync(path.join(clipDir, 'idle.json'), JSON.stringify({ clip: 'idle', frame: { w: 32, h: 48 }, count, fps: 4, loop: true, dirs, placeholder: true, anchors: { face: anchors } }));
const faces = blank(12 * 2, 8); for (let k = 0; k < 2; k++) for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) px(faces, k * 12 + x, y, (y === 3 && (x === 3 || x === 8)) ? '#27d4c9' : '#0b1f23');
writePng(path.join(clipDir, 'faces.png'), faces); fs.writeFileSync(path.join(clipDir, 'faces.json'), JSON.stringify({ size: [12, 8], names: ['idle', 'blink'] }));

expect('check-pack passes a good clip', run('check-pack.mjs', [clipDir]), 0);
expect('style-check cubie passes the fixture', run('style-check.mjs', ['cubie', path.join(clipDir, 'idle.png')]), 0);
const bad = readPng(path.join(clipDir, 'idle.png')); px(bad, 5, 5, '#123456'); writePng(path.join(tmp, 'bad.png'), bad);
expect('style-check flags an off-ramp colour', run('style-check.mjs', ['cubie', path.join(tmp, 'bad.png')]), 1);
const badDir = path.join(tmp, 'badclip'); fs.mkdirSync(badDir); fs.copyFileSync(path.join(clipDir, 'idle.json'), path.join(badDir, 'idle.json')); writePng(path.join(badDir, 'idle.png'), blank(32 * 3, 48 * 4));
expect('check-pack catches a wrong sheet size', run('check-pack.mjs', [badDir]), 1);

// ── manifests and a prop ──
const crate = blank(32, 32); for (let y = 12; y < 32; y++) for (let x = 4; x < 28; x++) px(crate, x, y, y < 18 ? '#c7ced9' : '#6b7382');
fs.mkdirSync(path.join(tmp, 'art/props')); writePng(path.join(tmp, 'art/props/crate.png'), crate); writePng(path.join(tmp, 'art/props/crate_open.png'), crate);
fs.mkdirSync(path.join(tmp, 'art/manifests'));
const row = (extra = '') => `- id: crate\n  layer: structure\n  biomes: [meadow]\n  size: [1, 1]\n  states: [closed, open]\n  variants: []\n  block: true\n  overhead_rows: 0\n  placeholder: true\n  licence: original\n  author: "the creator"\n${extra}`;
fs.writeFileSync(path.join(tmp, 'art/manifests/props.yaml'), row());
fs.writeFileSync(path.join(tmp, 'art/manifests/cubie.yaml'), `- id: idle\n  layer: character\n  placeholder: true\n  licence: original\n  author: the creator\n- id: faces\n  layer: overlay\n  placeholder: true\n  licence: original\n  author: the creator\n`);
expect('manifest-check passes good manifests', run('manifest-check.mjs', []), 0);
expect('list-existing finds the crate', (() => { const r = run('list-existing.mjs', ['--grep', 'crate']); if (!r.stdout.includes('crate')) r.status = 9; return r; })(), 0);
expect('check-asset passes the crate', run('check-asset.mjs', ['art/props/crate.png', 'crate']), 0);
writePng(path.join(tmp, 'art/props/stray.png'), crate);
expect('manifest-check catches a PNG with no row', run('manifest-check.mjs', []), 1);
fs.rmSync(path.join(tmp, 'art/props/stray.png'));
fs.writeFileSync(path.join(tmp, 'art/manifests/props.yaml'), row().replace('"the creator"', 'Someone'));
expect('manifest-check refuses a named author', run('manifest-check.mjs', []), 1);
fs.writeFileSync(path.join(tmp, 'art/manifests/props.yaml'), row());
const wide = blank(40, 32); for (let y = 20; y < 32; y++) for (let x = 0; x < 40; x++) px(wide, x, y, '#6b7382'); writePng(path.join(tmp, 'wide.png'), wide);
expect('check-asset catches a sprite wider than its footprint', run('check-asset.mjs', ['wide.png', 'crate']), 1);

// ── outputs ──
expect('compose-atlas packs the art', run('compose-atlas.mjs', ['art', '--out', 'out/atlas']), 0);
const anims = JSON.parse(fs.readFileSync(path.join(tmp, 'out/atlas/animations.json'), 'utf8')).anims;
if (anims.length !== 4 || anims[0].frames.length !== 4) { fails++; console.log(`FAIL  animations.json has ${anims.length} anims`); } else console.log('pass  animations.json has idle × 4 directions');
const tile = blank(64, 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) px(tile, x, y, x < 32 ? '#74974f' : '#93b25c'); writePng(path.join(tmp, 'tiles.png'), tile);
fs.writeFileSync(path.join(tmp, 'chunk.tmj'), JSON.stringify({ orientation: 'orthogonal', width: 2, height: 2, tilewidth: 32, tileheight: 32, tilesets: [{ firstgid: 1, image: 'tiles.png', tilewidth: 32, tileheight: 32, columns: 2, tilecount: 2 }, { firstgid: 10, tiles: [{ id: 0, image: 'art/props/crate.png' }] }], layers: [{ type: 'tilelayer', width: 2, height: 2, data: [1, 2, 2, 1] }, { type: 'objectgroup', objects: [{ gid: 10, x: 32, y: 64 }] }] }));
expect('render-chunk renders a chunk', run('render-chunk.mjs', ['chunk.tmj', '--out', 'out/chunk.png', '--grid', '--night']), 0);
expect('look renders day | night on the meadow', run('look.mjs', ['--out', 'out/look.png', '--night', 'art/cubie/idle.png', 'art/props/crate.png']), 0);
expect('preview writes an APNG', run('preview.mjs', ['art/cubie', 'idle', '--out', 'out/idle.png']), 0);
const ap = fs.readFileSync(path.join(tmp, 'out/idle.png')); if (!ap.includes(Buffer.from('acTL')) || readPng(path.join(tmp, 'out/idle.png')).width < 1) { fails++; console.log('FAIL  preview is not an APNG'); } else console.log('pass  preview is an APNG with a readable first frame');
expect('sheet (office, unchanged) still runs', run('sheet.mjs', ['--out', 'out/sheet.png', 'art/props/crate.png']), 0);

// ── the approved turnaround reproduces, if it is in this checkout ──
const root = repoRoot(here); const ta = root && path.join(root, 'art/src/cubie/turnaround.mjs');
if (ta && fs.existsSync(ta) && fs.existsSync(path.join(root, 'art/reference/cubie'))) {
  const o = path.join(tmp, 'turnaround'); execFileSync(process.execPath, [ta, o], { cwd: root });
  const pairs = [...dirs.map((d) => [`cubie_${d}.png`, `cubie_O_${d}.png`]), ...['idle', 'happy', 'thinking', 'sad', 'surprised', 'blink', 'off'].map((f) => [`faces/${f}.png`, `face_${f}.png`])];
  const diff = pairs.filter(([r, g]) => !fs.existsSync(path.join(o, g)) || !fs.readFileSync(path.join(root, 'art/reference/cubie', r)).equals(fs.readFileSync(path.join(o, g))));
  if (diff.length) { fails++; console.log(`FAIL  turnaround differs from art/reference/cubie: ${diff.map((p) => p[0]).join(', ')}`); } else console.log(`pass  turnaround reproduces art/reference/cubie byte for byte (${pairs.length} files)`);
} else console.log('skip  turnaround (art/src/cubie/turnaround.mjs not in this checkout)');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
