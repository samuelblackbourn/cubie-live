// The pod's gear rack (docs/design/08-gear.md §5): the prop Cubie steps into to change
// gear. Drawn 48×56 and written as one 64×64 PNG per state (idle, working) on a 2×2
// footprint; drawn behind him, his feet on its base plate (row 62 of the PNG). Emissive: the work lamp on the top bar, lit while working.
//   node art/src/cubie/rack.mjs <out-dir>
import fs from 'node:fs';
import path from 'node:path';
import { Layer, paint } from '../../../.claude/skills/cubie-pixel-art/scripts/pix.mjs';
import { blank, writePng } from '../../../.claude/skills/cubie-pixel-art/scripts/png.mjs';
import { DRAFT_RAMPS as D } from '../../../.claude/skills/cubie-pixel-art/scripts/lib.mjs';

export const RW = 48, RH = 56;
// a pod fixture, so it is on the world's ramps (art system §2), not the gear palette: dark posts,
// a stone pegboard and base, an earth lamp hood, the red accent on the stripes and clamp tips
const rev = (r) => r.slice().reverse();
const R = { dark: rev(D.dark), rubber: rev(D.stone), brass: rev(D.earth), orange: ['#d0414f', '#d0414f', '#d0414f', '#d0414f', '#d0414f', '#3b2d26'] };
const OUT = { dark: D.dark[0], rubber: D.stone[0], brass: D.earth[0], orange: D.earth[0] };

/** one state: { rows, em } */
export function rack(working) {
  const L = new Layer(RW, RH, R, OUT); const em = [];
  // the back panel: a dark pegboard between the posts, so it reads as a booth he steps into
  for (let y = 7; y <= 50; y++) for (let x = 7; x <= RW - 8; x++) L.set(x, y, 'rubber', (x % 4 === 1 && y % 4 === 1) ? 3 : y < 10 ? 5 : 4);
  // base plate, rubber, with a step at the front
  for (let y = 51; y <= 55; y++) for (let x = 1; x <= RW - 2; x++) L.set(x, y, 'rubber', y === 51 ? 1 : y === 55 ? 4 : x < 4 ? 2 : 3);
  // two posts with a warm stripe, a top bar
  for (const x0 of [3, RW - 7]) for (let y = 6; y <= 50; y++) for (let x = x0; x <= x0 + 3; x++) L.set(x, y, (y >= 18 && y <= 20) ? 'orange' : 'dark', x === x0 ? 1 : x === x0 + 3 ? 4 : 2);
  for (let y = 2; y <= 6; y++) for (let x = 3; x <= RW - 4; x++) L.set(x, y, 'dark', y <= 3 ? 0 : y === 6 ? 4 : 2); // the top bar, its top face lit
  // the work lamp: a brass hood over a bulb that lights while working
  for (let x = 20; x <= 27; x++) L.set(x, 7, 'brass', x === 20 || x === 27 ? 3 : 2);
  for (let x = 21; x <= 26; x++) L.set(x, 8, 'brass', 4);
  for (let x = 22; x <= 25; x++) { L.set(x, 9, 'brass', 1); if (working) em.push([x, 9, '#ffd37a']); }
  // the clamp arms at his shoulder height: folded up against the posts at rest, reaching in while working
  const ay = 36;
  for (const [px, s] of [[6, 1], [RW - 8, -1]]) {
    if (working) {
      for (let i = 1; i <= 7; i++) { L.set(px + s * i, ay, 'dark', 2); L.set(px + s * i, ay + 1, 'dark', 4); }
      for (const dy of [-1, 0, 1, 2]) L.set(px + s * 8, ay + dy, 'orange', dy < 1 ? 1 : 3);
    } else for (let i = 0; i <= 5; i++) { L.set(px + s, ay - i, 'dark', 3); if (i === 5) L.set(px + s, ay - i - 1, 'orange', 2); }
  }
  return { rows: L.render(), em };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // one 64×64 PNG per state (a 2×2-tile footprint, the rack centred on it, standing on the bottom edge)
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true }); const ox = (64 - RW) / 2, oy = 64 - RH;
  for (const [state, w] of [['idle', false], ['working', true]]) {
    const base = blank(64, 64), glow = blank(64, 64); const { rows, em } = rack(w);
    paint(base, rows, ox, oy); em.forEach(([x, y, c]) => paint(glow, [[c]], ox + x, oy + y));
    writePng(path.join(out, `gear_rack_${state}.png`), base); writePng(path.join(out, `gear_rack_${state}_emissive.png`), glow);
  }
  console.log(`wrote ${out}/gear_rack_{idle,working}.png (64×64; Cubie's feet on row ${oy + 54 - 0})`);
}
