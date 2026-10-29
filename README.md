# cubie-live

Cubie is a small robot living alone on an island. Nobody steers him: a language
model running on a Raspberry Pi decides what he does every half-minute or so —
where to go, what to harvest, when to head home before his power runs out, what to
write in his diary. He names the animals he meets, teaches himself skills, makes a
list every morning and mostly fails to finish it. Anyone can watch his world at
https://cubie.live through a camera they fly themselves. Only the creator can give
him things, and even then he has to go and build them.

This repository is the whole thing: the simulation and the mind (Python, on the
Pi), the admin the creator logs into on the LAN, and the public site (Phaser, in
the browser). Design notes are in `docs/design/`; the build order is
`docs/design/00-master-plan.md`; rules for working on it are in `CLAUDE.md`.

**Status:** P0 — preparing the Pi. Nothing lives yet.
