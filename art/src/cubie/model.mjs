// Cubie, model O, with a pose. The one drawing of Cubie: turnaround.mjs renders
// the approved reference from it, build.mjs the clips. Approved 2026-11-13 and
// revised the same evening (docs/design/07-cubie-character.md §5, step 9).
//
// Two render modes:
//   'approved'  everything baked: what turnaround.mjs writes to art/reference/cubie/.
//               build.mjs checks the reference still matches before every run.
//   'clip'      what the renderer loads: the screen is blank (the face is an
//               overlay drawn by anchor), the chest strip is the #ff00ff key, and
//               everything that glows is drawn "off" in the base with its lit
//               pixels returned separately for the _emissive layer.
//
// Pose (all optional, 0 = rest):
//   bob        body dips this many px (legs shorten; feet stay on row 47)
//   liftA/B    foot A / B raised this many px (A = left on screen in S, near in E/W)
//   dxA/B      foot A / B stride in px along the facing (E/W only; + = forward)
//   handA/B    hand A / B raised this many px (S/N) — the arm swing seen from the front
//   armDx      near arm swing in px along the facing (E/W)
//   armA/B     S/N: hand A / B moved { dx: outward px, dy: up px } — the arm is drawn
//              from the shoulder to it (A = left on screen)
//   arm        E/W: near hand moved { dx: forward px, dy: up px }
//   armsFront  draw the arms after the head (hands in front of the screen); build.mjs
//              moves them onto a front.arms overlay so the face overlay can't cover them
//   hideArms   leave the posed arms out (used to split them onto that overlay)
//   bodyDx     S/N: torso, arms and head shifted sideways (weight shift); feet stay
//   lean       E/W: torso, arms and head shifted along the facing (+ forward)
//   headDx     head (and antenna) shifted sideways — a turn of the head
//   headDy     head lowered onto the torso (+ down) — head hung, shoulders up
//   hop        whole sprite lifted off the ground (px)
//   dots       0–3 thought dots above the head
//   headTurn   S | N | E | W — the head turned on the body (look around)
//   antennaDx  antenna bent sideways by n px; antennaLift  antenna stretched up by n px
import { Layer } from '../../../.claude/skills/cubie-pixel-art/scripts/pix.mjs';

export const W = 32, H = 48;
export const RAMPS = {
  metal: ['#f7f9fb', '#e6eaf0', '#c7ced9', '#9aa3b1', '#6b7382', '#3f4552'],
  dark:  ['#9aa3b1', '#6b7382', '#4d5361', '#3f4552', '#2e323c', '#1f2229'],
  screen: ['#1b4a50', '#12343a', '#0b1f23', '#071417'],
};
const OUT = { metal: '#3f4552', dark: '#1f2229', screen: '#1f2229' };
export const TEAL = ['#7df2ea', '#27d4c9', '#1c9c94'];
export const PINK = ['#ffb0dc', '#f05fb3', '#c43a8a'];
export const KEY = '#ff00ff';
/** colours a glowing part shows when "off" in the base sprite */
const OFF = { bobbleHi: '#9aa3b1', bobble: '#6b7382', led: '#4d5361' };

// Revision 2 (2026-11-13 evening, the creator): the face 3 rows taller (screen 18×11,
// eyes and mouth in its middle, a slight smile at rest), the top of the head 3 rows
// lower (dome 13 → 7 rows; he is 45 px tall), hands without side points (a 1-px
// nub under the arm), white ears, and the two pass-2 fixes made part of the model
// (side near arm one column back, back vent up on the dome).
export const O = { headW: 24, headD: 16, headTop: 7, headF: 13, neck: 0, torsoW: 10, torsoD: 8, torsoTop: 3, torsoF: 8, legH: 6, foot: 3, armDrop: 1, screenW: 18, screenH: 11, domeR: 4, ear: 'metal', hand: 'nub', sideArm: true, vent: true };

const mk = () => new Layer(W, H, RAMPS, OUT);

// ---- shapes (unchanged from turnaround.mjs) ----------------------------------
function box(L, x0, y0, x1, y1, top, m = 'metal', shade = 0, r = 0) {
  const t = (a) => Math.min(a + shade, RAMPS[m].length - 1);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let tone;
    if (y < y0 + top) {
      if (top >= 7) {
        const u = (x - x0) / (x1 - x0), v = (y - y0) / (top - 1);
        const hi = ((u - 0.3) / 0.22) ** 2 + ((v - 0.38) / 0.28) ** 2, sh = ((u - 0.35) / 0.62) ** 2 + ((v - 0.55) / 0.62) ** 2;
        tone = y === y0 + top - 1 ? t(2) : hi < 1 ? t(0) : sh > 1 ? t(2) : t(1);
      } else tone = y === y0 + top - 1 ? t(3) : (x === x0 || y === y0) && x !== x1 ? t(0) : x === x1 ? t(2) : (top > 4 && (x > x1 - 3 || y > y0 + top - 4) && !(x < x0 + 3 && y < y0 + 3)) ? t(2) : t(1);
    }
    else tone = x === x1 || y === y1 ? t(3) : x === x0 ? t(1) : t(2);
    L.set(x, y, m, tone);
  }
  round(L, x0, y0, x1, y1, r);
}
function round(L, x0, y0, x1, y1, r) {
  const cut = { 1: [[0, 0]], 2: [[0, 0], [1, 0], [0, 1]], 3: [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2], [1, 1]] }[r] ?? [];
  for (const [dx, dy] of cut) { L.set(x0 + dx, y0 + dy, null); L.set(x1 - dx, y0 + dy, null); L.set(x0 + dx, y1 - dy, null); L.set(x1 - dx, y1 - dy, null); }
}
function ring(L, x0, y0, x1, y1) { for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (x < x0 || x > x1 || y < y0 || y > y1) L.set(x, y, null); }
const fxRect = (L, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) L.setFx(x, y, c); };
const ball = (L, x, y) => { L.rect(x, y, x + 1, y + 1, 'dark', (xx, yy) => (xx === x && yy === y ? 1 : xx === x + 1 && yy === y + 1 ? 4 : 3)); };
const hand = (L, x, y, kind = 'plus') => {
  if (kind === 'nub') { L.rect(x + 1, y, x + 1, y + 2, 'dark', (xx, yy) => (yy === y ? 2 : yy === y + 2 ? 4 : 3)); return; }
  L.rect(x, y, x + 2, y + 2, 'dark', (xx, yy) => (yy === y ? 2 : yy === y + 2 || xx === x + 2 ? 4 : 3));
  if (kind === 'plus') round(L, x, y, x + 2, y + 2, 1);
  else { L.set(x, y, null); L.set(x + 2, y, null); } // mitten: top corners round, flat bottom — no side points
};

/** A glowing pixel: in 'approved' it is baked; in 'clip' the base gets `off` and the light goes to the emissive list. */
function glow(L, ctx, x, y, lit, off) {
  if (ctx.mode === 'approved') { L.setFx(x, y, lit); return; }
  L.setFx(x, y, off); ctx.em.push([x, y, lit]);
}

function layout(p, pose) {
  const footY1 = H - 1, footY0 = footY1 - p.foot + 1;
  const legY1 = footY0 - 1, legY0 = legY1 - (p.legH - (pose.bob ?? 0)) + 1;
  const torY1 = legY0 - 1, torY0 = torY1 - (p.torsoTop + p.torsoF) + 1;
  const neckY1 = torY0 - 1, neckY0 = neckY1 - p.neck + 1;
  const headY1 = neckY0 - 1, headY0 = headY1 - (p.headTop + p.headF) + 1;
  const hd = pose.headDy ?? 0;
  return { armDrop: 0, ...p, footY0, footY1, legY0, legY1, torY0, torY1, neckY0, neckY1, headY0: headY0 + hd, headY1: headY1 + hd, cx: W / 2 };
}

// ---- faces: the seven approved (unchanged) + three placeholders ----------------
function eye(L, x, y, w = 4, h = 5, glint = true) {
  fxRect(L, x, y, x + w - 1, y + h - 1, TEAL[1]);
  for (const [dx, dy] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) L.setFx(x + dx, y + dy, null);
  if (glint) { L.setFx(x + 1, y + 1, TEAL[0]); if (w > 3) L.setFx(x + 2, y + 1, TEAL[0]); if (h > 3) L.setFx(x + 1, y + 2, TEAL[0]); }
}
function arch(L, x, y, w = 4) { fxRect(L, x + 1, y, x + w - 2, y, TEAL[1]); L.setFx(x, y + 1, TEAL[1]); L.setFx(x + w - 1, y + 1, TEAL[1]); L.setFx(x + 1, y + 1, TEAL[0]); }
const smile = (L, x, y, sw, sh) => { const my = y + sh - 1; fxRect(L, x + sw / 2 - 1, my, x + sw / 2, my, TEAL[1]); L.setFx(x + sw / 2 - 2, my - 1, TEAL[1]); L.setFx(x + sw / 2 + 1, my - 1, TEAL[1]); };
export const FACES = {
  // resting face: open eyes and a slight smile (mouth corners up one row; revision 2)
  idle:      (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2), eh = Math.min(5, sh - 3); eye(L, x + ex, y + 1, 4, eh); eye(L, x + sw - ex - 4, y + 1, 4, eh); smile(L, x, y, sw, sh); },
  happy:     (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); arch(L, x + ex, y + 2, 4); arch(L, x + sw - ex - 4, y + 2, 4); const my = y + sh - 2; L.setFx(x + sw / 2 - 3, my, TEAL[1]); L.setFx(x + sw / 2 + 2, my, TEAL[1]); fxRect(L, x + sw / 2 - 2, my + 1, x + sw / 2 + 1, my + 1, TEAL[1]); },
  thinking:  (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); eye(L, x + ex, y + 2, 4, sh - 4); eye(L, x + sw - ex - 4, y + 1, 4, sh - 3); fxRect(L, x + sw / 2 - 2, y + sh - 1, x + sw / 2, y + sh - 1, TEAL[2]); L.setFx(x + sw - 2, y + 1, TEAL[2]); L.setFx(x + sw - 1, y, TEAL[2]); },
  sad:       (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); eye(L, x + ex, y + 2, 4, sh - 4); eye(L, x + sw - ex - 4, y + 2, 4, sh - 4); fxRect(L, x + ex + 1, y + 2, x + ex + 3, y + 2, '#0b1f23'); fxRect(L, x + sw - ex - 4, y + 2, x + sw - ex - 2, y + 2, '#0b1f23'); const my = y + sh - 2; fxRect(L, x + sw / 2 - 1, my, x + sw / 2, my, TEAL[2]); L.setFx(x + sw / 2 - 2, my + 1, TEAL[2]); L.setFx(x + sw / 2 + 1, my + 1, TEAL[2]); },
  surprised: (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2) - 1; eye(L, x + ex, y, 5, sh - 2); eye(L, x + sw - ex - 5, y, 5, sh - 2); fxRect(L, x + sw / 2 - 1, y + sh - 2, x + sw / 2, y + sh - 1, TEAL[1]); },
  // blink interleaves on the resting face, so it keeps the resting smile
  blink:     (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); fxRect(L, x + ex, y + 3, x + ex + 3, y + 3, TEAL[1]); fxRect(L, x + sw - ex - 4, y + 3, x + sw - ex - 1, y + 3, TEAL[1]); smile(L, x, y, sw, sh); },
  off:       () => {},
  // placeholders added in art-01 (animations note §1); not part of the approved seven
  embarrassed: (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); for (const [ox, d] of [[x + ex, 1], [x + sw - ex - 4, -1]]) { const a = d > 0 ? ox : ox + 3, b = d > 0 ? ox + 3 : ox; L.setFx(a, y + 2, TEAL[1]); L.setFx(a + d, y + 3, TEAL[1]); L.setFx(a + 2 * d, y + 3, TEAL[1]); L.setFx(b, y + 4, TEAL[1]); L.setFx(a, y + 4, TEAL[1]); } fxRect(L, x + 1, y + 5, x + 2, y + 5, PINK[1]); fxRect(L, x + sw - 3, y + 5, x + sw - 2, y + 5, PINK[1]); fxRect(L, x + sw / 2 - 1, y + sh - 1, x + sw / 2, y + sh - 1, TEAL[2]); },
  closed:    (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); for (const ox of [x + ex, x + sw - ex - 4]) { L.setFx(ox, y + 3, TEAL[2]); fxRect(L, ox + 1, y + 4, ox + 2, y + 4, TEAL[2]); L.setFx(ox + 3, y + 3, TEAL[2]); } },
  // low power (art-02): heavy half-closed eyes, flat mouth — walk.tired
  tired:     (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); for (const ox of [x + ex, x + sw - ex - 4]) { fxRect(L, ox, y + 3, ox + 3, y + 5, TEAL[1]); L.setFx(ox, y + 5, null); L.setFx(ox + 3, y + 5, null); fxRect(L, ox, y + 3, ox + 3, y + 3, TEAL[2]); } fxRect(L, x + sw / 2 - 1, y + sh - 1, x + sw / 2, y + sh - 1, TEAL[1]); },
  // very low power: dim eyes barely open (a sliver over a flat lid), mouth turned down — shuffle
  very_tired: (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); for (const ox of [x + ex, x + sw - ex - 4]) { fxRect(L, ox, y + 5, ox + 3, y + 5, TEAL[2]); L.setFx(ox + 1, y + 4, TEAL[2]); L.setFx(ox + 2, y + 4, TEAL[2]); } const my = y + sh - 1; fxRect(L, x + sw / 2 - 1, my - 1, x + sw / 2, my - 1, TEAL[2]); L.setFx(x + sw / 2 - 2, my, TEAL[2]); L.setFx(x + sw / 2 + 1, my, TEAL[2]); },
  squint:    (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); for (const ox of [x + ex, x + sw - ex - 4]) { fxRect(L, ox, y + 3, ox + 3, y + 4, TEAL[1]); L.setFx(ox, y + 3, null); L.setFx(ox + 3, y + 3, null); L.setFx(ox + 1, y + 3, TEAL[0]); } fxRect(L, x + sw / 2 - 1, y + sh - 1, x + sw / 2, y + sh - 1, TEAL[1]); },
};
export const APPROVED_FACES = ['idle', 'happy', 'thinking', 'sad', 'surprised', 'blink', 'off'];
export const FACE_NAMES = [...APPROVED_FACES, 'embarrassed', 'closed', 'squint', 'tired', 'very_tired'];

/** The side-view wrap face: one eye on the screen's front edge. `idle` is the approved one; the rest are placeholders. */
function sideFace(L, face, dir, fx1, sy0, sh) {
  const ex = fx1 - dir * 2; const ex0 = Math.min(ex, ex + dir), ex1 = Math.max(ex, ex + dir); const near = dir > 0 ? ex0 : ex1, far = dir > 0 ? ex1 : ex0;
  const mouth = () => L.setFx(far, sy0 + sh - 1, TEAL[2]);
  switch (face) {
    case 'off': return;
    case 'idle': fxRect(L, ex0, sy0 + 3, ex1, sy0 + 7, TEAL[1]); L.setFx(near, sy0 + 4, TEAL[0]); L.setFx(far, sy0 + 9, TEAL[2]); L.setFx(near, sy0 + 9, TEAL[2]); L.setFx(far, sy0 + 8, TEAL[2]); return;
    case 'surprised': fxRect(L, ex0, sy0 + 2, ex1, sy0 + 7, TEAL[1]); L.setFx(near, sy0 + 3, TEAL[0]); return;
    case 'happy': fxRect(L, ex0, sy0 + 4, ex1, sy0 + 4, TEAL[1]); L.setFx(near, sy0 + 5, TEAL[1]); mouth(); return;
    case 'sad': fxRect(L, ex0, sy0 + 5, ex1, sy0 + 7, TEAL[1]); L.setFx(near, sy0 + 6, TEAL[0]); return;
    case 'thinking': fxRect(L, ex0, sy0 + 3, ex1, sy0 + 6, TEAL[1]); L.setFx(far, sy0 + 3, TEAL[0]); return;
    case 'blink': case 'closed': fxRect(L, ex0, sy0 + 5, ex1, sy0 + 5, face === 'blink' ? TEAL[1] : TEAL[2]); if (face === 'blink') { L.setFx(far, sy0 + 9, TEAL[2]); L.setFx(near, sy0 + 9, TEAL[2]); L.setFx(far, sy0 + 8, TEAL[2]); } return;
    case 'squint': fxRect(L, ex0, sy0 + 4, ex1, sy0 + 5, TEAL[1]); mouth(); return;
    case 'tired': fxRect(L, ex0, sy0 + 5, ex1, sy0 + 7, TEAL[1]); fxRect(L, ex0, sy0 + 5, ex1, sy0 + 5, TEAL[2]); L.setFx(far, sy0 + 9, TEAL[2]); return;
    case 'very_tired': fxRect(L, ex0, sy0 + 6, ex1, sy0 + 6, TEAL[2]); L.setFx(far, sy0 + 7, TEAL[2]); L.setFx(far, sy0 + 9, TEAL[2]); return;
    case 'embarrassed': L.setFx(near, sy0 + 4, TEAL[1]); L.setFx(far, sy0 + 5, TEAL[1]); L.setFx(near, sy0 + 6, TEAL[1]); L.setFx(far, sy0 + 7, PINK[1]); return;
    default: throw new Error(`no side face ${face}`);
  }
}

// ---- head ------------------------------------------------------------------
function head(L, g, face, ctx) {
  const cx = g.cx; const hx0 = cx - g.headW / 2, hx1 = cx + g.headW / 2 - 1;
  box(L, hx0, g.headY0, hx1, g.headY1, g.headTop, 'metal', 0, 3);
  if (g.domeR) round(L, hx0, g.headY0, hx1, g.headY0 + 2 * g.domeR, g.domeR);
  const py = g.headY0 + g.headTop + Math.floor(g.headF / 2) - 2;
  for (const x of [hx0 - 2, hx1 + 1]) { L.rect(x, py, x + 1, py + 3, g.ear ?? 'dark', (xx, yy) => (yy === py ? 1 : yy === py + 3 ? 3 : 2)); round(L, x, py, x + 1, py + 3, 1); }
  if (face !== null) {
    const sx0 = cx - g.screenW / 2, sx1 = sx0 + g.screenW - 1;
    const sy0 = g.headY0 + g.headTop + Math.floor((g.headF - g.screenH) / 2), sy1 = sy0 + g.screenH - 1;
    L.rect(sx0 - 1, sy0 - 1, sx1 + 1, sy1 + 1, 'dark', (x, y) => (y === sy0 - 1 ? 3 : 4)); round(L, sx0 - 1, sy0 - 1, sx1 + 1, sy1 + 1, 2);
    L.rect(sx0, sy0, sx1, sy1, 'screen', (x, y) => (y === sy0 && x < sx1 - 1 ? 1 : x === sx0 ? 1 : 2)); round(L, sx0, sy0, sx1, sy1, 1);
    for (const [x, y] of [[sx0, sy0], [sx1, sy0], [sx0, sy1], [sx1, sy1]]) L.set(x, y, 'dark', 4);
    ctx.screen = { x: sx0, y: sy0, w: g.screenW, h: g.screenH };
    if (ctx.mode === 'approved' || ctx.drawFace) {
      const band = Math.min(8, g.screenH), oy = Math.floor((g.screenH - band) / 2);
      FACES[face](L, sx0, sy0 + oy, g.screenW, band);
    }
  } else {
    const vy = g.headY0 + g.headTop + (g.vent ? -4 : 4);
    for (let i = 0; i < 3; i++) L.rect(cx - 3, vy + i * 2, cx + 2, vy + i * 2, 'dark', 3);
    L.rect(hx0 + 3, g.headY1 - 3, hx1 - 3, g.headY1 - 3, 'metal', 3);
  }
}
function antenna(L, ctx, x, y, lift = ctx.antLift ?? 0) {
  if (ctx.antDx) { // bent: stem leans, bobble sits one column over
    L.rect(x, y - 1, x, y - 1, 'dark', 2); L.rect(x + ctx.antDx, y - 2 - lift, x + ctx.antDx, y - 2, 'dark', 2); x += ctx.antDx;
    for (const [px, py] of [[x - 1, y - 4 - lift], [x, y - 4 - lift], [x - 1, y - 3 - lift], [x, y - 3 - lift]]) { const hi = px === x - 1 && py === y - 4 - lift; glow(L, ctx, px, py, hi ? PINK[0] : PINK[1], hi ? OFF.bobbleHi : OFF.bobble); }
    return;
  }
  L.rect(x, y - 2 - lift, x, y - 1, 'dark', 2);
  for (const [px, py] of [[x - 1, y - 4 - lift], [x, y - 4 - lift], [x - 1, y - 3 - lift], [x, y - 3 - lift]]) {
    const hi = px === x - 1 && py === y - 4 - lift;
    glow(L, ctx, px, py, hi ? PINK[0] : PINK[1], hi ? OFF.bobbleHi : OFF.bobble);
  }
}

// ---- posed arms -----------------------------------------------------------------
/** A 2-px arm from (x0, y0) to (x1, y1) — x is the arm's left column — with a gap
 * cleared either side so the outline separates it from what it crosses. */
function armLine(L, x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); const pts = [];
  for (let i = 0; i <= n; i++) pts.push([Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n)]);
  const flat = Math.abs(x1 - x0) > Math.abs(y1 - y0);
  for (const [x, y] of pts) if (flat) { L.set(x, y - 1, null); L.set(x, y + 2, null); } else { L.set(x - 1, y, null); L.set(x + 2, y, null); }
  for (const [x, y] of pts) if (flat) { L.set(x, y, 'metal', 1); L.set(x, y + 1, 'metal', 3); } else { L.set(x, y, 'metal', 1); L.set(x + 1, y, 'metal', 3); }
}
/** The nub hand at an arm's end: below it when the arm hangs, above when raised. */
function nubAt(L, x, y, up) { const y0 = up ? y - 2 : y; for (let i = 0; i < 3; i++) L.set(x, y0 + i, 'dark', i === 0 ? 2 : i === 2 ? 4 : 3); }

// ---- body, S and N -----------------------------------------------------------
function body(L, g, front, pose, ctx) {
  const cx = g.cx + (pose.bodyDx ?? 0);
  L.rect(cx - 2, g.neckY0, cx + 1, g.neckY1, 'dark', 3);
  const tx0 = cx - g.torsoW / 2, tx1 = cx + g.torsoW / 2 - 1;
  box(L, tx0, g.torY0, tx1, g.torY1, g.torsoTop, 'metal', 0, 2);
  if (front) {
    const ly = g.torY0 + g.torsoTop + 2;
    L.rect(cx - 3, ly - 1, cx + 2, ly + 1, 'dark', 4);
    for (let i = 0; i < 4; i++) {
      const c = i < 3 ? (i === 0 ? TEAL[0] : TEAL[1]) : '#4d5361';
      if (ctx.mode === 'approved') L.setFx(cx - 2 + i, ly, c); else { L.setFx(cx - 2 + i, ly, KEY); ctx.em.push([cx - 2 + i, ly, KEY]); }
    }
  } else {
    const by0 = g.torY0 + g.torsoTop + 1, by1 = g.torY1 - 1;
    box(L, cx - 3, by0, cx + 2, by1, 1, 'dark', 0, 1);
    glow(L, ctx, cx + 1, by0 + 2, PINK[1], OFF.led);
  }
  ctx.torso = { x0: tx0, y0: g.torY0, x1: tx1, y1: g.torY1 };
  ctx.hands = {};
  if (!pose.armsFront) frontArms(L, g, pose, ctx, cx);
  const lw = 3, gap = 2;
  const l0 = g.cx - gap / 2 - lw, r0 = g.cx + gap / 2;
  for (const [x, lift] of [[l0, pose.liftA ?? 0], [r0, pose.liftB ?? 0]]) {
    L.rect(x, g.legY0, x + lw - 1, g.legY1 - lift, 'metal', (xx) => (xx === x ? 1 : xx === x + lw - 1 ? 3 : 2));
    L.rect(x, g.legY0, x + lw - 1, g.legY0, 'dark', 3);
    if (front) box(L, x - 2, g.footY0 - lift, x + lw + 1, g.footY1 - lift, g.foot - 1, 'dark', 0, 1);
    else box(L, x - 1, g.footY0 - lift, x + lw, g.footY1 - lift, g.foot - 2, 'dark', 0, 1);
  }
}

function frontArms(L, g, pose, ctx, cx) {
  if (pose.hideArms) return;
  const tx0 = cx - g.torsoW / 2, tx1 = cx + g.torsoW / 2 - 1; const sy = g.torY0 + 1;
  for (const d of [-1, 1]) {
    const sx = d < 0 ? tx0 - 2 : tx1 + 1;
    ball(L, sx, sy);
    const a0 = d < 0 ? sx - 2 : sx + 1, a1 = a0 + 1;
    const up = (d < 0 ? pose.handA : pose.handB) ?? 0;
    const hy = g.torY1 - 1 + g.armDrop - up;
    const P = d < 0 ? pose.armA : pose.armB; const outer = d < 0 ? a0 : a1;
    if (!P) {
      L.rect(a0, sy + 2, a1, hy - 1, 'metal', (x) => (x === a0 ? 1 : 3));
      hand(L, d < 0 ? a0 - 1 : a0, hy, g.hand);
      ctx.hands[d < 0 ? 'A' : 'B'] = { x: outer, y: hy + 1, up: false };
    } else {
      const ex = a0 + d * (P.dx ?? 0), ey = hy - 1 - (P.dy ?? 0); const up = ey < sy + 2;
      armLine(L, a0, up ? sy : sy + 2, ex, ey);
      const hx = d < 0 ? ex : ex + 1; nubAt(L, hx, up ? ey - 1 : ey + 1, up);
      ctx.hands[d < 0 ? 'A' : 'B'] = { x: hx, y: up ? ey - 2 : ey + 2, up };
    }
  }
}
/** Shift the head (and what's drawn on it) sideways by drawing it on a shifted copy of g. */
const headG = (g, pose) => ({ ...g, cx: g.cx + (pose.bodyDx ?? 0) + (pose.headDx ?? 0) });
function dots(L, g, n, x0) { for (let i = 0; i < n; i++) L.rect(x0 + i * 3, g.headY0 - 3 - i, x0 + i * 3 + 1, g.headY0 - 2 - i, 'metal', 1); }

function south(p, face, pose, ctx) {
  const L = mk(); const g = layout(p, pose);
  body(L, g, true, pose, ctx);
  const h = headG(g, pose);
  turnedHead(L, g, pose, ctx, 'S', face, h.cx);
  if (pose.armsFront) frontArms(L, g, pose, ctx, g.cx + (pose.bodyDx ?? 0));
  if (pose.dots) dots(L, g, pose.dots, h.cx + 6);
  return L;
}
function north(p, pose, ctx, face = 'idle') {
  const L = mk(); const g = layout(p, pose);
  body(L, g, false, pose, ctx);
  const h = headG(g, pose);
  turnedHead(L, g, pose, ctx, 'N', face, h.cx);
  if (pose.armsFront) frontArms(L, g, pose, ctx, g.cx + (pose.bodyDx ?? 0));
  if (pose.dots) dots(L, g, pose.dots, h.cx - 10);
  return L;
}

function sideArm(L, g, pose, ctx, dir, F, span) {
  if (pose.hideArms) return;
  const back = g.sideArm ? 1 : 0; const sw = pose.armDx ?? 0;
  const [sx0, sx1] = span(F(-3 - back), F(-2 - back));
  const [ax0, ax1] = span(F(-3 - back + sw), F(-2 - back + sw)); const sy = g.torY0 + 1;
  const [hx0h, hx1h] = span(F(-4 - back + sw), F(-2 - back + sw));
  const hy = g.torY1 - 1 + g.armDrop;
  for (let y = sy; y <= hy - 1; y++) { L.set(Math.min(sx0, ax0) - 1, y, null); L.set(Math.max(sx1, ax1) + 1, y, null); }
  for (let y = hy; y <= hy + 2; y++) { L.set(hx0h - 1, y, null); L.set(hx1h + 1, y, null); }
  ball(L, sx0, sy);
  // upper arm under the shoulder, forearm shifted by the swing from mid-arm down
  const mid = sy + 2 + Math.floor((hy - sy - 2) / 2);
  L.rect(sx0, sy + 2, sx1, mid - 1, 'metal', (x) => (x === (dir > 0 ? sx0 : sx1) ? 1 : 3));
  L.rect(ax0, mid, ax1, hy - 1, 'metal', (x) => (x === (dir > 0 ? ax0 : ax1) ? 1 : 3));
  if (!pose.arm) {
    hand(L, hx0h, hy, g.hand);
    ctx.hands.A = { x: hx0h + 1, y: hy + 1, up: false };
    return;
  }
  // posed: redraw from the shoulder to the hand target
  for (let y = sy + 2; y <= hy + 2; y++) for (let x = Math.min(sx0, ax0, hx0h) - 1; x <= Math.max(sx1, ax1, hx1h) + 1; x++) L.set(x, y, null);
  // put back the torso the clearing took (redraw the torso box columns under the arm)
  ctx.repaintTorso?.();
  ball(L, sx0, sy);
  const ex = Math.min(...span(F(-3 - back + pose.arm.dx), F(-2 - back + pose.arm.dx))), ey = hy - 1 - pose.arm.dy; const up = ey < sy + 2;
  armLine(L, sx0, up ? sy : sy + 2, ex, ey);
  const hx = dir > 0 ? ex + 1 : ex; nubAt(L, hx, up ? ey - 1 : ey + 1, up);
  ctx.hands.A = { x: hx, y: up ? ey - 2 : ey + 2, up };
}

/** The side head (E/W), centred on column hc. */
function sideHead(L, g, dir, face, ctx, hc) {
  const H2 = (dx) => Math.round(hc + dir * dx); const span = (p, q) => [Math.min(p, q), Math.max(p, q)];
  const [hx0, hx1] = span(H2(-g.headD / 2), H2(g.headD / 2 - 1));
  box(L, hx0, g.headY0, hx1, g.headY1, g.headTop, 'metal', 0, 3);
  const fx1 = dir > 0 ? hx1 : hx0, fx0 = fx1 - dir * 3;
  const [scx0, scx1] = span(fx0, fx1);
  const sy0 = g.headY0 + g.headTop + Math.floor((g.headF - g.screenH) / 2), sy1 = sy0 + g.screenH - 1;
  L.rect(scx0, sy0 - 1, scx1, sy1 + 1, 'dark', 4); round(L, scx0, sy0 - 1, scx1, sy1 + 1, 1);
  L.rect(scx0, sy0, scx1, sy1, 'screen', (x, y) => (y === sy0 ? 1 : 2));
  for (const [x, y] of [[scx0, sy0 - 1], [scx1, sy0 - 1], [scx0, sy1 + 1], [scx1, sy1 + 1]]) if (!L.get(x, y)) L.set(x, y, 'metal', 2);
  ctx.screen = { x: scx0, y: sy0, w: scx1 - scx0 + 1, h: g.screenH, kind: dir > 0 ? 'E' : 'W' };
  if (ctx.mode === 'approved' || ctx.drawFace) { const band = Math.min(8, g.screenH); sideFace(L, face, dir, fx1, sy0 + Math.floor((g.screenH - band) / 2) - 2, band); }
  antenna(L, ctx, H2(-3), g.headY0 + 4);
  const py = g.headY0 + g.headTop + Math.floor(g.headF / 2) - 2;
  L.rect(hc - 1, py, hc, py + 3, g.ear ?? 'dark', (x, y) => (y === py ? 1 : y === py + 3 ? 3 : 2)); round(L, hc - 1, py, hc, py + 3, 1);
}
/** The head the frame shows: its own facing, or pose.headTurn (S/N/E/W) — the head turned on the body. */
function turnedHead(L, g, pose, ctx, own, face, hc) {
  const t = pose.headTurn ?? own; const hg = { ...g, cx: hc };
  if (t === 'S') { head(L, hg, face, ctx); antenna(L, ctx, hc + 5, g.headY0 + 4); if (ctx.screen) ctx.screen.kind = 'S'; }
  else if (t === 'N') { head(L, hg, null, ctx); antenna(L, ctx, hc - 6, g.headY0 + 4); ctx.screen = null; }
  else sideHead(L, g, t === 'E' ? 1 : -1, face, ctx, hc);
}

// ---- E/W; dir = +1 east, -1 west ---------------------------------------------
function sideView(p, dir, face, pose, ctx) {
  const L = mk(); const g = layout(p, pose); const cx = g.cx + dir * (pose.lean ?? 0);
  const F = (dx) => Math.round(cx + dir * dx); const G = (dx) => Math.round(g.cx + dir * dx); // F: upper body, G: legs
  const span = (a, b) => [Math.min(a, b), Math.max(a, b)];
  const dA = pose.dxA ?? 0, dB = pose.dxB ?? 0, lA = pose.liftA ?? 0, lB = pose.liftB ?? 0;
  L.rect(cx - 2, g.neckY0, cx + 1, g.neckY1, 'dark', 3);
  const [tx0, tx1] = span(F(-g.torsoD / 2), F(g.torsoD / 2 - 1));
  const [fl0, fl1] = span(G(-4 + dB), G(-2 + dB)); const [nl0, nl1] = span(G(-1 + dA), G(1 + dA));
  const [ff0, ff1] = span(G(-5 + dB), G(0 + dB)); const [nf0, nf1] = span(G(-2 + dA), G(3 + dA));
  // far leg and foot (B), shaded
  L.rect(fl0, g.legY0, fl1, g.legY1 - lB, 'metal', 3); L.rect(fl0, g.legY0, fl1, g.legY0, 'dark', 3);
  box(L, ff0, g.footY0 - lB, ff1, g.footY1 - lB, g.foot - 1, 'dark', 1, 1);
  const torsoBox = () => {
    box(L, tx0, g.torY0, tx1, g.torY1, g.torsoTop, 'metal', 0, 2);
    const ly = g.torY0 + g.torsoTop + 2;
    if (ctx.mode === 'approved') L.setFx(dir > 0 ? tx1 : tx0, ly, TEAL[1]); else { L.setFx(dir > 0 ? tx1 : tx0, ly, KEY); if (!ctx.em.some((e) => e[0] === (dir > 0 ? tx1 : tx0) && e[1] === ly)) ctx.em.push([dir > 0 ? tx1 : tx0, ly, KEY]); }
  };
  torsoBox(); ctx.repaintTorso = torsoBox;
  const bx = dir > 0 ? tx0 - 1 : tx1 + 1; L.rect(bx, g.torY0 + 3, bx, g.torY1 - 1, 'metal', 4);
  // near leg and foot (A)
  ring(L, nl0, g.legY0, nl1, g.legY1 - lA);
  L.rect(nl0, g.legY0, nl1, g.legY1 - lA, 'metal', (x) => (x === (dir > 0 ? nl0 : nl1) ? 1 : x === (dir > 0 ? nl1 : nl0) ? 3 : 2)); L.rect(nl0, g.legY0, nl1, g.legY0, 'dark', 3);
  ring(L, nf0, g.footY0 - lA, nf1, g.footY1 - lA); box(L, nf0, g.footY0 - lA, nf1, g.footY1 - lA, g.foot - 1, 'dark', 0, 1);
  ctx.torso = { x0: tx0, y0: g.torY0, x1: tx1, y1: g.torY1 }; ctx.hands = {};
  const nearArm = () => sideArm(L, g, pose, ctx, dir, F, span);
  if (!pose.armsFront) nearArm();
  const hc = cx + (pose.headDx ?? 0) * dir;
  turnedHead(L, g, pose, ctx, dir > 0 ? 'E' : 'W', face, hc);
  const H2 = (dx) => Math.round(hc + dir * dx);
  if (pose.armsFront) nearArm();
  if (pose.dots) dots(L, g, pose.dots, H2(2));
  return L;
}

/**
 * Draw one frame. Returns { rows, em, screen }:
 *   rows    the rendered sprite ('#rrggbb' | null), 32×48
 *   em      the lit pixels for the _emissive layer, [[x, y, '#rrggbb']…] (empty in 'approved')
 *   screen  where the face goes: { x, y, w, h } (null for N)
 */
export function draw(dir, { face = 'idle', pose = {}, mode = 'clip', fix = {}, drawFace = false, model = O } = {}) {
  const ctx = { mode, fix, em: [], screen: null, drawFace, antDx: pose.antennaDx ?? 0, antLift: pose.antennaLift ?? 0 };
  const L = dir === 'S' ? south(model, face, pose, ctx) : dir === 'N' ? north(model, pose, ctx, face) : sideView(model, dir === 'E' ? 1 : -1, face, pose, ctx);
  const gl = layout(model, pose);
  let rows = L.render(), em = ctx.em, screen = ctx.screen, hands = ctx.hands, torso = ctx.torso; let headTop = gl.headY0;
  const hop = pose.hop ?? 0;
  if (hop) {
    rows = [...rows.slice(hop), ...Array.from({ length: hop }, () => Array(W).fill(null))];
    em = em.map(([x, y, c]) => [x, y - hop, c]);
    if (screen) screen = { ...screen, y: screen.y - hop };
    hands = Object.fromEntries(Object.entries(hands ?? {}).map(([k, v]) => [k, { ...v, y: v.y - hop }]));
    torso = torso && { ...torso, y0: torso.y0 - hop, y1: torso.y1 - hop }; headTop -= hop;
  }
  return { rows, em, screen, hands, torso, headTop, cx: W / 2 + (pose.bodyDx ?? 0) + (pose.headDx ?? 0) };
}
