// Cubie's starter gear (docs/design/08-gear.md §3, ★ rows), drawn from the frame's
// part map so one definition fits every pose of every clip. Each piece is a function
// of the drawn frame returning [[x, y, colour, glows?, over?]…] like wear.mjs.
//
// Layers (gear §5): `outfit` sits on the body (torso, arms, belt, feet pieces);
// `visor` over the screen; `top` over the head and antenna. Colours come only from the
// gear palette (GEAR_RAMPS), never Cubie's own metal, screen, teal or pink.
import { GEAR_RAMPS as G } from '../../../.claude/skills/cubie-pixel-art/scripts/lib.mjs';
import { RAMPS, KEY } from './model.mjs';

/** the tone index (0 light … 5 dark) of one of Cubie's own pixels, so gear keeps his shading */
const TONE = new Map([...RAMPS.metal.map((c, i) => [c, i]), ...RAMPS.dark.map((c, i) => [c, Math.min(5, i + 1)])]);
const toneOf = (c, fallback = 2) => TONE.get(c) ?? fallback;
const at = (fr, x, y) => (y >= 0 && y < fr.rows.length && x >= 0 && x < 32 ? fr.parts[y][x] : null);
/** the bounding box of every pixel of one part */
function bbox(fr, part) {
  let x0 = 99, y0 = 99, x1 = -1, y1 = -1;
  fr.parts.forEach((row, y) => row.forEach((p, x) => { if (p === part) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}
/** recolour every pixel of the given parts in a box onto a gear ramp, keeping his tones */
function recolour(fr, parts, ramp, test = () => true, shift = 0) {
  const out = [];
  fr.parts.forEach((row, y) => row.forEach((p, x) => {
    if (!parts.includes(p) || !test(x, y)) return; const c = fr.rows[y][x]; if (!c || c === KEY) return;
    out.push([x, y, G[ramp][Math.max(0, Math.min(5, toneOf(c) + shift))], false]);
  }));
  return out;
}
const put = (out, x, y, ramp, t, over = false) => out.push([x, y, G[ramp][t], false, over]);
const isSide = (fr) => fr.d === 'E' || fr.d === 'W';
const fwd = (fr) => (fr.d === 'E' ? 1 : fr.d === 'W' ? -1 : 0);

// ── head (`top`) ──
/** hard hat: a signal-orange dome over the top of the head, a brim, the antenna through a hole */
export function hardHat(fr) {
  const h = bbox(fr, 'head'); if (!h) return [];
  const out = []; const y0 = h.y0 - 2, brim = h.y0 + 3;
  for (let y = y0; y < brim; y++) {
    const inset = y === y0 ? 4 : y === y0 + 1 ? 2 : 1;
    for (let x = h.x0 + inset; x <= h.x1 - inset; x++) {
      if (at(fr, x, y) === 'antenna' || at(fr, x, y) === 'fx') continue;
      const edge = x === h.x0 + inset || x === h.x1 - inset || y === y0;
      put(out, x, y, 'orange', edge ? 5 : y === y0 + 1 && x < (h.x0 + h.x1) / 2 ? 0 : x > (h.x0 + h.x1) / 2 + 3 ? 2 : 1);
    }
  }
  for (let x = h.x0 - 1; x <= h.x1 + 1; x++) { put(out, x, brim, 'orange', x === h.x0 - 1 || x === h.x1 + 1 ? 5 : 3); put(out, x, brim + 1, 'orange', 5); }
  return out;
}
/** sun hat: a wide straw brim with a crimson band and a low crown */
export function sunHat(fr) {
  const h = bbox(fr, 'head'); if (!h) return [];
  const out = []; const brim = h.y0 + 2, wide = isSide(fr) ? 3 : 3;
  for (let y = h.y0 - 2; y < brim; y++) for (let x = h.x0 + 3; x <= h.x1 - 3; x++) {
    if (at(fr, x, y) === 'antenna' || at(fr, x, y) === 'fx') continue;
    const band = y === brim - 1;
    put(out, x, y, band ? 'crimson' : 'canvas', band ? 2 : y === h.y0 - 2 || x === h.x0 + 3 || x === h.x1 - 3 ? 4 : x > (h.x0 + h.x1) / 2 ? 2 : 1);
  }
  for (let x = h.x0 - wide; x <= h.x1 + wide; x++) { put(out, x, brim, 'canvas', x <= h.x0 - wide + 1 || x >= h.x1 + wide - 1 ? 3 : 1); put(out, x, brim + 1, 'canvas', 4); }
  return out;
}

// ── screen (`visor`) ──
/** sun visor: a tinted band over the top of the screen and its bezel, with a lip; the eyes stay clear */
export function sunVisor(fr) {
  const s = fr.screen; if (!s) return [];
  const out = [];
  for (let x = s.x - 1; x <= s.x + s.w; x++) { put(out, x, s.y - 2, 'navy', 5); put(out, x, s.y - 1, 'navy', 3); put(out, x, s.y, 'navy', 4); }
  if (!isSide(fr)) { put(out, s.x - 2, s.y - 1, 'navy', 5); put(out, s.x + s.w + 1, s.y - 1, 'navy', 5); for (let x = s.x + 1; x < s.x + 5; x++) put(out, x, s.y - 1, 'navy', 1); }
  return out;
}

// ── torso, belt, feet (`outfit`) ──
/** apron: canvas over his front, a pocket, ties at the back; the chest strip shows through */
export function apron(fr) {
  const t = fr.torso; if (!t) return [];
  if (fr.d === 'N') { // the ties: a band across the back and a bow
    const out = []; const y = t.y0 + 6, cx = (t.x0 + t.x1 + 1) >> 1;
    for (let x = t.x0; x <= t.x1; x++) if (at(fr, x, y) === 'torso') put(out, x, y, 'canvas', 3);
    for (const [dx, dy, tn] of [[-2, -1, 2], [-1, 0, 3], [0, 0, 4], [1, 0, 3], [2, -1, 2], [-2, 1, 3], [2, 1, 3], [-1, 1, 4], [1, 1, 4]]) put(out, cx + dx, y + dy, 'canvas', tn);
    return out;
  }
  const front = (x) => (isSide(fr) ? (fwd(fr) > 0 ? x >= (t.x0 + t.x1) / 2 : x <= (t.x0 + t.x1) / 2) : true);
  const out = recolour(fr, ['torso'], 'canvas', (x, y) => y >= t.y0 + 1 && front(x), -1);
  for (let y = t.y1 + 1; y <= t.y1 + 2; y++) for (let x = t.x0 + 1; x <= t.x1 - 1; x++) if (front(x) && at(fr, x, y) === 'legs') put(out, x, y, 'canvas', y === t.y1 + 2 ? 4 : 2); // the skirt over his thighs
  if (!isSide(fr)) for (let x = t.x0 + 3; x <= t.x1 - 3; x++) put(out, x, t.y1 - 2, 'canvas', 4); // the pocket seam
  return out;
}
/** rain poncho: signal orange over his body and arms, flaring at the hem; the hood down behind his head */
export function rainPoncho(fr) {
  const t = fr.torso; if (!t) return [];
  const nub = new Set(Object.values(fr.hands ?? {}).flatMap(({ x, y }) => [-1, 0, 1, 2].flatMap((dy) => [-1, 0, 1].map((dx) => `${x + dx},${y + dy}`))));
  const out = recolour(fr, ['torso', 'arms'], 'orange', (x, y) => !nub.has(`${x},${y}`) && y <= t.y1 + 1, -1);
  for (let x = t.x0 - 1; x <= t.x1 + 1; x++) { const y = t.y1 + 1; put(out, x, y, 'orange', x === t.x0 - 1 || x === t.x1 + 1 ? 5 : 3, true); }
  if (fr.d === 'N') for (let x = t.x0 + 1; x <= t.x1 - 1; x++) { put(out, x, t.y0, 'orange', 2); put(out, x, t.y0 + 1, 'orange', x === t.x0 + 1 || x === t.x1 - 1 ? 4 : 3); } // hood, down
  return out;
}
/** tool belt: a leather band at the bottom of the torso, a brass buckle, a hammer hanging at the hip */
export function toolBelt(fr) {
  const t = fr.torso; if (!t) return [];
  const out = []; const y0 = t.y1 - 1;
  for (let y = y0; y <= t.y1; y++) for (let x = t.x0; x <= t.x1; x++) if (at(fr, x, y) === 'torso') put(out, x, y, 'leather', y === y0 ? 2 : 4);
  if (fr.d === 'S') { const cx = (t.x0 + t.x1 + 1) >> 1; for (const [dx, dy] of [[-1, 0], [0, 0], [-1, 1], [0, 1]]) put(out, cx + dx, y0 + dy, 'brass', dy === 0 ? 1 : 3); }
  // the hammer: at his left hip from the front and back, at the back hip from the side
  const hx = isSide(fr) ? (fwd(fr) > 0 ? t.x0 : t.x1) : fr.d === 'S' ? t.x0 + 1 : t.x1 - 1;
  for (let i = 1; i <= 4; i++) put(out, hx, t.y1 + i, 'leather', 3, true);
  for (const dx of [-1, 0, 1]) put(out, hx + dx, t.y1 + 4, 'rubber', dx === -1 ? 1 : 3, true);
  return out;
}
/** boots: his feet in leather, with a cuff over the bottom of each leg */
export function boots(fr) {
  const out = recolour(fr, ['feet'], 'leather', () => true, 0);
  fr.parts.forEach((row, y) => row.forEach((p, x) => { if (p === 'legs' && at(fr, x, y + 1) === 'feet') { put(out, x, y, 'leather', 2); if (at(fr, x, y - 1) === 'legs') put(out, x, y - 1, 'leather', 3); } }));
  return out;
}

// ── held (gadgets) ──
/** map board: a clipboard with a scribbled map, held flat at his side */
export function mapBoard(fr) {
  const h = fr.hands?.A; if (!h) return [];
  const out = []; const side = isSide(fr);
  const w = side ? 3 : 5, x0 = side ? h.x - 1 : h.x - (fr.d === 'S' ? 4 : 0), y0 = h.y - 3;
  for (let y = y0; y < y0 + 6; y++) for (let x = x0; x < x0 + w; x++) {
    const edge = x === x0 || x === x0 + w - 1 || y === y0 + 5;
    put(out, x, y, edge ? 'leather' : 'canvas', edge ? 3 : (x + y) % 3 === 0 && !side ? 3 : 1, true);
  }
  put(out, x0 + (w >> 1), y0 - 1, 'brass', 2, true);
  if (fr.d === 'N') return out.filter(([x, y]) => !fr.rows[y]?.[x]); // carried in front of him, so from behind only what sticks out
  return out;
}

/** every starter piece the build rides on every clip, as `worn` overlays */
export const GEAR_STARTER = {
  'top.hard_hat': hardHat, 'top.sun_hat': sunHat, 'visor.sun_visor': sunVisor,
  'outfit.apron': apron, 'outfit.rain_poncho': rainPoncho, 'outfit.tool_belt': toolBelt, 'outfit.boots': boots,
};
