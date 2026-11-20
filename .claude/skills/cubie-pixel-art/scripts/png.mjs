/**
 * A small PNG reader and writer on Node's own `zlib` — no dependencies, so the
 * checks run in a fresh checkout before `npm ci`.
 *
 * Reads 8-bit, non-interlaced PNGs (grey, RGB, palette, grey+alpha, RGBA) into
 * RGBA. Writes RGBA. That covers everything PixelLab and the office produce;
 * anything else is refused with a message naming what it was.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

/** @returns {{width:number,height:number,data:Buffer}} RGBA, row-major. */
export function decodePng(bytes) {
  if (bytes.length < 8 || !bytes.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error('not a PNG file');
  }
  let pos = 8;
  let header = null;
  let palette = null;
  let transparency = null;
  const idat = [];
  while (pos + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(pos);
    const type = bytes.toString('latin1', pos + 4, pos + 8);
    const body = bytes.subarray(pos + 8, pos + 8 + length);
    pos += 12 + length;
    if (type === 'IHDR') {
      header = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        depth: body[8],
        colourType: body[9],
        interlace: body[12],
      };
    } else if (type === 'PLTE') palette = body;
    else if (type === 'tRNS') transparency = body;
    else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
  }
  if (!header) throw new Error('PNG has no header');
  const { width, height, depth, colourType, interlace } = header;
  if (depth !== 8) throw new Error(`PNG bit depth ${depth} is not supported (need 8)`);
  if (interlace !== 0) throw new Error('interlaced PNGs are not supported');
  const channels = CHANNELS[colourType];
  if (!channels) throw new Error(`PNG colour type ${colourType} is not supported`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? pixels[dst + x - channels] : 0;
      const up = y > 0 ? pixels[dst + x - stride] : 0;
      const upLeft = y > 0 && x >= channels ? pixels[dst + x - stride - channels] : 0;
      let predicted = 0;
      if (filter === 1) predicted = left;
      else if (filter === 2) predicted = up;
      else if (filter === 3) predicted = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        predicted = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      } else if (filter !== 0) throw new Error(`PNG filter ${filter} is not valid`);
      pixels[dst + x] = (raw[src + x] + predicted) & 0xff;
    }
  }

  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const s = i * channels;
    if (colourType === 6) pixels.copy(data, o, s, s + 4);
    else if (colourType === 2) {
      pixels.copy(data, o, s, s + 3);
      const clear =
        transparency &&
        transparency.length >= 6 &&
        pixels[s] === transparency[1] &&
        pixels[s + 1] === transparency[3] &&
        pixels[s + 2] === transparency[5];
      data[o + 3] = clear ? 0 : 255;
    } else if (colourType === 0) {
      data[o] = data[o + 1] = data[o + 2] = pixels[s];
      data[o + 3] = transparency && transparency.length >= 2 && pixels[s] === transparency[1] ? 0 : 255;
    } else if (colourType === 4) {
      data[o] = data[o + 1] = data[o + 2] = pixels[s];
      data[o + 3] = pixels[s + 1];
    } else {
      if (!palette) throw new Error('palette PNG has no palette');
      const index = pixels[s];
      palette.copy(data, o, index * 3, index * 3 + 3);
      data[o + 3] = transparency && index < transparency.length ? transparency[index] : 255;
    }
  }
  return { width, height, data };
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, 'latin1');
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

/** Encode an RGBA image as a PNG. */
export function encodePng({ width, height, data }) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    data.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export const readPng = (file) => decodePng(readFileSync(file));
export const writePng = (file, image) => writeFileSync(file, encodePng(image));

/** A blank, fully transparent RGBA image. */
export function blank(width, height) {
  return { width, height, data: Buffer.alloc(width * height * 4) };
}

/** Copy a `w`×`h` region from `src` at (sx, sy) into `dst` at (dx, dy). */
export function blit(src, sx, sy, w, h, dst, dx, dy) {
  for (let y = 0; y < h; y++) {
    const from = ((sy + y) * src.width + sx) * 4;
    src.data.copy(dst.data, ((dy + y) * dst.width + dx) * 4, from, from + w * 4);
  }
}

/**
 * Facts about the opaque pixels in a region: bounding box, count, the set of
 * colours, and how many pixels are half-transparent. `box` is null when the
 * region is empty.
 */
export function inspect(image, x0 = 0, y0 = 0, w = image.width, h = image.height) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;
  let opaque = 0;
  let partial = 0;
  const colours = new Set();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = ((y0 + y) * image.width + x0 + x) * 4;
      const alpha = image.data[o + 3];
      if (alpha === 0) continue;
      if (alpha !== 255) partial++;
      opaque++;
      colours.add((image.data[o] << 16) | (image.data[o + 1] << 8) | image.data[o + 2]);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const box = opaque ? { minX, minY, maxX, maxY } : null;
  return { box, opaque, partial, colours };
}

export const hex = (colour) => `#${colour.toString(16).padStart(6, '0')}`;
