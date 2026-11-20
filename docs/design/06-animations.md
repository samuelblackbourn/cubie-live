# Cubie — animation definitions

The complete list of what Cubie's on-screen character has to do, as rows the
renderer, the sprite sheets and the sound matrix all key off. Companion to
[[Virtual-Office/Design-Cubie-Assets]] (§9 had a first sketch), the art system
([[Virtual-Office/Design-Cubie-Art-System]] §6 sets the frame budgets) and the action
list ([[Virtual-Office/Design-Cubie-Items]] §4). Written 2026-11-13. **Status:
definition, nothing drawn.** Becomes `art/cubie/animations.json` in P3.

## 0. How animation works here

- **The sim never names an animation.** It emits `activity`, `facing`, `path`,
  `medium` (land/water/underwater), `vehicle`, `held`, `worn`, `face`, and
  `status flags` (low_power, wet, hot, cold, dusty, glowing). The **renderer maps
  state → clip** with the table in §2 and the priority rules in §4. So a new clip is
  a renderer change, never a sim change, and the public page (10 s polls) and the
  admin (live WebSocket) pick identical clips from identical state.
- **Layers, bottom to top**: ground shadow (renderer) → back overlay (battery pack,
  cargo frame, solar backpack, carried bundle) → **body** → held-tool overlay →
  **face overlay** (the screen) → LED strip tint → status overlays (wet sheen, dust,
  spore glow, frost) → emissive (LEDs, lamp). Body and overlays share frame counts
  and anchors per clip, so a tool swaps without a new body sheet.
- **Four directions** (S, W, E, N) for anything that moves or faces; W/E are drawn
  separately, not flipped, because the screen-face and chest strip are asymmetric
  once a tool is held. Static clips (sit, recharge) are S and N only; the renderer
  turns him to the nearest.
- **Frame budgets** (art system §6): idle 4, walk 8, action 6, emote 4–6, dance 8,
  ambient loops 2–4. Timing lives in `animations.json`, not the sheet; eases are
  held frames, never extra frames.
- **Contact frame**: every action clip names the frame where the tool lands /
  the foot touches / the item leaves the hand; the SFX matrix fires on it, and
  effects (chips, splinters, splash) spawn there.
- **Transitions** are 2-frame clips where a hard cut would pop (stand→sit,
  land→wade, walk→vehicle). Everything else cuts on the next frame boundary.

## 1. Faces (the screen overlay, 16×12 px, drawn on every body frame)

| id | when | notes |
| --- | --- | --- |
| `face.idle` | default | eyes open, small mouth |
| `face.happy` | contentment band high; build complete; package fetched; letter | eyes curved, mouth up |
| `face.thinking` | life-loop decide step in progress; reading a letter; designing | eyes to one side, dot-dot-dot pixels |
| `face.sad` | low-power mode; wish declined; condition low; rain he dislikes | eyes down, flat mouth |
| `face.surprised` | a first (discovery toast); cavern break; blast; tide pool crab | wide eyes, small o mouth |
| `face.embarrassed` | fell/slid on ice; posted a bad selfie; knocked something over | eyes closed-tight, blush pixels |
| `face.closed` | recharging; resting; night | flat lines |
| `face.squint` | heat wave; sandstorm; bright snow | half eyes |
| `face.blink` | 2-frame interstitial, random every 3–6 s on any open-eye face | keeps him alive at rest |
| `face.off` | power 0 (never reached in normal play); Pi "asleep" card | black screen |

Mood words (decision 10) pick the resting face; events override for a few seconds.

## 2. Body clips

Columns: **clip** · **triggered by** (sim state) · **dirs** · **frames** · **fps** ·
**loop** · **contact** · **overlays that change** · **notes**.

### 2.1 Rest and idle

| clip | triggered by | dirs | fr | fps | loop | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `idle` | activity=idle/wait, on land | 4 | 4 | 4 | yes | breathing: 1-px body lift; strip pulses slowly |
| `idle.look_around` | idle for >20 s; frontier nearby | 4 | 6 | 5 | once | head turns L then R; curiosity band high picks it more |
| `idle.fidget` | idle, boredom band high | S,N | 6 | 6 | once | shifts weight, taps foot |
| `idle.shiver` | cold flag, outdoors | 4 | 4 | 10 | yes | fast 1-px jitter; frost overlay |
| `idle.pant` | hot flag | 4 | 4 | 6 | yes | body dips; squint face; heat shimmer is the renderer's |
| `sit` | activity=rest, at bench/log/campfire/stump | S,N | 2 | 2 | yes | breathing only |
| `sit.transition` | stand↔sit | S,N | 2 | 8 | once | — |
| `lie_down` | rest in hammock | S | 2 | 2 | yes | sways with the hammock sprite |
| `recharge` | activity=recharge at the bed | S | 4 | 3 | yes | face.closed; strip fills bottom→top over the clip; bed glow is the bed's emissive |
| `recharge.wake` | recharge ends | S | 4 | 6 | once | stretch: arms up, head tilt |
| `rest.float` | rest while swimming L3 | 1 | 2 | 2 | yes | bob with the water frames |

### 2.2 Locomotion

| clip | triggered by | dirs | fr | fps | loop | contact | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `walk` | path active, land, normal speed | 4 | 8 | 10 | yes | f1, f5 (footsteps) | the default; strip steady |
| `walk.carry` | walk with cargo > half | 4 | 8 | 9 | yes | f1, f5 | leans back; carried-bundle back overlay |
| `walk.tired` | power band "a bit low" | 4 | 8 | 7 | yes | f1, f5 | head lower, slower |
| `shuffle` | low_power flag | 4 | 6 | 4 | yes | f1, f4 | head down, strip dim, drag step; replaces footsteps with `low_power.shuffle` |
| `walk.slope_up` / `slope_down` | path tile has slope | 4 | 8 | 8 / 11 | yes | f1, f5 | lean forward / back; hills |
| `walk.rain` | rain weather, outdoors | 4 | 8 | 9 | yes | f1, f5 | hunched; wet overlay |
| `walk.wind` | wind weather | 4 | 8 | 9 | yes | f1, f5 | lean into facing-vs-wind; renderer flips lean by wind dir |
| `wade` | medium=water, depth 1 | 4 | 8 | 7 | yes | f1, f5 (`step.water`) | lower body hidden by the transparent-water overlay |
| `swim` | medium=water, depth 2+, swimming L2+ | 4 | 6 | 6 | yes | f3 (`swim.stroke`) | arms as paddles; wake particles |
| `dive.in` | land/surface → underwater | 4 | 6 | 10 | once | f4 (`dive.in`) | — |
| `swim.under` | medium=underwater | 4 | 6 | 5 | yes | f3 | bubbles from the head |
| `surface` | underwater → surface | 4 | 4 | 8 | once | f3 (`surface.gasp`) | surprised face one beat |
| `slide` | ice tile slip event | 4 | 4 | 12 | once | — | arms out; embarrassed face after |
| `stuck` | mud without waders | 4 | 4 | 3 | yes | — | tugging a leg; sad face |
| `climb` | ladder / rope / cliff tile | N,S | 6 | 6 | yes | f1, f4 | vertical; drawn on the connector tile |
| `enter` / `exit` | door, cave mouth, hatch | 4 | 4 | 8 | once | — | fades 50 % on the last 2 frames for interiors; cave mouth darkens him |
| `knockback` | blast event | 4 | 6 | 12 | once | — | 2 tiles back; lands in `idle.dazed` (4 fr, 4 fps, spinning-pixel eyes) |

### 2.3 Harvesting and tools (held-tool overlay swaps; body shared)

| clip | triggered by | dirs | fr | fps | loop | contact | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `swing.heavy` | chop (axe), mine (pick), hammer-break | 4 | 6 | 8 | per hit | f4 | overhead two-hand swing; the one body clip for axe/pick/hammer, tool overlay differs |
| `swing.light` | cut (machete, knife), reap (sickle) | 4 | 6 | 10 | per hit | f3 | side swing |
| `dig` | shovel | 4 | 6 | 7 | per hit | f4 (`shovel.dig`) | thrust down, lift, toss over shoulder (dirt particles) |
| `pluck` | hands: grass, berries, flowers, shells, moss, fungi | 4 | 4 | 8 | per hit | f3 | bend, pick, straighten |
| `pick_up` | item on ground | 4 | 4 | 8 | once | f3 (`pickup.*`) | crouch and lift |
| `drop` / `place_item` | drop, cache, converter feed | 4 | 4 | 8 | once | f2 | — |
| `drill` | drill tool | 4 | 4 | 12 | yes | continuous | vibrating; `drill.run` loop; dust |
| `probe` | staff: mud/water depth | 4 | 4 | 6 | once | f3 | — |
| `vault` | staff over a gap | 4 | 6 | 10 | once | f3 | — |
| `kindle` | torch lights kiln/campfire | 4 | 4 | 6 | once | f3 | emissive torch |
| `carry_torch` | torch held while walking | 4 | — | — | — | — | overlay only: `walk` + torch overlay + light radius |
| `cast` | fishing pole | 4 | 6 | 6 | once + hold | f4 | then `idle.fishing` (2 fr) |
| `smoke` | smoker at hive | 4 | 4 | 4 | yes | — | puff particles |
| `net.scoop` | net | 4 | 6 | 8 | once | f4 | — |

### 2.4 Building and the pod

| clip | triggered by | dirs | fr | fps | loop | contact | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `place_footprint` | place blueprint | 4 | 4 | 6 | once | f3 (`place.footprint`) | arms sweep; footprint ghost appears |
| `build` | build/continue_building | 4 | 6 | 7 | yes | f4 (`build.hammer.*`) | hammer; the structure's under-construction sprite advances by progress |
| `build.complete` | build finished | 4 | 6 | 6 | once | f3 (`build.complete`) | step back, arms up; happy face; toast |
| `repair` | repair action | 4 | 6 | 7 | yes | f4 | same as build with a wrench overlay |
| `convert` | feed converter | S | 6 | 6 | once | f3 (`converter.feed.*`) | tip resource into hopper |
| `workbench` | crafting at bench | S | 6 | 5 | yes | f3 | hands busy; sparks for metal |
| `use_station` | computer, drafting table, library, telescope | S | 4 | 3 | yes | — | seated/standing per station; face.thinking |
| `use_stereo` | play music | S | 4 | 6 | once | f2 | presses a button; then `dance` |
| `eat` | berries/fruit/honey | 4 | 4 | 5 | once | f2 | item to screen (he "eats" with the face — a small joke); happy face |

### 2.5 Emotes and reactions

| clip | triggered by | dirs | fr | fps | loop | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `dance` | music playing within hearing | 4 | 8 | 8 | yes | side-to-side, arm nubs up; strip cycles colour |
| `celebrate` | first of anything (toast); level-up | 4 | 6 | 8 | once | hop + arms; happy face |
| `discover` | new biome / object first seen | 4 | 6 | 6 | once | lean forward, head tilt; surprised face; precedes the toast |
| `sulk` | wish declined; rain; boredom band max | S | 4 | 3 | yes | shoulders down; sad face |
| `wave` | companion returns; package found; rocket lands | 4 | 4 | 6 | once | arm nub up twice |
| `pet` | pet action on an animal/companion | 4 | 4 | 5 | once | crouch, hand out |
| `feed_animal` | feed action | 4 | 4 | 6 | once | item out at arm's length |
| `shoo` | deter action | 4 | 4 | 10 | once | arms flail; tool overlay if held |
| `think` | life-loop decide step (admin shows it; public may) | 4 | 4 | 3 | yes | face.thinking; dot-dot-dot above head |
| `write` | write_diary / lists / letter reply | S | 4 | 3 | yes | at the pod or on the ground; a tiny notebook overlay |
| `read` | read_letter | S | 4 | 2 | yes | holds paper; face.thinking → an event face at the end |
| `selfie` | phone post with photo | 4 | 6 | 6 | once | arm out, phone overlay, flash frame (white 1 frame); first one has embarrassed face |
| `post` | phone post | 4 | 4 | 3 | once | taps the phone; ping |
| `look_up` | telescope / night sky / aurora / meteor | 4 | 4 | 2 | yes | head back; emissive reflections on the screen |
| `shelter` | storm/blizzard forced shelter, outdoors | 4 | 4 | 4 | yes | hunched under the awning/tree; hands over head |
| `dazed` | after knockback | 4 | 4 | 4 | 3 s | spinning pixels on screen |
| `cheer_companion` | companion completes a job | 4 | 4 | 6 | once | fist-nub pump |

### 2.6 Vehicles (Cubie's body drawn *on/in* the vehicle; vehicle has its own sheets)

| clip | triggered by | dirs | fr | fps | loop | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `pull` | hand cart / sled, moving | 4 | 8 | 8 | yes | leaning forward, rope/handle; footsteps |
| `push` | barrow | 4 | 8 | 9 | yes | hands on handles |
| `pedal` | trike | 4 | 6 | 12 | yes | legs cycle; body static |
| `row` | raft, boat without wind | 4 | 6 | 5 | yes | pole/oar overlay, f3 splash |
| `sail` | boat with wind | 4 | 4 | 3 | yes | hand on tiller; sail is the boat's clip |
| `drive` | buggy / rover | 4 | 4 | 4 | yes | seated, hands on wheel; small bumps on rough tiles |
| `mount` / `dismount` | vehicle transitions | 4 | 4 | 8 | once | — |
| `pilot` | submersible / airship | 1 | 4 | 3 | yes | inside; shown through a window sprite |
| `stuck_vehicle` | vehicle stuck event | 4 | 6 | 4 | 3× | pushing at it; sad face |

### 2.7 Status overlays (not clips: layers on any clip)

| overlay | when | look |
| --- | --- | --- |
| `wet` | after water/rain, fades over an island hour | darker body, 2-px drips on frames 2 and 6 |
| `dust` | sandstorm/quarry | tan speckle |
| `frost` | cold flag | pale rim, breath puff particle |
| `spore_glow` | glow fungus contact | faint teal emissive on body edges |
| `mud` | swamp/mud | brown lower body |
| `salt_corrosion` | condition low from salt | orange specks at joints |
| `strip` | always | LED strip tint: standby dark, charging green fill, low-power dim red pulse, thinking blue, speaking/posting pink, dance rainbow cycle |
| `back.battery_pack` / `cargo_frame` / `solar_backpack` / `bundle` | worn/carried | back overlays per direction |
| `held.<tool>` | held tool | 16 px tool per direction, per clip pose |
| `worn.coat` / `waders` / `hard_hat` / `shade_cloak` / `climbing_gear` / `air_tank` | wearables | small silhouette changes; body sheet unchanged |

## 3. Counts

Body clips: ~70 (2.1–2.6), of which ~45 need 4 directions. At the budgets above
that is **~1,900 body frames** before overlays. Overlays: faces 10 × 1 (shared
across directions by anchor), held tools ~12 × 4 dirs × pose variants ~3, back
overlays 4 × 4, wearables 6 × 4 silhouettes.

**Cut for P3 (the starter island)**, ~35 clips: faces (all), `idle`,
`idle.look_around`, `idle.fidget`, `sit`(+transition), `recharge`(+wake), `walk`,
`walk.carry`, `walk.tired`, `shuffle`, `walk.slope_*`, `wade`, `enter/exit`,
`swing.heavy`, `swing.light`, `dig`, `pluck`, `pick_up`, `drop`, `place_footprint`,
`build`, `build.complete`, `convert`, `workbench`, `eat`, `celebrate`, `discover`,
`sulk`, `think`, `write`, `pull` (hand cart), `row` (raft), `wet`, `strip`, back
overlays for battery pack and cargo frame, held overlays for axe/pick/shovel.
Everything else lands with the content that needs it (swimming with the lake,
vehicles with their tier, phone with the phone, dance with the stereo).

## 4. Priority and blending (the renderer's state machine)

1. **Interrupts** (play once, then return): `knockback`, `slide`, `discover`,
   `celebrate`, `build.complete`, `surface`, `wave`.
2. **Status locks** (replace the locomotion/idle set while the flag holds):
   `shuffle` for low_power; `shelter` for forced shelter; `stuck`; `recharge`.
3. **Activity** (what the sim says he is doing): action clips loop while the
   activity continues; progress fraction may drive which frame range (build).
4. **Locomotion** from path + medium + vehicle + flags (`walk.*`, `wade`, `swim`,
   `pull`…).
5. **Idle family** otherwise, with `look_around`/`fidget` chosen by drive bands.
6. **Face** is chosen independently: event face for 3 s, else mood face; `blink`
   interleaves; `closed` whenever recharging/resting.
7. **Tweening**: position tweens along the path between snapshots (public page);
   the clip switches on the frame boundary nearest the state change; a transition
   clip inserts only where listed.

## 5. What the sim must expose for this to work

`activity` (enum from the action list), `activity_progress` 0–1, `facing`,
`path` (+speed), `medium`, `vehicle`, `held`, `worn[]`, `carrying_fraction`,
`face` (event override), `flags[]`, `last_event` (for interrupts, with a
timestamp so late-polling public shells still play it once). All already in the
snapshot except `activity_progress`, `carrying_fraction`, `held`, `worn[]` and
`last_event` — add in P1.

## 6. Companions and wildlife (stub, for P5+)

Each actor: `idle` 4, `move` 6 (walk/waddle/fly/swim/burrow), `job` 6 (fetch/
scout/carry/dig), `react` 4 (startle/flee/curious), `sleep` 2, and a species
`call` sound. The duck adds `fall` 6 and `get_up` 6 — the whole joke. Tamed
animals add `follow` (a move variant with the head toward him) and `beg` 4.
