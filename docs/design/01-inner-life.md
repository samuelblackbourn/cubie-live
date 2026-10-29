# Design — Cubie's inner life (a self-contained character on the Pi, watched at cubie.live)

**Status: designed, not built.** Written 2026-10-29 in chat with Sam. Supersedes nothing
yet; it adds a second half to Cubie. The body design and its history stay in
[[Virtual-Office/Design-PA-Robot-Cubie]] and the current behaviour docs under
[[Virtual-Office/Cubie/Docs/00-Docs-Index]]. Read those first for what he does *today*.

## 0. The idea

Cubie is dropped into the middle of an **uninhabited world** with a starter habitat
pod — a bed that recharges him, a few basic tools, and a power converter that turns
what he harvests into energy. From there he has to look after himself: find and
harvest resources, keep his power up, explore outward into biomes he has never seen,
and build. Sam, over time, authors **blueprints** — a satellite and a computer that
give him the internet, a stereo that gives him music, whatever comes next — and Cubie
has to go and gather what they cost and build them himself. Each one gives him
something new to do. The world grows at the pace Sam designs and Cubie builds.

A small local model on the **Raspberry Pi 5** (freed 2026-10-28, see
[[Homelab/Docs/Technical/wall-kiosk]] and [[Homelab/Docs/Technical/vault-link]]) decides,
every half-minute or so, what he does next. He has **drives** (power, curiosity,
boredom, social, contentment) that rise and fall with what he does; a **diary** he
writes himself; and a **wish list** where he can tell Sam what he wishes he had. His
real face and LEDs on the desk show his *own* mood. Anyone can watch at **cubie.live**
through a floating camera they fly around themselves — over the part of the world he
has explored — and only Sam can act on it, from an **admin on the Pi**: the same world
view, with windows that open on top of it.

Talking to him through the StackChan is talking to the same character: the
conversation brain reads the same drives, diary, inventory and "what I'm doing right
now", so "what are you up to?" has a true answer, and the chat lands in the diary —
privately.

Inspiration: a TikTok of a developer running Ollama on a Pi to drive a character loose
in a virtual world with a diary, a request box and an emotion tracker (link not yet
filed to `Video-Library/`). Prior art to steal from: Stanford's *Generative Agents*
(memory stream → reflection → planning) for the diary; the survival/colony genre
(Subnautica's "you are alone, build your way out", RimWorld's needs) for the world.

## 1. Decisions (Sam, 2026-10-29)

| # | Question | Decision |
| --- | --- | --- |
| 1 | Where does the world live? | **On the Pi, a new world of his own.** Not a room in the Virtual Office. |
| 2 | Which brain for conversation? | **Fully self-contained on the Pi: Ollama for everything.** The Claude CLI brain (`CliBrain`) is retired for Cubie. Slower and dumber replies are accepted as the price of independence. |
| 3 | Where does the diary live? | **On the Pi.** Markdown files. Mirroring into the vault is a later nicety, not a dependency. |
| 4 | Personality source? | **Only what is in the vault / repo** — `pa/brain.py` `PERSONA` plus the behaviour docs (office-mood, idle, head-pet, voice). No other character material exists. Phase S1 distils these into one character file. |
| 5 | Relationship to the Virtual Office? | **Completely separate, for now.** No companion poll, no office mood, no approvals-by-voice, no office tools in the brain. The Pi stack carries no office code and no office token. Re-attaching him later is a new design decision, not a switch left in. |
| 6 | Public? | **Yes — cubie.live, read-only.** Sam bought the domain so people can watch his world. Nothing that acts on him leaves the LAN. |
| 7 | Is the diary public? | **Public, with conversation lines kept out.** What he does in his world is public; what Sam says to him is not. |
| 8 | Are wishes public? | **Visible, not actionable.** The public sees what he wishes for and what Sam did about it. Only Sam answers. Visitor suggestions are out of scope for v1. |
| 9 | Build order for the page? | **Admin first, public shell second** (rung 3 then 3b). |
| 10 | Drives on the public page? | **Mood words, not numbers.** The snapshot carries bands/phrases ("a bit bored", "running on empty"); raw floats stay in the admin. |
| 11 | How do people see the world? | **A floating camera the viewer flies around.** Not a fixed screen. The world is bigger than a viewport; the viewer pans, zooms and roams; a follow-Cubie mode is the default and resumes after the viewer goes idle. |
| 12 | 2D or 3D? | **2D pixel art** with a free pan/zoom camera. 3D not ruled out for a later version; not v1. |
| 13 | Where does the art come from? | **PixelLab for generation plus a curated local library of open-licence packs** (§4.4). |
| 14 | Where is the art made? | **All on the Pi, from the admin.** No Mac-side art session; the PixelLab key lives on the Pi. Read from "all will be done on the Pi" — implies the PixelLab plan is accepted as a subscription under the 2026-10-15 rule. **Sam to confirm that reading.** |
| 15 | Where does Sam run all of this? | **A single admin he logs into on the Pi** (§5). The admin *is* the LAN page. |
| 16 | How is the admin laid out? | **No separate pages. The world view is the whole screen; everything else is a window that opens on top of it** — including the World editor, which is a window of tools while the editing itself happens on the world. |
| 17 | What kind of world? | **A survival world, uninhabited.** Starter habitat pod in the middle (basic tools, bed/recharge, power converter). He harvests resources to make power and to build; he explores to find what he needs; several biomes to discover. **Sam authors blueprints** (buildings/objects with a cost and an unlock); Cubie gathers and builds them. First unlocks named: satellite + computer → the internet; stereo → music. |

Standing rules carried over, with amendments:

- **Subscription only, no API tokens** (2026-10-15). Ollama is local and free, so the
  *mind* spends nothing. Never add an Anthropic API-key path. The PixelLab plan is
  treated as a subscription (decision 14, pending confirmation): its key is the plan's
  key, not metered tokens, and it lives in one 0600 env file on the Pi.
- **Dumb-renderer rule.** The world is simulated on the Pi and broadcast; any page or
  screen only draws it. The camera and the windows are *viewer* state — they live in
  the browser and the Pi never knows where anyone is looking or what they have open.
- **LAN-only, low trust — amended by decisions 6 and 17.** The *robot*, the *admin*
  and every write path stay on the LAN. Outbound exceptions, all deliberate: the
  read-only snapshot through the Cloudflare Tunnel (§6); PixelLab calls from the admin
  (§4.4); **Cubie's own internet access once he has built the satellite and computer
  (§4.3) — read-only, allow-listed, rate-limited, and only reachable through that
  building**; and the firmware's boot-time OTA check against `api.tenclass.net`.
- **Per-device repo.** This lives in `samuelblackbourn/cubie` — it is still Cubie. New
  top-level folders `mind/`, `world/`, `admin/`, `site/` and `art/`; `pa/` keeps the
  body, minus its office code.

## 2. What "self-contained" means for the stack

Everything that *runs* Cubie moves to the Pi. Only firmware *building* stays on
office-server (ESP-IDF docker builds were the Pi's OOM failure mode; a build is not
runtime) — and even that is driven from the admin's System window (§5), which receives
the built `.bin` and publishes it.

| Piece | Today | After |
| --- | --- | --- |
| `stackchan-gateway` (WS 8765, capture 8766, MCP 8767) | office-server | **Pi**, LAN-only |
| `cubie-character` (face, head, modifiers, STT/TTS) | office-server | **Pi**, office poll and hook receiver removed |
| Brain | `claude -p` on office-server | **Ollama on the Pi** (`mind/`) |
| World sim: map, biomes, resources, power, buildings, blueprints, diary, drives, wishes | — | **Pi** (`world/`, `mind/`) |
| **Admin** — `http://cubie.local`, login, everything Sam does | — | **Pi**, LAN-only (§5) |
| Public page (cubie.live, snapshot-polling, no controls) | — | served by the Pi through Cloudflare Tunnel (§6) |
| Art: biome tilesets, the pod, resources, Cubie's sprite, blueprint sprites, library imports | — | **Pi**, made in the admin's World editor with PixelLab + library (§4.4) |
| Capability tools unlocked by buildings (web reader, music player) | — | **Pi**, inside the sim, gated by what he has built (§4.3) |
| Firmware build | office-server (docker) | **office-server** (a build tool, not runtime) |
| OTA manifest + image (`/api/companion/ota`, a Virtual-Office route) | office-server | **Pi** — served by the admin's System window (§2.1) |
| Office companion feed (`/api/companion/*`) | required | **gone** (decision 5) |

### 2.1 The one thread into the office, and how to cut it

Cubie's OTA manifest is currently a route *inside the Virtual-Office server*
(`/api/companion/ota`, PRs #409–#411), and `CONFIG_OTA_URL` in the firmware points at
`192.168.0.84:8420`. That is an office dependency, even though it is only a deploy
pipe. Cut it in S2: the Pi serves the same two-file shape (`firmware.json` with
`{"firmware": {"version", "url"}}`, GET *and POST*, no `force`, plus the `.bin`),
and **the last OTA served from the office delivers a build whose `CONFIG_OTA_URL`
points at the Pi.** No USB needed. After that the office route can be left in place or
removed; nothing calls it. Publishing becomes a drop-zone in the admin's System window
(upload the `.bin`, the admin reads the version out of the app descriptor and writes
the manifest — the one-author rule from `publish-cubie-firmware.sh` kept).

What stays in the office and is *about* Cubie but never talks to him: the Pixbar's
drawn Cubie face for office approvals, the `cubie_*` MCP tool family (never registered
anyway), `office-mood`, and the office's own `art` tool family that wraps PixelLab
(deliberately off there — "it spends money", [[Virtual-Office/Memory-MCP-Setup]]). None
of it is touched. The art family is a worked example of the PixelLab call shape and can
be *read* for the pattern; decision 5 means it is not *called*.

### 2.2 The Pi's budget

The Pi 5 has 4 cores and 8 GB. Budget: one 3B model resident (~2.5 GB), `faster-whisper`
small int8 (~1 GB), piper, the gateway, the sim, one web app (admin + public static).
Fits; a 256×256 tile world with a few hundred objects is nothing. CPU contention
between STT and the model is sequential by construction (he listens, then thinks), but
the **life loop must yield while a conversation turn runs** — one model, one job at a
time. The public site must cost the Pi nothing per viewer (§6), the camera and windows
cost it nothing because they never leave the browser, and PixelLab work is cloud-side.

**One model, kept loaded.** Both brains use the *same* Ollama model with
`keep_alive=-1`. Two models would mean swapping ~2.5 GB in and out of RAM on every
switch. Candidates: `llama3.2:3b`, `qwen2.5:3b`; try `gemma3:4b` if it fits. 7B will
crawl. S0 picks by measurement.

## 3. The mind

### 3.1 Drives (code, not the model)

Five floats 0–100, ticked in code. The model *reads* them; it never sets them.

| Drive | Rises when | Falls when |
| --- | --- | --- |
| **power** (his battery — real, not a mood) | recharging at the pod's bed; the converter burning resources | every tick awake; more for moving, harvesting, building; more in harsh biomes |
| curiosity | a new biome or resource found; a blueprint arrives; a building finished | the same patch of ground again and again |
| boredom | idle, nothing new | any varied action, exploring, conversation, a new capability used |
| social | — (decays steadily when alone) | Sam talks to him, a head-pet |
| contentment | a wish answered, a build finished, music, a good conversation, rest | boredom high, a wish declined, running low on power far from home |

The current mix does three things: it biases the prompt ("you're bored and your power
is low"), it picks his **resting face and LEDs** on the desk (takes the modifier slot
the office-mood painter had — [[Virtual-Office/Cubie/Docs/Technical/office-mood]] — with
his own drives as input), and it gates behaviour in code (§3.2).

**Power is the survival loop.** The pod stores power (`pod.store`); his body carries a
charge (`power`). Recharging at the bed moves power from the store to him; the
converter turns harvested resources into store. If the store is empty, the bed is just
a bed. If *he* runs out away from the pod, he does not die: he drops into **low-power
mode** — crawls home at a fraction of speed, can do nothing else, face `sad`, LEDs
dim — and the diary gets a line about it. This is the one state Sam is told about on
the robot ("I'm nearly out of power, heading home"), once, and it is the tension the
public will come to watch for.

**Mood words (decision 10).** Each drive maps to a band with a phrase per band, in
code (`mind/moods.py`): e.g. power 0–20 "running on empty", 20–50 "a bit low",
50–80 "fine", 80–100 "fully charged". The same table feeds the prompt, the public
snapshot and the admin's tooltip over the raw number. One table, three readers; the
phrases are editable from the admin's Cubie window.

### 3.2 The life loop — goals in code, choices in the model

A 3B model cannot plan a build that takes thirty ticks and three resources. So the
**planner is code** and the model makes the next move with flavour:

- **Goals.** The sim keeps a small goal stack: *stay alive* (power above a floor, home
  before dark), *current project* (one blueprint he has chosen to build), *explore*
  (nearest unexplored edge), *idle*. Code computes, each tick, what the current project
  still needs and where the nearest known source of each thing is.
- **The model picks one action from a menu the code has already filtered to what is
  possible right now** — never "harvest copper" when there is no copper in reach.

Every `TICK` (start at 45 s; tune from the admin), unless a conversation is in
progress:

1. **Observe** — time of day; where he is and what biome; power and the pod's store;
   inventory; what is nearby (resources, buildings, the edge of the explored map);
   the current project and what it still needs; the last few diary lines; open wishes.
   Kept under ~400 tokens of *variable* text.
2. **Decide** — Ollama with a JSON schema (`format`), picking **one** action from the
   filtered menu: `go(place|resource|frontier)`, `harvest(resource)`, `convert(resource)`
   (feed the power converter), `recharge`, `build(blueprint)` / `continue_building`,
   `choose_project(blueprint)`, `use(building)` (which opens that building's own
   actions — §4.3), `write_diary(text)`, `wish(item, why)`, `say(text)` (spoken on the
   robot, rate-limited), `wait`. A free-text `thought` field is allowed and logged,
   never spoken — it shows in the admin's HUD.
3. **Apply** — the sim validates and applies it; invalid picks become `wait` and are
   counted. Movement is a *path* with a speed, not a teleport; harvesting and building
   take real minutes (progress per tick), so the public sees him *doing* things.
4. **Update** — drives tick; power drains; day/night advances; the explored map grows
   around him; face/LEDs repaint if the mood band changed; the snapshot is rewritten.

**Time is real time.** A world day is a real day. Nights are for recharging; harsh
biomes cost more power; it takes real hours to gather what a stereo costs. Slowness is
the design — this is something people check in on, not something they watch for ten
minutes.

**Reflection**, once a day (end of his day) and after ~20 diary lines: a second prompt,
"what have you noticed about yourself / your days lately?", written to the diary as a
reflection. Reflections are fed back in preference to raw lines.

**Prompt order matters on a Pi.** Prompt evaluation on a Pi 5 runs at tens of tokens a
second, so an 800-token prompt costs more than the reply. Ollama reuses the KV cache
for an *identical prefix*, so: character file first (stable), then rules (stable), then
state (variable) last. S0 measures whether the cached prefix actually sticks between
calls; if not, the prompt shrinks until a tick fits in a few seconds.

### 3.3 Conversation on Ollama

`mind/ollama_brain.py` replaces `CliBrain` behind the same `Brain.respond(transcript,
state) → Reply(speech, face, actions)` seam (`pa/conversation.py` keeps its shape; the
office read before each turn becomes a world read). The state it is handed is drives,
inventory and project, today's diary (all of it, including private lines — this brain
is on the LAN), where he is and what he is doing, open wishes. Tools: `set_face`,
`write_diary`, `wish`, and — once built — the same building actions he has in the
world, so Sam can say "put some music on" and the stereo plays. The office tools
(`approve_request`, `deny_request`, `set_presence`) and `office_mcp.py` are removed,
not disabled.

A conversation bumps `social` and `contentment` and ends with the model writing one
diary line about it, tagged `conversation`. Expect **8–15 s voice turns** at first;
measure before optimising. Levers, in order: prompt size, model size, `CUBIE_LISTEN_MS`
/ device VAD, whisper size. The admin's Cubie window has a text box that runs the same
`respond()` without the microphone.

### 3.4 Diary, visibility, and the wish list (on disk)

```
/var/lib/cubie/
  character.md          # the one persona file both brains load; edited in the admin
  moods.json            # the mood-word table; edited in the admin
  diary/YYYY-MM-DD.md   # his writing; each line tagged life|conversation|reflection
  state.json            # drives, power, inventory, position, path, project, last tick
  world.json            # map, biomes, resource nodes, explored mask, buildings
  blueprints/<id>.json  # Sam's designs: cost, build time, unlock, sprite, placement rules
  wishes.jsonl          # {id, item, why, status: open|answered|declined, blueprint?, when}
  art/                  # palette, tilesets per biome, Cubie's sprite, library imports
  public/snapshot.json  # what cubie.live sees — written by the sim, never by hand
  public/art/           # the public copy of art the page needs (immutable per id)
```

**Visibility rule (decision 7), enforced in code, not in the prompt.** Every diary line
carries a source tag. `life` and `reflection` lines go into the public snapshot;
`conversation` lines never do. Two guards so a conversation cannot leak sideways:

- **Reflections are written from `life` lines only.** The model never sees a
  conversation line while writing public text, so it cannot paraphrase one into a
  reflection. A conversation still shapes him through his drives and his private
  lines — the *effect* is public, the content is not.
- **The snapshot writer filters by tag** and is the only thing that writes to
  `public/`. A test asserts a `conversation` line never reaches `snapshot.json`.

**Wishes replace the request box.** Nothing appears in the world because he asked for
it. He wishes ("I wish I had something to listen to while I work"); Sam sees it in the
Needs-you window; Sam's answer is a **blueprint** (§4.2) or a decline. A blueprint
arrives in his pod as a new thing he *could* build; the gathering and the building are
his. A wish can also go unanswered for weeks — that is allowed, and he may wish again.

## 4. The world

### 4.1 Shape

A tile map, generated once from a seed and then edited by hand: **256×256 to start**,
with the **pod at the centre**, and **several biomes** radiating outward — e.g. meadow
around the pod (safe, cheap to move in, basic resources), forest, rocky hills, desert,
tundra, a lake or coast — each with its own tileset (§4.4), its own resources, its own
power cost per step, and a few hand-placed **points of interest** Sam adds in the
editor (a wreck, a cave mouth, a strange structure) because the model needs things
worth walking to.

**Resources** are a short list, in a biome table Sam edits: scrap (meadow, wrecks),
wood (forest), stone (hills), ore (hills, caves), crystal (desert, tundra), biomass
(forest, lake). A resource node has a quantity and regrows slowly or not at all. The
**converter** turns some of them into power at a rate per kind; the rest are for
building. One table drives harvesting, conversion and blueprint costs, so a new
resource is a row, not code.

**Exploration is fog-of-war, for him and for the public.** `world.json` keeps an
explored mask that grows a few tiles around wherever he has been. The model only hears
about what is explored (plus "the edge is that way"); the public page only *draws*
what is explored — the camera flies over a map that is mostly dark on day one and fills
in over weeks. The admin sees everything.

**Day and night** follow real time with the pod's clock. Night is for recharging; he
can go out at night but it costs more and he will not want to.

### 4.2 Blueprints — how Sam gives him things to do

A blueprint is the unit of content Sam creates: a JSON file plus a sprite.

```json
{ "id": "stereo", "name": "Stereo", "size": [2,1],
  "cost": {"scrap": 8, "crystal": 2}, "build_ticks": 40,
  "place": "in_pod|outdoors|any", "requires": ["workbench"],
  "unlocks": ["music"],
  "effects": {"contentment": +15, "boredom": -20},
  "description": "A battered stereo. Plays music. Cubie can dance to it." }
```

Blueprints are **authored in the admin's Blueprints window** (§5): fill the form, draw
the footprint, generate or import the sprite (§4.4), and then either **hand it to him**
(it appears in his pod as "a design Sam left for you") or **answer a wish with it**.
The starter set, present on day one so rung 1 has something to do: *solar panel*
(adds store slowly, free power), *storage crate*, *workbench* (prerequisite for most
things), *lamp post* (lets him work near it at night). The named ones Sam wants early:
**satellite + computer** and **stereo**. After that it is whatever Sam feels like
drawing on a Sunday.

### 4.3 Capabilities — buildings that give him new things to do

A building's `unlocks` adds **actions to his menu** and **tools to his brain**, defined
in code as small, sandboxed modules (`world/capabilities/<name>.py`). The first two:

- **`music`** (stereo). `play(track)`, `stop`. Tracks come from a local library on the
  Pi (`/var/lib/cubie/music/`, Sam's own files, dropped in via the admin). Plays
  through the **robot's speaker** on the desk, and the existing dance modifier
  ([[Virtual-Office/Cubie/Docs/Technical/dancing-to-music]]) kicks in. The public
  sees "listening to <track>" and a note in the diary; **no audio leaves the LAN** —
  nothing is streamed to cubie.live.
- **`internet`** (satellite + computer, both built). `read(query)`: a **read-only web
  reader** — a search plus a fetch, text only, through a short **allow-list** Sam edits
  (news, weather, Wikipedia, a few sites he picks), rate-limited to a handful of reads
  a day, results **summarised by the model into a diary line** ("I read that it's
  raining in Shrewsbury"). No posting, no accounts, no arbitrary URLs. It is the one
  outbound door the *character* has, and it exists only because he built it.

Later candidates, written here so the shape is clear: a *telescope* (`look_up`: a daily
line about the real sky from an almanac table, no network), a *garden* (a resource
that grows), a *radio* (one-way: Sam can leave him a recorded message), a *mailbox*
(he writes Sam a letter; Sam reads it in the admin). Each is a module with a manifest,
an action list and a drive effect; the sim knows nothing about any of them in
particular.

### 4.4 Art pipeline (decisions 13–14)

All on the Pi from the admin, sharing one toolbox: a PixelLab client
(`art/pixellab.py`, REST v2, key from `/etc/cubie-art.env`, 0600, never committed) and
a local library.

**Job A — building the world (World editor window, §5).** Per-biome tilesets
(PixelLab's Wang tileset tool, one per biome, same palette), resource node sprites,
the pod and its starter furniture, points of interest, and **Cubie's own sprite**: a
StackChan-shaped body in 4 directions with walk, idle, harvest, build and sit, and a
face that uses the *same six expressions* as the robot (`idle`, `happy`, `thinking`,
`sad`, `surprised`, `embarrassed`) so world and desk show the same face. Generated from
a prompt or from a photo of the real robot (image-to-pixel-art, then 4-direction +
animations), or imported from the library. Then the map: seed-generate the biomes,
then paint by hand on the world view with the biome brush, drop resource nodes and
points of interest. All outputs land in `art/` with manifests. This is the bulk of the
PixelLab spend and it happens up front, with top-ups whenever a new biome or blueprint
needs art.

**Job B — a blueprint needs a sprite.** The same tools from the Blueprints window:
library first (`art/library/`, a curated *local* catalogue of CC0/CC-BY packs with
manifests of `{name, tags, licence, attribution, palette}`, imported through the admin
with a licence check and palette reduction), PixelLab second, with the world's palette
and a style reference. Sam sees it before he saves the blueprint, so nothing wrong
reaches the world. There is no runtime generation at all now — the art pipeline runs
only when Sam is at the admin, which keeps spend entirely in Sam's hands.

**Style consistency:** one fixed palette (`art/palette.gpl`); PixelLab calls always
carry it and a style reference; imports are reduced to it with a before/after preview
and a reject button; one tile size (16 px), one sprite scale. Where it is still patchy
the character file lets him *notice* — more charming than hiding it.

**Attribution** is a public page, `cubie.live/credits`, generated from the manifests.
CC0 and CC-BY only for v1; the importer refuses share-alike unless Sam overrides.

**Spend visibility.** The System window shows PixelLab calls this month from our own
log, and PixelLab's balance if its API exposes one.

## 5. The admin — `http://cubie.local`

One web app on the Pi (`admin/`, FastAPI, the same process as the sim so there is one
source of truth and one WebSocket), bound to the LAN interface only, never routed by the
tunnel. Sam logs in with a single password (hashed in the env file, session cookie,
login rate-limited). `cubie.local` via mDNS/avahi so no IP is ever typed — the
`192.168.0.84` lesson. HTTPS is not worth the ceremony on a LAN-only admin; if the admin
is ever wanted off the LAN, the route is a second tunnel hostname behind Cloudflare
Access, not a port.

**Layout (decision 16): the world is the screen; everything else is a window on top.**
No pages, no navigation. After login Sam is looking at Cubie's world with the flying
camera — the *whole* map, fog lifted, with the explored boundary drawn — plus:

- **A HUD** along the edges, always visible and never a window: raw drives beside
  their mood words, power and the pod's store, inventory, the current project and
  what it still needs, what he is doing, his last `thought`, the world clock, and a
  **dock** of window buttons with badges (Needs-you shows the open wish count).
- **Windows** — draggable, resizable, minimisable to the dock, several open at once,
  the world still live and flyable behind them. Positions and open/closed state are
  browser state (`localStorage`), like the camera; the Pi never knows. Each window is
  its own component over the same WebSocket, so a window is cheap to add later.

| Window | What is in it |
| --- | --- |
| **Needs you** | Open wishes with *answer with a blueprint* (new or existing) / *decline with a word*; low-power alerts; anything else that wants Sam. |
| **Blueprints** | The list of designs and which he has built; a form for a new one (name, cost, build time, size, placement rule, prerequisites, unlocks, drive effects, description); draw the footprint; make the sprite with the Job B tools; *hand to Cubie* or *use to answer a wish*. |
| **World editor** | A tool window, not a canvas: biome brush and per-biome tileset palette, resource-node dropper, point-of-interest placer, eraser, the colour palette, seed-generate, PixelLab generators (tileset / character / object), the library browser and importer, Cubie's sprite and his six faces. **The editing happens on the world view itself.** Holding the window open locks the camera in free mode and shows the grid. Save writes `art/` and `world.json`; the sim reloads without a restart. |
| **Cubie** | `character.md` editor with a "try it" box; the mood-word table; voice (piper voice, volume); a face tester for the robot; quiet hours; tick interval; the music library drop-zone; the internet allow-list and daily read cap. |
| **Diary** | Every line including `conversation` ones, tagged and filterable; reflections; a day picker; export. |
| **Tick log** | The life loop scrolling: observation summary, filtered menu, chosen action, validity, timing. |
| **Public view** | The page as cubie.live sees it — fog and all, mood words only, no private lines — so Sam can check what is public without leaving the admin. |
| **System** | Service status (gateway, character, ollama, world, cloudflared) with restart; model picker and the S0 benchmark re-runnable; RAM/CPU/temperature; the OTA drop-zone and current manifest; PixelLab usage; tunnel status; logs. |

Everything Sam does in a window is a normal write path to the same files the sim
reads; the public page never has a route to any of it.

## 6. cubie.live — the public view

- **One renderer, two shells.** `site/` holds the page that draws the world and the
  camera. The admin mounts it full-screen with the WebSocket and layers the HUD and
  windows over it; the public shell polls `snapshot.json`, has a slim read-only panel
  (mood words, inventory, current project, today's diary, wishes, credits link) and
  nothing that POSTs. Same pixels, different plumbing. The public shell is static
  files.
- **Egress via Cloudflare Tunnel on the Pi.** The Pi already runs `cloudflared` for
  `ssh.zyla.studio`; `cubie.live` is one more hostname on the same tunnel, routed to
  the app's public static mount only. No inbound port, no router change, and no
  hostname for the admin.
- **The Pi pays per tick, not per viewer.** The sim rewrites `snapshot.json` each tick;
  Cloudflare caches it (`Cache-Control: max-age=5`, cache everything rule on the
  hostname); the public page polls every ~10 s. Tilesets, sprites and blueprint art
  are immutable per id and cached for a day. The explored mask ships as a compact
  run-length string; the map itself ships with the page.
- **What is in the snapshot:** position, path and speed, activity and face; mood words;
  power and store as mood words; inventory; current project and progress; buildings
  and where they are; the explored mask; today's `life` + `reflection` lines; wishes
  with status; "listening to …" when the stereo is on; and `last_tick` so the page
  can say "asleep" or "offline" honestly (the Pixbar "NO OFFICE" lesson).
- **What is never public:** the robot (8765–8767, `/say`), the WebSocket, the admin,
  conversation lines, raw drive numbers, the unexplored map, the character file, the
  music files, any token.
- **If the Pi is off**, Cloudflare serves the last cached snapshot for a few seconds and
  then the page shows "Cubie's asleep". Nothing breaks, nothing lies.

## 7. Feature ladder

Each rung shippable on its own.

1. **He survives.** Drives with real power + mood words + sim (text only: map, pod,
   meadow resources, converter, bed, paths, explored mask) + goal stack + life loop +
   diary with tags + the starter blueprints. Proof: Sam reads a diary in which he ran
   low on power and made it home.
2. **He moves house.** Body stack on the Pi with the office code removed; the robot
   answers to the Pi; OTA served from the Pi. Face shows his own mood; the low-power
   line is spoken on the desk.
3. **You can watch, and you can build.** The admin with login: the world view, HUD,
   dock and window frame, with Diary, Tick log and System as the first windows; then
   the World editor and Blueprints windows with PixelLab and the library, and the base
   world made with them — biomes, pod, resources, Cubie's sprite; then the Cubie window.
3b. **Everyone can watch.** The public shell + snapshot with fog + Cloudflare Tunnel at
   cubie.live, with the credits page; the Public-view window in the admin.
4. **You can talk.** Ollama conversation with shared state; STT/TTS on the Pi;
   `conversation` lines private; the "try it" box.
5. **He can wish, and build what you give him.** Wishes, Needs-you window, answer with
   a blueprint, hand-to-Cubie; he gathers and builds; the first two capabilities,
   **stereo → music** and **satellite + computer → internet**.
6. **Polish.** Reflection, quiet hours, speaking out loud, new biomes and capabilities
   as Sam designs them, a desk screen in follow mode.

## 8. Phases

- **S0 — Pi prep and the model gate (one session).** Fresh OS on the Pi (the Pi is
  still running `cloudflared` for `ssh.zyla.studio` — **keep it**, see
  [[Virtual-Office/Plan-Server-Relocation-MacBook]]; cubie.live will ride the same
  tunnel). Hostname `cubie`, avahi on. Install Ollama; pull two or three 3–4B
  candidates; measure tokens/s, prompt-eval speed, and whether prefix caching holds
  between calls; prove one structured-output action pick from a filtered menu in under
  ~5 s. Output: model choice and tick length, or a no-go that shrinks the prompt.
- **S1 — Rung 1.** `mind/` and `world/` as plain Python, no robot, no page. Character
  file distilled from `PERSONA` and the behaviour docs. Resource/biome table, power
  model, goal stack, filtered menu, mood table, diary tags, explored mask, starter
  blueprints and the snapshot writer from day one, with the never-leaks test. Run it
  for two days on a placeholder map; read the diary; tune the drain so he is neither
  stranded nor bored.
- **S2 — Rung 2.** Move `stackchan-gateway` and `cubie-character` to the Pi (same
  units, new `HOME` pattern, env files); strip `pa/office.py`, `pa/office_mcp.py`, the
  poll, the hook receiver and the companion token from the Pi stack. Re-point the
  robot: `esptool.py erase_region 0x9000 0x4000` → config AP → Advanced tab first, wifi
  last, read it back. Mint the new gateway token into a file, never a shell word. OTA
  re-pointed per §2.1. Mood painter switched to drives. Stop and disable the two units
  on office-server.
- **S3 — Rung 3, in three cuts.** (a) `admin/` app with login; `site/` renderer with
  the camera, fog and placeholder tiles; the HUD, dock and window frame; Diary, Tick
  log and System windows. (b) World editor and Blueprints windows: palette,
  seed-generate, biome brush, nodes, points of interest, PixelLab client, library
  importer — then **make the world with them**: a tileset per biome, the pod, resource
  sprites, Cubie's sprite with the six faces, the starter blueprints' art. (c) Cubie
  window.
- **S3b — Rung 3b.** Public shell with fog, tunnel hostname, cache rules, DNS at
  Cloudflare for cubie.live, credits page, Public-view window.
- **S4 — Rung 4.** `ollama_brain.py`; `CUBIE_BRAIN=ollama` becomes the only brain.
- **S5 — Rung 5.** Wishes, Needs-you, hand-to-Cubie, building; the `music` capability
  (stereo, local library, robot speaker, dance), then `internet` (allow-list, cap,
  diary summaries).
- **S6 — Rung 6** as appetite allows.

Working pattern as usual: step-by-step with confirmation, feature branch + draft PR per
phase, decisions logged here.

## 9. Risks

- **Model coherence.** A 3B model drifts and ignores schemas. Mitigated by the goal
  stack and the filtered menu (the model never sees an impossible action), `format`
  schema, drive logic in code, invalid-action counting, and reflections as compressed
  memory. If it still wanders, the loop is still fun to watch.
- **The survival loop becomes a grind, or a death spiral.** Tuning is the real work of
  S1: drain rates, regrowth, converter rates, how far biomes are. Guard rails in code:
  low-power mode never strands him permanently; the solar panel is in the starter set
  so power is never *impossible*; the stay-alive goal always outranks a project. Watch
  for the opposite failure too — if he is never in danger, nobody checks in.
- **Prompt-eval cost on the Pi.** The quiet killer; §3.2. Measured in S0, not assumed.
- **RAM.** Model + whisper + piper + sim + admin. If swapping appears, drop whisper to
  `base` or `tiny` before dropping the model.
- **Two jobs for one model.** Life loop and conversation must take a lock; a tick that
  starts while Sam is talking makes him stutter. Same busy-lock shape as `_exchange`.
- **The internet door.** Read-only, allow-listed, capped, summarised, only after a
  build Sam designed. Still: a fetched page is untrusted text going into a small
  model's prompt. It is placed as *data* with a hard length cap, never as instructions,
  and the result can only become a diary line — there is no action it can trigger.
- **A conversation leaking to the public.** Guarded twice (§3.4) and tested. The
  residual risk is `life` lines that *mention* Sam — allowed; the character file can
  rein it in if it ever feels wrong.
- **A public page on a Pi that also thinks.** Mitigated by the snapshot + cache; a
  WebSocket to the public is the thing never to add.
- **The admin leaking.** Bound to the LAN interface, no tunnel hostname, password with
  rate limit, and a test that the public mount serves nothing under `/admin` or
  `/api`. The gateway, the PixelLab key, the character file and the music are
  reachable only through it.
- **A big empty world — now by design.** Fog hides most of it and follow mode lands the
  viewer on him; the dark map filling in *is* the show. Ambient life stays client-side
  (weather, day/night light, the odd bird).
- **Camera lurch.** If the renderer ever draws raw snapshot positions instead of
  tweening along the path, follow mode jumps every poll. The path-in-snapshot rule
  exists for this.
- **Editing a live world.** Sam repaints a biome he is standing in or deletes a node
  he is walking to. The sim treats an edit as an event: a vanished target cancels the
  path (he stops, looks `surprised`); a tile change under him is allowed; a deleted
  building he is in moves him outside. Edits are atomic per save, so a half-painted
  biome never reaches the public snapshot.
- **Windows over a canvas.** Pointer events have to go to the right layer — a drag in
  a window must not pan the camera, and a paint stroke must not move a window. One
  input router, decided early in cut (a), not patched in later.
- **Patchwork art.** Two art sources, one world, several biomes. One palette, one
  scale, import-time reduction with preview, style references on every generation,
  and Sam's eye before anything is saved.
- **A paid key on the Pi.** File-scoped, never committed, reachable only from the
  admin, spends only when Sam is generating, usage shown in the System window.
- **Music on a public site.** None leaves the LAN; the public sees a track name. If
  track names from Sam's library are a problem, the snapshot shows "listening to
  music" and nothing more — a switch in the Cubie window.
- **The World editor is the big build.** Biome brush, nodes, placement, generation and
  import, all on the live world view, plus a Blueprints form. Cut (b) of S3 is allowed
  to be ugly; it is Sam's tool, not the public's.
- **Office features lost.** Approvals-by-voice, office mood, desk presence. Accepted by
  decision 5; the body note records how they were built if they are ever wanted back.
- **Robot re-pointing.** The config portal lessons from the body note apply verbatim
  (URL persists, token may not).
- **OTA cut-over.** If the firmware with the new `CONFIG_OTA_URL` is bad, the A/B
  partitions roll back to a build that still points at the office route — so leave
  that route serving until the new build has booted and checked in with the Pi.

## 10. Definition of done

Sam reads yesterday's diary over coffee: Cubie found the edge of the forest, got low on
power and crawled home, and wished he had something to listen to. Sam opens the
Blueprints window, draws a stereo, sets its cost, and hands it to him. Over the next
week people on cubie.live fly the camera over a map that is filling in, and watch him
haul scrap back to the pod. One evening the diary says he built it; the robot on the
desk is dancing; the public panel says "listening to …". Nobody watching knows what
Sam said to him.

## Open

- **Confirm decision 14's reading:** the PixelLab plan counts as a subscription, and its
  key lives on the Pi.
- Map size and biome list to settle in the editor (256×256 and six biomes are
  placeholders).
- Whether track names are public (default yes, switchable).
- TikTok link to be filed to `Video-Library/` and cited here.
- Whether the Pi's HDMI gets a desk screen (rung 6).
- Whether the diary is later mirrored into the vault.

## Progress log

*(empty — nothing built yet)*

## Addendum — 2026-10-29, later. The starter island (amends §4.1)

**Decision 18 (Sam): generate a starter world that can be expanded later, bordered by
water.** Cubie has no boat, so the sea is the edge of his world until he builds one —
or until Sam adds land.

How that lands in the design:

- **The map is chunked, not one array.** `world.json` holds 32×32-tile chunks keyed
  by coordinate. The starter island is generated into the centre chunks (roughly
  128×128 tiles of land, pod in the middle); everything beyond is water chunks, and
  anything not present is treated as open sea. Expanding the world is adding chunks,
  never resizing — the editor's seed-generate gets a *region* parameter so Sam can
  grow a new island off to one side months later without touching the first.
- **Island generation** in the editor: a seed, a radius and a coastline roughness
  give the landmass; biomes are placed by distance from the pod (meadow in the
  middle, then forest and hills, harsher biomes toward the coast) with noise so it is
  not a bullseye; a beach ring; resource nodes scattered per biome table; a few empty
  slots where Sam drops points of interest by hand. Generate, look, regenerate with
  a new seed until it is right, then hand-paint the details.
- **Water is impassable** to him, and the goal stack's *explore* goal stops at the
  coast. The shore is worth something though: driftwood and washed-up scrap as beach
  resources, so the coast is a place to go, not just a wall.
- **The way out is a blueprint.** A *raft* or *boat* blueprint (needs the workbench,
  costs wood and biomass, say) adds a `boat` capability: water becomes traversable at
  a power cost, and the explore goal extends to the next shore. Sam gets to decide
  when that exists — and gets to have the next island ready before he does. A
  *bridge* is the cheaper alternative for a near island.
- **Fog and public view are unchanged**: the public page draws explored chunks only,
  and water beyond the coast reads as open sea until he crosses it.

Starter-island size and biome mix are still placeholders to settle in the editor.

## Addendum — 2026-10-29, later. Skills: a tree he builds himself (adds §3.5)

**Decision 19 (Sam): Cubie teaches himself skills — a self-building skill tree.**

Prior art: *Voyager* (Wang et al., 2023), the Minecraft agent that grows an
ever-expanding library of skills it wrote itself. A 3B model on a Pi cannot write
skills as code, so the split is the same one used everywhere else in this design:
**the structure and the numbers live in code; the names, the lessons and the story are
his.**

### 3.5 Skills

A skill is `{id, domain, level, xp, name, lesson, effect, learned_on}`.

- **Domains are branches, fixed in code**, and each capability he builds can add one:
  *harvesting*, *building*, *exploring*, *power*, *survival*, and later *music*,
  *research* (internet), whatever a new capability declares.
- **XP is earned by doing**, in code: every harvest, build tick, new chunk explored,
  night survived, conversion run. Level thresholds per domain. No prompt involved.
- **Effects come from a per-domain table** (`world/skills.py`), never from the model:
  harvesting L2 +20 % yield, L3 −10 % power per harvest; exploring L2 wider fog
  reveal, L3 remembers where resources were; power L2 cheaper nights; survival L2
  low-power mode walks faster; building L2 faster, L3 can *repair*. Some levels **gate
  actions** — *night walking* (go out after dark at normal cost), *swimming* (wade one
  tile into water for shore finds) — and **blueprints can require a skill level** as a
  prerequisite, so Sam's content and his growth pull on each other.
- **On level-up the model is asked one thing**: name what he has learned and write the
  lesson in one or two sentences, in his own words, from the recent diary lines of that
  domain. That is the "teaches himself" moment, and it is the part people will read.
  The code attaches the effect; the model attaches the meaning.
- **Insights are the self-building part.** Firsts — first time in a biome, first
  build, first night caught out, first storm, first use of a new capability — trigger
  an *insight* prompt: "what did you learn?" The answer becomes a **lesson note** in
  the tree even without a level-up. Lessons are tagged by domain and keywords, and a
  handful of the most relevant are **fed back into the prompt** when he is doing that
  kind of thing (tag match, not embeddings — cheap on a Pi). This is a memory system
  for *how*, where the diary is a memory for *what*.
- **Consolidation.** Lessons are capped per domain. The weekly reflection also merges
  and prunes them ("these three say the same thing") so the tree stays a tree and the
  prompt stays short. Voyager's library plus Generative Agents' reflection, cut to size.
- **Lessons follow the visibility rule.** They are written from `life` lines only, so
  they are public: the tree is on cubie.live with names, levels and lessons in his own
  words. A Skills window in the admin shows the same, plus the effect table (editable)
  and a prune button.
- **Guard rail.** A lesson is text in a prompt and a stat modifier in a table. A bad
  lesson can make him *think* oddly, never *act* impossibly — the filtered menu and
  the effect table are untouched by anything he writes.

Snapshot adds `skills: [{domain, level, name, lesson}]`; the HUD shows the current
domain's progress bar; the life loop's observation gains one line: "skills in play:
…". Rung 1 gets harvesting, exploring, power and survival with placeholder effects so
the loop has something to learn; the first insight prompt is the night he gets caught
out.

## Addendum — 2026-10-29, later. Art direction: the detailed end of pixel art (amends §4.1, §4.4)

**Decision 20 (Sam): high-detail pixel art**, not the chunky 16 px look. Think
Eastward, Sea of Stars, Owlboy: rich shading, big palettes, lots of animation frames —
still pixels, but dense ones.

What that changes:

- **Tile size 32 px** (not 16). Cubie's sprite ~32×48 with more frames: walk 8, idle
  with breathing, harvest, build, sit, low-power shuffle, dance. Resource nodes and
  buildings get 2–3 visual states (full / depleted; under construction / done). Every
  earlier "16 px" in this note reads as 32.
- **Palette is a family, not a cage.** No hard 16-colour palette. A master set of
  colour ramps (`art/palette.gpl`, ~64–96 colours) that every biome tileset is derived
  from; import-time quantisation targets that set rather than a tiny one. Consistency
  comes from ramps and a style reference, not from scarcity.
- **PixelLab becomes the primary source, the library secondary.** CC0/CC-BY packs at
  this level of detail are rare; the ones that exist (and 16 px packs upscaled) will
  clash. The library stays for incidental props and for the credits page to have
  something honest on it, but Job A is mostly generation: a 32 px tileset per biome
  and the character set in **one sitting, from one style reference** (a small hero
  tile Sam approves first), so the biomes agree with each other. Expect Job A to take
  more PixelLab credits than the earlier estimate; it is still a one-off.
- **The renderer earns its keep.** A 128×128-tile island at 32 px is a 4096 px square
  — fine on a canvas with chunk culling and sprite atlases, and the camera's integer
  zoom steps (1×–4×) keep the pixels honest. Add a **light layer** on the client:
  day/night tint, warm pools around the pod and lamp posts, the stereo's glow — cheap,
  and the thing that makes detailed pixel art sing at night. All client-side; the
  snapshot already carries time of day.
- **Pi cost: none.** The sim does not touch pixels; the browser does.
- **Patchwork risk goes up.** More detail means styles diverge more visibly. The
  mitigations stand — one reference, one session per batch, Sam's eye before save —
  and a biome that lands in a different style is regenerated, not patched.

## Addendum — 2026-10-29, later. A much bigger island, and range as the early game (amends §4.1, §3.2)

**Decision 21 (Sam): the starter island is much bigger than 128×128**, so there is real
space to explore and, early on, every trip is a question of power: how far, how much
it costs there and back, and how much he can carry on board.

- **Size: ~512×512 tiles as the placeholder** (16,384 px square at 32 px). The pod is
  at the centre; a straight walk to the coast is ~250 tiles, which at early power
  levels is simply out of reach. The island should have *scale*: biomes tens of
  tiles across, rivers and ridges that bend routes, distant landmarks visible on the
  minimap only once explored. Chunks (32×32) keep this cheap on the Pi and the page:
  the public shell fetches tiles only for explored chunks, cached per chunk id.
- **Range is a number the planner computes, not something the model guesses.** For
  every candidate destination the sim works out: steps there, steps back, power per
  step in each biome on the route, time of day on arrival, and whether the pod's store
  can recharge him on return. The observation says it plainly: "the ore you know
  about is 38 steps away; the round trip costs about 31 power; you have 54." The
  filtered menu **excludes trips he cannot survive** and **flags trips that are tight**
  — he is allowed to take a risk, and to be wrong by a little, because that is the
  early-game story; he is not allowed to pick a trip the numbers already call fatal.
- **Onboard storage is a stat he grows.** `power_max` starts small. It rises through
  the *power* skill branch and through blueprints: *battery pack* (bigger tank),
  *solar backpack* (trickle while walking by day), *cargo frame* (carry more per trip
  so fewer trips). The first wish he makes will probably be one of these; the
  blueprints should exist before he does.
- **Outposts are how the island opens up.** Range-extending blueprints that are built
  *out there*: a *charging post* (a small solar store he can top up from), a *cache
  crate* (leave resources, collect later — turns one long haul into several short
  ones), a *waypoint beacon* (lights the way home at night, counts for the explorer
  skill). Each one pushes the reachable radius outward; the public watches the pod's
  circle grow as a ring of outposts, which is a better expansion story than a boat.
- **Resource memory matters more.** With a big map, *exploring* L3 (remembers where
  resources were) and the cache crate are the difference between wandering and
  logistics. The goal stack's *explore* goal prefers the frontier nearest to a known
  need, not the nearest frontier.
- **Day length is a range limit too.** A trip that lands him outside after dark costs
  more and the model is told so. The *lamp post* and *waypoint beacon* blueprints and
  the *night walking* skill are how that constraint relaxes over time.
- **Tuning target for S1:** on day one, the safe radius should cover the meadow and
  the near edge of one neighbouring biome; by the end of week one, with a battery
  pack and a cache crate, about a third of the island; the coast is a month away.
  Those are the numbers to tune drain, `power_max` and converter rates against, on
  the placeholder map, before any art exists.

Map size stays an editor decision; 512×512 is the working figure.

## Addendum — 2026-10-29, later. Care packages from viewers (proposed — amends decisions 6 and 8)

**Sam asked: what if viewers could send Cubie care packages?** Worth doing — it is
the one thing that turns watching into caring — but it is the first *write* from the
public, so it has to be built so that nothing from the internet ever reaches the Pi
unfiltered, and so that a gift never breaks the survival game. Proposed as **decision
22**, pending Sam's yes.

### The mechanic

- A viewer on cubie.live picks a package from a **catalogue Sam defines** — a crate of
  scrap, a bundle of wood, a battery top-up, a lamp, a packet of seeds — and signs it
  with an alias. No free text beyond the alias. No accounts.
- A **drop pod lands somewhere on the island**, not at his feet: a random spot inside
  a radius Sam sets, a few biomes out. It shows on the public map as a beacon with
  "a package from *Alex* landed in the forest". He has to decide whether the round
  trip is worth it (§ decision 21) — so a package is a *reason to go somewhere*, not
  a handout. It waits until he fetches it, or decays after some days.
- Fetching it bumps **social** ("someone out there") and **contentment**, writes a
  diary line, and the sender's alias goes in the diary and on the public panel ("Cubie
  picked up Alex's package today"). He may *say* a thank-you on the desk, rate-limited.
- **A gift is not a supply line.** Global daily cap, per-viewer daily cap, small
  quantities, nothing that skips a blueprint's cost outright. If packages ever make
  the island too easy the cap comes down, not the catalogue.

### The plumbing — nothing inbound to the Pi

- **A Cloudflare Worker is the moat.** The public page POSTs to the Worker, not to the
  Pi. The Worker checks a Turnstile token (no captcha-solving by bots), rate-limits per
  IP, validates the payload against the catalogue (an unknown item is dropped, not
  forwarded), runs the alias through a length and profanity filter, and writes the
  package to a queue in KV. Free tier covers it many times over.
- **The Pi pulls.** Every few minutes the sim fetches the queue over the same
  outbound posture as everything else — the Pi dials out, nothing dials in. Packages
  arrive in the admin's **Needs-you window**. Catalogue-only packages with a clean
  alias can be set to **auto-approve**; anything the filter flagged waits for Sam.
  Approve → the drop pod is scheduled. Decline → gone.
- **The Worker is the only new public surface**, and it can only ever produce a row
  shaped like `{item ∈ catalogue, alias ≤ 24 chars, when}`. The Pi never parses
  anything else from it. A test asserts the sim refuses a row that is not catalogue-
  shaped even if the Worker somehow forwarded one.
- Viewer identity is an alias in a cookie, nothing more. IPs live only in the Worker's
  rate-limit bucket and expire. No emails, no logins, no payments.

### What it amends

- Decision 6 ("read-only") becomes: **read-only, plus one moderated, catalogue-bound
  gift channel that the Pi pulls from.** Nothing from the public *acts* on him
  directly; a package is a thing in the world he chooses to walk to.
- Decision 8's "visitor suggestions out of scope" stands for *free-form* input: no
  text, no wishes-from-viewers, no naming things. The catalogue is the whole
  vocabulary, and Sam owns it.

### Later, if wanted

- Packages as the thing a **tip jar** buys (Ko-fi / Stripe link → Worker). Changes the
  money posture, so a separate decision.
- The **mailbox** capability from §4.3 as the first place short viewer *text* could
  arrive — only after a building he made, only Sam-approved, only ever a diary line.
- A **drop-pod sprite** and landing animation are Job A art; the beacon is the
  waypoint beacon's sprite reused.

Rung: after 5 (he can wish and build) — **5b**. Worker + catalogue + Needs-you queue +
drop pod + public form.

## Addendum — 2026-10-29, later. Paid care packages and live streaming (proposed — needs its own note before building)

**Sam's idea:** care packages are the monetisation — viewers donate to unlock and send
one — and Cubie goes on **Twitch / TikTok Live**, where platform donations trigger
drops. This turns a side project into a small product with revenue, platform
obligations and a 24/7 broadcast, so it is **proposed here and should become
`Design-Cubie-Live.md`** before any of it is built. The parts that fit the existing
architecture cleanly:

### Money without touching the Pi

- **Donations never reach the Pi; the Worker is the moat, as before.** Three sources,
  all landing in the same KV queue as the same `{item, alias, when, source}` row:
  1. **cubie.live** — a Stripe Checkout (or Ko-fi) link per catalogue item. Stripe's
     webhook hits the Worker; the Worker verifies the signature and queues the
     package. No card data anywhere near us.
  2. **Twitch** — official **EventSub**: bits, subs, gifted subs and **channel points**
     (free, for engagement) each map to a catalogue item; the Worker subscribes and
     queues. Twitch holds the money and pays out.
  3. **YouTube Live** — Super Chat / memberships via the official API, same shape.
- **TikTok Live is the odd one out.** Gift events are only reachable through
  unofficial connectors (TikTok-Live-Connector and the like) — against ToS, break
  often, and can get the account banned. Treat TikTok as **marketing** (clips, a
  dashboard-style broadcast if their tooling allows) rather than a donation source
  until there is an official route. Twitch first.
- **Tiers** come from the catalogue: a crate is cheap, a battery pack is more, a
  rare drop (a blueprint he does not yet have — Sam-authored, limited per month) is
  the big one. The **daily caps from decision 22 still apply**; selling more than the
  game can absorb is how the show dies. Sold-out is a feature.
- **Entity, VAT and terms are real.** This is selling digital goods to consumers (or
  taking donations — Stripe's framing matters), under one of Sam's companies, with
  terms, a refund position, and VAT on digital services to think about. Not a
  blocker, but a decision for the separate note: *which company, and donation or
  purchase.*

### The stream is just another viewer

- **The Pi cannot stream.** Pi 5 has no hardware video encoder, and it is busy
  thinking. Nothing about streaming runs there.
- **The public page is a dumb renderer, so any machine can be the broadcaster**: a
  headless Chromium running the public page in a **director mode**, captured by
  ffmpeg or OBS and pushed to Twitch over RTMP. office-server (the Ubuntu MacBook) can
  do this as a *host* — it is a viewer of cubie.live like anyone else, not an office
  feature, so decision 5 holds — or a cheap dedicated box later.
- **Director mode** is a new shell on the same renderer: an auto-flying camera that
  follows him, cuts to a package landing, pans the island at dawn; a side panel with
  mood words, inventory, the current project and progress, the skill tree, the last
  diary lines as a ticker, recent packages with aliases; day/night light layer on; an
  optional picture-in-picture of the **real robot on the desk** from a webcam (his
  face reacting is the hook). Diary lines can be read aloud on the stream with his
  piper voice — rendered on the broadcaster box, not the Pi.
- **Chat does not reach him.** Twitch chat is overlaid on the stream for viewers;
  nothing from chat enters a prompt. The catalogue stays the whole vocabulary of
  viewer influence (decisions 8 and 22). If that ever changes it is through the
  mailbox building, Sam-moderated, diary-line-only.
- **Slow TV is the genre.** A 45-second tick is right for a stream people leave on —
  Fishtank-style — not for a stream people watch for ten minutes. Director mode's
  job is to make the waiting pleasant: ambient audio (the stereo when he has one,
  wind and sea otherwise), the light cycle, and an event cut every time something
  happens.
- **24/7 is an ops commitment.** A broadcaster box that restarts itself, a stream
  key in a 0600 env file, a "Cubie's asleep" card when the Pi is down, and someone
  (Sam) noticing when it is off. The Pi's posture is unchanged by any of this.

### What this changes about the brief

- Rung 5b (care packages) grows a **paid** path; the Worker gains webhook endpoints;
  the catalogue gains prices and a *source* field; the public panel gains a "send a
  package" button that opens Stripe.
- A new rung **7 — he's on air**: director shell, broadcaster box, Twitch EventSub.
- Two new standing concerns that do not exist today: **money** (entity, terms, VAT,
  refunds) and **platform ToS** (Twitch's are fine for this; TikTok's are not, via
  unofficial gift readers).

Prior art for the whole shape: Neuro-sama (an autonomous AI character with a Twitch
economy around it), the Fishtank/slow-TV format, Twitch Plays. None of them are a
small robot on a desk whose real face reacts — that is the thing to lean on.

## Addendum — 2026-10-29, later. Money: platforms and Patreon, not our own checkout (proposed)

Sam: he is the "streamer"; cubie.live's own donation page raises the question of who
registers and how VAT works; platforms are easier; add Patreon. Position taken (not
tax advice — an accountant confirms before any money moves):

- **Where the viewer pays a platform, the platform is the merchant of record.**
  Twitch, YouTube and Patreon charge the viewer their local VAT themselves and pay the
  creator a net share; the creator cannot and does not charge VAT on top. What Sam
  receives is trading income (income tax via self-assessment, or corporation tax if
  routed through a company), and the platforms now report creator income to HMRC
  under the digital-platform reporting rules.
- **Our own Stripe checkout is the hard case, so drop it for v1.** A payment that buys
  a specific package is consideration for a digital service — not a donation — and
  digital services sold to consumers outside the UK have no threshold: each
  jurisdiction wants its VAT from the first sale (EU non-union OSS, etc.). Doable with
  a merchant-of-record provider (Paddle, Lemon Squeezy) or accepted-as-donations
  framing, but it is bookkeeping and legal exposure the platforms already absorb.
  **cubie.live's "send a package" buttons link out to the platforms instead.**
- **Patreon is the natural home for the steady part.** Tiers = a monthly allowance of
  care packages (and a name on the credits page, early blueprint reveals, a monthly
  "letter from Cubie" — a public diary reflection). Patreon's webhooks
  (`members:pledge:create/update/delete`) tell the Worker who is a patron at what
  tier; the Worker credits package allowances per month; the patron spends them from
  the public page with their alias. Patreon handles VAT on memberships. The catalogue
  caps still rule — a tier buys *allowance*, not an exemption from the game's limits.
- **Twitch for the live moments**: channel points (free) and bits/subs (paid) mapped
  to packages via EventSub, as in the previous addendum; YouTube Super Chat likewise.
  **TikTok Live stays marketing-only** until an official gift API exists.
- **Who it belongs to is a Sam-and-accountant decision**: Sam personally (simplest;
  self-assessment; the £1,000 trading allowance and the Self Assessment threshold
  apply at the bottom end) or one of the companies (if that company is VAT-registered,
  its platform income enters its VAT accounting, typically as reverse-charge
  services from a non-UK platform). The design does not care which; the Worker does
  not touch money either way.

Net: no card data, no VAT returns of our own, no refunds to run. The Worker only ever
hears "this alias has N packages to spend" from Patreon/Twitch/YouTube webhooks, and
the Pi only ever pulls catalogue-shaped rows.

## Addendum — 2026-10-29, later. The public page gets windows too, starting with About (amends §6)

**Sam: an About window to explain the project.** The public shell uses the same
window frame as the admin, read-only: the world is the screen, and a small dock opens
**About**, **Diary** (public lines + reflections), **Skills** (the tree in his words),
**Packages** (recent packages with aliases, and the "send one" buttons that link out
to Patreon / Twitch), and **Credits** (generated from the art manifests). The "slim
panel" in §6 becomes this dock.

**About** is static content served with the page (`site/public/about.md`, rendered
client-side, editable from the admin's Cubie window so Sam does not redeploy to fix a
sentence). What it says, in roughly this order: who Cubie is (a real robot on a desk
in Shrewsbury and the character living in this world, one and the same); that nobody
is steering him — a small language model on a Raspberry Pi decides what he does, every
half minute or so; what you are looking at (the explored part of his island; the fog
is what he has not seen yet; his power is the thing to worry about); what the diary,
skills and wishes are; how care packages work and where they land; what is *not*
shown (what Sam says to him); the tech in one paragraph (Pi 5, Ollama, the StackChan,
PixelLab for the art); and links — Patreon, Twitch, the credits page, Sam.

First-visit behaviour: the About window opens once, on top of the world, and never
again unless asked (a `localStorage` flag; the camera is already following him behind
it, so the first thing a visitor sees is still Cubie).

## Addendum — 2026-10-29, later. Background music on the public page (amends §6, art pipeline)

**Sam: subtle background music so viewers stay while he is walking.** Agreed; it is
the cheapest engagement lever there is, and it is entirely client-side.

- **A small adaptive score, not a playlist.** A few loopable ambient tracks as
  **stems** (pad, texture, melody, percussion) per **biome**, with a day and a night
  mix; the page crossfades on biome change and on dusk/dawn (the snapshot already
  carries where he is and the time). Two extra layers driven by state: a quiet
  **tension** layer when his power band is "running on empty" or he is in low-power
  mode, and a **lift** when he finishes a build or fetches a package. Nothing loud;
  the job is to make waiting pleasant. Wind, sea and birds as a separate ambience bed
  under it, also per biome.
- **His stereo is diegetic.** Once he has built it and it is playing, the score ducks
  and the stereo's track is heard *spatially* — louder as the camera nears the pod,
  gone when far away. The real robot is playing the same track on the desk, which is
  the joke. (Whether the public hears the *actual* track depends on its licence — see
  below; by default they hear a licensed stand-in and the panel says "listening to
  …".)
- **Browsers block audio until a click.** The About window's "Enter" button on first
  visit is the gesture that starts audio; a persistent mute/volume control lives in
  the dock, remembered in `localStorage`. Returning visitors who have not muted get
  sound on their first click anywhere.
- **Licensing is the whole question**, because this plays on a public site and on a
  Twitch stream that is recorded. Options, in order of preference: (1) **commission
  or compose it** — a handful of loops, owned outright, no attribution clutter,
  Twitch-safe; (2) **CC0 / CC-BY music** (Kevin MacLeod-style catalogues, Free Music
  Archive, Pixabay's free music licence), attribution on the credits page like the
  art; (3) **a licensed library** (Epidemic Sound or similar, which covers streaming
  and VOD). Never commercial tracks, never Sam's personal library on the *public*
  side — that stays on the robot's speaker on the LAN. AI-generated music is possible
  but its licence terms for commercial/streaming use vary by service and are worth a
  read before relying on it.
- **Cost to the Pi: zero.** Opus/OGG files, a few MB in total, served with the page
  and cached by Cloudflare for a year, immutable per filename. The broadcaster box
  hears the same page audio, so the stream gets the score for free.
- **Scope.** Rung 3b (the public shell) ships with one meadow loop and the ambience
  bed; biome stems and the stereo ducking arrive with each biome's art; tension and
  lift layers with rung 5. Music files are part of Job A's "art", under
  `art/music/` with a manifest and licence, so the credits page covers them too.

## Addendum — 2026-10-29, later. The biome catalogue, and the four on the starter island (amends §4.1)

**Decision 23 (Sam): a full catalogue of biomes, with only four basic ones on the
starter island.** A biome is a row in `world/biomes.json`, not code:

```
{ id, name, tileset, ambience, move_cost (power per step, day), night_mult,
  resources: {kind: density}, regrowth, hazards: [...], gate: skill|blueprint|null,
  neighbours: [ids the generator may place beside it] }
```

### Starter island — four, plus water

| Biome | Where | Cost | Resources | Why it is here |
| --- | --- | --- | --- | --- |
| **Grass meadow** | centre, round the pod | 1.0 | scrap (wrecks), biomass (grass), the odd stone | Safe ground; the first week lives here. |
| **Light forest** | ring around the meadow, patchy | 1.2 | wood, biomass, berries (small power snack) | The first "going somewhere"; wood for the workbench and the raft. |
| **Rolling hills** | one or two lobes, further out | 1.5 (uphill), 0.8 downhill | stone, ore (sparse, in outcrops) | Ore for anything electrical — the satellite, the stereo; also the first *view*: from a hilltop the fog reveal is wider (exploring skill bonus). |
| **Sandy beach** | the whole coast | 1.1, soft | driftwood, washed-up scrap, shells (crystal substitute, rare) | Where the island ends; the shore finds make the coast worth the walk; where the raft launches. |
| Water | beyond | impassable until `boat` | — | The edge. |

Placement by the generator: meadow at the centre; forest in broken rings so there are
clearings and paths; hills as two or three lobes rather than a ring, so some routes to
the coast are easy and some are not; beach everywhere the land meets water, wider on
the lee side. One hand-placed point of interest per biome in the starter set (a wreck
in the meadow, a fallen beacon in the forest, a cave mouth in the hills — the cave is
a locked door for later — and something half-buried on the beach).

### The rest of the catalogue — for later islands and expansions

| Biome | Cost | Resources | Gate | Character |
| --- | --- | --- | --- | --- |
| **Dense forest** | 1.6, slow | hardwood, biomass, fungi | — | Dark even by day; fog reveal narrow; easy to get turned around (exploring skill matters). |
| **Jungle** | 1.8 | hardwood, vines (rope), rare fruit (big power snack), biomass | `machete` blueprint to move at normal cost | Loud ambience, rain events, the richest resources behind the most friction. |
| **Swamp** | 2.0 | biomass, peat (burns well in the converter), reeds | `waders` blueprint; or lose power to the mud | Slow, and a *place to sink a cache crate*. Night is bad here. |
| **Mountains** | 2.5 uphill | ore (rich), stone, crystal in high veins | `climbing gear` blueprint + exploring L3 | The summit is the one place the whole island is visible: full fog reveal of a radius on first ascent. |
| **Desert** | 1.3 by night, **2.2 by day** (heat drains power) | crystal, glass sand, scrap in dunes | night walking skill makes it sane | The biome you cross at night. Dunes shift — resource nodes move slowly. |
| **Rock desert** | 1.4 | ore (surface), crystal, stone | — | Flat, fast, exposed; nothing to shelter under; lamp-post-free nights are long. |
| **Savanna** | 1.0 | biomass, scrap, bones (a curiosity resource) | — | The easy biome of a *second* island: wide, warm, long sight lines. |
| **Rocky beach** | 1.3 | stone, washed-up scrap, shells | — | The alternative coast: harder to walk, more ore-rich wrecks. |
| **Tundra** | 1.7, **night ×2** | ore, peat, lichen (slow biomass) | `insulation` blueprint | Cold is a constant drain; the pod's heater becomes a building worth having. |
| **Arctic** | 2.4, **night ×3** | crystal (ice), rare ore under the ice | `insulation` + `ice drill` | The far end of the tech tree; the only reason to go is what is under the ice. |

Common rules the generator and the sim share: coasts are always beach (sandy or
rocky); harsh biomes (swamp, desert, tundra, arctic, mountains) never touch the pod's
biome; a biome's `neighbours` list keeps transitions sane (meadow → light forest →
dense forest → jungle; hills → mountains; savanna → desert → rock desert; tundra →
arctic). Each biome has one tileset at 32 px from the same style reference, an
ambience bed, and a music stem set, so adding a biome is a row plus art plus sound,
never code.

What the catalogue buys the design: **gates are the skill tree and the blueprints
meeting the map** — he cannot cross the swamp until Sam draws waders and he gathers
what they cost; the desert teaches night walking by punishing day walking; the
mountain summit is the reward for climbing gear. Each later island is picked from
this list by Sam in the editor; the sim never needs to know a biome's name.

## Addendum — 2026-10-29, later. Levels: caves as slices, and what is under every tile (amends §4.1, §3.4)

**Decision 24 (Sam): the world has sub-levels.** A cave is a new level slice he
enters; he can mine, so every tile has something underneath it and a depth he can
reach.

### Levels

- **A level is a `z`.** Surface is `z = 0`; underground is `z = −1 … −N`. Chunks are
  keyed `(x, y, z)`, so the same chunked store, explored mask, fog and snapshot
  machinery work per level with no new concepts. `+z` is reserved for later (a
  mountain top, a tower floor) and costs nothing to leave open.
- **Two ways a level exists.** *Designed caves*: Sam places a cave mouth in the
  editor and either draws the slice behind it or seed-generates a cavern (noise
  caverns, tunnels, chambers) and then edits it — the hills' cave mouth in the
  starter set is one of these. *Dug*: when he mines down from a tile, the sim
  materialises only the tiles he has dug, in a `z−1` chunk that is otherwise solid
  rock; the rest of that level is generated lazily from the seed if and when he
  reaches it. Nothing underground is stored until it is touched.
- **Connections are tiles**: a cave mouth, a shaft, a ladder, stairs. Moving through
  one changes `z`. The planner's range maths counts the climb back out, and the
  observation says "you are two levels down; the way up is 14 steps".
- **Underground is always night.** No solar, no day/night relief, a flat power cost
  per step higher than the surface, and **light is a resource**: a *lamp* or
  *helmet light* blueprint is the gate for going beyond the first chamber; fog reveal
  underground is the light's radius, not sight.

### Under every tile — strata

Every surface tile has a **column** generated from the seed and its biome: a list of
strata from the top down, each `{material, thickness, yield}`. A column is only
generated when something asks for it (a dig, the editor's cross-section view).

| Depth band | Typical strata | What he gets | Biome variation |
| --- | --- | --- | --- |
| Topsoil (−1) | soil / clay / sand | biomass (roots), clay, sand (glass) | sand under beach and desert; peat under swamp and tundra |
| Rock (−2 … −3) | stone with ore veins | stone, ore | ore richer under hills; crystal seams under desert and arctic |
| Deep rock (−4 … −6) | hard stone, rare veins, water pockets | rich ore, crystal, the odd *artefact* (curiosity) | caverns more likely here — natural chambers he can break into |
| Bedrock (−7 and below) | impassable | — | the floor; `max_depth` per island, 8 as the placeholder |

- **How far down he can go** is the lesser of the island's `max_depth` and his
  **tool tier**: bare hands scratch topsoil only; *pickaxe* (workbench, stone) opens
  rock; *drill* (ore, crystal, power to run) opens deep rock; nothing opens bedrock.
  The *mining* skill branch (new domain) lowers the power per dig and raises yield;
  mining L3 shows the vein direction in the observation ("the ore runs east").
- **Digging is building in reverse**: a dig takes ticks like a build, consumes power,
  produces the stratum's yield into inventory, and leaves an open tile. A vertical
  dig leaves a shaft tile (connection). Dug tiles are permanent, so the island slowly
  gains a warren the public can fly down into.
- **Water pockets and caverns are the underground's events**: breaking into a
  cavern reveals a whole chamber at once (big fog reveal, big curiosity); a water
  pocket floods the tile and the one below for a day (blocked, wet, a diary line).
  Collapses are deliberately *not* in v1 — nothing underground should be able to
  strand him permanently; at worst he walks a longer way out.
- **Caves have their own biome rows**: *cave* (damp stone, fungi, moss biomass,
  shallow ore), *crystal cave* (deep, bright, crystal-rich, the one underground place
  with its own light), *flooded cave* (needs waders), so the catalogue, tilesets,
  ambience and music stems extend underground the same way.

### What it touches

- **Snapshot**: position gains `z`; explored masks are per level; the public page's
  camera follows him *across* levels (follow mode switches slice with him; free mode
  gets a level picker in the dock; a cross-section toggle later). Visitors watching
  him disappear into a cave mouth and then reappear two levels down is a good moment.
- **Editor**: a level picker, the cave tools (mouth, draw, seed-generate cavern), a
  column inspector (click a tile, see its strata), and a strata table per biome
  alongside the resource table.
- **Blueprints**: pickaxe, drill, lamp, helmet light, ladder, and *mine shaft* (a
  built, lit, fast vertical connection). *Cache crate* works underground too.
- **Art**: a surface-to-cave transition tile, cave tilesets per depth band at 32 px,
  the dig animation, a shaft/ladder sprite set, and a darkness overlay in the light
  layer (the lamp is a warm circle; crystal caves glow).
- **Range**: the biggest change to the planner is that *down* costs power twice —
  there and back up — and there is no sun; the "tight trip" flag will fire a lot
  underground, which is the right amount of tension for a cave.

- **Quarry** (added to the catalogue, Sam): an open-cut biome — terraces of exposed
  rock stepping down into the ground, so it is the one surface biome that *is* a
  level change: the terraces are `z = 0 … −2` without a cave mouth. Cost 1.4 on the
  flat, 1.8 on the terrace edges. Stone in abundance, ore in the faces, the odd
  artefact in the spoil. No gate — stone is the cheap resource and a quarry is the
  first place he can get a lot of it — but it is where the pickaxe pays for itself
  (bare hands pick up loose stone only; the faces need a tool). Good on a second
  island as the "industrial" biome, and a natural home for the mine shaft blueprint.

## Addendum — 2026-10-29, later. Minimap on the HUD (amends §5, §6)

**Sam: add a minimap to the HUD.** On both shells, corner of the screen, client-side.

- **What it draws**: the explored mask of the current level as biome-coloured
  blocks (one pixel per tile or per 2 tiles at island scale), fog as dark, water as
  deep blue; the pod, built structures, outposts and cache crates as icons; the
  nearest cave mouth / shaft; Cubie as a pulsing dot with a heading tick; his current
  path as a thin line; a landed care-package beacon as a blinking dot. Day/night
  tints it.
- **Public shell**: shows explored tiles only (fog honest), no resource nodes — the
  map is what *he* knows, not a cheat sheet. **Admin shell**: whole island, fog as
  an outline, resource nodes toggleable, and the editor's region selection drawn on
  it.
- **Interaction**: click or drag on the minimap flies the camera there (free mode);
  click Cubie's dot to return to follow; scroll on it to zoom the minimap itself
  (island ↔ local). A level picker beside it when more than one level is known
  (ties to decision 24). Collapsible; state in `localStorage`.
- **Cost**: zero on the Pi. The explored mask already ships in the snapshot as RLE
  per chunk; the minimap is a second canvas drawn from the same data, redrawn only
  when the snapshot changes.
- **Director mode** (the stream) uses the same minimap, slightly larger, as part of
  its fixed layout — the "where is he on the island" shot is a stream staple.

## Addendum — 2026-10-29, later. Engine choice (proposed decision 25)

Sam asked whether this sits on a game engine. Yes for the *renderer*; no for the
*sim*. The split follows the dumb-renderer rule.

- **Renderer: Phaser 3** (browser, TypeScript). It already does everything the
  shells need: tilemap layers with culling (chunks become dynamic layers added as
  they are explored), a camera with zoom/follow/bounds/pan (the flying camera is
  `cameras.main.startFollow` + drag + `setZoom` at integer steps, `pixelArt: true`),
  sprite sheets and animation, Web Audio with crossfades, and a **Light2D pipeline**
  for the light layer (point lights from the manifest's `light` entries, the night
  tint as ambient, emissives as a separate unlit layer). One Phaser scene, three
  thin shells around it: admin (WebSocket feed), public (snapshot polling), director
  (auto-camera). **Windows and the HUD are plain DOM over the canvas**, not Phaser UI
  — that keeps the editor forms, the About markdown and the dock trivial, and the
  input router (decision 16's risk) is a DOM question: pointer events on a window
  never reach the canvas.
  *Check at S3 time whether Phaser 4 is stable; the API is close enough that the
  choice stands either way.* Alternatives considered: PixiJS (lower level, faster,
  more to write — tilemaps, camera and audio by hand); Godot web export (heavier,
  fights DOM windows and snapshot polling, better suited to a native game); Excalibur
  / Kaplay (fine, smaller communities).
- **Map data: Tiled JSON (`.tmj`)**, one file per chunk, one tileset per biome.
  Phaser loads it natively, and it means **Sam can also open any chunk in Tiled on
  the Mac** when the in-admin editor is too thin for a job (a hand-drawn POI, a cave
  slice). The admin editor reads and writes the same files, so the two never
  disagree; the sim only needs the collision and object layers out of it. Strata
  columns, explored masks and object state stay in the sim's own files, not in Tiled.
- **Sim: plain Python, no engine.** It is a 45-second tick, not a frame loop. A*
  on the chunk grid (`pathfinding` or a 60-line implementation), `opensimplex` for
  island and cavern generation, dataclasses for state, FastAPI + the WebSocket
  already planned. Nothing here benefits from an engine, and an engine on the Pi
  would compete with the model for CPU.
- **Art pipeline**: Aseprite for touch-ups and the emissive layer split (PixelLab has
  an Aseprite extension), TexturePacker-style atlasing by a small script, manifest
  → Phaser animation config generated, not hand-written.
- **Acceleration it actually buys**: the renderer, camera, lighting, audio and
  tilemap loading are solved on day one of S3; the project's real build is the
  editor window, the shells' DOM, and the sim — none of which an engine would have
  written.

## Addendum — 2026-10-29, later. Swimming, and the water biomes (amends decisions 18, 23, 24; §3.5)

**Decision 26 (Sam): swimming is a learned, earned skill; when he is in the water the
surface goes transparent to show what is underneath; water is its own set of biomes —
lakes, shallow ocean, ocean, deep ocean, ocean caves.**

### The skill

- **A new domain: `swimming`.** XP from being in water at all. L1 *wading* — one
  tile into shallow water, feet wet, that is where the XP starts and where the beach
  shells and shore finds get richer. L2 *swimming* — shallow water is traversable;
  cost high, no harvesting while swimming, a hard range cap: the planner treats a
  swim as a trip with no recharge at the far end unless there is land. L3 *strong
  swimmer* — cheaper, carries cargo, can rest floating (no recharge, slower drain).
  L4 *diving* — can go *down* (decision 24's `z` again, below the surface) for a
  limited number of ticks per dive; the limit is the thing the *diving bell* and
  *air tank* blueprints raise.
- **It is earned by nearly drowning.** The first insight prompt in this branch is
  the day he wades out too far and the planner's "tight trip" turns into "get out
  of the water now": power drains fast, he is pulled to the nearest shore in
  low-power mode, the diary gets its best line. Nothing permanent — same rule as
  everywhere: the world can scare him, never strand him.
- **The raft and boat blueprints stay**, as *carrying* alternatives: a raft crosses
  water at low cost with cargo but cannot dive; swimming is free, slow, risky and
  personal. Both exist; which he uses is his call from the filtered menu.

### What the camera does

- **In water the surface turns transparent** — the renderer swaps the water layer to
  a translucent, lightly rippling overlay above a *seabed* layer, so the viewer sees
  what is under him: sand, weed, rocks, wrecks, the drop-off into darkness. On land
  the water is opaque as now. Transition is a short fade when he enters/leaves,
  camera following him into it. At L4, when he dives, `z` changes and the camera
  follows below the surface: a blue-green tint, darker with depth, light falling off
  with the light layer, his lamp as the only warm thing.
- **Transparency is a render-state in the snapshot**: `medium: land | water |
  underwater` plus depth, so the public shell knows which look to use; the seabed
  tiles ship like any other chunk and are fog-gated like any other chunk — he only
  reveals what he has swum over.

### The water biomes (rows in `biomes.json`)

| Biome | Cost | Gate | Resources | Character |
| --- | --- | --- | --- | --- |
| **Lake** (inland, starter island may have one) | wade 1.3, swim 2.0 | L1 to wade, L2 to swim | reeds, freshwater weed, clay on the bed, the odd sunk crate | Calm, shallow, the safe place to *learn*; this is where the XP comes from early. |
| **Shallow ocean** (the coast ring) | swim 2.2 | L2 | shells (rich), seaweed, washed scrap, rock pools under the surface | Visible seabed, warm colours, the first "under the water" reveal. |
| **Ocean** | swim 3.0 | L3 | fish? (not v1 — no creatures as resources yet), drifting wreckage, kelp | Deep enough to lose the bottom in the fog; the crossing to the next island. |
| **Deep ocean** | swim 3.5, dive 4+ | L3 to cross, L4 to dive | sunken wrecks (ore-rich, artefacts), deep crystal | The seabed is only reachable by diving; the long dark drop-off is the visual. |
| **Ocean cave** (underwater `z −1…`) | dive 4.5 | L4 + `air tank` | crystal, rare ore, air pockets (a cavern with a surface — a place to rest mid-dive) | Decision 24's caves, flooded: entered from the seabed, light from his lamp only, air pockets as the puzzle. |

Rules shared with the generator: lakes are placed on the island by the generator at
low points (a river would feed them — rivers are a later row); shallow ocean is a
ring of fixed width around every coast, then ocean, then deep ocean toward the map's
sea; ocean caves hang off deep-ocean seabed as cave mouths. The raft can cross
shallow ocean and ocean; deep ocean needs the *boat*.

### What it touches

- Assets: water tilesets gain a *transparent* variant and a *seabed* set per water
  biome; underwater vegetation (kelp, weed, anemones), underwater nodes (shell beds,
  sunk crates, wreck sections, deep crystal), the swim sheets for Cubie (swim 6,
  float 2, dive 6, surface-gasp 4), the air-pocket tile, the diving bell and air
  tank blueprints (and their overlay on him). All go in the manifest and follow the
  art system's water rules (§3) plus a new *underwater* temperature in §2.
- Sim: `medium` on his state; the planner's range maths gets a no-recharge clause
  and a dive-ticks budget; the explore goal learns that a coast is no longer an
  edge once he can swim.
- Minimap: water biomes coloured by depth; his dot gets a ring when swimming.
- Music: an underwater stem set (muffled, low) with the ducking rule applied to
  everything else.

## Addendum — 2026-10-29, later. Companions, the Microduck, and sponsorship (proposed decisions 27–28)

**Sam: could Cubie craft companions — like the Microduck — and is that a sponsorship
route? Other sponsorship as a revenue stream?**

### Companions (decision 27, proposed)

Companions are **a blueprint category**, crafted like anything else, that produce an
*actor* instead of a building. They are the first thing in the world besides Cubie
that moves.

- **A companion is a scripted actor, not a second brain.** No LLM per companion — the
  Pi has one model and it is his. A companion has a tiny behaviour set in code
  (follow, wait here, fetch nearest X, scout toward the frontier, carry N items, sleep
  at the pod) and one or two drives of its own (charge, mood) so it can be neglected
  and sulk. Cubie *commands* it through his action menu (`companion.fetch(resource)`,
  `companion.scout`) — a choice the model makes, with flavour — and it does the job
  mechanically. The diary gets his view of it ("the duck brought back a shell, I
  didn't ask for a shell").
- **What a companion buys him is range and parallelism**: a scout reveals fog without
  spending his power; a fetcher turns a short haul into a background task; a
  carrier raises cargo per trip. Each one is a bigger version of the outpost idea —
  the island opens up because he has help — and each is gated behind a real build
  (ore, crystal, the workbench, a skill level), so companions arrive in the mid-game,
  not the first week.
- **The first companion is a duck.** A small bipedal duck that waddles, picks things
  up in its beak and falls over and gets up again — the sprite and behaviours are a
  nod to the real thing (§ below), and that is the sponsorship hook.
- **The desk twin.** The Cubie pattern — a character in the world with a body on the
  desk — extends to companions: if a physical Microduck sits beside the StackChan,
  the world's duck and the desk duck are the same character. Pollen ship the
  Microduck with a *simulated twin* and a sim-to-real training loop, which is
  almost exactly our architecture; the desk duck waddling over when the world duck
  fetches something is the stream moment. Wiring it is a later design note
  (`Design-Companion-Duck.md`): open SDK, LAN-only, driven by the sim's companion
  events, nothing inbound.
- **Companions on the public page**: drawn, named by Cubie (a one-line prompt when
  built), their own dot on the minimap, their own entry on the About window. No
  companion ever reaches the model's prompt as text beyond its state line.
- **Later companions**: a crab (shoreline fetcher, swims), a beetle (underground
  scout, glows), a kite (a tethered flyer that reveals fog from the pod — no body on
  the desk, it is a joke about range).

### Sponsorship (decision 28, proposed — a revenue stream alongside Patreon/Twitch)

Candidates fall out of what is literally on screen and on the desk, in order of fit:

| Who | Why they fit | Realistic ask |
| --- | --- | --- |
| **Hugging Face / Pollen Robotics** (Microduck, Reachy Mini) | The world's duck is their duck; the desk twin is their sim-to-real story told as entertainment; they already sponsored the DIY Open Duck Mini community. | A unit (or two) and permission to use the name; a feature on their blog; later, a "powered by" line. |
| **M5Stack** (StackChan, the body) | Cubie *is* an M5Stack product with a face; thousands of viewers watching one on a desk is the ad. | Hardware, a spot on their community pages, maybe a second StackChan for a companion body. |
| **Seeed Studio** (builds the Microduck; sells M5 and Pi gear) | Maker-channel marketing is their whole model. | Hardware credit, a blog feature. |
| **Raspberry Pi** | "An 8 GB Pi 5 runs his whole mind" is a line they would like. | Low odds of money; high odds of a feature if the project gets any notice. |
| **PixelLab** | Every pixel in the world is theirs; a public, long-running showcase is rare. | A plan for free, a case study, maybe credits for viewers' packages later. |
| **Ollama / a model lab** | The brain is a 3B local model doing something visibly charming for months. | A feature; model labs do like "runs on a Pi" stories. |
| Pixel-art and indie-game tooling (Aseprite, Tiled) | On the credits page anyway. | Goodwill, a feature. |

Honest expectations and rules:

- **Product seeding first, money later.** Nobody pays cash for an audience that does
  not exist yet. The realistic first-year outcome is hardware and features in
  exchange for credits and a window on the About page; cash sponsorship follows
  viewer numbers (Twitch concurrent, Patreon count) — and those are the numbers to
  track from day one so there is a deck to send.
- **Disclosure is law, not etiquette.** Any sponsored placement is labelled — on the
  About and Credits windows, in the stream's sponsored tag, and in any clip. UK
  ad rules (ASA/CAP) and Twitch's sponsored-content tags both require it; the
  credits page already exists, so the label is a line, not a new surface.
- **Sponsors never touch the sim.** A sponsor's thing can be a blueprint, a
  companion, a biome prop, a credits line. It is never a prompt, never a rule, never
  a package that bypasses the game's caps. Cubie does not "mention" sponsors; the
  world *contains* them.
- **One ask per company, written once**: what Cubie is, what's on screen, the
  numbers, what we'd like, what they get, with a link to cubie.live. Lives in the
  separate `Design-Cubie-Live.md` note with the Patreon/Twitch plan, since it is the
  same audience story.
- **The Microduck is also just worth buying** if the sponsorship ask goes nowhere:
  $399 pre-order, shipping before Christmas, fully open-source, and the desk twin is
  the single best visual the project could have.

## Addendum — 2026-10-29, later. Three rulings from Sam

1. **Sponsorship: later, after traction.** A *Sponsors* window on the public dock
   exists only once there is a deal to show; nothing is built for it now. **Sponsor
   items exist by name only if a sponsor deal exists** — until then the duck is "a
   duck", the body is "a desk robot", and no brand name appears in the world, the
   About window or the credits beyond the tooling attributions the licences
   require. Decision 28 stays proposed; no work before numbers.

2. **Interiors (decision 29).** When Cubie enters a building he **disappears from the
   world view** — the structure is drawn whole, lit if he is inside (windows, a glow at
   the door) — and a **viewer can click the building to look inside**. Inside is a
   small interior slice rendered in the same window: the room, its furniture and
   stations, and Cubie at whatever he is doing (recharging, at the workbench, at the
   stereo). Click outside or press back to return. In the sim it is a level in the
   `z`/slice sense (`interior:<building_id>`), so the pod, a later workshop, a hut
   and any big structure get an interior slice drawn once in the editor, and doors
   are connector tiles like cave mouths. The HUD still shows what he is doing; the
   minimap marks the building he is in. On the public shell the interior is as
   fog-honest as the rest — a viewer can only look inside a building he has been in.
   In director mode (the stream) the camera cuts inside automatically when he
   enters and back out when he leaves.

3. **Streams are follow-locked.** Viewers on Twitch/YouTube cannot fly the camera, so
   **director mode is follow-only**: it stays on Cubie, cuts inside buildings and
   into caves and water with him, and cuts away only for event shots the director
   script chooses (a package landing, dawn over the island, a companion returning)
   before returning to him. No free-fly on the stream. The minimap and the mood/
   inventory panel carry the context a viewer would otherwise fly to see. If a
   viewer wants to look around, the stream says so: "fly the island yourself at
   cubie.live".

## Addendum — 2026-10-29, later. Letters by rocket (proposed decision 30 — the one free-text channel)

**Sam: viewers send Cubie a message; it arrives in a rocket from space; he writes back
and launches the rocket home. A letter, not a chat. A limited random number per
day/week, chosen at random if there are too many.**

This is the mailbox capability from §4.3, given its proper mechanic, and it is the
**only** place viewer text ever reaches the model — so it gets the strictest shape in
the design.

### The mechanic

- **It needs a build.** A *landing pad* blueprint (stone, scrap, a beacon) is the
  gate: no pad, no rockets. Until he builds it, cubie.live's Letters window says the
  pad is not built yet — which is itself a reason to watch.
- **Sending**: a viewer writes a short letter on cubie.live (cap ~300 characters),
  signs it with their alias, ticks "it's fine to show this publicly". It goes to the
  Worker queue like a package. Patrons may get a bigger weekly chance, not a
  guarantee.
- **The draw**: once a day (or week — Sam's dial), the sim pulls the queue and
  **draws at random** up to N letters (start: 1 a day, 3 at weekends). The rest wait;
  after a week unpicked they expire and the sender is told the rocket "didn't get
  picked this time". Random, not first-come, so there is nothing to game.
- **Arrival**: a small rocket comes down somewhere on the island within his safe-ish
  radius — a streak at dusk, a thump, a beacon on the minimap. He has to fetch it
  (range rules apply). Opening it is an action; reading it is a *separate, tiny
  prompt* (below). The diary gets a `life` line ("a letter came from someone called
  Mo").
- **Writing back**: his reply is up to ~400 characters, in character, from the same
  prompt. **A reply costs fuel**: a few biomass through the converter, loaded into
  the rocket at the pad — so writing back is an act with a price, and he may choose
  to wait a day if power is tight. Launch is a night event (trail across the sky,
  director-mode shot). The sender finds the reply on cubie.live under their alias
  (cookie) and, if they ticked public, the letter and reply appear in the **Letters**
  window for everyone: this is the best content the project will produce.

### The guard rails — why this is safe to allow

- **Letters are data in a prompt with no tools.** The letter-reading prompt is:
  character file, a two-line state summary, the letter as a capped, quoted block,
  and one instruction — write a short reply. It has **no action menu, no tool
  calls, no diary write of its own**; the sim writes the diary line from the
  outcome. Whatever a letter says, the only thing that can come out is text in a
  reply, and that text only ever goes back to the sender and, with consent, the
  Letters window. A letter cannot move him, spend anything, or change a rule.
- **Sam moderates, with auto-approve off by default.** The Worker filters length,
  links, profanity and obvious PII; drawn letters land in Needs-you; Sam approves
  before the rocket launches. Replies are also shown to Sam before they are sent
  (auto-approve available later per channel once the model has proved itself). A
  declined letter is just never drawn again.
- **The reply is never read back into the life loop as instruction.** Reflections
  may mention "I got a letter about the sea" at the `life` level, written by the sim
  from metadata, not by quoting the letter.
- **Privacy**: aliases only; the full text of a non-public letter lives on the Pi
  and in the Worker's queue for a week, then goes; replies to non-public letters
  are shown to the sender only.
- **Rate and randomness protect the Pi and the fiction**: N a day is one prompt a
  day; the draw is seeded by the sim so it cannot be steered from the Worker.

### What it touches

- Blueprints: *landing pad* (and a later *mail drone* that fetches rockets for him
  — a companion job). Art: the rocket (descent, landed, open, launching, 4 states
  + trail), the pad, the fuel cell. Music: the launch sting.
- Worker: a `letters` queue beside `packages`, same `{alias, when}` envelope with a
  `text` field that is the only free text in the system; a reply endpoint the Pi
  pushes to; a public `letters.json` of consented pairs the page reads.
- Windows: *Letters* on the public dock (send, your replies, public letters,
  "the pad isn't built yet"); drawn letters and pending replies in Needs-you.
- Snapshot: a landed rocket as an object; "writing a letter" as an activity.
- Rung: after 5b (packages). The pad can ship first as a build with nothing to
  land, so the rocket can be seen before the mail works.

## Addendum — 2026-10-29, later. Hover inspection (decision 31)

**Sam: hovering an item outlines it and shows a small info card in a corner; if the
mouse stays still for several seconds the card fades out.**

- **Outline**: a 1-px light rim on the hovered object's silhouette (a shader pass
  on its sprite, the design system's warm-light step), on both shells. Objects,
  nodes, structures, companions and Cubie are hoverable; decals are not — which
  quietly teaches what matters.
- **Info card**: a fixed corner (opposite the minimap), same window chrome, three or
  four lines from the manifest and the snapshot — name; what it is (the blueprint's
  description or the node's one-liner); state ("ripe", "picked over", "under
  construction, 60 %"); and, for something interactive, what it gives ("drops
  softwood") on the admin and a softer version on the public page ("Cubie gets wood
  from these"). For Cubie himself: what he is doing and his mood words. For a
  building he is in: "Cubie is inside — click to look". For a companion: its name
  and job. Nothing that is not already public: no hidden resource counts, no
  unexplored facts, no private lines.
- **Behaviour**: appears after a short hover delay (~250 ms) so sweeping the mouse
  across the world does not flicker cards; **fades out after ~4 s of a static
  pointer**, comes back on movement; moving onto another object swaps it; a tap on
  touch devices does the same with a tap-elsewhere to dismiss. The card never
  covers the hovered object and never sits over the dock.
- **Cost**: client-side only — hit-testing against the sprite layer, text from the
  manifest the page already loaded. No Pi involvement.
- **Director mode**: no hover (nothing to hover with); the director script can
  show the same card for its event shots ("a package from Mo").

## Addendum — 2026-10-29, later. Viewer-funded upgrades for the real Cubie (proposed decision 32 — after traction)

**Sam: people could fund real things for Cubie — e.g. an AI accelerator for the Pi,
the StackChan/M5Stack LLM module.**

### What the hardware would actually do

- **M5Stack LLM-8850 Kit** — an Axera AX8850 NPU on an M.2 card plus a Pi HAT adapter,
  24 TOPS INT8, 4 GB or 8 GB on the card, sold as an alternative to the Raspberry Pi
  AI HAT+ 2 and supporting LLM as well as vision workloads. M5Stack's StackFlow
  stack runs models on it. For Cubie that means the model leaves the Pi's CPU: faster
  ticks, a bigger model (a 7B-class brain becomes plausible), shorter voice turns,
  and the four CPU cores freed for whisper, piper and the sim. *This is the one
  upgrade that changes what viewers see* — he gets visibly smarter.
- **Raspberry Pi AI HAT+** — the first one (Hailo-8) is a vision accelerator and does
  nothing for an LLM; the AI HAT+ 2 is pitched for generative workloads. Verify
  which models it runs at what speed before it goes on any list; the 8850 is the
  safer LLM bet today.
- Cheaper items that matter to the *show*: a desk webcam for the picture-in-picture
  (the stream's hook), a better mic, a UPS so the island never goes dark in a power
  cut, a second StackChan or a Microduck as a companion body, a small desk display
  for his world.

### The mechanic — upgrades are world events

- **An Upgrades window** (public dock, admin): a short wishlist, each item with what
  it is in plain words, what it would change ("Cubie thinks about four times
  faster"), the price, and a progress bar. Progress is **funded from the existing
  channels** — Patreon and Twitch totals that Sam allocates to a goal — not a new
  checkout (the VAT addendum stands). Ko-fi goals are the one extra that fits if a
  "chip in £3 to the brain fund" button is wanted; Ko-fi handles the money.
- **When a goal is funded, it arrives in the world.** An *upgrade capsule* lands by
  the pod (the care-package drop pod, bigger); he carries the part inside; a build
  at the workbench installs it; the diary line writes itself. The same day Sam fits
  the real part to the Pi on the desk cam. For the brain module, the **tick gets
  shorter and the model gets bigger on the same day** — the one upgrade where the
  fiction and the hardware are literally the same event. For a companion body, the
  world companion gets its desk twin.
- **Transparency**: the Upgrades window shows the receipt total once bought and a
  photo of it installed. Funders' aliases go on a plaque in the pod interior
  (decision 29) — a thing to click on.

### Rules

- **After traction, like sponsorship.** No window until there is an audience to fund
  anything; the list is drafted now so it exists when numbers do.
- Funded hardware is still ordinary income to whoever runs the channels (the VAT
  addendum), and the kit belongs to Sam. Say so on the window.
- **Upgrades change speed and scale, never the rules.** A faster brain does not get
  a bigger daily package cap or a longer range; the island is tuned to the model,
  and re-tuning after a brain upgrade is a design pass, not a reward.
- Order of goals, if asked: webcam → LLM-8850 → UPS → companion body → desk display.
  The webcam is cheap and makes the stream; the brain is the big one.

## Addendum — 2026-10-29, later. Merch (proposed decision 33 — after traction)

**Sam: a merch store too.** Yes, and it is the cleanest money in the whole plan if it
is **print-on-demand with the provider as merchant of record** — the VAT addendum's
rule again. Fourthwall (built for creators: storefront, memberships, Twitch gifting
integration, handles VAT and shipping), Teespring/Spring, or Redbubble; Shopify + a
POD app only if Sam wants to own the store and the tax admin that comes with it.

What it would sell — all of it falls out of art that already exists:

- **The pixel art.** Cubie's sprite sheets as prints and stickers; a poster of the
  explored island as it stands on a given date (the explored mask *is* the design —
  a new print every few months as the fog lifts); the skill tree in his own words;
  a "first week" diary as a small zine.
- **Resource icons as enamel pins**; the duck; the rocket; the low-power face.
- **Mood-word tees** — "running on empty", "full of beans" — with the face.
- **A map for patrons**: a numbered print of the island with the funders' plaque.

Rules: a *Shop* button on the dock links out — nothing sold on cubie.live itself;
every design uses only art the project owns (generated under the PixelLab plan's
terms — check them for merchandise use before the first product — or drawn), never
library assets, never a sponsor's mark without a deal; the credits page notes the
store's provider. Merch income is ordinary income to whoever runs it; the provider
sorts VAT to buyers. After traction, same bucket as sponsorship and upgrades.

## Addendum — 2026-10-29, later. Cubie designs merch to pay for his own mail-order (proposed decision 34)

**Sam: what if Cubie designed some of the merch, as a way of earning for his own
in-game purchases?** This closes a loop nothing else in the plan closes — his work
in the world becomes a real object, and a real object becomes something he can buy
for the world — and it stays safe because the money never crosses into the game,
only a *credit ledger* does.

### How he "designs"

A 3B model cannot draw, so the design system does the drawing and he does the
**composing** — which is the honest version of what he is:

- A design is a **template + his choices**. Templates are Sam's (in the art system's
  chrome): *the island as of today* (explored mask + biome colours, his route of the
  week as a line), *a diary line* (one of his `life` lines set in the pixel font with
  a face), *a lesson* (a skill-tree entry), *a mood* (the six faces + a mood word),
  *a find* (a resource icon + where he found it), *the duck*. He picks the template,
  the line, the face, and a palette from a short list; the renderer composes it at
  print resolution. He also names the design — the one creative act that is purely
  his.
- The prompt is the same shape as the letter prompt: no tools, a closed set of
  choices, text out. Sam approves every design in Needs-you before it goes to the
  store (as with sprites, letters, everything that becomes public). The store page
  says exactly what happened: "composed by Cubie from his own diary and map;
  assembled by the system; approved by Sam."
- The activity exists in the world: a **drafting table** blueprint (needs the
  computer) is where he does it; "designing something" is an activity viewers can
  watch and hover; the diary gets a line; the finished design hangs in the pod
  interior (decision 29) as a poster — click to buy.

### How he earns and spends

- **Credits, not money.** The POD provider's order webhook (Fourthwall has one) →
  Worker → the Pi pulls `{design_id, qty}`; the sim credits Cubie's account a fixed
  number of credits per sale of *his* designs (Sam's designs pay him nothing). The
  real money is ordinary merch income to Sam, as before. Credits are a line in
  `state.json` and a number on the HUD; they are fiction, and the About window
  says so.
- **The mail-order catalogue** is what credits buy: a capability unlocked by the
  **satellite + computer** (the internet building finally has a second use). The
  catalogue is Sam-authored, limited-stock, priced in credits: parts he cannot make
  on the island (a lens, a motor, a speaker cone), seeds for the garden, a music
  track for the stereo, a companion kit, a rare blueprint. Ordering is an action
  from the filtered menu ("you have 40 credits; the lens costs 35"); delivery is a
  drop pod a day later. **Caps apply**: stock limits and the same daily delivery
  cap as packages, so credits cannot buy his way out of the game.
- **The loop on stream**: he designs a poster of the island → it sells → he orders a
  lens → he builds the telescope → the diary says what he saw. People will buy the
  poster *because* the lens is what it buys him. The store shows, per design, what
  he has earned from it and what he spent it on.

### Rules

- Every design is Sam-approved and uses only project-owned art (PixelLab terms for
  merchandise checked first; no library assets, no sponsor marks).
- Credits never convert back to money, never buy anything a viewer could, and are
  never shown as a currency to viewers — "Cubie has enough for the lens" rather than
  a balance.
- Designs that quote a *letter* are never allowed; only his `life` lines, lessons
  and map.
- After traction, with merch (decision 33); the drafting table and catalogue can
  exist in the game earlier with a stub "nothing for sale yet" so the building has a
  reason before the store does.

## Addendum — 2026-10-29, later. Three rulings: no Sam, credits as a gift, and a daily to-do list

### 1. No reference to Sam anywhere (decision 35)

Nothing public names Sam. Where a reference is unavoidable it is **"the creator"**.

- **In the character file**, the person he talks to on the desk *is* "the creator".
  He is never told a name, so the diary, lessons, letters, designs and to-do list
  cannot contain one. Private `conversation` lines may hold whatever was said, but
  they never leave the LAN anyway.
- **In code**: the snapshot writer, the letters reply path, the design composer and
  the store copy all run through one `public_text()` filter that replaces a short
  list of names (configured in the admin, never in the repo) with "the creator" —
  belt to the character file's braces. A test asserts the name never appears in
  `public/`.
- **On the surfaces**: About, Credits, the store, Patreon, Twitch, YouTube, sponsor
  copy — "made by the creator", "approved by the creator". The companies, the town
  and the desk stay unnamed too; "a desk in England" is as specific as About gets.
  Everything in this note that says "Sam approves" reads, on the public side, as
  "the creator approves".
- This also means the **desk cam PiP shows the robot, never a person** — framing
  rule for the stream.

### 2. Credits as a gift (decision 36)

Viewers can **buy him credits directly**, as a package type, through the same
channels as everything else (Twitch bits / channel points, a Patreon tier allowance,
Ko-fi) — never through a checkout of our own. A credit gift arrives like any
package: a small drop pod with a chit inside, an alias on it, a diary line, social
and contentment up. The credits join the same ledger his designs feed (decision 34)
and buy from the same catalogue, under the same stock and daily-delivery caps, so
gifting cannot buy his way out of the game either. The public never sees a balance;
the Letters/Packages window shows "Mo sent credits toward the lens" and the catalogue
shows what he is saving for.

### 3. A visible daily to-do list (decision 37)

Each morning, at the pod, he writes a short list of what he means to do today — and
most days he will not manage it. That is the point: viewers relate to someone who
sets out to do things and gets waylaid.

- **Written by the model, from the goal stack.** The morning prompt is given the
  current project and what it still needs, the nearest known sources, his power
  and the forecast range, open wishes and any landed rocket or package, and asked
  for **3–5 intentions in his own words**, each tagged to a goal the code
  understands (`gather:wood:6`, `go:hills`, `build:workbench`, `fetch:package`,
  `rest`). The tag is what the sim checks; the wording is his ("get some wood from
  the birches before it gets hot").
- **Ticked by the sim, not by him.** Completion is detected from events — the tag's
  condition met — so a tick is earned, never claimed. Partial progress shows as a
  fraction ("4 of 6 wood").
- **Shown everywhere**: a small list on the HUD (public and admin), hoverable;
  items strike through as they complete; at dusk the day's list is frozen and the
  unmet items are what the evening reflection is asked about ("I didn't get to the
  hills again"), which is where the lessons come from. Yesterday's list is in the
  Diary window; the pod interior (decision 29) has it pinned on the wall.
- **Intentions, not orders.** The planner still outranks the list — *stay alive*
  cancels "go to the hills" when the range maths says no — and the model is not
  told it must finish the list. Interruptions (a rocket, a package, a wish answered,
  a companion coming home with something) are the normal reason items go undone,
  and they are visible on the same screen, so a viewer can see *why*.
- **Tuning**: aim for roughly a third to a half of items completed on an ordinary
  day. If he is ticking everything, the lists are too easy or the island too small;
  if nothing, the power tuning is off. The admin's Tick log shows the hit rate.
- Lists are `life` text: public, Sam-free by decision 35, and part of the snapshot
  (`todo: [{text, tag, state}]`).

- **Daily, weekly and monthly lists (Sam).** Three horizons, same mechanism, nested:
  the *monthly* list is 2–3 big intentions written on the first morning of the
  month from the project queue and the frontier ("build the satellite", "reach the
  coast", "find out what's in the cave"); the *weekly* list, written each Monday, is
  3–4 steps toward them plus whatever the week has brought (a wish answered, a
  package due); the *daily* list is 3–5 concrete items as above, and the prompt is
  shown the week's list so today's items usually serve it. Each tag rolls up: a
  daily tick advances the weekly fraction, a weekly tick the monthly. Dusk freezes
  the day; Sunday's reflection is asked about the week's misses; the month's
  reflection is the one people will read ("I meant to reach the coast. I got as far
  as the hills and built a lamp instead"). The HUD shows today's list with the
  week's headline above it; the Diary window shows all three; the pod wall pins the
  month. Unmet monthly items may carry over once, then he is asked whether to drop
  them — a decision that is his, and public.

## Addendum — 2026-10-29, later. Discoveries, wildlife and taming (decisions 38–40)

### Discovery toasts and the Journal (decision 38)

Yes — every *first* is a toast: "Cubie discovered ash", "first night in the
forest", "Cubie built a workbench", "swimming — level 2", "a letter from Mo", "Cubie
reached the coast". Bottom-centre on both shells, same chrome, ~4 s, queued (never
stacked), never over the dock; a click opens the related window. Director mode shows
them as lower-thirds — the stream's main way of telling a story at a glance.

Firsts also build a **Journal window** (public dock, admin): a codex of everything
he has found — materials, plants, animals, places, biomes, buildings — each entry
with the sprite, where and when he first met it, his own one-line note (the insight
prompt from decision 19 feeds it) and a greyed-out silhouette for things he has
heard of but not found (a blueprint's ingredient). Progress bars per biome. The
Journal is what makes a long-running world legible to someone arriving in month
four.

Naming: the manifest's cost *categories* stay (softwood, hardwood, ore …) so
blueprint costs stay legible, but every **source** is a discoverable thing with a
display name — birch, ash, hawthorn — and the toast names the source. "Cubie
discovered ash" and "needs 6 softwood" are both true and the Journal links them.

### Wildlife (decision 39)

Yes, and it belongs to this world, not ours. Two layers:

- **Ambient life** (client-side, as planned): butterflies, a crab on the shore,
  bats at a cave mouth, fish shadows under transparent water. Decoration; no sim
  cost; respects fog.
- **Sim wildlife** (new, a later rung): animals as **actors**, the same class as
  companions, a few per explored chunk at most, with small behaviour sets — graze,
  roam, flee, curious (approach, watch, leave), nocturnal/diurnal, home range per
  biome. They appear in the snapshot only in explored chunks, show on the minimap as
  faint dots, and are hoverable with his name for them.
- **No combat, ever.** He has no weapons and the world is not out to get him —
  danger is power and distance, not teeth. Wildlife is *nuisance* at most: a gull
  that takes a shell he put down, a burrower that undermines a cache crate, a
  grazer that eats the berry bush before he does. Nuisance makes animals part of
  the logistics without making the island cruel.
- **An unnamed world has unnamed animals.** Species are invented: a familiar
  silhouette with one wrong detail (a six-legged gull, a hare with ears like
  antennae, a slow armoured grazer, a glow-moth in the caves). **He names them when
  he first meets one** — a short prompt, his word, Sam-approved like all public
  text — and that name is the species name in the Journal, the toast and the hover
  card from then on. The sim's ids are boring; the public names are his.
- **Resources from animals**: shed things only — feathers, a moult shell, dropped
  antlers, honey from a hive — never the animal. Fits the biome resource table as
  rows with "from: `<species>`".

### Taming (decision 40)

Yes — as a **skill domain, `animals`**, slow and probabilistic, and the second way
to get a companion:

- **How**: feeding (berries, fungi, biomass — real cost), time, and calm (he must
  not be in low-power mode or hurrying; the sim checks). Each species has a
  tameability and a favourite food. Progress is per *individual* animal, visible as
  it starts to follow him for a while, then goes home, then comes back. A tame is a
  toast, a Journal entry and the animal's own name (his, again).
- **What a tamed animal does**: natural-behaviour versions of companion jobs — the
  gull scouts from the air (fog reveal in a line), the crab fetches from the
  shallows, the grazer carries (cargo on its back), the glow-moth lights the way
  underground. Crafted companions are *reliable*; tamed ones are *better but
  moody*: they wander off if neglected, need feeding, and will not go into a biome
  they dislike.
- **Levels**: L1 animals tolerate him (nuisance drops), L2 taming possible for
  easy species, L3 harder species and commands beyond "follow", L4 animals come
  when called from range.
- **Rules**: no breeding, no pens, no farming animals in v1 (a garden is plants
  only); tamed animals are never resources; a neglected animal leaves, it never
  dies — same rule as everything: the world can disappoint him, not punish him.
  Tamed animals get the companion treatment on the desk only if a body exists
  (none planned; the duck remains the crafted one).
- **Art**: each species is a character-class asset in the art system — 4
  directions, 3–4 behaviours, the "one wrong detail" rule added to the system's §10.
  Sound: each species gets a call and a step material.

Order: ambient life ships with the public shell; sim wildlife and taming after
companions (decision 27), since they share the actor class.

## Addendum — 2026-10-29, later. Audience votes (decision 41) and vehicles (decision 42)

### Votes (decision 41 — proposed)

Viewers vote on things **the creator would otherwise decide about the world** —
never on what Cubie does. The line is the same as packages and letters: the audience
can shape the stage, not the actor.

- **What is votable**: the biome of the next land chunk/island when the map expands;
  which of two or three blueprints the creator releases next; the name of a new
  island (from a shortlist Cubie wrote); which care-package item joins the
  catalogue; the next weather season's flavour (a wet spring or a dry one); the
  Journal entry to print as merch. **Never**: where he goes, what he builds, his
  to-do list, replies to letters, his names for things.
- **Mechanics**: a *Vote* window on the public dock with the open ballot, options
  with a picture each, the closing time and the live tally; one vote per alias per
  ballot (cookie + Worker rate-limit, no accounts), Twitch channel-point votes and
  Twitch's native polls counted in via EventSub, patrons' votes weighted ×2 at most.
  Ballots run days, not minutes — this is slow TV. The Worker holds the ballot and
  tally; the Pi pulls the result when it closes; the result lands in Needs-you for
  the creator to **apply** (the generator runs with the winning biome, the blueprint
  is handed over). The audience never writes to the sim directly.
- **In the world**: a vote's result is an event — "the next land is a jungle" shows
  as a horizon haze in that direction, a toast, a diary line ("something green out
  there"), and the morning list may change. Director mode shows the tally as a
  lower-third while a ballot is open.
- **Rules**: the creator can veto with a stated reason (shown on the window); ties
  break by patrons; no ballot touches money; results are logged on the About
  window's "the audience decided…" list so the history is visible.

### Vehicles (decision 42)

A new blueprint category and a new skill domain (`driving`). Vehicles exist to
stretch what one charge can do: **range, cargo, terrain** are the three stats, and
every tier trades power for them.

Every vehicle row: `{tier, type, cargo, speed, power_per_tile, terrain (biomes it can
cross), range_bonus (own battery), crew (companions it carries), requires (skill,
blueprints), cost, upkeep}`.

| tier | vehicle | type | cargo | speed | power/tile | terrain | own battery | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **hand cart** | dragged | ×3 | 0.8 | ×1.3 (he pulls it) | flat: meadow, beach, paths | — | planks, rope, 2 wheels (stone or scrap). Slopes and sand hurt. The first big logistics win: three trips become one. |
| 1 | **sled** | dragged | ×3 | 1.0 on snow/ice, 0.5 elsewhere | ×1.1 on snow | snow, ice, mud (slowly) | — | tundra answer to the cart. Snow-hound pulls it. |
| 2 | **barrow** | pushed, one wheel | ×2 | 1.0 | ×1.1 | +hills, forest paths | — | the everyday one; no companion needed. |
| 2 | **raft** | water | ×4 | 0.7 | ×1.2 (poling) | shallow ocean, lake, ocean (calm) | — | decision 18's raft; the tide-turtle tows it. |
| 3 | **pedal trike** | ridden | ×2 | 1.6 | ×0.6 (his legs beat walking) | flat + paths; not sand/mud | — | iron, rubber-ish (sap), wheels. The first time he outruns the day. |
| 3 | **boat** | water, sail | ×6 | 1.4 with wind | ×0.3 with wind, ×1.5 rowing | all water except storms | small (solar on the deck) | planks, cloth, rope, iron. Deep ocean opens. Weather vane matters now. |
| 4 | **buggy** | driven, electric | ×4 | 2.0 | ×0.8 but from **its own battery** | meadow, hills, savanna, desert (night), beach | medium | motor (catalogue), battery cells, iron, wheels. Range becomes *two* batteries: his and the buggy's; he can charge one from the other. |
| 4 | **trailer** | towed | +×4 per trailer, up to 2 | −0.2 speed each | +×0.2 each | as the tower | — | planks, iron, wheels. The convoy. Cache crates become unnecessary on the road. |
| 5 | **rover** | driven, electric, all-terrain | ×6 | 1.6 | ×0.7 from own battery | everything on land incl. mud, scree, shallow water (fords), snow | large (solar roof) | motors ×2, circuits, battery ×4, bright ingots. Carries two companions. Has a lamp. The island becomes a day's drive. |
| 5 | **rover + trailers** | convoy | ×6 + ×4 ×2 | 1.2 | ×1.0 | as rover, minus fords when loaded | large | the mobile base: a charging post on wheels; he can rest in it (recharge from its battery at night, away from the pod — the first time he sleeps out by choice). |
| 6 | **submersible** (later) | water, diving | ×3 | 1.0 | own battery; air-time ∞ while powered | ocean, deep ocean, ocean caves | large | decision 26's dives without the tank; lamp; the deep wrecks. |
| 6 | **airship / balloon** (later, votable) | air, wind | ×2 | 2.5 with wind | own battery (fans) | over anything; lands on flat | medium | the island from above: fog reveal ×3 along the route; weather-bound; the one vehicle viewers will beg for. |

Rules that keep vehicles honest:

- **Power is still the budget.** A vehicle with its own battery shifts the question
  from "can I get back" to "can I get back *and* recharge the vehicle" — the planner
  computes both, the HUD shows both, and the rover's solar roof is why he can go
  further on sunny days. Dragged/pushed vehicles cost *him* more per tile and give
  cargo, not range; that is the tier-1 trade.
- **Terrain gates**: each vehicle lists biomes it can enter; the planner never routes
  it elsewhere; he can *leave* a vehicle at a biome edge and walk on (it waits, a
  beacon on the minimap, the duck guards it). Paths he builds (gravel, planks)
  upgrade terrain for wheels — a reason to build roads.
- **Driving skill**: L1 drag/push; L2 ride/row; L3 drive; L4 convoy and fords; L5
  pilot (sub, airship). XP per tile moved in a vehicle. L3 unlocks *not* getting the
  buggy stuck in sand once in ten.
- **Condition applies**: vehicles have condition; salt water, mud and grit wear
  them; repaired at the workbench; a stuck or broken vehicle is a *recoverable
  event* (he walks home, the diary sulks, he comes back with rope or a companion) —
  never a lost one.
- **Companions ride**: a cart is pulled by the grazer, the sled by the snow-hound,
  the raft by the turtle; the rover carries the duck and the lamp-bot; the scout
  drone launches from the rover's roof (its range from wherever the rover is).
- **Art**: each vehicle has stationary / moving (4 directions, 4–6 frames) / loaded
  / broken states, and sits on its own layer so he is drawn *in* or *behind* it;
  ride animations for Cubie (pull, push, pedal, drive, row, sail). Sound: wheel
  materials × ground materials join the §12 matrix (wood wheel on gravel, rubber on
  sand, runners on snow), plus motor hums per tier.
- **Order**: hand cart and raft early (tier 1 with the starter blueprints); barrow
  and trike with the first vote; boat with the coast; buggy with the catalogue
  (motor); rover and trailers as the mid-game goal the monthly list keeps naming.

### Tracks and roads (decision 43)

He can build **tracks** — a tile-by-tile blueprint category that changes a tile's
movement cost and what can travel it. Roads are the quiet backbone of the mid-game:
the map stays big, but the places he goes often get cheaper to reach.

| tier | track | cost per tile | effect | vehicles it enables | notes |
| --- | --- | --- | --- | --- | --- |
| 0 | **trodden path** | free — appears after ~20 crossings of the same tiles | move cost −10 % | cart, barrow | emergent: the renderer draws worn grass where he walks; the first roads are his habits made visible |
| 1 | **cleared track** | 1 tick, biomass/branches cleared | −20 %; forest and brush tiles become path | cart, barrow, trike | shovel/axe; on existing terrain |
| 2 | **gravel track** | gravel 2 | −35 %; mud and sand no longer penalise; rain-proof | + buggy | the workhorse; quarry gravel is why the quarry matters |
| 3 | **plank road** | planks 2, pegs | −45 %; crosses swamp and shallow water (boardwalk) | + trailers | wood condition decays in rain/salt; repair |
| 3 | **stone road** | stone 3 | −50 %; permanent; fire-proof | all wheeled | slow to build; the road he will be proud of |
| 4 | **bridge** | planks or stone ×4 per tile, rope | spans water/ravine ≤ 4 tiles | all land vehicles | the cheap alternative to a boat for a near island (decision 18) |
| 4 | **cutting / ramp** | stone ×3, many ticks | removes a slope penalty; terraces the quarry | wheels on hills | mining skill helps |
| 5 | **rail** | iron ×2 + sleepers (planks) | −70 % for rail vehicles only; **mine cart** blueprint rides it (cargo ×6, pushed or gravity) | mine cart, later a **railcar** with its own battery | underground first (decision 24's shaft and the quarry), then across the island as the grand project |
| 5 | **lamp posts and beacons along a road** | existing blueprints | night cost penalty removed on lit tiles | — | the island at night from above: lit roads are the stream's best wide shot |

Rules:

- **Tracks are tiles with a cost modifier and a `surface`**, so they fit the
  footstep/wheel sound matrix (gravel, planks, stone, rail) and the art system's
  ground rules (a Wang set per track type that overlays any biome ground, plus
  bridge, ramp and rail pieces, 32 px). Tracks are the one thing the editor and the
  sim both write to the map.
- **The planner routes on cost**, so a road is used the moment it is cheaper, and
  the to-do list will start saying "extend the gravel toward the hills" because the
  goal stack sees the saving. Roads have **condition**: rain, salt, grazers and his
  own traffic wear them; repair is cheap; neglect returns them to tier 0, never to
  nothing.
- **Build cost is time**, which is the point: a road is a project that takes days of
  trips, visible on the public map as it creeps outward — the island's circulatory
  system growing. The minimap draws tracks as thin lines, lit roads as brighter
  ones.
- **Votes can pick a road's destination** (decision 41) — the one case where the
  audience steers *infrastructure*, not him; he still builds it or doesn't.
- **Companions help**: the grazer hauls gravel; the planter does nothing; the mole
  digs cuttings; the duck carries one plank and is proud of it.

## Addendum — 2026-10-29, evening. Gaps review — what the day's design has not covered

Sam asked what is missing. Raised, not decided:

1. **Backups and disaster recovery.** Everything that makes the project valuable —
   months of diary, Journal, explored map, lists — lives on one Pi SD card. Needs:
   nightly encrypted snapshot of `/var/lib/cubie` off the Pi (office-server as a
   host, or B2), a restore drill before 3b, and SD → NVMe on the Pi 5. Without this
   nothing else matters.
2. **Calendar and seasons.** Weather mentions seasons but none are defined. Real
   time means real seasons (UK) unless the island has its own year; also day-of-
   week for lists, "day 342" on the HUD, anniversaries ("a year since he landed")
   as toasts and events. A decision.
3. **Origin story and lore.** Why is he there? Who left the wrecks, the old
   lantern, the buried pod, the artefacts? A light, authored lore layer the
   Journal can hint at — never explained outright — gives the explore goal a
   narrative and the stream a mystery. Sam's to write; the character file needs
   one paragraph of it.
4. **Public-text safety.** The diary publishes automatically. A small model will
   occasionally write something odd, rude or confused. Needs: an output filter on
   all public text (profanity, PII, the name list, URLs), a "hold for review" rule
   when the filter trips, and a kill switch in the admin that pauses publishing
   without pausing him. Letters and designs already have review; the diary does not.
5. **Long-term memory.** Day → week → month reflections exist; add "his story so
   far" — a rolling few-hundred-word summary regenerated monthly, and the Journal
   as the factual memory — so month twelve's prompt still fits on a Pi.
6. **Character continuity across model upgrades.** When the brain changes (the
   8850, a bigger model), the voice will drift. Keep a fixed set of "try it"
   prompts with approved answers as a regression check in the Cubie window; run it
   before switching.
7. **The absent creator.** Sam will be away — a week, a month. The world must keep
   running with nothing breaking: wishes pile up, letters wait (expire), votes close
   unapplied, packages auto-approve if allowed, the diary keeps publishing (filter
   on). Make that mode explicit and tested. Related: **notifications** — a push
   (ntfy/Pushover) when Needs-you has something or the Pi is unwell — and whether
   approvals should be possible from a phone off the LAN (a Cloudflare Access
   hostname for the admin, later).
8. **Health monitoring.** Temperature, disk, Ollama hangs, the tick stalling.
   Watchdog restarts; "Cubie's asleep" for viewers; an alert for Sam.
9. **A fast-forward test mode.** Tuning drain, regrowth and lists by watching real
   days is too slow. A sim mode with a stub chooser runs thirty days in minutes
   without the model; S1 depends on it.
10. **Legal pages on cubie.live.** Privacy (aliases, cookies, letters kept a week),
    terms for letters and votes (consent to publish, moderation, age — under-13s on
    Twitch), the credits. One page each, plain English, "the creator" throughout.
11. **Accessibility and mobile.** Reduced-motion mode (no sway, no particles), the
    minimap's colours colour-blind safe, the Diary readable by a screen reader, and
    the public page on a phone — touch camera, windows as bottom sheets.
12. **Analytics without cookies.** Cloudflare Web Analytics for visitors, Twitch
    concurrents, Patreon count — the numbers sponsorship needs, logged from day one.
13. **The name.** "Cubie" — a quick trademark search (UK/EU/US, toys and software)
    before merch or any sponsor deal; the vault already carries a StackChan trademark
    note. Also whether the code is ever open-sourced, and under what licence.
14. **Scope.** Today's design is a year or more of work. Rungs 1–5 (survive, move
    house, admin and world, public, talk, wish and build) are v1 and already large;
    everything from care packages onward is v2+ and should be sequenced by what
    the audience numbers justify. The brief now carries ~30 addenda and should be
    **consolidated into a single structured v2 note** — decisions 1–43 in one
    table, one section per system — before S0 starts, so nothing built is built
    from a stale paragraph.
