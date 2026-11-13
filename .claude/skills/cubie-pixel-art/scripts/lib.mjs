/**
 * Shared helpers for the cubie-pixel-art checks. No dependencies, like png.mjs,
 * so every script runs in a fresh checkout with plain Node (>= 20).
 *
 * - repoRoot()            the cubie-live checkout, found by walking up
 * - ramps()               art/palette.gpl if it exists, else the DRAFT ramps
 * - onRamp(rgb)           is a colour in the palette (or an allowed emissive / key)
 * - readManifest(file)    the small YAML subset the art manifests use
 * - meadow(w, h)          a flat placeholder meadow ground to judge sprites on
 * - nightTint(image)      the placeholder night grade, with emissives untinted
 */
import fs from 'node:fs';
import path from 'node:path';
import { blank } from './png.mjs';

export function repoRoot(from = process.cwd()) {
  let d = path.resolve(from);
  for (;;) {
    if (fs.existsSync(path.join(d, 'CLAUDE.md')) && fs.existsSync(path.join(d, 'docs/design'))) return d;
    const up = path.dirname(d);
    if (up === d) return null;
    d = up;
  }
}

// ── Colour ──────────────────────────────────────────────────────────────────

/**
 * DRAFT ramps, shadow → highlight. Source: the design canvas page 2 ("Palette —
 * draft ramps") and docs/design/07-cubie-character.md §3 for Cubie's own ramps.
 * Replaced wholesale by art/palette.gpl once the palette is approved (P3).
 */
export const DRAFT_RAMPS = {
  grass: ['#2b3a2f', '#3f5a3a', '#577a45', '#74974f', '#93b25c', '#b8cc78'],
  grass_warm: ['#30382a', '#4d5c33', '#6c7f3e', '#8d9d4a', '#adb85a', '#cfd27a'],
  foliage: ['#263a33', '#35563f', '#4a7a4b', '#67985a', '#86b36c', '#a8cc86'],
  bark_birch: ['#4a4651', '#7d7884', '#aaa5ae', '#cfcbd2', '#e9e6ec', '#f6f4f7'],
  stone: ['#343540', '#4e5160', '#6b6e7e', '#8a8d9d', '#a9abb8', '#c6c8d1'],
  earth: ['#3b2d26', '#5a4536', '#7a5f49', '#96785c', '#ad9170', '#c4a985'],
  sand: ['#8c7a5a', '#b39d73', '#cdb98a', '#e0cf9f', '#ecdfb3', '#f5ecc9'],
  water: ['#1d3d57', '#245a7a', '#2e7a9a', '#3f99b3', '#6ab8c8', '#a7dbe0'],
  metal: ['#3f4552', '#6b7382', '#9aa3b1', '#c7ced9', '#e6eaf0', '#f7f9fb'],
  crystal: ['#2a2550', '#41377f', '#5c4fb0', '#7e73d0', '#a69ee6', '#d1ccf5'],
  dark: ['#1f2229', '#2e323c', '#3f4552', '#4d5361', '#6b7382', '#9aa3b1'],
  screen: ['#071417', '#0b1f23', '#12343a', '#1b4a50'],
  accents: ['#d0414f', '#ffd37a'],
};
/** Emissive colours: allowed off-ramp, and the only pixels allowed on an _emissive layer. */
export const EMISSIVE = ['#1c9c94', '#27d4c9', '#7df2ea', '#c43a8a', '#f05fb3', '#ffb0dc', '#ffd37a'];
/** The chest-strip key the renderer tints (skill §4). */
export const STRIP_KEY = '#ff00ff';

export const rgbHex = (r, g, b) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
export const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** GIMP palette → { rampName: [hex…] }; a `# ramp: name` comment starts a ramp. */
export function readGpl(file) {
  const ramps = {}; let cur = 'palette';
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^#\s*ramp:\s*(\S+)/i);
    if (m) { cur = m[1]; continue; }
    const c = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)/);
    if (c) (ramps[cur] ??= []).push(rgbHex(+c[1], +c[2], +c[3]));
  }
  return ramps;
}

let cached = null;
/** { ramps, source: 'art/palette.gpl' | 'draft' } */
export function ramps() {
  if (cached) return cached;
  const root = repoRoot();
  const gpl = root && path.join(root, 'art/palette.gpl');
  cached = gpl && fs.existsSync(gpl) ? { ramps: readGpl(gpl), source: 'art/palette.gpl' } : { ramps: DRAFT_RAMPS, source: 'draft' };
  return cached;
}
export function paletteSet({ emissive = true, key = true } = {}) {
  const s = new Set(Object.values(ramps().ramps).flat().map((h) => h.toLowerCase()));
  if (emissive) EMISSIVE.forEach((h) => s.add(h));
  if (key) s.add(STRIP_KEY);
  return s;
}

/** HSV-ish facts the style rules talk about. */
export function hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return { s: mx ? (mx - mn) / mx : 0, v: mx };
}

/** Iterate opaque pixels: cb(x, y, r, g, b, a). */
export function eachPixel(img, cb) {
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const o = (y * img.width + x) * 4; const a = img.data[o + 3];
    if (a) cb(x, y, img.data[o], img.data[o + 1], img.data[o + 2], a);
  }
}

// ── Manifests (a small YAML subset) ─────────────────────────────────────────

/**
 * The art manifests are a YAML list of flat rows:
 *
 *   - id: birch
 *     layer: vegetation
 *     size: [1, 2]
 *     light: { radius: 3, colour: '#ffd37a' }
 *     placeholder: true
 *
 * This reads exactly that: a top-level list of maps, scalars, flow lists and
 * flow maps, `#` comments. Anything richer is refused with a line number, so a
 * manifest stays something a person can edit by hand.
 */
export function parseManifest(text, file = 'manifest') {
  const rows = []; let row = null;
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = stripComment(raw);
    if (!line.trim()) return;
    let m;
    if ((m = line.match(/^-\s+(.*)$/))) { row = {}; rows.push(row); pair(m[1], i); }
    else if ((m = line.match(/^\s{2,}(\S.*)$/)) && row) pair(m[1], i);
    else throw new Error(`${file}:${i + 1}: expected "- key: value" or an indented "key: value"`);
  });
  function pair(s, i) {
    const m = s.match(/^([A-Za-z_][\w.-]*):\s*(.*)$/);
    if (!m) throw new Error(`${file}:${i + 1}: expected key: value, got "${s}"`);
    try { row[m[1]] = scalar(m[2].trim()); } catch (e) { throw new Error(`${file}:${i + 1}: ${e.message}`); }
  }
  return rows;
}
function stripComment(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i);
  }
  return s;
}
function splitTop(s) {
  const out = []; let depth = 0, q = null, cur = '';
  for (const c of s) {
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '[' || c === '{') depth++;
    if (c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function scalar(s) {
  if (s === '' || s === '~' || s === 'null') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (/^(['"]).*\1$/.test(s)) return s.slice(1, -1);
  if (s.startsWith('[')) { if (!s.endsWith(']')) throw new Error(`unclosed list ${s}`); return splitTop(s.slice(1, -1)).map(scalar); }
  if (s.startsWith('{')) {
    if (!s.endsWith('}')) throw new Error(`unclosed map ${s}`);
    return Object.fromEntries(splitTop(s.slice(1, -1)).map((p) => { const m = p.match(/^([\w.-]+):\s*(.*)$/); if (!m) throw new Error(`bad map entry ${p}`); return [m[1], scalar(m[2].trim())]; }));
  }
  if (/[{}[\]]/.test(s)) throw new Error(`unexpected bracket in ${s}`);
  return s;
}
export const readManifest = (file) => parseManifest(fs.readFileSync(file, 'utf8'), file);

/** Manifest files → [{ file, folder, rows }]; folder is art/<name>/ for art/manifests/<name>.yaml or the yaml's own folder. */
export function manifests(root = repoRoot()) {
  const out = [];
  const md = path.join(root, 'art/manifests');
  if (fs.existsSync(md)) for (const f of fs.readdirSync(md).filter((f) => /\.ya?ml$/.test(f)).sort()) out.push({ file: path.join(md, f), folder: path.join(root, 'art', f.replace(/\.ya?ml$/, '')) });
  const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.isDirectory() && e.name !== 'manifests' && e.name !== 'reference' && e.name !== 'src') walk(path.join(d, e.name)); else if (/^manifest\.ya?ml$/.test(e.name)) out.push({ file: path.join(d, e.name), folder: d }); } };
  walk(path.join(root, 'art'));
  return out.map((m) => ({ ...m, rows: readManifest(m.file) }));
}

// ── Grounds and night ───────────────────────────────────────────────────────

/** Placeholder meadow: warm grass, flat, with a few quiet clusters (deterministic). */
export function meadow(w, h) {
  const R = ramps().ramps; const G = R.grass ?? DRAFT_RAMPS.grass; const W = R.grass_warm ?? DRAFT_RAMPS.grass_warm;
  const img = blank(w, h); let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const set = (x, y, c) => { if (x < 0 || y < 0 || x >= w || y >= h) return; img.data.set([...hexRgb(c), 255], (y * w + x) * 4); };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x, y, G[3]);
  for (let n = 0; n < (w * h) / 90; n++) {
    const x = Math.floor(rnd() * w), y = Math.floor(rnd() * h), c = rnd() < 0.55 ? G[4] : rnd() < 0.5 ? W[3] : G[2];
    set(x, y, c); set(x + 1, y, c); if (rnd() < 0.5) set(x, y + 1, c);
  }
  return img;
}

/** Placeholder night grade (multiply toward blue-violet). The renderer's real tint replaces it. */
export const NIGHT = [0.42, 0.46, 0.72];
export function nightTint(img, emissive = null) {
  for (let i = 0; i < img.width * img.height; i++) {
    const o = i * 4; if (!img.data[o + 3]) continue;
    if (emissive && emissive.data[o + 3]) { img.data.set(emissive.data.subarray(o, o + 4), o); continue; }
    for (let c = 0; c < 3; c++) img.data[o + c] = Math.round(img.data[o + c] * NIGHT[c]);
  }
  return img;
}

/** Draw src over dst at (x, y), alpha 0/255 only, optional integer scale. */
export function over(dst, src, x, y, scale = 1) {
  for (let yy = 0; yy < src.height; yy++) for (let xx = 0; xx < src.width; xx++) {
    const o = (yy * src.width + xx) * 4; if (src.data[o + 3] < 128) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const X = x + xx * scale + dx, Y = y + yy * scale + dy;
      if (X >= 0 && Y >= 0 && X < dst.width && Y < dst.height) dst.data.set(src.data.subarray(o, o + 4), (Y * dst.width + X) * 4);
    }
  }
}
export function crop(src, x, y, w, h) {
  const out = blank(w, h);
  for (let yy = 0; yy < h; yy++) src.data.copy(out.data, yy * w * 4, ((y + yy) * src.width + x) * 4, ((y + yy) * src.width + x + w) * 4);
  return out;
}
export function scaleUp(src, k) { const out = blank(src.width * k, src.height * k); over(out, src, 0, 0, k); return out; }
