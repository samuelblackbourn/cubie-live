# deploy/

Everything needed to rebuild the Pi from this repo plus the secrets dir.

Filled in during P0 step 9 (units for ollama, the backup timer, `cubie-deploy.timer`
+ `pull.sh`, `install.sh`), P1 (sim + checkpoint/resume), P2 (admin), P4 (public
static mount, tunnel hostname). Layout on the Pi:

```
/opt/cubie-live/releases/<sha>/   checked-out releases
/opt/cubie-live/current -> releases/<sha>
/var/lib/cubie/                   the vault + state (never in git; backed up nightly)
/etc/cubie/*.env                  secrets, 0600, owner cubie
```

The Pi pulls `main` on a timer; a failed health check rolls back the symlink. See
`docs/design/00-master-plan.md` §5.
