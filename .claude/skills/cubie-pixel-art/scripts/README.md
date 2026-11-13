# cubie-pixel-art scripts

The drawing library and checks the `cubie-pixel-art` skill uses (skill §0, §7).
Node ≥ 20, no dependencies. Run from anywhere inside the checkout.

## Copied unchanged

From `.claude/skills/office-pixel-art/scripts/` in the office repository, `main`
at `e34db818dd2cea733e6e0063eaca89c93651aacc` (2026-11-13). Do not edit them here;
if they need to change, change them at the source and copy again.

| file | sha256 |
| --- | --- |
| `pix.mjs` | `5b10757b6711aac6e83318970d45a28572df6aaf48add96530fe4efb256c15e7` |
| `png.mjs` | `1bc9c5a46591dd77b55b4838cc002073a4e4cfffe9a93df30e0dcff746fe62d7` |
| `sheet.mjs` | `02d1ea22148dacbe310175fc42d1cb5317bfe7c685a202bf02e0ccce242ed261` |

## Written for the island

| script | does |
| --- | --- |
| `lib.mjs` | shared: repo root, palette (`art/palette.gpl`, else the draft ramps), manifest reader, placeholder meadow, placeholder night tint |
| `style-check.mjs` | colour budget per class: `ground vegetation node structure icon ui cubie` |
| `check-pack.mjs` | Cubie clip folders: sheet sizes, frames, feet, bob, face anchors, strip key, emissive layer, overlays, frame budgets |
| `check-asset.mjs` | one sprite against its manifest row: footprint, overhang, class height, background, baked shadow, ramps, emissive split |
| `manifest-check.mjs` | manifest schema, unique ids, every PNG has a row and every row a PNG, author "the creator" |
| `list-existing.mjs` | what the island already has (manifests, and pinned sets with `--sets`) |
| `compose-atlas.mjs` | Phaser atlas + `animations.json` from an art folder |
| `render-chunk.mjs` | a Tiled chunk (`.tmj`) to a PNG, with `--grid` and `--night` |
| `look.mjs` | look sheet on the meadow, day and night side by side (`sheet.mjs` stays the office's grey sheet) |
| `preview.mjs` | animated APNG of a clip on the meadow at 1× and 4×, composited like the renderer |
| `selftest.mjs` | builds fixtures and runs all of the above; also checks the turnaround still reproduces `art/reference/cubie/` byte for byte when both are in the checkout |

Thresholds marked "written target" (every `style-check` class except `cubie`, and
the night tint) are placeholders until the hero tile and `art/palette.gpl` are
approved in P3; `cubie` is calibrated from `art/reference/cubie/`.
