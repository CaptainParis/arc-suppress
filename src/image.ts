import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { inflateSync } from "node:zlib";
import { N, type Picture, type Pixel, type Shade } from "./model.ts";
import { BUILDABLE, pixelRgb } from "./palette.ts";

const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const DEPTHS: Record<number, number[]> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export function decodePng(bytes: Buffer): { width: number; height: number; rgba: Uint8Array } {
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("is not a PNG file; save the image as PNG");
  let width = 0;
  let height = 0;
  let depth = 0;
  let type = 0;
  let palette: Uint8Array = new Uint8Array(0);
  let trns: Uint8Array = new Uint8Array(0);
  const data: Buffer[] = [];
  for (let at = 8; at + 8 <= bytes.length; ) {
    const length = bytes.readUInt32BE(at);
    if (at + 12 + length > bytes.length) throw new Error("is cut short; save it again");
    const kind = bytes.toString("latin1", at + 4, at + 8);
    const body = bytes.subarray(at + 8, at + 8 + length);
    if (kind === "IHDR") {
      if (length !== 13) throw new Error("has a bad image header; save it again");
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8]!;
      type = body[9]!;
      if (!DEPTHS[type]?.includes(depth) || body[10] !== 0 || body[11] !== 0) throw new Error("has a bad image header; save it again");
      if (body[12] !== 0) throw new Error("is interlaced; save it again without interlace");
    } else if (kind === "PLTE") palette = body;
    else if (kind === "tRNS") trns = body;
    else if (kind === "IDAT") data.push(body);
    else if (kind === "IEND") break;
    at += length + 12;
  }
  if (width === 0 || height === 0) throw new Error("has no image header; save it again");
  if (type === 3 && palette.length === 0) throw new Error("has no palette; save it again");
  const channels = CHANNELS[type]!;
  const bits = channels * depth;
  const stride = Math.ceil((width * bits) / 8);
  const bpp = Math.max(1, bits >> 3);
  const raw = inflateSync(Buffer.concat(data));
  if (raw.length < height * (stride + 1)) throw new Error("is cut short; save it again");
  const rgba = new Uint8Array(width * height * 4);
  const max = (1 << depth) - 1;
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const line = new Uint8Array(stride);
    const filter = raw[y * (stride + 1)]!;
    if (filter > 4) throw new Error(`has an unknown filter on row ${y}; save it again`);
    for (let i = 0; i < stride; i++) {
      const v = raw[y * (stride + 1) + 1 + i]!;
      const a = i >= bpp ? line[i - bpp]! : 0;
      const b = prev[i]!;
      const c = i >= bpp ? prev[i - bpp]! : 0;
      line[i] = (v + [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter]!) & 255;
    }
    prev = line;
    const value = (x: number, ch: number): number => {
      const n = x * channels + ch;
      if (depth === 8) return line[n]!;
      if (depth === 16) return (line[n * 2]! << 8) | line[n * 2 + 1]!;
      return (line[(n * depth) >> 3]! >> (8 - depth - ((n * depth) & 7))) & max;
    };
    const sample = (x: number, ch: number): number => {
      const v = value(x, ch);
      return depth === 16 ? v >> 8 : depth === 8 ? v : Math.round((v * 255) / max);
    };
    const keyed = (x: number): boolean => {
      if (trns.length < channels * 2 || (type !== 0 && type !== 2)) return false;
      for (let ch = 0; ch < channels; ch++) if (value(x, ch) !== ((trns[ch * 2]! << 8) | trns[ch * 2 + 1]!)) return false;
      return true;
    };
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (type === 3) {
        const i = value(x, 0);
        if (i * 3 + 2 >= palette.length) throw new Error(`uses colour ${i} of a palette of ${palette.length / 3}; save it again`);
        rgba.set([palette[i * 3]!, palette[i * 3 + 1]!, palette[i * 3 + 2]!, i < trns.length ? trns[i]! : 255], o);
      } else if (type === 0 || type === 4) {
        const g = sample(x, 0);
        rgba.set([g, g, g, type === 4 ? sample(x, 1) : keyed(x) ? 0 : 255], o);
      } else {
        rgba.set([sample(x, 0), sample(x, 1), sample(x, 2), type === 6 ? sample(x, 3) : keyed(x) ? 0 : 255], o);
      }
    }
  }
  return { width, height, rgba };
}

interface Tile {
  name: string;
  row: number;
  col: number;
  picture: Picture;
}

export function readImage(path: string, only?: string[]): { tiles: Tile[]; cols: number; inexact: number } {
  let png: ReturnType<typeof decodePng>;
  try {
    png = decodePng(readFileSync(path));
  } catch (e) {
    throw new Error(`${path} ${(e as Error).message}`);
  }
  const { width, height, rgba } = png;
  if (width % N !== 0 || height % N !== 0) {
    throw new Error(`${path} is ${width}x${height}; width and height must be multiples of ${N} (one map is ${N}x${N})`);
  }
  const options = BUILDABLE.flatMap((id) => ([0, 1, 2] as Shade[]).map((shade) => ({ pixel: { id, shade }, rgb: pixelRgb({ id, shade }) })));
  const nearest = new Map<number, { pixel: Pixel; exact: boolean }>();
  const pick = (r: number, g: number, b: number): { pixel: Pixel; exact: boolean } => {
    const key = (r << 16) | (g << 8) | b;
    let found = nearest.get(key);
    if (found === undefined) {
      let best = options[0]!;
      let bestD = Infinity;
      for (const o of options) {
        const d = (o.rgb[0] - r) ** 2 + (o.rgb[1] - g) ** 2 + (o.rgb[2] - b) ** 2;
        if (d < bestD) {
          best = o;
          bestD = d;
        }
      }
      found = { pixel: best.pixel, exact: bestD === 0 };
      nearest.set(key, found);
    }
    return found;
  };
  const stem = basename(path, extname(path));
  const cols = width / N;
  const rows = height / N;
  const tiles: Tile[] = [];
  let inexact = 0;
  for (const name of only ?? []) {
    const m = /^r(0|[1-9]\d*)c(0|[1-9]\d*)$/.exec(name);
    if (m === null || Number(m[1]) >= rows || Number(m[2]) >= cols) throw new Error(`${path} has no map "${name}"`);
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (only !== undefined && !only.includes(`r${row}c${col}`)) continue;
      const picture: Picture = [];
      for (let z = 0; z < N; z++) {
        for (let x = 0; x < N; x++) {
          const o = ((row * N + z) * width + col * N + x) * 4;
          if (rgba[o + 3]! < 255) throw new Error(`${path} has a transparent pixel at ${col * N + x},${row * N + z}; every pixel must be opaque`);
          const { pixel, exact } = pick(rgba[o]!, rgba[o + 1]!, rgba[o + 2]!);
          if (!exact) inexact++;
          picture.push(pixel);
        }
      }
      tiles.push({ name: cols * rows === 1 ? stem : `${stem}-r${row}c${col}`, row, col, picture });
    }
  }
  return { tiles, cols, inexact };
}
