import type { Pixel } from "./model.ts";

const TABLE: [string, number, number, number, string[]][] = [
  ["NONE", 0, 0, 0, ["glass", "glass_pane", "iron_bars", "chain", "end_rod", "ladder", "rail", "powered_rail", "detector_rail", "activator_rail", "lever", "torch", "wall_torch", "soul_torch", "soul_wall_torch", "redstone_wire", "repeater", "comparator", "tripwire_hook", "tripwire", "flower_pot", "cake"]],
  ["GRASS", 127, 178, 56, ["grass_block", "slime_block"]],
  ["SAND", 247, 233, 163, ["sand", "suspicious_sand", "sandstone", "sandstone_slab", "cut_sandstone", "cut_sandstone_slab", "smooth_sandstone", "smooth_sandstone_slab", "chiseled_sandstone", "candle", "ochre_froglight", "glowstone", "end_stone", "end_stone_bricks", "end_stone_brick_slab", "bone_block", "scaffolding", "birch_log", "stripped_birch_log", "birch_wood", "stripped_birch_wood", "birch_planks", "birch_slab", "birch_pressure_plate", "turtle_egg"]],
  ["WOOL", 199, 199, 199, ["mushroom_stem", "cobweb", "white_candle"]],
  ["FIRE", 255, 0, 0, ["redstone_block", "tnt", "lava", "fire"]],
  ["ICE", 160, 160, 255, ["ice", "packed_ice", "blue_ice", "frosted_ice"]],
  ["METAL", 167, 167, 167, ["iron_block", "heavy_weighted_pressure_plate", "lodestone", "pale_oak_leaves", "anvil", "lantern", "closed_eyeblossom"]],
  ["PLANT", 0, 124, 0, ["oak_leaves", "spruce_leaves", "birch_leaves", "jungle_leaves", "acacia_leaves", "dark_oak_leaves", "azalea_leaves", "flowering_azalea_leaves", "bamboo_block[axis=x]", "cactus", "sugar_cane", "fern", "short_grass", "tall_grass", "vine", "pink_petals", "wildflowers"]],
  ["SNOW", 255, 255, 255, ["white_wool", "white_carpet", "white_concrete", "white_concrete_powder", "white_glazed_terracotta", "white_stained_glass", "snow_block", "snow", "powder_snow"]],
  ["CLAY", 164, 168, 184, ["clay"]],
  ["DIRT", 151, 109, 77, ["dirt", "coarse_dirt", "granite", "granite_slab", "polished_granite", "polished_granite_slab", "packed_mud", "jungle_log", "stripped_jungle_log", "jungle_wood", "stripped_jungle_wood", "jungle_planks", "jungle_slab", "jungle_pressure_plate", "brown_mushroom_block", "rooted_dirt", "hanging_roots"]],
  ["STONE", 112, 112, 112, ["cobblestone", "cobblestone_slab", "mossy_cobblestone", "mossy_cobblestone_slab", "stone", "stone_slab", "stone_pressure_plate", "smooth_stone", "smooth_stone_slab", "stone_bricks", "stone_brick_slab", "mossy_stone_bricks", "mossy_stone_brick_slab", "cracked_stone_bricks", "chiseled_stone_bricks", "andesite", "andesite_slab", "polished_andesite", "polished_andesite_slab", "gravel", "coal_ore", "copper_ore", "iron_ore", "gold_ore", "redstone_ore", "lapis_ore", "emerald_ore", "diamond_ore", "pale_oak_log[axis=x]", "pale_oak_wood", "acacia_log[axis=x]"]],
  ["WATER", 64, 64, 255, ["water", "oak_leaves[waterlogged=true]", "spruce_leaves[waterlogged=true]", "birch_leaves[waterlogged=true]", "jungle_leaves[waterlogged=true]", "acacia_leaves[waterlogged=true]", "dark_oak_leaves[waterlogged=true]", "mangrove_leaves[waterlogged=true]", "cherry_leaves[waterlogged=true]", "pale_oak_leaves[waterlogged=true]", "azalea_leaves[waterlogged=true]", "flowering_azalea_leaves[waterlogged=true]", "ice"]],
  ["WOOD", 143, 119, 72, ["oak_wood", "stripped_oak_wood", "oak_log", "stripped_oak_log", "oak_planks", "oak_slab", "oak_pressure_plate", "crafting_table", "bookshelf", "note_block", "daylight_detector", "composter", "beehive", "barrel", "petrified_oak_slab", "dead_bush"]],
  ["QUARTZ", 255, 252, 245, ["quartz_block", "smooth_quartz", "smooth_quartz_slab", "chiseled_quartz_block", "quartz_pillar", "quartz_slab", "diorite", "diorite_slab", "polished_diorite", "polished_diorite_slab", "sea_lantern", "target", "pale_oak_log", "stripped_pale_oak_log", "pale_oak_planks", "pale_oak_slab", "pale_oak_pressure_plate", "stripped_pale_oak_wood", "birch_log[axis=x]"]],
  ["COLOR_ORANGE", 216, 127, 51, ["orange_wool", "orange_carpet", "orange_concrete", "orange_concrete_powder", "orange_glazed_terracotta", "orange_stained_glass", "orange_candle", "acacia_log", "stripped_acacia_log", "stripped_acacia_wood", "acacia_planks", "acacia_slab", "acacia_pressure_plate", "terracotta", "pumpkin", "carved_pumpkin", "jack_o_lantern", "red_sand", "red_sandstone", "red_sandstone_slab", "cut_red_sandstone", "cut_red_sandstone_slab", "smooth_red_sandstone", "smooth_red_sandstone_slab", "chiseled_red_sandstone", "honey_block", "honeycomb_block", "raw_copper_block", "waxed_copper_block", "waxed_cut_copper", "waxed_cut_copper_slab", "open_eyeblossom"]],
  ["COLOR_MAGENTA", 178, 76, 216, ["magenta_wool", "magenta_carpet", "magenta_concrete", "magenta_concrete_powder", "magenta_glazed_terracotta", "magenta_stained_glass", "magenta_candle", "purpur_block", "purpur_pillar", "purpur_slab"]],
  ["COLOR_LIGHT_BLUE", 102, 153, 216, ["light_blue_wool", "light_blue_carpet", "light_blue_concrete", "light_blue_concrete_powder", "light_blue_glazed_terracotta", "light_blue_stained_glass", "light_blue_candle", "soul_fire"]],
  ["COLOR_YELLOW", 229, 229, 51, ["yellow_wool", "yellow_carpet", "yellow_concrete", "yellow_concrete_powder", "yellow_glazed_terracotta", "yellow_stained_glass", "yellow_candle", "bamboo_block", "bamboo_planks", "sponge", "wet_sponge", "hay_block", "bee_nest"]],
  ["COLOR_LIGHT_GREEN", 127, 204, 25, ["lime_wool", "lime_carpet", "lime_concrete", "lime_concrete_powder", "lime_glazed_terracotta", "lime_stained_glass", "lime_candle", "melon"]],
  ["COLOR_PINK", 242, 127, 165, ["pink_wool", "pink_carpet", "pink_concrete", "pink_concrete_powder", "pink_glazed_terracotta", "pink_stained_glass", "pink_candle", "brain_coral_block", "pearlescent_froglight", "cherry_leaves"]],
  ["COLOR_GRAY", 76, 76, 76, ["gray_wool", "gray_carpet", "gray_concrete", "gray_concrete_powder", "gray_glazed_terracotta", "gray_stained_glass", "gray_candle", "tinted_glass", "acacia_wood"]],
  ["COLOR_LIGHT_GRAY", 153, 153, 153, ["light_gray_wool", "light_gray_carpet", "light_gray_concrete", "light_gray_concrete_powder", "light_gray_glazed_terracotta", "light_gray_stained_glass", "light_gray_candle", "pale_moss_block", "pale_moss_carpet"]],
  ["COLOR_CYAN", 76, 127, 153, ["cyan_wool", "cyan_carpet", "cyan_concrete", "cyan_concrete_powder", "cyan_glazed_terracotta", "cyan_stained_glass", "cyan_candle", "prismarine", "prismarine_slab", "sculk_sensor", "warped_roots", "nether_sprouts", "twisting_vines", "warped_fungus"]],
  ["COLOR_PURPLE", 127, 63, 178, ["purple_wool", "purple_carpet", "purple_concrete", "purple_concrete_powder", "purple_glazed_terracotta", "purple_stained_glass", "purple_candle", "bubble_coral_block", "mycelium", "amethyst_block", "chorus_plant", "chorus_flower"]],
  ["COLOR_BLUE", 51, 76, 178, ["blue_wool", "blue_carpet", "blue_concrete", "blue_concrete_powder", "blue_glazed_terracotta", "blue_stained_glass", "blue_candle", "tube_coral_block"]],
  ["COLOR_BROWN", 102, 76, 51, ["brown_wool", "brown_carpet", "brown_concrete", "brown_concrete_powder", "brown_glazed_terracotta", "brown_stained_glass", "brown_candle", "dark_oak_log", "stripped_dark_oak_log", "dark_oak_wood", "stripped_dark_oak_wood", "dark_oak_planks", "dark_oak_slab", "dark_oak_pressure_plate", "spruce_log[axis=x]", "soul_sand", "soul_soil", "brown_mushroom", "leaf_litter"]],
  ["COLOR_GREEN", 102, 127, 51, ["green_wool", "green_carpet", "green_concrete", "green_concrete_powder", "green_glazed_terracotta", "green_stained_glass", "green_candle", "moss_block", "moss_carpet", "dried_kelp_block", "sea_pickle"]],
  ["COLOR_RED", 153, 51, 51, ["red_wool", "red_carpet", "red_concrete", "red_concrete_powder", "red_glazed_terracotta", "red_stained_glass", "red_candle", "fire_coral_block", "bricks", "brick_slab", "nether_wart_block", "nether_wart", "red_mushroom_block", "red_mushroom", "shroomlight", "mangrove_log", "stripped_mangrove_log", "mangrove_wood", "stripped_mangrove_wood", "mangrove_planks", "mangrove_slab", "mangrove_pressure_plate", "sniffer_egg"]],
  ["COLOR_BLACK", 25, 25, 25, ["black_wool", "black_carpet", "black_concrete", "black_concrete_powder", "black_glazed_terracotta", "black_stained_glass", "black_candle", "obsidian", "crying_obsidian", "coal_block", "blackstone", "polished_blackstone", "polished_blackstone_pressure_plate", "polished_blackstone_bricks", "ancient_debris", "netherite_block", "basalt", "polished_basalt", "smooth_basalt", "sculk", "sculk_catalyst", "sculk_shrieker", "sculk_vein"]],
  ["GOLD", 250, 238, 77, ["gold_block", "light_weighted_pressure_plate", "raw_gold_block", "bell"]],
  ["DIAMOND", 92, 219, 213, ["diamond_block", "prismarine_bricks", "dark_prismarine", "beacon", "conduit"]],
  ["LAPIS", 74, 128, 255, ["lapis_block"]],
  ["EMERALD", 0, 217, 58, ["emerald_block"]],
  ["PODZOL", 129, 86, 49, ["podzol", "spruce_log", "stripped_spruce_log", "spruce_wood", "stripped_spruce_wood", "spruce_planks", "spruce_slab", "spruce_pressure_plate", "oak_log[axis=x]", "jungle_log[axis=x]", "mangrove_roots", "muddy_mangrove_roots", "campfire", "soul_campfire", "mangrove_log[axis=x]"]],
  ["NETHER", 112, 2, 0, ["netherrack", "nether_bricks", "nether_brick_slab", "cracked_nether_bricks", "chiseled_nether_bricks", "red_nether_bricks", "red_nether_brick_slab", "nether_gold_ore", "nether_quartz_ore", "magma_block", "crimson_roots", "crimson_fungus", "weeping_vines"]],
  ["TERRACOTTA_WHITE", 209, 177, 161, ["white_terracotta", "calcite", "cherry_log", "cherry_planks", "cherry_slab", "cherry_pressure_plate"]],
  ["TERRACOTTA_ORANGE", 159, 82, 36, ["orange_terracotta", "redstone_lamp", "resin_block", "resin_bricks", "resin_brick_slab", "resin_clump[down=true]"]],
  ["TERRACOTTA_MAGENTA", 149, 87, 108, ["magenta_terracotta"]],
  ["TERRACOTTA_LIGHT_BLUE", 112, 108, 138, ["light_blue_terracotta"]],
  ["TERRACOTTA_YELLOW", 186, 133, 36, ["yellow_terracotta"]],
  ["TERRACOTTA_LIGHT_GREEN", 103, 117, 53, ["lime_terracotta"]],
  ["TERRACOTTA_PINK", 160, 77, 78, ["pink_terracotta", "stripped_cherry_wood"]],
  ["TERRACOTTA_GRAY", 57, 41, 35, ["gray_terracotta", "cherry_wood", "tuff", "tuff_slab", "polished_tuff", "polished_tuff_slab", "tuff_bricks", "tuff_brick_slab", "chiseled_tuff", "chiseled_tuff_bricks", "cherry_log[axis=x]"]],
  ["TERRACOTTA_LIGHT_GRAY", 135, 107, 98, ["light_gray_terracotta", "waxed_exposed_copper", "waxed_exposed_cut_copper", "waxed_exposed_cut_copper_slab", "mud_bricks", "mud_brick_slab"]],
  ["TERRACOTTA_CYAN", 87, 92, 92, ["cyan_terracotta", "mud"]],
  ["TERRACOTTA_PURPLE", 122, 73, 88, ["purple_terracotta", "purple_shulker_box"]],
  ["TERRACOTTA_BLUE", 76, 62, 92, ["blue_terracotta"]],
  ["TERRACOTTA_BROWN", 76, 50, 35, ["brown_terracotta", "dripstone_block", "pointed_dripstone"]],
  ["TERRACOTTA_GREEN", 76, 82, 42, ["green_terracotta"]],
  ["TERRACOTTA_RED", 142, 60, 46, ["red_terracotta", "decorated_pot"]],
  ["TERRACOTTA_BLACK", 37, 22, 16, ["black_terracotta"]],
  ["CRIMSON_NYLIUM", 189, 48, 49, ["crimson_nylium"]],
  ["CRIMSON_STEM", 148, 63, 97, ["crimson_stem", "stripped_crimson_stem", "crimson_planks", "crimson_slab", "crimson_pressure_plate"]],
  ["CRIMSON_HYPHAE", 92, 25, 29, ["crimson_hyphae", "stripped_crimson_hyphae"]],
  ["WARPED_NYLIUM", 22, 126, 134, ["warped_nylium", "waxed_oxidized_copper", "waxed_oxidized_cut_copper", "waxed_oxidized_cut_copper_slab", "oxidized_copper", "oxidized_cut_copper", "oxidized_cut_copper_slab"]],
  ["WARPED_STEM", 58, 142, 140, ["warped_stem", "stripped_warped_stem", "warped_planks", "warped_slab", "warped_pressure_plate", "waxed_weathered_copper", "waxed_weathered_cut_copper", "waxed_weathered_cut_copper_slab"]],
  ["WARPED_HYPHAE", 86, 44, 62, ["warped_hyphae", "stripped_warped_hyphae"]],
  ["WARPED_WART_BLOCK", 20, 180, 133, ["warped_wart_block"]],
  ["DEEPSLATE", 100, 100, 100, ["deepslate", "cobbled_deepslate", "cobbled_deepslate_slab", "polished_deepslate", "deepslate_bricks", "deepslate_brick_slab", "deepslate_tiles", "deepslate_tile_slab", "chiseled_deepslate", "cracked_deepslate_bricks", "cracked_deepslate_tiles", "deepslate_coal_ore", "deepslate_copper_ore", "deepslate_iron_ore", "deepslate_gold_ore", "deepslate_redstone_ore", "deepslate_lapis_ore", "deepslate_emerald_ore", "deepslate_diamond_ore"]],
  ["RAW_IRON", 216, 175, 147, ["raw_iron_block"]],
  ["GLOW_LICHEN", 127, 167, 150, ["verdant_froglight", "glow_lichen[down=true]"]],
];

const WATER = 12;
const SHADES = [180, 220, 255];

export function parseState(state: string): { name: string; props: Record<string, string> } {
  const m = /^(?:minecraft:)?([a-z0-9_]+)(?:\[([a-z0-9_=,]*)\])?$/.exec(state.trim());
  if (m === null) throw new Error(`"${state}" is not a block`);
  const props: Record<string, string> = {};
  for (const pair of (m[2] ?? "").split(",").filter(Boolean)) {
    const [k, v] = pair.split("=");
    if (k === undefined || v === undefined) throw new Error(`"${state}" is not a block`);
    props[k] = v;
  }
  return { name: `minecraft:${m[1]}`, props };
}

export function normalState(state: string): string {
  const { name, props } = parseState(state);
  const keys = Object.keys(props).sort();
  return keys.length === 0 ? name : `${name}[${keys.map((k) => `${k}=${props[k]}`).join(",")}]`;
}

export const COLOURS = TABLE.map(([name, r, g, b, blocks], id) => ({ id, name, rgb: [r, g, b], blocks: blocks.map(normalState) }));

const COLOUR_OF = new Map<string, number>();
for (const c of COLOURS) {
  for (const b of c.blocks) {
    if (!COLOUR_OF.has(b)) COLOUR_OF.set(b, c.id);
    if (b.includes("[axis=x]")) {
      const z = b.replace("[axis=x]", "[axis=z]");
      if (!COLOUR_OF.has(z)) COLOUR_OF.set(z, c.id);
    }
  }
}

export function colourOf(state: string): number {
  return COLOUR_OF.get(state) ?? COLOUR_OF.get(state.replace(/\[.*$/, "")) ?? -1;
}

export function pixelRgb(p: Pixel): [number, number, number] {
  const m = SHADES[p.shade]!;
  const rgb = COLOURS[p.id]!.rgb;
  return [Math.floor((rgb[0]! * m) / 255), Math.floor((rgb[1]! * m) / 255), Math.floor((rgb[2]! * m) / 255)];
}

const FALLING = new Set(["sand", "red_sand", "suspicious_sand", "gravel", "anvil", "pointed_dripstone", "scaffolding"]);
const NOT_PLACEABLE = new Set(["lava", "fire", "soul_fire", "frosted_ice", "powder_snow"]);
const NOT_FULL = new Set([
  "snow", "cobweb", "candle", "turtle_egg", "sniffer_egg", "sea_pickle", "lantern", "bell", "conduit", "glow_lichen", "resin_clump",
  "decorated_pot", "cactus", "sugar_cane", "fern", "short_grass", "tall_grass", "vine", "pink_petals", "wildflowers", "leaf_litter",
  "hanging_roots", "open_eyeblossom", "closed_eyeblossom", "daylight_detector", "composter", "beacon", "campfire", "soul_campfire",
  "sculk_sensor", "sculk_shrieker", "sculk_vein", "nether_wart", "brown_mushroom", "red_mushroom", "crimson_roots", "warped_roots",
  "nether_sprouts", "crimson_fungus", "warped_fungus", "twisting_vines", "weeping_vines", "dead_bush", "chorus_plant", "chorus_flower",
]);
const NOT_FULL_ENDS = ["_slab", "_carpet", "_pane", "_pressure_plate", "_candle", "_leaves"];
const CHANGES = new Set([
  "grass_block", "mycelium", "crimson_nylium", "warped_nylium", "dirt", "ice",
  "brain_coral_block", "bubble_coral_block", "fire_coral_block", "tube_coral_block",
]);

export function blockProblem(state: string): string | undefined {
  const id = colourOf(state);
  if (id < 0) return "is not a known block";
  if (id === 0) return "has no map colour";
  if (id === WATER) return "shows water";
  const bare = parseState(state).name.slice("minecraft:".length);
  if (FALLING.has(bare) || bare.endsWith("_concrete_powder")) return "falls";
  if (NOT_PLACEABLE.has(bare)) return "cannot be placed as a block";
  if (NOT_FULL.has(bare) || NOT_FULL_ENDS.some((e) => bare.endsWith(e))) return "is not a full, stable block";
  if (CHANGES.has(bare)) return "changes by itself";
  return undefined;
}

export function defaultBlock(id: number): string | undefined {
  return COLOURS[id]?.blocks.find((b) => colourOf(b) === id && blockProblem(b) === undefined);
}

export const BUILDABLE = COLOURS.map((c) => c.id).filter((id) => defaultBlock(id) !== undefined);
