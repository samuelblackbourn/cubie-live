# Cubie — resources, tools, weapons and companions

Companion to [[Virtual-Office/Design-Cubie-Inner-Life]] and
[[Virtual-Office/Design-Cubie-Assets]]. Written 2026-10-29 with Sam. **Status: full
catalogue, draft numbers.** Everything here becomes rows in `world/resources.json`,
`world/tools.json` and `world/actors.json`; the sim reads rows, never names.

> **One thing to settle first.** Decision 39 says *no combat, ever*: no weapons, no
> hostile wildlife, danger is power and distance. Sam has now asked for weapons with
> damage and defence. §3 below is written so both readings work: every "weapon" is
> a tool with a *force* score (what it breaks) and a *deter* score (what it scares
> off), and "defence" is *protection* against the environment (cold, heat, rockfall,
> water), not hit points. If Sam wants real combat — hostile animals, damage to
> Cubie — that reverses 39 and needs a ruling on what happens when he loses, since
> the world has never been allowed to strand or kill him. **Sam to confirm.**

## 1. Resources

Every resource: `{id, category, display, sources, biomes, rarity, converts_to_power?,
stack}`. **Category** is what blueprint costs name; **display** is what the Journal
and toasts name. Rarity: C common, U uncommon, R rare, X very rare.

### 1.1 Wood (category `softwood` / `hardwood` / `driftwood`)

| id | display | category | source (tool) | biomes | rarity |
| --- | --- | --- | --- | --- | --- |
| birch | Birch | softwood | birch tree (axe) | light forest | C |
| ash | Ash | softwood | ash tree (axe) | light forest, hills edge | C |
| pine | Pine | softwood | pine (axe) | light forest, mountains treeline | C |
| willow | Willow | softwood | willow (axe), dwarf willow (hands) | lake shore, tundra | U |
| oak | Oak | hardwood | oak (axe) | light forest (young), dense forest (old) | C/U |
| hawthorn | Hawthorn | hardwood | windswept tree (axe) | hills | U |
| yew | Yew | hardwood | yew (axe) | dense forest | U |
| ironwood | Ironwood | hardwood | jungle hardwood (axe II) | jungle | R |
| mangrove | Mangrove | hardwood | mangrove (axe), roots (hands) | swamp coast | U |
| deadwood | Deadwood | softwood | dead tree (axe), logs (axe) | swamp, dense forest, anywhere as logs | C |
| driftwood | Driftwood | driftwood | beach (hands/axe) | sandy/rocky beach | C |
| charcoal | Charcoal | fuel | kiln (building) from any wood | — | made |

### 1.2 Stone and minerals (category `stone`, `flint`, `glass`)

| id | display | category | source (tool) | biomes | rarity |
| --- | --- | --- | --- | --- | --- |
| fieldstone | Fieldstone | stone | field stone (hands), outcrops (pick) | meadow, hills | C |
| limestone | Limestone | stone | hills outcrops, quarry faces (pick) | hills, quarry | C |
| granite | Granite | stone | boulders, mountain faces (pick) | hills, mountains | U |
| sandstone | Sandstone | stone | rock desert, cliffs (pick) | rock desert, rocky beach | C |
| slate | Slate | stone | shale beds (pick) | quarry, hills | U |
| basalt | Basalt | stone | deep rock, ocean caves (pick/drill) | deep rock, ocean cave | U |
| flint | Flint | flint | chalk/limestone beds (pick), beach pebbles (hands, rare) | hills, beach | U |
| obsidian | Obsidian | flint | deep rock, rock desert (drill) | deep rock, rock desert | R |
| pebbles | Pebbles | stone | beach (hands) | beaches, lake shore | C |
| glass_sand | Glass sand | glass | desert, beach (shovel) | desert, beach | U |

### 1.3 Ores and metals (category `iron`, `copper`, `tin`, `bright`)

| id | display | category | source (tool) | biomes | rarity |
| --- | --- | --- | --- | --- | --- |
| iron_ore | Iron ore | iron | outcrops, veins (pick), ore vein deep (drill) | hills, cave, mountains, quarry | C/U |
| copper_ore | Copper ore | copper | outcrops, veins, wrecks (pick) | hills, cave, mountains, rock desert | U |
| tin_ore | Tin ore | tin | veins (pick II) | mountains, deep rock | U |
| bright_ore | Bright ore | bright | deep veins, under ice (drill) | deep rock, arctic | R |
| scrap | Scrap | iron (×½) | piles, wrecks, washed crates (hands/pick) | meadow, beach, anywhere wrecks | C |
| wire | Wire | copper (×½) | wrecks, washed crates (hands) | beach, meadow wreck | U |
| ingot_* | Iron / copper / tin / bright ingot | metal | smelter (building) from ore + charcoal | — | made |

### 1.4 Crystals (category `crystal`)

| id | display | source (tool) | biomes | rarity |
| --- | --- | --- | --- | --- |
| blue_crystal | Blue crystal | clusters (pick), large (drill) | cave, deep rock | U/R |
| sun_crystal | Sun crystal | desert spires (pick) | desert | R |
| ice_crystal | Ice crystal | ice (ice drill) | arctic, ice cave | R |
| quartz | Cave quartz | cave walls (pick) | cave, quarry | U |
| shell | Shell | beach (hands) — *crystal ×⅒ when crushed* | beaches | C |

### 1.5 Soils (category `clay`, `sand`, `peat`, `mud`)

| id | display | source (tool) | biomes |
| --- | --- | --- | --- |
| clay | Clay | dirt patches, topsoil, lake bed (shovel) | meadow, lake, swamp |
| sand | Sand | beach, desert (shovel) | beaches, desert |
| peat | Peat | bog (shovel) — *burns well in the converter* | swamp, tundra |
| mud | Mud | swamp (shovel) — bricks when dried | swamp |
| gravel | Gravel | quarry, scree (shovel) | quarry, hills |

### 1.6 Plants (category `biomass`, `food`, `fibre`, `fungi`)

| id | display | category | source (tool) | biomes |
| --- | --- | --- | --- | --- |
| grass | Grass cuttings | biomass | grass, tufts (hands) | meadow, savanna |
| leaves | Leaves | biomass | bushes, canopy (hands) | forests |
| moss | Moss | biomass | rocks, cave (hands) | forest, cave |
| lichen | Lichen | biomass (slow) | rocks (hands) | tundra, mountains |
| seaweed | Seaweed | biomass | shore, shallows (hands/swim) | beach, shallow ocean |
| kelp | Kelp | biomass, fibre | ocean (swim) | ocean |
| reeds | Reeds | fibre | lake, swamp (hands) | lake, swamp |
| vines | Vines | fibre (→ rope) | jungle (machete) | jungle |
| bark | Bark | fibre | trees (hands, before felling) | forests |
| berries | Berries | food (power snack) | berry bush (hands) | meadow, forest |
| fruit | Fruit | food (big snack) | fruit tree (hands) | jungle |
| nuts | Nuts | food | oak, hazel (hands, autumn) | forests |
| mushroom | Mushroom | fungi | brown mushrooms (hands) | forest |
| glow_fungus | Glow fungus | fungi (light!) | caves (hands) | cave |
| bracket_fungus | Bracket fungus | fungi | logs (hands) | forest |
| seeds | Seeds | seed | any plant (hands, rare), catalogue | — |
| flowers | Flowers | biomass (+contentment) | meadow (hands) | meadow |

### 1.7 Animal-shed (never the animal) (category `feather`, `shell`, `silk`, `honey`, `antler`)

| id | display | from (species named by Cubie) | biomes |
| --- | --- | --- | --- |
| feather | Feather | the gull-thing, moths (large) | beach, cave |
| moult_shell | Moult shell | the crab-thing, the armoured grazer | beach, meadow |
| antler | Antler | the hare-thing (seasonal drop) | hills, savanna |
| honey | Honey (food, +contentment) | hive (needs smoke: a tool) | forest, jungle |
| silk | Silk (fibre) | the cave spinner's old webs | cave |
| dung | Dung (fuel, fertiliser) | grazers | meadow, savanna |

### 1.8 Salvage (category `salvage`)

| id | display | source | rarity |
| --- | --- | --- | --- |
| glass_shard | Glass shard | wrecks, washed crates | U |
| circuit | Circuit board | wrecks, buried pod, deep rock artefacts | R |
| lens | Lens | catalogue only; rare wreck | X |
| motor | Motor | catalogue; deep wreck | X |
| speaker_cone | Speaker cone | catalogue; wreck | R |
| battery_cell | Battery cell | wrecks, catalogue | R |
| artefact | Artefact | buried, deep rock, ocean cave — *curiosity only, Journal* | R |
| cloth | Cloth | drop-pod chutes, wrecks | U |

### 1.9 Made intermediates (buildings produce them)

rope (fibre), charcoal (kiln), ingots (smelter), bricks (mud/clay + kiln), glass (glass
sand + kiln), planks (sawbench), fuel cell (biomass/peat + converter), lamp oil
(fungi + press), cable (copper + cloth).

**Power conversion** (converter): biomass 1, peat 3, charcoal 4, dung 2, fuel cell 8,
berries/fruit eaten directly (small/big). Nothing else converts.

## 2. Tools

Every tool: `{id, tier, actions, works_on, speed, force, power, reach, durability,
upgrade_to, protect, deter}`. Scores 1–5.

- **speed** — hits per tick (1 = one swing a tick, 5 = five).
- **force** — what it can break: 1 soft plants · 2 softwood/soil · 3 hardwood/stone ·
  4 ore/granite · 5 deep rock/obsidian/ice.
- **power** — cost per use (1 cheap … 5 heavy).
- **reach** — tiles (1 adjacent; 2 = across a gap or into water).
- **durability** — uses before repair (bench) or ∞.
- **protect** — environment protection it grants when held/worn (cold, heat, rockfall, water, dark).
- **deter** — scares nuisance wildlife within reach (1 none … 5 all).

| id | tier | actions | works on | speed | force | power | reach | dur | upgrade | protect | deter |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hands | 0 | pluck, pick up, push, pet, feed | plants, loose stone, scrap, animals | 2 | 1 | 1 | 1 | ∞ | — | — | 0 |
| stone_axe | I | chop, split, clear, deter | softwood, logs, bushes | 2 | 2 | 2 | 1 | 60 | iron_axe | — | 2 |
| iron_axe | II | chop, split, clear, deter | +hardwood, dense brush | 3 | 3 | 2 | 1 | 200 | bright_axe | — | 3 |
| bright_axe | III | chop, split, clear, deter | +ironwood | 4 | 4 | 2 | 1 | 600 | — | — | 3 |
| stone_pick | I | mine, chip, deter | soft stone, outcrops, shallow ore | 2 | 3 | 3 | 1 | 60 | iron_pick | rockfall 1 | 2 |
| iron_pick | II | mine, chip, deter | +granite, cave walls, veins | 3 | 4 | 3 | 1 | 200 | bright_pick | rockfall 1 | 3 |
| bright_pick | III | mine, chip, deter | +basalt, deep veins | 4 | 5 | 3 | 1 | 600 | — | rockfall 2 | 3 |
| drill | II | bore, mine (loop) | deep rock, large crystal, ice (with bit) | 5 | 5 | 5 | 1 | fuel-based | ice_bit | — | 4 (noise) |
| shovel | I | dig, fill, bury, uncover | soil, sand, clay, peat, mud, gravel | 3 | 2 | 2 | 1 | 120 | iron_shovel | — | 1 |
| machete | II | cut, clear, path | vines, big leaves, reeds, brush | 4 | 2 | 1 | 1 | 150 | — | — | 2 |
| sickle | I | reap | grass, reeds, kelp, lichen (×3 yield) | 4 | 1 | 1 | 1 | 100 | — | — | 0 |
| hammer | I | build, repair, place | structures | 3 | — | 2 | 1 | ∞ | — | — | 1 |
| saw | II | plank, section | logs → planks (×2 yield) | 2 | 2 | 2 | 1 | 150 | — | — | 0 |
| torch | I | light, scare, kindle | dark (radius 3), nuisance, kiln | — | — | 1/tick | — | burns out | lamp | dark 2 | 3 |
| lamp | II | light | dark (radius 5) | — | — | 1/4 tick | — | oil | helmet_light | dark 3 | 1 |
| helmet_light | III | light (hands-free) | dark (radius 6) | — | — | battery | — | ∞ | — | dark 3 | 1 |
| rope | I | climb, tether, lash, haul | cliffs, companions, rafts | — | — | 1 | 3 | 40 | cable | fall 2 | 0 |
| fishing_pole | II | cast, hook (shed things, flotsam only — no fish as resource in v1) | water (reach 3) | 1 | — | 1 | 3 | 100 | — | — | 0 |
| smoker | II | smoke, calm | hives, cave spinners | 1 | — | 2 | 2 | fuel | — | — | 4 (insects) |
| net | I | catch (tame assist), scoop | shallows, moths, loose items | 2 | — | 1 | 2 | 60 | — | — | 0 |
| staff | I | probe, vault, deter, steady | mud, water depth, ledges, nuisance | 2 | 1 | 1 | 2 | ∞ | — | fall 1, mud 1 | 3 |
| stone_knife | I | cut, carve, skin? (no), whittle | fibre, bark, cloth, small whittling | 5 | 1 | 1 | 1 | 80 | iron_knife | — | 1 |
| iron_knife | II | cut, carve | +rope, kelp, leather-ish shed things | 5 | 2 | 1 | 1 | 300 | — | — | 2 |

**Wearables** (not held; grant `protect`): *coat* (cloth/fibre, cold 2), *insulation
suit* (silk/cloth/peat, cold 4 — tundra gate), *shade cloak* (cloth, heat 2 — desert
by day), *waders* (mangrove/cloth, mud 3, water 1 — swamp gate), *hard hat* (iron,
rockfall 3), *climbing gear* (rope/iron, fall 4 — mountain gate), *air tank* /
*diving bell* (water-time, decision 26), *battery pack*, *solar backpack*, *cargo
frame* (decision 21).

**Multi-use is the rule**: an axe chops *and* deters (a swung axe scares a gull);
the staff is a walking aid *and* a depth probe *and* a vault; the torch lights *and*
kindles *and* scares; the pick mines *and* chips flint. The filtered menu offers
whatever the held tool's `actions` allow on what is in reach. He can carry a few
tools (tool belt blueprint raises it); swapping is free.

**Upgrading**: tiers I → II → III along the ore line (stone → iron → bright). The
workbench makes I, the smelter + bench II, the drill-press III. Durability is
repaired at the bench with a fraction of the tool's original cost; a broken tool
drops to tier 0 behaviour until repaired, never vanishes.

### 2.1 "Weapons" — the no-combat reading

If decision 39 stands, there are no weapons as a category. What a viewer would call
a weapon is a tool with high `deter` and some `protect`: the axe and pick scare,
the staff fends and steadies, the torch and smoker drive off, the hard hat and
climbing gear protect. The *scores* a weapon would carry map as:

| asked for | in this design |
| --- | --- |
| speed | `speed` |
| damage | `force` (what it breaks) + `deter` (what it scares) |
| defence | `protect` (cold / heat / rockfall / fall / mud / water / dark) |
| upgradable | tiers I–III |
| works on | `works_on` |

If 39 is reversed, the same rows gain `damage` against actors, animals gain `health`
and `hostility`, Cubie gains a `hurt` state and a recovery rule, and that is a new
design note — not a column added here.

## 3. Companions — the full list

Two families, one actor class. **Crafted** companions are reliable machines made at
the workbench from blueprints; **tamed** companions are animals (decision 40), better
but moody. Each has: jobs, a gate, a cost or a tame requirement, a quirk, and a
desk-twin note.

### 3.1 Crafted

| id | name (his to rename) | jobs | gate / cost | quirk | desk twin |
| --- | --- | --- | --- | --- | --- |
| duck | the duck | fetch nearest X (beak), follow, waddle-scout short range, pick up dropped items | workbench, iron, copper, circuit, cloth | falls over, gets up; brings things he didn't ask for | **Microduck** (if ever) |
| kite | the kite | fog reveal in a cone from wherever he stands, tethered (no body) | fibre, cloth, rope | only flies in wind (weather); tangles in forests | — |
| cart | the cart | carries cargo (big), follows on flat ground only | planks, iron, rope | stuck on slopes, hates sand | — |
| lamp_bot | the lamp | follows with a light (radius 4), charges at pod | copper, glass, battery cell | dims when he is far from home | a second StackChan face? |
| mole | the digger | digs down slowly, scouts underground one level, finds veins | iron, drill parts, circuit | noisy; wildlife flees | — |
| buoy | the buoy | floats; a rest point and cache on water; marks a dive site | driftwood, cloth, rope, battery | drifts in storms | — |
| scout_drone | the scout | fog reveal in a line, any biome, returns to pod to charge | motor (catalogue), copper, circuit, battery cell | short battery; grounded in rain | — |
| mail_drone | the postie | fetches landed rockets and packages to the pod | motor, circuit, cloth | drops things in water sometimes | — |
| planter | the planter | plants seeds, waters, harvests the garden | planks, iron, clay, copper | overwaters | — |
| weather_vane | the vane | stationary; forecasts wind/rain a day ahead (affects kite, drone, solar) | iron, copper, glass | wrong one day in five | — |
| beacon_bot | the beacon | walks to a point and becomes a waypoint beacon | iron, crystal, battery | — | — |
| mule | the mule | big cargo, slopes OK, slow, needs charging | motor, iron ×lots, battery ×2 | eats power | — |

### 3.2 Tamed (species invented; names are his when he meets them)

| sim id | silhouette + one wrong detail | biome | tameability / food | jobs when tamed | nuisance when wild |
| --- | --- | --- | --- | --- | --- |
| gull6 | gull with six legs | beaches | L2 / shells, berries | scouts a line over water and coast; carries one small item | steals a placed item |
| shorecrab | crab with a lantern claw | beach, shallows | L2 / seaweed | fetches from shallows; finds shells | pinches a cache crate open |
| hare_ant | hare with antenna ears | meadow, hills, savanna | L2 / berries, flowers | fast scout on land; warns of weather (ears) | eats berry bushes first |
| plated_grazer | slow armoured grazer | meadow, savanna | L3 / grass, lichen | carries cargo on its back; drops moult shells | tramples seedlings |
| glow_moth | moth, hand-sized, lights | cave, night forest | L2 / glow fungus, honey | lights the way underground; finds crystal | — |
| burrower | badger-shaped, three eyes | forest, hills | L3 / nuts, mushrooms | digs topsoil fast; finds buried things | undermines cache crates |
| spinner | spider-ish, soft, harmless | cave | L3 / moths? no — fungi | leaves silk; webs mark cavern edges | webs block a passage for a day |
| lake_otter | otter with a flat tail, tool-user | lake, river | L3 / fruit, nuts | dives for clay and shed things; opens shells | borrows tools |
| tide_turtle | turtle with a sail | shallow ocean, ocean | L4 / kelp | tows the raft; a floating rest point | — |
| hive_swarm | bees, slightly too big, slow | forest, jungle | L3 (smoker) / flowers | honey; pollinates the garden (yield ↑) | swarm blocks a path |
| cave_bat | bat, four wings | cave mouth | L3 / fruit | night scout; maps caverns by echo (fog reveal in cave) | — |
| snow_hound | dog-like, long, no ears | tundra, arctic | L4 / anything food | cold protection when close; pulls a sled | — |
| dune_runner | lizard with sails | desert, rock desert | L3 / sun crystal dust? no — fruit | night scout in desert; finds sun crystal | shifts a cache in sand |
| swamp_lantern | frog-ish, glows green | swamp | L2 / fungi | lights swamp paths; finds peat | — |

Rules recap: no breeding, no pens, never a resource, neglect means they leave; a
tamed animal refuses biomes it dislikes; two companions at a time to start (a
*kennel* and *charging shed* blueprint raise it).

## 4. Action list (what the filtered menu can offer)

`go, harvest/chop/mine/dig/cut/reap/pluck, pick_up, drop, place, build, repair,
convert, eat, recharge, rest, light, kindle, probe, vault, climb, swim, dive,
surface, deter (scare), feed, pet, tame_attempt, command_companion(job),
tether, cast, smoke, use_building, read_letter, write_reply, design, order,
write_diary, wish, say, wait`. Each is available only when the held tool's actions
and the target's properties allow it — the sim checks, the model chooses.

## 5. Weather (added 2026-10-29, Sam)

Weather is a sim state per day-part, forecastable a day ahead by the *weather vane*
(and the hare-thing's ears), different per biome family, and the first thing the
morning to-do prompt is told. Each row: effects on **him** (power, range, actions),
on the **environment** (resources, animals, buildings), and what the **renderer**
shows (all client-side: particles, light, sound).

| weather | biomes | on Cubie | on the environment | shown as |
| --- | --- | --- | --- | --- |
| clear | all | baseline; solar full | — | sun, long shadows at dusk |
| overcast | all | solar −40 % | — | flat light, grey sky |
| light rain | temperate | movement +10 % cost; no harvest penalty; contentment −small (he dislikes it); drone grounded | berry bushes regrow faster; puddles; lake rises a tile | rain, drips, wet tiles sheen |
| heavy rain / storm | temperate, jungle, coast | +30 % cost; cannot chop (wet, slippery); seek shelter goal; kite/drone/raft unusable; solar ~0 | rivers flood a tile either side; cache crates in low ground wet (contents safe, access blocked); gull-things vanish; a storm may wash up extra beach finds | heavy rain, wind-bent trees, lightning flash (no strike mechanics), thunder |
| fog | coast, lake, forest at dawn | fog-reveal radius halved; explore goal pauses; range maths adds a margin | — | ground fog layer, muffled ambience |
| wind | hills, coast, savanna | kite flies; walking into wind +15 %; **fire spreads** (kiln/torch near grass — see §6) | dunes shift (desert nodes move); windswept trees drop twigs | leaning grass, blown leaves, whistling |
| heat wave | desert, savanna, meadow in summer | daytime cost ×1.5; overheat condition (§6) after N ticks in sun without shade cloak; night walking preferred | berry bushes wilt (no yield); lake shrinks a tile; solar +10 % | heat shimmer, bleached light |
| cold snap | hills, tundra, arctic, any at night in winter | night cost ×2; power drains while resting outdoors; needs coat/insulation | lake freezes at the edge (walkable ice, 1 tile); peat harder (+1 hit) | frost tiles, breath puff (yes, for a robot — it's the joke) |
| snow | tundra, arctic, mountains, rare hills | +20 % cost, footsteps change; tracks (animals findable); solar −60 % | covers nodes (shovel to uncover); snow-hound active | snowfall, white tiles, muffled |
| blizzard | tundra, arctic | movement +60 %; fog-reveal 1; **forced shelter**: the planner refuses outdoor trips | buildings need the hard hat? no — buildings are fine; animals den up | whiteout, wind roar |
| sandstorm | desert, rock desert | as blizzard, with grit: tool durability −1/tick exposed | dunes move a lot; buried things surface (new finds after a storm) | brown-out, hiss |
| drought (multi-day) | savanna, meadow | — | plants stop regrowing; lake low (new shore finds); fire risk ↑ | dry palette shift |
| aurora (night event) | tundra, arctic | contentment +; curiosity + (a diary line nearly every time) | bright ore glints (findable at night) | sky ribbons, emissive |
| meteor shower (night event) | all, rare | curiosity +; a *fall* may land a salvage item (bright ore, circuit) somewhere — a beacon for the morning | — | streaks; a thump |
| rainbow (after rain) | all | contentment + | — | arc, one tick |
| eclipse (rare, scheduled) | all | solar 0 for a day-part; night rules at noon | nocturnal animals out at noon | dimmed light, confused ambience |

Weather drives the to-do lists ("storm tomorrow — get wood today"), music stems (a
storm stem, a snow stem), and the director's event shots. Forecast accuracy is
the vane's 4-in-5; without it he only knows what he can see.

## 6. Substances and hazards (added 2026-10-29, Sam)

> **How harm works without combat.** Decision 39 keeps the world from killing or
> stranding him. Hazards therefore act on three things: **power** (drain), **tools**
> (durability), and a new stat, **condition** (0–100, his body's integrity —
> corrosion, heat, grit, knocks). Low condition makes him *slow and clumsy* (speed
> down, hit counts up, occasional dropped items), face `sad`, a diary line; it never
> stops him. Condition is repaired at the pod with scrap and time (a *maintenance
> bay* blueprint makes it faster). A hazard can also **change the world** — a
> blast opens a cavern, a flood blocks a tile for a day — but never permanently
> traps him. *Proposed with this section; Sam to confirm the condition stat.*

| substance | where | on contact / exposure | on tools & buildings | can it ignite / explode | uses | how he learns (the first lesson) |
| --- | --- | --- | --- | --- | --- | --- |
| fresh water | lake, river, rain | wading/swimming per decision 26; no condition effect | wood swells (raft fine) | — | garden, kiln quench, mud bricks | the day he wades out too far |
| salt water | sea, ocean caves, tide pools | **corrosive, slow**: condition −1 per tick immersed beyond wading; power unaffected | iron tools −2 durability per tick wet; copper greens (cosmetic); buildings on beach weather faster | — | salt (a resource via evaporation pan), shells | returning from his first swim with a stiff joint |
| mud | swamp, flooded tiles | movement ×2 without waders; condition −small (grit) | shovel clogs (+1 hit) | — | bricks | "I got stuck" |
| acid water | acid pools (deep rock, some caves, a rare swamp) | **really corrosive**: condition −5 per tick in contact; tools −10 durability; the planner refuses the tile unless `protect: acid` (a later *acid suit*) | dissolves scrap left nearby | — | acid as a resource (with a clay jar): etches ore faster at the smelter | a pick dipped in it comes out pitted |
| oil / tar | tar pits (rock desert, swamp) | sticky: movement ×3, condition −small; tools fouled | — | **ignites** (torch, lightning, kiln spark): burns for a day, light radius 4, keeps burning on the tile | lamp oil, waterproofing the raft, fuel cell ×2 | the tar pit that caught from his torch |
| lava | volcanic biome (later), deep rock vents | **hot**: within 2 tiles condition −2/tick and overheat; contact = heavy condition loss, instant retreat, tools held lose 50 % durability; the planner forbids contact outright | buildings cannot be placed within 3 tiles | ignites anything flammable adjacent | obsidian at the cooled edge; a *heat exchanger* blueprint makes power from a vent | the first glimpse from the ridge: the hover card says "don't" |
| steam vents | volcanic, hot springs (hills, later) | hot: condition −1/tick on the tile; **free power** if he builds a *steam tap* | — | — | power, warmth in cold biomes (the hot spring is where he goes in winter) | — |
| methane / swamp gas | swamp, peat bogs, deep caves | **power system**: a gas pocket interferes — drain ×2 and **no recharging/converting** while inside; mild condition loss | lamps gutter; the torch is the danger | **explodes** on a naked flame: a blast — knockback 2 tiles, condition −20, held tool −50 %, the tile and neighbours cleared (a cavern *opened*, a bog *drained* for a week); never a collapse that traps | nothing in v1 (a *gas trap* blueprint later makes fuel) | the famous one: he walks into a bog with a torch |
| carbon dioxide pockets | deep caves, low points | **power system**: the converter won't run; drain ×1.5; the hover card shows "heavy air" | — | — (smothers fire) | — | the lamp that went out |
| volcanic gas (sulphur) | vents, volcanic | corrosive + hot: condition −3/tick; tools −3 | buildings corrode | ignites | sulphur resource | — |
| dust / grit (sandstorm, quarry) | desert, quarry, rock desert | condition −1/tick exposed; eyes (camera!) — fog-reveal halved | durability −1/tick exposed | — (dust explosion only with a kiln indoors: not modelled) | — | — |
| ice | arctic, frozen lake edge, ice caves | slippery: 1 in 10 moves slides one tile; cold | — | — | ice crystal, a *cold store* blueprint | the slide |
| radiation (bright ore seams, a certain artefact) | deep rock, under ice, one POI | **power system**: a *boost* — bright ore seams recharge him slowly while adjacent (the reward for going deep); but condition −1/tick if he *carries* raw bright ore without a lead-lined crate | — | — | bright ingots; the only place to charge underground | "my power went up down here" |
| glow fungus spores | caves | harmless; contentment +; a faint glow on him for a day | — | — | light source | — |
| honey / sap | hives, trees | sticky: tool −1 hit until cleaned; contentment + (food) | — | flammable (sap) | food, torch fuel | — |
| salt | evaporation pan | — | preserves (cold store), corrodes iron if stored together | — | catalogue trade item? no — a *brine* for the smelter | — |

**Fire** (from wind, tar, torch, kiln, lightning): spreads to adjacent flammable
tiles (dry grass, deadwood, peat) one tile a tick in wind, burns out in a few ticks,
leaves ash (a resource: fertiliser) and a cleared tile; buildings of wood lose
condition and need repair; nothing burns permanently and the meadow regrows. He
learns to keep the kiln on stone. A *bucket* and a *firebreak* (shovel) are the
tools; rain puts it out.

**What all of this buys the design**: hazards are *lessons* (decision 19's insight
prompts fire on every first contact), *gates* (an acid suit, a lead crate, a steam
tap are blueprints), and *events* the stream cuts to. None of them can end him; all
of them can make his week worse, which is what a diary needs.

### 6.1 Substances by biome (added 2026-10-29, Sam) — rows for `biomes.json → substances[]`

| biome | substances that may appear (density hint) |
| --- | --- |
| grass meadow | fresh water (pond, rain), honey/sap (hive, rare), fire (dry grass in drought/wind), dust (none), glow spores (none) |
| light forest | fresh water (stream), sap, honey (hives U), fire (deadwood, litter), methane (none) |
| dense forest | sap, honey, mud (hollows after rain), fire (high — deadwood), fresh water |
| jungle | fresh water (high), sap, honey (high), mud, methane (rot pockets, low), fire (low — wet) |
| swamp | mud (high), methane (high), acid water (rare pools), tar (low), fresh water, CO₂ (low points), fire (peat, in drought — smoulders for days) |
| rolling hills | fresh water (springs), dust (low), steam vents (rare hot spring), fire (gorse in drought) |
| mountains | ice (high ground), cold, steam vents (U), volcanic gas (near vents, rare), fresh water (melt), dust (scree) |
| quarry | dust (high), fresh water (flooded pit — may be acid water if ore-rich), gravel, fire (none) |
| desert | dust (high, sandstorms), heat, tar (rare), sun-crystal glare (fog-reveal −), salt (pans), fresh water (oasis, rare) |
| rock desert | dust, tar pits (U), heat, obsidian fields, volcanic gas (if a vent) |
| savanna | fire (high in drought — the one biome where wildfire is a seasonal event), dust, fresh water (watering hole), honey |
| sandy beach | salt water (high), salt (pans), tar (washed-up, rare), fresh water (none) |
| rocky beach | salt water, salt spray (corrosion even out of the water, low), tar (rare) |
| lake | fresh water (high), mud (bed), clay, methane (bed, low — bubbles when disturbed), ice (winter edge) |
| shallow ocean / ocean | salt water, kelp sap (none), CO₂ (none), cold (deep) |
| deep ocean | salt water, cold, pressure (a *condition* drain below a depth without the diving bell) |
| ocean cave | salt water, CO₂ (air pockets may be bad air: the lamp tells him), bright ore seams (radiation, rare), cold |
| tundra | cold (high), ice, peat (fire smoulders), methane (thaw pockets, U), fresh water (melt) |
| arctic | cold (very high), ice (everything), bright ore under ice (radiation, R), blizzard dust (none) |
| cave (−1…−3) | CO₂ (low points, U), methane (U), fresh water (drips, pools), acid water (rare), glow spores (U), dust (after digging) |
| deep rock (−4…−6) | CO₂ (high), methane (U), acid water (U), radiation seams (U), steam (R), lava (R, vents at the bottom), heat |
| crystal cave | glow spores (high), radiation (bright seams, U), fresh water |
| flooded cave | salt or fresh water (depends on depth/coast), CO₂ in air pockets, cold |
| volcanic (later island) | lava (high), volcanic gas (high), steam vents (high), heat, obsidian, ash, sulphur, fire |
| hot springs (later, hills/mountain sub-area) | steam vents, warm fresh water (condition *repairs* slowly here — the spa), minerals |

Rules: a substance in a biome's list can spawn there as a tile feature or an event;
the generator places them by density; a substance not on the list never appears in
that biome. Hazards on the starter island are deliberately mild — fresh water, salt
water, mud at the lake, honey, fire in a dry spell, CO₂ and methane only in the
cave's deeper pockets — so the first month teaches the three systems (power, tools,
condition) with nothing worse than a stiff joint and one memorable bang.

## 7. Buildings — the full catalogue (added 2026-10-30)

Everything he could ever build, as blueprint rows. Columns: **tier** (what the
workbench/smelter/drill-press chain can make), **size** (tiles), **cost**
(categories from §1), **requires** (building or skill prerequisite), **unlocks /
effect**, **tier gate** notes. Starter-island entries are marked ★ (P1–P4);
everything else is later content released by wishes, votes or the queue. Buildings
are also *actors* for condition (weather, salt, fire wear them; repair at the bench).

### 7.1 Shelter and the pod

| id | tier | size | cost | requires | unlocks / effect |
| --- | --- | --- | --- | --- | --- |
| ★ habitat_pod | 0 | 4×4 | — (placed) | — | bed (recharge), converter, shelf, workbench slot; interior slice |
| ★ pod_awning | I | 2×1 | cloth 2, softwood 2 | pod | shade (heat −), rain shelter at the door; contentment + |
| pod_extension | II | 2×4 | planks 8, iron 4, glass 2 | workbench, saw | +2 interior slots (stations), a window (light) |
| heater | II | 1×1 | iron 3, copper 2, stone 2 | smelter | cold protection inside the pod; peat/charcoal burner |
| cold_store | II | 1×2 | stone 4, ice or salt 2 | — | preserves food (berries don't rot); needed for the garden's surplus |
| maintenance_bay | III | 2×2 | iron 6, copper 3, circuits 1 | workbench, smelter | repairs **condition** fast; vehicles too |
| observatory_room | III | 2×2 | glass 4, iron 2 | pod_extension, telescope | interior for the telescope; a diary-line generator at night |
| guest_pod | IV | 3×3 | planks 10, cloth 4, iron 4 | pod_extension | houses two companions indoors (they stop sulking in rain) |
| second_pod (outpost base) | IV | 4×4 | stone 12, iron 8, glass 2, battery 2 | rover or long road | a full second home far away: bed, small store; the island's second centre |

### 7.2 Power

| id | tier | size | cost | requires | unlocks / effect |
| --- | --- | --- | --- | --- | --- |
| ★ solar_panel | I | 2×1 | scrap 4, copper 1, glass 1 (or shell 3) | — | store trickle by day; stackable to 6 |
| ★ charging_post | I | 1×1 | scrap 3, copper 1 | solar_panel | outpost top-up |
| battery_bank | II | 1×2 | battery cell 2, iron 2 | smelter | store capacity ×2; night runs on it |
| wind_turbine | II | 1×1 (tall) | iron 4, cloth 2, copper 2 | smelter | store by wind (weather-driven; hills/coast best) |
| water_wheel | II | 2×2 | planks 6, iron 2 | river or lake outflow | steady store, weather-proof; the first *reliable* power |
| biomass_digester | II | 2×2 | clay 4, iron 2, copper 1 | — | converts biomass/dung at ×2; makes gas (fuel) |
| kiln | II | 1×1 | stone 6, clay 2 | — | charcoal, bricks, glass; fire risk on grass (place on stone) |
| steam_tap | III | 1×1 | iron 4, copper 3, stone 2 | hot spring / vent biome | free constant power; heat nearby |
| geothermal_plant | IV | 2×2 | iron 8, copper 6, circuits 2 | steam vents ×2 | big store; a tier-V gate |
| crystal_reactor | V | 2×2 | bright ingot 4, crystal 10, circuits 3 | drill-press, radiation suit | the endgame power source; glows; the public will see it from orbit |
| power_line | III | 1×1 per tile | copper 1 | any generator | carries store between pod, outposts and buildings (so the forge can sit by the ore) |

### 7.3 Crafting and processing

| id | tier | size | cost | requires | unlocks / effect |
| --- | --- | --- | --- | --- | --- |
| ★ workbench | I | 2×1 | scrap 3, softwood 4, stone 2 | — | tier-I tools and blueprints; repairs |
| sawbench | I | 2×1 | softwood 4, scrap 2 | workbench | planks (×2 yield from logs) |
| drying_rack | I | 1×1 | softwood 3, fibre 2 | — | dries mud bricks, fungi, biomass (faster conversion) |
| rope_walk | I | 2×1 | softwood 2 | — | rope from fibre |
| smelter | II | 2×2 | stone 10, clay 4 | kiln | ingots from ore + charcoal; tier-II tools |
| forge | II | 2×1 | stone 6, iron 4 | smelter | iron/copper parts, tool heads, nails |
| glassworks | II | 1×2 | stone 4, clay 2 | kiln, sand | glass from glass sand; lenses (crude) |
| press | II | 1×1 | iron 3, stone 2 | forge | lamp oil (fungi), sap → resin, seed oil |
| loom | II | 1×2 | softwood 4, iron 1 | rope_walk | cloth from fibre/silk; wearables |
| drill_press | III | 2×1 | iron 6, copper 2, circuits 1 | forge | tier-III tools; precision parts |
| electronics_bench | III | 2×1 | copper 6, glass 2, circuits 1 | drill_press | circuits from copper + glass + crystal; repairs the phone |
| assembly_bay | IV | 3×2 | iron 10, planks 6, circuits 2 | electronics_bench | vehicles tier 3+, companions |
| printer | V | 2×1 | circuits 4, bright ingot 2 | electronics_bench, internet | fabricates catalogue parts locally at a crystal cost; closes the loop |

### 7.4 Storage and logistics

| id | tier | size | cost | requires | unlocks / effect |
| --- | --- | --- | --- | --- | --- |
| ★ storage_crate | I | 1×1 | scrap 3 (or softwood 4) | — | +capacity at the pod |
| ★ cache_crate | I | 1×1 | softwood 4, scrap 1 | — | remote stash; flag |
| ★ waypoint_beacon | I | 1×1 | scrap 2, crystal 1 | — | night route marker; fog edge visible |
| ★ lamp_post | I | 1×1 | scrap 2, copper 1, glass 1 | — | light pool; removes night penalty on lit tiles |
| silo | II | 2×2 | planks 8, iron 2 | sawbench | bulk storage for one category (stone, wood) |
| conveyor | III | 1×1 per tile | iron 2, copper 1 | forge, power_line | moves resources along tracks to the pod (a resource railway in miniature) |
| crane | III | 2×2 | iron 8, rope 4 | forge | loads vehicles/trailers in one tick |
| dock | II | 2×3 (on shore) | planks 10, rope 2, stone 4 | sawbench, raft or boat | moors boats; a beach outpost |
| lighthouse | III | 2×2 (tall) | stone 16, glass 4, copper 2, lamp | dock, lamp_post | huge night light radius on the coast; fog reveal over water; a landmark on the public map |
| bridge / plank_road / stone_road / rail | I–V | per tile | — | see decision 43 | tracks catalogue |
| mine_shaft_head | III | 2×2 | iron 6, planks 6, lamp | pickaxe, mining L2 | lit, fast vertical connector; rail start |
| mine_cart_station | V | 2×1 | iron 4 | rail | cart turnaround; auto-haul ore up a shaft |

### 7.5 Food, plants and animals (a garden, never a farm of animals)

| id | tier | size | cost | requires | unlocks / effect |
| --- | --- | --- | --- | --- | --- |
| garden_bed | I | 2×2 | softwood 4, clay 2, seeds | shovel | grows berries/fungi/reeds — a renewable resource; the planter companion tends it |
| greenhouse | III | 3×3 | glass 8, iron 4, planks 6 | glassworks | grows anything in any season/biome; a place to sit in the rain |
| beehive | II | 1×1 | planks 3, cloth 1 | smoker, flowers nearby | honey; pollination (garden yield ↑) |
| compost | I | 1×1 | softwood 2 | — | biomass → fertiliser; garden yield ↑ |
| water_butt | I | 1×1 | scrap 3 (or clay 4) | — | collects rain; waters the garden in drought |
| well | II | 1×1 | stone 8, rope 2 | shovel, topsoil water | fresh water anywhere inland |
| feeding_station | II | 1×1 | planks 3 | animals L1 | wildlife visits; tame progress without chasing them |
| kennel / roost / pond_pen | II | 2×2 | planks 6, cloth 2 | animals L2 | a tamed animal's home: it stops leaving; raises companion count |
| salt_pan | I | 2×2 | clay 4 | beach | salt from seawater (cold store, brine) |

### 7.6 Knowledge, signal and the outside world

| id | tier | size | cost | requires | unlocks / effect |
| --- | --- | --- | --- | --- | --- |
| ★ computer | II | 2×1 | scrap 6, copper 4, glass 1, circuits 1 | workbench | the terminal; prerequisite for most of this table |
| ★ satellite_dish | III | 2×2 (tall) | scrap 8, copper 6, iron 4, circuits 1 | computer, electronics_bench | `internet` (read-only web reader) |
| satellite_phone | III | item | circuits 2, copper 4, battery cell 1, cloth 1 | satellite_dish | `phone` — his own social account (ruling 56) |
| radio_receiver | II | 1×1 | copper 4, scrap 2, crystal 1 | computer | one-way: the creator can leave him a recorded message; weather "forecast" improves |
| weather_station | II | 1×1 (tall) | iron 3, copper 2, glass 1 | — | the vane with numbers: forecast 2 days, 4-in-5 → 9-in-10 |
| telescope | III | 1×2 | glass 4 (lens), iron 3 | glassworks or catalogue lens | `look_up`: a nightly line about the sky; fog reveal from high ground ×2 |
| landing_pad | II | 3×3 | stone 9, scrap 4, beacon | workbench | rockets land here; letters (decision 30) |
| mailbox | II | 1×1 | scrap 3, planks 2 | landing_pad | he writes the creator a letter; read in the admin |
| drafting_table | III | 2×1 | planks 4, glass 1 | computer | he composes merch designs (decision 34) |
| library_shelf | II | 1×2 | planks 6 | pod_extension | stores his lessons as "books"; reflection prompt gets a bigger window |
| museum_case | II | 1×1 | glass 2, planks 2 | — | displays an artefact; curiosity +; public hover shows the Journal entry |
| sign_post | I | 1×1 | softwood 2 | — | he names a place (a prompt); the name shows on the map |
| flag_pole | I | 1×1 (tall) | softwood 3, cloth 1 | — | a flag he designs (drafting table later); a landmark |

### 7.7 Comfort, play and expression (the stuff that makes him *him*)

| id | tier | size | cost | requires | unlocks / effect |
| --- | --- | --- | --- | --- | --- |
| ★ stereo | II | 2×1 | scrap 4, copper 3, speaker cone 1 | computer | `music` (local library; dance) |
| bench_seat | I | 2×1 | softwood 4 | — | rest spot away from the pod (slower drain than standing) |
| campfire | I | 1×1 | stone 4, softwood 2 | — | warmth, light, a place to "sit and think" (reflection prompt early); fire risk |
| hammock | I | 2×1 | cloth 2, rope 2, two trees | loom | a nap in the forest: rest without the pod |
| hot_tub | III | 2×2 | planks 6, stone 4, heater | heater, water | condition repairs slowly; contentment ++; the public's favourite building |
| viewing_platform | II | 2×2 (tall) | planks 10, rope 2 | sawbench | fog reveal radius ×2 from it; a photo spot for the phone |
| kite_anchor | I | 1×1 | softwood 2, rope 1 | kite companion | flies the kite without holding it |
| garden_ornament / sculpture | I–III | 1×1 | anything ×5 | — | he makes a thing that does nothing; names it; contentment + (and merch) |
| mural_wall | II | 2×1 | stone 4, clay 2 | drafting_table | a pixel mural he designs; public hover shows it full-size |
| swing | I | 1×2 | rope 2, softwood 2, a tree | — | boredom −; a thing viewers click |
| guest_chair | I | 1×1 | softwood 3 | — | for a companion to sit with him (social + even alone) |

### 7.8 Exploration and the edge of the map

| id | tier | size | cost | requires | unlocks / effect |
| --- | --- | --- | --- | --- | --- |
| raft / boat / submersible | I/III/VI | on water | see decision 42 | — | vehicles catalogue |
| boat_shed | II | 3×2 (shore) | planks 12, iron 2 | dock | repairs and stores boats; weather-proof |
| diving_bell | IV | 2×2 (on water) | iron 8, glass 4, rope 6 | boat, swimming L4 | long dives without the tank at one spot |
| air_pump_station | IV | 1×1 (shore) | iron 4, copper 2 | diving_bell | air line to the bell |
| rope_bridge | II | per tile ≤ 6 | rope 2, planks 1 | rope_walk | ravines; cheaper than stone, wears in weather |
| watchtower | II | 1×1 (tall) | planks 8, rope 2 | — | fog reveal ×2 at height; a beacon for the public map |
| cable_car | V | 2 stations + line | iron 20, copper 10, motor 1 | assembly_bay, mountains | crosses a ravine or climbs a mountain with cargo |
| airship_mast | VI | 2×2 (tall) | iron 12, cloth 8, motor 1 | assembly_bay, airship | moors the airship; the island from above |

### Rules the catalogue follows

- **Tier is a chain of buildings**, not a number: workbench (I) → kiln + smelter (II)
  → forge + drill press + electronics bench (III) → assembly bay (IV) → printer /
  reactor (V) → the far things (VI). Nothing skips a rung; the creator can release
  a blueprint early but he still cannot *make* it without the chain.
- **Every building has** under-construction and built states, condition, a
  footprint, an optional interior slice (anything 2×2 or bigger may have one),
  an optional `light`, an optional emissive layer, a sound (hum/clank/none), and
  a Journal entry on first build.
- **Power buildings feed one store** per connected network (power lines); an
  unconnected generator is an outpost store of its own.
- **Interiors are where comfort lives**: the hot tub, library, observatory and
  guest pod exist so there is something to *click into* on the public map.
- **Starter set (★)** is unchanged from decision 17 plus cart and raft; this
  catalogue is the release queue the autopilot draws from in P5+ and the content
  votes pick between in P6.
