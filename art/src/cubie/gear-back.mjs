// Gear catalogue, group 1: the back slot (docs/design/08-gear.md §3.1, beyond the
// battery pack and cargo frame already in wear.mjs). Each piece is a function of the
// drawn frame → [[x, y, colour, glows?, over?]…], drawn on the gear palette with the
// Layer's auto-outline. build.mjs masks back pieces by his body except from behind
// (N); `over` marks the few pixels that cross his front (straps, cables, a hose).
//
// What reads from each side: from the front only what rises above his head or sticks
// out past his arms, so most pieces have a "tell" there (panels, a mast, a balloon,
// wing tips, rotor blades); from the side the depth; from behind the whole thing.
import { Layer } from '../../../.claude/skills/cubie-pixel-art/scripts/pix.mjs';
import { GEAR_RAMPS as G } from '../../../.claude/skills/cubie-pixel-art/scripts/lib.mjs';
import { RAMPS, TEAL } from './model.mjs';

const R = { ...G, dark: RAMPS.dark };
const OUT = Object.fromEntries(Object.entries(R).map(([k, r]) => [k, r[r.length - 1]]));

/** everything a piece needs about the frame, in back-relative terms */
function ctx(fr) {
  const t = fr.torso; if (!t) return null;
  const L = new Layer(32, fr.rows.length, R, OUT);
  const side = fr.d === 'E' || fr.d === 'W', s = fr.d === 'E' ? 1 : -1; // s: the way he faces, from the side
  const backX = fr.d === 'E' ? t.x0 : t.x1;
  return {
    L, t, d: fr.d, f: fr.f ?? 0, side, s, backX, front: fr.d === 'S', rear: fr.d === 'N',
    cx: (t.x0 + t.x1 + 1) >> 1, top: t.y0 - 1, bot: t.y1 - 1, headTop: fr.headTop, screen: fr.screen,
    /** x at u px behind his back (side views) */
    behind: (u) => backX - s * u,
    box(m, x0, y0, x1, y1, lit = 1, mid = 2, dark = 3) { const [a, b] = x0 <= x1 ? [x0, x1] : [x1, x0]; for (let y = y0; y <= y1; y++) for (let x = a; x <= b; x++) L.set(x, y, m, y === y0 || x === a ? lit : y === y1 || x === b ? dark : mid); },
    /** a box from the back plane out to u px behind him (side) or centred w wide (front/back) */
    slab(m, w, y0, y1, u, lit, mid, dark) { if (side) this.box(m, backX, y0, this.behind(u), y1, lit, mid, dark); else this.box(m, this.cx - (w >> 1), y0, this.cx + ((w + 1) >> 1) - 1, y1, lit, mid, dark); },
    set: (x, y, m, tn) => L.set(x, y, m, tn),
    line(m, tn, x0, y0, x1, y1) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) L.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), m, tn); },
  };
}
const out = (c, extra = []) => { const res = []; c.L.render().forEach((row, y) => row.forEach((col, x) => { if (col) res.push([x, y, col, false]); })); return [...res, ...extra]; };
const hex = (m, tn) => R[m][tn];
/** shoulder straps across his front (from the front only) */
const straps = (c, m = 'leather') => (c.front ? [c.t.x0 + 1, c.t.x1 - 1].flatMap((x) => [0, 1, 2].map((i) => [x, c.t.y0 + i, hex(m, i === 0 ? 2 : 4), false, true])) : []);

// 1 ── solar backpack: a canvas pack with a fold-out array of navy cells on a mast, above his head
export function solarBackpack(fr) {
  const c = ctx(fr); if (!c) return [];
  c.slab('canvas', 10, c.top + 2, c.bot - 1, 3);
  const ay = Math.max(1, c.headTop - 7);
  const cells = (x0, x1) => { for (let y = ay; y <= ay + 4; y++) for (let x = x0; x <= x1; x++) { const frame = y === ay || y === ay + 4 || x === x0 || x === x1; c.set(x, y, frame ? 'brass' : 'navy', frame ? (y === ay ? 1 : 3) : (x - x0) % 3 === 0 ? 4 : y === ay + 1 ? 1 : 2); } };
  if (c.side) { // edge-on: a thin tilted slab across the top, its mast down his back
    c.line('dark', 3, c.behind(2), c.top + 2, c.behind(2), ay + 2);
    for (let i = -2; i <= 9; i++) { c.set(c.behind(2) - c.s * i, ay + 1 + (i > 4 ? 1 : 0), 'navy', 2); c.set(c.behind(2) - c.s * i, ay + 2 + (i > 4 ? 1 : 0), 'brass', 3); }
  } else {
    c.line('dark', 3, c.cx - 1, c.top + 2, c.cx - 1, ay + 4);
    cells(c.cx - 14, c.cx - 3); cells(c.cx + 2, c.cx + 13);
  }
  return out(c, straps(c, 'canvas'));
}

// 2 ── big battery: twin rubber cells with orange bands and copper caps, cables over the shoulders
export function bigBattery(fr) {
  const c = ctx(fr); if (!c) return [];
  const y0 = c.top - 3, y1 = c.bot + 1;
  const cell = (x0, x1) => { c.box('rubber', x0, y0 + 1, x1, y1); for (let x = x0; x <= x1; x++) { c.set(x, y0, 'copper', x === x0 ? 1 : 2); c.set(x, y0 + 4, 'orange', x === x1 ? 3 : 2); c.set(x, y1 - 2, 'orange', x === x1 ? 3 : 2); } };
  const extra = [];
  if (c.side) cell(c.behind(6), c.behind(1));
  else {
    cell(c.cx - 7, c.cx - 2); cell(c.cx + 1, c.cx + 6);
    if (c.rear) for (const gx of [c.cx - 5, c.cx + 3]) for (let y = y0 + 6; y <= y0 + 9; y++) extra.push([gx, y, TEAL[1], true]); // his charge, on each cell
    if (c.front) for (const [x0, dir] of [[c.t.x0, -1], [c.t.x1, 1]]) for (let i = 0; i < 3; i++) extra.push([x0 - dir * i, c.t.y0 + (i === 0 ? 0 : 1), hex('copper', i === 0 ? 1 : 3), false, true]);
  }
  return out(c, extra);
}

// 3 ── jet pack: two copper tanks, dark nozzles under them, orange fins
export function jetPack(fr) {
  const c = ctx(fr); if (!c) return [];
  const y0 = c.top - 1, y1 = c.bot;
  const tank = (x0, x1, finSide) => {
    c.box('copper', x0, y0 + 1, x1, y1); for (let x = x0 + 1; x < x1; x++) c.set(x, y0, 'copper', 1);
    for (let x = x0 + 1; x <= x1 - 1; x++) { c.set(x, y1 + 1, 'dark', 3); c.set(x, y1 + 2, 'dark', 4); }
    const fx = finSide < 0 ? x0 - 1 : x1 + 1; for (let i = 0; i < 4; i++) c.set(fx + (i > 1 ? finSide : 0), y1 - 2 + i, 'orange', i < 2 ? 2 : 3);
  };
  if (c.side) tank(c.behind(5), c.behind(1), c.s);
  else { tank(c.cx - 7, c.cx - 3, -1); tank(c.cx + 2, c.cx + 6, 1); }
  return out(c, straps(c));
}

// 4 ── glider wings: crimson cloth on leather ribs, folded up and out past his head
export function gliderWings(fr) {
  const c = ctx(fr); if (!c) return [];
  const yb = c.t.y0 + 5, yt = Math.max(1, c.headTop - 3);
  if (c.side) { // folded flat along his back, the tips above his head
    for (let y = yt; y <= yb; y++) { const w = y < yt + 3 ? 1 : 2; for (let i = 1; i <= w + 1; i++) c.set(c.behind(i), y, i === 1 ? 'leather' : 'crimson', i === 1 ? 3 : y % 5 === 0 ? 3 : 2); }
  } else for (const dir of [-1, 1]) {
    for (let y = yt; y <= yb; y++) {
      const k = (yb - y) / (yb - yt); // 0 at the shoulder, 1 at the tip
      const inner = c.cx + dir * Math.round(3 + 10 * k), outer = c.cx + dir * Math.round(5 + 11 * k - (k > 0.85 ? 3 : 0));
      const [a, b] = inner < outer ? [inner, outer] : [outer, inner];
      for (let x = a; x <= b; x++) c.set(x, y, x === inner ? 'leather' : 'crimson', x === inner ? 3 : (y + x) % 6 === 0 ? 3 : dir < 0 ? 1 : 2);
    }
  }
  return out(c, straps(c));
}

// 5 ── tank pack: a round navy tank, a brass valve, a rubber hose round to his screen
export function tankPack(fr) {
  const c = ctx(fr); if (!c) return [];
  const extra = [];
  if (c.side) { c.box('navy', c.behind(5), c.top, c.behind(1), c.bot); c.set(c.behind(3), c.top - 1, 'brass', 2); }
  else { c.box('navy', c.cx - 5, c.top, c.cx + 4, c.bot); for (const [x, y] of [[c.cx - 5, c.top], [c.cx + 4, c.top], [c.cx - 5, c.bot], [c.cx + 4, c.bot]]) c.set(x, y, null); c.set(c.cx, c.top - 1, 'brass', 1); c.set(c.cx, c.top - 2, 'brass', 3); }
  const s = c.screen;
  if (c.front && s) { const hx = s.x + s.w, hy = s.y + s.h; for (let y = hy; y <= c.t.y0; y++) extra.push([hx + (y > hy + 1 ? 1 : 0), y, hex('rubber', 1), false, true]); }
  if (c.side && s) { const fx = c.s > 0 ? s.x + s.w : s.x - 1; for (let x = Math.min(c.behind(2), fx); x <= Math.max(c.behind(2), fx); x++) extra.push([x, c.t.y0 - 1, hex('rubber', 1), false, true]); }
  if (c.rear) c.line('rubber', 1, c.cx, c.top - 2, c.cx + 6, c.top - 4);
  return out(c, [...extra, ...straps(c)]);
}

// 6 ── water tank: a leather-staved barrel with brass hoops, a gauge window behind, a spout to one side
export function waterTank(fr) {
  const c = ctx(fr); if (!c) return [];
  const y0 = c.top - 1, y1 = c.bot + 1;
  if (c.side) c.box('leather', c.behind(6), y0, c.behind(1), y1); else c.box('leather', c.cx - 6, y0, c.cx + 5, y1);
  const [x0, x1] = c.side ? [Math.min(c.behind(6), c.behind(1)), Math.max(c.behind(6), c.behind(1))] : [c.cx - 6, c.cx + 5];
  for (let x = x0; x <= x1; x++) { c.set(x, y0 + 2, 'brass', 2); c.set(x, y1 - 2, 'brass', 3); if (!c.side && (x - x0) % 3 === 2) for (let y = y0 + 3; y < y1 - 2; y++) c.set(x, y, 'leather', 3); }
  if (c.rear) for (let y = y0 + 4; y <= y1 - 4; y++) c.set(c.cx + 3, y, 'navy', y < y0 + 6 ? 4 : 1);
  // the spout: past his arm from the front and back, out of the barrel's base from the side
  const sx = c.cx + 6;
  for (let i = 0; i < 3; i++) c.set(c.side ? c.behind(7 + i) : sx + i, y1 - 3 + (i === 2 ? 1 : 0), 'brass', i === 2 ? 3 : 1);
  return out(c, straps(c));
}

// 7 ── parachute: a crimson pack with fold lines, a brass rip-cord ring on his chest
export function parachute(fr) {
  const c = ctx(fr); if (!c) return [];
  c.slab('crimson', 10, c.top, c.bot - 2, 3);
  if (c.rear) { for (let y = c.top + 2; y <= c.bot - 3; y += 3) for (let x = c.cx - 4; x <= c.cx + 3; x++) c.set(x, y, 'crimson', 3); c.line('canvas', 1, c.cx - 3, c.top + 1, c.cx + 2, c.bot - 3); }
  const extra = straps(c, 'crimson');
  if (c.front) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) extra.push([c.t.x0 + 3 + dx, c.t.y0 + 4 + dy, hex('brass', dx === dy ? 1 : 3), false, true]);
  return out(c, extra);
}

// 8 ── drone dock: a rubber cradle with a post, the little orange drone parked above his head
export function droneDock(fr) {
  const c = ctx(fr); if (!c) return [];
  c.slab('rubber', 8, c.top + 3, c.bot - 1, 2);
  const dy = Math.max(2, c.headTop - 4); const px = c.side ? c.behind(2) : c.cx + 7;
  c.line('dark', 3, px, c.top + 3, px, dy + 1);
  const bx = c.side ? c.behind(2) : c.cx + 7; const half = c.side ? 4 : 6;
  for (let x = bx - 2; x <= bx + 2; x++) { c.set(x, dy, 'orange', 1); c.set(x, dy + 1, 'orange', x === bx + 2 ? 3 : 2); }
  for (const dir of [-1, 1]) { for (let i = 3; i <= half; i++) c.set(bx + dir * i, dy, 'dark', 3); const rx = bx + dir * half; for (let i = -2; i <= 2; i++) c.set(rx + i, dy - 1, 'rubber', c.f % 2 ? 0 : 1); }
  return out(c, straps(c));
}

// 9 ── antenna mast: a small pack and a telescopic mast past his head, a blinking gold tip
export function antennaMast(fr) {
  const c = ctx(fr); if (!c) return [];
  c.slab('rubber', 6, c.top + 2, c.bot - 1, 2);
  const mx = c.side ? c.behind(2) : c.cx + 9, my = 1; // well off his own antenna, so the two never read as one
  if (!c.side) c.line('dark', 2, c.cx + 2, c.top + 2, mx, c.top + 2); // the mast's foot, out to the side // well off his own antenna, so the two never read as one
  for (let y = my + 1; y <= c.top + 2; y++) c.set(mx, y, 'dark', y < c.headTop ? 1 : 2);
  for (const y of [my + 4, c.headTop - 1]) if (y > my) c.set(mx + (c.side ? -c.s : 1), y, 'dark', 3); // telescope joints
  const extra = c.f % 4 < 2 ? [[mx, my, '#ffd95a', true]] : [[mx, my, hex('brass', 3), false]];
  return out(c, [...extra, ...straps(c)]);
}

// 10 ── backpack kitchen: a canvas frame hung with a copper pot, a rubber pan and a brass ladle
export function backpackKitchen(fr) {
  const c = ctx(fr); if (!c) return [];
  c.slab('canvas', 8, c.top, c.bot, 2);
  const hy = c.t.y0 + 4;
  const pot = (x0) => { c.box('copper', x0, hy, x0 + 4, hy + 3); c.set(x0 - 1, hy, 'copper', 3); c.set(x0 + 5, hy, 'copper', 3); };
  const pan = (x0, dir) => { c.box('rubber', x0, hy + 1, x0 + 3, hy + 3, 0, 1, 2); for (let i = 1; i <= 3; i++) c.set(dir < 0 ? x0 - i : x0 + 3 + i, hy + 1, 'leather', 2); };
  if (c.side) { pot(Math.min(c.behind(7), c.behind(3))); c.line('brass', 2, c.behind(2), c.top - 2, c.behind(2), c.top + 3); }
  else { pot(c.cx - 12); pan(c.cx + 8, 1); c.line('brass', 2, c.cx + 3, c.top - 3, c.cx + 3, c.top + 2); c.set(c.cx + 2, c.top - 3, 'brass', 1); }
  return out(c, straps(c));
}

// 11 ── snail house: a big curled shell he lives in when he's out, a tiny door, a warm window
export function snailHouse(fr) {
  const c = ctx(fr); if (!c) return [];
  const extra = [];
  const spiral = (ox, oy, rx, ry) => {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const e = (x * x) / (rx * rx) + (y * y) / (ry * ry); if (e > 1) continue; c.set(ox + x, oy + y, 'canvas', e > 0.75 ? 3 : y < 0 && x < 0 ? 0 : 1); }
    for (let a = 0; a < 6 * Math.PI; a += 0.12) { const r = 0.12 * a; const x = Math.round(ox + Math.cos(a) * r * rx * 0.45), y = Math.round(oy + Math.sin(a) * r * ry * 0.45); if (((x - ox) ** 2) / (rx * rx) + ((y - oy) ** 2) / (ry * ry) < 0.8) c.set(x, y, 'leather', 3); }
  };
  if (c.side) { spiral(c.behind(6), c.t.y0, 6, 8); c.box('leather', c.behind(3), c.bot - 2, c.behind(1), c.bot + 1); }
  else {
    spiral(c.cx, c.t.y0 - 6, 10, Math.max(8, c.t.y0 - c.headTop - 1));
    if (c.rear) { c.box('leather', c.cx - 2, c.bot - 3, c.cx + 1, c.bot + 1); extra.push([c.cx + 4, c.t.y0 - 8, '#ffd95a', true], [c.cx + 5, c.t.y0 - 8, '#ffd95a', true], [c.cx + 4, c.t.y0 - 7, '#ffd95a', true], [c.cx + 5, c.t.y0 - 7, '#ffd95a', true]); }
  }
  return out(c, [...extra, ...straps(c)]);
}

// 12 ── balloon pack: a little canvas pack on a string to a crimson balloon bobbing over his head
export function balloonPack(fr) {
  const c = ctx(fr); if (!c) return [];
  c.slab('canvas', 6, c.top + 3, c.bot - 1, 2);
  const bob = c.f % 4 < 2 ? 0 : 1; const bx = c.side ? c.behind(4) : c.cx + 9, by = bob;
  for (let y = 0; y < 7; y++) { const w = [2, 3, 3, 3, 3, 2, 1][y]; for (let x = -w; x <= w; x++) c.set(bx + x, by + y, 'crimson', x < 0 && y < 3 ? 0 : x > 1 ? 2 : 1); }
  c.line('canvas', 0, bx, by + 7, c.side ? c.behind(2) : c.cx + 3, c.top + 3);
  return out(c, straps(c, 'canvas'));
}

/** group 1, as worn overlays (back layer) */
export const GEAR_BACK = {
  'back.solar_backpack': solarBackpack, 'back.big_battery': bigBattery, 'back.jet_pack': jetPack, 'back.glider_wings': gliderWings,
  'back.tank_pack': tankPack, 'back.water_tank': waterTank, 'back.parachute': parachute, 'back.drone_dock': droneDock,
  'back.antenna_mast': antennaMast, 'back.backpack_kitchen': backpackKitchen, 'back.snail_house': snailHouse, 'back.balloon_pack': balloonPack,
};
