// Cubie's clips as data: per clip, the directions drawn, timing, and one pose per
// frame (pose fields: model.mjs header). `face` forces a face on a frame (null =
// whatever the renderer's mood/event face is). Timing and frame counts follow
// docs/design/06-animations.md §2; contact frames are where the SFX fire.
import { tool } from './tools.mjs';

const ALL = ['S', 'W', 'E', 'N'];

// walk: contact f1 (foot A lands) and f5 (foot B); dip after each contact; the
// swinging foot lifts 1-2-1; arms swing against the legs. At rest the near foot
// stands 3 px ahead, so `sep` (near minus far, per frame) is split to keep both
// feet centred under the body.
export const SEP = [4, 6, 4, 0, -4, -6, -4, 0];
export const feet = (sep, f) => { const dxA = Math.ceil((sep[f] - 3) / 2); return { dxA, dxB: dxA - (sep[f] - 3) }; };
export const walkPose = (f, o = {}) => ({
  bob: [0, 0, 1, 0, 0, 0, 1, 0][f],
  ...feet(o.sep ?? SEP, f),
  liftA: [1, 0, 0, 0, 0, 0, 1, 2][f], liftB: [0, 0, 1, 2, 1, 0, 0, 0][f],
  handA: [0, 0, 0, 0, 1, 1, 1, 0][f], handB: [1, 1, 1, 0, 0, 0, 0, 0][f],
  armDx: [-1, -1, -1, 0, 1, 1, 1, 0][f],
});
const both = (dx, dy) => ({ armA: { dx, dy }, armB: { dx, dy } });
const lap = (dy) => both(0, dy);
// a lightning bolt at one of three stages of its rise (3 = gone): small, big, small
const BOLT_BIG = ['..#', '.#.', '###', '.#.', '#..'], BOLT_SMALL = ['.#', '##', '#.'];
const bolt = (stage, fr) => {
  if (stage > 2) return [];
  const [shape, dx, dy] = [[BOLT_SMALL, 7, -3], [BOLT_BIG, 9, -8], [BOLT_SMALL, 12, -11]][stage];
  const out = [];
  shape.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') { const Y = fr.headTop + dy + y; if (Y >= 0) out.push([fr.cx + dx + x, Y, '#ffd37a']); } }));
  return out;
};
// ── overlay drawing ──
/** A soft rounded box (fabric/sack): outline, lit top-left, shaded bottom-right. */
const sack = (x0, y0, x1, y1, R = { hi: '#ad9170', mid: '#96785c', lo: '#7a5f49', line: '#3b2d26' }) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const corner = (x === x0 || x === x1) && (y === y0 || y === y1); if (corner) continue;
    const edge = x === x0 || x === x1 || y === y0 || y === y1;
    out.push([x, y, edge ? R.line : (y === y0 + 1 || x === x0 + 1) ? R.hi : (y >= y1 - 1 || x >= x1 - 1) ? R.lo : R.mid, false]);
  }
  return out;
};
/** The carried bundle on his back, per facing; `false` keeps it off the emissive layer. */
const bundle = (fr) => {
  const t = fr.torso; if (!t) return [];
  const strap = (px) => px.map((p) => p);
  if (fr.d === 'N') return strap([...sack(t.x0 - 2, t.y0 - 3, t.x1 + 2, t.y1 - 1), ...Array.from({ length: t.x1 - t.x0 + 3 }, (_, i) => [t.x0 - 1 + i, t.y0 + 3, '#4d5361', false])]);
  if (fr.d === 'S') return sack(t.x0 - 2, t.y0 - 3, t.x1 + 2, t.y1 - 1);
  const back = fr.d === 'E' ? t.x0 : t.x1;
  return fr.d === 'E' ? sack(back - 5, t.y0 - 3, back + 1, t.y1 - 1) : sack(back - 1, t.y0 - 3, back + 5, t.y1 - 1);
};
// the low-battery icon: light case, dark inside, a red sliver of charge; it all glows
const BATTERY = ['########.', '#rr.....##', '#rr.....##', '#rr.....##', '########.'];
const battery = (fr) => {
  const out = [];
  BATTERY.forEach((row, y) => [...row].forEach((ch, x) => { const Y = fr.headTop - 8 + y; if (ch !== ' ' && Y >= 0) out.push([fr.cx - 5 + x, Y, ch === '#' ? '#e6eaf0' : ch === 'r' ? '#d0414f' : '#2e323c']); }));
  return out;
};
// ── action clips from per-frame keys ──
// Each frame gives `side` (hand at [x, y] as if facing E; mirrored for W) and
// `front` (hands A/B at [x, y] seen from the S; mirrored for N), a tool angle
// `ang` (degrees, 90 = up; side angles as if facing E) and body extras. N frames
// hold the tool behind him; `behind` hides it behind his body in S too.
const mx = ([x, y]) => [31 - x, y];
const action = ({ dirs = ALL, fps, loop, contact, held, keys, face }) => {
  const posesFor = (d) => keys.map((k) => {
    const side = d === 'E' || d === 'W';
    const K = side ? k.side : k.front; const flip = d === 'W' || d === 'N';
    const at = side ? { A: flip ? mx(K.at) : K.at } : { A: flip ? mx(K.A) : K.A, ...(K.B ? { B: flip ? mx(K.B) : K.B } : {}) };
    return { at, ...(K.armsFront ? { armsFront: true } : {}), ...(k.body ?? {}), ...(K.body ?? {}) };
  });
  const angleOf = (fr) => { const k = keys[fr.f]; const side = fr.d === 'E' || fr.d === 'W'; const K = side ? k.side : k.front; return { ang: K.ang, behind: K.behind, over: K.over }; };
  return { dirs, fps, loop, contact, face, poses: posesFor,
    ...(held ? { overlays: Object.fromEntries([held].flat().map((h) => [`held.${h}`, (fr) => { const { ang, behind, over } = angleOf(fr); if (ang === undefined || ang === null) return []; return tool(fr, h, ang, { behind, over }); }])) } : {}) };
};
// the load he tips into the converter: a green bundle of cuttings between his hands
const load = (fr) => {
  const a = fr.hands?.A, b = fr.hands?.B; if (!a || !b) return [];
  const cx = (a.x + b.x) >> 1, y0 = Math.min(a.y, b.y) - (fr.f === 3 ? 6 : 4);
  return sack(cx - 3, y0, cx + 3, y0 + 4, { hi: '#86b36c', mid: '#67985a', lo: '#4a7a4b', line: '#263a33' });
};
// small props, drawn at the hands or above the head
const pix = (rows, x0, y0, pal) => { const out = []; rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) out.push([x0 + x, y0 + y, pal[ch][0], pal[ch][1] ?? false]); })); return out; };
const between = (fr) => { const a = fr.hands?.A, b = fr.hands?.B ?? a; return a ? [(a.x + b.x) >> 1, Math.min(a.y, b.y)] : null; };
// a berry cluster (eat): red, lit top-left, dark outline
const berry = (x, y) => pix(['.oo.', 'ohro', 'orro', '.oo.'], x - 2, y - 2, { o: ['#3b2d26'], h: ['#f05fb3'], r: ['#d0414f'] });
// an open notebook (write): pale pages, ruled lines, dark cover edge
const notebook = (x, y) => pix(['ppp.ppp', 'lll.lll', 'ppp.ppp', 'lll.lll', 'kkkkkkk'], x - 3, y - 3, { k: ['#5a4536'], p: ['#f5ecc9'], l: ['#cdb98a'], '.': ['#7a5f49'] });
// a spark burst (workbench, on the contact frame): warm light, glows
const sparks = (x, y) => pix(['y.y', '.w.', 'y.y'], x - 1, y - 1, { y: ['#ffd37a', true], w: ['#ffd37a', true] });
// the "!" of a discovery: warm light, glows
const bang = (fr, dy = 0) => pix(['ww', 'ww', 'ww', '..', 'ww'], fr.cx + 8, fr.headTop - 7 + dy, { w: ['#ffd37a', true] });
// the eureka lightbulb: a warm glowing bulb on a grey screw base; rays flash on `rays` frames
const bulb = (fr, rays = false) => {
  // (only 8 rows sit above his head, so the bulb is 5×7 and the rays go out to its sides)
  const x0 = fr.cx + 6, y0 = Math.max(0, fr.headTop - 8);
  const out = pix(['.yyy.', 'yhhyy', 'yhyyy', 'yyyyy', '.yyy.', '.ggg.', '.kkk.'], x0, y0, { y: ['#ffd37a', true], h: ['#f5ecc9', true], g: ['#9aa3b1'], k: ['#6b7382'] });
  if (rays) for (const [dx, dy] of [[-2, 2], [-3, 2], [6, 2], [7, 2], [-2, 0], [6, 0]]) out.push([x0 + dx, y0 + dy, '#ffd37a', true]);
  return out;
};
// the "?" of a puzzle (think): warm light, glows; bobs 1 px
const query = (fr, dy = 0) => pix(['.ww.', 'w..w', '...w', '..w.', '....', '..w.'], fr.cx + 6, fr.headTop - 8 + dy, { w: ['#ffd37a', true] });
const range = (n, fn) => Array.from({ length: n }, (_, f) => fn(f));

export const CLIPS = {
  // ── done in art-01 ──
  idle: { dirs: ALL, fps: 4, loop: true, poses: [0, 1, 1, 0].map((bob) => ({ bob })), face: [null, null, null, 'blink'] },
  walk: { dirs: ALL, fps: 10, loop: true, contact: [1, 5], poses: range(8, (f) => walkPose(f)) },

  // ── group 1: rest ──
  // he turns his head round: from the front to each profile and back; from the side
  // towards the viewer and then away; from the back to each profile
  'idle.look_around': { dirs: ALL, fps: 5, loop: false, poses: (d) => ({
    S: ['W', 'W', 'S', 'E', 'E', 'S'], N: ['W', 'W', 'N', 'E', 'E', 'N'],
    E: ['S', 'S', 'E', 'N', 'N', 'E'], W: ['S', 'S', 'W', 'N', 'N', 'W'],
  })[d].map((headTurn) => ({ headTurn })) },

  // fidgets: the renderer picks one at random when he has idled a while
  // (boredom band high, animations note §2.1)
  'idle.fidget': { dirs: ['S', 'N'], fps: 6, loop: false, // weight onto one foot, the other taps twice
    poses: [{}, { bodyDx: -1 }, { bodyDx: -1, liftB: 1 }, { bodyDx: -1 }, { bodyDx: -1, liftB: 1 }, {}] },
  'idle.fidget.sway': { dirs: ['S', 'N'], fps: 5, loop: false, // rocks side to side, head a beat behind
    poses: [{}, { bodyDx: -1, headDx: 1 }, { bodyDx: -1 }, { headDx: -1 }, { bodyDx: 1, headDx: -1 }, { bodyDx: 1 }, { headDx: 1 }, {}] },
  'idle.fidget.bounce': { dirs: ['S', 'N'], fps: 8, loop: false, airborne: true, // bounces on his toes, twice
    poses: [{ bob: 1 }, { hop: 1 }, { hop: 2, ...both(1, 1) }, { hop: 1 }, { bob: 1 }, { hop: 1 }, { hop: 2, ...both(1, 1) }, { bob: 1 }] },
  'idle.fidget.antenna': { dirs: ['S', 'N'], fps: 6, loop: false, // antenna springs up and wobbles
    poses: [{}, { antennaLift: 1 }, { antennaDx: 1 }, { antennaDx: -1 }, { antennaDx: 1 }, {}] },
  'idle.fidget.wipe': { dirs: ['S'], fps: 6, loop: false, // polishes his screen with one hand
    poses: [{}, { armA: { dx: -3, dy: 13 }, armsFront: true }, { armA: { dx: -6, dy: 17 }, armsFront: true }, { armA: { dx: -10, dy: 17 }, armsFront: true }, { armA: { dx: -6, dy: 16 }, armsFront: true }, { armA: { dx: -10, dy: 17 }, armsFront: true }, { armA: { dx: -3, dy: 12 }, armsFront: true }, {}],
    face: [null, 'squint', 'squint', 'squint', 'squint', 'squint', 'happy', 'happy'] },
  // ── group 2: moving ──
  // heavy load: leans back, both hands up at the straps, the bundle on his back
  'walk.carry': { dirs: ALL, fps: 9, loop: true, contact: [1, 5],
    poses: (d) => range(8, (f) => ({ ...walkPose(f), handA: 0, handB: 0, armDx: 0, ...(d === 'E' || d === 'W' ? { lean: -1, arm: { dx: 6, dy: 5 } } : both(-1, 5)) })),
    overlays: { 'back.bundle': bundle } },
  // power "a bit low": head lower, arms barely swing
  'walk.tired': { dirs: ALL, fps: 7, loop: true, contact: [1, 5],
    poses: range(8, (f) => ({ ...walkPose(f, { sep: [3, 4, 3, 0, -3, -4, -3, 0] }), headDy: 2, handA: 0, handB: 0, armDx: [-1, -1, 0, 0, 1, 1, 0, 0][f] })),
    face: Array(8).fill('tired') },
  // low power: head hung low, arms dangling, feet dragged (lift 1, short stride), no arm swing
  shuffle: { dirs: ALL, fps: 4, loop: true, contact: [1, 4],
    poses: (d) => range(6, (f) => ({ bob: [0, 0, 1, 0, 0, 1][f], headDy: 3, ...(d === 'E' || d === 'W' ? {} : both(0, -1)), ...feet([2, 3, 1, -2, -3, -1], f), liftA: [1, 0, 0, 0, 0, 1][f], liftB: [0, 0, 1, 1, 0, 0][f] })),
    face: Array(6).fill('very_tired'),
    // a low-battery icon blinks above his head (on 2 frames, off 1, at 4 fps)
    overlays: { 'status.battery': (fr) => ([1, 1, 0, 1, 1, 0][fr.f] ? battery(fr) : []) } },
  // slopes: lean into the hill going up, lean back and arms out a touch coming down
  'walk.slope_up': { dirs: ALL, fps: 8, loop: true, contact: [1, 5],
    poses: (d) => range(8, (f) => ({ ...walkPose(f), ...(d === 'E' || d === 'W' ? { lean: 1 } : { headDy: 1 }) })) },
  'walk.slope_down': { dirs: ALL, fps: 11, loop: true, contact: [1, 5],
    poses: (d) => range(8, (f) => ({ ...walkPose(f), ...(d === 'E' || d === 'W' ? { lean: -1 } : { ...both(2, 2 + [0, 0, 1, 0, 0, 0, 1, 0][f]) }) })) },
  // wading: high knees, arms lifted out of the water; the water hides his legs (renderer)
  wade: { dirs: ALL, fps: 7, loop: true, contact: [1, 5],
    poses: (d) => range(8, (f) => ({ ...walkPose(f, { sep: [3, 5, 3, 0, -3, -5, -3, 0] }), liftA: [2, 0, 0, 0, 0, 0, 2, 3][f], liftB: [0, 0, 2, 3, 2, 0, 0, 0][f], ...(d === 'E' || d === 'W' ? { arm: { dx: 7, dy: 6 } } : both(2, 4)) })) },
  // through a door / into a cave: half a stride, ducking the head on the way in (the fade is the renderer's)
  enter: { dirs: ALL, fps: 8, loop: false, poses: [1, 3, 5, 7].map((f, i) => ({ ...walkPose(f), headDy: i >= 2 ? 1 : 0 })) },
  exit: { dirs: ALL, fps: 8, loop: false, poses: [1, 3, 5, 7].map((f, i) => ({ ...walkPose(f), headDy: i < 2 ? 1 : 0 })) },
  // pulling the hand cart behind him: leans forward, hands back on the handle (the cart is its own sheet;
  // the handle hangs on anchors.hands)
  pull: { dirs: ALL, fps: 8, loop: true, contact: [1, 5],
    poses: (d) => range(8, (f) => ({ ...walkPose(f), handA: 0, handB: 0, armDx: 0,
      ...(d === 'E' || d === 'W' ? { lean: 1, arm: { dx: -4, dy: 3 } } : d === 'N' ? both(1, -1) : both(1, 3)) })) },

  // ── group 3: working ──
  // overhead chop/mine (axe, pick, hammer-break): one body, the held overlay differs
  // sitting on whatever is under him (bench, log, stump): hips down 3, breathing 1 px
  // (hands come up onto the lap — hanging to the feet read as a crouch)
  sit: { dirs: ['S', 'N'], fps: 2, loop: true, poses: [{ bob: 3, ...lap(3) }, { bob: 4, ...lap(3) }] },
  'sit.transition': { dirs: ['S', 'N'], fps: 8, loop: false, poses: [{ bob: 1, ...lap(1) }, { bob: 2, ...lap(2) }] },
  // sitting on the recharge bed, eyes closed; the strip fill is the renderer's tint
  // little lightning bolts drift up off his head like sleeping Zs (status overlay, glows at night)
  recharge: { dirs: ['S'], fps: 3, loop: true, poses: [3, 3, 4, 4].map((bob) => ({ bob, ...lap(3) })), face: ['closed', 'closed', 'closed', 'closed'],
    overlays: { 'status.bolts': (fr) => [fr.f, (fr.f + 2) % 4].flatMap((stage) => bolt(stage, fr)) } },
  // wakes, stretches both arms up and out in a V past the head (straight up hides
  // them behind it — the head is wider than the shoulders), settles with a head tilt
  'recharge.wake': { dirs: ['S'], fps: 6, loop: false,
    // …and holds the stretch, arms in the air, before letting go
    poses: [{ bob: 3, ...lap(3) }, { bob: 2, ...both(3, 5) }, { ...both(6, 10), armsFront: true }, { ...both(6, 10), armsFront: true }, { ...both(6, 10), armsFront: true }, { ...both(6, 10), armsFront: true }, { headDx: 1, ...both(2, 2) }],
    face: ['closed', 'blink', 'happy', 'happy', 'closed', 'happy', null] },
};

// ── group 3: working ──────────────────────────────────────────────────────────
const HEAVY = [ // ready, wind up over the shoulder, top (raised over his head, drawn on top of it), coming down, contact (f4), recover
  { side: { at: [21, 34], ang: 45 }, front: { A: [14, 36], B: [17, 36], ang: 90 } },
  { side: { at: [15, 25], ang: 135, armsFront: true }, front: { A: [9, 29], B: [12, 29], ang: 90, over: true } },
  { side: { at: [13, 21], ang: 180, armsFront: true, over: true }, front: { A: [8, 26], B: [11, 26], ang: 90, armsFront: true, over: true } },
  { side: { at: [20, 26], ang: 45, armsFront: true }, front: { A: [13, 31], B: [16, 31], ang: 90 } },
  { side: { at: [23, 37], ang: 315, body: { lean: 1 } }, front: { A: [14, 38], B: [17, 38], ang: 270 } },
  { side: { at: [21, 35], ang: 0 }, front: { A: [14, 36], B: [17, 36], ang: 90 } },
];
const LIGHT = [ // a low side sweep (cut, reap): back, start, through, contact (f3), follow, recover
  { side: { at: [13, 35], ang: 225 }, front: { A: [5, 35], ang: 225 } },
  { side: { at: [12, 33], ang: 180 }, front: { A: [5, 33], ang: 180 } },
  { side: { at: [17, 36], ang: 270 }, front: { A: [10, 38], ang: 270 } },
  { side: { at: [22, 37], ang: 315, body: { lean: 1 } }, front: { A: [16, 39], ang: 315 } },
  { side: { at: [24, 35], ang: 0 }, front: { A: [22, 37], ang: 0 } },
  { side: { at: [21, 35], ang: 315 }, front: { A: [12, 37], ang: 270 } },
];
const DIG = [ // ready, lift, drive in, stand on it, lever up (contact f4), toss over the shoulder
  { side: { at: [21, 35], ang: 270 }, front: { A: [14, 34], B: [17, 34], ang: 270 } },
  { side: { at: [21, 30], ang: 270 }, front: { A: [14, 30], B: [17, 30], ang: 270 } },
  { side: { at: [21, 36], ang: 270 }, front: { A: [14, 36], B: [17, 36], ang: 270 }, body: { bob: 1 } },
  { side: { at: [22, 37], ang: 270, body: { lean: 1 } }, front: { A: [14, 37], B: [17, 37], ang: 270 }, body: { bob: 1 } },
  { side: { at: [20, 33], ang: 315 }, front: { A: [13, 33], B: [16, 33], ang: 315 } },
  { side: { at: [15, 25], ang: 135, armsFront: true }, front: { A: [9, 27], B: [12, 27], ang: 135, behind: true } },
];
const HAMMER = [ // build: raise, up, top, down, strike (contact f4), lift — loops
  { side: { at: [21, 34], ang: 45 }, front: { A: [10, 34], ang: 90 } },
  { side: { at: [17, 27], ang: 90, armsFront: true }, front: { A: [7, 28], ang: 90 } },
  { side: { at: [15, 24], ang: 135, armsFront: true }, front: { A: [6, 25], ang: 135, armsFront: true } },
  { side: { at: [20, 28], ang: 45, armsFront: true }, front: { A: [9, 30], ang: 45 } },
  { side: { at: [23, 37], ang: 315, body: { lean: 1 } }, front: { A: [12, 38], ang: 315 } },
  { side: { at: [21, 35], ang: 0 }, front: { A: [10, 35], ang: 45 } },
];
const both2 = (a, b) => ({ A: a, B: b });
Object.assign(CLIPS, {
  // overhead two-hand swing; the same body for axe, pick and hammer-break — held.<tool> differs
  'swing.heavy': action({ fps: 8, loop: false, contact: [4], held: ['axe', 'pick'], keys: HEAVY }),
  'swing.light': action({ fps: 10, loop: false, contact: [3], held: 'sickle', keys: LIGHT }),
  dig: action({ fps: 7, loop: false, contact: [4], held: 'shovel', keys: DIG }),
  build: action({ fps: 7, loop: true, contact: [4], held: 'hammer', keys: HAMMER }),
  // bend, reach, grip, straighten with it (contact f3)
  pluck: action({ fps: 8, loop: false, contact: [3], keys: [
    { side: { at: [21, 38] }, front: both2([11, 40], [20, 40]), body: { bob: 2 } },
    { side: { at: [23, 43], body: { lean: 1 } }, front: both2([12, 44], [19, 44]), body: { bob: 2 } },
    { side: { at: [23, 43], body: { lean: 1 } }, front: both2([13, 44], [18, 44]), body: { bob: 2 } },
    { side: { at: [20, 32] }, front: both2([13, 33], [18, 33]) },
  ] }),
  // crouch, both hands down, lift (contact f3), stand holding it at the chest
  pick_up: action({ fps: 8, loop: false, contact: [3], keys: [
    { side: { at: [21, 40] }, front: both2([11, 41], [20, 41]), body: { bob: 3 } },
    { side: { at: [23, 44], body: { lean: 1 } }, front: both2([13, 45], [18, 45]), body: { bob: 3 } },
    { side: { at: [21, 38] }, front: both2([13, 39], [18, 39]), body: { bob: 1 } },
    { side: { at: [20, 33] }, front: both2([13, 34], [18, 34]) },
  ] }),
  // holding it at the chest, lower it, let go (contact f2), hands back
  drop: action({ fps: 8, loop: false, contact: [2], keys: [
    { side: { at: [20, 33] }, front: both2([13, 34], [18, 34]) },
    { side: { at: [22, 40] }, front: both2([12, 40], [19, 40]), body: { bob: 1 } },
    { side: { at: [23, 41] }, front: both2([10, 41], [21, 41]), body: { bob: 1 } },
    { side: { at: [20, 37] }, front: both2([9, 38], [22, 38]) },
  ] }),
  // marks out a blueprint's footprint: arms out wide, up, sweep in, point down (contact f3)
  place_footprint: action({ fps: 6, loop: false, contact: [3], keys: [
    { side: { at: [24, 34] }, front: both2([4, 35], [27, 35]) },
    { side: { at: [24, 28], armsFront: true }, front: both2([4, 29], [27, 29]) },
    { side: { at: [25, 33] }, front: both2([9, 34], [22, 34]) },
    { side: { at: [25, 40], body: { lean: 1 } }, front: both2([12, 41], [19, 41]), body: { bob: 1 } },
  ] }),
  // done! steps back, both arms up, a hop at the peak (contact f3), settles — happy face
  'build.complete': { dirs: ALL, fps: 6, loop: false, contact: [3], airborne: true,
    poses: (d) => { const side = d === 'E' || d === 'W'; const up = side ? { arm: { dx: 2, dy: 12 }, armsFront: true } : { ...both(6, 10), armsFront: true };
      return [{}, side ? { lean: -1, bob: 1 } : { bob: 1 }, up, { ...up, hop: 2 }, up, {}]; },
    face: [null, 'happy', 'happy', 'happy', 'happy', 'happy'] },
  // tips a load into the converter's hopper: lift, raise, tip (contact f3), shake, lower — S only
  convert: { ...action({ dirs: ['S'], fps: 6, loop: false, contact: [3], keys: [
    { front: both2([12, 38], [19, 38]) }, { front: both2([12, 33], [19, 33]) }, { front: { ...both2([12, 28], [19, 28]), armsFront: true } },
    { front: { ...both2([12, 24], [19, 24]), armsFront: true } }, { front: { ...both2([11, 25], [20, 25]), armsFront: true } }, { front: both2([12, 36], [19, 36]) },
  ] }), overlays: { 'held.load': (fr) => (fr.f <= 3 ? load(fr) : []) } },
});

// ── group 4: doing and reactions ─────────────────────────────────────────────
Object.assign(CLIPS, {
  // busy at the bench: hands working in turn at waist height, sparks on the contact frame (S only)
  workbench: { dirs: ['S'], fps: 5, loop: true, contact: [3],
    // (hands at bench height, in front of him — the bench sprite covers his legs)
    poses: [[[12, 40], [19, 38]], [[13, 38], [18, 40]], [[12, 40], [19, 38]], [[14, 41], [17, 41]], [[13, 38], [18, 40]], [[12, 39], [19, 39]]].map(([A, B]) => ({ at: { A, B } })),
    overlays: { 'status.sparks': (fr) => (fr.f === 3 ? sparks(16, 43) : []) } },
  // a berry to the screen ("eats" with his face): reach, raise, at the screen (contact f2), lower — happy
  eat: { ...action({ fps: 5, loop: false, contact: [2], face: [null, null, 'happy', 'happy'], keys: [
    { side: { at: [21, 37] }, front: { A: [10, 37] } },
    { side: { at: [21, 30] }, front: { A: [11, 30], armsFront: true } },
    { side: { at: [22, 22], armsFront: true }, front: { A: [13, 25], armsFront: true } },
    { side: { at: [21, 34] }, front: { A: [10, 35] } },
  ] }), overlays: { 'front.berry': (fr) => { const h = fr.hands?.A; if (!h || fr.f > 2 || fr.d === 'N') return []; return berry(h.x, h.y - (fr.f === 2 ? 0 : 1)); } } },
  // writing in a notebook held at the chest; the pen hand moves along the line (S only)
  write: { dirs: ['S'], fps: 3, loop: true,
    poses: [[[13, 37], [19, 36]], [[14, 36], [19, 36]], [[15, 37], [19, 36]], [[14, 36], [19, 36]]].map(([A, B]) => ({ at: { A, B } })),
    overlays: { 'held.notebook': (fr) => notebook(17, 39) } },
  // sulking: head hung, shoulders down, hands low, slow breath — sad face (S only)
  sulk: { dirs: ['S'], fps: 3, loop: true, face: Array(4).fill('sad'),
    poses: [0, 0, 1, 1].map((bob) => ({ bob, headDy: 2, ...both(0, -1) })) },
  // celebrate (a first, a level-up): crouch, hop up with both arms, land — happy
  celebrate: { dirs: ALL, fps: 8, loop: false, airborne: true, face: Array(6).fill('happy'),
    poses: (d) => { const side = d === 'E' || d === 'W'; const up = side ? { arm: { dx: 2, dy: 12 }, armsFront: true } : { ...both(6, 10), armsFront: true };
      return [{ bob: 2 }, { ...up, hop: 2 }, { ...up, hop: 4 }, { ...up, hop: 2 }, { bob: 2 }, {}]; } },
  // discover (a first sighting): leans in, head tilts, surprised face, a "!" pops above him
  discover: { dirs: ALL, fps: 6, loop: false, face: [null, 'surprised', 'surprised', 'surprised', 'surprised', null],
    poses: (d) => { const side = d === 'E' || d === 'W';
      return [{}, side ? { lean: 1 } : { bob: 1 }, side ? { lean: 1, headDx: 1 } : { bob: 1, headDx: 1 }, side ? { lean: 1, headDx: 1 } : { bob: 1, headDx: 1 }, side ? { lean: 1 } : { bob: 1 }, {}]; },
    overlays: { 'status.bang': (fr) => (fr.f >= 1 && fr.f <= 4 ? bang(fr) : []) } },
});

// ── group 4, revised: boats and thinking ──────────────────────────────────────
// rowing: an oar in each hand, a proper stroke — reach, catch, pull (splash f3), drive, lift, return.
// From the front both oars show, mirrored; from the side the far oar is behind him.
const ROW = [
  { side: [22, 36, 315], front: [[9, 34], 180] },
  { side: [22, 37, 315], front: [[9, 36], 225] },
  { side: [20, 38, 270], front: [[10, 37], 225] },
  { side: [17, 38, 225], front: [[11, 37], 225] },
  { side: [15, 35, 180], front: [[11, 35], 180] },
  { side: [19, 34, 0], front: [[10, 33], 180] },
];
const oars = (fr) => {
  const k = ROW[fr.f];
  if (fr.d === 'E' || fr.d === 'W') return [...tool(fr, 'oar', k.side[2], { nudge: [fr.d === 'E' ? -1 : 1, 0], behind: true }), ...tool(fr, 'oar', k.side[2])];
  return [...tool(fr, 'oar', k.front[1]), ...tool(fr, 'oar', k.front[1], { hand: 'B', flip: true })];
};
// paddling a canoe: one paddle, two hands, a stroke on one side then the other (splash f2, f6)
const PADDLE = [ // front: top hand, lower hand, angle (from the top hand; low enough that the grip clears his mouth); side: near hand, angle, far side?
  { front: [[15, 33], [12, 39], 225], side: [20, 31, 270, false] },
  { front: [[14, 34], [11, 40], 225], side: [21, 32, 315, false] },
  { front: [[13, 35], [10, 41], 225], side: [19, 33, 270, false] },
  { front: [[13, 34], [10, 39], 270], side: [16, 32, 225, false] },
  { front: [[16, 33], [19, 39], 315], side: [17, 31, 270, true] },
  { front: [[17, 34], [20, 40], 315], side: [19, 32, 315, true] },
  { front: [[18, 35], [21, 41], 315], side: [18, 33, 270, true] },
  { front: [[18, 34], [21, 39], 270], side: [15, 32, 225, true] },
];
Object.assign(CLIPS, {
  row: { dirs: ALL, fps: 5, loop: true, contact: [3],
    poses: (d) => ROW.map((k) => (d === 'E' || d === 'W' ? { bob: 3, at: { A: d === 'W' ? mx(k.side) : k.side.slice(0, 2) } } : { bob: 3, at: { A: d === 'N' ? mx(k.front[0]) : k.front[0], B: d === 'N' ? k.front[0] : mx(k.front[0]) } })),
    overlays: { 'held.oars': oars } },
  paddle: { dirs: ALL, fps: 6, loop: true, contact: [2, 6],
    poses: (d) => PADDLE.map((k) => (d === 'E' || d === 'W' ? { bob: 3, at: { A: d === 'W' ? mx(k.side) : k.side.slice(0, 2) } } : { bob: 3, at: { A: d === 'N' ? mx(k.front[0]) : k.front[0], B: d === 'N' ? mx(k.front[1]) : k.front[1] } })),
    overlays: { 'held.paddle': (fr) => { const k = PADDLE[fr.f]; return fr.d === 'E' || fr.d === 'W' ? tool(fr, 'paddle', k.side[2], { behind: k.side[3] }) : tool(fr, 'paddle', k.front[2]); } } },

  // thinking (life-loop decide step): his thinking eyes, a hand at the chin, a "?" bobbing above
  think: { ...action({ fps: 3, loop: true, face: Array(4).fill('thinking'), keys: [0, 1, 2, 3].map(() => ({ side: { at: [20, 30] }, front: { A: [12, 30] } })) }),
    overlays: { 'status.query': (fr) => query(fr, [0, -1, -1, 0][fr.f]) } },
  // thinking hard: his eyes become a loading wheel, hand at the chin
  'think.loading': { ...action({ fps: 8, loop: true, face: ['loading_0', 'loading_1', 'loading_2', 'loading_3'], keys: [0, 1, 2, 3].map(() => ({ side: { at: [20, 30] }, front: { A: [12, 30] } })) }) },
  // eureka: eyes wide, a hand shoots up, a lightbulb lights above him (rays at the peak), then a happy face
  'think.eureka': { dirs: ALL, fps: 8, loop: false, face: ['thinking', 'surprised', 'surprised', 'happy', 'happy', 'happy'],
    poses: (d) => { const side = d === 'E' || d === 'W';
      const chin = side ? { at: { A: d === 'W' ? mx([20, 30]) : [20, 30] } } : { at: { A: d === 'N' ? mx([12, 30]) : [12, 30] } };
      const up = side ? { arm: { dx: 4, dy: 15 }, armsFront: true } : { armA: { dx: 3, dy: 15 }, armsFront: true };
      return [chin, { ...chin, bob: 1 }, { ...up, hop: 1 }, up, up, {}]; },
    airborne: true,
    overlays: { 'status.bulb': (fr) => (fr.f >= 2 && fr.f <= 4 ? bulb(fr, fr.f === 3) : []) } },
});

// ── sulk, the eye roll ──
Object.assign(CLIPS, {
  // rolls his eyes up and over, then settles unimpressed with a little huff (S only, like sulk)
  'sulk.eyeroll': { dirs: ['S'], fps: 5, loop: false,
    face: ['sad', 'roll_ul', 'roll_u', 'roll_ur', 'unimpressed', 'unimpressed'],
    poses: [{ headDy: 1 }, { headDx: -1 }, {}, { headDx: 1 }, { bob: 1, headDy: 1, ...both(0, -1) }, { headDy: 1, ...both(0, -1) }] },
});

// ── group 5: tools carried while idle and walking (held.<tool> on the art-01 poses) ──
// he holds it upright at his side by the haft, head at shoulder height, blade outwards
const CARRY = { S: [90, [0, 2], true], N: [90, [0, 2], true], E: [90, [0, 2]], W: [90, [0, 2]] };
for (const k of ['idle', 'walk']) CLIPS[k].worn = ['held.axe', 'held.pick', 'held.shovel'], CLIPS[k].overlays = Object.fromEntries(['axe', 'pick', 'shovel'].map((t) => [`held.${t}`, (fr) => { const [a, nudge, flip] = CARRY[fr.d]; return tool(fr, t, a, { nudge, flip }); }]));
