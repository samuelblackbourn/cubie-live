// Things Cubie wears or that happen to him, on every clip (art-02 group 5): the
// battery pack and the cargo frame on his back, and the wet status. Each is a
// function of the drawn frame (torso box, rows, facing), so one definition rides
// every pose of every clip; build.mjs writes them as `<clip>.<name>.png` overlays.
// Back overlays are masked by his body except from behind (build.mjs).
import { Layer } from '../../../.claude/skills/cubie-pixel-art/scripts/pix.mjs';
import { RAMPS, TEAL } from './model.mjs';

const R = {
  case: ['#9aa3b1', '#6b7382', '#4d5361', '#3f4552', '#2e323c', '#1f2229'], // the dark metal ramp
  wood: ['#c4a985', '#ad9170', '#96785c', '#7a5f49', '#5a4536', '#3b2d26'],
  cloth: ['#c9b48f', '#ad9170', '#96785c', '#7a5f49', '#5a4536', '#3b2d26'],
};
const OUT = { case: '#1f2229', wood: '#3b2d26', cloth: '#3b2d26' };
const mk = () => new Layer(32, 48, R, OUT);
const px = (L) => { const out = []; L.render().forEach((row, y) => row.forEach((c, x) => { if (c) out.push([x, y, c, false]); })); return out; };
/** a filled box in one material, lit top-left, shaded bottom-right */
const box = (L, m, x0, y0, x1, y1, lit = 1, mid = 2, dark = 3) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) L.set(x, y, m, y === y0 || x === x0 ? lit : y === y1 || x === x1 ? dark : mid);
};

/** shoulder straps seen from the front: two short dark bands over his shoulders, drawn over the body */
const straps = (t) => [t.x0 + 1, t.x1 - 1].flatMap((x) => [0, 1, 2].map((i) => [x, t.y0 + i, i === 0 ? '#5a4536' : '#3b2d26', false, true]));
// ── battery pack: a boxy cell in dark metal, a lid band, three charge bars that glow ──
export function batteryPack(fr) {
  const t = fr.torso; if (!t) return [];
  const L = mk(); const out = [];
  const top = t.y0 - 1, bot = t.y1 - 1;
  if (fr.d === 'S' || fr.d === 'N') {
    const x0 = t.x0 - 2, x1 = t.x1 + 2;
    box(L, 'case', x0, top, x1, bot);
    for (let x = x0; x <= x1; x++) L.set(x, top + 2, 'case', 3); // lid seam
    const res = px(L);
    if (fr.d === 'S') res.push(...straps(t));
    if (fr.d === 'N') { // the gauge faces out of his back: three bars, lit
      const gx = ((x0 + x1) >> 1) - 3;
      for (let i = 0; i < 3; i++) for (let y = top + 4; y <= top + 7; y++) res.push([gx + i * 3, y, TEAL[1], true], [gx + i * 3 + 1, y, i === 0 ? TEAL[0] : TEAL[1], true]);
      // the straps over his shoulders
      for (const sx of [t.x0 + 1, t.x1 - 1]) res.push([sx, top - 1, '#3b2d26', false]);
    }
    return res;
  }
  // side: 5 deep off his back; the gauge shows as a thin lit edge on the outer face
  const E = fr.d === 'E'; const back = E ? t.x0 : t.x1;
  const x0 = E ? back - 5 : back, x1 = E ? back : back + 5;
  box(L, 'case', x0, top, x1, bot);
  for (let x = x0; x <= x1; x++) L.set(x, top + 2, 'case', 3);
  out.push(...px(L));
  const gx = E ? x0 + 1 : x1 - 1;
  for (let y = top + 4; y <= top + 7; y++) out.push([gx, y, TEAL[1], true]);
  return out;
}

// ── cargo frame: two wooden rails rising past his head, crossbars, a strapped sack ──
export function cargoFrame(fr) {
  const t = fr.torso; if (!t) return [];
  const L = mk();
  const top = Math.max(1, fr.headTop - 4), bot = t.y1;
  const sack = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!((x === x0 || x === x1) && (y === y0 || y === y1))) L.set(x, y, 'cloth', y === y0 || x === x0 ? 1 : y === y1 || x === x1 ? 3 : 2); };
  if (fr.d === 'S' || fr.d === 'N') {
    const xl = t.x0 - 3, xr = t.x1 + 3;
    if (fr.d === 'N') sack(xl + 1, t.y0 - 1, xr - 1, t.y1 - 2); // the load, strapped between the rails
    for (let y = top; y <= bot; y++) { L.set(xl, y, 'wood', 2); L.set(xl + 1, y, 'wood', 3); L.set(xr - 1, y, 'wood', 2); L.set(xr, y, 'wood', 3); }
    for (const y of [top + 1, t.y0 + 6]) for (let x = xl + 2; x <= xr - 2; x++) L.set(x, y, 'wood', 1);
    let res = px(L);
    if (fr.d === 'N') res = res.filter(([x, y]) => y >= t.y0 || !fr.rows[y]?.[x]); // from behind, the posts pass behind his head
    if (fr.d === 'S') res.push(...straps(t));
    if (fr.d === 'N') for (const y of [t.y0 + 1, t.y1 - 4]) for (let x = xl + 2; x <= xr - 2; x++) res.push([x, y, '#4d5361', false]); // straps
    return res;
  }
  const E = fr.d === 'E'; const back = E ? t.x0 : t.x1; const s = E ? -1 : 1;
  const rail = back + s * 2; // the rail stands 2 px off his back; the load bulges further
  sack(Math.min(rail + s, rail + s * 5), t.y0 - 2, Math.max(rail + s, rail + s * 5), t.y1 - 2);
  for (let y = top; y <= bot; y++) { L.set(rail, y, 'wood', 2); L.set(rail - s, y, 'wood', 3); }
  for (const y of [top + 1, t.y0 + 6]) for (let i = 0; i <= 2; i++) L.set(back + s * i, y, 'wood', 1);
  const res = px(L);
  for (const y of [t.y0 + 1, t.y1 - 4]) for (let i = 1; i <= 6; i++) { const x = rail + s * i; if (res.some((p) => p[0] === x && p[1] === y)) res.push([x, y, '#4d5361', false]); }
  return res;
}

// ── wet: his metal a step darker except the brightest sheen, and 2-px drips that fall
// from his head and body on frames 2 and 6 (of each 8; frame 2 of shorter clips) ──
const DARKER = new Map(RAMPS.metal.slice(1, -1).map((c, i) => [c, RAMPS.metal[i + 2]]));
const DROP = ['#d6f0f7', '#8ec3d8'];
/** tint.wet: his metal one step darker except the brightest sheen; drawn right on the body, under packs and tools */
export function wetTint(fr) {
  const out = [];
  fr.rows.forEach((row, y) => row.forEach((c, x) => { if (DARKER.has(c)) out.push([x, y, DARKER.get(c), false]); }));
  return out;
}
/** status.wet: the drips */
export function wet(fr) {
  const out = [];
  const k = fr.f % 8; if (k !== 2 && k !== 6) return out;
  const t = fr.torso; if (!t) return out;
  // the head's lowest full-width row: the first row above the torso wider than it by 3+
  let hy = t.y0 - 1, hl = null, hr = null;
  for (; hy > 0; hy--) { const xs = fr.rows[hy].map((c, x) => (c ? x : -1)).filter((x) => x >= 0); if (xs.length && xs[0] < t.x0 - 2) { hl = xs[0]; hr = xs.at(-1); break; } }
  const spots = [];
  const left = k === 2;
  if (hl !== null) spots.push(left ? [hl + 1, hy + 2] : [hr - 1, hy + 2]);
  spots.push(left ? [t.x1, t.y1 + 2] : [t.x0, t.y1 + 2]);
  for (const [x, y] of spots) for (let i = 0; i < 2; i++) if (!fr.rows[y + i]?.[x]) out.push([x, y + i, DROP[i], false]);
  return out;
}

export const WEAR = { 'back.battery_pack': batteryPack, 'back.cargo_frame': cargoFrame, 'tint.wet': wetTint, 'status.wet': wet };
