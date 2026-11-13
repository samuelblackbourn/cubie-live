// Cubie's clips as data: per clip, the directions drawn, timing, and one pose per
// frame (pose fields: model.mjs header). `face` forces a face on a frame (null =
// whatever the renderer's mood/event face is). Timing and frame counts follow
// docs/design/06-animations.md §2; contact frames are where the SFX fire.
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
