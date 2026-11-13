// A tiny pixel-art canvas: materials with 3-tone ramps, automatic light-from-
// top-left shading, and a selective (per-material) outline — the three things
// the bundled office characters have that flat fills do not.
import { blank } from './png.mjs';

/**
 * A palette grade: pulls saturation down and compresses the highlights, so new
 * art lands in the same muted range as the bundled art. Near-white neutrals
 * (eye whites, paper) are left alone. Applied per colour at render time.
 */
export function makeGrade({ sat = 1, knee = 1, slope = 1 }) {
  const cache = new Map();
  return (hexc) => {
    if (cache.has(hexc)) return cache.get(hexc);
    let [r, g, b] = [1, 3, 5].map((i) => parseInt(hexc.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b); const mn = Math.min(r, g, b);
    const s0 = mx ? (mx - mn) / mx : 0;
    if (!(s0 < 0.08 && mx > 0.95) && mx > 0) {
      const v1 = mx > knee ? knee + (mx - knee) * slope : mx;
      const s1 = s0 * sat;
      // rebuild each channel at the new saturation and value, keeping the hue
      [r, g, b] = [r, g, b].map((c) => { const t = mx === mn ? 0 : (mx - c) / (mx - mn); return v1 * (1 - s1 * t); });
    }
    const out = `#${[r, g, b].map((c) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0')).join('')}`;
    cache.set(hexc, out); return out;
  };
}

export class Layer {
  /** ramps: { name: [hi, mid, lo] }, outlines: { name: '#rrggbb' } */
  constructor(w, h, ramps, outlines) {
    this.w = w; this.h = h; this.ramps = ramps; this.outlines = outlines; this.grade = null;
    this.g = Array.from({ length: h }, () => Array(w).fill(null));
    this.fx = Array.from({ length: h }, () => Array(w).fill(null)); // drawn last, never outlined
    this.under = Array.from({ length: h }, () => Array(w).fill(null)); // drawn first, behind everything
  }
  set(x, y, m, t = null) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = m ? { m, t } : null; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.g[y][x] : null; }
  rect(x0, y0, x1, y1, m, t = null) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, m, typeof t === 'function' ? t(x, y) : t); }
  line(x0, y0, x1, y1, m, t = null) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, m, t);
  }
  /** Filled ellipse; `tone(x, y)` may pick the tone per pixel. */
  ellipse(cx, cy, rx, ry, m, tone = null) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.set(x, y, m, typeof tone === 'function' ? tone(x, y) : tone);
    }
  }
  /** Filled convex or concave polygon (even-odd scanline). */
  poly(points, m, tone = null) {
    const ys = points.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const [x0, y0] = points[i]; const [x1, y1] = points[(i + 1) % points.length];
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x <= Math.round(xs[i + 1]); x++) this.set(x, y, m, typeof tone === 'function' ? tone(x, y) : tone);
    }
  }
  setUnder(x, y, hexColour) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.under[y][x] = hexColour; }
  setFx(x, y, hexColour) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.fx[y][x] = hexColour; }

  /** Resolve tones and outline; returns rows of '#rrggbb' | null. */
  render({ outline = true } = {}) {
    const out = Array.from({ length: this.h }, () => Array(this.w).fill(null));
    const same = (p, x, y) => { const q = this.get(x, y); return q && q.m === p.m; };
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const p = this.g[y][x];
      if (p) {
        let t = p.t;
        if (t === null) t = !same(p, x + 1, y) || !same(p, x, y + 1) ? 2 : !same(p, x, y - 1) ? 0 : 1;
        const ramp = this.ramps[p.m];
        out[y][x] = typeof ramp === 'string' ? ramp : ramp[t];
      } else if (outline) {
        const n = this.get(x, y + 1) ?? this.get(x, y - 1) ?? this.get(x + 1, y) ?? this.get(x - 1, y);
        if (n && this.outlines[n.m] !== null) out[y][x] = this.outlines[n.m] ?? '#1a1a22';
      }
    }
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.fx[y][x]) out[y][x] = this.fx[y][x];
      else if (!out[y][x] && this.under[y][x]) out[y][x] = this.under[y][x];
      if (this.grade && out[y][x]) out[y][x] = this.grade(out[y][x]);
    }
    return out;
  }
}

export function paint(image, rows, ox = 0, oy = 0) {
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
    const c = rows[y][x]; if (!c) continue;
    const X = ox + x; const Y = oy + y; if (X < 0 || Y < 0 || X >= image.width || Y >= image.height) continue;
    const o = (Y * image.width + X) * 4;
    image.data[o] = parseInt(c.slice(1, 3), 16); image.data[o + 1] = parseInt(c.slice(3, 5), 16); image.data[o + 2] = parseInt(c.slice(5, 7), 16); image.data[o + 3] = 255;
  }
}
export const sheet = (w, h) => blank(w, h);
