import { N, type Block, type Part, type Picture } from "./model.ts";
import { PHASE, STANDS } from "./design.ts";

export const HOLDER_Y = -3;
export const RISE = 3;

export function curve(name: string, picture: Picture, blockFor: (id: number) => string, filler: string): Part {
  const cells: number[][] = STANDS.map(() => []);
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) cells[PHASE[x + N * z]!]!.push(x + N * z);
  const shift = (i: number): number => picture[i]!.shade - 1;

  const steps = cells.map((list, k) => {
    const blocks: Block[] = [];
    const column = (x: number, z: number, level: number, state: string): void => {
      for (let l = 0; l < level; l++) blocks.push({ x, y: k * RISE + l, z, state: filler });
      blocks.push({ x, y: k * RISE + level, z, state });
    };
    let start = 0;
    while (start < list.length) {
      let end = start + 1;
      while (end < list.length && list[end] === list[end - 1]! + N) end++;
      const x = list[start]! % N;
      const z0 = Math.floor(list[start]! / N);
      const rel = [0];
      for (let i = start + 1; i < end; i++) rel.push(rel.at(-1)! + shift(list[i]!));
      const low = Math.min(...rel);
      rel.forEach((r, i) => column(x, z0 + i, r - low, blockFor(picture[list[start + i]!]!.id)));
      const s = shift(list[start]!);
      if (s <= 0) column(x, z0 - 1, rel[0]! - low - s, filler);
      start = end;
    }
    return { map: 0, blocks: blocks.sort((a, b) => a.y - b.y), stand: { ...STANDS[k]!, y: HOLDER_Y + 1 } };
  });

  const lane = STANDS.map((s) => ({ ...s, y: HOLDER_Y, state: filler }));
  return { map: { name, area: { x: 0, z: 0 }, target: picture, lane }, steps };
}
