import { N } from "./model.ts";

export const STANDS = Array.from({ length: 74 }, (_, k) => ({ x: 107 + 2 * k, z: 64 }));

export function writes(hx: number, hz: number, x: number, z: number): boolean {
  const q = (x - hx) ** 2 + (z - hz) ** 2;
  return q < N * N && (q <= 126 * 126 || ((x + z) & 1) === 1);
}

export const PHASE = new Int16Array(N * N).fill(-1);
STANDS.forEach((s, k) => {
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) if (writes(s.x, s.z, x, z)) PHASE[x + N * z] = k;
});

export const CELLS = STANDS.map((_, k) => [...PHASE.keys()].filter((i) => PHASE[i] === k));
