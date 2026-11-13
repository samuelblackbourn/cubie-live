# Cubie — the character sprite (approved reference, 2026-11-13)

The creator approved this turnaround on 2026-11-13 after seven design passes. It is
the reference every later Cubie sprite is drawn or generated against: the
placeholder clips in P2 and the PixelLab sheets in P3.

- Sprites: `art/reference/cubie/cubie_{S,W,E,N}.png` (32×48) and
  `art/reference/cubie/faces/*.png` (the seven faces, shown on the S sprite).
- Source: `art/src/cubie/turnaround.mjs`, model `O`. The script is the source of
  truth; never touch up a PNG.
- Live review board: the "Cubie — visual design system (draft)" design canvas,
  page 4. Pages 1–3 (foundations, palette, hero tile) are older drafts that have
  not been reviewed against this character yet.

## 1. What he is

A small humanoid robot with a big head. Original design: nothing from a film,
game or brand. The reference image the creator showed during the design pass
was used only for proportions and was not copied anywhere.

- **Head**: square, rounded corners. 24 wide. Seen from the side it is 16 wide
  (slim). White shell.
- **Face**: a black screen, 18×8 inside a 1-px dark bezel, in the lower part of the
  head. Teal eyes (4×5 with a glint) and a small teal mouth. The face carries
  the cuteness; the creator's "cute test" is the bar.
- **Antenna**: on *his* left, standing on top of the dome, pink bobble. Because of
  the antenna, E and W are different drawings, not mirrors.
- **Ear pods**: small dark rounded pods on each side of the head.
- **Body**: small, 10 wide. Chest LED strip (4 cells). On the back, a dark battery
  pack with a pink charge LED. Head vent on the back of the head.
- **Arms**: thin, 2 px, ball joints at the shoulders, dark mitten hands that
  reach the hip.
- **Legs**: thin, 3 px, ball hips, big dark rounded feet.

## 2. The view — the office characters' angle

The game is top-down, using the same angle as the Virtual Office characters. The
angle was measured from the office's `char_0` sheet and applied, not invented:

| | Office char_0 | Cubie (32×48) |
|---|---|---|
| Head | ~54% of figure | 23 rows of 44 |
| Top of head (hair / dome) | ~2/3 of the head; eyes sit low | 13-row dome over a 10-row face |
| Body | ~1/4, hands at the hip | 3 top + 8 front rows; mittens at the hip |
| Legs + feet | ~1/5 | legs 6, feet 3 (2 top + 1 front) |

- The dome is shaded as a rounded mass: a round highlight cluster top-left, darker
  toward the back-right, and a soft lip where it meets the face.
- The figure stays front-on below the head, like the office characters. The
  top-down read comes from the dome and the low face.
- Sprite stands on the bottom row (row 47), centred on columns 15|16. There is no
  ground shadow; the renderer adds it.

## 3. Colour (draft ramps until `art/palette.gpl` is approved)

Ramps run highlight → shadow.

- shell (metal): `#f7f9fb #e6eaf0 #c7ced9 #9aa3b1 #6b7382 #3f4552`, outline `#3f4552`
- joints, feet, hands, pods, bezel (dark): `#9aa3b1 #6b7382 #4d5361 #3f4552 #2e323c #1f2229`, outline `#1f2229`
- screen: `#1b4a50 #12343a #0b1f23 #071417`
- teal (eyes, mouth, strip): `#7df2ea #27d4c9 #1c9c94`
- pink (antenna, charge LED): `#ffb0dc #f05fb3 #c43a8a`

Emissive pixels are the eyes, mouth, chest strip, antenna bobble and charge LED.
They are drawn as `fx` in the script, so they are easy to split onto the
`_emissive` layer. The cubie-pixel-art skill wants the chest strip keyed as
`#ff00ff` in production sheets so the renderer can tint it. That is not done
yet.

## 4. Faces

`idle, happy, thinking, sad, surprised, blink, off`. Each is an overlay on the
18×8 screen, drawn from code in `FACES`. The animations note asks for six named
faces plus blink; check its list against these names when porting.

## 5. Design history (so nobody repeats it)

1. A cube body drawn head-on in PIL. Rejected: not humanoid, wrong view, and the
   skill was not used.
2. A humanoid in three proportions (A/B/C), elevation view. Rejected: failed the
   cute test.
3. Cute pass, after the reference image (D/E). D chosen face-on.
4. D with a 10-row lid "at 60°". Rejected: forehead too big, head too deep, limbs
   too short.
5. F: forehead trimmed, slim side, long limbs. Approved as the model.
6. A full camera projection of a re-proportioned model. Rejected: the creator
   wanted F's features kept, not a new model.
7. F with only the head split changed. Rejected as no visible change.
8. **O**: F redrawn at the office characters' angle, measured from char_0.
   **Approved.**

Lesson: the angle comes from the office characters, measured. Cubie's features
come from F. Don't re-proportion one to fix the other.

## 6. Still weak (known, not blocking)

- In the side views, the near arm covers most of the 8-px-deep body.
- In the back view, the vent sits a little low on the head.
- No walk, idle or action frames yet.
