import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { gzipSync } from "node:zlib";
import type { Block } from "./model.ts";
import { parseState } from "./palette.ts";

const DATA_VERSION = 4671;

const INT = 3;
const STRING = 8;
const LIST = 9;
const COMPOUND = 10;

type Entry = [string, number, Buffer];

function int(v: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeInt32BE(v);
  return b;
}

function str(s: string): Buffer {
  const text = Buffer.from(s, "utf8");
  const b = Buffer.alloc(2);
  b.writeUInt16BE(text.length);
  return Buffer.concat([b, text]);
}

function list(type: number, items: Buffer[]): Buffer {
  return Buffer.concat([Buffer.from([type]), int(items.length), ...items]);
}

function compound(entries: Entry[]): Buffer {
  return Buffer.concat([...entries.map(([name, type, payload]) => Buffer.concat([Buffer.from([type]), str(name), payload])), Buffer.from([0])]);
}

export function structureBytes(blocks: Block[]): Buffer {
  const min = (k: "x" | "y" | "z"): number => blocks.reduce((m, b) => Math.min(m, b[k]), Infinity);
  const max = (k: "x" | "y" | "z"): number => blocks.reduce((m, b) => Math.max(m, b[k]), -Infinity);
  const [x0, y0, z0] = [min("x"), min("y"), Math.min(-1, min("z"))];
  const states = [...new Set(blocks.map((b) => b.state))];
  const index = new Map(states.map((s, i) => [s, i]));
  const palette = states.map((s) => {
    const { name, props } = parseState(s);
    const entries: Entry[] = [["Name", STRING, str(name)]];
    if (Object.keys(props).length > 0) entries.push(["Properties", COMPOUND, compound(Object.entries(props).map(([k, v]) => [k, STRING, str(v)]))]);
    return compound(entries);
  });
  const placed = blocks.map((b) => compound([
    ["pos", LIST, list(INT, [int(b.x - x0), int(b.y - y0), int(b.z - z0)])],
    ["state", INT, int(index.get(b.state)!)],
  ]));
  const root = compound([
    ["DataVersion", INT, int(DATA_VERSION)],
    ["size", LIST, list(INT, [int(max("x") - x0 + 1), int(max("y") - y0 + 1), int(max("z") - z0 + 1)])],
    ["palette", LIST, list(COMPOUND, palette)],
    ["blocks", LIST, list(COMPOUND, placed)],
    ["entities", LIST, list(COMPOUND, [])],
  ]);
  return gzipSync(Buffer.concat([Buffer.from([COMPOUND]), str(""), root]));
}

export function writeStructure(path: string, blocks: Block[]): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, structureBytes(blocks));
}
