#!/usr/bin/env node
/**
 * Does a sprite sit in the island's colour budget?
 *
 *   node style-check.mjs <ground|vegetation|node|structure|icon|ui|cubie> <file.png> [...]
 *
 * Per file it measures, over opaque pixels: median saturation, % very bright
 * (value > 0.9), % vivid (saturation > 0.6 and value > 0.5), the colour count,
 * half-transparent pixels, pure #000/#fff, and pixels off the palette ramps
 * (art/palette.gpl, or the draft ramps until it exists). The chest-strip key
 * #ff00ff and the emissive colours are allowed off-ramp and are not counted as
 * "vivid", so a keyed sheet is judged on the body.
 *
 * Thresholds: `cubie` is calibrated from art/reference/cubie/ (revision 2,
 * 2026-11-13: median saturation 0.08–0.23 — the 18×11 screen's dark teal lifts the
 * front views — bright 20–33 %, 11–16 colours; first head was 0.08–0.13). The others
 * are the art system's written targets (§2 saturation budget: ground quietest,
 * vegetation middling, nodes / icons / Cubie loudest) and get recalibrated from
 * the hero tile in P3. Loudness here is "vivid" and "bright": Cubie is a white
 * shell with teal and pink accents, so his median saturation is low, and
 * nothing in a biome may out-shout his accents.
 *
 * Exits 1 when any file is outside its class, 2 on bad usage. Reads only.
 */
import { readPng } from './png.mjs';
import { EMISSIVE, STRIP_KEY, eachPixel, hsv, paletteSet, ramps, rgbHex } from './lib.mjs';

// [lo, hi] median saturation; max % bright; max % vivid; max colours; max % off-ramp
export const TARGETS = {
  ground: { sat: [0.05, 0.55], bright: 2, vivid: 1, colours: 16, offRamp: 0 },
  vegetation: { sat: [0.1, 0.6], bright: 8, vivid: 4, colours: 24, offRamp: 0 },
  node: { sat: [0.05, 0.65], bright: 14, vivid: 8, colours: 28, offRamp: 0 },
  structure: { sat: [0.03, 0.6], bright: 16, vivid: 6, colours: 32, offRamp: 0 },
  icon: { sat: [0.05, 0.75], bright: 20, vivid: 14, colours: 20, offRamp: 0 },
  ui: { sat: [0.0, 0.4], bright: 20, vivid: 6, colours: 16, offRamp: 0 },
  cubie: { sat: [0.04, 0.3], bright: 40, vivid: 8, colours: 24, offRamp: 0 },
};

export function styleCheck(kind, img) {
  const t = TARGETS[kind];
  const pal = paletteSet(); const glow = new Set([...EMISSIVE, STRIP_KEY]);
  const S = []; let n = 0, bright = 0, vivid = 0, soft = 0, pure = 0, off = 0, opaque = 0;
  const colours = new Set(); const offColours = new Set();
  eachPixel(img, (x, y, r, g, b, a) => {
    opaque++; if (a !== 255) soft++;
    const h = rgbHex(r, g, b); colours.add(h);
    if (h === '#000000' || h === '#ffffff') pure++;
    if (!pal.has(h)) { off++; offColours.add(h); }
    if (glow.has(h)) return;
    const { s, v } = hsv(r, g, b); if (v < 0.12) return;
    S.push(s); n++; if (v > 0.9) bright++; if (s > 0.6 && v > 0.5) vivid++;
  });
  if (!opaque) return { flags: ['empty'], line: 'empty' };
  S.sort((p, q) => p - q);
  const sat = S.length ? S[Math.floor(S.length / 2)] : 0; const pb = n ? (100 * bright) / n : 0; const pv = n ? (100 * vivid) / n : 0; const po = (100 * off) / opaque;
  const flags = [];
  if (sat < t.sat[0] || sat > t.sat[1]) flags.push(`median saturation ${sat.toFixed(2)} (want ${t.sat[0]}–${t.sat[1]})`);
  if (pb > t.bright) flags.push(`${pb.toFixed(1)}% very bright pixels (want at most ${t.bright}%) — highlights too hot for ${kind}`);
  if (pv > t.vivid) flags.push(`${pv.toFixed(1)}% vivid pixels (want at most ${t.vivid}%) — louder than ${kind} may be`);
  if (colours.size > t.colours) flags.push(`${colours.size} colours (want at most ${t.colours})`);
  if (soft) flags.push(`${soft} half-transparent pixels (alpha must be 0 or 255)`);
  if (pure) flags.push(`${pure} pure #000/#fff pixels (no pure black or white outside the emissive layer)`);
  if (po > t.offRamp) flags.push(`${off} pixels (${po.toFixed(1)}%) off the ${ramps().source} ramps: ${[...offColours].slice(0, 8).join(' ')}${offColours.size > 8 ? ' …' : ''}`);
  return { flags, line: `sat ${sat.toFixed(2)}, bright ${pb.toFixed(1)}%, vivid ${pv.toFixed(1)}%, ${colours.size} colours, ${off} off-ramp` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [kind, ...files] = process.argv.slice(2);
  if (!TARGETS[kind] || !files.length) { console.error(`usage: node style-check.mjs <${Object.keys(TARGETS).join('|')}> <file.png> [...]`); process.exit(2); }
  console.log(`palette: ${ramps().source}${ramps().source === 'draft' ? ' (art/palette.gpl not approved yet — thresholds are written targets except cubie)' : ''}`);
  let bad = 0;
  for (const file of files) {
    const { flags, line } = styleCheck(kind, readPng(file));
    console.log(`${flags.length ? 'OUTSIDE' : 'ok     '} ${file}: ${line}`);
    for (const f of flags) console.log(`          ${f}`);
    if (flags.length) bad++;
  }
  process.exit(bad ? 1 : 0);
}
