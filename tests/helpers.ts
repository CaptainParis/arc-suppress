import { afterAll } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crc32, deflateSync, gunzipSync } from "node:zlib";
import { N, type Picture, type Pixel, type Shade } from "../src/model.ts";
import { BUILDABLE, pixelRgb } from "../src/palette.ts";

const dirs: string[] = [];
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

export function encodePng(width: number, height: number, pixels: Uint8Array, type: 2 | 6 = 6, trns?: number[]): Buffer {
  const chunk = (type: string, body: Buffer): Buffer => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(body.length);
    head.write(type, 4, "latin1");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "latin1"), body])));
    return Buffer.concat([head, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, type, 0, 0, 0], 8);
  const row = width * (type === 6 ? 4 : 3);
  const rows = Buffer.alloc(height * (row + 1));
  for (let y = 0; y < height; y++) rows.set(pixels.subarray(y * row, (y + 1) * row), y * (row + 1) + 1);
  const key = trns === undefined ? [] : [chunk("tRNS", Buffer.from(trns.flatMap((v) => [0, v])))];
  return Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), chunk("IHDR", ihdr), ...key, chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0))]);
}

export function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "arc-test-"));
  dirs.push(dir);
  return dir;
}

export function image(width: number, height: number, rgba: (x: number, y: number) => number[], name = "picture"): string {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.set(rgba(x, y), (y * width + x) * 4);
  const path = join(tempDir(), `${name}.png`);
  writeFileSync(path, encodePng(width, height, data));
  return path;
}

function random(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomPixels(count: number, seed: number): Pixel[] {
  const next = random(seed);
  return Array.from({ length: count }, () => ({ id: BUILDABLE[Math.floor(next() * BUILDABLE.length)]!, shade: Math.floor(next() * 3) as Shade }));
}

export function randomPicture(seed: number): Picture {
  return randomPixels(N * N, seed);
}

export function randomImage(cols: number, rows: number, seed: number, name = "random"): string {
  const width = cols * N;
  const pixels = randomPixels(width * rows * N, seed);
  return image(width, rows * N, (x, y) => [...pixelRgb(pixels[y * width + x]!), 255], name);
}

export interface Structure {
  DataVersion: number;
  size: number[];
  palette: { Name: string; Properties?: Record<string, string> }[];
  blocks: { pos: number[]; state: number }[];
  entities: unknown[];
}

export function readNbt(gzipped: Buffer): Structure {
  const b = gunzipSync(gzipped);
  let at = 0;
  const str = (): string => {
    const n = b.readUInt16BE(at);
    at += 2 + n;
    return b.toString("utf8", at - n, at);
  };
  const value = (type: number): unknown => {
    if (type === 3) return b.readInt32BE((at += 4) - 4);
    if (type === 8) return str();
    if (type === 9) {
      const item = b[at++]!;
      const n = b.readInt32BE((at += 4) - 4);
      return Array.from({ length: n }, () => value(item));
    }
    if (type === 10) {
      const out: Record<string, unknown> = {};
      for (let t = b[at++]!; t !== 0; t = b[at++]!) out[str()] = value(t);
      return out;
    }
    throw new Error(`unexpected tag ${type} at ${at}`);
  };
  const type = b[at++]!;
  str();
  return value(type) as Structure;
}

export function blocksByState(s: Structure): Map<string, number[][]> {
  const out = new Map<string, number[][]>();
  for (const b of s.blocks) {
    const entry = s.palette[b.state]!;
    const props = Object.entries(entry.Properties ?? {}).map(([k, v]) => `${k}=${v}`).join(",");
    const name = props === "" ? entry.Name : `${entry.Name}[${props}]`;
    out.set(name, [...(out.get(name) ?? []), b.pos]);
  }
  return out;
}
