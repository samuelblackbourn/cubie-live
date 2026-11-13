// Cubie turnaround (S, W, E, N) + seven faces — the approved reference.
// Drawn by model O in model.mjs (the same drawing build.mjs animates), at rest,
// with everything baked. Approved 2026-11-13; revision 2 the same evening
// (bigger face with a resting smile, lower dome, nub hands, white ears).
// The previous models (D, F, O-first-head …) live in this file's git history and
// in docs/design/07-cubie-character.md §5.
//   node art/src/cubie/turnaround.mjs <out-dir>
// then copy cubie_O_<d>.png → art/reference/cubie/cubie_<d>.png and
// face_<name>.png → art/reference/cubie/faces/<name>.png.
// Imports expect pix.mjs/png.mjs in .claude/skills/cubie-pixel-art/scripts/ (PR #3).
import fs from 'node:fs';
import { paint, sheet } from '../../../.claude/skills/cubie-pixel-art/scripts/pix.mjs';
import { writePng } from '../../../.claude/skills/cubie-pixel-art/scripts/png.mjs';
import { APPROVED_FACES, H, W, draw } from './model.mjs';

const out = process.argv[2] ?? './out';
fs.mkdirSync(out, { recursive: true });
const save = (name, rows) => { const img = sheet(W, H); paint(img, rows); writePng(`${out}/${name}.png`, img); };
for (const d of ['S', 'W', 'E', 'N']) save(`cubie_O_${d}`, draw(d, { mode: 'approved' }).rows);
for (const f of APPROVED_FACES) save(`face_${f}`, draw('S', { mode: 'approved', face: f }).rows);
console.log(`wrote 4 facings + ${APPROVED_FACES.length} faces to ${out}`);
