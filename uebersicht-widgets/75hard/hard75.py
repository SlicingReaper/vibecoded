#!/usr/bin/env python3
"""75//HARD — standalone backend for 75hard.jsx. No Obsidian, no vault.

    python3 hard75.py state        # today's checklist + attempt status as JSON (what the widget reads)
    python3 hard75.py tick <0-6>   # toggle one of today's boxes
    python3 hard75.py start        # start a new attempt with today as Day 1 (old attempt goes to history)

75 Hard: every day for 75 days, all seven tasks. Miss one task on one day and the attempt is over —
you start again at Day 1. The backend works that out by itself: when a past day of the running
attempt is not fully ticked, the attempt is marked FAILED on that day.

Rules:
  · a day rolls over at 04:00 local time (ticking at 01:00 still counts for "yesterday")
  · you can only tick today; past days are locked
  · the seven tasks are editable: change "tasks" in the data file (icon + label, any number of them)

Data: ~/Library/Application Support/STUDYTERM/standalone/data/hard75.json  (override: HARD75_DATA)
Stdlib only, Python 3.8+.
"""
import datetime as dt, fcntl, json, os, sys, time

SA = os.environ.get("WIDGETS_HOME") or os.path.expanduser("~/Library/Application Support/STUDYTERM/standalone")
DATA = os.environ.get("HARD75_DATA") or os.path.join(SA, "data", "hard75.json")
ROLL_H = 4
TOTAL = 75
TASKS = [
    {"icon": "🏃", "label": "OUTDOOR WORKOUT 45"},
    {"icon": "🏋️", "label": "SECOND WORKOUT 45"},
    {"icon": "💧", "label": "3.8 L WATER"},
    {"icon": "📖", "label": "10 PAGES"},
    {"icon": "📸", "label": "PROGRESS PHOTO"},
    {"icon": "🥗", "label": "FOLLOW THE DIET"},
    {"icon": "🚫", "label": "NO ALCOHOL / CHEAT MEAL"},
]


def today():
    t = float(os.environ.get("HARD75_NOW") or time.time())
    return (dt.datetime.fromtimestamp(t) - dt.timedelta(hours=ROLL_H)).date()


def load():
    try:
        with open(DATA, encoding="utf-8") as f:
            d = json.load(f)
        if isinstance(d, dict):
            d.setdefault("tasks", TASKS); d.setdefault("ticks", {}); d.setdefault("history", [])
            d.setdefault("start", None); d.setdefault("attempt", 0)
            return d
    except (OSError, ValueError):
        pass
    return {"tasks": TASKS, "start": None, "attempt": 0, "ticks": {}, "history": []}


def save(d):
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    tmp = DATA + ".%d.tmp" % os.getpid()
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.flush(); os.fsync(f.fileno())
    os.replace(tmp, DATA)


def status(d):
    n = len(d["tasks"])
    out = {"tasks": d["tasks"], "total": TOTAL, "attempt": d["attempt"], "started": bool(d["start"]),
           "history": len(d["history"])}
    if not d["start"]:
        return dict(out, day=0, clean=0, marks=[False] * n, failed=False, finished=False)
    start, t = dt.date.fromisoformat(d["start"]), today()
    full = lambda day: len(set(d["ticks"].get(day.isoformat(), []))) >= n
    clean, failed_on, k = 0, None, start
    while k < t and clean < TOTAL:                       # every past day must be complete
        if not full(k):
            failed_on = k; break
        clean += 1; k += dt.timedelta(1)
    day = (t - start).days + 1
    finished = failed_on is None and clean >= TOTAL
    if failed_on is None and not finished and full(t):
        clean += 1                                       # today already done counts
    marks = [i in d["ticks"].get(t.isoformat(), []) for i in range(n)]
    return dict(out, day=min(day, TOTAL), clean=min(clean, TOTAL), marks=marks,
                failed=failed_on is not None,
                failed_day=((failed_on - start).days + 1) if failed_on else None,
                finished=finished or (clean >= TOTAL))


def main():
    cmd = (sys.argv[1:] or ["state"])[0]
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    with open(DATA + ".lock", "w") as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        d = load()
        msg, err = "", ""
        if cmd == "start":
            if d["start"]:
                s = status(d)
                d["history"].append({"attempt": d["attempt"], "start": d["start"], "clean": s["clean"],
                                     "result": "finished" if s["finished"] else "failed" if s["failed"] else "restarted"})
            d["attempt"] += 1; d["start"] = today().isoformat(); d["ticks"] = {}
            save(d); msg = f"ATTEMPT {d['attempt']} · DAY 1"
        elif cmd == "tick":
            s = status(d)
            try:
                i = int((sys.argv[2:] or ["-1"])[0])
            except ValueError:
                i = -1
            if not d["start"]:
                err = "TAP THE BOTTOM LINE TO START DAY 1"
            elif s["failed"] or s["finished"]:
                err = "ATTEMPT OVER — START A NEW ONE"
            elif not 0 <= i < len(d["tasks"]):
                err = "UNKNOWN BOX"
            else:
                k = today().isoformat(); cur = set(d["ticks"].get(k, []))
                cur ^= {i}; d["ticks"][k] = sorted(cur); save(d)
                msg = f"DAY {s['day']} · {'■' if i in cur else '□'} {d['tasks'][i]['label']}"
        elif cmd != "state":
            sys.exit(f"unknown command {cmd}")
        print(json.dumps(dict(status(d), msg=msg, error=err), ensure_ascii=False))


if __name__ == "__main__":
    main()
