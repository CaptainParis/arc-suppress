import { N, type Block, type Schematic } from "./model.ts";
import { CELLS, writes } from "./design.ts";
import { colourOf } from "./palette.ts";

const EMPTY = -1e9;
const PRINTER_REACH = 6;

interface Column {
  ys: Map<number, string>;
  top: number;
  colour: number;
}

function key(x: number, z: number): number {
  return (x + 65536) * 131072 + z + 65536;
}

function nearTest(blocks: Block[], reach: number): (x: number, z: number) => boolean {
  const cells = new Map<number, Block[]>();
  const cell = (x: number, z: number): number => key(Math.floor(x / reach), Math.floor(z / reach));
  for (const b of blocks) {
    const list = cells.get(cell(b.x, b.z));
    if (list === undefined) cells.set(cell(b.x, b.z), [b]);
    else list.push(b);
  }
  return (x, z) => {
    for (let i = -reach; i <= reach; i += reach) {
      for (let j = -reach; j <= reach; j += reach) {
        for (const b of cells.get(cell(x + i, z + j)) ?? []) if (Math.abs(b.x - x) <= reach && Math.abs(b.z - z) <= reach) return true;
      }
    }
    return false;
  };
}

export function check(s: Schematic): string | undefined {
  return replay(s, 0) ?? replay(s, PRINTER_REACH);
}

function replay(s: Schematic, reach: number): string | undefined {
  const printer = reach === 0 ? "" : `with a printer (reach ${reach}): `;
  const columns = new Map<number, Column>();
  const at = (x: number, z: number): Column | undefined => columns.get(key(x, z));
  const views = s.maps.map(() => ({ tops: new Float64Array(N * (N + 1)).fill(EMPTY), colours: new Int32Array(N * (N + 1)) }));
  const place = (b: Block): string | undefined => {
    let col = at(b.x, b.z);
    if (col === undefined) columns.set(key(b.x, b.z), (col = { ys: new Map(), top: EMPTY, colour: 0 }));
    const old = col.ys.get(b.y);
    if (old !== undefined) return old === b.state ? undefined : `${printer}${b.state} and ${old} meet at ${b.x},${b.y},${b.z}`;
    col.ys.set(b.y, b.state);
    if (b.y > col.top) {
      col.top = b.y;
      col.colour = colourOf(b.state);
      s.maps.forEach((m, i) => {
        const x = b.x - m.area.x;
        const z = b.z - m.area.z;
        if (x < 0 || x >= N || z < -1 || z >= N) return;
        views[i]!.tops[x + N * (z + 1)] = col.top;
        views[i]!.colours[x + N * (z + 1)] = col.colour;
      });
    }
    return undefined;
  };
  const shown = s.maps.map(() => new Int32Array(N * N).fill(-1));
  const started = new Set<number>();
  const phase = s.maps.map(() => 0);
  const byY = new Map<number, { step: number; block: Block }[]>();
  if (reach > 0) {
    s.steps.forEach((step, i) => {
      for (const block of step.blocks) {
        const list = byY.get(block.y);
        if (list === undefined) byY.set(block.y, [{ step: i, block }]);
        else list.push({ step: i, block });
      }
    });
  }
  const early = new Set<Block>();
  for (const [i, step] of s.steps.entries()) {
    const map = s.maps[step.map]!;
    if (!started.has(step.map)) {
      started.add(step.map);
      for (const b of map.lane) {
        const clash = place(b);
        if (clash !== undefined) return clash;
      }
    }
    const todo = step.blocks.filter((b) => !early.has(b));
    if (reach > 0 && step.blocks.length > 0) {
      const near = nearTest(step.blocks, reach);
      for (let y = step.blocks[0]!.y; y <= step.blocks.at(-1)!.y; y++) {
        const list = (byY.get(y) ?? []).filter((p) => p.step > i && !early.has(p.block));
        byY.set(y, list);
        for (const p of list) {
          if (near(p.block.x, p.block.z)) {
            early.add(p.block);
            todo.push(p.block);
          }
        }
      }
      todo.sort((a, b) => a.y - b.y);
    }
    for (const b of todo) {
      const clash = place(b);
      if (clash !== undefined) return clash;
    }
    const st = step.stand;
    const col = at(st.x, st.z);
    if (col?.ys.has(st.y - 1) !== true || col.ys.has(st.y) || col.ys.has(st.y + 1)) {
      return `${printer}${map.name}: no room to stand at ${st.x},${st.y},${st.z}`;
    }
    const { tops, colours } = views[step.map]!;
    const hx = st.x - map.area.x;
    const hz = st.z - map.area.z;
    for (let z = 0; z < N; z++) {
      for (let x = 0; x < N; x++) {
        if (!writes(hx, hz, x, z)) continue;
        const w = x + N * (z + 1);
        shown[step.map]![x + N * z] = colours[w]! * 4 + (tops[w]! > tops[w - N]! ? 2 : tops[w] === tops[w - N] ? 1 : 0);
      }
    }
    const k = phase[step.map]!;
    phase[step.map] = k + 1;
    for (const c of CELLS[k]!) {
      const p = map.target[c]!;
      if (p.id * 4 + p.shade !== shown[step.map]![c]) return `${printer}${map.name}: pixel ${c % N},${Math.floor(c / N)} comes out wrong`;
    }
  }
  return undefined;
}
