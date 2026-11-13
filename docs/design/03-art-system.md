# Cubie — art design system

The rules for making any new asset for Cubie's world so that it sits beside the ones
already there. Companion to [[Virtual-Office/Design-Cubie-Inner-Life]] (decision 20:
the detailed end of pixel art) and [[Virtual-Office/Design-Cubie-Assets]] (the
manifest). Written 2026-10-29 with Sam. **Status: v0.1, before the hero tile exists —
the hero tile approval is what turns this from intent into reference.**

The system has one job: a stranger (or a generator) can make a new tree, a new
building, a whole new biome, and it will look like it belongs. Everything below is in
service of that. When a rule and a prettier picture disagree, the rule wins, because
the prettier picture is the one that breaks the island.

## 1. Foundations

| Rule | Value | Why |
| --- | --- | --- |
| Grid | **32 px tile.** Everything snaps to the tile; sprites may overhang *upward* only. | Camera, collision, fog and the minimap all assume it. |
| View | **High top-down 3/4** — ground plane visible, object fronts visible, tops foreshortened. Roughly 60° from horizontal. | Classic 2D RPG angle; lets buildings have fronts and the camera fly. |
| Light | **From the top-left**, always. Highlights top-left faces, shadows bottom-right. No baked ground shadows. | The renderer adds the ground shadow and the day/night tint; a baked shadow would double up and fight the light layer. |
| Outline | **Soft dark outline**: not black — the darkest ramp step of the object's hue, 1 px, broken where a light edge meets the sky. Interior lines only where a silhouette would otherwise merge. | Reads at 1× zoom, stays painterly at 4×. |
| Shading | **Cluster shading**: shapes shaded in masses, 3–5 steps per material, no pillow shading, no single-pixel noise. Dither only for gradients on water and sky. | The detailed-but-clean look (Eastward, Sea of Stars). |
| Scale | Cubie is **32×48**. A one-tile bush comes to his chest; a three-tile tree (96 px) is twice his height; a door is 1 tile wide. Everything is measured against him. | One body, one yardstick. |
| Resolution | Draw at 1×. Never upscale a 16 px asset. Never draw at 64 px and shrink. | Mixed pixel densities are the fastest way to look like a patchwork. |

## 2. Colour

- **The palette is a family of ramps**, `art/palette.gpl`, ~80 colours: for each hue
  (grass, foliage, bark, stone, earth, sand, water, metal, crystal, warm light, cool
  shadow) a 5–7 step ramp from shadow to highlight. **New assets use existing ramps.**
  A new ramp is a design-system change: add it here with a reason, then to the file.
- **Shadows cool, highlights warm** on everything organic and most stone; **metal and
  crystal invert** (cool highlights) so they read as a different material at a glance.
- **Hue-shift, do not darken.** Shadow steps move toward blue-violet, highlight steps
  toward yellow. No ramp is a straight darkening of one hue.
- **No pure black (#000), no pure white (#fff).** Darkest allowed is the deep-shadow
  step; brightest is the warm-light step. Emissives are the exception (§5).
- **Biome temperature.** Each biome shifts the *mix* of ramps, not the ramps: meadow
  leans warm green and straw; light forest cool green and brown; hills grey-green with
  heather purple; beach pale sand with teal water; cave cool grey with teal and violet
  accents. A biome's ground tileset defines its temperature; its objects follow.
- **Saturation budget.** Ground is the least saturated thing on screen; vegetation
  middling; resources, blueprints, Cubie and anything interactive are the *most*
  saturated. If a decal is louder than Cubie, the decal is wrong.

## 3. Materials — the language

Every material has a fixed way of being drawn, so a new object made of it is
recognisable before anyone reads its name.

| Material | Ramp | Texture rule | Highlight | Example |
| --- | --- | --- | --- | --- |
| Foliage | foliage greens | leaf *clusters* (blobby masses with a few leaf-shaped notches on the lit side), never individual leaves | rim of warm light top-left | birch canopy, bush |
| Bark / wood | bark browns, pale for cut faces | vertical grain lines, 2–3 per trunk width; cut faces show rings | one lit edge | oak trunk, logs, workbench |
| Stone | stone greys, warmer strata line | faceted masses, 2–3 facets per boulder, lichen as a single dull-green cluster | hard-edged on the top facet | outcrop, cave wall |
| Earth / sand | earth / sand ramps | soft, low-contrast, almost flat; a few 2-px pebbles | none | dirt patch, dune |
| Metal (scrap) | metal greys + rust orange | flat planes with rivets, dents as a shadow notch, rust as a warm cluster at edges and low points | cool specular pixel | crates, wreck, pod |
| Ore | stone + the ore's accent ramp | stone rules, with 2–4 *streaks* of accent running one direction | glints: single highlight pixels on streaks | iron (rust), copper (verdigris + warm glint) |
| Crystal | crystal violet-blue | faceted, translucent: inner lighter core, outer darker rim | emissive core (§5) | clusters, shards |
| Water | water ramp | flat with 1-px light ripples, dithered edge to sand | animated glints | pond, sea, puddle |
| Glass / screens | cool glass ramp | flat with a diagonal reflection band | emissive when on | computer screen, lamp |
| Fabric / chute | any dull ramp | soft folds as 2-step shading | none | drop pod chute |

## 4. Silhouette and readability

- **Silhouette first.** Fill an asset black on the meadow tileset: it must be
  identifiable. If it isn't, the shape is wrong, not the shading.
- **Contrast against every ground.** Each asset is checked on all four starter
  tilesets at 1× zoom and at night tint. Vegetation on forest floor is the hard case:
  give it a lighter rim, not a darker outline.
- **Interactive things read as interactive.** Nodes and blueprints have a touch more
  saturation, a cleaner silhouette, and a *state change* when used (mined, stripped,
  picked over). Decoration never changes state. That is how a viewer learns what
  matters without a tooltip.
- **Cubie wins.** Nothing in a biome may use his signature colours (his body white and
  the face-screen teal) at his saturation. He must be findable on any tile at
  island zoom on the minimap and at 1× on the world.
- **Two sizes of detail.** Micro-detail (rivets, berries, lichen) is 1–2 px and sparse;
  macro-shapes carry the read. At 1× only the macro survives, and that must be enough.

## 5. Light and the emissive channel

The renderer has a light layer: day/night tint, warm pools around lights, glows.
Assets cooperate with it rather than painting light themselves.

- **Emissive mask.** Anything that glows (crystal cores, lamp bulbs, screens, LEDs,
  glow fungi, the stereo's meter, the pod's windows at night) is drawn with its
  glowing pixels on a separate `_emissive` layer in the same sprite sheet. The
  renderer draws that layer unaffected by night tint and blooms it. The base sprite
  shows the object *off*.
- **Light radius is data, not pixels.** A lamp post's warm pool is a number in the
  manifest (`light: {radius, colour}`); the sprite never paints the pool.
- **Night-tint safe.** Check every asset under the night tint: mid-tones must still
  separate. Assets that go to mud at night need a step more contrast in the base.
- **Underground**: same rules; the darkness overlay is the renderer's. Cave assets
  are drawn as if lit from top-left by a neutral light, like everything else.

## 6. States, variants and animation

- **Variants** are different *shapes* at the same role (3 birches). Make 2–3, never 1
  — a repeated sprite is the thing people notice first. Variants share the exact
  ramp set.
- **States** are the same object at different *stages* (bare/ripe, intact/mined,
  under construction/built, off/on). States keep the silhouette; they change the
  surface. Under-construction is always: footprint marked, frame + scaffold, a crate
  of parts. Mined/stripped is always: the accent gone, pick marks or bare frame.
- **Animation budget.** Ambient loops: 2 frames (sway, shimmer), 3 (drip, glow,
  flicker), 4 (water, foam). Character: idle 4, walk 8, actions 6, dance 8. Frame
  timing in the manifest, not in the sheet. Ease by holding frames, not by adding
  them.
- **Sway** is a 2-px lean at the top of the sprite, roots fixed. **Glow** is a change
  on the emissive layer only. **Water** cycles highlights, never the base colour.
- **Sheets**: horizontal strips, frames left to right, one row per direction (S, W,
  E, N) for characters; a `.json` beside each sheet with frame size, counts and
  timing. Power-of-two atlases are built by the pipeline, not by hand.

## 7. Size classes

| Class | Footprint | Height | Blocks | Examples |
| --- | --- | --- | --- | --- |
| Decal | 1×1 | ≤ 16 px, lies flat | no | litter, shells, scree, flowers |
| Vegetation S | 1×1 | ≤ 32 | no (walk-through, rustles) | grass, fern, bush |
| Vegetation L | 1×1 base | 96 (overhangs 2 tiles up) | yes | trees |
| Node | 1×1 or 2×2 | ≤ 48 / ≤ 80 | yes | outcrops, logs, scrap |
| Structure S | 1×1, 2×1 | ≤ 64 | yes | crate, bench, lamp |
| Structure L | 2×2 – 4×4 | ≤ 128 | yes | pod, wreck, dish |
| Item | — | 24 icon / 32 drop | — | resources |
| Overlay | — | matches Cubie | — | held tools, backpack |

Anything that overhangs must overhang **upward** and be drawn on the *overhead*
layer above its base tile so Cubie walks behind trunks and in front of canopies.

## 8. The generator recipe

Every PixelLab call carries, in this order:

1. **The preamble** (verbatim from the manifest §1).
2. **The style reference**: the approved hero tile for tilesets; the approved birch
   for vegetation; the approved pod for structures; Cubie himself for characters and
   overlays. *Never* a reference from outside the set.
3. **Material words from §3** ("stone: faceted masses, 2–3 facets, lichen as one dull
   cluster") rather than adjectives ("rocky").
4. **Size in px and class from §7.**
5. **Variants/states requested as separate calls** sharing the same reference, never
   "give me three versions" in one call.
6. **Negative list**: no baked shadow, no background, no text, no pure black/white, no
   outline thicker than 1 px, no gradients.

Then the pipeline: quantise to `palette.gpl` with a before/after check (reject if the
quantise moves more than ~5 % of pixels — the generator drifted off the ramps), split
emissives, trim, name, manifest row, review on all four grounds at 1× and under night
tint.

## 9. Reject criteria (any one is a regenerate, not a fix)

- Pixel density visibly different from the reference (chunkier or finer).
- Light from anywhere but top-left.
- A baked ground shadow or background.
- Colours off the ramps after quantise, or black/white present.
- Silhouette unreadable at 1× on the meadow.
- Louder than Cubie (saturation or contrast).
- Perspective drift — a front-on or pure top-down object in a 3/4 world.
- A material drawn against its §3 rule (individual leaves, straight-darkened shadows).

## 10. Adding a biome, a blueprint, a creature

- **A biome** needs: a ground Wang set + 6 plains in its temperature (§2), an
  ambience bed and music stems, 8–12 vegetation/decals, 3–5 nodes, 1 POI, and a row in
  `biomes.json`. It is approved as a *set* on one screen before any of it ships.
- **A blueprint** needs: under-construction and built states, an emissive layer if it
  lights, a `light` entry if it casts, a size class, and — if Cubie carries or wears
  it — an overlay set in 4 directions matched to his sheets.
- **A creature** (ambient, client-side): 24–32 px, 2–4 frame loop, one direction
  flipped, never interactive in v1, follows the saturation budget of vegetation.

## 11. UI and HUD, briefly

Same world, so the chrome agrees with it: pixel-edge window frames in the metal ramp
with a 1-px warm-light top edge and cool shadow bottom; a single pixel font (one for
body, one for the HUD numerals); icons at 24 px on the item ramps; mood words in the
body font, never numerals on the public shell; the minimap uses the biome ground
colours at their desaturated step. Windows have a drop shadow from the renderer, not
from the frame art. The About window is the one place long text lives, so it gets the
widest measure and the most line-height.

## 12. Change log

- v0.1 — 2026-10-29 — drafted before any art exists. First edit expected the day the
  hero tile is approved: replace "intended" with "as approved", and pin the exact
  ramp count.
- v0.1.1 — 2026-11-13 — scale fix (art-01): "a two-tile tree is twice his height" was
  wrong (64 px is ~1.33× his 48 px). Ruled: trees are **96 px**, three tiles tall —
  §1 scale line and the §7 Vegetation L row (96, overhangs 2 tiles up) changed to match.
