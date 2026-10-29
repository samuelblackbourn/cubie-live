#!/usr/bin/env python3
"""P0 model gate benchmark for cubie-live.

Runs the five measurements from docs/sessions/P0.md §4.6 against a local Ollama:

  a. generation tokens/s on a ~60-token reply
  b. prompt-eval time to first token on a ~900-token prompt, cold
  c. prefix-cache check: same 700-token stable prefix, three different 200-token
     suffixes — does time-to-first-token drop on calls 2 and 3?
  d. structured pick: JSON-schema `format` with a 6-option action enum, 20 runs —
     valid-JSON rate, in-menu rate, median latency; prints the `thought`s
  e. resident RAM, CPU temperature and throttle flag during d (Pi only)

Usage:
    uv run tools/bench.py --models llama3.2:3b qwen2.5:3b gemma3:4b
    uv run tools/bench.py --models llama3.2:3b --runs 10 --out docs/p0-benchmark.md

Only stdlib is used so it runs on a fresh Pi with nothing installed but Python.
Ollama must be running on 127.0.0.1:11434 with the models already pulled.
"""

from __future__ import annotations

import argparse
import json
import statistics
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

OLLAMA = "http://127.0.0.1:11434"

# --- prompt material -------------------------------------------------------

# A placeholder character file + rules. ~700 tokens. Stable across calls so the
# prefix cache has something to hit. P1 replaces this with the real character.md.
STABLE_PREFIX = """You are Cubie, a small robot living alone on an island.
You are curious, a little anxious about your power level, fond of lists, and you
notice small things. You write plainly and briefly, in the first person. You never
mention anyone by name; the person who sometimes leaves you designs is "the
creator". You have a body on the island with a battery, a habitat pod with a bed
that recharges you and a converter that turns things you gather into power, and a
few basic tools.

Rules for deciding what to do:
- You may only pick an action from the menu you are given. Never invent one.
- Your power is the thing that matters most. If a trip looks tight, prefer going
  home, resting, or something near the pod.
- You get bored doing the same thing. You get curious about new places and
  objects. You get lonely when nothing has happened for a while.
- A short thought is allowed with each action: one or two sentences, in your own
  voice, about why. It is never spoken aloud.
- Reply only with the JSON object you are asked for.

Things you know about the island so far:
- The pod is in a meadow. There is a pond to the east and a fallen capsule to the
  north-west that has scrap on it.
- The light forest begins about forty steps to the south. Birches, a few oaks,
  ferns, berry bushes.
- Hills to the west; stone outcrops; something that might be ore.
- The beach is far. You have not been.
- Night is cold and your power drains faster. You do not like being out after dark.

Skills in play: harvesting 1, exploring 1, power 1, survival 1.
Recent lessons: "Berries help a little but they are not a meal." "The forest
edge is further than it looks when I am tired."
"""

VARIABLE_SUFFIXES = [
    """Now:
Time: late morning, day 3. Weather: clear. Power: 54 of 100. Pod store: 31.
Where: meadow, 12 steps east of the pod. Carrying: 3 scrap, 2 biomass.
Nearby: berry bush (ripe, 2 steps), pond (4 steps), scrap pile (picked over).
Project: workbench — needs 4 softwood, 2 stone. Nearest known softwood: forest edge,
38 steps south; round trip costs about 31 power.
Diary today: "Picked over the last of the scrap near the capsule."
Open wishes: none.
Menu: go(forest_edge), go(pod), harvest(berry_bush), convert(biomass), rest, wait.
""",
    """Now:
Time: dusk, day 3. Weather: overcast. Power: 22 of 100. Pod store: 31.
Where: forest edge, 40 steps south of the pod. Carrying: 2 softwood, 1 biomass.
Nearby: birch (3 hits), fern, fallen log.
Project: workbench — needs 2 more softwood, 2 stone. Pod is 40 steps; the walk
home costs about 18 power and it is getting dark.
Diary today: "Made it to the trees. Birches, like I thought."
Open wishes: none.
Menu: harvest(birch), go(pod), rest, write_diary, wait, say.
""",
    """Now:
Time: morning, day 4. Weather: light rain. Power: 88 of 100. Pod store: 19.
Where: pod. Carrying: nothing (stored 4 softwood, 3 scrap, 3 biomass).
Nearby: converter, bed, storage, the empty workbench slot.
Project: workbench — needs 2 stone. Nearest known stone: hills, 55 steps west;
round trip costs about 44 power. Rain makes walking cost more.
Diary today: nothing yet.
Open wishes: none.
Menu: go(hills), convert(biomass), build(workbench), write_diary, wish, wait.
""",
]

ACTIONS = ["go", "harvest", "convert", "rest", "write_diary", "wait"]

PICK_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {"type": "string", "enum": ACTIONS},
        "target": {"type": "string"},
        "thought": {"type": "string"},
    },
    "required": ["action", "target", "thought"],
}

GEN_PROMPT = (
    "Write a short diary entry, about 60 words, in Cubie's voice, about the first "
    "time he reached the edge of the forest and saw the birches."
)


# --- helpers ---------------------------------------------------------------

def ollama(path: str, body: dict, timeout: float = 600) -> dict:
    req = urllib.request.Request(
        OLLAMA + path,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def generate(model: str, prompt: str, *, fmt: dict | None = None, num_predict: int = 120) -> dict:
    body = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "keep_alive": -1,
        "options": {"num_predict": num_predict, "temperature": 0.7},
    }
    if fmt:
        body["format"] = fmt
    t0 = time.perf_counter()
    out = ollama("/api/generate", body)
    out["_wall"] = time.perf_counter() - t0
    return out


def ns(x: int | None) -> float:
    return (x or 0) / 1e9


def pi_stats() -> dict:
    stats: dict = {}
    try:
        stats["temp_c"] = subprocess.run(
            ["vcgencmd", "measure_temp"], capture_output=True, text=True, timeout=5
        ).stdout.strip()
        stats["throttled"] = subprocess.run(
            ["vcgencmd", "get_throttled"], capture_output=True, text=True, timeout=5
        ).stdout.strip()
    except (FileNotFoundError, subprocess.SubprocessError):
        stats["temp_c"] = "n/a (not a Pi)"
        stats["throttled"] = "n/a"
    try:
        mem = Path("/proc/meminfo").read_text().splitlines()
        avail = next(int(l.split()[1]) for l in mem if l.startswith("MemAvailable"))
        total = next(int(l.split()[1]) for l in mem if l.startswith("MemTotal"))
        stats["ram_used_mb"] = (total - avail) // 1024
        stats["ram_total_mb"] = total // 1024
    except (OSError, StopIteration):
        pass
    return stats


def warm(model: str) -> None:
    generate(model, "hi", num_predict=1)


# --- the five measurements -------------------------------------------------

def bench_a_generation(model: str) -> dict:
    out = generate(model, GEN_PROMPT, num_predict=90)
    toks = out.get("eval_count", 0)
    secs = ns(out.get("eval_duration"))
    return {"tokens": toks, "tok_per_s": round(toks / secs, 1) if secs else None, "sample": out.get("response", "").strip()}


def bench_b_prompt_eval(model: str) -> dict:
    # Cold: a prefix we have not used yet, ~900 tokens.
    prompt = STABLE_PREFIX.replace("Cubie", "Cubie-cold") + VARIABLE_SUFFIXES[0] + "\nReply with one word."
    out = generate(model, prompt, num_predict=1)
    return {
        "prompt_tokens": out.get("prompt_eval_count"),
        "prompt_eval_s": round(ns(out.get("prompt_eval_duration")), 2),
        "ttft_s": round(ns(out.get("prompt_eval_duration")) + ns(out.get("load_duration")), 2),
    }


def bench_c_prefix_cache(model: str) -> dict:
    rows = []
    for i, suffix in enumerate(VARIABLE_SUFFIXES):
        out = generate(model, STABLE_PREFIX + suffix + "\nReply with one word.", num_predict=1)
        rows.append({
            "call": i + 1,
            "prompt_tokens_evaluated": out.get("prompt_eval_count"),
            "prompt_eval_s": round(ns(out.get("prompt_eval_duration")), 2),
        })
    first, rest = rows[0]["prompt_eval_s"], [r["prompt_eval_s"] for r in rows[1:]]
    cached = all(r < first * 0.6 for r in rest) if first else False
    return {"calls": rows, "prefix_cache_holds": cached}


def bench_d_structured(model: str, runs: int) -> dict:
    lat, valid, in_menu, thoughts = [], 0, 0, []
    for i in range(runs):
        suffix = VARIABLE_SUFFIXES[i % len(VARIABLE_SUFFIXES)]
        prompt = STABLE_PREFIX + suffix + "\nPick one action from the menu. Reply as JSON with action, target, thought."
        out = generate(model, prompt, fmt=PICK_SCHEMA, num_predict=120)
        lat.append(out["_wall"])
        try:
            obj = json.loads(out.get("response", ""))
            valid += 1
            menu_actions = [m.split("(")[0] for m in suffix.split("Menu:")[1].strip().rstrip(".").split(", ")]
            if obj.get("action") in menu_actions:
                in_menu += 1
            thoughts.append(f"{obj.get('action')}({obj.get('target')}) — {obj.get('thought')}")
        except (json.JSONDecodeError, TypeError, IndexError):
            thoughts.append(f"INVALID: {out.get('response', '')[:120]!r}")
    return {
        "runs": runs,
        "valid_json_pct": round(100 * valid / runs, 1),
        "in_menu_pct": round(100 * in_menu / runs, 1),
        "median_s": round(statistics.median(lat), 2),
        "p90_s": round(sorted(lat)[int(0.9 * (runs - 1))], 2),
        "thoughts": thoughts,
    }


# --- report ----------------------------------------------------------------

def gate(d: dict, b: dict, c: dict, e: dict) -> tuple[bool, list[str]]:
    reasons = []
    if d["valid_json_pct"] < 95 or d["in_menu_pct"] < 95:
        reasons.append(f"d: {d['valid_json_pct']}% valid / {d['in_menu_pct']}% in-menu (need ≥95)")
    if d["median_s"] > 5:
        reasons.append(f"d: median {d['median_s']}s (need ≤5)")
    if (b["ttft_s"] or 99) > 10:
        reasons.append(f"b: cold TTFT {b['ttft_s']}s (need ≤10)")
    if "0x0" not in str(e.get("throttled", "")) and "n/a" not in str(e.get("throttled", "")):
        reasons.append(f"e: throttled {e['throttled']}")
    if not c["prefix_cache_holds"]:
        reasons.append("c: prefix cache did not hold (not a fail, but shrink the prompt)")
    hard = [r for r in reasons if not r.startswith("c:")]
    return (not hard), reasons


def render(results: list[dict]) -> str:
    lines = ["# P0 benchmark", "", f"Run: {time.strftime('%Y-%m-%d %H:%M')}", ""]
    lines += ["| model | a tok/s | b cold TTFT s | c cache holds | d valid % | d in-menu % | d median s | d p90 s | e RAM MB | e temp | gate |",
              "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for r in results:
        a, b, c, d, e = r["a"], r["b"], r["c"], r["d"], r["e"]
        lines.append(
            f"| {r['model']} | {a['tok_per_s']} | {b['ttft_s']} | {c['prefix_cache_holds']} | "
            f"{d['valid_json_pct']} | {d['in_menu_pct']} | {d['median_s']} | {d['p90_s']} | "
            f"{e.get('ram_used_mb')} | {e.get('temp_c')} | {'PASS' if r['pass'] else 'FAIL'} |"
        )
    for r in results:
        lines += ["", f"## {r['model']}", ""]
        if r["reasons"]:
            lines += ["Gate notes:"] + [f"- {x}" for x in r["reasons"]] + [""]
        lines += ["Prefix-cache calls:"] + [f"- call {x['call']}: {x['prompt_tokens_evaluated']} tokens evaluated in {x['prompt_eval_s']}s" for x in r["c"]["calls"]]
        lines += ["", "Diary sample (a):", "", "> " + r["a"]["sample"].replace("\n", "\n> "), ""]
        lines += ["Thoughts (d) — the creator reads these and picks:", ""] + [f"{i+1}. {t}" for i, t in enumerate(r["d"]["thoughts"])]
    lines += ["", "## Decision", "", "- model: _(fill in)_", "- tick length: _(45 s unless d says otherwise)_",
              "- prompt budget (stable/variable tokens): _(fill in)_", "- prefix cache: _(holds / does not hold)_", ""]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--models", nargs="+", required=True)
    ap.add_argument("--runs", type=int, default=20, help="structured-pick runs per model (d)")
    ap.add_argument("--out", type=Path, default=Path("docs/p0-benchmark.md"))
    args = ap.parse_args()

    results = []
    for model in args.models:
        print(f"== {model}", file=sys.stderr)
        warm(model)
        a = bench_a_generation(model); print(f"  a: {a['tok_per_s']} tok/s", file=sys.stderr)
        b = bench_b_prompt_eval(model); print(f"  b: cold TTFT {b['ttft_s']}s", file=sys.stderr)
        c = bench_c_prefix_cache(model); print(f"  c: cache holds = {c['prefix_cache_holds']}", file=sys.stderr)
        d = bench_d_structured(model, args.runs); print(f"  d: {d['valid_json_pct']}% valid, {d['in_menu_pct']}% in-menu, median {d['median_s']}s", file=sys.stderr)
        e = pi_stats(); print(f"  e: {e}", file=sys.stderr)
        ok, reasons = gate(d, b, c, e)
        results.append({"model": model, "a": a, "b": b, "c": c, "d": d, "e": e, "pass": ok, "reasons": reasons})

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(render(results))
    print(f"wrote {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
