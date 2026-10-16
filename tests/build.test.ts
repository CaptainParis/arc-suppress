import { describe, expect, it } from "vitest";
import { N, type Part, type Picture, type Schematic, type Shade } from "../src/model.ts";
import { PHASE, STANDS } from "../src/design.ts";
import { COLOURS, blockProblem, colourOf, defaultBlock } from "../src/palette.ts";
import { HOLDER_Y, RISE, curve } from "../src/curve.ts";
import { blocksOf, combine, heightOf, type Planned } from "../src/combine.ts";
import { check } from "../src/sim.ts";
import { structureBytes } from "../src/nbt.ts";
import { blocksByState, randomPicture, readNbt } from "./helpers.ts";

const FILLER = "minecraft:cobblestone";
const blockFor = (id: number): string => defaultBlock(id)!;

function grid(): Planned[] {
  return ["r0c0", "r0c1", "r1c0", "r1c1"].map((name, i) => ({ ...curve(name, randomPicture(i + 1), blockFor, FILLER), col: i % 2, row: Math.floor(i / 2) }));
}

function picture(id: number, shade: Shade, at?: (x: number, z: number) => Shade | undefined): Picture {
  return Array.from({ length: N * N }, (_, i) => ({ id, shade: at?.(i % N, Math.floor(i / N)) ?? shade }));
}

function single(p: Part): Schematic {
  return { maps: [p.map], steps: p.steps };
}

describe("design", () => {
  it("writes every cell, and a cell's phase is at most two from its north neighbour's", () => {
    expect(STANDS).toHaveLength(74);
    expect([...PHASE].every((k) => k >= 0)).toBe(true);
    let same = 0;
    let most = 0;
    for (let x = 0; x < N; x++) {
      for (let z = 1; z < N; z++) {
        const k = PHASE[x + N * z]!;
        const north = PHASE[x + N * (z - 1)]!;
        if (k === north) same++;
        most = Math.max(most, Math.abs(k - north));
      }
    }
    expect(same).toBe(384);
    expect(most).toBe(2);
  });
});

describe("palette", () => {
  it("has a default block for every colour but water and crimson nylium", () => {
    const missing = COLOURS.filter((c) => c.id > 0 && defaultBlock(c.id) === undefined).map((c) => c.name);
    expect(missing).toEqual(["WATER", "CRIMSON_NYLIUM"]);
  });

  it("knows block states and refuses blocks that do not stay", () => {
    expect(colourOf("minecraft:bamboo_block[axis=x]")).toBe(7);
    expect(colourOf("minecraft:bamboo_block")).toBe(18);
    expect(COLOURS[colourOf("minecraft:birch_log[axis=z]")]!.name).toBe("QUARTZ");
    expect(blockProblem("minecraft:sand")).toBe("falls");
    expect(blockProblem("minecraft:glass")).toBe("has no map colour");
    expect(blockProblem("minecraft:grass_block")).toBe("changes by itself");
    expect(blockProblem("minecraft:oak_slab")).toBe("is not a full, stable block");
    expect(blockProblem("minecraft:nether_wart")).toBe("is not a full, stable block");
  });
});

describe("curve", () => {
  const one = curve("random", randomPicture(1), blockFor, FILLER);

  it("puts every phase on its own three layers, with the holder below the ramp", () => {
    expect(one.steps).toHaveLength(74);
    expect(one.steps.reduce((n, s) => n + s.blocks.length, 0)).toBe(32830);
    expect(one.map.lane).toHaveLength(74);
    expect(one.map.lane.every((b) => b.y === HOLDER_Y)).toBe(true);
    one.steps.forEach((s, k) => expect(s.blocks.every((b) => b.y >= k * RISE && b.y < (k + 1) * RISE)).toBe(true));
    expect(heightOf(single(one))).toBe(224);
  });

  it("draws the picture, and a wrong block shows", () => {
    expect(check(single(one))).toBeUndefined();
    const steps = one.steps.map((s) => ({ ...s, blocks: [...s.blocks] }));
    const pixel = steps[40]!.blocks.findIndex((b) => b.state !== FILLER && b.state !== "minecraft:red_wool");
    steps[40]!.blocks[pixel] = { ...steps[40]!.blocks[pixel]!, state: "minecraft:red_wool" };
    expect(check({ maps: [one.map], steps })).toMatch(/^random: pixel \d+,\d+ comes out wrong$/);
  });

  it("refuses a block where the holder stands, and two blocks in one place", () => {
    const blocked = one.steps.map((s, k) => (k === 5 ? { ...s, blocks: [{ ...s.stand, state: FILLER }, ...s.blocks] } : s));
    expect(check({ maps: [one.map], steps: blocked })).toBe("random: no room to stand at 117,-2,64");
    const taken = one.steps[9]!.blocks.find((b) => b.state !== "minecraft:red_wool")!;
    const twice = one.steps.map((s, k) => (k === 10 ? { ...s, blocks: [{ ...taken, state: "minecraft:red_wool" }, ...s.blocks] } : s));
    expect(check({ maps: [one.map], steps: twice })).toBe(`minecraft:red_wool and ${taken.state} meet at ${taken.x},${taken.y},${taken.z}`);
  });
});

describe("nbt", () => {
  it("puts the first map area at x 0, z 1 and the stand blocks at x 107 + 2k, y 0, z 65, even with a light top row", () => {
    const light = curve("light", picture(8, 2), blockFor, FILLER);
    expect(light.steps.flatMap((s) => s.blocks).some((b) => b.z < 0)).toBe(false);
    const nbt = readNbt(structureBytes(blocksOf(single(light))));
    expect(nbt.DataVersion).toBe(4671);
    expect(nbt.size[2]).toBe(129);
    const stands = blocksByState(nbt).get(FILLER)!.filter((p) => p[1] === 0);
    expect(stands).toEqual(STANDS.map((s) => [s.x, 0, s.z + 1]));
  });

  it("writes block properties", () => {
    const plant = curve("plant", picture(7, 1), blockFor, FILLER);
    const nbt = readNbt(structureBytes(blocksOf(single(plant))));
    expect(nbt.palette).toContainEqual({ Name: "minecraft:bamboo_block", Properties: { axis: "x" } });
    expect(blocksOf(single(plant)).length).toBe(nbt.blocks.length);
  });
});

describe("combine", () => {
  const tiles = grid();

  it("puts a grid of maps on their own areas, lifting each row above the one north of it", () => {
    const { schematic, dys } = combine(tiles, "grid");
    expect(dys).toEqual([0, 0, 18, 18]);
    expect(schematic.maps.map((m) => m.area)).toEqual([{ x: 0, z: 0 }, { x: 128, z: 0 }, { x: 0, z: 128 }, { x: 128, z: 128 }]);
    expect(check(schematic)).toBeUndefined();
  });

  it("keeps the north map right while it lifts the map south of it", () => {
    const top = curve("top", picture(28, 1, (x, z) => (x === 0 && z === 127 ? 0 : undefined)), blockFor, FILLER);
    const bottom = curve("bottom", picture(28, 1, (x, z) => (x === 64 && z === 64 ? 0 : undefined)), blockFor, FILLER);
    const { schematic } = combine([{ ...top, col: 0, row: 0 }, { ...bottom, col: 0, row: 1 }], "grid");
    expect(check(schematic)).toBeUndefined();
  });

  it("chains maps on one area, built in turns", () => {
    const { schematic, dys } = combine(tiles.slice(0, 3), "chain");
    expect(dys).toEqual([0, 9, 18]);
    expect(schematic.steps.slice(0, 5).map((s) => s.map)).toEqual([0, 0, 0, 0, 1]);
    expect(heightOf(schematic)).toBe(242);
    expect(check(schematic)).toBeUndefined();
  });

  it("refuses a build too high for a world", () => {
    const tall = { ...tiles[1]!, steps: tiles[1]!.steps.map((s, k) => (k === 73 ? { ...s, blocks: [...s.blocks, { x: 5, y: 400, z: 5, state: FILLER }] } : s)) };
    expect(() => combine([tiles[0]!, tall], "chain")).toThrow(/r0c1 does not fit: the build would be more than 383 blocks high/);
  });
});
