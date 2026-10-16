import { existsSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { readImage } from "./image.ts";
import { COLOURS, blockProblem, colourOf, defaultBlock, normalState } from "./palette.ts";
import { curve } from "./curve.ts";
import { blocksOf, combine, heightOf, type Mode, type Planned } from "./combine.ts";
import { writeStructure } from "./nbt.ts";
import type { Picture } from "./model.ts";

const USAGE = `node src/cli.ts build <image.png> [<image.png> ...] [options]

Makes one .nbt schematic of curved suppress-steps map art from PNG images.
Each image must use map colours. Its width and height must be multiples of 128.

Options:
  --tiles r0c0,r0c1    Use only these maps of the image (row, column).
  --mode grid|chain    grid: each map on its own map area (default).
                       chain: all maps on one map area, built in turns.
  --split N            Write one file for every N maps.
  --block COLOUR=BLOCK Use BLOCK for a map colour, for example COLOR_BLACK=black_wool.
  --filler BLOCK       Block for supports and stands (default cobblestone).
  --out FILE           Output file or folder (default out/<image>.nbt).`;

interface Io {
  out: (line: string) => void;
  err: (line: string) => void;
}

const FLAGS = ["tiles", "mode", "split", "block", "filler", "out"];

function parse(argv: string[]): { files: string[]; values: Map<string, string[]> } {
  const files: string[] = [];
  const values = new Map<string, string[]>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!arg.startsWith("--")) {
      files.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    const name = arg.slice(2, eq < 0 ? undefined : eq);
    if (!FLAGS.includes(name)) throw new Error(`unknown option --${name}`);
    if (name !== "block" && values.has(name)) throw new Error(`--${name} is given more than one time`);
    const value = eq < 0 ? argv[++i] : arg.slice(eq + 1);
    if (value === undefined || value === "" || (eq < 0 && value.startsWith("--"))) throw new Error(`--${name} needs a value`);
    values.set(name, [...(values.get(name) ?? []), value]);
  }
  return { files, values };
}

function blockChoice(texts: string[]): Map<number, string> {
  const out = new Map<number, string>();
  for (const text of texts) {
    const eq = text.indexOf("=");
    const colour = COLOURS.find((c) => c.name === text.slice(0, eq).toUpperCase());
    if (eq < 0 || colour === undefined) throw new Error(`--block ${text}: use COLOUR=BLOCK with a map colour name`);
    const state = normalState(text.slice(eq + 1));
    if (colourOf(state) !== colour.id) throw new Error(`--block ${text}: ${state} does not show ${colour.name}`);
    const problem = blockProblem(state);
    if (problem !== undefined) throw new Error(`--block ${text}: ${state} ${problem}`);
    out.set(colour.id, state);
  }
  return out;
}

function build(argv: string[], io: Io): void {
  const { files, values } = parse(argv);
  const one = (name: string): string | undefined => values.get(name)?.at(-1);
  if (files.length === 0) throw new Error("give one or more PNG images");
  const mode = (one("mode") ?? "grid") as Mode;
  if (mode !== "grid" && mode !== "chain") throw new Error(`--mode must be grid or chain, not ${mode}`);
  const filler = normalState(one("filler") ?? "cobblestone");
  const fillerProblem = blockProblem(filler);
  if (fillerProblem !== undefined) throw new Error(`--filler ${filler} ${fillerProblem}`);
  const chosen = blockChoice(values.get("block") ?? []);
  const blockFor = (id: number): string => chosen.get(id) ?? defaultBlock(id)!;
  const pick = one("tiles")?.split(",").map((t) => t.trim());
  if (pick !== undefined && files.length > 1) throw new Error("--tiles works with one image only");
  if (pick !== undefined && new Set(pick).size < pick.length) throw new Error("--tiles gives a map more than one time");

  const split = one("split");
  const size = split === undefined ? Infinity : Number(split);
  if (!(size >= 1 && (Number.isInteger(size) || size === Infinity))) throw new Error(`--split must be a whole number of 1 or more, not ${split}`);

  const tiles: { name: string; picture: Picture; col: number; row: number }[] = [];
  let colStart = 0;
  for (const file of files) {
    const read = readImage(file, pick);
    if (read.inexact > 0) io.out(`${file}: ${read.inexact} pixels changed to the nearest map colour that can be built`);
    const used = pick === undefined ? read.tiles : pick.map((name) => read.tiles.find((t) => `r${t.row}c${t.col}` === name)!);
    for (const t of used) tiles.push({ ...t, col: colStart + t.col });
    colStart += read.cols;
  }

  const stem = basename(files[0]!, extname(files[0]!));
  const tag = pick === undefined ? "" : pick.length > 1 ? `-${pick[0]}-${pick.at(-1)}` : `-${pick[0]}`;
  const name = `${stem}${tag}${mode === "chain" && Math.min(size, tiles.length) > 1 ? "-chain" : ""}`;
  const outArg = one("out");
  const intoFolder = outArg !== undefined && (outArg.endsWith("/") || (existsSync(outArg) && statSync(outArg).isDirectory()));
  const base = outArg === undefined ? join("out", name) : intoFolder ? join(outArg, name) : outArg.replace(/\.nbt$/i, "");
  const groups = Math.max(1, Math.ceil(tiles.length / size));
  for (let g = 0; g < groups; g++) {
    const group = tiles.slice(g * size, (g + 1) * size);
    const minCol = Math.min(...group.map((t) => t.col));
    const minRow = Math.min(...group.map((t) => t.row));
    const planned: Planned[] = group.map((t) => ({ ...curve(t.name, t.picture, blockFor, filler), col: t.col - minCol, row: t.row - minRow }));
    const { schematic, order, dys } = combine(planned, mode);
    if (planned.length > 1) io.out(`${mode}: ${order.map((p, i) => `${p.map.name} lifted ${dys[i]}`).join(", ")}`);
    const out = groups > 1 ? `${base}-${String(g + 1).padStart(String(groups).length, "0")}.nbt` : `${base}.nbt`;
    const blocks = blocksOf(schematic);
    writeStructure(out, blocks);
    io.out(`${schematic.maps.length} maps, ${schematic.steps.length} steps, ${blocks.length} blocks, ${heightOf(schematic)} blocks high`);
    io.out(`-> ${out}`);
  }
}

export function main(argv: string[], io: Io = { out: (l) => console.log(l), err: (l) => console.error(l) }): number {
  const [command, ...rest] = argv;
  if (command === undefined || command === "help" || command === "--help" || command === "-h") {
    io.out(USAGE);
    return 0;
  }
  try {
    if (command !== "build") throw new Error(`unknown command "${command}"; use: node src/cli.ts build <image.png>`);
    build(rest, io);
    return 0;
  } catch (e) {
    io.err(`arc-suppress: ${(e as Error).message}`);
    return 1;
  }
}

if (import.meta.main) process.exitCode = main(process.argv.slice(2));
