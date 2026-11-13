# Cubie — gear: packs, add-ons, outfits, armour, gadgets

Companion to [[Virtual-Office/Design-Cubie-Items]] (tools §2, wearables, companions),
[[Virtual-Office/Design-Cubie-Animations]] and `docs/design/07-cubie-character.md`.
Written 2026-11-13 with the creator; the creator's answers to the first open questions
are folded in (§1 slots, §5 colour, §5 the visible swap, §8 cosmetics). **Status:
proposed catalogue, draft numbers. Nothing drawn beyond the art-02 base set**
(battery pack, cargo frame, held tools).
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

He has a robot body, so gear **bolts on**. Nine slots, each holding one piece,
except `held` (two hands) and `trinket` (two charms). Torso, arms and belt are one
**`outfit`** slot (the creator, 2026-11-13: eleven was too many to read at 32 px), so
an outfit is one piece that may cover his body, his arms, his waist or all three.
Cosmetics add two **`pin`** spots that hold no stats (§8).

| slot | where on the sprite | layer it draws on | examples |
| --- | --- | --- | --- |
| `head` | over the top of the head | `top` (new, above face) | hard hat, helmet light, sun hat |
| `antenna` | replaces/caps the antenna bobble | `top` | radio mast, weather vane tip, beacon bulb |
| `screen` | over or on the screen face | `visor` (new, above face) | visor, night lens, scanner HUD, screen skin |
| `back` | on his back | `back` (exists) | battery pack, cargo frame, jet pack, glider |
| `outfit` | on his body, arms and/or waist | `outfit` (new, on the body) | coat, plating, life vest, apron, gauntlets, grapple arm, tool belt |
| `legs` | **replaces or extends his legs** | **body variant** (see §5) | rocket legs, stilts, spring legs, treads |
| `feet` | over the foot pixels | `outfit` | snowshoes, flippers, mag boots, mud boots |
| `held` | in his hands | `held` (exists) | Items §2 tools plus held gadgets (§3.8) |
| `trinket` ×2 | none, or a pixel or two | — | lucky shell, compass, music box |
| `pin` ×2 (cosmetic only) | 1–3 px on his chest or the side of his head | `top` | badges, stickers, a keyring on the antenna (§8) |

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

### 3.5 Outfits and armour (the `outfit` slot)

Armour here means protection from the world (§0 rule 2). The "covers" column says
which part maps the piece draws on (§5); every row is one `outfit` piece, so a
miner chooses plate armour *or* gauntlets *or* a tool belt, which is the point.

| id | covers | tier | ability | cost / downside | look |
| --- | --- | --- | --- | --- | --- |
| ★ apron | body | I | speed.build ×1.1 | — | canvas apron, front pocket |
| ★ rain_poncho | body, arms | I | protect water 2: no `wet` status in rain | weight 1 | hooded poncho over the shoulders |
| coat | body, arms | I | cold 2 (Items §2) | weight 1 | patched coat, big buttons |
| insulation_suit | body, arms, waist | III | cold 4 (tundra gate) | weight 3 | puffy quilted suit |
| shade_cloak | body, arms | II | heat 2 (desert gate) | weight 1 | pale cloak with a hood |
| life_vest | body | II | `float` (can't sink; rests in water) | weight 1; bulky | bright float vest |
| plate_armour | body, arms | III | rockfall 3, fall 2, sting 2 | weight 4 | riveted scrap plates over the body |
| crystal_armour | body, arms | V | heat 3, cold 3, light 2 (glows) | weight 3; fragile (low durability) | translucent crystal plates, glow on emissive |
| salt_wrap | body, arms | II | protect salt 4 (coast condition loss halved) | rewrap monthly | waxed cloth bands |
| bee_suit | body, arms (+ a hood on `top`) | II | sting 5 (hives, smoker work) | weight 1 | mesh hood over the whole head |
| mud_waders | waist (+ boots on `feet`) | II | mud 3, water 1 (swamp gate, Items §2) | weight 2 | rubbery chest waders |
| gauntlets | arms | II | speed.mine ×1.15, condition loss of held tools halved | weight 1 | thick work gloves over the nubs |
| grapple_arm | arms | IV | `grapple` 5 tiles | draw 2 per grapple; weight 2 | a hook launcher on one forearm |
| tool_arm | arms | IV | holds a second tool: two `held` actions without swapping | weight 2 | a jointed extra arm from his shoulder |
| magnet_arm | arms | III | `pick_up` from 3 tiles; finds buried scrap | weight 1; drags compasses off | a horseshoe magnet on a forearm |
| ★ tool_belt | waist | I | carry tools +2 (Items §2) | — | belt with loops, a hammer hanging |
| pouch_belt | waist | I | carry +2 (small items only) | — | three pouches |
| rope_coil | waist | I | `climb` 1 ledge, `tether` | weight 1 | rope looped on the hip |
| dynamo_belt | waist | III | regen +0.1 per step while moving | weight 1 | a little geared wheel at the hip |

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
| Deep (miner) | miner_helmet, plate_armour, digger_legs, repair_kit | 3+: rockfall +1, speed.mine ×1.1 |
| Mule (hauler) | cargo_frame, tread_legs, pouch_belt, boots | 3+: carry +2 |
| Tide (swimmer) | flipper_legs, tank_pack, dive_mask, life_vest | 3+: dive time +25% |
| Lantern (night walker) | beacon_bulb, night_lens, helmet_light, dynamo_belt | 3+: night move cost −20% |
| Gardener | sun_hat, apron, watering_can, quiet_slippers | 3+: yield.food ×1.2 |
| Storm (weather) | rain_poncho, glider_wings, vane_tip, barometer | 3+: no `wet` in storms, glide +2 |
| Frost | insulation_suit, beanie, snowshoes, compass | 3+: cold +1, tundra night ×1.5 instead of ×2 |

The first time he completes a set: a discovery toast, a Journal entry, and the
loadout name he gives it.

## 5. What this means for the art build

The art-02 pipeline already does `back`, `held`, `tint` and `status` from one
definition per piece across every clip. The new slots need three additions:

1. **Part maps from the model.** `draw()` returns, for every pixel, which part it
   belongs to (head, screen, antenna, torso, arm A/B, hand, leg A/B, foot, chest
   strip). Outfit and feet pieces are then drawn like
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
dirs, 4), and the visible swap below.

**The swap is seen** (the creator, 2026-11-13). Changing gear happens at the pod's
**gear rack** (a starter-pod fixture; a field gear rack is a later blueprint). It is
a short scene, not an instant change:

1. `gear.rack.in` (S, 4): he steps back into the rack; the rack's arms swing to him.
2. `gear.rack.swap` (S, 6, per slot changed, capped at three): a clamp lifts the old
   piece off and sets the new one on, with a little spark on the contact frame. The
   overlays change on that frame. A full loadout change plays the strongest three
   slots and cuts the rest.
3. `gear.rack.out` (S, 4): he steps out and does a one-frame shake. It is the
   `gear.equip` beat, and his face picks `happy` for a new piece or `idle` for old
   ones.

The rack is a prop with its own 2-state sprite (idle, working). The sim gives the
swap real time, a few seconds of a tick, so viewers watching follow mode see it
happen. The first time each piece is worn, a discovery toast fires, and he names
the piece (rule 1).

**Colour — a gear palette of its own** (the creator, 2026-11-13: more than two
ramps, so gear reads as separate from Cubie himself). Twelve 6-step ramps, light to
dark, hue-shifted like the world's: highlights warm, shadows toward blue-violet.

| ramp | steps, light → dark | for |
| --- | --- | --- |
| brass | `#f6dd8a #e2bb5c #c4963f #9c7130 #6f4d27 #45301f` | spyglass, compass, music box, fittings |
| orange (signal) | `#ffc27a #ff9a3c #e8722a #b8521f #7f3519 #4a2014` | hard hat, life vest, warning bands, rocket flame body |
| canvas | `#efe3c2 #d8c79a #b9a476 #93805a #6a5a44 #43392f` | apron, poncho, bags, straps |
| leather | `#d39a6a #b5774b #925a38 #6f412b #4d2c22 #301c18` | belts, boots, gauntlets |
| olive | `#c3c98a #9ea563 #7a8446 #5a6334 #3d4428 #26291d` | field kit, explorer pieces |
| forest | `#9be08a #5fbf5f #3d9650 #2b6f44 #1f4b35 #142e24` | gardener pieces, leaf crown |
| navy | `#8fb0e0 #5f86c4 #3f62a0 #2d4678 #213152 #151d33` | swim and dive kit, coats |
| crimson | `#ff8f8f #e8545c #c23545 #8f2437 #5e1a2b #36111d` | scarves, flags, repair kit |
| plum | `#d6a6f0 #ae74d6 #8a51b5 #663a8a #45285f #2a1a3b` | night kit, rare cosmetics |
| gold | `#fff1a8 #ffd95a #f0b429 #c48a1c #8a5e17 #533812` | the crown, trophies, rare pins |
| copper | `#f2b48a #d98d5f #b56b42 #8a4f33 #5e3626 #3a2219` | coils, wiring, mechanical legs |
| rubber | `#6e6a78 #55515e #403d48 #2f2c36 #211f27 #151419` | treads, flippers, grips, soles |

Rules for the gear palette:

- **Never Cubie's own colours.** No gear pixel uses his body metal (the cool
  white-grey ramp), his screen ramp, his teal or his pink. A piece can be white-ish
  only on the canvas ramp, which is warm. The one exception is his **charge
  indicator** (the battery pack's bars stay teal, because they are his power, not
  the pack's).
- **Structural metal on gear** (rocket legs, mag boots, jet pack) uses the existing
  `dark` ramp or copper, never his body metal, so the kit reads as bolted on.
- **Colourways.** A piece's row names a default ramp; most cosmetic pieces and many
  outfits also come in **colourways** (the same drawing on another ramp from this
  table), each unlocked separately (§8). Drawing once and recolouring is free in
  the build (a ramp swap), so the palette multiplies the catalogue at no art cost.
- **The budget.** The world palette was ~80 colours (art system §2). This adds 72
  for gear. Gear is on Cubie, so it competes with nothing on the ground; the
  saturation budget still holds (gear at most as loud as him, never louder than his
  face and strip). Swatch sheet: PR #6.

Emissives: rocket and jet flame, beacon bulb, scanner sweep, crystal armour glow,
solar cells, charge bars, the music box's notes, cosmetic sparkles (§8).

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
- **P3** (art): part maps, the `outfit` / `top` / `visor` layers, head and torso
  anchors, the gear palette and palette-swap colourways; the ★ pieces drawn (hard
  hat, sun hat, sun visor, apron, rain poncho, tool belt, boots, spyglass, map
  board, lucky shell, plus the two already drawn packs); the gear rack and the
  visible swap clips; the first batch of cosmetics (firsts, seasons, found).
- **P5**: the cosmetics that come from viewers (letters, votes, packages, patrons,
  the stream, milestones) and the Wardrobe window's "how to get it".
- **P6** (the world grows): everything else, released with the biomes that need it
  (snowshoes with tundra, flippers with the water biomes, digger legs with the
  quarry). **Rocket legs and the other leg kits are P6**: the body-variant machinery
  is proven first on one kit (stilts, the simplest) when the first one ships.

## 8. Cosmetics — lots of them, unlocked every way

The creator wants plenty of cosmetics so there is always something to unlock and
every channel (his own firsts, letters, votes, packages) has things to give.
**Cosmetics have no stats**, ever: they only change how he looks, so no gift or vote
can tilt the survival game.

### 8.1 How they work

- **Where they go.** A cosmetic fills a free slot (`head`, `antenna`, `screen`
  bezel, `outfit`, `feet`, `back`, `held` while idle) or one of the two `pin` spots.
  It can also be shown **over a functional piece of the same slot**: he keeps the
  hard hat's protection while wearing the crown's look. One exception: a functional
  piece whose job shows (a lit helmet light, rocket legs, a glider) is never hidden.
- **Colourways.** Most rows come in several ramps from the gear palette (§5). Each
  colourway unlocks separately. **A duplicate unlock becomes a new colourway**, so no
  gift is ever wasted.
- **Rarity.** Common, uncommon, rare, unique. A unique exists once on the island (the
  crown); it is never in a package catalogue or a vote.
- **He chooses what to wear.** At the morning list, the code offers a few outfits
  that make sense from what he owns: no sun hat in rain, no scarf in the desert by
  day. The model picks one, with flavour, and the diary may mention it. A piece that
  arrived from a viewer is worn the day it arrives (a code rule), and he thanks them
  by alias.
- **The public sees the wardrobe.** A **Wardrobe** window on the public dock shows
  what he owns, what he's wearing, and the next few locked pieces with how to get
  them. "How to get it" is the hook for every channel.

### 8.2 Unlock sources (every one of them, per the creator)

| source | how it fires | phase |
| --- | --- | --- |
| **first** | a discovery or first (ruling 38): first night out, first raft trip, first set completed | P1 rows, P3 art |
| **skill** | a skill domain reaching a level | P1 |
| **set** | completing a loadout set (§4) | P1 |
| **found** | dug from strata, washed up on the beach, in a wreck (random per table) | P1 |
| **made** | crafted at the loom or bench from resources | P1 |
| **season** | season number N of the island year (ruling 46); comes back every year in a new colourway | P1 |
| **anniversary** | each island year since landing | P1 |
| **letter** | a rocket (P5.3) may carry one at random from the letter pool; the sender doesn't choose it | P5 |
| **vote** | a ballot option (P5.4); the winner arrives in the next rocket | P5 |
| **package** | a catalogue item a viewer can send (P5.1), under the daily caps | P5 |
| **patron** | a patron tier's monthly pick from a patron-only list (P5.2) | P5 |
| **stream** | channel points on the stream (P5.5) | P5 |
| **milestone** | a community count: the 100th letter, the 1,000th visitor-day | P5 |

### 8.3 The cosmetic catalogue

Columns: **id** · **slot** · **look** · **unlock** · **colourways** (ramps from §5;
"—" = one look).

**Head (24)**

| id | slot | look | unlock | colourways |
| --- | --- | --- | --- | --- |
| bobble_hat | head | knitted hat, big bobble | made (loom) | crimson, navy, forest, plum, orange |
| flat_cap | head | flat cap with a stitched peak | made | canvas, olive, navy |
| top_hat | head | tall hat with a band | vote | rubber, plum, crimson band |
| bowler | head | round hat | package | rubber, leather |
| party_hat | head | striped cone with a tassel | anniversary | any 3 |
| wizard_hat | head | floppy pointed hat with stars | patron | plum, navy |
| tricorn | head | three-cornered hat with a feather | first (first raft trip) | leather, navy |
| chef_hat | head | puffy white hat (canvas) | skill (food L3) | canvas |
| beret | head | soft flat beret | letter | crimson, navy, olive |
| bucket_hat | head | floppy bucket hat | package | canvas, olive, forest |
| captain_cap | head | peaked cap with a gold anchor | skill (swimming L3) | navy + gold |
| flower_crown | head | ring of meadow flowers | season 1 | forest + crimson, + plum |
| mushroom_cap | head | spotted toadstool cap | found (forest) | crimson, orange |
| traffic_cone | head | a battered cone from a wreck | found (wreck), unique look | orange |
| tin_pot | head | a dented pot, handle sticking out | found (wreck) | copper, brass |
| shell_helmet | head | a big spiral shell | found (beach) | canvas, copper |
| antler_band | head | a headband with shed antlers | made (antler) | leather |
| ear_muffs | head | fluffy ear muffs over his ear pods | season 4 | crimson, navy, plum |
| headphones | head | chunky headphones | first (the stereo built) | rubber, crimson, navy |
| halo | head | a thin glowing ring (emissive) | milestone | gold |
| straw_boater | head | flat straw hat with a band | season 2 | canvas + crimson, + navy |
| leaf_umbrella | head | a big leaf worn as a hat | found (forest, rain) | forest |
| snow_cap | head | a heap of snow that melts by noon | season 4 (snow days) | — |
| crown | head | tiny tin crown | found (wreck), unique | gold |

**Antenna toppers (18)** — on the bobble, never hiding it from the front.

| id | look | unlock | colourways |
| --- | --- | --- | --- |
| tiny_flag | a square flag on a pin | first (first build) | crimson, navy, forest, orange |
| pennant | a long triangle pennant | vote | any |
| star | a five-point star | skill (any L5) | gold, brass |
| heart | a little heart | package | crimson, plum |
| flower | a single flower | season 1 | crimson, plum, gold |
| acorn | an acorn cap | found (forest) | leather |
| bell | a tiny bell | letter | brass, gold |
| pom_pom | a fluffy pom-pom | made (loom) | any |
| bolt | a lightning bolt (emissive) | first (first full recharge from solar) | gold |
| moon | a crescent moon | first (first night out) | gold, plum |
| cherry | a pair of cherries | package | crimson |
| feather | a long feather | found (gull drop) | canvas, crimson, navy |
| keyring | a ring with one tiny key | found (strata) | brass |
| glow_orb | a softly glowing bead (emissive) | patron | plum, forest, navy |
| balloon | a balloon tied to the antenna, bobbing | anniversary | any |
| snowflake | a snowflake | season 4 | — |
| propeller_toy | a spinning paper propeller | stream | orange, navy |
| sprout | a two-leaf seedling | first (first seed planted) | forest |

**Screen bezel and wallpaper (18)** — the face itself never changes. Bezel skins
recolour or pattern the dark frame around the screen; wallpapers are a faint
pattern on the screen background, at most two steps off the screen ramp so the eyes
always read.

| id | where | look | unlock |
| --- | --- | --- | --- |
| bezel_stripes | bezel | diagonal stripes | first (first week) |
| bezel_dots | bezel | polka dots | package |
| bezel_checker | bezel | small checkers | vote |
| bezel_stars | bezel | scattered stars | first (first night out) |
| bezel_leaves | bezel | a leaf border | season 1 |
| bezel_waves | bezel | a wave border | first (first swim) |
| bezel_flames | bezel | flames | first (first rocket-legs dash) |
| bezel_hearts | bezel | hearts | letter |
| bezel_circuit | bezel | circuit traces | first (first circuit made) |
| bezel_wood | bezel | wood grain | made (bench) |
| bezel_gold | bezel | gold trim | milestone |
| bezel_rainbow | bezel | rainbow band | first (first dance) |
| bezel_frost | bezel | frosted corners | season 4 |
| bezel_patch | bezel | a sticking-plaster patch in one corner | first (first near miss on power) |
| wall_stars | screen bg | faint star field | patron |
| wall_grid | screen bg | faint grid | first (first scan) |
| wall_rain | screen bg | faint falling lines | first (first storm) |
| wall_waves | screen bg | faint waves | season 2 |

**Outfit cosmetics (24)**

| id | covers | look | unlock | colourways |
| --- | --- | --- | --- | --- |
| scarf | neck | a long scarf, end flapping in walk | made (loom) | crimson, navy, forest, plum, orange, gold |
| bandana | neck | a knotted neckerchief | package | crimson, navy, olive |
| bow_tie | neck | a little bow tie | vote | crimson, plum, rubber |
| necktie | neck | a tie, a bit too long | letter | navy, crimson |
| cape | body | a short cape | patron | crimson, plum, navy |
| hoodie | body, arms | a hoodie, hood down | package | any |
| overalls | body, waist | dungarees with a front pocket | skill (building L3) | navy, canvas |
| lab_coat | body, arms | a white coat (canvas), pens in the pocket | first (first electronics bench) | canvas |
| striped_jumper | body, arms | a jumper with one stripe | made (loom) | any 2 |
| flower_shirt | body, arms | a loud short-sleeve shirt with flowers | season 2 | orange, forest, plum |
| tux_front | body | a tuxedo shirt front and lapels | anniversary | rubber |
| medal_sash | body | a sash with his medals (one per set completed) | set | crimson, navy |
| hi_vis | body | a reflective vest | first (first build in the rain) | orange |
| sailor_collar | neck, body | a square sailor collar | first (first raft trip) | navy |
| knit_vest | body | a knitted tank top | letter | olive, plum, crimson |
| cardigan | body, arms | a cardigan with buttons | season 3 | leather, forest |
| float_ring | waist | a striped float ring | package | crimson, orange |
| tutu | waist | a tutu | first (first dance) | plum, crimson |
| pocket_watch | waist | a watch chain from a pocket | found (wreck) | brass, gold |
| raincoat | body, arms | a shiny raincoat | season 3 | orange, navy |
| apron_floral | body | the apron in a flower print | vote | crimson, forest |
| poncho_pattern | body, arms | a patterned poncho | package | orange, crimson, olive |
| backpack_straps | body | just straps with badges on | stream | leather |
| tool_roll | waist | a canvas tool roll | skill (any L3) | canvas, leather |

**Feet (12)**

| id | look | unlock | colourways |
| --- | --- | --- | --- |
| sneakers | trainers with a stripe | package | any |
| wellies | rubber boots | season 3 | forest, crimson, navy |
| slippers | fluffy slippers | first (first full night's recharge) | plum, crimson |
| striped_socks | socks over his feet | made (loom) | any 2 |
| clogs | wooden clogs | made (bench) | canvas, crimson |
| moon_boots | puffy boots | season 4 | canvas, plum |
| frog_slippers | slippers with frog faces | letter | forest |
| roller_skates | skates (look only; `wheel_legs` is the real thing) | vote | crimson, navy |
| ice_skates | skates with a blade | season 4 | navy |
| flip_flops | sandals with a thong | season 2 | orange, forest |
| hiking_boots | laced boots | skill (exploring L3) | leather |
| gold_shoes | shiny shoes | milestone | gold |

**Back (12)**

| id | look | unlock | colourways |
| --- | --- | --- | --- |
| flag_pole | a tall flag on a pole | first (reached the coast) | any |
| deco_kite | a kite tied on, flying above | season 2 (windy days) | any 2 |
| plush | a soft toy peeking over his shoulder | package | any |
| shell_bag | a backpack made from a big shell | found (beach) | canvas, copper |
| butterfly_wings | cloth wings, a slow flap | patron | plum, orange, forest |
| nest | a nest with a smooth round stone in it | found (forest) | — |
| lunchbox | a tin lunchbox | made (bench) | crimson, navy, forest |
| guitar | a small guitar on a strap | first (the stereo built) | leather, crimson |
| balloon_bunch | three balloons | anniversary | any 3 |
| back_umbrella | a closed umbrella in a holder | letter | any |
| bindle | a stick with a bundle tied on | first (first trip out of sight of the pod) | canvas, crimson |
| fishing_creel | a woven basket | made (loom) | canvas |

**Pins (24)** — two at a time, 1–3 px, on his chest or the side of his head.
Badges are mostly *firsts*, so the pins are his record.

| id | look | unlock |
| --- | --- | --- |
| badge_first_steps | a boot print | first (day one) |
| badge_coast | a wave | first (reached the coast) |
| badge_night | a moon | first (night out) |
| badge_raft | a raft | first (raft trip) |
| badge_cave | a lantern | first (into the cave) |
| badge_summit | a mountain | first (hilltop reveal) |
| badge_builder | a hammer | set / first (10 builds) |
| badge_year | a number | anniversary (one per year) |
| badge_letter | an envelope | letter (first letter answered) |
| badge_vote | a ballot box | vote (first ballot) |
| badge_package | a parcel | package (first package fetched) |
| badge_patron | a heart | patron |
| sticker_smile | a smiley | package |
| sticker_star | a star | first (first discovery toast) |
| sticker_bolt | a bolt | first (full charge) |
| sticker_leaf | a leaf | season 1 |
| sticker_shell | a shell | found (beach) |
| sticker_heart | a heart | letter |
| sticker_plaster | a plaster | first (first near miss) |
| gold_star | a gold star | milestone |
| name_tag | a tag with a squiggle he calls his name | first (first time he names himself in the diary) |
| map_pin | a map pin | first (first pin on the map board) |
| tiny_duck | a duck pin | first (the duck built) |
| pod_pin | the pod | anniversary (year 1) |

**Held props, while idle (12)** — only in idle, sit and fidget clips; any real
work puts them away.

| id | look | unlock | colourways |
| --- | --- | --- | --- |
| balloon | a balloon on a string | package | any |
| hand_flag | a small waving flag | vote | any |
| bouquet | a bunch of flowers | season 1 | crimson + forest, plum + forest |
| teacup | a cup with steam (emissive steam, faint) | made (kiln) | canvas, crimson |
| snow_globe | a globe with the pod inside | season 4 | — |
| pinwheel | a spinning paper windmill | stream | any |
| book | a small book, open | first (library built) | leather, navy |
| plush_held | the plush, hugged | package | any |
| sparkler | a sparkler (emissive) | anniversary | gold |
| lantern_paper | a paper lantern (emissive) | season 3 | orange, crimson |
| ice_lolly | a lolly he can't eat (he knows) | season 2 | crimson, orange, plum |
| trophy | a little cup | milestone | gold, brass |

**Trails and effects (10)** — rare, emissive, short-lived, never on the stream's
lower-thirds. They play on locomotion only, and at most one at a time.

| id | look | unlock |
| --- | --- | --- |
| trail_sparkle | sparkles in his footprints | patron |
| trail_notes | music notes rising (while the stereo plays) | first (the stereo built) |
| trail_leaves | falling leaves behind him | season 3 |
| trail_snow | little snow puffs | season 4 |
| trail_bubbles | bubbles (only while wet) | first (first swim) |
| trail_fireflies | two fireflies orbiting him at night | first (glow-moth tamed) |
| trail_rainbow | a short rainbow streak on `dash` | milestone |
| trail_petals | petals | season 1 |
| trail_stars | tiny stars | vote |
| trail_hearts | hearts, once, when a letter arrives | letter |

That is **about 150 pieces**, and **several hundred looks** once colourways are counted.
Seasons, anniversaries and milestones keep adding to it.

### 8.4 What it means for the build

Baking every cosmetic into every clip would mean tens of thousands of strips, so
cosmetics are built two ways:

- **Stamps** for rigid things. Head, antenna, bezel, pins, and small back and held
  props are one tiny sprite per direction, placed by an anchor. The build adds
  `anchors.head` (top-centre of the head, with the head's facing, which may differ on
  a turned head) and `anchors.torso` to every clip json. The renderer places the
  stamp, and occlusion follows the slot's layer (§5).
- **Part-map pieces** for things that wrap the body. Outfits and feet are drawn once
  per clip in their default ramp, using the part maps. **Colourways are a palette
  swap at load:** each gear ramp's six steps map to another ramp's six steps, which
  Phaser can do in a pixel shader or when the texture loads. Nothing new is
  drawn per colourway.

The Wardrobe window, the morning outfit pick and the unlock rules are P1 rows and P4
UI. The art is drawn in batches as each unlock source arrives: firsts, seasons and
found items with P3; letters, votes, packages, patrons and the stream with P5.

## Settled (the creator, 2026-11-13)

1. **Slots:** torso, arms and belt merge into one `outfit` slot (nine slots, plus
   two cosmetic `pin` spots).
2. **Colour:** a gear palette of twelve ramps, kept apart from Cubie's own colours (§5).
3. **Leg kits:** 32×64 frames for the tall kits; kits retract for every
   non-locomotion clip.
4. **The swap is seen**, at the pod's gear rack (§5).
5. **Cosmetics unlock every way** (firsts, letters, votes, packages and more), and
   there are a lot of them (§8).

## Open

- The palette budget: the art system's ~80 colours becomes ~150 with the gear
  palette; record it in the art system §2 when the hero tile is approved.
- Weight bands and stat numbers stay drafts until the P1 fast-forward runs.
- Holiday and season cosmetics key off the island calendar (ruling 46). Seasons are
  unnamed until he names them, so the pieces carry a season *number* and take his
  name for it.
