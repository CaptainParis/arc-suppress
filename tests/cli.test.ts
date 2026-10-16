import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { main } from "../src/cli.ts";
import { blocksByState, randomImage, readNbt, tempDir } from "./helpers.ts";

const FIXTURES = join(import.meta.dirname, "fixtures");
const one = randomImage(1, 1, 1, "random");
const colours = randomImage(1, 1, 2, "colours");
const big = randomImage(2, 2, 3, "big");

function run(...argv: string[]): { code: number; out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  const code = main(argv, { out: (l) => out.push(l), err: (l) => err.push(l) });
  return { code, out, err };
}

describe("build", () => {
  it("writes one .nbt and nothing else", () => {
    const dir = tempDir();
    const r = run("build", one, "--out", `${dir}/`);
    expect(r.err).toEqual([]);
    expect(r.code).toBe(0);
    expect(r.out).toEqual(["1 maps, 74 steps, 32904 blocks, 224 blocks high", `-> ${join(dir, "random.nbt")}`]);
    expect(readdirSync(dir)).toEqual(["random.nbt"]);
  });

  it("builds picked maps of a big image as one grid, named after them", () => {
    const dir = tempDir();
    const r = run("build", big, "--tiles", "r0c1,r1c1", "--out", dir);
    expect(r.code).toBe(0);
    expect(r.out).toContain("grid: big-r0c1 lifted 0, big-r1c1 lifted 18");
    expect(r.out.at(-1)).toBe(`-> ${join(dir, "big-r0c1-r1c1.nbt")}`);
  });

  it("puts several images next to each other in grid mode, and on one area in chain mode", () => {
    const dir = tempDir();
    expect(run("build", one, colours, "--out", join(dir, "side")).code).toBe(0);
    expect(readNbt(readFileSync(join(dir, "side.nbt"))).size[0]).toBe(382);
    const chain = run("build", one, colours, "--mode", "chain", "--out", join(dir, "both.nbt"));
    expect(chain.code).toBe(0);
    expect(chain.out).toContain("chain: random lifted 0, colours lifted 9");
    expect(readNbt(readFileSync(join(dir, "both.nbt"))).size[0]).toBe(254);
  });

  it("writes one file for every N maps with --split", () => {
    const dir = tempDir();
    const r = run("build", big, "--mode", "chain", "--split", "3", "--out", dir);
    expect(r.code).toBe(0);
    expect(readdirSync(dir).sort()).toEqual(["big-chain-1.nbt", "big-chain-2.nbt"]);
    expect(r.out.filter((l) => l.startsWith("-> "))).toHaveLength(2);
  });

  it("uses the blocks given with --block and --filler", () => {
    const dir = tempDir();
    const r = run("build", one, "--block", "COLOR_BLACK=black_concrete", "--block=STONE=pale_oak_log[axis=x]", "--filler", "stone_bricks", "--out", dir);
    expect(r.code).toBe(0);
    const states = blocksByState(readNbt(readFileSync(join(dir, "random.nbt"))));
    expect(states.has("minecraft:black_concrete")).toBe(true);
    expect(states.has("minecraft:black_wool")).toBe(false);
    expect(states.has("minecraft:stone_bricks")).toBe(true);
    expect(states.has("minecraft:cobblestone")).toBe(false);
  });

  it("says why it refuses", () => {
    const refusal = (...argv: string[]): string => {
      const r = run(...argv);
      expect(r.code).toBe(1);
      return r.err.join("\n");
    };
    expect(refusal("make", one)).toBe('arc-suppress: unknown command "make"; use: node src/cli.ts build <image.png>');
    expect(refusal("build")).toBe("arc-suppress: give one or more PNG images");
    expect(refusal("build", one, "--size", "2")).toBe("arc-suppress: unknown option --size");
    expect(refusal("build", one, "--out", "--mode", "chain")).toBe("arc-suppress: --out needs a value");
    expect(refusal("build", one, "--mode", "stack")).toBe("arc-suppress: --mode must be grid or chain, not stack");
    expect(refusal("build", one, "--filler", "sand")).toBe("arc-suppress: --filler minecraft:sand falls");
    expect(refusal("build", one, "--block", "COLOR_BLACK=white_wool")).toBe("arc-suppress: --block COLOR_BLACK=white_wool: minecraft:white_wool does not show COLOR_BLACK");
    expect(refusal("build", one, "--tiles", "r3c3")).toBe(`arc-suppress: ${one} has no map "r3c3"`);
    expect(refusal("build", one, "--tiles", "r0c0,r0c0")).toBe("arc-suppress: --tiles gives a map more than one time");
    expect(refusal("build", one, "--tiles", "r0c0", "--tiles", "r0c0")).toBe("arc-suppress: --tiles is given more than one time");
    expect(refusal("build", one, "--split", "0")).toBe("arc-suppress: --split must be a whole number of 1 or more, not 0");
    expect(refusal("build", join(FIXTURES, "rgba8.png"))).toMatch(/is 13x7; width and height must be multiples of 128/);
  });

  it("prints help", () => {
    const r = run("--help");
    expect(r.code).toBe(0);
    expect(r.out[0]).toMatch(/^node src\/cli.ts build <image.png>/);
  });
});
