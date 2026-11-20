# Session brief — art-01: Cubie's placeholder sheets

**Track:** art, running in parallel with P0. The creator authorised this work on
2026-11-13 while the Pi is out of reach. It is art only: no sim, admin, site or
deploy code, and no change on the Pi.
**Skill:** `cubie-pixel-art`. Load it before anything else and follow it. Use it
for every drawing step; do not use `office-pixel-art`.
**Working pattern:** step by step, confirm each step with the creator. Feature
branch + draft PR for everything, never `main` (repo `CLAUDE.md`).

## Where things stand

- Cubie's look is **approved**: `docs/design/07-cubie-character.md`. Read it first.
  The sprites are in `art/reference/cubie/` and the source is
  `art/src/cubie/turnaround.mjs` (model `O`).
- Live review board: the "Cubie — visual design system (draft)" design canvas,
  page 4 (https://claude.ai/artifact/5LnwhYzUHP7ZLVFMjaGygB). Pages 1–3 are
  older drafts.
- The view is the **Virtual Office characters' angle**, measured from
  `webview-ui/public/assets/characters/char_0.png` in
  `samuelblackbourn/Virtual-Office` (read-only reference; nothing from that repo
  is copied into this one except the two drawing scripts below).
- The skill's scripts are **not ported yet**, so `turnaround.mjs` will not run
  until step 1 is done.

## Steps (confirm each with the creator)

1. **Port the skill scripts. This is a PR of its own, with no art in it.** Create
   `.claude/skills/cubie-pixel-art/` with `scripts/pix.mjs` and `scripts/png.mjs`
   copied unchanged from the Virtual Office skill
   (`.claude/skills/office-pixel-art/scripts/`, branch `main`, or
   `claude/skill-office-pixel-art-v2` if `pix.mjs` is missing on `main`). Add
   `sheet.mjs` the same way. Then write the project-specific scripts the skill
   lists in §7, starting with `style-check.mjs` (class `cubie`) and
   `check-pack.mjs`. Then check that
   `node art/src/cubie/turnaround.mjs /tmp/out` reproduces
   `art/reference/cubie/` byte for byte.
2. **Bring the missing design notes into the repo.** Copy them from the vault
   (canonical) into `docs/design/` as snapshots: `02-assets.md`
   (`Virtual-Office/Design-Cubie-Assets.md`), `03-art-system.md`
   (`…Art-System.md`), `06-animations.md` (`…Animations.md`). While doing
   this, fix the art system's scale line: "a two-tile tree is twice his height"
   is wrong, because 64 px is ~1.33× his 48 px. Ask the creator which number is
   right, then change it in the vault too.
3. **Placeholder clips.** These follow skill §4 and are P2 placeholders; PixelLab
   makes the canonical ones in P3. Build them from the same model as
   `turnaround.mjs`:
   - `idle`: 4 frames × S, W, E, N (a 1-px bob, plus a blink on one frame)
   - `walk`: 8 frames × S, W, E, N. With legs only 6 rows tall, the stride
     shows through alternating feet, arm swing and a 1-px body bob, the same
     way the office walk does.
   - Each clip is a horizontal strip with one row per direction (S, W, E, N), a
     `<clip>.json` beside it (frame 32×48, count, fps, loop), the face drawn
     as an overlay by anchor rather than baked in, and the chest strip keyed
     `#ff00ff`.
   - The emissive layer goes in a separate `_emissive.png`: eyes, mouth,
     strip, antenna bobble and charge LED.
   - Do at least two look-and-fix passes. Keep `pass1/` and `pass2/`, and make a
     before/after sheet. Then run `check-pack.mjs`.
   - Animate a preview at 1× and 4× on the meadow so the creator can judge the
     walk in motion.
4. **Hand-over.** Open a draft PR with the clips under `art/cubie/`, the build
   scripts under `art/src/cubie/`, manifest rows marked `placeholder`, the
   `look/` sheets in the PR description, and the still-weak list. Log decisions
   to the vault in ten lines or fewer: append to
   `Virtual-Office/Cubie-Live/00-Index.md` progress, or to the art-system change
   log.

## Known weak spots to fix while animating

- In the side views, the near arm covers most of the body. Try the arm one
  column further back.
- In the back view, the head vent sits low.

## Do not

- Re-proportion Cubie, or change the view, without the creator asking. Both are
  approved (see the design history in `07-cubie-character.md` for why this
  matters).
- Generate with PixelLab. That's P3, and its key lives on the Pi.
- Touch `main`, the Pi, R2 or the Virtual Office repo.
