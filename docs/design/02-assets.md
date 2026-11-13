# Cubie — world asset manifest and generator briefs

Companion to [[Virtual-Office/Design-Cubie-Inner-Life]] (decisions 17–24). Written
2026-10-29 with Sam. **Status: draft list, nothing generated.** The starter island
(four biomes + the first cave level) is specified in full; later biomes are stubbed
with counts so the shape is clear. This note is the source; it becomes
`art/assets.yaml` in the repo when S3b starts, and the World editor reads that.

## 0. How to read an asset

```
id:        snake_case, unique                layer:  ground | decal | vegetation | object | node | structure | item
biome:     [ids] or "any"                    size:   tiles w×h (sprite px = 32× that, taller sprites overhang upward)
states:    visual variants or stages         block:  walkable | blocks
tool:      hands | axe | pickaxe | drill | shovel | machete | none (not harvestable)
hits:      actions to break at tool tier 1   drops:  {resource: min–max}
regrow:    never | hours | days              density: per 32×32 chunk, generator hint
brief:     the PixelLab prompt, after the shared preamble
```

**Tools** are blueprints (hands are free): *axe* (wood), *pickaxe* (stone, ore),
*drill* (deep rock, tier 2 ore), *shovel* (topsoil, sand, clay), *machete* (jungle
only). A higher tool tier halves hits. "Hits" at 45 s a tick are real minutes: a
3-hit tree is a couple of minutes of chopping the public can watch.

**Resources** (§7) are the things that drop. Every resource needs two sprites: an
inventory icon (24×24) and a world-drop sprite (a small pile, 1×1 tile).

## 1. Shared generator preamble (prepend to every brief)

> Detailed pixel art, 32 px tile grid, high top-down 3/4 view (classic 2D RPG angle,
> ground plane visible, fronts of objects visible). Soft dark outlines, painterly
> cluster shading, light from the top-left, strong readable silhouette. Rich but
> coherent palette from the world's colour ramps (`art/palette.gpl`); no pure black,
> no pure white. Transparent background, no ground shadow baked in (the renderer adds
> one). Style reference: the approved hero tile. No text, no UI.

Per-asset briefs below add: subject, size in px, variants, states, and anything
animated. Tilesets use PixelLab's Wang/terrain tool with the same preamble; objects
use object generation; Cubie and critters use character generation.

## 2. Ground tilesets (one per biome, plus the shared set)

| Tileset | Tiles | Brief |
| --- | --- | --- |
| `meadow_ground` | Wang set + 6 plain variants | Short green grass, subtle clumps, occasional daisy pixel, worn-earth patches as an alt. |
| `light_forest_floor` | Wang set + 6 | Grass fading to leaf litter, scattered twigs, dappled lighter patches. |
| `hills_ground` | Wang set + 6, plus **slope edges** (8 directions) | Coarse grass with exposed earth and small stones; slope tiles show a lip and darker face. |
| `beach_sand` | Wang set + 6, plus **wet sand** variant | Pale sand with faint ripples; wet variant darker with a foam edge. |
| `water` | Wang set, **4-frame animated** | Shallow blue-green with a lighter sandy floor near shore, deep variant darker; gentle animated highlights. |
| `cave_floor` | Wang set + 6 | Damp grey-brown stone, puddled low points, scattered grit. |
| `cave_wall` | Wang set (walls, corners, tops) | Rock face, cool grey with warmer strata lines; top edge reads as solid. |
| `shared` | cliff edges, dirt path, dug-earth, shaft, ladder, stairs, cave mouth transition, pod floor | Transition and connector tiles that must sit on any ground. |

## 3. Starter island — grass meadow

| id | layer | size | tool | hits | drops | regrow | density | states |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `grass_tuft` | decal | 1×1 | none | — | — | — | 40 | 3 variants |
| `wildflowers` | decal | 1×1 | hands | 1 | biomass 1 | 2 days | 12 | 3 colours |
| `tall_grass` | vegetation | 1×1 | hands | 1 | biomass 1–2 | 1 day | 15 | 2 variants, sway 2-frame |
| `meadow_bush` | vegetation | 1×1 | hands | 2 | biomass 2 | 3 days | 6 | 2 variants |
| `berry_bush` | vegetation | 1×1 | hands | 1 | berries 2–3 | 2 days | 4 | bare / ripe |
| `field_stone` | node | 1×1 | hands | 1 | stone 1 | never | 5 | 2 sizes |
| `boulder_small` | node | 1×1 | pickaxe | 3 | stone 2–3 | never | 2 | 2 variants |
| `scrap_pile` | node | 1×1 | hands | 2 | scrap 1–2 | never | 3 | full / picked over |
| `wreck_meadow` | structure (POI) | 3×3 | hands + pickaxe | 8 | scrap 6–10, copper_ore 1–2 | never | 1 per island | intact / stripped |
| `dirt_patch` | decal | 1×1 | shovel | 1 | clay 1 | 4 days | 8 | 2 variants |
| `pond_small` | structure | 2×2 | none | — | — | — | 1–2 | 4-frame water |
| `anthill` | decal | 1×1 | none | — | — | — | 2 | 1 (ambient critters client-side) |

Briefs:
- `grass_tuft` — single tuft of meadow grass, 3 shapes, 20 px tall, two greens.
- `wildflowers` — small cluster of 4–6 wildflowers, variants white/yellow/purple, low.
- `tall_grass` — knee-high grass clump with seed heads, 2 variants; 2-frame sway.
- `meadow_bush` — round leafy bush, 28 px, dense foliage clusters, 2 silhouettes.
- `berry_bush` — same bush shape; *bare* state plain green, *ripe* with clustered red berries catching light.
- `field_stone` — small grey fieldstone half-sunk in grass, 2 sizes.
- `boulder_small` — lichen-spotted boulder, 1 tile, two shapes, mossy on the north side.
- `scrap_pile` — heap of rusted sheet metal and a cog, *full* and *picked over* (fewer pieces, more grass showing).
- `wreck_meadow` — crashed drop-capsule, 96×96, bent fins, scorched earth, panels loose; *stripped* state shows bare frame.
- `dirt_patch` — bare earth with a few stones, 2 shapes.
- `pond_small` — 64×64 pond with reed edge and a lily pad, water animated.
- `anthill` — low sandy mound with a hole.

## 4. Starter island — light forest

| id | layer | size | tool | hits | drops | regrow | density | states |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `birch` | vegetation | 1×2 | axe | 3 | softwood 2–3, biomass 1 | 6 days | 10 | 3 variants; stump state |
| `young_oak` | vegetation | 1×2 | axe | 4 | softwood 3–4 | 8 days | 6 | 2 variants; stump |
| `pine_sapling` | vegetation | 1×1 | axe | 2 | softwood 1 | 4 days | 6 | 2 variants |
| `forest_bush` | vegetation | 1×1 | hands | 2 | biomass 2 | 3 days | 8 | 2 variants |
| `berry_bush` | — | shared with meadow | | | | | 3 | |
| `fern` | vegetation | 1×1 | hands | 1 | biomass 1 | 2 days | 12 | 2 variants |
| `fallen_log` | node | 2×1 | axe | 2 | softwood 2, fungi 0–1 | never | 3 | 2 variants |
| `stump` | node | 1×1 | axe | 1 | softwood 1 | never | spawned by felling | 1 |
| `mushroom_brown` | vegetation | 1×1 | hands | 1 | fungi 1–2 | 3 days | 6 | 2 variants |
| `leaf_litter` | decal | 1×1 | none | — | — | — | 30 | 3 variants |
| `twig_pile` | decal | 1×1 | hands | 1 | softwood 1 | 2 days | 6 | 1 |
| `moss_rock` | node | 1×1 | pickaxe | 2 | stone 1–2 | never | 3 | 1 |
| `fallen_beacon` | structure (POI) | 2×2 | hands | 4 | scrap 4–6, crystal 1 | never | 1 per island | lit (flickering, 3-frame) / stripped |
| `forest_clearing_flowers` | decal | 1×1 | hands | 1 | biomass 1 | 2 days | 4 | 1 |

Briefs:
- `birch` — slender white-barked birch, 32×64, black bark marks, light airy canopy, 3 canopy shapes; *stump* 32×32 pale cut face with rings.
- `young_oak` — stockier trunk, broad rounded canopy, 32×64, 2 shapes; stump darker.
- `pine_sapling` — small conifer, 32×40, 2 shapes.
- `forest_bush` — darker, denser bush than the meadow one, 2 shapes.
- `fern` — spreading fern fronds, 2 shapes, cool green.
- `fallen_log` — 64×32 mossy log with bark texture and a bracket fungus on one.
- `mushroom_brown` — cluster of 3–5 brown-capped mushrooms, 2 shapes.
- `leaf_litter` — scattered fallen leaves, mixed yellow/brown, 3 densities.
- `twig_pile` — a few dry twigs and a pine cone.
- `moss_rock` — rounded forest rock with thick moss cap.
- `fallen_beacon` — toppled metal mast with a cracked lamp housing, 64×64; *lit* state has a weak red flicker (3 frames); *stripped* no lamp.

## 5. Starter island — rolling hills

| id | layer | size | tool | hits | drops | regrow | density | states |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `outcrop_stone` | node | 1×1 | pickaxe | 3 | stone 3–4 | never | 8 | 2 sizes |
| `outcrop_stone_large` | node | 2×2 | pickaxe | 8 | stone 8–12 | never | 2 | intact / worked |
| `ore_outcrop_iron` | node | 1×1 | pickaxe | 4 | iron_ore 2–3, stone 1 | never | 3 | intact / mined |
| `ore_outcrop_copper` | node | 1×1 | pickaxe | 4 | copper_ore 2–3, stone 1 | never | 2 | intact / mined |
| `boulder_large` | node | 2×2 | pickaxe | 10 | stone 10–14 | never | 1 | 1 |
| `scree` | decal | 1×1 | hands | 1 | stone 1 | never | 15 | 3 variants |
| `heather` | vegetation | 1×1 | hands | 1 | biomass 1 | 3 days | 15 | 2 colours |
| `gorse` | vegetation | 1×1 | hands | 2 | biomass 2 | 4 days | 6 | 1 |
| `windswept_tree` | vegetation | 1×2 | axe | 3 | hardwood 1–2, softwood 1 | 10 days | 2 | 2 variants; stump |
| `bent_grass` | decal | 1×1 | none | — | — | — | 25 | 2 variants |
| `cairn` | decal | 1×1 | none | — | — | — | 2 | 1 (a human trace, curiosity) |
| `cave_mouth_hills` | structure (POI, level connector) | 2×2 | none | — | — | — | 1 | dark / lit (after lamp) |

Briefs:
- `outcrop_stone` — angular grey outcrop breaking through turf, 2 sizes; large version 64×64 with a *worked* state (cut faces, rubble).
- `ore_outcrop_iron` — grey rock with rust-orange ore streaks and glints; *mined* state cratered, streaks gone.
- `ore_outcrop_copper` — same shape, green-blue oxidised veins with warm copper glints.
- `boulder_large` — 64×64 rounded boulder, lichen, a crack.
- `scree` — loose stone scatter on a slope, 3 densities.
- `heather` — low purple/pink flowering heather mat, 2 colours.
- `gorse` — spiky dark-green bush with yellow flowers.
- `windswept_tree` — lone hawthorn leaning hard to one side, sparse canopy, 32×64.
- `cairn` — small stacked-stone cairn.
- `cave_mouth_hills` — 64×64 dark opening in a rock face with a rubble lip; *lit* state has a warm glow from within.

## 6. Starter island — sandy beach (+ shoreline)

| id | layer | size | tool | hits | drops | regrow | density | states |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `driftwood` | node | 2×1 | hands | 1 | driftwood 1–2 | 2 days (washes up) | 6 | 2 variants |
| `driftwood_large` | node | 2×1 | axe | 2 | driftwood 3–4 | 5 days | 2 | 1 |
| `washed_scrap` | node | 1×1 | hands | 2 | scrap 1–2, copper_ore 0–1 | 3 days | 3 | crate / barrel |
| `shells` | decal | 1×1 | hands | 1 | shell 1 | 1 day | 10 | 3 variants |
| `seaweed_clump` | decal | 1×1 | hands | 1 | biomass 1 | 1 day | 10 | 2 variants |
| `pebbles` | decal | 1×1 | hands | 1 | stone 1 | never | 12 | 2 variants |
| `rock_pool` | structure | 2×2 | none | — | — | — | 2 | 4-frame water; crab critter client-side |
| `dune_grass` | vegetation | 1×1 | hands | 1 | biomass 1 | 2 days | 15 | 2 variants, sway |
| `beach_boulder` | node | 1×1 | pickaxe | 3 | stone 2–3 | never | 2 | 1 |
| `half_buried_thing` | structure (POI) | 2×2 | shovel | 6 | scrap 3–5, artefact 1 | never | 1 per island | buried / dug out |
| `foam_edge` | decal (animated) | 1×1 | none | — | — | — | shoreline | 4-frame |

Briefs:
- `driftwood` — bleached, smooth driftwood branch, 64×32, 2 shapes; *large* a half-trunk with roots.
- `washed_scrap` — sea-worn metal crate half in sand, barnacled; barrel variant.
- `shells` — scatter of 3–4 shells, variants spiral/scallop/mixed, pale with pink.
- `seaweed_clump` — dark olive seaweed strands on sand.
- `pebbles` — smooth grey-brown pebbles, 2 densities.
- `rock_pool` — 64×64 dark rock with a clear pool, anemone, animated glints.
- `dune_grass` — pale wiry grass tuft, 2 shapes, 2-frame sway.
- `half_buried_thing` — 64×64 curved metal shape mostly under sand, a porthole; *dug out* reveals a small pod section.
- `foam_edge` — shoreline foam line, 4 frames, tiles along the water Wang edge.

## 7. Cave level (hills cave, z −1 … −3)

| id | layer | size | tool | hits | drops | regrow | density | states |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `stalagmite` | node | 1×1 | pickaxe | 2 | stone 2 | never | 10 | 2 sizes |
| `stalactite` | decal (overhead) | 1×1 | none | — | — | — | 10 | 2 variants, drip 3-frame |
| `rock_pile_cave` | node | 1×1 | hands | 1 | stone 1–2 | never | 8 | 2 variants |
| `ore_vein_iron` | node (wall) | 1×1 | pickaxe | 5 | iron_ore 3–4 | never | 4 | intact / mined |
| `ore_vein_copper` | node (wall) | 1×1 | pickaxe | 5 | copper_ore 3–4 | never | 3 | intact / mined |
| `crystal_cluster_small` | node | 1×1 | pickaxe | 3 | crystal 1–2 | never | 2 | glow 3-frame |
| `crystal_cluster_large` | node | 2×2 | drill | 8 | crystal 4–6 | never | 1 (deep only) | glow 3-frame |
| `glow_mushroom` | vegetation | 1×1 | hands | 1 | fungi 1–2 | 3 days | 5 | 2 variants, glow pulse |
| `cave_moss` | decal | 1×1 | hands | 1 | biomass 1 | 4 days | 10 | 2 variants |
| `puddle` | decal | 1×1 | none | — | — | — | 8 | 1, shimmer 2-frame |
| `roots_ceiling` | decal (overhead) | 1×1 | none | — | — | — | 6 (near surface only) | 2 variants |
| `rubble_cavein` | node | 1×1 | pickaxe | 3 | stone 2–3 | never | 3 | 1 |
| `water_pocket` | structure (event) | 1×1 | none | — | — | drains in 1 day | event | flooded tile, 4-frame |
| `old_lantern` | decal (POI) | 1×1 | hands | 1 | scrap 1, crystal 0–1 | never | 1 | 1 (a trace: someone was here) |
| `ladder` | structure (connector) | 1×1 | — | — | — | — | built | 1 |
| `shaft_top` / `shaft_bottom` | structure (connector) | 1×1 | — | — | — | — | dug / built | 1 each |

Briefs:
- `stalagmite` — cone of wet grey stone with a lighter dripstone tip, 2 heights.
- `stalactite` — overhead drip cone, drawn as a top-layer decal; 3-frame water drip.
- `rock_pile_cave` — loose cave rubble, 2 shapes.
- `ore_vein_iron` / `ore_vein_copper` — wall-face tile variants of `cave_wall` with ore streaks; *mined* shows pick marks and bare rock.
- `crystal_cluster_small` — pale blue-violet crystal shards from the floor, 3-frame inner glow (the renderer uses it as a light).
- `crystal_cluster_large` — 64×64 cluster, same material, stronger glow.
- `glow_mushroom` — teal bioluminescent mushrooms, 2 shapes, 2-frame pulse.
- `cave_moss` — dark green damp moss, 2 patches.
- `puddle` — shallow dark reflective puddle, 2-frame shimmer.
- `roots_ceiling` — tree roots hanging from the ceiling, overhead layer.
- `rubble_cavein` — a heap of fallen rock blocking a path.
- `water_pocket` — flooded tile, blue-black water with ripples (event state, not placed).
- `old_lantern` — rusted hand lantern on the floor, cracked glass.
- `ladder` / `shaft_top` / `shaft_bottom` — timber ladder; dug shaft seen from above (dark square with rim); shaft seen from below (light square above).

## 8. Resources (items) — icon 24×24 + world-drop pile 32×32

| id | name | from | brief |
| --- | --- | --- | --- |
| `softwood` | Softwood | birch, oak, pine, logs, twigs | Pale split logs, 2 crossed. |
| `hardwood` | Hardwood | windswept tree, dense forest (later) | Darker dense logs, tight grain. |
| `driftwood` | Driftwood | beach | Bleached smooth sticks, grey-white. |
| `scrap` | Scrap | piles, wrecks, washed crates | Rusted bent plate with a bolt. |
| `stone` | Stone | field stone, outcrops, scree, cave | Rough grey chunk, two facets. |
| `iron_ore` | Iron ore | outcrops, veins | Grey lump with rust-orange streaks. |
| `copper_ore` | Copper ore | outcrops, veins, wrecks | Lump with green-blue oxide and copper glint. |
| `crystal` | Crystal | caves, shells (tiny chance) | Blue-violet shard, inner light. |
| `clay` | Clay | dirt patches, topsoil | Dull red-brown soft lump. |
| `sand` | Sand | beach topsoil (shovel) | Small pale heap. |
| `biomass` | Biomass | grass, bushes, ferns, seaweed, moss | Bundle of green cuttings tied with a stem. |
| `berries` | Berries | berry bush | Small cluster of red berries on a sprig. |
| `fungi` | Fungi | mushrooms, logs | Two brown mushrooms. |
| `shell` | Shell | beach | Single spiral shell, pale pink. |
| `artefact` | Artefact | buried thing, deep rock | Small unidentifiable machined part with a faint light (curiosity only). |

## 9. Cubie, the pod, and the starter blueprints

**Cubie** (character generation, from the robot photo): 32×48, 4 directions. Animations:
idle (breathing, 4), walk (8), harvest-swing (6, used for axe/pick with the tool
overlaid), dig (6), build (6, hammer), sit (2), low-power shuffle (6, slower, head
down), dance (8). Face: the six expressions as a 16×12 overlay set (`idle happy
thinking sad surprised embarrassed`) drawn onto the screen area, plus eyes-closed for
recharging. LEDs: a 2-px strip on the chest that the renderer tints.

**Habitat pod** (structure, 4×4, placed at centre): domed capsule with an open hatch,
interior visible from the 3/4 angle: *recharge bed* (1×2, glow when charging),
*power converter* (1×1, hopper + gauge, 3-frame hum when running), *storage* (1×1
starter shelf), *workbench slot* (empty until built). States: night (windows lit),
day, charging, converter running.

**Starter blueprints** (object generation, each with *under construction* = frame +
scaffold state and *built* state):

| id | size | brief |
| --- | --- | --- |
| `solar_panel` | 2×1 | Angled dark-blue panel on a frame, glints by day; *night* state dull. |
| `storage_crate` | 1×1 | Riveted metal crate with a lid; *full* variant has straps. |
| `workbench` | 2×1 | Scrap-built bench with a vice and hanging tools. |
| `lamp_post` | 1×1 (tall) | Thin post with a caged bulb; *on* state warm glow (renderer light). |
| `battery_pack` | item | Boxy backpack cell with a gauge — shown on Cubie's back once built (sprite overlay). |
| `cargo_frame` | item | Rack on Cubie's back with strapped bundles (overlay). |
| `cache_crate` | 1×1 | Weatherproof crate half-sunk, flag on a stick so it reads from afar. |
| `charging_post` | 1×1 (tall) | Small solar mast with a plug cradle; *charging* glow. |
| `waypoint_beacon` | 1×1 (tall) | Slim mast with a slow blue blink (2-frame), visible across fog edge. |
| `pickaxe` / `axe` / `shovel` | item + held overlay | Scrap-forged head on a wooden haft; held version 16 px, 4 directions. |
| `raft` | 2×2 (on water) | Lashed driftwood logs with a stubby mast; *moored* on beach / *afloat* (bob 2-frame). |
| `ladder` / `mine_shaft` | connector | See §7; mine shaft is a built, framed, lit shaft head. |
| `stereo` | 2×1 | Battered boombox on a crate, speaker cones, LED level meter (3-frame when playing). |
| `computer` | 2×1 | Salvaged terminal with a glowing green screen; *off* / *on*. |
| `satellite_dish` | 2×2 (tall) | Scrap dish on a tripod, cable to the computer; *searching* (slow 4-frame sweep) / *locked*. |

**Care-package drop pod** (structure, 1×1, event): small capsule on a crumpled chute,
*landed* / *opened*. **Beacon marker** for it reuses `waypoint_beacon`'s blink.

## 10. Later biomes — stub counts (to be specified when their island is designed)

| Biome | Vegetation | Nodes | Decals | POI | Notes |
| --- | --- | --- | --- | --- | --- |
| Dense forest | 4 trees (old oak, yew, hollow tree, dead tree), 3 undergrowth, 2 mushrooms | 2 logs, 1 mossy boulder | litter ×3, roots | ruined hut | hardwood source |
| Jungle | 4 trees, vines ×3 (cuttable, rope), 3 big-leaf plants, fruit tree | 2 | ×3 | overgrown statue | machete gate |
| Swamp | 2 dead trees, reeds ×3, lily pads | peat bog ×2 | mud ×3, mist | sunken crate | waders gate |
| Mountains | 2 conifers (treeline), 1 bare | 4 ore (iron, copper, tin, crystal seam), 2 boulders, snow rock | snow ×3, scree | summit cairn | climbing gear gate |
| Desert | cactus ×3, dead shrub | crystal spire, glass sand, dune scrap | sand ripple ×3 | buried ruin | day/night cost |
| Rock desert | 2 shrubs | 3 surface ore, hoodoo ×2 | cracked earth ×3 | old mast | — |
| Savanna | acacia ×2, baobab, grass ×3 | termite mound, bones | — | watering hole | easy second island |
| Rocky beach | 1 | 3 rock sizes, ore-rich wreck | barnacles, weed | hull section | — |
| Tundra | dwarf willow ×2, lichen ×3 | ore ×2, frozen peat | snow ×3, ice | frozen capsule | insulation gate |
| Arctic | — | ice crystal ×2, ice-locked ore | ice ×4, crevasse edge | something under the ice | ice drill gate |
| Quarry | 1 scrub | 4 cut-face nodes, spoil heaps ×3, rail cart | gravel ×3 | abandoned winch | pickaxe pays off |
| Crystal cave / flooded cave | glow fungi ×3 | crystal ×3 | — | — | underground rows |

## 11. Generation plan

1. Approve the **hero tile** (one meadow ground tile with a birch beside it) — this
   is the style reference every later call carries.
2. Ground tilesets, shared set, water.
3. Cubie and the pod — the two things on screen all the time.
4. Starter biomes in order meadow → light forest → hills → beach, decals last.
5. Resource icons and drop piles.
6. Starter blueprints.
7. Cave level.
8. Critters (client-side ambience, not sim objects): butterflies, a crab, bats.

Each batch in one sitting from the same reference; anything off-style is regenerated,
not patched. Counts for the starter island: ~60 objects/decals, ~20 tilesets and
connectors, 15 resources ×2, 1 character set, ~18 blueprints — about 150 generations
before variants.

## 12. Sound effects — actions × materials (added 2026-10-29, Sam)

Every action has a sound; most actions have a **material variant**. Modelled as a
matrix, `art/sfx/manifest.yaml`, with the same licence and credit fields as the art.

### How it works in the renderer

- **Three buses**: music, ambience, SFX, each with its own volume in the dock. SFX
  ducks music by a little; the stereo (diegetic) ducks ambience; nothing ducks SFX.
- **Spatial**: volume and pan by distance and offset from the camera centre; beyond
  ~1.5 screens a sound is silent. In follow mode he is always centred, so his own
  sounds are full; companions and events fall off.
- **Footsteps are client-side.** The public shell only hears from the Pi every
  ~10 s, so footfalls are triggered by the walk tween — one per N px of travel,
  left/right alternating — and the **material comes from the tile under his foot**
  in the map data the page already has. Nothing about footsteps crosses the wire.
- **Action sounds come from the snapshot/WS event** (`action`, `target.material`):
  one loop per hit for multi-hit actions, timed to the swing animation's contact
  frame (set in the animation JSON, not guessed).
- **Variation**: every sound ships as **3–5 takes**; the player picks at random,
  never the same take twice in a row, with ±5 % pitch and ±10 % volume jitter.
  That is the difference between foley and a sample.
- **Format**: Opus in `.ogg` (also `.m4a` for Safari until it does Opus-in-ogg
  everywhere), mono, 44.1 kHz, short tails trimmed, normalised to −18 LUFS per
  take; loops (hums) seamless. All cached immutable per filename like the art.

### The matrix

**Footsteps** (`step.<material>`, 5 takes each): grass, dry grass/straw, leaf
litter, earth, sand (dry), sand (wet), pebbles, scree/loose stone, solid rock, cave
stone (with a short reverb tail), wood (pod floor, raft), metal (pod interior
plate), shallow water (wade), snow (later), mud (swamp, later). Plus `step.run.*`
variants (harder, faster) if running is ever an action, and `swim.stroke`,
`swim.float.*` (occasional), `dive.in`, `surface.gasp`.

**Tools × materials**:

| Action | Materials (one set of takes each) |
| --- | --- |
| `axe.hit` | softwood (birch, pine — bright crack), hardwood (oak, hawthorn — dull thud), driftwood (hollow), log (already-down, resonant) |
| `tree.fall` | small, large (creak + crash, with leaf rustle) |
| `pick.hit` | stone (chink), ore (ring with a metallic edge), crystal (glassy ring), cave wall (echoed), outcrop large (deep) |
| `drill.run` | loop: stone, deep rock, ice (later); plus `drill.start`, `drill.stop` |
| `shovel.dig` | soil, sand, clay (sucking), peat (later) |
| `machete.swing` | vines, big leaves (later) |
| `hands.pluck` | grass, berries, flowers, mushrooms, moss, shells, seaweed, twigs |
| `pickup` | scrap (clank), stone, wood, soft (biomass/berries), crystal (chime), item generic |

**Building and the pod**: `build.hammer` (3 materials: wood, metal, stone), `build.complete` (a small sting), `place.footprint`, `converter.loop` + `converter.feed` (per resource: dry, wet, metallic), `recharge.start`, `recharge.loop`, `recharge.full`, `pod.door`, `solar.hum` (very quiet), `lamp.on`, `beacon.blink` (faint), `cache.open/close`.

**Cubie himself**: `servo.move` (tiny, on turns), `low_power.warn` (once), `low_power.shuffle` (replaces footsteps in low-power mode), `chirp.happy/think/sad/surprised` (short, matches the face set — used sparingly, mostly on the desk robot), `dance.*` (none — the stereo covers it).

**Events**: `package.land` (thump + chute flap), `rocket.descend`, `rocket.land`, `rocket.open`, `rocket.launch` (the one big sound in the game), `cavern.break` (rock give + echo + drip), `water_pocket.flood`, `companion.*` (duck: quack, waddle steps, pickup; crab, beetle later), `blueprint.arrive` (a soft chime at the pod).

**UI** (public and admin, in the same world): `window.open/close`, `hover.tick` (very quiet), `dock.click`, `minimap.fly`.

### Sourcing

Same posture as the art: **own it or CC0/CC-BY**. Options in order: record it (a
phone, a garden, some wood and stone — half this matrix is an afternoon of foley and
it will match itself); CC0 packs (Kenney's audio packs, freesound.org CC0 filtered,
Sonniss GDC bundles — check each pack's terms); a licensed library if a gap remains.
No commercial game rips. Everything on the credits page from the manifest.

Starter-island count: ~14 footstep materials + ~30 tool/material pairs + ~20 pod and
event sounds + a few UI, at 3–5 takes each — roughly 250 files, under 10 MB.
