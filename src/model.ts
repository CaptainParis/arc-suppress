export const N = 128;

export type Shade = 0 | 1 | 2;

export interface Pixel {
  id: number;
  shade: Shade;
}

export type Picture = Pixel[];

export interface Block {
  x: number;
  y: number;
  z: number;
  state: string;
}

export interface Step {
  map: number;
  blocks: Block[];
  stand: { x: number; y: number; z: number };
}

export interface MapPlan {
  name: string;
  area: { x: number; z: number };
  target: Picture;
  lane: Block[];
}

export interface Part {
  map: MapPlan;
  steps: Step[];
}

export interface Schematic {
  maps: MapPlan[];
  steps: Step[];
}
