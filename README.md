# arc-suppress

arc-suppress makes one `.nbt` schematic of map art from PNG images.
The schematic uses curved suppress steps.
You can put more than one map in one schematic.

## Requirements

- Node.js 26 or later, to make schematics.
- Minecraft Java Edition 1.21.11 and Litematica, to build them.

## Prepare the image

1. Use a PNG image.
2. Use map colours in the image. A map art tool can do this for you.
3. Make the width and the height multiples of 128. One map is 128 x 128 pixels.
4. Do not use transparent pixels.
5. Do not use an interlaced PNG.

If a pixel is not a map colour, the tool uses the nearest map colour.
Water colours are excluded. I do not want to build water.
Crimson nylium is excluded. It turns into netherrack when a block is on top of it.

## Make a schematic

```
node src/cli.ts build picture.png
```

The tool writes `out/picture.nbt`. It writes no other files.

An image of 256 x 256 pixels gives 4 maps in one schematic.
Each map has its own map area.
In grid mode, the tool puts more than one image next to each other, from west to east.

To use only some maps of an image, give their row and column.
Row 0 is at the top of the image. Column 0 is at the left.

```
node src/cli.ts build picture.png --tiles r0c0,r0c1
```

The tool writes `out/picture-r0c0-r0c1.nbt`.

To build more than one map on one map area, use chain mode:

```
node src/cli.ts build a.png b.png c.png --mode chain
```

The tool writes `out/a-chain.nbt`.

## Options

| Option | Function |
|---|---|
| `--tiles r0c0,r1c0` | Use only these maps of the image. Use this option with one image only. |
| `--mode grid` | Put each map on its own map area. This is the default. |
| `--mode chain` | Put all maps on one map area. The steps of the maps alternate. |
| `--split N` | Write one file for every N maps. Example: `--split 18` makes files that end in `-1.nbt`, `-2.nbt` and so on. |
| `--block COLOUR=BLOCK` | Use this block for this map colour. Example: `--block COLOR_BLACK=black_concrete`. You can give this option more than one time. |
| `--filler BLOCK` | Use this block for supports and stand blocks. The default is `cobblestone`. |
| `--out FILE` | Write to this file. If FILE does not end in `.nbt`, the tool adds `.nbt`. If FILE is a folder or ends in `/`, the tool writes into the folder. |

## How the schematic works

Each map has 74 steps. Each step has 3 layers of blocks, above the layers of the step before it.
You do not remove blocks. Each map has a line of stand blocks on the ground, one stand for each step.

1. Load the schematic in Litematica. Do not rotate or mirror it.
2. Put the schematic origin at x = 128a - 64, z = 128b - 65, where a and b are whole numbers.
   Then each map area is on the area of a map item.
   Example: for the map area around x = 0, z = 0, put the origin at x = -64, z = -65.
3. Put the origin at Y = -63 or higher. The origin Y plus the height of the schematic must not be more than 320.
4. Build the steps from the bottom up.
5. After each step, stand on the stand block of that step.
6. Hold the map in your hand until it does not change.

In the schematic, the first map area starts at x = 0, z = 1.
For one map, the stand block of step k (the first step is 0) is at x = 107 + 2k, y = 0, z = 65.

In grid mode, the tool lifts some maps above the maps north of them.
In chain mode, the tool lifts each map above the map before it.
The tool makes sure that the result is correct. It tests each build with the game's map rules.
It also tests the build with a printer that places blocks up to 6 blocks away.

## Limits

- A schematic must not be more than 383 blocks high. In a world, you can put blocks from Y = -63 to Y = 319.
- One map is 225 blocks high or less.
- A chain can have approximately 18 maps.
- Each row of a grid adds approximately 18 blocks of height.

## Tests

```
npm install
npm test
```
