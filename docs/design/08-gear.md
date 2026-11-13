# Cubie — gear: packs, add-ons, outfits, armour, gadgets

Companion to [[Virtual-Office/Design-Cubie-Items]] (tools §2, wearables, companions),
[[Virtual-Office/Design-Cubie-Animations]] and `docs/design/07-cubie-character.md`.
Written 2026-11-13 with the creator. **Status: proposed catalogue, draft numbers.
Nothing drawn beyond the art-02 base set** (battery pack, cargo frame, held tools).
Becomes `content/gear.json` (rows) and `world/gear.py` (the stat and slot rules); the
sim reads rows, never names.

## 0. The idea

Everything Cubie can put on, bolt on or carry, beyond the work tools in Items §2.
Some pieces just look nice; many change what he is good at. Put together, a
**loadout** turns him into a specialist for a trip: a miner, a long-range explorer,
a hauler, a swimmer, a night walker. Choosing the loadout is a real decision with a
cost, so it makes good diary lines.

Three rules carry over from the rest of the design and shape everything below:

1. **Structure in code, meaning from the model** (standing rule 8). Every ability is
   a number or a flag in a table. The model never invents a bonus. It **picks** a
   loadout from a menu the code has filtered, **names** each piece the first time he
   wears it, and **writes** about it.
2. **No combat** (decision 39). "Armour" protects against the world: rockfall, cold,
   heat, salt, stings, falls, mud and wind. It does not protect against enemies,
   because there are none. Nothing here has damage.
3. **The world can scare him, never strand or kill him** (standing rule 7). No
   piece can trap him. A piece that runs out of charge or breaks drops to its
   no-power behaviour. Rocket legs out of fuel still walk. Nothing is ever lost
   for good: a broken piece is repaired at the bench.

## 1. Slots

He has a robot body, so gear **bolts on**. Eleven slots, each holding one piece,
except `held` (two hands) and `trinket` (two charms):

| slot | where on the sprite | layer it draws on | examples |
| --- | --- | --- | --- |
| `head` | over the top of the head | `top` (new, above face) | hard hat, helmet light, sun hat |
| `antenna` | replaces/caps the antenna bobble | `top` | radio mast, weather vane tip, beacon bulb |
| `screen` | over or on the screen face | `visor` (new, above face) | visor, night lens, scanner HUD, screen skin |
| `back` | on his back | `back` (exists) | battery pack, cargo frame, jet pack, glider |
| `torso` | over the body | `outfit` (new, on the body, under arms) | coat, plating, life vest, apron |
| `arms` | over the arm pixels | `outfit` | gauntlets, grapple arm, tool arm |
| `belt` | a band at the torso's bottom edge | `outfit` | tool belt, pouches, rope coil |
| `legs` | **replaces or extends his legs** | **body variant** (see §5) | rocket legs, stilts, spring legs, treads |
| `feet` | over the foot pixels | `outfit` | snowshoes, flippers, mag boots, mud boots |
| `held` | in his hands | `held` (exists) | Items §2 tools plus held gadgets (§3.8) |
| `trinket` ×2 | none, or a pixel or two | — | lucky shell, compass, music box |

**Weight.** Every piece has a weight of 0–5. The total sets an **encumbrance**
band: light (no change), loaded (move cost +10%), heavy (+25%, no `dash`),
overloaded (cannot leave the pod). This keeps "wear everything" from being the
answer.

**Swapping** is free at the pod or at a **gear rack** blueprint built out in the
world. Anywhere else, only `held` and `trinket` swap, so loadouts are planned
before a trip. That is the decision the range maths already makes interesting.

## 2. The ability model (all code, `world/gear.py`)

A piece is a row:

```json
{ "id": "rocket_legs", "slot": "legs", "tier": "IV", "weight": 3,
  "cost": {"iron": 6, "copper": 4, "circuit": 2, "battery_cell": 2, "motor": 2},
  "requires": ["assembly_bay"], "skill": {"exploring": 3},
  "stats": {"move_mult": 0.7, "reveal": 2, "height": 10},
  "actions": ["dash", "hop"],
  "draw": {"passive": 0, "per_step": 0.2, "dash": 4},
  "blocks": ["sit", "wade", "swim", "enter_small"],
  "protect": {},
  "durability": 300, "set": "skyline",
  "look": "stilted chrome legs with ankle thrusters", "starter": false }
```

**Stats** (multipliers apply to the base numbers in `content/*.json`):

| stat | effect | stacking |
| --- | --- | --- |
| `move_mult` | power per step and time per tile (0.7 = 30% cheaper and faster) | multiply, floor 0.4 |
| `carry` | + cargo slots | add |
| `power_max` | + onboard power | add |
| `regen` | power per tick gained (solar by day, dynamo while moving, etc.) | add, with a condition |
| `reveal` | + fog reveal radius in tiles | add |
| `light` | light radius at night and underground | max (not add) |
| `yield` | × harvest yield for one domain (`yield.wood`) | multiply |
| `speed` | × action speed for one domain (`speed.mine`) | multiply |
| `xp` | × skill XP for one domain | multiply, cap ×1.5 |
| `protect.*` | cold, heat, rockfall, fall, mud, water, dark, salt, sting, wind (0–5) | max per type |
| `deter` | scares nuisance wildlife (Items §2 meaning) | max |
| `height` | sprite height change in px (legs only) | one leg kit |

**Actions** add verbs to the filtered menu while the piece is worn: `dash` (a burst
move, costs power, 3× speed for a few tiles), `hop` (cross a 1-tile gap or ledge),
`glide` (drop off a height and travel N tiles), `hover` (cross water or mud for a
few tiles, costs power), `grapple` (climb a cliff edge, pull a node closer), `scan`
(reveal resources under the fog in a radius, without walking there), `dive`,
`climb`, `float`, `ping` (mark a spot on the map), `play_music`.

**Costs are not optional.** Every strong piece has at least one of:
- a power `draw` (passive per tick, per step, or per use);
- weight;
- a `blocks` list of actions it rules out (rocket legs cannot sit, wade or fit
  through a 1-tile door);
- a weather or terrain condition (the glider needs wind; solar panels need sun;
  mag boots slow him on sand).

This keeps the survival loop honest: a loadout makes him great at one thing and
worse at another.

**Sets.** Two to four pieces from one set give a small extra, written as one row
(`sets.json`): `{"set": "skyline", "pieces": 3, "bonus": {"reveal": 2}}`. Sets are
how a specialist build feels like a build.

**Condition.** Gear wears like buildings and tools do (Items §2: weather, salt and
use). At zero condition a piece is **broken**: its stats drop to 0 and its look
gets a dent. It is never removed or lost; he repairs it at the bench.

## 3. The catalogue

★ = starter island (P1–P4); every ★ piece is tier I (workbench and salvage), because
the starter island has no smelter. Everything else is released later by wishes, votes or
the release queue (master plan §3), and needs its tier's building chain (Items §7).
Costs use Items §1 categories. Numbers are drafts for the fast-forward tuning to
move.

### 3.1 Back

| id | tier | ability | cost / downside | look |
| --- | --- | --- | --- | --- |
| ★ battery_pack | I | power_max +30 | weight 2; salvage cells from the wrecks | dark metal box, 3 teal charge bars (drawn) |
| ★ cargo_frame | I | carry +4 | weight 2 (+1 per full slot) | wooden A-frame, strapped sack (drawn) |
| solar_backpack | II | regen +0.3/tick by day, sun only | weight 1; nothing at night or under cover | fold-out panel wings |
| big_battery | III | power_max +60 | weight 4; heavy | twin cells, cables over the shoulders |
| jet_pack | IV | `hover` 6 tiles, `hop` up a level (ledge) | draw 6 per hover; weight 3 | two nozzles, flame on the emissive layer |
| glider_wings | III | `glide` 8 tiles from any height (hills, cliffs) | needs wind ≥ light; weight 1 | folded cloth wings on a rib frame |
| tank_pack | III | dive time ×2 (decision 26 air tank) | weight 3 on land | round tank, valve, hose to the screen |
| water_tank | II | carries water for the garden; `extinguish` | weight 3 when full | barrel and spout |
| parachute | II | `fall` protect 5 off cliffs | one use per deploy, repack at pod | small round pack, rip cord |
| drone_dock | III | the scout drone (Items §3.1) launches from his back | weight 2; drone shares his power | a cradle with a little drone in it |
| antenna_mast | III | `ping` and radio range: the beacon net reaches him anywhere | weight 1 | a tall telescopic mast, blinking tip |
| backpack_kitchen | II | eat cooked food on the go (×2 food power) | weight 2 | pots and pans hanging off a frame |
| snail_house | II | rest anywhere (a mini recharge at half rate) | weight 4; slow | a curly shell-shaped hut on his back |
| balloon_pack | IV | `float` over water at walking pace | needs calm weather; weight 1 | small gas balloon on a tether |

### 3.2 Legs — add-ons that change his body (the big new idea)

A leg kit is a **body variant**: it replaces model O's legs and feet, so he is
taller, shorter or differently built for every clip that shows his legs (§5). One
leg kit at a time.

| id | tier | ability | cost / downside | look |
| --- | --- | --- | --- | --- |
| stilts | II | height +6, reveal +1, wade depth +1 | move_mult 1.1; no sit; falls in wind (protect wind needed) | wooden stilt extensions strapped to his shins |
| spring_legs | III | `hop` gaps and 1-tile cliffs; move_mult 0.9 | jolty: a little extra condition wear on carried items | coil springs between knee joints and feet |
| **rocket_legs** | IV | height +10, move_mult 0.7, reveal +2, `dash`, `hop` | draw 0.2/step, 4 per dash; no sit, wade, swim or 1-tile doors; weight 3 | stilted chrome legs, ankle thrusters, flame jets while dashing |
| tread_legs | III | move_mult 0.8 on rock, sand and snow; carry +2 | slow on grass and mud (1.2); can't hop | tank treads instead of feet |
| wheel_legs | III | move_mult 0.6 on paths, tracks and flat ground | 1.4 on rough ground; slopes slow | a single wheel per leg, kickstand at rest |
| strider_legs | V | height +14, wade depth +2, reveal +3, step over 1-tile obstacles | weight 4; no indoors; wobbles in wind | tall three-jointed mech legs |
| spider_legs | V | `climb` cliffs and cave walls; no fall risk | move_mult 1.2 on flat; weight 4 | four thin legs splayed from his hips |
| hover_skirt | V | `hover` over water and mud continuously | draw 0.5/tick while hovering; weight 2 | a ring skirt with a soft glow underneath |
| flipper_legs | III | swim move_mult 0.6, dive time +50% | land move_mult 1.3 | short legs ending in big fins |
| digger_legs | IV | speed.dig ×2, dig down without a shovel | move_mult 1.2; noisy (deter 3) | shovel-blade feet with pistons |

**Rocket legs, in full** (the example the creator asked for). He clicks the kit on
at the pod. His legs extend from 6 to 16 px, and the frame grows from 48 to 64 px
tall for the leg-kit sheets (§5). Walking costs 30% less power per step and is 30%
quicker, and the extra height reveals 2 more tiles of fog. `dash` fires the ankle
thrusters: a few tiles at 3× speed for 4 power, with orange-white flame and a smoke
puff on each contact frame. `hop` clears a 1-tile gap or ledge. While they are on,
he can't sit, wade, swim or fit through 1-tile doors. Before any of those, he
retracts them first: a 4-frame `legs.retract` clip folds them down to ankle cuffs
and his normal legs come back. Out of power, the thrusters stop and he walks on
them at normal speed. The first time he dashes, he gets a discovery toast and the
diary line is his.

### 3.3 Head and antenna

| id | tier | ability | cost / downside | look |
| --- | --- | --- | --- | --- |
| ★ hard_hat | I | protect rockfall 3 | weight 1; beaten from salvage | a dented signal-orange dome |
| ★ sun_hat | I | protect heat 2 | — | wide straw brim, fibre |
| helmet_light | III | light 6 hands-free (Items §2) | battery | small lamp on a band, warm glow |
| beanie | I | protect cold 1 | — | knitted cap with a bobble that copies the antenna |
| miner_helmet | III | rockfall 4, light 5, speed.mine ×1.1 | weight 2; battery | the hard hat plus a lamp |
| goggles_up | II | protect wind 2, sand 2 | — | goggles pushed up on the head (flip to `screen`) |
| radio_mast | III | ping, hear the beacon net; weather a day early | weight 1 | tall whip aerial replacing the antenna |
| vane_tip | II | knows wind direction: glide range +2 | — | tiny weather vane on the antenna |
| beacon_bulb | II | he *is* a waypoint beacon (light 3, others find him) | draw 0.1/tick | the antenna bobble swapped for a glass bulb |
| propeller_cap | IV | `glide` with no wind; slows falls (fall 3) | draw 2 per glide | a little rotor on the antenna |
| leaf_crown | I | xp.harvesting ×1.1 | wilts (condition) | a ring of leaves; pure charm |
| crown | — | none | found, never made | a tiny tin crown from a wreck; Journal entry |

### 3.4 Screen (face accessories)

The face is his expression, so screen pieces must never hide the eyes for long.
Visors are drawn in the tint over the screen, with the eyes still showing through.

| id | tier | ability | cost / downside | look |
| --- | --- | --- | --- | --- |
| ★ sun_visor | I | protect heat 1, glare (snow/desert) | — | a dark band across the screen top |
| night_lens | III | reveal +2 at night, light 2 | draw 0.1/tick at night | green-tinted screen glass |
| scanner_hud | IV | `scan` resources under fog, radius 6, once a day | draw 5 per scan | thin grid lines over the face, sweeping bar |
| dive_mask | II | dive time +25%, underwater reveal +2 | — | a bubble glass over the screen |
| welding_mask | III | speed.build ×1.2 at the bench | blocks reveal | a hinged dark plate (flips up between welds) |
| screen_skins | — | none | cosmetic, unlocked by firsts | border patterns on the bezel (stripes, stars, a leaf) |

### 3.5 Torso, arms and belt — outfits and armour

Armour here means protection from the world (§0 rule 2).

| id | slot | tier | ability | cost / downside | look |
| --- | --- | --- | --- | --- | --- |
| ★ apron | torso | I | speed.build ×1.1 | — | canvas apron, front pocket |
| ★ rain_poncho | torso | I | protect water 2: no `wet` status in rain | weight 1 | hooded poncho over the shoulders |
| coat | torso | I | cold 2 (Items §2) | weight 1 | patched coat, big buttons |
| insulation_suit | torso | III | cold 4 (tundra gate) | weight 3 | puffy quilted suit |
| shade_cloak | torso | II | heat 2 (desert gate) | weight 1 | pale cloak with a hood |
| life_vest | torso | II | `float` (can't sink; rests in water) | weight 1; bulky | bright float vest |
| plate_armour | torso | III | rockfall 3, fall 2, sting 2 | weight 4 | riveted scrap plates over the body |
| crystal_armour | torso | V | heat 3, cold 3, light 2 (glows) | weight 3; fragile (low durability) | translucent crystal plates, glow on emissive |
| salt_wrap | torso | II | protect salt 4 (coast condition loss halved) | rewrap monthly | waxed cloth bands |
| bee_suit | torso | II | sting 5 (hives, smoker work) | weight 1 | mesh hood over the whole head |
| mud_waders | feet+legs | II | mud 3, water 1 (swamp gate, Items §2) | weight 2 | rubbery chest waders |
| gauntlets | arms | II | speed.mine ×1.15, condition loss of held tools halved | weight 1 | thick work gloves over the nubs |
| grapple_arm | arms | IV | `grapple` 5 tiles | draw 2 per grapple; weight 2 | a hook launcher on one forearm |
| tool_arm | arms | IV | holds a second tool: two `held` actions without swapping | weight 2 | a jointed extra arm from his shoulder |
| magnet_arm | arms | III | `pick_up` from 3 tiles; finds buried scrap | weight 1; drags compasses off | a horseshoe magnet on a forearm |
| ★ tool_belt | belt | I | carry tools +2 (Items §2) | — | belt with loops, a hammer hanging |
| pouch_belt | belt | I | carry +2 (small items only) | — | three pouches |
| rope_coil | belt | I | `climb` 1 ledge, `tether` | weight 1 | rope looped on the hip |
| dynamo_belt | belt | III | regen +0.1 per step while moving | weight 1 | a little geared wheel at the hip |

### 3.6 Feet

| id | tier | ability | cost / downside | look |
| --- | --- | --- | --- | --- |
| ★ boots | I | mud 1, condition loss on rock halved | — | chunky boots over the feet |
| snowshoes | II | move_mult 0.8 on snow, cold 1 | 1.2 elsewhere | wide woven ovals |
| flippers | II | swim move_mult 0.7 | land 1.3 | big rubber fins |
| mag_boots | IV | `climb` metal wrecks; no slip on ice | sand 1.3 | heavy soles with a blue glow |
| sand_skis | II | move_mult 0.7 on sand dunes | rough ground 1.3 | flat boards |
| spring_heels | III | `hop` | jolty | small coils under the heels |
| quiet_slippers | I | wildlife doesn't flee (taming +) | — | soft fabric bootees |

### 3.7 Trinkets (two at a time, mostly invisible)

| id | ability | where it comes from | look (if any) |
| --- | --- | --- | --- |
| ★ lucky_shell | contentment +2 on bad days | the beach, rare | — |
| compass | never "lost": the planner's route home is free of the fog penalty | the bench (iron, glass) | glint on the belt |
| pedometer | xp.exploring ×1.1 | bench | — |
| music_box | `play_music` anywhere (one tune); boredom −5 | the stereo chain | tiny box on the belt; notes on the emissive layer |
| pressed_flower | none; a Journal entry and a diary line | the meadow | — |
| barometer | weather a half-day early | bench | — |
| friendship_band | companion mood decays slower | the loom | a woven band on one wrist |
| fossil | curiosity +5 once; nothing after | deep strata | — |

### 3.8 Gadgets (held, or switched on)

Gadgets fill `held` like tools do (Items §2) but do a job instead of breaking
things.

| id | tier | ability | cost / downside | look |
| --- | --- | --- | --- | --- |
| ★ spyglass | I | reveal a cone of 8 tiles from a hilltop, once a tick | stand still | brass tube to the screen |
| ★ map_board | I | marks: the planner remembers spots he pins | — | clipboard with a scribbled map |
| metal_detector | II | finds buried scrap and artefacts in radius 3 | draw 0.2/tick on | a disc on a stick, beeping pixels |
| dowsing_rod | I | finds water pockets and springs | unreliable (one in five wrong) | forked stick |
| camera | III | selfies (ruling 56) and photos for the Journal | — | small box, flash frame |
| leaf_blower | III | clears snow, sand drifts and leaves from paths | draw 1/use; noisy | fan nozzle |
| watering_can | I | garden yield ×1.2 | refill at the lake | tin can |
| bug_net | I | Items §2 net | — | — |
| fishing_rod | II | Items §2 fishing_pole | — | — |
| umbrella | I | protect water 1 in rain, glide 1 tile off a ledge | can't use with a two-hand tool | small round umbrella |
| lantern | II | light 5, carried | oil | Items §2 lamp |
| kite_reel | II | flies the kite companion further | needs wind | reel with string |
| harmonica | I | boredom −10, a 2-frame tooting emote | — | tiny silver bar |
| repair_kit | II | field-repair one piece to half condition | uses scrap | a tin with a cross |

## 4. Loadouts and sets

The admin's Cubie window and the public Skills window show his current loadout. The
model picks a loadout by name from the ones that make sense for today's goal: the
code builds the list from what he owns and the trip the planner chose.

| loadout (his to name) | pieces | set bonus |
| --- | --- | --- |
| Skyline (long-range explorer) | rocket_legs, solar_backpack, night_lens, compass | 3+: reveal +2 |
| Deep (miner) | miner_helmet, gauntlets, plate_armour, digger_legs | 3+: rockfall +1, speed.mine ×1.1 |
| Mule (hauler) | cargo_frame, tread_legs, tool_belt, pouch_belt | 3+: carry +2 |
| Tide (swimmer) | flipper_legs, tank_pack, dive_mask, life_vest | 3+: dive time +25% |
| Lantern (night walker) | beacon_bulb, night_lens, helmet_light, dynamo_belt | 3+: night move cost −20% |
| Gardener | sun_hat, apron, watering_can, quiet_slippers | 3+: yield.food ×1.2 |
| Storm (weather) | rain_poncho, glider_wings, vane_tip, barometer | 3+: no `wet` in storms, glide +2 |
| Frost | insulation_suit, beanie, snowshoes, tool_belt | 3+: cold +1, tundra night ×1.5 instead of ×2 |

The first time he completes a set: a discovery toast, a Journal entry, and the
loadout name he gives it.

## 5. What this means for the art build

The art-02 pipeline already does `back`, `held`, `tint` and `status` from one
definition per piece across every clip. The new slots need three additions:

1. **Part maps from the model.** `draw()` returns, for every pixel, which part it
   belongs to (head, screen, antenna, torso, arm A/B, hand, leg A/B, foot, chest
   strip). Outfit pieces (`torso`, `arms`, `belt`, `feet`) are then drawn like
   `tint.wet`: recolour or add pixels on that part's pixels in every frame, with no
   per-clip art. This is the single change that makes most of the catalogue cheap.
2. **Two new overlay layers.** `top` for the head and antenna slots, and `visor` for
   the screen slot. Both draw above the face, and the eyes stay visible through a
   visor. Draw order becomes: body → glow → face → tint → outfit → back → held →
   status → visor → top → front.
3. **Body variants for leg kits.** A leg kit changes model O itself (`legH`, `foot`,
   leg shape), so `build.mjs` builds a second set of body sheets per kit:
   `<clip>@rocket_legs.png` with its own anchors and its own overlays (worn pieces
   ride it too). Two limits keep this affordable:
   - Kit sheets are drawn only for the clips a kit allows: idle, walk, the fidgets,
     dash, hop, plus a 4-frame `legs.extend` / `legs.retract`. Every other activity
     retracts the kit first, which is also the honest mechanic.
   - Tall kits need a taller frame. Stilts and rocket legs use **32×64**, strider
     legs 32×64 too. The renderer anchors frames by the feet, not the top, so a
     taller frame just grows upward.

**New clips the gear needs:** `dash` (4 dirs, 4 frames, flame emissive), `hop` (4
dirs, 6, airborne), `glide` (4, 4, loop), `hover` (4, 4, loop, glow under), `grapple`
(4, 6), `scan` (S, 6, a sweep across the screen), `legs.extend` / `legs.retract` (4
dirs, 4), `gear.equip` (S, 4: a little click-and-shake, used for every piece).

**Colour.** Most pieces sit on existing ramps: metal, dark, wood, cloth, teal and
pink. Adding gear honestly needs two **new ramps**, proposed here as a design-system
change: **brass** (spyglass, compass, music box, harmonica) and **signal orange**
(life vest, hard hat, rocket flame, warning bands). Emissives: rocket and jet
flame, beacon bulb, scanner sweep, crystal armour glow, solar cells, charge bars.

**Readability at 32 px.** Each piece must read in silhouette at 1× from the camera's
normal zoom. Test: on the meadow, by day and under the night tint, beside the bare
Cubie, can a viewer tell which piece he's wearing without hovering? If not, make
the piece bigger, louder or simpler. The saturation budget still puts him above
the ground.

## 6. Sim and snapshot

- `state.json` gains `gear: {slot: id}`, `condition: {id: n}` and `owned: [id]`.
- The snapshot carries `worn: [ids]` and the active loadout name. The renderer picks
  the body variant and overlays from those (the dumb-renderer rule: the sim never
  names a sprite).
- The filtered menu gains `equip(loadout)` at the pod or a gear rack, plus whatever
  actions the worn pieces add. The range maths uses the worn stats: the planner
  knows rocket legs make the hills a day trip.
- Gear blueprints are ordinary blueprint rows with `kind: "gear"`. They are built at
  the bench chain (Items §7) and carried, not placed.

## 7. Phasing

- **P1** (text only): the slot table, weight bands, the stats and actions model, and
  the ★ pieces as rows. The fast-forward tuning includes a loadout in its runs.
- **P3** (art): part maps, the `outfit` / `top` / `visor` layers, the ★ pieces drawn
  (hard hat, sun hat, sun visor, apron, rain poncho, tool belt, boots, spyglass,
  map board, lucky shell, plus the two already drawn packs), `gear.equip`.
- **P6** (the world grows): everything else, released with the biomes that need it
  (snowshoes with tundra, flippers with the water biomes, digger legs with the
  quarry). **Rocket legs and the other leg kits are P6**: the body-variant machinery
  is proven first on one kit (stilts, the simplest) when the first one ships.

## Open

- **Confirm the slot list and weight bands.** Is eleven slots too many to read on a
  32 px sprite? Torso, arms and belt could merge into one `outfit` slot.
- **New ramps** brass and signal orange: approve, or keep gear on existing ramps.
- **Body variants:** confirm the 32×64 frame for tall leg kits, and that kits retract
  for every non-locomotion clip.
- Whether he can be seen **choosing** a loadout (a short clip at the pod) or the
  swap is instant.
- How rare cosmetic pieces (crown, screen skins) are unlocked: firsts, letters,
  votes or packages.
