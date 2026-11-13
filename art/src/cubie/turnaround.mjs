// Cubie turnaround (S, W, E, N) + seven faces — the approved reference, 2026-11-13.
// Model "O" is the one in use; the other PROPS are the history of the design pass
// and are skipped by the save loop. Imports expect pix.mjs/png.mjs ported into
// .claude/skills/cubie-pixel-art/scripts/ (see docs/sessions/art-01-cubie.md).
//   node art/src/cubie/turnaround.mjs <out-dir>
// Cubie pass 6 — model F's features at the office characters' angle (measured
// from char_0: head 54% of the figure, crown ~2/3 of the head with the eyes low,
// body ~25%, legs+feet ~20%, hands at the hip). Earlier note: model F, with the head split the way the office characters are
// built: the top of the head takes just over half of it (their hair; his helmet
// dome) and the face sits in the lower half. Body, limbs and face elements are F's. Same library, same view, same materials
// as cubie.mjs; what changes is the shape language: head > half the figure,
// rounded corners everywhere, big low wide eyes, tiny body, thin limbs with
// ball joints and mitten hands, big round feet.
//   node cubie3.mjs <out-dir>
import fs from 'node:fs';
import { Layer, paint, sheet } from '../../../.claude/skills/cubie-pixel-art/scripts/pix.mjs';
import { writePng } from '../../../.claude/skills/cubie-pixel-art/scripts/png.mjs';

const out = process.argv[2] ?? './out';
fs.mkdirSync(out, { recursive: true });

const RAMPS = {
  metal: ['#f7f9fb', '#e6eaf0', '#c7ced9', '#9aa3b1', '#6b7382', '#3f4552'],
  dark:  ['#9aa3b1', '#6b7382', '#4d5361', '#3f4552', '#2e323c', '#1f2229'],
  screen: ['#1b4a50', '#12343a', '#0b1f23', '#071417'],
};
const OUT = { metal: '#3f4552', dark: '#1f2229', screen: '#1f2229' };
const TEAL = ['#7df2ea', '#27d4c9', '#1c9c94'];
const PINK = ['#ffb0dc', '#f05fb3', '#c43a8a'];
const W = 32, H = 48;
const mk = () => new Layer(W, H, RAMPS, OUT);

// a box with `top` rows of top face, then its near face; corners rounded by r
function box(L, x0, y0, x1, y1, top, m = 'metal', shade = 0, r = 0) {
  const t = (a) => Math.min(a + shade, RAMPS[m].length - 1);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let tone;
    if (y < y0 + top) {
      if (top >= 7) { // a dome: highlight cluster top-left, darker toward the back-right, a soft lip at the front
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
// clear the corner pixels so the outline wraps a rounded shape
function round(L, x0, y0, x1, y1, r) {
  const cut = { 1: [[0, 0]], 2: [[0, 0], [1, 0], [0, 1]], 3: [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2], [1, 1]] }[r] ?? [];
  for (const [dx, dy] of cut) { L.set(x0 + dx, y0 + dy, null); L.set(x1 - dx, y0 + dy, null); L.set(x0 + dx, y1 - dy, null); L.set(x1 - dx, y1 - dy, null); }
}
function ring(L, x0, y0, x1, y1) { for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (x < x0 || x > x1 || y < y0 || y > y1) L.set(x, y, null); }
const fxRect = (L, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) L.setFx(x, y, c); };
// a ball joint: 2×2 dark with a lit top-left pixel
const ball = (L, x, y) => { L.rect(x, y, x + 1, y + 1, 'dark', (xx, yy) => (xx === x && yy === y ? 1 : xx === x + 1 && yy === y + 1 ? 4 : 3)); };
// a mitten hand: 3×3 dark, rounded
const hand = (L, x, y) => { L.rect(x, y, x + 2, y + 2, 'dark', (xx, yy) => (yy === y ? 2 : yy === y + 2 || xx === x + 2 ? 4 : 3)); round(L, x, y, x + 2, y + 2, 1); };

// ---- proportions ---------------------------------------------------------
const PROPS = {
  D: { headW: 24, headD: 20, headTop: 6, headF: 16, neck: 1, torsoW: 10, torsoD: 10, torsoTop: 2, torsoF: 7, legH: 5, foot: 3, screenW: 18, screenH: 13 }, // the cute one
  D60: { headW: 24, headD: 20, headTop: 10, headF: 15, neck: 1, torsoW: 10, torsoD: 10, torsoTop: 4, torsoF: 5, legH: 3, foot: 4, screenW: 18, screenH: 13 }, // D seen from the game's 60° camera
  O: { headW: 24, headD: 16, headTop: 13, headF: 10, neck: 0, torsoW: 10, torsoD: 8, torsoTop: 3, torsoF: 8, legH: 6, foot: 3, armDrop: 1, screenW: 18, screenH: 8, domeR: 4 }, // F at the office angle
  G: { headW: 24, headD: 14, headTop: 9, headF: 12, neck: 1, torsoW: 10, torsoD: 8, torsoTop: 3, torsoF: 6, legH: 8, foot: 3, armDrop: 3, screenW: 18, screenH: 10, domeR: 4 }, // F, office head split
  F: { headW: 24, headD: 14, headTop: 6, headF: 15, neck: 1, torsoW: 10, torsoD: 8, torsoTop: 3, torsoF: 6, legH: 8, foot: 3, armDrop: 3, screenW: 18, screenH: 13 }, // D60 with a smaller forehead, a slim side, long limbs
  E: { headW: 22, headD: 18, headTop: 6, headF: 15, neck: 1, torsoW: 12, torsoD: 10, torsoTop: 2, torsoF: 8, legH: 6, foot: 3, screenW: 16, screenH: 12 }, // a touch more robot
};
function layout(p) {
  const footY1 = H - 1, footY0 = footY1 - p.foot + 1;
  const legY1 = footY0 - 1, legY0 = legY1 - p.legH + 1;
  const torY1 = legY0 - 1, torY0 = torY1 - (p.torsoTop + p.torsoF) + 1;
  const neckY1 = torY0 - 1, neckY0 = neckY1 - p.neck + 1;
  const headY1 = neckY0 - 1, headY0 = headY1 - (p.headTop + p.headF) + 1;
  return { armDrop: 0, ...p, footY0, footY1, legY0, legY1, torY0, torY1, neckY0, neckY1, headY0, headY1, cx: W / 2 };
}

// ---- faces: big, low, wide-set eyes; origin = top-left of the screen -----
// eye: w×h rounded block of teal with a 2-px glint top-left
function eye(L, x, y, w = 4, h = 5, glint = true) {
  fxRect(L, x, y, x + w - 1, y + h - 1, TEAL[1]);
  for (const [dx, dy] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) L.setFx(x + dx, y + dy, null);
  if (glint) { L.setFx(x + 1, y + 1, TEAL[0]); if (w > 3) L.setFx(x + 2, y + 1, TEAL[0]); if (h > 3) L.setFx(x + 1, y + 2, TEAL[0]); }
}
// a happy eye: an arch (closed-smiling)
function arch(L, x, y, w = 4) { fxRect(L, x + 1, y, x + w - 2, y, TEAL[1]); L.setFx(x, y + 1, TEAL[1]); L.setFx(x + w - 1, y + 1, TEAL[1]); L.setFx(x + 1, y + 1, TEAL[0]); }
const EY = (sh) => (sh <= 10 ? 2 : 3);
const FACES = {
  idle:      (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2), eh = Math.min(5, sh - 3); eye(L, x + ex, y + 1, 4, eh); eye(L, x + sw - ex - 4, y + 1, 4, eh); fxRect(L, x + sw / 2 - 1, y + sh - 1, x + sw / 2, y + sh - 1, TEAL[1]); },
  happy:     (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); arch(L, x + ex, y + 2, 4); arch(L, x + sw - ex - 4, y + 2, 4); const my = y + sh - 2; L.setFx(x + sw / 2 - 3, my, TEAL[1]); L.setFx(x + sw / 2 + 2, my, TEAL[1]); fxRect(L, x + sw / 2 - 2, my + 1, x + sw / 2 + 1, my + 1, TEAL[1]); },
  thinking:  (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); eye(L, x + ex, y + 2, 4, sh - 4); eye(L, x + sw - ex - 4, y + 1, 4, sh - 3); fxRect(L, x + sw / 2 - 2, y + sh - 1, x + sw / 2, y + sh - 1, TEAL[2]); L.setFx(x + sw - 2, y + 1, TEAL[2]); L.setFx(x + sw - 1, y, TEAL[2]); },
  sad:       (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); eye(L, x + ex, y + 2, 4, sh - 4); eye(L, x + sw - ex - 4, y + 2, 4, sh - 4); fxRect(L, x + ex + 1, y + 2, x + ex + 3, y + 2, '#0b1f23'); fxRect(L, x + sw - ex - 4, y + 2, x + sw - ex - 2, y + 2, '#0b1f23'); const my = y + sh - 2; fxRect(L, x + sw / 2 - 1, my, x + sw / 2, my, TEAL[2]); L.setFx(x + sw / 2 - 2, my + 1, TEAL[2]); L.setFx(x + sw / 2 + 1, my + 1, TEAL[2]); },
  surprised: (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2) - 1; eye(L, x + ex, y, 5, sh - 2); eye(L, x + sw - ex - 5, y, 5, sh - 2); fxRect(L, x + sw / 2 - 1, y + sh - 2, x + sw / 2, y + sh - 1, TEAL[1]); },
  blink:     (L, x, y, sw, sh) => { const ex = Math.floor((sw - 12) / 2); fxRect(L, x + ex, y + 3, x + ex + 3, y + 3, TEAL[1]); fxRect(L, x + sw - ex - 4, y + 3, x + sw - ex - 1, y + 3, TEAL[1]); fxRect(L, x + sw / 2 - 1, y + sh - 1, x + sw / 2, y + sh - 1, TEAL[1]); },
  off:       () => {},
};

// the head, shared by S and N (N passes face = null)
function head(L, g, face) {
  const cx = g.cx; const hx0 = cx - g.headW / 2, hx1 = cx + g.headW / 2 - 1;
  box(L, hx0, g.headY0, hx1, g.headY1, g.headTop, 'metal', 0, 3);
  if (g.domeR) round(L, hx0, g.headY0, hx1, g.headY0 + 2 * g.domeR, g.domeR); // rounder shoulders on the dome; bottom corners stay 3
  // ear pods: small rounded dark blocks
  const py = g.headY0 + g.headTop + Math.floor(g.headF / 2) - 2;
  for (const x of [hx0 - 2, hx1 + 1]) { L.rect(x, py, x + 1, py + 3, 'dark', (xx, yy) => (yy === py ? 1 : yy === py + 3 ? 3 : 2)); round(L, x, py, x + 1, py + 3, 1); }
  if (face) {
    const sx0 = cx - g.screenW / 2, sx1 = sx0 + g.screenW - 1;
    const sy0 = g.headY0 + g.headTop + Math.floor((g.headF - g.screenH) / 2), sy1 = sy0 + g.screenH - 1;
    L.rect(sx0 - 1, sy0 - 1, sx1 + 1, sy1 + 1, 'dark', (x, y) => (y === sy0 - 1 ? 3 : 4)); round(L, sx0 - 1, sy0 - 1, sx1 + 1, sy1 + 1, 2);
    L.rect(sx0, sy0, sx1, sy1, 'screen', (x, y) => (y === sy0 && x < sx1 - 1 ? 1 : x === sx0 ? 1 : 2)); round(L, sx0, sy0, sx1, sy1, 1);
    // the rounded corners of the screen must stay bezel, not empty
    for (const [x, y] of [[sx0, sy0], [sx1, sy0], [sx0, sy1], [sx1, sy1]]) L.set(x, y, 'dark', 4);
    FACES[face](L, sx0, sy0, g.screenW, g.screenH);
  } else {
    // the back of the head: a vent and a hatch seam
    const vy = g.headY0 + g.headTop + 4;
    for (let i = 0; i < 3; i++) L.rect(cx - 3, vy + i * 2, cx + 2, vy + i * 2, 'dark', 3);
    L.rect(hx0 + 3, g.headY1 - 3, hx1 - 3, g.headY1 - 3, 'metal', 3);
  }
}
function antenna(L, x, y, lift = 0) { L.rect(x, y - 2 - lift, x, y - 1, 'dark', 2); fxRect(L, x - 1, y - 4 - lift, x, y - 3 - lift, PINK[1]); L.setFx(x - 1, y - 4 - lift, PINK[0]); }

// the body below the head, for S (front) and N (back)
function body(L, g, front) {
  const cx = g.cx;
  // neck
  L.rect(cx - 2, g.neckY0, cx + 1, g.neckY1, 'dark', 3);
  // torso, rounded
  const tx0 = cx - g.torsoW / 2, tx1 = cx + g.torsoW / 2 - 1;
  box(L, tx0, g.torY0, tx1, g.torY1, g.torsoTop, 'metal', 0, 2);
  if (front) {
    const ly = g.torY0 + g.torsoTop + 2;
    L.rect(cx - 3, ly - 1, cx + 2, ly + 1, 'dark', 4);
    for (let i = 0; i < 4; i++) L.setFx(cx - 2 + i, ly, i < 3 ? (i === 0 ? TEAL[0] : TEAL[1]) : '#4d5361');
  } else {
    const by0 = g.torY0 + g.torsoTop + 1, by1 = g.torY1 - 1;
    box(L, cx - 3, by0, cx + 2, by1, 1, 'dark', 0, 1);
    L.setFx(cx + 1, by0 + 2, PINK[1]);
  }
  // arms: ball shoulder, thin arm angled a little outward, mitten hand
  const sy = g.torY0 + 1;
  for (const d of [-1, 1]) {
    const sx = d < 0 ? tx0 - 2 : tx1 + 1;
    ball(L, sx, sy);
    const a0 = d < 0 ? sx - 2 : sx + 1, a1 = a0 + 1; // a thin 2-px arm just outside the shoulder
    const hy = g.torY1 - 1 + g.armDrop; // where the hand starts
    L.rect(a0, sy + 2, a1, hy - 1, 'metal', (x) => (x === a0 ? 1 : 3));
    hand(L, d < 0 ? a0 - 1 : a0, hy);
  }
  // legs: short, ball hips, big round feet
  const lw = 3, gap = 2;
  const l0 = cx - gap / 2 - lw, r0 = cx + gap / 2;
  for (const x of [l0, r0]) {
    L.rect(x, g.legY0, x + lw - 1, g.legY1, 'metal', (xx) => (xx === x ? 1 : xx === x + lw - 1 ? 3 : 2));
    L.rect(x, g.legY0, x + lw - 1, g.legY0, 'dark', 3);
    if (front) { box(L, x - 2, g.footY0, x + lw + 1, g.footY1, g.foot - 1, 'dark', 0, 1); }
    else { box(L, x - 1, g.footY0, x + lw, g.footY1, g.foot - 2, 'dark', 0, 1); }
  }
}

function south(p, face = 'idle') {
  const L = mk(); const g = layout(p);
  body(L, g, true);
  head(L, g, face); // drawn last: the big head sits over the shoulders
  antenna(L, g.cx + 5, g.headY0 + 4); // stands on the crown, seen from above
  return L;
}
function north(p) {
  const L = mk(); const g = layout(p);
  body(L, g, false);
  head(L, g, null);
  antenna(L, g.cx - 6, g.headY0 + 4);
  return L;
}

// E/W from the same measurements; dir = +1 east, -1 west
function sideView(p, dir) {
  const L = mk(); const g = layout(p); const cx = g.cx;
  const F = (dx) => Math.round(cx + dir * dx);
  const span = (a, b) => [Math.min(a, b), Math.max(a, b)];
  // --- body first, head over it. Order: far leg+foot, torso, near leg+foot, near arm.
  L.rect(cx - 2, g.neckY0, cx + 1, g.neckY1, 'dark', 3);
  const [tx0, tx1] = span(F(-g.torsoD / 2), F(g.torsoD / 2 - 1));
  const [fl0, fl1] = span(F(-4), F(-2)); const [nl0, nl1] = span(F(-1), F(1));
  const [ff0, ff1] = span(F(-5), F(0)); const [nf0, nf1] = span(F(-2), F(3));
  // far leg and foot, a step behind: shaded
  L.rect(fl0, g.legY0, fl1, g.legY1, 'metal', 3); L.rect(fl0, g.legY0, fl1, g.legY0, 'dark', 3);
  box(L, ff0, g.footY0, ff1, g.footY1, g.foot - 1, 'dark', 1, 1);
  // torso
  box(L, tx0, g.torY0, tx1, g.torY1, g.torsoTop, 'metal', 0, 2);
  const ly = g.torY0 + g.torsoTop + 2; L.setFx(dir > 0 ? tx1 : tx0, ly, TEAL[1]);
  const bx = dir > 0 ? tx0 - 1 : tx1 + 1; L.rect(bx, g.torY0 + 3, bx, g.torY1 - 1, 'metal', 4); // far arm sliver
  // near leg and foot
  ring(L, nl0, g.legY0, nl1, g.legY1);
  L.rect(nl0, g.legY0, nl1, g.legY1, 'metal', (x) => (x === (dir > 0 ? nl0 : nl1) ? 1 : x === (dir > 0 ? nl1 : nl0) ? 3 : 2)); L.rect(nl0, g.legY0, nl1, g.legY0, 'dark', 3);
  ring(L, nf0, g.footY0, nf1, g.footY1); box(L, nf0, g.footY0, nf1, g.footY1, g.foot - 1, 'dark', 0, 1);
  // near arm: ball shoulder, thin arm, mitten — hangs at the middle of the torso side
  const [ax0, ax1] = span(F(-3), F(-2)); const sy = g.torY0 + 1;
  const [hx0h, hx1h] = span(F(-4), F(-2));
  // separate the arm from the torso by a cleared column each side (not above: the shoulder top stays whole)
  const hy = g.torY1 - 1 + g.armDrop;
  for (let y = sy; y <= hy - 1; y++) { L.set(ax0 - 1, y, null); L.set(ax1 + 1, y, null); }
  for (let y = hy; y <= hy + 2; y++) { L.set(hx0h - 1, y, null); L.set(hx1h + 1, y, null); }
  ball(L, ax0, sy);
  L.rect(ax0, sy + 2, ax1, hy - 1, 'metal', (x) => (x === (dir > 0 ? ax0 : ax1) ? 1 : 3));
  hand(L, hx0h, hy);
  // --- head: depth wide, screen wrapping the front edge
  const [hx0, hx1] = span(F(-g.headD / 2), F(g.headD / 2 - 1)); // headD 16 for O
  box(L, hx0, g.headY0, hx1, g.headY1, g.headTop, 'metal', 0, 3);
  const fx1 = dir > 0 ? hx1 : hx0, fx0 = fx1 - dir * 3;
  const [sx0, sx1] = span(fx0, fx1);
  const sy0 = g.headY0 + g.headTop + Math.floor((g.headF - g.screenH) / 2), sy1 = sy0 + g.screenH - 1;
  L.rect(sx0, sy0 - 1, sx1, sy1 + 1, 'dark', 4); round(L, sx0, sy0 - 1, sx1, sy1 + 1, 1);
  L.rect(sx0, sy0, sx1, sy1, 'screen', (x, y) => (y === sy0 ? 1 : 2));
  for (const [x, y] of [[sx0, sy0 - 1], [sx1, sy0 - 1], [sx0, sy1 + 1], [sx1, sy1 + 1]]) if (!L.get(x, y)) L.set(x, y, 'metal', 2);
  // one big eye on the wrap, 2 wide × 5 tall, with its glint
  const ex = fx1 - dir * 2;
  const [ex0, ex1] = span(ex, ex + dir);
  fxRect(L, ex0, sy0 + 3, ex1, sy0 + 7, TEAL[1]); L.setFx(dir > 0 ? ex0 : ex1, sy0 + 4, TEAL[0]);
  L.setFx(dir > 0 ? ex1 : ex0, sy0 + g.screenH - 3, TEAL[2]);
  antenna(L, F(-3), g.headY0 + 4);
  // the near ear pod
  const py = g.headY0 + g.headTop + Math.floor(g.headF / 2) - 2;
  L.rect(cx - 1, py, cx, py + 3, 'dark', (x, y) => (y === py ? 1 : y === py + 3 ? 3 : 2)); round(L, cx - 1, py, cx, py + 3, 1);
  return L;
}

const save = (name, L) => { const img = sheet(L.w, L.h); paint(img, L.render()); writePng(`${out}/${name}.png`, img); };
for (const [k, p] of Object.entries(PROPS)) { if (k !== 'O') continue;
  save(`cubie_${k}_S`, south(p)); save(`cubie_${k}_W`, sideView(p, -1)); save(`cubie_${k}_E`, sideView(p, +1)); save(`cubie_${k}_N`, north(p));
}
for (const f of Object.keys(FACES)) save(`face_${f}`, south(PROPS.O, f));
console.log('wrote', fs.readdirSync(out).length, 'files to', out);
