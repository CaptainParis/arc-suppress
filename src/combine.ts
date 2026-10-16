import { N, type Block, type Part, type Schematic, type Step } from "./model.ts";
import { check } from "./sim.ts";

const MAX_HEIGHT = 383;
const GAP = 3;

export type Mode = "grid" | "chain";

export interface Planned extends Part {
  col: number;
  row: number;
}

function place(p: Planned, index: number, mode: Mode, dy: number): Part {
  const dx = mode === "grid" ? p.col * N : 0;
  const dz = mode === "grid" ? p.row * N : 0;
  const move = (b: Block, lift: number): Block => ({ ...b, x: b.x + dx, y: b.y + lift, z: b.z + dz });
  return {
    map: { ...p.map, area: { x: dx, z: dz }, lane: p.map.lane.map((b) => move(b, 0)) },
    steps: p.steps.map((s) => ({ map: index, blocks: s.blocks.map((b) => move(b, dy)), stand: { ...s.stand, x: s.stand.x + dx, z: s.stand.z + dz } })),
  };
}

function assemble(parts: Part[], mode: Mode): Schematic {
  const maps = parts.map((p) => p.map);
  if (mode === "grid") return { maps, steps: parts.flatMap((p) => p.steps) };
  const steps: Step[] = [];
  const end = Math.max(...parts.map((p, j) => p.steps.length + GAP * j));
  for (let t = 0; t < end; t++) {
    parts.forEach((p, j) => {
      const step = p.steps[t - GAP * j];
      if (step !== undefined) steps.push(step);
    });
  }
  return { maps, steps };
}

export function blocksOf(s: Schematic): Block[] {
  const out: Block[] = [];
  const seen = new Set<string>();
  const started = new Set<number>();
  const add = (b: Block): void => {
    const key = `${b.x},${b.y},${b.z}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(b);
  };
  for (const step of s.steps) {
    if (!started.has(step.map)) {
      started.add(step.map);
      s.maps[step.map]!.lane.forEach(add);
    }
    step.blocks.forEach(add);
  }
  return out;
}

export function heightOf(s: Schematic): number {
  let low = Infinity;
  let high = -Infinity;
  for (const b of [...s.maps.flatMap((m) => m.lane), ...s.steps.flatMap((t) => t.blocks)]) {
    low = Math.min(low, b.y);
    high = Math.max(high, b.y);
  }
  return high - low + 1;
}

export function combine(planned: Planned[], mode: Mode): { schematic: Schematic; order: Planned[]; dys: number[] } {
  const order = mode === "grid" ? [...planned].sort((a, b) => a.row - b.row || a.col - b.col) : planned;
  const dys: number[] = [];
  order.forEach((p, j) => {
    const near = order.slice(0, j).map((_, i) => i).filter((i) => mode === "chain" || (Math.abs(order[i]!.col - p.col) <= 1 && Math.abs(order[i]!.row - p.row) <= 1));
    const north = near.filter((i) => order[i]!.col === p.col).map((i) => dys[i]!);
    for (let dy = mode === "chain" ? (dys[j - 1] ?? 0) : Math.max(0, ...north); ; dy++) {
      const s = assemble([...near.map((i, k) => place(order[i]!, k, mode, dys[i]!)), place(p, near.length, mode, dy)], mode);
      if (heightOf(s) > MAX_HEIGHT) throw new Error(`${p.map.name} does not fit: the build would be more than ${MAX_HEIGHT} blocks high`);
      if (check(s) === undefined) {
        dys.push(dy);
        return;
      }
    }
  });
  const schematic = assemble(order.map((p, i) => place(p, i, mode, dys[i]!)), mode);
  const problem = check(schematic);
  if (problem !== undefined) throw new Error(`the build does not work: ${problem}`);
  return { schematic, order, dys };
}
