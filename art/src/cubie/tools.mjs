// Held tools for Cubie's action clips (art-02): drawn per frame from the hand
// anchor along one of eight directions, as `held.<tool>` overlays. Wood haft,
// steel head, 1-px outline in each material's darkest step (pix.mjs Layer).
// `behind` (or any N frame) hides the tool wherever his body is, so it reads as
// held behind him; `over` (a tool raised over his head) draws on top in every facing.
import { Layer } from '../../../.claude/skills/cubie-pixel-art/scripts/pix.mjs';

const RAMPS = {
  wood: ['#c4a985', '#ad9170', '#96785c', '#7a5f49', '#5a4536', '#3b2d26'],
  steel: ['#c6c8d1', '#a9abb8', '#8a8d9d', '#6b6e7e', '#4e5160', '#343540'],
};
const OUT = { wood: '#3b2d26', steel: '#343540' };
// screen directions, by angle in degrees (0 = right, 90 = up)
const DIR = { 0: [1, 0], 45: [1, -1], 90: [0, -1], 135: [-1, -1], 180: [-1, 0], 225: [-1, 1], 270: [0, 1], 315: [1, 1] };
const norm = (a) => ((Math.round(a / 45) * 45) % 360 + 360) % 360;

const SHAPES = {
  // haft length, then the head drawn at the tip in (along u, across v) coordinates
  axe: { haft: 9, head: (put) => { for (let a = -1; a <= 0; a++) for (let b = 0; b <= 3; b++) put(a, b, b === 3 ? 0 : 2); put(0, -1, 3); } },
  pick: { haft: 9, head: (put) => { for (let b = -3; b <= 3; b++) put(0, b, Math.abs(b) === 3 ? 0 : 2); put(-1, -3, 1); put(-1, 3, 1); } },
  shovel: { haft: 9, head: (put) => { for (let a = 0; a <= 3; a++) for (let b = -1; b <= 1; b++) if (!(a === 3 && b !== 0)) put(a, b, a === 0 ? 3 : b === -1 ? 1 : 2); } },
  hammer: { haft: 6, head: (put) => { for (let a = 0; a <= 1; a++) for (let b = -2; b <= 1; b++) put(a, b, a === 0 ? 1 : 3); } },
  // a paddle: long haft with a T-grip at the hand end, wider blade
  paddle: { haft: 11, grip: true, head: (put) => { for (let a = 0; a <= 4; a++) for (let b = -1; b <= 1; b++) if (!(a === 4 && b !== 0)) put(a, b, a === 0 ? 3 : b === -1 ? 1 : 2); } },
  // a raft oar: long haft, flat blade
  oar: { haft: 12, head: (put) => { for (let a = 0; a <= 4; a++) for (let b = -1; b <= 1; b++) if (!(a === 4 && b !== 0)) put(a, b, a === 0 ? 3 : b === -1 ? 1 : 2); } },
  sickle: { haft: 4, head: (put) => { [[0, 1], [1, 2], [2, 2], [3, 1], [4, 0], [4, -1]].forEach(([a, b], i) => put(a, b, i < 2 ? 2 : 1)); } },
};

/**
 * Pixels of a tool held at the frame's hand, pointing `angle` (screen degrees; for
 * E/W pass the angle as if facing E, for S/N as seen from the S). W and N are mirror
 * views, so the angle and the head's sides are both mirrored there (mirroring only the
 * angle left the axe blade facing backwards). Returns [[x, y, colour, false]…].
 */
export function tool(fr, kind, angle, { behind = false, over = false, hand = 'A', flip = false, nudge = [0, 0] } = {}) {
  const h0 = fr.hands?.[hand]; if (!h0) return []; const h = { x: h0.x + nudge[0], y: h0.y + nudge[1] };
  // flip: the other hand's tool in a mirrored pair (the second oar)
  const mirror = (fr.d === 'W' || fr.d === 'N') !== flip;
  const a = norm(mirror ? 180 - angle : angle); const [ux, uy] = DIR[a]; const [vx, vy] = mirror ? [uy, -ux] : [-uy, ux];
  const L = new Layer(32, fr.rows.length, RAMPS, OUT); const S = SHAPES[kind];
  for (let i = 0; i <= S.haft; i++) L.set(h.x + ux * (i - 1), h.y + uy * (i - 1), 'wood', i < 2 ? 3 : 2);
  if (S.grip) { L.set(h.x - ux * 2 + vx, h.y - uy * 2 + vy, 'wood', 3); L.set(h.x - ux * 2 - vx, h.y - uy * 2 - vy, 'wood', 3); L.set(h.x - ux * 2, h.y - uy * 2, 'wood', 3); }
  const tx = h.x + ux * S.haft, ty = h.y + uy * S.haft;
  // at 45° single steps leave a checkerboard; fill the step so the head reads solid
  const diag = ux !== 0 && uy !== 0;
  S.head((along, across, tone) => { const x = tx + ux * along + vx * across, y = ty + uy * along + vy * across; L.set(x, y, 'steel', tone); if (diag && !L.get(x - ux, y)) L.set(x - ux, y, 'steel', Math.min(tone + 1, 4)); });
  const rows = L.render(); const out = [];
  rows.forEach((row, y) => row.forEach((c, x) => { if (c && !((behind || (fr.d === 'N' && !over)) && fr.rows[y]?.[x])) out.push([x, y, c, false]); }));
  return out;
}
