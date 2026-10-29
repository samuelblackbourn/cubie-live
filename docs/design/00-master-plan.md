# cubie.live — master plan

> Repo copy of the vault note `Virtual-Office/Design-Cubie-Live-Master-Plan.md`
> (snapshot 2026-10-29). The vault is canonical until this file says otherwise;
> the `## Progress log` lives in the vault.

The build order for everything in `01-inner-life.md`, `02-assets.md`,
`03-art-system.md` and `04-items.md`. Written 2026-10-29 evening with the creator.
**Status: the plan. Nothing built.**

## 0. Rulings that reshape the plan (2026-10-29 evening)

| # | Ruling | Consequence |
| --- | --- | --- |
| 44 | **A separate project from the StackChan.** The robot, its gateway, the character stack and the office stay exactly as they are on office-server. cubie.live is built on the Pi as its own thing; the body joins later, if at all. | S2 ("he moves house") is gone from v1. No voice brain, no STT/TTS, no OTA, no robot re-point. The Pi runs only: Ollama, the sim, the admin, the public site. **New repo: `samuelblackbourn/cubie-live`** (the robot repo stays `cubie`). The character is still Cubie. |
| 45 | **Island time runs 4× real time** (a config, not a constant). An island day is 6 real hours; a full day-night cycle fits an evening. Tick stays ~45 s (model-bound), so a day is ~480 ticks. Faster (6×–8×) is a dial to try once the public shell exists; weekly and monthly lists and letter draws are *island* periods. | Tune drain, regrowth and range per island day, not real day. "Day N" on the HUD counts island days. |
| 46 | **The island has its own calendar.** Not Earth's seasons, not any place's. Working figure: 4 seasons × 30 days = a 120-day year (a month per real week at 4×; a year a month). Seasons are unnamed until **he names them** the first time he lives through one — same rule as animals. Day-of-week exists for lists (a 6-day week, say; he names the days too, or doesn't). | The calendar, like the weather, is a table. "A year since he landed" is an island year. |
| 47 | **No authored lore.** The wrecks, the lantern, the buried pod, the artefacts exist; what he writes about them *is* the lore, and it develops on its own. The character file says nothing about why he is there. | Keeps everyone guessing, including the creator. |
| 48 | **Long-term memory in an Obsidian vault on the Pi.** `/var/lib/cubie/` *is* a vault: `diary/`, `journal/`, `lessons/`, `lists/`, `story-so-far.md`, with wikilinks the sim writes. The public diary reads from it; the admin's Diary window is a vault view; the creator can open it in Obsidian over the LAN. Story-so-far is regenerated monthly from the month reflections. | One file tree, three readers. |
| 49 | **Character continuity comes from memory, mostly.** The character file + story-so-far + **a handful of his own best diary lines as style exemplars in every prompt** carry him across model changes. A new model will still phrase differently; the check is an eyeball of a week's diary after a switch, not a test suite. | Exemplars are picked by the creator in the admin (a ★ on a diary line). |
| 50 | **Automate everything that can be.** The Pi should need the creator as little as possible. | See §1. |
| 51 | **Public-text automod**: censor, don't hold. | See §1. |
| 52 | **Storage**: the Pi boots and stores on **NVMe** (a Pi 5 NVMe HAT), not SD. Off-Pi backups are still required — drives fail and Pis get knocked off desks. | Nightly encrypted snapshot of the vault + state to office-server (as a host) or B2; monthly restore test. |
| 53 | **Scope**: a master plan with a go-live point; starter-island content only until live; later biomes, their assets, substances, vehicles beyond tier 2 and the audience economy come after. | This note. |
| 54 | **The Pi pulls** — deploy and content logistics. | See §5. |

## 1. Autopilot — what runs without the creator

Design rule: **the creator authors content in batches; the sim runs everything
else.** Defaults, all switchable in the admin:

| thing | automated behaviour | creator's only job |
| --- | --- | --- |
| Diary, lists, lessons, Journal, story-so-far | publish automatically through the **automod**: a word list censors to `f***`, PII patterns (emails, phones, postcodes) and URLs are stripped, the name list → "the creator". Only a *hard* trip (a filter failure, a model refusal, an empty day) holds a line for review. | glance at the held queue when there is one |
| Wishes | logged; unanswered wishes expire after an island month and he may wish again | answer the ones worth a blueprint, in batches |
| Blueprint releases | a **release queue**: the creator pre-authors blueprints; the sim releases one when he wishes for something matching, or on a schedule (one per island week), or when a vote picks it | keep the queue stocked (an afternoon a month) |
| Sprites for blueprints | generated at authoring time, previewed to the creator then | approve while authoring |
| Care packages (v2) | catalogue items auto-approve; flagged aliases hold | spot-check |
| Letters (v2) | filter → draw → reply → **automod on the reply** → launch. Auto-launch on by default once the model has done a clean week; held only on a hard trip | read the public Letters window like anyone else |
| Votes (v2) | ballots open on schedule from a ballot queue; results **auto-apply** (generator runs the winning biome; the blueprint releases) | write ballots in batches |
| Designs / merch (v2) | drafting table runs; designs go to a review queue — the one thing that stays manual, because it is money and brand | approve weekly |
| Health | watchdog restarts services; the tick stalling, disk, temperature and Ollama hangs alert by push (ntfy); "Cubie's asleep" shows to viewers | respond to pushes |
| Backups | nightly, automatic, verified by restore test monthly | nothing |
| Absent creator | all of the above continue; nothing requires a human to keep the world running for at least an island year | — |

## 2. Phases — the go-live line is after P4

Each phase ships on its own; nothing in a later phase is started before the earlier
one is running for real.

### P0 — Pi prep and the model gate (1 session)
NVMe boot, fresh OS, hostname `cubie`, avahi, `cloudflared` kept. Ollama; two or three
3–4B candidates; measure tokens/s, prompt-eval, prefix cache; one structured-output
pick from a filtered menu under ~5 s. Backup job and restore drill set up *now*, on an
empty vault. Output: model, tick length, backup proven. Brief: `docs/sessions/P0.md`.

### P1 — He survives (text only)
`world/` and `mind/` in Python. Calendar (4×, island year), weather table (starter
rows only), the starter biome table (meadow, light forest, hills, beach, lake,
water), resource rows for the island, strata and the hills cave, power/condition,
goal stack, filtered menu, drives and mood words, diary with tags and the automod,
Journal, skills (harvesting, exploring, power, survival, mining, swimming L1,
animals L1), daily/weekly/monthly lists, starter blueprints incl. hand cart and
raft, tracks tier 0–2, explored mask and the snapshot writer with the never-leaks
test, the vault layout, story-so-far, **the fast-forward test mode**. Run thirty
island days in minutes; tune. Then run a real island week; read the diary.

### P2 — The admin and the renderer
Phaser renderer on placeholder tiles, camera (follow/free, levels, interiors,
water transparency), fog, minimap, HUD, dock and windows (Diary, Tick log, Journal,
System, Needs-you), hover cards, toasts, automod queue, push notifications,
watchdog. Tiled chunk files. Login, LAN-only.

### P3 — The world gets its art
World editor and Blueprints windows (PixelLab client, library importer, palette
reduction, biome brush, seed-generate, levels, column inspector). Hero tile approved;
the art system becomes "as approved". Then the starter-island manifest in full:
tilesets, Cubie's sheets, meadow/forest/hills/beach/lake/cave assets, resource icons,
starter blueprints, cart, raft, tracks, the pod interior. Sound: footsteps for the
island's materials, tool hits, pod, UI; one meadow loop and the ambience beds;
light layer; ambient critters. Re-run tuning with real walking speeds.

### P4 — Public: cubie.live  ← **go-live**
Public shell: snapshot polling, cache rules, tunnel hostname, DNS; About (first-
visit, audio gesture), Diary, Journal, Skills, Lists, Credits windows; discovery
toasts; minimap; mobile layout (touch camera, bottom-sheet windows), reduced
motion; legal pages; cookie-free analytics; "Cubie's asleep". Backups verified
against the live vault. Launch quietly; watch a month of island years go by; fix
what viewers trip over.

Everything above uses only what is on the starter island. Nothing below starts
until P4 has run for a few real weeks.

### P5 — The audience (v2, in this order, each a release)
1. Care packages (Worker, Turnstile, catalogue, drop pods) + credits as a gift.
2. Patreon tiers and Twitch EventSub (packages, channel points); the Packages window.
3. Letters by rocket (landing pad blueprint, the letter prompt, auto-launch after a
   clean week), the Letters window.
4. Votes (ballot queue, auto-apply) — first ballot: the biome of the first new land.
5. Director mode + the broadcaster box (follow-locked); Twitch; music stems per
   biome; lower-thirds.
6. Companions: the duck first (crafted), then sim wildlife and taming for the
   starter island's species only.

### P6 — The world grows (v2, content-led, as votes and wishes ask)
New land by vote: one biome at a time, each as a *set* (tileset, assets, sounds,
substances, species, blueprints and gates) from the catalogue in the design notes.
Vehicles tier 3+ land with the biomes that need them; rail with the quarry. Hazards
beyond the island's mild set arrive with their biomes.

### P7 — Money and marketing (when the numbers say so)
Merch (POD, Cubie's designs, the drafting table and catalogue), sponsorship (items
by name only with a deal), funded upgrades, the sponsors and upgrades windows.

### P8 — The body (optional, later)
Re-attach the StackChan as his desk twin. Its own design note when its time comes;
nothing in P0–P7 depends on it.

## 3. What is deferred, explicitly

- Biomes not on the starter island, and all their assets, sounds, substances,
  species and gates.
- Swimming beyond wading; water biomes beyond the lake and the beach shallows.
- Vehicles above tier 2; rail; bridges.
- Companions, wildlife and taming (until P5.6).
- Everything the audience does (P5), everything money (P7), the robot (P8).
- Interiors beyond the pod; levels beyond the hills cave's first chamber.
- Any hardware upgrade.

## 4. Cadence for the creator after go-live

Roughly: an afternoon a month stocking the blueprint and ballot queues; an hour a
week reading held lines and the design queue; a Sunday every quarter for a new
biome set. The sim does the rest. If that cadence slips, the island simply gets
quieter — it never breaks.

## 5. Deploy and content logistics (ruling 54 — the Pi pulls)

Nothing can push to the Pi (LAN-only, no inbound), so **the Pi pulls**, for code and
for content, and a deploy never interrupts him.

### Code — `cubie-live` main → the Pi

- A systemd timer (`cubie-deploy.timer`, every 5 min) runs `deploy/pull.sh`: `git
  fetch`; if `origin/main` moved, check out the new commit into
  `/opt/cubie-live/releases/<sha>`, install deps (`uv sync`, `npm ci && npm run
  build` for the site), run **world migrations** (`world/migrations/NNN_*.py`,
  versioned, each one backing up the files it touches to the restic snapshot
  first), then switch the `current` symlink and `systemctl restart` the sim and
  the admin.
- **Restart within one tick.** The sim checkpoints `state.json` on every tick and on
  `SIGTERM`; on start it resumes from the checkpoint; the snapshot file keeps being
  served by the static server throughout, so viewers see at most one skipped tick —
  never "Cubie's asleep" for a deploy. Deploys that fail a health check (`/healthz`
  within 60 s) roll the symlink back and push an ntfy alert.
- **Only `main` deploys**; feature branches and draft PRs stay the working pattern.
  A GitHub Action runs tests on PRs so a broken main is rare; the Pi never runs
  Actions.

### Content — biomes, assets, blueprints, sounds

- **Rows** (`biomes.json`, `resources.json`, `tools.json`, `actors.json`,
  `blueprints/*.json`, the substance and weather tables) live in the repo under
  `content/` and deploy with code; a migration validates them against the schema.
- **Files** (tilesets, sprites, sound) live in a **content bucket** (Cloudflare R2)
  under `content/<set>/<version>/`, with a `manifest.json` per set that the repo's
  `content/sets.json` pins by version and hash. `deploy/pull.sh` syncs any newly
  pinned set into `/var/lib/cubie/art/` and `public/art/` before the restart.
  Public art is served by hash-named files, so cache-busting is free.
- **Authored on the Pi** → the admin's *Publish set* button uploads the set and
  opens a PR that bumps `sets.json`. **Authored on the Mac** → `tools/publish-set.sh`
  does the same from a folder. The pin moves only after the upload completes.

### P0 and P1 additions

P0 step 9 scaffolds `deploy/` with the timer, `pull.sh`, the release layout and
`/healthz` stub; P1 adds checkpoint/resume and the first migration; P3 adds the
R2 bucket, `sets.json` and the Publish-set button. Secrets for R2 go in
`/etc/cubie/r2.env`, 0600, like everything else.
