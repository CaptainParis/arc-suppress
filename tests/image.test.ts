import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { decodePng, readImage } from "../src/image.ts";
import { pixelRgb } from "../src/palette.ts";
import { encodePng, image, randomImage, randomPixels } from "./helpers.ts";

const FIXTURES = join(import.meta.dirname, "fixtures");
const decode = (name: string): ReturnType<typeof decodePng> => decodePng(readFileSync(join(FIXTURES, name)));

describe("decodePng", () => {
  it("reads palette files with transparency, and 16-bit files", () => {
    expect(decode("palette8-trns.png").rgba).toEqual(decode("rgba8.png").rgba);
    expect([...decode("rgb16.png").rgba.slice(0, 8)]).toEqual([255, 0, 0, 255, 250, 250, 250, 255]);
  });

  it("reads 1-bit grey pixels in order", () => {
    const { width, height, rgba } = decode("grey1.png");
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) expect(rgba[(y * width + x) * 4]).toBe((x + y) % 3 === 0 ? 255 : 0);
  });

  it("treats the tRNS colour of an RGB file as transparent, and only that colour", () => {
    const rgb = new Uint8Array(128 * 128 * 3).fill(7);
    rgb.set([1, 2, 3], 3 * 5);
    const { rgba } = decodePng(encodePng(128, 128, rgb, 2, [1, 2, 3]));
    expect([...rgba.slice(0, 4), ...rgba.slice(20, 24)]).toEqual([7, 7, 7, 255, 1, 2, 3, 0]);
    expect(decodePng(encodePng(128, 128, rgb.fill(7), 2, [1, 2, 3])).rgba.every((v, i) => i % 4 !== 3 || v === 255)).toBe(true);
  });

  it("refuses a bad image header", () => {
    const bytes = encodePng(128, 128, new Uint8Array(128 * 128 * 4));
    bytes[24] = 4;
    expect(() => decodePng(bytes)).toThrow(/bad image header/);
  });

  it("refuses interlaced and cut-short files", () => {
    expect(() => decode("interlaced.png")).toThrow(/interlaced/);
    const bytes = readFileSync(randomImage(1, 1, 1));
    expect(() => decodePng(bytes.subarray(0, bytes.length - 40))).toThrow(/cut short/);
  });
});

describe("readImage", () => {
  it("reads a map-colour picture exactly", () => {
    const { tiles, inexact } = readImage(randomImage(1, 1, 1));
    expect(inexact).toBe(0);
    expect(tiles.map((t) => [t.name, t.row, t.col])).toEqual([["random", 0, 0]]);
    expect(tiles[0]!.picture.map(pixelRgb)).toEqual(randomPixels(128 * 128, 1).map(pixelRgb));
  });

  it("cuts a bigger picture into maps by row and column", () => {
    const { tiles, cols } = readImage(randomImage(2, 2, 2));
    expect(cols).toBe(2);
    expect(tiles.map((t) => t.name)).toEqual(["random-r0c0", "random-r0c1", "random-r1c0", "random-r1c1"]);
  });

  it("uses the nearest colour that can be built, never water", () => {
    const black = pixelRgb({ id: 29, shade: 1 });
    const water = pixelRgb({ id: 12, shade: 1 });
    const path = image(128, 128, (x) => (x === 0 ? [black[0] + 3, black[1], black[2], 255] : x === 1 ? [...water, 255] : [...black, 255]));
    const { tiles, inexact } = readImage(path);
    expect(inexact).toBe(256);
    expect(tiles[0]!.picture.some((p) => p.id === 12)).toBe(false);
  });

  it("reads only the picked maps", () => {
    const path = image(256, 128, (x) => [0, 0, 0, x === 200 ? 0 : 255]);
    expect(readImage(path, ["r0c0"]).tiles.map((t) => t.name)).toEqual(["picture-r0c0"]);
    expect(() => readImage(path, ["r0c1"])).toThrow(/transparent pixel at 200,0/);
    expect(() => readImage(path, ["r1c0"])).toThrow(/has no map "r1c0"/);
  });

  it("refuses sizes that are not whole maps", () => {
    expect(() => readImage(image(130, 128, () => [0, 0, 0, 255]))).toThrow(/is 130x128; width and height must be multiples of 128/);
  });
});
