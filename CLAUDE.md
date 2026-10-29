# cubie-live — rules for every Claude Code session

cubie.live is a small robot character, Cubie, living alone on an island in a 2D
pixel-art survival world, with his mind running as a local language model on a
Raspberry Pi 5, watched by anyone at https://cubie.live. The design lives in
`docs/design/` (snapshots of the creator's vault, which is canonical) and the build
order in `docs/design/00-master-plan.md`. Session briefs are in `docs/sessions/`.

## Standing rules (never relax these without the creator saying so in the session)

1. **Separate project.** Nothing from the `cubie` robot repo, the Virtual Office or
   office-server's services is copied, imported, called or depended on. The robot
   is a later, optional phase (P8). The character's name is still Cubie.
2. **No API keys. Subscription only.** The brain is Ollama on the Pi. No Anthropic
   key, no hosted model, no metered token path — ever. PixelLab (P3) is the one paid
   plan, and its key lives on the Pi, never in the repo.
3. **LAN-only, low trust.** The Pi dials out; nothing dials in. The only public
   surface is the read-only snapshot served through a Cloudflare Tunnel (P4) and,
   later, a Cloudflare Worker the Pi *pulls* from (P5). The admin never gets a
   tunnel hostname. `cloudflared` for `ssh.zyla.studio` must always survive.
4. **Secrets in files.** `/etc/cubie/*.env`, mode 0600, owned by the `cubie` user.
   Never a secret in a shell word, a commit, a log line or a design note.
5. **No names in public text.** Everything a viewer can see — the site, the diary,
   About, Credits, the store, the stream, commit messages that quote public text —
   says "the creator" and never a person's name, company, town or desk. The
   automod enforces it in code; sessions enforce it in everything they write.
6. **The dumb-renderer rule.** The world is simulated on the Pi and broadcast; any
   page only draws it. The camera, windows and audio are browser state. The Pi
   never knows where anyone is looking.
7. **The world can scare him, never strand or kill him.** No mechanic may trap
   Cubie permanently, destroy his progress, or end him. No combat (decision 39)
   unless the creator reverses it in a session.
8. **Structure in code, meaning from the model.** Drives, power, range, XP, lists'
   completion, validity of actions — code. Names, lessons, diary lines, to-do
   wording, replies — the model, from a closed menu or a no-tools prompt.
9. **Visibility is enforced in code.** `conversation`-tagged lines never reach
   `public/`; reflections are written from `life` lines only; the snapshot writer
   is the only thing that writes to `public/`. Keep the never-leaks test green.
10. **Phases are sequential.** Do not start work from a later phase than the one
    the session brief names. Everything not on the starter island is deferred
    until P4 has been live for a few weeks (master plan §3).

## Working pattern

- **Step by step, confirm each step** before acting, and before anything is
  removed, reflashed or restarted on the Pi.
- **Feature branch + draft PR** for everything; only `main` deploys (the Pi pulls
  it on a timer — master plan §5). Never push to `main` directly.
- **Log decisions to the vault** at the end of a session (the brief says where),
  ten lines or fewer; mirror benchmark numbers into `docs/`.
- Tests on PRs via GitHub Actions; the Pi never runs Actions.
- Prefer `uv` for Python, `npm` for the site, systemd units in `deploy/`, plain
  Python for the sim (no game engine on the Pi), Phaser 3 for the renderer.

## Layout (grows by phase)

```
content/    rows: biomes, resources, tools, actors, blueprints, weather, substances
deploy/     systemd units, install.sh, pull.sh (the Pi pulls main)
docs/       design snapshots, session briefs, benchmark results
mind/       prompts, moods, the life loop's decide step, automod   (P1)
world/      sim: map, strata, power, goals, filtered menu, migrations (P1)
admin/      FastAPI app: WebSocket, windows API, login             (P2)
site/       Phaser renderer + shells (admin, public, director)      (P2–P4)
art/        palette, manifests, local library; big files via R2     (P3)
tools/      bench.py, publish-set.sh, dev scripts
```

## When in doubt

Read the decisions table in `docs/design/01-inner-life.md` §1 and the rulings in
`docs/design/00-master-plan.md` §0. If a question is not answered there, ask the
creator in the session; do not guess a rule.
